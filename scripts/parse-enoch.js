#!/usr/bin/env node
/**
 * Parse data/pseudepigrapha-raw/enoch.txt into classics/enoch.txt blob.
 * Format: ref\x01text\x01 where ref = "1 Enoch|{chapter}"
 *
 * Chapter headers use Roman numerals (possibly indented or bracket-prefixed).
 * Some chapters have section summary headers ("XXXVIII. _Title_") followed by
 * verse-numbered content without repeating the Roman numeral.
 *
 * Usage: node scripts/parse-enoch.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const INPUT = path.join(ROOT, 'data/pseudepigrapha-raw/enoch.txt');
const OUT_DIR = path.join(ROOT, 'classics');
const OUTPUT = path.join(OUT_DIR, 'enoch.txt');

const ROMAN_MAP = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };

function romanToInt(roman) {
  let n = 0, prev = 0;
  for (let i = roman.length - 1; i >= 0; i--) {
    const val = ROMAN_MAP[roman[i]] || 0;
    n += val < prev ? -val : val;
    prev = val;
  }
  return n;
}

// Match Roman numeral chapter marker (possibly indented, bracket-prefixed)
// Captures: (1) optional bracket, (2) Roman numeral, (3) rest of line
const CHAPTER_RE = /^\s*(\[?)([IVXLC]+)\.\s+(.*)$/;

function main() {
  if (!fs.existsSync(INPUT)) {
    console.error('Input not found:', INPUT);
    process.exit(1);
  }

  const raw = fs.readFileSync(INPUT, 'utf8');
  const lines = raw.split(/\r?\n/);

  let startLine = -1;
  for (let i = 0; i < lines.length; i++) {
    if (/I\.\s+1\.\s+The words of the blessing of Enoch/.test(lines[i])) {
      startLine = i;
      break;
    }
  }
  if (startLine === -1) {
    console.error('Could not find start of chapter text');
    process.exit(1);
  }

  let endLine = lines.length;
  for (let i = startLine; i < lines.length; i++) {
    if (lines[i].startsWith('PRINTED IN GREAT BRITAIN')) {
      endLine = i;
      break;
    }
  }

  const chapterTexts = {}; // chapter number → array of text lines
  let currentChapter = null;

  for (let i = startLine; i < endLine; i++) {
    const line = lines[i];
    const match = line.match(CHAPTER_RE);

    if (match) {
      const roman = match[2];
      const rest = match[3];

      // Skip range headers like "XXXVIII-XLIV." (detected by dash in remainder context)
      // These are already filtered because the regex requires [IVXLC] only — dashes not in charset.
      // But "XCII. XCI. 1-10, 18-19." has a period-separated double numeral.
      // Check if rest contains another Roman numeral range reference:
      if (/^[IVXLC]+\.\s+\d+-\d+/.test(rest)) continue;

      // Skip ALL CAPS section description headers (e.g., "AN APPENDIX TO THE BOOK OF ENOCH.")
      if (/^[A-Z][A-Z\s,.:;()\u2014\u2013]{4,}$/.test(rest.trim()) && !/^\d/.test(rest) && !/^\[/.test(rest)) continue;

      // Skip indented section range headers (e.g., "XXXVIII-XLIV. =The First Parable.=")
      // Already handled — regex won't match ranges with dashes

      const chapterNum = romanToInt(roman);

      if (rest.startsWith('_')) {
        // Section summary header — mark as current chapter but don't add this line as text.
        // Only set if we don't already have text for this chapter (avoid overwriting with summary).
        currentChapter = chapterNum;
        if (!chapterTexts[chapterNum]) chapterTexts[chapterNum] = [];
        continue;
      }

      // Content start (verse number or actual text)
      currentChapter = chapterNum;
      if (!chapterTexts[chapterNum]) chapterTexts[chapterNum] = [];
      if (rest.trim()) {
        chapterTexts[chapterNum].push(rest);
      }
    } else if (currentChapter != null) {
      // Skip indented section range/group headers
      if (/^\s{3,}[IVXLC]+-[IVXLC]+/.test(line)) continue;
      if (/^\s{3,}[IVXLC]+\.\s*$/.test(line)) continue;
      // Skip centered group titles like "XXXVII-LXXI."
      if (/^\s{5,}[A-Z][A-Z\s,.:;()\u2014\u2013=_]+$/.test(line) && /[IVXLC]{3,}/.test(line)) continue;
      // Skip lines that are just section labels like "E" or "G^g" (manuscript variant markers)
      if (/^\s+[EG]\^?\{?[a-z]*\}?\s*$/.test(line)) continue;

      if (!chapterTexts[currentChapter]) chapterTexts[currentChapter] = [];
      chapterTexts[currentChapter].push(line);
    }
  }

  // Build chapter records
  const chapters = [];
  const sortedNums = Object.keys(chapterTexts).map(Number).sort((a, b) => a - b);

  for (const num of sortedNums) {
    const textLines = chapterTexts[num];
    if (!textLines || textLines.length === 0) continue;

    // Join hard-wrapped lines into paragraphs
    const paragraphs = [];
    let current = [];
    for (const line of textLines) {
      if (line.trim() === '') {
        if (current.length > 0) {
          paragraphs.push(current.join(' '));
          current = [];
        }
      } else {
        current.push(line.trim());
      }
    }
    if (current.length > 0) paragraphs.push(current.join(' '));

    let text = paragraphs.join('\n').trim();

    // Normalize special bracket characters
    text = text.replace(/〚/g, '[').replace(/〛/g, ']');
    text = text.replace(/⌜/g, '').replace(/⌝/g, '');

    // Strip inline footnote markers like [1], [2] (bare numbers in brackets at end of text)
    text = text.replace(/\[(\d{1,3})\]/g, '');

    // Clean up double spaces
    text = text.replace(/  +/g, ' ');

    if (text) {
      chapters.push({ chapter: num, text });
    }
  }

  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  const SEP = '\x01';
  const blob = chapters.map(c => `1 Enoch|${c.chapter}${SEP}${c.text}${SEP}`).join('');
  fs.writeFileSync(OUTPUT, blob, 'utf8');

  console.log(`Wrote ${chapters.length} chapters to ${OUTPUT}`);
  console.log(`Chapter range: ${chapters[0]?.chapter}–${chapters[chapters.length - 1]?.chapter}`);

  // Report any gaps
  const expected = new Set();
  for (let i = 1; i <= 108; i++) expected.add(i);
  const got = new Set(chapters.map(c => c.chapter));
  const missing = [...expected].filter(n => !got.has(n));
  if (missing.length > 0) {
    console.log(`Missing chapters (${missing.length}): ${missing.join(', ')}`);
  } else {
    console.log('All 108 chapters present!');
  }
}

main();
