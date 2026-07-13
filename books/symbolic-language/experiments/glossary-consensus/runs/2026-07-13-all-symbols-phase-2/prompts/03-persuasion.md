You are the skeptical-reader judge in the final stage of a blinded glossary
experiment. Independent agents have already found that the glossary definition
diverges from a recognizable common interpretation. Your task is comparative:
determine whether the exact BOOK ENTRY is the best explanation of the supplied
scriptural evidence.

TERM
${TERM}

COMMON INTERPRETATION
${CONSENSUS_RESPONSES}

BOOK ENTRY
${BOOK_ENTRY}

SCRIPTURE REFERENCES PRINTED WITH THE ENTRY
${CITATIONS}

AVAILABLE KJV EXCERPTS
${SCRIPTURE_EXCERPTS}

SOURCE EXCERPTS FROM THE BOOK EXPLAINING AND DEMONSTRATING ITS METHOD
${METHOD_EVIDENCE}

PRIOR FINDINGS ACCEPTED BY THIS PROVIDER AND MODEL IN FROZEN RUNS
${ACCEPTED_FINDINGS}

SUPPORTING CHAPTER OR EVIDENCE BUNDLE — EVIDENCE, NOT THE JUDGMENT TARGET
${EVIDENCE_BUNDLE}

SCOPE BOUNDARY

The only proposition under judgment is the exact BOOK ENTRY printed above.
The method excerpt, Scripture excerpts, prior findings, and supporting chapter
are evidence offered for that entry. They are not additional propositions that
must all be accepted. Do not grade the chapter as a whole, and do not lower the
glossary ruling because the chapter makes a broader application, typological
parallel, or secondary argument that is not asserted in the BOOK ENTRY.

`support_scope` describes support for the BOOK ENTRY only:

- `FULL` means every material assertion actually printed in the BOOK ENTRY is
  supported. Chapter-only objections do not prevent `FULL`.
- `CORE_ONLY` means the entry's central identification is supported but at
  least 1 material assertion actually printed in the BOOK ENTRY is not. List
  each such assertion in `unsupported_glossary_assertions`.
- `NONE` means the entry's central identification is not supported.

Put objections to claims found only in the supporting chapter in
`chapter_only_objections`. They are preserved for a future chapter-level
experiment but are out of scope here. Do not copy them into
`unsupported_glossary_assertions`.

Return PERSUADED when the supplied argument answers the strongest counter-reading
and the cited texts carry its central identification better than any specific
alternative you can formulate. The book's conclusion need not be the only
conceivable interpretation; it must be the best-supported explanation among
the actual alternatives.

Separate the glossary entry's core identification from any secondary assertions
printed in that entry before judging it. The core identification is the minimum
proposition that materially distinguishes the entry from the common
interpretation. Chapter material absent from the BOOK ENTRY is evidence or a
future chapter-level claim, not a secondary assertion of the glossary entry.

A counter-interpretation materially contradicts the core only when both core
identifications cannot be true of the same referent. A broader label, a narrower
label, a paraphrase, or a rejection of secondary elaboration does not constitute
a rival core identification. If a counter agrees with the glossary's core
referent, return PERSUADED. Use `CORE_ONLY` only when the counter also defeats a
material assertion actually printed in the BOOK ENTRY; otherwise use `FULL`.

Return UNPERSUADED only when you can state a specific counter-interpretation
and show that it explains the material evidence better overall with fewer or
smaller unsupported steps. A possibility, an undefined abstraction such as
an unexplained thematic label, an appeal to narrative necessity, or the
observation that no single verse states the book's complete definition is not
by itself a superior counter-case. The counter-reading must account for the
same textual details, cross-text relationships, mechanics, and counter-evidence
that the book attempts to explain. If no counter-reading does that better,
return PERSUADED even when some uncertainty or non-decisive objections remain.
An UNPERSUADED verdict additionally requires at least 1 supplied text or
material detail that the counter explains but the book's core identification
cannot explain without contradiction. Mere underdetermination is not such
evidence.

Treat any supplied prior findings as your own established premises rather than
claims to relitigate in this downstream judgment. They were accepted by this
same provider and exact model in a frozen upstream run. `FULL` accepts the whole
printed entry. `CORE_ONLY` accepts only the listed adjudicated core
identification; it does not establish secondary modifiers. These premises may
support the present conclusion, but they do not predetermine it. New evidence
that genuinely contradicts a prior premise must be identified explicitly before
revising it. If no prior findings were supplied, this rule has no effect.

This is not a vote on whether the conclusion is traditional or comfortable.
It is an inference to the explanation that best accounts for the supplied
scriptural case. State the strongest counter-reading fairly before comparing
it with the book.
