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

        Ok(FileVersion {
            path: path_c,
            sha: Sha::parse("0".repeat(40)).unwrap(),
            commit: out.commit_sha,
            size: 0,
            mime: "application/x-stash-tombstone".into(),
            author: ident.clone(),
            timestamp: out.timestamp,
            message: Some(message),
            tier: StorageTier::Git,
        })
    }
}

#[cfg(test)]
mod tests {
    use crate::StashRepo;
    use crate::config::StashConfig;
    use bytes::Bytes;
    use stash_types::{Identity, StashError, StashPath};

    fn id() -> Identity {
        Identity::new("claude", "tootie").unwrap()
    }

    #[tokio::test]
    async fn delete_removes_file_from_head() {
        let td = tempfile::tempdir().unwrap();
        let r = StashRepo::init(td.path(), StashConfig::default()).await.unwrap();
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
        let r = StashRepo::init(td.path(), StashConfig::default()).await.unwrap();
        let err = r
            .delete(&StashPath::parse("nope.md").unwrap(), &id(), None)
            .await
            .unwrap_err();
        assert!(matches!(err, StashError::NotFound { .. }));
    }

    #[tokio::test]
    async fn deleted_file_readable_at_prior_commit() {
        let td = tempfile::tempdir().unwrap();
        let r = StashRepo::init(td.path(), StashConfig::default()).await.unwrap();
        let p = StashPath::parse("docs/x.md").unwrap();
        let v1 = r.write(&p, Bytes::from("orig"), &id(), None).await.unwrap();
        r.delete(&p, &id(), None).await.unwrap();
        let (_, bytes) = r.read(&p, Some(v1.commit)).await.unwrap();
        assert_eq!(&bytes[..], b"orig");
    }
}
