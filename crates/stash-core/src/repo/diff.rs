use super::{git as git_helpers, StashRepo};
use stash_types::{DiffText, Sha, StashPath, StashResult};

impl StashRepo {
    pub async fn diff(
        &self,
        path: &StashPath,
        from: &Sha,
        to: Option<&Sha>,
    ) -> StashResult<DiffText> {
        let repo_path = self.repo_path.clone();
        let path_s = path.as_str().to_string();
        let from_c = from.clone();
        let to_c = to.cloned();

        let unified =
            git_helpers::blocking(move || diff_blobs(&repo_path, &path_s, &from_c, to_c.as_ref()))
                .await?;
        Ok(DiffText { unified })
    }
}

fn diff_blobs(
    repo_path: &std::path::Path,
    path: &str,
    from: &Sha,
    to: Option<&Sha>,
) -> Result<String, git2::Error> {
    let repo = git2::Repository::open_bare(repo_path)?;

    let load = |sha: &Sha| -> Result<Vec<u8>, git2::Error> {
        let commit = repo.find_commit(git2::Oid::from_str(sha.as_str())?)?;
        let tree = commit.tree()?;
        match tree.get_path(std::path::Path::new(path)) {
            Ok(e) => Ok(repo.find_blob(e.id())?.content().to_vec()),
            Err(e) if e.code() == git2::ErrorCode::NotFound => Ok(vec![]),
            Err(e) => Err(e),
        }
    };

    let old = load(from)?;
    let new = match to {
        Some(sha) => load(sha)?,
        None => {
            let head = repo.head()?.peel_to_commit()?;
            let tree = head.tree()?;
            match tree.get_path(std::path::Path::new(path)) {
                Ok(e) => repo.find_blob(e.id())?.content().to_vec(),
                Err(e) if e.code() == git2::ErrorCode::NotFound => vec![],
                Err(e) => return Err(e),
            }
        }
    };

    if old == new {
        return Ok(String::new());
    }

    let mut buf = String::new();
    let mut opts = git2::DiffOptions::new();
    repo.diff_blobs(
        Some(&repo.find_blob(repo.blob(&old)?)?),
        Some(path),
        Some(&repo.find_blob(repo.blob(&new)?)?),
        Some(path),
        Some(&mut opts),
        None,
        None,
        None,
        Some(&mut |_delta, _hunk, line: git2::DiffLine<'_>| -> bool {
            let marker = line.origin();
            if matches!(marker, '+' | '-' | ' ') {
                buf.push(marker);
            }
            buf.push_str(std::str::from_utf8(line.content()).unwrap_or(""));
            true
        }),
    )?;
    Ok(buf)
}

#[cfg(test)]
mod tests {
    use crate::StashRepo;
    use bytes::Bytes;
    use stash_types::{Identity, StashPath};

    fn id() -> Identity {
        Identity::new("claude", "tootie").unwrap()
    }

    #[tokio::test]
    async fn diff_shows_unified_output_between_commits() {
        let td = tempfile::tempdir().unwrap();
        let r = StashRepo::init(td.path()).await.unwrap();
        let p = StashPath::parse("x.md").unwrap();
        let v1 = r
            .write(&p, Bytes::from("hello\n"), &id(), None)
            .await
            .unwrap();
        let v2 = r
            .write(&p, Bytes::from("goodbye\n"), &id(), None)
            .await
            .unwrap();
        let d = r.diff(&p, &v1.commit, Some(&v2.commit)).await.unwrap();
        assert!(d.unified.contains("-hello"));
        assert!(d.unified.contains("+goodbye"));
    }

    #[tokio::test]
    async fn diff_empty_when_same_content() {
        let td = tempfile::tempdir().unwrap();
        let r = StashRepo::init(td.path()).await.unwrap();
        let p = StashPath::parse("x.md").unwrap();
        let v = r
            .write(&p, Bytes::from("one\n"), &id(), None)
            .await
            .unwrap();
        let d = r.diff(&p, &v.commit, Some(&v.commit)).await.unwrap();
        assert_eq!(d.unified, "");
    }

    #[tokio::test]
    async fn diff_to_head_when_to_omitted() {
        let td = tempfile::tempdir().unwrap();
        let r = StashRepo::init(td.path()).await.unwrap();
        let p = StashPath::parse("x.md").unwrap();
        let v1 = r
            .write(&p, Bytes::from("one\n"), &id(), None)
            .await
            .unwrap();
        r.write(&p, Bytes::from("two\n"), &id(), None)
            .await
            .unwrap();
        let d = r.diff(&p, &v1.commit, None).await.unwrap();
        assert!(d.unified.contains("-one"));
        assert!(d.unified.contains("+two"));
    }
}
