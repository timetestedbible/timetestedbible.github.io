// "The Bible's Symbolic Language" — book chapter registry
// Single source of truth for chapter order, titles, and navigation.
// Chapters are authored in AsciiDoc (books/symbolic-language/*.adoc) and
// pre-rendered to HTML by Jekyll (jekyll-asciidoc) at build time.

const SYMBOLIC_LANGUAGE_BOOK = {
  slug: 'meat-bibles-symbolic-language',
  title: "MEAT The Bible's Symbolic Language",
  basePath: '/books/meat-bibles-symbolic-language',
  cover: '/assets/img/covers/meat-front-web.jpg',
  tagline: "The Bible's Symbolic Language",
  offer: {
    label: 'Pre-order Hardcover — $7',
    note: 'Offer ends August 7 · ships before September 1',
    price: '$7',
    was: '$49.49',
    href: '/preorder/',   // offer page; Stripe checkout links live there
    until: '2026-08-08T05:00:00Z'  // midnight Aug 8, America/Chicago
  },
  purchase: [
    { soon: 'Hardcover — August 1' }
  ],
  downloads: [
    { label: 'PDF', href: 'https://github.com/timetestedbible/timetestedbible.github.io/releases/download/digital-editions/meat-the-bibles-symbolic-language.pdf', track: 'meat', fmt: 'pdf' },
    { label: 'EPUB', href: 'https://github.com/timetestedbible/timetestedbible.github.io/releases/download/digital-editions/meat-the-bibles-symbolic-language.epub', track: 'meat', fmt: 'epub' }
  ],
  chapters: [
    {
      slug: 'how-to-use',
      title: 'How to Use This Book',
      summary: 'A few conventions for reading: symbols the Bible defines are set in a distinct style and collected in the Glossary; Scripture is quoted from the KJV unless noted; and in the free digital editions every symbol links to its glossary entry.'
    },
    {
      slug: 'introduction',
      title: 'Introduction',
      summary: 'Why Jesus concealed his teaching in parables, what milk and meat really mean, and how Scripture encodes an objective, translation-robust symbolic language anyone can now learn to decode.'
    },
    {
      slug: 'the-parables-of-the-kingdom',
      title: 'The Parables of the Kingdom',
      summary: 'The final exam — taken closed-book. Jesus was astonished His disciples could not decode the sower ("Know ye not this parable? and how then will ye know all parables?"), and the rebuke is only fair if the answers were already on the table. They were: the psalm He fulfills calls the parables "dark sayings of old… our fathers have told us," and the OT decodes its own parables in front of the reader — Nathan and David, Isaiah\'s vineyard, Ezekiel\'s eagles. So each of the seven parables of Matthew 13 is derived here from the Old Testament alone — Isaiah\'s seed, Jeremiah\'s fallow heart, Abram\'s fowls, the two seeds of Eden, the exalted low tree of Ezekiel 17, Torah\'s leaven, Sinai\'s treasure-people, the pearl hiding under the KJV\'s "rubies," Habakkuk\'s net — and only then graded against the Teacher\'s answer key. Every key He gave matches the derivation; where He gave none, the chapter marks where derivation ends and testing begins.'
    },
    {
      slug: 'signs-and-similitudes',
      title: 'Signs and Similitudes',
      summary: 'Before reading the sign Jesus chose, learn what a sign is: not a wonder on demand but a message given in advance — an oracle, or a prophet\'s lived story — whose fulfillment testifies. God says He "used similitudes"; Paul says the lives of real people are types; Jesus reads history as prophecy; and Ecclesiastes explains why: there is no new thing under the sun — what has been done will be done again. Isaac on Moriah and Joseph in Egypt prove the method before Jonah becomes the full case study.'
    },
    {
      slug: 'sign-of-jonah',
      title: 'The Sign of Jonah',
      summary: 'Read through the symbols of sea and city, the only sign Jesus gave opens up: the "heart of the earth" is Jerusalem, the great fish a devouring kingdom forced to give back what it swallowed, and Jonah is a scene-by-scene prophecy of His betrayal, arrest, interrogation, death, resurrection, and the gospel\'s turn to the nations.'
    },
    {
      slug: 'gospel',
      title: 'Gospel',
      summary: 'Everyone thinks they know what "gospel" means — the message about Jesus. But Scripture defines it as the gospel of the kingdom: the herald\'s cry that God reigns, the same good news preached to Abraham and at Sinai, the renewed covenant and the law of the kingdom — the Torah written on the heart and destined to go forth from Zion. It is the message Jesus taught, not merely the message about him.'
    },
    {
      slug: 'knowing-faith-love-and-belief',
      title: 'Knowing, Faith, Love, and Belief',
      summary: 'Four words the dictionary has emptied into inward, invisible states — knowledge as information, love as feeling, faith and belief as mental assent. Scripture defines all four as one thing: trusting obedience. Love is keeping commandments; to know God is to keep them; faith without works is dead; and "believeth not," in the Greek, is "obeyeth not."'
    },
    {
      slug: 'the-way-the-truth-and-the-life',
      title: 'The Way, The Truth, and The Life',
      summary: 'Jesus\' most-quoted line is three defined symbols in one: THE way is covenant-conduct, THE truth is God\'s law-standard, THE life is covenant-existence. Together they are the Torah — and the One who speaks them is the law embodied, the gospel of the last chapter said now in the first person.'
    },
    {
      slug: 'the-name',
      title: 'The Name',
      summary: 'Almost everyone thinks "taking the name in vain" is about cursing or mispronouncing YHWH. But Scripture equates the name with the covenant: to take it in vain is to empty that covenant — to claim God\'s name while living lawlessly. The name is the covenant owned, embodied in Jesus, kept by obedience — and most who say "Lord, Lord" take it in vain.'
    },
    {
      slug: 'marriage-and-divorce',
      title: 'Marriage and Divorce',
      summary: 'The common view says Jesus permits divorce for sexual immorality — but under the law, adultery carries death, not divorce, and Jesus uses two different Greek words in the same sentence. Scripture\'s own usage points to the union that is itself fornication — the out-of-covenant marriage — where putting away is commanded (Ezra), while putting away the wife of the covenant is treachery (Malachi holds both edges). And God keeps His own statute: He gave adulterous Israel the bill of divorce, faced His own no-return rule, and answered it at the cross — the Husband took the wife\'s death penalty and rose to marry her renewed. The Bible ends with a burning and a wedding.'
    },
    {
      slug: 'wings',
      title: 'Wings',
      summary: 'One Hebrew word — kanaph — is scattered across English as wing, skirt, border, corner, quarter, end, uttermost part, even "overspreading": 108 occurrences under eighteen renderings, and the thread is lost in the spread. It is the edge where God commanded the fringes bound, "that ye may remember all the commandments... and do them" — so wherever kanaph hides, the commandments are near. The ark of the covenant sits under the wings of the cherubim; the covenant is cut by spreading the wing; the kingdom tears when the skirt tears (Saul); the dispersed wait at the four corners of the earth; and there is healing in his wings.'
    },
    {
      slug: 'orphans-widows-and-the-fatherless',
      title: 'Orphans, Widows, and the Fatherless',
      summary: 'Everyone honors caring for widows and orphans — even the godless do — and assumes himself a giver, never one of them. But Scripture turns it: the covenant people, cut off from their Husband, are themselves the widow and the fatherless (Lamentations 5:3). God defends, feeds, and gathers them home — and the food is His word, the clothing His righteousness, multiplied like five loaves and two fishes. The stranger is no mere foreigner but the one outside the covenant, drawn in at the field edge. And the poor — the fourth name at the same corner — are the bowed-humble heirs of the kingdom, set against the self-made rich who have need of nothing.'
    },
    {
      slug: 'the-remnant',
      title: 'The Remnant',
      summary: 'Lord, are there few that be saved? Scripture answers with numbers, not moods. One anchor census — Elijah\'s seven thousand out of a kingdom of a million, ratified by Paul as the standing pattern — then a dozen independent witnesses: Jeremiah\'s one-of-a-city, the olive tree\'s two or three berries, the gleaning law\'s own geometry, gold\'s grade in the rock, Solomon\'s one-in-a-thousand count, the lion among the beasts, Job\'s four lone messengers. Every line converges on the same fraction of one percent. And the four Hebrew words for remnant say what arithmetic cannot: the living flesh, the excellence, the one who slips through the needle\'s puncture, the escaped portion.'
    },
    {
      slug: 'shadow',
      title: 'Shadow',
      summary: 'A prime example of a symbol read backwards: shadow calls up gloom, but in Scripture\'s own usage the shadow is the covering of a greater presence — the shadow of the Almighty, of His wings, of a kingdom\'s tree over its peoples — and the KJV itself twice renders the word "defence." Even the law is a shadow of GOOD things, and the shadow of death is walked through, turned into morning. It is good to be in the shadow.'
    },
    {
      slug: 'justice-and-judgment',
      title: 'Justice and Judgment',
      summary: '"Judgment" lands on modern ears as condemnation and "justice" as an abstraction — but Scripture commands both as deeds. The Hebrew behind "justice" is the righteousness-word: one word, two renderings (Genesis 18:19 / Jeremiah 22:3), and righteousness is already defined as the commandments done. Judgment (mishpat) is the law\'s ruling and the ruler\'s office — what God declares due, owed first to the widow, the fatherless, the stranger, and the poor; to judge is to rule and deliver by the law, which is why the judges were saviours, the righteous pray for judgment, and creation rejoices at its coming. The first "way of the LORD" in Scripture is defined as doing exactly this.'
    },
    {
      slug: 'liberty',
      title: 'Liberty',
      summary: 'The Hebrew word for liberty appears seven times, and every one is the jubilee: the King\'s decreed release of debts, slaves, and land — the proclamation Jesus claimed at Nazareth. The same word names the swallow, the free bird that nests at God\'s altars. Freedom in Scripture is a change of masters, not an absence of one; its constitution is "the perfect law of liberty," and its counterfeit — liberty as license — is called a return to bondage.'
    },
    {
      slug: 'the-fool-and-the-wise',
      title: 'The Fool and the Wise',
      summary: 'Calling a man a fool risks hell-fire (Matthew 5:22), so let Scripture define it: a fool is not the dull man but the one who hears God\'s word and will not do it; the wise hears and does. This opens the ten virgins — the oil is not the Holy Spirit (which cannot be bought, Acts 8:20) but the pressed, proven works of obedience that alone make the lamp give light.'
    },
    {
      slug: 'light-and-darkness',
      title: 'Light and Darkness, Day and Night',
      summary: 'Light is not vague truth but the law lived where men can see it — "the commandment is a lamp; and the law is light" (Proverbs 6:23); "let your light so shine... that they may see your good works." Darkness is not ignorance but concealed disobedience. They are the same division as the day and the night (Genesis 1:5): the children of light are the children of the day — awake, sober, working while it is day. Garment, oil, and light converge in the one cast into outer darkness.'
    },
    {
      slug: 'worship',
      title: 'Worship',
      summary: 'A word compressed to "sing songs in church" — but Scripture separates worship from singing inside single scenes: Judah fell down worshipping while the Levites stood up to praise. The word means to bow down; its fixed pair is to serve; Jesus quotes "thou shalt fear the LORD" as "thou shalt worship the Lord." Vain worship is homage shaped by the commandments of men, and the everlasting gospel\'s call to "worship him that made heaven, and earth, the sea" quotes the sabbath commandment\'s own ground clause.'
    },
    {
      slug: 'the-fear-of-the-lord',
      title: 'The Fear of the Lord',
      summary: 'The closing chapter of the doctrine studies. The fear of the LORD is neither raw terror nor a reverence that asks nothing; Scripture defines it as keeping the commandments and departing from evil — "Fear God, and keep his commandments: for this is the whole duty of man" (Ecclesiastes 12:13). It is the beginning of wisdom and the root beneath every symbol in this book. Its counterfeit is the fear of man — the snare that breaks the very commandments the fear of God keeps (Proverbs 29:25).'
    },
    {
      slug: 'what-is-the-point',
      title: 'What Is the Point?',
      summary: 'The prophets wrote in consonants; the vowel points were added by the Masoretes a thousand years and more after Malachi. Jesus pledged the preservation of the law to the jot and the tittle — parts of letters (Matthew 5:18) — and the oldest witnesses, the Dead Sea Scrolls and the Greek translation the apostles quote as Scripture, read the bare letters: Hebrews 10:5 puts the older Greek reading of Psalm 40 in the Messiah\'s own mouth. The points are the most careful commentary ever kept, and still a commentary — a tradition of men to be weighed against the letters, never seated as their judge.'
    },
    {
      slug: 'spoken-once-heard-twice',
      title: 'Spoken Once, Heard Twice',
      summary: 'God\'s first lesson to the young Jeremiah is a pun — the almond rod (shaqed) means "I am watching" (shoqed) — and He decodes it Himself (Jeremiah 1:11-12). "God hath spoken once; twice have I heard this" (Psalm 62:11): where the letters carry two readings, both are meant. Isaiah\'s vineyard verdict rhymes judgment into its crime (Isaiah 5:7); the strange-woman warnings of Proverbs 6 walk on the letters woman and fire share; and the same wordplay that fixed verses in a hearer\'s memory binds symbol to symbol — a second dimension of meaning that survives only in the consonants.'
    },
    {
      slug: 'noah-uncovered',
      title: 'Noah Uncovered',
      summary: 'Genesis 8:13 is a ship\'s log — a date, a dried earth, a covering removed. Remove the vowel points instead, and the same consonants sustain a second reading from first word to last: at the completeness of six seals of the age, the peoples desolated from above, the righteous of the Sabbath\'s ages taken up with the covering of the covenant — the sixth seal of Revelation, written into the flood account two and a half millennia before John saw it. One pun is wit; twelve consecutive words that read as plain history and the end of the age at once is the fingerprint.'
    },
    {
      slug: 'behold-the-hand',
      title: 'Behold the Hand, Behold the Nail',
      summary: 'Before the square letters of Babylon, Hebrew was written in pictures — and the letter names survive as Bible words: yod is the hand, he is the word behold, and vav, the peg, appears in Scripture only as the tabernacle\'s hooks. Spell the Name in its oldest pictures and it reads: behold the hand, behold the nail. A picture proves nothing by itself — the pictures may illustrate what the verses prove, never prove what the verses do not — but here the prophets say the same sentence: "they shall look upon me whom they have pierced" (Zechariah 12:10, the Name-bearer speaking of Himself), and the risen Lord to Thomas: "behold my hands" (John 20:27).'
    },
    {
      slug: 'sun-moon-and-stars',
      title: 'Sun, Moon, and Stars',
      summary: 'The lights of heaven, read as persons. Joseph\'s dream sets the pattern, and each light tells what it is: the sun is the Father, the source of light (Psalm 84:11); the moon, which has no light of its own but the sun\'s reflected, is the faithful witness who bears that light through the world\'s night — the Son (Psalm 89:37; Revelation 1:5; John 1:5); the stars are the righteous, who rule the night with Him (Daniel 12:3); and the twelve stars are the twelve tribes (Revelation 12:1). Satan\'s counterfeit inverts the order — a dark moon raised over God\'s stars to usurp the appointed times (Isaiah 14).'
    },
    {
      slug: 'lucifers-declared-plan',
      title: "Lucifer's Declared Plan",
      summary: 'The counterfeit of the celestial order, read from the enemy\'s own filing. On the unpointed consonants of Isaiah 14, the five "I wills" are not five ways of wanting to be God but one astronomical act: the "throne" (kisse) he exalts is spelled letter for letter as the full moon (keseh, Proverbs 7:20); the "mount of the congregation" is har moed — authority over the appointed times; the "sides of the north" (tsaphon — Strong\'s: "properly, hidden, i.e. dark") are the uttermost recesses of the darkness, the invisible dark conjunction; and "I will be like the most High" shares its consonants with "I will silence the Highest" — the sun eclipsed, at the height of the thick covering. The shining one is the son of the dark before dawn, raising a lightless moon over the stars of God to change times and laws (Daniel 7:25) — and he is promised the recesses he chose: the sides of the pit.'
    },
    {
      slug: 'the-pearl',
      title: 'The Pearls of Wisdom',
      summary: 'The office the enemy set his heart to seize has a symbol, and it is a pearl. The OT\'s pearls hide under the KJV\'s "rubies" — peninim, Strong\'s "probably a pearl (as round)": wisdom is more precious than pearls, and the virtuous bride\'s price is far above them. And the night sky keeps one fulness: keseh, the full moon, the letters under "throne" and "time appointed" (Psalm 81:3; Proverbs 7:20) — the one complete light, appointed to govern the moedim, entering by the east gate that Ezekiel says opens on the day of the new moon. Beside the city whose every gate is "of one pearl," the merchant\'s purchase comes into focus: one pearl, one gate — entry at the King\'s appointed time of meeting. The full calendar case is the work of Time Tested Tradition; this chapter establishes the symbol.'
    },
    {
      slug: 'time-tested-tradition',
      title: 'Time Tested Tradition',
      summary: 'The companion volume introduced: Time Tested Tradition — The Renewed Biblical Calendar tests the inherited calendars against every anchor the record affords. With 99.9% certainty the cross fell in AD 32 (Josephus, Philo, Scripture, stone-etched eclipses); no known weekly sabbath aligns with Saturday on the known dates, and the year of the cross puts a Monday crucifixion — impossible for rising on the third day. All the receipts, presented for the reader to judge; the sabbaths emerge as a sign and a moed governed by the moon — the full moon. Free at TimeTested.Bible.'
    },
    {
      slug: 'the-four-winds',
      title: 'The Four Winds',
      summary: 'Wind, in Hebrew, is spirit (ruach). The four winds are the four spirits of heaven (Zechariah 6:5) — God\'s executing agents, shown in the New Testament as the four horsemen. They stir the nations, scatter and gather peoples, raise the dead, and are held or loosed at the throne\'s command.'
    },
    {
      slug: 'the-fall-of-babylon',
      title: 'The Fall of Babylon',
      summary: 'The Exodus is not only history; it is the similitude of the end. The plagues replay in the vials, "let my people go" returns as "come out of her, my people," and the spoilers gather in the north — tsaphon, the hidden quarter, the root that means to lurk: the ambush comes by the door Babylon cannot watch. The pursuer sinks like a stone in both stories — Jeremiah\'s scroll bound to a stone in Euphrates, Revelation\'s millstone hurled into the sea — and the verdict is not the going down but the not-rising: Babylon "shall not rise"; Jonah, the Messiah, and the baptized come up. And the great city is given her street address in the book\'s own grammar: "spiritually called Sodom and Egypt, where also our Lord was crucified" — Sodom for her sin, Egypt for her bondage, Babylon for her boast — three spiritual names on one gate, and the gate is Jerusalem\'s.'
    },
    {
      slug: 'daniel-unsealed',
      title: 'Daniel Unsealed',
      summary: 'Daniel was commanded to seal the book to the time of the end — and a seal implies an unsealing. Jeremiah\'s seventy years failed as a literal count (Babylon fell without a fight; the captives came home after sixty), and unpointed Daniel 9:24 opens with the same word twice — seventy seventy: seventy jubilees. The ninth chapter\'s two decrees, four hundred ninety years from each rebuilding of Jerusalem, and the twelfth chapter\'s past-tense "the daily was taken away" with its 1,290 and 1,335 year-days, read straight through history — Messiah cut a covenant and vanished (karath, v\'ain — the Enoch idiom), the abomination set up in the holy place on schedule, and the counts closing together at the end of the times. The seal was never wax; it is the reading tradition laid over the letters.'
    },
    {
      slug: 'clouds',
      title: 'Clouds',
      summary: 'A cloud in Scripture is scarcely ever weather — it is a vehicle ("who maketh the clouds his chariot"), and its cargo is water. The LORD rides a swift cloud into Egypt; the pillar leads Israel, maneuvers between the camps, and its lifting is the marching order; a cloud receives Him at the ascension and He returns in like manner; the two witnesses ascend in one; the disciples fear as they enter one. And the water is defined: "my doctrine shall drop as the rain" — the former and latter rains frame the age between them, the judged vineyard has its clouds commanded to withhold, and Amos calls the drought a famine of hearing the words of the LORD. The counterfeit is the cloud without water, carried about of winds; the faithful, risen from the sea of peoples, are themselves the cloud of witnesses, caught up to meet the Lord in the air.'
    },
    {
      slug: 'the-moment',
      title: 'The Moment',
      summary: 'Babylon boasts, "I sit a queen, and am no widow" — and Scripture answers with a single word: in a MOMENT the loss of children and widowhood shall come upon her, in one day. The Hebrew is built on the image of an eye\'s wink, and the same picture crosses into the Greek: "in a moment, in the twinkling of an eye." It is the word of Babylon\'s fall, of Korah\'s swallowing, of the last trumpet, and of God\'s own anger toward His people — never long, and never slow. Judgment does not creep; it blinks.'
    },
    {
      slug: 'path-to-salvation',
      title: 'The Path to Salvation',
      summary: 'Borrowed from Time Tested Tradition. Keeping the commandments is not a works-based salvation, yet willful, unrepentant lawbreaking condemns. Salvation comes by confessing Jesus as Lord and the law as good — and the familiar three-step path cannot even be taken without the law that defines sin, the High Priest it establishes, and the obedience that calling Him Master requires.'
    },
    {
      slug: 'mountain',
      title: 'Mountain',
      summary: 'Scripture defines the mountain as a kingdom — Revelation, Daniel, Isaiah, and Jeremiah agree — and that one key unlocks dozens of passages, from the burning mountain cast into the sea to the command to flee to the mountains.'
    },
    {
      slug: 'sea-and-waters',
      title: 'Sea & Waters',
      summary: 'If mountains are kingdoms, the sea is the peoples they rise from and rule over. Revelation 17 defines both, and the key unlocks the beasts from the sea, the flood that is an invading army, the two waters of creation (nations below, the sea of glass above), and the "no more sea" of the new creation.'
    },
    {
      slug: 'the-ship',
      title: 'The Ship',
      summary: 'A ship is an earthly kingdom or state riding upon the sea of peoples. Ezekiel builds Tyre as one vessel—rulers at the helm, inhabitants as crew, armies aboard, and commerce as cargo—then distinguishes the broken polity from the people it carried. Christ needs no constructed state beneath Him: He walks upon the sea directly, and a vessel carrying His disciples comes under its true Head.'
    },
    {
      slug: 'tower',
      title: 'The Tower',
      summary: 'A tower is the stronghold raised by a Name around its house: refuge, watchtower, and beacon. The LORD\'s Name protects and guides; Babel raises a counterfeit Name and loses its common word; an unfinished tower is a discipleship begun without depth; and a fallen tower is a covenant stronghold broken or judged.'
    },
    {
      slug: 'trees',
      title: 'Trees',
      summary: 'A tree in Scripture is a nation or people group — rooted in its origin, sheltering those within it, judged by its fruit, and cut down in judgment ("It is thou, O king," Daniel says of Babylon). The tree completes the picture: mountain (kingdom) over tree (nation) over grass (the individual). Its wild companion is the beast — the nations as ravening kingdoms (Daniel\'s four beasts) and the unclean animals God cleanses to bring in the Gentiles (Peter\'s vision).'
    },
    {
      slug: 'grass',
      title: 'Grass',
      summary: 'Grass is a man — a single mortal, here in the morning and cut down by evening ("all flesh is grass," Isaiah 40). It is the lowest of the three figures — mountain (kingdom) over tree (nation) over grass (the individual). But grain is grass too: the seed is God\'s word, the harvest is the end of the age, the wheat the children of the kingdom and the chaff the wicked, the firstfruits sheaf Christ. Every piece was defined in the Law and the Prophets — so the harvest parables asked no new vocabulary of anyone who knew his Scripture.'
    },
    {
      slug: 'garments',
      title: 'Garments & Armor',
      summary: 'A garment is righteousness — "the fine linen is the righteous acts of the saints" (Revelation 19:8, ASV), the covenant covering worn as righteous deeds. The man cast from the wedding feast had none. The acts are clean; sin only stains the cloth — so the garment is washed, not cast off, and kept by keeping the commandments. To be without it is to be naked — the covenant stripped, the shame seen.'
    },
    {
      slug: 'the-bow',
      title: 'The Bow',
      summary: 'The rainbow is a bow — a weapon laid down. The Hebrew qesheth is one word for the warrior\'s bow, the covenant token of Genesis 9, and a binding bond. So the bow is the covenant that binds a people: Babel forged its own ("make us a name, lest we be scattered"), and God breaks such bows — of Elam, of Babylon — scattering the kingdom strung against Him.'
    },
    {
      slug: 'jacob-israel-and-ephraim',
      title: 'Jacob, Israel, and Ephraim',
      summary: 'Jacob — the heel-grabbing supplanter — is the crooked human heart; Israel is the new name given to that same man for prevailing with God. The two names do not divide flesh from spirit; they tell one story, the crooked made straight. So Israel is covenant and character, not blood — "they are not all Israel, which are of Israel." And Ephraim, the firstborn whose seed becomes "a multitude of nations," is that people scattered into all the earth as fruit, and regathered into one.'
    },
    {
      slug: 'foreskin',
      title: 'The Foreskin',
      summary: 'Take away the foreskins of your heart, says Jeremiah — a symbol the reader is expected to know. Scripture decodes it out loud: what the circumcision made without hands removes is "the body of the sins of the flesh." The foreskin is the blocking flesh over a covenant member: the uncircumcised heart cannot be humbled or love, the uncircumcised ear cannot hearken, uncircumcised lips cannot be heard, and a young tree\'s fruit is orlah until the covenant year. Cut it away, or be cut off.'
    },
    {
      slug: 'the-anointing',
      title: 'The Anointing',
      summary: 'Anointing is an appointment before it is an experience: oil marks a person or thing as God\'s own for a stated office, while the Spirit supplies the power for the work. Priests, kings, prophets, the tabernacle, Cyrus, and Christ separate the mark, the appointment, the office, and its power.'
    },
    {
      slug: 'butter',
      title: 'Butter',
      summary: 'Very few would connect butter to sound doctrine — yet Scripture does. Butter is the word churned solid: the discernment diet ("butter and honey shall he eat, that he may know to refuse the evil, and choose the good"), the remnant\'s food, the wash of the walking feet ("I washed my steps with butter"). Faithful hands carried butter to David in the wilderness while the betrayer\'s words stayed "smoother than butter, but war was in his heart."'
    },
    {
      slug: 'the-other-white-meat',
      title: 'The Other White Meat',
      summary: 'The swine wears the outward sign of the clean and lacks the inward work: the hoof is parted, but the cud is never chewed. From the boar in the vineyard to the washed sow returning to the mire, it is Scripture\'s picture of the nation and the worshipper that present clean while remaining unclean.'
    },
    {
      slug: 'uncommon-sanctification-justification-and-cleanliness',
      title: 'Uncommon Sanctification, Justification, and Cleanliness',
      summary: 'A compact case study in turning received milk into tested meat. Cleansing removes defilement; sanctification takes what was common under a holy claim and appointed use; justification answers a charge with a judgment. Paul says washed, sanctified, and justified because the three operations are not synonyms.'
    },
    {
      slug: 'the-end-of-the-law',
      title: 'The End of the Law',
      summary: 'A defensive reading of Paul\'s disputed vocabulary: end as purpose, law named by its ruler, work distinguished from obedience, wages from duty, and the curse from the command. Christ is not where the law failed and stopped, but the right-living purpose toward which it points.'
    },
    {
      slug: 'glossary',
      title: 'Glossary of Symbols',
      summary: 'The whole vocabulary in one place: every symbol the book uses, each with its meaning, a defining verse, and the chapter that proves it.'
    },
  ]
};

// Helpers used by the reader to build navigation.
const SymbolicLanguageBook = {
  book: SYMBOLIC_LANGUAGE_BOOK,
  getChapter(slug) {
    return SYMBOLIC_LANGUAGE_BOOK.chapters.find(c => c.slug === slug) || null;
  },
  getIndex(slug) {
    return SYMBOLIC_LANGUAGE_BOOK.chapters.findIndex(c => c.slug === slug);
  },
  getPrevNext(slug) {
    const i = this.getIndex(slug);
    const ch = SYMBOLIC_LANGUAGE_BOOK.chapters;
    return {
      prev: i > 0 ? ch[i - 1] : null,
      next: i >= 0 && i < ch.length - 1 ? ch[i + 1] : null
    };
  },
  chapterPath(slug) {
    return `${SYMBOLIC_LANGUAGE_BOOK.basePath}/${slug}/`;
  }
};

if (typeof window !== 'undefined') {
  window.SYMBOLIC_LANGUAGE_BOOK = SYMBOLIC_LANGUAGE_BOOK;
  window.SymbolicLanguageBook = SymbolicLanguageBook;
  window.BOOKS_BY_SLUG = window.BOOKS_BY_SLUG || {};
  window.BOOKS_BY_SLUG['meat-bibles-symbolic-language'] = SymbolicLanguageBook;
  // Legacy alias: the book lived at /books/symbolic-language/ before the
  // title-bearing slug; old links resolve through the 404 SPA boot.
  window.BOOKS_BY_SLUG['symbolic-language'] = SymbolicLanguageBook;
  window.BOOK_SLUG_ALIASES = Object.assign(window.BOOK_SLUG_ALIASES || {}, { 'symbolic-language': 'meat-bibles-symbolic-language' });
}
