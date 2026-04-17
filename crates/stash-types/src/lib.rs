#![forbid(unsafe_code)]
pub mod path;
pub use path::{InvalidPathReason, StashPath};
pub mod sha;
pub use sha::{InvalidSha, Sha};
