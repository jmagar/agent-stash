use serde::{Deserialize, Serialize};

/// Opaque pagination token. Producers may place any string here; consumers treat
/// it as an opaque blob.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(transparent)]
pub struct Cursor(pub String);

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct Page<T> {
    pub entries: Vec<T>,
    pub next_cursor: Option<Cursor>,
}

impl<T> Page<T> {
    pub fn new(entries: Vec<T>, next_cursor: Option<Cursor>) -> Self {
        Self {
            entries,
            next_cursor,
        }
    }
    pub fn empty() -> Self {
        Self::new(Vec::new(), None)
    }
}
