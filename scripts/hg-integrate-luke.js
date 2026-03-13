#!/usr/bin/env node
/**
 * Hebrew Gospel of Luke — Integrate into HG master files
 *
 * Converts Phase 1 Luke translation output (literal/amplified/work/ambiguities)
 * into the standard hg-chapters format (translation/notes), then runs
 * hg-add-chapter.js to integrate each chapter into:
 *   - bibles/hg.txt
 *   - data/hebrew-gospels-interlinear.json
 *   - data/hebrew-gospels-notes.json
 *
 * Usage:
 *   node scripts/hg-integrate-luke.js          # all chapters
 *   node scripts/hg-integrate-luke.js 1        # single chapter
 *   node scripts/hg-integrate-luke.js 1-5      # range
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const HG_CHAPTERS = path.join(ROOT, 'data', 'hg-chapters');
const ADD_SCRIPT = path.join(__dirname, 'hg-add-chapter.js');

function convertVerse(v) {
  const translated = {
    verse: v.verse,
    translation: v.amplified || v.literal || '',
    words: v.words || []
  };

  const notes = {
    one_way_hebrew: [],
    greek_deviations: [],
    translation_notes: [],
    textual_notes: []
  };

  if (v.work && v.work.length > 0) {
    notes.translation_notes = v.work;
  }

  if (v.ambiguities && v.ambiguities.length > 0) {
    notes.textual_notes = v.ambiguities;
  }

  // If the source already has notes in the standard format, preserve them
  if (v.notes) {
    if (v.notes.one_way_hebrew) notes.one_way_hebrew = v.notes.one_way_hebrew;
    if (v.notes.greek_deviations) notes.greek_deviations = v.notes.greek_deviations;
    if (v.notes.translation_notes) notes.translation_notes = v.notes.translation_notes;
    if (v.notes.textual_notes) notes.textual_notes = v.notes.textual_notes;
  }

  translated.notes = notes;
  return translated;
}

function convertChapter(chapter) {
  const srcPath = path.join(HG_CHAPTERS, `Luke-${chapter}.json`);
  if (!fs.existsSync(srcPath)) {
    console.error(`  Not found: ${srcPath}`);
    return false;
  }

  const data = JSON.parse(fs.readFileSync(srcPath, 'utf-8'));
  const verses = data.verses || data.sections || [];

  // Check if already in standard format
  if (verses.length > 0 && verses[0].translation && verses[0].notes) {
    console.log(`  Luke ${chapter}: already in standard format`);
    return true;
  }

  const converted = {
    book: 'Luke',
    chapter: chapter,
    source: data.source || 'Hebrew Gospel of Luke v2.1 (Van Rensburg 2026, Vat. Ebr. 100)',
    verses: verses.map(convertVerse),
    chapter_notes: {
      summary: `Phase 1 consonantal translation — niqqud stripped, no English/Greek reference provided. Literal and amplified readings produced independently from consonantal Hebrew.`
    }
  };

  // Also store the literal reading as a separate field for reference
  for (let i = 0; i < verses.length; i++) {
    if (verses[i].literal) {
      converted.verses[i].literal = verses[i].literal;
    }
  }

  fs.writeFileSync(srcPath, JSON.stringify(converted, null, 2));
  console.log(`  Luke ${chapter}: converted ${converted.verses.length} verses`);
  return true;
}

function main() {
  const arg = process.argv[2];
  let chapters;

  if (!arg) {
    chapters = [];
    for (let c = 1; c <= 24; c++) chapters.push(c);
  } else if (arg.includes('-')) {
    const [s, e] = arg.split('-').map(Number);
    chapters = [];
    for (let c = s; c <= e; c++) chapters.push(c);
  } else {
    chapters = [parseInt(arg)];
  }

  // First remove any existing Luke entries from hg.txt to avoid duplicates
  const hgFile = path.join(ROOT, 'bibles', 'hg.txt');
  if (fs.existsSync(hgFile)) {
    const lines = fs.readFileSync(hgFile, 'utf-8').split('\n');
    const filtered = lines.filter(l => !l.startsWith('Luke '));
    fs.writeFileSync(hgFile, filtered.join('\n'));
    const removed = lines.length - filtered.length;
    if (removed > 0) console.log(`Removed ${removed} existing Luke lines from hg.txt`);
  }

  // Remove existing Luke entries from interlinear and notes
  const ilFile = path.join(ROOT, 'data', 'hebrew-gospels-interlinear.json');
  if (fs.existsSync(ilFile)) {
    const ilData = JSON.parse(fs.readFileSync(ilFile, 'utf-8'));
    if (ilData.Luke) {
      delete ilData.Luke;
      fs.writeFileSync(ilFile, JSON.stringify(ilData));
      console.log('Cleared existing Luke from hebrew-gospels-interlinear.json');
    }
  }

  const notesFile = path.join(ROOT, 'data', 'hebrew-gospels-notes.json');
  if (fs.existsSync(notesFile)) {
    const notesData = JSON.parse(fs.readFileSync(notesFile, 'utf-8'));
    if (notesData.Luke) {
      delete notesData.Luke;
      fs.writeFileSync(notesFile, JSON.stringify(notesData));
      console.log('Cleared existing Luke from hebrew-gospels-notes.json');
    }
  }

  // Convert and integrate each chapter
  console.log(`\nConverting ${chapters.length} chapter(s) to standard format...`);
  for (const ch of chapters) {
    convertChapter(ch);
  }

  console.log(`\nIntegrating into master files...`);
  for (const ch of chapters) {
    const chFile = path.join(HG_CHAPTERS, `Luke-${ch}.json`);
    if (!fs.existsSync(chFile)) continue;
    try {
      const output = execSync(`node "${ADD_SCRIPT}" "${chFile}"`, { encoding: 'utf-8' });
      console.log(output.trim());
    } catch (e) {
      console.error(`  Failed on Luke ${ch}: ${e.message}`);
    }
  }

  console.log('\nDone!');
}

main();
