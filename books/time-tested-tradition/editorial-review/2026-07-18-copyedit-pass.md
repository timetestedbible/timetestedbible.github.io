# TIME / Time Tested Tradition — full copyedit pass

Date: 2026-07-18  
Scope: all 34 AsciiDoc manuscript files in `books/time-tested-tradition/` (approximately 131,000 source words)

## Applied without changing meaning

The manuscript received a full grammar and mechanics pass. Corrections were applied directly in 28 source files and included:

- missing introductory, parenthetical, serial, and compound-sentence commas;
- comma splices, run-on sentences, fragments, and subject–verb agreement;
- misplaced modifiers, pronoun agreement, parallel construction, and article/preposition errors;
- compound modifiers and standard forms such as `works-based`, `24-hour`, `week-long`, `lawbreaker`, `noncanonical`, and `antichrist`;
- capitalization of `Scripture`, `Old Testament`, `New Testament`, headings, and proper names;
- quotation-mark placement, duplicate quotation marks, and terminal punctuation;
- number ranges, thousands separators, and obvious typographical inconsistencies;
- limited sentence restructuring where the intended meaning was clear.

Scripture quotations were treated conservatively. Only unmistakable mechanical defects were changed; archaic grammar and translation wording were preserved. The required translation audit was regenerated after the quote edits.

## Author decisions required

### 1. Contradictory year reference

`14-passion-week.adoc` currently says:

> If you use a viable start of year rule for the crescent calendar then 33 AD has Passover on Saturday in 30 and 33 AD.

It is unclear whether the subject should be “the crescent calendar,” whether `33 AD` should be removed before “has Passover,” or whether a different year/range was intended. The sentence was left unchanged.

### 2. Murder/Sabbath comparison points in an unclear direction

`17-commands-to-follow.adoc` currently says:

> If we can expect people to repent from murder, on what basis is murder different from keeping the Sabbath?

The surrounding argument appears likely to compare murder with *breaking* the Sabbath, but changing `keeping` to `breaking` would change the explicit claim. Please confirm the intended comparison.

### 3. “Ascribe salvation unto yourself”

`19-miscellaneous-commands.adoc` currently says:

> The line is crossed when you condemn others to hell or ascribe salvation unto yourself by virtue of your keeping of the law in more points than them.

`Ascribe salvation unto yourself` is grammatical but semantically unusual. Please confirm whether the intended sense is “claim salvation for yourself,” “ascribe righteousness to yourself,” or the present wording.

### 4. Open-ended dates in the bombardment list

`19x2-usa-is-babylon-the-great.adoc` contains several ranges with no ending year (for example, `Afghanistan 2001-`, `Syria 2014-`, and `Russia 2023-`). The notation can mean “through the present,” but the publication cutoff is not stated and the claims are time-sensitive. These were not completed or fact-checked during a grammar pass.

### 5. Three translation labels remain unidentified

The regenerated `translation-audit.md` identifies three quotations in `07x-lucifers-declared-plan.adoc` whose wording is modern or author-rendered but whose citation does not name a version:

- Isaiah 14:13 — “the seat heard twice”
- Isaiah 14:14 — “spoken once, heard twice”
- Isaiah 14:12–14 — “read through the symbols”

If these are the author’s translations, label them `literal rendering` or another approved own-rendering label. Otherwise, name the source translation.

## Existing production gaps noticed

These are not grammar issues, but they remain explicitly marked in source and affect completeness:

- `06-when-does-the-day-start.adoc`: two referenced diagrams are missing.
- `12-32-ad-resurrection.adoc`: a referenced candidate-year comparison table is missing.
- `13-herod-the-great.adoc`: a referenced 37 BC versus 36 BC comparison table is missing.

## Verification

- On-device grammar pass run over author prose, excluding front matter, tables, code-like markup, and Scripture quote blocks.
- Secondary spelling and usage checks run across all manuscript files.
- `git diff --check` used to verify whitespace and patch integrity.
- `python3 scripts/translation-audit.py books/time-tested-tradition` rerun after quotation changes.
- Final AsciiDoc/PDF build completed successfully: 444-page print PDF, 499-page screen PDF, EPUB, and a 507-reference Scripture index.
- Representative rendered pages were inspected across front matter, early chapters, heavily edited late chapters, closing matter, glossary, and author page; no layout regressions were found.
