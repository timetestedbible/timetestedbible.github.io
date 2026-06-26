#!/usr/bin/env node
/**
 * Build the trimmed site tree that gets bundled into the desktop app.
 *
 * The app fetches `.gz` files and unpacks them just-in-time (bible.js / bible-reader.js
 * try `<file>.gz` first, decompress via DecompressionStream, and only fall back to the
 * plain file if the `.gz` is missing). So any uncompressed file that has a `.gz` twin is
 * dead weight in the bundle — we drop it here (~128 MB).
 *
 * Output: _dev/desktop-tauri/desktop-site/  (referenced by tauri.conf.json bundle.resources)
 * Files are HARD-LINKED from _site (instant, ~no extra disk); removing a hardlink in the
 * staging dir never touches the original _site. Falls back to a copy across filesystems.
 *
 * Run from anywhere: paths resolve relative to this file.
 */
const fs = require('fs');
const path = require('path');

const SRC = path.resolve(__dirname, '../../_site');     // repo/_site
const DST = path.resolve(__dirname, 'desktop-site');     // staging for the bundle

// The only PDF the app links to is the 2nd-edition book; other PDFs (research source
// docs in data/) aren't referenced in-app, so they're dropped from the bundle.
const KEEP_BOOK_PDF = 'media/time-tested-tradition.pdf';

function walk(dir, cb) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, cb);
    else if (entry.isFile()) cb(full);
  }
}

function main() {
  if (!fs.existsSync(path.join(SRC, 'index.html'))) {
    console.error(`[desktop-site] _site not found at ${SRC} — run \`bundle exec jekyll build\` first.`);
    process.exit(1);
  }
  fs.rmSync(DST, { recursive: true, force: true });

  let kept = 0, droppedFiles = 0, droppedBytes = 0, linked = 0, copied = 0;

  walk(SRC, (srcFile) => {
    const rel = path.relative(SRC, srcFile);
    // Drop every PDF except the 2nd-edition book PDF (others aren't linked in-app).
    if (/\.pdf$/i.test(rel) && rel !== KEEP_BOOK_PDF) {
      droppedFiles++;
      droppedBytes += fs.statSync(srcFile).size;
      return;
    }
    // Drop an uncompressed file when its `.gz` twin exists (the app loads the .gz).
    if (!rel.endsWith('.gz') && fs.existsSync(srcFile + '.gz')) {
      droppedFiles++;
      droppedBytes += fs.statSync(srcFile).size;
      return;
    }
    const dstFile = path.join(DST, rel);
    fs.mkdirSync(path.dirname(dstFile), { recursive: true });
    try {
      fs.linkSync(srcFile, dstFile);  // hardlink — instant, no extra disk
      linked++;
    } catch {
      fs.copyFileSync(srcFile, dstFile); // cross-device fallback
      copied++;
    }
    kept++;
  });

  console.log(`[desktop-site] kept ${kept} files (${linked} linked, ${copied} copied), ` +
    `dropped ${droppedFiles} uncompressed twins = ${(droppedBytes / 1048576).toFixed(0)} MB saved`);
  console.log(`[desktop-site] -> ${DST}`);
}

main();
