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
