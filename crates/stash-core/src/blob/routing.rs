use crate::config::BlobConfig;
use stash_types::StorageTier;

pub struct TierRouter {
    config: BlobConfig,
}

impl TierRouter {
    pub fn new(config: BlobConfig) -> Self {
        Self { config }
    }

    pub fn decide(&self, path: &str, size: u64, mime: &str) -> StorageTier {
        for pat in &self.config.force_git_globs {
            if glob::Pattern::new(pat).is_ok_and(|p| p.matches(path)) {
                return StorageTier::Git;
            }
        }
        for pat in &self.config.blob_path_globs {
            if glob::Pattern::new(pat).is_ok_and(|p| p.matches(path)) {
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
        TierRouter::new(BlobConfig::default())
    }

    #[test]
    fn small_text_routes_to_git() {
        let r = router();
        assert_eq!(r.decide("docs/plan.md", 500, "text/markdown"), StorageTier::Git);
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
    fn force_git_glob_overrides_mime() {
        let mut cfg = BlobConfig::default();
        cfg.force_git_globs = vec!["*.png".into()];
        let r = TierRouter::new(cfg);
        assert_eq!(r.decide("icon.png", 100, "image/png"), StorageTier::Git);
    }

    #[test]
    fn force_git_glob_overrides_size() {
        let mut cfg = BlobConfig::default();
        cfg.force_git_globs = vec!["*.bin".into()];
        let r = TierRouter::new(cfg);
        assert_eq!(
            r.decide("data.bin", 5 * 1024 * 1024, "application/octet-stream"),
            StorageTier::Git
        );
    }
}
