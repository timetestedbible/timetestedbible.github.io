# Research: Proverbs 31:10–31 — What Waits Under the Vowel Points

Supporting study for the Pearl chapter (`26-the-pearl.adoc`, "The Pearls the Translators Buried"),
which closes: *"whether more waits under the vowel points of her portrait is a question this book
leaves open."* This file does that study.

**Method** (the book's own rules): word by word through the unpointed consonants of the acrostic
(WLC, `bibles/wlc.txt` lines 17366–17387). An alternative reading counts only if it is an attested
Hebrew lexeme (a documented Strong's number, verified in `strongs-hebrew-dictionary.js`), same
consonants in the same order (word-division moves allowed; anagrams and near-letters do not count).
Every find is graded **both-true candidate / stretch / rejected**, and no reading unseats the plain
sense. KJV wording verified against `kjv.json`; ancient-version witnesses from `bibles/lxx.txt`
(Brenton), `bibles/drb.txt` (Vulgate via Douay), `bibles/slt.txt` (Smith's Literal), `bibles/ylt.txt`.

**Data note (do not build on this):** the repo's `wlc.txt` occasionally drops a pointed sin/shin —
Prov 31:16 reads `דֶה` where the MT has שָׂדֶה (field), and Ps 104:19 reads `מֶשׁ` for שֶׁמֶשׁ. File
artifact only; the MT text is unaffected.

**Consonant scan (verified programmatically over the unpointed poem):**
present — שחק (v25), הלל (v28, 30, 31), שערים (v23, 31), שנים (v21), טרף (v15), חק (v15),
נר (v18), ליל (v15, 18×2), שלג (v21), פנינים (v10), הליכות (v27), פלך (v19), סחר (v14, 18),
מכר (v10, 24), שש (v22), סדין (v24), בית (v15, 21×2, 27).
**Absent** — לבנ, ירח, אור, כסה, כסא, מועד, סהר. The poem never names its light, even at the
letter level. (That silence is itself the finding: the portrait is anonymous, and Scripture supplies
the name from outside — see v29.)

---

## The Headline: the Poem's Own Name-Verse Is in the Song

Prov 31:28 — קָמוּ בָנֶיהָ **וַיְאַשְּׁרוּהָ** בַּעְלָהּ **וַיְהַלְלָהּ** ("her children arise and
call her blessed; her husband also, and he praiseth her"); 31:31 — **וִיהַלְלוּהָ** בַשְּׁעָרִים;
31:29 — "many **daughters** have done virtuously, but thou excellest them all."

Song 6:9 — רָאוּהָ **בָנוֹת וַיְאַשְּׁרוּהָ** מְלָכוֹת וּפִילַגְשִׁים **וַיְהַלְלוּהָ** ("the
daughters saw her, and blessed her; yea, the queens and the concubines, and they praised her") —
the **same two verbs, in the same order**, with the same cast (one woman above many daughters/queens,
Song 6:8 "threescore queens... virgins without number" = Prov 31:29 "many daughters"). The
consonants of Prov 31:31's ויהללוה and Song 6:9's ויהללוה are letter-for-letter identical.
And the Song's very next verse names the woman so blessed and praised:

> Song 6:10 — "Who is she that looketh forth as the morning, **fair as the moon** (יָפָה
> כַלְּבָנָה), clear as the sun...?"

Proverbs stages the praise-formula and withholds the name; the Song runs the identical formula and
names her: the **levanah** — Strong's H3842, "properly, (the) white, i.e. the moon," from H3835
*lavan*, to be white. This is a cross-text identification of exactly the kind the book calls
definitional: Scripture defining its own figure across books. Note also both poems open with the
same question-form ("Who can find...?" / "Who is she...?").

**Verdict: DEFINITIONAL** (intertext, not revoweling — the strongest single find of the study).

---

## Verse-by-Verse Table

| v | Letter | KJV (verified) | Hebrew key | Attested second reading / cross-text | Verdict |
|---|--------|----------------|------------|--------------------------------------|---------|
| 10 | א | "her price is far above rubies" | מִפְּנִינִים מִכְרָהּ | *peninim* H6443 "probably a pearl (as round)" — already the chapter's ground. Lam 4:7 lines peninim up with **snow** and **milk** (whiteness row). *Eshet chayil* elsewhere: Ruth 3:11 ("all the **gate** of my people doth **know** that thou art a virtuous woman"); Prov 12:4 ("a virtuous woman is a **crown** to her husband"). מכרה homograph *mekerah* H4380 (weapon, Gen 49:5): rejected. | intertexts strong; no new letters-find |
| 11 | ב | "no need of spoil" | לֹא יֶחְסָר | *chaser* H2637 "to lack... **lessen, decrease, abate**" — with her, nothing wanes; cf. 1 Kgs 17:14, 16 the widow's cruse "did not fail" (לא תחסר). Lunar "waning" sense of חסר is post-biblical. | stretch |
| 12 | ג | "all the days of her life" | כל ימי חייה | — | none |
| 13 | ד | "she seeketh wool, and flax" | צֶמֶר וּפִשְׁתִּים | Hos 2:5, 9 (KJV): the unfaithful **mother** chases lovers for "my bread... my **wool** and my **flax**," so her "**new moons**... and all her appointed feasts" cease (2:11). The faithful woman seeks wool and flax herself. *Tsemer* also sits in Isa 1:18's whiteness formula (below, v21). | strong counter-portrait intertext |
| 14 | ה | "like the merchants' ships; her food from afar" | סוֹחֵר, מִמֶּרְחָק | *sachar* H5503 is by Strong's own definition "**to travel round** (as a pedlar)" — the merchant-word is a circuit-word. מִמֶּרְחָק = the word of Prov 7:19: the *other* woman's husband "is gone a long journey" (בדרך **מרחוק**) until "the day of the **kese**" (7:20, full moon). NOT claimed: sahar/saharon "roundness / round tires like the moon" (H5469/H7720, Isa 3:18) — ח ≠ ה, different consonants. | circuit-sense definitional to the lexeme; Prov 7 link strong |
| 15 | ו | "riseth while it is yet night, and giveth **meat** to her household, and a **portion** to her maidens" | טֶרֶף, חֹק, לַיְלָה | **Confirmed:** טֶרֶף H2964 — the very word of Ps 111:5, "He hath given **meat** (teref) unto them that fear him: he will ever be mindful of his **covenant**." חֹק H2706 = "an enactment; hence an **appointment (of time...)**," KJV elsewhere "set time, appointed" — and Jer 31:35–36 gives the moon that word by name: "the **ordinances** (חֻקֹּת) of the **moon** and of the stars for a light **by night**... if those ordinances depart." One chapter earlier, Prov 30:8 pairs the same two words: הַטְרִיפֵנִי לֶחֶם חֻקִּי, "feed me (the *teref*-verb) with the bread of my *choq*" — KJV buries it as "food convenient." Homograph: נערתיה could also be *ne'orot* H5296 "tow" (flax refuse, Judg 16:9) — attested letters, no coherent sense: rejected. | teref **definitional**; choq-by-night **strong** |
| 16 | ז | "considereth a field, and buyeth it... planteth a vineyard" | שָׂדֶה, כָּרֶם | — (wlc.txt drops the ש of שדה here; file artifact) | none |
| 17 | ח | "girdeth her loins with strength" | בְעוֹז | Ps 8:2–3 sets עֹז beside the ordained moon and stars. | stretch |
| 18 | ט | "her candle goeth not out by night" | נֵרָהּ, לֹא־יִכְבֶּה, בַלַּיִל (kethib) | Same verb as 1 Sam 3:3, "ere the **lamp of God went out**" in the temple; Ex 27:20–21, the sanctuary lamp burns "from evening to morning before the LORD: a **statute for ever**" (חֻקַּת עוֹלָם — the v15 word again). Night-lamp of the sanctuary = the night-lamp of the sky-tabernacle (Ps 19:4). Also טָעֲמָה כִּי־טוֹב, "she perceives that it is good" — the כי־טוב of light at creation (Gen 1:4) and of the lights set to rule the night (Gen 1:18). | strong intertext |
| 19 | י | "spindle... distaff" | כִּישׁוֹר, פֶלֶךְ | *pelek* H6418: "from an unused root meaning **to be round**; a **circuit** (i.e. district); also a spindle (as whirled)" — the KJV itself renders pelek "part" = district in Neh 3. Letter for letter, "her palms hold the **circuit**." *Kishor* H3601 (hapax): "the spindle... by which it is **twirled**." Both of her tools are roundness-words. | both-true candidate |
| 20 | כ | "stretcheth out her hand to the poor" | לֶעָנִי | — | none |
| 21 | ל | "not afraid of the **snow**... all her household are clothed with **scarlet**" | שֶׁלֶג, לָבֻשׁ **שָׁנִים** | **The strongest letters-find.** Unpointed שנים is three attested lexemes: *shani(m)* H8144 **scarlet**; *shnayim* H8147 "**two... double**" (its KJV column even includes "twelve"); *shanim*, plural of H8141 *shanah*, "**a year (as a revolution of time)**." The "double" reading is anciently attested: LXX "clothes of **double** texture" (δισσὰς χλαίνας; repo `lxx.txt` at 31:22), Vulgate via DRB 31:21 "clothed with **double garments**," Smith's Literal "all her house put on **double**." The moon-facing third reading: her household is "clothed in **years**" — dressed in revolutions of time, so she fears no winter. And Isa 1:18 welds this verse's own pair with the missing white-word: "though your sins be as **scarlet** (כַּשָּׁנִים), they shall be **white** (יַלְבִּינוּ — hiphil of *lavan*!) as **snow** (כַּשֶּׁלֶג)... they shall be as **wool** (כַּצֶּמֶר, v13's word)." The lavan-root absent from the poem sits in the one verse that defines its scarlet-and-snow pair — and the moon is *levanah*, "the white one." Homograph *shinnayim* "teeth" H8127: attested letters, nonsense syntax — rejected (despite Gen 49:12 "teeth **white** with milk"). | **BOTH-TRUE, strong** (scarlet + double attested by ancient versions; "years" the calendar reading) |
| 22 | מ | "coverings of tapestry... silk and purple" | מַרְבַדִּים, שֵׁשׁ | *Marvaddim* H4765 occurs exactly **twice** in Scripture: here and Prov 7:16 — the strange woman's bed, in the one scene Scripture dates by the **full moon**: her husband is away "a long journey" (7:19, מרחוק = v14's word) and returns "at the day of the **kese**" (7:20, כסא — the fulness/throne word the Pearl chapter already stands on). The counterfeit decks *marvaddim* in the husband's absence at the dark of the month; the bride weaves her own, and her lamp never goes out. שֵׁשׁ fine linen H8336 = consonants of H8337 **six**; Ruth hands the other *eshet chayil* שֵׁשׁ־שְׂעֹרִים, "six of barley," by night at the threshing floor (Ruth 3:15, 17) — and Prov 31 sets שש (v22) beside בשערים (v23) in consecutive verses. Word-division stretch: מרבדים = מֹר + בַּדִּים, "myrrh + linen garments" (both attested, H4753/H906; Prov 7:17 perfumes that same bed with מר) — labeled stretch. | marvaddim/kese link **strong**; shesh=six candidate; mor+baddim stretch |
| 23 | נ | "her husband is **known in the gates**" | נוֹדָע בַּשְּׁעָרִים | Ps 104:19 — the chapter's own verse — pairs "the moon for appointed times" with "the sun **knoweth** his going down": *yada* is luminary language, and the sun's "going down" is his entrance at the western gate (מבוא השמש, Deut 11:30). Unpointed שערים = *she'arim* **gates** (H8179) or *se'orim* **barley** (H8184) — and Ruth runs both senses around the only other woman called *eshet chayil*: "all the **gate** of my people doth **know** that thou art a virtuous woman" (Ruth 3:11), said to the gleaner of "the **barley** harvest" among the *na'arot* (Ruth 2:23), winnowed "**to night** in the threshingfloor" (3:2); cf. 2 Kgs 7:1, barley sold "in the gate." Barley (*abib*) is what anchors the year's first month — the calendar's husband is known by the barley. | Ps 104:19 parallel strong; gates/barley both-true candidate |
| 24 | ס | "she maketh **fine linen**, and selleth it... girdles unto the **merchant**" | סָדִין, לַכְּנַעֲנִי | *Sadin* H5466's only other narrative home is Judg 14:12–13: **thirty** sadinim wagered at the seven-day wedding feast of Samson — the sun-named bridegroom (שמשון/שמש) owing thirty white linen garments: a month of days, counted in white linen, at a wedding. *Kena'ani* H3669 = Canaanite **and** merchant — a translator-acknowledged double (KJV prints "merchant" here). | thirty-sadin intertext candidate; kena'ani both-true (KJV's own) |
| 25 | ע | "she shall rejoice in time to come" | וַתִּשְׂחַק לְיוֹם אַחֲרוֹן | **Confirmed literal rendering: "she LAUGHS at the LAST day."** YLT "rejoiceth at a latter day"; DRB "shall laugh in the latter day"; SLT "will laugh to the last day." The exact phrase לְיוֹם אַחֲרוֹן stands in Isa 30:8: "write it... in a book, that it may be **for the latter day** for ever and ever." Letters: unpointed שחק is both *sachaq* H7832 (laugh, rejoice) and *shachaq* H7834 (the **sky**, the firmament) — and Ps 89:37 (Heb 89:38) stations the moon there by name: "as the **moon** established for ever, and a faithful witness **in the shachaq**." She laughs at the last day in the very letters of the sky where the moon-witness stands. Lady Wisdom — priced above pearls two chapters earlier (8:11) — is מְשַׂחֶקֶת, "laughing/playing before him" daily (8:30–31). Bonus attested sense: *acharon* H314 also = "(as facing the east) **western**" (הים האחרון, Deut 11:24) — she laughs toward the west, where her husband sets as she rises full. First half: עֹז־וְהָדָר לְבוּשָׁהּ — and Ps 104:1–2 defines that wardrobe: "clothed with honour and **hadar**... who coverest thyself with **light** as with a garment" (already quoted in the chapter); cf. Job 40:10. | **strong** (both-true wordplay + exact-phrase intertexts) |
| 26 | פ | "in her tongue is the law of kindness" | תוֹרַת־חֶסֶד | Root-play: *chasidah* H2624, "the **kind (maternal) bird**, the stork" — Jer 8:7: "the **stork** in the heaven **knoweth her appointed times** (מוֹעֲדֶיהָ)... but my people know not." The chesed-named bird is Scripture's emblem of kept moadim, set "in the heaven." | candidate (root-level) |
| 27 | צ | "she **looketh well** to the **ways** of her household" | צוֹפִיָּה הֲלִיכוֹת | *Tsofiyah* = the watchman verb (H6822 — already in the chapter). הֲלִיכוֹת H1979 "a **walking**; a procession or march, a caravan" (Hab 3:6 "his **goings** are everlasting"; Job 6:19 caravans). And Scripture's moon is the walker: Job 31:26 — "the **moon walking** (הֹלֵךְ) in brightness." She keeps the watch over the **walkings** of her house; cf. Judg 5:20, the stars fighting "from their **courses**." | strong (with v28's Job 31:26 tie) |
| 28 | ק | "her children arise up, and call her blessed; her husband also, and he **praiseth** her" | וַיְאַשְּׁרוּהָ... וַיְהַלְלָהּ | *Halal* H1984 — Strong's base definition: "to be clear (orig. of sound, but usually of color); **to shine**; hence... to celebrate"; its KJV column includes "**shine**, give (**light**)." KJV so renders it of a **lamp**: "when his candle **shined** upon my head" (Job 29:3), and of the lights: "if I beheld the sun when it **shined** (יָהֵל), or the **moon walking in brightness**" (Job 31:26 — halal and the walking moon in one verse). Read once, her husband praises her; read again, her husband **makes her shine** — the one physical fact of the moon's light. Side-note: the blessing-verb is the naming of **Asher** — "the daughters will call me blessed" (Gen 30:13) — a tribe-name embedded in the sons' blessing (curiosity only). | **strong** (Strong's own double; lamp + moon usages) |
| 29 | ר | "many daughters have done virtuously, but thou **excellest** them all" | וְאַתְּ עָלִית עַל־כֻּלָּנָה | Literally "thou hast **gone up** above them all" (עלה H5927; YLT "hast gone up," SLT "wentest up over all of them") — the ascent-verb, of the one light that climbs above all the daughters. Structure = Song 6:8–9 (see Headline): the same praised-above-queens-and-daughters scene whose next verse names her **fair as the levanah**. | **definitional** (via the Song formula) |
| 30 | ש | "favour is deceitful, and beauty is vain: but a woman that feareth the LORD, she shall be praised" | שֶׁקֶר הַחֵן... יִרְאַת־יְהוָה... תִתְהַלָּל | No letters-double found — reported honestly. Structure: the poem's fear-inclusio — לֹא־תִירָא (v21, fears not the snow) against יִרְאַת־יְהוָה (v30). תִּתְהַלָּל is *halal* again: "she shall be praised / made to shine." Against Song 6:10's "fair (יפה) as the moon": her יֳפִי is *hevel* — the beauty is not the ground of the praise; the light is not her own. **Rejected:** any pun of תירא/יראת on יָרֵחַ (moon) — aleph vs. chet, different consonants. | no find (v30 clean); inclusio structural |
| 31 | ת | "let her own works praise her in the gates" | וִיהַלְלוּהָ בַשְּׁעָרִים | ויהללוה = letter-for-letter Song 6:9's ויהללוה. *Halal* shine-sense and the gates/barley double both land here a second time, closing the poem at the gates the chapter already opened (Ezek 46:1). | carries v28–29's finds to the close |

---

## The Seven Leads, Answered

**1. Levanah / lavan letters — REFUTED in the poem, CONFIRMED at one remove.** Verified by
consonant scan: no לבנ sequence anywhere in 31:10–31 (nor ירח, אור, כסה, מועד, סהר). The
whiteness is present only as *things* — snow (v21), wool (v13), shesh-linen (v22), sadin (v24),
peninim (v10; Lam 4:7 sets peninim beside snow and milk) — never as the white-*word*. But the
poem's own key verse (v21) points to the one verse that supplies it: Isa 1:18 turns this verse's
scarlet (שנים) **white** (יַלְבִּינוּ, the lavan-verb) as this verse's snow (שלג), with v13's wool
(צמר) in the same breath. And the levanah is named where the poem's praise-formula is completed
(Song 6:9–10). Do not claim lavan letters inside the poem; claim the Isa 1:18 and Song 6:9–10 bridges.

**2. שנים scarlet/years/double — CONFIRMED, with ancient witnesses.** Unpointed שנים = H8144
scarlet / H8141 years ("a year as a revolution of time") / H8147 two-double (KJV column includes
"double" and "twelve"). The LXX read "double": repo `lxx.txt` renders "clothes of **double**
texture" (Greek δισσὰς χλαίνας, Rahlfs; the LXX folds MT vv21–22 together and drops "scarlet"
entirely from v21 — "for all her household are clothed"). The Vulgate read the same: DRB 31:21
"all her domestics are clothed with **double garments**." Julia Smith (SLT): "all her house put on
**double**." This is a documented ancient both-reading — translators split exactly where the vowel
points decide. The "years" reading is the moon-facing member of the triple: a household clothed in
revolutions of time fears no winter. (Matches the book's existing נשים/שנים work: Zech 5:9 patch,
Dan 9:25 patch — the Dan 9 patch already leans on H8147.)

**3. Teref in 31:15 — CONFIRMED.** WLC 31:15: וַתִּתֵּן **טֶרֶף** לְבֵיתָהּ — H2964, identical to
Ps 111:5 טֶרֶף נָתַן לִירֵאָיו ("meat unto them that fear him... ever mindful of his covenant"),
with the same verb נתן. Bonus: Prov 30:8 pairs the teref-verb with choq (הַטְרִיפֵנִי לֶחֶם חֻקִּי,
KJV "food convenient for me") one chapter before; and 31:15's second gift, חֹק "portion," is the
word Jer 31:35–36 uses for the moon-and-stars ordinances "for a light by night" — given, like hers,
while it is yet night. Na'arot/ne'orot ("tow," H5296): attested homograph, rejected for sense.

**4. Household = the twelve — NOT SUPPORTED by the poem's own letters or structure; supported only
by imported cross-texts.** The poem counts nothing: household members are the husband, unnumbered
sons (v28), unnumbered maidens (v15), "all her household" (v21 twice); בית occurs 4× (vv15, 21×2,
27). The acrostic is 22 verses = the complete alphabet — an A-to-Z completeness figure (as Ps 119,
Lam 1–4), **not** twelve; no honest 12, 29, or 30 in the structure. The twelve must come from
Gen 37:9–10 (sun, moon, **eleven** stars — the moon explicitly "thy mother"; with the dreamer,
twelve sons) and Rev 12:1 (the woman, moon under her feet, crown of **twelve stars**). One clean
text-bridge exists inside Proverbs if the author wants it: Prov 12:4, "a virtuous woman (אשת־חיל)
is a **crown** to her husband," + Prov 17:6, "children's children are the **crown** of old men" —
the eshet chayil is a crown, and a crown is children; Rev 12:1 puts the crown of twelve stars on
the mother. Grade that chain candidate (meaning-level); say plainly the poem itself never counts
her children.

**5. 31:25 "she laughs at the last day" — CONFIRMED.** ותשחק ליום אחרון is literally "and she
laughs at a last/latter day" (YLT, DRB, SLT concur; KJV's "rejoice in time to come" flattens it).
The exact phrase לְיוֹם אַחֲרוֹן appears in Isa 30:8 — the witness "noted in a book... for the
latter day, for ever and ever." Added letters-find: unpointed שחק = laugh (H7832) **and** sky
(H7834), and Ps 89:37 (Heb 38) places "the moon... a faithful witness **in the shachaq**" — the
same unpointed letters. Added attested sense: acharon H314 also means "western" (Deut 11:24) —
she laughs toward the west(ern) day, facing the setting sun at her fulness.

**6. 31:30 — NO FIND (honest).** No attested consonantal double worth claiming. The verse's work is
structural: the fear-inclusio (לא־תירא v21 / יראת־יהוה v30) and the third halal (תתהלל, "she shall
be praised/shine"). Explicitly rejected: reading יראת or תירא toward יָרֵחַ (moon) — aleph vs.
chet; and מרחק/ורחק toward ירח — anagram, not a sequence. The author should not use any yareach pun.

**7. Light and commerce inventory — DONE (see scan above).**
*Light:* the poem contains exactly **one** literal light-word: נֵרָהּ, "her lamp" (v18); plus
night ×3 (vv15, 18), snow (v21). Everything else shines by attested double or intertext: הלל
praise/shine ×3 (vv28, 30, 31; Strong's H1984 "to shine"; KJV "shined" Job 29:3 of a lamp, Job
31:26 of sun and moon), שחק laugh/sky (v25; Ps 89:37 moon-witness), the white things without the
white word (wool, linen, sadin, snow, pearls). אור never occurs; ירח and לבנה never occur; כסה/כסא
and מועד never occur.
*Commerce:* סוחר v14 (H5503 "to travel round"), סחרה v18 (H5504 profit), מכרה v10 (H4377 price),
ותמכר v24 (H4376 sell), כנעני v24 (Canaanite/merchant — KJV's own double). The merchant-vocabulary
is circuit-vocabulary at the root (Strong's H5503), and both spinning-tools are roundness-words
(kishor "twirled," pelek "circuit/whirl," H6418 — KJV renders pelek "part" = district in Neh 3).
The sachar↔sahar (moon-crescent, H5469/H7720) connection is **rejected as letters** (ח ≠ ה) —
cite only Strong's own "travel round" definition of H5503, which needs no help.

---

## Tier Ranking

**Definitional**
1. **Song 6:8–10 seals the portrait's name.** Same two praise-verbs (ויאשרוה / ויהללוה), same
   order, same one-above-many-daughters scene as Prov 31:28–31 — and the Song's next verse names
   the woman: "fair as the levanah." Scripture completes the formula Proverbs leaves anonymous.
2. **v15 teref = Ps 111:5's covenant-meat** (same noun, same verb נתן), with Prov 30:8's
   teref + choq pair one chapter earlier; the book already owns this word.

**Strong**
3. **v21 שנים — scarlet / double / years**, the double anciently attested (LXX, Vulgate/DRB, SLT),
   the pair snow-and-scarlet resolved white by Isa 1:18's lavan-verb.
4. **v25 "she laughs at the last day"** (exact phrase = Isa 30:8), in the unpointed letters of the
   *shachaq* where Ps 89:37 stations the moon, "a faithful witness in the sky."
5. **v15 choq by night = Jer 31:35–36**, the ordinances of moon and stars for a light by night;
   reinforced by Ex 27:20–21 (the lamp burning evening-to-morning, "a statute for ever") and v18's
   unquenched lamp (1 Sam 3:3's verb).
6. **halal = shine (vv28, 30, 31):** Strong's own base sense; KJV's own "shined" of lamp (Job 29:3)
   and of sun-and-moon (Job 31:26). Her husband praises her / makes her shine — reflected light in
   one verb.
7. **v27 halichot:** she keeps the watchman's watch (tsofiyah) over the *walkings* of her house —
   and Job 31:26's moon is "walking in brightness" (same verse as its yahel-shine).
8. **v22 marvaddim** — shared with exactly one other verse, Prov 7:16: the counterfeit woman's bed,
   in the scene dated "to the day of the kese" (7:20), her husband away "a long journey" (מרחוק,
   v14's word). The two women of Proverbs are cut from the same rare cloth, one at the dark of the
   month, one whose lamp goes not out.

**Candidate**
- v23/31 שערים gates/barley (H8179/H8184) — Ruth carries both senses around the only other named
  eshet chayil (Ruth 3:11 + 2:23), and barley anchors the first month.
- v19 pelek spindle/circuit (H6418; KJV "part" in Neh 3).
- v24 sadin — Judg 14:12–13, thirty white linens at the sun-named bridegroom's seven-day feast.
- v25 acharon "western" (attested spatial sense, Deut 11:24).
- v22 shesh linen/six (H8336/H8337; Ruth 3:15 שש־שערים "six of barley" by night).
- v26 chesed / chasidah — Jer 8:7, the stork that "knoweth her appointed times."
- v29 עלית "thou hast gone up" — the ascent-verb under KJV's "excellest."
- Crown-chain for the twelve: Prov 12:4 + Prov 17:6 + Gen 37:9–10 + Rev 12:1 (meaning-level).
- v13 wool + flax (+ bread, v14) = Hos 2:5, 9, 11 — the counter-wife who takes them from lovers
  and loses her new moons.
- v18 טעמה כי־טוב — the ki-tov of light (Gen 1:4) and of the night-lights (Gen 1:18).

**Stretch (label as such or omit)**
- v11 לא יחסר "does not diminish" (1 Kgs 17:14–16 cruse; lunar waning-sense is post-biblical).
- v22 מרבדים = מר + בדים word-division (myrrh + linen; Prov 7:17 has the myrrh).
- v17 oz / Ps 8:2–3.

**Rejected — the author should NOT use**
- Any יָרֵחַ pun on תירא, יראת, ורחק, ממרחק (aleph/chet differ; anagrams don't count).
- sachar ↔ sahar/saharon as a letters-claim (ח ≠ ה). Strong's "travel round" for H5503 is the
  legitimate form of this point.
- shinnayim "teeth" at v21 and ne'orot "tow" at v15 — attested homographs, incoherent in syntax.
- lavan/levanah letters *inside* the poem — verified absent; so is אור, so is every moon-word.
- Twelve in the poem's structure — 22 verses is the alphabet, and the children are never counted.
- "Sophia" in צופיה — cross-language accident.
- (Post-biblical, keep out of the argument: the synagogue custom of singing Eshet Chayil at the
  coming-in of Sabbath night — tradition, not Scripture.)

---

## What Could Enter the Pearl Chapter

Ordered to fit the existing section ("The Pearls the Translators Buried"), which already has:
rises-by-night + teref, lamp-not-out, merchant ships from afar, fine linen / Rev 19:8, watchman
verb, scarlet household, days of her life, husband known in the gates, praised in the gates.

1. **The Song 6:9–10 seal (the closer).** One or two sentences: the two verbs of her praise
   (ויאשרוה, ויהללוה) recur together exactly once more in Scripture — Song 6:9, the one woman
   blessed by the daughters and praised by the queens — and the next verse names her: "fair as the
   moon." The formula Proverbs leaves anonymous, the Song completes. This can replace or fulfill
   the current "leaves the question open" line.
2. **v21 upgraded:** "clothed with scarlet" is anciently also "clothed with double" (LXX, Vulgate) —
   and the same consonants are "years," a revolution of time; and Isa 1:18 turns the verse's own
   scarlet white as its own snow — a pearl buried under the vowel points, the book's favorite kind.
3. **v15 upgraded:** the KJV's "portion" is *choq* — Strong's "an appointment of time" — the very
   word of Jer 31:35's "ordinances of the moon and of the stars for a light by night," handed out,
   like hers, while it is yet night; and Prov 30:8 already pairs teref with choq as one meal.
4. **v25:** she does not merely "rejoice in time to come" — she *laughs at the last day* (YLT/DRB),
   and the unpointed letters of her laughter, שחק, are the sky of Psalm 89:37 where the moon stands
   "a faithful witness." The chapter already quotes Ps 89:36–37.
5. **halal = shine:** "her husband also, and he praiseth her" — Strong's first sense of halal is
   *to shine* (KJV "shined" of the lamp, Job 29:3, and of the moon walking in brightness, Job
   31:26): her husband makes her shine, and her own works shine in the gates — reflected fulness
   in a verb.
6. **The marvaddim weld:** the portrait's "coverings of tapestry" (31:22) shares its rare word with
   exactly one verse — Prov 7:16, the counterfeit woman's bed, in the scene the chapter already
   uses for the kese (7:20): the two moons of the final section were already the two women of
   Proverbs.
7. Optional garnish: v27's "ways" are *walkings* — the moon of Job 31:26 "walking in brightness"
   under the watchman-verb sentence the chapter already has; v29's "excellest" is literally "thou
   hast gone up above them all."

*(Kept out on the book's own rules: the yareach puns, the tow and teeth homographs, any claim that
the poem's structure encodes twelve.)*

---

## The Poem Rendered Whole

One continuous rendering of the acrostic, the letters read again — every departure from the KJV is
an attested lexeme chosen per the verse-by-verse table above; where the plain reading is best, the
plain reading stands. Changed words are **bold**; the plain sense of every change is footnoted in
the justification list below. Nothing here unseats the housewife: both readings run at once.

> (10) A woman of valour who can find? for her price is far above **pearls**.
> (11) The heart of her husband doth safely trust in her, and gain shall **never diminish**.
> (12) She doeth him good and not evil all the days of her life.
> (13) She seeketh wool, and flax, and worketh willingly with her palms.
> (14) She is like the ships of **the one who travels round**; she bringeth her bread from afar.
> (15) She riseth also while it is yet night, and giveth **the covenant's meat** to her household,
> and **the appointed portion** to her maidens.
> (16) She considereth a field, and taketh it: with the fruit of her palms she planteth a vineyard.
> (17) She girdeth her loins with strength, and strengtheneth her arms.
> (18) She **tasteth that it is good**, her merchandise: her lamp goeth not out **in the night**.
> (19) She layeth her hands to the spindle, and her palms hold fast **the circuit**.
> (20) She spreadeth out her palm to the poor; yea, she reacheth forth her hands to the needy.
> (21) She is not afraid of the snow for her household: for all her household are clothed
> **in double**.
> (22) She maketh herself coverings; her clothing is **white linen** and purple.
> (23) Her husband is known in the gates, when he sitteth among the elders of the land.
> (24) She maketh linen wraps, and selleth them; and delivereth girdles unto the merchant.
> (25) Strength and splendour are her clothing; and she **laugheth at the last day**.
> (26) She openeth her mouth with wisdom; and in her tongue is the law of kindness.
> (27) She **keepeth the watch** over the **walkings** of her household, and eateth not the bread
> of idleness.
> (28) Her sons arise, and call her blessed; her husband also, and he **maketh her shine**.
> (29) Many daughters have done valiantly, but thou hast **gone up above them all**.
> (30) Charm is a lie, and beauty a **vapour**: a woman that feareth the LORD, **she it is that
> shall shine**.
> (31) Give her of the fruit of her hands; and let her own works **make her shine in the gates**.

### Per-Verse Justification (keyed to the table)

- **v10** — *peninim* H6443, "probably a pearl (as round)": the chapter's own established
  rendering. Plain (KJV): "rubies."
- **v11** — *chaser* H2637; Strong's KJV column itself reads "decrease, abated, fail." Plain: "he
  shall have no need of spoil." Stretch-tier by the table; rendered lightly ("gain shall never
  diminish") for the resonance with the lamp that does not go out (v18).
- **v12** — plain kept.
- **v13** — plain kept; "palms" is the literal *kappeha*, kept visible throughout.
- **v14** — *sachar* H5503, Strong's own definition: "to travel round (as a pedlar)."
  Within-lexeme; no sahar/crescent claim. Plain: "the merchants' ships."
- **v15** — *teref* H2964 = Ps 111:5's covenant-meat (same noun, same verb); *choq* H2706 "an
  enactment; hence an appointment (of time...)," KJV elsewhere "set time" — Jer 31:35's word for
  the moon-and-stars ordinances by night. Plain: "meat... a portion."
- **v16, v17** — plain kept (qere "she planteth").
- **v18** — word order restored to the Hebrew (טעמה כי־טוב, "she tasteth that it is good") so
  Gen 1:4's *ki tov* of the light can sound; "in the night" is the kethib בליל. Plain: "she
  perceiveth that her merchandise is good... by night."
- **v19** — *pelek* H6418: "from an unused root meaning to be round; a circuit (i.e. district);
  also a spindle (as whirled)" — the KJV itself renders it "part" (district) in Neh 3. Plain:
  "distaff."
- **v20** — plain kept.
- **v21** — *shnayim* H8147 "double": the anciently attested variant — LXX "clothes of double
  texture" (δισσὰς χλαίνας), Vulgate/DRB "clothed with double garments," Smith's Literal "put on
  double." Plain (MT pointing): "scarlet" H8144. Third attested reading, not rendered but equally
  available: "clothed in years" (H8141, "a year as a revolution of time").
- **v22** — *shesh* H8336 is by definition "bleached stuff, i.e. white linen" — the whiteness sits
  inside the plain lexeme (KJV's "silk" is the departure, not ours). Homograph "six" H8337 noted
  in the table, not rendered. *Marvaddim* rendered plain ("coverings"); its Prov 7:16/kese weld is
  an intertext, not a translation choice.
- **v23** — plain kept: "gates." The barley homograph (H8184) is candidate-tier; footnote
  territory, not rendering territory.
- **v24** — *kena'ani*: "merchant" is the KJV's own choice of the attested double. "Linen wraps" =
  *sadin* H5466 ("a wrapper"; KJV "sheets" in Judg 14:12).
- **v25** — *sachaq* + *le-yom acharon*: "she laugheth at the last day" — YLT "rejoiceth at a
  latter day," DRB "shall laugh in the latter day," SLT "laugh to the last day"; exact phrase in
  Isa 30:8. Plain (KJV): "shall rejoice in time to come." Beneath it, untranslatable in one English
  word: unpointed שחק is also *shachaq*, the sky of Ps 89:37 where the moon stands "a faithful
  witness"; and *acharon* is also "western" (Deut 11:24). The pun stands in the letters, not the
  rendering.
- **v26** — plain kept.
- **v27** — *tsofiyah* H6822: the watchman verb (Ezek 3:17) — "keepeth the watch." *Halichot*
  H1979: "a walking; a procession" — "walkings," the word-family of Job 31:26's moon "walking in
  brightness." Plain: "looketh well to the ways."
- **v28** — *halal* H1984, Strong's base sense "to shine" (KJV's own "shined": Job 29:3 of a lamp,
  Job 31:26 of sun and moon). Plain: "praiseth her." Both are true at once: to praise her is to
  make her shine.
- **v29** — *alit* H5927, "thou hast gone up" — YLT and SLT render it so. Plain (KJV):
  "excellest them all."
- **v30** — *hevel* H1892, literally "breath, vapour" (plain: "vain"); *tithallal* is the same
  shine-verb in the reflexive-passive — "she it is that shall shine." Plain: "she shall be
  praised."
- **v31** — the same *halal*; and וִיהַלְלוּהָ is letter-for-letter Song 6:9's "and they praised
  her." Plain: "let her own works praise her in the gates."

### What the Whole Says When Assembled

Rendered whole, the poem is a night-piece from end to end, and it flows as one scene. A bride
priced above pearls is sought (v10); she rises while it is still night and deals out the covenant's
meat and the appointed portions (v15); she tastes that it is good — the words spoken over the light
— and her lamp burns through the night (v18); her palms hold the circuit (v19); her house is doubly
clothed against the white of winter, so she fears no snow (v21); she is dressed in strength and
splendour — the wardrobe Ps 104 defines as light — and she laughs at the last day, in the very
letters of the sky where the faithful witness stands (v25); she keeps the watchman's watch over the
walkings of her house (v27); and the poem ends in pure luminosity: her sons rise and bless her, her
husband makes her shine, she has gone up above all the daughters, and her own works make her shine
in the gates (vv28–31).

Two things are striking about the assembled portrait. First, it never breaks: the rendering needs
no forcing at any verse — the plain housewife and the night-light run the whole length together,
which is the both-true rule working at poem scale rather than word scale. Second, the rendering
still contains no moon-word — because the Hebrew contains none. Assembled, the poem is a complete
portrait of a light that shines all night with a shining her husband gives her, and it withholds
the name to the last line, where the praise is sung "in the gates." The name is supplied where the
same two praise-verbs are sung over the same one-above-many-daughters woman — Song 6:9 — and the
next verse speaks it: "fair as the moon." The poem paints; the Song signs the painting.
