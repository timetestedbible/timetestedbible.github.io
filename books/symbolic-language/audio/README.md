# Audio edition — narration scripts

One `NN-*.adoc` here per print chapter: the same content, rewritten for the ear.
These are narration scripts, not a second book — the print chapter remains the
source of truth, and every meaning-level edit lands there first.

## The audio IS the book read aloud — additive transitions only

The script cannot deviate from the book or it isn't the book. Exactly two
kinds of change are permitted when transforming a print chapter:

1. **Additions** — teacher lead-ins ("Let's read Matthew 22.", "Hear Job:",
   "Listen to what Moses records:") and small connective words where print
   punctuation is unspeakable ("There were 22,273 of them…", "It is the
   register of which the psalm says…").
2. **Splits** — a sentence may divide at its own punctuation (a semicolon,
   a mid-sentence colon, the second dash of a chain) into two spoken
   sentences, keeping the book's words in the book's order. A split half
   may open with the book's own conjunction ("And a kingdom stamps its
   money.").

No vocabulary substitutions, no restructuring, no paraphrase. Scripture
quote text is verbatim, always.

## Sync process

- Each audio file's front matter carries `audio-of:` (the source file) and
  `synced-to:` (the git hash of the source version it mirrors).
- When a source chapter changes, update its audio twin in the same sitting and
  bump `synced-to`. Drift check: `git log -1 --format=%h -- <source>` vs the
  recorded hash.

## Annotation conventions (tool-agnostic; map to SSML at render time)

- `[beat]` — short breath, ~300ms. Replaces most em-dashes.
- `[pause]` — ~700ms. After every block quote, before a section's closing line.
- `[long pause]` — ~1.2s. Section transitions.
- `*word*` — vocal stress (the print edition's emphasis carries over).
- Block quotes = scripture voice: measured, slightly slower, a half-register
  shift. The intro sentence names the speaker; the quote is never followed by a
  spoken reference.
- Section headings are never spoken as bare fragments (author, 2026-07-10:
  "The Mint." heard cold doesn't tell a story). Each becomes a natural
  storytelling transition sentence that CARRIES the heading's words —
  "Every coin begins at the mint." — and video.py matches those words to
  the print heading to place the on-screen title card, which still shows
  the clean print heading. Then `[long pause]`.
- Chapter epigraphs are NOT read aloud (author, 2026-07-10: a cold verse
  with no context is an awkward start and breaks the chapter's flow). The
  audio opens with the chapter number and title, then the opening prose.
  The epigraph still belongs to the print page.

## Citation principles — the heart of the transform

1. **Never read book-chapter-and-verse.** The print page can carry
   "(Deuteronomy 6:25)"; the ear cannot. No colons, no verse numbers, ever.
2. **Attribution replaces citation.** "Paul writes to Timothy:", "Moses
   records:", "Hear Ezekiel:", "John saw…", "the psalmist sings…". If the
   speaker is already obvious, no attribution at all.
3. **Recall-references for established equations.** Once the book has proven an
   equation, later uses are memory work, not lookup work: "recall — sin *is*
   lawlessness"; "remember, the law is the *truth*"; "and love, we know, is the
   keeping."
4. **Scene-references over addresses.** "at the tribute trap", "when Korah
   challenged Moses", "the night Israel left Egypt" — the scene locates the
   text better than its coordinates.
5. **Cite-only parentheticals dissolve.** A fragment quoted with a bare
   reference either gains a speaker ("as Jesus said, …") or stands on its own
   authority. Multi-cite lists compress to a count: "(Rev 7:4; 15:2)" → "twice
   in Revelation."
6. **Book names survive only when the witness matters.** "the Hebrew Matthew",
   "the Greek", "Deuteronomy states it as law" — the source is the point, so it
   stays; otherwise it goes.
7. **Chapter cross-references become relative.** "the link:…[Name] chapter" →
   "the chapter on the Name" / "as we saw two chapters back" / "a later chapter
   takes this up." No links, no page numbers.
8. **Footnotes vanish.** Fold one clause inline if load-bearing; otherwise cut.
9. **Original-language words survive sparingly** — only when the argument
   stands on them — and get a natural spoken frame: "the Greek word is
   *adikia* — unrighteousness."
10. **Markup strips to speech.** `sym:` links become the bare word with stress;
    tables become parallel spoken lines with beats; long em-dash chains break
    into short sentences.
11. **The print sentence wins when it already reads aloud well.** This is a
    narration pass, not a rewrite — same argument, same order, same doctrine.

## Recovered words are spoken, not explained

Where print keeps a KJV word and defines it in the following line (2 Tim 2:19
"iniquity" = adikia), audio speaks the recovered rendering directly
("unrighteousness") — the ear cannot see footnotes, and a spoken
quote-then-correction is clunky. anomia is always "lawlessness" (inherited
from print); OT avon keeps "iniquity."

## Heavy punctuation splits at the book's own seams

Print's mid-sentence colons, em-dash chains, and semicolon stacks read as
slammed stops or run-ons in TTS. Split them into spoken sentences AT the
existing punctuation, words unchanged: "Ore is not spent; it is refined." →
"Ore is not spent. It is refined." Sweep patterns inside narrator prose:
`[a-z]: [a-z]`, paired ` — … — `, stacked `; `. A single em-dash speaks
fine and stays. (This is the additive rule applied to punctuation — never
reword to smooth a seam.)

## Teacher lead-ins before block quotes

The print edition removed command language; the EAR needs it. Every block
quote gets a directive lead-in that guides the listener — "Let's read
Matthew 22.", "Consider Ezra:", "Listen to what Moses records:", "Hear
Isaiah:" — varied naturally. The renderer's citation weave (render.py
`weave_citation`) cooperates:

- Lead-in carries book + chapter ("Let's read Luke 15.") — the weave
  detects it (punctuation- and "chapter"-word-insensitive) and adds nothing.
- Otherwise the reference joins the lead-in as natural English — never a
  dash splice (an em-dash synthesizes as a jarring pause), and the book
  name is always spoken with the chapter (a bare "chapter 13" is ambiguous
  by ear: of the book being read, or of THIS book?). "Hear Job:" becomes
  "Hear Job 34:"; "…Listen:" becomes "Listen to Zechariah 13:"; anything
  else joins with "in" — "Moses continues in Exodus 13:". (Author,
  2026-07-10.)

Never hand-write the weave's own "— Book N:" form; write natural speech and
let the renderer fold the reference in.

## Render-time pronunciation fixes (render.py)

`TTS_SPOKEN_FIXES` in render.py is a word-boundary substitution map applied
only to API-bound text — narration chunks, woven citations, and the
previous/next stitching context — never to the .adoc script or to the
on-screen captions video.py rebuilds from it, which keep the book's
spelling. First entry: the book "Job" (capital J only; lowercase
"job"/"jobs" untouched) is sent as "Jobe" so the voice reads the name, not
the occupation. Future mispronounced names slot in as one more
(pattern, spoken form) pair.

Beside the map, `NUM_COMMA` strips thousands-separator commas from the same
API-bound text (the voice chokes on "22,273" and "603,550"); it only fires
when exactly three digits follow to a boundary, so list commas ("Exodus
30:12, 15") never match. Captions and the script keep the book's
digits-with-commas style.

Double-quote marks are also stripped from API-bound text only — they make
the voice pause mid-sentence where prose glides into a quotation (author,
2026-07-10). Captions and the script keep the quotation marks; apostrophes
stay (contractions need them).

## Video edition — scripture on screen (video.py)

Every scripture reading is put on screen the same way, regardless of voice:

- Block quotes (`[quote.scripture]`) become full-screen quote cards with
  the citation line. Quotes past ~300 plain characters paginate at their
  own verse/sentence seams into pages of roughly 3-5 display lines, each
  page revealed in sync with the reading (whisper word times) — the
  citation stays on every page.
- Inline scripture the narrator reads inside prose gets the SAME card
  treatment (dim, panel, citation, gold keywords) when the quoted span is
  5+ words, timed to the spoken span and held at least ~3 s. Spans of 2-4
  words keep the small corner citation chip — a card would flash absurdly
  for a two-word fragment.
- After the voice finishes, a block quote may dock: the whole quote (when
  it fits the upper area cleanly at 0.66x) or its final page holds on a
  snug panel while the discussion captions run below.
- Every text backdrop — caption boxes, quote cards, docked quotes, chips —
  is a rounded, blur-feathered panel sized from measured text extents.
  No hard-edged boxes or bands.
- The corner brand mark alternates its two-line message ("Free eBook
  Available" / "Hardcover Book", each over TimeTested.Bible) at scene
  boundaries, holding each at least ~75 s.
- While the author is reviewing, build with `storyboard_stills.py <stem>
  --preview` — 720p, much faster turnaround. The approved final gets a
  full-resolution 1080p render (drop the flag).
