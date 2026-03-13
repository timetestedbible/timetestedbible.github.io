#!/usr/bin/env node
/**
 * Unit tests for scripture citation regex patterns.
 *
 * Tests the regexes used in:
 *   - views/reader-view.js  linkifyScriptureRefs()     ("readerView pattern")
 *   - bible-reader.js       linkifyScriptureReferences() ("main pattern")
 *
 * Usage: node tests/test-linkify-scripture.js
 */

const assert = require('assert');

// ============================================================================
// Pattern A — readerView pattern (from views/reader-view.js linkifyScriptureRefs)
// ============================================================================
const books = 'Genesis|Exodus|Leviticus|Numbers|Deuteronomy|Joshua|Judges|Ruth|1 Samuel|2 Samuel|1 Kings|2 Kings|1 Chronicles|2 Chronicles|Ezra|Nehemiah|Esther|Job|Psalms?|Proverbs|Ecclesiastes|Song of Solomon|Isaiah|Jeremiah|Lamentations|Ezekiel|Daniel|Hosea|Joel|Amos|Obadiah|Jonah|Micah|Nahum|Habakkuk|Zephaniah|Haggai|Zechariah|Malachi|Matthew|Mark|Luke|John|Acts|Romans|1 Corinthians|2 Corinthians|Galatians|Ephesians|Philippians|Colossians|1 Thessalonians|2 Thessalonians|1 Timothy|2 Timothy|Titus|Philemon|Hebrews|James|1 Peter|2 Peter|1 John|2 John|3 John|Jude|Revelation';

const readerViewPattern = new RegExp(
  `\\b(${books})\\s+(\\d+)(?::(\\d+(?:[-–—]\\d+(?!:\\d))?(?:,\\s*\\d+(?:[-–—]\\d+(?!:\\d))?)*))?(?:[-–—](\\d+)(?::(\\d+))?)?\\b`, 'g'
);

// ============================================================================
// Pattern B — main pattern (from bible-reader.js linkifyScriptureReferences)
// ============================================================================
const bookPatterns = [
  'Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy',
  'Joshua', 'Judges', 'Ruth', '1 Samuel', '2 Samuel', '1 Kings', '2 Kings',
  '1 Chronicles', '2 Chronicles', 'Ezra', 'Nehemiah', 'Esther',
  'Job', 'Psalms?', 'Proverbs', 'Ecclesiastes', 'Song of Solomon', 'Song of Songs',
  'Isaiah', 'Jeremiah', 'Lamentations', 'Ezekiel', 'Daniel',
  'Hosea', 'Joel', 'Amos', 'Obadiah', 'Jonah', 'Micah',
  'Nahum', 'Habakkuk', 'Zephaniah', 'Haggai', 'Zechariah', 'Malachi',
  'Matthew', 'Mark', 'Luke', 'John', 'Acts', 'Romans',
  '1 Corinthians', '2 Corinthians', 'Galatians', 'Ephesians', 'Philippians',
  'Colossians', '1 Thessalonians', '2 Thessalonians',
  '1 Timothy', '2 Timothy', 'Titus', 'Philemon',
  'Hebrews', 'James', '1 Peter', '2 Peter', '1 John', '2 John', '3 John',
  'Jude', 'Revelation',
  'Gen', 'Ex', 'Exod?', 'Lev', 'Num', 'Deut',
  'Josh', 'Judg', 'Sam', 'Kgs', 'Chr', 'Neh', 'Est',
  'Psa?', 'Prov', 'Eccl', 'Song', 'Isa', 'Jer', 'Lam', 'Ezek?', 'Dan',
  'Hos', 'Obad', 'Mic', 'Nah', 'Hab', 'Zeph', 'Hag', 'Zech', 'Mal',
  'Matt?', 'Mk', 'Lk', 'Jn', 'Rom', 'Cor', 'Gal', 'Eph', 'Phil', 'Col',
  'Thess', 'Tim', 'Tit', 'Phlm', 'Heb', 'Jas', 'Pet', 'Rev'
];
const bookPattern = bookPatterns.join('|');

const mainPattern = new RegExp(
  `((?:1|2|3|I{1,3})?\\s*(?:${bookPattern})\\.?)\\s*(\\d+)(?::(\\d+(?:[-–]\\d+(?!:\\d))?(?:,\\s*\\d+(?:[-–]\\d+(?!:\\d))?)*))?(?:[-–](\\d+)(?::(\\d+))?)?`,
  'gi'
);

// ============================================================================
// Test runner
// ============================================================================
let passed = 0;
let failed = 0;

/**
 * Test a regex pattern against input.
 * @param {string}  label         - Which pattern ("readerView" or "main")
 * @param {RegExp}  pat           - The regex to test
 * @param {string}  desc          - Test description
 * @param {string}  input         - Input text
 * @param {boolean} shouldMatch   - Whether a match is expected
 * @param {object}  [expected]    - Expected capture groups + fullMatch
 *   { fullMatch, book, chapter, verseStr, endChapter, endVerse }
 *   Group indices: [1]=book [2]=chapter [3]=verseStr [4]=endChapter [5]=endVerse (main)
 *                  [1]=book [2]=chapter [3]=verseStr (readerView)
 */
function test(label, pat, desc, input, shouldMatch, expected) {
  pat.lastIndex = 0;
  const match = pat.exec(input);

  if (shouldMatch && !match) {
    console.log(`  FAIL [${label}]: ${desc}`);
    console.log(`    Input: "${input}"`);
    console.log(`    Expected match but got none`);
    failed++;
    return;
  }

  if (!shouldMatch && match) {
    console.log(`  FAIL [${label}]: ${desc}`);
    console.log(`    Input: "${input}"`);
    console.log(`    Expected no match but got: "${match[0]}"`);
    failed++;
    return;
  }

  if (!shouldMatch && !match) {
    console.log(`  PASS [${label}]: ${desc}`);
    passed++;
    return;
  }

  if (expected) {
    let ok = true;
    if (expected.fullMatch !== undefined && match[0] !== expected.fullMatch) {
      console.log(`  FAIL [${label}]: ${desc} — fullMatch: expected "${expected.fullMatch}", got "${match[0]}"`);
      ok = false;
    }
    if (expected.book !== undefined && match[1] !== expected.book) {
      console.log(`  FAIL [${label}]: ${desc} — book: expected "${expected.book}", got "${match[1]}"`);
      ok = false;
    }
    if (expected.chapter !== undefined && match[2] !== expected.chapter) {
      console.log(`  FAIL [${label}]: ${desc} — chapter: expected "${expected.chapter}", got "${match[2]}"`);
      ok = false;
    }
    if (expected.verseStr !== undefined && match[3] !== expected.verseStr) {
      console.log(`  FAIL [${label}]: ${desc} — verseStr: expected "${expected.verseStr}", got "${match[3]}"`);
      ok = false;
    }
    if (expected.endChapter !== undefined && match[4] !== expected.endChapter) {
      console.log(`  FAIL [${label}]: ${desc} — endChapter: expected "${expected.endChapter}", got "${match[4]}"`);
      ok = false;
    }
    if (expected.endVerse !== undefined && match[5] !== expected.endVerse) {
      console.log(`  FAIL [${label}]: ${desc} — endVerse: expected "${expected.endVerse}", got "${match[5]}"`);
      ok = false;
    }
    if (!ok) {
      failed++;
      return;
    }
  }

  console.log(`  PASS [${label}]: ${desc} — matched "${match[0]}"`);
  passed++;
}

// Convenience wrappers
function testReader(desc, input, shouldMatch, expected) {
  test('readerView', readerViewPattern, desc, input, shouldMatch, expected);
}
function testMain(desc, input, shouldMatch, expected) {
  test('main', mainPattern, desc, input, shouldMatch, expected);
}
function testBoth(desc, input, shouldMatch, expected) {
  testReader(desc, input, shouldMatch, expected);
  testMain(desc, input, shouldMatch, expected);
}

// ============================================================================
// Tests
// ============================================================================

console.log('\n=== Scripture Citation Pattern Tests ===\n');

// ---- Basic references (both patterns) ----
console.log('--- Basic references ---');
testBoth('Simple verse', 'Genesis 1:1', true,
  { fullMatch: 'Genesis 1:1', book: 'Genesis', chapter: '1', verseStr: '1' });
testBoth('Verse range (hyphen)', 'Romans 11:17-24', true,
  { fullMatch: 'Romans 11:17-24', book: 'Romans', chapter: '11', verseStr: '17-24' });
testBoth('Verse range (en dash)', 'Daniel 9:24–27', true,
  { book: 'Daniel', chapter: '9', verseStr: '24–27' });
testBoth('Verse range (em dash)', 'Daniel 9:24—27', true,
  { book: 'Daniel', chapter: '9' });
testBoth('Chapter only', 'Matthew 13', true,
  { fullMatch: 'Matthew 13', book: 'Matthew', chapter: '13', verseStr: undefined });
testBoth('Single verse', 'John 3:16', true,
  { fullMatch: 'John 3:16', book: 'John', chapter: '3', verseStr: '16' });

// ---- Psalm/Psalms ----
console.log('\n--- Psalm/Psalms ---');
testBoth('Psalm singular', 'Psalm 37:10', true,
  { book: 'Psalm', chapter: '37', verseStr: '10' });
testBoth('Psalms plural', 'Psalms 37:10', true,
  { book: 'Psalms', chapter: '37', verseStr: '10' });

// ---- Numbered books ----
console.log('\n--- Numbered books ---');
testBoth('1 Thessalonians', '1 Thessalonians 4:17', true,
  { chapter: '4', verseStr: '17' });
testBoth('2 Kings', '2 Kings 2:11', true,
  { chapter: '2', verseStr: '11' });
testBoth('1 John', '1 John 3:4', true,
  { chapter: '3', verseStr: '4' });

// ---- Comma-separated verses ----
console.log('\n--- Comma-separated verses ---');
testBoth('Comma-separated 3 verses', 'Deuteronomy 16:9,10,16', true,
  { book: 'Deuteronomy', chapter: '16', verseStr: '9,10,16' });
testBoth('Comma-separated with spaces', 'Deuteronomy 16:9, 10, 16', true,
  { book: 'Deuteronomy', chapter: '16', verseStr: '9, 10, 16' });
testBoth('Comma + range mixed', 'Isaiah 60:10-12,15', true,
  { book: 'Isaiah', chapter: '60', verseStr: '10-12,15' });

// ---- In-context matching ----
console.log('\n--- In-context matching ---');
testReader('Reference in sentence',
  'As it says in Genesis 1:1, God created the heavens.', true,
  { book: 'Genesis', chapter: '1', verseStr: '1' });
testMain('Reference in sentence (main — no \\b, book may have leading space)',
  'As it says in Genesis 1:1, God created the heavens.', true,
  { chapter: '1', verseStr: '1' });
testReader('Reference at end of sentence',
  'See also Revelation 21:1', true,
  { book: 'Revelation', chapter: '21', verseStr: '1' });
testMain('Reference at end of sentence (main)',
  'See also Revelation 21:1', true,
  { chapter: '21', verseStr: '1' });
testReader('Reference after parenthesis',
  '(see Daniel 7:13)', true,
  { book: 'Daniel', chapter: '7', verseStr: '13' });
testMain('Reference after parenthesis (main)',
  '(see Daniel 7:13)', true,
  { chapter: '7', verseStr: '13' });

// ---- Non-matches ----
console.log('\n--- Non-matches ---');
testBoth('Random text', 'The quick brown fox', false);
testBoth('Partial book name', 'Gene 1:1', false);

// ============================================================================
// Cross-chapter references — THE BUG
// The whole reference (e.g. "Daniel 5:30–6:2") must be captured as a single
// match. The link should point to the first chapter.
// ============================================================================
console.log('\n--- Cross-chapter references ---');

testReader('Cross-chapter en dash (readerView)',
  'Daniel 5:30–6:2', true,
  { fullMatch: 'Daniel 5:30–6:2', book: 'Daniel', chapter: '5', verseStr: '30' });

testMain('Cross-chapter en dash (main)',
  'Daniel 5:30–6:2', true,
  { fullMatch: 'Daniel 5:30–6:2', book: 'Daniel', chapter: '5', verseStr: '30',
    endChapter: '6', endVerse: '2' });

testReader('Cross-chapter hyphen (readerView)',
  'Genesis 1:31-2:3', true,
  { fullMatch: 'Genesis 1:31-2:3', book: 'Genesis', chapter: '1', verseStr: '31' });

testMain('Cross-chapter hyphen (main)',
  'Genesis 1:31-2:3', true,
  { fullMatch: 'Genesis 1:31-2:3', book: 'Genesis', chapter: '1', verseStr: '31',
    endChapter: '2', endVerse: '3' });

testMain('Cross-chapter numbered book',
  '1 Kings 8:65–9:1', true,
  { fullMatch: '1 Kings 8:65–9:1', chapter: '8', verseStr: '65',
    endChapter: '9', endVerse: '1' });

testReader('Cross-chapter numbered book (readerView)',
  '1 Kings 8:65–9:1', true,
  { fullMatch: '1 Kings 8:65–9:1', chapter: '8', verseStr: '65' });

testMain('Cross-chapter in sentence',
  'Read Daniel 5:30–6:2 for context.', true,
  { chapter: '5', verseStr: '30', endChapter: '6', endVerse: '2' });

testReader('Cross-chapter in sentence (readerView)',
  'Read Daniel 5:30–6:2 for context.', true,
  { fullMatch: 'Daniel 5:30–6:2', book: 'Daniel', chapter: '5', verseStr: '30' });

// ============================================================================
// Main-pattern-only tests (abbreviations, periods, chapter ranges)
// ============================================================================
console.log('\n--- Main pattern: abbreviations ---');
testMain('Abbreviation Rev', 'Rev 18:21', true,
  { book: 'Rev', chapter: '18', verseStr: '21' });
testMain('Abbreviation Gen', 'Gen 1:1', true,
  { book: 'Gen', chapter: '1', verseStr: '1' });
testMain('Abbreviation Isa', 'Isa 14:12', true,
  { book: 'Isa', chapter: '14', verseStr: '12' });
testMain('Abbreviation Ezek', 'Ezek 37:1', true,
  { chapter: '37', verseStr: '1' });
testMain('Abbreviation with period', 'Gen. 1:1', true,
  { book: 'Gen.', chapter: '1', verseStr: '1' });

console.log('\n--- Main pattern: chapter ranges ---');
testMain('Chapter range (hyphen)', 'Revelation 17-18', true,
  { book: 'Revelation', chapter: '17', verseStr: undefined, endChapter: '18' });
testMain('Chapter range (en dash)', 'Revelation 17–18', true,
  { book: 'Revelation', chapter: '17', verseStr: undefined, endChapter: '18' });

console.log('\n--- Main pattern: complex verse specs ---');
testMain('Multi-range comma list', 'Ezekiel 26:4-5,14', true,
  { book: 'Ezekiel', chapter: '26', verseStr: '4-5,14' });
testMain('Two ranges with comma', '1 Kings 8:1-11,65-66', true,
  { chapter: '8', verseStr: '1-11,65-66' });

// ============================================================================
// Edge cases: ensure within-chapter verse ranges still work
// (The fix must NOT break these.)
// ============================================================================
console.log('\n--- Regression: within-chapter ranges must still work ---');
testBoth('Simple verse range still works', 'Romans 8:28-30', true,
  { fullMatch: 'Romans 8:28-30', book: 'Romans', chapter: '8', verseStr: '28-30' });
testBoth('En dash verse range still works', 'Isaiah 53:4–6', true,
  { book: 'Isaiah', chapter: '53', verseStr: '4–6' });
testMain('Verse range not followed by colon', 'Dan 9:24-27', true,
  { book: 'Dan', chapter: '9', verseStr: '24-27' });
testBoth('Large verse range', 'Psalm 119:1-176', true,
  { chapter: '119', verseStr: '1-176' });
testBoth('Comma list still works after fix', 'Daniel 9:24,25,26', true,
  { book: 'Daniel', chapter: '9', verseStr: '24,25,26' });

// ============================================================================
// Summary
// ============================================================================
console.log(`\n=== Results: ${passed} passed, ${failed} failed, ${passed + failed} total ===\n`);

if (failed > 0) {
  process.exit(1);
}
