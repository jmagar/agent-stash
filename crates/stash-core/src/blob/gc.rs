use crate::{
    blob::store::blob_path,
    db::{db_err, Db},
};
use std::path::{Path, PathBuf};
use stash_types::StashResult;

pub struct GcStats {
    pub blobs_deleted: u64,
    pub bytes_freed: u64,
}

pub async fn sweep_gc(db: &Db, blobs_dir: &Path, grace_days: u64) -> StashResult<GcStats> {
    let blobs_dir = blobs_dir.to_path_buf();
    db.run(move |conn| {
        let cutoff = chrono::Utc::now() - chrono::Duration::days(grace_days as i64);
        let cutoff_str = cutoff.to_rfc3339();

        let mut stmt = conn
            .prepare(
                "SELECT sha, size_bytes FROM blob_refs
                 WHERE refcount = 0 AND last_ref_at < ?1",
            )
            .map_err(db_err)?;
        let candidates: Vec<(String, i64)> = stmt
            .query_map(rusqlite::params![cutoff_str], |row| {
                Ok((row.get::<_, String>(0)?, row.get::<_, i64>(1)?))
            })
            .map_err(db_err)?
            .filter_map(|r| r.ok())
            .collect();

        let mut stats = GcStats {
            blobs_deleted: 0,
            bytes_freed: 0,
        };
        for (sha, size_bytes) in candidates {
            let path = blob_path(&blobs_dir, &sha);
            if std::fs::remove_file(&path).is_ok() {
                stats.blobs_deleted += 1;
                stats.bytes_freed += size_bytes.max(0) as u64;
            }
            conn.execute(
                "DELETE FROM blob_refs WHERE sha = ?1",
                rusqlite::params![sha],
            )
            .map_err(db_err)?;
        }
        Ok(stats)
    })
    .await
}

pub fn spawn_gc_task(
    db: Db,
    blobs_dir: PathBuf,
    interval_secs: u64,
    grace_days: u64,
) -> tokio::task::JoinHandle<()> {
    tokio::spawn(async move {
        let interval = tokio::time::Duration::from_secs(interval_secs);
        loop {
            tokio::time::sleep(interval).await;
            if let Err(e) = sweep_gc(&db, &blobs_dir, grace_days).await {
                tracing::warn!("blob GC sweep failed: {e:?}");
            }
        }
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::blob::store::BlobStore;
    use bytes::Bytes;

    async fn make_store(td: &tempfile::TempDir) -> BlobStore {
        let db = crate::db::Db::open(td.path().join("meta.db")).await.unwrap();
        BlobStore::new(td.path(), db)
    }

    #[tokio::test]
    async fn sweep_does_not_delete_blobs_within_grace_period() {
        let td = tempfile::tempdir().unwrap();
        let store = make_store(&td).await;
        let data = Bytes::from("keep me");
        let r = store
            .store(&data, "text/plain", "f.txt", "a@b")
            .await
            .unwrap();
        store.release(&r.sha256).await.unwrap();
        let stats = sweep_gc(&store.db, td.path().join("blobs").as_path(), 7)
            .await
            .unwrap();
        assert_eq!(stats.blobs_deleted, 0);
        assert!(blob_path(td.path().join("blobs").as_path(), &r.sha256).exists());
    }

    #[tokio::test]
    async fn sweep_does_not_delete_blobs_with_positive_refcount() {
        let td = tempfile::tempdir().unwrap();
        let store = make_store(&td).await;
        let data = Bytes::from("still referenced");
        let r = store
            .store(&data, "text/plain", "f.txt", "a@b")
            .await
            .unwrap();
        let old = "2000-01-01T00:00:00+00:00";
        store
            .db
            .run({
                let sha = r.sha256.clone();
                move |conn| {
                    conn.execute(
                        "UPDATE blob_refs SET last_ref_at = ?1 WHERE sha = ?2",
                        rusqlite::params![old, sha],
                    )
                    .map_err(crate::db::db_err)?;
                    Ok(())
                }
            })
            .await
            .unwrap();
        let stats = sweep_gc(&store.db, td.path().join("blobs").as_path(), 7)
            .await
            .unwrap();
        assert_eq!(stats.blobs_deleted, 0);
    }

    #[tokio::test]
    async fn sweep_deletes_expired_zero_refcount_blobs() {
        let td = tempfile::tempdir().unwrap();
        let store = make_store(&td).await;
        let data = Bytes::from("expired blob");
        let r = store
            .store(&data, "text/plain", "f.txt", "a@b")
            .await
            .unwrap();
        store.release(&r.sha256).await.unwrap();
        let old = "2000-01-01T00:00:00+00:00";
        store
            .db
            .run({
                let sha = r.sha256.clone();
                move |conn| {
                    conn.execute(
                        "UPDATE blob_refs SET last_ref_at = ?1 WHERE sha = ?2",
                        rusqlite::params![old, sha],
                    )
                    .map_err(crate::db::db_err)?;
                    Ok(())
                }
            })
            .await
            .unwrap();
        let stats = sweep_gc(&store.db, td.path().join("blobs").as_path(), 7)
            .await
            .unwrap();
        assert_eq!(stats.blobs_deleted, 1);
        assert_eq!(stats.bytes_freed, 12);
        assert!(!blob_path(td.path().join("blobs").as_path(), &r.sha256).exists());
    }
}
