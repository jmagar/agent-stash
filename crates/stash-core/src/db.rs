pub(crate) mod migrations;

use stash_types::{StashError, StashResult};
use std::{
    path::Path,
    sync::{Arc, Mutex},
};

pub(crate) fn db_err(e: rusqlite::Error) -> StashError {
    tracing::error!(error = %e, "database query failed");
    StashError::Internal {
        trace_id: "db-query-failed".into(),
    }
}

#[derive(Clone, Debug)]
pub struct Db {
    conn: Arc<Mutex<rusqlite::Connection>>,
}

impl Db {
    pub async fn open(path: impl AsRef<Path>) -> StashResult<Self> {
        let path = path.as_ref().to_path_buf();
        tokio::task::spawn_blocking(move || {
            let conn = rusqlite::Connection::open(&path).map_err(db_err)?;
            migrations::run(&conn)?;
            Ok(Db {
                conn: Arc::new(Mutex::new(conn)),
            })
        })
        .await
        .map_err(|e| {
            tracing::error!(error = %e, "db open task join failed");
            StashError::Internal {
                trace_id: "db-join-failed".into(),
            }
        })?
    }

    pub async fn run<F, T>(&self, f: F) -> StashResult<T>
    where
        F: FnOnce(&rusqlite::Connection) -> StashResult<T> + Send + 'static,
        T: Send + 'static,
    {
        let conn = Arc::clone(&self.conn);
        tokio::task::spawn_blocking(move || {
            let guard = conn.lock().map_err(|_| StashError::Internal {
                trace_id: "db-lock-poisoned".into(),
            })?;
            // Wrap the closure invocation in catch_unwind so that a panic
            // inside `f` does not propagate past the MutexGuard drop point.
            // Without this, the panic would poison the shared Mutex, making
            // all subsequent `run` calls fail with a PoisonError.
            std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| f(&guard))).unwrap_or_else(
                |_| {
                    Err(StashError::Internal {
                        trace_id: "db-panic".into(),
                    })
                },
            )
        })
        .await
        .map_err(|e| {
            tracing::error!(error = %e, "db run task join failed");
            StashError::Internal {
                trace_id: "db-join-failed".into(),
            }
        })?
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn open_creates_file_and_runs_migrations() {
        let td = tempfile::tempdir().unwrap();
        let db = Db::open(td.path().join("meta.db")).await.unwrap();
        db.run(|conn| {
            let count: i64 = conn
                .query_row("SELECT COUNT(*) FROM blob_refs", [], |r| r.get(0))
                .map_err(db_err)?;
            assert_eq!(count, 0);
            Ok(())
        })
        .await
        .unwrap();
    }

    #[tokio::test]
    async fn run_executes_closure_on_connection() {
        let td = tempfile::tempdir().unwrap();
        let db = Db::open(td.path().join("meta.db")).await.unwrap();
        let val: i64 = db
            .run(|conn| {
                conn.query_row("SELECT 42", [], |r| r.get(0))
                    .map_err(db_err)
            })
            .await
            .unwrap();
        assert_eq!(val, 42);
    }

    #[tokio::test]
    async fn open_is_idempotent() {
        let td = tempfile::tempdir().unwrap();
        let path = td.path().join("meta.db");
        Db::open(&path).await.unwrap();
        Db::open(&path).await.unwrap();
    }

    #[tokio::test]
    async fn migrations_create_tokens_table() {
        let td = tempfile::tempdir().unwrap();
        let db = Db::open(td.path().join("meta.db")).await.unwrap();
        db.run(|c| {
            let cnt: i64 = c
                .query_row("SELECT COUNT(*) FROM tokens", [], |r| r.get(0))
                .map_err(db_err)?;
            assert_eq!(cnt, 0);
            Ok(())
        })
        .await
        .unwrap();
    }

    #[tokio::test]
    async fn migrations_create_audit_table() {
        let td = tempfile::tempdir().unwrap();
        let db = Db::open(td.path().join("meta.db")).await.unwrap();
        db.run(|c| {
            let cnt: i64 = c
                .query_row("SELECT COUNT(*) FROM audit", [], |r| r.get(0))
                .map_err(db_err)?;
            assert_eq!(cnt, 0);
            Ok(())
        })
        .await
        .unwrap();
    }

    #[tokio::test]
    async fn migrations_enforce_live_identity_uniqueness() {
        let td = tempfile::tempdir().unwrap();
        let db = Db::open(td.path().join("meta.db")).await.unwrap();
        // Two live rows for same (agent,device) must fail.
        db.run(|c| {
            c.execute(
                "INSERT INTO tokens (id, hash, agent, device, permission, created_at)
                 VALUES ('tk_aaaaaaaaaaaaaaaa', x'00', 'claude', 'tootie', 'full', 1000)",
                [],
            ).map_err(db_err)?;
            let second = c.execute(
                "INSERT INTO tokens (id, hash, agent, device, permission, created_at)
                 VALUES ('tk_bbbbbbbbbbbbbbbb', x'00', 'claude', 'tootie', 'full', 2000)",
                [],
            );
            assert!(second.is_err(), "partial unique index should reject second live row");
            Ok(())
        }).await.unwrap();

        // Revoke the first; a new live row must be allowed.
        db.run(|c| {
            c.execute(
                "UPDATE tokens SET revoked_at = 1500 WHERE id = 'tk_aaaaaaaaaaaaaaaa'",
                [],
            ).map_err(db_err)?;
            c.execute(
                "INSERT INTO tokens (id, hash, agent, device, permission, created_at)
                 VALUES ('tk_cccccccccccccccc', x'00', 'claude', 'tootie', 'full', 2500)",
                [],
            ).map_err(db_err)?;
            Ok(())
        }).await.unwrap();
    }
}
