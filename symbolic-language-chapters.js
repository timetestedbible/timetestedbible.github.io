// "The Bible's Symbolic Language" — book chapter registry
// Single source of truth for chapter order, titles, and navigation.
// Chapters are authored in AsciiDoc (books/symbolic-language/*.adoc) and
// pre-rendered to HTML by Jekyll (jekyll-asciidoc) at build time.

const SYMBOLIC_LANGUAGE_BOOK = {
  slug: 'symbolic-language',
  title: "The Bible's Symbolic Language",
  basePath: '/books/symbolic-language',
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
      slug: 'the-bow',
      title: 'The Bow',
      summary: 'The rainbow is a bow — a weapon laid down. The Hebrew qesheth is one word for the warrior\'s bow, the covenant token of Genesis 9, and a binding bond. So the bow is the covenant that binds a people: Babel forged its own ("make us a name, lest we be scattered"), and God breaks such bows — of Elam, of Babylon — scattering the kingdom strung against Him.'
    },
    {
      slug: 'the-four-winds',
      title: 'The Four Winds',
      summary: 'Wind, in Hebrew, is spirit (ruach). The four winds are the four spirits of heaven (Zechariah 6:5) — God\'s executing agents, shown in the New Testament as the four horsemen. They stir the nations, scatter and gather peoples, raise the dead, and are held or loosed at the throne\'s command.'
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
      title: 'Garments',
      summary: 'A garment is righteousness — "the fine linen is the righteous acts of the saints" (Revelation 19:8, ASV), the covenant covering worn as righteous deeds. The man cast from the wedding feast had none. The acts are clean; sin only stains the cloth — so the garment is washed, not cast off, and kept by keeping the commandments. To be without it is to be naked — the covenant stripped, the shame seen.'
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
      summary: 'Everyone assumes they stand on the right side of the narrow gate. Scripture gives numbers, not just a warning — a fixed remnant-ratio running through the gleaning law\'s own geometry, the shaking of an olive tree, Elijah\'s seven thousand, the third refined as gold, and the rarity of gold itself in the earth\'s crust. Fifteen independent lines of evidence, biblical and physical, converge on the same conclusion: the saved are not a majority cut short, but a remnant — small by design, from Noah\'s eight to the crowds that dissolve to twelve.'
    },
    {
      slug: 'knowing-faith-love-and-belief',
      title: 'Knowing, Faith, Love, and Belief',
      summary: 'Four words the dictionary has emptied into inward, invisible states — knowledge as information, love as feeling, faith and belief as mental assent. Scripture defines all four as one thing: trusting obedience. Love is keeping commandments; to know God is to keep them; faith without works is dead; and "believeth not," in the Greek, is "obeyeth not."'
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
      slug: 'jacob-israel-and-ephraim',
      title: 'Jacob, Israel, and Ephraim',
      summary: 'Jacob — the heel-grabbing supplanter — is the crooked human heart; Israel is the new name given to that same man for prevailing with God. The two names do not divide flesh from spirit; they tell one story, the crooked made straight. So Israel is covenant and character, not blood — "they are not all Israel, which are of Israel." And Ephraim, the firstborn whose seed becomes "a multitude of nations," is that people scattered into all the earth as fruit, and regathered into one.'
    },
    {
      slug: 'sun-moon-and-stars',
      title: 'Sun, Moon, and Stars',
      summary: 'The lights of heaven, read as persons. Joseph\'s dream sets the pattern, and each light tells what it is: the sun is the Father, the source of light (Psalm 84:11); the moon, which has no light of its own but the sun\'s reflected, is the faithful witness who bears that light through the world\'s night — the Son (Psalm 89:37; Revelation 1:5; John 1:5); the stars are the righteous, who rule the night with Him (Daniel 12:3); and the twelve stars are the twelve tribes (Revelation 12:1). Satan\'s counterfeit inverts the order — a dark moon raised over God\'s stars to usurp the appointed times (Isaiah 14).'
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
      slug: 'worship',
      title: 'Worship',
      summary: 'A word compressed to "sing songs in church" — but Scripture separates worship from singing inside single scenes: Judah fell down worshipping while the Levites stood up to praise. The word means to bow down; its fixed pair is to serve; Jesus quotes "thou shalt fear the LORD" as "thou shalt worship the Lord." Vain worship is homage shaped by the commandments of men, and the everlasting gospel\'s call to "worship him that made heaven, and earth, the sea" quotes the sabbath commandment\'s own ground clause.'
    },
    {
      slug: 'the-fear-of-the-lord',
      title: 'The Fear of the Lord',
      summary: 'The closing chapter. The fear of the LORD is neither raw terror nor a reverence that asks nothing; Scripture defines it as keeping the commandments and departing from evil — "Fear God, and keep his commandments: for this is the whole duty of man" (Ecclesiastes 12:13). It is the beginning of wisdom and the root beneath every symbol in this book. Its counterfeit is the fear of man — the snare that breaks the very commandments the fear of God keeps (Proverbs 29:25).'
    },
    {
      slug: 'the-parables-of-the-kingdom',
      title: 'The Parables of the Kingdom',
      summary: 'The final exam. With the whole glossary in hand, the seven parables of Matthew 13 are read straight through by substitution — seed, field, wheat, tares, tree, leaven, treasure, pearl, net. Five open at a touch; the leaven overturns a tradition (leaven is the word soured, everywhere Scripture defines it); and the pearl, the woman, and the three measures of meal expose symbols still unmapped — which is the lesson: the language keeps going. The feeding of the five thousand closes it as a similitude lived out loud.'
    },
    {
      slug: 'path-to-salvation',
      title: 'The Path to Salvation',
      summary: 'Borrowed from Time Tested Tradition. Keeping the commandments is not a works-based salvation, yet willful, unrepentant lawbreaking condemns. Salvation comes by confessing Jesus as Lord and the law as good — and the familiar three-step path cannot even be taken without the law that defines sin, the High Priest it establishes, and the obedience that calling Him Master requires.'
    },
    {
      slug: 'glossary',
      title: 'Glossary of Symbols',
      summary: 'The whole vocabulary in one place: every symbol the book uses, each with its meaning, a defining verse, and the chapter that proves it.'
    }
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
}
