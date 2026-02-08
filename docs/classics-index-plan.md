# Classics Index (Philo & Josephus) — Plan

## Goal

Build an index and reader for Philo and Josephus so that:

- Citations used in the book (e.g. “Josephus, Antiquities 18.2.2”, “Philo, On the Creation 42”) can **jump to the passage** in a reader.
- Text is **well formatted** (chapters/sections, index hyperlinks).
- **Copy-friendly**: if a user copies a quote with section references, links point back to this domain.
- Explore and cite their works like the Bible; **every citation from the book** can link to the reader for full context.

## Phases

1. **Backend (data + tooling)** — standalone, no UI changes.
2. **Unit tests** — decode citations, look up sections, normalize; cache as .gz.
3. **Integration** — reader view, URL routes, book citation links (after backend is done and tested).

---

## Backend Design

### Data model

- **Philo**: Works (e.g. “On the Creation”) and **sections** (Loeb-style section numbers, e.g. 1, 7, 42).  
  Ref format: `workKey|section` (e.g. `On the Creation|42`).
- **Josephus**: Works (“Antiquities”, “Jewish War”, “Against Apion”, “Life”) with **book.chapter.section** (e.g. 18.2.2).  
  Ref format: `workKey|book|chapter|section` (e.g. `Antiquities|18|2|2`).

### Storage (Bible-like)

- **Blob + index**: one concatenated text blob per author; index maps ref → `[start, end]` character offsets.
- **Cache**: source or processed text stored as `.txt.gz` under `classics/`; app fetches and decompresses (same pattern as `bibles/*.txt.gz`).
- **Processed format**: records separated by a delimiter (e.g. unit separator `\x01`); each record = ref + section text. Parsing builds the in-memory index.

### Citation grammar (supported forms)

**Philo**

- Full: `On the Creation 42`, `Philo, On the Creation 42`, `On the Migration of Abraham 89`.
- Loeb-style abbrevs: `Opif. 42`, `Migr. 89`, `Abr. 1`, `Flacc. 1`, `Decal. 1`, `Spec. 1`, `Contempl. 1`, `Prob. 1`, `Ebr. 1`, `Deus 1`, `Gig 1`, `Fug 1`, `Mut 1`, `Ios. 1`, `Apol. 1`, `Act`/`Aet` (On the Eternity of the World).
- Special Laws: `Special Laws II, XXX` (Roman section → 30), `Special Laws I` … `IV` map to The First … Fourth Festival.
- Normalized: `On the Creation 42` (canonical work title + section).

**Josephus**

- Full: `Antiquities 18.2.2`, `Antiquities of the Jews 18.2.2`, `Jewish War 2.17.8`, `Against Apion 2.282`, `Life 1`.
- Abbrevs: `Ant. 18.2.2`, `J.W. 2.17.8`, `War 2.17.8`, `Apion 2.282`, `Life 1`.
- SBL/Latin: `A.J. 18.2.2`, `B.J. 2.17.8`, `C. Ap. 2.282`, `Vita 1`, `Contra Apionem`, `Bellum Judaicum`, `Antiquitates Judaicae`.
- Parentheses: `Antiquities of the Jews (Book 18, 1:4)` → normalized to `Antiquities 18.1.4`.
- Trailing Niese refs (`§167`) are stripped; lookup uses Whiston book.chapter.section.
- Normalized: `Antiquities 18.2.2` (canonical work + book.chapter.section).

### API (classics.js)

- `loadAuthor('philo' | 'josephus')` — fetch .gz, parse, build blob + index.
- `parseCitation(str)` → `{ author, work, workKey, section }` or `{ author, work, workKey, book, chapter, section }` for Josephus.
- `getSection(author, ref)` or `getSection(author, workKey, section[, book, chapter])` → full section text.
- `normalizeCitation(str)` → canonical citation string for URLs/display.
- `isLoaded(author)`, `getWorks(author)` for UI/navigation.

### File layout

- `classics/philo.txt` — processed Philo (ref\x01text\x01…); built by script from `philo-complete-works.txt`.
- `classics/philo.txt.gz` — gzipped for serving.
- `classics/josephus.txt` + `.gz` — same idea when Josephus raw text is available (placeholder or add later).
- `scripts/parse-philo.js` — parse Philo raw text → `classics/philo.txt`.
- `scripts/build-classics-gz.js` — gzip `classics/*.txt` → `classics/*.txt.gz`.
- `classics.js` — standalone module (no DOM); used by reader and URL router later.

### Philo source structure (Yonge/Loeb)

- All-caps work titles (e.g. `ON THE CREATION?)`).
- Sections: `I. (1)`, `II. (7)`, … (Roman numeral + Loeb section in parentheses).  
  Parser uses the **number in parentheses** as the section number; text runs until the next section or next work title.

### Josephus source structure (when available)

- “Antiquities of the Jews - Book XV”, “CHAPTER 1”, “CHAPTER 2”, and numbered sections.  
  Ref: work (Antiquities / War / Apion / Life) + book + chapter + section.

---

## Unit tests (tests/classics-test.js)

- **Decode citation**: e.g. `parseCitation('On the Creation 42')` → `{ author: 'philo', work: 'On the Creation', workKey: 'on-the-creation', section: 42 }`; `parseCitation('Antiquities 18.2.2')` → Josephus shape with book, chapter, section.
- **Lookup**: `getSection('philo', 'On the Creation', 42)` returns non-empty string (and optionally contains expected phrase).
- **Normalize**: `normalizeCitation('Ant. 18.2.2')` → `Antiquities 18.2.2`; Philo variants → canonical work + section.
- **Edge cases**: unknown work, missing section, malformed string → null or safe fallback.

Tests run against parsed data (e.g. `classics/philo.txt` or in-memory after parse); no network. Same pattern as `tests/bible-test.js`.

---

## Integration (later)

- **Reader view**: new content type(s) for Philo/Josephus; render section text with nav (work → section; for Josephus book/chapter/section).
- **URLs**: e.g. `/#/reader?content=philo&work=On%20the%20Creation&section=42` and `content=josephus&work=Antiquities&book=18&chapter=2&section=2`.
- **Book citations**: extend book/chapter rendering so “Josephus, Antiquities 18.2.2” and “Philo, On the Creation 42” become links that dispatch to the reader with the right params.
- **Copy-friendly links**: section permalinks use the same URL scheme so pasted links open in context.

---

## Downloading raw texts (archive.org)

Use the **download** URL (not stream) so you get the raw .txt file, not HTML.

- **Philo** (C. D. Yonge):  
  `https://archive.org/download/the-complete-works-of-philo-complete-and-unabridged/The%20Complete%20Works%20of%20Philo%20Complete%20and%20Unabridged_djvu.txt`  
  Save as: `philo-complete-works.txt`

- **Josephus** (William Whiston 1737):  
  `https://archive.org/download/CompleteWorksOfJosephusTranslatedByWilliamWhiston1737/Complete%20Works%20of%20Josephus%20translated%20by%20William%20Whiston%201737_djvu.txt`  
  Save as: `josephus-complete-works.txt`

Example (curl):  
`curl -L -A "Mozilla/5.0 ..." "<download-url>" -o "josephus-complete-works.txt"`

## Backend usage (current)

- **Regenerate Philo data**: `node scripts/parse-philo.js` (reads `philo-complete-works.txt`, writes `classics/philo.txt`).
- **Build gzip cache**: `node scripts/build-classics-gz.js` (produces `classics/philo.txt.gz`).
- **Run unit tests**: `node tests/classics-test.js` (injects `classics/philo.txt`, no network).
- **In app**: load `classics.js`, call `Classics.loadAuthor('philo')` then `Classics.getSection('philo', work, section)` or `Classics.parseCitation(str)` / `Classics.getSectionByParsed(parsed)`.

**Josephus (ready):** With `josephus-complete-works.txt` in place, run `node scripts/parse-josephus.js` (outputs `classics/josephus.txt`; ref format `Work|book|chapter|section`, e.g. `Antiquities|18|2|2`, `Jewish War|1|1|1`). Then run `build-classics-gz.js`. Supports Jewish War, Antiquities, Life, Against Apion. Unit tests in `tests/classics-test.js` include Josephus lookup.

## Non-goals (backend phase)

- No changes to `app-store.js`, `content-manager.js`, or existing views except when we do integration.
- No UI until backend and tests are in place.
