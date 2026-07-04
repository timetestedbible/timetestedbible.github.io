# Research: Chapter dependency graph — weight audit

Author 2026-07-04: "not all chapters carry their weight… build a dependency
graph on what symbols depend upon knowing the other symbols, which ones are
foundation of doctrine and which ones are mere curiosity."

Method: mechanical extraction from the sources themselves. The glossary's
seerefs assign each of the 122 symbols an owning chapter; every `sym:` use
and `link:` chapter reference in a chapter body whose owner is another
chapter is a dependency edge. Doctrinal-spine feed = edges consumed by chs.
6, 19, 25, 26, 28, 30, 31, 32, 33, 34.

## In-degree (how many chapters depend on this one)

| ch | chapter | defines | depended on by | refs | feeds spine |
|---:|---|---:|---:|---:|---|
| 3 | sea-and-waters | 10 | 16 ch | 49 | 6 spine ch |
| 8 | the-name | 1 | 15 ch | 21 | 5 spine ch |
| 2 | mountain | 5 | 14 ch | 29 | 7 spine ch |
| 7 | way-truth-life | 8 | 14 ch | 38 | 5 spine ch |
| 17 | orphans-widows | 6 | 14 ch | 42 | 4 spine ch |
| 13 | trees | 9 | 13 ch | 35 | 4 spine ch |
| 9 | marriage-divorce | 3 | 11 ch | 15 | 2 spine ch |
| 6 | gospel | 1 | 10 ch | 16 | 5 spine ch |
| 15 | garments | 6 | 10 ch | 21 | 2 spine ch |
| 21 | knowing-faith | 7 | 9 ch | 17 | 4 spine ch |
| 10 | the-bow | 4 | 8 ch | 13 | 1 spine ch |
| 14 | grass | 9 | 8 ch | 20 | 2 spine ch (11 refs — parables) |
| 19 | fall-of-babylon | 4 | 8 ch | 12 | 2 spine ch |
| 22 | fool-and-wise | 7 | 8 ch | 12 | 2 spine ch |
| 25 | sun-moon-stars | 3 | 8 ch | 24 | 4 spine ch (12 refs) |
| 28 | shadow | 1 | 8 ch | 8 | 3 spine ch |
| 16 | wings | 2 | 6 ch | 14 | 2 spine ch |
| 23 | light-darkness | 5 | 6 ch | 11 | 3 spine ch |
| 11 | four-winds | 7 | 5 ch | 15 | 0 |
| 20 | the-remnant | 1 | 4 ch | 6 | 1 spine ch |
| 4 | signs-similitudes | 1 | 3 ch | 5 | 1 spine ch |
| 31 | worship | 1 | 3 ch | 3 | 2 spine ch |
| 32 | fear-of-the-lord | 1 | 3 ch | 3 | 1 spine ch |
| 5 | sign-of-jonah | 5 | 2 ch | 5 | 1 spine ch |
| 29 | justice-judgment | 2 | 2 ch | 3 | 1 spine ch |
| 30 | liberty | 1 | 2 ch | 3 | 1 spine ch |
| 18 | the-moment | 1 | 1 ch | 2 | 1 spine ch (shadow) |
| 24 | jacob-israel-ephraim | 4 | 1 ch | 1 | 0 |
| 27 | the-pearl | 2 | 1 ch | 2 | 1 spine ch (parables) |
| 33 | parables | 1 | 1 ch | 1 | — (terminal) |
| 34 | path-to-salvation | 1 | 1 ch | 1 | — (terminal) |
| 1 | introduction | 2 (milk, meat) | 0 | 0 | — (front door) |
| 12 | clouds | 1 | 0 | 0 | 0 |
| 26 | lucifer | 0 | 0 | 0 | — (terminal) |

## Tiers

**Foundation (the grammar — everything reads through them):**
sea-and-waters, mountain, way-truth-life, the-name, orphans-widows (bread,
fatherless — 42 refs), trees, gospel, garments, marriage-divorce.
These are untouchable and correctly early.

**Doctrine spine (terminal consumers — weight is the argument, not reuse):**
sun-moon-stars → lucifer → (pearl) and shadow → justice → liberty →
worship → fear → parables → path. In-degree is the wrong metric for these;
their test is whether they draw on the foundation (all do) and whether the
closer gathers them (see finding 1 — it doesn't).

**Feeders (mid-tier, earn their place through the spine):**
grass (11 refs into parables), wings (6 into orphans; 6 into shadow),
knowing-faith, fool-and-wise, light-darkness, four-winds, bow, remnant,
fall-of-babylon, signs-similitudes (method).

**Showcases (low reuse, high demonstration value — keep, but wire in):**
sign-of-jonah (the first full worked proof of the method), the-pearl
(marquee discovery; parables defers to it).

**Islands (the data's "mere curiosity" list):**
clouds (0 inbound), the-moment (2 refs inbound, consumes nothing),
jacob-israel-ephraim (1 inbound — and it sits AFTER its only consumer).

## Findings

1. **path-to-salvation doesn't cash in the book's currency.** The closing
   chapter consumes only way-truth-life (4) and garments (1). The summit of
   the book never draws on gospel, liberty (release), shadow, worship, fear,
   knowing/belief, or parables. Highest-value fix in the book: make the
   closer gather the spine.
2. RULED 2026-07-04: author agreed clouds "can be set aside or moved to a
   bonus appendix" — moved to Appendix: Clouds (34-appendix-clouds.adoc,
   between Path to Salvation and the Glossary); chapters 13-34 renumbered
   down one; glossary pointers recomputed; registry entry relocated.
   **clouds was a disconnected leaf** — but its consumers already exist
   unlinked: lucifer quotes "heights of the clouds" (Isa 14:14), shadow has
   Isa 4:5-6 (cloud canopy), fall-of-babylon has Ezek 38:9 ("come like a
   cloud to cover the land"). Wiring those three turns clouds into a feeder
   of the calendar-usurper case (the usurper claims the King's chariot).
3. RULED 2026-07-04: moved to Appendix: The Moment (33-appendix-the-moment.adoc).
   **the-moment consumes nothing and almost nothing consumes it.** Either
   wire it into path-to-salvation (it times the doctrine path teaches) or
   fold it into remnant/shadow as a section.
4. RULED 2026-07-04: moved to Appendix: Jacob, Israel, and Ephraim
   (34-appendix-jacob-israel-and-ephraim.adoc); main chapters renumbered 1-31.
   **jacob-israel-ephraim sat after its only consumer** (remnant, ch 20,
   forward-refs it). Either move jacob before remnant, or wire
   fall-of-babylon's north-country material and gospel's lost-sheep material
   to it — both are natural consumers that currently don't link.
5. **The title symbol has near-zero graph presence.** milk and meat are
   defined in passing in the introduction and never referenced again
   (2 of the 33 orphan symbols). Now that the book is titled MEAT, the
   thesis symbol is the least-developed symbol in it. Confirms the pending
   fuller meat/milk treatment.
6. **pearl ↔ lucifer cross-cite is missing and load-bearing:** pearl proves
   pearl = full moon (the gates of the city); lucifer proves the usurper's
   throne (kisse'/keseh) = full moon. The true full moon and the counterfeit
   are the same object read two ways — the chapters prove it separately and
   never tell each other.
7. 33 of 122 glossary symbols are never used outside their defining chapter.
   Most are local color (fish-2, nineveh, elam, dog); notable exceptions
   worth downstream use: meat, milk, cloud, jacob/ephraim/lost, day, heaven.
8. Forward references (early chapters sym-linking later symbols) are
   pervasive but harmless — the sym: convention routes through the glossary.
   The only ordering inversion that matters pedagogically is remnant→jacob
   (finding 4).

Raw edge data: /tmp/depgraph.json (regenerate with the extraction script in
the session log; inputs are the glossary seerefs + sym:/link: uses).
