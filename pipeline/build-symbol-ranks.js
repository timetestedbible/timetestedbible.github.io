#!/usr/bin/env node
/**
 * Build PageRank scores for symbol studies based on cross-reference links.
 *
 * Reads all _symbols/*.md and _verses/*.md files, extracts $symbol-key and
 * $[symbol-key] references, builds a directed link graph, and runs PageRank
 * (15 iterations, damping=0.85). Outputs ranked results to _data/symbol_ranks.yml.
 *
 * Usage:  node pipeline/build-symbol-ranks.js
 *   npm:  npm run build:ranks
 *
 * Run this after adding, removing, or significantly editing symbol or verse studies.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SYMBOLS_DIR = path.join(ROOT, '_symbols');
const VERSES_DIR = path.join(ROOT, '_verses');
const OUTPUT_FILE = path.join(ROOT, '_data', 'symbol_ranks.yml');

const SYMBOL_REF_PATTERN = /\$\[([a-zA-Z][a-zA-Z0-9 -]*[a-zA-Z0-9])\]|\$([a-z][a-z0-9-]*)/g;

function extractSymbolRefs(text) {
  const refs = new Set();
  let m;
  SYMBOL_REF_PATTERN.lastIndex = 0;
  while ((m = SYMBOL_REF_PATTERN.exec(text)) !== null) {
    const raw = m[1] || m[2];
    refs.add(raw.replace(/\s+/g, '-').toLowerCase());
  }
  return refs;
}

function readMdFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter(f => f.endsWith('.md') && !f.startsWith('_'))
    .map(f => ({
      key: f.replace(/\.md$/, ''),
      text: fs.readFileSync(path.join(dir, f), 'utf8'),
    }));
}

// --- Main ---

// Collect all symbol keys (the node set for PageRank)
const symbolFiles = readMdFiles(SYMBOLS_DIR);
const symbolKeys = new Set(symbolFiles.map(f => f.key));

// Build outbound link map for symbol studies (symbol → symbol links)
const outbound = {};
for (const { key, text } of symbolFiles) {
  const refs = extractSymbolRefs(text);
  refs.delete(key); // no self-links
  // Only keep refs that point to known symbol keys
  outbound[key] = new Set([...refs].filter(r => symbolKeys.has(r)));
}

// Build inbound map from symbol-to-symbol links
const inbound = {};
for (const k of symbolKeys) inbound[k] = new Set();
for (const [src, refs] of Object.entries(outbound)) {
  for (const dst of refs) {
    if (inbound[dst]) inbound[dst].add(src);
  }
}

// Add inbound links from verse studies (_verses/*.md → symbol references)
const verseFiles = readMdFiles(VERSES_DIR);
let verseLinks = 0;
for (const { key, text } of verseFiles) {
  const refs = extractSymbolRefs(text);
  const verseNodeId = `verse:${key}`;
  for (const ref of refs) {
    if (symbolKeys.has(ref)) {
      inbound[ref].add(verseNodeId);
      verseLinks++;
    }
  }
}

// PageRank (15 iterations, damping=0.85)
// Nodes are symbol keys only; verse studies contribute inbound links but are not ranked
const keys = [...symbolKeys].sort();
const n = keys.length;
const d = 0.85;
let scores = {};
for (const k of keys) scores[k] = 1.0 / n;

for (let iter = 0; iter < 15; iter++) {
  const next = {};
  for (const k of keys) {
    let rank = (1 - d) / n;
    for (const src of inbound[k]) {
      if (src.startsWith('verse:')) {
        // Verse studies distribute rank evenly across their symbol refs
        // but have no PageRank score of their own — use a fixed contribution
        const verseKey = src.slice(6);
        const verseFile = verseFiles.find(f => f.key === verseKey);
        const verseOutCount = verseFile
          ? [...extractSymbolRefs(verseFile.text)].filter(r => symbolKeys.has(r)).length || 1
          : 1;
        rank += d * (1.0 / n) / verseOutCount;
      } else {
        const outCount = outbound[src]?.size || 1;
        rank += d * scores[src] / outCount;
      }
    }
    next[k] = rank;
  }
  scores = next;
}

// Sort by score descending
const ranked = keys
  .map(k => ({ key: k, score: scores[k], inbound: inbound[k].size }))
  .sort((a, b) => b.score - a.score);

// Write YAML
fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
let yml = '';
for (const { key, score, inbound: inb } of ranked) {
  yml += `- key: ${key}\n  score: ${Math.round(score * 10000 * 10) / 10}\n  inbound: ${inb}\n`;
}
fs.writeFileSync(OUTPUT_FILE, yml);

console.log(`[symbol-ranks] Wrote ${ranked.length} entries to ${OUTPUT_FILE}`);
console.log(`[symbol-ranks] ${symbolFiles.length} symbol studies, ${verseFiles.length} verse studies, ${verseLinks} verse→symbol links`);
console.log(`[symbol-ranks] Top 10:`);
for (const { key, score, inbound: inb } of ranked.slice(0, 10)) {
  console.log(`  ${key.padEnd(30)}  score=${(Math.round(score * 10000 * 10) / 10).toFixed(1).padStart(6)}  inbound=${inb}`);
}
