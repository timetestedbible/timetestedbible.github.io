'use strict';

/**
 * Parser for Project Gutenberg #29765 (Webster's 1913 transcription).
 *
 * Webster's plain text does not mark examples or citations structurally. This
 * module therefore keeps every source slice in a `raw` field and exposes only
 * conservative derived fields. In particular, pronunciation marks are not
 * converted to IPA and Scripture references are normalized only when both the
 * book and chapter/verse syntax are recognized.
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const ROOT = path.resolve(__dirname, '..', '..');
const DEFAULT_DATA_FILE = path.join(
  ROOT,
  'data',
  'dictionaries',
  'webster-1913',
  'webster-1913.txt.gz'
);
const DEFAULT_METADATA_FILE = path.join(
  ROOT,
  'data',
  'dictionaries',
  'webster-1913',
  'metadata.json'
);

const BOOK_ALIASES = {
  'genesis': 'Genesis', 'gen': 'Genesis',
  'exodus': 'Exodus', 'exod': 'Exodus', 'ex': 'Exodus',
  'leviticus': 'Leviticus', 'levit': 'Leviticus', 'lev': 'Leviticus',
  'numbers': 'Numbers', 'numb': 'Numbers', 'num': 'Numbers',
  'deuteronomy': 'Deuteronomy', 'deut': 'Deuteronomy',
  'joshua': 'Joshua', 'josh': 'Joshua',
  'judges': 'Judges', 'judg': 'Judges',
  'ruth': 'Ruth',
  '1 samuel': '1 Samuel', '1 sam': '1 Samuel', '1 sa': '1 Samuel',
  '2 samuel': '2 Samuel', '2 sam': '2 Samuel', '2 sa': '2 Samuel',
  '1 kings': '1 Kings', '1 k': '1 Kings',
  '2 kings': '2 Kings', '2 k': '2 Kings',
  '1 chronicles': '1 Chronicles', '1 chron': '1 Chronicles', '1 cron': '1 Chronicles', '1 chr': '1 Chronicles',
  '2 chronicles': '2 Chronicles', '2 chron': '2 Chronicles', '2 cron': '2 Chronicles', '2 chr': '2 Chronicles',
  'ezra': 'Ezra', 'nehemiah': 'Nehemiah', 'neh': 'Nehemiah',
  'esther': 'Esther', 'esth': 'Esther', 'est': 'Esther',
  'job': 'Job',
  'psalms': 'Psalms', 'psalm': 'Psalms', 'ps': 'Psalms',
  'proverbs': 'Proverbs', 'prov': 'Proverbs',
  'ecclesiastes': 'Ecclesiastes', 'eccles': 'Ecclesiastes', 'eccl': 'Ecclesiastes',
  'song of solomon': 'Song of Solomon', 'song': 'Song of Solomon', 'cant': 'Song of Solomon',
  'isaiah': 'Isaiah', 'isa': 'Isaiah', 'is': 'Isaiah',
  'jeremiah': 'Jeremiah', 'jer': 'Jeremiah',
  'lamentations': 'Lamentations', 'lam': 'Lamentations',
  'ezekiel': 'Ezekiel', 'ezek': 'Ezekiel',
  'daniel': 'Daniel', 'dan': 'Daniel',
  'hosea': 'Hosea', 'hos': 'Hosea', 'joel': 'Joel', 'amos': 'Amos',
  'obadiah': 'Obadiah', 'obad': 'Obadiah', 'jonah': 'Jonah',
  'micah': 'Micah', 'mic': 'Micah', 'nahum': 'Nahum', 'nah': 'Nahum',
  'habakkuk': 'Habakkuk', 'hab': 'Habakkuk',
  'zephaniah': 'Zephaniah', 'zeph': 'Zephaniah',
  'haggai': 'Haggai', 'hag': 'Haggai',
  'zechariah': 'Zechariah', 'zech': 'Zechariah',
  'malachi': 'Malachi', 'mal': 'Malachi',
  'matthew': 'Matthew', 'matt': 'Matthew',
  'mark': 'Mark', 'luke': 'Luke', 'john': 'John', 'acts': 'Acts',
  'romans': 'Romans', 'rom': 'Romans',
  '1 corinthians': '1 Corinthians', '1 cor': '1 Corinthians',
  '2 corinthians': '2 Corinthians', '2 cor': '2 Corinthians',
  'galatians': 'Galatians', 'gal': 'Galatians',
  'ephesians': 'Ephesians', 'ephes': 'Ephesians', 'eph': 'Ephesians',
  'philippians': 'Philippians', 'philip': 'Philippians', 'phil': 'Philippians',
  'colossians': 'Colossians', 'col': 'Colossians',
  '1 thessalonians': '1 Thessalonians', '1 thess': '1 Thessalonians', '1 thes': '1 Thessalonians',
  '2 thessalonians': '2 Thessalonians', '2 thess': '2 Thessalonians', '2 thes': '2 Thessalonians',
  '1 timothy': '1 Timothy', '1 tim': '1 Timothy',
  '2 timothy': '2 Timothy', '2 tim': '2 Timothy',
  'titus': 'Titus', 'tit': 'Titus',
  'philemon': 'Philemon', 'philem': 'Philemon',
  'hebrews': 'Hebrews', 'heb': 'Hebrews',
  'james': 'James', 'jas': 'James',
  '1 peter': '1 Peter', '1 pet': '1 Peter',
  '2 peter': '2 Peter', '2 pet': '2 Peter',
  '1 john': '1 John', '2 john': '2 John', '3 john': '3 John',
  'jude': 'Jude',
  'revelation': 'Revelation', 'rev': 'Revelation'
};

const BOOK_PATTERN = Object.keys(BOOK_ALIASES)
  .sort((a, b) => b.length - a.length)
  .map(alias => alias
    .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    .replace(/^([123]) /, '$1\\.? ')
    .replace(/ /g, '\\s+'))
  .join('|');

// Gutenberg's citations normally look like "Ps. xxiii. 4.". Arabic
// chapter/verse forms and ranges occur as well. The edition suffix is retained.
const SCRIPTURE_PATTERN = new RegExp(
  `\\b(${BOOK_PATTERN})\\.?[ \\t\\n]+([ivxlcdm]+|\\d+)\\.?[ \\t]*(?::[ \\t]*)?` +
  `(\\d+(?:[ \\t]*[-–—][ \\t]*\\d+)?` +
  `(?:[ \\t]*(?:,|\\.|,?[ \\t]+and)[ \\t]*\\d+(?:[ \\t]*[-–—][ \\t]*\\d+)?)*)\\.?` +
  `(?:[ \\t]*\\n?[ \\t]*(\\((?:Rev\\.?[ \\t]*Ver\\.?|R\\.?[ \\t]*V\\.?) ?\\)\\.?))?`,
  'gi'
);

const ATTRIBUTION_PATTERN = new RegExp(
  '(?:Shak|Shakespeare|Milton|Spenser|Dryden|Chaucer|Webster|Keble|Hood|' +
  'Coleridge|Hazlitt|Longfellow|Prior|Moore|Blair|Huxley|Addison|Pope|' +
  'Tennyson|Cowley|Knolles|Hooker|Watts|Macaulay|Mitford|Hawes|Dwight|' +
  'Richardson|Scott|Landor|Swift|Arbuthnot|Luther|Bacon|Burke|' +
  'Book of Common Prayer)\\.?$',
  'i'
);

const PARTS_OF_SPEECH = [
  ['v. t.', 'transitive verb'],
  ['v. i.', 'intransitive verb'],
  ['n.', 'noun'],
  ['a.', 'adjective'],
  ['adv.', 'adverb'],
  ['prep.', 'preposition'],
  ['pron.', 'pronoun'],
  ['conj.', 'conjunction'],
  ['interj.', 'interjection']
];

function normalizeNewlines(text) {
  return String(text || '').replace(/\r\n?/g, '\n');
}

function fold(text) {
  return String(text || '').replace(/\s+/g, ' ').trim();
}

function normalizeHeadword(headword) {
  return fold(headword).toUpperCase();
}

function isHeading(lines, index) {
  const line = lines[index] || '';
  if (!line || line.length > 100 || line !== line.toUpperCase()) return false;
  if (!/^[A-Z][A-Z0-9À-ÖØ-Þ' .,&;()"-]*$/.test(line)) return false;
  if (index > 0 && lines[index - 1] !== '') return false;
  return Boolean(lines[index + 1]);
}

function indexDictionaryText(text) {
  const normalized = normalizeNewlines(text);
  const lines = normalized.split('\n');
  const headings = [];
  const byHeadword = new Map();

  for (let index = 0; index < lines.length; index += 1) {
    if (!isHeading(lines, index)) continue;
    const heading = lines[index];
    const record = { heading, startLine: index, endLine: lines.length };
    if (headings.length) headings[headings.length - 1].endLine = index;
    headings.push(record);
    if (!byHeadword.has(heading)) byHeadword.set(heading, []);
    byHeadword.get(heading).push(record);
  }

  return { text: normalized, lines, headings, byHeadword };
}

function rawEntryFromRange(index, range) {
  return index.lines
    .slice(range.startLine, range.endLine)
    .join('\n')
    .replace(/\n+$/, '');
}

function lookupRawEntries(indexOrText, headword) {
  const index = typeof indexOrText === 'string'
    ? indexDictionaryText(indexOrText)
    : indexOrText;
  const ranges = index.byHeadword.get(normalizeHeadword(headword)) || [];
  return ranges.map(range => rawEntryFromRange(index, range));
}

function readDictionary(dataFile = DEFAULT_DATA_FILE) {
  if (!fs.existsSync(dataFile)) {
    throw new Error(`Webster dataset is missing: ${dataFile}`);
  }
  const bytes = fs.readFileSync(dataFile);
  const text = dataFile.endsWith('.gz') ? zlib.gunzipSync(bytes).toString('utf8') : bytes.toString('utf8');
  return indexDictionaryText(text);
}

function readMetadata(metadataFile = DEFAULT_METADATA_FILE) {
  return JSON.parse(fs.readFileSync(metadataFile, 'utf8'));
}

function romanToInteger(raw) {
  const roman = String(raw || '').toUpperCase();
  if (!roman || !/^[IVXLCDM]+$/.test(roman)) return null;
  const values = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };
  let total = 0;
  for (let index = 0; index < roman.length; index += 1) {
    const value = values[roman[index]];
    const next = values[roman[index + 1]] || 0;
    total += value < next ? -value : value;
  }
  // Reject noncanonical forms rather than guessing at damaged source text.
  const numerals = [
    ['M', 1000], ['CM', 900], ['D', 500], ['CD', 400], ['C', 100],
    ['XC', 90], ['L', 50], ['XL', 40], ['X', 10], ['IX', 9],
    ['V', 5], ['IV', 4], ['I', 1]
  ];
  let remaining = total;
  let canonical = '';
  for (const [symbol, value] of numerals) {
    while (remaining >= value) {
      canonical += symbol;
      remaining -= value;
    }
  }
  return canonical === roman ? total : null;
}

function lineNumberAt(text, offset) {
  let line = 0;
  for (let index = 0; index < offset; index += 1) {
    if (text[index] === '\n') line += 1;
  }
  return line;
}

function normalizeBookAlias(raw) {
  const key = String(raw || '')
    .replace(/\./g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
  return BOOK_ALIASES[key] || null;
}

function parseScriptureReferences(text) {
  const source = normalizeNewlines(text);
  const references = [];
  SCRIPTURE_PATTERN.lastIndex = 0;
  let match;

  while ((match = SCRIPTURE_PATTERN.exec(source)) !== null) {
    const book = normalizeBookAlias(match[1]);
    const chapterRaw = match[2];
    const chapter = /^\d+$/.test(chapterRaw) ? Number(chapterRaw) : romanToInteger(chapterRaw);
    const verseRaw = match[3].trim();
    const verseSpec = verseRaw
      .replace(/,?[ \\t]+and[ \\t]+/gi, ',')
      .replace(/\.(?=[ \\t]*\d)/g, ',')
      .replace(/\s+/g, '')
      .replace(/[–—]/g, '-');
    const verseMatch = verseSpec.match(/^(\d+)(?:-(\d+))?(?:,.*)?$/);
    if (!book || !chapter || !verseMatch) continue;

    const verse = Number(verseMatch[1]);
    const endVerse = verseMatch[2] ? Number(verseMatch[2]) : null;
    const normalized = `${book} ${chapter}:${verseSpec}`;
    references.push({
      raw: match[0],
      bookRaw: match[1],
      chapterRaw,
      verseRaw,
      editionRaw: match[4] || null,
      book,
      chapter,
      verse,
      endVerse,
      normalized,
      link: {
        book,
        chapter,
        verse,
        endVerse,
        href: `/reader/bible/akjv/${encodeURIComponent(book)}/${chapter}.${verse}`
      },
      sourceRange: { start: match.index, end: match.index + match[0].length },
      sourceLines: {
        start: lineNumberAt(source, match.index),
        end: lineNumberAt(source, match.index + match[0].length)
      }
    });
  }
  return references;
}

function parseHeader(raw) {
  const source = normalizeNewlines(raw).trimEnd();
  const etymIndex = source.search(/\bEtym:\s*/);
  let etymology = null;
  let grammarSource = source;

  if (etymIndex >= 0) {
    let end = source.length;
    const bracketStart = source.indexOf('[', etymIndex);
    if (bracketStart >= 0) {
      let depth = 0;
      for (let index = bracketStart; index < source.length; index += 1) {
        if (source[index] === '[') depth += 1;
        if (source[index] === ']') {
          depth -= 1;
          if (depth === 0) {
            end = index + 1;
            break;
          }
        }
      }
    }
    const rawEtymology = source.slice(etymIndex, end);
    etymology = {
      labelRaw: rawEtymology.match(/^Etym:/)?.[0] || 'Etym:',
      raw: rawEtymology,
      text: fold(rawEtymology.replace(/^Etym:\s*/, ''))
    };
    grammarSource = `${source.slice(0, etymIndex)}${source.slice(end)}`.trim();
  }

  const commaIndex = grammarSource.indexOf(',');
  const pronunciationRaw = (commaIndex >= 0 ? grammarSource.slice(0, commaIndex) : grammarSource).trim();
  const grammarRaw = commaIndex >= 0 ? grammarSource.slice(commaIndex + 1).trim() : '';
  const grammarText = fold(grammarRaw);
  const initialGrammar = grammarText.split(/[;\[]/, 1)[0].trim();
  const parts = [];
  for (const [abbreviation, name] of PARTS_OF_SPEECH) {
    const pattern = new RegExp(`(^|[ &])${abbreviation.replace(/\./g, '\\.').replace(/ /g, '\\s*')}(?=$|[ &])`, 'i');
    const match = pattern.exec(initialGrammar);
    if (match) parts.push({ raw: abbreviation, name, sourceIndex: match.index + match[1].length });
  }
  parts.sort((a, b) => a.sourceIndex - b.sourceIndex);
  for (const part of parts) delete part.sourceIndex;

  return {
    raw: source,
    pronunciation: {
      raw: pronunciationRaw,
      notation: 'Webster source respelling; not converted to IPA'
    },
    grammar: { raw: grammarRaw, text: grammarText },
    partsOfSpeech: parts,
    etymology
  };
}

function isSentenceEnd(line) {
  return /(?:[.!?]["')\]]?|\[[A-Za-z. ]+\])$/.test(line.trim());
}

function isAttributionLine(line) {
  return ATTRIBUTION_PATTERN.test(line.trim());
}

function stripLeadingFieldMarkup(lines) {
  const output = [...lines];
  while (output[0] === '') output.shift();
  let definitionLabelRaw = null;
  if (output.length && /^Defn:\s*/.test(output[0])) {
    definitionLabelRaw = output[0].match(/^Defn:/)[0];
    output[0] = output[0].replace(/^Defn:\s*/, '');
  }
  const standaloneLabel = output.findIndex(line => /^Defn:\s*$/.test(line));
  if (standaloneLabel >= 0) {
    definitionLabelRaw = 'Defn:';
    output.splice(standaloneLabel, 1);
  }
  return { lines: output, definitionLabelRaw };
}

function quoteForReference(lines, reference, definitionEndLine, priorReferenceEndLine) {
  const refLine = reference.sourceLines.start;
  let startLine = Math.max(definitionEndLine + 1, priorReferenceEndLine + 1, 0);
  for (let line = startLine; line < refLine; line += 1) {
    if (isAttributionLine(lines[line])) startLine = line + 1;
  }

  const selected = lines.slice(startLine, refLine + 1);
  if (!selected.length) return { quoteRaw: null, quoteText: null };
  const refLineStartOffset = lines.slice(0, refLine).reduce((sum, line) => sum + line.length + 1, 0);
  selected[selected.length - 1] = selected[selected.length - 1]
    .slice(0, Math.max(0, reference.sourceRange.start - refLineStartOffset))
    .trimEnd();
  const quoteRaw = selected.join('\n').trim();
  return { quoteRaw: quoteRaw || null, quoteText: quoteRaw ? fold(quoteRaw) : null };
}

function parseDefinitionUnit(rawLines) {
  const stripped = stripLeadingFieldMarkup(rawLines);
  const lines = stripped.lines;
  while (lines.length && lines[lines.length - 1] === '') lines.pop();
  const raw = lines.join('\n');
  if (!raw.trim()) {
    return {
      definition: null,
      scripture: [],
      examplesRaw: null,
      definitionLabelRaw: stripped.definitionLabelRaw
    };
  }

  const references = parseScriptureReferences(raw);
  const firstReferenceLine = references.length ? references[0].sourceLines.start : Infinity;
  let firstAttributionLine = Infinity;
  for (let index = 0; index < lines.length; index += 1) {
    if (isAttributionLine(lines[index])) {
      firstAttributionLine = index;
      break;
    }
  }
  const firstEvidenceLine = Math.min(firstReferenceLine, firstAttributionLine);
  let definitionEndLine = lines.length - 1;
  if (Number.isFinite(firstEvidenceLine)) {
    definitionEndLine = -1;
    for (let index = 0; index < firstEvidenceLine; index += 1) {
      if (isSentenceEnd(lines[index])) {
        definitionEndLine = index;
        break;
      }
    }
    if (definitionEndLine < 0) definitionEndLine = Math.max(0, firstEvidenceLine - 1);
  }

  let definitionRaw = lines.slice(0, definitionEndLine + 1).join('\n').trim();
  if (Number.isFinite(firstEvidenceLine)) {
    const candidate = lines.slice(0, firstEvidenceLine + 1).join('\n');
    const quoteIndex = candidate.indexOf('"');
    let boundarySource = quoteIndex >= 0 ? candidate.slice(0, quoteIndex) : candidate;
    if (quoteIndex < 0 && firstReferenceLine === firstEvidenceLine) {
      boundarySource = raw.slice(0, references[0].sourceRange.start);
    } else if (quoteIndex < 0 && firstAttributionLine === firstEvidenceLine) {
      boundarySource = boundarySource.replace(ATTRIBUTION_PATTERN, '');
    }
    const boundaryPattern = quoteIndex >= 0
      ? /^([\s\S]*[.!?])(?=\s*$)/
      : /^([\s\S]*?[.!?])(?=\s*$|\s+(?:[A-Z'\[]))/;
    const boundary = boundarySource.match(boundaryPattern);
    const hasCompleteBoundaryBeforeEvidence = lines
      .slice(0, firstEvidenceLine)
      .some(isSentenceEnd);
    if (!hasCompleteBoundaryBeforeEvidence && boundary) {
      definitionRaw = boundary[1].trim();
      definitionEndLine = lineNumberAt(candidate, boundary[1].length);
    }
  }
  // A short definition and its first example occasionally share one physical
  // line. Split only when a recognized citation proves the latter is evidence.
  if (references.length && references[0].sourceLines.start === definitionEndLine) {
    const prefix = lines[definitionEndLine].slice(0, references[0].sourceRange.start);
    const boundary = prefix.match(/^([\s\S]*?[.!?])(?=\s+[A-Z"'])/);
    if (boundary) definitionRaw = boundary[1].trim();
  }

  const scripture = [];
  let priorReferenceEndLine = -1;
  for (const reference of references) {
    const quote = quoteForReference(lines, reference, definitionEndLine, priorReferenceEndLine);
    scripture.push({
      raw: quote.quoteRaw ? `${quote.quoteRaw} ${reference.raw}` : reference.raw,
      quoteRaw: quote.quoteRaw,
      quoteText: quote.quoteText,
      reference
    });
    priorReferenceEndLine = reference.sourceLines.end;
  }

  return {
    definition: definitionRaw ? { raw: definitionRaw, text: fold(definitionRaw) } : null,
    scripture,
    examplesRaw: definitionEndLine < lines.length - 1
      ? lines.slice(definitionEndLine + 1).join('\n').trim() || null
      : null,
    definitionLabelRaw: stripped.definitionLabelRaw
  };
}

function extractDomains(lines) {
  const output = [...lines];
  const domains = [];
  const qualifiers = [];
  while (output[0] === '') output.shift();
  if (!output.length) return { lines: output, domains, qualifiers };

  const match = output[0].match(/^((?:(?:pl|sing)\.\s*)?(?:\([^)]+\)\s*)+)(.*)$/i);
  if (match && !/^\([a-z]\)\s*/.test(output[0])) {
    const prefix = match[1].trim();
    qualifiers.push(prefix);
    for (const domain of prefix.matchAll(/\(([^)]+)\)/g)) domains.push(domain[1]);
    output[0] = match[2];
    if (!output[0]) output.shift();
  } else if (/^(?:pl|sing)\.\s*$/i.test(output[0])) {
    qualifiers.push(output.shift().trim());
  }
  while (output[0] === '') output.shift();
  return { lines: output, domains, qualifiers };
}

function splitSubsenses(lines) {
  const base = [];
  const subsenses = [];
  let current = null;
  for (const line of lines) {
    const match = line.match(/^\(([a-z])\)\s*(.*)$/);
    if (match) {
      current = { labelRaw: `(${match[1]})`, label: match[1], lines: [match[2]] };
      subsenses.push(current);
    } else if (current) {
      current.lines.push(line);
    } else {
      base.push(line);
    }
  }
  return { base, subsenses };
}

function removeAncillaryBlocks(lines) {
  const content = [];
  const notes = [];
  const supplemental = [];
  let target = content;
  for (const line of lines) {
    if (/^Note:\s*/.test(line)) {
      target = [];
      notes.push(target);
    } else if (/^(?:Syn\.|\s*--)/.test(line)) {
      target = supplemental;
    }
    target.push(line);
  }
  return {
    content,
    notes: notes.map(block => ({ raw: block.join('\n').trim(), text: fold(block.join('\n').replace(/^Note:\s*/, '')) })),
    supplementalRaw: supplemental.join('\n').trim() || null
  };
}

function parseSense(group) {
  const raw = group.rawLines.join('\n').trimEnd();
  const extracted = extractDomains(group.payloadLines);
  const ancillary = removeAncillaryBlocks(extracted.lines);
  const split = splitSubsenses(ancillary.content);
  const main = parseDefinitionUnit(split.base);
  const subsenses = split.subsenses.map(subsense => {
    const parsed = parseDefinitionUnit(subsense.lines);
    return {
      label: subsense.label,
      labelRaw: subsense.labelRaw,
      raw: `${subsense.labelRaw} ${subsense.lines.join('\n')}`.trimEnd(),
      definitionLabelRaw: parsed.definitionLabelRaw,
      definition: parsed.definition,
      examplesRaw: parsed.examplesRaw,
      scripture: parsed.scripture
    };
  });
  const scripture = [
    ...main.scripture,
    ...subsenses.flatMap(subsense => subsense.scripture)
  ];

  return {
    number: group.number,
    labelRaw: group.labelRaw,
    raw,
    qualifiersRaw: extracted.qualifiers,
    domains: extracted.domains,
    definitionLabelRaw: main.definitionLabelRaw,
    definition: main.definition,
    examplesRaw: main.examplesRaw,
    notes: ancillary.notes,
    supplementalRaw: ancillary.supplementalRaw,
    subsenses,
    scripture
  };
}

function groupSenseLines(bodyLines) {
  const groups = [];
  const preamble = [];
  let current = null;

  for (const line of bodyLines) {
    const numbered = line.match(/^(\d+)\.\s*(.*)$/);
    if (numbered) {
      current = {
        number: Number(numbered[1]),
        labelRaw: `${numbered[1]}.`,
        rawLines: [line],
        payloadLines: [numbered[2]]
      };
      groups.push(current);
    } else if (!current && /^Defn:\s*/.test(line)) {
      current = { number: null, labelRaw: 'Defn:', rawLines: [line], payloadLines: [line] };
      groups.push(current);
    } else if (current) {
      current.rawLines.push(line);
      current.payloadLines.push(line);
    } else {
      preamble.push(line);
    }
  }
  return { groups, preambleRaw: preamble.join('\n').trim() || null };
}

function parseEntry(rawEntry, ordinal = 1) {
  const raw = normalizeNewlines(rawEntry).replace(/^\n+|\n+$/g, '');
  const lines = raw.split('\n');
  const headingRaw = lines.shift() || '';
  const headerLines = [];
  while (lines.length && lines[0] !== '') headerLines.push(lines.shift());
  while (lines[0] === '') lines.shift();
  const header = parseHeader(headerLines.join('\n'));
  const grouped = groupSenseLines(lines);
  const senses = grouped.groups.map(parseSense);

  return {
    ordinal,
    headingRaw,
    headword: normalizeHeadword(headingRaw),
    raw,
    header,
    pronunciation: header.pronunciation,
    etymology: header.etymology,
    preambleRaw: grouped.preambleRaw,
    senses,
    scripture: senses.flatMap(sense => sense.scripture)
  };
}

function parseHeadword(indexOrText, query, metadata = null) {
  const index = typeof indexOrText === 'string'
    ? indexDictionaryText(indexOrText)
    : indexOrText;
  const rawEntries = lookupRawEntries(index, query);
  const normalized = normalizeHeadword(query);
  return {
    schemaVersion: 1,
    query,
    headword: normalized,
    source: metadata ? {
      id: metadata.id,
      title: metadata.title,
      sourceUrl: metadata.sourceUrl,
      sha256: metadata.sha256
    } : null,
    entryCount: rawEntries.length,
    entries: rawEntries.map((raw, index) => parseEntry(raw, index + 1))
  };
}

module.exports = {
  DEFAULT_DATA_FILE,
  DEFAULT_METADATA_FILE,
  indexDictionaryText,
  isHeading,
  lookupRawEntries,
  normalizeHeadword,
  parseEntry,
  parseHeadword,
  parseScriptureReferences,
  readDictionary,
  readMetadata,
  romanToInteger
};
