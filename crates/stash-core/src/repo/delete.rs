use super::{git as git_helpers, StashRepo};
use stash_types::{FileVersion, Identity, Sha, StashError, StashPath, StashResult, StorageTier};

impl StashRepo {
    pub async fn delete(
        &self,
        path: &StashPath,
        ident: &Identity,
        msg: Option<String>,
    ) -> StashResult<FileVersion> {
        let _g = self.write_lock.lock().await;

        // Read current git blob to detect blob-tier stub before tombstoning.
        let (_, raw) = self.read_raw_git(path).await?;

        // Use full stub parsing (not just a header-prefix check) so that a
        // user-crafted git file starting with the magic header cannot trigger a
        // refcount decrement for an arbitrary SHA. `parse_stub` validates the
        // full structure including a hex-only SHA field before we trust it.
        // Best-effort: if the stub is malformed, log a warning and continue
        // without releasing the refcount. The blob will be over-counted until a
        // future repair utility reconciles it; this is preferable to blocking the
        // delete.
        let blob_sha: Option<String> = match crate::blob::stub::parse_stub(&raw) {
            Ok(stub) => Some(stub.sha256),
            Err(_) => None,
        };
        let tier = if blob_sha.is_some() {
            StorageTier::Blob
        } else {
            StorageTier::Git
        };

        let path_c = path.clone();
        let ident_c = ident.clone();
        let message = msg.unwrap_or_else(|| format!("stash: delete {}", path));
        let repo_path = self.repo_path.clone();
        let path_str = path.as_str().to_string();
        let msg_c = message.clone();

        let out = git_helpers::blocking(move || {
            git_helpers::delete_file(&repo_path, &path_str, &ident_c, &msg_c)
        })
        .await?
        .ok_or(StashError::NotFound {
            path: path_c.clone(),
        })?;

        // Release blob refcount after git commit succeeds.
        //
        // Safety reasoning: `release()` only decrements the refcount in the DB;
        // it does NOT immediately delete the blob file. The GC sweeper only
        // removes blobs whose refcount has been zero AND whose `last_ref_at`
        // timestamp is older than `gc_grace_days` (default: 7 days). Historical
        // git commits that still reference this blob therefore remain readable
        // throughout the grace period. If the operator needs longer retention,
        // `gc_grace_days` can be raised in `StashConfig`. This design means
        // calling `release()` here is safe even when history exists.
        if let Some(sha) = blob_sha {
            // The git tombstone is already committed (irreversible at this point).
            // Propagating a release() error via `?` would make the caller see a
            // failure even though the delete succeeded, and on retry the refcount
            // decrement would be lost — leaving the blob permanently over-counted
            // and GC-ineligible. Warn-and-continue is the correct policy here.
            if let Err(e) = self.blob_store.release(&sha).await {
                tracing::warn!(
                    sha = %sha,
                    error = ?e,
                    "delete: refcount release failed after git commit — blob over-counted until reconciled"
                );
            }
        }

        Ok(FileVersion {
            path: path_c,
            sha: Sha::parse("0".repeat(40)).unwrap(),
            commit: out.commit_sha,
            size: 0,
            mime: "application/x-stash-tombstone".into(),
            author: ident.clone(),
            timestamp: out.timestamp,
            message: Some(message),
            tier,
        })
    }
}

#[cfg(test)]
mod tests {
    use crate::config::StashConfig;
    use crate::StashRepo;
    use bytes::Bytes;
    use stash_types::{Identity, StashError, StashPath};

    fn id() -> Identity {
        Identity::new("claude", "tootie").unwrap()
    }

    #[tokio::test]
    async fn delete_removes_file_from_head() {
        let td = tempfile::tempdir().unwrap();
        let r = StashRepo::init(td.path(), StashConfig::default())
            .await
            .unwrap();
        let p = StashPath::parse("docs/x.md").unwrap();
        r.write(&p, Bytes::from("hi"), &id(), None).await.unwrap();
        let v = r.delete(&p, &id(), Some("gone".into())).await.unwrap();
        assert_eq!(v.size, 0);
        assert_eq!(v.message.as_deref(), Some("gone"));
        let err = r.read(&p, None).await.unwrap_err();
        assert!(matches!(err, StashError::NotFound { .. }));
    }

    #[tokio::test]
    async fn delete_missing_returns_not_found() {
        let td = tempfile::tempdir().unwrap();
        let r = StashRepo::init(td.path(), StashConfig::default())
            .await
            .unwrap();
        let err = r
            .delete(&StashPath::parse("nope.md").unwrap(), &id(), None)
            .await
            .unwrap_err();
        assert!(matches!(err, StashError::NotFound { .. }));
    }

    #[tokio::test]
    async fn deleted_file_readable_at_prior_commit() {
        let td = tempfile::tempdir().unwrap();
        let r = StashRepo::init(td.path(), StashConfig::default())
            .await
            .unwrap();
        let p = StashPath::parse("docs/x.md").unwrap();
        let v1 = r.write(&p, Bytes::from("orig"), &id(), None).await.unwrap();
        r.delete(&p, &id(), None).await.unwrap();
        let (_, bytes) = r.read(&p, Some(v1.commit)).await.unwrap();
        assert_eq!(&bytes[..], b"orig");
    }

    #[tokio::test]
    async fn delete_blob_tier_decrements_refcount() {
        let td = tempfile::tempdir().unwrap();
        let mut cfg = StashConfig::default();
        cfg.blob.max_git_bytes = 5;
        cfg.blob.blob_mime_prefixes = vec![];
        cfg.blob.blob_path_globs = vec![];
        let r = StashRepo::init(td.path(), cfg).await.unwrap();
        let p = StashPath::parse("data/file.bin").unwrap();
        r.write(&p, Bytes::from(b"ABCDEFGH" as &[u8]), &id(), None)
            .await
            .unwrap();
        r.delete(&p, &id(), None).await.unwrap();
        assert!(matches!(
            r.read(&p, None).await.unwrap_err(),
            stash_types::StashError::NotFound { .. }
        ));
    }
}
