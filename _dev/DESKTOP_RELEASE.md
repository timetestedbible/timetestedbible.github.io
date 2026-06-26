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

## Signing & notarization (TODO before public distribution)

Builds are currently **unsigned**, so users hit Gatekeeper (macOS) / SmartScreen (Windows) —
documented in the release notes. To sign, add GitHub secrets and the workflow picks them up:

- **macOS:** `APPLE_CERTIFICATE`, `APPLE_CERTIFICATE_PASSWORD`, `APPLE_SIGNING_IDENTITY`,
  `APPLE_ID`, `APPLE_PASSWORD` (app-specific), `APPLE_TEAM_ID`. (Electron: set `mac.identity`
  in `package.json`; it's currently `null` = unsigned.)
- **Windows:** a code-signing cert (e.g. `WINDOWS_CERTIFICATE` / password, or an Azure
  Trusted Signing / EV setup).

## Auto-update (currently broken server-side)

Both updaters fetch `https://timetested.bible/site-bundle.tar.gz` and compare
`/version.js`. That URL currently **404s** — the site doesn't publish the bundle — so
auto-update *download* fails for **both** shells (they fall back to the built-in content; no
crash). To enable auto-update, publish `site-bundle.tar.gz` at the Pages site root on each
deploy:

- `_dev/desktop/build.sh` already generates it into `_site/`; the **Pages build**
  (`jekyll.yml`) does not. Add a step to the Pages deploy that runs
  `tar czf _site/site-bundle.tar.gz -C _site --exclude=site-bundle.tar.gz .` so it lands at
  the site root, or host it as a release asset and point the updaters there.

## Versioning

Tauri reads its version from `tauri.conf.json`; Electron from `package.json`. The
**content** version (for auto-update) is the Jekyll `APP_VERSION` (build timestamp in
`version.js`) baked into each bundle.

## Open items checklist
- [ ] Validate `desktop-release.yml` on a test tag; fix runner/platform issues.
- [ ] Add code-signing secrets (macOS notarization, Windows).
- [ ] Publish `site-bundle.tar.gz` to the Pages root to enable auto-update.
- [ ] Decide Linux arm64 (the workflow currently builds Linux x64 only).
- [ ] Point the website's download links at the new releases (Standard = Tauri,
      Compatibility = Electron), and tag the GoatCounter event with the edition.
