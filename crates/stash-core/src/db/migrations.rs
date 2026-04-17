use rusqlite::Connection;
use stash_types::{StashError, StashResult};

pub fn run(conn: &Connection) -> StashResult<()> {
    conn.execute_batch(
        "BEGIN;
        CREATE TABLE IF NOT EXISTS blob_refs (
            sha         TEXT PRIMARY KEY NOT NULL,
            refcount    INTEGER NOT NULL DEFAULT 1,
            size_bytes  INTEGER NOT NULL,
            mime        TEXT NOT NULL DEFAULT '',
            created_at  TEXT NOT NULL,
            last_ref_at TEXT NOT NULL
        );
        COMMIT;",
    )
    .map_err(|e| StashError::Internal {
        trace_id: format!("db-migrate:{e}"),
    })
}
