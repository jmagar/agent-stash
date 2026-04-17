use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum StorageTier {
    Git,
    Blob,
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn serializes_as_lowercase() {
        assert_eq!(serde_json::to_string(&StorageTier::Git).unwrap(), "\"git\"");
        assert_eq!(
            serde_json::to_string(&StorageTier::Blob).unwrap(),
            "\"blob\""
        );
    }
}
