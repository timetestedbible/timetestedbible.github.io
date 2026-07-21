// "Time Tested Tradition" (second edition) — book chapter registry
// Single source of truth for chapter order, titles, and navigation.
// Chapters are authored in AsciiDoc (books/time-tested-tradition/*.adoc) and
// pre-rendered to HTML by Jekyll (jekyll-asciidoc) at build time.

const TIME_TESTED_TRADITION_BOOK = {
  slug: 'time-tested-tradition',
  title: 'TIME Tested Tradition',
  basePath: '/books/time-tested-tradition',
  cover: '/assets/img/covers/ttt-front-web.webp',
  tagline: 'The Renewed Biblical Calendar',
  offer: {
    label: 'Pre-order Second Edition — $7',
    note: 'Hardcover + extra content · ships after Aug 7, before Sept 1',
    price: '$7',
    was: '$49',
    href: '/preorder/',   // offer page; Stripe checkout links live there
    until: '2026-08-08T05:00:00Z'  // midnight Aug 8, America/Chicago
  },
  purchase: [
    { label: 'Buy First Edition (Legacy)', href: 'https://store.bookbaby.com/book/time-tested-tradition' },
    { soon: 'Second-edition hardcover — August 1' }
  ],
  downloads: [
    { label: 'PDF', href: 'https://github.com/timetestedbible/timetestedbible.github.io/releases/download/digital-editions/time-tested-tradition-second-edition.pdf', track: 'ttt-2e', fmt: 'pdf' },
    { label: 'EPUB', href: 'https://github.com/timetestedbible/timetestedbible.github.io/releases/download/digital-editions/time-tested-tradition-second-edition.epub', track: 'ttt-2e', fmt: 'epub' }
  ],
  chapters: [
    {
      slug: "preface",
      title: "Preface",
      summary: "Introduces the second edition and the new material added since the first\u2014Lucifer\u2019s Declared Plan, the Hebrew Revelation 12 sign, and the identical ancient consonants of \u201cfull moon\u201d and \u201cthrone\u201d\u2014and how this evidence strengthens the case for when the month and year begin."
    },
    {
      slug: "introduction",
      num: 1,
      plate: '/assets/img/plates/time-tested-tradition/01-searching-king',
      title: "Introduction",
      summary: "Introduces the fundamental problem with modern calendar traditions and establishes the need to return to biblical truth. This chapter sets the foundation for understanding why calendar accuracy matters for walking in truth and keeping appointed times."
    },
    {
      slug: "inherited-lies",
      num: 2,
      plate: '/assets/img/plates/time-tested-tradition/02-inherited-scrolls',
      title: "Inherited Lies",
      summary: "Examines the inherited traditions that have been passed down as truth but lack biblical foundation. This chapter challenges readers to question what they've been taught and to test all things against Scripture."
    },
    {
      slug: "principles-of-evaluation",
      num: 3,
      plate: '/assets/img/plates/time-tested-tradition/03-map-and-terrain',
      title: "Principles of Evaluation",
      summary: "Establishes the principles for evaluating evidence and determining truth. This chapter provides the framework for how to approach historical and biblical evidence without bias toward inherited traditions."
    },
    {
      slug: "alleged-authority-of-sanhedrin",
      num: 4,
      plate: '/assets/img/plates/time-tested-tradition/04-before-the-council',
      title: "Alleged Authority of Sanhedrin",
      summary: "Investigates the claim that the Sanhedrin had authority over calendar determination. This chapter examines historical evidence and Scripture to determine whether this authority was legitimate or assumed."
    },
    {
      slug: "sun-moon-and-stars",
      num: 5,
      plate: '/assets/img/plates/time-tested-tradition/03x-joseph-dream',
      title: "Sun, Moon, and Stars",
      summary: "From the fourth day the lights of heaven hold two offices \u2014 to rule, and to be for signs and appointed times \u2014 and Scripture reads them as a governing household: the sun the Father, the moon the faithful witness who carries His light through the world's night, the stars the righteous gathered into twelve tribes. The appointed times are governed by the lights He gave."
    },
    {
      slug: "where-does-the-day-start",
      num: 6,
      plate: '/assets/img/plates/time-tested-tradition/05-day-lost-at-sea',
      title: "Where Does the Day Start?",
      summary: "Explores the geographical question of where the day begins according to Scripture. This chapter examines biblical evidence for whether the day starts at a specific location or follows the sun's path."
    },
    {
      slug: "when-does-the-day-start",
      num: 7,
      plate: '/assets/img/plates/time-tested-tradition/06-bridegroom-dawn',
      title: "When Does the Day Start?",
      summary: "Determines the time when the biblical day begins\u2014whether at sunset, sunrise, or midnight. This chapter provides scriptural evidence for the correct timing of day boundaries."
    },
    {
      slug: "when-does-the-month-start",
      num: 8,
      plate: '/assets/img/plates/time-tested-tradition/07-watchman-full-moon',
      title: "When Does the Month Start?",
      summary: "Examines when the biblical month begins\u2014dark moon, crescent moon, or full moon. This chapter tests various theories against historical evidence and biblical testimony to determine the correct method."
    },
    {
      slug: "lucifers-declared-plan",
      num: 9,
      plate: '/assets/img/plates/time-tested-tradition/07x-lucifer-moon',
      title: "Lucifer's Declared Plan",
      summary: "Isaiah's five declarations are one act heard twice: the son of darkness will make himself like the Most High by raising his covered lunar seat into the sun's apparent place, bringing the Highest Light to silence for himself and corrupting the sign that governs God's appointed times."
    },
    {
      slug: "when-does-the-year-start",
      num: 10,
      plate: '/assets/img/plates/time-tested-tradition/08-abib-sheaf',
      title: "When Does the Year Start?",
      summary: "Determines when the biblical year begins and how to identify the first month. This chapter examines the role of the equinox and agricultural signs in determining the year's start."
    },
    {
      slug: "how-to-observe-the-signs",
      num: 11,
      plate: '/assets/img/plates/time-tested-tradition/09-watchman-tower',
      title: "How to Observe the Signs",
      summary: "Provides practical guidance on how to observe the sun, moon, and stars as signs for seasons. This chapter explains the biblical method for determining calendar dates through observation."
    },
    {
      slug: "the-sabbath",
      num: 12,
      plate: '/assets/img/plates/time-tested-tradition/09x-quails-came-up',
      title: "The Sabbath",
      summary: "A sabbath can be complete \u2014 and only a span can be complete or broken. Leviticus counts 'seven sabbaths' where Deuteronomy counts 'seven weeks,' and Hebrew owns a bare week-word, so the choice teaches: the word names the whole seven \u2014 six days of labor and one of rest as a single unit \u2014 scaling to years, to jubilees, and to the great week whose seventh millennium is the rest that remains."
    },
    {
      slug: "when-is-the-sabbath",
      num: 13,
      plate: '/assets/img/plates/time-tested-tradition/10-sabbath-quarters',
      title: "When is the Sabbath?",
      summary: "Addresses the critical question of when the Sabbath occurs\u2014whether on a fixed planetary week or tied to moon phases. This chapter tests both theories against biblical and historical evidence."
    },
    {
      slug: "the-day-of-saturn",
      num: 14,
      plate: '/assets/img/plates/time-tested-tradition/11-star-court',
      title: "The Day of Saturn",
      summary: "Examines the origin and meaning of Saturday as \\\"Sabbath\\\" and its connection to pagan planetary worship. This chapter traces the historical development of the seven-day planetary week."
    },
    {
      slug: "32-ad-resurrection",
      num: 15,
      plate: '/assets/img/plates/time-tested-tradition/12-darkness-at-noon',
      title: "32 AD Resurrection",
      summary: "Establishes the year of the crucifixion and resurrection through multiple independent lines of evidence. This chapter demonstrates that 32 AD is the only year compatible with all biblical and historical constraints, providing strong evidence for the lunar calendar."
    },
    {
      slug: "passion-week",
      num: 16,
      plate: '/assets/img/plates/time-tested-tradition/14-before-pilate',
      title: "Passion Week \u2014 3 Days & 3 Nights",
      summary: "Examines the timing of Jesus' death, burial, and resurrection in light of the \\\"three days and three nights\\\" prophecy. This chapter demonstrates how the lunar calendar perfectly fulfills this requirement."
    },
    {
      slug: "solar-only-calendars",
      num: 17,
      plate: '/assets/img/plates/time-tested-tradition/15-backs-to-the-temple',
      title: "Solar Only Calendars",
      summary: "Evaluates calendar systems that use only the sun, testing them against biblical requirements. This chapter demonstrates why solar-only calendars fail to meet scriptural standards for determining months and feasts."
    },
    {
      slug: "stability-of-astronomy",
      num: 18,
      plate: '/assets/img/plates/time-tested-tradition/15x4-steadfast-heavens',
      title: "Stability of Astronomy",
      summary: "Every date this book defends was checked against the sky, so the method itself must be tested: retrocalculation is verified against independently dated ancient observations back to 2134 BC, the stability of the cycles is promised in Genesis 8:22, and Joshua's long day reads as a stationed sign within that stable order."
    },
    {
      slug: "sign-of-jonah",
      num: 19,
      plate: '/assets/img/plates/time-tested-tradition/12x-jonah',
      title: "The Sign of Jonah",
      summary: "The only sign Jesus gave opens scene by scene: the heart of the earth is Jerusalem, the great fish a ruler forced to give back what he swallowed, and the book of Jonah a frame-by-frame prophecy of the betrayal, arrest, death, resurrection, and the gospel's turn to the nations \u2014 with the three days and three nights counted exactly."
    },
    {
      slug: "herod-the-great",
      num: 20,
      plate: '/assets/img/plates/time-tested-tradition/13-herods-eclipse',
      title: "Herod the Great",
      summary: "Provides detailed chronological evidence for the reign of Herod the Great, which is crucial for dating events in the New Testament. This chapter establishes the timeline that anchors the 32 AD crucifixion date."
    },
    {
      slug: "herod-regal-vs-defacto",
      num: 21,
      plate: '/assets/img/plates/time-tested-tradition/15x1-two-reckonings',
      title: "Herod: Regal vs De Facto",
      summary: "Detailed examination of the distinction between Herod's regal year (from Senate decree) and his de facto year (from actual control of Jerusalem). This extra chapter provides additional evidence for dating Herod's reign."
    },
    {
      slug: "herods-appointment-and-battle-of-actium",
      num: 22,
      plate: '/assets/img/plates/time-tested-tradition/15x2-crowned-in-rome',
      title: "Herod's Appointment & Battle of Actium",
      summary: "The timing of Herod's appointment as king by the Roman Senate and the Battle of Actium anchor of his 7th regnal year \u2014 the two chronological studies the print edition carries as one chapter, examined from Josephus' own accounts."
    },
    {
      slug: "the-path-to-salvation",
      num: 23,
      plate: '/assets/img/plates/time-tested-tradition/16-thief-beside-him',
      title: "The Path to Salvation",
      summary: "Explores the relationship between calendar accuracy and salvation, addressing whether keeping the correct calendar is essential for salvation. This chapter provides biblical perspective on this important question."
    },
    {
      slug: "commands-to-follow",
      num: 24,
      plate: '/assets/img/plates/time-tested-tradition/17-taught-at-the-door',
      title: "Commands to Follow",
      summary: "Identifies the specific commands related to calendar observance that believers are called to follow. This chapter clarifies which calendar-related commands are binding and how to obey them."
    },
    {
      slug: "appointed-times",
      num: 25,
      plate: '/assets/img/plates/time-tested-tradition/18-dwelling-in-booths',
      title: "Appointed Times",
      summary: "Examines the biblical feasts and appointed times, explaining when and how they should be observed according to the lunar calendar. This chapter provides practical guidance for keeping the feasts."
    },
    {
      slug: "closing-remarks",
      num: 26,
      plate: '/assets/img/plates/time-tested-tradition/23-repent-and-be-baptized',
      title: "Closing Remarks",
      summary: "The book's charge in closing: repent, be baptized, profess that His law is good, and seek His word with all your heart \u2014 obedience taught out of love, with the blessings He intends."
    },
    {
      slug: "evidence-outline",
      title: "Evidence Outline",
      summary: "Maps the central argument, explains how to read each level of evidence, and links every major claim to its full discussion."
    },
    {
      slug: "glossary",
      title: "Glossary of Terms",
      summary: "The working vocabulary of the book in one place: the calendar's own terms (renewed moon, keseh, lunar sabbath, omer count), the symbols the lights carry, and the chronologist's apparatus (regal vs de facto, inclusive counting, Metonic cycle). Entries whose full derivation lives in the companion volume say so."
    },
    {
      slug: "bibliography",
      title: "Bibliography",
      summary: "The sources behind the book: the Bible texts quoted, the ancient historians and calendars called as witnesses, the astronomy that tests them, and the AI instruments \u2014 what each one is and what work it did."
    },
    {
      slug: "about-the-author",
      plate: '/assets/img/plates/time-tested-tradition/author-portrait',
      title: "About the Author",
      summary: "The hand behind the book, and the habit of testing everything that produced it."
    },
    {
      bonus: true,
      slug: "miscellaneous-commands",
      plate: '/assets/img/plates/time-tested-tradition/19-fringes-remembered',
      title: "Miscellaneous Commands",
      summary: "Addresses other calendar-related commands and instructions found throughout Scripture. This chapter covers additional requirements and principles for calendar observance."
    },
    {
      bonus: true,
      slug: "first-fruits-new-wine",
      title: "First Fruits & New Wine",
      summary: "Explores the timing and significance of First Fruits and the Feast of New Wine in relation to the calendar. This extra chapter provides additional evidence for calendar determination."
    },
  ]
};

// Helpers used by the reader to build navigation.
const TimeTestedTraditionBook = {
  book: TIME_TESTED_TRADITION_BOOK,
  getChapter(slug) {
    return TIME_TESTED_TRADITION_BOOK.chapters.find(c => c.slug === slug) || null;
  },
  getIndex(slug) {
    return TIME_TESTED_TRADITION_BOOK.chapters.findIndex(c => c.slug === slug);
  },
  getPrevNext(slug) {
    const i = this.getIndex(slug);
    const ch = TIME_TESTED_TRADITION_BOOK.chapters;
    return {
      prev: i > 0 ? ch[i - 1] : null,
      next: i >= 0 && i < ch.length - 1 ? ch[i + 1] : null
    };
  },
  chapterPath(slug) {
    return `${TIME_TESTED_TRADITION_BOOK.basePath}/${slug}/`;
  }
};

if (typeof window !== 'undefined') {
  window.TIME_TESTED_TRADITION_BOOK = TIME_TESTED_TRADITION_BOOK;
  window.TimeTestedTraditionBook = TimeTestedTraditionBook;
  window.BOOKS_BY_SLUG = window.BOOKS_BY_SLUG || {};
  window.BOOKS_BY_SLUG['time-tested-tradition'] = TimeTestedTraditionBook;
}
