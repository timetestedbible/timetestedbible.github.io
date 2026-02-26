#!/usr/bin/env node
/**
 * TTT Translation Pipeline
 *
 * Translates Hebrew Bible chapters from MorphHB source data using Claude.
 *
 * Usage:
 *   node scripts/ttt-translate.js Genesis 1
 *   node scripts/ttt-translate.js Genesis 1-3
 *   node scripts/ttt-translate.js --dry-run Genesis 1
 *
 * Environment:
 *   ANTHROPIC_API_KEY — from .env file or environment
 *   MODEL — optional, defaults to claude-opus-4-6
 */

const fs = require('fs');
const path = require('path');

// Load .env file
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let val = trimmed.slice(eqIdx + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'")))
      val = val.slice(1, -1);
    if (!process.env[key]) process.env[key] = val;
  }
}

const ROOT = path.join(__dirname, '..');
const morphhbData = require(path.join(ROOT, 'data', 'morphhb.json'));

// Load Strong's Hebrew dictionary
let strongsHebrew = {};
{
  const strongsSrc = fs.readFileSync(path.join(ROOT, 'strongs-hebrew-dictionary.js'), 'utf8');
  // Execute the file in a sandbox that captures the var
  const vm = require('vm');
  const ctx = { window: {} };
  vm.createContext(ctx);
  vm.runInContext(strongsSrc, ctx);
  strongsHebrew = ctx.strongsHebrewDictionary || ctx.window.strongsHebrewDictionary || {};
}

// Load word study dictionary
const wsSrc = fs.readFileSync(path.join(ROOT, 'word-study-dictionary.js'), 'utf8');
const wsMatch = wsSrc.match(/const WORD_STUDY_DICTIONARY = (\{[\s\S]*?\n\};)/);
let wordStudies = {};
if (wsMatch) {
  try { wordStudies = eval('(' + wsMatch[1].replace(/\};$/, '}') + ')'); } catch {}
}

// Load symbol dictionary
const sdSrc = fs.readFileSync(path.join(ROOT, 'symbol-dictionary.js'), 'utf8');
const sdMatch = sdSrc.match(/const SYMBOL_DICTIONARY = (\{[\s\S]*?\n\};)/);
let symbolDict = {};
if (sdMatch) {
  try { symbolDict = eval('(' + sdMatch[1].replace(/\};$/, '}') + ')'); } catch {}
}

// Load system prompt
const systemPrompt = fs.readFileSync(path.join(__dirname, 'ttt-system-prompt.md'), 'utf8');

// Strip all diacritics — leaves only consonants
function stripAllDiacritics(text) {
  if (!text) return '';
  return text.replace(/[\u0591-\u05BD\u05BF-\u05C7]/g, '');
}

function normalizeStrongsNum(lemma) {
  const cleaned = lemma.replace(/[^0-9]/g, '');
  return cleaned ? 'H' + cleaned : null;
}

// Build consonantal root index: consonants -> [H####, ...]
let consonantalIndex = null;
function buildConsonantalIndex() {
  if (consonantalIndex) return;
  consonantalIndex = {};
  for (const [key, entry] of Object.entries(strongsHebrew)) {
    if (!key.startsWith('H') || !entry.lemma) continue;
    const consonants = stripAllDiacritics(entry.lemma);
    if (consonants.length < 2) continue;
    if (!consonantalIndex[consonants]) consonantalIndex[consonants] = [];
    consonantalIndex[consonants].push(key);
  }
}

// Get all Strong's entries sharing the same consonants
function getConsonantalSiblings(consonants) {
  buildConsonantalIndex();
  const siblings = consonantalIndex[consonants] || [];
  return siblings.map(sn => {
    const e = strongsHebrew[sn];
    return {
      id: sn,
      def: e.strongs_def || '',
      kjv: e.kjv_def || '',
      derivation: e.derivation || ''
    };
  });
}

function buildChapterPrompt(book, chapter) {
  const bookData = morphhbData[book];
  if (!bookData || !bookData[chapter]) {
    throw new Error(`No morphHB data for ${book} ${chapter}`);
  }
  const chapterData = bookData[chapter];

  // Load KJV for reference (given AFTER verse data, labeled as reference only)
  const kjvPath = path.join(ROOT, 'bibles', 'kjv_strongs.txt');
  const kjvText = fs.readFileSync(kjvPath, 'utf8');
  const kjvVerses = {};
  const prefix = `${book} ${chapter}:`;
  for (const line of kjvText.split('\n')) {
    if (line.startsWith(prefix)) {
      const tabIdx = line.indexOf('\t');
      if (tabIdx === -1) continue;
      const ref = line.slice(0, tabIdx);
      const verseNum = parseInt(ref.split(':')[1]);
      const text = line.slice(tabIdx + 1).replace(/\{\(?[HG]\d+\)?\}/g, '').trim();
      kjvVerses[verseNum] = text;
    }
  }

  // Build verse data with consonantal text and all possible word identifications
  const verses = [];
  for (let v = 1; v < chapterData.length; v++) {
    if (!chapterData[v]) continue;
    const words = chapterData[v].map(([hebrew, lemma, morph]) => {
      // Strip vowels — send consonants only
      const parts = hebrew.split('/');
      const consonantParts = parts.map(p => stripAllDiacritics(p));
      const consonants = consonantParts.join('/');
      const fullConsonants = stripAllDiacritics(hebrew.replace(/\//g, ''));

      // Get ALL possible word identifications for these consonants
      // For prefixed words, get siblings for each part
      const lemmaParts = lemma.split('/');
      const candidates = {};
      for (let i = 0; i < consonantParts.length; i++) {
        const cp = consonantParts[i];
        if (cp.length < 2) continue; // skip single-letter prefixes
        const sibs = getConsonantalSiblings(cp);
        if (sibs.length > 0) {
          candidates[cp] = sibs;
        }
      }
      // Also check the full (unprefixed) consonantal form
      if (consonantParts.length > 1) {
        const mainPart = consonantParts[consonantParts.length - 1];
        if (mainPart.length >= 2 && !candidates[mainPart]) {
          const sibs = getConsonantalSiblings(mainPart);
          if (sibs.length > 0) candidates[mainPart] = sibs;
        }
      }

      const word = {
        consonants,
        morph_hint: morph,
        candidates
      };

      // Include traditional Strong's assignment as a labeled hint
      const traditionalStrongs = lemmaParts.map(p => normalizeStrongsNum(p)).filter(Boolean);
      if (traditionalStrongs.length > 0) {
        word.traditional_id = traditionalStrongs;
      }

      return word;
    });

    verses.push({ verse: v, words });
  }

  const userPrompt = `Translate the following ancient Hebrew text. The text is given in consonants only (no vowel points). For each word, all known dictionary entries sharing those consonants are provided as candidates. A traditional parsing is included as a hint but may not be correct.

## Consonantal Text by Verse
${JSON.stringify(verses, null, 2)}

## Reference Translation (for comparison AFTER you translate — do NOT copy)
${Object.entries(kjvVerses).map(([v, text]) => `v${v}: ${text}`).join('\n')}

Return ONLY the JSON object as specified in your instructions. No markdown fencing, no commentary before or after.`;

  return userPrompt;
}

async function callClaude(systemPrompt, userPrompt, dryRun) {
  if (dryRun) {
    console.log('\n=== SYSTEM PROMPT ===');
    console.log(systemPrompt.slice(0, 500) + '...');
    console.log('\n=== USER PROMPT (first 2000 chars) ===');
    console.log(userPrompt.slice(0, 2000) + '...');
    console.log(`\n=== PROMPT SIZE: system=${systemPrompt.length} user=${userPrompt.length} chars ===`);
    return null;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('ERROR: ANTHROPIC_API_KEY not set in .env or environment');
    process.exit(1);
  }

  const model = process.env.MODEL || 'claude-opus-4-6';
  console.log(`Calling ${model}...`);

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model,
      max_tokens: 16384,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }]
    })
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`API error ${response.status}: ${err}`);
  }

  const data = await response.json();
  const text = data.content[0].text;

  const inputTokens = data.usage?.input_tokens || 0;
  const outputTokens = data.usage?.output_tokens || 0;
  console.log(`Tokens: ${inputTokens} in / ${outputTokens} out`);

  return text;
}

function parseResponse(text) {
  // Strip markdown fencing if present
  let cleaned = text.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\w*\n?/, '').replace(/\n?```$/, '');
  }
  return JSON.parse(cleaned);
}

function writeOutputs(result, book, chapter) {
  const outDir = path.join(ROOT, 'data', 'ttt-chapters');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  // Write chapter JSON
  const jsonPath = path.join(outDir, `${book}-${chapter}.json`);
  fs.writeFileSync(jsonPath, JSON.stringify(result, null, 2));
  console.log(`Wrote: ${jsonPath}`);

  // Write Bible text format (same as other .txt bibles)
  const txtPath = path.join(outDir, `${book}-${chapter}.txt`);
  const lines = [`TTT`, `Time Tested Translation — ${book} ${chapter}`];
  for (const verse of result.verses) {
    lines.push(`${book} ${chapter}:${verse.verse}\t${verse.strongs_text}`);
  }
  fs.writeFileSync(txtPath, lines.join('\n') + '\n');
  console.log(`Wrote: ${txtPath}`);

  // Write notes/meta file (includes work-shown reasoning + notes)
  const notesPath = path.join(outDir, `${book}-${chapter}-notes.json`);
  const notes = {
    book,
    chapter,
    generated: new Date().toISOString(),
    section_notes: result.section_notes || [],
    verse_notes: {},
    verse_work: {}
  };
  for (const verse of result.verses) {
    if (verse.notes && verse.notes.length > 0) {
      notes.verse_notes[`${book} ${chapter}:${verse.verse}`] = verse.notes;
    }
    if (verse.work && verse.work.length > 0) {
      notes.verse_work[`${book} ${chapter}:${verse.verse}`] = verse.work;
    }
  }
  fs.writeFileSync(notesPath, JSON.stringify(notes, null, 2));
  console.log(`Wrote: ${notesPath}`);
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const filtered = args.filter(a => a !== '--dry-run');

  if (filtered.length < 2) {
    console.log('Usage: node scripts/ttt-translate.js [--dry-run] <Book> <chapter|start-end>');
    console.log('Example: node scripts/ttt-translate.js Genesis 1');
    console.log('Example: node scripts/ttt-translate.js Genesis 1-3');
    process.exit(1);
  }

  const book = filtered[0];
  const chapterArg = filtered[1];

  let chapters;
  if (chapterArg.includes('-')) {
    const [start, end] = chapterArg.split('-').map(Number);
    chapters = [];
    for (let c = start; c <= end; c++) chapters.push(c);
  } else {
    chapters = [parseInt(chapterArg)];
  }

  for (const chapter of chapters) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Translating ${book} ${chapter}...`);
    console.log('='.repeat(60));

    const userPrompt = buildChapterPrompt(book, chapter);
    console.log(`Prompt size: ${(systemPrompt.length + userPrompt.length).toLocaleString()} chars`);

    const responseText = await callClaude(systemPrompt, userPrompt, dryRun);
    if (!responseText) continue;

    try {
      const result = parseResponse(responseText);
      writeOutputs(result, book, chapter);

      // Print readable output
      console.log(`\n--- ${book} ${chapter} (TTT) ---\n`);
      for (const verse of result.verses) {
        console.log(`${verse.verse}  ${verse.text}`);
        if (verse.work && verse.work.length > 0) {
          for (const w of verse.work) {
            console.log(`     ⚖ ${w}`);
          }
        }
        if (verse.notes && verse.notes.length > 0) {
          for (const note of verse.notes) {
            console.log(`     → ${note}`);
          }
        }
      }
      if (result.section_notes && result.section_notes.length > 0) {
        console.log('\nSection Notes:');
        for (const note of result.section_notes) {
          console.log(`  • ${note}`);
        }
      }
    } catch (e) {
      console.error('Failed to parse response:', e.message);
      const rawPath = path.join(ROOT, 'data', 'ttt-chapters', `${book}-${chapter}-raw.txt`);
      fs.mkdirSync(path.dirname(rawPath), { recursive: true });
      fs.writeFileSync(rawPath, responseText);
      console.log(`Raw response saved to: ${rawPath}`);
    }
  }
}

main().catch(e => {
  console.error('Fatal:', e.message);
  process.exit(1);
});
