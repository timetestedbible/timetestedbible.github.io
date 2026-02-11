#!/usr/bin/env node
/**
 * seed-symbols.js
 * 
 * Converts existing symbol-dictionary.js entries into pipeline/symbols/*.md files.
 * Each file gets the YAML frontmatter format with rev:1, churn:1.00.
 * The context bag is initially empty — agents will fill it during explore waves.
 * 
 * Usage: node pipeline/seed-symbols.js
 */

const fs = require('fs');
const path = require('path');

// Load the symbol dictionary by executing the file in a mock browser context
const dictPath = path.join(__dirname, '..', 'symbol-dictionary.js');
const dictSource = fs.readFileSync(dictPath, 'utf-8');

// Execute the file — replace 'const' with 'var' so declarations are visible in the context
const vm = require('vm');
const context = { document: { addEventListener: () => {} }, console };
vm.createContext(context);
const execSource = dictSource.replace(/^const /gm, 'var ').replace(/^function /gm, 'var _fn_ = function ');
vm.runInContext(execSource, context);
const SYMBOL_DICTIONARY = context.SYMBOL_DICTIONARY;

if (!SYMBOL_DICTIONARY) {
  console.error('Could not load SYMBOL_DICTIONARY from symbol-dictionary.js');
  process.exit(1);
}

// Also check for existing .md studies in symbols/ directory
const symbolsDir = path.join(__dirname, '..', 'symbols');
const existingStudies = new Set();
if (fs.existsSync(symbolsDir)) {
  fs.readdirSync(symbolsDir)
    .filter(f => f.endsWith('.md') && f !== 'TODO.md' && f !== 'methodology.md')
    .forEach(f => existingStudies.add(f.replace('.md', '').toLowerCase()));
}

const outputDir = path.join(__dirname, 'symbols');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

let created = 0;
let skipped = 0;

for (const [key, symbol] of Object.entries(SYMBOL_DICTIONARY)) {
  // Convert key to filename-safe format
  const filename = key.replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  const filepath = path.join(outputDir, `${filename}.md`);
  
  // Skip if already exists
  if (fs.existsSync(filepath)) {
    skipped++;
    continue;
  }

  // Build the meaning line
  const meaning = symbol.is + (symbol.is2 ? ` / ${symbol.is2}` : '');
  
  // Check if we have a full .md study
  const hasStudy = existingStudies.has(key.replace(/\s+/g, '-').toUpperCase()) 
                || existingStudies.has(symbol.name);
  
  const md = `---
symbol: ${key}
name: ${symbol.name}
strongs: [${(symbol.strongs || []).join(', ')}]
words: [${symbol.words.map(w => `"${w}"`).join(', ')}]
role: ${symbol.does ? 'noun-symbol + verb-symbol' : 'noun-symbol'}
meaning: ${meaning}
opposite: ${symbol.opposite || 'none'}
defining_verses: []
co_occurring: []
context_types: []
rev: 1
churn: 1.00
inputs: {}
dependents: []
has_full_study: ${hasStudy}
---

## Dictionary Entry
${symbol.sentence}
${symbol.does ? `\nDOES: ${symbol.does}${symbol.does2 ? ' / ' + symbol.does2 : ''}` : ''}

## Context Bag
[PENDING — awaiting explore wave. Agent should search all Scripture for occurrences
of ${(symbol.strongs || []).join('/')} and build the compressed context bag.]
`;

  fs.writeFileSync(filepath, md);
  created++;
}

console.log(`Seeded ${created} symbol files into pipeline/symbols/`);
console.log(`Skipped ${skipped} (already exist)`);
console.log(`${existingStudies.size} full .md studies available in symbols/ for reference`);
console.log(`\nReady for explore wave 1.`);
