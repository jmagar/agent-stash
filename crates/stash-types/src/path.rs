use serde::{Deserialize, Serialize};
use std::fmt;

#[derive(Debug, thiserror::Error, PartialEq, Eq)]
pub enum InvalidPathReason {
    #[error("path is empty")]
    Empty,
    #[error("path contains `..` segment")]
    DotDot,
    #[error("path contains NUL byte")]
    Nul,
    #[error("path longer than 1024 bytes")]
    TooLong,
}

#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(try_from = "String", into = "String")]
pub struct StashPath(String);

impl StashPath {
    pub fn parse(input: impl AsRef<str>) -> Result<Self, InvalidPathReason> {
        const MAX: usize = 1024;

        let raw = input.as_ref().trim();
        let trimmed = raw.trim_matches('/');
        if trimmed.is_empty() {
            return Err(InvalidPathReason::Empty);
        }
        if trimmed.as_bytes().contains(&0) {
            return Err(InvalidPathReason::Nul);
        }
        if trimmed.len() > MAX {
            return Err(InvalidPathReason::TooLong);
        }

        // collapse duplicate slashes
        let collapsed: String = trimmed
            .split('/')
            .filter(|s| !s.is_empty())
            .collect::<Vec<_>>()
            .join("/");

        // reject `..` segments
        if collapsed.split('/').any(|seg| seg == "..") {
            return Err(InvalidPathReason::DotDot);
        }

        Ok(Self(collapsed.to_lowercase()))
    }
    pub fn as_str(&self) -> &str {
        &self.0
    }
}

impl fmt::Display for StashPath {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}", self.0)
    }
}

impl TryFrom<String> for StashPath {
    type Error = InvalidPathReason;
    fn try_from(s: String) -> Result<Self, Self::Error> {
        Self::parse(s)
    }
}

impl From<StashPath> for String {
    fn from(p: StashPath) -> Self {
        p.0
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use assert_matches::assert_matches;

    #[test]
    fn lowercases_and_keeps_simple_path() {
        let p = StashPath::parse("Docs/Sessions/2026-04-17.md").unwrap();
        assert_eq!(p.as_str(), "docs/sessions/2026-04-17.md");
    }

    #[test]
    fn trims_leading_and_trailing_slashes_and_whitespace() {
        let p = StashPath::parse("  /docs/plan.md/  ").unwrap();
        assert_eq!(p.as_str(), "docs/plan.md");
    }

    #[test]
    fn collapses_duplicate_slashes() {
        let p = StashPath::parse("docs//sessions///x.md").unwrap();
        assert_eq!(p.as_str(), "docs/sessions/x.md");
    }

    #[test]
    fn rejects_empty() {
        assert_matches!(StashPath::parse(""), Err(InvalidPathReason::Empty));
        assert_matches!(StashPath::parse("/"), Err(InvalidPathReason::Empty));
        assert_matches!(StashPath::parse("   "), Err(InvalidPathReason::Empty));
    }

    #[test]
    fn rejects_dotdot() {
        assert_matches!(
            StashPath::parse("docs/../etc/passwd"),
            Err(InvalidPathReason::DotDot)
        );
        assert_matches!(StashPath::parse(".."), Err(InvalidPathReason::DotDot));
    }

    #[test]
    fn rejects_nul() {
        assert_matches!(
            StashPath::parse("docs/\0/x.md"),
            Err(InvalidPathReason::Nul)
        );
    }

    #[test]
    fn rejects_too_long() {
        let long = "a/".repeat(600); // > 1024 bytes
        assert_matches!(StashPath::parse(long), Err(InvalidPathReason::TooLong));
    }

    #[test]
    fn preserves_unicode_after_lowercase() {
        let p = StashPath::parse("Notes/Résumé.md").unwrap();
        assert_eq!(p.as_str(), "notes/résumé.md");
    }

    #[test]
    fn serde_round_trips_via_string() {
        let p = StashPath::parse("docs/plan.md").unwrap();
        let json = serde_json::to_string(&p).unwrap();
        assert_eq!(json, "\"docs/plan.md\"");
        let back: StashPath = serde_json::from_str(&json).unwrap();
        assert_eq!(back, p);
    }

    #[test]
    fn serde_rejects_invalid() {
        let err = serde_json::from_str::<StashPath>("\"../evil\"").unwrap_err();
        assert!(err.to_string().contains("`..`"));
    }
}
