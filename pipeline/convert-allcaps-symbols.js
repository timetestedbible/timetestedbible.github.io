#!/usr/bin/env node
/**
 * Convert ALLCAPS symbol references to $symbol-key format in _symbols/*.md
 *
 * Scans body text (below frontmatter) for ALLCAPS words that match symbol
 * dictionary names and converts them to the $key format.
 *
 * Skips:
 *   - YAML frontmatter (between --- delimiters)
 *   - Markdown headings (# lines)
 *   - Code blocks (``` fenced)
 *   - Inside existing $symbol-key or $[name] references
 *   - Inside HTML tags/attributes
 *   - Inside Scripture quotes (> blockquotes) — uses $[key] to preserve case
 *   - The symbol's own name in its own study file (self-reference)
 *   - Common false positives: LORD, GOD, KJV, ASV, LXX, OT, NT, etc.
 *
 * Usage:
 *   node pipeline/convert-allcaps-symbols.js          # dry run (shows changes)
 *   node pipeline/convert-allcaps-symbols.js --write   # apply changes
 */

const fs = require('fs');
const path = require('path');

const SYMBOLS_DIR = path.join(__dirname, '..', '_symbols');
const DICT_FILE = path.join(__dirname, '..', 'symbol-dictionary.js');

// Words that should NEVER be converted (common ALLCAPS that aren't symbol refs)
const SKIP_WORDS = new Set([
  'LORD', 'GOD', 'YHWH', 'KJV', 'ASV', 'LXX', 'OT', 'NT', 'DNA', 'BC', 'AD',
  'THE', 'AND', 'BUT', 'FOR', 'NOT', 'ARE', 'WAS', 'HIS', 'HER', 'ALL',
  'WHO', 'HOW', 'WHY', 'OUT', 'HAS', 'HAD', 'ITS', 'ONE', 'TWO', 'USE',
  'DID', 'LET', 'OLD', 'NEW', 'OWN', 'SET', 'SAY', 'PUT', 'RAN', 'ATE',
  'SAW', 'GET', 'GOT', 'MAY', 'MAN', 'MEN', 'SON', 'WAR', 'END', 'DAM',
  'BIG', 'ACT', 'CUT', 'RUN', 'WAY', 'SEE', 'NOR', 'YET', 'RED', 'YES',
  'WITH', 'FROM', 'BOTH', 'SAME', 'ONLY', 'THIS', 'THAT', 'WHAT', 'WHEN',
  'THEN', 'THEM', 'THEY', 'WERE', 'BEEN', 'HAVE', 'DOES', 'WILL', 'MUST',
  'ALSO', 'EACH', 'INTO', 'THAN', 'VERY', 'JUST', 'LIKE', 'OVER', 'SUCH',
  'SOME', 'MORE', 'MOST', 'UPON', 'SAID', 'KING', 'HOLY', 'WORD', 'LAND',
  'COME', 'CAME', 'CITY', 'MADE', 'MAKE', 'GIVE', 'GAVE', 'TAKE', 'TOOK',
  'KNOW', 'KNEW', 'WENT', 'SENT', 'TOLD', 'CALL', 'HEAR', 'LEFT', 'TURN',
  'BURN', 'FALL', 'FELL', 'RISE', 'ROSE', 'BORN', 'DEAD', 'KILL', 'WALK',
  'KEEP', 'HELD', 'OPEN', 'PASS', 'SEEK', 'FIND', 'LOST', 'SIGN', 'TRUE',
  'DEEP', 'HIGH', 'LONG', 'FULL', 'LAST', 'NEXT', 'EVEN', 'STILL', 'GREAT',
  'EVERY', 'NEVER', 'WHERE', 'THOSE', 'THESE', 'THEIR', 'OTHER', 'UNDER',
  'AFTER', 'BEING', 'ABOUT', 'ABOVE', 'BELOW', 'COULD', 'WOULD', 'SHALL',
  'WHILE', 'FIRST', 'SINCE', 'THREE', 'SEVEN', 'FORTY', 'HUNDRED', 'HOUSE',
  'EARTH', 'WORLD', 'FLESH', 'SPIRIT', 'DEATH', 'PLACE', 'WHOLE',
  'PEOPLE', 'THOSE', 'WHICH', 'THERE', 'BEFORE', 'DURING', 'THROUGH',
  'BETWEEN', 'WITHOUT', 'WITHIN', 'AGAINST', 'BECAUSE', 'ANOTHER',
  'MOTHER', 'FATHER', 'PRIEST', 'TEMPLE', 'HEAVEN', 'GLORY',
  'MYSTERY', 'ABOMINATIONS', 'HOLINESS',
  'HARLOTS', // plural of HARLOT — handled as $harlot in the right context
]);

// Build name → key mapping from symbol-dictionary.js
function buildSymbolMap() {
  const content = fs.readFileSync(DICT_FILE, 'utf-8');
  const map = {};

  const entries = [...content.matchAll(/'([a-z][a-z0-9-]*)': \{[\s\S]*?name: '([^']+)'/g)];
  for (const m of entries) {
    const key = m[1];
    const name = m[2]; // e.g. "FOUR HORSEMEN"
    map[name] = key;
  }
  return map;
}

function processFile(filePath, symbolMap, doWrite) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const fileName = path.basename(filePath, '.md');

  // Split into frontmatter and body
  const fmMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!fmMatch) return { file: fileName, changes: 0 };

  const frontmatter = fmMatch[1];
  let body = fmMatch[2];

  // Find the symbol key for this file (self-reference detection)
  const selfKeyMatch = frontmatter.match(/symbol_key:\s*(\S+)/);
  const selfKey = selfKeyMatch ? selfKeyMatch[1] : fileName;
  const selfName = Object.entries(symbolMap).find(([n, k]) => k === selfKey)?.[0];

  // Sort symbol names by length (longest first) to match multi-word names first
  const sortedNames = Object.keys(symbolMap).sort((a, b) => b.length - a.length);

  // Build regex: match ALLCAPS symbol names as whole words
  // Only match names that are 3+ chars to avoid false positives
  const namePatterns = sortedNames
    .filter(name => name.length >= 3)
    .filter(name => !SKIP_WORDS.has(name))
    .map(name => name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));

  if (namePatterns.length === 0) return { file: fileName, changes: 0 };

  const pattern = new RegExp(`\\b(${namePatterns.join('|')})\\b`, 'g');

  let changes = 0;
  const details = [];

  // Process body line by line to handle context
  const lines = body.split('\n');
  let inCodeBlock = false;
  let inFrontmatter = false;

  const processedLines = lines.map((line, lineIdx) => {
    // Track code blocks
    if (line.trim().startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      return line;
    }
    if (inCodeBlock) return line;

    // Skip headings
    if (line.match(/^#{1,6}\s/)) return line;

    // Skip HTML-heavy lines
    if (line.match(/^\s*</) || line.match(/<[a-z]/i)) return line;

    // Skip lines that are just frontmatter-like (shouldn't happen after split, but safety)
    if (line.trim() === '---') return line;

    const isBlockquote = line.trimStart().startsWith('>');

    // Process matches on this line
    let result = '';
    let lastIdx = 0;
    let lineChanged = false;

    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(line)) !== null) {
      const matchText = match[1];
      const matchStart = match.index;
      const key = symbolMap[matchText];

      if (!key) continue;

      // Skip self-references (the symbol's own name in its own file)
      if (key === selfKey) continue;

      // Check context before the match — skip if inside $ref or $[ref]
      const before = line.substring(0, matchStart);
      // Already inside a $key reference?
      if (before.match(/\$[a-z][a-z0-9-]*$/)) continue;
      // Inside $[...] bracket reference?
      if (before.match(/\$\[[^\]]*$/)) continue;
      // Inside markdown link text or URL
      if (before.match(/\[[^\]]*$/) || before.match(/\]\([^)]*$/)) continue;
      // Inside an HTML attribute
      if (before.match(/<[^>]*$/)) continue;

      // Determine replacement format
      let replacement;
      if (isBlockquote) {
        // Inside Scripture quotes, use $[key] to preserve display text
        replacement = `$[${key}]`;
      } else {
        // Normal text, use $key (renders as dictionary name)
        replacement = `$${key}`;
      }

      result += line.substring(lastIdx, matchStart) + replacement;
      lastIdx = matchStart + matchText.length;
      lineChanged = true;
      changes++;
      details.push({
        line: lineIdx + 1,
        from: matchText,
        to: replacement,
        context: line.trim().substring(0, 80)
      });
    }

    if (lineChanged) {
      result += line.substring(lastIdx);
      return result;
    }
    return line;
  });

  if (changes > 0 && doWrite) {
    const newContent = `---\n${frontmatter}\n---\n${processedLines.join('\n')}`;
    fs.writeFileSync(filePath, newContent);
  }

  return { file: fileName, changes, details };
}

// Main
const doWrite = process.argv.includes('--write');
const symbolMap = buildSymbolMap();

console.log(`Symbol dictionary: ${Object.keys(symbolMap).length} symbols`);
console.log(`Mode: ${doWrite ? 'WRITE (applying changes)' : 'DRY RUN (preview only)'}`);
console.log('');

const files = fs.readdirSync(SYMBOLS_DIR)
  .filter(f => f.endsWith('.md'))
  .sort();

let totalChanges = 0;
let filesChanged = 0;

for (const file of files) {
  const filePath = path.join(SYMBOLS_DIR, file);
  const result = processFile(filePath, symbolMap, doWrite);

  if (result.changes > 0) {
    filesChanged++;
    totalChanges += result.changes;
    console.log(`${result.file}: ${result.changes} change(s)`);
    for (const d of result.details) {
      console.log(`  L${d.line}: ${d.from} → ${d.to}`);
    }
    console.log('');
  }
}

console.log('─'.repeat(50));
console.log(`Total: ${totalChanges} changes in ${filesChanged}/${files.length} files`);
if (!doWrite && totalChanges > 0) {
  console.log(`\nRun with --write to apply: node pipeline/convert-allcaps-symbols.js --write`);
}
