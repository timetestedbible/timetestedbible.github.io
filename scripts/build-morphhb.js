#!/usr/bin/env node
/**
 * Build MorphHB compact JSON from OpenScriptures MorphHB XML source.
 *
 * Reads the 39 OSIS XML files from morphhb-source/wlc/ and produces a single
 * compact JSON file (data/morphhb.json) containing every word in the Hebrew
 * Bible with its morphology code and lemma (Strong's numbers).
 *
 * Output format:
 *   { bookName: [ null, chapter1, chapter2, ... ] }
 *   Each chapter: [ null, verse1, verse2, ... ]
 *   Each verse: [ [word, lemma, morph], ... ]
 *
 * Chapters and verses are 1-indexed (index 0 is null placeholder) so that
 * data["Genesis"][1][1] gives Genesis 1:1 words directly.
 *
 * The word text has cantillation marks stripped but vowel points preserved.
 * The "/" delimiters in word text, lemma, and morph are preserved to show
 * prefix/suffix decomposition.
 *
 * Usage: node scripts/build-morphhb.js
 *
 * Requires: morphhb-source/ directory (git clone of openscriptures/morphhb)
 */

const fs = require('fs');
const path = require('path');
const { stripCantillation, primaryStrongsFromLemma } = require('./morphology-decoder');

// ── OSIS book file names → app canonical book names ────────────────

const OSIS_TO_BOOK = {
  'Gen': 'Genesis',
  'Exod': 'Exodus',
  'Lev': 'Leviticus',
  'Num': 'Numbers',
  'Deut': 'Deuteronomy',
  'Josh': 'Joshua',
  'Judg': 'Judges',
  'Ruth': 'Ruth',
  '1Sam': '1 Samuel',
  '2Sam': '2 Samuel',
  '1Kgs': '1 Kings',
  '2Kgs': '2 Kings',
  '1Chr': '1 Chronicles',
  '2Chr': '2 Chronicles',
  'Ezra': 'Ezra',
  'Neh': 'Nehemiah',
  'Esth': 'Esther',
  'Job': 'Job',
  'Ps': 'Psalms',
  'Prov': 'Proverbs',
  'Eccl': 'Ecclesiastes',
  'Song': 'Song of Solomon',
  'Isa': 'Isaiah',
  'Jer': 'Jeremiah',
  'Lam': 'Lamentations',
  'Ezek': 'Ezekiel',
  'Dan': 'Daniel',
  'Hos': 'Hosea',
  'Joel': 'Joel',
  'Amos': 'Amos',
  'Obad': 'Obadiah',
  'Jonah': 'Jonah',
  'Mic': 'Micah',
  'Nah': 'Nahum',
  'Hab': 'Habakkuk',
  'Zeph': 'Zephaniah',
  'Hag': 'Haggai',
  'Zech': 'Zechariah',
  'Mal': 'Malachi'
};

// OT book order (matches app's BOOK_ORDER for OT portion)
const OT_BOOK_ORDER = [
  'Gen', 'Exod', 'Lev', 'Num', 'Deut',
  'Josh', 'Judg', 'Ruth', '1Sam', '2Sam', '1Kgs', '2Kgs',
  '1Chr', '2Chr', 'Ezra', 'Neh', 'Esth',
  'Job', 'Ps', 'Prov', 'Eccl', 'Song',
  'Isa', 'Jer', 'Lam', 'Ezek', 'Dan',
  'Hos', 'Joel', 'Amos', 'Obad', 'Jonah', 'Mic',
  'Nah', 'Hab', 'Zeph', 'Hag', 'Zech', 'Mal'
];


// ── Versification mapping (WLC → KJV/English) ─────────────────────

/**
 * Parse VerseMap.xml to build a WLC→KJV verse remapping table.
 * Returns a Map: "OsisBook.ch.v" → "OsisBook.ch.v" (WLC ref → KJV ref)
 */
function loadVerseMap(xmlPath) {
  const map = new Map();
  if (!fs.existsSync(xmlPath)) {
    console.warn('  VerseMap.xml not found, skipping versification remapping');
    return map;
  }

  const xml = fs.readFileSync(xmlPath, 'utf8');
  // Match: <verse wlc="Gen.32.1" kjv="Gen.31.55" type="full"/>
  const re = /<verse\s+wlc="([^"]+)"\s+kjv="([^"]+)"\s+type="([^"]+)"\s*\/>/g;
  let match;
  while ((match = re.exec(xml)) !== null) {
    const [, wlcRef, kjvRef, type] = match;
    map.set(wlcRef, { kjv: kjvRef, type });
  }

  console.log(`  Loaded ${map.size} verse remappings from VerseMap.xml`);
  return map;
}


// ── XML Parser (lightweight, no dependencies) ─────────────────────

/**
 * Parse a single MorphHB OSIS XML file into structured verse data.
 *
 * We parse the XML with regex rather than a full DOM parser to avoid
 * dependencies. The MorphHB XML is very regular and well-structured.
 *
 * @param {string} xml - Raw XML content
 * @param {string} osisBook - OSIS book abbreviation (e.g. "Gen")
 * @param {Map} verseMap - WLC→KJV remapping
 * @returns {object} { chapters: [ null, [ null, verse1, verse2, ... ], ... ], stats }
 */
function parseBook(xml, osisBook, verseMap) {
  const chapters = [null]; // 1-indexed
  let totalWords = 0;
  let totalVerses = 0;
  let remappedVerses = 0;

  // Match verse containers: <verse osisID="Gen.1.1"> ... </verse>
  const verseRe = /<verse\s+osisID="([^"]+)">([\s\S]*?)<\/verse>/g;
  let verseMatch;

  while ((verseMatch = verseRe.exec(xml)) !== null) {
    const [, osisID, verseContent] = verseMatch;

    // Parse osisID: "Gen.1.1" → book, chapter, verse
    // Check if we need to remap to KJV versification
    let targetRef = osisID;
    const remapped = verseMap.get(osisID);
    if (remapped && remapped.type === 'full') {
      targetRef = remapped.kjv;
      remappedVerses++;
    }

    const refParts = targetRef.split('.');
    if (refParts.length < 3) continue;

    const chapter = parseInt(refParts[1], 10);
    const verse = parseInt(refParts[2], 10);

    if (isNaN(chapter) || isNaN(verse)) continue;

    // Ensure chapter array exists
    while (chapters.length <= chapter) {
      chapters.push([null]); // 1-indexed verses
    }

    // Parse all <w> tags in this verse
    const words = [];
    const wordRe = /<w\s+lemma="([^"]*)"(?:\s+n="[^"]*")?\s+morph="([^"]*)"\s+id="([^"]*)">([\s\S]*?)<\/w>/g;
    let wordMatch;

    while ((wordMatch = wordRe.exec(verseContent)) !== null) {
      const [, lemma, morph, id, rawText] = wordMatch;

      // Clean the Hebrew text:
      // 1. Strip inner <seg> tags (e.g. large/small letter markers) — keep text content
      // 2. Strip cantillation marks
      // 3. Trim whitespace
      const cleanedText = rawText.replace(/<seg[^>]*>([\s\S]*?)<\/seg>/g, '$1').trim();
      const wordText = stripCantillation(cleanedText);

      // Skip empty words or segment markers
      if (!wordText || wordText === '׀' || wordText === '׃') continue;

      words.push([wordText, lemma, morph]);
      totalWords++;
    }

    if (words.length > 0) {
      // Handle potential verse overwrite (some verses may have partial mappings)
      chapters[chapter][verse] = words;
      totalVerses++;
    }
  }

  return {
    chapters,
    stats: { totalWords, totalVerses, remappedVerses }
  };
}


// ── Main Build ─────────────────────────────────────────────────────

function main() {
  const sourceDir = path.join(__dirname, '..', 'morphhb-source', 'wlc');
  const outputPath = path.join(__dirname, '..', 'data', 'morphhb.json');

  if (!fs.existsSync(sourceDir)) {
    console.error('Error: morphhb-source/wlc/ not found.');
    console.error('Run: git clone https://github.com/openscriptures/morphhb.git morphhb-source');
    process.exit(1);
  }

  console.log('Building MorphHB compact JSON...\n');

  // Load verse remapping
  const verseMap = loadVerseMap(path.join(sourceDir, 'VerseMap.xml'));

  const output = {};
  let grandTotalWords = 0;
  let grandTotalVerses = 0;
  let grandTotalRemapped = 0;

  for (const osisBook of OT_BOOK_ORDER) {
    const xmlPath = path.join(sourceDir, `${osisBook}.xml`);
    if (!fs.existsSync(xmlPath)) {
      console.warn(`  Warning: ${osisBook}.xml not found, skipping`);
      continue;
    }

    const xml = fs.readFileSync(xmlPath, 'utf8');
    const bookName = OSIS_TO_BOOK[osisBook];

    const { chapters, stats } = parseBook(xml, osisBook, verseMap);

    output[bookName] = chapters;
    grandTotalWords += stats.totalWords;
    grandTotalVerses += stats.totalVerses;
    grandTotalRemapped += stats.remappedVerses;

    const chapterCount = chapters.length - 1; // subtract null placeholder
    console.log(`  ${bookName.padEnd(20)} ${chapterCount} ch, ${stats.totalVerses} vv, ${stats.totalWords} words${stats.remappedVerses > 0 ? ` (${stats.remappedVerses} remapped)` : ''}`);
  }

  // Write output
  const json = JSON.stringify(output);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, json, 'utf8');

  const fileSizeBytes = Buffer.byteLength(json, 'utf8');
  const fileSizeMB = (fileSizeBytes / 1024 / 1024).toFixed(2);

  console.log(`\n── Summary ──`);
  console.log(`  Books:    ${Object.keys(output).length}`);
  console.log(`  Verses:   ${grandTotalVerses.toLocaleString()}`);
  console.log(`  Words:    ${grandTotalWords.toLocaleString()}`);
  console.log(`  Remapped: ${grandTotalRemapped} verses (WLC→KJV versification)`);
  console.log(`  Output:   ${outputPath}`);
  console.log(`  Size:     ${fileSizeMB} MB (uncompressed JSON)`);
  console.log(`\nDone. Run gzip to see compressed size:`);
  console.log(`  gzip -k -9 ${outputPath} && ls -lh ${outputPath}.gz`);
}

main();
