use stash_types::{StashError, StashResult};

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
