#!/bin/bash
# Optimize blog/article images for web delivery.
# - Copies originals to assets/img-originals/ (preserves full-res source)
# - Resizes to max 1600px wide (covers retina displays)
# - Recompresses JPEGs at quality 80
# - Converts oversized PNGs to JPEG where appropriate (no transparency)
#
# Uses macOS `sips` — no external dependencies.
# Usage: bash scripts/optimize-images.sh

set -e

IMG_DIR="assets/img"
ORIG_DIR="assets/img-originals"
MAX_WIDTH=1600
JPEG_QUALITY=80

# Create originals backup directory
mkdir -p "$ORIG_DIR"

echo "Optimizing images in $IMG_DIR..."
echo "Originals backed up to $ORIG_DIR/"
echo ""

total_before=0
total_after=0

for file in "$IMG_DIR"/*.{jpg,jpeg,png,JPG,JPEG,PNG}; do
  [ -f "$file" ] || continue

  filename=$(basename "$file")
  ext="${filename##*.}"
  name="${filename%.*}"

  # Skip if already small (under 200 KB)
  size=$(stat -f%z "$file")
  if [ "$size" -lt 204800 ]; then
    echo "  SKIP (already small): $filename ($(( size / 1024 )) KB)"
    continue
  fi

  total_before=$(( total_before + size ))

  # Back up original (don't overwrite if backup exists)
  if [ ! -f "$ORIG_DIR/$filename" ]; then
    cp "$file" "$ORIG_DIR/$filename"
  fi

  # Get current width
  width=$(sips --getProperty pixelWidth "$file" 2>/dev/null | tail -1 | awk '{print $2}')

  # Determine output format
  out_ext="$ext"
  # Convert PNG to JPEG if it's large (likely no transparency needed)
  if [[ "$ext" =~ ^[Pp][Nn][Gg]$ ]] && [ "$size" -gt 524288 ]; then
    out_ext="jpg"
  fi

  # Work on a temp copy
  tmp_file="/tmp/img_optimize_$$.$out_ext"
  cp "$file" "$tmp_file"

  # Resize if wider than MAX_WIDTH
  if [ "$width" -gt "$MAX_WIDTH" ]; then
    sips --resampleWidth "$MAX_WIDTH" "$tmp_file" --out "$tmp_file" >/dev/null 2>&1
  fi

  # Set JPEG quality
  if [[ "$out_ext" =~ ^[Jj][Pp][Gg]$ ]] || [[ "$out_ext" =~ ^[Jj][Pp][Ee][Gg]$ ]]; then
    # Re-save as JPEG with target quality
    sips -s format jpeg -s formatOptions "$JPEG_QUALITY" "$tmp_file" --out "$tmp_file" >/dev/null 2>&1
  fi

  # If we converted PNG to JPEG, update the filename
  if [ "$out_ext" != "$ext" ]; then
    new_file="$IMG_DIR/$name.$out_ext"
    mv "$tmp_file" "$new_file"
    rm "$file"
    file="$new_file"
    filename="$name.$out_ext"
  else
    mv "$tmp_file" "$file"
  fi

  new_size=$(stat -f%z "$file")
  total_after=$(( total_after + new_size ))
  reduction=$(( 100 - (new_size * 100 / size) ))

  echo "  $filename: $(( size / 1024 )) KB → $(( new_size / 1024 )) KB (${reduction}% smaller)"
done

echo ""
echo "Total: $(( total_before / 1024 / 1024 )) MB → $(( total_after / 1024 / 1024 )) MB"
echo "Originals preserved in $ORIG_DIR/"
