#!/bin/bash
# CI Full Build Pipeline
# Usage: ./scripts/ci-build.sh --siteUrl=https://ai.example.com --siteName=智脑AI --licenseKey=YPRO-XXXX --color=#4F46E5 [--logo=logo.png] [--platform=mac]
#
# Steps:
#   1. Install dependencies
#   2. Inject brand config
#   3. Bundle Node.js runtime
#   4. Build React + Electron
#   5. Package with electron-builder
#   6. Output: release/ directory with .exe / .dmg / .AppImage

set -e
cd "$(dirname "$0")/.."
ROOT=$(pwd)

echo "========================================"
echo "  YourClaw CI Build Pipeline"
echo "========================================"

# Parse args
PLATFORM_ARG=""
for arg in "$@"; do
  case "$arg" in
    --platform=*) PLATFORM_ARG="${arg#*=}" ;;
  esac
done

# Step 1: Install deps
echo ""
echo "[1/5] Installing dependencies..."
npm ci --prefer-offline 2>/dev/null || npm install

# Step 2: Brand injection
echo ""
echo "[2/5] Injecting brand config..."
node scripts/build-branded.js "$@"

# Step 3: Bundle Node.js
echo ""
echo "[3/5] Bundling Node.js runtime..."
if [ "$PLATFORM_ARG" = "win" ]; then
  bash scripts/bundle-node.sh win32 x64
elif [ "$PLATFORM_ARG" = "mac-arm64" ]; then
  bash scripts/bundle-node.sh darwin arm64
elif [ "$PLATFORM_ARG" = "mac" ] || [ "$PLATFORM_ARG" = "mac-x64" ]; then
  bash scripts/bundle-node.sh darwin x64
elif [ "$PLATFORM_ARG" = "linux" ]; then
  bash scripts/bundle-node.sh linux x64
else
  # Default: current platform
  bash scripts/bundle-node.sh
fi

# Step 4: Build React + Electron
echo ""
echo "[4/5] Building React + Electron..."
npm run build

# Step 5: Package
echo ""
echo "[5/5] Packaging with electron-builder..."
if [ "$PLATFORM_ARG" = "win" ]; then
  npx electron-builder --win
elif [ "$PLATFORM_ARG" = "mac" ] || [ "$PLATFORM_ARG" = "mac-x64" ] || [ "$PLATFORM_ARG" = "mac-arm64" ]; then
  npx electron-builder --mac
elif [ "$PLATFORM_ARG" = "linux" ]; then
  npx electron-builder --linux
elif [ -n "$PLATFORM_ARG" ]; then
  npx electron-builder --$PLATFORM_ARG
else
  npx electron-builder
fi

echo ""
echo "========================================"
echo "  Build Complete!"
echo "========================================"
echo "Output directory: $ROOT/release/"
ls -lh "$ROOT/release/" 2>/dev/null || echo "(empty)"
