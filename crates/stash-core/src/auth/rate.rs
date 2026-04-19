use stash_types::{StashError, StashResult, TokenId};
use std::collections::HashMap;
use std::sync::Mutex;
use std::time::{Duration, Instant};

/// In-memory per-token request counter over a rolling 60-second window.
/// Designed for the P04 HTTP middleware. Not persisted — restart resets.
pub struct RateCounter {
    inner: Mutex<HashMap<TokenId, Vec<Instant>>>,
}

impl RateCounter {
    pub fn new() -> Self {
        Self {
            inner: Mutex::new(HashMap::new()),
        }
    }

    /// Record a request and return `Ok` if under `limit_per_minute`, else
    /// `RateLimited { retry_after_ms }`.
    ///
    /// If `limit_per_minute` is 0, rate limiting is disabled and this always
    /// returns `Ok(())` without recording a hit.
    pub fn check_and_incr(&self, id: &TokenId, limit_per_minute: u32) -> StashResult<()> {
        if limit_per_minute == 0 {
            return Ok(());
        }
        let mut guard = self.inner.lock().map_err(|_| StashError::Internal {
            trace_id: "rate-lock-poisoned".into(),
        })?;
        let now = Instant::now();
        let window = Duration::from_secs(60);
        let hits = guard.entry(id.clone()).or_default();
        hits.retain(|t| now.duration_since(*t) < window);
        if hits.len() as u32 >= limit_per_minute {
            // hits is non-empty here because limit_per_minute > 0 and the
            // condition `hits.len() >= limit_per_minute` holds.
            let retry_after = window - now.duration_since(*hits.first().unwrap());
            return Err(StashError::RateLimited {
                retry_after_ms: retry_after.as_millis() as u64,
            });
        }
        hits.push(now);
        Ok(())
    }

    pub fn reset(&self, id: &TokenId) {
        if let Ok(mut g) = self.inner.lock() {
            g.remove(id);
        }
    }
}

impl Default for RateCounter {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn id() -> TokenId {
        TokenId::parse("tk_0123456789abcdef").unwrap()
    }

    #[test]
    fn allows_up_to_limit() {
        let rc = RateCounter::new();
        for _ in 0..10 {
            rc.check_and_incr(&id(), 10).unwrap();
        }
    }

    #[test]
    fn rejects_after_limit_with_retry_after() {
        let rc = RateCounter::new();
        for _ in 0..3 {
            rc.check_and_incr(&id(), 3).unwrap();
        }
        let err = rc.check_and_incr(&id(), 3).unwrap_err();
        match err {
            StashError::RateLimited { retry_after_ms } => {
                assert!(retry_after_ms <= 60_000);
            }
            other => panic!("expected RateLimited, got {other:?}"),
        }
    }

    #[test]
    fn reset_clears_counter() {
        let rc = RateCounter::new();
        for _ in 0..3 {
            rc.check_and_incr(&id(), 3).unwrap();
        }
        rc.reset(&id());
        rc.check_and_incr(&id(), 3).unwrap();
    }

    #[test]
    fn independent_tokens_independent_counters() {
        let rc = RateCounter::new();
        let a = id();
        let b = TokenId::parse("tk_fedcba9876543210").unwrap();
        for _ in 0..5 {
            rc.check_and_incr(&a, 5).unwrap();
        }
        // `b` starts fresh.
        for _ in 0..5 {
            rc.check_and_incr(&b, 5).unwrap();
        }
    }
}
