use axum::{http::StatusCode, Json};
use serde_json::{json, Value};

const MCP_REGISTRY_BASE: &str = "https://registry.modelcontextprotocol.io/v0/servers";

pub async fn fetch_mcp_registry() -> Result<Json<Value>, StatusCode> {
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(30))
        .build()
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let mut all_servers: Vec<Value> = Vec::new();
    let mut cursor: Option<String> = None;

    loop {
        let url = match &cursor {
            Some(c) => format!("{}?limit=100&cursor={}", MCP_REGISTRY_BASE, c),
            None => format!("{}?limit=100", MCP_REGISTRY_BASE),
        };

        let resp = client
            .get(&url)
            .header("Accept", "application/json")
            .send()
            .await
            .map_err(|_| StatusCode::BAD_GATEWAY)?;

        if !resp.status().is_success() {
            if all_servers.is_empty() {
                return Err(StatusCode::BAD_GATEWAY);
            }
            break;
        }

        let data: Value = resp.json().await.map_err(|_| StatusCode::BAD_GATEWAY)?;

        let raw_servers = data["servers"].as_array().cloned().unwrap_or_default();
        let page_servers: Vec<Value> = raw_servers
            .into_iter()
            .filter(|raw| {
                let meta_key = "io.modelcontextprotocol.registry/official";
                raw["_meta"][meta_key]["isLatest"].as_bool().unwrap_or(true)
            })
            .map(normalize_server)
            .collect();

        all_servers.extend(page_servers);

        cursor = data["nextCursor"].as_str().map(|s| s.to_string());
        if cursor.is_none() {
            break;
        }
    }

    Ok(Json(json!({ "servers": all_servers })))
}

fn normalize_server(raw: Value) -> Value {
    let s = &raw["server"];
    let meta_key = "io.modelcontextprotocol.registry/official";
    let meta = &raw["_meta"][meta_key];

    let name = s["name"].as_str().unwrap_or("").to_string();
    let title = s["title"].as_str().unwrap_or("").to_string();
    let display_title = if title.is_empty() {
        name.split('/').last().unwrap_or(&name).to_string()
    } else {
        title
    };

    // Extract author from name (e.g. "io.github.user/repo" → "user", "ac.inference.sh/x" → "ac.inference.sh")
    let author = {
        let prefix = name.split('/').next().unwrap_or(&name);
        if let Some(rest) = prefix.strip_prefix("io.github.") {
            rest.to_string()
        } else if prefix.starts_with("io.modelcontextprotocol") {
            "modelcontextprotocol".to_string()
        } else {
            prefix.to_string()
        }
    };

    // Find a GitHub remote or fall back to first remote
    let remotes = s["remotes"].as_array().cloned().unwrap_or_default();
    let repo = remotes
        .iter()
        .find(|r| r["url"].as_str().map(|u| u.contains("github.com")).unwrap_or(false))
        .or_else(|| remotes.first())
        .map(|r| {
            let url = r["url"].as_str().unwrap_or("").to_string();
            let source = if url.contains("github.com") { "github" } else { "remote" };
            json!({ "url": url, "source": source })
        });

    // Only mark as official if published by the MCP team itself
    let is_official = name.starts_with("io.modelcontextprotocol");

    let updated = meta["updatedAt"]
        .as_str()
        .map(|s| s[..10].to_string()) // "2026-04-13"
        .unwrap_or_else(|| "unknown".to_string());

    json!({
        "server": {
            "name": name,
            "title": display_title,
            "description": s["description"].as_str().unwrap_or(""),
            "version": s["version"].as_str().unwrap_or("1.0.0"),
            "repository": repo,
            "_meta": if is_official { json!({ "official": true }) } else { json!(null) },
        },
        "stars": 0,
        "installs": 0,
        "installed": false,
        "tags": [],
        "author": author,
        "updated": updated,
    })
}
