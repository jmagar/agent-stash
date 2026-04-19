use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use serde::de;
use std::fmt;

#[derive(Debug, thiserror::Error, PartialEq, Eq)]
pub enum InvalidTokenId {
    #[error("token id must start with 'tk_'")]
    MissingPrefix,
    #[error("token id body must be exactly 16 lowercase hex chars")]
    BadBody,
}

/// Public, non-secret token identifier. Shape: `tk_` + 16 lowercase hex chars.
/// Example: `tk_0123456789abcdef`. Safe to log.
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize)]
#[serde(transparent)]
pub struct TokenId(String);

impl TokenId {
    pub fn parse(s: impl AsRef<str>) -> Result<Self, InvalidTokenId> {
        let s = s.as_ref();
        let body = s.strip_prefix("tk_").ok_or(InvalidTokenId::MissingPrefix)?;
        if body.len() != 16
            || !body
                .chars()
                .all(|c| c.is_ascii_hexdigit() && !c.is_ascii_uppercase())
        {
            return Err(InvalidTokenId::BadBody);
        }
        Ok(Self(s.to_string()))
    }

    pub fn as_str(&self) -> &str {
        &self.0
    }
}

impl fmt::Display for TokenId {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.write_str(&self.0)
    }
}

impl<'de> Deserialize<'de> for TokenId {
    fn deserialize<D: de::Deserializer<'de>>(deserializer: D) -> Result<Self, D::Error> {
        let s = String::deserialize(deserializer)?;
        TokenId::parse(&s).map_err(de::Error::custom)
    }
}

/// Coarse-grained permission tier for v0.1. Real scopes arrive in v0.2.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum Permission {
    /// Full read/write on the stash (normal agent tokens).
    Full,
    /// One-time admin token: may mint other tokens, nothing else.
    MintOnly,
}

/// Public, non-secret metadata row — safe to return from `list`.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct TokenRecord {
    pub id: TokenId,
    pub agent: String,
    pub device: String,
    pub permission: Permission,
    pub created_at: DateTime<Utc>,
    pub expires_at: Option<DateTime<Utc>>,
    pub last_used: Option<DateTime<Utc>>,
    pub revoked_at: Option<DateTime<Utc>>,
}

impl From<InvalidTokenId> for crate::StashError {
    fn from(r: InvalidTokenId) -> Self {
        crate::StashError::InvalidInput {
            field: "token_id".into(),
            reason: r.to_string(),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn token_id_parses_valid_prefix() {
        let id = TokenId::parse("tk_0123456789abcdef").unwrap();
        assert_eq!(id.as_str(), "tk_0123456789abcdef");
    }

    #[test]
    fn token_id_rejects_missing_prefix() {
        assert!(TokenId::parse("0123456789abcdef").is_err());
    }

    #[test]
    fn token_id_rejects_bad_chars() {
        assert!(TokenId::parse("tk_ZZZZZZZZZZZZZZZZ").is_err());
    }

    #[test]
    fn token_id_rejects_wrong_length() {
        assert!(TokenId::parse("tk_abc").is_err());
    }

    #[test]
    fn permission_serializes_snake_case() {
        let v = serde_json::to_value(Permission::MintOnly).unwrap();
        assert_eq!(v, serde_json::json!("mint_only"));
        let v = serde_json::to_value(Permission::Full).unwrap();
        assert_eq!(v, serde_json::json!("full"));
    }

    #[test]
    fn permission_round_trips() {
        for p in [Permission::Full, Permission::MintOnly] {
            let s = serde_json::to_string(&p).unwrap();
            let back: Permission = serde_json::from_str(&s).unwrap();
            assert_eq!(p, back);
        }
    }

    #[test]
    fn token_record_round_trips() {
        use chrono::TimeZone;
        let rec = TokenRecord {
            id: TokenId::parse("tk_0123456789abcdef").unwrap(),
            agent: "claude".into(),
            device: "tootie".into(),
            permission: Permission::Full,
            created_at: chrono::Utc.with_ymd_and_hms(2026, 4, 17, 0, 0, 0).unwrap(),
            expires_at: None,
            last_used: None,
            revoked_at: None,
        };
        let s = serde_json::to_string(&rec).unwrap();
        let back: TokenRecord = serde_json::from_str(&s).unwrap();
        assert_eq!(rec, back);
    }
}
