use super::{git as git_helpers, StashRepo};
use stash_types::{
    Cursor, FileVersion, Identity, Page, Sha, StashError, StashPath, StashResult, StorageTier,
};

impl StashRepo {
    pub async fn history(
        &self,
        path: &StashPath,
        cursor: Option<Cursor>,
        limit: usize,
    ) -> StashResult<Page<FileVersion>> {
        let limit = limit.clamp(1, 500);
        let skip = cursor
            .as_ref()
            .map(|c| {
                c.0.parse::<usize>().map_err(|_| StashError::InvalidInput {
                    field: "cursor".into(),
                    reason: "not a number".into(),
                })
            })
            .transpose()?
            .unwrap_or(0);

        let repo_path = self.repo_path.clone();
        let path_s = path.as_str().to_string();
        let (entries, has_more) = git_helpers::blocking(move || {
            git_helpers::walk_history(&repo_path, &path_s, skip, limit)
        })
        .await?;

        let mut out = Vec::with_capacity(entries.len());
        for e in entries {
            let ident = Identity::parse(&e.author_name)
                .unwrap_or_else(|_| Identity::new("unknown", "unknown").unwrap());
            out.push(FileVersion {
                path: path.clone(),
                sha: e
                    .blob_sha
                    .unwrap_or_else(|| Sha::parse("0".repeat(40)).unwrap()),
                commit: e.commit_sha,
                size: e.size,
                mime: super::read::sniff_mime(path.as_str()),
                author: ident,
                timestamp: e.timestamp,
                message: e.message,
                tier: StorageTier::Git,
            });
        }

        let next = if has_more {
            Some(Cursor((skip + out.len()).to_string()))
        } else {
            None
        };
        Ok(Page::new(out, next))
    }
}

#[cfg(test)]
mod tests {
    use crate::config::StashConfig;
    use crate::StashRepo;
    use bytes::Bytes;
    use stash_types::{Identity, StashPath};

    fn id() -> Identity {
        Identity::new("claude", "tootie").unwrap()
    }

    #[tokio::test]
    async fn history_newest_first() {
        let td = tempfile::tempdir().unwrap();
        let r = StashRepo::init(td.path(), StashConfig::default())
            .await
            .unwrap();
        let p = StashPath::parse("x.md").unwrap();
        let v1 = r
            .write(&p, Bytes::from("one"), &id(), Some("1".into()))
            .await
            .unwrap();
        let v2 = r
            .write(&p, Bytes::from("two"), &id(), Some("2".into()))
            .await
            .unwrap();
        let v3 = r
            .write(&p, Bytes::from("three"), &id(), Some("3".into()))
            .await
            .unwrap();
        let page = r.history(&p, None, 10).await.unwrap();
        let cs: Vec<_> = page.entries.iter().map(|v| v.commit.clone()).collect();
        assert_eq!(cs, vec![v3.commit, v2.commit, v1.commit]);
    }

    #[tokio::test]
    async fn history_paginates() {
        let td = tempfile::tempdir().unwrap();
        let r = StashRepo::init(td.path(), StashConfig::default())
            .await
            .unwrap();
        let p = StashPath::parse("x.md").unwrap();
        for i in 0..4 {
            r.write(&p, Bytes::from(format!("{i}")), &id(), None)
                .await
                .unwrap();
        }
        let p1 = r.history(&p, None, 2).await.unwrap();
        assert_eq!(p1.entries.len(), 2);
        let p2 = r.history(&p, p1.next_cursor.clone(), 2).await.unwrap();
        assert_eq!(p2.entries.len(), 2);
        assert_eq!(p2.next_cursor, None);
    }
}
