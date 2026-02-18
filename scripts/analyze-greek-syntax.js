#!/usr/bin/env node
/**
 * Analyze HG Revelation Hebrew for Greek syntactic constructs.
 * Calls Anthropic API in parallel (one request per chapter, concurrency 5).
 * Outputs deviations-only JSON to data/greek-syntax-flags/Revelation-{N}.json.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const RAW_DIR = path.join(ROOT, 'data', 'hg-raw');
const INTERLINEAR_PATH = path.join(ROOT, 'data', 'hebrew-gospels-interlinear.json');
const OUT_DIR = path.join(ROOT, 'data', 'greek-syntax-flags');
const ENV_PATH = path.join(ROOT, '.env');

const MAX_CONCURRENCY = 5;
const MAX_RETRIES = 3;
const MODEL = 'claude-sonnet-4-20250514';

function loadApiKey() {
  const env = fs.readFileSync(ENV_PATH, 'utf8');
  const m = env.match(/ANTHROPIC_API_KEY=(\S+)/);
  if (!m) throw new Error('ANTHROPIC_API_KEY not found in .env');
  return m[1];
}

function loadChapterData(chapter, interlinear) {
  const rawPath = path.join(RAW_DIR, `Revelation-${chapter}.json`);
  const raw = JSON.parse(fs.readFileSync(rawPath, 'utf8'));
  const ilChapter = interlinear[chapter] || {};

  const verses = raw.verses.map(v => {
    const words = ilChapter[String(v.verse)] || [];
    const glossLine = words.map(([heb, strongs, gloss]) => `${heb} (${gloss})`).join(' | ');
    return {
      verse: v.verse,
      hebrew: v.hebrew,
      interlinear: glossLine
    };
  });
  return verses;
}

const SYSTEM_PROMPT = `You are a Hebrew linguist specializing in Biblical and Mishnaic Hebrew syntax. You are analyzing a Hebrew text that claims to be an original Hebrew behind the Greek book of Revelation. Your task is to identify constructions that suggest the Hebrew was TRANSLATED FROM or INFLUENCED BY Greek, rather than being native Hebrew composition.

For each verse provided, examine the raw vocalized Hebrew and the word-by-word interlinear glosses. Flag ONLY verses that show Greek syntactic influence. Skip clean verses entirely.

For each deviation found, provide:
- "verse": the verse number
- "flags": array of objects, each with:
  - "type": one of: "she_relative", "shel_genitive", "periphrastic", "greek_word_order", "excessive_parataxis", "participial_chain", "heavy_passive", "absent_wayyiqtol", "greek_calque", "greek_loanword", "other"
  - "severity": "strong" (clearly Greek-dependent), "moderate" (ambiguous), or "weak" (natural in later Hebrew)
  - "hebrew": the specific Hebrew word(s) flagged
  - "note": brief explanation (1-2 sentences) of why this is flagged and what a native Hebrew author would write instead

Be HONEST and CRITICAL. The goal is to find genuine Greek influence, not to defend the Hebrew-original thesis. At the same time, do not flag features that are simply natural Mishnaic/late Second Temple Hebrew (e.g., שֶׁ relative clauses are standard in Mishnaic Hebrew and not automatically evidence of Greek translation).

Respond with ONLY a JSON object (no markdown fencing):
{
  "deviations": [
    {
      "verse": 1,
      "flags": [
        { "type": "...", "severity": "...", "hebrew": "...", "note": "..." }
      ]
    }
  ]
}

If there are NO deviations in the chapter, respond: { "deviations": [] }`;

async function callClaude(apiKey, chapter, verses) {
  const userContent = `Analyze Revelation chapter ${chapter} for Greek syntactic influence.\n\n` +
    verses.map(v =>
      `--- Verse ${v.verse} ---\nHebrew: ${v.hebrew}\nInterlinear: ${v.interlinear}`
    ).join('\n\n');

  const body = {
    model: MODEL,
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userContent }]
  };

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(body)
    });

    if (res.status === 429) {
      const retryAfter = parseInt(res.headers.get('retry-after') || '5', 10);
      const wait = retryAfter * 1000 * (attempt + 1);
      console.log(`  Ch ${chapter}: rate limited, waiting ${wait / 1000}s...`);
      await new Promise(r => setTimeout(r, wait));
      continue;
    }

    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`API error ${res.status} for ch ${chapter}: ${errBody.slice(0, 200)}`);
    }

    const data = await res.json();
    const text = data.content?.[0]?.text || '';
    return text;
  }
  throw new Error(`Failed after ${MAX_RETRIES} retries for ch ${chapter}`);
}

function parseResponse(text, chapter) {
  let cleaned = text.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  }
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    console.error(`  Ch ${chapter}: JSON parse failed, saving raw response`);
    fs.writeFileSync(path.join(OUT_DIR, `Revelation-${chapter}-raw.txt`), text);
    return { deviations: [], _parseError: true };
  }
}

async function processChapter(apiKey, chapter, interlinear) {
  const verses = loadChapterData(chapter, interlinear);
  console.log(`  Ch ${chapter}: ${verses.length} verses, calling API...`);

  const responseText = await callClaude(apiKey, chapter, verses);
  const parsed = parseResponse(responseText, chapter);

  const output = {
    chapter,
    deviations: parsed.deviations || [],
    clean_verse_count: verses.length - (parsed.deviations || []).length,
    flagged_verse_count: (parsed.deviations || []).length,
    total_flags: (parsed.deviations || []).reduce((s, d) => s + (d.flags?.length || 0), 0)
  };

  const outPath = path.join(OUT_DIR, `Revelation-${chapter}.json`);
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2));
  console.log(`  Ch ${chapter}: ${output.flagged_verse_count} flagged verses, ${output.total_flags} flags → ${outPath}`);
  return output;
}

async function runWithConcurrency(tasks, limit) {
  const results = [];
  const executing = new Set();

  for (const task of tasks) {
    const p = task().then(r => { executing.delete(p); return r; });
    executing.add(p);
    results.push(p);
    if (executing.size >= limit) {
      await Promise.race(executing);
    }
  }
  return Promise.all(results);
}

async function main() {
  const apiKey = loadApiKey();
  console.log('Loading interlinear data...');
  const interlinear = JSON.parse(fs.readFileSync(INTERLINEAR_PATH, 'utf8')).Revelation;

  fs.mkdirSync(OUT_DIR, { recursive: true });

  console.log(`\nAnalyzing Revelation 1-22 (concurrency ${MAX_CONCURRENCY})...\n`);

  const tasks = [];
  for (let ch = 1; ch <= 22; ch++) {
    tasks.push(() => processChapter(apiKey, ch, interlinear));
  }

  const results = await runWithConcurrency(tasks, MAX_CONCURRENCY);

  console.log('\n=== Summary ===');
  let totalFlagged = 0, totalFlags = 0, totalVerses = 0;
  for (const r of results) {
    totalFlagged += r.flagged_verse_count;
    totalFlags += r.total_flags;
    totalVerses += r.clean_verse_count + r.flagged_verse_count;
  }
  console.log(`Total verses: ${totalVerses}`);
  console.log(`Flagged verses: ${totalFlagged} (${(100 * totalFlagged / totalVerses).toFixed(1)}%)`);
  console.log(`Total flags: ${totalFlags}`);
  console.log(`Clean verses: ${totalVerses - totalFlagged} (${(100 * (totalVerses - totalFlagged) / totalVerses).toFixed(1)}%)`);
  console.log('\nDone. Output in data/greek-syntax-flags/');
}

main().catch(e => { console.error(e); process.exit(1); });
