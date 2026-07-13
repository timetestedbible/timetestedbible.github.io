# TTT 2nd Edition — Markdown → AsciiDoc conversion spec

Mechanical conversion of `chapters/*.md` and `extra/*.md` (repo root) into
`books/time-tested-tradition/NN-slug.adoc`, matching the MEAT pipeline
(`books/symbolic-language/`). **ZERO content editing** — wording stays verbatim;
only markup converts. Typos and oddities get FLAGGED in your report, never fixed.

## Front matter template

```
---
title: "<Title — strip any leading 'N. ' or 'Extra: ' prefix>"
slug: <kebab-case-slug>
order: <N, or N.5 for x-files>
permalink: /books/time-tested-tradition/<slug>/
published: false
description: "<summary text from /tmp/ttt-map.json for this chapter id; if absent, first sentence of the chapter>"
---
```

Extras (`e0N_*.md` → `NNx-*.adoc`) additionally carry `edition: digital`.

## Body rules

1. Drop the opening `# Title` line — the front matter carries it. `##` → `===`, `###` → `====`.
2. Reflow to ONE SENTENCE PER LINE (whitespace-only change; blank line between paragraphs).
3. Emphasis: `**x**` → `*x*`; `*x*` → `_x_`.
4. Scripture blockquotes (`> *text*` lines with a `> — Book C:V` attribution) →

   ```
   [quote.scripture, Book Chapter:Verse]
   ____
   text of the verse, keeping any emphasis as *bold*
   ____
   ```

   Expand abbreviated book names in the attribution AND in inline prose
   citations to FULL names (Deut. → Deuteronomy; Matt. → Matthew; the print
   build abbreviates at build time). If a translation is named, keep it:
   `[quote.scripture, Daniel 2:35 (NKJV)]`.
5. Non-scripture quotes (Josephus, historians, modern authors) → `[quote, Attribution]` + `____` block.
6. Markdown tables → `[%unbreakable, frame=topbot, grid=none, cols="<one per column>", options="header"]` + `|===` table.
7. Images/HTML/embeds: none expected. If one appears, insert `// FIGURE: <describe>` at that spot and flag it.
8. Clean `&nbsp;`, trailing double-space line breaks, and stray `  ` blank-line padding into normal paragraphs.
9. External links → `https://...[link text]`. Internal timetested.bible links: keep absolute.
10. Do NOT add sym: macros, do NOT renumber chapters, do NOT touch wording.

## Verification (required per file)

After writing each file, parse-check it:

```
ruby -r asciidoctor -e 'Asciidoctor.load_file("<file>", safe: :unsafe)' 2>&1
```

No output = pass. Report any warnings verbatim.

## Report format (your final message)

Per file: `<new filename>` — quotes converted N, tables N, flags: [...].
Flags include: suspected typos (quote them), unusual markup, content that looks
truncated or malformed, any deviation you had to make from this spec.
