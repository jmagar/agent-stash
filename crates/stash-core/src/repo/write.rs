use super::{git as git_helpers, StashRepo};
use crate::blob::{
    stub::{write_stub, BlobStub},
    BlobRef,
};
use bytes::Bytes;
use stash_types::{FileVersion, Identity, StashError, StashPath, StashResult, StorageTier};

impl StashRepo {
    pub async fn write(
        &self,
        path: &StashPath,
        bytes: Bytes,
        ident: &Identity,
        msg: Option<String>,
    ) -> StashResult<FileVersion> {
        let _g = self.write_lock.lock().await;

        // Enforce the configured body size limit before any tier routing or
        // storage occurs. This prevents over-large payloads from consuming
        // blob storage resources regardless of which tier they would land on.
        let size = bytes.len() as u64;
        if size > self.max_body {
            return Err(StashError::TooLarge {
                limit: self.max_body,
            });
        }

        let mime = super::read::sniff_mime(path.as_str());
        let tier = self.router.decide(path.as_str(), size, &mime);

        if tier == StorageTier::Blob {
            self.write_blob_tier(path, bytes, ident, msg, mime, size)
                .await
        } else {
            self.write_git(path, bytes, ident, msg).await
        }
    }

    async fn write_blob_tier(
        &self,
        path: &StashPath,
        bytes: Bytes,
        ident: &Identity,
        msg: Option<String>,
        mime: String,
        size: u64,
    ) -> StashResult<FileVersion> {
        let blob_ref: BlobRef = self.blob_store.store(&bytes, &mime).await?;

        // CRASH WINDOW: between store() above (which increments the refcount)
        // and write_git() below (which writes the stub into git), a hard crash
        // (OOM, SIGKILL) leaves refcount >= 1 with no git stub referencing the
        // blob — a permanent orphan unreachable by GC. The graceful Err path
        // below calls release() to undo the refcount, but a hard crash bypasses
        // it.
        // TODO: implement orphan reconciliation — a startup sweep or `stash fsck`
        // command should walk blob_refs and release rows whose SHA appears in no
        // git commit.
        tracing::warn!(
            sha = %blob_ref.sha256,
            "write_blob_tier: refcount incremented — crash before write_git completes leaves orphan blob"
        );

        let stub_bytes = Bytes::from(write_stub(&BlobStub {
            sha256: blob_ref.sha256.clone(),
            size: blob_ref.size,
            mime: mime.clone(),
            original_name: path.as_str().to_string(),
            uploaded_by: ident.to_string(),
        })?);

        match self.write_git(path, stub_bytes, ident, msg).await {
            Ok(mut git_ver) => {
                git_ver.size = size;
                git_ver.mime = mime;
                git_ver.tier = StorageTier::Blob;
                Ok(git_ver)
            }
            Err(e) => {
                // Best-effort rollback: decrement refcount so GC can eventually
                // reclaim the blob. If this also fails, the blob is over-counted
                // but safe — GC won't touch blobs with refcount > 0.
                let _ = self.blob_store.release(&blob_ref.sha256).await;
                Err(e)
            }
        }
    }

    /// Write bytes directly into git. Caller MUST hold `write_lock`.
    async fn write_git(
        &self,
        path: &StashPath,
        bytes: Bytes,
        ident: &Identity,
        msg: Option<String>,
    ) -> StashResult<FileVersion> {
        let path = path.clone();
        let ident = ident.clone();
        let message = msg.unwrap_or_else(|| format!("stash: write {}", path));
        let size = bytes.len() as u64;
        let mime = super::read::sniff_mime(path.as_str());
        let repo_path = self.repo_path.clone();
        let buf = bytes.clone();
        let path_str = path.as_str().to_string();
        let msg_c = message.clone();
        let ident_c = ident.clone();

        let out = git_helpers::blocking(move || {
            git_helpers::commit_file(git_helpers::CommitInput {
                repo_path: &repo_path,
                path: &path_str,
                blob: &buf,
                author: &ident_c,
                message: &msg_c,
            })
        })
        .await?;

        Ok(FileVersion {
            path,
            sha: out.blob_sha,
            commit: out.commit_sha,
            size,
            mime,
            author: ident,
            timestamp: out.timestamp,
            message: Some(message),
            tier: StorageTier::Git,
        })
    }

    /// Read raw bytes from the git tree (skips blob hydration). Used by delete.
    pub(crate) async fn read_raw_git(
        &self,
        path: &StashPath,
    ) -> StashResult<(stash_types::Sha, Bytes)> {
        let repo_path = self.repo_path.clone();
        let path_c = path.clone();
        let out =
            git_helpers::blocking(move || git_helpers::read_at(&repo_path, &path_c, None)).await?;
        let out = out.ok_or(stash_types::StashError::NotFound { path: path.clone() })?;
        Ok((out.blob_sha, Bytes::from(out.bytes)))
    }
}

#[cfg(test)]
mod tests {
    use crate::config::StashConfig;
    use crate::StashRepo;
    use bytes::Bytes;
    use stash_types::{Identity, StashPath, StorageTier};

    fn id() -> Identity {
        Identity::new("claude", "tootie").unwrap()
    }

    #[tokio::test]
    async fn write_creates_commit_and_returns_version() {
        let td = tempfile::tempdir().unwrap();
        let r = StashRepo::init(td.path(), StashConfig::default())
            .await
            .unwrap();
        let p = StashPath::parse("docs/plan.md").unwrap();
        let v = r
            .write(&p, Bytes::from("hello"), &id(), Some("first".into()))
            .await
            .unwrap();
        assert_eq!(v.path, p);
        assert_eq!(v.size, 5);
        assert_eq!(v.tier, StorageTier::Git);
        assert_eq!(v.author, id());
        assert_eq!(v.message.as_deref(), Some("first"));
        assert!(v.mime.starts_with("text/") || v.mime == "application/octet-stream");
    }

    #[tokio::test]
    async fn write_twice_produces_different_commits() {
        let td = tempfile::tempdir().unwrap();
        let r = StashRepo::init(td.path(), StashConfig::default())
            .await
            .unwrap();
        let p = StashPath::parse("a.md").unwrap();
        let v1 = r.write(&p, Bytes::from("one"), &id(), None).await.unwrap();
        let v2 = r.write(&p, Bytes::from("two"), &id(), None).await.unwrap();
        assert_ne!(v1.commit, v2.commit);
        assert_ne!(v1.sha, v2.sha);
    }

    #[tokio::test]
    async fn write_default_message_is_generated() {
        let td = tempfile::tempdir().unwrap();
        let r = StashRepo::init(td.path(), StashConfig::default())
            .await
            .unwrap();
        let p = StashPath::parse("docs/x.md").unwrap();
        let v = r.write(&p, Bytes::from("hi"), &id(), None).await.unwrap();
        assert_eq!(v.message.as_deref(), Some("stash: write docs/x.md"));
    }

    #[tokio::test]
    async fn write_serializes_under_mutex() {
        use std::sync::Arc;
        let td = tempfile::tempdir().unwrap();
        let r = Arc::new(
            StashRepo::init(td.path(), StashConfig::default())
                .await
                .unwrap(),
        );
        let mut handles = vec![];
        for i in 0..10 {
            let r = Arc::clone(&r);
            let ident = id();
            handles.push(tokio::spawn(async move {
                let p = StashPath::parse(format!("docs/{i}.md")).unwrap();
                r.write(&p, Bytes::from(format!("{i}")), &ident, None).await
            }));
        }
        for h in handles {
            h.await.unwrap().unwrap();
        }
    }

    #[tokio::test]
    async fn write_small_text_stays_in_git_tier() {
        let td = tempfile::tempdir().unwrap();
        let r = StashRepo::init(td.path(), StashConfig::default())
            .await
            .unwrap();
        let p = StashPath::parse("docs/plan.md").unwrap();
        let v = r
            .write(&p, Bytes::from("hello"), &id(), None)
            .await
            .unwrap();
        assert_eq!(v.tier, StorageTier::Git);
        assert!(!td.path().join("blobs").exists());
    }

    #[tokio::test]
    async fn write_large_file_routes_to_blob_tier() {
        let td = tempfile::tempdir().unwrap();
        let mut cfg = StashConfig::default();
        cfg.blob.max_git_bytes = 10;
        cfg.blob.blob_mime_prefixes = vec![];
        cfg.blob.blob_path_globs = vec![];
        let r = StashRepo::init(td.path(), cfg).await.unwrap();
        let p = StashPath::parse("data/big.bin").unwrap();
        let big = Bytes::from(vec![0u8; 20]);
        let v = r.write(&p, big.clone(), &id(), None).await.unwrap();
        assert_eq!(v.tier, StorageTier::Blob);
        assert_eq!(v.size, 20);
        assert!(td.path().join("blobs").exists());
    }

    #[tokio::test]
    async fn write_blob_tier_stub_is_in_git() {
        use crate::blob::stub::is_blob_stub;
        let td = tempfile::tempdir().unwrap();
        let mut cfg = StashConfig::default();
        cfg.blob.max_git_bytes = 5;
        cfg.blob.blob_mime_prefixes = vec![];
        cfg.blob.blob_path_globs = vec![];
        let r = StashRepo::init(td.path(), cfg).await.unwrap();
        let p = StashPath::parse("data/file.bin").unwrap();
        r.write(&p, Bytes::from(b"123456789" as &[u8]), &id(), None)
            .await
            .unwrap();
        let (_sha, raw) = r.read_raw_git(&p).await.unwrap();
        assert!(is_blob_stub(&raw));
    }
}
