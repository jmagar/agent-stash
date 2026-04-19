use crate::config::BlobConfig;
use stash_types::{StashError, StashResult, StorageTier};

#[derive(Debug)]
pub struct TierRouter {
    config: BlobConfig,
    /// Pre-compiled patterns for `force_git_globs` — evaluated first, override
    /// all other rules and always route to git.
    force_git_patterns: Vec<glob::Pattern>,
    /// Pre-compiled patterns for `blob_path_globs` — evaluated after
    /// `force_git_patterns` and route to the blob tier on match.
    blob_path_patterns: Vec<glob::Pattern>,
}

impl TierRouter {
    /// Build a `TierRouter` from the given config, compiling all glob patterns
    /// eagerly. Returns an error if any pattern string is invalid so that
    /// misconfiguration is caught at startup rather than silently ignored.
    pub fn new(config: BlobConfig) -> StashResult<Self> {
        let force_git_patterns = config
            .force_git_globs
            .iter()
            .map(|p| {
                glob::Pattern::new(p).map_err(|e| StashError::InvalidInput {
                    field: "force_git_globs".into(),
                    reason: format!("invalid glob pattern {p:?}: {e}"),
                })
            })
            .collect::<StashResult<Vec<_>>>()?;

        let blob_path_patterns = config
            .blob_path_globs
            .iter()
            .map(|p| {
                glob::Pattern::new(p).map_err(|e| StashError::InvalidInput {
                    field: "blob_path_globs".into(),
                    reason: format!("invalid glob pattern {p:?}: {e}"),
                })
            })
            .collect::<StashResult<Vec<_>>>()?;

        Ok(Self {
            config,
            force_git_patterns,
            blob_path_patterns,
        })
    }

    pub fn decide(&self, path: &str, size: u64, mime: &str) -> StorageTier {
        for pat in &self.force_git_patterns {
            if pat.matches(path) {
                return StorageTier::Git;
            }
        }
        for pat in &self.blob_path_patterns {
            if pat.matches(path) {
                return StorageTier::Blob;
            }
        }
        for prefix in &self.config.blob_mime_prefixes {
            if mime.starts_with(prefix.as_str()) {
                return StorageTier::Blob;
            }
        }
        if size > self.config.max_git_bytes {
            return StorageTier::Blob;
        }
        StorageTier::Git
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::config::BlobConfig;
    use stash_types::StorageTier;

    fn router() -> TierRouter {
        TierRouter::new(BlobConfig::default()).unwrap()
    }

    #[test]
    fn small_text_routes_to_git() {
        let r = router();
        assert_eq!(
            r.decide("docs/plan.md", 500, "text/markdown"),
            StorageTier::Git
        );
    }

    #[test]
    fn large_file_routes_to_blob() {
        let r = router();
        assert_eq!(
            r.decide("logs/big.log", 2 * 1024 * 1024, "text/plain"),
            StorageTier::Blob
        );
    }

    #[test]
    fn image_mime_routes_to_blob() {
        let r = router();
        assert_eq!(r.decide("photo.jpg", 100, "image/jpeg"), StorageTier::Blob);
    }

    #[test]
    fn video_mime_routes_to_blob() {
        let r = router();
        assert_eq!(r.decide("clip.mp4", 1000, "video/mp4"), StorageTier::Blob);
    }

    #[test]
    fn zip_glob_routes_to_blob() {
        let r = router();
        assert_eq!(
            r.decide("archive.zip", 100, "application/octet-stream"),
            StorageTier::Blob
        );
    }

    #[test]
    #[allow(clippy::field_reassign_with_default)]
    fn force_git_glob_overrides_mime() {
        let mut cfg = BlobConfig::default();
        cfg.force_git_globs = vec!["*.png".into()];
        let r = TierRouter::new(cfg).unwrap();
        assert_eq!(r.decide("icon.png", 100, "image/png"), StorageTier::Git);
    }

    #[test]
    #[allow(clippy::field_reassign_with_default)]
    fn force_git_glob_overrides_size() {
        let mut cfg = BlobConfig::default();
        cfg.force_git_globs = vec!["*.bin".into()];
        let r = TierRouter::new(cfg).unwrap();
        assert_eq!(
            r.decide("data.bin", 5 * 1024 * 1024, "application/octet-stream"),
            StorageTier::Git
        );
    }

    #[test]
    fn invalid_force_git_glob_returns_error() {
        let mut cfg = BlobConfig::default();
        cfg.force_git_globs = vec!["[invalid".into()];
        assert!(TierRouter::new(cfg).is_err());
    }

    #[test]
    fn invalid_blob_path_glob_returns_error() {
        let mut cfg = BlobConfig::default();
        cfg.blob_path_globs = vec!["[invalid".into()];
        assert!(TierRouter::new(cfg).is_err());
    }
}
