#!/usr/bin/env node
/**
 * Hebrew Gospel of Luke — Translation Pipeline (Phase 1)
 *
 * Phase 1: Unbiased consonantal translation.
 *   - Strips niqqud (vowel points added by later editors)
 *   - Sends ONLY consonantal Hebrew + Strong's candidates to Claude
 *   - NO English reference, NO Greek text — avoids biasing the AI
 *   - Produces literal + amplified translations with work shown
 *
 * Phase 2 (separate step): Compare against Greek/English translations.
 *
 * Usage:
 *   node scripts/hg-translate-luke.js 1
 *   node scripts/hg-translate-luke.js 1-3
 *   node scripts/hg-translate-luke.js --dry-run 1
 *   node scripts/hg-translate-luke.js --force 1     # re-translate even if output exists
 *
 * Environment:
 *   ANTHROPIC_API_KEY — from .env file or environment
 *   MODEL — optional, defaults to claude-opus-4-6
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

// Load .env
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
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
const BATCH_SIZE = 10;

// ---------------------------------------------------------------------------
// Load Strong's dictionary
// ---------------------------------------------------------------------------

let strongsHebrew = {};
{
  const src = fs.readFileSync(path.join(ROOT, 'strongs-hebrew-dictionary.js'), 'utf8');
  const ctx = { window: {} };
  vm.createContext(ctx);
  vm.runInContext(src, ctx);
  strongsHebrew = ctx.strongsHebrewDictionary || ctx.window.strongsHebrewDictionary || {};
}

const systemPrompt = fs.readFileSync(path.join(__dirname, 'hg-luke-system-prompt.md'), 'utf8');

// ---------------------------------------------------------------------------
// Consonantal index
// ---------------------------------------------------------------------------

function stripNiqqud(text) {
  if (!text) return '';
  return text.replace(/[\u0591-\u05BD\u05BF-\u05C7]/g, '');
}

let consonantalIndex = null;
function buildConsonantalIndex() {
  if (consonantalIndex) return;
  consonantalIndex = {};
  for (const [key, entry] of Object.entries(strongsHebrew)) {
    if (!key.startsWith('H') || !entry.lemma) continue;
    const consonants = stripNiqqud(entry.lemma);
    if (consonants.length < 2) continue;
    if (!consonantalIndex[consonants]) consonantalIndex[consonants] = [];
    consonantalIndex[consonants].push(key);
  }
  console.log(`  Consonantal index: ${Object.keys(consonantalIndex).length} unique forms`);
}

function lookupConsonants(consonants) {
  buildConsonantalIndex();
  const ids = consonantalIndex[consonants] || [];
  return ids.slice(0, 6).map(sn => {
    const e = strongsHebrew[sn];
    return { id: sn, def: (e.strongs_def || '').slice(0, 100) };
  });
}

const PREFIXES = ['ו', 'ב', 'כ', 'ל', 'מ', 'ש', 'ה'];

function getCandidatesForWord(consonants) {
  const candidates = {};

  const full = lookupConsonants(consonants);
  if (full.length > 0) candidates[consonants] = full;

  for (const pfx of PREFIXES) {
    if (consonants.startsWith(pfx) && consonants.length > pfx.length + 1) {
      const stripped = consonants.slice(pfx.length);
      const hits = lookupConsonants(stripped);
      if (hits.length > 0 && !candidates[stripped]) candidates[stripped] = hits;
    }
  }

  if (consonants.length > 3) {
    for (const p1 of PREFIXES) {
      if (!consonants.startsWith(p1)) continue;
      for (const p2 of PREFIXES) {
        const prefix = p1 + p2;
        if (consonants.startsWith(prefix) && consonants.length > prefix.length + 1) {
          const stripped = consonants.slice(prefix.length);
          const hits = lookupConsonants(stripped);
          if (hits.length > 0 && !candidates[stripped]) candidates[stripped] = hits;
        }
      }
    }
  }

  return candidates;
}

// ---------------------------------------------------------------------------
// Prompt construction — consonants only, no reference texts
// ---------------------------------------------------------------------------

function buildPrompt(verseSlice) {
  // Use anonymous sequential numbering (1, 2, 3...) — no real verse/chapter IDs
  const verseData = verseSlice.map((v, idx) => {
    const consonantalText = stripNiqqud(v.hebrew);
    const words = consonantalText.split(/\s+/).filter(w => w.length > 0).map(w => {
      const cands = getCandidatesForWord(w);
      const entry = { consonants: w };
      if (Object.keys(cands).length > 0) entry.candidates = cands;
      return entry;
    });

    return { section: idx + 1, consonantal_hebrew: consonantalText, words };
  });

  return `Translate the following ancient Hebrew manuscript text. The text is given in consonants only — vowel points have been stripped because they were added by later editors and are not authoritative.

For each word, all known Strong's Hebrew dictionary entries sharing those consonants are provided as candidates.

You have NO English or Greek reference text. Work solely from the Hebrew consonants and the dictionary candidates.

## Sections to Translate

${JSON.stringify(verseData, null, 2)}

Return ONLY the JSON object as specified in your instructions. Use "section" numbers matching the input (1, 2, 3...) in place of "verse" in your output. No markdown fencing, no commentary before or after.`;
}

// ---------------------------------------------------------------------------
// API call with retry and timeout
// ---------------------------------------------------------------------------

async function callClaude(userPrompt, dryRun) {
  if (dryRun) {
    console.log('\n=== SYSTEM PROMPT (first 600 chars) ===');
    console.log(systemPrompt.slice(0, 600) + '...');
    console.log(`\n=== USER PROMPT (first 3000 chars) ===`);
    console.log(userPrompt.slice(0, 3000) + '...');
    console.log(`\n=== SIZES: system=${systemPrompt.length} user=${userPrompt.length} total=${systemPrompt.length + userPrompt.length} chars ===`);
    return null;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('ERROR: ANTHROPIC_API_KEY not set in .env or environment');
    process.exit(1);
  }

  const model = process.env.MODEL || 'claude-opus-4-6';
  const maxRetries = 3;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    console.log(`  Calling ${model}... (attempt ${attempt}/${maxRetries})`);

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30 * 60 * 1000);

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
        }),
        signal: controller.signal
      });

      clearTimeout(timeout);

      if (response.status >= 500) {
        const err = await response.text();
        console.error(`  Server error ${response.status}, retrying in 30s...`);
        if (attempt < maxRetries) { await new Promise(r => setTimeout(r, 30000)); continue; }
        throw new Error(`API error ${response.status}: ${err}`);
      }

      if (!response.ok) {
        const err = await response.text();
        throw new Error(`API error ${response.status}: ${err}`);
      }

      const data = await response.json();
      const text = data.content[0].text;
      const inTok = data.usage?.input_tokens || 0;
      const outTok = data.usage?.output_tokens || 0;
      console.log(`  Tokens: ${inTok.toLocaleString()} in / ${outTok.toLocaleString()} out`);
      return text;
    } catch (e) {
      if (e.name === 'AbortError') {
        console.error(`  Request timed out after 30 minutes`);
      } else {
        console.error(`  Error: ${e.message}`);
      }
      if (attempt < maxRetries) {
        console.log(`  Retrying in 30s...`);
        await new Promise(r => setTimeout(r, 30000));
      } else {
        throw e;
      }
    }
  }
}

function parseResponse(text) {
  let cleaned = text.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\w*\n?/, '').replace(/\n?```$/, '');
  }
  return JSON.parse(cleaned);
}

// ---------------------------------------------------------------------------
// Chapter processing
// ---------------------------------------------------------------------------

function getPendingVerses(chapter) {
  const chPath = path.join(ROOT, 'data', 'hg-chapters', `Luke-${chapter}.json`);
  if (!fs.existsSync(chPath)) return null;
  const data = JSON.parse(fs.readFileSync(chPath, 'utf8'));
  const pending = [];
  for (const v of (data.verses || [])) {
    const t = v.translation || v.amplified || v.literal || '';
    if (!t || t === '' || (v.notes?.translation_notes || []).some(n => n.includes('PENDING'))) {
      pending.push(v.verse);
    }
  }
  return pending;
}

async function translatePending(chapter, dryRun) {
  const pendingNums = getPendingVerses(chapter);
  if (!pendingNums || pendingNums.length === 0) {
    console.log(`  Luke ${chapter}: no pending verses`);
    return null;
  }

  const rawPath = path.join(ROOT, 'data', 'hg-raw', `Luke-${chapter}.json`);
  if (!fs.existsSync(rawPath)) { console.error(`No raw data: ${rawPath}`); return null; }
  const rawData = JSON.parse(fs.readFileSync(rawPath, 'utf8'));

  const pendingSet = new Set(pendingNums);
  const pendingRaw = rawData.verses.filter(v => pendingSet.has(v.verse));

  console.log(`\n${'='.repeat(60)}`);
  console.log(`Luke ${chapter}: ${pendingRaw.length} pending verses (of ${rawData.verses.length} total)`);
  console.log('='.repeat(60));

  const batches = [];
  for (let i = 0; i < pendingRaw.length; i += BATCH_SIZE) {
    batches.push(pendingRaw.slice(i, i + BATCH_SIZE));
  }

  const translatedVerses = [];
  for (let bi = 0; bi < batches.length; bi++) {
    const batch = batches[bi];
    console.log(`\n  Batch ${bi + 1}/${batches.length}: ${batch.length} verses`);
    const userPrompt = buildPrompt(batch);
    console.log(`  Prompt: ${(systemPrompt.length + userPrompt.length).toLocaleString()} chars`);
    if (bi > 0 && !dryRun) await new Promise(r => setTimeout(r, 5000));
    const responseText = await callClaude(userPrompt, dryRun);
    if (!responseText) continue;
    try {
      const result = parseResponse(responseText);
      const sections = result.sections || result.verses || [];
      const mapped = sections.map((s, idx) => {
        const realVerse = batch[idx]?.verse ?? s.section ?? s.verse;
        return { ...s, verse: realVerse, section: undefined };
      });
      translatedVerses.push(...mapped);
      console.log(`  Parsed ${mapped.length} verses`);
    } catch (e) {
      console.error(`  Parse error: ${e.message}`);
      const rawOut = path.join(ROOT, 'data', 'hg-chapters', `Luke-${chapter}-pending-raw.txt`);
      fs.writeFileSync(rawOut, responseText);
    }
  }

  if (translatedVerses.length === 0) return null;

  // Merge into existing chapter file
  const chPath = path.join(ROOT, 'data', 'hg-chapters', `Luke-${chapter}.json`);
  const existing = JSON.parse(fs.readFileSync(chPath, 'utf8'));
  const translatedMap = {};
  for (const v of translatedVerses) translatedMap[v.verse] = v;

  existing.verses = existing.verses.map(v => {
    if (translatedMap[v.verse]) return translatedMap[v.verse];
    return v;
  });

  fs.writeFileSync(chPath, JSON.stringify(existing, null, 2));
  console.log(`  Merged ${translatedVerses.length} translations into Luke-${chapter}.json`);
  return existing;
}

async function translateChapter(chapter, dryRun) {
  const rawPath = path.join(ROOT, 'data', 'hg-raw', `Luke-${chapter}.json`);
  if (!fs.existsSync(rawPath)) {
    console.error(`No raw data: ${rawPath}`);
    return null;
  }

  const rawData = JSON.parse(fs.readFileSync(rawPath, 'utf8'));
  const verses = rawData.verses;
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Luke ${chapter}: ${verses.length} verses`);
  console.log('='.repeat(60));

  const batches = [];
  for (let i = 0; i < verses.length; i += BATCH_SIZE) {
    batches.push(verses.slice(i, i + BATCH_SIZE));
  }
  console.log(`  ${batches.length} batch(es) of up to ${BATCH_SIZE} verses`);

  const allVerses = [];

  for (let bi = 0; bi < batches.length; bi++) {
    const batch = batches[bi];
    const firstV = batch[0].verse;
    const lastV = batch[batch.length - 1].verse;
    console.log(`\n  Batch ${bi + 1}/${batches.length}: verses ${firstV}-${lastV}`);

    const userPrompt = buildPrompt(batch);
    console.log(`  Prompt: ${(systemPrompt.length + userPrompt.length).toLocaleString()} chars`);

    // Brief pause between batches to avoid rate limits
    if (bi > 0 && !dryRun) await new Promise(r => setTimeout(r, 5000));

    const responseText = await callClaude(userPrompt, dryRun);
    if (!responseText) continue;

    try {
      const result = parseResponse(responseText);
      const sections = result.sections || result.verses || [];
      // Map anonymous section numbers back to real verse numbers
      const batchVerses = sections.map((s, idx) => {
        const realVerse = batch[idx]?.verse ?? s.section ?? s.verse;
        return { ...s, verse: realVerse, section: undefined };
      });
      allVerses.push(...batchVerses);
      console.log(`  Parsed ${batchVerses.length} verses`);
    } catch (e) {
      console.error(`  Failed to parse batch ${bi + 1}:`, e.message);
      const rawOut = path.join(ROOT, 'data', 'hg-chapters', `Luke-${chapter}-batch${bi + 1}-raw.txt`);
      fs.mkdirSync(path.dirname(rawOut), { recursive: true });
      fs.writeFileSync(rawOut, responseText);
      console.log(`  Raw response saved: ${rawOut}`);
    }
  }

  if (allVerses.length === 0) return null;

  const output = {
    book: 'Luke',
    chapter,
    source: 'Hebrew Gospel of Luke v2.1 (Van Rensburg 2026, Vat. Ebr. 100)',
    phase: 1,
    method: 'Consonantal analysis — niqqud stripped, no English/Greek reference provided',
    verses: allVerses
  };

  const outDir = path.join(ROOT, 'data', 'hg-chapters');
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, `Luke-${chapter}.json`);
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2));
  console.log(`\nWrote: ${outPath}`);

  // Print summary
  console.log(`\n--- Chapter ${chapter} (Phase 1: Consonantal) ---\n`);
  for (const v of allVerses.slice(0, 3)) {
    console.log(`${v.verse}  LITERAL:   ${(v.literal || '(missing)').slice(0, 120)}`);
    console.log(`    AMPLIFIED: ${(v.amplified || '(missing)').slice(0, 120)}`);
    if (v.ambiguities?.length) {
      for (const a of v.ambiguities.slice(0, 1)) {
        console.log(`    AMBIG: ${a.slice(0, 120)}`);
      }
    }
    console.log();
  }
  if (allVerses.length > 3) console.log(`  ... (${allVerses.length - 3} more verses)\n`);

  return output;
}

// Find pending (untranslated) verses in an existing chapter file
function findPendingVerses(chapter) {
  const chPath = path.join(ROOT, 'data', 'hg-chapters', `Luke-${chapter}.json`);
  if (!fs.existsSync(chPath)) return null;
  const data = JSON.parse(fs.readFileSync(chPath, 'utf8'));
  const pending = [];
  for (const v of (data.verses || [])) {
    const t = v.translation || v.amplified || v.literal || '';
    const isPending = !t || (v.notes?.translation_notes || []).some(n => n.includes('PENDING'));
    if (isPending) pending.push(v.verse);
  }
  return { pending, data };
}

// Translate only pending verses and merge back into existing chapter file
async function translatePendingForChapter(chapter, dryRun) {
  const info = findPendingVerses(chapter);
  if (!info || info.pending.length === 0) return 0;

  const rawPath = path.join(ROOT, 'data', 'hg-raw', `Luke-${chapter}.json`);
  if (!fs.existsSync(rawPath)) return 0;
  const rawData = JSON.parse(fs.readFileSync(rawPath, 'utf8'));

  const pendingSet = new Set(info.pending);
  const pendingRaw = rawData.verses.filter(v => pendingSet.has(v.verse));

  console.log(`\n  Luke ${chapter}: ${pendingRaw.length} pending verses`);

  const batches = [];
  for (let i = 0; i < pendingRaw.length; i += BATCH_SIZE) {
    batches.push(pendingRaw.slice(i, i + BATCH_SIZE));
  }

  const translated = [];
  for (let bi = 0; bi < batches.length; bi++) {
    const batch = batches[bi];
    console.log(`    Batch ${bi + 1}/${batches.length}: ${batch.length} verses`);
    const userPrompt = buildPrompt(batch);
    console.log(`    Prompt: ${(systemPrompt.length + userPrompt.length).toLocaleString()} chars`);
    if (bi > 0 && !dryRun) await new Promise(r => setTimeout(r, 5000));
    const responseText = await callClaude(userPrompt, dryRun);
    if (!responseText) continue;
    try {
      const result = parseResponse(responseText);
      const sections = result.sections || result.verses || [];
      for (let idx = 0; idx < sections.length; idx++) {
        const s = sections[idx];
        const realVerse = batch[idx]?.verse ?? s.section ?? s.verse;
        translated.push({ ...s, verse: realVerse, section: undefined });
      }
      console.log(`    Parsed ${sections.length} verses`);
    } catch (e) {
      console.error(`    Parse error: ${e.message}`);
    }
  }

  if (translated.length === 0 || dryRun) return translated.length;

  // Merge into existing chapter file
  const tMap = {};
  for (const v of translated) tMap[v.verse] = v;
  info.data.verses = info.data.verses.map(v => tMap[v.verse] || v);

  const chPath = path.join(ROOT, 'data', 'hg-chapters', `Luke-${chapter}.json`);
  fs.writeFileSync(chPath, JSON.stringify(info.data, null, 2));
  console.log(`    Merged ${translated.length} into Luke-${chapter}.json`);
  return translated.length;
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const force = args.includes('--force');
  const pending = args.includes('--pending');
  const filtered = args.filter(a => !a.startsWith('--'));

  if (filtered.length < 1) {
    console.log('Usage: node scripts/hg-translate-luke.js [--dry-run] [--force] [--pending] <chapter|start-end>');
    console.log('  --pending   Only translate verses marked as pending in existing chapter files');
    console.log('  --force     Re-translate entire chapters even if output exists');
    process.exit(1);
  }

  const chapterArg = filtered[0];
  let chapters;
  if (chapterArg.includes('-')) {
    const [start, end] = chapterArg.split('-').map(Number);
    chapters = [];
    for (let c = start; c <= end; c++) chapters.push(c);
  } else {
    chapters = [parseInt(chapterArg)];
  }

  console.log('Hebrew Gospel of Luke — Phase 1: Consonantal Translation');
  console.log(pending ? '  Mode: pending verses only' : '  Mode: full chapters');
  console.log('Loading Strong\'s Hebrew dictionary...');
  buildConsonantalIndex();

  let completed = 0, failed = 0, skipped = 0, totalNew = 0;
  for (let ci = 0; ci < chapters.length; ci++) {
    const ch = chapters[ci];
    if (ci > 0 && !dryRun) {
      console.log('\n  Pausing 10s...');
      await new Promise(r => setTimeout(r, 10000));
    }
    try {
      if (pending) {
        const n = await translatePendingForChapter(ch, dryRun);
        totalNew += n;
        if (n > 0) completed++;
      } else {
        const existingPath = path.join(ROOT, 'data', 'hg-chapters', `Luke-${ch}.json`);
        if (fs.existsSync(existingPath) && !force && !dryRun) {
          skipped++;
          continue;
        }
        const result = await translateChapter(ch, dryRun);
        if (result) completed++;
      }
    } catch (e) {
      console.error(`\nFailed on Luke ${ch}: ${e.message}`);
      failed++;
    }
  }

  console.log(`\nDone. Completed: ${completed}, Failed: ${failed}${pending ? `, New translations: ${totalNew}` : ''}`);
}

main().catch(e => {
  console.error('Fatal:', e.message);
  process.exit(1);
});
