#!/bin/bash

# Time Tested Bible - Build Script
# Builds desktop app for macOS, Windows, and Linux

set -e  # Exit on error

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}======================================${NC}"
echo -e "${GREEN}  Time Tested Bible - Build Script${NC}"
echo -e "${GREEN}======================================${NC}"
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing dependencies...${NC}"
    npm install
fi

# Build Jekyll first
echo -e "${YELLOW}Building Jekyll site...${NC}"
cd ../http
if command -v bundle &> /dev/null; then
    bundle exec jekyll build
else
    jekyll build
fi
cd "$SCRIPT_DIR"
echo -e "${GREEN}Jekyll build complete!${NC}"

# Verify _site exists
if [ ! -d "../http/_site" ]; then
    echo -e "${RED}Error: Jekyll build failed - ../http/_site not found!${NC}"
    exit 1
fi

# Function to build for a platform
build_platform() {
    local platform=$1
    echo ""
    echo -e "${GREEN}Building for ${platform}...${NC}"
    npm run build:${platform}
    echo -e "${GREEN}${platform} build complete!${NC}"
}

# Parse command line arguments
if [ $# -eq 0 ]; then
    echo "Usage: ./build.sh [platform]"
    echo ""
    echo "Platforms:"
    echo "  mac     - Build for macOS (.dmg, .zip)"
    echo "  win     - Build for Windows (.exe installer, portable)"
    echo "  linux   - Build for Linux (.AppImage, .deb)"
    echo "  all     - Build for all platforms"
    echo ""
    echo "Examples:"
    echo "  ./build.sh mac"
    echo "  ./build.sh all"
    exit 0
fi

case $1 in
    mac)
        build_platform "mac"
        ;;
    win)
        build_platform "win"
        ;;
    linux)
        build_platform "linux"
        ;;
    all)
        build_platform "mac"
        build_platform "win"
        build_platform "linux"
        ;;
    *)
        echo -e "${RED}Unknown platform: $1${NC}"
        echo "Use: mac, win, linux, or all"
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}======================================${NC}"
echo -e "${GREEN}  Build complete!${NC}"
echo -e "${GREEN}======================================${NC}"
echo ""
echo "Output files are in: $SCRIPT_DIR/dist/"
echo ""
ls -lh dist/*.dmg dist/*.zip dist/*.exe dist/*.AppImage dist/*.deb 2>/dev/null || true
