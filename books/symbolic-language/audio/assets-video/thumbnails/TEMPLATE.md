# YouTube thumbnail template — MEAT: The Bible's Symbolic Language

One recipe for every chapter so the series reads as one set. Sample built:
`09-the-seal.png` (draft, 2026-07-10). Imagery in this directory is
local-only (gitignored); this spec is the committed artifact from which any
chapter's thumbnail regenerates.

## Canvas

- 1280x720 PNG (YouTube standard). Also render a 320x180 LANCZOS copy
  (`NN-<slug>-320.png`) as the legibility proof — every text line must still
  read at that size.
- Tooling: Pillow in `audio/out/venv` (`out/venv/bin/pip install pillow`).

## Layers, back to front

1. **Bed image** — the chapter's approved 16:9 bed
   (`assets-video/NN-<slug>-bed.png`, 1920x1080), LANCZOS-resized to
   1280x720, then `ImageEnhance.Brightness 1.12` and `Color 1.05` (the
   book-plate beds run dark; the lift keeps midtones visible under
   compression). Choose/generate beds whose focal subject sits center-right —
   the left third is reserved for the title band.
2. **Left title band** — vertical translucent panel, color `(12, 9, 6)`
   (near-black warm brown): full alpha 225/255 from x=0 to x=400, linear
   fade to alpha 0 at x=680. Drawn as per-column 1px lines, composited over
   the bed.
3. **Title block** — left inset x=56, max text width 512 px, block
   vertically centered (top clamped to y>=40). Stacked top to bottom with
   the gaps given:
   - `MEAT` — Georgia Bold Italic 168 px, gold `#F0A722` (240,167,34),
     3 px stroke `(28,18,6)`. Gap after: 22.
   - Gold rule, 4 px tall, width = SUBW (below), at x=58. Gap after: 22.
   - Series subtitle — THREE lines mirroring the cover's stack, casing,
     and colors exactly: `THE BIBLE’S` (cream `#F2E9D6` (242,233,214),
     curly apostrophe) / `SYMBOLIC` (gold) / `LANGUAGE` (cream). All
     Georgia Bold; each line auto-fit (start 96 px, shrink by 2) to a
     common column width SUBW = min(512, MEAT text width x 1.04) — on the
     cover the subtitle column runs slightly wider than MEAT. Renders at
     74/86/82 px in this sample. 8 px between lines, 24 after.
   - Gold rule under LANGUAGE, 4 px tall, width = SUBW at x=58 —
     IDENTICAL to the rule under MEAT (the two in-column rules always
     match; no full-width rule). Gap after: 24.
   - `CHAPTER N` — Georgia Bold 34 px, gold, manual letterspacing +6 px per
     glyph, at x=58. Gap after: 14.
   - Chapter name in CAPS (`THE SEAL`) — Georgia Bold, gold, 2 px stroke
     `(28,18,6)`; start at 96 px and shrink in steps of 2 until the line
     fits 512 px (long titles like ORPHANS, WIDOWS, AND THE FATHERLESS may
     wrap to two lines at the natural comma instead — fit each line
     separately, same font size for both, minimum ~56 px). This is the
     biggest variable text on purpose: it is the per-video hook.
   - The band renders "Chapter N — Name" as eyebrow + display line rather
     than one em-dash line so long chapter names never shrink the name below
     thumbnail legibility.
4. **Book-cover icon** — bottom-right corner. Source:
   `books/symbolic-language/cover/front-cover-summit-meat.jpg` (the actual
   front-cover face, 1800x2700 — not a PDF crop, not a plate fallback).
   Scale to height 168 (width ~112), 3 px cream border, pasted at
   (1280 - w - 26, 720 - h - 26) over a Gaussian-blurred (r=7) black
   rectangle shadow, alpha 160, offset +4 grow. Same corner every chapter —
   it is the series brand mark per the ad-overlay language in the video
   pipeline.

## Fonts and palette (fixed for the series)

- Georgia Bold Italic / Georgia Bold from
  `/System/Library/Fonts/Supplemental/` — same family as nothing else on
  screen, echoing the cover's bold-serif gold title.
- Gold `(240,167,34)` and cream `(242,233,214)` are sampled from the print
  cover title treatment; panel `(12,9,6)`; strokes `(28,18,6)`.

## Per-chapter variables

Only three inputs change: bed image path, chapter number, chapter name.
Everything else is fixed.
