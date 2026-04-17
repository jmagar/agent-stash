use crate::db::{db_err, Db};
use bytes::Bytes;
use sha2::{Digest, Sha256};
use std::path::{Path, PathBuf};
use stash_types::{StashError, StashResult};

pub struct BlobRef {
    pub sha256: String,
    pub size: u64,
    pub mime: String,
}

pub struct BlobStore {
    blobs_dir: PathBuf,
    pub(crate) db: Db,
}

impl BlobStore {
    pub fn new(root: &Path, db: Db) -> Self {
        Self {
            blobs_dir: root.join("blobs"),
            db,
        }
    }

    pub async fn store(
        &self,
        data: &Bytes,
        mime: &str,
        original_name: &str,
        uploaded_by: &str,
    ) -> StashResult<BlobRef> {
        let blobs_dir = self.blobs_dir.clone();
        let data = data.clone();
        let mime = mime.to_string();
        let _original_name = original_name.to_string();
        let _uploaded_by = uploaded_by.to_string();

        self.db
            .run(move |conn| {
                let sha = hex::encode(Sha256::digest(&data[..]));
                let path = blob_path(&blobs_dir, &sha);
                let size = data.len() as u64;
                let now = chrono::Utc::now().to_rfc3339();

                if !path.exists() {
                    if let Some(parent) = path.parent() {
                        std::fs::create_dir_all(parent).map_err(io_err)?;
                    }
                    std::fs::write(&path, &data[..]).map_err(io_err)?;
                    conn.execute(
                        "INSERT INTO blob_refs(sha,refcount,size_bytes,mime,created_at,last_ref_at)
                         VALUES(?1,1,?2,?3,?4,?4)",
                        rusqlite::params![sha, size as i64, mime, now],
                    )
                    .map_err(db_err)?;
                } else {
                    conn.execute(
                        "UPDATE blob_refs SET refcount = refcount + 1, last_ref_at = ?1
                         WHERE sha = ?2",
                        rusqlite::params![now, sha],
                    )
                    .map_err(db_err)?;
                }

                Ok(BlobRef { sha256: sha, size, mime })
            })
            .await
    }

    pub async fn fetch(&self, sha256: &str) -> StashResult<Bytes> {
        let path = blob_path(&self.blobs_dir, sha256);
        tokio::task::spawn_blocking(move || {
            std::fs::read(&path).map(Bytes::from).map_err(io_err)
        })
        .await
        .map_err(|e| StashError::Internal {
            trace_id: format!("join:{e}"),
        })?
    }

    pub async fn release(&self, sha256: &str) -> StashResult<()> {
        let sha = sha256.to_string();
        let now = chrono::Utc::now().to_rfc3339();
        self.db
            .run(move |conn| {
                conn.execute(
                    "UPDATE blob_refs
                     SET refcount = MAX(0, refcount - 1), last_ref_at = ?1
                     WHERE sha = ?2",
                    rusqlite::params![now, sha],
                )
                .map_err(db_err)?;
                Ok(())
            })
            .await
    }
}

pub(crate) fn blob_path(blobs_dir: &Path, sha256: &str) -> PathBuf {
    blobs_dir.join(&sha256[..2]).join(&sha256[2..])
}

fn io_err(e: std::io::Error) -> StashError {
    StashError::Internal {
        trace_id: format!("io:{e}"),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use bytes::Bytes;

    async fn make_store() -> (BlobStore, tempfile::TempDir) {
        let td = tempfile::tempdir().unwrap();
        let db = crate::db::Db::open(td.path().join("meta.db")).await.unwrap();
        let store = BlobStore::new(td.path(), db);
        (store, td)
    }

    #[tokio::test]
    async fn store_writes_file_and_returns_ref() {
        let (store, _td) = make_store().await;
        let data = Bytes::from("hello blob");
        let r = store
            .store(&data, "text/plain", "notes.txt", "claude@tootie")
            .await
            .unwrap();
        assert_eq!(r.size, 10);
        assert_eq!(r.mime, "text/plain");
        assert!(!r.sha256.is_empty());
    }

    #[tokio::test]
    async fn store_deduplicates_same_content() {
        let (store, td) = make_store().await;
        let data = Bytes::from("duplicate content");
        let r1 = store
            .store(&data, "text/plain", "a.txt", "claude@tootie")
            .await
            .unwrap();
        let r2 = store
            .store(&data, "text/plain", "b.txt", "claude@tootie")
            .await
            .unwrap();
        assert_eq!(r1.sha256, r2.sha256);
        let path = blob_path(td.path().join("blobs").as_path(), &r1.sha256);
        assert!(path.exists());
    }

    #[tokio::test]
    async fn fetch_returns_stored_bytes() {
        let (store, _td) = make_store().await;
        let data = Bytes::from("fetch me");
        let r = store
            .store(&data, "text/plain", "file.txt", "claude@tootie")
            .await
            .unwrap();
        let fetched = store.fetch(&r.sha256).await.unwrap();
        assert_eq!(&fetched[..], b"fetch me");
    }

    #[tokio::test]
    async fn release_decrements_refcount() {
        let (store, _td) = make_store().await;
        let data = Bytes::from("release me");
        let r = store
            .store(&data, "text/plain", "file.txt", "claude@tootie")
            .await
            .unwrap();
        store.release(&r.sha256).await.unwrap();
        let count: i64 = store
            .db
            .run({
                let sha = r.sha256.clone();
                move |conn| {
                    conn.query_row(
                        "SELECT refcount FROM blob_refs WHERE sha = ?1",
                        rusqlite::params![sha],
                        |row| row.get(0),
                    )
                    .map_err(db_err)
                }
            })
            .await
            .unwrap();
        assert_eq!(count, 0);
    }

    #[tokio::test]
    async fn duplicate_store_increments_refcount() {
        let (store, _td) = make_store().await;
        let data = Bytes::from("shared content");
        let r = store
            .store(&data, "text/plain", "a.txt", "claude@tootie")
            .await
            .unwrap();
        store
            .store(&data, "text/plain", "b.txt", "claude@tootie")
            .await
            .unwrap();
        let count: i64 = store
            .db
            .run({
                let sha = r.sha256.clone();
                move |conn| {
                    conn.query_row(
                        "SELECT refcount FROM blob_refs WHERE sha = ?1",
                        rusqlite::params![sha],
                        |row| row.get(0),
                    )
                    .map_err(db_err)
                }
            })
            .await
            .unwrap();
        assert_eq!(count, 2);
    }
}
