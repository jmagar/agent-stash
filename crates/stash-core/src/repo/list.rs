use super::{git as git_helpers, StashRepo};
use stash_types::{
    Cursor, FileVersion, Identity, Page, Sha, StashError, StashPath, StashResult, StorageTier,
};

impl StashRepo {
    pub async fn list(
        &self,
        prefix: &StashPath,
        at: Option<Sha>,
        glob: Option<&str>,
        cursor: Option<Cursor>,
        limit: usize,
    ) -> StashResult<Page<FileVersion>> {
        let limit = limit.clamp(1, 500);
        let repo_path = self.repo_path.clone();
        let prefix_s = prefix.as_str().to_string();
        let at_c = at.clone();

        let entries = git_helpers::blocking(move || {
            git_helpers::list_tree(&repo_path, &prefix_s, at_c.as_ref())
        })
        .await?;

        let matcher = glob
            .map(|g| {
                glob::Pattern::new(g).map_err(|e| StashError::InvalidInput {
                    field: "glob".into(),
                    reason: e.to_string(),
                })
            })
            .transpose()?;

        let filtered: Vec<_> = entries
            .into_iter()
            .filter(|e| matcher.as_ref().is_none_or(|m| m.matches(&e.path)))
            .collect();

        let start = cursor
            .as_ref()
            .map(|c| {
                c.0.parse::<usize>().map_err(|_| StashError::InvalidInput {
                    field: "cursor".into(),
                    reason: "not a number".into(),
                })
            })
            .transpose()?
            .unwrap_or(0);

        let slice: Vec<_> = filtered.iter().skip(start).take(limit).collect();

        let mut out = Vec::with_capacity(slice.len());
        for e in &slice {
            out.push(FileVersion {
                path: StashPath::parse(&e.path)?,
                sha: e.blob_sha.clone(),
                commit: Sha::parse("0".repeat(40)).unwrap(), // filled by history()
                size: e.size,
                mime: super::read::sniff_mime(&e.path),
                author: Identity::new("unknown", "unknown").unwrap(),
                timestamp: chrono::Utc::now(), // filled by history()
                message: None,
                tier: StorageTier::Git,
            });
        }

        let next = if start + slice.len() < filtered.len() {
            Some(Cursor((start + slice.len()).to_string()))
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

    async fn seed(r: &StashRepo, paths: &[&str]) {
        for p in paths {
            r.write(
                &StashPath::parse(p).unwrap(),
                Bytes::from(format!("x-{p}")),
                &id(),
                None,
            )
            .await
            .unwrap();
        }
    }

    #[tokio::test]
    async fn list_at_prefix_returns_matching_files() {
        let td = tempfile::tempdir().unwrap();
        let r = StashRepo::init(td.path(), StashConfig::default())
            .await
            .unwrap();
        seed(
            &r,
            &["docs/a.md", "docs/b.md", "docs/sub/c.md", "README.md"],
        )
        .await;
        let page = r
            .list(&StashPath::parse("docs").unwrap(), None, None, None, 100)
            .await
            .unwrap();
        let got: Vec<_> = page.entries.iter().map(|v| v.path.as_str()).collect();
        assert!(got.contains(&"docs/a.md"));
        assert!(got.contains(&"docs/b.md"));
        assert!(got.contains(&"docs/sub/c.md"));
        assert!(!got.contains(&"readme.md"));
        assert_eq!(page.next_cursor, None);
    }

    #[tokio::test]
    async fn list_with_glob_filters_matches() {
        let td = tempfile::tempdir().unwrap();
        let r = StashRepo::init(td.path(), StashConfig::default())
            .await
            .unwrap();
        seed(&r, &["docs/a.md", "docs/b.txt", "docs/sub/c.md"]).await;
        let page = r
            .list(
                &StashPath::parse("docs").unwrap(),
                None,
                Some("**/*.md"),
                None,
                100,
            )
            .await
            .unwrap();
        let got: Vec<_> = page.entries.iter().map(|v| v.path.as_str()).collect();
        assert_eq!(got, vec!["docs/a.md", "docs/sub/c.md"]);
    }

    #[tokio::test]
    async fn list_paginates_with_stable_ordering() {
        let td = tempfile::tempdir().unwrap();
        let r = StashRepo::init(td.path(), StashConfig::default())
            .await
            .unwrap();
        let names: Vec<String> = (0..5).map(|i| format!("d/{i:02}.md")).collect();
        seed(&r, &names.iter().map(|s| s.as_str()).collect::<Vec<_>>()).await;
        let p1 = r
            .list(&StashPath::parse("d").unwrap(), None, None, None, 2)
            .await
            .unwrap();
        assert_eq!(p1.entries.len(), 2);
        let c1 = p1.next_cursor.clone().expect("cursor on first page");
        let p2 = r
            .list(&StashPath::parse("d").unwrap(), None, None, Some(c1), 2)
            .await
            .unwrap();
        assert_eq!(p2.entries.len(), 2);
        let c2 = p2.next_cursor.clone().expect("cursor on second page");
        let p3 = r
            .list(&StashPath::parse("d").unwrap(), None, None, Some(c2), 2)
            .await
            .unwrap();
        assert_eq!(p3.entries.len(), 1);
        assert_eq!(p3.next_cursor, None);
    }
}
