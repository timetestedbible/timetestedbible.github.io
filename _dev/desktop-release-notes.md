# Time Tested Bible — Desktop

The complete Time Tested Bible study app, offline, on your computer.

## What's new in this release
<!-- Fill in per release. Example: -->
- Second edition of *Time Tested Tradition* included.
- New chapter: **Lucifer's Declared Plan** (Isaiah 14).
- *When Does the Year Start?* expanded with the Revelation 12 sign.

---

## Which download do I want?

There are **two builds** of the same app. Pick **one**.

- **Standard (recommended).** Small and fast — uses your operating system's built-in
  web engine.
- **Compatibility.** A larger build that bundles its own web engine. Use this **only if
  the Standard build won't open or renders incorrectly** — most often on **older Linux**
  distributions or **older Windows** without the WebView2 runtime.

| Platform | Standard (recommended) | Compatibility (fallback) |
|---|---|---|
| **macOS (Apple Silicon)** | `…aarch64.dmg` | `…-arm64.dmg` (Electron) |
| **macOS (Intel)** | `…x64.dmg` | `…-x64.dmg` (Electron) |
| **Windows** | `…_x64-setup.exe` / `.msi` | `…Setup.exe` (Electron) |
| **Linux** | `.AppImage` / `.deb` | `.AppImage` / `.deb` (Electron) |

*(The "Standard" files are the smaller ones. If unsure, download the Standard build for your
platform; switch to Compatibility only if it fails to launch.)*

---

## Installing

**macOS** — open the `.dmg`, drag the app to Applications. These builds are **not yet
notarized**, so the first launch shows *"unidentified developer."* Right-click the app →
**Open** → **Open** (once), or run `xattr -cr "/Applications/Time Tested Bible.app"`.

**Windows** — run the installer. SmartScreen may warn ("Windows protected your PC") because
the build isn't code-signed yet → **More info** → **Run anyway**.

**Linux** — `.AppImage`: `chmod +x` and run. `.deb`: `sudo dpkg -i <file>.deb`.
(AppImage may need `libfuse2` on some distros.)

---

## Notes
- Both builds contain the full study app **offline** — every translation, the lexicons,
  interlinear data, the calendar/astronomy engine, and the 2nd-edition book PDF.
- They're the same app and the same data; only the packaging differs.
- These builds are currently **unsigned/un-notarized** — see the install notes above. Signed
  builds are planned.
