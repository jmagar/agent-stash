use crate::{
    blob::{spawn_gc_task, BlobStore, TierRouter},
    config::StashConfig,
    db::Db,
};
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

/// Git-backed file store with content-addressed blob tier.
/// Single-writer (serialized via internal Mutex); reads are lock-free.
#[derive(Debug)]
pub struct StashRepo {
    #[allow(dead_code)]
    pub(crate) root: PathBuf,
    pub(crate) repo_path: PathBuf,
    pub(crate) write_lock: Arc<Mutex<()>>,
    pub(crate) blob_store: BlobStore,
    pub(crate) router: TierRouter,
    #[allow(dead_code)]
    pub(crate) db: Db,
    /// Handle for the background GC task. Aborted automatically when
    /// `StashRepo` is dropped, preventing unbounded task accumulation.
    _gc_handle: tokio::task::JoinHandle<()>,
}

impl StashRepo {
    pub async fn init(root: impl AsRef<Path>, config: StashConfig) -> StashResult<Self> {
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
        let db = Db::open(root.join("meta.db")).await?;
        let blob_store = BlobStore::new(&root, db.clone());
        let router = TierRouter::new(config.blob.clone())?;
        let _gc_handle = spawn_gc_task(
            db.clone(),
            root.join("blobs"),
            config.blob.gc_interval_secs,
            config.blob.gc_grace_days,
        );
        Ok(Self {
            root,
            repo_path,
            write_lock: Arc::new(Mutex::new(())),
            blob_store,
            router,
            db,
            _gc_handle,
        })
    }

    /// Open an existing `StashRepo` at `root`.
    ///
    /// This opens and migrates the metadata DB. It may fail if:
    /// - The git repository at `root/repo.git` does not exist or is corrupt.
    /// - The SQLite database at `root/meta.db` cannot be opened or migrated.
    ///
    /// Callers should surface the error to the operator; the store is unusable
    /// until the underlying issue (missing files, locked DB, etc.) is resolved.
    pub async fn open(root: impl AsRef<Path>, config: StashConfig) -> StashResult<Self> {
        let root = root.as_ref().to_path_buf();
        let repo_path = root.join("repo.git");
        let rp = repo_path.clone();
        git::blocking(move || git2::Repository::open_bare(&rp).map(|_| ())).await?;
        let db = Db::open(root.join("meta.db")).await?;
        let blob_store = BlobStore::new(&root, db.clone());
        let router = TierRouter::new(config.blob.clone())?;
        let _gc_handle = spawn_gc_task(
            db.clone(),
            root.join("blobs"),
            config.blob.gc_interval_secs,
            config.blob.gc_grace_days,
        );
        Ok(Self {
            root,
            repo_path,
            write_lock: Arc::new(Mutex::new(())),
            blob_store,
            router,
            db,
            _gc_handle,
        })
    }

    pub fn repo_path(&self) -> &Path {
        &self.repo_path
    }
}

impl Drop for StashRepo {
    fn drop(&mut self) {
        // Abort the background GC task so it doesn't outlive the repo.
        // Without this, each init/open call would leak an untracked task.
        self._gc_handle.abort();
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::config::StashConfig;

    #[tokio::test]
    async fn init_creates_bare_repo_with_main_branch() {
        let td = tempfile::tempdir().unwrap();
        let _repo = StashRepo::init(td.path(), StashConfig::default())
            .await
            .unwrap();
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
        let err = StashRepo::open(td.path(), StashConfig::default())
            .await
            .unwrap_err();
        assert!(
            matches!(err, StashError::Internal { .. }),
            "expected Internal, got {err:?}"
        );
    }

    #[tokio::test]
    async fn init_then_open_roundtrips() {
        let td = tempfile::tempdir().unwrap();
        StashRepo::init(td.path(), StashConfig::default())
            .await
            .unwrap();
        let _repo = StashRepo::open(td.path(), StashConfig::default())
            .await
            .unwrap();
    }

    #[tokio::test]
    async fn init_creates_meta_db() {
        let td = tempfile::tempdir().unwrap();
        StashRepo::init(td.path(), StashConfig::default())
            .await
            .unwrap();
        assert!(td.path().join("meta.db").exists());
    }
}
