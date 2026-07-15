#!/usr/bin/env node

'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const {
  indexDictionaryText,
  parseEntry,
  parseHeadword,
  parseScriptureReferences,
  readDictionary,
  romanToInteger
} = require('../scripts/lib/webster-1913');

const ROOT = path.resolve(__dirname, '..');
const FIXTURES = path.join(__dirname, 'fixtures', 'webster-1913');
let passed = 0;

function fixture(name) {
  return fs.readFileSync(path.join(FIXTURES, name), 'utf8').replace(/\n$/, '');
}

function test(name, fn) {
  try {
    fn();
    passed += 1;
    console.log(`  PASS ${name}`);
  } catch (error) {
    console.error(`  FAIL ${name}`);
    throw error;
  }
}

console.log('\n=== Webster 1913 parser tests ===\n');

test('separates pronunciation, grammar, etymology, and source raw text', () => {
  const raw = fixture('valley.txt');
  const entry = parseEntry(raw);
  assert.strictEqual(entry.raw, raw);
  assert.strictEqual(entry.headword, 'VALLEY');
  assert.strictEqual(entry.pronunciation.raw, 'Val"ley');
  assert.deepStrictEqual(entry.header.partsOfSpeech, [{ raw: 'n.', name: 'noun' }]);
  assert.ok(entry.etymology.raw.startsWith('Etym: [OE. vale'));
  assert.ok(entry.etymology.raw.endsWith('See Vale.]'));
  assert.ok(entry.header.raw.includes('\nF. vallée'));
});

test('extracts a clean numbered definition and its Scripture evidence', () => {
  const entry = parseEntry(fixture('valley.txt'));
  assert.strictEqual(entry.senses.length, 2);
  assert.strictEqual(
    entry.senses[0].definition.text,
    'The space inclosed between ranges of hills or mountains; the strip of land at the bottom of the depressions intersecting a country, including usually the bed of a stream, with frequently broad alluvial plains on one or both sides of the stream. Also used figuratively.'
  );
  assert.ok(!entry.senses[0].definition.text.includes('shadow of death'));
  assert.strictEqual(entry.senses[0].notes.length, 1);
  assert.strictEqual(entry.senses[0].scripture[0].quoteText, 'The valley of the shadow of death.');
  assert.deepStrictEqual(
    entry.senses[0].scripture[0].reference.link,
    {
      book: 'Psalms', chapter: 23, verse: 4, endVerse: null,
      href: '/reader/bible/akjv/Psalms/23.4'
    }
  );
  assert.strictEqual(entry.senses[0].scripture[0].reference.raw, 'Ps. xxiii. 4.');
});

test('keeps domain labels and nested lettered subsenses separate', () => {
  const entry = parseEntry(fixture('valley.txt'));
  const architecture = entry.senses[1];
  assert.deepStrictEqual(architecture.domains, ['Arch.']);
  assert.strictEqual(architecture.definition, null);
  assert.strictEqual(architecture.subsenses.length, 2);
  assert.strictEqual(architecture.subsenses[0].labelRaw, '(a)');
  assert.ok(architecture.subsenses[1].definition.text.startsWith('The depression formed'));
  assert.ok(architecture.supplementalRaw.startsWith('-- Valley rafter'));
});

test('handles unnumbered Defn and citations wrapped across source lines', () => {
  const entry = parseEntry(fixture('hades.txt'));
  const sense = entry.senses[0];
  assert.strictEqual(sense.labelRaw, 'Defn:');
  assert.strictEqual(sense.definitionLabelRaw, 'Defn:');
  assert.strictEqual(sense.scripture.length, 3);
  assert.deepStrictEqual(
    sense.scripture.map(item => item.reference.normalized),
    ['Revelation 20:13', 'Acts 2:31', 'Luke 16:23']
  );
  assert.strictEqual(sense.scripture[1].reference.raw, 'Acts\nii. 31 (Rev. Ver.).');
  assert.strictEqual(sense.scripture[1].reference.editionRaw, '(Rev. Ver.).');
  assert.strictEqual(
    sense.scripture[1].quoteText,
    'Neither was he left in Hades, nor did his flesh see corruption.'
  );
});

test('handles numbered domain + Defn variants without leaking quotations', () => {
  const entry = parseEntry(fixture('gate.txt'));
  const scriptural = entry.senses.find(sense => sense.number === 4);
  assert.deepStrictEqual(scriptural.domains, ['Script.']);
  assert.strictEqual(scriptural.definitionLabelRaw, 'Defn:');
  assert.strictEqual(
    scriptural.definition.text,
    'The places which command the entrances or access; hence, place of vantage; power; might.'
  );
  assert.strictEqual(scriptural.scripture[0].reference.normalized, 'Matthew 16:18');
  assert.ok(!scriptural.definition.text.includes('gates of hell'));
});

test('normalizes only supported canonical Roman numerals and Bible books', () => {
  assert.strictEqual(romanToInteger('xxiii'), 23);
  assert.strictEqual(romanToInteger('iiii'), null);
  assert.strictEqual(parseScriptureReferences('Milton. x. 2.').length, 0);
  assert.strictEqual(parseScriptureReferences('Ps. iiii. 4.').length, 0);
  const ref = parseScriptureReferences('2 Cor. xii. 9.')[0];
  assert.strictEqual(ref.normalized, '2 Corinthians 12:9');
  assert.strictEqual(ref.raw, '2 Cor. xii. 9.');
  assert.strictEqual(
    parseScriptureReferences('1. Cor. xiii. 13.')[0].normalized,
    '1 Corinthians 13:13'
  );
  assert.strictEqual(
    parseScriptureReferences('Matt. xi. 29. 30.')[0].normalized,
    'Matthew 11:29,30'
  );
  assert.strictEqual(
    parseScriptureReferences('Exodus xiii. 2-10, and 11-17.')[0].normalized,
    'Exodus 13:2-10,11-17'
  );
});

test('returns every repeated heading as a separate homograph', () => {
  const dictionary = readDictionary();
  const god = parseHeadword(dictionary, 'God');
  assert.strictEqual(god.entryCount, 3);
  assert.deepStrictEqual(
    god.entries.map(entry => entry.header.partsOfSpeech.map(part => part.name)),
    [
      ['adjective', 'noun'],
      ['noun'],
      ['transitive verb']
    ]
  );
  assert.strictEqual(god.entries[1].senses[1].scripture[0].reference.normalized, 'John 4:24');
  assert.ok(god.entries.every(entry => entry.raw.startsWith('GOD\n')));
});

test('indexes repeated fixture headings without merging their raw entries', () => {
  const source = `${fixture('hades.txt')}\n\n${fixture('hades.txt')}\n`;
  const parsed = parseHeadword(indexDictionaryText(source), 'Hades');
  assert.strictEqual(parsed.entryCount, 2);
  assert.strictEqual(parsed.entries[0].raw, fixture('hades.txt'));
  assert.strictEqual(parsed.entries[1].raw, fixture('hades.txt'));
});

test('batch CLI emits one JSON object per requested headword', () => {
  const result = spawnSync(
    process.execPath,
    [
      path.join(ROOT, 'scripts', 'parse-webster-1913.js'),
      '--headwords-file', path.join(FIXTURES, 'headwords.txt'),
      '--jsonl'
    ],
    { cwd: ROOT, encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 }
  );
  assert.strictEqual(result.status, 0, result.stderr);
  const rows = result.stdout.trim().split('\n').map(line => JSON.parse(line));
  assert.deepStrictEqual(rows.map(row => row.headword), ['VALLEY', 'HADES']);
  assert.deepStrictEqual(rows.map(row => row.entryCount), [1, 1]);
  assert.ok(rows.every(row => row.source.sha256));
});

console.log(`\n${passed} Webster parser tests passed.\n`);
