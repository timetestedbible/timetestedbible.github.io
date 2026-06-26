//! Site-bundle updater — Rust port of `_dev/desktop/updater.js`.
//!
//! Mirrors the Electron app exactly so the two desktop shells behave identically:
//!   - checks https://timetested.bible/version.js for a newer APP_VERSION
//!   - downloads site-bundle.tar.gz, extracts it, serves from it next launch
//!
//! On-disk layout under the app data dir (same scheme as Electron):
//!   site-bundles/
//!     current-version        (text file containing the active version number)
//!     v<version>/            (extracted site bundle; must contain index.html)

use serde::Serialize;
use std::fs;
use std::path::{Path, PathBuf};

// Content updates ride with GitHub Releases — the `latest/download/<asset>` permalink
// always serves the newest published (non-draft, non-prerelease) release's asset, with no
// API call or rate limits. The desktop-release workflow uploads version.js +
// site-bundle.tar.gz to each release. (ureq follows the 302 to the asset host.)
const RELEASES_URL: &str =
    "https://github.com/timetestedbible/timetestedbible.github.io/releases/latest/download";

fn version_url() -> String {
    format!("{RELEASES_URL}/version.js")
}
fn bundle_url() -> String {
    format!("{RELEASES_URL}/site-bundle.tar.gz")
}

/// `<app_data_dir>/site-bundles`
pub fn bundles_dir(app_data_dir: &Path) -> PathBuf {
    app_data_dir.join("site-bundles")
}
fn current_file(app_data_dir: &Path) -> PathBuf {
    bundles_dir(app_data_dir).join("current-version")
}

/// One entry in the version picker — identical shape to the Electron JSON.
#[derive(Serialize, Clone)]
pub struct Bundle {
    pub version: u64,
    pub path: String,
    pub active: bool,
    pub builtin: bool,
}

/// Path of the latest downloaded bundle, or None to fall back to the built-in one.
pub fn get_updated_bundle_path(app_data_dir: &Path) -> Option<PathBuf> {
    let cur = current_file(app_data_dir);
    let version = fs::read_to_string(&cur).ok()?.trim().to_string();
    if version.is_empty() {
        return None;
    }
    let bundle = bundles_dir(app_data_dir).join(format!("v{version}"));
    if bundle.join("index.html").is_file() {
        Some(bundle)
    } else {
        None
    }
}

/// Parse `const APP_VERSION = 1234567890;` out of a version.js string.
fn parse_version(js: &str) -> Option<u64> {
    let idx = js.find("APP_VERSION")?;
    let after = &js[idx..];
    let eq = after.find('=')?;
    after[eq + 1..]
        .trim_start()
        .chars()
        .take_while(|c| c.is_ascii_digit())
        .collect::<String>()
        .parse()
        .ok()
}

/// The APP_VERSION inside a bundle's version.js (built-in or downloaded).
pub fn get_local_version(bundle_path: &Path) -> Option<u64> {
    let js = fs::read_to_string(bundle_path.join("version.js")).ok()?;
    parse_version(&js)
}

/// The current remote APP_VERSION (None if offline / unreachable).
pub fn fetch_remote_version() -> Option<u64> {
    let body = ureq::get(&version_url()).call().ok()?.into_string().ok()?;
    parse_version(&body)
}

/// Download + extract the bundle for `version`. Returns true on success.
/// Uses pure-Rust gzip+tar (flate2 + tar) — no dependency on a system `tar`.
pub fn download_bundle(app_data_dir: &Path, version: u64) -> bool {
    let dir = bundles_dir(app_data_dir);
    let dest = dir.join(format!("v{version}"));
    let tmp = dir.join("downloading");

    let run = || -> std::io::Result<()> {
        fs::create_dir_all(&dir)?;
        if tmp.exists() {
            fs::remove_dir_all(&tmp)?;
        }
        fs::create_dir_all(&tmp)?;

        // Download to memory then stream-extract.
        let resp = ureq::get(&bundle_url())
            .call()
            .map_err(|e| std::io::Error::new(std::io::ErrorKind::Other, e.to_string()))?;
        let reader = resp.into_reader();
        let gz = flate2::read::GzDecoder::new(reader);
        let mut archive = tar::Archive::new(gz);
        archive.unpack(&tmp)?;

        // Verify
        if !tmp.join("index.html").is_file() {
            return Err(std::io::Error::new(
                std::io::ErrorKind::Other,
                "downloaded bundle missing index.html",
            ));
        }

        // Atomic-ish swap
        if dest.exists() {
            fs::remove_dir_all(&dest)?;
        }
        fs::rename(&tmp, &dest)?;
        fs::write(current_file(app_data_dir), version.to_string())?;
        Ok(())
    };

    match run() {
        Ok(()) => {
            eprintln!("[Updater] Installed site bundle v{version}");
            true
        }
        Err(e) => {
            eprintln!("[Updater] Download failed: {e}");
            let _ = fs::remove_dir_all(&tmp);
            false
        }
    }
}

/// Delete the current-version marker → next launch serves the built-in bundle.
pub fn revert_to_builtin(app_data_dir: &Path) -> bool {
    let cur = current_file(app_data_dir);
    if cur.exists() {
        if let Err(e) = fs::remove_file(&cur) {
            eprintln!("[Updater] Revert failed: {e}");
            return false;
        }
    }
    true
}

/// List built-in + downloaded bundles, newest first. Mirrors listBundles() in JS.
pub fn list_bundles(app_data_dir: &Path, builtin_path: &Path) -> Vec<Bundle> {
    let active = fs::read_to_string(current_file(app_data_dir))
        .ok()
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty());

    let mut out: Vec<Bundle> = Vec::new();

    if let Some(v) = get_local_version(builtin_path) {
        out.push(Bundle {
            version: v,
            path: builtin_path.display().to_string(),
            active: active.is_none(),
            builtin: true,
        });
    }

    if let Ok(entries) = fs::read_dir(bundles_dir(app_data_dir)) {
        for entry in entries.flatten() {
            let p = entry.path();
            if !p.is_dir() {
                continue;
            }
            let name = entry.file_name().to_string_lossy().to_string();
            if !name.starts_with('v') {
                continue;
            }
            if let Some(v) = get_local_version(&p) {
                out.push(Bundle {
                    version: v,
                    path: p.display().to_string(),
                    active: active.as_deref() == Some(v.to_string().as_str()),
                    builtin: false,
                });
            }
        }
    }

    out.sort_by(|a, b| b.version.cmp(&a.version));
    out
}

/// Point the current-version marker at an already-downloaded bundle.
pub fn switch_to_version(app_data_dir: &Path, version: u64) -> bool {
    let bundle = bundles_dir(app_data_dir).join(format!("v{version}"));
    if !bundle.join("index.html").is_file() {
        return false;
    }
    let dir = bundles_dir(app_data_dir);
    if fs::create_dir_all(&dir).is_err() {
        return false;
    }
    fs::write(current_file(app_data_dir), version.to_string()).is_ok()
}

/// Background check: returns Some(new_version) if a newer bundle was downloaded.
pub fn check_for_updates(app_data_dir: &Path, serving_path: &Path) -> Option<u64> {
    let local = get_local_version(serving_path)?;
    let remote = fetch_remote_version()?;
    if remote <= local {
        return None;
    }
    eprintln!("[Updater] Update available: {local} -> {remote}");
    if download_bundle(app_data_dir, remote) {
        Some(remote)
    } else {
        None
    }
}
