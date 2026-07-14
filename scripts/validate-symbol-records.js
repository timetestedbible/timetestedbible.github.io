#!/usr/bin/env node

/**
 * Validate canonical `_symbols/*.md` records while they are migrated to the
 * structured record format documented in
 * books/symbolic-language/research/SYMBOL-REPOSITORY.md.
 *
 * During migration the book glossary remains the definition authority. A
 * versioned record's `definition` must therefore match the corresponding
 * glossary entry after presentation markup is removed. Newer research belongs
 * in `research.candidate_definition` until the glossary change is approved.
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const ROOT = path.resolve(__dirname, '..');
const SYMBOLS_DIR = path.join(ROOT, '_symbols');
const GLOSSARY_FILE = path.join(ROOT, 'books', 'symbolic-language', '49-glossary.adoc');

function parseMarkdown(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) return { frontmatter: {}, body: '' };
  return {
    frontmatter: yaml.load(match[1]) || {},
    body: match[2]
  };
}

function stripAsciiDoc(value) {
  return String(value || '')
    .replace(/\s+verdict:[a-z-]+\[\]/g, '')
    .replace(/sym:sym-[a-z0-9-]+\[([^\]]*)\]/g, '$1')
    .replace(/link:[^\[\s]+\[([^\]]*)\](?:\[\.chnum\]#)?/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/\b_([^_]+)_\b/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseGlossary(content) {
  const entries = new Map();
  for (const line of content.split(/\r?\n/)) {
    const match = line.match(/^\[\[(sym-([a-z0-9-]+))\]\](.+?)::\s*(.*?)\s*\+?\s*$/);
    if (!match) continue;
    entries.set(match[2], {
      anchor: match[1],
      term: stripAsciiDoc(match[3]),
      definition: stripAsciiDoc(match[4])
    });
  }
  return entries;
}

function sameText(a, b) {
  return stripAsciiDoc(a) === stripAsciiDoc(b);
}

function sourcePath(source) {
  return path.join(ROOT, String(source || '').split('#')[0]);
}

function pushMissing(errors, key, frontmatter, fields) {
  for (const field of fields) {
    if (frontmatter[field] === undefined || frontmatter[field] === null || frontmatter[field] === '') {
      errors.push(`${key}: missing required field '${field}'`);
    }
  }
}

const glossary = parseGlossary(fs.readFileSync(GLOSSARY_FILE, 'utf8'));
const files = fs.readdirSync(SYMBOLS_DIR)
  .filter(file => file.endsWith('.md') && !file.startsWith('_'))
  .sort();

const errors = [];
const warnings = [];
const migratedKeys = [];
let migrated = 0;
let aliases = 0;

for (const file of files) {
  const key = path.basename(file, '.md');
  const fullPath = path.join(SYMBOLS_DIR, file);
  const { frontmatter, body } = parseMarkdown(fs.readFileSync(fullPath, 'utf8'));

  if (!frontmatter.record_version) continue;
  migrated += 1;
  migratedKeys.push(key);

  pushMissing(errors, key, frontmatter, [
    'record_version', 'record_type', 'symbol_key', 'term', 'words'
  ]);

  if (frontmatter.record_version !== 1) {
    errors.push(`${key}: unsupported record_version '${frontmatter.record_version}'`);
  }
  if (frontmatter.symbol_key !== key) {
    errors.push(`${key}: symbol_key '${frontmatter.symbol_key}' does not match its filename`);
  }
  if (!['symbol', 'word', 'alias'].includes(frontmatter.record_type)) {
    errors.push(`${key}: record_type must be symbol, word, or alias`);
  }

  if (frontmatter.record_type === 'alias') {
    aliases += 1;
    if (!frontmatter.alias_of) errors.push(`${key}: alias record is missing alias_of`);
    if (frontmatter.definition) errors.push(`${key}: alias records must not repeat a definition`);
    if (frontmatter.research) errors.push(`${key}: alias records must not repeat research evidence`);
    continue;
  }

  pushMissing(errors, key, frontmatter, ['definition', 'meaning', 'definition_meta']);
  const meta = frontmatter.definition_meta || {};
  if (meta.authority !== 'book-glossary') {
    errors.push(`${key}: definition_meta.authority must be 'book-glossary' during migration`);
  }
  if (!['approved', 'draft'].includes(meta.status)) {
    errors.push(`${key}: definition_meta.status must be approved or draft`);
  }
  if (!meta.source) {
    errors.push(`${key}: definition_meta.source is required`);
  } else if (!fs.existsSync(sourcePath(meta.source))) {
    errors.push(`${key}: definition source does not exist: ${meta.source}`);
  }

  const definitions = frontmatter.definitions || {};
  const symbolicDefinition = definitions.bible_symbolic || {};
  const literalDefinition = definitions.bible_literal || {};
  const websterDefinition = definitions.webster || {};
  if (!definitions.bible_symbolic) errors.push(`${key}: missing definitions.bible_symbolic layer`);
  if (!definitions.bible_literal) errors.push(`${key}: missing definitions.bible_literal layer`);
  if (!definitions.webster) errors.push(`${key}: missing definitions.webster layer`);

  const layerStatuses = new Set([
    'approved', 'proposed', 'needs-research', 'not-applicable', 'quoted', 'unavailable'
  ]);
  for (const [layer, value] of Object.entries({
    bible_symbolic: symbolicDefinition,
    bible_literal: literalDefinition,
    webster: websterDefinition
  })) {
    if (value.status && !layerStatuses.has(value.status)) {
      errors.push(`${key}: definitions.${layer} has invalid status '${value.status}'`);
    }
    if (value.citations !== undefined && !Array.isArray(value.citations)) {
      errors.push(`${key}: definitions.${layer}.citations must be an array`);
    }
  }

  if (frontmatter.record_type === 'symbol') {
    if (meta.status === 'approved' && !sameText(symbolicDefinition.text, frontmatter.definition)) {
      errors.push(`${key}: Bible symbolic definition must match the approved glossary definition`);
    }
    if (meta.status === 'draft') {
      if (symbolicDefinition.status !== 'proposed') {
        errors.push(`${key}: a draft glossary definition requires a proposed Bible symbolic layer`);
      }
      if (!frontmatter.research?.candidate_definition) {
        errors.push(`${key}: a draft glossary definition requires research.candidate_definition`);
      } else if (!sameText(symbolicDefinition.text, frontmatter.research.candidate_definition)) {
        errors.push(`${key}: proposed Bible symbolic layer must match research.candidate_definition`);
      }
    } else if (!symbolicDefinition.status) {
      errors.push(`${key}: Bible symbolic definition is missing status`);
    }
  } else if (frontmatter.record_type === 'word') {
    if (!sameText(literalDefinition.text, frontmatter.definition)) {
      errors.push(`${key}: recovered Word must place its approved meaning under definitions.bible_literal`);
    }
    if (symbolicDefinition.status !== 'not-applicable') {
      warnings.push(`${key}: recovered Word should not claim a separate symbolic sense without review`);
    }
  }

  if (literalDefinition.status === 'needs-research' && literalDefinition.text) {
    warnings.push(`${key}: Bible literal layer has text but remains marked needs-research`);
  }
  if (literalDefinition.status !== 'needs-research' && literalDefinition.status !== 'not-applicable' && !literalDefinition.text) {
    errors.push(`${key}: Bible literal layer status '${literalDefinition.status}' requires text`);
  }

  const glossaryEntry = glossary.get(key);
  if (!glossaryEntry) {
    errors.push(`${key}: no matching [[sym-${key}]] entry in the book glossary`);
  } else if (!sameText(frontmatter.definition, glossaryEntry.definition)) {
    errors.push(
      `${key}: approved definition drifts from the book glossary\n` +
      `  record:   ${stripAsciiDoc(frontmatter.definition)}\n` +
      `  glossary: ${glossaryEntry.definition}`
    );
  }

  const research = frontmatter.research || {};
  if (research.status === 'awaiting-review' && !research.candidate_definition) {
    errors.push(`${key}: awaiting-review research requires candidate_definition`);
  }
  for (const source of research.source_files || []) {
    if (!fs.existsSync(sourcePath(source))) {
      errors.push(`${key}: research source does not exist: ${source}`);
    }
  }

  const relationships = frontmatter.relationships || {};
  const opposites = relationships.opposites || [];
  if (frontmatter.opposite && !opposites.includes(frontmatter.opposite)) {
    errors.push(`${key}: legacy opposite '${frontmatter.opposite}' is absent from relationships.opposites`);
  }

  for (const sense of frontmatter.senses || []) {
    if (!sense.id || !sense.status || !sense.summary || !Array.isArray(sense.citations)) {
      errors.push(`${key}: every sense requires id, status, summary, and citations[]`);
    }
    if (!['approved', 'proposed', 'rejected'].includes(sense.status)) {
      errors.push(`${key}: sense '${sense.id || '?'}' has invalid status '${sense.status}'`);
    }
  }

  for (const example of frontmatter.usage_examples || []) {
    if (!example.reference || !Array.isArray(example.modes) || !example.modes.length) {
      errors.push(`${key}: every usage example requires reference and modes[]`);
      continue;
    }
    for (const mode of example.modes) {
      if (!['literal', 'symbolic'].includes(mode)) {
        errors.push(`${key}: usage example '${example.reference}' has invalid mode '${mode}'`);
      }
    }
  }

  const requiredHeadings = [
    '## Definition Layers',
    '## Corpus and Method',
    '## Competing Definitions Tested',
    '## Relationship to Other Symbols',
    '## Conclusion'
  ];
  const definitionHeading = meta.status === 'draft' ? '## Current Glossary Draft' : '## Approved Definition';
  if (!body.includes(definitionHeading)) warnings.push(`${key}: prose study is missing '${definitionHeading}'`);
  for (const heading of requiredHeadings) {
    if (!body.includes(heading)) warnings.push(`${key}: prose study is missing '${heading}'`);
  }
}

const unmigrated = files.length - migrated;
const recordKeys = files.map(file => path.basename(file, '.md'));
const recordKeySet = new Set(recordKeys);
const glossaryKeys = [...glossary.keys()].sort();
const glossaryWithoutRecord = glossaryKeys.filter(key => !recordKeySet.has(key));
const recordsWithoutGlossary = recordKeys.filter(key => !glossary.has(key));
const unmigratedKeys = recordKeys.filter(key => !migratedKeys.includes(key));
const result = {
  collection_files: files.length,
  canonical_records: migrated,
  legacy_or_unclassified_files: unmigrated,
  migrated,
  unmigrated,
  migrated_keys: migratedKeys,
  unmigrated_keys: unmigratedKeys,
  aliases,
  glossary_entries: glossary.size,
  glossary_without_record: glossaryWithoutRecord,
  records_without_glossary: recordsWithoutGlossary,
  errors,
  warnings
};

if (process.argv.includes('--json')) {
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
} else {
  console.log(`Symbol study files: ${files.length}`);
  console.log(`Canonical v1 records: ${migrated}`);
  console.log(`Legacy or unclassified files: ${unmigrated}`);
  console.log(`Glossary entries: ${glossary.size}`);
  console.log(`Glossary entries without a matching study: ${glossaryWithoutRecord.length}`);
  console.log(`Studies without a matching glossary entry: ${recordsWithoutGlossary.length}`);
  if (warnings.length) {
    console.log(`\nWarnings (${warnings.length}):`);
    for (const warning of warnings) console.log(`- ${warning}`);
  }
  if (errors.length) {
    console.error(`\nErrors (${errors.length}):`);
    for (const error of errors) console.error(`- ${error}`);
  } else {
    console.log('\nAll migrated symbol records are valid.');
  }
}

process.exitCode = errors.length ? 1 : 0;
