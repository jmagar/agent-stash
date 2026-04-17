use regex::Regex;
use stash_types::{SearchHit, StashError, StashPath, StashResult};
use crate::repo::{git as git_helpers, StashRepo};

impl StashRepo {
    pub async fn search(
        &self,
        query: &str,
        glob:  Option<&str>,
        limit: usize,
    ) -> StashResult<Vec<SearchHit>> {
        let limit = limit.clamp(1, 500);
        let re = Regex::new(query).map_err(|e| StashError::InvalidInput {
            field: "query".into(), reason: e.to_string() })?;
        let matcher = glob.map(|g| glob::Pattern::new(g)
            .map_err(|e| StashError::InvalidInput {
                field: "glob".into(), reason: e.to_string() }))
            .transpose()?;

        let repo_path = self.repo_path().to_path_buf();
        let entries = git_helpers::blocking(move || {
            git_helpers::list_tree(&repo_path, "", None)
        }).await?;

        let repo_path = self.repo_path().to_path_buf();
        let filtered: Vec<_> = entries.into_iter()
            .filter(|e| matcher.as_ref().map_or(true, |m| m.matches(&e.path)))
            .collect();

        let hits = git_helpers::blocking(move || -> Result<Vec<SearchHit>, git2::Error> {
            let repo = git2::Repository::open_bare(&repo_path)?;
            let mut out = vec![];
            for e in filtered {
                if out.len() >= limit { break; }
                let blob = repo.find_blob(git2::Oid::from_str(e.blob_sha.as_str()).unwrap())?;
                let content = match std::str::from_utf8(blob.content()) {
                    Ok(s) => s, Err(_) => continue,
                };
                for (i, line) in content.lines().enumerate() {
                    if out.len() >= limit { break; }
                    if re.is_match(line) {
                        out.push(SearchHit {
                            path:    StashPath::parse(&e.path).unwrap(),
                            line:    (i + 1) as u32,
                            snippet: line.chars().take(200).collect(),
                            sha:     e.blob_sha.clone(),
                        });
                    }
                }
            }
            Ok(out)
        }).await?;

        Ok(hits)
    }
}

#[cfg(test)]
mod tests {
    use crate::StashRepo;
    use bytes::Bytes;
    use stash_types::{Identity, StashPath};

    fn id() -> Identity { Identity::new("claude", "tootie").unwrap() }

    async fn seed(r: &StashRepo, entries: &[(&str, &str)]) {
        for (p, body) in entries {
            r.write(&StashPath::parse(p).unwrap(),
                    Bytes::copy_from_slice(body.as_bytes()), &id(), None).await.unwrap();
        }
    }

    #[tokio::test]
    async fn search_returns_hits_with_line_and_snippet() {
        let td = tempfile::tempdir().unwrap();
        let r = StashRepo::init(td.path()).await.unwrap();
        seed(&r, &[
            ("a.md", "hello\nworld\nhello again\n"),
            ("b.md", "no match here\n"),
        ]).await;
        let hits = r.search("hello", None, 10).await.unwrap();
        assert_eq!(hits.len(), 2);
        assert!(hits.iter().all(|h| h.path.as_str() == "a.md"));
        assert_eq!(hits[0].line, 1);
        assert_eq!(hits[1].line, 3);
        assert!(hits[0].snippet.contains("hello"));
    }

    #[tokio::test]
    async fn search_filters_by_glob() {
        let td = tempfile::tempdir().unwrap();
        let r = StashRepo::init(td.path()).await.unwrap();
        seed(&r, &[("docs/a.md", "foo\n"), ("docs/a.txt", "foo\n")]).await;
        let hits = r.search("foo", Some("**/*.md"), 10).await.unwrap();
        assert_eq!(hits.len(), 1);
        assert_eq!(hits[0].path.as_str(), "docs/a.md");
    }

    #[tokio::test]
    async fn search_respects_limit() {
        let td = tempfile::tempdir().unwrap();
        let r = StashRepo::init(td.path()).await.unwrap();
        let body = (0..5).map(|i| format!("x{i}\n")).collect::<String>();
        seed(&r, &[("a.md", &body)]).await;
        let hits = r.search("x", None, 2).await.unwrap();
        assert_eq!(hits.len(), 2);
    }
}
