use crate::{Sha, StashPath};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct SearchHit {
    pub path:    StashPath,
    pub line:    u32,          // 1-indexed
    pub snippet: String,
    pub sha:     Sha,          // blob sha at current HEAD
}
