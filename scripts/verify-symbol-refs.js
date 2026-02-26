#!/usr/bin/env node
/**
 * Verify all $symbol and $[symbol] references in _symbols/ and _verses/ resolve
 * against the symbol dictionary keys and aliases.
 *
 * Usage: node scripts/verify-symbol-refs.js
 * Exit code 0 = all refs resolve, 1 = unresolved refs found
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

// --- Build the set of known symbol keys from _symbols/*.md frontmatter ---
function getSymbolKeys() {
  const dir = path.join(ROOT, '_symbols');
  const keys = new Set();
  for (const file of fs.readdirSync(dir)) {
    if (!file.endsWith('.md') || file.startsWith('_')) continue;
    const content = fs.readFileSync(path.join(dir, file), 'utf8');
    const m = content.match(/^symbol_key:\s*(.+)$/m);
    if (m) keys.add(m[1].trim());
    // Also add the filename stem as a key (they should match, but be safe)
    keys.add(file.replace(/\.md$/, ''));
  }
  return keys;
}

// --- Same alias map as reader-view.js (keep in sync) ---
const SYMBOL_ALIASES = {
  'four-winds': 'four-horsemen', 'brass': 'bronze-brass',
  'skandalizo': 'skandalizo-stumble', 'whore': 'harlot', 'harlots': 'harlot',
  'thorn': 'thorns', 'thief': 'thief-in-night', 'beast': 'animal',
  'beasts': 'animal', 'stone': 'rock', 'rocks': 'rock', 'waters': 'water',
  'seas': 'sea', 'moon': 'new-moon', 'bride': 'marriage',
  'bridegroom': 'marriage', 'covenant': 'rock', 'wicked': 'wickedness',
  'earthquakes': 'earthquake', 'mountains': 'mountain', 'mount': 'mountain',
  'trees': 'tree', 'nations': 'sea', 'nation': 'sea', 'islands': 'island',
  'eagles': 'eagle', 'shepherds': 'shepherd', 'virgins': 'virgin',
  'cloud': 'clouds', 'trumpets': 'trumpet', 'nets': 'net',
  'snares': 'snare', 'idols': 'idolatry', 'idol': 'idolatry', 'seals': 'seal',
  'names': 'name', 'days': 'day', 'animals': 'animal', 'stars': 'sun-moon-stars',
  'sun': 'sun-moon-stars', 'peace': 'peace-shalom', 'curses': 'curse',
  'cursed': 'curse', 'wars-and-rumors-of-wars': 'wars-rumors',
  'wars and rumors of wars': 'wars-rumors', 'end': 'the-end',
  'earth': 'sea', 'kingdom': 'mountain', 'death': 'perpetual-sleep',
  'dead': 'perpetual-sleep', 'asleep': 'sleep', 'horse': 'four-horsemen',
  'vine': 'wine', 'olive': 'oil', 'fisherman': 'fish', 'pearl': 'sea',
  'pearls': 'sea', 'fear': 'alarmed-fear', 'booths': 'shadow',
  'morning': 'day', 'law': 'way', 'righteousness': 'truth',
  'faithfulness': 'faith', 'believed': 'believe', 'wilderness': 'highway',
  'woman': 'harlot', 'shepherd-king': 'shepherd', 'white': 'light',
  'wheat': 'bread', 'rest': 'sleep', 'life': 'light', 'spirit': 'wind',
  'flesh': 'bread', 'dust': 'sand', 'sorrows': 'birth-pains',
  'rod': 'sword', 'remnant': 'elect',
};

function resolves(rawRef, symbolKeys) {
  const key = rawRef.replace(/\s+/g, '-').toLowerCase().replace(/-+$/, '');
  // Direct match
  if (symbolKeys.has(key)) return true;
  // Alias match
  const aliased = SYMBOL_ALIASES[key] || SYMBOL_ALIASES[rawRef.toLowerCase()];
  if (aliased && symbolKeys.has(aliased)) return true;
  // Plural stripping (trailing 's')
  if (key.endsWith('s') && symbolKeys.has(key.slice(0, -1))) return true;
  return false;
}

function scanFile(filePath, symbolKeys) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const issues = [];
  // Match both $[...] (allowing uppercase) and bare $name (lowercase only)
  const pattern = /\$\[([a-zA-Z][a-zA-Z0-9 -]*[a-zA-Z0-9])\]|\$([a-z][a-z0-9-]*)/g;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Skip YAML frontmatter
    if (i === 0 && line === '---') {
      const endIdx = content.indexOf('\n---', 4);
      if (endIdx > 0) {
        const fmLines = content.substring(0, endIdx).split('\n').length;
        // Skip to after frontmatter by adjusting i only if we're in frontmatter
        if (i < fmLines) { i = fmLines; continue; }
      }
    }
    // Skip code blocks and HTML comments
    if (line.trimStart().startsWith('```') || line.trimStart().startsWith('<!--')) continue;

    let match;
    pattern.lastIndex = 0;
    while ((match = pattern.exec(line)) !== null) {
      const rawRef = match[1] || match[2];
      if (!resolves(rawRef, symbolKeys)) {
        issues.push({
          file: path.relative(ROOT, filePath),
          line: i + 1,
          ref: match[0],
          key: rawRef.replace(/\s+/g, '-').toLowerCase(),
        });
      }
    }
  }
  return issues;
}

function scanDirectory(dirPath, symbolKeys) {
  const issues = [];
  if (!fs.existsSync(dirPath)) return issues;
  for (const file of fs.readdirSync(dirPath)) {
    if (!file.endsWith('.md') || file.startsWith('_')) continue;
    issues.push(...scanFile(path.join(dirPath, file), symbolKeys));
  }
  return issues;
}

// --- Main ---
const symbolKeys = getSymbolKeys();
console.log(`Found ${symbolKeys.size} symbol keys\n`);

const dirs = ['_symbols', '_verses'];
let allIssues = [];

for (const dir of dirs) {
  const issues = scanDirectory(path.join(ROOT, dir), symbolKeys);
  allIssues.push(...issues);
}

if (allIssues.length === 0) {
  console.log('All symbol references resolve successfully.');
  process.exit(0);
} else {
  console.log(`Found ${allIssues.length} unresolved symbol reference(s):\n`);
  for (const issue of allIssues) {
    console.log(`  ${issue.file}:${issue.line}  ${issue.ref}  (key: "${issue.key}")`);
  }
  console.log(`\nTo fix: add the key to _symbols/ as a study, or add an alias in`);
  console.log(`reader-view.js SYMBOL_ALIASES and scripts/verify-symbol-refs.js`);
  process.exit(1);
}
