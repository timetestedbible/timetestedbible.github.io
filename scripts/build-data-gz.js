#!/usr/bin/env node
/**
 * Compress large data/*.json files to .json.gz using Node's built-in zlib.
 * The .gz files are what the PWA fetches and caches (3-5x smaller).
 * The raw .json files remain in the repo for dev/grep.
 *
 * Usage: node scripts/build-data-gz.js
 */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const DATA_DIR = path.join(__dirname, '..', 'data');

const FILES_TO_COMPRESS = [
  'bdb-ai.json',
  'nt-interlinear.json',
  'morphhb.json',
  'bdb.json',
  'tipnr.json',
  'hebrew-gospels-interlinear.json',
  'hebrew-gospels-notes.json',
  'gematria-compact.json',
  'gematria-index.json',
  'greek-gematria.json',
  'hebrew-gematria.json',
];

console.log('Compressing data JSON files...\n');

let totalRaw = 0, totalGz = 0;

for (const file of FILES_TO_COMPRESS) {
  const srcPath = path.join(DATA_DIR, file);
  const destPath = srcPath + '.gz';

  if (!fs.existsSync(srcPath)) {
    console.log(`  SKIP (not found): ${file}`);
    continue;
  }

  const raw = fs.readFileSync(srcPath);
  const compressed = zlib.gzipSync(raw, { level: 9 });

  fs.writeFileSync(destPath, compressed);

  totalRaw += raw.length;
  totalGz += compressed.length;

  const ratio = ((1 - compressed.length / raw.length) * 100).toFixed(0);
  console.log(`  ${file}: ${(raw.length/1024/1024).toFixed(1)} MB → ${(compressed.length/1024/1024).toFixed(1)} MB (${ratio}% smaller)`);
}

console.log(`\nTotal: ${(totalRaw/1024/1024).toFixed(1)} MB → ${(totalGz/1024/1024).toFixed(1)} MB`);
console.log('Done.');
