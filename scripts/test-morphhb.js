#!/usr/bin/env node
/**
 * Unit tests for MorphHB data processing modules.
 *
 * Tests morphology-decoder.js, morphhb-gloss.js (pure data logic)
 * and validates the build output (morphhb.json) if it exists.
 *
 * Usage: node scripts/test-morphhb.js
 */

const path = require('path');
const fs = require('fs');
const {
  decodeMorphology,
  decodeSegment,
  parseLemma,
  primaryStrongsFromLemma,
  stripCantillation,
  stripAllDiacritics,
} = require('./morphology-decoder');

const {
  extractFirstMeaning,
  extractGloss,
  getGloss,
  getRootWord,
  getWordGloss,
  getPrefixMeanings
} = require('./morphhb-gloss');

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    passed++;
  } else {
    failed++;
    console.error(`  FAIL: ${message}`);
  }
}

function assertEqual(actual, expected, message) {
  if (actual === expected) {
    passed++;
  } else {
    failed++;
    console.error(`  FAIL: ${message}`);
    console.error(`    Expected: ${JSON.stringify(expected)}`);
    console.error(`    Actual:   ${JSON.stringify(actual)}`);
  }
}

function assertDeepEqual(actual, expected, message) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a === e) {
    passed++;
  } else {
    failed++;
    console.error(`  FAIL: ${message}`);
    console.error(`    Expected: ${e}`);
    console.error(`    Actual:   ${a}`);
  }
}


// ══════════════════════════════════════════════════════════════════
// Test: Null / empty / malformed input handling
// ══════════════════════════════════════════════════════════════════

console.log('\n── Null/empty/malformed input ──');

assertEqual(decodeMorphology(null), null, 'decodeMorphology(null)');
assertEqual(decodeMorphology(''), null, 'decodeMorphology("")');
assertEqual(decodeMorphology(undefined), null, 'decodeMorphology(undefined)');
assertEqual(decodeSegment(null, 'H'), null, 'decodeSegment(null)');
assertEqual(decodeSegment('', 'H'), null, 'decodeSegment("")');
assertDeepEqual(parseLemma(null, 'H'), [], 'parseLemma(null)');
assertDeepEqual(parseLemma('', 'H'), [], 'parseLemma("")');
assertEqual(primaryStrongsFromLemma(null, 'H'), null, 'primaryStrongs(null)');
assertEqual(primaryStrongsFromLemma('', 'H'), null, 'primaryStrongs("")');
assertEqual(extractFirstMeaning(null), '', 'extractFirstMeaning(null)');
assertEqual(extractFirstMeaning(''), '', 'extractFirstMeaning("")');
assertEqual(getGloss(null, {}), '', 'getGloss(null)');
assertEqual(getGloss('H123', null), '', 'getGloss with null dict');
assertEqual(getWordGloss(null, 'H', {}), '', 'getWordGloss(null)');
assertDeepEqual(getPrefixMeanings(null), [], 'getPrefixMeanings(null)');
assertDeepEqual(getPrefixMeanings(''), [], 'getPrefixMeanings("")');


// ══════════════════════════════════════════════════════════════════
// Test: stripCantillation
// ══════════════════════════════════════════════════════════════════

console.log('\n── stripCantillation ──');

assertEqual(stripCantillation('בְּ/רֵאשִׁ֖ית'), 'בְּ/רֵאשִׁית', 'Strip tifha, keep vowels');
assertEqual(stripCantillation('בָּרָ֣א'), 'בָּרָא', 'Strip munah');
assertEqual(stripCantillation('אֱלֹהִ֑ים'), 'אֱלֹהִים', 'Strip etnahta');
assertEqual(stripCantillation('שָׁלוֹם'), 'שָׁלוֹם', 'No cantillation unchanged');
assertEqual(stripCantillation(''), '', 'Empty string');
assertEqual(stripCantillation(null), null, 'null');
// Maqaf (U+05BE) should be preserved — it's a punctuation mark, not cantillation
assertEqual(stripCantillation('עַל־פְּנֵי'), 'עַל־פְּנֵי', 'Maqaf preserved');
// Sof pasuq (U+05C3) is outside cantillation range, preserved
assertEqual(stripCantillation('׃'), '׃', 'Sof pasuq preserved');


// ══════════════════════════════════════════════════════════════════
// Test: stripAllDiacritics
// ══════════════════════════════════════════════════════════════════

console.log('\n── stripAllDiacritics ──');

assertEqual(stripAllDiacritics('בְּרֵאשִׁ֖ית'), 'בראשית', 'Consonants only');
assertEqual(stripAllDiacritics('אֱלֹהִ֑ים'), 'אלהים', 'Strip all from elohim');
assertEqual(stripAllDiacritics(''), '', 'Empty string');
assertEqual(stripAllDiacritics(null), null, 'null');


// ══════════════════════════════════════════════════════════════════
// Test: Verbs — all conjugation types
// ══════════════════════════════════════════════════════════════════

console.log('\n── Verbs: all conjugation types ──');

{
  const r = decodeSegment('HVqp3ms', 'H');
  assertEqual(r.partOfSpeech, 'Verb', 'Perfect: POS');
  assertEqual(r.stem, 'Qal', 'Perfect: stem');
  assertEqual(r.type, 'Perfect', 'Perfect: type');
  assertEqual(r.person, '3rd', 'Perfect: person');
  assertEqual(r.gender, 'Masculine', 'Perfect: gender');
  assertEqual(r.number, 'Singular', 'Perfect: number');
}

{
  const r = decodeSegment('HVqq1cs', 'H');
  assertEqual(r.type, 'Sequential Perfect', 'Sequential Perfect (weqatal)');
  assertEqual(r.person, '1st', 'SeqPerf: person');
  assertEqual(r.gender, 'Common', 'SeqPerf: common gender');
}

{
  const r = decodeSegment('HVqi3fs', 'H');
  assertEqual(r.type, 'Imperfect', 'Imperfect');
  assertEqual(r.gender, 'Feminine', 'Imperfect: feminine');
}

{
  const r = decodeSegment('HVqw3ms', 'H');
  assertEqual(r.type, 'Sequential Imperfect', 'Sequential Imperfect (wayyiqtol)');
}

{
  const r = decodeSegment('HVqh1cs', 'H');
  assertEqual(r.type, 'Cohortative', 'Cohortative');
  assertEqual(r.person, '1st', 'Cohortative: 1st person');
}

{
  const r = decodeSegment('HVqj3ms', 'H');
  assertEqual(r.type, 'Jussive', 'Jussive');
  assertEqual(r.person, '3rd', 'Jussive: 3rd person');
}

{
  const r = decodeSegment('HVqv2ms', 'H');
  assertEqual(r.type, 'Imperative', 'Imperative');
  assertEqual(r.person, '2nd', 'Imperative: 2nd person');
}

{
  // Participle active: gender, number, state (no person)
  const r = decodeSegment('HVqrmsa', 'H');
  assertEqual(r.type, 'Participle Active', 'Participle Active');
  assertEqual(r.gender, 'Masculine', 'PtcpA: gender');
  assertEqual(r.number, 'Singular', 'PtcpA: number');
  assertEqual(r.state, 'Absolute', 'PtcpA: state');
  assert(r.person === undefined, 'Participle has no person');
}

{
  // Participle passive
  const r = decodeSegment('HVqsmsa', 'H');
  assertEqual(r.type, 'Participle Passive', 'Participle Passive');
  assertEqual(r.gender, 'Masculine', 'PtcpP: gender');
}

{
  // Infinitive absolute
  const r = decodeSegment('HVqa', 'H');
  assertEqual(r.type, 'Infinitive Absolute', 'Infinitive Absolute');
}

{
  // Infinitive construct
  const r = decodeSegment('HVqc', 'H');
  assertEqual(r.type, 'Infinitive Construct', 'Infinitive Construct');
}


// ══════════════════════════════════════════════════════════════════
// Test: All Hebrew verb stems actually found in the data
// ══════════════════════════════════════════════════════════════════

console.log('\n── Verb stems ──');

const stemTests = {
  q: 'Qal', N: 'Niphal', p: 'Piel', P: 'Pual', h: 'Hiphil', H: 'Hophal',
  t: 'Hithpael', o: 'Polel', O: 'Polal', r: 'Hithpolel', m: 'Poel', M: 'Poal',
  k: 'Palel', K: 'Pulal', Q: 'Qal Passive', l: 'Pilpel', L: 'Polpal',
  f: 'Hithpalpel', D: 'Nithpael', j: 'Pealal', i: 'Pilel', u: 'Hothpaal',
  c: 'Tiphil', v: 'Hishtaphel', z: 'Hithpoel'
};

for (const [code, name] of Object.entries(stemTests)) {
  const r = decodeSegment(`HV${code}p3ms`, 'H');
  assertEqual(r.stem, name, `Stem ${code} = ${name}`);
}


// ══════════════════════════════════════════════════════════════════
// Test: Aramaic verb stems
// ══════════════════════════════════════════════════════════════════

console.log('\n── Aramaic verb stems ──');

{
  const r = decodeSegment('AVqp3ms', 'A');
  assertEqual(r.language, 'Aramaic', 'Aramaic language');
  assertEqual(r.stem, 'Peal', 'Aramaic q = Peal');
}

{
  const r = decodeSegment('AVap3ms', 'A');
  assertEqual(r.stem, 'Aphel', 'Aramaic a = Aphel');
}

{
  const r = decodeSegment('AVhp3ms', 'A');
  assertEqual(r.stem, 'Haphel', 'Aramaic h = Haphel');
}

{
  // Aramaic compound code
  const r = decodeMorphology('AC/Vqp3ms');
  assertEqual(r.language, 'Aramaic', 'Aramaic compound: language');
  assertEqual(r.parts.length, 2, 'Aramaic compound: 2 parts');
  assertEqual(r.parts[0].partOfSpeech, 'Conjunction', 'Aramaic compound: prefix');
  assertEqual(r.parts[1].stem, 'Peal', 'Aramaic compound: Peal stem');
}


// ══════════════════════════════════════════════════════════════════
// Test: Nouns
// ══════════════════════════════════════════════════════════════════

console.log('\n── Nouns ──');

{
  const r = decodeSegment('HNcfsa', 'H');
  assertEqual(r.partOfSpeech, 'Noun', 'Noun POS');
  assertEqual(r.type, 'Common', 'Common noun');
  assertEqual(r.gender, 'Feminine', 'Feminine');
  assertEqual(r.number, 'Singular', 'Singular');
  assertEqual(r.state, 'Absolute', 'Absolute');
}

{
  const r = decodeSegment('HNcmpc', 'H');
  assertEqual(r.state, 'Construct', 'Construct state');
  assertEqual(r.number, 'Plural', 'Plural');
}

{
  const r = decodeSegment('HNcbsa', 'H');
  assertEqual(r.gender, 'Both', 'Gender both');
}

{
  const r = decodeSegment('HNcmda', 'H');
  assertEqual(r.number, 'Dual', 'Dual number');
}

{
  const r = decodeSegment('HNp', 'H');
  assertEqual(r.type, 'Proper Name', 'Proper name');
}

{
  const r = decodeSegment('HNgmpa', 'H');
  assertEqual(r.type, 'Gentilic', 'Gentilic noun');
}


// ══════════════════════════════════════════════════════════════════
// Test: Adjectives — all types
// ══════════════════════════════════════════════════════════════════

console.log('\n── Adjectives ──');

{
  const r = decodeSegment('HAamsa', 'H');
  assertEqual(r.partOfSpeech, 'Adjective', 'Adj POS');
  assertEqual(r.type, 'Adjective', 'Adj type a');
}

{
  const r = decodeSegment('HAcbpa', 'H');
  assertEqual(r.type, 'Cardinal Number', 'Cardinal number');
  assertEqual(r.gender, 'Both', 'Cardinal: both gender');
}

{
  const r = decodeSegment('HAomsa', 'H');
  assertEqual(r.type, 'Ordinal Number', 'Ordinal number');
}

{
  const r = decodeSegment('HAgmpa', 'H');
  assertEqual(r.type, 'Gentilic', 'Gentilic adjective');
}


// ══════════════════════════════════════════════════════════════════
// Test: Pronouns — all types
// ══════════════════════════════════════════════════════════════════

console.log('\n── Pronouns ──');

{
  const r = decodeSegment('HPp3ms', 'H');
  assertEqual(r.type, 'Personal', 'Personal pronoun');
  assertEqual(r.person, '3rd', 'Pronoun person');
  assertEqual(r.gender, 'Masculine', 'Pronoun gender');
  assertEqual(r.number, 'Singular', 'Pronoun number');
}

{
  const r = decodeSegment('HPdxms', 'H');
  assertEqual(r.type, 'Demonstrative', 'Demonstrative pronoun');
  // 'x' placeholder for person
  assert(r.person === undefined || r.person === '', 'Demonstrative: no person (x placeholder)');
}

{
  const r = decodeSegment('HPi', 'H');
  assertEqual(r.type, 'Interrogative', 'Interrogative pronoun');
}

{
  const r = decodeSegment('HPr', 'H');
  assertEqual(r.type, 'Relative', 'Relative pronoun');
}

{
  const r = decodeSegment('HPf', 'H');
  assertEqual(r.type, 'Indefinite', 'Indefinite pronoun');
}


// ══════════════════════════════════════════════════════════════════
// Test: Particles — all types
// ══════════════════════════════════════════════════════════════════

console.log('\n── Particles ──');

{
  const r = decodeSegment('HTd', 'H');
  assertEqual(r.type, 'Definite Article', 'Particle: definite article');
}
{
  const r = decodeSegment('HTo', 'H');
  assertEqual(r.type, 'Object Marker', 'Particle: object marker');
}
{
  const r = decodeSegment('HTi', 'H');
  assertEqual(r.type, 'Interrogative', 'Particle: interrogative');
}
{
  const r = decodeSegment('HTn', 'H');
  assertEqual(r.type, 'Negative', 'Particle: negative');
}
{
  const r = decodeSegment('HTr', 'H');
  assertEqual(r.type, 'Relative', 'Particle: relative');
}
{
  const r = decodeSegment('HTj', 'H');
  assertEqual(r.type, 'Interjection', 'Particle: interjection');
}
{
  const r = decodeSegment('HTa', 'H');
  assertEqual(r.type, 'Affirmation', 'Particle: affirmation');
}
{
  const r = decodeSegment('HTe', 'H');
  assertEqual(r.type, 'Exhortation', 'Particle: exhortation');
}
{
  const r = decodeSegment('HTm', 'H');
  assertEqual(r.type, 'Demonstrative', 'Particle: demonstrative');
}


// ══════════════════════════════════════════════════════════════════
// Test: Suffixes — all types
// ══════════════════════════════════════════════════════════════════

console.log('\n── Suffixes ──');

{
  const r = decodeSegment('Sp3ms', 'H');
  assertEqual(r.partOfSpeech, 'Suffix', 'Suffix POS');
  assertEqual(r.type, 'Pronominal', 'Pronominal suffix');
  assertEqual(r.person, '3rd', 'Suffix person');
  assertEqual(r.gender, 'Masculine', 'Suffix gender');
  assertEqual(r.number, 'Singular', 'Suffix number');
}

{
  const r = decodeSegment('Sd', 'H');
  assertEqual(r.type, 'Directional He', 'Directional he suffix');
}

{
  const r = decodeSegment('Sh', 'H');
  assertEqual(r.type, 'Paragogic He', 'Paragogic he suffix');
}

{
  const r = decodeSegment('Sn', 'H');
  assertEqual(r.type, 'Paragogic Nun', 'Paragogic nun suffix');
}


// ══════════════════════════════════════════════════════════════════
// Test: Other POS (Conjunction, Adverb, Preposition)
// ══════════════════════════════════════════════════════════════════

console.log('\n── Other POS ──');

{
  assertEqual(decodeSegment('HC', 'H').partOfSpeech, 'Conjunction', 'Conjunction');
}
{
  assertEqual(decodeSegment('HD', 'H').partOfSpeech, 'Adverb', 'Adverb');
}
{
  assertEqual(decodeSegment('HR', 'H').partOfSpeech, 'Preposition', 'Preposition');
}
{
  const r = decodeSegment('HRd', 'H');
  assertEqual(r.partOfSpeech, 'Preposition', 'Preposition with article');
  assertEqual(r.type, 'Definite Article', 'Preposition article type');
}


// ══════════════════════════════════════════════════════════════════
// Test: Compound morph codes
// ══════════════════════════════════════════════════════════════════

console.log('\n── Compound morph codes ──');

{
  // HC/Vqw3ms = Conjunction + Verb (וַ/יֹּאמֶר)
  const r = decodeMorphology('HC/Vqw3ms');
  assertEqual(r.parts.length, 2, 'HC/Vqw3ms: 2 parts');
  assertEqual(r.parts[0].role, 'prefix', 'Part 0 role = prefix');
  assertEqual(r.parts[1].role, 'word', 'Part 1 role = word');
  assertEqual(r.parts[0].partOfSpeech, 'Conjunction', 'Part 0 = Conjunction');
  assertEqual(r.parts[1].partOfSpeech, 'Verb', 'Part 1 = Verb');
}

{
  // HTd/Ncmpa = Article + Noun (הַ/שָּׁמַיִם)
  const r = decodeMorphology('HTd/Ncmpa');
  assertEqual(r.parts.length, 2, 'HTd/Ncmpa: 2 parts');
  assertEqual(r.parts[0].type, 'Definite Article', 'Article');
}

{
  // HC/Ncfsc/Sp3ms = Conjunction + Noun + Suffix (וְ/אִשְׁתּ/וֹ)
  const r = decodeMorphology('HC/Ncfsc/Sp3ms');
  assertEqual(r.parts.length, 3, '3 parts');
  assertEqual(r.parts[0].role, 'prefix', 'Conj is prefix');
  assertEqual(r.parts[1].role, 'word', 'Noun is word');
  assertEqual(r.parts[2].role, 'suffix', 'Suffix is suffix');
  assertEqual(r.parts[2].type, 'Pronominal', 'Pronominal suffix');
}

{
  // HR/Vqc = Preposition + Infinitive Construct (לָ/גוּר)
  const r = decodeMorphology('HR/Vqc');
  assertEqual(r.parts[0].partOfSpeech, 'Preposition', 'Prep prefix');
  assertEqual(r.parts[1].type, 'Infinitive Construct', 'Inf construct');
}

{
  // HC/R/Np = Conjunction + Preposition + Proper Noun (וּ/לְ/נָעֳמִי)
  const r = decodeMorphology('HC/R/Np');
  assertEqual(r.parts.length, 3, '3 parts: conj + prep + noun');
  assertEqual(r.parts[0].partOfSpeech, 'Conjunction', 'Conj');
  assertEqual(r.parts[1].partOfSpeech, 'Preposition', 'Prep');
  assertEqual(r.parts[2].partOfSpeech, 'Noun', 'Noun');
}

{
  // Single word, no compound
  const r = decodeMorphology('HVqp3ms');
  assertEqual(r.parts.length, 1, '1 part');
  assertEqual(r.parts[0].role, 'word', 'Single word role');
}

{
  // HTd/Vqrmpa = Article + Verb Participle (הַ/שֹּׁפְטִים)
  const r = decodeMorphology('HTd/Vqrmpa');
  assertEqual(r.parts[0].type, 'Definite Article', 'Article before participle');
  assertEqual(r.parts[1].type, 'Participle Active', 'Participle active');
}

{
  // HVpi2ms/Sp3fs = Piel Imperfect 2ms + Suffix 3fs (תְּכַלֶ֣/נָּה)
  const r = decodeMorphology('HVpi2ms/Sp3fs');
  assertEqual(r.parts.length, 2, 'Verb + suffix');
  assertEqual(r.parts[0].stem, 'Piel', 'Piel stem');
  assertEqual(r.parts[1].type, 'Pronominal', 'Pronominal suffix');
  assertEqual(r.parts[1].gender, 'Feminine', 'Suffix feminine');
}


// ══════════════════════════════════════════════════════════════════
// Test: parseLemma
// ══════════════════════════════════════════════════════════════════

console.log('\n── parseLemma ──');

assertDeepEqual(parseLemma('b/7225', 'H'), ['H7225'], 'b/7225');
assertDeepEqual(parseLemma('c/1961', 'H'), ['H1961'], 'c/1961');
assertDeepEqual(parseLemma('d/8064', 'H'), ['H8064'], 'd/8064');
assertDeepEqual(parseLemma('1254 a', 'H'), ['H1254a'], '1254 a variant');
assertDeepEqual(parseLemma('430', 'H'), ['H430'], '430');
assertDeepEqual(parseLemma('b/8141', 'A'), ['A8141'], 'Aramaic b/8141');

// Multi-word construct marker "+"
assertDeepEqual(parseLemma('1035+', 'H'), ['H1035'], '1035+ strips plus');
assertDeepEqual(parseLemma('m/1035+', 'H'), ['H1035'], 'm/1035+ strips plus');
assertDeepEqual(parseLemma('l/1008+', 'H'), ['H1008'], 'l/1008+ strips plus');

// Multiple prefixes
assertDeepEqual(parseLemma('c/d/8064', 'H'), ['H8064'], 'c/d/8064 double prefix');
assertDeepEqual(parseLemma('c/l/5281', 'H'), ['H5281'], 'c/l/5281 double prefix');

// Edge case: just a prefix letter
assertDeepEqual(parseLemma('l', 'H'), [], 'Bare prefix letter');


// ══════════════════════════════════════════════════════════════════
// Test: primaryStrongsFromLemma
// ══════════════════════════════════════════════════════════════════

console.log('\n── primaryStrongsFromLemma ──');

assertEqual(primaryStrongsFromLemma('b/7225', 'H'), 'H7225', 'b/7225');
assertEqual(primaryStrongsFromLemma('c/d/8064', 'H'), 'H8064', 'Double prefix');
assertEqual(primaryStrongsFromLemma('1254 a', 'H'), 'H1254a', 'Variant');
assertEqual(primaryStrongsFromLemma('1035+', 'H'), 'H1035', 'Plus stripped');


// ══════════════════════════════════════════════════════════════════
// Test: Description building
// ══════════════════════════════════════════════════════════════════

console.log('\n── buildDescription ──');

{
  const r = decodeMorphology('HC/Vqw3ms');
  assert(r.description.includes('Conjunction'), 'Has Conjunction');
  assert(r.description.includes('Qal'), 'Has Qal');
  assert(r.description.includes('Sequential Imperfect'), 'Has Sequential Imperfect');
  assert(r.description.includes('3rd'), 'Has 3rd');
  assert(r.description.includes('Masculine'), 'Has Masculine');
  assert(r.description.includes('Singular'), 'Has Singular');
  assert(r.description.includes('+'), 'Parts joined with +');
}


// ══════════════════════════════════════════════════════════════════
// Test: Gloss extraction
// ══════════════════════════════════════════════════════════════════

console.log('\n── extractFirstMeaning ──');

assertEqual(extractFirstMeaning('beginning, chief(-est), first'), 'beginning', 'First word');
assertEqual(extractFirstMeaning('angels, [idiom] exceeding, God'), 'angels', 'Skip [idiom]');
assertEqual(extractFirstMeaning('(as such unrepresented in English).'), '', 'Parenthetical only');
assertEqual(extractFirstMeaning('choose, create (creator)'), 'choose', 'First from complex');
assertEqual(extractFirstMeaning('air, [idiom] astrologer, heaven(-s).'), 'air', 'Strip parens');
assertEqual(extractFirstMeaning('[idiom] common, earth'), 'earth', 'Skip leading [idiom]');

console.log('\n── getGloss ──');

const mockDict = {
  'H430': { lemma: 'אֱלֹהִים', kjv_def: 'angels, [idiom] exceeding, God (gods)', strongs_def: 'gods' },
  'H7225': { lemma: 'רֵאשִׁית', kjv_def: 'beginning, chief(-est)', strongs_def: 'the first' },
  'H1254': { lemma: 'בָּרָא', kjv_def: 'choose, create (creator)', strongs_def: 'to create' },
  'H853': { lemma: 'אֵת', kjv_def: '(as such unrepresented in English).', strongs_def: 'self' },
  'H1035': { lemma: 'בֵּית לֶחֶם', kjv_def: 'Bethlehem', strongs_def: 'house of bread' },
};

assertEqual(getGloss('H430', mockDict), 'angels', 'H430');
assertEqual(getGloss('H1254a', mockDict), 'choose', 'H1254a variant fallback');
assertEqual(getGloss('H853', mockDict), 'self', 'Fallback to strongs_def');
assertEqual(getGloss('H9999', mockDict), '', 'Missing entry');
assertEqual(getGloss('H1035', mockDict), 'Bethlehem', 'H1035 with +');

console.log('\n── getWordGloss with + lemmas ──');

assertEqual(getWordGloss('1035+', 'H', mockDict), 'Bethlehem', '1035+ gloss');
assertEqual(getWordGloss('m/1035+', 'H', mockDict), 'Bethlehem', 'm/1035+ gloss');

console.log('\n── getRootWord ──');

assertEqual(getRootWord('H430', mockDict), 'אֱלֹהִים', 'Root word');
assertEqual(getRootWord('H9999', mockDict), '', 'Missing root');

console.log('\n── getPrefixMeanings ──');

assertDeepEqual(getPrefixMeanings('b/7225'), ['in'], 'b = in');
assertDeepEqual(getPrefixMeanings('c/853'), ['and'], 'c = and');
assertDeepEqual(getPrefixMeanings('d/8064'), ['the'], 'd = the');
assertDeepEqual(getPrefixMeanings('l/1481 a'), ['to/for'], 'l = to/for');
assertDeepEqual(getPrefixMeanings('k/3605'), ['as/like'], 'k = as/like');
assertDeepEqual(getPrefixMeanings('m/1035+'), ['from'], 'm = from');
assertDeepEqual(getPrefixMeanings('s/834'), ['that/which'], 's = that/which');
assertDeepEqual(getPrefixMeanings('c/d/8064'), ['and', 'the'], 'Double prefix');
assertDeepEqual(getPrefixMeanings('430'), [], 'No prefix');


// ══════════════════════════════════════════════════════════════════
// Test: Gloss with real Strong's dictionary
// ══════════════════════════════════════════════════════════════════

const strongsDictPath = path.join(__dirname, '..', 'strongs-hebrew-dictionary.js');
if (fs.existsSync(strongsDictPath)) {
  console.log('\n── Real Strong\'s dictionary ──');

  const dictCode = fs.readFileSync(strongsDictPath, 'utf8');
  eval(dictCode);

  const gen11Lemmas = [
    { lemma: 'b/7225', expected: /beginning/i },
    { lemma: '1254 a', expected: /choose|create/i },
    { lemma: '430', expected: /angels|God/i },
    { lemma: '853', expected: /./ },
    { lemma: 'd/8064', expected: /air|heaven/i },
    { lemma: 'd/776', expected: /common|country|earth/i },
  ];

  for (const { lemma, expected } of gen11Lemmas) {
    const gloss = getWordGloss(lemma, 'H', strongsHebrewDictionary);
    assert(expected.test(gloss), `Gloss for "${lemma}": "${gloss}" matches ${expected}`);
  }

  // Test that "+" lemmas resolve
  const bethlehem = getWordGloss('1035+', 'H', strongsHebrewDictionary);
  assert(bethlehem.length > 0, `1035+ resolves to: "${bethlehem}"`);

  let total = 0, withGloss = 0;
  for (const key of Object.keys(strongsHebrewDictionary)) {
    total++;
    if (extractGloss(strongsHebrewDictionary[key])) withGloss++;
  }
  const pct = ((withGloss / total) * 100).toFixed(1);
  console.log(`  ${withGloss}/${total} entries have extractable glosses (${pct}%)`);
  assert(withGloss / total > 0.95, `>95% coverage (got ${pct}%)`);
}


// ══════════════════════════════════════════════════════════════════
// Test: Validate morphhb.json build output
// ══════════════════════════════════════════════════════════════════

const morphhbPath = path.join(__dirname, '..', 'data', 'morphhb.json');
if (fs.existsSync(morphhbPath)) {
  console.log('\n── Validate morphhb.json ──');

  const data = JSON.parse(fs.readFileSync(morphhbPath, 'utf8'));

  // 39 OT books
  const expectedBooks = [
    'Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy',
    'Joshua', 'Judges', 'Ruth', '1 Samuel', '2 Samuel', '1 Kings', '2 Kings',
    '1 Chronicles', '2 Chronicles', 'Ezra', 'Nehemiah', 'Esther',
    'Job', 'Psalms', 'Proverbs', 'Ecclesiastes', 'Song of Solomon',
    'Isaiah', 'Jeremiah', 'Lamentations', 'Ezekiel', 'Daniel',
    'Hosea', 'Joel', 'Amos', 'Obadiah', 'Jonah', 'Micah',
    'Nahum', 'Habakkuk', 'Zephaniah', 'Haggai', 'Zechariah', 'Malachi'
  ];

  assertEqual(Object.keys(data).length, 39, '39 books');
  for (const book of expectedBooks) {
    assert(data[book] !== undefined, `Has ${book}`);
  }

  // Spot-check Genesis 1:1
  const gen11 = data['Genesis']?.[1]?.[1];
  assert(gen11 && Array.isArray(gen11), 'Gen 1:1 is array');
  assertEqual(gen11.length, 7, 'Gen 1:1 has 7 words');
  if (gen11?.[0]) {
    const [word, lemma, morph] = gen11[0];
    assertEqual(lemma, 'b/7225', 'Gen 1:1 word 1 lemma');
    assertEqual(morph, 'HR/Ncfsa', 'Gen 1:1 word 1 morph');
    assert(!/[\u0591-\u05AF]/.test(word), 'Cantillation stripped');
    assert(/[\u05B0-\u05C7]/.test(word), 'Vowels preserved');
  }

  // Validate all word structure
  let wordCount = 0, malformed = 0;
  for (const book of Object.keys(data)) {
    for (let c = 1; c < data[book].length; c++) {
      if (!data[book][c]) continue;
      for (let v = 1; v < data[book][c].length; v++) {
        if (!data[book][c][v]) continue;
        for (const word of data[book][c][v]) {
          wordCount++;
          if (!Array.isArray(word) || word.length !== 3 ||
              typeof word[0] !== 'string' || typeof word[1] !== 'string' || typeof word[2] !== 'string') {
            malformed++;
          }
        }
      }
    }
  }
  assert(wordCount > 300000, `>300k words (got ${wordCount.toLocaleString()})`);
  assertEqual(malformed, 0, `No malformed words`);

  // Psalms >= 150 chapters
  assert(data['Psalms'].length - 1 >= 150, `Psalms >= 150 chapters`);

  // Daniel has Aramaic
  const dan24 = data['Daniel']?.[2]?.[4];
  if (dan24) {
    assert(dan24.some(w => w[2].startsWith('A')), 'Daniel 2:4 has Aramaic');
  }

  // Versification: Gen 31:55 exists (remapped from WLC 32:1)
  assert(data['Genesis']?.[31]?.[55], 'Gen 31:55 exists (remapped)');

  // Decode all unique morph codes — verify none crash
  console.log('\n── Decode all morph codes ──');
  const allMorphs = new Set();
  let decodeErrors = 0;
  for (const book of Object.keys(data)) {
    for (let c = 1; c < data[book].length; c++) {
      if (!data[book][c]) continue;
      for (let v = 1; v < data[book][c].length; v++) {
        if (!data[book][c][v]) continue;
        for (const [, , morph] of data[book][c][v]) {
          allMorphs.add(morph);
        }
      }
    }
  }

  for (const morph of allMorphs) {
    try {
      const result = decodeMorphology(morph);
      if (!result || !result.parts || result.parts.length === 0) {
        decodeErrors++;
        if (decodeErrors <= 3) console.error(`  Decode returned empty for: ${morph}`);
      }
    } catch (e) {
      decodeErrors++;
      if (decodeErrors <= 3) console.error(`  Decode threw for: ${morph}: ${e.message}`);
    }
  }
  console.log(`  ${allMorphs.size} unique codes, ${decodeErrors} errors`);
  assertEqual(decodeErrors, 0, 'All morph codes decode without error');

  // Verify qere/ketiv: Ruth 1:8 has qere form יַעַשׂ (jussive) not ketiv יעשה (imperfect)
  const ruth18 = data['Ruth']?.[1]?.[8];
  if (ruth18) {
    // The qere reading should have vowel points (pointed text)
    const hasVoweled = ruth18.some(w => /[\u05B0-\u05C7]/.test(w[0]));
    assert(hasVoweled, 'Ruth 1:8 has voweled (qere) forms');
    // Ketiv forms are unpointed — should NOT be present
    const hasUnpointed = ruth18.some(w => {
      const consonantsOnly = w[0].replace(/[\u0591-\u05C7\/]/g, '');
      return consonantsOnly.length > 1 && !/[\u05B0-\u05C7]/.test(w[0]);
    });
    assert(!hasUnpointed, 'Ruth 1:8 has no unpointed (ketiv) forms');
  }

  // Verify no XML/HTML entities leaked
  let entityLeaks = 0;
  for (const book of Object.keys(data)) {
    for (let c = 1; c < data[book].length; c++) {
      if (!data[book][c]) continue;
      for (let v = 1; v < data[book][c].length; v++) {
        if (!data[book][c][v]) continue;
        for (const [word] of data[book][c][v]) {
          if (word.includes('&') || word.includes('<') || word.includes('>')) {
            entityLeaks++;
            if (entityLeaks <= 3) console.error(`  Entity leak: "${word}" in ${book} ${c}:${v}`);
          }
        }
      }
    }
  }
  assertEqual(entityLeaks, 0, 'No XML entities in word text');

  console.log(`  Words validated: ${wordCount.toLocaleString()}`);

} else {
  console.log('\n── Skipping morphhb.json validation (not built yet) ──');
}


// ══════════════════════════════════════════════════════════════════
// Results
// ══════════════════════════════════════════════════════════════════

console.log(`\n${'═'.repeat(50)}`);
if (failed === 0) {
  console.log(`All ${passed} tests passed.`);
} else {
  console.log(`${passed} passed, ${failed} FAILED.`);
  process.exit(1);
}
