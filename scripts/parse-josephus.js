#!/usr/bin/env node
/**
 * Parse josephus-complete-works.txt into classics/josephus.txt.
 * Format: records separated by \x01; each record = ref\x01text\x01
 * ref = "Work|book|chapter|section" (e.g. "Antiquities|18|2|2", "Jewish War|1|1|1")
 *
 * Structure: "Back To The Table Of Contents" then work title then "Book N", "CHAPTER N.", "1.", "2." ...
 *
 * Usage: node scripts/parse-josephus.js
 * Input: source/classics/josephus-complete-works.txt
 * Output: classics/josephus.txt
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const INPUT = path.join(ROOT, 'source/classics/josephus-complete-works.txt');
const OUT_DIR = path.join(ROOT, 'classics');
const OUTPUT = path.join(OUT_DIR, 'josephus.txt');

const SEP = '\x01';

// Roman numeral to number (I..XX and beyond for Book XX)
const ROMAN = {
  I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6, VII: 7, VIII: 8, IX: 9, X: 10,
  XI: 11, XII: 12, XIII: 13, XIV: 14, XV: 15, XVI: 16, XVII: 17, XVIII: 18, XIX: 19, XX: 20
};

function parseRoman(s) {
  const t = s.trim().toUpperCase();
  return ROMAN[t] != null ? ROMAN[t] : 0;
}

function main() {
  if (!fs.existsSync(INPUT)) {
    console.error('Input not found:', INPUT);
    process.exit(1);
  }

  const raw = fs.readFileSync(INPUT, 'utf8');
  const lines = raw.split(/\r?\n/);

  const records = [];
  const footnotes = {};  // Key: "Work|Book|Chapter" → { num: text }
  let currentWork = null;
  let currentBook = 0;
  let currentChapter = 0;
  let currentSection = 0;
  let currentText = [];
  let afterTOC = false;
  let pendingBookFromNextLine = null;
  let inEndnotes = false;
  let currentFootnoteNum = null;
  let currentFootnoteLines = [];

  function flushSection() {
    if (currentWork != null && currentBook > 0 && currentChapter > 0 && currentSection > 0 && currentText.length > 0) {
      // Join hard-wrapped lines into paragraphs: blank lines = paragraph breaks,
      // consecutive non-blank lines = same paragraph (join with space)
      const paragraphs = [];
      let current = [];
      for (const line of currentText) {
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
      const text = paragraphs.join('\n').trim();
      if (text) {
        const ref = `${currentWork}|${currentBook}|${currentChapter}|${currentSection}`;
        records.push({ ref, text });
      }
    }
    currentText = [];
  }

  function flushFootnote() {
    if (currentFootnoteNum != null && currentFootnoteLines.length > 0 && currentWork && currentBook > 0 && currentChapter > 0) {
      const key = `${currentWork}|${currentBook}|${currentChapter}`;
      if (!footnotes[key]) footnotes[key] = {};
      footnotes[key][currentFootnoteNum] = currentFootnoteLines.join(' ').trim();
    }
    currentFootnoteNum = null;
    currentFootnoteLines = [];
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Detect ENDNOTES block
    if (trimmed === 'ENDNOTES' || trimmed === 'Endnotes') {
      flushSection();
      flushFootnote();
      inEndnotes = true;
      continue;
    }

    if (trimmed === 'Back To The Table Of Contents') {
      flushSection();
      flushFootnote();
      inEndnotes = false;
      afterTOC = true;
      continue;
    }

    // Parse footnotes when in ENDNOTES block
    if (inEndnotes) {
      const fnMatch = trimmed.match(/^\((\d+)\)\s+(.*)/);
      if (fnMatch) {
        flushFootnote();
        currentFootnoteNum = parseInt(fnMatch[1]);
        currentFootnoteLines = [fnMatch[2]];
      } else if (trimmed && currentFootnoteNum != null) {
        // Continuation line of current footnote
        currentFootnoteLines.push(trimmed);
      }
      continue;
    }

    if (!currentWork && /^THE WARS OF THE JEWS$/i.test(trimmed)) {
      currentWork = 'Jewish War';
      continue;
    }

    if (/^Antiquities of the Jews\s*--?\s*Book\s*$/i.test(trimmed)) {
      flushSection();
      currentWork = 'Antiquities';
      pendingBookFromNextLine = 'Antiquities';
      afterTOC = false;
      continue;
    }
    if (/^Antiquities of the Jews\s*--?\s*Book\s+([IVXLCDM]+)\s*$/i.test(trimmed)) {
      const m = trimmed.match(/Book\s+([IVXLCDM]+)/i);
      if (m) {
        flushSection();
        currentWork = 'Antiquities';
        currentBook = parseRoman(m[1]);
        currentChapter = 0;
      }
      afterTOC = false;
      continue;
    }
    if (/^Antiquities of the Jews\s*--\s*$/i.test(trimmed)) {
      flushSection();
      currentWork = 'Antiquities';
      currentBook = 0;
      currentChapter = 0;
      afterTOC = false;
      continue;
    }

    if ((currentWork != null || afterTOC) && /^The Life\s+Of\s+Flavius Josephus\s*$/i.test(trimmed)) {
      flushSection();
      currentWork = 'Life';
      currentBook = 1;
      currentChapter = 1;
      afterTOC = false;
      continue;
    }
    if ((currentWork != null || afterTOC) && /^Flavius Josephus Against Apion/i.test(trimmed)) {
      flushSection();
      currentWork = 'Against Apion';
      currentBook = 0;
      currentChapter = 1;
      afterTOC = false;
      continue;
    }

    if (afterTOC) {
      if (/^The Wars?\s+Of\s+The\s+Jews$/i.test(trimmed) || /^War of the Jews$/i.test(trimmed)) {
        currentWork = 'Jewish War';
        afterTOC = false;
        currentBook = 0;
        currentChapter = 0;
        continue;
      }
      if (/^Antiquities of the Jews\s*-\s*Book\s*$/i.test(trimmed)) {
        pendingBookFromNextLine = 'Antiquities';
        afterTOC = false;
        currentWork = 'Antiquities';
        continue;
      }
      if (/^Antiquities of the Jews\s*-\s*Book\s+([IVXLCDM]+)\s*$/i.test(trimmed)) {
        const m = trimmed.match(/Book\s+([IVXLCDM]+)/i);
        currentWork = 'Antiquities';
        currentBook = m ? parseRoman(m[1]) : 0;
        currentChapter = 0;
        afterTOC = false;
        continue;
      }
      if (pendingBookFromNextLine && /^([IVXLCDM]+)\s*$/.test(trimmed)) {
        currentBook = parseRoman(trimmed);
        currentChapter = 0;
        pendingBookFromNextLine = null;
        afterTOC = false;
        continue;
      }
        if (/^The Life of Flavius Josephus/i.test(trimmed) || /^The Life Of Flavius Josephus/i.test(trimmed)) {
        flushSection();
        currentWork = 'Life';
        currentBook = 1;
        currentChapter = 1;
        afterTOC = false;
        continue;
      }
      if (/^Flavius Josephus Against Apion/i.test(trimmed)) {
        flushSection();
        currentWork = 'Against Apion';
        currentBook = 0;
        currentChapter = 1;
        afterTOC = false;
        continue;
      }
      if (currentWork) afterTOC = false;
    }

    if (pendingBookFromNextLine && /^([IVXLCDM]+)\s*$/.test(trimmed)) {
      currentBook = parseRoman(trimmed);
      currentChapter = 0;
      pendingBookFromNextLine = null;
      continue;
    }

    if (currentWork === 'Against Apion' && /^BOOK\s+(\d+|[IVXLCDM]+)\s*$/i.test(trimmed)) {
      const m = trimmed.match(/^BOOK\s+(\d+|[IVXLCDM]+)/i);
      if (m) {
        flushSection();
        currentBook = /^\d+$/.test(m[1]) ? parseInt(m[1], 10) : parseRoman(m[1]);
        currentChapter = 1;
      }
      continue;
    }

    const bookMatch = trimmed.match(/^Book\s+([IVXLCDM]+)\s*([—\-].*)?$/i);
    if (bookMatch && currentWork) {
      flushSection();
      currentBook = parseRoman(bookMatch[1]);
      currentChapter = 0;
      currentSection = 0;
      continue;
    }

    const chapterMatch = trimmed.match(/^CHAPTER\s+(\d+)\.?\s*$/i);
    if (chapterMatch && currentWork && currentBook > 0) {
      flushSection();
      currentChapter = parseInt(chapterMatch[1], 10);
      currentSection = 0;
      continue;
    }

    const sectionMatch = trimmed.match(/^(\d+)\s*\.\s+(.+)$/);
    if (sectionMatch && currentWork && currentBook > 0 && currentChapter > 0) {
      const num = parseInt(sectionMatch[1], 10);
      const rest = sectionMatch[2];
      flushSection();
      currentSection = num;
      if (rest) currentText.push(rest);
      continue;
    }

    if (currentWork != null && currentBook > 0 && currentChapter > 0 && currentSection > 0) {
      currentText.push(line);
    }
  }

  flushSection();
  flushFootnote();

  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  // Write sections blob
  const blob = records.map(r => r.ref + SEP + r.text + SEP).join('');

  // Write footnotes as a separate JSON file
  const fnFile = path.join(OUT_DIR, 'josephus-footnotes.json');
  fs.writeFileSync(fnFile, JSON.stringify(footnotes), 'utf8');

  fs.writeFileSync(OUTPUT, blob, 'utf8');

  const fnCount = Object.values(footnotes).reduce((sum, ch) => sum + Object.keys(ch).length, 0);
  console.log(`Wrote ${fnCount} footnotes to ${fnFile}`);

  console.log(`Wrote ${records.length} sections to ${OUTPUT}`);
  const byWork = {};
  for (const r of records) {
    const w = r.ref.split('|')[0];
    byWork[w] = (byWork[w] || 0) + 1;
  }
  console.log('Works:', Object.keys(byWork).sort().join(', '));
}

main();
