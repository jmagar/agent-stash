use stash_types::{StashError, StashResult};

const HEADER: &[u8] = b"# stash:blob/v1\n";

pub struct BlobStub {
    pub sha256: String,
    pub size: u64,
    pub mime: String,
    pub original_name: String,
    pub uploaded_by: String,
}

pub fn is_blob_stub(data: &[u8]) -> bool {
    data.starts_with(HEADER)
}

pub fn write_stub(stub: &BlobStub) -> Vec<u8> {
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
    let mut sha256 = None;
    let mut size: Option<u64> = None;
    let mut mime = None;
    let mut original_name = None;
    let mut uploaded_by = None;

    for line in text.lines().skip(1) {
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

    Ok(BlobStub {
        sha256: sha256.ok_or_else(|| StashError::Internal {
            trace_id: "stub:missing-sha256".into(),
        })?,
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
}
