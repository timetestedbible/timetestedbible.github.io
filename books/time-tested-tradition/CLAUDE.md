# Time Tested Tradition (2nd edition) — agent orientation

Book by Daniel Larimer. This directory is the 2nd-edition WORKING SOURCE,
converted 2026-07-12 from the two existing editions, which remain untouched
and authoritative for the public until the 2nd edition ships:

- WEB (live): `chapters/*.md` + `extra/*.md` at repo root, served by
  `timetested-chapters.js` — do not edit or delete.
- PRINT (latest PDF): `media/time-tested-tradition.pdf` (345 pp, already a
  2nd-edition draft: includes Lucifer's Declared Plan, the extras as print
  chapters, and a Closing Remarks chapter the web lacks).

## Layout — mirrors books/symbolic-language/ (MEAT)

- `NN-*.adoc` chapters with Jekyll front matter (`title`, `slug`, `permalink`,
  `order`, `published: false` until the author flips it). `NNx-*.adoc` =
  order-N.5 inserts, edition per front matter.
- `print/` — build pipeline FORKED from MEAT's 2026-07-12 (build.rb,
  extension.rb, themes, fonts). Outputs `time-tested-tradition-{print,screen}.pdf`
  + epub + gray. Same build discipline as MEAT (one build at a time; verify;
  commit separately) — read books/symbolic-language/CLAUDE.md for the rules.
- `images/masters/` — 30 figures extracted from the PDF at native resolution,
  named `<chapter-slug>-figN-p<pdfpage>.<ext>` (the pdf page is the placement
  authority).
- `editorial-review/2026-07-12-web-vs-pdf/report.md` — the divergence report
  (web wins by default; PDF-only and changed passages listed for the author's
  merge pass).
- `CONVERSION-SPEC.md` — the mechanical md→adoc rules used for the conversion.

## Provenance rules

- Conversion was MECHANICAL: wording is verbatim from the web edition
  (2nd-edition draft); do not "improve" prose without the author.
- Chapters 20-22 (USA is Babylon, Pre-Trib Rapture, Blood Moon) are web-only
  drafts: not in the print PDF, not in the web reader manifest — kept as
  `edition: digital` pending the author's ruling.
- The extras print in the PDF between Solar Only Calendars and The Path to
  Salvation (files 15x1-15x4); First Fruits & New Wine is web-only digital.
  The PDF combines Herod's Appointment with Battle of Actium; the source keeps
  them separate files pending the author's ruling.
- MEAT overlaps (Lucifer's Declared Plan, The Path to Salvation) convert as-is;
  deduplication between the two books is an authorial decision, not a mechanical one.
