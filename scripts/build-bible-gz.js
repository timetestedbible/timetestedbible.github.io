#!/usr/bin/env node
/**
 * Compress all bibles/*.txt files to bibles/*.txt.gz using Node's built-in zlib.
 * The .gz files are what the PWA fetches and caches (3x smaller than raw).
 * The raw .txt files remain in the repo for grep/research.
 *
 * Usage: node scripts/build-bible-gz.js
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const BIBLES_DIR = path.join(__dirname, '..', 'bibles');

function main() {
  const files = fs.readdirSync(BIBLES_DIR).filter(f => f.endsWith('.txt'));

  if (files.length === 0) {
    console.log('No .txt files found in bibles/');
    return;
  }

  console.log(`Compressing ${files.length} Bible files...\n`);

  let totalRaw = 0;
  let totalGz = 0;

  for (const file of files) {
    const srcPath = path.join(BIBLES_DIR, file);
    const destPath = srcPath + '.gz';

    const raw = fs.readFileSync(srcPath);
    const compressed = zlib.gzipSync(raw, { level: 9 });

    fs.writeFileSync(destPath, compressed);

    const rawSize = raw.length;
    const gzSize = compressed.length;
    const ratio = ((1 - gzSize / rawSize) * 100).toFixed(1);

    totalRaw += rawSize;
    totalGz += gzSize;

    console.log(`  ${file}: ${(rawSize / 1024).toFixed(0)} KB → ${(gzSize / 1024).toFixed(0)} KB (${ratio}% reduction)`);
  }

  console.log(`\nTotal: ${(totalRaw / 1024 / 1024).toFixed(1)} MB → ${(totalGz / 1024 / 1024).toFixed(1)} MB (${((1 - totalGz / totalRaw) * 100).toFixed(1)}% reduction)`);
}

main();
