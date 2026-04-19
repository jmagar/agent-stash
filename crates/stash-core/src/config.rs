use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct StashConfig {
    #[serde(default = "default_max_body")]
    pub max_body: u64,
    #[serde(default)]
    pub blob: BlobConfig,
    #[serde(default)]
    pub auth: AuthConfig,
    #[serde(default)]
    pub audit: AuditConfig,
}

fn default_max_body() -> u64 {
    10 * 1024 * 1024
}

impl Default for StashConfig {
    fn default() -> Self {
        Self {
            max_body: default_max_body(),
            blob: BlobConfig::default(),
            auth: AuthConfig::default(),
            audit: AuditConfig::default(),
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

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct AuthConfig {
    /// How long the bootstrap admin token is valid, in seconds.
    #[serde(default = "default_admin_token_ttl_secs")]
    pub admin_token_ttl_secs: u64,
    /// Per-token write-rate limit used by P04 middleware.
    #[serde(default = "default_write_per_minute")]
    pub write_per_minute: u32,
    /// Argon2id memory cost in KiB. 19 MiB default matches OWASP 2024 guidance.
    #[serde(default = "default_argon2_m_cost_kib")]
    pub argon2_m_cost_kib: u32,
    /// Argon2id time cost (iterations). OWASP: 2.
    #[serde(default = "default_argon2_t_cost")]
    pub argon2_t_cost: u32,
    /// Argon2id lanes. 1 is safe & deterministic in server contexts.
    #[serde(default = "default_argon2_p_cost")]
    pub argon2_p_cost: u32,
}

fn default_admin_token_ttl_secs() -> u64 {
    3_600
}
fn default_write_per_minute() -> u32 {
    120
}
fn default_argon2_m_cost_kib() -> u32 {
    19 * 1024
}
fn default_argon2_t_cost() -> u32 {
    2
}
fn default_argon2_p_cost() -> u32 {
    1
}

impl Default for AuthConfig {
    fn default() -> Self {
        Self {
            admin_token_ttl_secs: default_admin_token_ttl_secs(),
            write_per_minute: default_write_per_minute(),
            argon2_m_cost_kib: default_argon2_m_cost_kib(),
            argon2_t_cost: default_argon2_t_cost(),
            argon2_p_cost: default_argon2_p_cost(),
        }
    }
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct AuditConfig {
    /// Probability in [0,1] that a READ op is recorded. Writes and token
    /// ops are always recorded regardless of this value.
    #[serde(default = "default_read_sample_rate", deserialize_with = "de_rate")]
    pub read_sample_rate: f64,
}

fn default_read_sample_rate() -> f64 {
    0.01
}

fn de_rate<'de, D: serde::Deserializer<'de>>(d: D) -> Result<f64, D::Error> {
    use serde::de::Error;
    let v = f64::deserialize(d)?;
    if !(0.0..=1.0).contains(&v) || v.is_nan() {
        return Err(D::Error::custom("read_sample_rate must be in [0, 1]"));
    }
    Ok(v)
}

impl Default for AuditConfig {
    fn default() -> Self {
        Self {
            read_sample_rate: default_read_sample_rate(),
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

    #[test]
    fn default_admin_token_ttl_is_one_hour() {
        assert_eq!(StashConfig::default().auth.admin_token_ttl_secs, 3600);
    }

    #[test]
    fn default_write_rate_is_120_per_minute() {
        assert_eq!(StashConfig::default().auth.write_per_minute, 120);
    }

    #[test]
    fn default_read_sample_rate_is_one_percent() {
        assert!((StashConfig::default().audit.read_sample_rate - 0.01).abs() < 1e-9);
    }

    #[test]
    fn read_sample_rate_out_of_range_rejected_on_deserialize() {
        let too_big = r#"{"auth":{},"blob":{},"audit":{"read_sample_rate":1.5},"max_body":1}"#;
        let err = serde_json::from_str::<StashConfig>(too_big).unwrap_err();
        assert!(err.to_string().contains("read_sample_rate"));
    }
}
