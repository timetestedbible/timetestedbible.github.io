#!/bin/bash

# Time Tested Bible — Release Build Script
# Builds desktop apps for macOS, Windows, and Linux (all architectures)
# All 5 builds run in parallel for speed.
# Output goes to dist/v{version}/ so previous releases are preserved.

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

# ── Read current version from package.json ──
CURRENT_VERSION=$(node -p "require('./package.json').version")

echo -e "${GREEN}${BOLD}════════════════════════════════════════${NC}"
echo -e "${GREEN}${BOLD}  Time Tested Bible — Release Builder${NC}"
echo -e "${GREEN}${BOLD}════════════════════════════════════════${NC}"
echo ""
echo -e "  Current version: ${CYAN}${CURRENT_VERSION}${NC}"
echo ""

# Show existing builds
if ls -d dist/v* 2>/dev/null | head -5 > /dev/null 2>&1; then
    echo -e "  ${BOLD}Existing builds:${NC}"
    for d in dist/v*/; do
        [ -d "$d" ] && echo -e "    ${CYAN}${d%/}${NC}"
    done
    echo ""
fi

# ── Prompt for version ──
read -p "  Enter release version [${CURRENT_VERSION}]: " NEW_VERSION
NEW_VERSION="${NEW_VERSION:-$CURRENT_VERSION}"

DIST_DIR="dist/v${NEW_VERSION}"

# Check if this version already exists
if [ -d "$DIST_DIR" ]; then
    echo ""
    read -p "  ${DIST_DIR} already exists. Overwrite? [y/N]: " OVERWRITE
    if [ "$OVERWRITE" != "y" ] && [ "$OVERWRITE" != "Y" ]; then
        echo -e "  ${YELLOW}Aborted.${NC}"
        exit 0
    fi
    rm -rf "$DIST_DIR"
fi

echo ""
echo -e "  Building version: ${CYAN}${BOLD}${NEW_VERSION}${NC}"
echo -e "  Output directory: ${CYAN}${DIST_DIR}/${NC}"
echo ""

# ── Update version in package.json ──
if [ "$NEW_VERSION" != "$CURRENT_VERSION" ]; then
    node -e "
      const fs = require('fs');
      const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      pkg.version = '${NEW_VERSION}';
      fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
    "
    echo -e "  ${GREEN}Updated package.json version to ${NEW_VERSION}${NC}"
fi

# ── Install dependencies if needed ──
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}  Installing dependencies...${NC}"
    npm install
fi

# ── Create output directory ──
mkdir -p "${DIST_DIR}/logs"

# electron-builder writes to the "output" dir configured in package.json (dist/).
# We build into dist/ then move artifacts into dist/v{version}/ after each build.
# To avoid conflicts between parallel builds, we use a staging dir per job.

# ── Build all platforms in parallel ──
echo ""
echo -e "${GREEN}${BOLD}  Starting 5 parallel builds...${NC}"
echo ""
echo -e "  ${CYAN}[1/5]${NC} macOS ARM64    (Apple Silicon)"
echo -e "  ${CYAN}[2/5]${NC} macOS x64      (Intel Mac)"
echo -e "  ${CYAN}[3/5]${NC} Windows x64    (installer + portable)"
echo -e "  ${CYAN}[4/5]${NC} Linux x64      (AppImage + deb)"
echo -e "  ${CYAN}[5/5]${NC} Linux ARM64    (AppImage + deb)"
echo ""

FAIL=0
START_TIME=$SECONDS

# Each build uses a separate --config.directories.output to avoid file conflicts
build_job() {
    local job_name=$1 staging=$2 logfile=$3
    shift 3
    # Run electron-builder with a unique output dir
    mkdir -p "$staging"
    npx electron-builder "$@" --config.directories.output="$staging" \
        > "${DIST_DIR}/logs/${logfile}" 2>&1
}

# macOS ARM64
build_job "mac-arm64" "dist/_stage-mac-arm64" "mac-arm64.log" \
    --mac --arm64 &
PID_MAC_ARM64=$!

# macOS x64
build_job "mac-x64" "dist/_stage-mac-x64" "mac-x64.log" \
    --mac --x64 &
PID_MAC_X64=$!

# Windows x64
build_job "win-x64" "dist/_stage-win-x64" "win-x64.log" \
    --win --x64 &
PID_WIN_X64=$!

# Linux x64
build_job "linux-x64" "dist/_stage-linux-x64" "linux-x64.log" \
    --linux --x64 &
PID_LINUX_X64=$!

# Linux ARM64
build_job "linux-arm64" "dist/_stage-linux-arm64" "linux-arm64.log" \
    --linux --arm64 &
PID_LINUX_ARM64=$!

# ── Wait for all builds, report each as it finishes ──
wait_for() {
    local pid=$1 name=$2 logfile=$3
    if wait "$pid"; then
        echo -e "  ${GREEN}✓${NC} ${name} ${GREEN}done${NC}"
    else
        echo -e "  ${RED}✗${NC} ${name} ${RED}FAILED${NC} — see ${DIST_DIR}/logs/${logfile}"
        FAIL=1
    fi
}

echo -e "  ${YELLOW}Waiting for builds to complete...${NC}"
echo ""

wait_for $PID_MAC_ARM64   "macOS ARM64 " "mac-arm64.log"
wait_for $PID_MAC_X64     "macOS x64   " "mac-x64.log"
wait_for $PID_WIN_X64     "Windows x64 " "win-x64.log"
wait_for $PID_LINUX_X64   "Linux x64   " "linux-x64.log"
wait_for $PID_LINUX_ARM64 "Linux ARM64 " "linux-arm64.log"

ELAPSED=$(( SECONDS - START_TIME ))
MINUTES=$(( ELAPSED / 60 ))
SECS=$(( ELAPSED % 60 ))

echo ""

# ── Collect artifacts from staging dirs into versioned output ──
echo -e "  ${YELLOW}Collecting artifacts...${NC}"

# Move release files (dmg, exe, AppImage, deb) from staging dirs, skip unpacked dirs and blockmaps
for stage in dist/_stage-*/; do
    [ -d "$stage" ] || continue
    for f in "$stage"/*.dmg "$stage"/*.exe "$stage"/*.AppImage "$stage"/*.deb "$stage"/*.zip; do
        [ -f "$f" ] && mv "$f" "${DIST_DIR}/"
    done
done

# Clean up staging dirs
rm -rf dist/_stage-*

if [ $FAIL -ne 0 ]; then
    echo ""
    echo -e "${RED}${BOLD}  Some builds failed. Check logs in ${DIST_DIR}/logs/${NC}"
    exit 1
fi

# ── List release artifacts ──
echo ""
echo -e "${GREEN}${BOLD}════════════════════════════════════════${NC}"
echo -e "${GREEN}${BOLD}  All builds complete! (${MINUTES}m ${SECS}s)${NC}"
echo -e "${GREEN}${BOLD}════════════════════════════════════════${NC}"
echo ""
echo -e "  ${BOLD}Release artifacts in ${DIST_DIR}/:${NC}"
echo ""

for f in "${DIST_DIR}"/*.dmg "${DIST_DIR}"/*.exe "${DIST_DIR}"/*.AppImage "${DIST_DIR}"/*.deb; do
    if [ -f "$f" ]; then
        SIZE=$(ls -lh "$f" | awk '{print $5}')
        BASENAME=$(basename "$f")
        echo -e "  ${GREEN}✓${NC} ${BASENAME}  ${CYAN}(${SIZE})${NC}"
    fi
done

echo ""
echo -e "  Upload these to: ${CYAN}https://github.com/timetestedbible/timetestedbible.github.io/releases/new${NC}"
echo -e "  Suggested tag:   ${CYAN}v${NEW_VERSION}${NC}"
echo ""
