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
      summary: 'One Hebrew word — kanaph — is scattered across English as wing, skirt, border, corner, and edge. It is the hem where God commanded the fringes bound, "that ye may remember all the commandments... and do them." So the wing carries the law: there is healing in it (Malachi 4:2), refuge under it, covenant in the spreading of it, and at the corner of the field the remnant gleans.'
    },
    {
      slug: 'orphans-widows-and-the-fatherless',
      title: 'Orphans, Widows, and the Fatherless',
      summary: 'Everyone honors caring for widows and orphans — even the godless do — and assumes himself a giver, never one of them. But Scripture turns it: the covenant people, cut off from their Husband, are themselves the widow and the fatherless (Lamentations 5:3). God defends, feeds, and gathers them home — and the food is His word, the clothing His righteousness, multiplied like five loaves and two fishes. The stranger is no mere foreigner but the one outside the covenant, drawn in at the field edge.'
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
      slug: 'the-fear-of-the-lord',
      title: 'The Fear of the Lord',
      summary: 'The closing chapter. The fear of the LORD is neither raw terror nor a reverence that asks nothing; Scripture defines it as keeping the commandments and departing from evil — "Fear God, and keep his commandments: for this is the whole duty of man" (Ecclesiastes 12:13). It is the beginning of wisdom and the root beneath every symbol in this book. Its counterfeit is the fear of man — the snare that breaks the very commandments the fear of God keeps (Proverbs 29:25).'
    },
    {
      slug: 'glossary',
      title: 'Glossary of Symbols',
      summary: 'The whole vocabulary in one place: every symbol the book uses, each with its meaning, a defining verse, and the chapter that proves it. Entries marked "not yet proven" are referenced in the text but await their own treatment — the working list of what is left to expand.'
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
