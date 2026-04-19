pub(crate) mod token;

use crate::config::AuthConfig;
use crate::db::{db_err, Db};
use chrono::{DateTime, TimeZone, Utc};
use stash_types::{Identity, Permission, StashError, StashPath, StashResult, TokenId, TokenRecord};
use token::{hash_secret, Token};

pub struct AuthService {
    db: Db,
    cfg: AuthConfig,
}

impl AuthService {
    pub fn new(db: Db, cfg: AuthConfig) -> Self {
        Self { db, cfg }
    }

    /// Mint a new token for `(agent, device)`.
    ///
    /// Returns the public `TokenRecord` and the plaintext `Token` (once only — drop after use).
    /// Returns `Conflict` if a live token already exists for that identity.
    /// Returns `InvalidInput` if `agent` or `device` contains invalid characters.
    pub async fn mint(
        &self,
        agent: &str,
        device: &str,
        permission: Permission,
        expires_at: Option<DateTime<Utc>>,
    ) -> StashResult<(TokenRecord, Token)> {
        // Validate and normalize identity.
        let identity = Identity::new(agent.to_string(), device.to_string())?;
        let agent_str = identity.agent.clone();
        let device_str = identity.device.clone();

        // Generate token and hash outside the closure (keeps Token non-Send-constrained).
        let (id, token) = Token::generate();
        let phc = hash_secret(&token.secret, &self.cfg)?;

        let created_ts = Utc::now().timestamp();
        let expires_ts: Option<i64> = expires_at.map(|dt| dt.timestamp());
        let perm_str = permission_to_str(permission).to_string();
        let id_str = id.as_str().to_string();

        self.db
            .run(move |conn| {
                match conn.execute(
                    "INSERT INTO tokens (id, hash, agent, device, permission, expires_at, created_at)
                     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
                    rusqlite::params![
                        &id_str,
                        phc.as_bytes(),
                        &agent_str,
                        &device_str,
                        &perm_str,
                        expires_ts,
                        created_ts,
                    ],
                ) {
                    Ok(_) => Ok(()),
                    Err(rusqlite::Error::SqliteFailure(e, _))
                        if e.code == rusqlite::ErrorCode::ConstraintViolation =>
                    {
                        Err(StashError::Conflict {
                            path: StashPath::parse(format!("tokens/{}@{}", agent_str, device_str))
                                .expect("identity is path-safe"),
                        })
                    }
                    Err(e) => Err(db_err(e)),
                }
            })
            .await?;

        let record = TokenRecord {
            id: id.clone(),
            agent: identity.agent,
            device: identity.device,
            permission,
            created_at: Utc.timestamp_opt(created_ts, 0).single().expect("valid ts"),
            expires_at,
            last_used: None,
            revoked_at: None,
        };

        Ok((record, token))
    }

    /// Revoke a live token by id.
    ///
    /// Returns `NotFound` if no live token exists with that id.
    pub async fn revoke(&self, id: &TokenId) -> StashResult<()> {
        let id_str = id.as_str().to_string();
        let now_ts = Utc::now().timestamp();

        let affected = self
            .db
            .run(move |conn| {
                conn.execute(
                    "UPDATE tokens SET revoked_at = ?1 WHERE id = ?2 AND revoked_at IS NULL",
                    rusqlite::params![now_ts, &id_str],
                )
                .map_err(db_err)
            })
            .await?;

        if affected == 0 {
            return Err(StashError::NotFound {
                path: StashPath::parse(format!("tokens/{}", id.as_str()))
                    .expect("token id is path-safe"),
            });
        }

        Ok(())
    }
}

fn permission_to_str(p: Permission) -> &'static str {
    match p {
        Permission::Full => "full",
        Permission::MintOnly => "mint_only",
    }
}

#[allow(dead_code)]
fn permission_from_str(s: &str) -> StashResult<Permission> {
    match s {
        "full" => Ok(Permission::Full),
        "mint_only" => Ok(Permission::MintOnly),
        other => Err(StashError::InvalidInput {
            field: "permission".into(),
            reason: format!("unknown permission value: {other}"),
        }),
    }
}

#[allow(dead_code)]
fn ts_to_utc(ts: i64) -> Option<DateTime<Utc>> {
    Utc.timestamp_opt(ts, 0).single()
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::config::AuthConfig;
    use crate::db::Db;
    use stash_types::Permission;

    async fn fixture() -> (tempfile::TempDir, AuthService) {
        let td = tempfile::tempdir().unwrap();
        let db = Db::open(td.path().join("meta.db")).await.unwrap();
        let cfg = AuthConfig { argon2_m_cost_kib: 8, argon2_t_cost: 1, argon2_p_cost: 1, ..AuthConfig::default() };
        (td, AuthService::new(db, cfg))
    }

    #[tokio::test]
    async fn mint_returns_plaintext_bearer_once() {
        let (_td, auth) = fixture().await;
        let (rec, tok) = auth.mint("claude", "tootie", Permission::Full, None).await.unwrap();
        assert_eq!(rec.agent, "claude");
        assert_eq!(rec.device, "tootie");
        assert_eq!(rec.permission, Permission::Full);
        assert!(tok.expose().starts_with("sk_live_tk_"));
        assert_eq!(tok.id, rec.id);
    }

    #[tokio::test]
    async fn mint_rejects_duplicate_live_identity() {
        let (_td, auth) = fixture().await;
        auth.mint("claude", "tootie", Permission::Full, None).await.unwrap();
        let err = auth.mint("claude", "tootie", Permission::Full, None).await.unwrap_err();
        assert!(matches!(err, stash_types::StashError::Conflict { .. }));
    }

    #[tokio::test]
    async fn mint_after_revoke_succeeds() {
        let (_td, auth) = fixture().await;
        let (rec, _) = auth.mint("claude", "tootie", Permission::Full, None).await.unwrap();
        auth.revoke(&rec.id).await.unwrap();
        auth.mint("claude", "tootie", Permission::Full, None).await.unwrap();
    }

    #[tokio::test]
    async fn mint_normalizes_identity_components() {
        let (_td, auth) = fixture().await;
        let err = auth.mint("Claude!", "tootie", Permission::Full, None).await.unwrap_err();
        assert!(matches!(err, stash_types::StashError::InvalidInput { .. }));
    }
}
