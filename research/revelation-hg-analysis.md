# Revelation HG: Top 7 Changes from Greek and Evidence for Hebrew Original

**Sources:** `bibles/hg.txt`, `data/hebrew-gospels-notes.json`

---

## Part A: Top 7 Most Noteworthy Changes from Greek

These are places where the HG Revelation translation differs clearly from standard Greek-based translations (e.g. KJV/ESV) in meaning or register.

1. **Confidential / secret counsels (סוֹדוֹת) vs. Revelation (Ἀποκάλυψις)** — Rev 1:1, 1:20, 10:7, 17:5, 17:7. The book is framed as divine *sodot* (counsels/secrets) delivered prophetically, not merely “uncovering.” Strong’s H5475 throughout. *Notes Ch1: “Hebrew could not derive from the Greek” — one-way marker.*

2. **Elders (זְקֵינִים) vs. Churches (ἐκκλησίαι)** — Rev 1:4, 1:11, 1:20 (seven menorot = seven *elders*). The addressees and the lampstand-symbol are “elders” rather than “churches,” shifting ecclesial metaphor to a Torah/community-leadership register. *Notes: decisive one-way marker.*

3. **Lovingkindness (חֶסֶד) vs. Grace (χάρις)** — Rev 1:4. “Lovingkindness and peace” (H2617 + H7965) instead of “grace and peace.” Covenant/temple idiom. *Notes Ch1: one-way.*

4. **“Ruler and commander” (נָגִיד וּמְצַוֶּה) — Isaiah 55:4 verbatim** — Rev 1:5. HG has “ruler (H5057) and commander (H6680) over the earth”; Greek has “ruler of the kings of the earth” with no verbal link to Isaiah 55:4. The notes state this phrase is *absent from the Greek* and appears as a verbatim Hebrew quote. *Notes Ch1: decisive.*

5. **Garden of Eden (גן עדן) vs. Paradise of God** — Rev 2:6. “Tree of life which is in the Garden of Eden” (H1588, H5731); Greek “in the Paradise of God.” Explicit OT locale. *Notes Ch2: striking one-way marker.*

6. **Good testimony (עדות טובה) vs. white stone** — Rev 2:16. HG “hidden manna” + “good testimony” (H2896, H5715) with “name which none knows (experiences) except the one who received it”; Greek “white stone” and “new name written which no one knows.” “Good testimony” aligns with Ark-of-the-covenant / temple idiom; “knows (experiences)” uses H3045 (יָדַע). *Notes Ch2: combined with manna, one-way.*

7. **Hope (תִּקְוָה, H8615) where Greek has endurance (ὑπομονή)** — Rev 2:2, 2:3, 2:18, 3:10, 13:11, 14:12. HG consistently uses “hope/hopes” for patient endurance. Hebrew *tiqwah* can carry both “hope” and “waiting/steadfastness”; Greek *hypomonē* is only endurance. *Semantic shift that favors a Hebrew Vorlage.*

**Honorable mention:** Likeness of a man (כִּדְמוּת אָדָם) vs. “son of man” (Rev 1:13); Geihinnom (H1516) for γέεννα; Menorah (H4501) for λυχνία; “Pray” (H6419) for προσκυνέω (worship); bat kol (Ch10); fire-pans/censers (מַחְתּוֹת) vs. Greek “bowls” (Rev 5:8); clan (מִשְׁפַּחַת) vs. “tribe” (5:5); verbatim Isaiah quotations where Greek paraphrases (e.g. Isa 34:4 in Ch6, Isa 60:19 in Ch22).

---

## Part B: Classification of Evidence (Hebrew Original vs. Back-Translation)

**Source:** `data/hebrew-gospels-notes.json` — per-chapter summaries for Revelation 1–22.

### Total quantity

- **Verse-level markers:** The notes include a `verses` structure with **877** individual `one_way_hebrew` entries across 399 verses in Revelation 1–22. Each entry is a short paragraph describing one marker.
- **Summary-level lower bound:** Where a chapter summary states “at least N,” the sum is **246** (15 chapters). The 877 verse-level entries are the full set used for tier classification below.

### Quality tiers (enumerated by script)

The tier definitions below were applied programmatically to each of the 877 verse-level `one_way_hebrew` entries (see `scripts/classify-revelation-markers.js`). Results are in `data/revelation-markers-by-tier.json`.

| Tier | Definition | Count |
|------|------------|-------|
| **Tier 1** | Decisive / structural: no Greek equivalent, verbatim OT quote, Hebrew-only wordplay, “back-translator would never” | **488** |
| **Tier 2** | Strong semantic shift: different Hebrew root or clear semantic contrast with Greek (e.g. חֶסֶד vs. χάρις, elders vs. churches, Geihinnom vs. Hades) | **283** |
| **Tier 3** | Hebraizing register: proper nouns (YHWH, Yeshua), liturgical/idiom (“by the hand of,” “from eternity,” menorah, teshuvah) | **106** |
| **Total** | | **877** |

- **Tier 1 — Decisive / structural:** Hebrew wording with **no lexical or conceptual counterpart** in the Greek; **verbatim OT quotations** where the Greek is a paraphrase; **root-level wordplay** that only works in Hebrew (e.g. Ch3 פתח chain).

- **Tier 2 — Strong semantic shift:** Consistent lexical choices that require a **different Hebrew root** than the Greek would suggest (e.g. חֶסֶד vs. χάρις, תִּקְוָה vs. ὑπομονή, “Garden of Eden” vs. “Paradise of God,” elders vs. churches).

- **Tier 3 — Hebraizing register:** Proper nouns and liturgical/idiom terms (YHWH, Yeshua, Geihinnom, menorah, teshuvah, “from eternity and unto eternity,” “Thus says,” “by the hand of”).

Per-chapter counts (T1 / T2 / T3) are in `data/revelation-markers-by-tier.json`.

### Summary

- **Number:** **877** one-way markers (verse-level entries) across Revelation 1–22; **488** Tier 1, **283** Tier 2, **106** Tier 3.
- **Conclusion (as framed in the notes):** The density and type of these markers — especially Tier 1 — are presented as evidence that the text was **originally composed (or transmitted) in Hebrew** and that the Greek is a translation from that Hebrew, rather than the reverse.

---

## Scholarly counterpoints and response

For a response to critiques that attribute the HG to back-translation or polemical Hebraization (e.g. Cochin dating, Rev 2:27/Psalm 2:9), and for the strongest counter-examples that Gordon did not emphasize — including Jude 16 (verbatim Psalm 5:10), Rev 3:4 (name heard vs. few names), Rev 8:11 (worm vs. wormwood), Rev 11 (torches vs. lampstands), Rev 14:8 (consonantal שקט), Rev 7 (refined vs. whitened), Rev 13 (horse vs. leopard), Rev 18 (adversaries vs. demons), and James 5:16 (verbatim Psalm 145:18) — see [revelation-hg-response-to-critique.md](revelation-hg-response-to-critique.md).
