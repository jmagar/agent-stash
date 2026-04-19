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
        -- Index used by GC sweeps: filters on refcount = 0 and last_ref_at < cutoff.
        -- A composite index on (refcount, last_ref_at) lets SQLite satisfy both
        -- predicates with a single index scan instead of a full table scan.
        CREATE INDEX IF NOT EXISTS idx_blob_refs_gc
            ON blob_refs (refcount, last_ref_at);
        COMMIT;",
    )
    .map_err(|e| StashError::Internal {
        trace_id: format!("db-migrate:{e}"),
    })
}
