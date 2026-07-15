# Webster's Unabridged Dictionary (1913)

This directory contains a local, checksum-pinned copy of Project Gutenberg
eBook **#29765**, *Webster's Unabridged Dictionary*. It is the consolidated
plain-text transcription commonly identified as Webster's Revised Unabridged
Dictionary (1913).

The underlying dictionary is public domain in the United States. Project
Gutenberg marks this eBook “Public domain in the USA.” The complete downloaded
file is preserved, including its Project Gutenberg header, license, credits,
and warning that electronic texts may combine material from multiple printed
editions. Treat it as a historical public-domain dictionary transcription, not
as a photographic critical edition.

## Files

- `webster-1913.txt.gz` — the complete UTF-8 Project Gutenberg source,
  compressed deterministically with `gzip -n -9`.
- `metadata.json` — source URL, edition notes, retrieval date, byte and line
  counts, and the SHA-256 checksum of the uncompressed source.
- `scripts/fetch-webster-1913.sh` — reproducibly downloads the pinned source,
  verifies its checksum, and rebuilds the compressed copy.
- `scripts/lookup-webster-1913.js` — extracts a headword entry without requiring
  the data to be uncompressed on disk.
- `scripts/parse-webster-1913.js` — emits structured JSON with homographs,
  pronunciation respelling, grammar, etymology, definition senses, lettered
  subsenses, domain labels, notes, and conservatively parsed Scripture evidence.
- `scripts/lib/webster-1913.js` — reusable parser/index module used by the
  structured CLI and its tests.

## Usage

```sh
npm run lookup:webster -- Valley
npm run lookup:webster -- Valley --json
```

For structured output suitable for rendering a clean dictionary quotation:

```sh
npm run parse:webster -- Valley
npm run parse:webster -- "Holy Ghost" --compact
node scripts/parse-webster-1913.js --headword God --headword Hades --jsonl
node scripts/parse-webster-1913.js \
  --headwords-file tests/fixtures/webster-1913/headwords.txt \
  --jsonl --output /tmp/webster-entries.jsonl
```

The positional form is one headword (all positional words are joined). For a
batch, repeat `--headword` or supply a UTF-8 file containing one headword per
line. Blank lines and lines beginning with `#` are ignored. A repeated heading
such as `GOD` produces multiple records in `entries`, rather than silently
returning only the first homograph.

Run the focused parser tests with:

```sh
npm run test:webster
```

## Structured output

The top-level result contains provenance, `entryCount`, and an `entries` array.
Each entry contains the complete extracted entry in `raw`, plus these derived
layers:

- `pronunciation.raw` — Webster's marked source spelling (for example,
  `Val"ley`). It is not presented as IPA.
- `header.grammar`, `header.partsOfSpeech`, and `etymology` — separate header
  fields. Every object that quotes source text retains a `raw` value.
- `senses[].definition.raw` and `.text` — the definition with source line wraps
  and a whitespace-folded rendering value, respectively. Number labels,
  `Defn:`, domains, notes, subsenses, examples, and supplements are separate.
- `senses[].scripture[]` — a source-preserving quotation and citation pair.
  `quoteRaw` and `reference.raw` retain the transcription. A recognized
  canonical reference also has `normalized` and `link` fields. Renderers can
  use `link.book`, `link.chapter`, and `link.verse` with the reader's preferred
  translation; `link.href` supplies a working AKJV fallback URL.

The complete `entry.raw` and `sense.raw` fields are the audit trail. Derived
text should never replace them in research records.

## Parser limits

Project Gutenberg's text has no structural tags for examples or citations, so
the boundary between a definition and an unmarked literary example is
necessarily heuristic. The parser is deliberately conservative:

- it does not convert Webster's pronunciation notation to IPA;
- it does not repair transcription errors or expand abbreviated etymologies;
- it normalizes a Scripture link only for a recognized canonical book and a
  valid Arabic or canonical Roman chapter numeral followed by a verse;
- unsupported, ambiguous, apocryphal, or damaged citations remain available in
  the surrounding `raw` text but receive no invented link target;
- `examplesRaw` may contain literary and Scripture evidence together because
  the source does not label example boundaries. The more specific
  `scripture[]` records are the safe fields for Scripture rendering;
- lookup is exact by all-caps source heading. The CLI does not stem, spell
  correct, or choose a preferred homograph.

Tests use source-exact fixtures for `VALLEY`, `HADES`, and `GATE`, plus the
pinned full dataset to verify repeated `GOD` homographs.

To refetch the exact reviewed source:

```sh
./scripts/fetch-webster-1913.sh
```

The fetch fails if Project Gutenberg changes the file. Review an upstream
change before updating the checksum and metadata; this keeps quotations in the
research records reproducible.

## Provenance

- Catalog: https://www.gutenberg.org/ebooks/29765
- UTF-8 source: https://www.gutenberg.org/ebooks/29765.txt.utf-8
- Project Gutenberg release: August 22, 2009
- Source last updated: July 6, 2025
- Retrieved: July 13, 2026
