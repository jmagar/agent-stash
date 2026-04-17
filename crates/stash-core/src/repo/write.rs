use bytes::Bytes;
use stash_types::{FileVersion, Identity, StashPath, StashResult, StorageTier};
use super::{git as git_helpers, StashRepo};

impl StashRepo {
    pub async fn write(
        &self,
        path:  &StashPath,
        bytes: Bytes,
        ident: &Identity,
        msg:   Option<String>,
    ) -> StashResult<FileVersion> {
        let _g = self.write_lock.lock().await;

        let path     = path.clone();
        let ident    = ident.clone();
        let message  = msg.unwrap_or_else(|| format!("stash: write {}", path));
        let size     = bytes.len() as u64;
        let mime     = sniff_mime(path.as_str(), &bytes);
        let repo_path = self.repo_path.clone();
        let buf      = bytes.clone();
        let path_str = path.as_str().to_string();
        let msg_c    = message.clone();
        let ident_c  = ident.clone();

        let out = git_helpers::blocking(move || {
            git_helpers::commit_file(git_helpers::CommitInput {
                repo_path: &repo_path,
                path:      &path_str,
                blob:      &buf,
                author:    &ident_c,
                message:   &msg_c,
            })
        })
        .await?;

        Ok(FileVersion {
            path,
            sha:       out.blob_sha,
            commit:    out.commit_sha,
            size,
            mime,
            author:    ident,
            timestamp: out.timestamp,
            message:   Some(message),
            tier:      StorageTier::Git,
        })
    }
}

fn sniff_mime(path: &str, _bytes: &[u8]) -> String {
    match path.rsplit_once('.').map(|(_, ext)| ext) {
        Some("md")                         => "text/markdown",
        Some("json")                       => "application/json",
        Some("toml")                       => "application/toml",
        Some("yaml") | Some("yml")         => "application/yaml",
        Some("txt") | Some("log")          => "text/plain",
        _                                  => "application/octet-stream",
    }.to_string()
}

#[cfg(test)]
mod tests {
    use crate::StashRepo;
    use bytes::Bytes;
    use stash_types::{Identity, StashPath, StorageTier};

    fn id() -> Identity { Identity::new("claude", "tootie").unwrap() }

    #[tokio::test]
    async fn write_creates_commit_and_returns_version() {
        let td = tempfile::tempdir().unwrap();
        let r = StashRepo::init(td.path()).await.unwrap();
        let p = StashPath::parse("docs/plan.md").unwrap();
        let v = r.write(&p, Bytes::from("hello"), &id(), Some("first".into()))
                 .await.unwrap();
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
        let r = StashRepo::init(td.path()).await.unwrap();
        let p = StashPath::parse("a.md").unwrap();
        let v1 = r.write(&p, Bytes::from("one"), &id(), None).await.unwrap();
        let v2 = r.write(&p, Bytes::from("two"), &id(), None).await.unwrap();
        assert_ne!(v1.commit, v2.commit);
        assert_ne!(v1.sha,    v2.sha);
    }

    #[tokio::test]
    async fn write_default_message_is_generated() {
        let td = tempfile::tempdir().unwrap();
        let r = StashRepo::init(td.path()).await.unwrap();
        let p = StashPath::parse("docs/x.md").unwrap();
        let v = r.write(&p, Bytes::from("hi"), &id(), None).await.unwrap();
        assert_eq!(v.message.as_deref(), Some("stash: write docs/x.md"));
    }

    #[tokio::test]
    async fn write_serializes_under_mutex() {
        use std::sync::Arc;
        let td = tempfile::tempdir().unwrap();
        let r = Arc::new(StashRepo::init(td.path()).await.unwrap());
        let mut handles = vec![];
        for i in 0..10 {
            let r = Arc::clone(&r);
            let ident = id();
            handles.push(tokio::spawn(async move {
                let p = StashPath::parse(format!("docs/{i}.md")).unwrap();
                r.write(&p, Bytes::from(format!("{i}")), &ident, None).await
            }));
        }
        for h in handles { h.await.unwrap().unwrap(); }
    }
}
