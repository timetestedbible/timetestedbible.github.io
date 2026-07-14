#!/usr/bin/env node

/**
 * Reconcile every approved glossary entry with an exact same-key website
 * study. Existing prose is preserved; canonical authority metadata and the
 * missing research sections are added. Missing studies are created from the
 * approved definition, its cited Scripture, the local KJV corpus, the local
 * public-domain Webster dataset, and preserved independent objections.
 *
 * Usage:
 *   node scripts/reconcile-symbol-studies.js          # report only
 *   node scripts/reconcile-symbol-studies.js --write  # apply reconciliation
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const yaml = require('js-yaml');

const ROOT = path.resolve(__dirname, '..');
const SYMBOLS_DIR = path.join(ROOT, '_symbols');
const AUDIT_FILE = path.join(ROOT, 'data', 'symbol-support-audit.json');
const BIBLE_FILE = path.join(ROOT, 'bibles', 'kjv_strongs.txt');
const WEBSTER_FILE = path.join(ROOT, 'data', 'dictionaries', 'webster-1913', 'webster-1913.txt.gz');
const WRITE = process.argv.includes('--write');
const PREVIEW = process.argv.find(argument => argument.startsWith('--preview='))?.split('=')[1] || '';
const REPLACE = process.argv.find(argument => argument.startsWith('--replace='))?.split('=')[1] || '';

const BOOK_ALIASES = {
  Genesis: ['Genesis', 'Gen'], Exodus: ['Exodus', 'Ex', 'Exod'], Leviticus: ['Leviticus', 'Lev'],
  Numbers: ['Numbers', 'Num'], Deuteronomy: ['Deuteronomy', 'Deut'], Joshua: ['Joshua', 'Josh'],
  Judges: ['Judges', 'Judg'], Ruth: ['Ruth'], '1 Samuel': ['1 Samuel', '1 Sam', '1Sam'],
  '2 Samuel': ['2 Samuel', '2 Sam', '2Sam'], '1 Kings': ['1 Kings', '1 Kgs', '1 Ki', '1Kgs', '1Ki'],
  '2 Kings': ['2 Kings', '2 Kgs', '2 Ki', '2Kgs', '2Ki'],
  '1 Chronicles': ['1 Chronicles', '1 Chr', '1 Chron', '1Chr'],
  '2 Chronicles': ['2 Chronicles', '2 Chr', '2 Chron', '2Chr'], Ezra: ['Ezra'],
  Nehemiah: ['Nehemiah', 'Neh'], Esther: ['Esther', 'Est'], Job: ['Job'], Psalms: ['Psalms', 'Psalm', 'Ps'],
  Proverbs: ['Proverbs', 'Prov'], Ecclesiastes: ['Ecclesiastes', 'Eccl'],
  'Song of Solomon': ['Song of Solomon', 'Song', 'Canticles'], Isaiah: ['Isaiah', 'Isa'],
  Jeremiah: ['Jeremiah', 'Jer'], Lamentations: ['Lamentations', 'Lam'], Ezekiel: ['Ezekiel', 'Ezek'],
  Daniel: ['Daniel', 'Dan'], Hosea: ['Hosea', 'Hos'], Joel: ['Joel'], Amos: ['Amos'],
  Obadiah: ['Obadiah', 'Obad'], Jonah: ['Jonah'], Micah: ['Micah', 'Mic'], Nahum: ['Nahum', 'Nah'],
  Habakkuk: ['Habakkuk', 'Hab'], Zephaniah: ['Zephaniah', 'Zeph'], Haggai: ['Haggai', 'Hag'],
  Zechariah: ['Zechariah', 'Zech'], Malachi: ['Malachi', 'Mal'], Matthew: ['Matthew', 'Matt', 'Mat'],
  Mark: ['Mark', 'Mk'], Luke: ['Luke', 'Lk'], John: ['John', 'Jn'], Acts: ['Acts'],
  Romans: ['Romans', 'Rom'], '1 Corinthians': ['1 Corinthians', '1 Cor', '1Cor'],
  '2 Corinthians': ['2 Corinthians', '2 Cor', '2Cor'], Galatians: ['Galatians', 'Gal'],
  Ephesians: ['Ephesians', 'Eph'], Philippians: ['Philippians', 'Phil'], Colossians: ['Colossians', 'Col'],
  '1 Thessalonians': ['1 Thessalonians', '1 Thess', '1 Thes', '1Thess'],
  '2 Thessalonians': ['2 Thessalonians', '2 Thess', '2 Thes', '2Thess'],
  '1 Timothy': ['1 Timothy', '1 Tim', '1Tim'], '2 Timothy': ['2 Timothy', '2 Tim', '2Tim'],
  Titus: ['Titus'], Philemon: ['Philemon', 'Phlm'], Hebrews: ['Hebrews', 'Heb'], James: ['James', 'Jas'],
  '1 Peter': ['1 Peter', '1 Pet', '1 Pe', '1Pet'], '2 Peter': ['2 Peter', '2 Pet', '2 Pe', '2Pet'],
  '1 John': ['1 John', '1 Jn', '1John'], '2 John': ['2 John', '2 Jn', '2John'],
  '3 John': ['3 John', '3 Jn', '3John'], Jude: ['Jude'], Revelation: ['Revelation', 'Rev']
};

const ALIAS_LOOKUP = new Map();
for (const [book, aliases] of Object.entries(BOOK_ALIASES)) {
  aliases.forEach(alias => ALIAS_LOOKUP.set(alias.toLowerCase().replace(/\s+/g, ' '), book));
}
const ALIASES_LONGEST_FIRST = [...ALIAS_LOOKUP.keys()].sort((a, b) => b.length - a.length);

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function parseMarkdown(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) return { yamlText: '', frontmatter: {}, body: content };
  return { yamlText: match[1], frontmatter: yaml.load(match[1]) || {}, body: match[2] };
}

function cleanVerse(text) {
  return String(text || '')
    .replace(/\{[^}]+\}/g, '')
    .replace(/\s+([,.;:!?])/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

function loadBible() {
  const verses = new Map();
  const ordered = [];
  for (const line of fs.readFileSync(BIBLE_FILE, 'utf8').split(/\r?\n/).slice(2)) {
    const tab = line.indexOf('\t');
    if (tab < 0) continue;
    const reference = line.slice(0, tab);
    const text = cleanVerse(line.slice(tab + 1));
    const match = reference.match(/^(.+?)\s+(\d+):(\d+)$/);
    if (!match) continue;
    const row = { reference, book: match[1], chapter: Number(match[2]), verse: Number(match[3]), text };
    verses.set(reference, row);
    ordered.push(row);
  }
  return { verses, ordered };
}

function findBookInSegment(segment) {
  const normalized = segment.toLowerCase().replace(/\s+/g, ' ');
  for (const alias of ALIASES_LONGEST_FIRST) {
    const pattern = new RegExp(`(?:^|[^a-z])${escapeRegExp(alias)}\\s+(\\d+)\\s*:`);
    const match = normalized.match(pattern);
    if (match) return { book: ALIAS_LOOKUP.get(alias), chapter: Number(match[1]), index: match.index + match[0].lastIndexOf(match[1]) };
  }
  return null;
}

function expandVerseSpec(book, chapter, spec, bible) {
  const results = [];
  const cleaned = spec.replace(/[–—]/g, '-').replace(/[^0-9,\- ]+.*$/, '').trim();
  for (const part of cleaned.split(',').map(item => item.trim()).filter(Boolean)) {
    const range = part.match(/^(\d+)\s*-\s*(\d+)$/);
    const numbers = range
      ? Array.from({ length: Math.min(30, Number(range[2]) - Number(range[1]) + 1) }, (_, index) => Number(range[1]) + index)
      : /^\d+$/.test(part) ? [Number(part)] : [];
    for (const verse of numbers) {
      const row = bible.verses.get(`${book} ${chapter}:${verse}`);
      if (row) results.push(row);
    }
  }
  return results;
}

function citedVerses(citationString, bible) {
  const results = [];
  let currentBook = '';
  let currentChapter = 0;
  const segments = String(citationString || '')
    .replace(/\b(?:KJV|NKJV|ASV|WEB)\b/g, '')
    .split(/\s*;\s*/)
    .filter(Boolean);
  for (const segment of segments) {
    const found = findBookInSegment(segment);
    let verseSpec = '';
    if (found) {
      currentBook = found.book;
      currentChapter = found.chapter;
      const colon = segment.indexOf(':', Math.max(0, found.index));
      verseSpec = colon >= 0 ? segment.slice(colon + 1) : '';
    } else {
      const match = segment.match(/(?:^|[^0-9])(\d+)\s*:\s*([0-9,\-–— ]+)/);
      if (match && currentBook) {
        currentChapter = Number(match[1]);
        verseSpec = match[2];
      }
    }
    if (currentBook && currentChapter && verseSpec) {
      results.push(...expandVerseSpec(currentBook, currentChapter, verseSpec, bible));
    }
  }
  return [...new Map(results.map(row => [row.reference, row])).values()];
}

function loadWebster() {
  if (!fs.existsSync(WEBSTER_FILE)) return { lines: [], headings: new Map() };
  const lines = zlib.gunzipSync(fs.readFileSync(WEBSTER_FILE)).toString('utf8').replace(/\r/g, '').split('\n');
  const headings = new Map();
  const isHeading = index => {
    const line = lines[index] || '';
    return Boolean(line && line.length <= 100 && line === line.toUpperCase() &&
      /^[A-Z][A-Z0-9À-ÖØ-Þ' .,&;()"-]*$/.test(line) && (index === 0 || lines[index - 1] === '') && lines[index + 1]);
  };
  for (let index = 0; index < lines.length; index += 1) {
    if (isHeading(index) && !headings.has(lines[index])) headings.set(lines[index], index);
  }
  return { lines, headings, isHeading };
}

function dictionaryCandidates(record) {
  const fromTerm = record.term
    .replace(/\([^)]*\)/g, '')
    .replace(/^the\s+/i, '')
    .split(/[,;/]/)
    .map(value => value.trim())
    .filter(Boolean);
  const singular = fromTerm.map(value => value.replace(/ies$/i, 'y').replace(/s$/i, ''));
  return [...new Set([...fromTerm, ...singular].map(value => value.split(/\s+/)[0]).filter(value => value.length > 2))];
}

function dictionaryExcerpt(record, webster) {
  for (const candidate of dictionaryCandidates(record)) {
    const headword = candidate.toUpperCase();
    const start = webster.headings.get(headword);
    if (start === undefined) continue;
    let end = webster.lines.length;
    for (let index = start + 1; index < webster.lines.length; index += 1) {
      if (webster.isHeading(index)) { end = index; break; }
    }
    const raw = webster.lines.slice(start + 1, end).join('\n').trim();
    const paragraphs = raw.split(/\n\s*\n/).filter(Boolean);
    const useful = paragraphs.filter(paragraph => !/^Syn\.|^--/.test(paragraph)).slice(0, 3).join(' ')
      .replace(/\s+/g, ' ').trim();
    const numbered = useful.match(/(?:^|\s)1\.\s+([\s\S]*?)(?=\s+2\.\s|$)/)?.[1];
    const withoutEtymology = useful
      .replace(/^.*?Etym:\s*\[[\s\S]*?\]\s*/, '')
      .replace(/^(?:Defn:\s*)/, '')
      .replace(/^1\.\s*/, '');
    const sense = (numbered || withoutEtymology).trim();
    // Webster often follows the definition immediately with literary examples.
    // Retain the first complete definitional sentence for the comparison layer.
    const firstSentence = sense.match(/^([\s\S]*?[.!?])(?:\s+(?:[“"A-Z])|$)/)?.[1] || sense;
    return { headword, excerpt: firstSentence.trim().slice(0, 500) };
  }
  return null;
}

function searchForms(record, existingWords = []) {
  const values = new Set((existingWords || []).map(String));
  const cleaned = record.term.replace(/\([^)]*\)/g, '').replace(/^the\s+/i, '');
  cleaned.split(/[,;/]/).map(value => value.trim().toLowerCase()).filter(Boolean).forEach(value => values.add(value));
  return [...values]
    .map(value => value.toLowerCase().replace(/[“”"']/g, '').trim())
    .filter(value => value.length >= 3 && value.length <= 45 && !/\b(?:shaqed|kanaph|ruach)\b/.test(value));
}

function occurrenceRegister(forms, bible) {
  if (!forms.length) return { count: 0, verses: [], grouped: [] };
  const patterns = forms.map(form => new RegExp(`(^|[^A-Za-z])${escapeRegExp(form)}(?:s|es|ed|ing)?(?=$|[^A-Za-z])`, 'i'));
  const matches = bible.ordered.filter(row => patterns.some(pattern => pattern.test(row.text)));
  const groupedMap = new Map();
  for (const row of matches) {
    if (!groupedMap.has(row.book)) groupedMap.set(row.book, []);
    groupedMap.get(row.book).push(`${row.chapter}:${row.verse}`);
  }
  return { count: matches.length, verses: matches, grouped: [...groupedMap.entries()] };
}

function quoteBlock(rows, maximum = 8) {
  return rows.slice(0, maximum).map(row => `> *“${row.text}”* — ${row.reference}`).join('\n\n');
}

function sourceLinks(record) {
  const links = [];
  for (const chapter of record.chapterLinks || []) links.push(`[${chapter.title}](${chapter.url})`);
  for (const notebook of record.researchNotebooks || []) links.push(`[${path.basename(notebook)}](/${notebook})`);
  return links;
}

function conciseArgument(record) {
  const summaries = (record.bookSummaries || []).filter(Boolean);
  if (summaries.length) return summaries.sort((a, b) => a.length - b.length)[0];
  return record.definition;
}

function linkedDefinition(record, sourceText = record.definition) {
  let text = sourceText;
  const links = [...(record.symbolLinks || [])]
    .filter(link => link.key !== record.key && link.label)
    .sort((a, b) => b.label.length - a.label.length);
  for (const link of links) {
    const pattern = new RegExp(`(^|[^A-Za-z])(${escapeRegExp(link.label)})(?=$|[^A-Za-z])`, 'i');
    text = text.replace(pattern, (match, prefix, label) => `${prefix}[${label}](/research/symbols/${link.key}/)`);
  }
  return text;
}

function competingSection(record) {
  if (record.experiment?.revisionPending) {
    return 'The approved definition has changed since the preserved independent judgment. Objections aimed at the earlier wording are historical, not evidence against this replacement. The current definition needs a fresh relationship judgment; persuasion is needed only if that new judgment still finds a divergent core.';
  }
  if (!(record.objections || []).length && !record.commonView) {
    return 'No material competing definition is recorded in the current independent review. Literal uses still constrain the symbol: the figurative reading must arise from the passage rather than being imposed on every occurrence.';
  }
  const lines = [];
  if (record.commonView) lines.push(`A common reading is: **${record.commonView}**`);
  for (const objection of (record.objections || []).slice(0, 3)) {
    lines.push(`- ${objection.text}`);
  }
  lines.push('', 'These tests identify the boundary the definition must explain. A shared phrase or nearby theme is not enough by itself; the cited passages must establish the proposed identity and account for the countertexts without changing senses whenever the reading becomes difficult.');
  return lines.join('\n\n');
}

function dictionarySection(record, dictionary) {
  if (!dictionary) {
    return `The local 1913 Webster dataset has no exact headword for **${record.term}** under the display form used by the glossary. The biblical study therefore begins with the ordinary physical or grammatical sense visible in context and tests whether Scripture assigns it a more precise figurative sense.`;
  }
  return `Webster's 1913 entry for **${dictionary.headword.toLowerCase()}** begins:\n\n> “${dictionary.excerpt.replace(/"/g, '”')}”\n\nThe dictionary supplies the ordinary sense. The approved definition above is narrower or figurative only where Scripture's own cross-references require that transfer.`;
}

function definitionLayers(record, existing = {}, dictionary = null) {
  const prior = existing.definitions || {};
  const isWord = record.recordType === 'word';
  const isDraft = existing.definition_meta?.status === 'draft' || existing.definition_status === 'draft';
  const glossarySource = `books/symbolic-language/49-glossary.adoc#sym-${record.key}`;

  const bibleSymbolic = prior.bible_symbolic || (isWord ? {
    text: 'No independent symbolic sense is asserted by this glossary entry.',
    status: 'not-applicable',
    citations: []
  } : {
    text: record.definition,
    status: 'approved',
    authority: 'book-glossary',
    source: glossarySource,
    citations: record.citationTokens || []
  });

  const bibleLiteral = prior.bible_literal || (isWord ? {
    text: record.definition,
    status: 'approved',
    authority: 'book-glossary',
    source: glossarySource,
    citations: record.citationTokens || []
  } : {
    text: null,
    status: 'needs-research',
    citations: [],
    note: 'State this from ordinary biblical uses; do not copy the dictionary definition into this field.'
  });

  const webster = prior.webster || (dictionary ? {
    text: dictionary.excerpt,
    status: 'quoted',
    headword: dictionary.headword,
    source: "Webster's Revised Unabridged Dictionary (1913)"
  } : {
    text: null,
    status: 'unavailable',
    headword: null,
    source: "Webster's Revised Unabridged Dictionary (1913)"
  });

  if (dictionary && webster.status === 'quoted' &&
      webster.source === "Webster's Revised Unabridged Dictionary (1913)") {
    webster.text = dictionary.excerpt;
    webster.headword = dictionary.headword;
  }

  // The glossary remains authoritative even if a stale generated layer is
  // encountered. Richer literal and Webster research is preserved verbatim.
  if (isWord) {
    bibleLiteral.text = record.definition;
    bibleLiteral.status = 'approved';
    bibleLiteral.authority = 'book-glossary';
    bibleLiteral.source = glossarySource;
  } else if (!isDraft) {
    bibleSymbolic.text = record.definition;
    bibleSymbolic.status = 'approved';
    bibleSymbolic.authority = 'book-glossary';
    bibleSymbolic.source = glossarySource;
  }

  return {
    bible_symbolic: bibleSymbolic,
    bible_literal: bibleLiteral,
    webster
  };
}

function definitionComparisonSection(record, definitions) {
  const symbolic = definitions.bible_symbolic;
  const literal = definitions.bible_literal;
  const webster = definitions.webster;
  const symbolicText = symbolic.status === 'not-applicable'
    ? '*No separate symbolic sense is asserted. This entry recovers a biblical word meaning rather than interpreting an image.*'
    : `**${linkedDefinition(record, symbolic.text)}**`;
  const literalText = literal.text
    ? `**${literal.text}**`
    : '*Not yet stated separately. This is a research gap: the literal sense must be derived from ordinary biblical uses, not copied from Webster.*';
  const websterText = webster.text
    ? `Webster's 1913 entry for **${String(webster.headword || record.term).toLowerCase()}** begins: “${String(webster.text).replace(/"/g, '”')}”`
    : `No exact Webster headword has yet been matched to **${record.term}**.`;

  return `## Definition Layers

### Bible symbolic sense

${symbolicText}

### Bible literal sense

${literalText}

### Webster's English sense

${websterText}

These layers may agree, but they are independent evidence. A biblical passage may use the term literally, symbolically, or both at the same time; the literal properties remain part of the logic when Scripture uses the object as a symbol.`;
}

function corpusSection(record, forms, register) {
  const formText = forms.length ? forms.map(form => `*${form}*`).join(', ') : 'the display term';
  return `This study checks the glossary's defining citations first, then compares them with every KJV verse that prints ${formText}. The English-form sweep found **${register.count} verse${register.count === 1 ? '' : 's'}**. It is exhaustive for those printed forms, but it is not a substitute for a Strong's-number sweep where several Hebrew or Greek words share one English translation.`;
}

function occurrenceSection(register) {
  if (!register.grouped.length) return 'No exact KJV English-form occurrences were found under the display forms searched. The defining citations and underlying Hebrew or Greek terms therefore govern this entry.';
  const registerText = register.grouped.map(([book, refs]) => `**${book}:** ${refs.join(', ')}`).join('\n\n');
  return `<details markdown="1">\n<summary>Show the complete ${register.count}-verse English-form register</summary>\n\n${registerText}\n\n</details>`;
}

function approvedFrontmatter(record, existing = {}, dictionary = null) {
  const words = searchForms(record, existing.words || []);
  const oppositeKey = record.opposite ? String(record.opposite).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') : '';
  const definitionStatus = existing.definition_meta?.status === 'draft' || existing.definition_status === 'draft'
    ? 'draft'
    : 'approved';
  const frontmatter = {
    ...existing,
    layout: existing.layout || 'symbol-study',
    record_version: 1,
    record_type: record.recordType,
    symbol_key: record.key,
    term: record.term,
    title: existing.title || `${record.term} — Symbol Research`,
    description: existing.description || `A Scripture-first study of ${record.term}: ${record.definition}`,
    words: existing.words?.length ? existing.words : words,
    definition: record.definition,
    meaning: existing.meaning || record.definition,
    definition_status: definitionStatus,
    definition_meta: {
      authority: 'book-glossary',
      status: definitionStatus,
      source: `books/symbolic-language/49-glossary.adoc#sym-${record.key}`,
      verdict: record.glossaryVerdict
    },
    definitions: definitionLayers(record, existing, dictionary),
    classification: record.recordType,
    relationships: {
      ...(existing.relationships || {}),
      opposites: existing.relationships?.opposites || (oppositeKey ? [oppositeKey] : []),
      related: existing.relationships?.related || []
    },
    research: {
      ...(existing.research || {}),
      status: existing.research?.candidate_definition ? 'awaiting-review' : 'documented',
      source_files: existing.research?.source_files?.length
        ? existing.research.source_files
        : record.researchNotebooks || [],
      corpus: {
        ...(existing.research?.corpus || {}),
        translation: 'KJV with Strong\'s numbers',
        english_forms: words
      }
    },
    senses: existing.senses?.length ? existing.senses : [{
      id: 'approved-core', status: 'approved', summary: record.definition, citations: record.citationTokens || []
    }],
    provenance: {
      ...(existing.provenance || {}),
      reconciled_on: '2026-07-13',
      definition_checked_against: 'books/symbolic-language/49-glossary.adoc'
    }
  };
  if (existing.opposite) frontmatter.opposite = existing.opposite;
  return frontmatter;
}

function canonicalYaml(frontmatter) {
  return yaml.dump(frontmatter, { lineWidth: 100, noRefs: true, sortKeys: false, quotingType: '"', forceQuotes: false }).trimEnd();
}

function generatedBody(record, cited, dictionary, forms, register) {
  const displayedDefinition = linkedDefinition(record);
  const definitions = definitionLayers(record, {}, dictionary);
  const evidence = quoteBlock(cited);
  const sources = sourceLinks(record);
  const sourceParagraph = sources.length
    ? `The fuller book and notebook trail is available in ${sources.join(', ')}.`
    : 'The glossary citations below are the current source trail for this entry.';
  const related = (record.symbolLinks || [])
    .filter(link => link.key !== record.key)
    .map(link => `[${link.label}](/research/symbols/${link.key}/)`);
  const relationshipText = record.opposite
    ? `The glossary names **${record.opposite}** as the reciprocal opposite. That relation must work in both directions; a merely related image is not an opposite.`
    : 'No reciprocal opposite is assigned. Related images may share a scene or a consequence without becoming aliases.';
  return `# ${record.term}\n\n## Approved Definition\n\n**${displayedDefinition}**\n\n${sourceParagraph}\n\n${definitionComparisonSection(record, definitions)}\n\n## The Short Case\n\n${conciseArgument(record)}\n\n${evidence || `The current glossary points to ${record.citations || 'no separate citation list'}. Those references should be read in their full literary setting before the symbolic sense is extended.`}\n\nThe definition stays with the relationship these passages establish. Literal appearances preserve the image; they do not require every occurrence to be symbolic, and some passages intentionally carry both senses together.\n\n## Corpus and Method\n\n${corpusSection(record, forms, register)}\n\n## Evidence by Sense\n\nThe approved entry currently states one controlling sense:\n\n1. **Approved core:** ${displayedDefinition}\n2. **Defining witnesses:** ${record.citations || 'No separate glossary citations recorded.'}\n3. **Boundary:** classify a use as literal, symbolic, or both only from its context. A dual-use passage belongs to both applicable groups.\n\n## Competing Definitions Tested\n\n${competingSection(record)}\n\n## Relationship to Other Symbols\n\n${relationshipText}\n\n${related.length ? `Related definitions used by this entry: ${[...new Set(related)].join(', ')}.` : 'This definition does not depend on another glossary term.'}\n\n## Occurrence Register\n\n${occurrenceSection(register)}\n\n## Conclusion\n\n**${displayedDefinition}**\n\nThis is the approved glossary conclusion. The occurrence register and competing-reading section show where further evidence would strengthen, narrow, or test it without silently changing the definition.\n`;
}

function supplementExistingBody(record, body, cited, dictionary, forms, register, definitions, definitionStatus) {
  let updated = body;
  const displayedDefinition = linkedDefinition(record);
  const definitionHeading = definitionStatus === 'draft' ? 'Current Glossary Draft' : 'Approved Definition';
  const approvedBlock = updated.match(/^(## (?:Approved Definition|Current Glossary Draft)\s*\n+)(\*\*.+?\*\*)/m);
  const firstBold = updated.match(/^\*\*(.+?)\*\*\s*$/m);
  if (approvedBlock) {
    updated = `${updated.slice(0, approvedBlock.index)}## ${definitionHeading}\n\n**${displayedDefinition}**${updated.slice(approvedBlock.index + approvedBlock[0].length)}`;
  } else if (firstBold) {
    updated = `${updated.slice(0, firstBold.index)}## ${definitionHeading}\n\n**${displayedDefinition}**${updated.slice(firstBold.index + firstBold[0].length)}`;
  } else {
    const title = updated.match(/^#\s+.+$/m);
    const insertion = `\n\n## ${definitionHeading}\n\n**${displayedDefinition}**\n`;
    updated = title ? `${updated.slice(0, title.index + title[0].length)}${insertion}${updated.slice(title.index + title[0].length)}` : `# ${record.term}${insertion}\n${updated}`;
  }

  const comparison = definitionComparisonSection(record, definitions);
  if (/^## (?:Three Definitions|Definition Layers)\s*$/m.test(updated)) {
    updated = updated.replace(/^## (?:Three Definitions|Definition Layers)\s*\n[\s\S]*?(?=^##\s)/m, `${comparison}\n\n`);
  } else {
    const approvedSection = updated.match(/^## (?:Approved Definition|Current Glossary Draft)\s*\n[\s\S]*?(?=^##\s)/m);
    if (approvedSection) {
      const insertAt = approvedSection.index + approvedSection[0].length;
      updated = `${updated.slice(0, insertAt)}${comparison}\n\n${updated.slice(insertAt)}`;
    }
  }

  updated = updated.replace(/^## Connections\s*$/m, '## Relationship to Other Symbols');
  if (record.experiment?.revisionPending) {
    updated = updated.replace(
      /^## Competing Definitions Tested\s*\n[\s\S]*?(?=^##\s)/m,
      `## Competing Definitions Tested\n\n${competingSection(record)}\n\n`
    );
  }
  updated = updated.replace(
    /^## Occurrence Register\s*\n[\s\S]*?(?=^##\s)/m,
    `## Occurrence Register\n\n${occurrenceSection(register)}\n\n`
  );
  const headingText = [...updated.matchAll(/^#{2,3}\s+(.+)$/gm)].map(match => match[1].toLowerCase()).join(' | ');
  const additions = [];
  if (!/dictionary|literal structure|three definitions|definition layers/.test(headingText)) additions.push(`## Dictionary Comparison\n\n${dictionarySection(record, dictionary)}`);
  if (!/^## Corpus and Method\s*$/m.test(updated)) additions.push(`## Corpus and Method\n\n${corpusSection(record, forms, register)}`);
  if (!/^## Competing Definitions Tested\s*$/m.test(updated)) additions.push(`## Competing Definitions Tested\n\n${competingSection(record)}`);
  if (!/occurrence|every use|all uses/.test(headingText)) additions.push(`## Occurrence Register\n\n${occurrenceSection(register)}`);
  if (!/^## Relationship to Other Symbols\s*$/m.test(updated)) additions.push(`## Relationship to Other Symbols\n\n${record.opposite ? `The glossary identifies **${record.opposite}** as the reciprocal opposite.` : 'No reciprocal opposite is assigned to this entry.'}`);
  if (!/^## Conclusion\s*$/m.test(updated)) additions.push(`## Conclusion\n\n**${displayedDefinition}**\n\nThis is the approved glossary conclusion; broader applications in the study remain subordinate to the defining texts and countertexts.`);
  if (additions.length) updated = `${updated.trimEnd()}\n\n---\n\n${additions.join('\n\n')}\n`;
  return updated;
}

function main() {
  const audit = JSON.parse(fs.readFileSync(AUDIT_FILE, 'utf8'));
  const bible = loadBible();
  const webster = loadWebster();
  let created = 0;
  let reconciled = 0;
  let skipped = 0;

  for (const record of audit.records) {
    if (PREVIEW && record.key !== PREVIEW) continue;
    if (REPLACE && record.key !== REPLACE) continue;
    const file = path.join(SYMBOLS_DIR, `${record.key}.md`);
    const exists = fs.existsSync(file);
    const parsed = exists ? parseMarkdown(fs.readFileSync(file, 'utf8')) : { frontmatter: {}, body: '' };
    const cited = citedVerses(record.citations, bible);
    const dictionary = dictionaryExcerpt(record, webster);
    const forms = searchForms(record, parsed.frontmatter.words || []);
    const register = occurrenceRegister(forms, bible);
    const frontmatter = approvedFrontmatter(record, parsed.frontmatter, dictionary);
    const definitions = frontmatter.definitions;
    const body = !exists || REPLACE
      ? generatedBody(record, cited, dictionary, forms, register)
      : supplementExistingBody(record, parsed.body, cited, dictionary, forms, register, definitions, frontmatter.definition_meta.status);
    const content = `---\n${canonicalYaml(frontmatter)}\n---\n${body.startsWith('\n') ? '' : '\n'}${body.trimEnd()}\n`;
    if (PREVIEW) {
      process.stdout.write(content);
      return;
    }
    if (WRITE) fs.writeFileSync(file, content);
    if (exists) reconciled += 1;
    else created += 1;
  }

  console.log(`${WRITE ? 'Reconciled' : 'Would reconcile'} ${reconciled} existing studies.`);
  console.log(`${WRITE ? 'Created' : 'Would create'} ${created} missing same-key studies.`);
  console.log(`Skipped ${skipped} already-canonical study.`);
  if (!WRITE) console.log('Run with --write to apply the reconciliation.');
}

main();
