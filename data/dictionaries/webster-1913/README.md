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

## Usage

```sh
npm run lookup:webster -- Valley
npm run lookup:webster -- Valley --json
```

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
