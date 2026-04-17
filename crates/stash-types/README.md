# stash-types

Shared domain types for **agent-stash**.

This crate defines the adapter-stable wire format used by every layer of agent-stash: the core git-backed storage engine, the (future) HTTP server, MCP adapter, and CLI. Keeping the types in their own crate lets us version the wire contract independently from the storage engine and prevents cyclic dependencies between adapters.

Status: pre-1.0. No API stability promise yet. Breaking changes may land on any minor version until the v0.1 milestone ships.

## Exported types

- `StashPath` — normalized logical path (lowercase, forward-slash, no `..`). Construction validates and canonicalizes. See `InvalidPathReason` for rejection reasons.
- `Sha` — opaque newtype around a git object id (hex string). Use `Sha::parse` to construct; see `InvalidSha`.
- `Identity` — `agent@device` tuple used for commit authorship and audit. Validated on construction.
- `StorageTier` — enum distinguishing the text tier (git blobs) from future blob tier (CAS). v0.1 only exercises `Text`.
- `FileVersion` — metadata for a single historical version of a stashed file (sha, size, commit, timestamp, author).
- `Page<T>` / `Cursor` — generic pagination envelope with opaque base64 cursors.
- `DiffText` — text diff payload (unified diff + line stats) used by `StashRepo::diff`.
- `SearchHit` — single match produced by `SearchService::search` (path, line, snippet).
- `StashError` / `StashResult` — unified error type. Carries a stable `code` tag via serde (`not_found`, `conflict`, `invalid_path`, …) so HTTP/MCP adapters can map errors without matching on Rust variants.

## Invariants

- `StashPath` values are always lowercase-normalized; two inputs that differ only in case compare equal.
- `Identity` is always `agent@device` — both halves non-empty, no whitespace.
- `StashError` serializes with a stable `code` string; adding variants is backward-compatible, renaming codes is not.

## Reference

Full design: `docs/superpowers/specs/2026-04-17-agent-stash-v0.1-design.md`.
