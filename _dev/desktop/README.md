# Time Tested Bible - Desktop App

Electron-based desktop application for Time Tested Bible Study.

Uses a custom `app://` protocol handler to serve files directly from disk — no local HTTP server required. This approach is compatible with Apple's App Sandbox and Mac App Store requirements.

## Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later recommended)
- npm (comes with Node.js)

## Quick Start

```bash
# Install dependencies
npm install

# Run the app in development mode
npm start

# Run with DevTools open
npm run start:dev
```

## Building for Distribution

```bash
npm run build:mac    # macOS (.dmg, .zip)
npm run build:win    # Windows (.exe installer, portable)
npm run build:linux  # Linux (.AppImage, .deb)
```

Built applications will be in the `dist/` folder.

## Project Structure

```
desktop/
├── main.js       # Electron main process (custom protocol handler)
├── preload.js    # Secure bridge to renderer (exposes electronAPI)
├── package.json  # Dependencies and build config
└── dist/         # Built applications (after build)

../../             # Web app root (served by Electron via app:// protocol)
```

## How It Works

Instead of running a local HTTP server (the V1 approach), this uses Electron's `protocol.handle()` API to register a custom `app://` scheme. The renderer loads `app://bundle/index.html` and all asset requests (`/styles.css`, `/app-store.js`, etc.) are intercepted and served directly from the filesystem.

Key benefits:
- No network port binding (App Sandbox compatible)
- SPA routing via index.html fallback (same as web server)
- All existing absolute paths work unchanged
- `window.electronAPI.isElectron` flag enables PWA nav buttons

## Output Files

| Platform | Files |
|----------|-------|
| macOS | `Time Tested Bible-x.x.x-arm64.dmg`, `.zip` |
| Windows | `Time Tested Bible Setup x.x.x.exe`, portable `.exe` |
| Linux | `Time Tested Bible-x.x.x.AppImage`, `.deb` |

## Features

- Full offline support — no internet required
- Native menus and keyboard shortcuts
- Cross-platform (Windows, macOS, Linux)
- All Bible data bundled with the app
- localStorage for saving user settings
- PWA navigation buttons (back/forward) visible in app

## Code Signing (Optional)

Without code signing, users will see security warnings:
- **macOS**: "App from unidentified developer" — bypass with right-click > Open
- **Windows**: SmartScreen warning — click "More info" > "Run anyway"
- **Linux**: No warnings

For professional distribution, consider:
- macOS: Apple Developer certificate ($99/year)
- Windows: Code signing certificate ($70-500/year)

## TODO: Apple App Store (MAS)

For Mac App Store distribution, additional work is needed:
- Add `mas` build target in electron-builder config
- Create `entitlements.mas.plist` with App Sandbox entitlements
- Set up Apple Developer account and provisioning profiles
- Configure code signing via `CSC_LINK` and `CSC_KEY_PASSWORD`
- App Store Connect submission and review
