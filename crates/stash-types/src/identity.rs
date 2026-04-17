use serde::{Deserialize, Serialize};
use std::fmt;

#[derive(Debug, thiserror::Error, PartialEq, Eq)]
pub enum InvalidIdentity {
    #[error("missing '@' separator")]      MissingAt,
    #[error("agent component is empty")]   EmptyAgent,
    #[error("device component is empty")]  EmptyDevice,
    #[error("component contains invalid chars (allowed: a-z, 0-9, -, _)")] BadChars,
}

#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct Identity { pub agent: String, pub device: String }

fn is_valid_component(s: &str) -> bool {
    !s.is_empty() && s.chars().all(|c| c.is_ascii_lowercase()
        || c.is_ascii_digit() || c == '-' || c == '_')
}

impl Identity {
    pub fn new(agent: impl Into<String>, device: impl Into<String>)
        -> Result<Self, InvalidIdentity>
    {
        let agent  = agent.into().to_ascii_lowercase();
        let device = device.into().to_ascii_lowercase();
        if agent.is_empty()  { return Err(InvalidIdentity::EmptyAgent); }
        if device.is_empty() { return Err(InvalidIdentity::EmptyDevice); }
        if !is_valid_component(&agent) || !is_valid_component(&device) {
            return Err(InvalidIdentity::BadChars);
        }
        Ok(Self { agent, device })
    }

    pub fn parse(s: impl AsRef<str>) -> Result<Self, InvalidIdentity> {
        let raw = s.as_ref();
        let (a, d) = raw.split_once('@').ok_or(InvalidIdentity::MissingAt)?;
        Self::new(a, d)
    }

    /// Email-style representation for git author: `claude@tootie <claude@tootie.stash>`
    pub fn git_author_line(&self) -> (String, String) {
        (self.to_string(), format!("{}@{}.stash", self.agent, self.device))
    }
}

impl fmt::Display for Identity {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}@{}", self.agent, self.device)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use assert_matches::assert_matches;

    #[test]
    fn new_lowercases_and_validates() {
        let i = Identity::new("Claude", "Tootie").unwrap();
        assert_eq!(i.agent,  "claude");
        assert_eq!(i.device, "tootie");
        assert_eq!(i.to_string(), "claude@tootie");
    }

    #[test]
    fn parse_splits_on_at() {
        let i = Identity::parse("codex@dookie").unwrap();
        assert_eq!(i, Identity::new("codex", "dookie").unwrap());
    }

    #[test]
    fn parse_rejects_missing_at() {
        assert_matches!(Identity::parse("claude"), Err(InvalidIdentity::MissingAt));
    }

    #[test]
    fn rejects_empty_components() {
        assert_matches!(Identity::new("", "tootie"),   Err(InvalidIdentity::EmptyAgent));
        assert_matches!(Identity::new("claude", ""),   Err(InvalidIdentity::EmptyDevice));
        assert_matches!(Identity::parse("@tootie"),    Err(InvalidIdentity::EmptyAgent));
        assert_matches!(Identity::parse("claude@"),    Err(InvalidIdentity::EmptyDevice));
    }

    #[test]
    fn rejects_invalid_chars() {
        assert_matches!(Identity::new("claude!", "tootie"), Err(InvalidIdentity::BadChars));
        assert_matches!(Identity::new("claude", "too tie"), Err(InvalidIdentity::BadChars));
    }

    #[test]
    fn git_author_line_is_email_compatible() {
        let i = Identity::new("claude", "tootie").unwrap();
        let (name, email) = i.git_author_line();
        assert_eq!(name,  "claude@tootie");
        assert_eq!(email, "claude@tootie.stash");
    }
}
