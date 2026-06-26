#!/usr/bin/env bash
# Build the Time Tested Bible desktop app (.dmg/.app) end to end.
#
#   1. build the web app  ->  _site
#   2. trim it for the bundle (drop uncompressed files that have a .gz twin)
#   3. bundle with Tauri   (CI=true skips the Finder/AppleScript dmg styling that
#                           fails on headless macOS; harmless on a desktop session)
set -euo pipefail
cd "$(dirname "$0")"                       # _dev/desktop-tauri

echo "==> [1/3] jekyll build"
( cd ../.. && bundle exec jekyll build >/dev/null )

echo "==> [2/3] trim site for bundle"
node build-desktop-site.js

echo "==> [3/3] tauri build"
cd src-tauri
CI=true cargo tauri build

echo "==> done. Bundles:"
ls -lh target/release/bundle/dmg/*.dmg 2>/dev/null || true
