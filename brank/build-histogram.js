#!/usr/bin/env node
/**
 * BibleRank Phase 0 — Step 1: Word Histogram & Filtered Word List
 * 
 * Parses MorphHB (OT) and NT interlinear data to produce:
 *   1. Every content word in the Bible with its position, root, and Strong's number
 *   2. A frequency histogram of consonantal roots
 *   3. A filtered word list (excluding high-frequency grammatical words)
 *      with dual indexing: reduced index (position in filtered list) 
 *      and absolute index (position in full text)
 * 
 * Usage: node brank/build-histogram.js
 */

const fs = require('fs');
const path = require('path');

// ── Hebrew text processing ──────────────────────────────────────────

/** Strip all vowel points and diacritics, leaving only consonants */
function stripToConsonants(text) {
  if (!text) return '';
  // Remove U+0591–U+05BD, U+05BF–U+05C7 (all marks), keep consonants U+05D0–U+05EA
  // Also remove the "/" morpheme delimiter
  return text.replace(/[\u0591-\u05BD\u05BF-\u05C7\/]/g, '');
}

/** Extract Strong's number(s) from a MorphHB lemma like "b/7225" or "1254 a" */
function parseStrongsFromLemma(lemma, lang) {
  if (!lemma) return [];
  const prefix = lang === 'H' ? 'H' : 'G';
  const results = [];
  // Split on "/" for prefix decomposition
  const parts = lemma.split('/');
  for (const part of parts) {
    // Skip single-letter prefix markers (b, c, d, k, l, m, s)
    if (/^[a-z]$/.test(part)) continue;
    // Extract numeric part, ignore trailing letters like "a" in "1254 a"
    const match = part.match(/(\d+)/);
    if (match) {
      results.push(prefix + match[1]);
    }
  }
  return results;
}

// ── Book order for absolute positioning ─────────────────────────────

const OT_BOOKS = [
  'Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy',
  'Joshua', 'Judges', 'Ruth', '1 Samuel', '2 Samuel',
  '1 Kings', '2 Kings', '1 Chronicles', '2 Chronicles',
  'Ezra', 'Nehemiah', 'Esther', 'Job', 'Psalms', 'Proverbs',
  'Ecclesiastes', 'Song of Solomon', 'Isaiah', 'Jeremiah',
  'Lamentations', 'Ezekiel', 'Daniel', 'Hosea', 'Joel', 'Amos',
  'Obadiah', 'Jonah', 'Micah', 'Nahum', 'Habakkuk', 'Zephaniah',
  'Haggai', 'Zechariah', 'Malachi'
];

const NT_BOOKS = [
  'Matthew', 'Mark', 'Luke', 'John', 'Acts',
  'Romans', '1 Corinthians', '2 Corinthians', 'Galatians',
  'Ephesians', 'Philippians', 'Colossians',
  '1 Thessalonians', '2 Thessalonians',
  '1 Timothy', '2 Timothy', 'Titus', 'Philemon',
  'Hebrews', 'James', '1 Peter', '2 Peter',
  '1 John', '2 John', '3 John', 'Jude', 'Revelation'
];

// ── Parse MorphHB (Old Testament) ───────────────────────────────────

function parseOT(morphhb) {
  const words = [];
  
  for (const book of OT_BOOKS) {
    const bookData = morphhb[book];
    if (!bookData) {
      console.warn(`  Warning: ${book} not found in MorphHB`);
      continue;
    }
    
    for (let ch = 1; ch < bookData.length; ch++) {
      const chapter = bookData[ch];
      if (!chapter) continue;
      
      for (let vs = 1; vs < chapter.length; vs++) {
        const verse = chapter[vs];
        if (!verse) continue;
        
        for (let wi = 0; wi < verse.length; wi++) {
          const [hebrewText, lemma, morph] = verse[wi];
          const consonants = stripToConsonants(hebrewText);
          const strongs = parseStrongsFromLemma(lemma, 'H');
          
          words.push({
            abs: words.length,       // absolute index
            book, ch, vs, wi,        // position
            ref: `${book} ${ch}:${vs}`,
            text: hebrewText,
            consonants,              // vowel-stripped form
            strongs,                 // array of Strong's numbers
            root: consonants,        // the consonantal root (our matching key)
            lang: 'H',
            morph
          });
        }
      }
    }
  }
  
  return words;
}

// ── Parse NT Interlinear ────────────────────────────────────────────

function parseNT(ntData) {
  const words = [];
  
  // NT data is keyed by "Book Chapter:Verse"
  // We need to process in canonical order
  const verseKeys = Object.keys(ntData);
  
  // Sort by book order, then chapter, then verse
  const bookOrder = {};
  NT_BOOKS.forEach((b, i) => bookOrder[b] = i);
  
  verseKeys.sort((a, b) => {
    const [aBook, aCV] = splitVerseRef(a);
    const [bBook, bCV] = splitVerseRef(b);
    const aOrder = bookOrder[aBook] ?? 999;
    const bOrder = bookOrder[bBook] ?? 999;
    if (aOrder !== bOrder) return aOrder - bOrder;
    if (aCV[0] !== bCV[0]) return aCV[0] - bCV[0];
    return aCV[1] - bCV[1];
  });
  
  for (const key of verseKeys) {
    const entry = ntData[key];
    if (!entry || !entry.g) continue;
    
    const [book, [ch, vs]] = splitVerseRef(key);
    
    for (let wi = 0; wi < entry.g.length; wi++) {
      const gWord = entry.g[wi];
      const lemma = gWord.l || '';
      // Get Strong's from English side if available
      let strongs = [];
      if (entry.e && entry.e[wi] && entry.e[wi].s) {
        strongs = [entry.e[wi].s];
      }
      
      // For Greek, the "consonantal root" equivalent is just the lemma (base form)
      const root = lemma.toLowerCase();
      
      words.push({
        abs: words.length,       // will be re-numbered after combining with OT
        book, ch, vs, wi,
        ref: key,
        text: gWord.g,
        consonants: root,        // Greek lemma as the matching key
        strongs,
        root,
        lang: 'G',
        morph: ''
      });
    }
  }
  
  return words;
}

/** Split "Matthew 24:6" into ["Matthew", [24, 6]] */
function splitVerseRef(ref) {
  const match = ref.match(/^(.+?)\s+(\d+):(\d+)$/);
  if (!match) return [ref, [0, 0]];
  return [match[1], [parseInt(match[2]), parseInt(match[3])]];
}

// ── Build Histogram ─────────────────────────────────────────────────

function buildHistogram(allWords) {
  const rootFreq = {};    // consonantal root → count
  const strongsFreq = {}; // Strong's number → count
  
  for (const w of allWords) {
    // Count by consonantal root
    if (w.root) {
      rootFreq[w.root] = (rootFreq[w.root] || 0) + 1;
    }
    // Count by Strong's number
    for (const s of w.strongs) {
      strongsFreq[s] = (strongsFreq[s] || 0) + 1;
    }
  }
  
  return { rootFreq, strongsFreq };
}

// ── Main ────────────────────────────────────────────────────────────

function main() {
  console.log('BibleRank Phase 0 — Building Word Histogram');
  console.log('═'.repeat(50));
  
  // Load data
  console.log('\nLoading MorphHB (OT)...');
  const morphhb = JSON.parse(fs.readFileSync(
    path.join(__dirname, '..', 'data', 'morphhb.json'), 'utf8'));
  
  console.log('Loading NT Interlinear...');
  const ntData = JSON.parse(fs.readFileSync(
    path.join(__dirname, '..', 'data', 'nt-interlinear.json'), 'utf8'));
  
  // Parse all words
  console.log('\nParsing OT words...');
  const otWords = parseOT(morphhb);
  console.log(`  OT words: ${otWords.length.toLocaleString()}`);
  
  console.log('Parsing NT words...');
  const ntWords = parseNT(ntData);
  console.log(`  NT words: ${ntWords.length.toLocaleString()}`);
  
  // Combine and assign absolute indices
  const allWords = [...otWords];
  for (const w of ntWords) {
    w.abs = allWords.length;
    allWords.push(w);
  }
  console.log(`  Total words: ${allWords.length.toLocaleString()}`);
  
  // Build histogram
  console.log('\nBuilding frequency histogram...');
  const { rootFreq, strongsFreq } = buildHistogram(allWords);
  
  const rootEntries = Object.entries(rootFreq).sort((a, b) => b[1] - a[1]);
  const strongsEntries = Object.entries(strongsFreq).sort((a, b) => b[1] - a[1]);
  
  console.log(`  Unique consonantal roots: ${rootEntries.length.toLocaleString()}`);
  console.log(`  Unique Strong's numbers: ${strongsEntries.length.toLocaleString()}`);
  
  // ── Frequency distribution analysis ──
  console.log('\n' + '═'.repeat(50));
  console.log('CONSONANTAL ROOT FREQUENCY DISTRIBUTION');
  console.log('═'.repeat(50));
  
  const bands = [
    { label: 'Band A (hapax, 1 occurrence)', min: 1, max: 1 },
    { label: 'Band B (2-10 occurrences) ★ HIGHEST SIGNAL', min: 2, max: 10 },
    { label: 'Band C (11-100 occurrences)', min: 11, max: 100 },
    { label: 'Band D (101-500 occurrences)', min: 101, max: 500 },
    { label: 'Band E (501+ occurrences) — NOISE', min: 501, max: Infinity },
  ];
  
  for (const band of bands) {
    const roots = rootEntries.filter(([_, c]) => c >= band.min && c <= band.max);
    const totalWords = roots.reduce((sum, [_, c]) => sum + c, 0);
    console.log(`\n  ${band.label}`);
    console.log(`    Roots: ${roots.length.toLocaleString()}`);
    console.log(`    Total word occurrences: ${totalWords.toLocaleString()}`);
    if (band.max <= 10) {
      // Show sample
      console.log(`    Sample: ${roots.slice(0, 8).map(([r, c]) => `${r}(${c})`).join(', ')}`);
    }
  }
  
  // Top 50 most frequent roots
  console.log('\n' + '═'.repeat(50));
  console.log('TOP 50 MOST FREQUENT ROOTS (candidates for exclusion)');
  console.log('═'.repeat(50));
  for (let i = 0; i < Math.min(50, rootEntries.length); i++) {
    const [root, count] = rootEntries[i];
    // Find a Strong's number for this root for identification
    const sampleWord = allWords.find(w => w.root === root && w.strongs.length > 0);
    const strongsLabel = sampleWord ? sampleWord.strongs[0] : '?';
    console.log(`  ${String(i + 1).padStart(3)}. ${root.padEnd(15)} ${String(count).padStart(6)} occurrences  (${strongsLabel})`);
  }
  
  // Top 50 Strong's numbers
  console.log('\n' + '═'.repeat(50));
  console.log('TOP 50 MOST FREQUENT STRONG\'S NUMBERS');
  console.log('═'.repeat(50));
  for (let i = 0; i < Math.min(50, strongsEntries.length); i++) {
    const [strongs, count] = strongsEntries[i];
    console.log(`  ${String(i + 1).padStart(3)}. ${strongs.padEnd(10)} ${String(count).padStart(6)} occurrences`);
  }
  
  // ── Band E detail (what would be filtered) ──
  console.log('\n' + '═'.repeat(50));
  console.log('BAND E DETAIL — roots with 501+ occurrences');
  console.log('(These would be filtered from the matrix)');
  console.log('═'.repeat(50));
  const bandE = rootEntries.filter(([_, c]) => c >= 501);
  for (const [root, count] of bandE) {
    const sampleWord = allWords.find(w => w.root === root && w.strongs.length > 0);
    const strongsLabel = sampleWord ? sampleWord.strongs[0] : '?';
    console.log(`  ${root.padEnd(15)} ${String(count).padStart(6)}  (${strongsLabel})`);
  }
  
  // ── Save outputs ──
  console.log('\n' + '═'.repeat(50));
  console.log('SAVING OUTPUTS');
  console.log('═'.repeat(50));
  
  // Save root frequency table
  const rootFreqOutput = Object.fromEntries(rootEntries);
  fs.writeFileSync(
    path.join(__dirname, 'root-frequency.json'),
    JSON.stringify(rootFreqOutput, null, 2)
  );
  console.log('  → brank/root-frequency.json');
  
  // Save Strong's frequency table
  const strongsFreqOutput = Object.fromEntries(strongsEntries);
  fs.writeFileSync(
    path.join(__dirname, 'strongs-frequency.json'),
    JSON.stringify(strongsFreqOutput, null, 2)
  );
  console.log('  → brank/strongs-frequency.json');
  
  // Save the full word list (compact format)
  // Each word: [absoluteIndex, "book ch:vs", wordIndex, "root", ["H1234"], "lang"]
  const wordListCompact = allWords.map(w => [
    w.abs, w.ref, w.wi, w.root, w.strongs, w.lang
  ]);
  fs.writeFileSync(
    path.join(__dirname, 'word-list.json'),
    JSON.stringify(wordListCompact)
  );
  console.log(`  → brank/word-list.json (${allWords.length.toLocaleString()} words)`);
  
  // Summary stats
  const bandEWords = bandE.reduce((sum, [_, c]) => sum + c, 0);
  const contentWords = allWords.length - bandEWords;
  console.log(`\n  Total words: ${allWords.length.toLocaleString()}`);
  console.log(`  Band E (filtered): ${bandEWords.toLocaleString()} words`);
  console.log(`  Content words (matrix): ${contentWords.toLocaleString()} words`);
  console.log(`  Reduction: ${((bandEWords / allWords.length) * 100).toFixed(1)}% filtered`);
  
  console.log('\nDone. Review the frequency distribution above to set thresholds.');
}

main();
