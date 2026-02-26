#!/usr/bin/env node
/**
 * Inject invisible Unicode poetry line-break characters into Bible translation .txt files.
 * 
 * For each translation with USFM source, parses the USFM to find intra-verse poetry
 * line breaks and inserts invisible markers into the corresponding .txt file:
 *   \u200B        = start new poetic line at indent level 1 (\q1)
 *   \u200B\u200C  = start new poetic line at indent level 2 (\q2)
 *
 * Usage: node scripts/inject-poetry-breaks.js
 *
 * USFM sources should be in /tmp/usfm_downloads/{translationId}/
 * BSB USFM in /tmp/engbsb_usfm/
 * Translation .txt files in bibles/
 */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const BIBLES_DIR = path.join(__dirname, '..', 'bibles');

const ZWSP = '\u200B';
const ZWNJ = '\u200C';

const USFM_BOOK_CODES = {
  GEN: 'Genesis', EXO: 'Exodus', LEV: 'Leviticus', NUM: 'Numbers', DEU: 'Deuteronomy',
  JOS: 'Joshua', JDG: 'Judges', RUT: 'Ruth',
  '1SA': '1 Samuel', '2SA': '2 Samuel', '1KI': '1 Kings', '2KI': '2 Kings',
  '1CH': '1 Chronicles', '2CH': '2 Chronicles',
  EZR: 'Ezra', NEH: 'Nehemiah', EST: 'Esther',
  JOB: 'Job', PSA: 'Psalms', PRO: 'Proverbs', ECC: 'Ecclesiastes', SNG: 'Song of Solomon',
  ISA: 'Isaiah', JER: 'Jeremiah', LAM: 'Lamentations', EZK: 'Ezekiel', DAN: 'Daniel',
  HOS: 'Hosea', JOL: 'Joel', AMO: 'Amos', OBA: 'Obadiah', JON: 'Jonah', MIC: 'Micah',
  NAM: 'Nahum', HAB: 'Habakkuk', ZEP: 'Zephaniah', HAG: 'Haggai', ZEC: 'Zechariah', MAL: 'Malachi',
  MAT: 'Matthew', MRK: 'Mark', LUK: 'Luke', JHN: 'John', ACT: 'Acts', ROM: 'Romans',
  '1CO': '1 Corinthians', '2CO': '2 Corinthians',
  GAL: 'Galatians', EPH: 'Ephesians', PHP: 'Philippians', COL: 'Colossians',
  '1TH': '1 Thessalonians', '2TH': '2 Thessalonians',
  '1TI': '1 Timothy', '2TI': '2 Timothy', TIT: 'Titus', PHM: 'Philemon',
  HEB: 'Hebrews', JAS: 'James',
  '1PE': '1 Peter', '2PE': '2 Peter',
  '1JN': '1 John', '2JN': '2 John', '3JN': '3 John',
  JUD: 'Jude', REV: 'Revelation'
};

// BSB has the most complete poetry markup — use it as the canonical source
const BSB_USFM_DIR = '/tmp/engbsb_usfm';
const BSB_CODE_REGEX = /\d+-(\w+)engbsb\.usfm/;

// Translation configs: txt file to inject into
const TRANSLATIONS = [
  { id: 'kjv', txtFile: 'kjv_strongs.txt' },
  { id: 'akjv', txtFile: 'akjv_strongs.txt' },
  { id: 'asv', txtFile: 'asv_strongs.txt' },
  { id: 'ylt', txtFile: 'ylt.txt' },
  { id: 'dbt', txtFile: 'dbt.txt' },
  { id: 'drb', txtFile: 'drb.txt' },
  { id: 'wbt', txtFile: 'wbt.txt' },
  { id: 'lxx', txtFile: 'lxx.txt' },
  { id: 'jps', txtFile: 'jps.txt' },
];

function stripUSFMMarkup(text) {
  return text
    .replace(/\\w\s+/g, '')
    .replace(/\|strong="[^"]*"\\w\*/g, '')
    .replace(/\\f\s+.*?\\f\*/g, '')
    .replace(/\\sc\s*/g, '').replace(/\\sc\*/g, '')
    .replace(/\\add\s*/g, '').replace(/\\add\*/g, '')
    .replace(/\\it\s*/g, '').replace(/\\it\*/g, '')
    .replace(/\\nd\s*/g, '').replace(/\\nd\*/g, '')
    .replace(/\\wj\s*/g, '').replace(/\\wj\*/g, '')
    .replace(/\\+\w+\s*/g, '').replace(/\\+\w+\*/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function stripStrongsFromTxt(text) {
  return text.replace(/\{[^}]*\}/g, '').replace(/\s+/g, ' ').trim();
}

/**
 * Parse a USFM file and return poetry line structure per verse.
 * Returns: { "BookName Chapter:Verse": [{indent: 1|2, text: "..."}, ...], ... }
 * Only includes verses with 2+ poetry lines.
 */
function parseUSFMPoetry(filepath, codeRegex) {
  const content = fs.readFileSync(filepath, 'utf-8');
  const lines = content.split('\n');
  const basename = path.basename(filepath);
  const m = basename.match(codeRegex);
  if (!m) return {};
  const bookCode = m[1];
  const bookName = USFM_BOOK_CODES[bookCode];
  if (!bookName) return {};

  const result = {};
  let chapter = 0;
  let currentVerse = 0;
  let currentLines = [];
  let currentIndent = 1;

  function flushVerse() {
    if (currentVerse > 0 && currentLines.length >= 2) {
      const ref = `${bookName} ${chapter}:${currentVerse}`;
      result[ref] = currentLines;
    }
    currentLines = [];
  }

  for (const rawLine of lines) {
    const line = rawLine.trim();

    const chMatch = line.match(/^\\c\s+(\d+)/);
    if (chMatch) {
      flushVerse();
      chapter = parseInt(chMatch[1]);
      currentVerse = 0;
      continue;
    }

    // Track indent level from q markers
    if (line.startsWith('\\q2')) currentIndent = 2;
    else if (line.startsWith('\\q1') || line.startsWith('\\q ')) currentIndent = 1;

    // Non-poetry markers reset
    if (line.startsWith('\\m') || line.startsWith('\\p')) {
      currentIndent = 0;
    }

    const vMatch = line.match(/^\\v\s+(\d+)\s+(.*)/);
    if (vMatch) {
      flushVerse();
      currentVerse = parseInt(vMatch[1]);
      const text = stripUSFMMarkup(vMatch[2]);
      if (text && currentIndent > 0) {
        currentLines.push({ indent: currentIndent, text });
      } else if (text) {
        currentLines.push({ indent: 0, text });
      }
      continue;
    }

    // Continuation line (q1/q2 with text, not starting with \v)
    if (currentVerse > 0) {
      const qMatch = line.match(/^\\(q\d?)\s+(.*)/);
      if (qMatch) {
        const indent = qMatch[1] === 'q2' ? 2 : 1;
        const text = stripUSFMMarkup(qMatch[2]);
        if (text) {
          currentLines.push({ indent, text });
        }
        currentIndent = indent;
      }
    }
  }
  flushVerse();
  return result;
}

/**
 * Given a verse's text (possibly with Strong's tags) and the poetry line structure,
 * inject invisible break chars at the right positions.
 */
function injectBreaks(verseText, poetryLines) {
  if (poetryLines.length < 2) return verseText;

  const stripped = stripStrongsFromTxt(verseText).toLowerCase();
  let result = verseText;
  let offset = 0;

  for (let i = 1; i < poetryLines.length; i++) {
    const lineText = poetryLines[i].text;
    const indent = poetryLines[i].indent;
    const breakChar = indent === 2 ? ZWSP + ZWNJ : ZWSP;

    const words = lineText.replace(/[^\w\s']/g, '').split(/\s+/).filter(w => w.length > 0);
    if (words.length === 0) continue;

    let found = false;
    const searchFrom = offset > 0 ? offset : 0;

    // Try matching progressively fewer words from the start of the BSB line.
    // Multi-word anchors are specific enough for substring matching.
    // Single-word anchors require a word boundary (preceded by space/start).
    for (let numWords = Math.min(4, words.length); numWords >= 1; numWords--) {
      const anchor = words.slice(0, numWords).join(' ').toLowerCase();
      let pos = stripped.indexOf(anchor, searchFrom);

      // For single-word anchors, ensure word boundary
      if (numWords === 1) {
        while (pos >= 0) {
          if (pos === 0 || stripped[pos - 1] === ' ' || stripped[pos - 1] === ',') break;
          pos = stripped.indexOf(anchor, pos + 1);
        }
      }
      
      if (pos >= 0 && pos > 0) {
        const origPos = mapStrippedPosToOriginal(verseText, pos);
        if (origPos > 0) {
          const insertAt = origPos + (result.length - verseText.length);
          result = result.slice(0, insertAt) + breakChar + result.slice(insertAt);
          offset = pos + anchor.length;
          found = true;
          break;
        }
      }
    }

    if (!found) {
      // Unmatched line — handled at render time by splitPoetryAtPunctuation
    }
  }

  return result;
}

/**
 * Map a character position in stripped text back to the original text with Strong's tags.
 */
function mapStrippedPosToOriginal(original, strippedPos) {
  let si = 0;
  let oi = 0;
  
  while (oi < original.length && si < strippedPos) {
    if (original[oi] === '{') {
      const closeIdx = original.indexOf('}', oi);
      if (closeIdx >= 0) { oi = closeIdx + 1; continue; }
    }
    if (/\s/.test(original[oi])) {
      oi++;
      while (oi < original.length && /\s/.test(original[oi])) oi++;
      si++;
      while (oi < original.length && original[oi] === '{') {
        const closeIdx = original.indexOf('}', oi);
        if (closeIdx >= 0) oi = closeIdx + 1;
        else break;
      }
    } else {
      si++;
      if (si >= strippedPos) return oi;
      oi++;
    }
  }
  
  return oi;
}

function processTranslation(config, allPoetry, poetryVerseCount) {
  const { id, txtFile } = config;

  // Load the .txt file (decompress if gzipped)
  const gzPath = path.join(BIBLES_DIR, txtFile + '.gz');
  const rawPath = path.join(BIBLES_DIR, txtFile);
  let txtContent;
  
  if (fs.existsSync(gzPath)) {
    txtContent = zlib.gunzipSync(fs.readFileSync(gzPath)).toString('utf-8');
  } else if (fs.existsSync(rawPath)) {
    txtContent = fs.readFileSync(rawPath, 'utf-8');
  } else {
    console.log(`  ${id}: .txt file not found: ${txtFile} (skipping)`);
    return;
  }

  // Strip any existing invisible chars (for re-runs)
  txtContent = txtContent.replace(/[\u200B\u200C]/g, '');

  // Process each verse line in the .txt
  const txtLines = txtContent.split('\n');
  let injectedCount = 0;
  
  for (let i = 0; i < txtLines.length; i++) {
    const line = txtLines[i];
    const tabIdx = line.indexOf('\t');
    if (tabIdx < 0) continue;
    
    const ref = line.slice(0, tabIdx);
    const verseText = line.slice(tabIdx + 1);
    
    const poetry = allPoetry[ref];
    if (!poetry || poetry.length < 2) continue;
    
    const injected = injectBreaks(verseText, poetry);
    if (injected !== verseText) {
      txtLines[i] = ref + '\t' + injected;
      injectedCount++;
    }
  }

  // Write back
  const newContent = txtLines.join('\n');
  const gzData = zlib.gzipSync(Buffer.from(newContent, 'utf-8'), { level: 9 });
  fs.writeFileSync(gzPath, gzData);
  
  const sizeMB = (gzData.length / 1024 / 1024).toFixed(2);
  console.log(`  ${id}: ${injectedCount}/${poetryVerseCount} verses injected, ${sizeMB} MB gz`);
}

// Main
console.log('Injecting poetry line breaks into Bible translations...');
console.log('Using BSB USFM as canonical poetry source for all translations.\n');

if (!fs.existsSync(BSB_USFM_DIR)) {
  console.error('BSB USFM dir not found:', BSB_USFM_DIR);
  process.exit(1);
}

// Parse BSB USFM once — it has the most complete poetry markup
const usfmFiles = fs.readdirSync(BSB_USFM_DIR).filter(f => f.endsWith('.usfm')).sort();
let allPoetry = {};
for (const file of usfmFiles) {
  const poetry = parseUSFMPoetry(path.join(BSB_USFM_DIR, file), BSB_CODE_REGEX);
  Object.assign(allPoetry, poetry);
}
const poetryVerseCount = Object.keys(allPoetry).length;
console.log(`BSB poetry: ${poetryVerseCount} verses with line breaks\n`);

for (const config of TRANSLATIONS) {
  processTranslation(config, allPoetry, poetryVerseCount);
}

console.log('\nDone!');
