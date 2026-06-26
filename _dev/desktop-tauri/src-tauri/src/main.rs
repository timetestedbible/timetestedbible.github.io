// Prevents an extra console window on Windows in release builds.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

//! Tauri desktop shell for Time Tested Bible.
//!
//! Mirrors the Electron shell (`_dev/desktop/main.js` + `updater.js`):
//!   - serves the active site bundle (downloaded > built-in) over an `app://` scheme
//!     with SPA fallback, so no HTTP server is needed
//!   - background-checks timetested.bible for a newer bundle, downloads + extracts it
//!   - exposes the SAME commands the unified JS bridge (desktop-bridge.js) calls:
//!     list_bundles, switch_to_version, revert_to_builtin, restart_app
//!
//! NOTE: this is an unverified scaffold — it has NOT been compiled here. The exact
//! `register_uri_scheme_protocol` closure signature / return type and a few path APIs
//! may need minor adjustment against the installed Tauri 2.x version. See README.

mod updater;

use std::borrow::Cow;
use std::path::{Path, PathBuf};
use tauri::{Manager, http};

/// Resolved at startup; read by the `app://` protocol handler and the commands.
struct AppState {
    /// The bundle currently being served (downloaded bundle, or built-in).
    serving_path: PathBuf,
    /// The shipped, built-in bundle (used as the "Built-in" picker entry + fallback).
    builtin_path: PathBuf,
}

/// Where the shipped `_site` lives: bundled as a resource in production, repo path in dev.
fn builtin_path(app: &tauri::AppHandle) -> PathBuf {
    if let Ok(res) = app.path().resource_dir() {
        let p = res.join("_site");
        if p.join("index.html").is_file() {
            return p;
        }
    }
    // Dev fallback: the repo's Jekyll output, relative to this crate.
    PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("../../../_site")
}

fn app_data_dir(app: &tauri::AppHandle) -> PathBuf {
    app.path().app_data_dir().unwrap_or_else(|_| PathBuf::from("."))
}

fn content_type(path: &Path) -> &'static str {
    match path.extension().and_then(|e| e.to_str()).unwrap_or("") {
        "html" => "text/html; charset=utf-8",
        "js" | "mjs" => "text/javascript; charset=utf-8",
        "css" => "text/css; charset=utf-8",
        "json" => "application/json; charset=utf-8",
        "svg" => "image/svg+xml",
        "png" => "image/png",
        "jpg" | "jpeg" => "image/jpeg",
        "webp" => "image/webp",
        "gif" => "image/gif",
        "ico" => "image/x-icon",
        "woff2" => "font/woff2",
        "woff" => "font/woff",
        "ttf" => "font/ttf",
        "gz" => "application/gzip",
        "pdf" => "application/pdf",
        "txt" => "text/plain; charset=utf-8",
        "wasm" => "application/wasm",
        _ => "application/octet-stream",
    }
}

fn respond(status: u16, ct: &str, body: Vec<u8>) -> http::Response<Cow<'static, [u8]>> {
    http::Response::builder()
        .status(status)
        .header("Content-Type", ct)
        .header("Access-Control-Allow-Origin", "*")
        .body(Cow::Owned(body))
        .unwrap()
}

/// Serve a file from the active bundle, mirroring the Electron `app://` handler:
/// exact file → `+.html` → `dir/index.html` → SPA fallback to root index.html → 404.
fn serve(serving: &Path, url_path: &str) -> http::Response<Cow<'static, [u8]>> {
    let mut pathname = percent_decode(url_path);
    if pathname.is_empty() || pathname == "/" {
        pathname = "/index.html".to_string();
    }

    let file_path = serving.join(pathname.trim_start_matches('/'));

    // Security: prevent directory traversal outside the bundle.
    if let Ok(canon) = file_path.canonicalize() {
        if !canon.starts_with(serving) {
            return respond(403, "text/plain", b"Forbidden".to_vec());
        }
    }

    let try_serve = |p: &Path| -> Option<http::Response<Cow<'static, [u8]>>> {
        if p.is_file() {
            match std::fs::read(p) {
                Ok(bytes) => Some(respond(200, content_type(p), bytes)),
                Err(_) => None,
            }
        } else {
            None
        }
    };

    if let Some(r) = try_serve(&file_path) {
        return r;
    }
    let html = file_path.with_extension("html");
    if let Some(r) = try_serve(&html) {
        return r;
    }
    if let Some(r) = try_serve(&file_path.join("index.html")) {
        return r;
    }
    // SPA fallback for extensionless routes (e.g. /bible/kjv/Genesis/1)
    if file_path.extension().is_none() {
        if let Some(r) = try_serve(&serving.join("index.html")) {
            return r;
        }
    }
    respond(404, "text/plain", format!("Not Found: {pathname}").into_bytes())
}

/// Minimal percent-decoding (avoids pulling a crate for one use).
fn percent_decode(s: &str) -> String {
    let bytes = s.as_bytes();
    let mut out = Vec::with_capacity(bytes.len());
    let mut i = 0;
    while i < bytes.len() {
        if bytes[i] == b'%' && i + 2 < bytes.len() {
            if let Ok(b) = u8::from_str_radix(&s[i + 1..i + 3], 16) {
                out.push(b);
                i += 3;
                continue;
            }
        }
        out.push(bytes[i]);
        i += 1;
    }
    String::from_utf8_lossy(&out).to_string()
}

// ── Commands (called by desktop-bridge.js via window.__TAURI__) ──────────────

#[tauri::command]
fn list_bundles(app: tauri::AppHandle) -> Vec<updater::Bundle> {
    let state = app.state::<AppState>();
    updater::list_bundles(&app_data_dir(&app), &state.builtin_path)
}

#[tauri::command]
fn switch_to_version(app: tauri::AppHandle, version: u64) -> bool {
    updater::switch_to_version(&app_data_dir(&app), version)
}

#[tauri::command]
fn revert_to_builtin(app: tauri::AppHandle) -> bool {
    updater::revert_to_builtin(&app_data_dir(&app))
}

#[tauri::command]
fn restart_app(app: tauri::AppHandle) {
    app.restart();
}

fn main() {
    tauri::Builder::default()
        .register_uri_scheme_protocol("app", |ctx, request| {
            let path = request.uri().path().to_string();
            #[cfg(debug_assertions)]
            eprintln!("[app://] {path}");
            let app = ctx.app_handle();
            let state = app.state::<AppState>();
            serve(&state.serving_path, &path)
        })
        .invoke_handler(tauri::generate_handler![
            list_bundles,
            switch_to_version,
            revert_to_builtin,
            restart_app
        ])
        .setup(|app| {
            let handle = app.handle().clone();
            let data = app_data_dir(&handle);
            let builtin = builtin_path(&handle);
            let serving = updater::get_updated_bundle_path(&data).unwrap_or_else(|| builtin.clone());
            app.manage(AppState {
                serving_path: serving.clone(),
                builtin_path: builtin,
            });

            // Background update check (mirrors Electron's 5s-delayed checkForUpdates).
            std::thread::spawn(move || {
                std::thread::sleep(std::time::Duration::from_secs(5));
                if let Some(v) = updater::check_for_updates(&data, &serving) {
                    if let Some(win) = handle.get_webview_window("main") {
                        let _ = win.eval(&format!(
                            "if(!window.__TT_UPDATE__){{window.__TT_UPDATE__=true;\
                             var b=document.createElement('div');\
                             b.textContent='Update downloaded \\u2014 restart to apply';\
                             b.style.cssText='position:fixed;bottom:0;left:0;right:0;z-index:30000;background:var(--accent-primary);color:var(--color-bg);text-align:center;padding:10px 16px;font-weight:600;cursor:pointer;font-size:14px';\
                             b.onclick=function(){{window.Native&&window.Native.restartApp&&window.Native.restartApp();}};\
                             document.body.appendChild(b);}} /* v{v} */"
                        ));
                    }
                }
            });
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running Time Tested Bible desktop app");
}
