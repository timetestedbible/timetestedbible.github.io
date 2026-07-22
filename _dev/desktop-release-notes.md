# Time Tested Bible — Desktop

The complete Time Tested Bible study app, offline, on your computer.

## What's new in this release
- **Two complete books.** *MEAT — The Bible's Symbolic Language* (all 53 chapters, including
  the new **Ancient Symbols** chapter and the 168-entry Glossary) and the full second edition
  of *TIME Tested Tradition* (with the new **Sabbath** chapter and the Evidence Outline).
- **Chapter plates.** Every chapter opens with its engraved plate, and the book contents
  pages show the art beside each chapter summary, with part breaks and chapter numbers.
- **Bible cross-references into both books.** Tap a verse and the Links tab shows every
  chapter — in either book — that quotes or discusses it, landing on the exact quote.
- **Glossary popups.** Symbol words in both books preview their glossary definition on
  hover or tap.
- **Automatic content updates.** The app now checks GitHub Releases and downloads new book/app content automatically when a new version is published — no reinstall needed.

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
| **macOS** (Apple Silicon & Intel) | `…universal.dmg` | `…-universal.dmg` (Electron) |
| **Windows** | `…_x64-setup.exe` | `…Setup.exe` (Electron) |
| **Linux** | `.AppImage` / `.deb` | `.AppImage` / `.deb` (Electron) |

*(The "Standard" files are the smaller ones. If unsure, download the Standard build for your
platform; switch to Compatibility only if it fails to launch.)*

---

## ⚠️ Opening the app — these builds are unsigned

To keep the app free, the builds are **not code-signed**, so your operating system warns you
the **first** time you open it. This is normal and expected — here's the one-time approval.

### macOS
1. Open the `.dmg` and drag **Time Tested Bible** into **Applications**.
2. The first launch is blocked (*"Apple could not verify…"* / *"unidentified developer"*).
   Do **one** of these:
   - **System Settings → Privacy & Security**, scroll down, and click **Open Anyway** next to
     the *Time Tested Bible* message — then open the app again and confirm; **or**
   - open **Terminal** and run, then launch the app normally:
     ```
     xattr -dr com.apple.quarantine "/Applications/Time Tested Bible.app"
     ```
   *(On older macOS you can also right-click the app → **Open** → **Open**.)*

### Windows
1. Run the installer. **SmartScreen** shows *"Windows protected your PC."*
2. Click **More info → Run anyway**. (If Microsoft Defender quarantines it, choose
   **Allow** — it's a false positive for unsigned independent apps.)

### Linux
- **AppImage:** `chmod +x "Time Tested Bible"*.AppImage` then run it. Some distros need FUSE:
  `sudo apt install libfuse2`.
- **.deb:** `sudo apt install ./"Time Tested Bible"*.deb` (installs dependencies too).

---

## Notes
- Both builds contain the full study app **offline** — every translation, the lexicons,
  interlinear data, the calendar/astronomy engine, and the 2nd-edition book PDF.
- They're the same app and the same data; only the packaging differs.
- These builds are **unsigned by design** (signing/notarization adds yearly cost); the
  one-time approval above is all that's needed.
