# HG Revelation: Evidence Synthesis

This document weighs the evidence for and against Hebrew-original composition in the HG Revelation text, drawing on three prior analyses.

---

## 1. What this text is

The Hebrew text in the HG (Hebrew Gospels) translation derives from a **historical Hebrew manuscript tradition** — the Cochin Hebrew New Testament manuscripts, dated to at least ~1700 AD, with possible earlier antecedents. The Hebrew itself is not AI-generated.

What **Claude Opus 4.6** produced is the **English translation** of the Hebrew text, the **Strong's number assignments** keyed to Hebrew roots, and the **analytical notes** (one-way markers, Greek deviations, translation notes, textual notes). The AI read the historical Hebrew and translated/annotated it — it did not compose the Hebrew.

This means the linguistic properties of the Hebrew text — its vocabulary, syntax, OT quotations, wordplay, and deviations from Greek — are properties of the historical manuscript, not of AI output. The analyses below bear on the actual manuscript tradition.

---

## 2. Evidence for Hebrew-original features

**Source:** [revelation-hg-analysis.md](revelation-hg-analysis.md), [revelation-markers-by-tier.json](../data/revelation-markers-by-tier.json)

The notes identify **877** verse-level "one-way Hebrew" markers across Revelation 1–22 — places where the Hebrew wording diverges from the Greek in ways that the notes argue could not arise from back-translation.

| Tier | Definition | Count |
|------|-----------|-------|
| Tier 1 | Decisive: no Greek equivalent, verbatim OT quote, Hebrew-only wordplay | 488 |
| Tier 2 | Strong semantic shift: different Hebrew root, clear contrast with Greek | 283 |
| Tier 3 | Hebraizing register: proper nouns, liturgical idiom | 106 |
| **Total** | | **877** |

**Top 7 changes from Greek:**
1. Confidential counsels (סוֹדוֹת) vs. Revelation (Ἀποκάλυψις)
2. Elders (זְקֵינִים) vs. Churches (ἐκκλησίαι)
3. Lovingkindness (חֶסֶד) vs. Grace (χάρις)
4. Ruler and commander (נָגִיד וּמְצַוֶּה) — verbatim Isaiah 55:4
5. Garden of Eden (גן עדן) vs. Paradise of God
6. Good testimony (עדות טובה) vs. white stone
7. Hope (תִּקְוָה) vs. endurance (ὑπομονή)

Additional features: verbatim OT quotations where Greek paraphrases (e.g. Isaiah 34:4 in ch. 6, Isaiah 60:19 in ch. 22, Ezekiel 47:12 in ch. 22); Hebrew-only wordplay (the פתח root chain in ch. 3: key/opener/opening); bat kol (heavenly voice, ch. 10); fire-pans (מַחְתּוֹת) vs. Greek bowls; Sheol/Geihinnom distinction (ch. 20).

---

## 3. Evidence for Greek syntactic influence

**Source:** [hg-greek-syntax-analysis.md](hg-greek-syntax-analysis.md), [data/greek-syntax-flags/](../data/greek-syntax-flags/)

A separate analysis sent each chapter's raw vocalized Hebrew and interlinear glosses to Claude (Sonnet) with instructions to honestly identify Greek syntactic constructs in the manuscript's Hebrew. Only deviations were recorded.

| Metric | Count | % |
|--------|-------|---|
| Total verses | 401 | |
| Clean verses (no flags) | 233 | 58.1% |
| Flagged verses | 168 | 41.9% |
| Total flags | 188 | |

**By severity:**

| Severity | Count | % of flags |
|----------|-------|------------|
| Strong (clearly Greek-dependent) | 27 | 14.4% |
| Moderate (ambiguous) | 123 | 65.4% |
| Weak (natural in later Hebrew) | 38 | 20.2% |

**By type (top 5):**

| Type | Count | % |
|------|-------|---|
| של genitive (instead of construct state) | 66 | 35.1% |
| שֶׁ relative (instead of אֲשֶׁר) | 63 | 33.5% |
| Greek word order | 24 | 12.8% |
| Greek calque | 10 | 5.3% |
| Excessive parataxis | 5 | 2.7% |

The 27 **strong** flags (in ~6.7% of verses) include awkward word orders that mirror Greek, redundant pronouns following Greek patterns, and overly long paratactic chains. These genuinely suggest Greek syntax influencing the Hebrew surface structure in those passages.

---

## 4. Counter-examples that resist back-translation

**Source:** [revelation-hg-response-to-critique.md](revelation-hg-response-to-critique.md)

Even granting Greek syntactic influence in some passages, several readings in the manuscript are difficult to explain as back-translation because the Hebrew says something the Greek does not say at all:

| Marker | Location | Issue |
|--------|----------|-------|
| Verbatim Psalm 5:10 | Jude 16 | Hebrew is word-for-word Psalm 5:10; Greek says completely different things (murmurers, complainers) |
| "Your name is heard" vs. "few names" | Rev 3:4 | Entirely different statements + Hebrew wordplay (shimkha/nishma) |
| "Worm" vs. "Wormwood" | Rev 8:11 | Different object entirely — worm (תּוֹלַעַת) vs. bitter plant (Ἄψινθος) |
| Torches vs. lampstands | Rev 11 | Different objects — אֲבוּקוֹת vs. λυχνִαι |
| Consonantal שקט vs. שקה | Rev 14:8 | "Silenced" vs. "gave drink" — direction argument from Hebrew consonants |
| Refined vs. whitened | Rev 7 | Metallurgical זקק vs. laundry ἐλεύκαναν |
| Horse vs. leopard | Rev 13 | סוּס vs. παρδάλει — entirely different animals |
| Adversaries vs. demons | Rev 18 | הַשְּׂטָנִים vs. δαιμονίων — different class of being |
| Verbatim Psalm 145:18 | James 5:16 | Hebrew quotes the Psalm; Greek has unrelated proverb |

These require the Hebrew to contain content absent from the Greek, use words no translator from Greek would choose, or depend on Hebrew consonantal reasoning. A back-translator — even a very skilled one — would not independently produce verbatim Psalm quotations where the Greek says something entirely different.

---

## 5. Weighing both sides

The evidence pulls in two directions simultaneously, and this tension is itself informative.

**What the vocabulary evidence says:** The manuscript's Hebrew vocabulary, OT quotations, and wordplay are properties of the physical text — not AI choices. When the manuscript has "worm" where Greek has "wormwood," or verbatim Psalm 5:10 where Greek has "murmurers and complainers," these are readings in the manuscript itself. A 17th-century back-translator working from Greek could not produce these divergences — they require either (a) an independent Hebrew source, (b) access to an older Hebrew tradition that the translator drew upon alongside the Greek, or (c) creative midrashic expansion by a very unusual translator.

**What the syntax evidence says:** The 27 strong Greek-syntax flags are also properties of the physical text. Awkward word orders, redundant pronouns, and Greek-style clause structures in ~6.7% of verses suggest that at some stage in its history, the Hebrew text was influenced by Greek. This is consistent with several scenarios: a Hebrew original that was later edited by someone who knew Greek; a Hebrew text that passed through a Greek transmission stage and picked up syntactic artifacts; or portions that were indeed translated from Greek.

**What the register says:** The dominant use of של genitives and שֶׁ relatives (129 of 188 flags, 68.6%) is the largest pattern. This is standard Mishnaic/late Second Temple Hebrew — it does not by itself indicate translation from Greek. A 1st-century Hebrew author would naturally write this way. However, it also cannot rule out later composition or translation, since a post-biblical translator would also use these forms.

**The mixed picture:** The manuscript appears to be a text with **genuinely Hebrew vocabulary and OT intertextuality** (the 488 Tier 1 markers, the 9 impossible-back-translation cases) combined with **some Greek syntactic influence** (27 strong flags). This is most consistent with one of two scenarios:

1. **A Hebrew original that was transmitted through Greek-aware scribes** who introduced syntactic artifacts while preserving the Hebrew vocabulary and OT quotations. This would explain both the Hebrew-original vocabulary features and the Greek syntax — the vocabulary is older than the syntax.

2. **A sophisticated Hebrew composition (or adaptation) by someone who knew both Greek and Hebrew well** — drawing on an older Hebrew tradition or Peshitta source for vocabulary and content while sometimes falling into Greek syntax. The recent paper noting that Cochin Revelation "may be a completely different story" from the rest of the Cochin NT (which derives from Peshitta) supports the idea of a distinct source for Revelation specifically.

---

## 6. Summary

| Dimension | Finding | Implication |
|-----------|---------|-------------|
| **Vocabulary** | 877 one-way markers, 488 decisive | The manuscript's Hebrew uses words, roots, and OT quotations that diverge sharply from Greek — these are properties of the historical text, not AI choices |
| **Syntax** | 188 flags, 27 strong | ~6.7% of verses show Greek-dependent syntax; 58.1% are clean; the rest are ambiguous |
| **Impossible back-translations** | 9 cases of completely different content | Jude 16, Rev 3:4, 8:11, 14:8 — content absent from Greek entirely; very difficult to explain as back-translation |
| **Register** | Late Second Temple / Mishnaic | של/שֶׁ usage is the dominant flag type but is natural for the period; does not distinguish original from translation |

**Bottom line:** The manuscript contains a genuine tension between Hebrew-original vocabulary features and Greek syntactic influence. The vocabulary evidence (especially the 9 cases where Hebrew and Greek say completely different things) is the strongest argument against pure back-translation. The syntax evidence (27 strong flags) is the strongest argument for some Greek influence. The most parsimonious explanation is a text with Hebrew roots — whether original composition or an older Hebrew tradition — that has been shaped by Greek-aware transmission. It is neither a pure Hebrew autograph nor a straightforward back-translation from Greek.

---

## Source files

- [revelation-hg-analysis.md](revelation-hg-analysis.md) — Top 7 changes, tier classification
- [hg-greek-syntax-analysis.md](hg-greek-syntax-analysis.md) — Greek syntax flag analysis
- [revelation-hg-response-to-critique.md](revelation-hg-response-to-critique.md) — Counter-examples to Grok's critique
- [../data/revelation-markers-by-tier.json](../data/revelation-markers-by-tier.json) — Per-tier counts
- [../data/greek-syntax-flags/](../data/greek-syntax-flags/) — Per-chapter flag files
- [../scripts/classify-revelation-markers.js](../scripts/classify-revelation-markers.js) — Tier classification script
- [../scripts/analyze-greek-syntax.js](../scripts/analyze-greek-syntax.js) — Greek syntax analyzer (parallel API)
- [../scripts/aggregate-greek-syntax.js](../scripts/aggregate-greek-syntax.js) — Aggregation script
