pub(crate) mod token;

use crate::config::AuthConfig;
use crate::db::{db_err, Db};
use chrono::{DateTime, TimeZone, Utc};
use stash_types::{Identity, Permission, StashError, StashPath, StashResult, TokenId, TokenRecord};
use token::{hash_secret, Token};

#[derive(Clone)]
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

    /// List tokens, optionally filtered to live-only records, newest first.
    pub async fn list(&self, filter: ListFilter) -> StashResult<Vec<TokenRecord>> {
        self.db
            .run(move |conn| {
                let sql = match filter {
                    ListFilter::Live => {
                        "SELECT id, agent, device, permission, created_at, \
                         expires_at, last_used, revoked_at \
                         FROM tokens WHERE revoked_at IS NULL \
                         ORDER BY created_at DESC"
                    }
                    ListFilter::All => {
                        "SELECT id, agent, device, permission, created_at, \
                         expires_at, last_used, revoked_at \
                         FROM tokens ORDER BY created_at DESC"
                    }
                };
                let mut stmt = conn.prepare(sql).map_err(db_err)?;
                let rows = stmt
                    .query_map([], |row| {
                        Ok((
                            row.get::<_, String>(0)?,
                            row.get::<_, String>(1)?,
                            row.get::<_, String>(2)?,
                            row.get::<_, String>(3)?,
                            row.get::<_, i64>(4)?,
                            row.get::<_, Option<i64>>(5)?,
                            row.get::<_, Option<i64>>(6)?,
                            row.get::<_, Option<i64>>(7)?,
                        ))
                    })
                    .map_err(db_err)?;
                let mut out = Vec::new();
                for r in rows {
                    let (id_s, agent, device, perm, created, expires, last_used, revoked) =
                        r.map_err(db_err)?;
                    out.push(TokenRecord {
                        id: TokenId::parse(&id_s)?,
                        agent,
                        device,
                        permission: permission_from_str(&perm)?,
                        created_at: ts_to_utc(created).unwrap_or_default(),
                        expires_at: expires.and_then(ts_to_utc),
                        last_used: last_used.and_then(ts_to_utc),
                        revoked_at: revoked.and_then(ts_to_utc),
                    });
                }
                Ok(out)
            })
            .await
    }

    /// Authenticate a bearer token string, verifying identity, lifecycle, and secret.
    ///
    /// Returns `Unauthorized` for any invalid, expired, revoked, or tampered token.
    pub async fn authenticate(&self, bearer: &str) -> StashResult<AuthOutcome> {
        let parsed = token::Token::parse(bearer)?;
        let id_s = parsed.id.as_str().to_string();

        // Step 1: fetch the stored row (no secret comparison yet).
        let row = self
            .db
            .run(move |conn| {
                let mut stmt = conn
                    .prepare(
                        "SELECT hash, agent, device, permission, expires_at, revoked_at
                         FROM tokens WHERE id = ?1",
                    )
                    .map_err(db_err)?;
                let mut rows = stmt.query(rusqlite::params![id_s]).map_err(db_err)?;
                let row = rows.next().map_err(db_err)?;
                row.map(|r| -> StashResult<_> {
                    Ok((
                        r.get::<_, Vec<u8>>(0).map_err(db_err)?,
                        r.get::<_, String>(1).map_err(db_err)?,
                        r.get::<_, String>(2).map_err(db_err)?,
                        r.get::<_, String>(3).map_err(db_err)?,
                        r.get::<_, Option<i64>>(4).map_err(db_err)?,
                        r.get::<_, Option<i64>>(5).map_err(db_err)?,
                    ))
                })
                .transpose()
            })
            .await?;

        let Some((phc, agent, device, perm, expires_at, revoked_at)) = row else {
            return Err(StashError::Unauthorized);
        };

        // Step 2: enforce lifecycle (revoked / expired).
        if revoked_at.is_some() {
            return Err(StashError::Unauthorized);
        }
        if let Some(exp) = expires_at {
            if exp <= Utc::now().timestamp() {
                return Err(StashError::Unauthorized);
            }
        }

        // Step 3: verify argon2id hash.
        let phc_s = std::str::from_utf8(&phc).map_err(|_| StashError::Internal {
            trace_id: "bad-phc-utf8".into(),
        })?;
        if !token::verify_secret(&parsed.secret, phc_s)? {
            return Err(StashError::Unauthorized);
        }

        // Step 4: bump last_used (fire-and-forget; failure does not deny auth).
        let bump_id = parsed.id.as_str().to_string();
        let _ = self
            .db
            .run(move |conn| {
                conn.execute(
                    "UPDATE tokens SET last_used = ?1 WHERE id = ?2",
                    rusqlite::params![Utc::now().timestamp(), bump_id],
                )
                .map_err(db_err)
            })
            .await;

        let identity = Identity::new(agent, device)?;
        let permission = permission_from_str(&perm)?;
        Ok(AuthOutcome {
            token_id: parsed.id,
            identity,
            permission,
        })
    }
}

/// Filter for `AuthService::list`.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ListFilter {
    Live,
    All,
}

/// Result of a successful bearer authentication.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct AuthOutcome {
    pub token_id: TokenId,
    pub identity: Identity,
    pub permission: Permission,
}

fn permission_to_str(p: Permission) -> &'static str {
    match p {
        Permission::Full => "full",
        Permission::MintOnly => "mint_only",
    }
}

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
        let cfg = AuthConfig {
            argon2_m_cost_kib: 8,
            argon2_t_cost: 1,
            argon2_p_cost: 1,
            ..AuthConfig::default()
        };
        (td, AuthService::new(db, cfg))
    }

    #[tokio::test]
    async fn mint_returns_plaintext_bearer_once() {
        let (_td, auth) = fixture().await;
        let (rec, tok) = auth
            .mint("claude", "tootie", Permission::Full, None)
            .await
            .unwrap();
        assert_eq!(rec.agent, "claude");
        assert_eq!(rec.device, "tootie");
        assert_eq!(rec.permission, Permission::Full);
        assert!(tok.expose().starts_with("sk_live_tk_"));
        assert_eq!(tok.id, rec.id);
    }

    #[tokio::test]
    async fn mint_rejects_duplicate_live_identity() {
        let (_td, auth) = fixture().await;
        auth.mint("claude", "tootie", Permission::Full, None)
            .await
            .unwrap();
        let err = auth
            .mint("claude", "tootie", Permission::Full, None)
            .await
            .unwrap_err();
        assert!(matches!(err, stash_types::StashError::Conflict { .. }));
    }

    #[tokio::test]
    async fn mint_after_revoke_succeeds() {
        let (_td, auth) = fixture().await;
        let (rec, _) = auth
            .mint("claude", "tootie", Permission::Full, None)
            .await
            .unwrap();
        auth.revoke(&rec.id).await.unwrap();
        auth.mint("claude", "tootie", Permission::Full, None)
            .await
            .unwrap();
    }

    #[tokio::test]
    async fn mint_normalizes_identity_components() {
        let (_td, auth) = fixture().await;
        let err = auth
            .mint("Claude!", "tootie", Permission::Full, None)
            .await
            .unwrap_err();
        assert!(matches!(err, stash_types::StashError::InvalidInput { .. }));
    }

    #[tokio::test]
    async fn list_returns_minted_records_without_secrets() {
        let (_td, auth) = fixture().await;
        auth.mint("claude", "tootie", Permission::Full, None)
            .await
            .unwrap();
        auth.mint("codex", "dookie", Permission::Full, None)
            .await
            .unwrap();
        let recs = auth.list(ListFilter::All).await.unwrap();
        assert_eq!(recs.len(), 2);
        let agents: std::collections::BTreeSet<_> = recs.iter().map(|r| r.agent.clone()).collect();
        assert!(agents.contains("claude"));
        assert!(agents.contains("codex"));
    }

    #[tokio::test]
    async fn list_live_excludes_revoked() {
        let (_td, auth) = fixture().await;
        let (a, _) = auth.mint("a", "x", Permission::Full, None).await.unwrap();
        let (_b, _) = auth.mint("b", "x", Permission::Full, None).await.unwrap();
        auth.revoke(&a.id).await.unwrap();
        let recs = auth.list(ListFilter::Live).await.unwrap();
        assert_eq!(recs.len(), 1);
        assert_eq!(recs[0].agent, "b");
    }

    #[tokio::test]
    async fn list_sorted_newest_first() {
        let (_td, auth) = fixture().await;
        auth.mint("a", "x", Permission::Full, None).await.unwrap();
        tokio::time::sleep(std::time::Duration::from_millis(1100)).await;
        auth.mint("b", "x", Permission::Full, None).await.unwrap();
        let recs = auth.list(ListFilter::All).await.unwrap();
        assert_eq!(recs[0].agent, "b");
        assert_eq!(recs[1].agent, "a");
    }

    #[tokio::test]
    async fn revoke_unknown_id_is_not_found() {
        let (_td, auth) = fixture().await;
        let fake = TokenId::parse("tk_0000000000000000").unwrap();
        let err = auth.revoke(&fake).await.unwrap_err();
        assert!(matches!(err, stash_types::StashError::NotFound { .. }));
    }

    #[tokio::test]
    async fn revoke_already_revoked_is_not_found() {
        let (_td, auth) = fixture().await;
        let (rec, _) = auth
            .mint("claude", "tootie", Permission::Full, None)
            .await
            .unwrap();
        auth.revoke(&rec.id).await.unwrap();
        let err = auth.revoke(&rec.id).await.unwrap_err();
        assert!(
            matches!(err, stash_types::StashError::NotFound { .. }),
            "second revoke should be NotFound — the `revoked_at IS NULL` filter eliminates the row"
        );
    }

    #[tokio::test]
    async fn authenticate_valid_token_returns_identity_and_permission() {
        let (_td, auth) = fixture().await;
        let (_rec, tok) = auth
            .mint("claude", "tootie", Permission::Full, None)
            .await
            .unwrap();
        let out = auth.authenticate(tok.expose()).await.unwrap();
        assert_eq!(out.identity.agent, "claude");
        assert_eq!(out.identity.device, "tootie");
        assert_eq!(out.permission, Permission::Full);
        assert_eq!(out.token_id, tok.id);
    }

    #[tokio::test]
    async fn authenticate_unknown_token_is_unauthorized() {
        let (_td, auth) = fixture().await;
        let err = auth
            .authenticate("sk_live_tk_0000000000000000_notasecret")
            .await
            .unwrap_err();
        assert!(matches!(err, stash_types::StashError::Unauthorized));
    }

    #[tokio::test]
    async fn authenticate_malformed_bearer_is_unauthorized() {
        let (_td, auth) = fixture().await;
        let err = auth.authenticate("not-a-token").await.unwrap_err();
        assert!(matches!(err, stash_types::StashError::Unauthorized));
    }

    #[tokio::test]
    async fn authenticate_wrong_secret_is_unauthorized() {
        let (_td, auth) = fixture().await;
        let (_rec, tok) = auth
            .mint("claude", "tootie", Permission::Full, None)
            .await
            .unwrap();
        let bearer = tok.expose();
        // Flip the last character — still ASCII, still the right length,
        // but the argon2id verification must fail.
        let mut bytes = bearer.as_bytes().to_vec();
        let last = bytes.last_mut().unwrap();
        *last = if *last == b'a' { b'b' } else { b'a' };
        let tampered = String::from_utf8(bytes).unwrap();
        let err = auth.authenticate(&tampered).await.unwrap_err();
        assert!(matches!(err, stash_types::StashError::Unauthorized));
    }

    #[tokio::test]
    async fn authenticate_revoked_token_is_unauthorized() {
        let (_td, auth) = fixture().await;
        let (rec, tok) = auth
            .mint("claude", "tootie", Permission::Full, None)
            .await
            .unwrap();
        auth.revoke(&rec.id).await.unwrap();
        let err = auth.authenticate(tok.expose()).await.unwrap_err();
        assert!(matches!(err, stash_types::StashError::Unauthorized));
    }

    #[tokio::test]
    async fn authenticate_expired_token_is_unauthorized() {
        let (_td, auth) = fixture().await;
        let past = chrono::Utc::now() - chrono::Duration::seconds(1);
        let (_rec, tok) = auth
            .mint("admin", "bootstrap", Permission::MintOnly, Some(past))
            .await
            .unwrap();
        let err = auth.authenticate(tok.expose()).await.unwrap_err();
        assert!(matches!(err, stash_types::StashError::Unauthorized));
    }

    #[tokio::test]
    async fn authenticate_updates_last_used() {
        let (_td, auth) = fixture().await;
        let (rec, tok) = auth
            .mint("claude", "tootie", Permission::Full, None)
            .await
            .unwrap();
        assert!(rec.last_used.is_none());
        auth.authenticate(tok.expose()).await.unwrap();
        let after = auth.list(ListFilter::All).await.unwrap();
        assert!(after[0].last_used.is_some());
    }

    #[tokio::test]
    async fn authenticate_is_concurrent_safe() {
        let (_td, auth) = fixture().await;
        let (_rec, tok) = auth
            .mint("claude", "tootie", Permission::Full, None)
            .await
            .unwrap();
        let bearer = tok.expose().to_string();
        let mut handles = Vec::new();
        for _ in 0..8 {
            let auth = auth.clone();
            let b = bearer.clone();
            handles.push(tokio::spawn(async move { auth.authenticate(&b).await }));
        }
        for h in handles {
            h.await.unwrap().unwrap();
        }
    }
}
