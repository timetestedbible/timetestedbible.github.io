/**
 * Classics Data Subsystem (Philo, Josephus)
 *
 * Standalone module for classic texts: blob + offset index, citation parsing,
 * section lookup. Fetches .gz from /classics/, decompresses, parses ref\x01text\x01
 * format. No DOM dependency.
 */

const SEP = '\x01';

// ─── Philo: work name normalization and abbreviations ────────────────────────
// Maps lowercase / abbrev → canonical display name (must match ref prefix in blob).
// Includes Loeb-style and common scholarly abbreviations (Opif, Leg, Migr, Abr, etc.).
const PHILO_WORK_MAP = {
  'on the creation': 'On the Creation',
  'opif': 'On the Creation',
  'creation': 'On the Creation',
  'of cain and his birth': 'Of Cain and His Birth',
  'on the birth of abel and the sacrifices': 'On the Birth of Abel and the Sacrifices',
  'sacrifices of abel and cain': 'On the Birth of Abel and the Sacrifices',
  'that the worse is wont to attack the better': 'That the Worse Is Wont to Attack the Better',
  'on the giants': 'On the Giants',
  'gig': 'On the Giants',
  'on the unchangeableness of god': 'On the Unchangeableness of God',
  'deus': 'On the Unchangeableness of God',
  'on drunkenness': 'On Drunkenness',
  'ebr': 'On Drunkenness',
  'on the prayers and curses uttered by noah when he became sober': 'On the Prayers and Curses Uttered by Noah When He Became Sober',
  'on the migration of abraham': 'On the Migration of Abraham',
  'migr': 'On the Migration of Abraham',
  'migration': 'On the Migration of Abraham',
  'who is the heir of divine things': 'Who Is the Heir of Divine Things',
  'on mating with the preliminary studies': 'On Mating with the Preliminary Studies',
  'on flight and finding': 'On Flight and Finding',
  'fug': 'On Flight and Finding',
  'on the change of names': 'On the Change of Names',
  'mut': 'On the Change of Names',
  'on abraham': 'On Abraham',
  'abr': 'On Abraham',
  'on joseph': 'On Joseph',
  'ios': 'On Joseph',
  'ioseph': 'On Joseph',
  'the decalogue': 'The Decalogue',
  'decal': 'The Decalogue',
  'decalogue': 'The Decalogue',
  'on the special laws': 'The First Festival', // Special Laws = festival/law treatises; map to first
  'special laws': 'The First Festival',
  'special laws i': 'The First Festival',
  'special laws ii': 'The Second Festival',
  'special laws iii': 'The Third Festival',
  'special laws iv': 'The Fourth Festival',
  'spec': 'The First Festival',
  'on rewards and punishments': 'On Rewards and Punishments',
  'on the contemplative life': 'On the Contemplative Life or Suppliants',
  'contemplative life': 'On the Contemplative Life or Suppliants',
  'contempl': 'On the Contemplative Life or Suppliants',
  'flaccus': 'Flaccus',
  'against flaccus': 'Flaccus',
  'flacc': 'Flaccus',
  'apology for the jews': 'Apology for the Jews',
  'apol': 'Apology for the Jews',
  'every good man is free': 'Every Good Man Is Free',
  'prob': 'Every Good Man Is Free',
  'hypothetical': 'Hypothetical',
  'on the eternity of the world': 'On the Eternity of the World',
  'act': 'On the Eternity of the World',
  'aet': 'On the Eternity of the World',
};

// Josephus: work abbreviations and normalization. Includes SBL/Latin (A.J., B.J., C. Ap., Vita).
const JOSEPHUS_WORK_MAP = {
  'antiquities': 'Antiquities',
  'ant': 'Antiquities',
  'antiquities of the jews': 'Antiquities',
  'jewish antiquities': 'Antiquities',
  'a.j': 'Antiquities',
  'a. j': 'Antiquities',
  'antiquitates judaicae': 'Antiquities',
  'war': 'Jewish War',
  'j.w': 'Jewish War',
  'j. w': 'Jewish War',
  'jewish war': 'Jewish War',
  'b.j': 'Jewish War',
  'b. j': 'Jewish War',
  'bellum judaicum': 'Jewish War',
  'wars of the jews': 'Jewish War',
  'against apion': 'Against Apion',
  'apion': 'Against Apion',
  'c. ap': 'Against Apion',
  'c. ap.': 'Against Apion',
  'contra apionem': 'Against Apion',
  'life': 'Life',
  'life of josephus': 'Life',
  'vita': 'Life',
  'autobiography': 'Life',
};

// ─── Pseudepigrapha: work name normalization ────────────────────────────────
const PSEUDEPIGRAPHA_WORK_MAP = {
  '1 enoch': { id: 'enoch', work: '1 Enoch', chapters: 108 },
  'enoch': { id: 'enoch', work: '1 Enoch', chapters: 108 },
  'book of enoch': { id: 'enoch', work: '1 Enoch', chapters: 108 },
  '1enoch': { id: 'enoch', work: '1 Enoch', chapters: 108 },
  'jubilees': { id: 'jubilees', work: 'Jubilees', chapters: 50 },
  'book of jubilees': { id: 'jubilees', work: 'Jubilees', chapters: 50 },
  'jub': { id: 'jubilees', work: 'Jubilees', chapters: 50 },
  'jasher': { id: 'jasher', work: 'Jasher', chapters: 91 },
  'book of jasher': { id: 'jasher', work: 'Jasher', chapters: 91 },
  'sefer hayashar': { id: 'jasher', work: 'Jasher', chapters: 91 },
  // KJV Apocrypha
  '1 esdras': { id: '1esdras', work: '1 Esdras', chapters: 9 },
  '1esdras': { id: '1esdras', work: '1 Esdras', chapters: 9 },
  '2 esdras': { id: '2esdras', work: '2 Esdras', chapters: 16 },
  '2esdras': { id: '2esdras', work: '2 Esdras', chapters: 16 },
  '4 ezra': { id: '2esdras', work: '2 Esdras', chapters: 16 },
  'tobit': { id: 'tobit', work: 'Tobit', chapters: 14 },
  'tobias': { id: 'tobit', work: 'Tobit', chapters: 14 },
  'tob': { id: 'tobit', work: 'Tobit', chapters: 14 },
  'judith': { id: 'judith', work: 'Judith', chapters: 16 },
  'jdt': { id: 'judith', work: 'Judith', chapters: 16 },
  'wisdom of solomon': { id: 'wisdom', work: 'Wisdom of Solomon', chapters: 19 },
  'wisdom': { id: 'wisdom', work: 'Wisdom of Solomon', chapters: 19 },
  'wis': { id: 'wisdom', work: 'Wisdom of Solomon', chapters: 19 },
  'sirach': { id: 'sirach', work: 'Sirach', chapters: 51 },
  'ecclesiasticus': { id: 'sirach', work: 'Sirach', chapters: 51 },
  'sir': { id: 'sirach', work: 'Sirach', chapters: 51 },
  'ben sira': { id: 'sirach', work: 'Sirach', chapters: 51 },
  'baruch': { id: 'baruch', work: 'Baruch', chapters: 5 },
  'bar': { id: 'baruch', work: 'Baruch', chapters: 5 },
  'letter of jeremiah': { id: 'letterJeremiah', work: 'Letter of Jeremiah', chapters: 1 },
  'epistle of jeremiah': { id: 'letterJeremiah', work: 'Letter of Jeremiah', chapters: 1 },
  'prayer of azariah': { id: 'prayerAzariah', work: 'Prayer of Azariah', chapters: 1 },
  'song of the three': { id: 'prayerAzariah', work: 'Prayer of Azariah', chapters: 1 },
  'susanna': { id: 'susanna', work: 'Susanna', chapters: 1 },
  'bel and the dragon': { id: 'belDragon', work: 'Bel and the Dragon', chapters: 1 },
  'prayer of manasseh': { id: 'prayerManasseh', work: 'Prayer of Manasseh', chapters: 1 },
  '1 maccabees': { id: '1maccabees', work: '1 Maccabees', chapters: 16 },
  '1maccabees': { id: '1maccabees', work: '1 Maccabees', chapters: 16 },
  '1 macc': { id: '1maccabees', work: '1 Maccabees', chapters: 16 },
  '2 maccabees': { id: '2maccabees', work: '2 Maccabees', chapters: 15 },
  '2maccabees': { id: '2maccabees', work: '2 Maccabees', chapters: 15 },
  '2 macc': { id: '2maccabees', work: '2 Maccabees', chapters: 15 },
  // Additional Pseudepigrapha
  '2 enoch': { id: '2enoch', work: '2 Enoch', chapters: 68 },
  '2enoch': { id: '2enoch', work: '2 Enoch', chapters: 68 },
  'secrets of enoch': { id: '2enoch', work: '2 Enoch', chapters: 68 },
  '2 baruch': { id: '2baruch', work: '2 Baruch', chapters: 87 },
  '2baruch': { id: '2baruch', work: '2 Baruch', chapters: 87 },
  'psalms of solomon': { id: 'psalmsSolomon', work: 'Psalms of Solomon', chapters: 18 },
  'ps sol': { id: 'psalmsSolomon', work: 'Psalms of Solomon', chapters: 18 },
  'testaments': { id: 'testaments', work: 'Testaments', chapters: 29 },
  'testaments of the twelve patriarchs': { id: 'testaments', work: 'Testaments', chapters: 29 },
  'testament of the twelve': { id: 'testaments', work: 'Testaments', chapters: 29 },
};

// ─── Registry: author id → file path (under /classics/) ─────────────────────
const CLASSICS_REGISTRY = [
  { id: 'philo', name: 'Philo', file: '/classics/philo.txt' },
  { id: 'josephus', name: 'Josephus', file: '/classics/josephus.txt' },
  // Pseudepigrapha (existing)
  { id: 'enoch', name: '1 Enoch', file: '/classics/enoch.txt' },
  { id: 'jubilees', name: 'Jubilees', file: '/classics/jubilees.txt' },
  { id: 'jasher', name: 'Jasher', file: '/classics/jasher.txt' },
  // KJV Apocrypha
  { id: '1esdras', name: '1 Esdras', file: '/classics/1esdras.txt' },
  { id: '2esdras', name: '2 Esdras', file: '/classics/2esdras.txt' },
  { id: 'tobit', name: 'Tobit', file: '/classics/tobit.txt' },
  { id: 'judith', name: 'Judith', file: '/classics/judith.txt' },
  { id: 'wisdom', name: 'Wisdom of Solomon', file: '/classics/wisdom.txt' },
  { id: 'sirach', name: 'Sirach', file: '/classics/sirach.txt' },
  { id: 'baruch', name: 'Baruch', file: '/classics/baruch.txt' },
  { id: 'letterJeremiah', name: 'Letter of Jeremiah', file: '/classics/letterJeremiah.txt' },
  { id: 'prayerAzariah', name: 'Prayer of Azariah', file: '/classics/prayerAzariah.txt' },
  { id: 'susanna', name: 'Susanna', file: '/classics/susanna.txt' },
  { id: 'belDragon', name: 'Bel and the Dragon', file: '/classics/belDragon.txt' },
  { id: 'prayerManasseh', name: 'Prayer of Manasseh', file: '/classics/prayerManasseh.txt' },
  { id: '1maccabees', name: '1 Maccabees', file: '/classics/1maccabees.txt' },
  { id: '2maccabees', name: '2 Maccabees', file: '/classics/2maccabees.txt' },
  // Additional Pseudepigrapha
  { id: '2enoch', name: '2 Enoch', file: '/classics/2enoch.txt' },
  { id: '2baruch', name: '2 Baruch', file: '/classics/2baruch.txt' },
  { id: 'psalmsSolomon', name: 'Psalms of Solomon', file: '/classics/psalmsSolomon.txt' },
  { id: 'testaments', name: 'Testaments of the XII Patriarchs', file: '/classics/testaments.txt' },
];

const _registryMap = {};
CLASSICS_REGISTRY.forEach(r => { _registryMap[r.id] = r; });

// ─── State ─────────────────────────────────────────────────────────────────
let _blobs = {};
let _indexes = {};
let _works = {};  // author → Set of work names (from index keys)
let _loading = {};

/**
 * Parse blob (ref\x01text\x01...) into index: ref → [start, end].
 * Uses first occurrence per ref.
 */
function _parseBlob(blob) {
  const index = {};
  const works = new Set();
  let pos = 0;
  while (pos < blob.length) {
    const sep1 = blob.indexOf(SEP, pos);
    if (sep1 === -1) break;
    const ref = blob.slice(pos, sep1);
    const textStart = sep1 + 1;
    const sep2 = blob.indexOf(SEP, textStart);
    if (sep2 === -1) break;
    const textEnd = sep2;
    if (!index[ref]) {
      index[ref] = [textStart, textEnd];
      const work = ref.split('|')[0];
      if (work) works.add(work);
    }
    pos = sep2 + 1;
  }
  return { index, works: Array.from(works) };
}

/**
 * Fetch and optionally decompress classics file (browser: fetch .gz + DecompressionStream).
 * In Node, caller can pass raw text (tests).
 */
async function _fetchAndDecompress(filePath) {
  const gzPath = filePath + '.gz';
  const hasDecompress = typeof DecompressionStream !== 'undefined';

  if (hasDecompress) {
    try {
      const response = await fetch(gzPath);
      if (response.ok) {
        const ds = new DecompressionStream('gzip');
        const decompressed = response.body.pipeThrough(ds);
        const resp = new Response(decompressed);
        return await resp.text();
      }
    } catch (_) {}
  }

  const response = await fetch(filePath);
  if (!response.ok) throw new Error(`HTTP ${response.status} for ${filePath}`);
  return await response.text();
}

/**
 * Load an author's data from /classics/{id}.txt or .gz.
 */
async function loadAuthor(authorId) {
  const reg = _registryMap[authorId];
  if (!reg) {
    console.warn(`[Classics] Unknown author: ${authorId}`);
    return false;
  }
  if (_blobs[authorId]) return true;
  if (_loading[authorId]) return _loading[authorId];

  _loading[authorId] = (async () => {
    try {
      const text = await _fetchAndDecompress(reg.file);
      const { index, works } = _parseBlob(text);
      _blobs[authorId] = text;
      _indexes[authorId] = index;
      _works[authorId] = works;
      console.log(`[Classics] ${reg.name} loaded: ${Object.keys(index).length} sections`);
      return true;
    } catch (err) {
      console.warn(`[Classics] Failed to load ${reg.name}:`, err.message);
      return false;
    } finally {
      delete _loading[authorId];
    }
  })();

  return _loading[authorId];
}

// Roman numeral to number for Philo section refs (e.g. "Special Laws II, XXX" → section 30)
const ROMAN_NUM = { I: 1, V: 5, X: 10, L: 50, C: 100 };
function _romanToInt(roman) {
  const r = (roman || '').trim().toUpperCase();
  if (!/^[IVXLCDM]+$/.test(r)) return null;
  let n = 0, prev = 0;
  for (let i = r.length - 1; i >= 0; i--) {
    const val = ROMAN_NUM[r[i]] || 0;
    n += val < prev ? -val : val;
    prev = val;
  }
  return n;
}

/**
 * Parse a Philo citation string.
 * e.g. "On the Creation 42", "Philo, On the Creation 42", "Opif. 42", "Special Laws II, XXX"
 * @returns {{ author: 'philo', work: string, workKey: string, section: string } | null}
 */
function parsePhiloCitation(str) {
  if (!str || typeof str !== 'string') return null;
  let s = str.trim();
  s = s.replace(/^Philo,?\s*/i, '');
  // Allow "Work, XXX" or "Work XXX" (Roman section) → normalize to "Work 30"
  s = s.replace(/,?\s+([IVXLCDM]+)\s*$/, (_, roman) => {
    const n = _romanToInt(roman);
    return n != null ? ' ' + n : ' ' + roman;
  });
  const match = s.match(/^(.+?)\s+(\d+(?:\.\d+)?)\s*$/);
  if (!match) return null;
  const workInput = match[1].replace(/\.$/, '').trim().toLowerCase();
  const section = match[2];
  const work = PHILO_WORK_MAP[workInput] || workInput.split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  const workKey = work.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  return { author: 'philo', work, workKey, section };
}

/**
 * Parse a Josephus citation string.
 * e.g. "Antiquities 18.2.2", "Ant. 18.2.2", "Jewish War 2.17.8", "Against Apion 2.282"
 * @returns {{ author: 'josephus', work: string, workKey: string, book: number, chapter: number, section: number } | null}
 */
function parseJosephusCitation(str) {
  if (!str || typeof str !== 'string') return null;
  let s = str.trim();
  s = s.replace(/^Josephus,?\s*/i, '');
  // Normalize "(Book 18, 1:4)" → " 18.1.4" (Whiston book.chapter.section)
  s = s.replace(/\s*\(Book\s*(\d+)\s*,\s*(\d+)\s*:\s*(\d+)\)\s*$/i, ' $1.$2.$3');
  // Strip trailing "§123" or "§123-124" (Niese section refs); we keep book.chapter.section for lookup
  s = s.replace(/\s*§\s*\d+(?:\s*[–-]\s*\d+)?\s*$/i, '');
  // Work name then numbers: "Antiquities 18.2.2" or "Against Apion 2.282" (book.section or book.chapter.section)
  const match = s.match(/^(.+?)\s+(\d+)(?:\.(\d+)(?:\.(\d+))?)?\s*$/);
  if (!match) return null;
  const workInput = match[1].replace(/\.$/, '').trim().toLowerCase();
  const work = JOSEPHUS_WORK_MAP[workInput] || workInput.split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  const workKey = work.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  const book = parseInt(match[2], 10);
  const hasThreeParts = match[4] != null;
  // Against Apion and Life have no chapter divisions — 2-part citations are book.section (chapter is always 1)
  const chapterlessWorks = ['Against Apion', 'Life'];
  const isChapterless = chapterlessWorks.includes(work);
  let chapter, section;
  if (hasThreeParts) {
    chapter = parseInt(match[3], 10);
    section = parseInt(match[4], 10);
  } else if (match[3] != null) {
    if (isChapterless) {
      // "Against Apion 2.282" → book=2, chapter=1, section=282
      chapter = 1;
      section = parseInt(match[3], 10);
    } else {
      // "Antiquities 18.2" → book=18, chapter=2, section=2 (ambiguous, default section=chapter)
      chapter = parseInt(match[3], 10);
      section = chapter;
    }
  } else {
    chapter = undefined;
    section = book;
  }
  return { author: 'josephus', work, workKey, book, chapter: chapter ?? section, section, hasThreeParts };
}

/**
 * Parse a pseudepigrapha citation string.
 * e.g. "1 Enoch 42", "Enoch 42", "Jubilees 5", "Jub 5", "Jasher 12", "Book of Jasher 12"
 * @returns {{ author: string, work: string, workKey: string, chapter: number } | null}
 */
function parsePseudepigraphaCitation(str) {
  if (!str || typeof str !== 'string') return null;
  let s = str.trim();
  // Match: work name + chapter number
  const match = s.match(/^(.+?)\s+(\d+)\s*$/);
  if (!match) return null;
  const workInput = match[1].trim().toLowerCase();
  const chapter = parseInt(match[2], 10);
  const entry = PSEUDEPIGRAPHA_WORK_MAP[workInput];
  if (!entry) return null;
  return {
    author: entry.id,
    work: entry.work,
    workKey: entry.id,
    chapter,
  };
}

/**
 * Parse a citation string (Philo, Josephus, or Pseudepigrapha).
 */
function parseCitation(str) {
  const pseudo = parsePseudepigraphaCitation(str);
  if (pseudo) return pseudo;
  const philo = parsePhiloCitation(str);
  if (philo) return philo;
  return parseJosephusCitation(str);
}

/**
 * Normalize citation to canonical form for display/URL.
 * Philo: "On the Creation 42"
 * Josephus: "Antiquities 18.2.2"
 */
function normalizeCitation(str) {
  const p = parseCitation(str);
  if (!p) return '';
  if (p.author === 'philo') return `${p.work} ${p.section}`;
  if (p.author === 'josephus') {
    if (p.hasThreeParts) return `${p.work} ${p.book}.${p.chapter}.${p.section}`;
    if (p.chapter != null) return `${p.work} ${p.book}.${p.chapter}`;
    return `${p.work} ${p.book}`;
  }
  if (['enoch', 'jubilees', 'jasher'].includes(p.author)) {
    return `${p.work} ${p.chapter}`;
  }
  return '';
}

/**
 * Get section text for Philo. ref = "Work|section" (e.g. "On the Creation|42").
 */
function getSection(authorId, workOrRef, sectionOrUndefined) {
  const blob = _blobs[authorId];
  const index = _indexes[authorId];
  if (!blob || !index) return null;

  const ref = sectionOrUndefined != null ? `${workOrRef}|${sectionOrUndefined}` : workOrRef;
  const offsets = index[ref];
  if (!offsets) return null;
  return blob.slice(offsets[0], offsets[1]);
}

/**
 * Get section by parsed citation object (from parseCitation).
 */
function getSectionByParsed(parsed) {
  if (!parsed) return null;
  if (parsed.author === 'philo') return getSection('philo', parsed.work, parsed.section);
  if (parsed.author === 'josephus') {
    const ref = `${parsed.work}|${parsed.book}|${parsed.chapter}|${parsed.section}`;
    return getSection('josephus', ref);
  }
  if (['enoch', 'jubilees', 'jasher'].includes(parsed.author)) {
    const ref = `${parsed.work}|${parsed.chapter}`;
    return getSection(parsed.author, ref);
  }
  return null;
}

function isLoaded(authorId) {
  return !!_blobs[authorId];
}

function getWorks(authorId) {
  return _works[authorId] || [];
}

/**
 * Get a sorted list of section refs for a given author + work.
 * Returns array of ref strings (e.g. "On the Creation|42").
 */
function getSectionList(authorId, workName) {
  const index = _indexes[authorId];
  if (!index) return [];
  const prefix = workName + '|';
  return Object.keys(index).filter(k => k.startsWith(prefix)).sort((a, b) => {
    // Sort by numeric parts: compare each pipe-delimited segment numerically
    const pa = a.slice(prefix.length).split('|').map(Number);
    const pb = b.slice(prefix.length).split('|').map(Number);
    for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
      const va = pa[i] || 0, vb = pb[i] || 0;
      if (va !== vb) return va - vb;
    }
    return 0;
  });
}

/**
 * Slugify a work name for URL: lowercase, spaces → hyphens, strip non-alphanumeric.
 */
function getWorkSlug(workName) {
  return (workName || '').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

/**
 * Reverse lookup: find a work name from a URL slug.
 * Checks known works for the given author.
 */
function getWorkBySlug(authorId, slug) {
  const works = _works[authorId] || [];
  for (const work of works) {
    if (getWorkSlug(work) === slug) return work;
  }
  return null;
}

function getAuthors() {
  return CLASSICS_REGISTRY;
}

/**
 * For tests: inject blob text for an author (bypasses fetch).
 */
function _injectForTest(authorId, blobText) {
  const { index, works } = _parseBlob(blobText);
  _blobs[authorId] = blobText;
  _indexes[authorId] = index;
  _works[authorId] = works;
}

// ── Footnotes ──

let _footnotes = {};  // { josephus: { "Work|Book|Chapter": { N: "text" } } }

/**
 * Load footnotes for an author (lazy, from JSON file).
 */
async function loadFootnotes(authorId) {
  if (_footnotes[authorId]) return _footnotes[authorId];
  try {
    const response = await fetch(`/classics/${authorId}-footnotes.json`);
    if (!response.ok) return {};
    _footnotes[authorId] = await response.json();
    return _footnotes[authorId];
  } catch (e) {
    return {};
  }
}

/**
 * Get footnotes for a specific chapter (synchronous — returns cached or empty).
 * Key format: "Work|Book|Chapter" → { num: text }
 * Tries multiple key patterns since footnotes may be per-book or per-chapter.
 */
function getFootnotes(authorId, workName, book, chapter) {
  const data = _footnotes[authorId];
  if (!data) {
    // Trigger async load for next time
    loadFootnotes(authorId);
    return null;
  }
  // Try exact match first, then broader patterns
  if (chapter != null) {
    const key = `${workName}|${book}|${chapter}`;
    if (data[key]) return data[key];
  }
  // Try book-level (some endnotes are per-book, not per-chapter)
  // Merge all chapters for this book
  const bookPrefix = `${workName}|${book}|`;
  const merged = {};
  for (const [key, notes] of Object.entries(data)) {
    if (key.startsWith(bookPrefix)) {
      Object.assign(merged, notes);
    }
  }
  return Object.keys(merged).length > 0 ? merged : null;
}

const Classics = {
  SEP,
  CLASSICS_REGISTRY,
  PHILO_WORK_MAP,
  JOSEPHUS_WORK_MAP,
  PSEUDEPIGRAPHA_WORK_MAP,
  _parseBlob,
  _fetchAndDecompress,
  _blobs: () => _blobs,
  _indexes: () => _indexes,
  _works: () => _works,
  loadAuthor,
  parsePhiloCitation,
  parseJosephusCitation,
  parsePseudepigraphaCitation,
  parseCitation,
  normalizeCitation,
  getSection,
  getSectionByParsed,
  isLoaded,
  getWorks,
  getSectionList,
  getWorkSlug,
  getWorkBySlug,
  getAuthors,
  loadFootnotes,
  getFootnotes,
  _injectForTest,
};

// Export for use as module (Node) or global (browser)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Classics;
}
