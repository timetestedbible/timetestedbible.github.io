#!/usr/bin/env node
/**
 * Parse BSB USFM files and extract translation-independent formatting metadata.
 * Outputs data/verse-formatting.json (and .gz via build-data-gz.js).
 *
 * The formatting data is keyed by "Book.Chapter" and includes:
 *   - headings: section headings (\s1) with optional cross-refs (\r)
 *   - sub: sub-headings (\s2)
 *   - breaks: verse numbers that have a stanza/paragraph break (\b) before them
 *   - poetry: verse numbers rendered as poetry (\q1/\q2)
 *   - selah: verse numbers followed by Selah (\qr)
 *   - superscription: psalm superscription text (\d)
 *   - acrostic: acrostic letter markers (\qa) before a verse
 *   - centered: verse numbers with centered text (\pc)
 *   - list: verse numbers formatted as list items (\li1/\li2)
 *   - bookDiv: major book division (\ms1 + \mr), e.g. Psalms "BOOK I"
 *
 * Usage: node scripts/build-verse-formatting.js [usfm_dir]
 *   usfm_dir defaults to /tmp/engbsb_usfm
 */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const USFM_DIR = process.argv[2] || '/tmp/engbsb_usfm';
const OUT_JSON = path.join(__dirname, '..', 'data', 'verse-formatting.json');

const USFM_CODE_TO_BOOK = {
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

function stripStrongs(text) {
  return text
    .replace(/\\w\s+/g, '')
    .replace(/\|strong="[^"]*"\\w\*/g, '')
    .replace(/\\f\s+.*?\\f\*/g, '')
    .replace(/\\it\s*/g, '').replace(/\\it\*/g, '')
    .trim();
}

function extractBookCode(filename) {
  const m = filename.match(/\d+-(\w+)engbsb\.usfm/);
  return m ? m[1] : null;
}

function parseUSFMFile(filepath) {
  const content = fs.readFileSync(filepath, 'utf-8');
  const lines = content.split('\n');

  const chapters = {};
  let currentChapter = 0;
  let currentVerse = 0;
  let inPoetry = false;

  // Pending items to attach to the next verse
  let pendingBreak = false;
  let pendingHeadings = [];
  let pendingSub = [];
  let pendingSuperscription = null;
  let pendingAcrostic = null;
  let pendingBookDiv = null;
  let pendingCrossRef = null;

  function ensureChapter(ch) {
    const key = ch.toString();
    if (!chapters[key]) chapters[key] = {};
    return chapters[key];
  }

  function getChapterData(ch) {
    return ensureChapter(ch);
  }

  function addToArray(chData, field, value) {
    if (!chData[field]) chData[field] = [];
    chData[field].push(value);
  }

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    // Chapter marker
    const chMatch = line.match(/^\\c\s+(\d+)/);
    if (chMatch) {
      currentChapter = parseInt(chMatch[1]);
      currentVerse = 0;
      inPoetry = false;
      continue;
    }

    if (currentChapter === 0) continue;

    // Major section (Psalms book divisions)
    if (line.startsWith('\\ms1 ')) {
      pendingBookDiv = { title: stripStrongs(line.slice(5)) };
      continue;
    }
    if (line.startsWith('\\mr ') && pendingBookDiv) {
      pendingBookDiv.range = stripStrongs(line.slice(4));
      continue;
    }

    // Section heading
    if (line.startsWith('\\s1 ')) {
      pendingHeadings.push(stripStrongs(line.slice(4)));
      continue;
    }
    if (line.startsWith('\\s2 ')) {
      pendingSub.push(stripStrongs(line.slice(4)));
      continue;
    }

    // Cross-reference (appears after \s1)
    if (line.startsWith('\\r ')) {
      pendingCrossRef = stripStrongs(line.slice(3));
      continue;
    }

    // Psalm superscription
    if (line.startsWith('\\d ')) {
      pendingSuperscription = stripStrongs(line.slice(3));
      continue;
    }

    // Acrostic heading
    if (line.startsWith('\\qa ')) {
      pendingAcrostic = stripStrongs(line.slice(4));
      continue;
    }

    // Stanza/paragraph break
    if (line === '\\b') {
      pendingBreak = true;
      continue;
    }

    // Poetry markers (track state)
    if (line.startsWith('\\q1') || line.startsWith('\\q2')) {
      inPoetry = true;
      // A \q line might also contain a \v on the same line (handled below)
      // Or it might be standalone (just sets poetry mode for next \v)
      if (!line.match(/\\v\s+\d+/)) continue;
    }

    // Prose markers
    if (line.startsWith('\\m') || line.startsWith('\\p')) {
      inPoetry = false;
      if (!line.match(/\\v\s+\d+/)) continue;
    }

    // Selah (right-aligned, always on its own line)
    if (line.startsWith('\\qr ')) {
      if (currentVerse > 0) {
        const chData = getChapterData(currentChapter);
        addToArray(chData, 'selah', currentVerse);
      }
      continue;
    }

    // Centered text
    if (line.startsWith('\\pc ')) {
      // \pc lines often contain a verse — handled with verse below
      if (!line.match(/\\v\s+\d+/)) {
        // Standalone centered text attached to current verse
        if (currentVerse > 0) {
          const chData = getChapterData(currentChapter);
          addToArray(chData, 'centered', currentVerse);
        }
        continue;
      }
    }

    // List items
    if (line.startsWith('\\li1') || line.startsWith('\\li2')) {
      if (!line.match(/\\v\s+\d+/)) continue;
    }

    // Verse marker
    const vMatch = line.match(/\\v\s+(\d+)/);
    if (vMatch) {
      currentVerse = parseInt(vMatch[1]);
      const chData = getChapterData(currentChapter);

      // Flush pending items
      if (pendingBookDiv) {
        chData.bookDiv = pendingBookDiv;
        pendingBookDiv = null;
      }

      if (pendingHeadings.length > 0) {
        if (!chData.headings) chData.headings = [];
        for (const h of pendingHeadings) {
          const entry = { v: currentVerse, t: h };
          if (pendingCrossRef) {
            entry.r = pendingCrossRef;
            pendingCrossRef = null;
          }
          chData.headings.push(entry);
        }
        pendingHeadings = [];
      }
      // Flush any cross-ref that wasn't attached to a heading
      pendingCrossRef = null;

      if (pendingSub.length > 0) {
        if (!chData.sub) chData.sub = [];
        for (const s of pendingSub) {
          chData.sub.push({ v: currentVerse, t: s });
        }
        pendingSub = [];
      }

      if (pendingSuperscription) {
        chData.superscription = { v: currentVerse, t: pendingSuperscription };
        pendingSuperscription = null;
      }

      if (pendingAcrostic) {
        addToArray(chData, 'acrostic', { v: currentVerse, t: pendingAcrostic });
        pendingAcrostic = null;
      }

      if (pendingBreak) {
        addToArray(chData, 'breaks', currentVerse);
        pendingBreak = false;
      }

      if (inPoetry) {
        addToArray(chData, 'poetry', currentVerse);
      }

      // Detect list items on the verse line
      if (line.startsWith('\\li1') || line.startsWith('\\li2')) {
        addToArray(chData, 'list', currentVerse);
      }

      // Detect centered on the verse line
      if (line.startsWith('\\pc')) {
        addToArray(chData, 'centered', currentVerse);
      }
    }
  }

  return chapters;
}

// Main
console.log('Parsing BSB USFM files from:', USFM_DIR);

const files = fs.readdirSync(USFM_DIR)
  .filter(f => f.endsWith('.usfm'))
  .sort();

const result = {};
let totalChapters = 0;
let chaptersWithData = 0;

for (const file of files) {
  const code = extractBookCode(file);
  if (!code) {
    console.log(`  SKIP: ${file} (no book code)`);
    continue;
  }
  const bookName = USFM_CODE_TO_BOOK[code];
  if (!bookName) {
    console.log(`  SKIP: ${file} (unknown code: ${code})`);
    continue;
  }

  const chapters = parseUSFMFile(path.join(USFM_DIR, file));

  for (const [ch, data] of Object.entries(chapters)) {
    totalChapters++;
    // Only store chapters that have actual formatting data
    if (Object.keys(data).length > 0) {
      const key = `${bookName}.${ch}`;
      result[key] = data;
      chaptersWithData++;
    }
  }

  const chCount = Object.keys(chapters).length;
  const withData = Object.values(chapters).filter(d => Object.keys(d).length > 0).length;
  console.log(`  ${bookName}: ${chCount} chapters, ${withData} with formatting`);
}

// Write JSON
fs.writeFileSync(OUT_JSON, JSON.stringify(result));
const rawSize = fs.statSync(OUT_JSON).size;

// Write gzipped
const gzData = zlib.gzipSync(fs.readFileSync(OUT_JSON), { level: 9 });
fs.writeFileSync(OUT_JSON + '.gz', gzData);
const gzSize = gzData.length;

console.log(`\nDone!`);
console.log(`  Total chapters: ${totalChapters}`);
console.log(`  Chapters with formatting: ${chaptersWithData}`);
console.log(`  Output: ${OUT_JSON}`);
console.log(`  Raw size: ${(rawSize / 1024).toFixed(1)} KB`);
console.log(`  Gzipped: ${(gzSize / 1024).toFixed(1)} KB`);

// Summary stats
let headingCount = 0, breakCount = 0, poetryCount = 0, selahCount = 0, superCount = 0;
for (const data of Object.values(result)) {
  if (data.headings) headingCount += data.headings.length;
  if (data.breaks) breakCount += data.breaks.length;
  if (data.poetry) poetryCount += data.poetry.length;
  if (data.selah) selahCount += data.selah.length;
  if (data.superscription) superCount++;
}
console.log(`\nFormatting stats:`);
console.log(`  Section headings: ${headingCount}`);
console.log(`  Stanza/paragraph breaks: ${breakCount}`);
console.log(`  Poetry verses: ${poetryCount}`);
console.log(`  Selah markers: ${selahCount}`);
console.log(`  Psalm superscriptions: ${superCount}`);
