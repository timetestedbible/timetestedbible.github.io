#!/usr/bin/env bash
# Thin wrapper around build.rb (the real build is Ruby + an Asciidoctor
# treeprocessor — see build.rb and extension.rb).
#
#   ./build-pdf.sh            # both PDFs: -print (prepress, the primary
#                             # artifact we iterate on) and -screen
#   ./build-pdf.sh print      # print-ready only (facing pages, gutter margins)
#   ./build-pdf.sh screen     # screen only (single pages)
#
# After a build that includes the print target, also derive the BookBaby
# grayscale interior from it (requires ghostscript; skipped if gs is absent).
set -e
DIR="$(cd "$(dirname "$0")" && pwd)"
ruby "$DIR/build.rb" "$@"

PRINT_PDF="$DIR/time-tested-tradition-print.pdf"
GRAY_PDF="$DIR/time-tested-tradition-gray.pdf"
case "${1:-all}" in
  screen) ;;  # no print artifact refreshed — leave the gray one alone
  *)
    if command -v gs >/dev/null 2>&1 && [ -f "$PRINT_PDF" ]; then
      gs -q -sDEVICE=pdfwrite -sColorConversionStrategy=Gray \
         -dProcessColorModel=/DeviceGray -dCompatibilityLevel=1.4 \
         -dNOPAUSE -dBATCH -sOutputFile="$GRAY_PDF" "$PRINT_PDF"
      echo "Wrote: $GRAY_PDF  (grayscale of print)"
    fi
    ;;
esac
