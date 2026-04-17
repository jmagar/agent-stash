#![forbid(unsafe_code)]
pub mod config;
pub(crate) mod blob;
pub(crate) mod db;
pub mod repo;
pub mod search;
pub use repo::StashRepo;
