# stash-core

Git-backed text-tier storage engine for **agent-stash** v0.1.

This crate is the storage kernel. It owns a bare git repository and exposes a synchronous-but-async-friendly API for writing, reading, listing, diffing, searching, and deleting text files that are versioned as git blobs on a single default branch (`main`).

What this crate is **not**: there is no HTTP server, no authentication, no MCP adapter, no blob-tier (CAS) storage here. Those live in sibling crates (`stash-server`, future `stash-mcp`, future blob backend) that consume `stash-core`. The blob tier is deferred to phase P02.

## Public API

```rust
use stash_core::{StashRepo, search::SearchService};
```

- `StashRepo::init(path)` — create a new bare repo with `main` as the default branch.
- `StashRepo::open(path)` — open an existing bare repo.
- `StashRepo::write(path, bytes, identity, message)` — commit a new version of a file. Returns `FileVersion`.
- `StashRepo::read(path, at)` — read current (or historic, by commit `Sha`) content.
- `StashRepo::delete(path, identity, message)` — commit a tombstone; history remains recoverable via git.
- `StashRepo::list(prefix, glob, page)` — paginated listing with optional prefix + glob filter.
- `StashRepo::history(path, page)` — newest-first paginated version log for a single path.
- `StashRepo::diff(path, from, to)` — unified text diff between two commits.
- `SearchService::search(repo, glob, regex, limit)` — scan git blobs reachable from `HEAD`, returning `SearchHit`s.

All results use the shared wire types from [`stash-types`](../stash-types).

## Storage model

- **Backend**: bare git repository owned exclusively by this crate.
- **Branch**: single default branch `main`. No branching model exposed to callers.
- **Tier**: text tier only. Every write creates one commit with one tree entry per stashed path. Content lives as an ordinary git blob.
- **Paths**: stored exactly as the normalized `StashPath` (lowercase, forward-slash). No per-agent namespacing at this layer.
- **Deletes**: implemented as commits that drop the entry from the tree. History stays available through git; `read(path, at=<older_sha>)` still works.

## Concurrency

- `git2` is blocking. `StashRepo` methods bridge to async callers via `tokio::task::spawn_blocking`.
- A per-repo `tokio::sync::Mutex` serializes writers so commit parents stay consistent. Readers take no lock and run concurrently with each other.
- The mutex is scoped to a single `StashRepo` handle; callers that open the same repo from multiple processes must coordinate externally (out of scope for v0.1).

## Testing

```
cargo test -p stash-core
```

Tests use `tempfile` scratch dirs and drive the real git2 backend — no mocks.
