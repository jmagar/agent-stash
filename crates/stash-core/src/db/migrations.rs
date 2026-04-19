use rusqlite::Connection;
use stash_types::{StashError, StashResult};

pub fn run(conn: &Connection) -> StashResult<()> {
    conn.execute_batch(
        r#"
        BEGIN;

        -- v1 (P02): blob refcounts
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

        -- v2 (P03): auth tokens
        CREATE TABLE IF NOT EXISTS tokens (
            id          TEXT PRIMARY KEY NOT NULL,      -- public, e.g. "tk_0123456789abcdef"
            hash        BLOB NOT NULL,                  -- argon2id PHC string (ASCII, stored as BLOB)
            agent       TEXT NOT NULL,
            device      TEXT NOT NULL,
            permission  TEXT NOT NULL DEFAULT 'full',   -- 'full' | 'mint_only'
            expires_at  INTEGER,                        -- unix seconds, NULL = no expiry
            created_at  INTEGER NOT NULL,
            last_used   INTEGER,
            revoked_at  INTEGER
        );
        -- One LIVE token per (agent, device). Revoked rows do not count.
        CREATE UNIQUE INDEX IF NOT EXISTS idx_tokens_live_identity
            ON tokens(agent, device) WHERE revoked_at IS NULL;
        CREATE INDEX IF NOT EXISTS idx_tokens_created_at
            ON tokens(created_at);

        -- v2 (P03): audit log
        CREATE TABLE IF NOT EXISTS audit (
            ts       INTEGER NOT NULL,
            token_id TEXT,
            op       TEXT NOT NULL,
            path     TEXT,
            sha      TEXT,
            status   INTEGER NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_audit_ts ON audit(ts);

        COMMIT;
        "#,
    )
    .map_err(|e| StashError::Internal {
        trace_id: format!("db-migrate:{e}"),
    })
}
