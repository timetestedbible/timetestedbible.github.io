#!/usr/bin/env node
/**
 * build-symbol-dictionary.js
 * 
 * Generates symbol-dictionary.js from _symbols/*.md frontmatter + body content.
 * Single source of truth: _symbols/*.md
 * 
 * Usage: node pipeline/build-symbol-dictionary.js
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const SYMBOLS_DIR = path.join(__dirname, '..', '_symbols');
const RANKS_FILE = path.join(__dirname, '..', '_data', 'symbol_ranks.yml');
const CATEGORIES_FILE = path.join(__dirname, '..', '_data', 'symbol_categories.yml');
const OUTPUT_FILE = path.join(__dirname, '..', 'symbol-dictionary.js');

/**
 * Parse YAML frontmatter and body from a markdown file
 */
function parseMarkdown(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { frontmatter: {}, body: '' };
  return {
    frontmatter: yaml.load(match[1]) || {},
    body: match[2]
  };
}

/**
 * Extract the bold opening line from the study body.
 * Every study starts with: # Title\n\n**Bold meaning line**
 */
function extractBoldLine(body) {
  // Match the first **...** line (may contain markdown like $[...], *...*,  etc.)
  const match = body.match(/^\*\*(.+?)\*\*\s*$/m);
  if (!match) return null;
  
  // Clean markdown artifacts: $[word], $word, *italics*, [links](/...), H####/G#### with parens
  let text = match[1];
  text = text.replace(/\$\[([^\]]+)\]/g, '$1');       // $[word] → word
  text = text.replace(/\$([a-z0-9-]+)/g, '$1');        // $word → word
  text = text.replace(/\*([^*]+)\*/g, '$1');            // *italics* → text
  text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1'); // [text](url) → text
  text = text.replace(/\s*\(?[HG]\d{3,5}\)?\s*/g, ' '); // Remove Strong's numbers (with optional parens)
  text = text.replace(/\(\s*\)/g, '');                 // Remove empty parens
  text = text.replace(/\s{2,}/g, ' ');                 // Collapse whitespace
  return text.trim();
}

/**
 * Derive a short meaning from the bold line.
 * Split on ' — ' (em-dash) or first '.' if no dash.
 */
function deriveShortMeaning(boldLine) {
  if (!boldLine) return '';
  
  // Try splitting on em-dash
  const dashIdx = boldLine.indexOf(' — ');
  if (dashIdx > 0 && dashIdx < 80) {
    return boldLine.substring(0, dashIdx).trim();
  }
  
  // Try splitting on first period (if result is reasonable length)
  const dotIdx = boldLine.indexOf('.');
  if (dotIdx > 0 && dotIdx < 80) {
    return boldLine.substring(0, dotIdx).trim();
  }
  
  // Already short enough, use as-is
  if (boldLine.length <= 80) {
    return boldLine;
  }
  
  // Truncate at last word boundary before 80 chars
  const truncated = boldLine.substring(0, 80);
  const lastSpace = truncated.lastIndexOf(' ');
  return (lastSpace > 0 ? truncated.substring(0, lastSpace) : truncated) + '…';
}

/**
 * Convert symbol_key to display name.
 * e.g. 'babylon-the-great' → 'BABYLON THE GREAT'
 */
function keyToName(key) {
  return key.replace(/-/g, ' ').toUpperCase();
}

/**
 * Escape single quotes for JS string literals
 */
function escapeJS(str) {
  if (!str) return '';
  return str.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

// --- Main ---

// Load PageRank scores from _data/symbol_ranks.yml
const rankMap = {};
if (fs.existsSync(RANKS_FILE)) {
  const ranks = yaml.load(fs.readFileSync(RANKS_FILE, 'utf8')) || [];
  for (const r of ranks) {
    if (r.key) rankMap[r.key] = r.score || 0;
  }
  console.log(`Loaded ${Object.keys(rankMap).length} rank scores`);
}

// Load semantic categories from _data/symbol_categories.yml
const categoryMap = {}; // key → { category, subcategory }
if (fs.existsSync(CATEGORIES_FILE)) {
  const cats = yaml.load(fs.readFileSync(CATEGORIES_FILE, 'utf8')) || [];
  for (const cat of cats) {
    if (cat.subcategories) {
      for (const sub of cat.subcategories) {
        for (const key of (sub.symbols || [])) {
          categoryMap[key] = { category: cat.category, subcategory: sub.name };
        }
      }
    }
    if (cat.symbols) {
      for (const key of cat.symbols) {
        categoryMap[key] = { category: cat.category, subcategory: null };
      }
    }
  }
  console.log(`Loaded ${Object.keys(categoryMap).length} category assignments`);
}

const files = fs.readdirSync(SYMBOLS_DIR)
  .filter(f => f.endsWith('.md') && !f.startsWith('_'))
  .sort();

const entries = [];
let skipped = 0;

for (const file of files) {
  const key = path.basename(file, '.md');
  const content = fs.readFileSync(path.join(SYMBOLS_DIR, file), 'utf8');
  const { frontmatter, body } = parseMarkdown(content);
  
  // Require minimum frontmatter
  if (!frontmatter.words || !frontmatter.symbol_key) {
    console.warn(`SKIP ${key}: missing words or symbol_key in frontmatter`);
    skipped++;
    continue;
  }
  
  const boldLine = extractBoldLine(body);
  if (!boldLine) {
    console.warn(`WARN ${key}: no bold opening line found, using description`);
  }
  
  const sentence = boldLine || frontmatter.description || '';
  const meaning = deriveShortMeaning(sentence);
  
  // Format words array (concept names for search + display)
  const words = (frontmatter.words || []).map(w => String(w).toLowerCase());
  
  // Format KJV-specific trigger phrases (for in-text matching in KJV reader)
  const kjvTriggers = (frontmatter.kjv_triggers || []).map(w => String(w).toLowerCase());
  
  // Format strongs array (translation-agnostic matching)
  const strongs = (frontmatter.strongs || []).map(s => String(s));
  
  // Derive opposite from frontmatter if present, or from body patterns
  let opposite = frontmatter.opposite || null;
  if (!opposite) {
    // Try to extract from **Opposite:** line in the body
    const oppMatch = body.match(/\*\*Opposite:\*\*\s*(.+)/);
    if (oppMatch) {
      let opp = oppMatch[1].trim();
      opp = opp.replace(/\$\[([^\]]+)\]/g, '$1');  // $[word] → word
      opp = opp.replace(/\$([a-z0-9-]+)/g, (m, key) => {
        return key.replace(/(^|-)([a-z])/g, (m, sep, c) => (sep ? ' ' : '') + c.toUpperCase());
      }); // $fire → Fire, $full-moon → Full Moon
      // Remove trailing markdown artifacts
      opp = opp.replace(/\s*\(?[HG]\d{3,5}\)?\s*/g, ' ').trim();
      // Strip if it's just a dash placeholder
      if (opp === '—' || opp === '-' || opp === '–') opp = null;
      opposite = opp || null;
    }
  }
  
  const cat = categoryMap[key] || { category: 'Uncategorized', subcategory: null };
  
  entries.push({
    key,
    name: keyToName(key),
    words,
    kjvTriggers,
    strongs,
    meaning,
    sentence,
    opposite,
    rank: rankMap[key] || 0,
    category: cat.category,
    subcategory: cat.subcategory,
    link: `/research/symbols/${key}/`
  });
}

// Build the output JS
let output = `// Symbol Dictionary Data
// GENERATED by pipeline/build-symbol-dictionary.js — do not edit by hand
// Source of truth: _symbols/*.md
// Regenerate: node pipeline/build-symbol-dictionary.js

const SYMBOL_DICTIONARY = {
`;

for (let i = 0; i < entries.length; i++) {
  const e = entries[i];
  const wordsStr = e.words.map(w => `'${escapeJS(w)}'`).join(', ');
  const strongsStr = e.strongs.map(s => `'${escapeJS(s)}'`).join(', ');
  
  output += `  '${escapeJS(e.key)}': {\n`;
  output += `    key: '${escapeJS(e.key)}',\n`;
  output += `    name: '${escapeJS(e.name)}',\n`;
  output += `    words: [${wordsStr}],\n`;
  const kjvStr = e.kjvTriggers.map(w => `'${escapeJS(w)}'`).join(', ');
  if (e.kjvTriggers.length > 0) {
    output += `    kjvTriggers: [${kjvStr}],\n`;
  }
  output += `    strongs: [${strongsStr}],\n`;
  output += `    meaning: '${escapeJS(e.meaning)}',\n`;
  output += `    sentence: '${escapeJS(e.sentence)}',\n`;
  output += `    opposite: ${e.opposite ? `'${escapeJS(e.opposite)}'` : 'null'},\n`;
  output += `    rank: ${e.rank},\n`;
  output += `    category: '${escapeJS(e.category)}',\n`;
  output += `    subcategory: ${e.subcategory ? `'${escapeJS(e.subcategory)}'` : 'null'},\n`;
  output += `    link: '${e.link}'\n`;
  output += `  }`;
  if (i < entries.length - 1) output += ',';
  output += '\n\n';
}

output += `};

// Build a quick lookup index for word matching
const SYMBOL_WORD_INDEX = {};
// Also track multi-word phrases separately
const SYMBOL_MULTI_WORD_PHRASES = [];

for (const [key, symbol] of Object.entries(SYMBOL_DICTIONARY)) {
  for (const word of symbol.words) {
    SYMBOL_WORD_INDEX[word] = symbol;
    // Track multi-word phrases (those containing spaces)
    if (word.includes(' ')) {
      SYMBOL_MULTI_WORD_PHRASES.push({
        phrase: word,
        symbol: symbol,
        key: key
      });
    }
  }
  // Also index KJV trigger phrases for matching in Bible text
  if (symbol.kjvTriggers) {
    for (const trigger of symbol.kjvTriggers) {
      const lower = trigger.toLowerCase();
      if (lower.includes(' ')) {
        SYMBOL_MULTI_WORD_PHRASES.push({
          phrase: lower,
          symbol: symbol,
          key: key
        });
      } else {
        if (!SYMBOL_WORD_INDEX[lower]) {
          SYMBOL_WORD_INDEX[lower] = symbol;
        }
      }
    }
  }
}

// Sort multi-word phrases by length (longest first) for proper matching
SYMBOL_MULTI_WORD_PHRASES.sort((a, b) => b.phrase.length - a.phrase.length);

// Build a Strong's number index
const SYMBOL_STRONGS_INDEX = {};
for (const [key, symbol] of Object.entries(SYMBOL_DICTIONARY)) {
  if (symbol.strongs) {
    for (const strongs of symbol.strongs) {
      SYMBOL_STRONGS_INDEX[strongs] = symbol;
    }
  }
}

// Look up symbol by word or phrase (case-insensitive)
function lookupSymbolByWord(word) {
  if (!word) return null;
  const normalized = word.toLowerCase().replace(/[.,;:!?'"()]/g, '');
  return SYMBOL_WORD_INDEX[normalized] || null;
}

// Get all multi-word phrases for matching
function getMultiWordSymbolPhrases() {
  return SYMBOL_MULTI_WORD_PHRASES;
}

// Look up symbol by Strong's number
function lookupSymbolByStrongs(strongsNum) {
  if (!strongsNum) return null;
  // Normalize the Strong's number
  const normalized = normalizeStrongsNum(strongsNum);
  return SYMBOL_STRONGS_INDEX[normalized] || null;
}

// Show the symbol panel — if the symbol has an associated Strong's number,
// open the full Strong's sidebar (which already includes symbolic meaning);
// otherwise fall back to the floating symbol popup.
function showSymbolPanel(symbolKey, word, event) {
  if (event) {
    event.stopPropagation();
  }
  
  const symbol = SYMBOL_DICTIONARY[symbolKey] || lookupSymbolByWord(word);
  if (!symbol) return;
  
  // If the symbol has associated Strong's numbers and showStrongsPanel is available,
  // open the Strong's sidebar instead — it shows the full definition + symbolic meaning.
  if (symbol.strongs && symbol.strongs.length > 0 && typeof showStrongsPanel === 'function') {
    const strongsNum = symbol.strongs[0];
    showStrongsPanel(strongsNum, word, '', event);
    return;
  }
  
  // Fallback: floating symbol panel for symbols without Strong's numbers
  let panel = document.getElementById('symbol-panel');
  if (!panel) {
    panel = document.createElement('div');
    panel.id = 'symbol-panel';
    panel.className = 'symbol-panel';
    document.body.appendChild(panel);
  }
  
  let html = \`
    <div class="symbol-panel-header">
      <span class="symbol-panel-name">\${symbol.name}</span>
      <button class="symbol-panel-close" onclick="closeSymbolPanel()">×</button>
    </div>
    <div class="symbol-panel-content">
      <div class="symbol-meaning-row">
        <span class="symbol-label">Meaning:</span>
        <span class="symbol-value">\${symbol.meaning}</span>
      </div>
      <div class="symbol-sentence">\${symbol.sentence}</div>
      \${symbol.opposite ? \`<div class="symbol-opposite"><strong>Opposite:</strong> \${symbol.opposite}</div>\` : ''}
      <button class="symbol-study-link" onclick="closeSymbolPanel(); navigateToSymbolStudy('\${symbolKey}')">Full Study →</button>
    </div>
  \`;
  
  panel.innerHTML = html;
  panel.classList.add('visible');
  
  // Position near the clicked word if event provided
  if (event && event.target) {
    const rect = event.target.getBoundingClientRect();
    const panelWidth = 300;
    const panelHeight = 200;
    
    let left = rect.left + window.scrollX;
    let top = rect.bottom + window.scrollY + 5;
    
    if (left + panelWidth > window.innerWidth) {
      left = window.innerWidth - panelWidth - 10;
    }
    if (top + panelHeight > window.innerHeight + window.scrollY) {
      top = rect.top + window.scrollY - panelHeight - 5;
    }
    
    panel.style.left = left + 'px';
    panel.style.top = top + 'px';
  }
}

function closeSymbolPanel() {
  const panel = document.getElementById('symbol-panel');
  if (panel) {
    panel.classList.remove('visible');
  }
}

// Open symbol study in reader view (SPA navigation)
function openSymbolStudyInReader(symbolKey) {
  navigateToSymbolStudy(symbolKey);
}

// SPA navigation to a symbol study — keeps research panel open on desktop
function navigateToSymbolStudy(symbolKey) {
  if (!symbolKey) return;
  if (typeof AppStore !== 'undefined') {
    AppStore.dispatch({
      type: 'SET_VIEW',
      view: 'reader',
      params: { contentType: 'symbols', symbol: symbolKey.toLowerCase() },
      preserveStrongs: window.innerWidth > 768
    });
  }
}

// Close symbol panel when clicking outside
document.addEventListener('click', (e) => {
  const panel = document.getElementById('symbol-panel');
  if (panel && panel.classList.contains('visible')) {
    if (!panel.contains(e.target) && !e.target.classList.contains('symbol-word')) {
      closeSymbolPanel();
    }
  }
});
`;

fs.writeFileSync(OUTPUT_FILE, output, 'utf8');

console.log(`Generated ${entries.length} entries to symbol-dictionary.js`);
if (skipped > 0) {
  console.log(`Skipped ${skipped} files (missing frontmatter)`);
}
