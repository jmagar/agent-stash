use crate::auth::AuthService;
#[cfg(test)]
use crate::auth::ListFilter;
use crate::config::AuthConfig;
use crate::db::{db_err, Db};
use chrono::{Duration, Utc};
use stash_types::{Permission, StashError, StashResult};
use std::path::Path;

/// Outcome of `ensure_admin_token`.
#[derive(Debug)]
pub enum Bootstrap {
    Minted {
        bearer: String,
        token_id: stash_types::TokenId,
        expires_at: chrono::DateTime<Utc>,
    },
    AlreadyPresent,
}

/// On first run, mint an admin token with `permission = MintOnly` valid for
/// `cfg.admin_token_ttl_secs`. Writes a mode-0600 copy of the bearer to
/// `{root}/.admin-token`. Idempotent: subsequent calls while a live
/// admin token exists return `AlreadyPresent`.
pub async fn ensure_admin_token(
    root: &Path,
    auth: &AuthService,
    cfg: &AuthConfig,
) -> StashResult<Bootstrap> {
    let db = auth.db_for_bootstrap();
    if admin_token_live(&db).await? {
        return Ok(Bootstrap::AlreadyPresent);
    }
    // Revoke any expired (but not yet revoked) admin bootstrap tokens so the
    // unique-per-live-identity constraint doesn't block a fresh mint.
    revoke_expired_admin_tokens(&db).await?;
    let expires = Utc::now() + Duration::seconds(cfg.admin_token_ttl_secs as i64);
    let (rec, tok) = auth
        .mint("admin", "bootstrap", Permission::MintOnly, Some(expires))
        .await?;
    write_admin_file(root, tok.expose())?;
    Ok(Bootstrap::Minted {
        bearer: tok.expose().to_string(),
        token_id: rec.id,
        expires_at: expires,
    })
}

async fn revoke_expired_admin_tokens(db: &Db) -> StashResult<()> {
    db.run(|conn| {
        let now_ts = Utc::now().timestamp();
        conn.execute(
            "UPDATE tokens SET revoked_at = ?1
             WHERE agent = 'admin' AND device = 'bootstrap'
             AND revoked_at IS NULL
             AND expires_at IS NOT NULL AND expires_at <= ?2",
            rusqlite::params![now_ts, now_ts],
        )
        .map_err(db_err)?;
        Ok(())
    })
    .await
}

async fn admin_token_live(db: &Db) -> StashResult<bool> {
    db.run(|conn| {
        let n: i64 = conn
            .query_row(
                "SELECT COUNT(*) FROM tokens
                 WHERE agent = 'admin' AND device = 'bootstrap'
                 AND revoked_at IS NULL
                 AND (expires_at IS NULL OR expires_at > ?1)",
                rusqlite::params![Utc::now().timestamp()],
                |r| r.get(0),
            )
            .map_err(db_err)?;
        Ok(n > 0)
    })
    .await
}

#[cfg(unix)]
fn write_admin_file(root: &Path, bearer: &str) -> StashResult<()> {
    use std::os::unix::fs::OpenOptionsExt;
    let path = root.join(".admin-token");
    let mut f = std::fs::OpenOptions::new()
        .write(true)
        .create(true)
        .truncate(true)
        .mode(0o600)
        .open(&path)
        .map_err(|e| StashError::Internal {
            trace_id: format!("admin-file-open:{e}"),
        })?;
    use std::io::Write;
    f.write_all(bearer.as_bytes())
        .map_err(|e| StashError::Internal {
            trace_id: format!("admin-file-write:{e}"),
        })?;
    Ok(())
}

#[cfg(not(unix))]
fn write_admin_file(root: &Path, bearer: &str) -> StashResult<()> {
    let path = root.join(".admin-token");
    std::fs::write(&path, bearer).map_err(|e| StashError::Internal {
        trace_id: format!("admin-file-write:{e}"),
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::config::AuthConfig;
    use crate::db::Db;

    async fn fixture() -> (tempfile::TempDir, AuthService, AuthConfig) {
        let td = tempfile::tempdir().unwrap();
        let db = Db::open(td.path().join("meta.db")).await.unwrap();
        let cfg = AuthConfig {
            argon2_m_cost_kib: 8,
            argon2_t_cost: 1,
            argon2_p_cost: 1,
            ..AuthConfig::default()
        };
        let auth = AuthService::new(db, cfg.clone());
        (td, auth, cfg)
    }

    #[tokio::test]
    async fn first_run_mints_admin_token_and_writes_file() {
        let (td, auth, cfg) = fixture().await;
        let out = ensure_admin_token(td.path(), &auth, &cfg).await.unwrap();
        let Bootstrap::Minted { bearer, .. } = out else {
            panic!("expected Minted")
        };
        let on_disk = std::fs::read_to_string(td.path().join(".admin-token")).unwrap();
        assert_eq!(on_disk, bearer);
    }

    #[cfg(unix)]
    #[tokio::test]
    async fn admin_file_is_mode_600() {
        use std::os::unix::fs::PermissionsExt;
        let (td, auth, cfg) = fixture().await;
        ensure_admin_token(td.path(), &auth, &cfg).await.unwrap();
        let meta = std::fs::metadata(td.path().join(".admin-token")).unwrap();
        assert_eq!(meta.permissions().mode() & 0o777, 0o600);
    }

    #[tokio::test]
    async fn second_run_is_noop_while_admin_is_live() {
        let (td, auth, cfg) = fixture().await;
        ensure_admin_token(td.path(), &auth, &cfg).await.unwrap();
        let second = ensure_admin_token(td.path(), &auth, &cfg).await.unwrap();
        assert!(matches!(second, Bootstrap::AlreadyPresent));
    }

    #[tokio::test]
    async fn after_admin_expires_new_bootstrap_mints_again() {
        let (td, auth, mut cfg) = fixture().await;
        // 0-second TTL → mint, then time has already passed.
        cfg.admin_token_ttl_secs = 0;
        let first = ensure_admin_token(td.path(), &auth, &cfg).await.unwrap();
        assert!(matches!(first, Bootstrap::Minted { .. }));
        tokio::time::sleep(std::time::Duration::from_millis(1100)).await;
        let second = ensure_admin_token(td.path(), &auth, &cfg).await.unwrap();
        assert!(matches!(second, Bootstrap::Minted { .. }));
        // And it's a MintOnly permission.
        let recs = auth.list(ListFilter::Live).await.unwrap();
        assert!(recs.iter().any(|r| r.permission == Permission::MintOnly));
    }
}
