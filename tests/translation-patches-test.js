#!/usr/bin/env node
/**
 * Unit tests for translation patches.
 *
 * Verifies that every patch in data/translation-patches.json:
 * 1. Has all required fields (id, verse, find, replace, summary)
 * 2. The `find` text is a substring of the actual verse in each translation
 * 3. The `replace` text is different from the `find` text
 * 4. Strong's numbers in the replacement match those in the find
 * 5. The study URL, if provided, corresponds to an existing file
 *
 * Usage: node tests/translation-patches-test.js
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const PATCHES_FILE = path.join(ROOT, 'data/translation-patches.json');
const BIBLES_DIR = path.join(ROOT, 'bibles');

// Translation file mapping (patch id → bible filename)
const TRANSLATION_FILES = {
  kjv: 'kjv_strongs.txt',
  akjv: 'akjv_strongs.txt',
  asv: 'asv_strongs.txt',
  dbt: 'dbt.txt',
  drb: 'drb.txt',
  jps: 'jps.txt',
  slt: 'slt.txt',
  wbt: 'wbt.txt',
  ylt: 'ylt.txt',
};

let passed = 0;
let failed = 0;
let warnings = 0;

function pass(msg) { passed++; }
function fail(msg) { failed++; console.error('  FAIL: ' + msg); }
function warn(msg) { warnings++; console.warn('  WARN: ' + msg); }

// Load patches
const patches = JSON.parse(fs.readFileSync(PATCHES_FILE, 'utf8'));
assert(patches.patches && Array.isArray(patches.patches), 'patches.patches must be an array');

// Load Bible texts
const bibleTexts = {};
for (const [id, file] of Object.entries(TRANSLATION_FILES)) {
  const filePath = path.join(BIBLES_DIR, file);
  if (fs.existsSync(filePath)) {
    bibleTexts[id] = fs.readFileSync(filePath, 'utf8');
  }
}

// Index verses by reference for each translation
function getVerse(translationText, ref) {
  const lines = translationText.split('\n');
  // Try exact match with space or tab separator
  let match = lines.find(l => l.startsWith(ref + ' ') || l.startsWith(ref + '\t'));
  if (match) return match;
  // Some translations use "Psalm" vs "Psalms"
  if (ref.startsWith('Psalms ')) {
    const altRef = ref.replace('Psalms ', 'Psalm ');
    match = lines.find(l => l.startsWith(altRef + ' ') || l.startsWith(altRef + '\t'));
    if (match) return match;
  }
  return null;
}

console.log(`Testing ${patches.patches.length} translation patches...\n`);

for (const patch of patches.patches) {
  console.log(`── ${patch.id} (${patch.verse}) ──`);

  // 1. Required fields
  if (!patch.id) fail('missing id');
  else pass();

  if (!patch.verse) fail('missing verse');
  else pass();

  if (!patch.find || typeof patch.find !== 'object') fail('missing or invalid find object');
  else pass();

  if (!patch.replace || typeof patch.replace !== 'object') fail('missing or invalid replace object');
  else pass();

  if (!patch.summary) fail('missing summary');
  else pass();

  // 2. Find text matches actual verse in each translation
  for (const [transId, findText] of Object.entries(patch.find)) {
    if (!bibleTexts[transId]) {
      warn(`translation "${transId}" not available for testing`);
      continue;
    }

    const verseLine = getVerse(bibleTexts[transId], patch.verse);
    if (!verseLine) {
      fail(`verse "${patch.verse}" not found in ${transId}`);
      continue;
    }

    if (verseLine.includes(findText)) {
      pass();
    } else {
      // Track as failure but show details for debugging
      fail(`find text not found in ${transId} for ${patch.verse}`);
      const cleanFind = findText.substring(0, 60);
      const cleanVerse = verseLine.replace(/^[^\t]+[\t ]/, '').substring(0, 80);
      console.error(`    Find:  "${cleanFind}..."`);
      console.error(`    Verse: "${cleanVerse}..."`);
    }
  }

  // 3. Replace text differs from find text
  for (const [transId, replaceText] of Object.entries(patch.replace)) {
    const findText = patch.find[transId];
    if (findText && replaceText === findText) {
      fail(`replace is identical to find for ${transId}`);
    } else {
      pass();
    }
  }

  // 4. Strong's numbers in replace should match those in find (same count)
  for (const [transId, replaceText] of Object.entries(patch.replace)) {
    const findText = patch.find[transId];
    if (!findText) continue;

    const findStrongs = (findText.match(/\{[HG]\d+\}/g) || []).sort();
    const replaceStrongs = (replaceText.match(/\{[HG]\d+\}/g) || []).sort();

    if (JSON.stringify(findStrongs) !== JSON.stringify(replaceStrongs)) {
      warn(`Strong's numbers differ in ${transId}: find has ${findStrongs.length}, replace has ${replaceStrongs.length}`);
      // Show which are missing/added
      const findSet = new Set(findStrongs);
      const replSet = new Set(replaceStrongs);
      for (const s of findStrongs) { if (!replSet.has(s)) console.warn(`      Missing in replace: ${s}`); }
      for (const s of replaceStrongs) { if (!findSet.has(s)) console.warn(`      Added in replace: ${s}`); }
    } else {
      pass();
    }
  }

  // 5. Study URL corresponds to an existing file (if provided)
  if (patch.study) {
    // /research/verses/heb-10-20/ → _verses/heb-10-20.md
    // /research/symbols/full-moon/ → _symbols/full-moon.md
    let studyFile = null;
    if (patch.study.includes('/verses/')) {
      const key = patch.study.match(/\/verses\/([^/]+)/)?.[1];
      if (key) studyFile = path.join(ROOT, '_verses', key + '.md');
    } else if (patch.study.includes('/symbols/')) {
      const key = patch.study.match(/\/symbols\/([^/]+)/)?.[1];
      if (key) studyFile = path.join(ROOT, '_symbols', key + '.md');
    }

    if (studyFile) {
      if (fs.existsSync(studyFile)) {
        pass();
      } else {
        fail(`study file not found: ${studyFile}`);
      }
    }
  }

  // 6. All translations in find should also be in replace (and vice versa)
  const findTranslations = Object.keys(patch.find);
  const replaceTranslations = Object.keys(patch.replace);
  for (const t of findTranslations) {
    if (!patch.replace[t]) fail(`translation "${t}" in find but missing from replace`);
    else pass();
  }
  for (const t of replaceTranslations) {
    if (!patch.find[t]) fail(`translation "${t}" in replace but missing from find`);
    else pass();
  }
}

console.log(`\n${'═'.repeat(50)}`);
console.log(`Results: ${passed} passed, ${failed} failed, ${warnings} warnings`);
if (failed > 0) {
  console.log('\nFAILED');
  process.exit(1);
} else {
  console.log('\nPASSED');
}
