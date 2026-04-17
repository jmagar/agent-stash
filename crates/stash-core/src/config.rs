use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct StashConfig {
    #[serde(default = "default_max_body")]
    pub max_body: u64,
    #[serde(default)]
    pub blob: BlobConfig,
}

fn default_max_body() -> u64 {
    10 * 1024 * 1024
}

impl Default for StashConfig {
    fn default() -> Self {
        Self {
            max_body: default_max_body(),
            blob: BlobConfig::default(),
        }
    }
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct BlobConfig {
    #[serde(default = "default_max_git_bytes")]
    pub max_git_bytes: u64,
    #[serde(default = "default_blob_mime_prefixes")]
    pub blob_mime_prefixes: Vec<String>,
    #[serde(default = "default_blob_path_globs")]
    pub blob_path_globs: Vec<String>,
    #[serde(default)]
    pub force_git_globs: Vec<String>,
    #[serde(default = "default_gc_interval_secs")]
    pub gc_interval_secs: u64,
    #[serde(default = "default_gc_grace_days")]
    pub gc_grace_days: u64,
}

fn default_max_git_bytes() -> u64 {
    1024 * 1024
}
fn default_blob_mime_prefixes() -> Vec<String> {
    vec![
        "image/".into(),
        "video/".into(),
        "audio/".into(),
        "application/pdf".into(),
        "application/zip".into(),
        "application/x-tar".into(),
        "application/gzip".into(),
        "application/octet-stream".into(),
    ]
}
fn default_blob_path_globs() -> Vec<String> {
    vec![
        "*.zip".into(),
        "*.tar.gz".into(),
        "*.tgz".into(),
        "*.gz".into(),
        "*.pdf".into(),
        "*.bin".into(),
    ]
}
fn default_gc_interval_secs() -> u64 {
    86400
}
fn default_gc_grace_days() -> u64 {
    7
}

impl Default for BlobConfig {
    fn default() -> Self {
        Self {
            max_git_bytes: default_max_git_bytes(),
            blob_mime_prefixes: default_blob_mime_prefixes(),
            blob_path_globs: default_blob_path_globs(),
            force_git_globs: vec![],
            gc_interval_secs: default_gc_interval_secs(),
            gc_grace_days: default_gc_grace_days(),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn default_max_body_is_10mb() {
        assert_eq!(StashConfig::default().max_body, 10 * 1024 * 1024);
    }

    #[test]
    fn default_max_git_bytes_is_1mb() {
        assert_eq!(StashConfig::default().blob.max_git_bytes, 1024 * 1024);
    }

    #[test]
    fn default_blob_mime_prefixes_include_image() {
        let cfg = StashConfig::default();
        assert!(cfg.blob.blob_mime_prefixes.iter().any(|p| p == "image/"));
    }

    #[test]
    fn round_trips_via_serde_json() {
        let cfg = StashConfig::default();
        let json = serde_json::to_string(&cfg).unwrap();
        let back: StashConfig = serde_json::from_str(&json).unwrap();
        assert_eq!(cfg, back);
    }

    #[test]
    fn gc_defaults_are_sane() {
        let blob = BlobConfig::default();
        assert_eq!(blob.gc_interval_secs, 86400);
        assert_eq!(blob.gc_grace_days, 7);
    }
}
