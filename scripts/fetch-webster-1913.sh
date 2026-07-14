#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEST_DIR="$ROOT/data/dictionaries/webster-1913"
DEST_FILE="$DEST_DIR/webster-1913.txt.gz"
SOURCE_URL="https://www.gutenberg.org/ebooks/29765.txt.utf-8"
EXPECTED_SHA256="86fb9c28c32008ea288ca4bcf34f4f0d3d11ccf9e0898294d98b73671497f1d3"

tmp_file="$(mktemp "${TMPDIR:-/tmp}/webster-1913.XXXXXX")"
trap 'rm -f "$tmp_file"' EXIT

curl --fail --location --retry 3 --output "$tmp_file" "$SOURCE_URL"

actual_sha256="$(shasum -a 256 "$tmp_file" | awk '{print $1}')"
if [[ "$actual_sha256" != "$EXPECTED_SHA256" ]]; then
  echo "Webster source checksum changed." >&2
  echo "Expected: $EXPECTED_SHA256" >&2
  echo "Actual:   $actual_sha256" >&2
  echo "Review the upstream change before updating the pinned dataset." >&2
  exit 1
fi

mkdir -p "$DEST_DIR"
gzip -n -9 -c "$tmp_file" > "$DEST_FILE"

echo "Stored $DEST_FILE"
echo "SHA-256 (uncompressed): $actual_sha256"
gzip -l "$DEST_FILE"
