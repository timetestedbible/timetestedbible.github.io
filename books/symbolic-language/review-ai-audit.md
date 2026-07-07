# Pre-Hardcover Audit — "Does this read AI / amateur?"

Six independent forensic reviews (five prose auditors covering all 44 chapter files, one
production editor on the built PDF). **Unanimous verdict: AI-assisted** — "a human argued
this book and an AI-trained hand phrased large stretches of it." None judged it wholly
AI-written; none judged it unassisted human prose.

**What convicts (in order of how loudly a hostile reviewer would cite it):**
1. Em-dash density: ~1 per 45–60 words in *every* chapter (~2,100 across the book; edited
   trade prose runs several times sparser). The most quotable single statistic.
2. The "not X; it is Y" antithesis: 100+ instances book-wide; every chapter closes multiple
   sections with one.
3. One-line epigram closers ending nearly every section and every chapter — identical rhythm
   regardless of subject.
4. Cross-chapter template clones (see C3) — "humans repeat ideas; a single generating process
   repeats templates."
5. Director's-cue staging: "Now watch… / Hold that… / Mark… / Weigh…" ~80+ imperatives —
   which also violate the book's own no-meta-talk rule.

**What defends (protect these in revision):** zero stock-AI vocabulary (delve/tapestry/
pivotal: 0 hits in 44 files); zero exclamation points outside quotes (one exception, C7);
doctrinally idiosyncratic, sustained theology no model produces unprompted; the openly
disclosed AI experiments ("the least suspicious thing in the book"); the personal confessions
(02:157 "I would have fared no better"); genuinely original imagery.

**The strategic finding (G1):** the seam is visible — and the *rough* chapters are the human
ones. Path to Salvation (33) and the older strata of Mountain/Sea (34–35) carry human-draft
fingerprints (typos, contractions, capitalization chaos) while 28–32 are cadenced to a fault.
The contrast is what convicts. Fix direction is the author's call: polishing 33–35 to book
standard solves print quality and closes the seam at once.

---

## A. FUNCTIONAL DEFECTS — unambiguous; fix on approval

> STATUS 2026-07-07: A1–A33 applied (A2 resolved by restoring the quoted translation's
> own wording inside quote blocks — prose keeps "the LORD"; ch 33 blocks now marked
> NKJV/ESV/AMP/BSB/BLB by wording-match, worth an author spot-check). B applied except
> B1 (real ISBN, deferred to upload) and B8 (blank rectos, deferred until plate set final).

Scripture/citation accuracy:
- [ ] **A1. ch33 broken quote**: "fall into the hands of the living the LORD" (Heb 10:31) —
      artifact of the mechanical 𐤉𐤄𐤅𐤄→"the LORD" sweep running inside quotes.
- [ ] **A2. ch33 silent emendations (AUTHOR DECISION)**: six quoted verses now read "the
      LORD" where the quoted text reads "God" ("Son of the LORD" ×2, "gift of the LORD" ×2,
      "the LORD raised Him", "I thank the LORD") — restore "God" inside quotes, or bracket.
- [ ] **A3. ch10 Wings**: bleeding woman's "hem" cited as Matthew 14:36 (Gennesaret crowd);
      hers is Matthew 9:20.
- [ ] **A4. ch33**: block cited "Matthew 16:24-26" quotes only vv. 24-25; the following
      paragraph leans on the absent v. 26.
- [ ] **A5. ch22**: body "days of Noah" vs epigraph "days of Noe" — same verse (Luke 17:26),
      two spellings; body quote uncited.
- [ ] **A6. ch12 math**: "fewer than one in a hundred and fifty" — 17M/2.4B ≈ 1 in 140.
      Also "one nation among nearly two hundred, a tenth of a percent of mankind" blurs two
      different metrics.
- [ ] **A7. Jude cited "Jude 1:13/1:14"** — single-chapter books conventionally "Jude 13".

Glossary/link defects:
- [ ] **A8. Swapped see-lines**: sym-foreskin → "Parables of the Kingdom, ch. 2" and
      sym-bramble → "The Foreskin, ch. 41" — each points at the other's chapter.
- [ ] **A9. ch41 wrong link**: "circumcise thine *heart*" links sym-heart, whose only entry
      is "Heart of the earth = Jerusalem".
- [ ] **A10. Glossary head** says "more than a hundred and twenty symbols"; count is 135
      (Introduction says 135).
- [ ] **A11. Straight quotes**: 86 straight doubles (Pearl word-list bullets; glossary
      island + moment entries) + 48 straight apostrophes (trailing possessives Jesus'/James',
      "TREE's", transliterations) against curly everywhere else. Straight doubles will PRINT
      mismatched.
- [ ] **A12. See-line format drift**: "Sun, Moon, and Stars" vs "Sun, Moon & Stars" (1 of 6);
      "Signs & Similitudes" (actual title uses "and"); "Path to Salvation" missing "The";
      "1 Kings" spelled out vs "1 Kgs"; "Rev 5:6; Rev 1:14" repeats book where others elide
      (and two see-lines list verses in reverse order).

Grammar/typos:
- [ ] **A13. ch33** "intersession" → intercession.
- [ ] **A14. ch02:357** "So stand the question" → "So stands the question" (in the chapter's
      climactic bolded line).
- [ ] **A15. ch34:72** "we have Daniel, Revelation, Isaiah, and Jeremiah all agree" →
      "…all agreeing / in agreement".
- [ ] **A16. ch34:101** "This implies that, on the order of two billion people, will die" —
      commas sever subject from verb.
- [ ] **A17. ch10:205** "the dispersed wait at the earth's four corners of it" — tangled.
- [ ] **A18. ch30:137** dangling modifier "Read traditionally, the 'he' of these verses has
      divided Christendom"; ch30:122 comma splice "not signed in Hebrew, they are cut".
- [ ] **A19. ch30:107** "confused for each other" → "confused with"; ch34:104 "comprised of";
      ch27:19 "an impossibility, by any stretch"; ch27:21 "between X, or Y".
- [ ] **A20. ch32:64** "the identical timing as" → "timing identical to".
- [ ] **A21. ch35:313** "And here a lesson about…" missing verb.
- [ ] **A22. ch16:144** "the mount, the nation, of olives" — stumbling appositive.

Build-code bugs (mine — extension.rb / templates):
- [ ] **A23. Scripture Index** "besides 1 passages from books outside the canon" —
      pluralization in sx_stats_line.
- [ ] **A24. "the The [Chapter]" ×12** — footnote/xref phrasing "the link:…[The Fool and the
      Wise] chapter" where the title begins with "The". Recast each footnote.
- [ ] **A25. URL bracket doubling**: "TimeTested.Bible [https://TimeTested.Bible]" ×9 —
      suppress print-mode bracket when link text == target.

Consistency passes (mechanical, global):
- [ ] **A26. Deity pronouns**: ch01 lowercase he/him (with stray His), chs 02–07 capitalized,
      ch33 chaotic ("His law, his words… He… his Father" in one sentence). Pick one style.
- [ ] **A27. "scripture" vs "Scripture"** mixed within chapters (01, 02, 35); "old testament"
      lowercase ×6 in ch33 then "Old Testament" once.
- [ ] **A28. Psalm/Psalms** citation drift (16, 17, 19, 24); bare "(7:13-14)" and "(4:7)"
      shorthand in 09/24 against full citations elsewhere.
- [ ] **A29. Number style**: "the 5,000" vs "five thousand"; "376 verses" vs "two hundred
      seventy-six souls"; "the fortieth Psalm" vs "the 119th Psalm"; "In 70 AD" vs "AD 32".
- [ ] **A30. Dialect**: "How the Exam Is Sat" / "sat its exam" (British) vs "fulfill"
      (American); ch05 uses "fulfil" as the author's own word at 183.
- [ ] **A31. ch16 & ch40 prevalence tables** carry unattributed percentages; ch34's three
      tables say "I asked Claude". Attribute all the same way (and consider moving ch34's
      method disclosure BEFORE its first table).
- [ ] **A32. Chapter-title reference**: prose in chs 21/22 says "the Pearl chapter", chs
      24/25 say "Pearls of Wisdom", actual title "The Pearls of Wisdom". Unify.
- [ ] **A33. TTT plugs in body prose**: 26:286 inline (should be footnote like 24:389/30);
      35:616 parenthetical plug in body; 04:246+05:93 use the identical "(The reckoning of…
      _Time Tested Tradition_; mark here only…)" template twice.

## B. PRODUCTION / COPYRIGHT PAGE (hardcover blockers first)

- [ ] **B1. ISBN**: "ISBN: to be assigned" prints as-is. Hardcover needs its own ISBN.
- [ ] **B2. NKJV permission notice — contractual**: NKJV quoted 6× (Luke 8:44; Ps 81:3;
      Dan 2:35, 2:38-39, 2:44-45). Required: "Scripture quotations marked NKJV are taken
      from the New King James Version®. Copyright © 1982 by Thomas Nelson. Used by
      permission. All rights reserved." Verify the JPS quote is 1917 (public domain), not
      NJPS. NKJV attribution style also varies (", NKJV" vs "(NKJV)").
- [ ] **B3. Rights contradiction**: © notice + "public domain" + unmodified-only restriction
      conflict. Use CC0 wording, or standard © All rights reserved.
- [ ] **B4. Copyright page placement**: sits on a recto with the title verso blank; trade
      convention is title-verso. (Adding a half title solves it: half title p1, title p3,
      copyright p4.)
- [ ] **B5. Missing copyright-page elements**: imprint/publisher + city; edition statement;
      printer's key; "Printed in the United States of America"; cover + illustration credits
      (see B10); optional colophon ("Set in Gentium Book Plus…").
- [ ] **B6. Running heads print on chapter-opener pages** (title appears twice on every
      opener) — suppress; loud asciidoctor-pdf default.
- [ ] **B7. Glossary entries split across page breaks** stranding see-lines — keep-together.
- [ ] **B8. 12 fully blank rectos** (art-insertion side effect) — will shrink as remaining
      plates land; revisit after the plate set is final.
- [ ] **B9. No About the Author / Also-by page** — expected hardcover back matter.
- [ ] **B10. Illustration disclosure**: ~30 plates uncredited. Recommend a colophon line
      that is honest without flag-waving, e.g. "Plates composed by the author and rendered
      digitally." Pairs with C8.
- [ ] **B11. Optional/deliberate**: en dashes for ranges (currently hyphens, consistent);
      epigraph on title page (unconventional); front matter in arabic folios; part titles
      sharing opener pages (author's ruling, keep); "&" vs "and" in two chapter titles.

## C. STYLE — the "smells of AI" findings (author review, accept/reject each)

- [ ] **C1. Em-dash thinning**: cut ~1/3 globally (peaks: ch22 30/1000 words, ch26 28/1000,
      ch24 168 total, ch12 113 total).
- [ ] **C2. Antithesis + epigram-closer thinning**: keep the best third of "not X; it is Y"
      constructions; let every second section END on plain prose instead of a minted line.
      Worst saturation: 06 (all four sections open "X, we are told… Scripture says" and
      close on an antithesis), 24, 26, 28–32, 35.
- [ ] **C3. De-dupe template clones (strongest single fix)**:
      "Everyone ends up under some wing; the question is whose" (10:144) ≈ "Everyone lives
      in some shadow… whose" (13:121, 191) · "many symbols come paired with an opposite/
      counterfeit" (08:238 = 15:135) · "Scripture even stages…" (38:189 = 39:53, cf. 10) ·
      "a question this book leaves open" (39:51 = 42:80) · "the habit this chapter
      adds/teaches" (03:205 = 04:48) · "Along the way we have + inventory" (03:209 = 04:319) ·
      "gets a vote, not a veto" (20:141 = 26:293) · "at the mouth of two witnesses" (20:106 =
      24:145) · wobble-is-a-signpost ×4 (08/13×2/14) · "not a technicality" (20 = 25) ·
      mountain/tree/grass recap triad ×3 (36/37) · twin edition closers (30 = 32, safe but
      fragile).
- [ ] **C4. Delete the worst staging/meta lines** (~20; they violate the house no-meta-talk
      rule anyway): 21:99 "Small examples first, so the mechanism is proven before it
      carries weight" (the book narrating its own persuasion strategy — worst in book) ·
      04:144 "hold them for the table at the end" · 12:88 "That is the anchor. Now watch…" ·
      12:189 "Read that last row again" · 12:250 "hold that word 'exceed'… shortly" · 24:125
      "Hold that mark…" · 24:226 "a relay this chapter is about to draw whole" · 08:144 "Now
      — and only now —" · 08:298 "because it closes this chapter's circle" · 10:21 "why this
      chapter matters beyond its size" · 11:32 "This is the turn." · 13:186 "this chapter is
      a prime example of the whole method" · 23:42 "this book would not print it" · 36:99
      "Two more branches of the symbol, before the beasts." · 35:130/132/407/465 ("Keep that
      wind in mind" / "Now watch" / "Hold those two facts" / "Read that slowly") · 39:28
      "That reach is the hinge of everything that follows." · 34:254 "That is the whole
      point."
- [ ] **C5. Register slips** (cut/replace; each is screenshot-bait): "I bring all the
      receipts" + "deep dive" + "beyond compelling" + "99.9% certainty" + "must-read" +
      "sacred cow" (all ch27 — the TTT blurb chapter needs a full rewrite in book voice) ·
      "aka" (33:87) · "Stop sinning!" (33:126, the book's only exclamation) · "God's résumé"
      (14:162) · ~~"buzzword" (05:21)~~ (author keeps "biblical buzzword") · "failure mode" (01:271) · "doom-unit" (32:109) · "are
      not in tension" (32:134) · "tied the knot" (28:109, unintentionally comic) · "paperwork"
      (09:183) · "a Husband who would not quit" (09:257) · "sales pitch" (15:144) · "market
      forces" (15:32) · "empty wallet / balance" (11:108/125) · "load-bearing" (25:76) ·
      "the music stops mid-note" (29:96) · "bunker" (34:212) · "fluff" (35:18) · "through
      the lens of" (34:186) · "pun intended… awe-inspiring" (01:275 — the Introduction's
      LAST LINE) · "conversion table" (03:59) · "photographs" (04:178) · "macro/micro level"
      (04:311) · "without remainder" (06:32) · "corpus" ×3.
- [ ] **C6. Reader flattery / grandiosity** (a hostile review prints these in full):
      04:296-299 "you now hold more of the sign than sixteen centuries of commentary
      carried" + "In surveying the published teaching of every major tradition" (soften to
      "I have not found…", cut the flattery) · 01:88 "safe enough to agree with the church…
      strong enough to overturn her" (jacket copy in body prose) · 16:147 "the worst words
      in Scripture" · 35:587 "Scripture's usage never bends".
- [ ] **C7. Chapter 33 (Path to Salvation) full polish to book standard** — contractions,
      run-ons, person shifts, 15+ inline parenthetical glosses inside quotes, doubled
      sentence (L23=L158), random capitalization, "This chapter went into great depth" —
      plus A1/A2/A4/A13. Same pass over the draft strata of 34–35 (34:101/103/139, 35:12-21).
      This closes the G1 seam.
- [ ] **C8. AI disclosure strategy (decision)**: the book already names Claude Fable 5 and
      Grok in its experiments — the disclosed AI use is the least suspicious thing in it.
      Recommendation: add a short "Note on Method" (front or back matter) stating plainly
      what AI did (the consensus experiments, prevalence estimates, drafting/editing
      assistance, plate rendering) and what it did not (the doctrine, the derivations, the
      convictions). Turns the accusation into the book's own transparency — consistent with
      a book whose thesis is testing consensus. Pairs with B10.
- [ ] **C9. Pet-word thinning** (counts book-wide): imperative "mark" ~35 · "watch/Now
      watch" ~25 · "weigh" ~25 · "exactly/exact" ~70 · "counterfeit" ~30 · "the very" ~36 ·
      possessive "own" (X's own Y) ~80+, peaks in 24/26 · "in one/the same/next breath" ~13 ·
      "Hold that…" ~11 · "N things, one X" fragments ~20 · "decode(s)" ~8 · "fingerprint" ~4 ·
      "seven centuries" ×7 · "composed" ×9 (03-04) · "quietly" as drama-adverb ×4.
- [ ] **C10. Bold emphasis in body prose** (chs 27, 29–32 leak the bold-in-quotes convention
      into running text; also 12:190, 13:24, 30:189) — italics or nothing, per house style.

## Suggested order of work
1. A-list + B1–B7 (mechanical; no voice changes; several are build-code fixes).
2. C7 (ch 33/34/35 polish) — biggest single win for both quality and the seam.
3. C3 + C4 + C5 (de-dupe, de-stage, de-slip) — surgical deletions, no rewriting.
4. C1/C2/C9 thinning passes, chapter by chapter, author reviewing diffs.
5. C8 + B10 disclosure note; then final proof copy.
