#!/usr/bin/env node
/**
 * Hebrew Gospels — Add Chapter Data
 * 
 * Reads a chapter JSON file produced during translation and appends it to:
 *   - bibles/hg.txt (translation text with Strong's)
 *   - data/hebrew-gospels-interlinear.json (word-by-word interlinear)
 *   - data/hebrew-gospels-notes.json (study notes)
 *
 * Usage:
 *   node scripts/hg-add-chapter.js data/hg-chapters/Revelation-1.json
 *
 * Input format (chapter JSON):
 * {
 *   "book": "Revelation",
 *   "chapter": 1,
 *   "verses": [
 *     {
 *       "verse": 1,
 *       "translation": "The unveiling of Yeshua the Messiah...",
 *       "words": [
 *         ["גלין", "H1540", "unveiling"],
 *         ["די", "H1768", "of"],
 *         ...
 *       ],
 *       "notes": {
 *         "one_way_hebrew": ["Hebrew→Greek only; no plausible Greek→Hebrew path"],
 *         "greek_deviations": ["Where Hebrew text differs from Greek"],
 *         "contradictions": ["Apparent conflicts with OT or other Gospels"],
 *         "translation_notes": ["Why a particular English rendering was chosen"],
 *         "textual_notes": ["Manuscript variants, cross-references, etc."]
 *       }
 *     }
 *   ],
 *   "chapter_notes": {
 *     "summary": "Chapter overview..."
 *   }
 * }
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

function stripVowelPoints(text) {
  return text.replace(/[\u0591-\u05BD\u05BF-\u05C2\u05C4-\u05C7]/g, '');
}

function main() {
  const inputFile = process.argv[2];
  if (!inputFile) {
    console.error('Usage: node scripts/hg-add-chapter.js <chapter-json-file>');
    process.exit(1);
  }

  const chapterData = JSON.parse(fs.readFileSync(inputFile, 'utf-8'));
  const { book, chapter, verses, chapter_notes } = chapterData;

  if (!book || !chapter || !verses || !Array.isArray(verses)) {
    console.error('Invalid chapter JSON: must have book, chapter, and verses array');
    process.exit(1);
  }

  console.log(`Processing ${book} ${chapter} (${verses.length} verses)...`);

  // 1. Append to bibles/hg.txt
  const hgFile = path.join(ROOT, 'bibles', 'hg.txt');
  let hgText = fs.readFileSync(hgFile, 'utf-8');
  
  for (const v of verses) {
    const line = `${book} ${chapter}:${v.verse}\t${v.translation}`;
    hgText += line + '\n';
  }
  fs.writeFileSync(hgFile, hgText);
  console.log(`  ✓ bibles/hg.txt — ${verses.length} verses appended`);

  // 2. Update data/hebrew-gospels-interlinear.json
  const ilFile = path.join(ROOT, 'data', 'hebrew-gospels-interlinear.json');
  const ilData = JSON.parse(fs.readFileSync(ilFile, 'utf-8'));
  
  if (!ilData[book]) {
    ilData[book] = [null]; // index 0 is null placeholder
  }
  
  // Ensure chapter array is large enough
  while (ilData[book].length <= chapter) {
    ilData[book].push(null);
  }
  
  // Build verse object keyed by verse number (supports sub-verses like "7a", "7b")
  const verseObj = {};
  for (const v of verses) {
    const words = v.words.map(([heb, strongs, gloss]) => [stripVowelPoints(heb), strongs, gloss]);
    verseObj[String(v.verse)] = words;
  }
  
  ilData[book][chapter] = verseObj;
  fs.writeFileSync(ilFile, JSON.stringify(ilData));
  console.log(`  ✓ data/hebrew-gospels-interlinear.json — ${book} chapter ${chapter}`);

  // 3. Update data/hebrew-gospels-notes.json
  const notesFile = path.join(ROOT, 'data', 'hebrew-gospels-notes.json');
  const notesData = JSON.parse(fs.readFileSync(notesFile, 'utf-8'));
  
  if (!notesData[book]) {
    notesData[book] = {};
  }
  
  const chNotes = {
    summary: chapter_notes?.summary || '',
    verses: {}
  };
  
  for (const v of verses) {
    if (v.notes && (v.notes.one_way_hebrew?.length || v.notes.greek_deviations?.length || v.notes.contradictions?.length || v.notes.translation_notes?.length || v.notes.textual_notes?.length)) {
      chNotes.verses[String(v.verse)] = v.notes;
    }
  }
  
  notesData[book][String(chapter)] = chNotes;
  fs.writeFileSync(notesFile, JSON.stringify(notesData));
  console.log(`  ✓ data/hebrew-gospels-notes.json — ${book} chapter ${chapter}`);

  console.log('Done!');
}

main();
