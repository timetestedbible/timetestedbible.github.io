# Time Tested Bible - Desktop App

Electron-based desktop application for Time Tested Bible Study.

## Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later recommended)
- npm (comes with Node.js)
- Jekyll (for building the web app)

## Quick Start

```bash
# Install dependencies
npm install

# Run the app in development mode
npm start

# Run with DevTools open
npm start -- --dev
```

## Building for Distribution

### Using the Build Script (Recommended)

```bash
# Build for macOS
./build.sh mac

# Build for Windows
./build.sh win

# Build for Linux
./build.sh linux

# Build for ALL platforms
./build.sh all
```

### Manual Build

```bash
npm run build:mac    # macOS (.dmg, .zip)
npm run build:win    # Windows (.exe installer, portable)
npm run build:linux  # Linux (.AppImage, .deb)
```

Built applications will be in the `dist/` folder.

## Important: Jekyll Build Required

The app serves files from `../http/_site/` (Jekyll's built output). Before building the desktop app, make sure Jekyll has been built:

```bash
cd ../http
bundle exec jekyll build
```

## Project Structure

```
desktop/
├── build.sh      # Build script for all platforms
├── main.js       # Electron main process
├── preload.js    # Secure bridge to renderer
├── package.json  # Dependencies and build config
└── dist/         # Built applications (after build)

../http/_site/    # Jekyll built output (served by Electron)
```

## Output Files

| Platform | Files |
|----------|-------|
| macOS | `Time Tested Bible-x.x.x-arm64.dmg`, `.zip` |
| Windows | `Time Tested Bible Setup x.x.x.exe`, portable `.exe` |
| Linux | `Time Tested Bible-x.x.x.AppImage`, `.deb` |

## Features

- Full offline support - no internet required
- Native menus and keyboard shortcuts
- Cross-platform (Windows, macOS, Linux)
- All Bible data bundled with the app
- localStorage for saving user settings

## Code Signing (Optional)

Without code signing, users will see security warnings:
- **macOS**: "App from unidentified developer" - bypass with right-click → Open
- **Windows**: SmartScreen warning - click "More info" → "Run anyway"
- **Linux**: No warnings

For professional distribution, consider:
- macOS: Apple Developer certificate ($99/year)
- Windows: Code signing certificate ($70-500/year)
