use axum::{routing::get, Router, response::Redirect};
use std::path::PathBuf;
use tower_http::{cors::CorsLayer, services::ServeDir};

mod claude_dir;
mod mcp_proxy;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let claude_path = PathBuf::from(
        std::env::var("HOME").unwrap_or_else(|_| "/root".to_string())
    ).join(".claude");

    // first arg = path to reference/ dir (static files)
    let static_path = std::env::args()
        .nth(1)
        .map(PathBuf::from)
        .unwrap_or_else(|| PathBuf::from("reference"));

    let port: u16 = std::env::args()
        .nth(2)
        .and_then(|p| p.parse().ok())
        .unwrap_or(7842);

    let app = Router::new()
        .route("/", get(|| async { Redirect::permanent("/Agent%20Stash.html") }))
        .route("/api/local", get({
            let cp = claude_path.clone();
            move || claude_dir::read_claude_dir(cp)
        }))
        .route("/api/mcp-registry", get(mcp_proxy::fetch_mcp_registry))
        .fallback_service(ServeDir::new(&static_path))
        .layer(CorsLayer::permissive());

    let addr = format!("0.0.0.0:{port}");
    let listener = tokio::net::TcpListener::bind(&addr).await?;
    println!("Stash server → http://{addr}");
    println!("  Static : {}", static_path.display());
    println!("  Claude : {}", claude_path.display());
    axum::serve(listener, app).await?;
    Ok(())
}
