#!/usr/bin/env node
/**
 * Bulk Symbol Study Publisher
 * 
 * Reads pipeline Context Bags, aggregates co-occurring symbol context,
 * and dispatches to Anthropic API to generate published symbol studies.
 * Each API call gets a completely fresh context — no bleed between studies.
 * 
 * Usage:
 *   node pipeline/publish-studies.js                  # run all
 *   node pipeline/publish-studies.js --dry-run        # preview what would run
 *   node pipeline/publish-studies.js --only rock,wings # specific symbols only
 *   node pipeline/publish-studies.js --resume-from fire # skip until 'fire', then run rest
 */

require('dotenv').config();
const Anthropic = require('@anthropic-ai/sdk');
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

// ─── Configuration ───────────────────────────────────────────────────────────

const MODEL = 'claude-opus-4-6';
const MAX_TOKENS = 16384;
const CONCURRENCY = 5;
const STAGGER_MS = 500;
const SKIP_PENDING = ['the-way', 'four-winds'];
const REGENERATE = ['four-horsemen', 'mark'];

const ROOT = path.resolve(__dirname, '..');
const PIPELINE_DIR = path.join(ROOT, 'pipeline', 'symbols');
const SYMBOLS_DIR = path.join(ROOT, '_symbols');
const BACKUP_DIR = path.join(SYMBOLS_DIR, '_backup');

// ─── Parse CLI args ──────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const onlyIdx = args.indexOf('--only');
const ONLY = onlyIdx !== -1 ? args[onlyIdx + 1].split(',') : null;
const resumeIdx = args.indexOf('--resume-from');
const RESUME_FROM = resumeIdx !== -1 ? args[resumeIdx + 1] : null;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function readFile(filepath) {
  try {
    return fs.readFileSync(filepath, 'utf-8');
  } catch {
    return null;
  }
}

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};
  try {
    return yaml.load(match[1]) || {};
  } catch {
    return {};
  }
}

function getCoOccurring(fm) {
  const co = fm.co_occurring || [];
  return co.map(s => String(s).toLowerCase().replace(/[_ ]/g, '-'));
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ─── Load the exemplar and build system prompt ──────────────────────────────

const DOVE_EXEMPLAR = readFile(path.join(SYMBOLS_DIR, 'dove.md'));
const DOVE_PIPELINE = readFile(path.join(PIPELINE_DIR, 'dove.md'));

const SYSTEM_PROMPT = `You are a symbol study publisher. Your ONLY job is to convert compressed pipeline research notes into a published symbol study page.

## CRITICAL: Symbol Study vs Word Study

A **symbol study** asks: What does X REPRESENT in Scripture? (ROCK = Covenant)
A **word study** asks: What does this Hebrew/Greek word mean lexically? (H6697 = rock, cliff, boulder)

You are writing SYMBOL STUDIES. The symbolic meaning is what the thing STANDS FOR — not what the word literally means.

**Test:** Would a secular reader using only a dictionary arrive at this meaning? If YES → it's not the symbolic meaning.

## Voice and Posture

You are a research organizer, not an oracle.

Your job is to guide the reader through the evidence — highlighting parallels, connections, and patterns that may not be obvious — while letting them draw the ultimate conclusions.

- **Suggestive language, not declarative.** "This pattern suggests," "compare with," "the same word appears in" — NOT "this means," "this proves."
- **Strive for ONE unified symbolic meaning.** Multiple context-dependent meanings dilute the symbol. The methodology was designed to find the ONE meaning that works everywhere.
- **Maintain humility.** "The evidence converges on..." NOT "The meaning is..."
- **Let Scripture speak.** Quote it. Show connections. The study should feel like a guided tour of verses with annotations pointing out what to notice — not a commentary with verse footnotes.
- **Highlight the non-obvious.** Same Hebrew word in unexpected places, structural parallels across testaments, production chains. Don't waste space on what's obvious from a plain reading.

## CRITICAL: Using Co-occurring Symbol Data

You will receive the pipeline Context Bags for the PRIMARY symbol AND all its co-occurring symbols. These co-occurring symbols are NOT just footnotes — they are ESSENTIAL context that must shape your writing:

1. **Use their FULL symbolic meaning.** Each co-occurring symbol has a "meaning:" field in its frontmatter. Use that meaning — not a simplified gloss or dictionary definition. If SAND means "Multitudes / People at Covenant Boundary," write about sand as multitudes at the covenant boundary, NOT just "shifting ground."

2. **The OPPOSITE symbol is the defining contrast.** The primary symbol's "opposite:" field names the symbol that defines it by negation. Read that symbol's full pipeline data. The contrast between the primary symbol and its opposite should be woven throughout the study — not just mentioned once in the Connections section.

3. **Transformation chains between symbols matter.** If sand becomes living stones through covenant with Christ (the Rock), that transformation is a KEY insight for the Rock study. Look for these chains in the co-occurring data.

4. **Connections section must reflect the co-occurring symbol's actual meaning.** Each $symbol bullet in the Connections section should demonstrate understanding of what that symbol MEANS in the pipeline data, not just note that they co-occur.

## Output Format

You must output ONLY the complete markdown file content, starting with the YAML frontmatter. No extra commentary before or after.

### Frontmatter
\`\`\`yaml
---
layout: symbol-study
symbol_key: {key}
title: "{Name} — Symbol Study"
description: "{One engaging sentence about the symbolic meaning}"
strongs: [{from pipeline}]
words: [{from pipeline}]
---
\`\`\`

### Opening (reader knows the meaning within seconds)
\`\`\`markdown
# {Name}

**{Symbolic meaning in one sentence — refined from pipeline meaning field.}**

> *"{Defining verse from KJV, with the symbol word **bolded** and other symbol terms marked with $[key]}"* — {Ref}

---
\`\`\`

### Core Content
- Start with "## The Key Insight" — the single thing that makes this symbol click
- Summary block as bold-label paragraphs: **Symbolizes:**, **Opposite:**, **Defining verses:**, **The surprise:** (if there is one), **Connected:** $symbol, $symbol
- Then "## {Name} Across Scripture" with thematic \`###\` sections named by INSIGHT (e.g., "The Appointed Times *Are* the Shadow") — NOT by verse reference
- Let the research shape the structure — each symbol is different. Don't force a template.
- Weave Strong's numbers and Hebrew/Greek into the narrative where they illuminate
- Quote KJV Scripture liberally. Bold the symbol word in quotes. Use $[key] for other symbol terms inside quotes.

### Supporting Sections (use as appropriate)
- **Patterns** — numbered cross-cutting observations
- **Connections** — $symbol bullet list with one-sentence explanations
- **Occurrences by Sense** — grouped verse reference lists
- **Hebrew & Greek Reference** — table at the BOTTOM, not the top
- **For Further Study** — connected studies with why the reader should read them

## Markup Conventions

These are processed client-side and MUST be used correctly:

| Syntax | Purpose | Example |
|--------|---------|---------|
| $wings | Symbol ref (displays as uppercase) | The $rock is the covenant |
| $[name] | Symbol ref preserving case (for quotes) | "under his $[wings]" |
| H6738 | Strong's Hebrew number (auto-links) | H6738 *tsel* |
| G4639 | Strong's Greek number (auto-links) | G4639 *skia* |
| Ps 91:1 | Verse ref (must include chapter:verse) | See Isa 32:2 |

**Inside Scripture quotes:** Use $[key] to mark symbol terms without changing the display text.
**Strong's in prose:** Write H6738 *tsel* — the number auto-links, the transliteration is regular markdown italic.
**Verse abbreviations:** Gen, Exod, Lev, Num, Deut, Josh, Judg, Ruth, 1Sam, 2Sam, 1Ki, 2Ki, 1Chr, 2Chr, Ezra, Neh, Est, Job, Ps, Prov, Eccl, Song, Isa, Jer, Lam, Ezek, Dan, Hos, Joel, Amos, Obad, Jonah, Mic, Nah, Hab, Zeph, Hag, Zec, Mal, Mat, Mk, Lk, Jn, Acts, Rom, 1Co, 2Co, Gal, Eph, Phil, Col, 1Th, 2Th, 1Ti, 2Ti, Titus, Philem, Heb, Jas, 1Pe, 2Pe, 1Jn, 2Jn, 3Jn, Jude, Rev.

## Quality Checklist (verify before outputting)

- Symbolic meaning clear from title + one-liner + first section?
- Section headings insight-driven, not verse-driven?
- Hebrew/Greek reference table at BOTTOM, not top?
- Structure fits THIS symbol's research, not forced into a generic template?
- ONE unified meaning, not fragmented into context-dependent definitions?
- Tone suggestive, not lecturing?
- Enough Scripture quoted? Guided tour of verses, not commentary with footnotes?
- A reader who disagrees would still find the evidence fairly presented?
- All $symbol references use correct syntax?
- All Strong's numbers formatted as H#### or G#### (they auto-link)?
- All verse references include chapter:verse with colon?

## EXEMPLAR — Gold Standard

Below is the pipeline Context Bag and the published study for DOVE. This is the quality, structure, voice, and format you must match.

### DOVE — Pipeline Input:

${DOVE_PIPELINE}

### DOVE — Published Output:

${DOVE_EXEMPLAR}

---

Now produce a published study from the pipeline data provided in the user message. Output ONLY the markdown file content starting with \`---\` (the YAML frontmatter). No preamble, no explanation, no commentary after.`;

// ─── Build work queue ────────────────────────────────────────────────────────

function buildQueue() {
  const pipelineFiles = fs.readdirSync(PIPELINE_DIR)
    .filter(f => f.endsWith('.md'))
    .map(f => f.replace('.md', ''));

  const existingPublished = fs.readdirSync(SYMBOLS_DIR)
    .filter(f => f.endsWith('.md'))
    .map(f => f.replace('.md', ''));

  let queue = [];

  for (const key of pipelineFiles) {
    if (SKIP_PENDING.includes(key)) continue;

    const pipelineContent = readFile(path.join(PIPELINE_DIR, `${key}.md`));
    if (!pipelineContent || pipelineContent.includes('[PENDING')) continue;

    const isExisting = existingPublished.includes(key);
    const needsRegen = REGENERATE.includes(key);

    if (!isExisting || needsRegen) {
      queue.push({ key, isRegen: needsRegen && isExisting });
    }
  }

  queue.sort((a, b) => a.key.localeCompare(b.key));

  if (RESUME_FROM) {
    const idx = queue.findIndex(q => q.key === RESUME_FROM);
    if (idx > 0) queue = queue.slice(idx);
  }

  if (ONLY) {
    queue = queue.filter(q => ONLY.includes(q.key));
  }

  return queue;
}

// ─── Compose prompt for one symbol ──────────────────────────────────────────

function composeUserMessage(key) {
  const pipelinePath = path.join(PIPELINE_DIR, `${key}.md`);
  const pipelineContent = readFile(pipelinePath);
  if (!pipelineContent) return null;

  const fm = parseFrontmatter(pipelineContent);
  const coKeys = getCoOccurring(fm);

  // Also load the opposite symbol if it has a pipeline file and isn't already in co_occurring
  const oppositeRaw = fm.opposite ? String(fm.opposite).toLowerCase().replace(/[_ ]/g, '-') : null;
  const oppositeKey = oppositeRaw ? oppositeRaw.split('/')[0].split('(')[0].trim() : null;
  const allCoKeys = new Set(coKeys);
  if (oppositeKey) allCoKeys.add(oppositeKey);

  let msg = `# Publish the symbol study for: ${fm.name || key.toUpperCase()}\n\n`;
  msg += `## Pipeline Context Bag (PRIMARY — this is the research you are publishing)\n\n`;
  msg += `### ${key}.md\n\`\`\`\n${pipelineContent}\n\`\`\`\n\n`;

  // Load opposite symbol first with special flagging
  if (oppositeKey) {
    const oppPath = path.join(PIPELINE_DIR, `${oppositeKey}.md`);
    const oppContent = readFile(oppPath);
    if (oppContent) {
      const oppFm = parseFrontmatter(oppContent);
      msg += `## OPPOSITE Symbol: ${oppositeKey.toUpperCase()} (CRITICAL — this defines ${fm.name || key.toUpperCase()} by contrast)\n\n`;
      msg += `**The opposite symbol's meaning is: "${oppFm.meaning || 'see context bag'}"**\n\n`;
      msg += `You MUST understand this symbol's full meaning and weave the contrast throughout the study — not just mention it in passing. If there are transformation chains between the primary and opposite symbols, those are KEY insights.\n\n`;
      msg += `### ${oppositeKey}.md\n\`\`\`\n${oppContent}\n\`\`\`\n\n`;
    }
  }

  // Load remaining co-occurring symbols
  const remainingCoKeys = [...allCoKeys].filter(k => k !== oppositeKey);
  if (remainingCoKeys.length > 0) {
    msg += `## Co-occurring Symbol Context Bags (use their FULL symbolic meanings — not simplified glosses)\n\n`;
    msg += `Each symbol below has a "meaning:" field in its frontmatter. Use that meaning when writing about this symbol in your Connections section and throughout the study.\n\n`;
    for (const coKey of remainingCoKeys) {
      const coPath = path.join(PIPELINE_DIR, `${coKey}.md`);
      const coContent = readFile(coPath);
      if (coContent) {
        const coFm = parseFrontmatter(coContent);
        msg += `### ${coKey}.md (meaning: "${coFm.meaning || 'see context bag'}")\n\`\`\`\n${coContent}\n\`\`\`\n\n`;
      }
    }
  }

  msg += `\nNow produce the published study for **${fm.name || key.toUpperCase()}**. Output ONLY the markdown file, starting with the YAML frontmatter \`---\`.`;

  return msg;
}

// ─── Process one symbol ─────────────────────────────────────────────────────

async function processSymbol(client, key, isRegen, index, total) {
  const label = `[${index + 1}/${total}] ${key}`;

  const userMessage = composeUserMessage(key);
  if (!userMessage) {
    console.log(`${label} — SKIP (no pipeline content)`);
    return { key, status: 'skipped', reason: 'no pipeline content' };
  }

  if (DRY_RUN) {
    const tokenEst = Math.round((SYSTEM_PROMPT.length + userMessage.length) / 4);
    console.log(`${label} — DRY RUN (est. ~${tokenEst} input tokens)`);
    return { key, status: 'dry-run' };
  }

  // Backup existing file if it exists
  const outputPath = path.join(SYMBOLS_DIR, `${key}.md`);
  if (fs.existsSync(outputPath)) {
    ensureDir(BACKUP_DIR);
    const backupPath = path.join(BACKUP_DIR, `${key}.md`);
    fs.copyFileSync(outputPath, backupPath);
    console.log(`${label} — backed up existing study to _symbols/_backup/${key}.md`);
  }

  try {
    console.log(`${label} — sending to API...`);
    const startTime = Date.now();

    const response = await client.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
    });

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    const content = response.content[0].text;

    // Strip any preamble before the frontmatter
    let markdown = content;
    const fmStart = content.indexOf('---');
    if (fmStart > 0) {
      markdown = content.substring(fmStart);
    }

    fs.writeFileSync(outputPath, markdown);

    const inputTokens = response.usage?.input_tokens || 0;
    const outputTokens = response.usage?.output_tokens || 0;
    console.log(`${label} — DONE in ${elapsed}s (${inputTokens} in / ${outputTokens} out)`);

    return { key, status: 'success', inputTokens, outputTokens, elapsed: parseFloat(elapsed) };
  } catch (err) {
    console.error(`${label} — ERROR: ${err.message}`);
    return { key, status: 'error', error: err.message };
  }
}

// ─── Concurrent runner with pool of N ───────────────────────────────────────

async function runPool(client, queue) {
  const results = [];
  let nextIndex = 0;

  async function runNext() {
    while (nextIndex < queue.length) {
      const idx = nextIndex++;
      const { key, isRegen } = queue[idx];

      // Stagger initial dispatch
      if (idx < CONCURRENCY && idx > 0) {
        await sleep(STAGGER_MS);
      }

      const result = await processSymbol(client, key, isRegen, idx, queue.length);
      results.push(result);

      // Small delay between completions to be kind to rate limits
      await sleep(200);
    }
  }

  // Launch N workers
  const workers = [];
  for (let i = 0; i < CONCURRENCY; i++) {
    workers.push(runNext());
  }

  await Promise.all(workers);
  return results;
}

// ─── Main ───────────────────────────────────────────────────────────────────

async function main() {
  console.log('╔══════════════════════════════════════════╗');
  console.log('║    Symbol Study Bulk Publisher            ║');
  console.log('╚══════════════════════════════════════════╝');
  console.log(`Model: ${MODEL}`);
  console.log(`Concurrency: ${CONCURRENCY}`);
  console.log(`Dry run: ${DRY_RUN}`);
  console.log('');

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('ERROR: ANTHROPIC_API_KEY not found in .env');
    process.exit(1);
  }

  const client = new Anthropic();

  const queue = buildQueue();
  console.log(`Queue: ${queue.length} studies to process`);

  if (queue.length === 0) {
    console.log('Nothing to do.');
    return;
  }

  const regenCount = queue.filter(q => q.isRegen).length;
  const newCount = queue.length - regenCount;
  console.log(`  New: ${newCount} | Regenerate: ${regenCount}`);

  if (ONLY) console.log(`  --only: ${ONLY.join(', ')}`);
  if (RESUME_FROM) console.log(`  --resume-from: ${RESUME_FROM}`);
  console.log('');

  if (DRY_RUN) {
    console.log('--- DRY RUN MODE — no API calls or file writes ---\n');
  }

  const startTime = Date.now();
  const results = await runPool(client, queue);
  const totalElapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  // Summary
  console.log('\n══════════════════════════════════════════');
  console.log('SUMMARY');
  console.log('══════════════════════════════════════════');

  const successes = results.filter(r => r.status === 'success');
  const errors = results.filter(r => r.status === 'error');
  const skipped = results.filter(r => r.status === 'skipped');

  console.log(`Completed: ${successes.length}`);
  console.log(`Errors:    ${errors.length}`);
  console.log(`Skipped:   ${skipped.length}`);
  console.log(`Total time: ${totalElapsed}s`);

  if (successes.length > 0) {
    const totalIn = successes.reduce((s, r) => s + (r.inputTokens || 0), 0);
    const totalOut = successes.reduce((s, r) => s + (r.outputTokens || 0), 0);
    const costIn = (totalIn / 1_000_000) * 5;
    const costOut = (totalOut / 1_000_000) * 25;
    console.log(`Tokens:    ${totalIn.toLocaleString()} in / ${totalOut.toLocaleString()} out`);
    console.log(`Est. cost: $${(costIn + costOut).toFixed(2)} ($${costIn.toFixed(2)} in + $${costOut.toFixed(2)} out)`);
  }

  if (errors.length > 0) {
    console.log('\nFailed studies:');
    for (const e of errors) {
      console.log(`  - ${e.key}: ${e.error}`);
    }
    console.log('\nRetry with: node pipeline/publish-studies.js --only ' + errors.map(e => e.key).join(','));
  }

  // Write results log
  const logPath = path.join(ROOT, 'pipeline', 'publish-results.json');
  fs.writeFileSync(logPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    model: MODEL,
    totalElapsed: parseFloat(totalElapsed),
    results
  }, null, 2));
  console.log(`\nResults log: pipeline/publish-results.json`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
