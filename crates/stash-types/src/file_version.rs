use crate::{Identity, Sha, StashPath, StorageTier};
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct FileVersion {
    pub path:      StashPath,
    pub sha:       Sha,
    pub commit:    Sha,
    pub size:      u64,
    pub mime:      String,
    pub author:    Identity,
    pub timestamp: DateTime<Utc>,
    pub message:   Option<String>,
    pub tier:      StorageTier,
}
