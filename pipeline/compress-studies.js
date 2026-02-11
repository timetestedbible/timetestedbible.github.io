#!/usr/bin/env node
/**
 * compress-studies.js
 * 
 * Reads each full symbol study from symbols/*.md and compresses it into
 * the pipeline/symbols/*.md format using AI. Extracts all verse references,
 * co-occurring symbols, context types, and produces a dense context bag.
 * 
 * Usage:
 *   node pipeline/compress-studies.js                 # compress all
 *   node pipeline/compress-studies.js BREAD WINE      # compress specific ones
 *   DRY_RUN=1 node pipeline/compress-studies.js BREAD # preview prompt
 * 
 * Requires: ANTHROPIC_API_KEY in environment or .env
 */

const fs = require('fs');
const path = require('path');

const SYMBOLS_DIR = path.join(__dirname, '..', 'symbols');
const PIPELINE_SYMBOLS_DIR = path.join(__dirname, 'symbols');
const PROJECT_DIR = path.join(__dirname, '..');

// Load symbol dictionary for cross-referencing
const vm = require('vm');
const dictSource = fs.readFileSync(path.join(PROJECT_DIR, 'symbol-dictionary.js'), 'utf-8');
const ctx = { document: { addEventListener: () => {} }, console };
vm.createContext(ctx);
vm.runInContext(dictSource.replace(/^const /gm, 'var ').replace(/^function /gm, 'var _fn_ = function '), ctx);
const SYMBOL_DICTIONARY = ctx.SYMBOL_DICTIONARY || {};

// Build known symbol list
const knownSymbols = Object.entries(SYMBOL_DICTIONARY).map(([k, v]) => 
  `${v.name} → ${v.is}${v.is2 ? ' / ' + v.is2 : ''}`
).join('\n  ');

async function callAI(prompt) {
  if (process.env.DRY_RUN) {
    console.log('\n=== DRY RUN PROMPT ===\n');
    console.log(prompt.substring(0, 2000) + '\n...[truncated]');
    return null;
  }
  
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('ANTHROPIC_API_KEY not set');
    process.exit(1);
  }
  
  const model = process.env.MODEL || 'claude-opus-4-6';
  console.log(`  Calling ${model}...`);
  
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model,
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }]
    })
  });
  
  if (!response.ok) {
    const err = await response.text();
    throw new Error(`API error ${response.status}: ${err}`);
  }
  
  const data = await response.json();
  console.log(`  Tokens: ${data.usage?.input_tokens} in / ${data.usage?.output_tokens} out`);
  return data.content[0].text;
}

function buildCompressPrompt(name, fullStudy, dictEntry) {
  const strongs = dictEntry?.strongs?.join(', ') || '';
  const words = dictEntry?.words?.map(w => `"${w}"`).join(', ') || '';
  const meaning = dictEntry ? `${dictEntry.is}${dictEntry.is2 ? ' / ' + dictEntry.is2 : ''}` : '';
  const opposite = dictEntry?.opposite || '';
  const sentence = dictEntry?.sentence || '';
  
  return `You are compressing a full Scripture symbol study into a dense pipeline format.

## FULL STUDY TO COMPRESS:
${fullStudy}

## DICTIONARY ENTRY (for reference):
Name: ${name}
Strong's: ${strongs}
Words: ${words}
Meaning: ${meaning}
Opposite: ${opposite}
Sentence: ${sentence}

## KNOWN SYMBOLS (for co-occurrence tagging):
  ${knownSymbols}

## TASK:
Compress this study into the pipeline format below. Key requirements:
1. EXTRACT EVERY Scripture verse reference cited in the study. List them all in defining_verses (pick the 7 most important) and reference the rest in the context bag.
2. The context bag must preserve ALL the key arguments and connections from the study in compressed form.
3. Tag co-occurring symbols from the known list.
4. Use shorthand notation: → (points to), + (co-occurs), || (parallel), subj: (subject), [H] (Hebrew only), [G] (Greek only).
5. Do NOT add new analysis — only compress what's already in the study.

## OUTPUT FORMAT (output ONLY this, nothing else):

---
symbol: ${name.toLowerCase().replace(/\s+/g, '-')}
name: ${name}
strongs: [${strongs}]
words: [${words}]
role: {noun-symbol / verb-symbol / adjective-symbol}
meaning: ${meaning || '{from study}'}
opposite: ${opposite || '{from study}'}
defining_verses: [{7 most important verses from the study}]
co_occurring: [{symbols from known list that appear in the study}]
context_types: [{types found in the study}]
all_verses: [{EVERY verse cited in the study, comma-separated}]
rev: 1
churn: 1.00
inputs: {}
dependents: []
source: symbols/${name}.md
---

## Context Bag
{Compressed version of the study's argument + evidence. Max 500 words.
Every verse reference from the study must appear here.
Preserve the logic chain. Use shorthand notation.}`;
}

async function compressOne(name) {
  const studyPath = path.join(SYMBOLS_DIR, `${name}.md`);
  if (!fs.existsSync(studyPath)) {
    console.log(`  SKIP: no study file for ${name}`);
    return false;
  }
  
  const fullStudy = fs.readFileSync(studyPath, 'utf-8');
  
  // Skip non-study files
  if (name === 'TODO' || name === 'METHODOLOGY' || name === 'AI-METHODOLOGY' || 
      name === 'HOW-SCRIPTURE-TEACHES' || name === 'WHY-PARABLES' ||
      name === 'ARCHITECTURE' || name === 'index') {
    console.log(`  SKIP: ${name} is not a symbol study`);
    return false;
  }
  
  // Find dictionary entry
  const dictKey = name.toLowerCase().replace(/-/g, ' ');
  const dictEntry = SYMBOL_DICTIONARY[dictKey] || SYMBOL_DICTIONARY[name.toLowerCase()] || null;
  
  const pipelineFile = name.toLowerCase().replace(/\s+/g, '-') + '.md';
  const pipelinePath = path.join(PIPELINE_SYMBOLS_DIR, pipelineFile);
  
  // Check if already compressed (has real context bag, not [PENDING])
  if (fs.existsSync(pipelinePath)) {
    const existing = fs.readFileSync(pipelinePath, 'utf-8');
    if (existing.includes('all_verses:') || existing.includes('source: symbols/')) {
      console.log(`  SKIP: ${pipelineFile} already compressed`);
      return false;
    }
  }
  
  console.log(`  Compressing: ${name}`);
  const prompt = buildCompressPrompt(name, fullStudy, dictEntry);
  const response = await callAI(prompt);
  
  if (response) {
    // Extract the markdown content
    const mdMatch = response.match(/---[\s\S]*---[\s\S]*/);
    if (mdMatch) {
      fs.writeFileSync(pipelinePath, mdMatch[0]);
      console.log(`  Wrote: pipeline/symbols/${pipelineFile}`);
      return true;
    } else {
      console.log(`  WARNING: no frontmatter found in response for ${name}`);
      // Save raw response for debugging
      fs.writeFileSync(pipelinePath + '.raw', response);
      return false;
    }
  }
  return false;
}

async function main() {
  const args = process.argv.slice(2).filter(a => !a.startsWith('-'));
  
  // Get list of studies to compress
  let studyNames;
  if (args.length > 0) {
    studyNames = args;
  } else {
    studyNames = fs.readdirSync(SYMBOLS_DIR)
      .filter(f => f.endsWith('.md'))
      .map(f => f.replace('.md', ''));
  }
  
  console.log(`\n=== Compressing ${studyNames.length} symbol studies ===\n`);
  
  let compressed = 0, skipped = 0, failed = 0;
  
  for (const name of studyNames) {
    const result = await compressOne(name);
    if (result === true) compressed++;
    else if (result === false) skipped++;
    else failed++;
    
    // Brief pause between API calls
    if (result === true) await new Promise(r => setTimeout(r, 1000));
  }
  
  console.log(`\n=== Done: ${compressed} compressed, ${skipped} skipped, ${failed} failed ===`);
}

main();
