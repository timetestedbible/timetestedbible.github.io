// "The Bible's Symbolic Language" — book chapter registry
// Single source of truth for chapter order, titles, and navigation.
// Chapters are authored in AsciiDoc (books/symbolic-language/*.adoc) and
// pre-rendered to HTML by Jekyll (jekyll-asciidoc) at build time.

const SYMBOLIC_LANGUAGE_BOOK = {
  slug: 'meat-bibles-symbolic-language',
  title: "MEAT The Bible's Symbolic Language",
  basePath: '/books/meat-bibles-symbolic-language',
  cover: '/assets/img/covers/meat-front-web.webp',
  tagline: "The Bible's Symbolic Language",
  offer: {
    label: 'Pre-order Hardcover — $7',
    note: 'Offer ends August 7 · ships before September 1',
    price: '$7',
    was: '$49',
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
      slug: 'preface',
      title: 'Preface',
      summary: "How years of studies, articles, and videos led to a repeatable way of recovering the Bible's shared symbolic vocabulary—and why the book must introduce an interconnected language one word at a time. Closes with the book's few conventions: symbols and the Glossary, translations, the Scripture Index, and the free digital editions."
    },
    {
      part: "Part One \u2014 The Method",
      slug: 'introduction',
      num: 1,
      plate: '/assets/img/plates/meat-bibles-symbolic-language/01-five-loaves',
      title: 'Introduction',
      summary: 'Why Jesus concealed his teaching in parables, what milk and meat really mean, and how Scripture encodes an objective, translation-robust symbolic language anyone can now learn to decode.'
    },
    {
      slug: 'the-parables-of-the-kingdom',
      num: 2,
      plate: '/assets/img/plates/meat-bibles-symbolic-language/02-sower',
      title: 'The Parables of the Kingdom',
      summary: "The final exam, taken closed-book: the psalm Jesus fulfills calls the parables 'dark sayings of old,' and the OT decodes its own \u2014 Nathan, Isaiah's vineyard, Ezekiel's eagles. So all seven parables of Matthew 13 are derived from the Old Testament alone, then graded against the Teacher's answer key. Every key He gave matches."
    },
    {
      slug: 'signs-and-similitudes',
      num: 3,
      plate: '/assets/img/plates/meat-bibles-symbolic-language/03-moriah',
      title: 'Signs and Similitudes',
      summary: "Before reading the sign Jesus chose, learn what a sign is: not a wonder on demand but a message given in advance \u2014 an oracle, or a prophet's lived story \u2014 whose fulfillment testifies. God says He 'used similitudes'; Ecclesiastes explains why. Isaac on Moriah and Joseph in Egypt prove the method."
    },
    {
      slug: 'sign-of-jonah',
      num: 4,
      plate: '/assets/img/plates/meat-bibles-symbolic-language/04-jonah',
      title: 'The Sign of Jonah',
      summary: "Read through the symbols of sea and city, the only sign Jesus gave opens up: the heart of the earth is Jerusalem, the great fish a devouring kingdom forced to give back what it swallowed, and Jonah a scene-by-scene prophecy of His betrayal, death, resurrection, and the gospel's turn to the nations."
    },
    {
      part: "Part Two \u2014 The Doctrine",
      slug: 'gospel',
      num: 5,
      plate: '/assets/img/plates/meat-bibles-symbolic-language/05-herald',
      title: 'Gospel',
      summary: "Everyone thinks they know what 'gospel' means \u2014 the message about Jesus. But Scripture defines it as the gospel of the kingdom: the herald's cry that God reigns, the same good news preached to Abraham and at Sinai \u2014 the Torah written on the heart. It is the message Jesus taught, not merely the message about him."
    },
    {
      slug: 'knowing-faith-love-and-belief',
      num: 6,
      plate: '/assets/img/plates/meat-bibles-symbolic-language/06-cloak',
      title: 'Knowing, Faith, Love, and Belief',
      summary: "Four words the dictionary has emptied into inward, invisible states \u2014 knowledge as information, love as feeling, faith and belief as mental assent. Scripture defines all four as one thing: trusting obedience. Love is keeping commandments; to know God is to keep them; faith without works is dead; and 'believeth not,' in the Greek, is 'obeyeth not.'"
    },
    {
      slug: 'the-way-the-truth-and-the-life',
      num: 7,
      plate: '/assets/img/plates/meat-bibles-symbolic-language/07-narrow-path',
      title: 'The Way, The Truth, and The Life',
      summary: "Jesus' most-quoted line is three defined symbols in one: THE way is covenant-conduct, THE truth is God's law-standard, THE life is covenant-existence. Together they are the Torah \u2014 and the One who speaks them is the law embodied, the gospel of the last chapter said now in the first person."
    },
    {
      slug: 'the-name',
      num: 8,
      plate: '/assets/img/plates/meat-bibles-symbolic-language/08-ark-name',
      title: 'The Name',
      summary: "Almost everyone thinks 'taking the name in vain' is about cursing or mispronouncing YHWH. But Scripture equates the name with the covenant: to take it in vain is to claim God's name while living lawlessly. The name is the covenant owned, embodied in Jesus, kept by obedience \u2014 and most who say 'Lord, Lord' take it in vain."
    },
    {
      slug: 'marriage-and-divorce',
      num: 12,
      plate: '/assets/img/plates/meat-bibles-symbolic-language/12-hosea-silver',
      title: 'Marriage and Divorce',
      summary: "The common view says Jesus permits divorce for sexual immorality \u2014 but under the law, adultery carries death, not divorce. Scripture points to the union that is itself fornication \u2014 the out-of-covenant marriage \u2014 where putting away is commanded, while putting away the wife of the covenant is treachery. And God kept His own statute at the cross."
    },
    {
      slug: 'wings',
      num: 13,
      plate: '/assets/img/plates/meat-bibles-symbolic-language/13-hem',
      title: 'Wings',
      summary: "One Hebrew word \u2014 kanaph \u2014 is scattered across English as wing, skirt, border, corner, quarter, and end: 108 occurrences under eighteen renderings. It is the edge where God commanded the fringes bound, 'that ye may remember all the commandments' \u2014 so wherever kanaph hides, the commandments are near, and there is healing in his wings."
    },
    {
      slug: 'orphans-widows-and-the-fatherless',
      num: 14,
      plate: '/assets/img/plates/meat-bibles-symbolic-language/14-widow-door',
      title: 'Orphans, Widows, and the Fatherless',
      summary: "Everyone honors caring for widows and orphans and assumes himself the giver, never one of them. But Scripture turns it: the covenant people, cut off from their Husband, are themselves the widow and the fatherless \u2014 and God defends, feeds, and gathers them home, the food His word, the clothing His righteousness."
    },
    {
      slug: 'the-remnant',
      num: 15,
      plate: '/assets/img/plates/meat-bibles-symbolic-language/15-olive-gleanings',
      title: 'The Remnant',
      summary: "Lord, are there few that be saved? Scripture answers with numbers, not moods: Elijah's seven thousand out of a kingdom of a million, ratified by Paul as the standing pattern, then Jeremiah's one-of-a-city, the olive tree's two or three berries, the gleaning law's own geometry \u2014 a dozen witnesses converging on the same fraction of one percent."
    },
    {
      slug: 'shadow',
      num: 17,
      plate: '/assets/img/plates/meat-bibles-symbolic-language/17-shadow-rock',
      title: 'Shadow',
      summary: "A prime example of a symbol read backwards: shadow calls up gloom, but in Scripture's own usage the shadow is the covering of a greater presence \u2014 the shadow of the Almighty, of His wings, of a kingdom's tree \u2014 and the KJV itself twice renders the word 'defence.' Even the law is a shadow of GOOD things. It is good to be in the shadow."
    },
    {
      slug: 'justice-and-judgment',
      num: 18,
      plate: '/assets/img/plates/meat-bibles-symbolic-language/18-gate-judgment',
      title: 'Justice and Judgment',
      summary: "'Judgment' lands on modern ears as condemnation and 'justice' as an abstraction \u2014 but Scripture commands both as deeds. Justice is the righteousness-word: the commandments done. Judgment is the law's ruling and the ruler's office \u2014 owed first to the widow, the fatherless, the stranger, and the poor \u2014 which is why the judges were saviours and creation rejoices at its coming."
    },
    {
      slug: 'liberty',
      num: 19,
      plate: '/assets/img/plates/meat-bibles-symbolic-language/19-jubilee',
      title: 'Liberty',
      summary: "The Hebrew word for liberty appears seven times, and every one is the jubilee: the King's decreed release of debts, slaves, and land \u2014 the proclamation Jesus claimed at Nazareth. Freedom in Scripture is a change of masters, not an absence of one; its constitution is 'the perfect law of liberty,' and its counterfeit \u2014 license \u2014 is a return to bondage."
    },
    {
      slug: 'the-fool-and-the-wise',
      num: 20,
      plate: '/assets/img/plates/meat-bibles-symbolic-language/20-fool-and-wise',
      title: 'The Fool and the Wise',
      summary: "Calling a man a fool risks hell-fire, so let Scripture define it: a fool is not the dull man but the one who hears God's word and will not do it; the wise hears and does. This opens the ten virgins \u2014 the oil is not the Holy Spirit, which cannot be bought, but the pressed, proven works of obedience that make the lamp give light."
    },
    {
      slug: 'light-and-darkness',
      num: 21,
      plate: '/assets/img/plates/meat-bibles-symbolic-language/21-lamp-stand',
      title: 'Light and Darkness, Day and Night',
      summary: "Light is not vague truth but the law lived where men can see it \u2014 'the commandment is a lamp; and the law is light'; 'let your light so shine... that they may see your good works.' Darkness is not ignorance but concealed disobedience. They divide as the day and the night: the children of light are awake, sober, working while it is day."
    },
    {
      slug: 'worship',
      num: 22,
      plate: '/assets/img/plates/meat-bibles-symbolic-language/22-temple-worship',
      title: 'Worship',
      summary: "A word compressed to 'sing songs in church' \u2014 but Scripture separates worship from singing inside single scenes: Judah fell down worshipping while the Levites stood up to praise. The word means to bow down; its fixed pair is to serve. Vain worship is homage shaped by the commandments of men, and the everlasting gospel's call quotes the sabbath commandment's own ground clause."
    },
    {
      slug: 'the-fear-of-the-lord',
      num: 23,
      plate: '/assets/img/plates/meat-bibles-symbolic-language/23-sinai-fear',
      title: 'The Fear of the Lord',
      summary: "Neither raw terror nor a reverence that asks nothing: Scripture defines the fear of the LORD as keeping the commandments and departing from evil \u2014 'Fear God, and keep his commandments: for this is the whole duty of man.' It is the beginning of wisdom and the root beneath every symbol in this book; its counterfeit is the fear of man, the snare."
    },
    {
      slug: 'path-to-salvation',
      num: 24,
      plate: '/assets/img/plates/meat-bibles-symbolic-language/24-tabernacle-path',
      title: 'The Path to Salvation',
      summary: "Borrowed from Time Tested Tradition. Keeping the commandments is not a works-based salvation, yet willful, unrepentant lawbreaking condemns. Salvation comes by confessing Jesus as Lord and the law as good \u2014 and the familiar three-step path cannot even be taken without the law that defines sin, the High Priest it establishes, and the obedience that calling Him Master requires."
    },
    {
      slug: 'the-end-of-the-law',
      num: 25,
      plate: '/assets/img/plates/meat-bibles-symbolic-language/48x-end-of-the-law',
      title: 'The End of the Law',
      summary: 'A defensive reading of Paul\'s disputed vocabulary: end as purpose, law named by its ruler, work distinguished from obedience, wages from duty, and the curse from the command. Christ is not where the law failed and stopped, but the right-living purpose toward which it points.'
    },
    {
      part: "Part Three \u2014 The Point",
      slug: 'what-is-the-point',
      num: 26,
      plate: '/assets/img/plates/meat-bibles-symbolic-language/25-what-is-the-point',
      title: 'What Is the Point?',
      summary: "The prophets wrote in consonants; the vowel points were added by the Masoretes a thousand years after Malachi. Jesus pledged the law to the jot and the tittle \u2014 parts of letters \u2014 and the oldest witnesses, the Dead Sea Scrolls and the Greek the apostles quote, read the bare letters. The points are the most careful commentary ever kept \u2014 and still a commentary, never the letters' judge."
    },
    {
      slug: 'spoken-once-heard-twice',
      num: 27,
      plate: '/assets/img/plates/meat-bibles-symbolic-language/26-almond-rod',
      title: 'Spoken Once, Heard Twice',
      summary: "God's first lesson to the young Jeremiah is a pun He decodes Himself: the almond rod (shaqed) means 'I am watching' (shoqed). 'God hath spoken once; twice have I heard this' \u2014 where the letters carry two readings, both are meant. Isaiah rhymes judgment into its crime, and the same wordplay binds symbol to symbol in the consonants."
    },
    {
      slug: 'noah-uncovered',
      num: 28,
      plate: '/assets/img/plates/meat-bibles-symbolic-language/27-noah-uncovered',
      title: 'Noah Uncovered',
      summary: "Genesis 8:13 is a ship's log \u2014 a date, a dried earth, a covering removed. Remove the vowel points instead, and the same consonants sustain a second reading from first word to last: the sixth seal of Revelation, written into the flood account millennia before John saw it. One pun is wit; twelve consecutive words reading as history and the end of the age at once is the fingerprint."
    },
    {
      part: "Part Four \u2014 The Calendar",
      slug: 'sun-moon-and-stars',
      num: 29,
      plate: '/assets/img/plates/meat-bibles-symbolic-language/29-joseph-dream',
      title: 'Sun, Moon, and Stars',
      summary: "The lights of heaven, read as persons. Joseph's dream sets the pattern: the sun is the Father, the source of light; the moon, which has no light of its own, is the faithful witness who bears that light through the world's night \u2014 the Son; the stars are the righteous who rule the night with Him. Satan's counterfeit inverts the order."
    },
    {
      slug: 'lucifers-declared-plan',
      num: 30,
      plate: '/assets/img/plates/meat-bibles-symbolic-language/30-lucifer-moon',
      title: "Lucifer's Declared Plan",
      summary: "On the unpointed consonants of Isaiah 14, the five 'I wills' are one astronomical act: the 'throne' he exalts is spelled letter for letter as the full moon, the 'mount of the congregation' is authority over the appointed times, and 'I will be like the most High' shares its consonants with 'I will silence the Highest' \u2014 a lightless moon raised over the stars of God. He is promised the pit."
    },
    {
      slug: 'the-pearl',
      num: 31,
      plate: '/assets/img/plates/meat-bibles-symbolic-language/31-merchant-pearl',
      title: 'The Pearls of Wisdom',
      summary: "The office the enemy set his heart to seize has a symbol. The OT's pearls hide under the KJV's 'rubies' \u2014 and the night sky keeps one fulness: keseh, the full moon, the letters under 'throne' and 'time appointed.' Beside the city whose every gate is 'of one pearl,' the merchant's purchase comes into focus: one pearl, one gate \u2014 entry at the King's appointed time."
    },
    {
      slug: 'return-on-the-full-moon',
      num: 32,
      plate: '/assets/img/plates/meat-bibles-symbolic-language/33x-last-day-laughter',
      title: 'Return on the Full Moon',
      summary: "The prophets give the Day of the LORD a shape before anyone asks for its date: the Husband comes home at the full moon, the shofar sounds at that phase, the coming shines from east to west while evening remains light, and the whole moon becomes blood. The witnesses agree on the configuration while refusing the year and the day \u2014 and the full-moon bride's laughter at the last day needs no explaining."
    },
    {
      slug: 'clouds-of-heaven',
      num: 33,
      plate: '/assets/img/plates/meat-bibles-symbolic-language/33y-clouds-of-heaven',
      title: 'Clouds of Heaven',
      summary: "Genesis puts the covenant bow in the cloud. Psalms calls the clouds God's chariot; Isaiah says He rides one; Ezekiel opens the cloud and reveals cherubim, wheels, a throne, its Rider, and the bow. Psalm 89 compares that throne to the moon \u2014 its Hebrew consonants naming the full phase \u2014 and Revelation repeats the enthroned figure on a white cloud and a white horse."
    },
    {
      slug: 'the-sabbath',
      num: 34,
      plate: '/assets/img/plates/time-tested-tradition/09x-quails-came-up',
      title: 'The Sabbath',
      summary: "A sabbath can be complete (Leviticus 23:15) \u2014 and only a span can be complete or broken. Leviticus counts 'seven sabbaths' where Deuteronomy counts 'seven weeks': the word names the whole seven \u2014 six days of labor and one of rest as a single unit \u2014 which Scripture scales to years, to jubilees, and to the great week whose seventh millennium is the rest that remains."
    },
    {
      slug: 'time-tested-tradition',
      num: 35,
      plate: '/assets/img/plates/meat-bibles-symbolic-language/33-ttt-cover',
      title: 'Time Tested Tradition',
      summary: "The companion volume introduced: Time Tested Tradition tests the inherited calendars against every anchor the record affords. With 99.9% certainty the cross fell in AD 32 \u2014 and no known weekly sabbath aligns with Saturday on the known dates. All the receipts, presented for the reader to judge; the sabbaths emerge as a sign governed by the moon \u2014 the full moon. Free at TimeTested.Bible."
    },
    {
      part: "Part Five \u2014 The Prophecy",
      slug: 'the-four-winds',
      num: 36,
      plate: '/assets/img/plates/meat-bibles-symbolic-language/34-four-horsemen',
      title: 'The Four Winds',
      summary: "Wind, in Hebrew, is spirit (ruach). The four winds are the four spirits of heaven \u2014 God's executing agents, shown in the New Testament as the four horsemen. They stir the sea of nations, scatter and gather peoples, raise the dead, and are held or loosed at the throne's command."
    },
    {
      slug: 'the-fall-of-babylon',
      num: 37,
      plate: '/assets/img/plates/meat-bibles-symbolic-language/35-fall-of-babylon',
      title: 'The Fall of Babylon',
      summary: "The Exodus is not only history; it is the similitude of the end. The plagues replay in the vials, 'let my people go' returns as 'come out of her, my people,' and the pursuer sinks like a stone in both stories. And the great city is given her street address in the book's own grammar: Sodom for her sin, Egypt for her bondage, Babylon for her boast \u2014 and the gate is Jerusalem's."
    },
    {
      slug: 'daniel-unsealed',
      num: 38,
      plate: '/assets/img/plates/meat-bibles-symbolic-language/36-daniel-sealed',
      title: 'Daniel Unsealed',
      summary: "Daniel was commanded to seal the book to the time of the end \u2014 and a seal implies an unsealing. Unpointed Daniel 9:24 opens with the same word twice \u2014 seventy seventy: seventy jubilees \u2014 and the counts read straight through history, closing together at the end of the times. The seal was never wax; it is the reading tradition laid over the letters."
    },
    {
      part: "Part Six \u2014 Symbol Studies",
      slug: 'mountain',
      num: 39,
      plate: '/assets/img/plates/meat-bibles-symbolic-language/39-colossus-mountain',
      title: 'Mountain',
      summary: 'Scripture defines the mountain as a kingdom — Revelation, Daniel, Isaiah, and Jeremiah agree — and that one key unlocks dozens of passages, from the burning mountain cast into the sea to the command to flee to the mountains.'
    },
    {
      slug: 'sea-and-waters',
      num: 40,
      plate: '/assets/img/plates/meat-bibles-symbolic-language/40-peace-be-still',
      title: 'Sea & Waters',
      summary: "If mountains are kingdoms, the sea is the peoples they rise from and rule over. Revelation 17 defines both, and the key unlocks the beasts from the sea, the flood that is an invading army, the two waters of creation \u2014 nations below, the sea of glass above \u2014 and the 'no more sea' of the new creation."
    },
    {
      slug: 'the-ship',
      num: 41,
      plate: '/assets/img/plates/meat-bibles-symbolic-language/40s-ship-of-state',
      title: 'The Ship',
      summary: "A ship is an earthly kingdom or state riding upon the sea of peoples. Ezekiel builds Tyre as one vessel \u2014 rulers at the helm, inhabitants as crew, commerce as cargo \u2014 then distinguishes the broken polity from the people it carried. Christ needs no constructed state beneath Him: He walks upon the sea directly."
    },
    {
      slug: 'tower',
      num: 42,
      plate: '/assets/img/plates/meat-bibles-symbolic-language/08-strong-tower',
      title: 'The Tower',
      summary: "A tower is the stronghold raised by a Name around its house: refuge, watchtower, and beacon. The LORD's Name protects and guides; Babel raises a counterfeit Name and loses its common word; an unfinished tower is a discipleship begun without depth; and a fallen tower is a covenant stronghold broken or judged."
    },
    {
      slug: 'trees',
      num: 43,
      plate: '/assets/img/plates/meat-bibles-symbolic-language/41-kingdom-tree',
      title: 'Trees',
      summary: "A tree in Scripture is a nation or people group \u2014 rooted in its origin, sheltering those within it, judged by its fruit, and cut down in judgment ('It is thou, O king'). The tree completes the picture: mountain over tree over grass. Its wild companion is the beast \u2014 the nations as ravening kingdoms, and the unclean animals God cleanses to bring in the Gentiles."
    },
    {
      slug: 'grass',
      num: 44,
      plate: '/assets/img/plates/meat-bibles-symbolic-language/42-harvest-grass',
      title: 'Grass',
      summary: "Grass is a man \u2014 a single mortal, here in the morning and cut down by evening: 'all flesh is grass.' It is the lowest of the three figures \u2014 mountain, tree, grass. But grain is grass too: the seed is God's word, the harvest is the end of the age, the wheat the children of the kingdom, and the firstfruits sheaf is Christ."
    },
    {
      slug: 'garments',
      num: 45,
      plate: '/assets/img/plates/meat-bibles-symbolic-language/43-wedding-garment',
      title: 'Garments & Armor',
      summary: "A garment is righteousness \u2014 'the fine linen is the righteous acts of the saints,' the covenant covering worn as righteous deeds. The man cast from the wedding feast had none. The acts are clean; sin only stains the cloth \u2014 so the garment is washed, not cast off, and kept by keeping the commandments. To be without it is to be naked."
    },
    {
      slug: 'the-bow',
      num: 46,
      plate: '/assets/img/plates/meat-bibles-symbolic-language/44-covenant-bow',
      title: 'The Bow',
      summary: "The rainbow is a bow \u2014 a weapon laid down. The Hebrew qesheth is one word for the warrior's bow, the covenant token of Genesis 9, and a binding bond. So the bow is the covenant that binds a people: Babel forged its own, and God breaks such bows \u2014 of Elam, of Babylon \u2014 scattering the kingdom strung against Him."
    },
    {
      slug: 'jacob-israel-and-ephraim',
      num: 47,
      plate: '/assets/img/plates/meat-bibles-symbolic-language/45-jabbok',
      title: 'Jacob, Israel, and Ephraim',
      summary: "Jacob \u2014 the heel-grabbing supplanter \u2014 is the crooked human heart; Israel is the new name given to that same man for prevailing with God: one story, the crooked made straight. So Israel is covenant and character, not blood \u2014 'they are not all Israel, which are of Israel' \u2014 and Ephraim is that people scattered into all the earth as fruit, and regathered into one."
    },
    {
      slug: 'foreskin',
      num: 48,
      plate: '/assets/img/plates/meat-bibles-symbolic-language/46-orchard-keeper',
      title: 'The Foreskin',
      summary: "Take away the foreskins of your heart, says Jeremiah \u2014 and Scripture decodes the symbol out loud: what the circumcision made without hands removes is 'the body of the sins of the flesh.' The foreskin is the blocking flesh over a covenant member: the uncircumcised heart cannot love, the ear cannot hearken, the lips cannot be heard. Cut it away, or be cut off."
    },
    {
      slug: 'the-anointing',
      num: 49,
      plate: '/assets/img/plates/meat-bibles-symbolic-language/46x-horn-of-oil',
      title: 'The Anointing',
      summary: "Anointing is an appointment before it is an experience: oil marks a person or thing as God's own for a stated office, while the Spirit supplies the power for the work. Priests, kings, prophets, the tabernacle, Cyrus, and Christ separate the mark, the appointment, the office, and its power."
    },
    {
      slug: 'butter',
      num: 50,
      plate: '/assets/img/plates/meat-bibles-symbolic-language/47-butter-churn',
      title: 'Butter',
      summary: "Very few would connect butter to sound doctrine \u2014 yet Scripture does. Butter is the word churned solid: the discernment diet ('butter and honey shall he eat, that he may know to refuse the evil, and choose the good'), the remnant's food. Faithful hands carried butter to David while the betrayer's words stayed 'smoother than butter, but war was in his heart.'"
    },
    {
      slug: 'the-other-white-meat',
      num: 51,
      plate: '/assets/img/plates/meat-bibles-symbolic-language/48-prodigal-trough',
      title: 'The Other White Meat',
      summary: "The swine wears the outward sign of the clean and lacks the inward work: the hoof is parted, but the cud is never chewed. From the boar in the vineyard to the washed sow returning to the mire, it is Scripture's picture of the nation and the worshipper that present clean while remaining unclean."
    },
    {
      slug: 'uncommon-sanctification-justification-and-cleanliness',
      num: 52,
      plate: '/assets/img/plates/meat-bibles-symbolic-language/48w-washed-sanctified-justified',
      title: 'Uncommon Sanctification, Justification, and Cleanliness',
      summary: "A compact case study in turning received milk into tested meat. Cleansing removes defilement; sanctification takes what was common under a holy claim and appointed use; justification answers a charge with a judgment. Paul says washed, sanctified, and justified because the three operations are not synonyms."
    },
    {
      part: "Part Seven \u2014 Reference",
      slug: 'glossary',
      plate: '/assets/img/plates/meat-bibles-symbolic-language/49-glossary-symbols',
      title: 'Glossary of Symbols',
      summary: 'The whole vocabulary in one place: every symbol the book uses, each with its meaning, a defining verse, and the chapter that proves it.'
    },
    {
      bonus: true,
      slug: 'behold-the-hand',
      title: 'Behold the Hand, Behold the Nail',
      summary: "Before the square letters of Babylon, Hebrew was written in pictures \u2014 and the letter names survive as Bible words. Spell the Name in its oldest pictures and it reads: behold the hand, behold the nail. The pictures only illustrate what the prophets prove: 'they shall look upon me whom they have pierced,' and the risen Lord to Thomas \u2014 'behold my hands.'"
    },
    {
      bonus: true,
      slug: 'the-moment',
      title: 'The Moment',
      summary: "Babylon boasts, 'I sit a queen, and am no widow' \u2014 and Scripture answers with a single word: in a MOMENT the loss of children and widowhood shall come upon her, in one day. The Hebrew is built on the wink of an eye, and the Greek carries it: 'in a moment, in the twinkling of an eye.' Judgment does not creep; it blinks."
    },
    {
      bonus: true,
      slug: 'clouds',
      title: 'Clouds',
      summary: "A cloud in Scripture is scarcely ever weather \u2014 it is a vehicle ('who maketh the clouds his chariot'), and its cargo is water. And the water is defined: 'my doctrine shall drop as the rain.' The counterfeit is the cloud without water, carried about of winds; the faithful, risen from the sea of peoples, are themselves the cloud of witnesses, caught up to meet the Lord in the air."
    },
    {
      bonus: true,
      slug: "weeping-and-gnashing",
      title: "The Weeping and the Gnashing",
      summary: "Jesus never says 'weeping and gnashing of teeth' \u2014 He says THE weeping and THE gnashing: a definite, known scene. Luke states it: it happens when the excluded SEE the patriarchs in the kingdom and themselves thrust out. Psalm 112:10 wrote the scene first \u2014 and in every Hebrew occurrence, gnashing is what the wicked do at the righteous: rage, not pain."
    },
    {
      bonus: true,
      slug: "the-parable-of-the-vineyard",
      title: "The Parable of the Vineyard",
      summary: "Jesus answered the temple authorities with a vineyard every hearer knew \u2014 Isaiah had handed over the key: the vineyard is the house of Israel, the wall is salvation, the tower is what a Name builds. The husbandmen are 'the builders' \u2014 the priests perceived He spake of them \u2014 and the stone they rejected heads a corner of living stones."
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
