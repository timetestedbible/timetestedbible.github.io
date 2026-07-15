#!/usr/bin/env node

'use strict';

const fs = require('fs');
const path = require('path');
const {
  DEFAULT_DATA_FILE,
  parseHeadword,
  readDictionary,
  readMetadata
} = require('./lib/webster-1913');

function usage(stream = process.stderr) {
  stream.write(`Usage:
  node scripts/parse-webster-1913.js <headword> [--compact] [--output FILE]
  node scripts/parse-webster-1913.js --headword WORD [--headword WORD ...] [--jsonl]
  node scripts/parse-webster-1913.js --headwords-file FILE [--jsonl] [--output FILE]

Options:
  --headword WORD       Add one headword; may be repeated (quote multiword terms)
  --headwords-file FILE Read one headword per line; blank lines and # comments ignored
  --jsonl               Write one compact JSON object per headword
  --compact             Write compact JSON instead of indented JSON
  --output FILE         Write to FILE instead of stdout
  --data FILE           Read a .txt or .txt.gz Webster source (defaults to pinned data)
  --help                 Show this help
`);
}

function takeValue(args, index, option) {
  if (index + 1 >= args.length) throw new Error(`${option} requires a value`);
  return args[index + 1];
}

function parseArguments(args) {
  const options = {
    headwords: [],
    positional: [],
    headwordsFile: null,
    jsonl: false,
    compact: false,
    output: null,
    dataFile: DEFAULT_DATA_FILE,
    help: false
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '--headword') {
      options.headwords.push(takeValue(args, index, arg));
      index += 1;
    } else if (arg === '--headwords-file') {
      options.headwordsFile = takeValue(args, index, arg);
      index += 1;
    } else if (arg === '--output') {
      options.output = takeValue(args, index, arg);
      index += 1;
    } else if (arg === '--data') {
      options.dataFile = takeValue(args, index, arg);
      index += 1;
    } else if (arg === '--jsonl') {
      options.jsonl = true;
    } else if (arg === '--compact') {
      options.compact = true;
    } else if (arg === '--help' || arg === '-h') {
      options.help = true;
    } else if (arg.startsWith('--')) {
      throw new Error(`Unknown option: ${arg}`);
    } else {
      options.positional.push(arg);
    }
  }
  return options;
}

function loadHeadwords(options) {
  const headwords = [...options.headwords];
  if (options.positional.length) {
    if (options.headwords.length || options.headwordsFile) {
      throw new Error('Use either a positional headword or --headword/--headwords-file');
    }
    headwords.push(options.positional.join(' '));
  }
  if (options.headwordsFile) {
    const list = fs.readFileSync(options.headwordsFile, 'utf8')
      .replace(/\r\n?/g, '\n')
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('#'));
    headwords.push(...list);
  }
  return [...new Set(headwords.map(value => value.trim()).filter(Boolean))];
}

function serialize(results, options) {
  if (options.jsonl) return `${results.map(result => JSON.stringify(result)).join('\n')}\n`;
  const value = results.length === 1 ? results[0] : results;
  return `${JSON.stringify(value, null, options.compact ? 0 : 2)}\n`;
}

function main() {
  let options;
  try {
    options = parseArguments(process.argv.slice(2));
  } catch (error) {
    console.error(error.message);
    usage();
    process.exit(2);
  }

  if (options.help) {
    usage(process.stdout);
    return;
  }

  let headwords;
  try {
    headwords = loadHeadwords(options);
  } catch (error) {
    console.error(error.message);
    process.exit(2);
  }
  if (!headwords.length) {
    usage();
    process.exit(2);
  }

  let dictionary;
  let metadata = null;
  try {
    dictionary = readDictionary(path.resolve(options.dataFile));
    // Alternate fixture/source files should not inherit the pinned dataset's
    // provenance. The default source includes its checksum metadata.
    if (path.resolve(options.dataFile) === path.resolve(DEFAULT_DATA_FILE)) {
      metadata = readMetadata();
    }
  } catch (error) {
    console.error(error.message);
    process.exit(2);
  }

  const results = headwords.map(headword => parseHeadword(dictionary, headword, metadata));
  const output = serialize(results, options);
  if (options.output) {
    fs.writeFileSync(path.resolve(options.output), output);
  } else {
    process.stdout.write(output);
  }

  if (results.some(result => result.entryCount === 0)) process.exitCode = 1;
}

main();
