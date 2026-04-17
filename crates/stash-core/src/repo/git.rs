use std::path::Path;
use stash_types::{Identity, Sha, StashError, StashResult};

/// Run blocking git2 work off the async runtime. Panics are converted to
/// `StashError::Internal` so tests still surface them cleanly.
pub(crate) async fn blocking<F, T>(f: F) -> StashResult<T>
where
    F: FnOnce() -> Result<T, git2::Error> + Send + 'static,
    T: Send + 'static,
{
    tokio::task::spawn_blocking(f)
        .await
        .map_err(|e| StashError::Internal { trace_id: format!("join:{e}") })?
        .map_err(|e| StashError::Internal { trace_id: format!("git:{}", e.message()) })
}

pub(crate) struct CommitInput<'a> {
    pub repo_path: &'a Path,
    pub path:      &'a str,
    pub blob:      &'a [u8],
    pub author:    &'a Identity,
    pub message:   &'a str,
}

pub(crate) struct CommitOutput {
    pub blob_sha:   Sha,
    pub commit_sha: Sha,
    pub timestamp:  chrono::DateTime<chrono::Utc>,
}

pub(crate) fn commit_file(inp: CommitInput<'_>) -> Result<CommitOutput, git2::Error> {
    use chrono::TimeZone;
    let repo = git2::Repository::open_bare(inp.repo_path)?;
    let blob_oid = repo.blob(inp.blob)?;

    // Build new tree from HEAD's tree (if any) with this file written.
    let parent_commit = repo.head().ok().and_then(|h| h.peel_to_commit().ok());
    let parent_tree   = parent_commit.as_ref().and_then(|c| c.tree().ok());

    let mut builder = repo.treebuilder(parent_tree.as_ref())?;
    insert_nested(&repo, &mut builder, inp.path, blob_oid)?;
    let tree_oid = builder.write()?;

    let (name, email) = inp.author.git_author_line();
    let now = chrono::Utc::now();
    let sig_author    = git2::Signature::new(&name, &email,
                           &git2::Time::new(now.timestamp(), 0))?;
    let sig_committer = git2::Signature::new("agent-stash", "server@stash",
                           &git2::Time::new(now.timestamp(), 0))?;

    let parents: Vec<&git2::Commit> = parent_commit.iter().collect();
    let tree = repo.find_tree(tree_oid)?;
    let commit_oid = repo.commit(
        Some("refs/heads/main"),
        &sig_author, &sig_committer,
        inp.message, &tree, &parents,
    )?;

    Ok(CommitOutput {
        blob_sha:   Sha::parse(blob_oid.to_string()).unwrap(),
        commit_sha: Sha::parse(commit_oid.to_string()).unwrap(),
        timestamp:  chrono::Utc.timestamp_opt(now.timestamp(), 0).unwrap(),
    })
}

/// Recursively write a nested path (e.g. "a/b/c.md") into a tree builder,
/// creating sub-trees as needed.
fn insert_nested(
    repo:    &git2::Repository,
    builder: &mut git2::TreeBuilder<'_>,
    path:    &str,
    blob:    git2::Oid,
) -> Result<(), git2::Error> {
    match path.split_once('/') {
        None => { builder.insert(path, blob, 0o100644)?; Ok(()) }
        Some((head, rest)) => {
            let sub_oid = {
                let existing = builder.get(head)?
                    .and_then(|e| repo.find_tree(e.id()).ok());
                let mut sub = repo.treebuilder(existing.as_ref())?;
                insert_nested(repo, &mut sub, rest, blob)?;
                sub.write()?
            };
            builder.insert(head, sub_oid, 0o040000)?;
            Ok(())
        }
    }
}
