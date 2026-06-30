#!/usr/bin/env bash
# Thin wrapper around build.rb (the real build is Ruby + an Asciidoctor
# treeprocessor — see build.rb and extension.rb).
#
#   ./build-pdf.sh            # screen PDF (proofing)
#   ./build-pdf.sh prepress   # print-ready (facing pages, gutter margins)
exec ruby "$(cd "$(dirname "$0")" && pwd)/build.rb" "$@"
