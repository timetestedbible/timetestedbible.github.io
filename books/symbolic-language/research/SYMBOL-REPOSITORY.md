# Canonical Symbol Repository

The `_symbols/` collection is the migration target for the canonical record
repository for symbols, recovered Words, and aliases. A file becomes canonical
only when it carries `record_version`; the remaining legacy studies must not be
assumed to agree with the book. Each canonical record combines two things that
must remain distinguishable:

1. **Structured data in YAML frontmatter** for definitions, authority, aliases,
   relations, lexemes, evidence, research status, and provenance.
2. **A prose study in Markdown** that teaches how Scripture produces the
   definition, tests competing readings, and shows the complete occurrence
   range.

Each term is compared through up to three different lenses. They must not be
quietly collapsed into one definition, and a layer must not be invented merely
to make every record look symmetrical:

1. **Bible symbolic sense** — for a Symbol, what the image signifies when
   Scripture activates a symbolic use. This is `not-applicable` for recovered
   Words unless Scripture independently uses the Word as an image.
2. **Bible literal sense** — what the same word names in ordinary biblical
   narrative, law, history, poetry, or instruction.
3. **Webster's English sense** — what an independent public-domain English
   dictionary says the word ordinarily means.

The biblical literal sense is not Webster copied into a Bible field. It must be
stated from literal biblical uses and, where necessary, the underlying Hebrew
or Greek range. Webster is a comparison witness: it may agree with the biblical
literal sense, overlap it, omit an ancient feature, or contain later senses the
Bible never uses.

A verse may be `literal`, `symbolic`, or `both`. Joseph's dream, for example,
uses literal celestial objects as the visible structure of a symbolic family
scene. Calling the verse symbolic does not erase the literal properties that
make the comparison work. The occurrence register should therefore permit
overlapping classifications rather than forcing every verse into one exclusive
bucket.

The book glossary is the authority for an approved definition while the
repository is being migrated. The `research/research-*` files usually contain
newer evidence, but newer does not mean more vetted. Research may propose a
refinement without silently changing the definition readers see in the book,
website index, Scripture popups, or MEAT Tester.

## Authority order

| Layer | Purpose | May change the approved definition? |
|---|---|---|
| `books/symbolic-language/49-glossary.adoc` | Reader-approved definition and citations | Yes, after author approval |
| `_symbols/<key>.md` `definition` | Exact structured copy of the approved glossary definition | No; it must match the glossary during migration |
| `_symbols/<key>.md` `research.candidate_definition` | Latest proposed refinement | No; status remains `awaiting-review` until approved |
| `books/symbolic-language/research/research-*.md` | Research notebooks, occurrence sweeps, countertexts, and discarded readings | No; these are evidence sources |
| Experiments and reviews | Independent assessments of definitions and arguments | No; they inform review rather than define doctrine |

After every glossary entry has been migrated and checked, the direction can be
reversed: approved frontmatter can generate the glossary, experiment input,
website dictionary, and popups. Until that migration is complete, the
validator treats the book glossary as authoritative and reports drift.

The present filenames are not a one-to-one data model. Some glossary entries
have no same-key website study, while some website studies are thematic pages
or use a different key. `npm run verify:symbol-records` reports both sets. Each
must be classified, merged, or linked deliberately; filename resemblance is
not enough to infer identity or alias status.

## Record types

- `symbol` — a scriptural image whose symbolic meaning differs from its literal
  dictionary meaning.
- `word` — a recovered biblical word whose meaning has been flattened or
  altered in common use.
- `alias` — a lookup-only record containing `alias_of`; it does not repeat the
  definition or evidence.

## Version 1 frontmatter

```yaml
record_version: 1
record_type: symbol
symbol_key: valley
term: Valley
title: "Valley — Symbol Research"
words: [valley, valleys, vale, dale]
aliases: []
strongs: [H6010, H1516, H5158, H8219, H1237, G5327]

# Compatibility copy of the current glossary wording. Its status determines
# whether the wording is approved or still a draft.
definition: >-
  The low and humbled; “every valley shall be exalted”.
meaning: "The low and humbled"
definition_meta:
  authority: book-glossary
  status: draft
  source: books/symbolic-language/49-glossary.adoc#sym-valley
  verdict: divergent

# The three compared definitions. `definition` above remains the compatibility
# copy of the approved glossary definition during migration.
definitions:
  bible_symbolic:
    text: >-
      The low and humbled passage between mountain-kingdoms: the Way of descent,
      service, and obedience even unto death by which one leaves one rule and
      ascends another. A valley lifted or filled pictures resurrection,
      exaltation, and the preparation of the Way into the Mountain of God.
    status: proposed
    authority: research
    citations: [Ezek 37:1-14, Isa 40:3-4, Luke 3:4-5, Zech 14:4-5, Phil 2:5-9]
  bible_literal:
    text: >-
      Low ground lying between or beneath surrounding heights, often carrying
      water and marking the border between territories.
    status: proposed
    citations: [Deut 11:11, Josh 18:16, 1 Sam 17:3]
  webster:
    text: >-
      The space enclosed between ranges of hills or mountains; the strip of
      land at the bottom of depressions intersecting a country.
    status: quoted
    headword: VALLEY
    source: "Webster's Revised Unabridged Dictionary (1913)"

# Newer research remains visibly separate until the author approves it.
research:
  status: awaiting-review
  candidate_definition: >-
    The low and humbled passage between mountain-kingdoms: the Way of descent,
    service, and obedience even unto death by which one leaves one rule and
    ascends another. A valley lifted or filled pictures resurrection,
    exaltation, and the preparation of the Way into the Mountain of God.
  source_files:
    - books/symbolic-language/research/glossary-standardization-review.txt
    - books/symbolic-language/research/research-glossary-vs-consensus.md
  corpus:
    translation: KJV with Strong's numbers
    verses: 164
    printed_occurrences: 179

relationships:
  opposites: [mountain]
  related: [shadow, shadow-of-death, wings, water, way]

# Keep the singular compatibility field until all consumers use relationships.
opposite: mountain

senses:
  - id: governed-position
    status: proposed
    summary: The lower and humbled position beneath a ruling height.
    citations: [Isa 40:4, Luke 3:5]
  - id: territorial-borderland
    status: proposed
    summary: The low boundary crossed when passing from one mountain-kingdom to another.
    citations: [Deut 3:16, Josh 18:16, 1 Sam 17:3]
  - id: humbled-service
    status: proposed
    summary: The low Way Christ walks as servant in obedience unto death before being exalted.
    citations: [Isa 40:3-4, Luke 3:4-5, Phil 2:5-9, Mark 10:42-45]
  - id: resurrection-passage
    status: proposed
    summary: The dead rise in the valley, and the valley is lifted or filled to prepare the Way.
    citations: [Ezek 37:1-14, Isa 40:3-4, Luke 3:4-5, Zech 14:4-5]

usage_examples:
  - reference: Deut 11:11
    modes: [literal]
    note: The physical valley receives rain from heaven.
  - reference: Isa 40:4
    modes: [literal, symbolic]
    note: The valley's lifting supplies the image of resurrection while preparing the Way.

provenance:
  reconciled_on: 2026-07-13
  definition_checked_against: books/symbolic-language/49-glossary.adoc
```

The legacy fields `words`, `strongs`, `meaning`, `definition`, and `opposite`
remain because the website dictionary already consumes them. New consumers
should prefer `record_type`, `definition_meta`, `research`, `relationships`,
and `senses`.

An alias record is deliberately small. It does not repeat the definition
layers; they live on the record to which it points:

```yaml
record_version: 1
record_type: alias
symbol_key: tempest
term: Tempest
words: [tempest]
alias_of: storm
alias_meta:
  status: approved
  citations: [Jonah 1:4, Jonah 1:12]
```

Alias identity must be tested; resemblance alone is not sufficient.

## Prose study template

Every canonical record should teach the derivation in this order:

1. **Approved Definition or Current Glossary Draft** — identify its authority
   and status without treating presence in the glossary as proof of approval.
2. **Definition Layers** — the applicable Bible symbolic, Bible literal/lexical,
   and Webster layers shown separately. For a recovered Word rather than an
   image, the approved meaning normally belongs under Bible literal/lexical and
   the symbolic field says that no independent symbolic sense is asserted.
3. **Research Question or Proposed Refinement** — only when newer work has not
   yet been approved.
4. **Literal Structure and Dictionary Comparison** — explain agreements and
   differences between biblical literal usage and Webster before symbolic
   transfer.
5. **Corpus and Method** — lexemes, translations, occurrence count, and limits
   of the search.
6. **How Scripture Builds the Meaning** — the shortest evidence chain that
   derives each sense.
7. **Evidence by Sense** — defining passages first, supporting examples after;
   label uses `literal`, `symbolic`, or `both` where the classification has been
   reviewed.
8. **Competing Definitions and Countertexts** — what each alternative explains
   and where it fails.
9. **Relationships** — opposites, aliases, prerequisites, and related symbols;
   every relation states its type.
10. **Occurrence Register** — exhaustive uses, grouped by sense and then by
    biblical order. Ordinary uses still constrain the definition, and `both`
    belongs in both applicable groups.
11. **Conclusion and Status** — repeat the approved definition, then state any
    candidate refinement separately and identify what still requires review.

This order keeps proof text out of the definition while preserving the proof.
The glossary can remain concise; the study shows the reader why the concise
definition is warranted.

## Migration procedure

For each term:

1. Copy the current glossary definition into `definition` without revising it.
2. Place that definition in `definitions.bible_symbolic` for a Symbol or
   `definitions.bible_literal` for a recovered Word. Do not manufacture a
   symbolic definition for a Word merely to fill the field.
3. Derive `definitions.bible_literal` from ordinary biblical uses. Record
   `needs-research` rather than substituting Webster when that work is not done.
4. Quote Webster independently under `definitions.webster`.
5. Link every relevant `research-*` notebook in `research.source_files`.
6. Move reusable conclusions, countertexts, and occurrence data into structured
   frontmatter and the prose study. Do not delete the notebook during migration.
7. Mark every unapproved addition `proposed` or `awaiting-review`.
8. Run `npm run verify:symbol-records`.
9. Review the prose and candidate definition with the author.
10. If approved, change the glossary first, copy its definition back into the
   record, and mark the affected senses `approved`.
11. Rebuild the dictionary and site, then rerun the independent experiment only
   for changed definitions.
