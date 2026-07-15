// Word Study Dictionary
// Maps Strong's numbers to detailed word study information
// These are linguistic/lexical studies (etymology, root analysis, usage patterns)
// Distinct from Symbol Dictionary which maps symbolic meanings (IS/DOES framework)

const WORD_STUDY_DICTIONARY = {
  'H2320': {
    strongs: 'H2320',
    lemma: 'חֹדֶשׁ',
    transliteration: 'chodesh',
    pronunciation: "kho'-desh",
    root: 'H2318',
    rootLemma: 'חָדַשׁ',
    rootMeaning: 'to renew, restore to completeness',
    summary: 'The noun form of "to renew" — literally "the renewed [moon]." Every use of the verb root describes restoration to a full, perfect state. Applied to the moon, this names the phase when the moon is restored to its complete state: the full moon.',
    keyVerse: 'Psalm 81:3',
    keyVerseText: 'Blow up the trumpet in the renewed moon (chodesh), in the fullness (keseh), for the day of our feast.',
    bookChapter: '/chapters/07_When_Does_the_Month_Start.md',
    bookChapterTitle: 'When Does the Month Start?',
    link: '/reader/words/H2320'
  },
  
  'H2318': {
    strongs: 'H2318',
    lemma: 'חָדַשׁ',
    transliteration: 'chadash',
    pronunciation: "khaw-dash'",
    root: null,
    rootLemma: null,
    rootMeaning: null,
    summary: 'A primitive root meaning "to be new, to renew, to repair." All 10 biblical uses describe restoration to completeness/perfection — restoring a kingdom, altar, temple, spirit, youth, or cities to their full, proper state.',
    keyVerse: 'Psalm 51:10',
    keyVerseText: 'Create in me a clean heart, O God; and renew a right spirit within me.',
    bookChapter: '/chapters/07_When_Does_the_Month_Start.md',
    bookChapterTitle: 'When Does the Month Start?',
    link: '/reader/words/H2320'  // Links to the noun study which covers both
  },
  
  'H3677': {
    strongs: 'H3677',
    lemma: 'כֶּסֶא',
    transliteration: 'keseh',
    pronunciation: "keh'-seh",
    root: 'H3680',
    rootLemma: 'כָּסָה',
    rootMeaning: 'to fill up hollows, to cover',
    summary: 'Derived from "to fill up" — meaning fullness or the full moon. Aramaic cognate "kista" and Akkadian "kuseu" directly mean "full moon." In Psalm 81:3, used in synonymous parallelism with chodesh (renewed moon), equating the two terms.',
    keyVerse: 'Psalm 81:3',
    keyVerseText: 'Blow up the trumpet in the renewed moon (chodesh), in the fullness (keseh), for the day of our feast.',
    bookChapter: '/chapters/07_When_Does_the_Month_Start.md',
    bookChapterTitle: 'When Does the Month Start?',
    link: '/reader/words/H2320'
  },

  'H6443': {
    strongs: 'H6443',
    lemma: 'פָּנִין',
    transliteration: 'paniyn / peninim',
    pronunciation: "paw-neen'",
    root: null,
    rootLemma: null,
    rootMeaning: null,
    summary: 'The noun occurs 6 times. Strong\'s calls it “probably a pearl (as round),” while Brown–Driver–Briggs prefers coral but expressly records pearls as an alternative. The ancient versions usually preserve a general precious-stone sense; the Aramaic Targum to Job 28:18 uses an unambiguous pearl word. “Ruby” is therefore a traditional English choice, not a settled identification of the object.',
    keyVerse: 'Proverbs 31:10',
    keyVerseText: 'Who can find a woman of valour? for her price is far above pearls.',
    bookChapter: '/blog/peninim-pearl-or-ruby/',
    bookChapterTitle: 'Peninim: Why Pearl Fits Better Than Ruby',
    link: '/reader/words/H6443'
  },
  
  'H802': {
    strongs: 'H802',
    lemma: 'אִשָּׁה',
    transliteration: 'ishshah',
    pronunciation: "ish-shaw'",
    root: 'H376',
    rootLemma: 'אִישׁ',
    rootMeaning: 'man, husband',
    summary: 'The Hebrew word for "woman" shares identical consonants (אשה) and vowel pointing with the word for "fire offering" (H801). Without vowel points, these are written identically. Strong\'s derives H802 from "man" (H376), while H801 derives from "fire" (H784).',
    keyVerse: 'Genesis 2:23',
    keyVerseText: 'She shall be called Woman (ishshah), because she was taken out of Man (ish).',
    bookChapter: null,
    bookChapterTitle: null,
    link: '/reader/words/H802'
  },
  
  'H801': {
    strongs: 'H801',
    lemma: 'אִשָּׁה',
    transliteration: 'ishshah',
    pronunciation: "ish-shaw'",
    root: 'H784',
    rootLemma: 'אֵשׁ',
    rootMeaning: 'fire',
    summary: 'The "fire offering" — a sacrifice completely consumed by fire. Shares identical consonants (אשה) and vowel pointing with the word for "woman" (H802). Strong\'s says it is "the same as H800 (fire), but used in a liturgical sense."',
    keyVerse: 'Leviticus 1:9',
    keyVerseText: 'The priest shall burn all on the altar, to be a burnt sacrifice, an offering made by fire (ishshah), of a sweet savour unto the LORD.',
    bookChapter: null,
    bookChapterTitle: null,
    link: '/reader/words/H802'
  },
  
  'H784': {
    strongs: 'H784',
    lemma: 'אֵשׁ',
    transliteration: 'esh',
    pronunciation: "aysh",
    root: null,
    rootLemma: null,
    rootMeaning: null,
    summary: 'A primitive word meaning "fire." Strong\'s traces H801 (fire offering) back to this word through H800 (feminine form of fire).',
    keyVerse: 'Exodus 3:2',
    keyVerseText: 'The bush burned with fire (esh), and the bush was not consumed.',
    bookChapter: null,
    bookChapterTitle: null,
    link: '/reader/words/H802'
  },
  
  'H7676': {
    strongs: 'H7676',
    lemma: 'שַבָּת',
    transliteration: 'shabbath',
    pronunciation: "shab-bawth'",
    root: 'H7673',
    rootLemma: 'שָׁבַת',
    rootMeaning: 'to cease, to rest, to desist from exertion',
    summary: 'Derived from "to cease/rest" — represents the completion, end, and rest of a unit of work. Consistently defined as 6+1: six days of work followed by one day of rest. Far more than a calendar day: it is a week structure, a sign between God and His people, an appointed time (mo\'ed), and an objective holy space-time established at creation.',
    keyVerse: 'Exodus 20:8-11',
    keyVerseText: 'Remember the Sabbath day, to keep it holy. Six days you shall labor, and do all your work, but the seventh day is a Sabbath to the LORD your God.',
    bookChapter: '/chapters/10_When_is_the_Sabbath.md',
    bookChapterTitle: 'When is the Sabbath?',
    link: '/reader/words/H7676'
  },
  
  'H8064': {
    strongs: 'H8064',
    lemma: 'שָׁמַיִם',
    transliteration: 'shamayim',
    pronunciation: "shaw-mah'-yim",
    root: null,
    rootLemma: null,
    rootMeaning: null,
    summary: 'Means "the sky" — from a root meaning "to be lofty." Used 395 times for the physical sky, cosmic expanse, or God\'s domain. Never used as a destination for the dead. The phrase "go to heaven" does not appear in Scripture.',
    keyVerse: 'Psalm 115:16',
    keyVerseText: 'The heaven, even the heavens, are the LORD\'s: but the earth hath he given to the children of men.',
    bookChapter: null,
    bookChapterTitle: null,
    link: '/reader/words/HEAVEN'
  },

  'G3772': {
    strongs: 'G3772',
    lemma: 'οὐρανός',
    transliteration: 'ouranos',
    pronunciation: "oo-ran-os'",
    root: 'G3735',
    rootLemma: 'ὄρος',
    rootMeaning: 'mountain — a mountain, as lifting itself above the plain',
    summary: 'Means "the sky." Perhaps derived from G3735 (oros, mountain) through the idea of elevation. Used 264 times for God\'s domain, the physical sky, or the kingdom phrase. In Scripture, mountain = kingdom (Rev 17:9). Heaven → mountain → kingdom: the highest seat of ruling authority.',
    keyVerse: 'John 3:13',
    keyVerseText: 'And no man hath ascended up to heaven, but he that came down from heaven, even the Son of man which is in heaven.',
    bookChapter: null,
    bookChapterTitle: null,
    link: '/reader/words/HEAVEN'
  },

  'G4521': {
    strongs: 'G4521',
    lemma: 'σάββατον',
    transliteration: 'sabbaton',
    pronunciation: "sab'-bat-on",
    root: null,
    rootLemma: null,
    rootMeaning: null,
    summary: 'Greek word for Sabbath, derived from Hebrew H7676. Means "the Sabbath (i.e. Shabbath), or day of weekly repose from secular avocations (also the observance or institution itself); by extension, a se\'nnight, i.e. the interval between two Sabbaths." Like the Hebrew, it represents the completion and rest of a 6+1 work unit, not merely a calendar day.',
    keyVerse: 'Mark 2:27',
    keyVerseText: 'The Sabbath was made for man, not man for the Sabbath.',
    bookChapter: '/chapters/10_When_is_the_Sabbath.md',
    bookChapterTitle: 'When is the Sabbath?',
    link: '/reader/words/H7676'
  }
};

// Build Strong's number index for quick lookup
const WORD_STUDY_INDEX = {};
for (const [key, study] of Object.entries(WORD_STUDY_DICTIONARY)) {
  WORD_STUDY_INDEX[study.strongs] = study;
}

// Look up word study by Strong's number
function lookupWordStudy(strongsNum) {
  if (!strongsNum) return null;
  // Normalize: H2320, H02320, h2320 all become H2320
  const normalized = strongsNum.toUpperCase().replace(/([HG])0*(\d+)/, '$1$2');
  return WORD_STUDY_INDEX[normalized] || null;
}

// Render word study section for Strong's panel
function renderWordStudyHtml(study) {
  if (!study) return '';
  
  let html = `
    <div class="strongs-word-study-info">
      <div class="strongs-word-study-header">
        <span class="strongs-word-study-icon">📚</span>
        <span class="strongs-word-study-title">Word Study</span>
      </div>
      <div class="strongs-word-study-summary">${study.summary}</div>
  `;
  
  if (study.root) {
    html += `
      <div class="strongs-word-study-root">
        <span class="word-study-label">Root:</span>
        <a href="#" class="strongs-link" onclick="navigateToStrongs('${study.root}', event)">${study.root}</a>
        <span class="word-study-root-lemma">${study.rootLemma}</span>
        <span class="word-study-root-meaning">— ${study.rootMeaning}</span>
      </div>
    `;
  }
  
  if (study.keyVerse) {
    html += `
      <div class="strongs-word-study-verse">
        <span class="word-study-label">Key Verse:</span>
        <span class="word-study-verse-ref">${study.keyVerse}</span>
        <div class="word-study-verse-text">"${study.keyVerseText}"</div>
      </div>
    `;
  }
  
  if (study.bookChapter) {
    html += `
      <div class="strongs-word-study-chapter">
        <a href="${study.bookChapter}" class="word-study-chapter-link">
          📖 Read: ${study.bookChapterTitle}
        </a>
      </div>
    `;
  }
  
  if (study.link) {
    html += `
      <button class="strongs-word-study-link" onclick="openWordStudyInReader('${study.strongs}')">
        Full Word Study →
      </button>
    `;
  }
  
  html += '</div>';
  return html;
}

// Open word study in reader view
function openWordStudyInReader(strongsNum) {
  if (typeof AppStore !== 'undefined') {
    AppStore.dispatch({
      type: 'SET_VIEW',
      view: 'reader',
      params: { contentType: 'words', word: strongsNum }
    });
  }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { WORD_STUDY_DICTIONARY, lookupWordStudy, renderWordStudyHtml };
}
