#!/usr/bin/env node
/**
 * Build pre-processed JSON from Bible .txt files (KJV, ASV, LXX).
 * JSON loads faster: no runtime parsing, just JSON.parse + one index pass.
 * Run from http/: node scripts/build-bible-json.js
 */

const fs = require('fs');
const path = require('path');

const HTTP_DIR = path.join(__dirname, '..');

const TRANSLATIONS = [
  { file: 'kjv.txt', out: 'kjv.json', skipLines: 2, separator: '\t' },
  { file: 'asv.txt', out: 'asv.json', skipLines: 4, separator: ' ' },
  { file: 'lxx.txt', out: 'lxx.json', skipLines: 2, separator: '\t' }
];

function normalizeBookName(book) {
  const normalizations = {
    'Psalm': 'Psalms',
    'Song of Songs': 'Song of Solomon',
    'Canticles': 'Song of Solomon'
  };
  return normalizations[book] || book;
}

function parseFile(config) {
  const src = path.join(HTTP_DIR, config.file);
  if (!fs.existsSync(src)) {
    console.warn(`Skip ${config.file}: file not found`);
    return;
  }
  const content = fs.readFileSync(src, 'utf8');
  const lines = content.split('\n');
  const data = [];
  const useTab = config.separator === '\t';

  for (let i = config.skipLines; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    let reference, verseText;
    if (useTab) {
      const tabIndex = line.indexOf('\t');
      if (tabIndex === -1) continue;
      reference = line.substring(0, tabIndex);
      verseText = line.substring(tabIndex + 1);
    } else {
      const match = line.match(/^(.+?\s+\d+:\d+)\s+(.+)$/);
      if (!match) continue;
      reference = match[1];
      verseText = match[2];
    }

    const refMatch = reference.match(/^(.+?)\s+(\d+):(\d+)$/);
    if (!refMatch) continue;
    let [, book, chapter, verse] = refMatch;
    book = normalizeBookName(book);
    data.push({
      book,
      chapter: parseInt(chapter, 10),
      verse: parseInt(verse, 10),
      text: verseText
    });
  }

  const outPath = path.join(HTTP_DIR, config.out);
  fs.writeFileSync(outPath, JSON.stringify(data), 'utf8');
  console.log(`Wrote ${config.out}: ${data.length} verses`);
}

TRANSLATIONS.forEach(parseFile);
