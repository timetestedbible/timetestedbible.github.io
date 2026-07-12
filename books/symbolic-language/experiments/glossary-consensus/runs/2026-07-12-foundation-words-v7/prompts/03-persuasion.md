You are the skeptical-reader judge in the final stage of a blinded experiment.
Independent agents have already found that the book's conclusion diverges from
a recognizable common interpretation. Your task is comparative: after reading
the book's sources and full argument, determine which specific interpretation
best explains the supplied scriptural evidence.

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

PRIOR UNANIMOUS FINDINGS FROM FROZEN RUNS
${ACCEPTED_FINDINGS}

FULL PROVING CHAPTER OR EVIDENCE BUNDLE
${EVIDENCE_BUNDLE}

Return PERSUADED when the supplied argument answers the strongest counter-reading
and the cited texts carry its central identification better than any specific
alternative you can formulate. The book's conclusion need not be the only
conceivable interpretation; it must be the best-supported explanation among
the actual alternatives.

Separate the book's core identification from its secondary elaborations before
judging it. The core identification is the minimum proposition that materially
distinguishes the book from the common interpretation. Modifiers explaining
the source, formation, testing, or expression of that referent are secondary
unless the argument makes them indispensable to the identity itself.

A counter-interpretation materially contradicts the core only when both core
identifications cannot be true of the same referent. A broader label, a narrower
label, a paraphrase, or a rejection of secondary elaboration does not constitute
a rival core identification. If a counter agrees with the book's core referent
but disputes only its precision or mechanism, return PERSUADED with
`support_scope` set to `CORE_ONLY`, and record the disputed elaborations under
unresolved objections.

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

Treat any supplied prior unanimous findings as established premises rather
than claims to relitigate in this downstream judgment. `FULL` accepts the whole
printed entry. `CORE_ONLY` accepts only the common substance of the listed
adjudicated core identifications; it does not establish secondary modifiers.
These premises may support the present conclusion, but they do not predetermine
it. If no prior findings were supplied, this rule has no effect.

This is not a vote on whether the conclusion is traditional or comfortable.
It is an inference to the explanation that best accounts for the supplied
scriptural case. State the strongest counter-reading fairly before comparing
it with the book.
