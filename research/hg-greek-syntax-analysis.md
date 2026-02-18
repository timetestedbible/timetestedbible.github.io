# Greek Syntax Analysis of HG Revelation

**Method:** Each of the 22 chapters was sent to Claude (Sonnet) with the raw vocalized Hebrew and word-by-word interlinear glosses. The prompt asked for an honest identification of Greek syntactic constructs and unnatural Hebrew phrasing. Only deviations were recorded.

**Source data:** `data/greek-syntax-flags/Revelation-{1..22}.json`

---

## Summary

| Metric | Count | % |
|--------|-------|---|
| Total verses | 401 | |
| Clean verses (no flags) | 233 | 58.1% |
| Flagged verses | 168 | 41.9% |
| Total flags | 188 | |

## By severity

| Severity | Count | % of flags |
|----------|-------|------------|
| Strong (clearly Greek-dependent) | 27 | 14.4% |
| Moderate (ambiguous) | 123 | 65.4% |
| Weak (natural in later Hebrew) | 38 | 20.2% |

## By type

| Type | Count | % of flags |
|------|-------|------------|
| shel_genitive | 66 | 35.1% |
| she_relative | 63 | 33.5% |
| greek_word_order | 24 | 12.8% |
| greek_calque | 10 | 5.3% |
| other | 6 | 3.2% |
| excessive_parataxis | 5 | 2.7% |
| periphrastic | 5 | 2.7% |
| heavy_passive | 5 | 2.7% |
| participial_chain | 2 | 1.1% |
| greek_loanword | 2 | 1.1% |

## Per-chapter breakdown

| Chapter | Total verses | Flagged | Flags | % flagged |
|---------|-------------|---------|-------|-----------|
| 1 | 20 | 6 | 6 | 30% |
| 2 | 28 | 8 | 9 | 29% |
| 3 | 22 | 10 | 11 | 45% |
| 4 | 11 | 3 | 3 | 27% |
| 5 | 14 | 4 | 5 | 29% |
| 6 | 17 | 9 | 11 | 53% |
| 7 | 17 | 4 | 5 | 24% |
| 8 | 13 | 5 | 5 | 38% |
| 9 | 20 | 7 | 10 | 35% |
| 10 | 11 | 7 | 9 | 64% |
| 11 | 14 | 8 | 10 | 57% |
| 12 | 22 | 11 | 11 | 50% |
| 13 | 19 | 7 | 7 | 37% |
| 14 | 19 | 13 | 13 | 68% |
| 15 | 8 | 6 | 7 | 75% |
| 16 | 20 | 9 | 9 | 45% |
| 17 | 18 | 8 | 9 | 44% |
| 18 | 24 | 9 | 9 | 38% |
| 19 | 21 | 12 | 14 | 57% |
| 20 | 15 | 7 | 8 | 47% |
| 21 | 27 | 6 | 6 | 22% |
| 22 | 21 | 9 | 11 | 43% |

## Examples by severity

### Strong

- **Rev 1:4** [shel_genitive] — `מִזֶּה שֶׁהָיָה`: The construct מִזֶּה שֶׁהָיָה creates awkward syntax. Classical Hebrew would more naturally express eternal existence differently.
- **Rev 2:4** [greek_word_order] — `תמיה לי מפני מה תעזוב אתה`: This word order with the redundant pronoun אתה after the verb mimics Greek syntax. Hebrew would typically omit the pronoun or place it differently.
- **Rev 2:16** [excessive_parataxis] — `וגם עדות טובה ובזה העדות שם חדש כתוב שלא יוכל שום אחד לקרוא רק זה שקיבל אותו`: This extremely long paratactic sentence with multiple coordinated clauses strongly suggests Greek influence. Hebrew would use more subordination and shorter clauses.
- **Rev 3:3** [greek_word_order] — `ואתה אינה יודע באיזה זמן שאבא`: The word order with אינה יודע mirrors Greek οὐ γινώσκεις. Native Hebrew would more naturally use לא תדע or אינך יודע.
- **Rev 3:8** [greek_word_order] — `ואינה כופר בשמי`: The construction ואינה כופר follows Greek syntax. Native Hebrew would use ולא כפרת or similar with proper subject-verb agreement.

### Moderate

- **Rev 1:1** [shel_genitive] — `מַלְאָךְ שֶׁלּוֹ`: Use of שֶׁל for genitive relationship. Classical Hebrew would use construct state מַלְאָכוֹ.
- **Rev 1:12** [shel_genitive] — `מְנוֹרוֹת שֶׁל זָהָב`: Use of שֶׁל genitive. Classical Hebrew would use construct מְנוֹרוֹת זָהָב.
- **Rev 1:13** [shel_genitive] — `בַּחֲגֹר שֶׁל זָהָב`: Use of שֶׁל genitive. Classical Hebrew would use construct בַּחֲגֹר זָהָב.
- **Rev 1:18** [shel_genitive] — `הַמַּפְתְּחוֹת שֶׁל הַמָּוֶת`: Use of שֶׁל genitive. Classical Hebrew would use construct מַפְתְּחוֹת הַמָּוֶת.
- **Rev 1:20** [shel_genitive] — `מְנוֹרוֹת שֶׁל זָהָב`: Use of שֶׁל genitive. Classical Hebrew would use construct מְנוֹרוֹת זָהָב.

### Weak

- **Rev 4:9** [periphrastic] — `בְשָׁעָה שֶׁ`: The temporal construction 'in the hour that' may reflect Greek ὅταν structures, though this could be natural late Hebrew development.
- **Rev 7:2** [she_relative] — `שֶׁבָּא`: While שֶׁ relatives are standard in Mishnaic Hebrew, the participial phrase 'הַנּוּתַן לָהֶם' (who were given to them) shows potential Greek passive influence rather than native Hebrew active construction.
- **Rev 10:3** [she_relative] — `בְשָׁעָה שֶׁצָּעַק`: The temporal clause 'in the hour that he cried out' using שֶׁ is acceptable in Mishnaic Hebrew but shows possible Greek influence from ἐν ᾗ ὥρᾳ construction.
- **Rev 10:4** [she_relative] — `אַחַר שֶׁדִּבְּרוּ`: While שֶׁ temporal clauses are found in Mishnaic Hebrew, the frequency and pattern may reflect Greek μετὰ τὸ + infinitive constructions.
- **Rev 10:7** [she_relative] — `בְאִם שֶׁהַשִּׁבְעָה מַלְאָכִים תּוֹקְעִים`: The temporal clause 'when the seven angels blow' shows possible influence from Greek ἐν ταῖς ἡμέραις construction, though שֶׁ is acceptable in late Hebrew.

---

## Honest assessment

Of 401 verses in HG Revelation, **58.1% show no detectable Greek syntactic influence** according to Claude's analysis.

Of the 188 flags raised across 168 verses:
- **27 strong** (14.4%) — constructions that a native Hebrew author would likely not produce; these genuinely suggest Greek-to-Hebrew translation direction.
- **123 moderate** (65.4%) — ambiguous constructions that could reflect either late Hebrew register or Greek influence.
- **38 weak** (20.2%) — features that are standard in Mishnaic/late Second Temple Hebrew and do not by themselves indicate translation from Greek.

The **strong** flags are the most relevant to Grok's critique. They suggest that at least some phrasing in the HG text was influenced by Greek syntax or word order, which is consistent with either (a) a Hebrew text composed by someone who knew Greek, (b) a Hebrew text that passed through a Greek-aware transmission stage, or (c) back-translation artifacts.

The **weak** flags (primarily `she_relative` and `shel_genitive`) are expected in any Mishnaic-register Hebrew and cannot distinguish between native composition and translation. Their presence is consistent with both hypotheses.

**Bottom line:** The Hebrew is not uniformly "pure" biblical Hebrew — it uses a late Second Temple / Mishnaic register with some constructions that could reflect Greek influence. However, the majority of verses (58.1%) show no Greek syntactic artifacts, and many of the flags are ambiguous or natural in later Hebrew. The text reads as a Hebrew composition in a late register, with a minority of passages where Greek influence on syntax is plausible.
