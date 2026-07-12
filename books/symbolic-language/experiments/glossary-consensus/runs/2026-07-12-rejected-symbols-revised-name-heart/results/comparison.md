# Comparison with the prior three-model run

Baseline: `2026-07-12-other-divergent-untested`  
Revised evidence: `2026-07-12-rejected-symbols-revised-name-heart`

This rerun selected the three entries that failed persuasion by panel majority in
the baseline. The Name definition and proving chapter changed substantially. The
Sign of Jonah chapter changed more narrowly, chiefly by refining Great Fish from
kingdom to ruler-who-stands-for-kingdom. The Pearl definition and proving chapter
did not change.

## Verdict comparison

| Term | GPT old -> new | Claude old -> new | Grok old -> new | Panel result |
|---|---|---|---|---|
| Heart of the earth | Unpersuaded -> Unpersuaded | Persuaded -> Persuaded | Unpersuaded -> Unpersuaded | Unchanged: 2-1 unpersuaded |
| Name | Unpersuaded -> Unpersuaded | Persuaded (full) -> Persuaded (core only) | Unpersuaded -> Unpersuaded | Unchanged: 2-1 unpersuaded |
| Pearl | Unpersuaded -> Unpersuaded | Persuaded (core only) -> Persuaded (core only) | Unpersuaded -> Unpersuaded | Unchanged: 2-1 unpersuaded |

No published final verdict changes as a result of this rerun.

## What the baseline panel rejected

### Heart of the earth

GPT and Grok preferred grave/Sheol. Their shared objections were that Matthew
places Jonah's fish-belly confinement directly beside Jesus' heart-of-the-earth
confinement; Jonah 2 calls that condition the belly of Sheol and speaks of the
earth's bars, corruption, and being brought up; and the book starts Jesus' clock
at arrest even though Jonah enters the fish only after the shipboard interrogation
and casting. Claude judged the Jerusalem/navel texts, the mirrored heart-of-the-seas
phrase, and the chronology cumulatively stronger.

### Name

GPT and Grok agreed that the old chapter established covenant obligations attached
to God's Name but did not establish that Name was identical with covenant. They
preferred the broader identity/character/presence/authority reading and regarded
the ark, marriage, and Babel equations as inferred. Claude found the covenantal
reading persuasive.

### Pearl

GPT and Grok found no explicit textual bridge equating pearl with full moon. They
preferred the conventional value reading of Matthew 13, Matthew 7, Proverbs, and
Revelation 21; objected that plural pearls and twelve simultaneous gates do not
naturally identify one moon; treated `peninim` as lexically uncertain; and judged
the `keseh`/`kisse'` link, lunar Proverbs rereadings, and twelve-month gate scheme
too dependent on secondary reconstruction. Claude accepted the full-moon/appointed-
times core but not the calendar mechanics and several secondary elaborations.

## What the revised evidence changed

### Heart of the earth: no movement

The revised Great Fish material did not target the decisive objection. GPT now
emphasized that Jesus was already geographically in Jerusalem before arrest, so
the book must add hostile custody as an unstated boundary. Grok again emphasized
the fish-belly/Sheol parallel and the inconsistent sequence. The current chapter
still begins the Jerusalem interval at arrest while mapping Jonah's casting to
Jesus' death. Claude remained persuaded.

### Name: stronger synthesis, same split

Claude found the ark chain unusually tight: ark called by the Name, house for the
Name, house containing the ark/covenant, and the three independently defined
contents. GPT and Grok nevertheless held that association does not prove
constitution. Their strongest remaining objection is that Scripture calls the
house and ark by God's Name but never says that manna, tablets, and rod are the
semantic contents of Name. They believe personal identity, authority, ownership,
reputation, and presence explain the same texts with fewer steps. GPT also cited
Zechariah 6, Genesis 11/12, 1 Kings 8, and Isaiah 4 as uses not naturally exhausted
by the three-part definition.

### Pearl: unchanged evidence, unchanged result

The panel reproduced the same 2-1 division. No new Pearl evidence was supplied.

## Other individual dissents in the baseline

These entries passed or were classified as refinements by panel majority, but at
least one model remained unpersuaded:

- **Disciple** - GPT and Grok preferred the broader follower/learner category and
  regarded inwardly sealed law as an over-specific universal definition.
- **Dragon** - GPT held that Revelation explicitly identifies the dragon as Satan
  and distinguishes him from the imperial beast; kingdom/ruler is a valid prophetic
  application, not a universal identity.
- **Gospel** - Grok preferred Paul's death-burial-resurrection kerygma and judged
  renewed Mosaic covenant too narrow to absorb 1 Corinthians 15.
- **Harlot** - GPT judged imperial Rome a better fit for Revelation 17-18 while
  allowing Jerusalem as a secondary covenant-harlot echo.
- **Life** - GPT preferred divine life located in the Father and Son, with covenant
  obedience as its expression rather than its defining source.
- **New name** - Grok preferred transformed identity/status and regarded renewed
  covenant as an added definitional step.
- **Sign** - GPT and Grok preferred the broad category of a token that identifies,
  authenticates, or points beyond itself; advance prophecy was judged too narrow.
- **Valley** - GPT preferred Isaiah's coordinated road-leveling image and found no
  explicit definition of valleys as humbled people.

## Cache and reproducibility note

OpenAI and xAI blind-consensus calls were reused from the baseline. Anthropic's
effective request had changed from a 9,000-token to a 14,000-token output budget,
so its blind calls were correctly treated as new requests. Because later stages
include the complete blind-consensus bundle, that changed response made the
relationship and persuasion request hashes new for all three providers, including
Pearl. Pearl therefore functions as an unchanged-evidence control, but its later
judgments were resampled rather than copied. The result nevertheless reproduced
the same provider split and support scopes exactly.
