use crate::config::AuditConfig;
use crate::db::{db_err, Db};
use rand::Rng;
use stash_types::{StashResult, TokenId};

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum AuditOp {
    Write,
    Read,
    Delete,
    Mint,
    Revoke,
    Auth,
}

impl AuditOp {
    fn as_str(self) -> &'static str {
        match self {
            AuditOp::Write => "write",
            AuditOp::Read => "read",
            AuditOp::Delete => "delete",
            AuditOp::Mint => "mint",
            AuditOp::Revoke => "revoke",
            AuditOp::Auth => "auth",
        }
    }
    fn is_read(self) -> bool {
        matches!(self, AuditOp::Read)
    }
}

pub struct AuditEntry<'a> {
    pub token_id: Option<&'a TokenId>,
    pub op: AuditOp,
    pub path: Option<&'a str>,
    pub sha: Option<&'a str>,
    pub status: u16,
}

#[derive(Clone)]
pub struct AuditLog {
    db: Db,
    cfg: AuditConfig,
}

impl AuditLog {
    pub fn new(db: Db, cfg: AuditConfig) -> Self {
        Self { db, cfg }
    }

    /// Append one entry. Returns `true` if persisted, `false` if dropped by read sampling.
    pub async fn record(&self, entry: AuditEntry<'_>) -> StashResult<bool> {
        if entry.op.is_read() {
            let roll: f64 = rand::thread_rng().gen_range(0.0..1.0);
            if roll >= self.cfg.read_sample_rate {
                return Ok(false);
            }
        }
        let token = entry.token_id.map(|t| t.as_str().to_string());
        let op = entry.op.as_str().to_string();
        let path = entry.path.map(str::to_string);
        let sha = entry.sha.map(str::to_string);
        let status = entry.status as i64;
        let now = chrono::Utc::now().timestamp();
        self.db
            .run(move |conn| {
                conn.execute(
                    "INSERT INTO audit (ts, token_id, op, path, sha, status)
                     VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
                    rusqlite::params![now, token, op, path, sha, status],
                )
                .map_err(db_err)
            })
            .await?;
        Ok(true)
    }

    #[cfg(test)]
    pub(crate) async fn count(&self) -> StashResult<i64> {
        self.db
            .run(|c| {
                c.query_row("SELECT COUNT(*) FROM audit", [], |r| r.get::<_, i64>(0))
                    .map_err(db_err)
            })
            .await
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    async fn fixture(rate: f64) -> (tempfile::TempDir, AuditLog) {
        let td = tempfile::tempdir().unwrap();
        let db = crate::db::Db::open(td.path().join("meta.db"))
            .await
            .unwrap();
        let cfg = AuditConfig {
            read_sample_rate: rate,
        };
        (td, AuditLog::new(db, cfg))
    }

    #[tokio::test]
    async fn writes_always_persist() {
        let (_td, log) = fixture(0.0).await;
        for _ in 0..10 {
            log.record(AuditEntry {
                token_id: None,
                op: AuditOp::Write,
                path: Some("a"),
                sha: None,
                status: 200,
            })
            .await
            .unwrap();
        }
        assert_eq!(log.count().await.unwrap(), 10);
    }

    #[tokio::test]
    async fn reads_sampled_at_zero_are_always_dropped() {
        let (_td, log) = fixture(0.0).await;
        for _ in 0..100 {
            log.record(AuditEntry {
                token_id: None,
                op: AuditOp::Read,
                path: Some("a"),
                sha: None,
                status: 200,
            })
            .await
            .unwrap();
        }
        assert_eq!(log.count().await.unwrap(), 0);
    }

    #[tokio::test]
    async fn reads_sampled_at_one_always_persist() {
        let (_td, log) = fixture(1.0).await;
        for _ in 0..50 {
            log.record(AuditEntry {
                token_id: None,
                op: AuditOp::Read,
                path: Some("a"),
                sha: None,
                status: 200,
            })
            .await
            .unwrap();
        }
        assert_eq!(log.count().await.unwrap(), 50);
    }

    #[tokio::test]
    async fn mint_and_revoke_always_persist_regardless_of_read_rate() {
        let (_td, log) = fixture(0.0).await;
        log.record(AuditEntry {
            token_id: None,
            op: AuditOp::Mint,
            path: None,
            sha: None,
            status: 200,
        })
        .await
        .unwrap();
        log.record(AuditEntry {
            token_id: None,
            op: AuditOp::Revoke,
            path: None,
            sha: None,
            status: 200,
        })
        .await
        .unwrap();
        assert_eq!(log.count().await.unwrap(), 2);
    }
}
