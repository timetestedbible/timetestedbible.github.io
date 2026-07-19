# MEAT full copyedit pass — 2026-07-18

## Status

The source copyedit and production verification are complete.

## Scope

- 62 numbered manuscript files in `books/symbolic-language/[0-9]*-*.adoc`
- 172,512 pre-edit source words
- Included front matter, all numbered chapters and interludes, glossary, bibliography, and author page
- Excluded audio transcripts, drafts, research and experiment directories, generated files, and cover assets

## Method

The pass combined a masked LanguageTool review of author prose, a spelling sweep, punctuation and consistency searches, a manual sentence-level review, and a cross-check against the still-pending 2026-07-11 full-book audit. Scripture blocks, inline Scripture quotations, AsciiDoc markup, Hebrew and Greek transliterations, and KJV archaisms were separated from author prose so that quotation language was not silently modernized.

## Applied edits

Meaning-preserving corrections were made at 107 source locations across 41 manuscript files. They include:

- missing commas after introductory phrases and before independent clauses;
- sentence fragments, comma splices, missing finite verbs, and broken parallel constructions;
- missing articles, relative pronouns, and prepositions;
- unclear pronouns and antecedents;
- overloaded sentences split at natural seams;
- spelling and form consistency such as `floodwaters`, `catchphrases`, `forever`, `Red Sea`, `Scripture`, and full-form Bible citations;
- clarity repairs such as `loosen his grip`, `the call to come out`, and `the pebble used for ancient counting and voting`;
- an explicit statement that both the pointing and the re-reading get a vote, while neither gets a veto before the letters and witnesses agree;
- a clarified sequence in Daniel's statue vision: God's kingdom arrives as the stone, consumes the kingdoms represented by the statue, grows into the mountain, and rules forever;
- a corrected chronology for Jacob's naming: the name Israel is first given after the wrestling and later reaffirmed at Bethel, while Scripture continues to use Jacob;
- one overloaded author-biography sentence divided into three sentences without changing its claims.

No Scripture quotation was modernized or substantively altered.

## Author-review status

All meaning-dependent items flagged during this pass have been resolved through author-directed rewrites.

## Editorial preference still open

The manuscript currently has 270 author-prose sentences beginning with **And**, **But**, or **That**. A strict application of the repository’s house rule would normalize all of them, but the older review ledger records deliberate accept/reject choices around this feature and the openings often carry the book’s rhetorical voice. They were therefore not bulk-rewritten as grammar errors. This should be handled, if desired, as a separate voice pass.

## Translation audit

The translation audit was regenerated after the copyedit. It reports no unidentified quotations. Copyrighted-version totals remain within their stated gratis limits: NKJV 73 of 500, ESV 3 of 500, and AMP 3 of 1,000.

## Production verification

- `ruby build.rb` completed successfully with exit code 0.
- The print PDF is 568 pages at 450 × 666 points; the screen PDF is 607 pages at 432 × 648 points.
- `pdftotext -layout` extracted all 568 print pages and all 607 screen pages. Corrected phrases were confirmed in both editions.
- The EPUB archive passed `unzip -t`; representative corrected phrases were also confirmed in its XHTML.
- `scripture-index.json` parses as valid JSON and contains 2,090 references.
- Representative print pages 1, 5, 97, 235, 249, 303, 304, 309–311, 382, 391, 464, 466, 536, and 567–568 were rendered to PNG and visually inspected. Screen pages 5, 259, 414, 504, and 607 were inspected separately. No clipping, overlap, missing text, or other rendering defect was found. The final blank verso in the print edition is intentional.
- `git diff --check` passes.
