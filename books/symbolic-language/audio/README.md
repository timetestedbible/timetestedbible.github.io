# Audio edition — narration scripts

One `NN-*.adoc` here per print chapter: the same content, rewritten for the ear.
These are narration scripts, not a second book — the print chapter remains the
source of truth, and every meaning-level edit lands there first.

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
- Section titles are read aloud, then `[long pause]`.
- Epigraphs are read as the chapter's opening line, introduced softly
  ("Revelation ends with this promise: …").

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

## Colon appositions re-flow for speech

Print's terse appositions ("The LORD: the name.") read as slammed stops in
TTS. Speak them as flowing clauses ("The LORD — there is the name.") or full
sentences. Sweep pattern when transforming: `[a-z]: [a-z]` inside narrator prose.

## Never hand-write citation cues in scripts

The renderer weaves "— Book N:" into the intro clause automatically from the
[quote.scripture, REF] marker. Scripts leave intros bare ("…reads it out:");
hand-written cues double up. (The renderer also dedupes as a backstop.)
