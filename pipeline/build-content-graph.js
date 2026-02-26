#!/usr/bin/env node
/**
 * Unified Content Graph — PageRank across all content types.
 *
 * Ingests:
 *   1. Symbol studies (_symbols/*.md)     — $symbol refs + scripture citations
 *   2. Verse studies (_verses/*.md)       — $symbol refs + scripture citations
 *   3. Cross-references (cross_references.txt) — verse→verse with vote weights (~344K)
 *   4. Book scripture index (book-scripture-index.js) — book chapter→verse
 *   5. Timeline events (data/verse-event-index.json) — event→verse
 *
 * Outputs:
 *   _data/symbol_ranks.yml    — PageRank for symbol study nodes
 *   _data/verse_ranks.yml     — PageRank for all Bible verse nodes
 *   _data/reverse_index.yml   — reverse links (symbol → citing content)
 *   _data/graph_stats.yml     — summary statistics
 *
 * Usage:  node pipeline/build-content-graph.js
 *   npm:  npm run build:ranks
 */

const fs = require('fs');
const path = require('path');
const { extractSymbolRefs, extractScriptureRefs, parseCrossRef, canonicalRef } = require('./lib/parse-refs');

const ROOT = path.resolve(__dirname, '..');
const SYMBOLS_DIR = path.join(ROOT, '_symbols');
const VERSES_DIR = path.join(ROOT, '_verses');
const CROSS_REF_FILE = path.join(ROOT, 'cross_references.txt');
const BOOK_INDEX_FILE = path.join(ROOT, 'book-scripture-index.js');
const EVENT_INDEX_FILE = path.join(ROOT, 'data', 'verse-event-index.json');
const DATA_DIR = path.join(ROOT, '_data');

// --- Graph data structures ---
// edges: Map<fromNode, Map<toNode, weight>>
const edges = new Map();
const nodeTypes = new Map(); // nodeId → type string

function addEdge(from, to, weight = 1.0) {
  if (from === to) return;
  if (!edges.has(from)) edges.set(from, new Map());
  const existing = edges.get(from).get(to) || 0;
  edges.get(from).set(to, existing + weight);
}

function setNodeType(id, type) {
  if (!nodeTypes.has(id)) nodeTypes.set(id, type);
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

// --- 1. Symbol studies ---
console.log('[graph] Reading symbol studies...');
const symbolFiles = readMdFiles(SYMBOLS_DIR);
const symbolKeys = new Set(symbolFiles.map(f => f.key));
let symbolEdgeCount = 0;
let symbolScriptureEdgeCount = 0;

for (const { key, text } of symbolFiles) {
  const nodeId = `symbol:${key}`;
  setNodeType(nodeId, 'symbol');

  // $symbol refs → edges to other symbols
  for (const ref of extractSymbolRefs(text)) {
    if (ref !== key && symbolKeys.has(ref)) {
      addEdge(nodeId, `symbol:${ref}`);
      symbolEdgeCount++;
    }
  }

  // Scripture citations → edges to verse nodes
  for (const vref of extractScriptureRefs(text)) {
    const verseId = `verse:${vref}`;
    setNodeType(verseId, 'verse');
    addEdge(nodeId, verseId);
    symbolScriptureEdgeCount++;
  }
}
console.log(`  ${symbolFiles.length} symbols, ${symbolEdgeCount} symbol→symbol, ${symbolScriptureEdgeCount} symbol→verse`);

// --- 2. Verse studies ---
console.log('[graph] Reading verse studies...');
const verseFiles = readMdFiles(VERSES_DIR);
let vstudySymbolEdges = 0;
let vstudyScriptureEdges = 0;

for (const { key, text } of verseFiles) {
  const nodeId = `vstudy:${key}`;
  setNodeType(nodeId, 'vstudy');

  for (const ref of extractSymbolRefs(text)) {
    if (symbolKeys.has(ref)) {
      addEdge(nodeId, `symbol:${ref}`);
      vstudySymbolEdges++;
    }
  }

  for (const vref of extractScriptureRefs(text)) {
    const verseId = `verse:${vref}`;
    setNodeType(verseId, 'verse');
    addEdge(nodeId, verseId);
    vstudyScriptureEdges++;
  }
}
console.log(`  ${verseFiles.length} verse studies, ${vstudySymbolEdges} vstudy→symbol, ${vstudyScriptureEdges} vstudy→verse`);

// --- 3. Cross-references ---
console.log('[graph] Reading cross-references...');
let crossRefEdges = 0;
if (fs.existsSync(CROSS_REF_FILE)) {
  const lines = fs.readFileSync(CROSS_REF_FILE, 'utf8').split('\n');
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const parts = line.split('\t');
    if (parts.length < 3) continue;
    const votes = parseInt(parts[2]) || 0;
    if (votes < 1) continue;

    const fromVerses = parseCrossRef(parts[0]);
    const toVerses = parseCrossRef(parts[1]);
    if (fromVerses.length === 0 || toVerses.length === 0) continue;

    const weight = Math.log(votes + 1);
    // Use just the first verse of each side for the edge
    const from = fromVerses[0];
    const to = toVerses[0];
    const fromId = `verse:${canonicalRef(from.book, from.chapter, from.verse)}`;
    const toId = `verse:${canonicalRef(to.book, to.chapter, to.verse)}`;
    setNodeType(fromId, 'verse');
    setNodeType(toId, 'verse');
    addEdge(fromId, toId, weight);
    crossRefEdges++;
  }
}
console.log(`  ${crossRefEdges} cross-reference edges`);

// --- 4. Book scripture index ---
console.log('[graph] Reading book scripture index...');
let bookEdges = 0;
if (fs.existsSync(BOOK_INDEX_FILE)) {
  const src = fs.readFileSync(BOOK_INDEX_FILE, 'utf8');
  // Extract the object literal between { and the closing }; before the function
  const objMatch = src.match(/const BOOK_SCRIPTURE_INDEX\s*=\s*\{([\s\S]*?)\n\};?\n/);
  if (objMatch) {
    // Parse each line: "Book Ch:V-V": [{chapter: "XX", ...}]
    const entryPattern = /"([^"]+)":\s*\[\{chapter:\s*"([^"]+)"/g;
    let m;
    while ((m = entryPattern.exec(objMatch[1])) !== null) {
      const refStr = m[1];
      const bookChapter = m[2];
      const bookNodeId = `book:${bookChapter}`;
      setNodeType(bookNodeId, 'book');

      // Parse the scripture ref
      const refs = extractScriptureRefs(refStr);
      for (const vref of refs) {
        const verseId = `verse:${vref}`;
        setNodeType(verseId, 'verse');
        addEdge(bookNodeId, verseId);
        bookEdges++;
      }
    }
  }
}
console.log(`  ${bookEdges} book→verse edges`);

// --- 5. Timeline events ---
console.log('[graph] Reading timeline events...');
let eventEdges = 0;
if (fs.existsSync(EVENT_INDEX_FILE)) {
  const eventData = JSON.parse(fs.readFileSync(EVENT_INDEX_FILE, 'utf8'));
  const index = eventData.index || {};
  for (const [verseRef, entry] of Object.entries(index)) {
    if (!entry.events || entry.events.length === 0) continue;
    const verseId = `verse:${verseRef}`;
    setNodeType(verseId, 'verse');
    for (const ev of entry.events) {
      if (!ev.id) continue;
      const eventId = `event:${ev.id}`;
      setNodeType(eventId, 'event');
      addEdge(eventId, verseId);
      eventEdges++;
    }
  }
}
console.log(`  ${eventEdges} event→verse edges`);

// --- PageRank ---
console.log('[graph] Running PageRank...');
const allNodes = [...nodeTypes.keys()];
const n = allNodes.length;
const d = 0.85;
const iterations = 20;

// Build inbound map with weights for efficient iteration
const inbound = new Map(); // toNode → [{from, weight}]
for (const node of allNodes) inbound.set(node, []);
for (const [from, targets] of edges) {
  for (const [to, weight] of targets) {
    if (!inbound.has(to)) { inbound.set(to, []); setNodeType(to, 'verse'); }
    inbound.get(to).push({ from, weight });
  }
}

// Compute total outgoing weight per node
const outWeight = new Map();
for (const [from, targets] of edges) {
  let total = 0;
  for (const w of targets.values()) total += w;
  outWeight.set(from, total || 1);
}

let scores = new Map();
for (const node of allNodes) scores.set(node, 1.0 / n);

for (let iter = 0; iter < iterations; iter++) {
  const next = new Map();
  for (const node of allNodes) {
    let rank = (1 - d) / n;
    const inboundList = inbound.get(node) || [];
    for (const { from, weight } of inboundList) {
      const srcScore = scores.get(from) || (1.0 / n);
      const srcOut = outWeight.get(from) || 1;
      rank += d * srcScore * (weight / srcOut);
    }
    next.set(node, rank);
  }
  scores = next;
}
console.log(`  ${iterations} iterations over ${n} nodes`);

// --- Build reverse index ---
const reverseIndex = {}; // symbolKey → { vstudies: [], books: [], events: [] }
for (const key of symbolKeys) {
  reverseIndex[key] = { vstudies: [], books: [] };
}
for (const { key, text } of verseFiles) {
  for (const ref of extractSymbolRefs(text)) {
    if (reverseIndex[ref]) {
      reverseIndex[ref].vstudies.push(key);
    }
  }
}

// --- Output ---
fs.mkdirSync(DATA_DIR, { recursive: true });

// Symbol ranks
const symbolRanked = [...symbolKeys]
  .map(k => ({ key: k, score: scores.get(`symbol:${k}`) || 0, inbound: (inbound.get(`symbol:${k}`) || []).length }))
  .sort((a, b) => b.score - a.score);

let symYml = '';
for (const { key, score, inbound: inb } of symbolRanked) {
  symYml += `- key: ${key}\n  score: ${Math.round(score * 1e7) / 10}\n  inbound: ${inb}\n`;
}
fs.writeFileSync(path.join(DATA_DIR, 'symbol_ranks.yml'), symYml);
console.log(`[output] symbol_ranks.yml — ${symbolRanked.length} entries`);

// Verse ranks (ALL verses, sorted by rank)
const verseNodes = allNodes.filter(id => nodeTypes.get(id) === 'verse');
const verseRanked = verseNodes
  .map(id => ({ ref: id.slice(6), score: scores.get(id) || 0 }))
  .sort((a, b) => b.score - a.score);

let verseYml = `# ${verseRanked.length} Bible verses ranked by PageRank\n`;
verseYml += `# Top verse: ${verseRanked[0]?.ref} (score: ${Math.round((verseRanked[0]?.score || 0) * 1e7) / 10})\n`;
for (const { ref, score } of verseRanked) {
  verseYml += `- ref: "${ref}"\n  score: ${Math.round(score * 1e7) / 10}\n`;
}
fs.writeFileSync(path.join(DATA_DIR, 'verse_ranks.yml'), verseYml);
console.log(`[output] verse_ranks.yml — ${verseRanked.length} entries`);

// Compact content ranks — all node types in one file
const BOOK_ORDER = [
  'Genesis','Exodus','Leviticus','Numbers','Deuteronomy',
  'Joshua','Judges','Ruth','1 Samuel','2 Samuel','1 Kings','2 Kings',
  '1 Chronicles','2 Chronicles','Ezra','Nehemiah','Esther',
  'Job','Psalms','Proverbs','Ecclesiastes','Song of Solomon',
  'Isaiah','Jeremiah','Lamentations','Ezekiel','Daniel',
  'Hosea','Joel','Amos','Obadiah','Jonah','Micah',
  'Nahum','Habakkuk','Zephaniah','Haggai','Zechariah','Malachi',
  'Matthew','Mark','Luke','John','Acts','Romans',
  '1 Corinthians','2 Corinthians','Galatians','Ephesians','Philippians',
  'Colossians','1 Thessalonians','2 Thessalonians',
  '1 Timothy','2 Timothy','Titus','Philemon',
  'Hebrews','James','1 Peter','2 Peter','1 John','2 John','3 John',
  'Jude','Revelation'
];
const bookToIdx = {};
BOOK_ORDER.forEach((b, i) => bookToIdx[b] = i);

// Verses: 3D array ranks[bookIdx][chapterIdx][verseIdx] = score*10
const verseArr = [];
for (let i = 0; i < 66; i++) verseArr.push([]);
for (const { ref, score } of verseRanked) {
  const m = ref.match(/^(.+?)\s+(\d+):(\d+)$/);
  if (!m) continue;
  const bi = bookToIdx[m[1]];
  if (bi === undefined) continue;
  const ch = parseInt(m[2]) - 1;
  const v = parseInt(m[3]) - 1;
  while (verseArr[bi].length <= ch) verseArr[bi].push([]);
  while (verseArr[bi][ch].length <= v) verseArr[bi][ch].push(0);
  verseArr[bi][ch][v] = Math.round(score * 1e7);
}

// Symbols: {key: score*10}
const symbolScores = {};
for (const { key, score } of symbolRanked) {
  symbolScores[key] = Math.round(score * 1e7);
}

// Verse studies: {key: score*10}
const vstudyScores = {};
for (const { key } of verseFiles) {
  const s = scores.get(`vstudy:${key}`) || 0;
  if (s > 0) vstudyScores[key] = Math.round(s * 1e7);
}

// Events: {id: score*10}
const eventScores = {};
for (const id of allNodes.filter(n => nodeTypes.get(n) === 'event')) {
  const s = scores.get(id) || 0;
  if (s > 0) eventScores[id.slice(6)] = Math.round(s * 1e7);
}

// Book chapters: {chapter: score*10}
const bookScores = {};
for (const id of allNodes.filter(n => nodeTypes.get(n) === 'book')) {
  const s = scores.get(id) || 0;
  if (s > 0) bookScores[id.slice(5)] = Math.round(s * 1e7);
}

const contentRanks = {
  v: verseArr,        // verses: 3D array [book][chapter][verse] = score*10
  s: symbolScores,    // symbols: {key: score*10}
  vs: vstudyScores,   // verse studies: {key: score*10}
  e: eventScores,     // events: {id: score*10}
  b: bookScores,      // book chapters: {chapter: score*10}
};

fs.mkdirSync(path.join(ROOT, 'data'), { recursive: true });
const contentJson = JSON.stringify(contentRanks);
fs.writeFileSync(path.join(ROOT, 'data', 'content-ranks.json'), contentJson);
console.log(`[output] data/content-ranks.json — ${Math.round(contentJson.length / 1024)}KB (${verseRanked.length} verses, ${Object.keys(symbolScores).length} symbols, ${Object.keys(vstudyScores).length} vstudies, ${Object.keys(eventScores).length} events, ${Object.keys(bookScores).length} books)`);

// Reverse index
let revYml = '';
for (const [key, data] of Object.entries(reverseIndex)) {
  if (data.vstudies.length === 0 && data.books.length === 0) continue;
  revYml += `- key: ${key}\n`;
  if (data.vstudies.length > 0) revYml += `  vstudies: [${data.vstudies.join(', ')}]\n`;
  if (data.books.length > 0) revYml += `  books: [${data.books.join(', ')}]\n`;
}
fs.writeFileSync(path.join(DATA_DIR, 'reverse_index.yml'), revYml);
console.log(`[output] reverse_index.yml`);

// Graph stats
const typeCounts = {};
for (const [, type] of nodeTypes) typeCounts[type] = (typeCounts[type] || 0) + 1;
let totalEdges = 0;
for (const targets of edges.values()) totalEdges += targets.size;

let statsYml = `total_nodes: ${n}\ntotal_edges: ${totalEdges}\n`;
statsYml += `node_types:\n`;
for (const [type, count] of Object.entries(typeCounts).sort((a, b) => b[1] - a[1])) {
  statsYml += `  ${type}: ${count}\n`;
}
statsYml += `edge_types:\n`;
statsYml += `  symbol_to_symbol: ${symbolEdgeCount}\n`;
statsYml += `  symbol_to_verse: ${symbolScriptureEdgeCount}\n`;
statsYml += `  vstudy_to_symbol: ${vstudySymbolEdges}\n`;
statsYml += `  vstudy_to_verse: ${vstudyScriptureEdges}\n`;
statsYml += `  cross_reference: ${crossRefEdges}\n`;
statsYml += `  book_to_verse: ${bookEdges}\n`;
statsYml += `  event_to_verse: ${eventEdges}\n`;
statsYml += `top_10_symbols:\n`;
for (const { key, score } of symbolRanked.slice(0, 10)) {
  statsYml += `  - ${key}: ${Math.round(score * 1e7) / 10}\n`;
}
statsYml += `top_10_verses:\n`;
for (const { ref, score } of verseRanked.slice(0, 10)) {
  statsYml += `  - "${ref}": ${Math.round(score * 1e7) / 10}\n`;
}
fs.writeFileSync(path.join(DATA_DIR, 'graph_stats.yml'), statsYml);
console.log(`[output] graph_stats.yml`);

// Summary
console.log(`\n[graph] Summary: ${n} nodes, ${totalEdges} edges`);
for (const [type, count] of Object.entries(typeCounts).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${type}: ${count}`);
}
console.log(`\nTop 10 symbols:`);
for (const { key, score, inbound: inb } of symbolRanked.slice(0, 10)) {
  console.log(`  ${key.padEnd(30)} score=${(Math.round(score * 1e7) / 10).toFixed(1).padStart(7)}  inbound=${inb}`);
}
console.log(`\nTop 10 verses:`);
for (const { ref, score } of verseRanked.slice(0, 10)) {
  console.log(`  ${ref.padEnd(30)} score=${(Math.round(score * 1e7) / 10).toFixed(1).padStart(7)}`);
}
