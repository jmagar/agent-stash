use serde::{Deserialize, Serialize};
use std::fmt;

#[derive(Debug, thiserror::Error, PartialEq, Eq)]
pub enum InvalidSha {
    #[error("sha must be 40 hex chars, got {0}")]
    WrongLength(usize),
    #[error("sha contains non-hex character")]
    NonHex,
}

#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(try_from = "String", into = "String")]
pub struct Sha(String);

impl Sha {
    pub fn parse(s: impl AsRef<str>) -> Result<Self, InvalidSha> {
        let raw = s.as_ref();
        if raw.len() != 40 {
            return Err(InvalidSha::WrongLength(raw.len()));
        }
        if !raw.chars().all(|c| c.is_ascii_hexdigit()) {
            return Err(InvalidSha::NonHex);
        }
        Ok(Self(raw.to_ascii_lowercase()))
    }
    pub fn as_str(&self) -> &str {
        &self.0
    }
}

impl fmt::Display for Sha {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}", self.0)
    }
}

impl TryFrom<String> for Sha {
    type Error = InvalidSha;
    fn try_from(s: String) -> Result<Self, Self::Error> {
        Self::parse(s)
    }
}

impl From<Sha> for String {
    fn from(s: Sha) -> Self {
        s.0
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use assert_matches::assert_matches;

    #[test]
    fn accepts_40_char_hex_lowercased() {
        let s = Sha::parse("ABCDEF0123456789abcdef0123456789ABCDEF01").unwrap();
        assert_eq!(s.as_str(), "abcdef0123456789abcdef0123456789abcdef01");
    }

    #[test]
    fn rejects_wrong_length() {
        assert_matches!(Sha::parse("abc"), Err(InvalidSha::WrongLength(3)));
        assert_matches!(Sha::parse("a".repeat(39)), Err(InvalidSha::WrongLength(39)));
        assert_matches!(Sha::parse("a".repeat(41)), Err(InvalidSha::WrongLength(41)));
    }

    #[test]
    fn rejects_non_hex() {
        let mut s = "a".repeat(39);
        s.push('z');
        assert_matches!(Sha::parse(s), Err(InvalidSha::NonHex));
    }
}
