#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const ROOT = path.resolve(__dirname, '..');
const DATA_FILE = path.join(
  ROOT,
  'data',
  'dictionaries',
  'webster-1913',
  'webster-1913.txt.gz'
);
const METADATA_FILE = path.join(
  ROOT,
  'data',
  'dictionaries',
  'webster-1913',
  'metadata.json'
);

const args = process.argv.slice(2);
const jsonOutput = args.includes('--json');
const query = args.filter(arg => arg !== '--json').join(' ').trim();

if (!query) {
  console.error('Usage: node scripts/lookup-webster-1913.js <headword> [--json]');
  process.exit(2);
}
if (!fs.existsSync(DATA_FILE)) {
  console.error('Webster dataset is missing. Run ./scripts/fetch-webster-1913.sh');
  process.exit(2);
}

const text = zlib.gunzipSync(fs.readFileSync(DATA_FILE))
  .toString('utf8')
  .replace(/\r/g, '');
const lines = text.split('\n');
const wanted = query.toUpperCase();

function isHeading(index) {
  const line = lines[index] || '';
  if (!line || line.length > 100 || line !== line.toUpperCase()) return false;
  if (!/^[A-Z][A-Z0-9À-ÖØ-Þ' .,&;()"-]*$/.test(line)) return false;
  if (index > 0 && lines[index - 1] !== '') return false;
  return Boolean(lines[index + 1]);
}

let start = -1;
for (let index = 0; index < lines.length; index += 1) {
  if (lines[index] === wanted && isHeading(index)) {
    start = index;
    break;
  }
}

if (start < 0) {
  console.error(`No exact Webster headword found for: ${query}`);
  process.exit(1);
}

let end = lines.length;
for (let index = start + 1; index < lines.length; index += 1) {
  if (isHeading(index)) {
    end = index;
    break;
  }
}

const entry = lines.slice(start, end).join('\n').trim();
const metadata = JSON.parse(fs.readFileSync(METADATA_FILE, 'utf8'));

if (jsonOutput) {
  process.stdout.write(`${JSON.stringify({
    headword: wanted,
    entry,
    source: metadata.id,
    sourceUrl: metadata.sourceUrl,
    sha256: metadata.sha256
  }, null, 2)}\n`);
} else {
  process.stdout.write(`${entry}\n`);
}
