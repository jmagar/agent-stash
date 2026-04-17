use stash_types::{StashError, StashResult};
use std::{
    path::{Path, PathBuf},
    sync::Arc,
};
use tokio::sync::Mutex;

pub(crate) mod delete;
pub(crate) mod diff;
pub(crate) mod git;
pub(crate) mod history;
pub(crate) mod list;
pub(crate) mod read;
pub(crate) mod write;

/// Git-backed file store. Single-writer (serialized via internal Mutex); reads are
/// lock-free because committed git objects are immutable.
#[derive(Debug)]
pub struct StashRepo {
    #[allow(dead_code)]
    root: PathBuf, // $STASH_ROOT
    repo_path: PathBuf, // $STASH_ROOT/repo.git
    #[allow(dead_code)]
    write_lock: Arc<Mutex<()>>,
}

impl StashRepo {
    pub async fn init(root: impl AsRef<Path>) -> StashResult<Self> {
        let root = root.as_ref().to_path_buf();
        let repo_path = root.join("repo.git");
        std::fs::create_dir_all(&root).map_err(|e| StashError::Internal {
            trace_id: format!("mkdir:{e}"),
        })?;
        let rp = repo_path.clone();
        git::blocking(move || {
            let mut opts = git2::RepositoryInitOptions::new();
            opts.bare(true).initial_head("main");
            git2::Repository::init_opts(&rp, &opts).map(|_| ())
        })
        .await?;
        Ok(Self {
            root,
            repo_path,
            write_lock: Arc::new(Mutex::new(())),
        })
    }

    pub async fn open(root: impl AsRef<Path>) -> StashResult<Self> {
        let root = root.as_ref().to_path_buf();
        let repo_path = root.join("repo.git");
        let rp = repo_path.clone();
        git::blocking(move || git2::Repository::open_bare(&rp).map(|_| ())).await?;
        Ok(Self {
            root,
            repo_path,
            write_lock: Arc::new(Mutex::new(())),
        })
    }

    /// Absolute path to the bare repo.
    pub fn repo_path(&self) -> &Path {
        &self.repo_path
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn init_creates_bare_repo_with_main_branch() {
        let td = tempfile::tempdir().unwrap();
        let _repo = StashRepo::init(td.path()).await.unwrap();
        let gitdir = td.path().join("repo.git");
        assert!(gitdir.is_dir(), "repo.git not created");
        assert!(gitdir.join("HEAD").is_file(), "bare repo layout missing");
        let head = std::fs::read_to_string(gitdir.join("HEAD")).unwrap();
        assert!(
            head.contains("refs/heads/main"),
            "HEAD should point at main, got: {head}"
        );
    }

    #[tokio::test]
    async fn open_errors_when_missing() {
        let td = tempfile::tempdir().unwrap();
        let err = StashRepo::open(td.path()).await.unwrap_err();
        assert!(
            matches!(err, StashError::Internal { .. }),
            "expected Internal, got {err:?}"
        );
    }

    #[tokio::test]
    async fn init_then_open_roundtrips() {
        let td = tempfile::tempdir().unwrap();
        StashRepo::init(td.path()).await.unwrap();
        let _repo = StashRepo::open(td.path()).await.unwrap();
    }
}
