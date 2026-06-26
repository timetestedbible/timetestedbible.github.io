# Desktop release guide (maintainer)

Two desktop shells, one shared web frontend (`_site`):

| | dir | role | size |
|---|---|---|---|
| **Tauri** | `_dev/desktop-tauri/` | default build (OS webview) | `.dmg` ≈ 110 MB |
| **Electron** | `_dev/desktop/` | compatibility fallback (bundled Chromium) | larger |

Both expose the same native API to the app via `desktop-bridge.js` → `window.Native`.

## Cutting a release (CI)

1. Bump versions: `_dev/desktop-tauri/src-tauri/tauri.conf.json` (`version`) and
   `_dev/desktop/package.json` (`version`). Keep them in sync.
2. Edit **`_dev/desktop-release-notes.md`** → fill in "What's new" (this becomes the GitHub
   Release body).
3. Tag and push: `git tag v2.2.0 && git push origin v2.2.0`.
4. The **`.github/workflows/desktop-release.yml`** workflow builds **both shells** on
   macOS (arm64 + x64), Windows, and Linux runners and attaches the installers to a **draft**
   GitHub Release, then un-drafts it.

> ⚠️ The workflow is a **first draft, not yet validated on CI.** Test it against a throwaway
> pre-release tag and iterate before relying on it. Known things to verify: `ruby/setup-ruby`
> + Jekyll on the Windows runner, `tauri-action` picking up our stub-frontend / trimmed-
> resources setup, and electron-builder's native-arch output names matching the upload globs.

## Building locally

- **Tauri:** `_dev/desktop-tauri/build-dmg.sh` (jekyll → trim → `CI=true cargo tauri build`).
  Output: `_dev/desktop-tauri/src-tauri/target/release/bundle/`.
- **Electron:** `_dev/desktop/build.sh` (interactive; builds all 5 targets locally and
  collects them into `dist/v<version>/`). Note: cross-building Windows/Linux from macOS is
  unreliable (wine/signing) — prefer CI for non-mac targets.

## Signing & notarization — intentionally skipped

We **do not sign** the builds (signing/notarization carries yearly cost). Users approve the
app once via the OS — those exact steps are in `desktop-release-notes.md` (macOS: Privacy &
Security → Open Anyway, or `xattr -dr com.apple.quarantine`; Windows: SmartScreen → Run
anyway; Linux: `chmod +x` / `apt install`). Keep those instructions on the download page too.

If that ever changes, the workflow already has commented env slots; add GitHub secrets:
- **macOS:** `APPLE_CERTIFICATE`, `APPLE_CERTIFICATE_PASSWORD`, `APPLE_SIGNING_IDENTITY`,
  `APPLE_ID`, `APPLE_PASSWORD`, `APPLE_TEAM_ID` (Electron also needs `mac.identity` set in
  `package.json`; currently `null`).
- **Windows:** a code-signing cert.

## Auto-update — content via GitHub Releases

Both updaters pull from the **latest published release** permalink (no API, no rate limits,
skips drafts/prereleases):
- `…/releases/latest/download/version.js` → compare APP_VERSION to the installed bundle's.
- `…/releases/latest/download/site-bundle.tar.gz` → if newer, download + serve next launch.

The release workflow's `prepare` job uploads both assets (the bundle is the trimmed,
`.gz`-only site, ~100 MB). So publishing a release automatically offers the new content to
installed 2.2.0+ apps. Release-asset bandwidth doesn't count against the Pages 100 GB/month.

**Scope:** updates **web content** only (`_site` — chapters, reader JS, `desktop-bridge.js`),
not the native shell binary; shell/installer changes ship as new `.dmg`/`.exe` in the release.

**Reach:** the updater URL is baked into each build, so **only 2.2.0+ apps use Releases**.
Older v2.1.0 installs point at the previous (always-404) Pages URL and have never
auto-updated — no regression; they update by re-downloading.

## Versioning

Tauri reads its version from `tauri.conf.json`; Electron from `package.json`. The
**content** version (for auto-update) is the Jekyll `APP_VERSION` (build timestamp in
`version.js`) baked into each bundle.

## Open items checklist
- [ ] Validate `desktop-release.yml` on a test tag; fix runner/platform issues.
- [x] Signing: intentionally skipped — surface the "open unsigned build" steps on the
      download page (from `desktop-release-notes.md`).
- [ ] Publish `site-bundle.tar.gz` to the Pages root to enable auto-update.
- [ ] Decide Linux arm64 (the workflow currently builds Linux x64 only).
- [ ] Point the website's download links at the new releases (Standard = Tauri,
      Compatibility = Electron), and tag the GoatCounter event with the edition.
