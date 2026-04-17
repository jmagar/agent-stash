use crate::StashPath;
use serde::{Deserialize, Serialize};

#[derive(Debug, thiserror::Error, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(tag = "code", rename_all = "PascalCase")]
pub enum StashError {
    #[error("not found: {path}")]
    NotFound { path: StashPath },

    #[error("invalid path {path}: {reason}")]
    InvalidPath { path: String, reason: String },

    #[error("invalid input for `{field}`: {reason}")]
    InvalidInput { field: String, reason: String },

    #[error("unauthorized")]
    Unauthorized,

    #[error("forbidden: {reason}")]
    Forbidden { reason: String },

    #[error("conflict on {path}")]
    Conflict { path: StashPath },

    #[error("payload too large (limit {limit} bytes)")]
    TooLarge { limit: u64 },

    #[error("rate limited (retry after {retry_after_ms}ms)")]
    RateLimited { retry_after_ms: u64 },

    #[error("internal error (trace {trace_id})")]
    Internal { trace_id: String },
}

pub type StashResult<T> = Result<T, StashError>;

impl From<crate::InvalidPathReason> for StashError {
    fn from(r: crate::InvalidPathReason) -> Self {
        StashError::InvalidPath { path: String::new(), reason: r.to_string() }
    }
}

impl From<crate::InvalidSha> for StashError {
    fn from(r: crate::InvalidSha) -> Self {
        StashError::InvalidInput { field: "sha".into(), reason: r.to_string() }
    }
}

impl From<crate::InvalidIdentity> for StashError {
    fn from(r: crate::InvalidIdentity) -> Self {
        StashError::InvalidInput { field: "identity".into(), reason: r.to_string() }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::StashPath;

    #[test]
    fn serializes_with_code_tag() {
        let err = StashError::NotFound { path: StashPath::parse("docs/x.md").unwrap() };
        let json = serde_json::to_value(&err).unwrap();
        assert_eq!(json["code"], "NotFound");
        assert_eq!(json["path"], "docs/x.md");
    }

    #[test]
    fn round_trips_every_variant() {
        let variants = vec![
            StashError::NotFound { path: StashPath::parse("a").unwrap() },
            StashError::InvalidPath { path: "../x".into(), reason: "dotdot".into() },
            StashError::InvalidInput { field: "glob".into(), reason: "bad".into() },
            StashError::Unauthorized,
            StashError::Forbidden { reason: "nope".into() },
            StashError::Conflict { path: StashPath::parse("a").unwrap() },
            StashError::TooLarge { limit: 10_485_760 },
            StashError::RateLimited { retry_after_ms: 1000 },
            StashError::Internal { trace_id: "abc123".into() },
        ];
        for v in variants {
            let s = serde_json::to_string(&v).unwrap();
            let back: StashError = serde_json::from_str(&s).unwrap();
            assert_eq!(v, back);
        }
    }
}
