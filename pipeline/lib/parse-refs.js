/**
 * Scripture reference parsing utilities for Node.js pipeline scripts.
 * Extracted from bible.js — keep in sync with the browser-side versions.
 */

const BOOK_NAME_MAP = {
  'genesis': 'Genesis', 'exodus': 'Exodus', 'leviticus': 'Leviticus', 'numbers': 'Numbers', 'deuteronomy': 'Deuteronomy',
  'joshua': 'Joshua', 'judges': 'Judges', 'ruth': 'Ruth',
  '1 samuel': '1 Samuel', '2 samuel': '2 Samuel', '1 kings': '1 Kings', '2 kings': '2 Kings',
  '1 chronicles': '1 Chronicles', '2 chronicles': '2 Chronicles',
  'ezra': 'Ezra', 'nehemiah': 'Nehemiah', 'esther': 'Esther',
  'job': 'Job', 'psalms': 'Psalms', 'psalm': 'Psalms', 'proverbs': 'Proverbs', 'ecclesiastes': 'Ecclesiastes',
  'song of solomon': 'Song of Solomon', 'song of songs': 'Song of Solomon', 'canticles': 'Song of Solomon',
  'isaiah': 'Isaiah', 'jeremiah': 'Jeremiah', 'lamentations': 'Lamentations', 'ezekiel': 'Ezekiel', 'daniel': 'Daniel',
  'hosea': 'Hosea', 'joel': 'Joel', 'amos': 'Amos', 'obadiah': 'Obadiah', 'jonah': 'Jonah', 'micah': 'Micah',
  'nahum': 'Nahum', 'habakkuk': 'Habakkuk', 'zephaniah': 'Zephaniah', 'haggai': 'Haggai', 'zechariah': 'Zechariah', 'malachi': 'Malachi',
  'matthew': 'Matthew', 'mark': 'Mark', 'luke': 'Luke', 'john': 'John', 'acts': 'Acts', 'romans': 'Romans',
  '1 corinthians': '1 Corinthians', '2 corinthians': '2 Corinthians',
  'galatians': 'Galatians', 'ephesians': 'Ephesians', 'philippians': 'Philippians', 'colossians': 'Colossians',
  '1 thessalonians': '1 Thessalonians', '2 thessalonians': '2 Thessalonians',
  '1 timothy': '1 Timothy', '2 timothy': '2 Timothy', 'titus': 'Titus', 'philemon': 'Philemon',
  'hebrews': 'Hebrews', 'james': 'James',
  '1 peter': '1 Peter', '2 peter': '2 Peter', '1 john': '1 John', '2 john': '2 John', '3 john': '3 John',
  'jude': 'Jude', 'revelation': 'Revelation', 'revelations': 'Revelation',
  'gen': 'Genesis', 'ge': 'Genesis', 'gn': 'Genesis',
  'exod': 'Exodus', 'exo': 'Exodus', 'ex': 'Exodus',
  'lev': 'Leviticus', 'le': 'Leviticus', 'lv': 'Leviticus',
  'num': 'Numbers', 'nu': 'Numbers', 'nm': 'Numbers',
  'deut': 'Deuteronomy', 'de': 'Deuteronomy', 'dt': 'Deuteronomy',
  'josh': 'Joshua', 'jos': 'Joshua', 'jsh': 'Joshua',
  'judg': 'Judges', 'jdg': 'Judges', 'jg': 'Judges', 'jdgs': 'Judges',
  'ru': 'Ruth', 'rth': 'Ruth', 'rut': 'Ruth',
  '1 sam': '1 Samuel', '1sam': '1 Samuel', '1sa': '1 Samuel', '1 sa': '1 Samuel',
  '2 sam': '2 Samuel', '2sam': '2 Samuel', '2sa': '2 Samuel', '2 sa': '2 Samuel',
  '1 kgs': '1 Kings', '1kgs': '1 Kings', '1ki': '1 Kings', '1 ki': '1 Kings',
  '2 kgs': '2 Kings', '2kgs': '2 Kings', '2ki': '2 Kings', '2 ki': '2 Kings',
  '1 chr': '1 Chronicles', '1chr': '1 Chronicles', '1ch': '1 Chronicles', '1 ch': '1 Chronicles',
  '2 chr': '2 Chronicles', '2chr': '2 Chronicles', '2ch': '2 Chronicles', '2 ch': '2 Chronicles',
  'ezr': 'Ezra', 'neh': 'Nehemiah', 'ne': 'Nehemiah',
  'est': 'Esther', 'esth': 'Esther', 'es': 'Esther',
  'jb': 'Job',
  'psa': 'Psalms', 'ps': 'Psalms', 'pss': 'Psalms',
  'prov': 'Proverbs', 'pro': 'Proverbs', 'pr': 'Proverbs', 'prv': 'Proverbs',
  'eccl': 'Ecclesiastes', 'ecc': 'Ecclesiastes', 'ec': 'Ecclesiastes',
  'eccles': 'Ecclesiastes', 'qoh': 'Ecclesiastes', 'qoheleth': 'Ecclesiastes',
  'song': 'Song of Solomon', 'sos': 'Song of Solomon', 'so': 'Song of Solomon',
  'cant': 'Song of Solomon', 'ss': 'Song of Solomon',
  'isa': 'Isaiah', 'is': 'Isaiah',
  'jer': 'Jeremiah', 'je': 'Jeremiah',
  'lam': 'Lamentations', 'la': 'Lamentations',
  'ezek': 'Ezekiel', 'eze': 'Ezekiel', 'ez': 'Ezekiel',
  'dan': 'Daniel', 'da': 'Daniel', 'dn': 'Daniel',
  'hos': 'Hosea', 'ho': 'Hosea',
  'joe': 'Joel', 'jl': 'Joel',
  'am': 'Amos',
  'obad': 'Obadiah', 'ob': 'Obadiah',
  'jon': 'Jonah', 'jnh': 'Jonah',
  'mic': 'Micah', 'mi': 'Micah',
  'nah': 'Nahum', 'na': 'Nahum',
  'hab': 'Habakkuk',
  'zeph': 'Zephaniah', 'zep': 'Zephaniah',
  'hag': 'Haggai', 'hg': 'Haggai',
  'zech': 'Zechariah', 'zec': 'Zechariah',
  'mal': 'Malachi',
  'matt': 'Matthew', 'mat': 'Matthew', 'mt': 'Matthew',
  'mk': 'Mark', 'mr': 'Mark', 'mrk': 'Mark',
  'lk': 'Luke', 'lu': 'Luke',
  'jn': 'John', 'joh': 'John',
  'ac': 'Acts', 'act': 'Acts',
  'rom': 'Romans', 'ro': 'Romans', 'rm': 'Romans',
  '1 cor': '1 Corinthians', '1cor': '1 Corinthians', '1co': '1 Corinthians',
  '2 cor': '2 Corinthians', '2cor': '2 Corinthians', '2co': '2 Corinthians',
  'gal': 'Galatians', 'ga': 'Galatians',
  'eph': 'Ephesians',
  'phil': 'Philippians', 'php': 'Philippians', 'pp': 'Philippians',
  'col': 'Colossians',
  '1 thess': '1 Thessalonians', '1thess': '1 Thessalonians', '1th': '1 Thessalonians',
  '2 thess': '2 Thessalonians', '2thess': '2 Thessalonians', '2th': '2 Thessalonians',
  '1 tim': '1 Timothy', '1tim': '1 Timothy', '1ti': '1 Timothy',
  '2 tim': '2 Timothy', '2tim': '2 Timothy', '2ti': '2 Timothy',
  'tit': 'Titus',
  'phlm': 'Philemon', 'phm': 'Philemon', 'philem': 'Philemon',
  'heb': 'Hebrews',
  'jas': 'James', 'jam': 'James', 'jms': 'James',
  '1 pet': '1 Peter', '1pet': '1 Peter', '1pe': '1 Peter',
  '2 pet': '2 Peter', '2pet': '2 Peter', '2pe': '2 Peter',
  '1 jn': '1 John', '1jn': '1 John', '1jo': '1 John',
  '2 jn': '2 John', '2jn': '2 John', '2jo': '2 John',
  '3 jn': '3 John', '3jn': '3 John', '3jo': '3 John',
  'jude': 'Jude', 'jud': 'Jude', 'jd': 'Jude',
  'rev': 'Revelation', 're': 'Revelation', 'apoc': 'Revelation', 'apocalypse': 'Revelation',
};

// Cross-reference format abbreviations (Gen.1.1 style from OpenBible)
const CROSS_REF_BOOK_MAP = {
  'Gen': 'Genesis', 'Exod': 'Exodus', 'Lev': 'Leviticus', 'Num': 'Numbers',
  'Deut': 'Deuteronomy', 'Josh': 'Joshua', 'Judg': 'Judges', 'Ruth': 'Ruth',
  '1Sam': '1 Samuel', '2Sam': '2 Samuel', '1Kgs': '1 Kings', '2Kgs': '2 Kings',
  '1Chr': '1 Chronicles', '2Chr': '2 Chronicles', 'Ezra': 'Ezra', 'Neh': 'Nehemiah',
  'Esth': 'Esther', 'Job': 'Job', 'Ps': 'Psalms', 'Prov': 'Proverbs',
  'Eccl': 'Ecclesiastes', 'Song': 'Song of Solomon',
  'Isa': 'Isaiah', 'Jer': 'Jeremiah', 'Lam': 'Lamentations', 'Ezek': 'Ezekiel',
  'Dan': 'Daniel', 'Hos': 'Hosea', 'Joel': 'Joel', 'Amos': 'Amos',
  'Obad': 'Obadiah', 'Jonah': 'Jonah', 'Mic': 'Micah', 'Nah': 'Nahum',
  'Hab': 'Habakkuk', 'Zeph': 'Zephaniah', 'Hag': 'Haggai', 'Zech': 'Zechariah',
  'Mal': 'Malachi', 'Matt': 'Matthew', 'Mark': 'Mark', 'Luke': 'Luke',
  'John': 'John', 'Acts': 'Acts', 'Rom': 'Romans',
  '1Cor': '1 Corinthians', '2Cor': '2 Corinthians',
  'Gal': 'Galatians', 'Eph': 'Ephesians', 'Phil': 'Philippians', 'Col': 'Colossians',
  '1Thess': '1 Thessalonians', '2Thess': '2 Thessalonians',
  '1Tim': '1 Timothy', '2Tim': '2 Timothy', 'Titus': 'Titus', 'Phlm': 'Philemon',
  'Heb': 'Hebrews', 'Jas': 'James',
  '1Pet': '1 Peter', '2Pet': '2 Peter',
  '1John': '1 John', '2John': '2 John', '3John': '3 John',
  'Jude': 'Jude', 'Rev': 'Revelation',
};

function normalizeBookName(bookStr) {
  if (!bookStr) return null;
  let cleaned = bookStr.replace(/\.$/, '').trim().toLowerCase();
  cleaned = cleaned.replace(/^iii\s+/, '3 ').replace(/^ii\s+/, '2 ').replace(/^i\s+/, '1 ');
  return BOOK_NAME_MAP[cleaned] || null;
}

function parseRef(ref) {
  if (!ref) return null;
  const m = ref.match(/^(.+?)\s+(\d+)(?::(\d+)(?:\s*[-–—]\s*(\d+))?)?$/);
  if (!m) return null;
  const book = normalizeBookName(m[1]);
  if (!book) return null;
  return {
    book,
    chapter: parseInt(m[2]),
    verse: m[3] ? parseInt(m[3]) : null,
    endVerse: m[4] ? parseInt(m[4]) : null,
  };
}

function canonicalRef(book, chapter, verse) {
  return `${book} ${chapter}:${verse}`;
}

/**
 * Parse a cross-reference format ref like "Gen.1.1" or "1Cor.13.4-1Cor.13.7"
 * Returns array of { book, chapter, verse } for each verse in the range.
 */
function parseCrossRef(ref) {
  const results = [];
  // Handle range: "Book.Ch.V-Book.Ch.V"
  const parts = ref.split('-');
  const startMatch = parts[0].match(/^(\w+)\.(\d+)\.(\d+)$/);
  if (!startMatch) return results;

  const book = CROSS_REF_BOOK_MAP[startMatch[1]];
  if (!book) return results;
  const ch = parseInt(startMatch[2]);
  const startV = parseInt(startMatch[3]);

  if (parts.length === 1) {
    results.push({ book, chapter: ch, verse: startV });
  } else {
    const endMatch = parts[1].match(/^(?:\w+\.(\d+)\.)?(\d+)$/);
    if (endMatch) {
      const endV = parseInt(endMatch[2]);
      for (let v = startV; v <= endV; v++) {
        results.push({ book, chapter: ch, verse: v });
      }
    } else {
      results.push({ book, chapter: ch, verse: startV });
    }
  }
  return results;
}

// Build a regex that matches scripture references in running text.
// Matches: "Gen 1:1", "1 Cor 13:4-7", "Isa 66:17", "Mat 5:17–18", "Jer 1:11–12"
const BOOK_PREFIXES = [
  '(?:[123]\\s*)?(?:' + [
    'Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy',
    'Joshua', 'Judges', 'Ruth', 'Samuel', 'Kings', 'Chronicles',
    'Ezra', 'Nehemiah', 'Esther', 'Job', 'Psalms?', 'Proverbs',
    'Ecclesiastes', 'Song(?:\\s+of\\s+Solomon)?', 'Isaiah', 'Jeremiah',
    'Lamentations', 'Ezekiel', 'Daniel', 'Hosea', 'Joel', 'Amos',
    'Obadiah', 'Jonah', 'Micah', 'Nahum', 'Habakkuk', 'Zephaniah',
    'Haggai', 'Zechariah', 'Malachi', 'Matthew', 'Mark', 'Luke', 'John',
    'Acts', 'Romans', 'Corinthians', 'Galatians', 'Ephesians',
    'Philippians', 'Colossians', 'Thessalonians', 'Timothy', 'Titus',
    'Philemon', 'Hebrews', 'James', 'Peter', 'Jude', 'Revelation',
    'Gen', 'Exod?', 'Lev', 'Num', 'Deut?', 'Josh', 'Judg',
    'Sam', 'Kgs', 'Ki', 'Chr?', 'Neh', 'Esth?',
    'Psa?', 'Prov?', 'Eccl', 'Isa', 'Jer', 'Lam', 'Ezek?', 'Dan',
    'Hos', 'Mic', 'Nah', 'Hab', 'Zeph?', 'Hag', 'Zech?', 'Mal',
    'Matt?', 'Mk', 'Lk', 'Jn', 'Rom', 'Cor', 'Gal', 'Eph',
    'Phil', 'Col', 'Thess', 'Tim', 'Tit', 'Phlm', 'Heb', 'Jas',
    'Pet', 'Rev'
  ].join('|') + ')\\.?'
];
const SCRIPTURE_REF_PATTERN = new RegExp(
  '(' + BOOK_PREFIXES[0] + ')' +
  '\\s+(\\d+):(\\d+)(?:\\s*[-–—]\\s*(\\d+))?',
  'gi'
);

/**
 * Extract all scripture references from a text string.
 * Returns array of canonical refs: ["Genesis 1:1", "Isaiah 66:17", ...]
 */
function extractScriptureRefs(text) {
  if (!text) return [];
  const refs = new Set();
  let m;
  SCRIPTURE_REF_PATTERN.lastIndex = 0;
  while ((m = SCRIPTURE_REF_PATTERN.exec(text)) !== null) {
    const book = normalizeBookName(m[1]);
    if (!book) continue;
    const ch = parseInt(m[2]);
    const startV = parseInt(m[3]);
    const endV = m[4] ? parseInt(m[4]) : startV;
    for (let v = startV; v <= Math.min(endV, startV + 50); v++) {
      refs.add(canonicalRef(book, ch, v));
    }
  }
  return [...refs];
}

const SYMBOL_REF_PATTERN = /\$\[([a-zA-Z][a-zA-Z0-9 -]*[a-zA-Z0-9])\]|\$([a-z][a-z0-9-]*)/g;

function extractSymbolRefs(text) {
  if (!text) return [];
  const refs = new Set();
  let m;
  SYMBOL_REF_PATTERN.lastIndex = 0;
  while ((m = SYMBOL_REF_PATTERN.exec(text)) !== null) {
    const raw = m[1] || m[2];
    refs.add(raw.replace(/\s+/g, '-').toLowerCase());
  }
  return [...refs];
}

module.exports = {
  BOOK_NAME_MAP,
  CROSS_REF_BOOK_MAP,
  normalizeBookName,
  parseRef,
  canonicalRef,
  parseCrossRef,
  extractScriptureRefs,
  extractSymbolRefs,
  SCRIPTURE_REF_PATTERN,
};
