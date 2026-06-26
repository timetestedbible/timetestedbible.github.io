# Time Tested Bible — Tauri desktop shell

A lightweight desktop shell built with **Tauri 2**, intended as the **default** desktop
build (small, low-RAM, uses the OS webview). The existing **Electron** shell
(`_dev/desktop/`) stays as the **compatibility fallback** for platforms where the native
webview is unreliable (older Linux / WebKitGTK, pre-WebView2 Windows).

Both shells load the **same** web app (`/_site`) and expose the **same** native surface,
so the frontend code is identical. The app talks to whichever shell it's in through
`/desktop-bridge.js` → `window.Native`.

```
window.Native.{ kind, isDesktop, platform, listBundles, switchToVersion, revertToBuiltin, restartApp }
   ├── Electron  → window.electronAPI (preload)              _dev/desktop/
   ├── Tauri     → window.__TAURI__ → Rust commands          _dev/desktop-tauri/   ← this
   └── web/PWA   → no-ops
```

## What this shell does (mirrors the Electron one)

- Serves the active site bundle over an `app://` scheme with SPA fallback
  (`src-tauri/src/main.rs`), so no local HTTP server is needed.
- Background-checks `https://timetested.bible/version.js`, downloads
  `site-bundle.tar.gz`, extracts it, and serves it on next launch
  (`src-tauri/src/updater.rs` — a direct port of `_dev/desktop/updater.js`).
- **Identical on-disk bundle layout** as Electron, so the version picker behaves the same:
  `<app-data>/site-bundles/current-version` + `site-bundles/v<version>/`.
- Implements the four commands the bridge calls: `list_bundles`, `switch_to_version`,
  `revert_to_builtin`, `restart_app`.

## Prerequisites

- Rust (stable) + Cargo — https://rustup.rs
- Tauri CLI: `cargo install tauri-cli --version "^2"` (or `npm i -g @tauri-apps/cli@^2`)
- Platform deps per https://tauri.app/start/prerequisites (e.g. WebKitGTK on Linux,
  WebView2 on Windows — preinstalled on Win11/most Win10).

## Run (dev)

```bash
# 1. Build the web app so _site exists (from repo root):
bundle exec jekyll build

# 2. Run the desktop app — no tauri-cli needed; it serves _site via app://
cd _dev/desktop-tauri/src-tauri
cargo run            # first build ~1 min, then the window opens
```

In dev the app serves `_site` straight from the repo (the `builtin_path()` fallback).

## Build the installer (.dmg / .app)

```bash
cargo install tauri-cli --version "^2"                 # one-time
cd _dev/desktop-tauri/src-tauri
cargo tauri icon ../../../icons/icon-512.png           # one-time: full .icns/.ico set
cd ..  &&  ./build-dmg.sh
```

`build-dmg.sh` runs the whole pipeline: `jekyll build` → `node build-desktop-site.js` (trim)
→ `CI=true cargo tauri build`. Output: `src-tauri/target/release/bundle/dmg/*.dmg` (+ `.app`).

`CI=true` is required on **headless** macOS — the dmg's Finder/AppleScript window styling
fails without a GUI session; it's harmless on a normal desktop session.

## Size optimizations

The naive bundle was ~290 MB. Two fixes (both in place):

1. **Stub frontend.** `build.frontendDist` → `frontend-stub/` (one placeholder `index.html`)
   instead of `_site`. Tauri's `generate_context!()` embeds frontendDist **into the binary**;
   the stub stops ~120 MB of `_site` being baked in (the app serves the real site from
   bundled resources via `app://`, never the embedded copy).
2. **Compressed-only resources.** `build-desktop-site.js` hard-links `_site` into
   `desktop-site/` but drops every uncompressed file that has a `.gz` twin (~129 MB). The app
   fetches `.gz` and unpacks just-in-time (`DecompressionStream`), so the plain copies are
   dead weight. `bundle.resources` points at `desktop-site/`.

## Status — verified building + running

Built and launched on **macOS arm64 / Tauri 2.11.3 / Rust 1.94**:

- Compiles clean (no warnings, ~1 min cold).
- Window opens and the full reader renders: the webview loads `app://localhost/index.html`
  and the Rust handler served all **78 assets** (HTML/CSS/JS/`swisseph.wasm`/data). The
  config-based `app://` window URL works as-is — no programmatic window needed.
- `desktop-bridge.js` detects `window.__TAURI__` → `window.Native.kind === 'tauri'`, routing
  the version-picker calls to the Rust commands.

Still to do before distribution:

1. **Icons / signing.** Generate the full icon set (`cargo tauri icon`) and add macOS
   notarization + Windows code-signing, same as the Electron pipeline.
2. **CSP.** `security.csp` is `null` (permissive) — tighten before release.
3. **Cross-platform.** Verified on macOS (WKWebView). Test Windows (WebView2) and especially
   Linux (WebKitGTK) — the latter is exactly why the Electron build remains the fallback.

## Distribution split (suggested)

- **Tauri = default download** for macOS + Windows.
- **Electron = fallback** for older Linux / pre-WebView2 Windows (or keep Electron only for
  Linux to minimize dual-maintenance).
- Tag the GoatCounter download event with the edition (e.g. `?edition=tauri|electron`) to
  see the split.

## Shared with the Electron shell — keep in sync

`updater.rs` (Rust) and `_dev/desktop/updater.js` (Node) must stay behaviorally identical:
same version source (`/version.js`), same bundle URL (`/site-bundle.tar.gz`), same on-disk
layout. If you change the bundle format on the server, update **both**.
