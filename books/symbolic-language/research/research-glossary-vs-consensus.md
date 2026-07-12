# Research: Glossary vs. blind consensus — experiment results

The versioned cross-provider runner, prompt templates, schemas, input extractor,
and checked-in run format now live in
`books/symbolic-language/experiments/glossary-consensus/`. The historical runs
below predate that runner; their narrative results remain part of the research
record, while new runs preserve exact requests and raw responses in the repo.

Author 2026-07-04: "take the terms in the glossary, and ask an AI subagent
with fresh context to (1) define its primary symbolic meaning as generally
accepted and cite the basis, (2) have another agent grade it against our
glossary."

Method: 9 blind definer agents (general knowledge only — no repo access, no
web) defined the consensus symbolic meaning of all 122 glossary terms; 9
grader agents compared those against the book's glossary entries.
Verdicts: MATCH (book = consensus), REFINED (compatible, sharper),
DIVERGENT (contradicts consensus), NOVEL (no consensus exists; book stakes
a claim). CAVEAT on strength grades: book_case_strength was judged ONLY
from the citations in the glossary entry itself, not the chapters — WEAK
means the ENTRY under-cites, not that the book's case is weak.

## Distribution

| verdict | count | share |
|---|---:|---:|
| MATCH | 33 | 27% |
| REFINED | 50 | 41% |
| DIVERGENT | 19 | 16% |
| NOVEL | 20 | 16% |

Strength: STRONG 64 · ADEQUATE 39 · WEAK 19.

Read: 68% of the glossary lands on or sharpens the consensus — the method
reproduces what scholarship already agrees on, which is the book's
credibility floor. The other 39 terms (DIVERGENT + NOVEL) are, empirically,
the book's discoveries — the gems list for part openers and back matter.


## DIVERGENT (19)

**Egypt** [STRONG] — Consensus reads Egypt as bondage and the hostile world-system; the book identifies spiritual Egypt — and the whore of Babylon — as Jerusalem, the prophet-killing city. The citation chain is tight for a skeptic: Rev 11:8 names the great city as where the Lord was crucified, Rev 18:24 plus Matt 23:37 put the prophets' blood in Jerusalem, Isa 1:10 gives precedent for calling Jerusalem Sodom, and Gal 4:25 puts present Jerusalem in bondage.

**Light** [STRONG] — Parts ways on the referent: consensus makes light God's own presence/truth/salvation (1 John 1:5, John 8:12), while the book makes it human — 'the law lived visibly, good works others can see.' For the definition as stated, though, the two refs are explicit identity statements: Prov 6:23 ('the law is light') and Matt 5:16 (your light = good works seen).

**Cedar** [ADEQUATE] — Consensus reads the cedar as lofty majesty applicable to Israel's own royalty and the righteous (Ezek 17 Davidic cedar; Ps 92:12); the book restricts it to 'a great Gentile empire,' which those texts contradict. Ezek 31:3 is an explicit decode ('the Assyrian was a cedar in Lebanon') and carries the empire reading for that instance, but one verse cannot establish the 'Gentile' restriction or answer the counter-texts.

**Dragon** [ADEQUATE] — Parts ways at Rev 12:9: consensus leads with dragon = Satan, while the book defines it solely as 'a devouring kingdom,' keeping only the consensus's secondary Pharaoh/Babylon thread. Ezek 29:3 and Jer 51:34 squarely show kingdoms as devouring dragons, but the refs never engage Rev 12:9's explicit 'devil and Satan' identification, the skeptic's first objection.

**Garden** [ADEQUATE] — Parts ways completely: consensus reads garden as paradise/sanctuary and God's presence; the book reads a grouping of nation-trees. Ezek 31:9 in context genuinely pictures nations as 'the trees of Eden in the garden of God,' so the single ref carries the Ezekiel usage, but one passage is thin for redefining 'garden' against Genesis, Song of Songs, and Revelation.

**Harlot** [ADEQUATE] — Agrees on the spiritual-unfaithfulness core but parts ways on Revelation's great harlot: the book identifies her as unfaithful Jerusalem, while consensus reads Rome/the idolatrous world system. The Rev 17:18 → Rev 11:8 ('the great city... where also our Lord was crucified') → Ezek 23:19 chain is coherent and checkable, though the cited refs leave the 'reigns over the kings of the earth' objection unanswered.

**Moon** [ADEQUATE] — Consensus reads the moon as created order/subordinate powers, and in Christian tradition the church reflecting Christ-the-sun; the book flips the identification and makes the moon the Son reflecting the Father's light. The verbal link is real — Ps 89:37's moon as 'faithful witness' matches Rev 1:5's title for Christ, with John 5:19/1:5 supplying the reflected-light element — but it depends on reading the witness of Ps 89:37 as the moon itself.

**Name** [ADEQUATE] — Consensus near-universally reads name as character, nature, and authority; the book replaces that with 'the covenant itself,' taken as a bride takes a husband's name. Isa 4:1 ('let us be called by thy name' = marriage) and Ruth 3:9 (the skirt/wing covering) carry the marital-name imagery well, but the wing-corners-to-commandments link (Num 15:38-39) is uncited and Ex 20:7 / 2 Sam 7:13 require the book's reading rather than the plain one.

**Truth (the truth)** [ADEQUATE] — Parts ways at the referent: consensus reads emet as God's covenant faithfulness and Johannine 'the truth' as God's reality revealed in Christ and the gospel, while the book equates the truth with God's law as the standard. Ps 119:142 does state verbatim 'thy law is the truth,' but a single psalm verse is thin support for redefining the whole NT usage — Ps 119:151 and John 17:17 would be needed to press the case.

**Bow** [WEAK] — Consensus: the bow symbolizes military might, with Gen 9's rainbow as the retired war-bow serving as a covenant SIGN; the book makes the bow itself mean 'the covenant that binds a people together,' dropping the war-strength reading entirely — they part ways on texts like Ps 46:9 and Jer 49:35 where breaking the bow = disarming. Gen 9:13 alone shows the bow as a token of a covenant with all flesh, not a covenant 'binding a people together,' and no verse tests the definition elsewhere (Hos 1:5, Ps 78:57 missing).

**Fruit** [WEAK] — Agrees that fruit = works by which judgment falls, but parts ways on the referent: the book assigns fruit to nations (via tree=nation), while consensus reads the deeds and character of a person. Matt 7:17 says nothing about nations; the verse that would carry the national reading (Matt 21:43, 'a nation bringing forth the fruits') is missing.

**Heart of the earth** [WEAK] — Consensus reads Matt 12:40's phrase as the grave/Sheol; the book takes the minority 'Jerusalem' reading — that is exactly where they part. The single ref, Ezek 38:12, reads only 'midst of the land' in KJV (tabbur, 'navel,' visible only via Strong's H2872), never says 'heart' or 'Jerusalem,' and no verse is cited bridging it to Matt 12:40, so a skeptic has almost nothing to overturn the near-universal grave reading.

**Island, isle** [WEAK] — Consensus reads isles/coastlands as a geographic idiom for far-off Gentile lands; the book instead makes island a covenant-status symbol — a sanctified people risen out of the sea of nations — which is a genuine parting of ways. The refs undercarry it: Gen 10:5 supports the geographic reading, the load-bearing Job 22:30 'island of the innocent' exists only in KJV (modern versions render 'one who is not innocent'), Rev 16:20's fleeing islands do not obviously mean deliverance, and no verse is cited for the rock-out-of-the-sea structure.

**Life (the life)** [WEAK] — Consensus locates 'the life' in eternal/divine life through union with Christ; the book relocates it to 'covenant existence — the life the law produces,' a law-generated life mainstream readings would dispute. Neither ref mentions the law: John 14:6 and Matt 7:14 show life as a destination of the way but not law-produced — Deut 30:15-20 or Lev 18:5 would be needed and are missing.

**Living creature** [WEAK] — Consensus reads the living creatures as cherubim throne-attendants representing creation's worship; the book reads them as nations/peoples by analogy to Daniel's sea-beasts, a direct contradiction (and it conflates Revelation's zoa with Daniel's theria). Refs are empty, so nothing is offered to carry a contested claim.

**Oil** [WEAK] — Explicitly denies the mainstream oil = Holy Spirit/anointing reading ('not the Spirit'), substituting proven works that make light. Ex 27:20 (beaten oil for the lamp) and Matt 25:3-9 (untransferable, purchasable oil) are suggestive, but the load-bearing links — fruit = works and light = good works (e.g. Matt 5:16) — are uncited, so a skeptical reader is not carried to 'works, not Spirit.'

**Pearl** [WEAK] — Consensus reads the pearl as supreme, all-demanding worth (the kingdom, sacred truth); the book instead identifies it as the full moon — 'the one complete light' governing appointed times — via a peninim/keseh wordplay chain. No cited verse joins pearl to moon: the refs separately show pearls are precious (Prov 3:15; 31:10) and keseh marks the appointed full moon (Ps 81:3), and the letter-level keseh/throne argument cannot be checked from the citations at all.

**Scarlet** [WEAK] — Parts ways at both anchor texts: consensus reads Isa 1:18's scarlet as sin's stain and Rev 17:4 as harlot luxury; the book reads scarlet as covenant blood made wearable, with the harlot's scarlet a counterfeit of it. Neither cited verse states the covenant-blood sense — the verses that could ground it (Heb 9:19's scarlet wool in the covenant-blood sprinkling; Josh 2:18; Lev 14:4) are missing.

**Storm, tempest** [WEAK] — Parts ways on the referent: consensus reads storm as God's own judgment/wrath (and theophany or personal trial), while the book reads it as the nations in turmoil that Christ stills. The lone ref, Mark 4:39, shows only a literal storm calmed; the bridge equating raging waters with peoples (Ps 65:7; Isa 17:12-13; Luke 21:25) is missing, so the definition does not survive a skeptic's lookup.


## NOVEL (20)

**Faith** [STRONG] — No consensus definition exists beyond bare trust, and the book stakes the covenant-faithfulness side of the acknowledged emunah/pistis debate: faith is trusting obedience that acts. Hab 2:4 (emunah = faithfulness in every major lexicon) and Jas 2:17 carry exactly that claim for a skeptical reader.

**Israel** [STRONG] — The symbolic extension of 'Israel' is a standing division with no consensus, and the book stakes the 'covenant and character, not blood' side. Its two refs say nearly verbatim what the definition claims — Gen 32:28 ('as a prince hast thou power with God... and hast prevailed') gives the new-name-of-the-prevailer, and Rom 9:6 ('they are not all Israel, which are of Israel') gives the not-blood clause.

**Love** [STRONG] — No symbolic consensus exists (mainstream treats love as a literal virtue/attribute), and the book stakes a definitional claim: love = keeping the commandments, not merely evidenced by it. 1 John 5:3 states the definition verbatim ('this is the love of God, that we keep his commandments') and John 14:15 seconds it.

**Rich** [STRONG] — No fixed consensus symbol exists; the book elevates the recognized Laodicea/Smyrna irony into a definite decoding: rich = self-sufficient, 'full of self, unable to receive.' Rev 3:17 literally says 'have need of nothing,' and Prov 13:7, Rev 2:9, and Luke 12:21 carry the paradox and the 'rich toward God' counter-sense directly.

**Righteousness** [STRONG] — Where scholarship is split (imputed status vs. covenant faithfulness), the book stakes the law-keeping side and pointedly excludes a 'verdict only received' — a stance many Protestant readers would find divergent from Rom 3/Phil 3. But the cited verses carry it verbatim: Deut 6:25 ('it shall be our righteousness, if we observe to do all these commandments'), Ps 119:172, 1 John 3:7.

**Sign** [STRONG] — Where consensus treats 'sign' functionally (pointer/authentication) rather than as a defined symbol, the book stakes a specific claim: a sign is an advance prophecy, often the prophet's own lived story, verified by fulfillment — choosing Luke 11:30's Jonah-as-person over Matt 12:40's resurrection gloss. Ezek 24:24 ('Ezekiel is unto you a sign... when this cometh, ye shall know') carries the lived-story definition explicitly, and Isa 7:14 and Luke 11:29-30 carry both the advance-prophecy and not-on-demand clauses.

**West** [STRONG] — Consensus assigns west no symbolism; the book stakes an orientation claim (yam 'sea' = west, the quarter behind an east-facing Israel). Zech 14:8 ('hinder sea') and Joel 2:20 ('face toward the east sea... hinder part toward the utmost sea') put the front/back scheme on the page in the KJV itself, and Ps 103:12 covers the distance idiom.

**Widow** [STRONG] — Consensus keeps widow literal (paradigm of the vulnerable) with the city-as-widow figure only occasional; the book fixes that figure as the word's symbolic meaning — God's people cut off from their Husband. Lam 1:1 ('how is she become as a widow') plus Isa 54:5 ('thy Maker is thine husband,' with 54:4's 'reproach of thy widowhood') carry the equation directly.

**East** [ADEQUATE] — No consensus exists (mainstream calls the imagery ambivalent); the book stakes a unified claim via the qedem east/ancient double meaning: east is where beginnings and returns come from. The cited verses (Eden, returning glory, lightning of the coming, east gate) do show the arrival pattern, but Rev 16:12's kings of the east cut both ways and the Genesis exile-eastward counterexamples go unaddressed.

**Fatherless, orphan** [ADEQUATE] — Mainstream reads the orphan literally as the vulnerable class, treating the covenant-people metaphor as occasional; the book makes that metaphor the standing symbol — God's people left without their Father, the remnant. Lam 5:3 is precisely that use and carries the definition, but elevating one verse to a general symbol wants corroboration like Hos 14:3 or John 14:18.

**Heaven** [ADEQUATE] — No symbolic consensus exists (mainstream treats heaven as literal sky/divine dwelling plus metonymy); the book stakes a claim that the term's meaning is God's dwelling-and-government whose hope is descent, not human ascent. Rev 21:2-3 carries the descent-and-dwelling claim directly, but it is a single ref and the 'government' element (e.g., Dan 4:26) is uncited.

**Instruction** [ADEQUATE] — Mainstream assigns no symbolic meaning — musar is plain didactic vocabulary — while the book stakes the claim that instruction is specifically 'the discipline of the law, received and kept.' Prov 1:7 carries 'fools despise' and Prov 23:23 'received and kept,' but neither cited verse ties instruction to the law itself (Prov 6:23 or Isa 2:3 would have), leaving the distinctive law-identification uncited.

**Jacob** [ADEQUATE] — Scholarship treats Jacob/Israel as interchangeable poetic variants, so the book's 'crooked, supplanting heart that God transforms' stakes the homiletic-tradition claim where no consensus exists. Gen 27:36 carries 'supplanter' explicitly, and Jer 17:9's 'deceitful' heart is genuinely the same Hebrew root as Jacob (H6121 aqob / H6117 aqab) — real but invisible in English without a concordance — while the 'God transforms' half has no ref in this entry (Gen 32:28 sits under Israel).

**Moment** [ADEQUATE] — No mainstream symbolic sense exists; the book stakes a claim that 'moment' is the unit of decisive divine action, never a slow process. Isa 47:9, Job 34:20, and 1 Cor 15:52 do each show sudden judgment or sudden resurrection, though the universal 'never a slow process' generalization exceeds what three verses prove.

**Nineveh** [ADEQUATE] — No single symbolic consensus exists; the book stakes a claim aligned with one accepted typological strand (repentant Gentiles) while adding 'a great city of the sea.' Matt 12:41 directly carries Gentiles who repent and rise in judgment, but nothing cited supports the sea-city element.

**Voice** [ADEQUATE] — No fixed consensus symbol exists; the book stakes a modest claim that voice = the speaker's words (the Shepherd's voice is His words), rather than the obedience idiom or an anthropomorphism. John 10:27 alone shows hearing-and-following but never states voice = words; John 12:47-48 or 6:63 would close that gap.

**Barley** [WEAK] — No consensus symbol exists; the book fixes barley as the firstfruits sheaf identified with the risen Christ, a definite stake. Neither cited verse mentions barley — Lev 23:10 says only 'firstfruits of your harvest' — so the barley-to-wave-sheaf link needs Ex 9:31-32, Ruth 1:22, or 2 Kings 4:42, none cited; 1 Cor 15:20 carries only the firstfruits-to-Christ half.

**Elam** [WEAK] — Mainstream assigns Elam no figurative meaning, so the book's 'Babylon under another name' is a staked claim. The lone ref, Jer 49:35 (breaking Elam's bow), shows judgment on Elam but establishes no identification with Babylon at all; parallels between Jer 49:34-39 and the Babylon oracles of Jer 50-51 (or Dan 8:2, Isa 21:2) are missing.

**Firmament (Heaven)** [WEAK] — No symbolic consensus exists; the book stakes a claim that the divided waters are two peoples (nations below, heavenly assembly above). Gen 1:6-8, 14-17 only establishes the divider-and-lights structure — nothing in the cited refs identifies waters as peoples (Rev 17:15 or similar is missing).

**Gospel** [WEAK] — No consensus symbolic meaning exists; the book stakes a distinctive claim that the gospel's content is the renewed covenant and the law going forth from Zion (versus the mainstream plain-sense death-and-resurrection proclamation). Isa 52:7 carries only 'good tidings... Your God reigns' — nothing cited supports the covenant/law identification (Isa 2:3 and Jer 31:31 are missing).


## REFINED (50)

**Beast, wild animal** [STRONG] — Core (beast = kingdom/nation) matches the firmest consensus in the field; the book sharpens it with the beast/tree structural pairing and the unclean-beasts-as-Gentile-nations extension. Dan 7:17 and 8:20-21 are explicit in-text decodes, and Acts 10:28 has Peter himself interpret the vision's animals as people — the refs are self-interpreting.

**Belief, to believe** [STRONG] — Compatible with the lexical consensus (trust/fidelity, not bare assent) but pushed further: obedience as the operational content, with apeitheo as the antonym. John 3:36's Greek antithesis (pisteuon/apeithon) and Rom 10:16's explicit believe=obey parallelism ('they have not all obeyed the gospel. For Esaias saith, Lord, who hath believed...') carry it even for a skeptic, though the KJV flattens John 3:36.

**Cast into the sea (a stone, mountain, or millstone sinking)** [STRONG] — Matches the irreversible-destruction consensus but sharpens it to the fall of a ruling power sunk into the 'sea of peoples' — and by including the mountain in the phrase-symbol it implicitly rejects the mainstream prayer-hyperbole reading of Matt 21:21. Jer 51:63-64 ('thus shall Babylon sink, and shall not rise') and Rev 18:21 state the meaning verbatim, with Ex 15:4-5 as pattern.

**Cloud** [STRONG] — Keeps the consensus vehicle-of-heaven/theophany core and extends it: the word as cargo, and Heb 12:1's 'cloud of witnesses' as an airborne multitude of saints. Ps 104:3 ('clouds his chariot'), Ex 13:21, Acts 1:9-11, Dan 7:13, and 1 Thess 4:17 carry the transport reading explicitly, though Deut 32:2 (quoted in the definition for the doctrine-as-rain cargo) is oddly absent from the refs.

**Field** [STRONG] — Matches the consensus core (field = the world, Jesus' own decoding in Matt 13:38) and extends it: the Lev 19:9-10 gleaning edge and the Matt 13:44 treasure are read through the symbol, which mainstream does not do. Matt 13:38 carries the core about as strongly as possible and Lev 19:9-10 supports the gleaning clause; only Matt 13:44 is missing for the treasure line.

**Flood** [STRONG] — Narrows to the invading-army strand consensus already recognizes, making it the definition and adding 'the Lord's own host'; the Noahic judgment/cleansing paradigm is omitted. Isa 8:7 explicitly decodes the flood as 'the king of Assyria,' and Jer 47:2 and Dan 9:26 reinforce it — a skeptic would concede the equation.

**Fool** [STRONG] — Compatible with the moral-not-intellectual consensus but sharper: the fool is specifically the hearer who will not do — the lawless. Matt 7:26 states that definition nearly verbatim, and Ps 14:1 supplies the God-rejection side.

**Grass** [STRONG] — Compatible with 'all flesh is grass' but shifts the emphasis from transience to identity — grass is the individual mortal, implicitly contrasted with trees as nations — and adds the harvest-field frame. Isa 40:6-8 carries the core identification verbatim; Matt 13:38 supports the farmed-field clause only loosely (it concerns wheat and tares, not grass).

**Iron** [STRONG] — Compatible with the consensus (Dan 2:40's iron kingdom is part of the standard basis) but narrower and more committed: the book drops the general strength/oppression senses and stakes the traditional Rome identification in the flagged four-kingdoms dispute. Its argument is well-carried by the refs — Dan 8:20-21 explicitly names Media-Persia (one ram) and Greece, so a skeptic can follow the inference that the fourth, iron kingdom is the empire after Greece, the one ruling at Christ's coming.

**Judgment** [STRONG] — Compatible with the mainstream lexical breadth of mishpat (verdicts, right governance, just order) but sharper: judgment as the ruler's delivering office, owed first to the vulnerable, with condemnation only one verdict of it. The six refs carry each clause — 1 Sam 8:20 and Isa 33:22 (judging = ruling/saving), Deut 10:18 (judgment executed for widow and fatherless), Ps 119:160 and Matt 23:23 (judgments kept/done like commandments), Dan 7:22 (judgment given in the saints' favor).

**Justice** [STRONG] — The operative sense (commandments done where a neighbor can be wronged or righted) matches the consensus social-covenantal reading; the sharpening is the checkable lexical claim that KJV 'justice' and 'righteousness' translate one Hebrew word. The paired refs prove it exactly: Gen 18:19 'justice' and Jer 22:3 'righteousness' are both H6666 tsedaqah, and Ps 89:14 'justice' vs Ps 97:2 'righteousness' are both H6664 tsedeq in the identical throne formula.

**Lamb** [STRONG] — The book generalizes the symbol to 'a covenant person of the flock' with Christ as the perfect exemplar taken from the sheep, which subsumes rather than contradicts the sacrificial consensus. The refs carry it well: 2 Sam 12:3, Jer 11:19, Isa 53:6-7, and Luke 10:3 all explicitly use lamb for persons, and Ex 12:5 + John 1:29 supply the 'perfect lamb without blemish' climax.

**Leaven** [STRONG] — Matches the consensus 'hidden corrupting influence / false teaching' but sharpens it via the bread symbol: leaven is specifically the word/doctrine soured, and it drops the minority positive use (Matt 13:33). Matt 16:12 explicitly decodes leaven as the Pharisees' doctrine, with Lev 2:11 and 1 Cor 5:7-8 supporting the altar ban and Passover purge.

**Liberty** [STRONG] — Follows the consensus Jubilee-to-Christ trajectory but adds a sharper, law-positive edge: liberty is a change of masters never the absence of one, constituted by the law of liberty, with license as its counterfeit. Each element has an apt ref — Lev 25:10 (Jubilee), Isa 61:1 (proclamation), Jas 1:25 (law of liberty), 2 Pet 2:19 (liberty-as-license enslaves).

**Lion** [STRONG] — Unifies the consensus's acknowledged double pole under one structure — the lion is the ruler/empire, predatory in the wicked and rightful only in the Lion of Judah — inverting the mainstream priority but staying compatible. The refs are explicit: Prov 28:15 (roaring lion = wicked ruler), Zeph 3:3 (princes are lions), Jer 50:17 (Assyria/Babylon the lions), Ezek 19 (princes as whelps), Rev 5:5.

**Meat** [STRONG] — Agrees that meat is the solid, mature teaching but sharpens the maturity condition: it is understood only by those willing to obey. John 7:17 ('if any man will do his will, he shall know of the doctrine') directly supplies the obedience condition and Heb 5:14 supplies strong meat for those exercised by practice.

**Naked, nakedness** [STRONG] — Compatible with the consensus shame/exposure reading but sharper: the covering lost is specifically covenant covering. Ezek 16:8 explicitly joins covering nakedness with entering covenant ('covered thy nakedness... and entered into a covenant with thee'), and Gen 3:7 shows exposure following breach.

**Sand** [STRONG] — Affirms both consensus senses (innumerable multitude; unstable foundation) and fuses them: the foundation shifts because it is the crowd. Gen 22:17, Hos 1:10, and Rev 20:8 carry the multitude sense explicitly and Matt 7:26 the foundation sense; the 'build on the crowd' fusion is an inference, but Rev 20:8's hostile nations-as-sand makes it a short, visible step for a skeptic.

**Sea, waters** [STRONG] — Matches the firmest consensus decoding (Rev 17:15, peoples and nations) and extends it with a two-tier structure: restless waters below the firmament vs. the stilled 'sea of glass' above where the redeemed stand. Rev 17:15 is Scripture's own key, and Gen 1:6-8, Ps 148:4, and Rev 4:6/15:2 supply each piece of the extension.

**Shadow** [STRONG] — Unifies two consensus senses — protective shelter and the typological shadow-of-things-to-come — under one principle, 'the covering of a greater presence,' while setting aside the third consensus strand (transience/gloom). Ps 91:1, Num 14:9 (where KJV indeed renders Hebrew tsel as 'defence,' exactly as claimed), and Col 2:17 each carry their clause precisely.

**Stars** [STRONG] — Stays inside the consensus cluster but sharpens it: leads with stars = the righteous (Dan 12:3) and twelve stars = twelve tribes, demoting the angels/rulers sense that mainstream sources put first. Dan 12:3 carries the core claim verbatim, Gen 37:9 + Rev 12:1 carry the tribes reading, and Ps 136:9 carries 'rule the night' — only the 'with the Son' clause depends on a moon=Son link not established by these refs.

**Stranger** [STRONG] — Compatible with consensus but reframed around covenant citizenship: the stranger is the non-citizen of God's commonwealth, with the familiar pilgrim motif as its corollary once inside. Eph 2:12, 19 carry the primary claim almost verbatim ('aliens from the commonwealth of Israel... no more strangers... fellowcitizens'); the uncited 'stranger to the world' clause is itself the uncontroversial consensus motif (1 Pet 2:11; Heb 11:13).

**Sun** [STRONG] — Sharpens the consensus 'God's glory/presence, father figure in Gen 37' into a single identification: the sun is the Father, source of every lesser light. The refs carry it well — Ps 84:11 ('the LORD God is a sun'), Gen 37:9 (sun = the father, Jacob), Matt 13:43 (righteous shine as the sun 'in the kingdom of their Father').

**Virgin** [STRONG] — Within the consensus (2 Cor 11:2 church as chaste virgin) but sharpened into a covenant-fidelity polarity: the bride espoused to one husband versus the harlot of many. 2 Cor 11:2 carries the definition nearly verbatim ('espoused you to one husband... chaste virgin'), with Matt 25:1 supplying the bridegroom setting; only the harlot contrast (Rev 17) is left uncited.

**Wisdom** [STRONG] — Agrees with the mainstream fear-of-the-LORD, moral-practical core but sharpens it to 'the doing of the commandments' specifically, and sidesteps the Lady Wisdom/christology debate entirely. Deut 4:6 ('keep therefore and do them; for this is your wisdom') and Ps 111:10 state the equation nearly verbatim.

**Worship** [STRONG] — The core matches the consensus lexicon (shachah/proskyneo = bow down, paired with serve, owed to God alone), then sharpens with two stakes: worship kept at God's appointed times, and worship is not the song service. Ex 20:5 and Matt 4:10/Deut 6:13 give the bow+serve pair, and 2 Chr 20:18-19 does show worship and singing as distinct acts in one scene; only the 'appointed times' clause lacks a cited proof.

**Bread** [ADEQUATE] — Sharpens the consensus's spiritual-nourishment strand into a flat identification: bread = the word of God, consistent with Christ being both the bread of life and the Word. Deut 8:3's manna logic (fed with manna 'that he might make thee know' man lives by the word) supports the transfer, but a skeptic can read both refs as contrasting bread with the word rather than equating them; John 6:31-63 and Amos 8:11 would close the gap.

**Darkness** [ADEQUATE] — Compatible with the consensus (sphere of evil opposed to God) but sharper: darkness as concealment of disobedience specifically. John 3:19-20 states that exact logic almost verbatim ('neither cometh to the light, lest his deeds should be reproved'), but a single passage leaves the symbol's breadth (Eph 5:11-13, outer darkness, plague of darkness) untested.

**Day** [ADEQUATE] — Develops the consensus's daylight-as-sphere-of-righteousness strand into 'exposure and accountability, when deeds are seen and tested,' without contradiction (Day-of-the-LORD strand is simply not in view). Gen 1:5, John 9:4, and 1 Thess 5:5 carry day = light-domain, working season, and children-of-the-day, but the distinctive 'deeds tested' element lacks its best proof text (1 Cor 3:13, 'the day shall declare it').

**Divorce (bill of divorcement)** [ADEQUATE] — Agrees with the consensus core (covenant lawsuit, exile as the wife sent away) but sharpens it into a two-sided rule — divorce hated when it betrays the covenant wife (Mal 2) yet commanded when the union is fornication (Ezra 10) — and adds a cross-resolution of Deut 24's no-return rule. The refs carry every clause except that last one; Rom 7:1-4 or Jer 3:1 is missing for the cross claim.

**Dog** [ADEQUATE] — Compatible with the consensus (unclean outsider) but narrower and sharper: the dog is specifically the Gentile outside the covenant house, with a redemptive arc ('fed on crumbs until brought in') consensus lacks. Matt 15:26-27 carries that reading directly, but a single passage is thin for a standing symbol; Rev 22:15, Phil 3:2, or Deut 23:18 would be needed to show the pattern holds elsewhere.

**Ephraim** [ADEQUATE] — Builds on the consensus synecdoche (Ephraim = scattered northern kingdom, the firstborn son) and sharpens it eschatologically: his seed becomes 'the fulness of the nations,' echoing Rom 11:25. Gen 48:19 carries the key phrase (melo ha-goyim) directly, but 'scattered' and 'firstborn' need the uncited Jer 31:9-10 and Hosea to complete the case.

**Feet** [ADEQUATE] — Takes one of the two consensus senses (feet = one's walk/conduct, omitting the under-the-feet dominion sense) and sharpens it with a specific application to John 13:10 — daily conduct cleansed while the bathed body stays clean. The definition itself is consensus-shared, but John 13:10 presupposes rather than proves feet = conduct; Prov 4:26-27 or Ps 119:105 would supply the definitional base.

**Fish (great fish, sea-monster)** [ADEQUATE] — Sharpens the consensus empire-as-dragon strand into a structural claim: a kingdom that swallows and must disgorge; it silently sets aside the Jonah-fish-as-grave typology. Jer 51:34 and Ezek 32:2 carry the swallowing-kingdom reading explicitly, but the 'forced to give back' clause lives in Jer 51:44, which is not cited.

**Four winds** [ADEQUATE] — Elevates the consensus's secondary strand (winds as agents of divine power) to the primary meaning and adds the horsemen identification, setting aside the 'from everywhere' compass idiom. Zech 6:5 explicitly calls them 'the four spirits of the heavens which go forth from... the LORD' amid a vision of colored-horse chariots, but Rev 6 is uncited, so 'shown as the four horsemen' rests on an unstated link.

**Horse, white horse** [ADEQUATE] — The book keeps the agreed symbolic value (conquest — 'the conqueror who wins the nations') but sharpens it with a specific frame, the horse as 'the mount of an executing spirit' (a Zech 6:1-8 idea). Rev 6:2 carries the bow-armed conqueror verbatim, but the executing-spirit half has no cited ref (Zech 1:8 or 6:5 is missing).

**Lamp** [ADEQUATE] — Narrows the consensus 'God's word' to 'the commandment' — sharper and compatible. Prov 6:23 literally states 'the commandment is a lamp,' but it is a single witness and the refs do not address the dynastic lamp or the lampstand-churches uses a skeptic would raise.

**Lost sheep** [ADEQUATE] — Narrows the consensus's dual reading (individual sinner + corporate Israel) to the corporate pole only: the scattered house of Israel regathered. Matt 15:24 verbatim supports 'lost sheep of the house of Israel,' but it is a single ref and does not by itself establish 'sought and regathered' — Ezek 34 or Jer 50:6 would have sealed it.

**Net** [ADEQUATE] — Adopts the consensus kingdom-dragnet strand and sharpens it with sea = peoples, while silently dropping the equally standard snare/judgment strand. Matt 13:47-48 directly gives a net gathering 'of every kind' from the sea, but the 'sea of peoples' gloss (Rev 17:15) is not supported within this entry's refs.

**North, the north country** [ADEQUATE] — Agrees with the consensus invasion-quarter reading and sharpens it with the genuine tsaphan 'to hide' etymology and Isa 14:13's enemy seated in the sides of the north; it adds a distinctive prophetic identification of Babylon's northern spoilers (Jer 50:9, 41) with Rev 17:16's ten kings. The Jeremiah and Isaiah refs carry the ambush/spoilers reading well, but Rev 17:16-18 never mentions the north, so that identification rests on juxtaposition.

**Remnant** [ADEQUATE] — Agrees with the faithful-minority core (7,000; Rom 11:5) but sharpens it with a gleaning-law identity (widow/fatherless/stranger at the field's edge) and a 'fixed ratio' claim. Zech 13:8-9 does supply refining and a ratio, but Ruth 2 alone cannot carry the gleaning-geometry link — the gleaning statutes themselves (Lev 19:9; 23:22) are uncited and the ratio math is not shown.

**Serpent** [ADEQUATE] — 'The deceiver' is pure consensus; 'the one who strips the covenant covering' is the book's distinctive garment-theology addition. Gen 3:1 alone shows the subtle deceiver adequately (and the identification is uncontroversial), but the covering clause has no cited basis — Rev 12:9 and Gen 3:7,21 are missing.

**Tree** [ADEQUATE] — Compatible but narrowed: the consensus cluster is both individuals (righteous person as tree, Ps 1:3; Jer 17:8) and kingdoms; the book collapses it to the corporate sense only, 'a nation or people.' Rom 11:17 (olive tree = Israel) carries the corporate reading well, but Dan 4:22 names the king personally ('It is thou, O king'), and stronger corporate texts (Ezek 31; Judg 9) go uncited.

**Valley** [ADEQUATE] — Compatible with the consensus lowness/reversal cluster but sharpened through the book's mountain=kingdom symbol: valleys are the low and humbled, the structural opposite of kingdoms. Isa 40:4 alone does supply the valley/mountain opposition and the exalt/abase verbs, but the humbled-people identity would be far firmer with Isa 2:12-14 or Luke 1:52; 3:5-6 alongside it.

**Wings (kanaph)** [ADEQUATE] — Compatible with the consensus refuge/garment-corner reading but sharpened into one thesis: kanaph as the covenant edge where the law's reminder (tzitzit) is bound. Ezek 16:8 proves the covenant-spreading of the kanaph, but this entry cites nothing for the tzitzit link (Num 15:38 sits only under the separate Tzitzit entry) or for refuge (Ps 91:4; Ruth 3:9).

**Babel / Babylon** [WEAK] — 'Self-made kingdom that builds a name against heaven' tracks the consensus (Gen 11:4's 'let us make us a name'), and 'covenant counterfeit' / 'empire over many kingdoms' sharpen it without contradicting it. But refs is empty, and the covenant-counterfeit claim is not uncontroversial — Gen 11:4, Jer 50-51, and Rev 17-18 are all missing.

**Door, gate** [WEAK] — Compatible with the consensus access/entrance sense but re-cast into the book's system: the door is the destination of 'the way,' the entrance to God's house, marked on the posts (an Exodus 12 / Deut 6:9 allusion). Refs are empty and the marked-posts linkage is a specific claim, so nothing carries it; John 10:9, Exod 12:7, and Deut 6:9 are missing.

**New name** [WEAK] — Consensus reads a divinely conferred new identity marking covenantal change; the book sharpens this to the renewed covenant itself, inheriting its name = covenant equation. Rev 2:17 alone carries only the 'known by the receiver' clause — nothing in the ref establishes the covenant identification, and the standard renaming texts (Gen 17, Gen 32:28, Isa 62:2) are absent.

**Rock** [WEAK] — Accepts the consensus rock = Christ/foundation but deepens the referent to the covenant itself, with Christ as 'the covenant in person' — a unifying step mainstream sources do not take, though not a contradiction of them. Neither cited verse (1 Cor 10:4; Ps 118:22) mentions covenant; the case needs a text tying rock/stone to covenant (e.g., Deut 4:13 tablets of stone; Isa 42:6).

**Stone (cut without hands)** [WEAK] — Keeps the universal kingdom-that-fills-the-earth reading but layers on a distinctive claim: the cutting of the stone is the cutting (karat) of a covenant. The cited refs cannot carry that layer for a skeptic — Dan 2:35/45 say nothing of covenant, the passage is Aramaic and its verb is gzr (itgezeret), not karat, and no covenant-cutting text (e.g., Gen 15:18) is cited; only the uncontested kingdom half survives lookup.


## MATCH (33)

**Bramble (thorns, thistles, briers)** [STRONG] — Essentially the consensus reading: curse-crop, worldly cares choking the word, fruitless people ending in fire. The five refs hit every clause — Gen 3:18 (curse), Matt 13:22 (explicit cares/riches decode), Judg 9:15 (false shadow), 2 Sam 23:6-7 and Heb 6:8 (burned).

**Chaff** [STRONG] — Identical to the consensus (weightless wicked, winnowed and burned, versus gathered grain), with a useful precision distinguishing chaff from tares. Ps 1:4 and Matt 3:12 are the two canonical proof texts and are self-interpreting.

**Fear of the LORD** [STRONG] — Essentially the consensus definition verbatim: reverent awe expressed in keeping the commandments. Eccl 12:13 is the canonical proof text and carries it; only the minor 'departing from evil' clause (Job 28:28, Prov 3:7) lacks a citation, and it is uncontroversial.

**Fig leaves** [STRONG] — Mirrors the consensus exactly: self-made covering for sin plus the fruitless leafy fig tree as show without substance. Both anchor texts (Gen 3:7; Matt 21:19) are cited and carry the reading; only the traditional Gen 3:21 contrast with God-provided garments goes uncited.

**Fish** [STRONG] — Book and consensus agree: fish are people gathered as the catch of the fishers of men. Hab 1:14 ('make men as the fishes of the sea') plus Matt 4:19 and 13:47-48 carry the definition directly.

**Fornication, whoredom** [STRONG] — This is the consensus spiritual-adultery equation stated plainly. Ex 34:15-16, Hos 1:2, Jer 3:9, and Rev 17:2 all explicitly use whoredom for covenant unfaithfulness toward God.

**Garment** [STRONG] — States the positive core of the consensus reading. Rev 19:8 is an explicit in-text decode ('the fine linen is the righteous acts of the saints'), so the single ref fully carries it.

**Grafting (grafted in)** [STRONG] — Identical to the consensus reading of Gentile incorporation into the covenant tree. Rom 11:17 is the sole biblical passage and states it directly.

**Harvest** [STRONG] — Book restates the consensus core: end-of-age reaping of mankind, wheat gathered, chaff burned (only the secondary missionary-harvest sense is omitted). Matt 13:39 says verbatim 'the harvest is the end of the world,' and Joel 3:13 supplies the judgment-reaping image, so the refs carry the definition outright.

**Highway** [STRONG] — 'The way of holiness — the prepared road home' is essentially a quotation of the consensus reading (prepared way of return/redemption). Isa 35:8 states 'an highway... called The way of holiness,' with vv. 9-10 adding the ransomed returning, so the one ref carries the whole definition.

**Image of metals (gold, silver, brass, clay)** [STRONG] — Identical to the universal reading: successive gentile world-kingdoms shattered by God's stone-kingdom. Dan 2:32-45 contains Daniel's own interpretation ('thou art this head of gold... in the days of these kings shall the God of heaven set up a kingdom'), which is self-certifying.

**Knowing, to know** [STRONG] — Agrees with the broad consensus that yada/ginosko is intimate covenant knowledge (including the marital euphemism), with obedience as its proof — which the consensus already includes as 'practicing covenant loyalty.' Gen 4:1 gives the marital sense, Matt 7:23 ties 'I never knew you' to workers of iniquity, and 1 John 2:3-4 states the proven-by-obedience test verbatim.

**Marriage, bride** [STRONG] — Squarely the consensus reading — covenant union of God/Christ with His people — with the name-and-wing details as added color. Refs hit the pillars: Gen 2:24 with Eph 5:31-32 (one flesh applied to Christ and church), Ezek 16:8 (covenant marriage under the wing), Rev 19:7 (the wedding).

**Milk** [STRONG] — Identical to the consensus: elementary first teaching for babes. Heb 5:12-13 states it explicitly and Isa 28:9 ('them that are weaned from the milk') gives an OT witness to the same figure.

**Mountain** [STRONG] — 'A kingdom — the seat of ruling authority' is exactly the consensus reading. Jer 51:25 (Babylon the destroying mountain) and Dan 2:35 (the stone that becomes a mountain, interpreted as a kingdom in context) are the two classic proof texts.

**Olive, vine, fig** [STRONG] — 'Israel, the covenant people' is the standard identification. Jer 11:16 names Israel a green olive tree outright, and Hos 9:10 covers both grapes/vine and firstripe fig as Israel's fathers, so the two refs span all three trees.

**Poor, meek** [STRONG] — This is precisely the mainstream anawim reading — the bowed-humble, dependent faithful who inherit the kingdom — including the one-Hebrew-word-family point. The paired refs (Ps 37:11/Matt 5:5; Isa 61:1/Luke 4:18) demonstrate that single word family rendered both 'poor' and 'meek,' with Isa 66:2 and Jas 2:5 sealing the heirs-of-the-kingdom claim.

**Seal (mark in the forehead)** [STRONG] — Ownership plus protection-before-judgment is exactly the consensus reading, with 'covenant' as the book's flavoring. Rev 7:3 (sealing God's servants before the earth is harmed) and Rev 14:1 (the Father's name in their foreheads) carry it directly.

**Seed** [STRONG] — Adopts one of the two standard senses — the word of God sown in hearts — via the Bible's own explicit decoding (Luke 8:11), which fully carries the definition as stated. The consensus's other major sense (offspring/the messianic line, Gen 3:15; Gal 3:16) is simply omitted, not contradicted.

**Sheep** [STRONG] — God's people who hear and follow the Shepherd is the uncontested consensus, with 'covenant' as house style. The single citation, John 10:27, states the definition almost word for word.

**Sin** [STRONG] — The book's definition is a direct quotation of 1 John 3:4 and sits within the consensus literal reading (transgression of God's law); neither side treats the word as a coded symbol. Rom 4:15, 3:20, and 7:7 carry the law-as-measure emphasis verbatim, though the book's law-only framing narrows the broader lexical range (missing-the-mark, rebellion).

**South** [STRONG] — The book, like the consensus, treats south geographically/referentially and gathers the same scattered figurative touches (south whirlwind, king of the South = Egypt, regathering from the four quarters) without staking a hidden symbolic sense. Every clause is carried nearly verbatim by the cited refs — Job 37:9, Dan 11:5-8 (v8 itself names Egypt), Isa 43:5-6.

**Tares (darnel)** [STRONG] — Identical to consensus — counterfeit children of the wicked one sown by the enemy, indistinguishable until the harvest burning — with a minor sharpening that tares are distinct from chaff. Matt 13:25-30, 38-40 is Jesus' own interpretation, so the refs carry it completely.

**Tzitzit** [STRONG] — Identical to the consensus memory-symbol reading, which Num 15:38-39 states in so many words ('that ye may look upon it, and remember all the commandments'); the cited text carries the definition entirely.

**Understanding** [STRONG] — No symbolic consensus exists, and the book likewise stays literal: discernment of good from evil gained by obedience — the same reading (and the same verses) the mainstream basis cites. Job 28:28 and Ps 111:10 carry the definition verbatim.

**Way (the way)** [STRONG] — 'Covenant conduct — the walk' is the standard derek/hodos reading (course of life one walks in). Jer 6:16 ('ask for the old paths... the good way, and walk therein') and Matt 7:14 carry it directly; the def omits Jesus-as-the-way but does not contradict it (John 14:6 appears under the book's Life entry).

**Wheat** [STRONG] — Identical to consensus: the children of the kingdom gathered into the barn at the judgment-harvest. Matt 13:38 is Jesus' own decoding of the parable and Matt 3:12 supplies the barn/chaff contrast — the strongest possible refs.

**Wise** [STRONG] — Exactly the consensus covenantal redefinition: the wise one fears God and hears-and-does his word. Matt 7:24 says this in so many words and Ps 111:10 supplies the fear-of-the-LORD anchor.

**Branches** [ADEQUATE] — Agrees with the consensus core (branches = members of a people in relation to the standing stock), though it omits the messianic 'Branch' title strand. Rom 11:17 alone directly carries the stated definition (members broken off or grafted in while the tree stands), but a single ref leaves OT support (Ezek 17, Isa 11) uncited.

**Living water** [ADEQUATE] — Essentially the consensus reading — Spirit and divine source of life — with 'word' added alongside Spirit as the book's characteristic extension. Jer 2:13 and John 7:38 are the consensus's own proof texts and carry the Spirit/fountain core, but no ref supports the 'word' component.

**Night** [ADEQUATE] — Time of darkness, hiddenness, sleep, and closed opportunity matches the consensus day/night polarity. 1 Thess 5:5-7 directly carries the sleeping/drunken children-of-night reading; the 'opportunity closes' clause echoes John 9:4, which is not cited.

**Sword** [ADEQUATE] — 'War and the word of judgment' names both consensus senses (divine judgment/war; word of God). Rev 6:4 carries the war/peace-taking clause and Gen 3:24 the flaming sword, but the word-of-God sense — half the definition — has no cited text (Eph 6:17, Heb 4:12, Rev 1:16/19:15 missing), though it is uncontroversial.

**Wind** [ADEQUATE] — Wind = ruach/Spirit is the textbook consensus, so the definition itself is uncontroversial. But the lone ref, Zech 6:5, shows the identity only if the reader compares translations (KJV 'four spirits of the heavens' vs. 'four winds'); John 3:8 or Ezek 37:9-14 would have made the case airtight on its own.

## Round 2 — after citation strengthening + over-fitting refinements (2026-07-04)

All 19 WEAK entries re-graded from citations alone (same rubric, same round-1
consensus), plus Cedar after its over-fitting refinement:

| term | before | after |
|---|---|---|
| Babel / Babylon | REFINED/WEAK | REFINED/STRONG |
| Barley | NOVEL/WEAK | NOVEL/STRONG |
| Door, gate | REFINED/WEAK | REFINED/ADEQUATE |
| Firmament (Heaven) | NOVEL/WEAK | NOVEL/ADEQUATE |
| Fruit | DIVERGENT/WEAK | REFINED/ADEQUATE |
| Gospel | NOVEL/WEAK | NOVEL/ADEQUATE |
| Heart of the earth | DIVERGENT/WEAK | DIVERGENT/WEAK |
| Island, isle | DIVERGENT/WEAK | DIVERGENT/ADEQUATE |
| Life (the life) | DIVERGENT/WEAK | DIVERGENT/ADEQUATE |
| Living creature | DIVERGENT/WEAK | DIVERGENT/ADEQUATE |
| Oil | DIVERGENT/WEAK | DIVERGENT/STRONG |
| Storm, tempest | DIVERGENT/WEAK | DIVERGENT/STRONG |
| Stone (cut without hands) | REFINED/WEAK | REFINED/STRONG |
| Rock | REFINED/WEAK | REFINED/ADEQUATE |
| Scarlet | DIVERGENT/WEAK | REFINED/ADEQUATE |
| New name | REFINED/WEAK | REFINED/WEAK |
| Pearl | DIVERGENT/WEAK | DIVERGENT/WEAK |
| Bow | DIVERGENT/WEAK | REFINED/STRONG |
| Elam | NOVEL/WEAK | NOVEL/ADEQUATE |
| Cedar | DIVERGENT/ADEQUATE | MATCH/STRONG |

17 of 20 upgraded, none downgraded. Over-fitting fixes: Bow's entry now
defines the unity (covenant + might, "what a people is strung together by")
instead of one face; Elam demoted from identity ("Babylon under another
name") to confederacy — chapter line softened likewise; Cedar redefined as
stature-not-identity (Ezek 17:22-24 Davidic cedar + Ps 92:12 added to the
Trees chapter). Intrinsic holdouts: Heart of the earth and Pearl rest on
wordplay/consonantal arguments no citation list can carry — their chapters
must do it (the graders can't see Strong's); New name upgraded refs to
Isa 62:2-5 (new name = married) after round 2. See memory:
symbolic-language-no-overfitting.

---

## Re-run 2026-07-06 — 135 terms (glossary expanded since first run)

Method identical: 3 blind consensus-proxy agents (bare term list, no
repo access, no lookups) → 3 independent graders (verdict rubric as
printed in the Introduction's table + fresh-eyes citation test against
kjv.json). Raw rows: /tmp/stats/{consensus,grades}-{1,2,3}.tsv (session
artifacts).

Verdicts over 135: **Match 49 (36%) · Refined 53 (39%) · Divergent 21
(16%) · Novel 12 (9%)** — printed table updated (was 28/43/12/16 over
~120). Movement: Match up 8 pts (several once-novel terms now read as
consensus-adjacent when the entry states the range plainly); Novel down
7 (the glossary's newer entries mostly sharpen known symbols rather
than stake bare claims); Divergent up 4 (Sun/Moon/Stars-family entries
now overtly contradict the devotional readings).

Citations: **Strong 80 (59%) · Partial 51 (38%) · Insufficient 4 (3%)**.
The four insufficient: Butter (chemah churned-word), Heart of the earth
(Ezek 5:5 argument), Pearl (consonantal poems), Wind (Zech 6:5 KJV
reads "spirits") — each rests on chapter-length work no citation list
carries; sentence to that effect kept in the Introduction.

Note: sym-virgin was re-graded REFINED after its same-day definition
sharpening (espoused standing / bride's companions / virgin of Israel —
see research-ten-virgins.md); the printed percentages include that.

---

## Delta run 2026-07-08 — 4 terms (glossary now 138)

Method identical: 3 blind consensus-proxy agents (bare terms only, no repo
access, no tools) → 3 independent graders (same rubric; fresh-eyes citation
test against kjv_strongs.txt). Terms: Fire and Sheol (added with Heaven and
Hell, unmeasured at the 135 run), Coin (new with ch. 10), and Seal
(re-graded after its 2026-07-08 enhancement — precedent: the virgin
re-grade above). Artifacts: /tmp/stats-delta/.

Verdicts (unanimous across all three graders):
- **Fire — REFINED** (STRONG ×2, PARTIAL): keeps the consensus triad but
  collapses the "two-sided fire" into one fire whose outcome is the
  covering; graders noted "never a chamber" outruns the citation list.
- **Sheol — REFINED** (STRONG ×2, PARTIAL): sides with the scholarly
  consensus (grave of all the dead, distinct from Gehenna) and sharpens it;
  the sha'al etymology and "gates and bars" ride uncited.
- **Seal — REFINED, was MATCH** (STRONG ×3): the old entry restated the
  consensus; the enhanced entry names the seal's content (the Name and the
  law at hand and eyes) — "every clause carried by a cited verse."
- **Coin — NOVEL** (PARTIAL ×3): all three proxies independently reported
  no settled consensus ("separate lessons, not one symbol"), so the unified
  person-as-minted-image reading stakes a claim. Both citation gaps the
  graders flagged (Ex 21:32 slave-damages; Mark 12:41-44 widow's living)
  were added to the entry's seeref after grading; the PARTIAL grade is kept
  as measured.

Totals over 138: **Match 48 (35%) · Refined 56 (41%) · Divergent 21 (15%) ·
Novel 13 (9%)**. Citations: Strong 82 (59%) · Partial 52 · Insufficient 4
(unchanged: Butter, Heart of the earth, Pearl, Wind). Printed table updated
to show raw counts beside shares (author's ruling 2026-07-08: the raw
totals drive home the number of unique readings — 34 of 138 divergent or
novel).

---

## Delta run 2026-07-08b — Almond added, Swine re-graded (glossary now 139)

Almond (new with the Fall of Babylon rod-serpent-rod section): 3 blind
proxies (all HIGH — watchfulness via shaqed/shoqed + Aaron's rod as
priesthood election/resurrection + menorah cups) → 3 graders unanimous
**MATCH / STRONG** — "the cited verses carry each claim nearly verbatim;
the shaqed/shaqad wordplay is visible in the Strong's tags."

Swine re-graded after headword expansion (pig, boar, sow) and the
hoof-without-cud mechanism enrichment: unanimous **REFINED / PARTIAL** —
verdict unchanged from the original run; all three graders accepted the
mechanism as "textually accurate to the law's list" and flagged only the
Rev 11:2 nation-identification as inferential from the citation list
alone (the chapter carries that argument; ch. 46).

Totals over 139: **Match 49 (35%) · Refined 56 (40%) · Divergent 21
(15%) · Novel 13 (9%)** (shares round to 99 — the Terms column is exact).
Citations: Strong 83 (60%) · Partial 52 · Insufficient 4 (unchanged).

---

## Delta run 2026-07-08c — Tail added; South removed (glossary now 139)

Tail (new, with the Fall of Babylon tail-chain): 3 blind proxies (all
HIGH — false prophet per Isa 9:15's own decode + Deut 28 rank) → 3
graders unanimous **REFINED / STRONG** ("Isa 9:15 states the definition
verbatim; the book sharpens with the Isa 9:16 led-destroyed mechanism
into Rev 12:4/9:19 and Ex 4:4"). Graders note the stars-as-saints
application rests on the separate Stars entry.

South REMOVED (author's directive on the not-yet-proven sweep): its own
research (research-directions.md) calls it the thinnest of the four
quarters, no chapter or study derives it, and no chapter links it. Its
prior verdict (MATCH) removed from the tallies.

Not-yet-proven sweep resolved: East and West now derive in print (the
Fall of Babylon's hindermost/qedem passage) — markers dropped, seerefs
repointed to ch. 33; Living water derives in Sea & Waters ch. 38 (and
research-river.md) — marker dropped; Lamb, Lion, Scarlet, Serpent,
Valley are derived in the digital edition's symbol studies
(_symbols/*.md) — markers replaced with "derived in the digital
edition's symbol study."

Totals over 139: **Match 48 (35%) · Refined 57 (41%) · Divergent 21
(15%) · Novel 13 (9%)**. Citations: Strong 84 · Partial 51 · 
Insufficient 4.

---

## Delta run 2026-07-08d — Gehenna, Hell, Sodom added (glossary now 142)

3 blind proxies (all HIGH on all three) → 3 graders; majority locked by
the first two (identical verdicts):
- **Gehenna — REFINED / STRONG**: consensus frame kept (Hinnom, final,
  distinct from Sheol) but sharpened to carcase-destruction rather than
  torment; "citations chain tightly — Mark 9 quotes Isa 66:24 verbatim."
- **Hell — DIVERGENT / PARTIAL**: the word-split note is standard, but
  the payload (Sheol the grave of all alike; Gehenna destruction; "the
  doctrine changes with the word beneath") contradicts the dominant
  eternal-conscious-punishment teaching. Badged, with the common view
  printed for comparison. The book's most contested single word now
  wears its own badge.
- **Sodom — REFINED / STRONG**: the prophetic Jerusalem application is
  an acknowledged consensus subpoint elevated to the definition;
  "Rev 11:8 literally says spiritually called Sodom... where also our
  Lord was crucified."

Totals over 142: **Match 48 (34%) · Refined 59 (42%) · Divergent 22
(15%) · Novel 13 (9%)** — 35 divergent+novel, all badged. Citations:
Strong 86 (61%) · Partial 52 · Insufficient 4.

---

## Delta run 2026-07-08e — Sabbath added (glossary now 143)

3 blind proxies (all HIGH — seventh-day rest, creation/Decalogue,
rest-in-Christ typology) → 3 graders unanimous **REFINED / STRONG**:
the entry keeps the seventh-day rest as "the crown of the unit" while
sharpening the referent to the complete six-and-one at every scale;
"Lev 25:8 equates seven sabbaths of years with 49 years — near
proof-grade"; the Greek (dis tou sabbatou; double sabbaton in Matt
28:1) verified character-for-character, with the KJV itself tagging
both Matt 28:1 occurrences G4521. Only Heb 4:9 graded ornamental.
Digital chapter: The Sabbath, ch. 31. TTT cited for the calendar
mechanics.

Also: 2 John 4-6 entered ch. 6's love section (author-supplied — love
decoded as commandment-walking, expressly "not new"), seconding both
the Love (novel) and Truth (divergent) entries; 2 John becomes the
64th book cited.

Totals over 143: **Match 48 (34%) · Refined 60 (42%) · Divergent 22
(15%) · Novel 13 (9%)**. Citations: Strong 87 (61%) · Partial 52 ·
Insufficient 4.
