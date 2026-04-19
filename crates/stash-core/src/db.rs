pub(crate) mod migrations;

use stash_types::{StashError, StashResult};
use std::{
    path::Path,
    sync::{Arc, Mutex},
};

pub(crate) fn db_err(e: rusqlite::Error) -> StashError {
    StashError::Internal {
        trace_id: format!("db:{e}"),
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
        .map_err(|e| StashError::Internal {
            trace_id: format!("join:{e}"),
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
        .map_err(|e| StashError::Internal {
            trace_id: format!("join:{e}"),
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
}
