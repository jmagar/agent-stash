use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct DiffText {
    /// Unified diff. Empty string = no changes.
    pub unified: String,
}
