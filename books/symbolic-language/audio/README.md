# Audio edition — narration scripts

One `NN-*.adoc` here per print chapter: the same content, rewritten for the ear.
These are narration scripts, not a second book — the print chapter remains the
source of truth, and every meaning-level edit lands there first.

Every chapter opens with the book title, then its chapter number and name:
`MEAT The Bible's Symbolic Language. [beat] Chapter [number]: [name].`
Separately ordered studies (`16x`, `31x`, `31y`, and similar files) use
`Bonus Study` in place of a chapter number.

## The audio is a faithful spoken edition

The print chapter remains the authority, but fidelity is measured at the level
that matters: the audio carries the same claims, evidence, qualifications, and
conclusions in the same order. It need not preserve every sentence boundary or
print-dependent phrase.

The narration may:

1. add orientation, evidence lead-ins, memory cues, and short recaps;
2. split or lightly recast a sentence so it can be understood on one hearing;
3. replace visual or deictic language ("above," "the following table," "see
   chapter 9") with an audible location or relationship;
4. name an ambiguous pronoun or repeat a key noun after a long quotation; and
5. narrate tables, typography, and original-language evidence in linear form.

The narration may not introduce a new claim, omit contrary evidence, rearrange
the reasoning, soften a qualification, or turn a suggestion into a conclusion.
Scripture quotation text is verbatim. If a recovered or alternate rendering is
needed, the narrator identifies it before the quotation rather than silently
changing the verse.

## Listening first principles

1. **Give the listener a map.** Open with the question or tension, not the
   chapter's conclusion. At every major turn, say where the argument is going.
2. **Carry one inference at a time.** Break nested print sentences at their
   logical seams. Use explicit words such as "first," "now compare," and
   "this establishes" only when they reveal the actual structure.
3. **Use an evidence envelope.** The narrator names why a passage is being
   heard and gives its location; the Scripture voice reads it; the narrator
   returns by echoing the decisive phrase and explaining its consequence.
4. **Keep the witness locatable.** Major and block quotations receive a complete
   book, chapter, and verse citation before the voice switch. Exact citations
   for inline material remain in the transcript and in
   `COMPANION-REFERENCES.md`; narration uses natural attribution without
   reading a parenthetical after every sentence.
5. **Repair visual dependence.** No "as you can see," unexplained "above" or
   "below," page number, bare table, or cold heading may carry part of the case.
6. **Protect working memory.** After a dense chain of witnesses, restate the one
   equation they established before adding another symbol or language term.
7. **Switch voices deliberately.** The narrator owns explanation, citations,
   and inline quotations. The Scripture voice owns cited block quotations only.
   Neither voice begins cold, and the narrator does not interrupt a block.
8. **Prefer scenes to coordinates in the prose.** "At the tribute trap" helps
   memory better than a bare address; the full address still precedes the block.
9. **Pronounce once, then use the meaning.** Hebrew and Greek survive only when
   the inference depends on them. Spell letters only when the letter pattern is
   itself evidence.
10. **Close the loop.** End by stating what the chapter demonstrated, not by
    adding a new premise, and hand the listener one clear question for the next
    chapter when the sequence depends on it.

## Sync process

- Each audio file's front matter carries `audio-of:` (the source file),
  `synced-to:` (the nearest git revision), and `source-digest:` (a hash of the
  title, order, and chapter body; web-only metadata is excluded).
- When a source chapter changes, update its audio twin in the same sitting and
  refresh both synchronization fields.
- Run `python3 audio/audit.py`. It checks missing studies, digests, Scripture
  block order and wording, content drift, voice cues, and print-only markup.

## Annotation conventions (tool-agnostic; map to SSML at render time)

- `[beat]` — short breath, ~200ms. Replaces only punctuation that needs help.
- `[pause]` — ~450ms. After every block quote, before a section's closing line.
- `[long pause]` — ~800ms. Section transitions.
- `*word*` — vocal stress (the print edition's emphasis carries over).
- Blocks marked `[quote.scripture]` use the Scripture voice: measured, slightly
  slower, a half-register shift. Historical and modern block quotations remain
  in the narrator's voice. The narrator gives the complete biblical citation
  and the reason for hearing the passage before the switch. The return names
  the phrase now under discussion.
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

## Citation principles — locatable without constant interruption

1. **Speak complete block citations before the quotation.** The renderer turns
   `John 14:6` into "John chapter 14, verse 6" and ranges into natural speech.
   The narrator speaks the location; the Scripture voice speaks only Scripture.
2. **Use attribution for inline quotations.** "Paul writes to Timothy," "Moses
   records," "John saw," and "the psalmist sings" keep the listener oriented.
   Do not bolt a spoken parenthesis onto the end of every sentence. The complete
   inline citation remains in the transcript and companion reference list.
3. **Use recall references for established equations.** Once the book has proven an
   equation, later uses are memory work, not lookup work: "recall — sin *is*
   lawlessness"; "remember, the law is the *truth*"; "and love, we know, is the
   keeping."
4. **Prefer scene references inside the explanation.** "At the tribute trap," "when Korah
   challenged Moses", "the night Israel left Egypt" — the scene locates the
   text in memory; the citation locates it on the page.
5. **Cite-only parentheticals do not enter the prose.** A fragment quoted with a bare
   reference either gains a speaker ("as Jesus said, …") or stands on its own
   authority. Multi-cite lists compress to a count: "(Rev 7:4; 15:2)" → "twice
   in Revelation," with the exact list preserved in the transcript.
6. **Name translations only when the wording matters.** The default translation
   need not be announced repeatedly. Say "the New King James reads" or "from
   the Hebrew Matthew" when the argument depends on that witness.
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

## Recovered words are announced, not silently substituted

Where the argument depends on a recovered rendering, the narrator prepares the
listener: "The King James says *iniquity*; the Greek word here is *adikia*,
unrighteousness." The Scripture voice then reads the exact translation named in
the citation marker. This keeps the evidence honest while avoiding a confusing
quote-then-correction after the handoff.

## Heavy punctuation splits at the book's own seams

Print's mid-sentence colons, em-dash chains, and semicolon stacks can become
slammed stops or run-ons in TTS. Split them at logical seams, and lightly recast
only when a punctuation-only split would leave an orphaned phrase. Preserve the
inference and its order. A single em-dash often speaks well and may stay.

## Teacher lead-ins before block quotes

The print edition can rely on typography; the ear needs an invitation. Every
block quote gets a lead-in that says why this witness comes next — "Moses now
defines the term," "Jesus answers the question," "The second witness is
Isaiah." A neutral "Let's read" is acceptable when no stronger relationship is
available, but repeated generic commands are an editorial warning. The
renderer’s citation weave (render.py
`weave_citation`) cooperates:

- A lead-in that already carries the full reference is left alone.
- Otherwise the reference joins the lead-in as natural English — never a
  dash splice. "Hear Job:" becomes "Hear Job chapter 34, verse 3";
  "Jesus answers:" becomes "Jesus answers in John chapter 14, verse 6."

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
