#!/bin/bash
# Downloads and bundles Node.js runtime for the target platform.
# Usage: ./scripts/bundle-node.sh [platform] [arch]
#   platform: win32 | darwin | linux (default: current)
#   arch: x64 | arm64 (default: current)
#
# Output: bundled-node/ directory ready for electron-builder extraResources

set -e

NODE_VERSION="22.19.0"
PLATFORM="${1:-$(uname -s | tr '[:upper:]' '[:lower:]')}"
ARCH="${2:-$(uname -m)}"

# Normalize
case "$PLATFORM" in
  darwin*|Darwin*) PLATFORM="darwin" ;;
  linux*|Linux*)   PLATFORM="linux" ;;
  win*|MINGW*|MSYS*) PLATFORM="win32" ;;
esac

case "$ARCH" in
  x86_64|amd64) ARCH="x64" ;;
  aarch64)      ARCH="arm64" ;;
esac

OUT_DIR="$(cd "$(dirname "$0")/.." && pwd)/bundled-node"
rm -rf "$OUT_DIR"
mkdir -p "$OUT_DIR"

echo "[bundle-node] Node.js v${NODE_VERSION} for ${PLATFORM}-${ARCH}"

if [ "$PLATFORM" = "win32" ]; then
  URL="https://nodejs.org/dist/v${NODE_VERSION}/node-v${NODE_VERSION}-win-${ARCH}.zip"
  TMP="/tmp/node-win.zip"
  curl -fsSL "$URL" -o "$TMP"
  unzip -q "$TMP" -d /tmp/node-extract
  cp "/tmp/node-extract/node-v${NODE_VERSION}-win-${ARCH}/node.exe" "$OUT_DIR/node.exe"
  rm -rf "$TMP" /tmp/node-extract
else
  URL="https://nodejs.org/dist/v${NODE_VERSION}/node-v${NODE_VERSION}-${PLATFORM}-${ARCH}.tar.gz"
  TMP="/tmp/node-bundle.tar.gz"
  curl -fsSL "$URL" -o "$TMP"
  mkdir -p /tmp/node-extract
  tar xzf "$TMP" -C /tmp/node-extract
  cp "/tmp/node-extract/node-v${NODE_VERSION}-${PLATFORM}-${ARCH}/bin/node" "$OUT_DIR/node"
  chmod +x "$OUT_DIR/node"
  rm -rf "$TMP" /tmp/node-extract
fi

echo "[bundle-node] Done: $OUT_DIR"
ls -lh "$OUT_DIR"
