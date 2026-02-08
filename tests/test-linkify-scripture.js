#!/usr/bin/env node
/**
 * Unit tests for linkifyScriptureRefs regex pattern.
 *
 * Tests the regex used in views/reader-view.js linkifyScriptureRefs()
 * to match scripture references in text content.
 *
 * Usage: node tests/test-linkify-scripture.js
 */

const assert = require('assert');

// === Replicate the regex from reader-view.js ===
const books = 'Genesis|Exodus|Leviticus|Numbers|Deuteronomy|Joshua|Judges|Ruth|1 Samuel|2 Samuel|1 Kings|2 Kings|1 Chronicles|2 Chronicles|Ezra|Nehemiah|Esther|Job|Psalms?|Proverbs|Ecclesiastes|Song of Solomon|Isaiah|Jeremiah|Lamentations|Ezekiel|Daniel|Hosea|Joel|Amos|Obadiah|Jonah|Micah|Nahum|Habakkuk|Zephaniah|Haggai|Zechariah|Malachi|Matthew|Mark|Luke|John|Acts|Romans|1 Corinthians|2 Corinthians|Galatians|Ephesians|Philippians|Colossians|1 Thessalonians|2 Thessalonians|1 Timothy|2 Timothy|Titus|Philemon|Hebrews|James|1 Peter|2 Peter|1 John|2 John|3 John|Jude|Revelation';

const pattern = new RegExp(`\\b(${books})\\s+(\\d+)(?::(\\d+(?:[-–—]\\d+)?(?:,\\s*\\d+(?:[-–—]\\d+)?)*))?\\b`, 'g');

// === Test runner ===
let passed = 0;
let failed = 0;

function test(desc, input, shouldMatch, expectedGroups) {
  pattern.lastIndex = 0;
  const match = pattern.exec(input);
  
  if (shouldMatch && !match) {
    console.log(`  FAIL: ${desc}`);
    console.log(`    Input: "${input}"`);
    console.log(`    Expected match but got none`);
    failed++;
    return;
  }
  
  if (!shouldMatch && match) {
    console.log(`  FAIL: ${desc}`);
    console.log(`    Input: "${input}"`);
    console.log(`    Expected no match but got: "${match[0]}"`);
    failed++;
    return;
  }
  
  if (!shouldMatch && !match) {
    console.log(`  PASS: ${desc}`);
    passed++;
    return;
  }
  
  // Check expected groups if provided
  if (expectedGroups) {
    const { book, chapter, verseStr } = expectedGroups;
    let ok = true;
    if (book !== undefined && match[1] !== book) {
      console.log(`  FAIL: ${desc} — book: expected "${book}", got "${match[1]}"`);
      ok = false;
    }
    if (chapter !== undefined && match[2] !== chapter) {
      console.log(`  FAIL: ${desc} — chapter: expected "${chapter}", got "${match[2]}"`);
      ok = false;
    }
    if (verseStr !== undefined && match[3] !== verseStr) {
      console.log(`  FAIL: ${desc} — verseStr: expected "${verseStr}", got "${match[3]}"`);
      ok = false;
    }
    if (!ok) {
      failed++;
      return;
    }
  }
  
  console.log(`  PASS: ${desc} — matched "${match[0]}"`);
  passed++;
}

// === Tests ===

console.log('\n=== Scripture Reference Pattern Tests ===\n');

console.log('--- Basic references ---');
test('Simple verse', 'Genesis 1:1', true, { book: 'Genesis', chapter: '1', verseStr: '1' });
test('Verse range (hyphen)', 'Romans 11:17-24', true, { book: 'Romans', chapter: '11', verseStr: '17-24' });
test('Verse range (en dash)', 'Daniel 9:24–27', true, { book: 'Daniel', chapter: '9', verseStr: '24–27' });
test('Verse range (em dash)', 'Daniel 9:24—27', true, { book: 'Daniel', chapter: '9', verseStr: '24—27' });
test('Chapter only', 'Matthew 13', true, { book: 'Matthew', chapter: '13', verseStr: undefined });

console.log('\n--- Psalm/Psalms ---');
test('Psalm singular', 'Psalm 37:10', true, { book: 'Psalm', chapter: '37', verseStr: '10' });
test('Psalms plural', 'Psalms 37:10', true, { book: 'Psalms', chapter: '37', verseStr: '10' });

console.log('\n--- Books with numbers ---');
test('1 Thessalonians', '1 Thessalonians 4:17', true, { book: '1 Thessalonians', chapter: '4', verseStr: '17' });
test('2 Kings', '2 Kings 2:11', true, { book: '2 Kings', chapter: '2', verseStr: '11' });
test('1 John', '1 John 3:4', true, { book: '1 John', chapter: '3', verseStr: '4' });

console.log('\n--- Comma-separated verses (NEW) ---');
test('Comma-separated 3 verses', 'Deuteronomy 16:9,10,16', true,
  { book: 'Deuteronomy', chapter: '16', verseStr: '9,10,16' });
test('Comma-separated with spaces', 'Deuteronomy 16:9, 10, 16', true,
  { book: 'Deuteronomy', chapter: '16', verseStr: '9, 10, 16' });
test('Daniel comma list', 'Daniel 9:24,25,26', true,
  { book: 'Daniel', chapter: '9', verseStr: '24,25,26' });
test('Isaiah comma list', 'Isaiah 60:10,11,12', true,
  { book: 'Isaiah', chapter: '60', verseStr: '10,11,12' });
test('Comma + range mixed', 'Isaiah 60:10-12,15', true,
  { book: 'Isaiah', chapter: '60', verseStr: '10-12,15' });

console.log('\n--- In-context matching ---');
test('Reference in sentence',
  'As it says in Genesis 1:1, God created the heavens.',
  true, { book: 'Genesis', chapter: '1', verseStr: '1' });
test('Reference at end of sentence',
  'See also Revelation 21:1',
  true, { book: 'Revelation', chapter: '21', verseStr: '1' });

console.log('\n--- Non-matches ---');
test('Random text', 'The quick brown fox', false);
test('Partial book name', 'Gene 1:1', false);

// === Summary ===
console.log(`\n=== Results: ${passed} passed, ${failed} failed, ${passed + failed} total ===\n`);

if (failed > 0) {
  process.exit(1);
}
