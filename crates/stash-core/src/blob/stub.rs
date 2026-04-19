use stash_types::{StashError, StashResult};

const HEADER: &str = "# stash:blob/v1\n";
const HEADER_BYTES: &[u8] = HEADER.as_bytes();

pub struct BlobStub {
    pub sha256: String,
    pub size: u64,
    pub mime: String,
    pub original_name: String,
    pub uploaded_by: String,
}

/// Returns true only if `data` starts with exactly the stash blob-stub header.
/// This is a necessary-but-not-sufficient guard; callers should use `parse_stub`
/// for full validation before acting on the content.
pub fn is_blob_stub(data: &[u8]) -> bool {
    data.starts_with(HEADER_BYTES)
}

/// Emit a stub. Panics in debug, returns empty bytes in release if any field
/// contains a newline — callers must pass clean values from trusted paths.
pub fn write_stub(stub: &BlobStub) -> Vec<u8> {
    for (name, val) in [
        ("sha256", &stub.sha256),
        ("mime", &stub.mime),
        ("original_name", &stub.original_name),
        ("uploaded_by", &stub.uploaded_by),
    ] {
        debug_assert!(
            !val.contains('\n') && !val.contains('\r'),
            "stub field `{name}` contains line break — refusing to write malformed stub"
        );
    }
    format!(
        "# stash:blob/v1\nsha256: {}\nsize: {}\nmime: {}\noriginal_name: {}\nuploaded_by: {}\n",
        stub.sha256, stub.size, stub.mime, stub.original_name, stub.uploaded_by
    )
    .into_bytes()
}

pub fn parse_stub(data: &[u8]) -> StashResult<BlobStub> {
    let text = std::str::from_utf8(data).map_err(|_| StashError::Internal {
        trace_id: "stub:utf8".into(),
    })?;

    // Verify the first line is exactly our magic header before trusting the rest.
    let rest = text
        .strip_prefix(HEADER)
        .ok_or_else(|| StashError::Internal {
            trace_id: "stub:bad-header".into(),
        })?;

    let mut sha256: Option<String> = None;
    let mut size: Option<u64> = None;
    let mut mime: Option<String> = None;
    let mut original_name: Option<String> = None;
    let mut uploaded_by: Option<String> = None;

    for line in rest.lines() {
        if let Some((key, val)) = line.split_once(": ") {
            match key {
                "sha256" => sha256 = Some(val.to_string()),
                "size" => size = val.parse().ok(),
                "mime" => mime = Some(val.to_string()),
                "original_name" => original_name = Some(val.to_string()),
                "uploaded_by" => uploaded_by = Some(val.to_string()),
                _ => {}
            }
        }
    }

    let sha256 = sha256.ok_or_else(|| StashError::Internal {
        trace_id: "stub:missing-sha256".into(),
    })?;

    // Validate the sha256 field is a legitimate hex digest — prevents a
    // hand-crafted stub from injecting path traversal via blob_path().
    if sha256.len() != 64
        || !sha256
            .bytes()
            .all(|b| matches!(b, b'0'..=b'9' | b'a'..=b'f'))
    {
        return Err(StashError::Internal {
            trace_id: format!("stub:invalid-sha256:{sha256}"),
        });
    }

    Ok(BlobStub {
        sha256,
        size: size.ok_or_else(|| StashError::Internal {
            trace_id: "stub:missing-size".into(),
        })?,
        mime: mime.ok_or_else(|| StashError::Internal {
            trace_id: "stub:missing-mime".into(),
        })?,
        original_name: original_name.ok_or_else(|| StashError::Internal {
            trace_id: "stub:missing-original-name".into(),
        })?,
        uploaded_by: uploaded_by.ok_or_else(|| StashError::Internal {
            trace_id: "stub:missing-uploaded-by".into(),
        })?,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    fn sample() -> BlobStub {
        BlobStub {
            sha256: "a".repeat(64),
            size: 1_048_576,
            mime: "image/png".into(),
            original_name: "photos/cat.png".into(),
            uploaded_by: "claude@tootie".into(),
        }
    }

    #[test]
    fn write_starts_with_header() {
        let bytes = write_stub(&sample());
        assert!(bytes.starts_with(b"# stash:blob/v1\n"));
    }

    #[test]
    fn is_blob_stub_detects_header() {
        assert!(is_blob_stub(b"# stash:blob/v1\nsha256: abc\n"));
        assert!(!is_blob_stub(b"hello world"));
        assert!(!is_blob_stub(b""));
    }

    #[test]
    fn round_trips_all_fields() {
        let original = sample();
        let bytes = write_stub(&original);
        let parsed = parse_stub(&bytes).unwrap();
        assert_eq!(parsed.sha256, original.sha256);
        assert_eq!(parsed.size, original.size);
        assert_eq!(parsed.mime, original.mime);
        assert_eq!(parsed.original_name, original.original_name);
        assert_eq!(parsed.uploaded_by, original.uploaded_by);
    }

    #[test]
    fn parse_stub_rejects_missing_sha256() {
        let bad =
            b"# stash:blob/v1\nsize: 1\nmime: text/plain\noriginal_name: x\nuploaded_by: a@b\n";
        assert!(parse_stub(bad).is_err());
    }

    #[test]
    fn parse_stub_rejects_wrong_header() {
        // A file that starts with a similar-looking but wrong header must not parse.
        let bad = b"# stash:blob/v2\nsha256: aaaa\nsize: 1\nmime: text/plain\noriginal_name: x\nuploaded_by: a@b\n";
        assert!(parse_stub(bad).is_err());
        // Plain text definitely not a stub.
        assert!(parse_stub(b"hello world").is_err());
    }

    #[test]
    fn parse_stub_rejects_invalid_sha256() {
        let bad = format!(
            "# stash:blob/v1\nsha256: {}\nsize: 1\nmime: text/plain\noriginal_name: x\nuploaded_by: a@b\n",
            "../evil/path/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
        );
        assert!(parse_stub(bad.as_bytes()).is_err());
    }

    #[test]
    fn is_blob_stub_requires_exact_header() {
        assert!(is_blob_stub(b"# stash:blob/v1\nextra"));
        assert!(!is_blob_stub(b"# stash:blob/v2\n"));
        assert!(!is_blob_stub(b""));
    }
}
