use axum::Json;
use serde_json::{json, Value};
use std::path::{Path, PathBuf};
use std::time::{SystemTime, UNIX_EPOCH};
use walkdir::WalkDir;

pub async fn read_claude_dir(claude: PathBuf) -> Json<Value> {
    Json(json!({
        "agents":   read_md_files(&claude.join("agents")),
        "skills":   read_skills(&claude.join("skills")),
        "commands": read_commands(&claude.join("commands")),
        "hooks":    read_glob_files(&claude.join("hooks"), &["sh", "py", "js"]),
        "sessions": read_md_files(&claude.join("plans")),
        "scripts":  read_glob_files(&claude.join("scripts"), &["sh", "py", "js"]),
        "settings": read_json(&claude.join("settings.json")),
        "plugins":  read_plugins(&claude.join("plugins")),
    }))
}

// ── helpers ──────────────────────────────────────────────────────────────────

fn read_md_files(dir: &Path) -> Value {
    if !dir.exists() { return json!([]); }
    let mut items = Vec::new();
    for entry in WalkDir::new(dir).max_depth(1).min_depth(1)
        .into_iter().filter_map(|e| e.ok())
    {
        let path = entry.path();
        if path.extension().and_then(|e| e.to_str()) != Some("md") { continue; }
        items.push(file_entry(path));
    }
    items.sort_by(|a, b| {
        b["mtime"].as_i64().unwrap_or(0).cmp(&a["mtime"].as_i64().unwrap_or(0))
    });
    json!(items)
}

fn read_glob_files(dir: &Path, exts: &[&str]) -> Value {
    if !dir.exists() { return json!([]); }
    let mut items = Vec::new();
    for entry in WalkDir::new(dir).max_depth(1).min_depth(1)
        .into_iter().filter_map(|e| e.ok())
    {
        let path = entry.path();
        let ext = path.extension().and_then(|e| e.to_str()).unwrap_or("");
        if !exts.contains(&ext) { continue; }
        items.push(file_entry(path));
    }
    json!(items)
}

fn read_skills(dir: &Path) -> Value {
    if !dir.exists() { return json!([]); }
    let mut items = Vec::new();
    for entry in WalkDir::new(dir).max_depth(1).min_depth(1)
        .into_iter().filter_map(|e| e.ok())
    {
        if !entry.file_type().is_dir() { continue; }
        let skill_md = entry.path().join("SKILL.md");
        if skill_md.exists() {
            let mut item = file_entry(&skill_md);
            // Use the directory name as the skill name
            let skill_name = entry.file_name().to_string_lossy().to_string();
            item["name"] = json!(skill_name);
            item["path"] = json!(format!("skills/{}/SKILL.md", skill_name));
            items.push(item);
        }
    }
    json!(items)
}

fn read_commands(dir: &Path) -> Value {
    if !dir.exists() { return json!([]); }
    let mut items = Vec::new();
    for entry in WalkDir::new(dir).max_depth(2).min_depth(1)
        .into_iter().filter_map(|e| e.ok())
    {
        let path = entry.path();
        if path.extension().and_then(|e| e.to_str()) != Some("md") { continue; }
        items.push(file_entry(path));
    }
    json!(items)
}

fn read_plugins(plugins_dir: &Path) -> Value {
    let installed = read_json(&plugins_dir.join("installed_plugins.json"));
    let known_marketplaces = read_json(&plugins_dir.join("known_marketplaces.json"));

    // Read each installed marketplace's marketplace.json
    let mut marketplaces = Vec::new();
    let mp_dir = plugins_dir.join("marketplaces");
    if mp_dir.exists() {
        for entry in WalkDir::new(&mp_dir).max_depth(1).min_depth(1)
            .into_iter().filter_map(|e| e.ok())
        {
            if !entry.file_type().is_dir() { continue; }
            let mj = entry.path().join(".claude-plugin").join("marketplace.json");
            if mj.exists() {
                if let Ok(content) = std::fs::read_to_string(&mj) {
                    if let Ok(mut parsed) = serde_json::from_str::<Value>(&content) {
                        // inject directory name as owner hint
                        let dir_name = entry.file_name().to_string_lossy().to_string();
                        parsed["_dir"] = json!(dir_name);
                        marketplaces.push(parsed);
                    }
                }
            }
        }
    }

    json!({
        "installed": installed,
        "known_marketplaces": known_marketplaces,
        "marketplaces": marketplaces,
    })
}

fn read_json(path: &Path) -> Value {
    std::fs::read_to_string(path)
        .ok()
        .and_then(|s| serde_json::from_str(&s).ok())
        .unwrap_or(json!(null))
}

// Build a single artifact entry from a file path
fn file_entry(path: &Path) -> Value {
    let content = std::fs::read_to_string(path).unwrap_or_default();
    let name = path.file_name().and_then(|n| n.to_str()).unwrap_or("").to_string();
    let mtime = file_mtime(path);
    let desc = first_desc_line(&content);

    json!({
        "name": name,
        "path": path.to_string_lossy(),
        "content": content,
        "modified": relative_time(mtime),
        "mtime": mtime,
        "author": "jmagar",
        "versions": 1,
        "desc": desc,
    })
}

fn file_mtime(path: &Path) -> i64 {
    path.metadata()
        .and_then(|m| m.modified())
        .and_then(|t| t.duration_since(UNIX_EPOCH).map_err(|e| {
            std::io::Error::new(std::io::ErrorKind::Other, e)
        }))
        .map(|d| d.as_secs() as i64)
        .unwrap_or(0)
}

fn relative_time(secs: i64) -> String {
    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_secs() as i64)
        .unwrap_or(0);
    let delta = now - secs;
    if delta < 60 { return "just now".to_string(); }
    if delta < 3600 { return format!("{}m ago", delta / 60); }
    if delta < 86400 { return format!("{}h ago", delta / 3600); }
    if delta < 7 * 86400 { return format!("{}d ago", delta / 86400); }
    format!("{}w ago", delta / (7 * 86400))
}

// Extract a short description from file content
fn first_desc_line(content: &str) -> String {
    for line in content.lines() {
        let t = line.trim();
        if t.is_empty() || t.starts_with('#') || t.starts_with("---") { continue; }
        let desc: String = t.chars().take(80).collect();
        return desc;
    }
    String::new()
}
