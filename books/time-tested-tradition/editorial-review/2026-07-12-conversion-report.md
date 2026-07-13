# TTT 2nd Edition conversion — report for the author's merge pass

Mechanical conversion completed 2026-07-12. The web edition (chapters/*.md,
the 2nd-edition draft per its own preface) is the text source; the June PDF
(media/time-tested-tradition.pdf) supplied structure, figures, and content the
web lacks. Existing web and PDF are untouched.

## What was built

- 31 AsciiDoc chapters in books/time-tested-tradition/ (all `published: false`),
  MEAT front-matter format, one sentence per line, [quote.scripture] blocks,
  full book names in source.
- Print pipeline forked from MEAT (print/): builds
  time-tested-tradition-{print,screen}.pdf, .epub, and -gray.pdf.
  First full build: 384 pages, TOC → Closing Remarks → generated Scripture Index.
- 30 figures extracted from the PDF at native resolution
  (images/masters/<chapter>-figN-p<pdfpage>): 10 placed at the exact spots the
  prose references them, 20 parked at chapter ends with their pdf page in the
  caption for repositioning.
- Chapter order matches the PDF: extras print between Solar Only Calendars and
  The Path to Salvation (15x1-15x4); First Fruits & New Wine stays digital
  (19x); web-only drafts 20-22 (USA is Babylon, Pre-Trib Rapture, Blood Moon)
  are `edition: digital` pending your ruling.

## Recovered from the PDF (web never had these)

1. **Closing Remarks** → 23-closing-remarks.adoc (pdf pp. 343-344). Two
   ligature repairs made: "flesh", "free from" — verify against the PDF.
2. **The figures/tables.** The web markdown dropped every data table. Most
   exist in the PDF as images (extracted). NOT recovered because they are
   vector-drawn (pdfimages can't see them): the Passion Week tables (16 Jonah
   parallels; burial timeline; "Cross with Dark Conjunction" chart), ch. 18's
   first-fruits dates table and NASA eclipse list, ch. 11's day-name-order
   table, ch. 12's calendar-methods table, ch. 13's 37-vs-36 BC table. These
   need re-capture (render the PDF page to PNG) or retyping as real tables —
   say the word and I'll run that pass. `// FIGURE:` comments mark every spot.

## Web-vs-PDF divergences

Full report: editorial-review/2026-07-12-web-vs-pdf/report.md. Headlines:
- The PDF preface is ~3x the web preface (web matched only ~34% of the span).
- No web-only paragraphs found in chapters 00-19 — the web is the PDF text
  plus edits, minus tables. CHANGED entries are mostly blockquote formatting
  + ligature noise, with some real wording edits to review.
- PDF combines "Herod's Appointment & Battle of Actium" into one chapter; the
  source keeps them as two files (15x2, 15x3). Your call whether to merge.

## Decisions parked for you

1. **Part titles** — the pipeline supports MEAT-style parts; PARTS is empty.
   Natural seams: Foundations (1-4), The Day/Month/Year (5-9), The Sabbath
   (10-11), Chronology (12-15+extras), Commands (16-19), Closing.
2. **Draft chapters 20-22** — in neither the print PDF nor the web reader
   manifest. Kept digital-only.
3. **Ch. 21 title** — source `#` heading says "Before Her Pain Came";
   filename says Pre-Tribulation Rapture. Front matter uses the source title.
4. **Title page / ISBN** — print/title-page.svg is a plain placeholder;
   00-copyright.adoc carries a TODO for the 2nd-ed ISBN and permissions block.
5. **Cross-references** — 15x2 references "Extra Chapter 1
   (e01_Herod_Regal_vs_Defacto.md)" literally in prose; needs re-pointing to
   the new chapter naming.

## Source-quality flags from the conversion (kept verbatim, for the editorial pass)

Citation errors: "Colossians 28" (2:8); "Matthew 23:34-40" (22:34-40);
"Hebrews 7:8" (8:1-5); "Leviticus 21:22" (16:21-22); "John 2:18" (2:19);
"Daniel 12:25" (7:25); "Matthew 5:17-10" (5:17-19); "2 Cor 14:1" (13 chapters);
Deuteronomy 17:7-9 verse numbers off by one; "Zechariah 14" over Exodus 31 text.

Factual/internal contradictions: 358 AD vs 350 AD (chs. 4/5); crucifixion
"31 AD" in ch. 18 vs "32 AD Resurrection" (ch. 12); Jesus 6 months older vs
younger than John (ch. 12); "fall of 28 BC" (should be AD); moon orbit
direction contradiction (15x4); IDL 1844 vs 1884 (ch. 5); Actium 7th vs 8th
regnal year (15x2); "22nd year" glossed with the Greek for "twelfth" (ch. 13).

Recurring typos: "cannon" for canon (13+ across chs. 2, 3, 6, 7, 12, 18);
"barely" for barley (×3, ch. 8); "lets" for let's (many); plus ~80
chapter-specific typos, all listed in the five agents' per-chapter reports —
kept verbatim in the source per the mechanical-conversion rule.

Structural oddities: ch. 6 ends a paragraph mid-sentence ("In this"); ch. 18
has a stranded half-sentence and one page-overflowing paragraph (the one
non-fatal build error); ch. 10 has severely mangled bold markup in quotes,
conservatively reconstructed — worth an author pass over its emphasis.

## Follow-up (author-directed, same day)

- **All 18 citation errors FIXED** in source (each verified against the quoted
  text first): Colossians 2:8; Deuteronomy 17:8-9/17:8 (labels had been
  swapped); 2 Corinthians 13:1; Job 38:31-33; Acts 7:42-43; Isaiah 66:23;
  Leviticus 16:21-22; John 2:19; Matthew 5:17-19; Hebrews 4:14-16;
  John 8:32-36; Hebrews 8:1-5; Matthew 22:34-40; Exodus 31:16-17 (was labeled
  Zechariah 14); Jeremiah 16:19; Daniel 7:25; Zechariah 14:16-17 (verses
  added); NKJV spelling. NOT touched: the Josephus "22nd year" Greek gloss
  (ch. 13) — a manuscript-tradition claim, needs the author.
- **All 10 lost data tables RECOVERED** from the print PDF's text layer,
  verbatim with ligature repair only (chs. 11 ×2, 12 ×2, 13, 14 ×4, 18).
  Print-edition discrepancies preserved and flagged: the Jonah table has 15
  rows though the prose says "16 Parallels"; print typos "travles"/"Ninevah"/
  "Shavout" kept. The NASA eclipse table exists in NEITHER source — its marker
  says so; the author must supply it.
- **Figures re-anchored by content** (23 exact-page verified, 6 page-matched,
  1 parked in 15x4 with its pdf page noted).
- **Herod's Appointment & Battle of Actium merged** (15x2) per the print PDF,
  both web texts verbatim, internal headings demoted one level; all five
  "Extra Chapter 1" references repaired into links to Herod: Regal vs De Facto.
