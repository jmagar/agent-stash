use bytes::Bytes;
use stash_types::{FileVersion, Identity, Sha, StashError, StashPath, StashResult, StorageTier};
use super::{git as git_helpers, StashRepo};

impl StashRepo {
    pub async fn read(
        &self,
        path: &StashPath,
        at:   Option<Sha>,
    ) -> StashResult<(FileVersion, Bytes)> {
        let path = path.clone();
        let repo_path = self.repo_path.clone();
        let path_for_err = path.clone();

        let out = git_helpers::blocking(move || git_helpers::read_at(&repo_path, &path, at.as_ref())).await?;
        let out = out.ok_or(StashError::NotFound { path: path_for_err.clone() })?;

        let ident = Identity::parse(&out.author_name)
            .unwrap_or_else(|_| Identity::new("unknown", "unknown").unwrap());

        let version = FileVersion {
            path: path_for_err.clone(),
            sha: out.blob_sha,
            commit: out.commit_sha,
            size: out.size,
            mime: sniff_mime(path_for_err.as_str()),
            author: ident,
            timestamp: out.timestamp,
            message: out.message,
            tier: StorageTier::Git,
        };
        Ok((version, Bytes::from(out.bytes)))
    }
}

pub(crate) fn sniff_mime(path: &str) -> String {
    match path.rsplit_once('.').map(|(_, ext)| ext) {
        Some("md")                 => "text/markdown",
        Some("json")               => "application/json",
        Some("toml")               => "application/toml",
        Some("yaml") | Some("yml") => "application/yaml",
        Some("txt") | Some("log")  => "text/plain",
        _                          => "application/octet-stream",
    }.to_string()
}

#[cfg(test)]
mod tests {
    use crate::StashRepo;
    use bytes::Bytes;
    use stash_types::{Identity, StashError, StashPath};

    fn id() -> Identity { Identity::new("claude", "tootie").unwrap() }

    #[tokio::test]
    async fn read_returns_latest_bytes_and_version() {
        let td = tempfile::tempdir().unwrap();
        let r = StashRepo::init(td.path()).await.unwrap();
        let p = StashPath::parse("docs/x.md").unwrap();
        r.write(&p, Bytes::from("one"), &id(), None).await.unwrap();
        let v2 = r.write(&p, Bytes::from("two"), &id(), None).await.unwrap();
        let (got_v, got_bytes) = r.read(&p, None).await.unwrap();
        assert_eq!(got_v.commit, v2.commit);
        assert_eq!(&got_bytes[..], b"two");
    }

    #[tokio::test]
    async fn read_at_specific_commit_returns_historic_bytes() {
        let td = tempfile::tempdir().unwrap();
        let r = StashRepo::init(td.path()).await.unwrap();
        let p = StashPath::parse("docs/x.md").unwrap();
        let v1 = r.write(&p, Bytes::from("one"), &id(), None).await.unwrap();
        r.write(&p, Bytes::from("two"), &id(), None).await.unwrap();
        let (got_v, got_bytes) = r.read(&p, Some(v1.commit.clone())).await.unwrap();
        assert_eq!(got_v.commit, v1.commit);
        assert_eq!(&got_bytes[..], b"one");
    }

    #[tokio::test]
    async fn read_missing_returns_not_found() {
        let td = tempfile::tempdir().unwrap();
        let r = StashRepo::init(td.path()).await.unwrap();
        let p = StashPath::parse("docs/missing.md").unwrap();
        let err = r.read(&p, None).await.unwrap_err();
        assert!(matches!(err, StashError::NotFound { .. }));
    }
}
