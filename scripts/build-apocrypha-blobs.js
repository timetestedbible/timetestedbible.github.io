#!/usr/bin/env node
/**
 * Convert KJV Apocrypha JSON (aruljohn/Bible-kjv-1611) and pseudepigrapha JSON
 * (scrollmapper/bible_databases_deuterocanonical) into ref\x01text\x01 blob files
 * for the classics system.
 *
 * Usage: node scripts/build-apocrypha-blobs.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const KJV_DIR = path.join(ROOT, 'data/kjv-apocrypha-json');
const DEUT_DIR = path.join(ROOT, 'data/deuterocanonical-raw/sources/en');
const OUT_DIR = path.join(ROOT, 'classics');
const SEP = '\x01';

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

// ── KJV Apocrypha (aruljohn format: { book, chapters: [{ chapter, verses: [{ verse, text }] }] }) ──

const KJV_BOOKS = [
  { file: '1 Esdras.json', id: '1esdras', name: '1 Esdras' },
  { file: '2 Esdras.json', id: '2esdras', name: '2 Esdras' },
  { file: 'Tobit.json', id: 'tobit', name: 'Tobit' },
  { file: 'Judith.json', id: 'judith', name: 'Judith' },
  { file: 'Wisdom of Solomon.json', id: 'wisdom', name: 'Wisdom of Solomon' },
  { file: 'Ecclesiasticus.json', id: 'sirach', name: 'Sirach' },
  { file: 'Baruch.json', id: 'baruch', name: 'Baruch' },
  { file: 'Letter of Jeremiah.json', id: 'letterJeremiah', name: 'Letter of Jeremiah' },
  { file: 'Prayer of Azariah.json', id: 'prayerAzariah', name: 'Prayer of Azariah' },
  { file: 'Susanna.json', id: 'susanna', name: 'Susanna' },
  { file: 'Bel and the Dragon.json', id: 'belDragon', name: 'Bel and the Dragon' },
  { file: 'Prayer of Manasseh.json', id: 'prayerManasseh', name: 'Prayer of Manasseh' },
  { file: '1 Maccabees.json', id: '1maccabees', name: '1 Maccabees' },
  { file: '2 Maccabees.json', id: '2maccabees', name: '2 Maccabees' },
];

function processKJVBook(config) {
  const filePath = path.join(KJV_DIR, config.file);
  if (!fs.existsSync(filePath)) {
    console.warn(`  SKIP: ${config.file} not found`);
    return 0;
  }

  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const records = [];

  for (const ch of data.chapters) {
    const verseTexts = ch.verses.map(v => `${v.verse}. ${v.text}`);
    const text = verseTexts.join('\n');
    records.push({ ref: `${config.name}|${ch.chapter}`, text });
  }

  const blob = records.map(r => r.ref + SEP + r.text + SEP).join('');
  const outPath = path.join(OUT_DIR, config.id + '.txt');
  fs.writeFileSync(outPath, blob, 'utf8');
  console.log(`  ${config.name}: ${records.length} chapters → ${config.id}.txt (${(blob.length / 1024).toFixed(0)} KB)`);
  return records.length;
}

// ── Pseudepigrapha (scrollmapper format: { books: [{ name, chapters: [{ chapter, verses: [{ verse, text }] }] }] }) ──

const PSEUDO_BOOKS = [
  { dir: '2-enoch', file: '2-enoch.json', id: '2enoch', name: '2 Enoch' },
  { dir: '2-baruch', file: '2-baruch.json', id: '2baruch', name: '2 Baruch' },
  { dir: 'psalms-of-solomon', file: 'psalms-of-solomon.json', id: 'psalmsSolomon', name: 'Psalms of Solomon' },
];

function processPseudoBook(config) {
  const filePath = path.join(DEUT_DIR, config.dir, config.file);
  if (!fs.existsSync(filePath)) {
    console.warn(`  SKIP: ${config.dir}/${config.file} not found`);
    return 0;
  }

  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const book = data.books[0];
  const records = [];

  for (const ch of book.chapters) {
    const verseTexts = ch.verses.map(v => `${v.verse}. ${v.text}`);
    const text = verseTexts.join('\n');
    records.push({ ref: `${config.name}|${ch.chapter}`, text });
  }

  const blob = records.map(r => r.ref + SEP + r.text + SEP).join('');
  const outPath = path.join(OUT_DIR, config.id + '.txt');
  fs.writeFileSync(outPath, blob, 'utf8');
  console.log(`  ${config.name}: ${records.length} chapters → ${config.id}.txt (${(blob.length / 1024).toFixed(0)} KB)`);
  return records.length;
}

// ── Testaments of the Twelve Patriarchs (12 separate JSON files → 1 combined blob) ──

const TESTAMENT_PATRIARCHS = [
  'reuben', 'simeon', 'levi', 'judah', 'issachar', 'zebulun',
  'dan', 'naphtali', 'gad', 'asher', 'joseph', 'benjamin'
];

function processTestaments() {
  const records = [];
  let seqNum = 0;

  for (const patriarch of TESTAMENT_PATRIARCHS) {
    const dir = `testament-of-${patriarch}`;
    const filePath = path.join(DEUT_DIR, dir, `testament-of-${patriarch}.json`);
    if (!fs.existsSync(filePath)) {
      console.warn(`  SKIP: ${dir} not found`);
      continue;
    }

    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const book = data.books[0];

    for (const ch of book.chapters) {
      seqNum++;
      const verseTexts = ch.verses.map(v => `${v.verse}. ${v.text}`);
      const text = verseTexts.join('\n');
      records.push({ ref: `Testaments|${seqNum}`, text, patriarchName: patriarch });
    }
  }

  const blob = records.map(r => r.ref + SEP + r.text + SEP).join('');
  const outPath = path.join(OUT_DIR, 'testaments.txt');
  fs.writeFileSync(outPath, blob, 'utf8');
  console.log(`  Testaments of XII Patriarchs: ${records.length} sections → testaments.txt (${(blob.length / 1024).toFixed(0)} KB)`);
  return records.length;
}

// ── Main ──

function main() {
  console.log('KJV Apocrypha:');
  let total = 0;
  for (const book of KJV_BOOKS) {
    total += processKJVBook(book);
  }

  console.log('\nPseudepigrapha:');
  for (const book of PSEUDO_BOOKS) {
    total += processPseudoBook(book);
  }

  console.log('\nTestaments:');
  total += processTestaments();

  console.log(`\nTotal: ${total} sections across ${KJV_BOOKS.length + PSEUDO_BOOKS.length + 1} books`);
}

main();
