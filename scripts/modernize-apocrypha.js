#!/usr/bin/env node
/**
 * Modernize spelling and archaic English in apocrypha blob files.
 * Applies word-level substitutions without changing sentence structure.
 *
 * Usage: node scripts/modernize-apocrypha.js
 */

const fs = require('fs');
const path = require('path');

const CLASSICS_DIR = path.join(__dirname, '..', 'classics');
const SEP = '\x01';

// ── KJV 1611 spelling modernization ──
// These are systematic Early Modern English → Modern English spelling changes.
const KJV_SPELLING = {
  // Thorn character
  '&thorn;': 'the',
  '\u00FE': 'the',

  // HTML entities that appear in the KJV text
  '&#333;': 'o',
  '&amp;': '&',

  // Double-letter / vowel patterns (applied as regex)
};

// Word-level replacements (exact match, case-sensitive)
const WORD_MAP = {
  // Pronouns and determiners
  'thee': 'you', 'Thee': 'You', 'thou': 'you', 'Thou': 'You',
  'thy': 'your', 'Thy': 'Your', 'thine': 'your', 'Thine': 'Your',
  'ye': 'you', 'Ye': 'You',
  'hee': 'he', 'Hee': 'He', 'shee': 'she', 'Shee': 'She',
  'wee': 'we', 'Wee': 'We', 'mee': 'me', 'Mee': 'Me',
  'yee': 'you', 'Yee': 'You', 'bee': 'be', 'Bee': 'Be',
  'himselfe': 'himself', 'herselfe': 'herself', 'themselues': 'themselves',
  'it selfe': 'itself', 'my selfe': 'myself', 'your selfe': 'yourself',
  'our selues': 'ourselves', 'selfe': 'self',
  // Verbs - archaic forms
  'hath': 'has', 'Hath': 'Has', 'doth': 'does', 'Doth': 'Does',
  'saith': 'says', 'Saith': 'Says', 'dost': 'do', 'Dost': 'Do',
  'doest': 'do', 'Doest': 'Do', 'hast': 'have', 'Hast': 'Have',
  'shalt': 'shall', 'Shalt': 'Shall', 'wilt': 'will', 'Wilt': 'Will',
  'canst': 'can', 'Canst': 'Can', 'wouldest': 'would', 'shouldest': 'should',
  'goeth': 'goes', 'Goeth': 'Goes', 'cometh': 'comes', 'Cometh': 'Comes',
  'maketh': 'makes', 'Maketh': 'Makes', 'taketh': 'takes', 'Taketh': 'Takes',
  'giveth': 'gives', 'Giveth': 'Gives', 'liveth': 'lives', 'Liveth': 'Lives',
  'doeth': 'does', 'Doeth': 'Does', 'seeketh': 'seeks', 'Seeketh': 'Seeks',
  'keepeth': 'keeps', 'Keepeth': 'Keeps', 'speaketh': 'speaks',
  'bringeth': 'brings', 'Bringeth': 'Brings', 'knoweth': 'knows',
  'sheweth': 'shows', 'Sheweth': 'Shows', 'walketh': 'walks',
  'turneth': 'turns', 'Turneth': 'Turns', 'setteth': 'sets',
  'falleth': 'falls', 'Falleth': 'Falls', 'riseth': 'rises',
  'feareth': 'fears', 'Feareth': 'Fears', 'pleaseth': 'pleases',
  'passeth': 'passes', 'sendeth': 'sends', 'lendeth': 'lends',
  'openeth': 'opens', 'heareth': 'hears', 'answereth': 'answers',
  'loveth': 'loves', 'Loveth': 'Loves', 'hateth': 'hates',
  'leadeth': 'leads', 'feedeth': 'feeds', 'needeth': 'needs',
  'endureth': 'endures', 'remaineth': 'remains', 'returneth': 'returns',
  'abideth': 'abides', 'standeth': 'stands', 'dwelleth': 'dwells',
  'filleth': 'fills', 'Filleth': 'Fills', 'killeth': 'kills',
  'teacheth': 'teaches', 'reacheth': 'reaches', 'toucheth': 'touches',
  'perisheth': 'perishes', 'flourisheth': 'flourishes',
  'enlargeth': 'enlarges', 'exalteth': 'exalts',
  'belongeth': 'belongs', 'trusteth': 'trusts', 'lusteth': 'lusts',
  // Adverbs and prepositions
  'vnto': 'to', 'unto': 'to',
  'vpon': 'upon', 'wherefore': 'therefore', 'Wherefore': 'Therefore',
  'whence': 'from where', 'Whence': 'From where',
  'hither': 'here', 'Hither': 'Here',
  'thither': 'there', 'Thither': 'There',
  'whither': 'where', 'Whither': 'Where',
  'thereof': 'of it', 'therein': 'in it', 'thereby': 'by it',
  'therof': 'of it', 'therin': 'in it',
  'hereof': 'of this', 'wherein': 'in which', 'Wherein': 'In which',
  'wherewith': 'with which',
  'howbeit': 'however', 'Howbeit': 'However',
  'peraduenture': 'perhaps', 'Peraduenture': 'Perhaps',
  'peradventure': 'perhaps', 'Peradventure': 'Perhaps',
  'notwithstanding': 'nevertheless', 'Notwithstanding': 'Nevertheless',
  'insomuch': 'so much', 'Insomuch': 'So much',
  'forasmuch': 'since', 'Forasmuch': 'Since',
  'inasmuch': 'since', 'Inasmuch': 'Since',
  'moreouer': 'moreover', 'Moreouer': 'Moreover',
  'neuerthelesse': 'nevertheless', 'Neuerthelesse': 'Nevertheless',
  'euermore': 'evermore',
};

// Regex-based patterns (order matters)
const KJV_REGEX_PATTERNS = [
  // HTML entities
  [/&thorn;/g, 'the'],
  [/&#333;/g, 'o'],

  // I→J for proper names at word start before vowels
  [/\bIe(?=[rsua])/g, 'Je'],  // Iesus→Jesus, Ierusalem→Jerusalem, Ieremias→Jeremiah
  [/\bIo(?=[shna])/g, 'Jo'],  // Ioseph→Joseph, Ionathan→Jonathan, Ioppe→Joppa
  [/\bIu(?=[dsa])/g, 'Ju'],  // Iudas→Judas, Iudea→Judea

  // "v" → "u" inside words (not at word start)
  [/(\w)u([aeiou])/gi, null],  // skip
  [/\bvn/g, 'un'],  // vnto→unto (then word map handles unto→to)
  [/\bVn/g, 'Un'],
  [/\bvp/g, 'up'],
  [/\bVp/g, 'Up'],

  // "ou" → "ov" patterns (loue→love, aboue→above, moue→move, proue→prove)
  [/\b(\w*)oue\b/g, (m, p) => {
    const skip = ['you', 'your', 'rouge', 'lounge', 'ouse'];
    if (skip.includes(m.toLowerCase())) return m;
    return p + 'ove';
  }],
  [/\b(\w*)oued\b/g, (m, p) => p + 'oved'],
  [/\b(\w*)ouer\b/g, (m, p) => {
    if (m.toLowerCase() === 'over') return m;
    return p + 'over';
  }],
  [/\b(\w*)ouring\b/g, (m, p) => p + 'ouring'],  // keep -ouring

  // "u" → "v" in middle of words where it should be v
  [/\bdeliuer/gi, 'deliver'], [/\briuer\b/gi, 'river'], [/\bsiluer\b/gi, 'silver'],
  [/\bdiuers/gi, 'divers'], [/\bdiuide/gi, 'divide'], [/\bdiuision/gi, 'division'],
  [/\bgouernou?r/gi, 'governor'], [/\bgouerment/gi, 'government'],
  [/\bsauiour/gi, 'savior'], [/\bfauour/gi, 'favor'], [/\bhonour\b/gi, 'honor'],
  [/\bvaliantly/gi, 'valiantly'],  // correct already
  [/\beuer\b/gi, (m) => m[0] === 'E' ? 'Ever' : 'ever'],
  [/\beuery\b/gi, (m) => m[0] === 'E' ? 'Every' : 'every'],
  [/\beuill?\b/gi, (m) => m[0] === 'E' ? 'Evil' : 'evil'],
  [/\bneuer\b/gi, (m) => m[0] === 'N' ? 'Never' : 'never'],
  [/\bouer\b/gi, (m) => m[0] === 'O' ? 'Over' : 'over'],
  [/\bperseuer/gi, 'persever'], [/\bperswad/gi, 'persuad'],

  // "haue" → "have" family
  [/\bhaue\b/gi, (m) => m[0] === 'H' ? 'Have' : 'have'],
  [/\bhauing\b/gi, 'having'],
  [/\bgiue\b/gi, (m) => m[0] === 'G' ? 'Give' : 'give'],
  [/\bgiuen\b/gi, 'given'], [/\bgiuing\b/gi, 'giving'],
  [/\bliue\b/gi, (m) => m[0] === 'L' ? 'Live' : 'live'],
  [/\bliued\b/gi, 'lived'], [/\bliuing\b/gi, 'living'],
  [/\breceiue/gi, 'receive'], [/\bdeceiue/gi, 'deceive'],
  [/\bperceiue/gi, 'perceive'], [/\bconceiue/gi, 'conceive'],
  [/\bbeleeue/gi, 'believe'], [/\bgrieu/gi, 'griev'],
  [/\breioyce/gi, 'rejoice'],

  // Terminal silent "-e" additions (Early Modern added -e to many words)
  [/\bsonne\b/gi, (m) => m[0] === 'S' ? 'Son' : 'son'],
  [/\bsonnes\b/gi, (m) => m[0] === 'S' ? 'Sons' : 'sons'],
  [/\bchilde\b/gi, 'child'], [/\bchildren\b/gi, 'children'],
  [/\bworlde\b/gi, 'world'],
  [/\blorde\b/gi, 'lord'], [/\bLorde\b/g, 'Lord'],
  [/\bkinge\b/gi, 'king'], [/\bkinges\b/gi, 'kings'],
  [/\bwisdome\b/gi, (m) => m[0] === 'W' ? 'Wisdom' : 'wisdom'],
  [/\bkingdome\b/gi, 'kingdom'], [/\bkingdomes\b/gi, 'kingdoms'],
  [/\bsinne\b/gi, 'sin'], [/\bsinnes\b/gi, 'sins'],
  [/\bmanne\b/gi, 'man'],
  [/\bworke\b/gi, 'work'], [/\bworkes\b/gi, 'works'],
  [/\bthinke\b/gi, 'think'], [/\bthinges\b/gi, 'things'], [/\bthinge\b/gi, 'thing'],
  [/\bseeke\b/gi, 'seek'], [/\bseeken\b/gi, 'seeking'],
  [/\bdrinke\b/gi, 'drink'], [/\bstrike\b/gi, 'strike'],

  // "oo" → "o" in past tenses (tooke→took, shooke→shook, etc.)
  [/\bBooke\b/g, 'Book'], [/\bbooke\b/g, 'book'], [/\bbookes\b/gi, 'books'],
  [/\btooke\b/gi, 'took'], [/\bshooke\b/gi, 'shook'],
  [/\bforsooke\b/gi, 'forsook'], [/\bbrooke\b/gi, 'brook'],
  [/\blooke\b/gi, 'look'], [/\blooking\b/gi, 'looking'],
  [/\bfoote\b/gi, 'foot'],

  // "oe" → "o" (goe→go, doe→do, foe stays foe)
  [/\bgoe\b/gi, (m) => m[0] === 'G' ? 'Go' : 'go'],
  [/\bdoe\b/gi, (m) => m[0] === 'D' ? 'Do' : 'do'],
  [/\bwoe\b/gi, 'woe'],  // keep woe

  // "shew" → "show"
  [/\bshew\b/gi, (m) => m[0] === 'S' ? 'Show' : 'show'],
  [/\bshewed\b/gi, 'showed'], [/\bshewing\b/gi, 'showing'],
  [/\bshewn\b/gi, 'shown'],

  // "-nesse" → "-ness"
  [/(\w)nesse\b/gi, '$1ness'],

  // "-full" → "-ful"
  [/(\w{2,})full\b/gi, '$1ful'],

  // Common KJV spellings
  [/\bwordes\b/gi, 'words'], [/\bsworde?\b/gi, 'sword'],
  [/\bdayes\b/gi, 'days'], [/\bwayes\b/gi, 'ways'],
  [/\beies\b/gi, 'eyes'], [/\beyies\b/gi, 'eyes'],
  [/\byeere?s?\b/gi, (m) => m.toLowerCase().endsWith('s') ? 'years' : 'year'],
  [/\bcitie\b/gi, 'city'],
  [/\bmercie\b/gi, 'mercy'], [/\bmercies\b/gi, 'mercies'],
  [/\bglorie\b/gi, 'glory'],
  [/\barmie\b/gi, 'army'], [/\barmies\b/gi, 'armies'],
  [/\benemie\b/gi, 'enemy'], [/\benemies\b/gi, 'enemies'],
  [/\bcountrey\b/gi, 'country'], [/\bcountreys\b/gi, 'countries'],
  [/\btrauaile\b/gi, 'labor'], [/\btrauell\b/gi, 'travel'],
  [/\bprophesie\b/gi, 'prophecy'],
  [/\bcomming\b/gi, 'coming'],
  [/\bcommaund/gi, 'command'],
  [/\bshalbe\b/gi, 'shall be'], [/\bwilbe\b/gi, 'will be'],
  [/\bbene\b/gi, 'been'], [/\bgon\b/gi, 'gone'],
  [/\bverie\b/gi, 'very'], [/\bVerie\b/g, 'Very'],
  [/\bsayd\b/gi, 'said'], [/\bSayd\b/g, 'Said'],
  [/\bpraid\b/gi, 'prayed'], [/\bslaine\b/gi, 'slain'],
  [/\blaide\b/gi, 'laid'], [/\bpaide\b/gi, 'paid'],
  [/\bsaide\b/gi, 'said'],
  [/\bhimselfe\b/gi, 'himself'], [/\bherselfe\b/gi, 'herself'],
  [/\bthemselues\b/gi, 'themselves'], [/\bour selues\b/gi, 'ourselves'],
  [/\byour selues\b/gi, 'yourselves'],
  [/\biudge/gi, 'judge'], [/\bioy\b/gi, 'joy'],
  [/\biust\b/gi, 'just'], [/\biustice\b/gi, 'justice'],
  [/\biourney/gi, 'journey'],
  [/\bsouldier/gi, 'soldier'],
  [/\bmightie\b/gi, 'mighty'], [/\bholie\b/gi, 'holy'],
  [/\bwholly\b/gi, 'wholly'],
  [/\bcaptaine/gi, 'captain'],
  [/\bceaze\b/gi, 'cease'],
  [/\bcheareful/gi, 'cheerful'],
  [/\bcounsell\b/gi, 'counsel'], [/\bcounsellor/gi, 'counselor'],
  [/\bstraight\b/gi, 'straight'],  // keep
  [/\bstrait\b/gi, 'strait'],  // keep (narrow)
  [/\bpraier/gi, 'prayer'],
  [/\bpouert/gi, 'povert'],
  [/\bbeautif/gi, 'beautif'],
  [/\bsauing\b/gi, 'saving'],

  // "eu" → "ev" (seuenth→seventh, deuour→devour, heauen→heaven, etc.)
  [/\bseu/gi, 'sev'], [/\bpreu/gi, 'prev'],
  [/\breveu/gi, 'reven'], [/\breueal/gi, 'reveal'],
  [/\breueng/gi, 'reveng'], [/\bgrieu/gi, 'griev'],
  [/\bdeuour/gi, 'devour'], [/\bdeuout/gi, 'devout'], [/\bdeuil/gi, 'devil'],
  [/\bheauen/gi, 'heaven'], [/\bHeauen/g, 'Heaven'],
  [/\beuen\b/gi, (m) => m[0] === 'E' ? 'Even' : 'even'],
  [/\beuening\b/gi, 'evening'],
  [/\bleuen\b/gi, 'leaven'],
  [/\bbeene\b/gi, 'been'],
  [/\bseene\b/gi, 'seen'],
  [/\bqueene\b/gi, 'queen'],
  [/\bgreene\b/gi, 'green'],

  // "iue/iued/iuing" → "ive/ived/iving"
  [/\b(\w+)iue\b/gi, (m, p) => p + 'ive'],
  [/\b(\w+)iued\b/gi, (m, p) => p + 'ived'],
  [/\b(\w+)iuing\b/gi, (m, p) => p + 'iving'],

  // Terminal "-e" drops (againe→again, certaine→certain, etc.)
  [/\b(\w+)aine\b/gi, (m, p) => {
    const skip = ['bane','cane','crane','dane','fane','insane','lane','mane','pane','sane','vane','wane','plane','humane'];
    if (skip.includes(m.toLowerCase())) return m;
    return p + 'ain';
  }],

  // "-itie" → "-ity" (citie→city, simplicitie→simplicity, etc.)
  [/\b(\w+)itie\b/gi, (m, p) => p + 'ity'],

  // "-ie" → "-y" general (but skip die, lie, tie, pie, vie)
  [/\b(\w{3,})ie\b/g, (m, p) => {
    const skip = ['die','lie','tie','pie','vie','untie'];
    if (skip.includes(m.toLowerCase())) return m;
    return p + 'y';
  }],

  // Silent terminal "-e" on common words
  [/\bwarre\b/gi, 'war'], [/\bwarres\b/gi, 'wars'],
  [/\bfarre\b/gi, 'far'],
  [/\bweare\b/gi, 'wear'],
  [/\bagaine\b/gi, 'again'], [/\bagainst\b/gi, 'against'],
  [/\bcertaine\b/gi, 'certain'],
  [/\bcaptaine\b/gi, 'captain'],
  [/\bmountaine\b/gi, 'mountain'],
  [/\bfountaine\b/gi, 'fountain'],
  [/\bretaine\b/gi, 'retain'],
  [/\bmaintaine\b/gi, 'maintain'],
  [/\bcontaine\b/gi, 'contain'],
  [/\bobtaine\b/gi, 'obtain'],
  [/\bBritaine\b/gi, 'Britain'],

  // "oo" → modern (shoote→shoot, roote→root, etc.)
  [/\bshoote\b/gi, 'shoot'], [/\broote\b/gi, 'root'],
  [/\bfoode\b/gi, 'food'], [/\bbloode?\b/gi, 'blood'],

  // "w" words
  [/\bwarre\b/gi, 'war'], [/\bwracke\b/gi, 'wrack'],

  // "moneth" → "month"
  [/\bmoneth\b/gi, 'month'], [/\bmoneths\b/gi, 'months'],
  [/\bstrength\b/gi, 'strength'],  // keep
  [/\breigne\b/gi, 'reign'], [/\breigned\b/gi, 'reigned'],
  [/\bsoveraigne\b/gi, 'sovereign'],

  // "ll" → "l" (walles→walls, etc.)
  [/\bwalles\b/gi, 'walls'], [/\bwalle\b/gi, 'wall'],

  // Specific remaining common words
  [/\bcubites\b/gi, 'cubits'], [/\bcubite\b/gi, 'cubit'],
  [/\bHebrewe?\b/gi, 'Hebrew'], [/\bHebrewes\b/gi, 'Hebrews'],
  [/\bCaldeans\b/gi, 'Chaldeans'],
  [/\bhewen\b/gi, 'hewn'],
  [/\bslayne\b/gi, 'slain'], [/\bslaine\b/gi, 'slain'],
  [/\bstoode\b/gi, 'stood'],
  [/\broade\b/gi, 'road'],
  [/\broades\b/gi, 'roads'],
  [/\bwisedome\b/gi, 'wisdom'],
  [/\bsayde\b/gi, 'said'],
  [/\btowne\b/gi, 'town'], [/\btownes\b/gi, 'towns'],
  [/\browne\b/gi, 'own'],
  [/\bknewe\b/gi, 'knew'],
  [/\bgrewe\b/gi, 'grew'],
  [/\bdrewe\b/gi, 'drew'],
  [/\bblewe\b/gi, 'blew'],
  [/\bflewe\b/gi, 'flew'],
  [/\bshewe\b/gi, 'show'],
  [/\bknowe\b/gi, 'know'], [/\bknowne\b/gi, 'known'],
  [/\bprofite\b/gi, 'profit'],
  [/\bfruite\b/gi, 'fruit'], [/\bfruites\b/gi, 'fruits'],
  [/\bpurpose\b/gi, 'purpose'],  // keep
  [/\bproude\b/gi, 'proud'],
  [/\bfounde\b/gi, 'found'],
  [/\bgrounde\b/gi, 'ground'],
  [/\bwounde\b/gi, 'wound'],
  [/\bbounde\b/gi, 'bound'],
  [/\bsounde\b/gi, 'sound'],
  [/\brounde\b/gi, 'round'],
  [/\bfroward\b/gi, 'perverse'],
  [/\bFroward\b/g, 'Perverse'],

  // Remaining "ou" → "ov" that were missed
  [/\bsoule\b/gi, 'soul'], [/\bsoules\b/gi, 'souls'],
  [/\bcouenant\b/gi, 'covenant'], [/\bCouenant\b/g, 'Covenant'],
  [/\bcouenants\b/gi, 'covenants'],
  [/\bcounsaile\b/gi, 'counsel'],
  [/\bcountenaunce\b/gi, 'countenance'],
  [/\bcourse\b/gi, 'course'],  // keep
  [/\bdoubt\b/gi, 'doubt'],  // keep

  // "I" prefix → "J" for remaining names
  [/\bIewes\b/g, 'Jews'], [/\bIewe?\b/g, 'Jew'],
  [/\bIacob\b/g, 'Jacob'], [/\bIsrael\b/g, 'Israel'],  // keep Israel

  // Remaining common archaic words
  [/\bonely\b/gi, 'only'], [/\bOnely\b/g, 'Only'],
  [/\bgraue\b/gi, 'grave'], [/\bGraue\b/g, 'Grave'],
  [/\bgraues\b/gi, 'graves'],
  [/\breade\b/gi, 'read'],
  [/\bseruant/gi, 'servant'],
  [/\bpreserue/gi, 'preserve'],
  [/\bobserue/gi, 'observe'],
  [/\bdeserue/gi, 'deserve'],
  [/\blande\b/gi, 'land'],
  [/\bhande\b/gi, 'hand'], [/\bhandes\b/gi, 'hands'],
  [/\bcommande\b/gi, 'command'],
  [/\bfinde\b/gi, 'find'],
  [/\bkinde\b/gi, 'kind'],
  [/\bminde\b/gi, 'mind'],
  [/\bblinde\b/gi, 'blind'],
  [/\bbinde\b/gi, 'bind'],
  [/\bwinde\b/gi, 'wind'],
  [/\btyme\b/gi, 'time'],
  [/\blyfe\b/gi, 'life'],
  [/\bwyfe\b/gi, 'wife'],
  [/\bstrife\b/gi, 'strife'],  // keep
  [/\bknife\b/gi, 'knife'],  // keep
  [/\bfyre\b/gi, 'fire'],
  [/\bdesyre\b/gi, 'desire'],
  [/\bentyre\b/gi, 'entire'],
  [/\bprayse\b/gi, 'praise'],
  [/\braise\b/gi, 'raise'],  // keep
  [/\bIechonias\b/g, 'Jechonias'],
  [/\bIoachim\b/g, 'Joachim'],
  [/\bvnlesse\b/gi, 'unless'],
  [/\bvse\b/gi, 'use'], [/\bvsed\b/gi, 'used'],
  [/\bvntill?\b/gi, 'until'],
  [/\bvnder\b/gi, 'under'],
  [/\bvnderstand/gi, 'understand'],
  [/\bvnright/gi, 'unright'],
  [/\bvnwise\b/gi, 'unwise'],
  [/\bvngodly\b/gi, 'ungodly'],
  [/\bvnto\b/gi, 'to'],
  [/\bvnclean/gi, 'unclean'],
  [/\bvnfaithful/gi, 'unfaithful'],
  [/\bvnprofitable/gi, 'unprofitable'],
  [/\bvpon\b/gi, 'upon'],
  [/\bvaine\b/gi, 'vain'], [/\bVaine\b/g, 'Vain'],
  [/\btryed\b/gi, 'tried'],
  [/\breprooueth\b/gi, 'reproves'],
  [/\bmalitious\b/gi, 'malicious'],
  [/\bsixe\b/gi, 'six'],
  [/\bfiftie\b/gi, 'fifty'],
  [/\btwentie\b/gi, 'twenty'],
  [/\bthirtie\b/gi, 'thirty'],
  [/\bfourtie\b/gi, 'forty'],
  [/\bfift\b/gi, 'fifth'],
  [/\bninth\b/gi, 'ninth'],  // keep
  [/\bhundred\b/gi, 'hundred'],  // keep
  [/\bthousande?\b/gi, 'thousand'],

  // Final batch: remaining common archaic words found by scan
  [/\bdowne\b/gi, 'down'], [/\bDowne\b/g, 'Down'],
  [/\bheare\b/gi, 'hear'], [/\bHeare\b/g, 'Hear'],
  [/\bhearing\b/gi, 'hearing'],  // keep
  [/\byong\b/gi, 'young'], [/\bYong\b/g, 'Young'],
  [/\byonger\b/gi, 'younger'],
  [/\bbeare\b/gi, 'bear'], [/\bBeare\b/g, 'Bear'],
  [/\bweare\b/gi, 'wear'],
  [/\bsweare\b/gi, 'swear'],
  [/\bende\b/gi, 'end'], [/\bEnde\b/g, 'End'],
  [/\bsende\b/gi, 'send'], [/\bSende\b/g, 'Send'],
  [/\bbetweene\b/gi, 'between'],
  [/\bmeane\b/gi, 'mean'], [/\bmeanes\b/gi, 'means'],
  [/\bcleane\b/gi, 'clean'], [/\bCleane\b/g, 'Clean'],
  [/\bheere\b/gi, 'here'], [/\bHeere\b/g, 'Here'],
  [/\bworde\b/gi, 'word'], [/\bwordes\b/gi, 'words'],
  [/\bsworde\b/gi, 'sword'], [/\bswordes\b/gi, 'swords'],
  [/\bgrowe\b/gi, 'grow'], [/\bgrowen\b/gi, 'grown'],
  [/\bflowe\b/gi, 'flow'], [/\bflowed\b/gi, 'flowed'],
  [/\bmoueth\b/gi, 'moves'], [/\bmoued\b/gi, 'moved'],
  [/\bremoue/gi, 'remove'], [/\bapproue/gi, 'approve'],
  [/\breproue/gi, 'reprove'], [/\bdiscouer/gi, 'discover'],
  [/\brecouer/gi, 'recover'], [/\bcouer/gi, 'cover'],
  [/\bafore\b/gi, 'before'],
  [/\boft\b/gi, 'often'],
  [/\bstraite?\b/gi, (m) => {
    if (m.toLowerCase() === 'strait' || m.toLowerCase() === 'straite') return 'strait';
    return m;
  }],
  [/\bwherein\b/gi, 'in which'],
  [/\btherein\b/gi, 'in it'],
  [/\bwhereby\b/gi, 'by which'],
  [/\bthereby\b/gi, 'by it'],
  [/\bthereof\b/gi, 'of it'],
  [/\bwhereupon\b/gi, 'upon which'],

  // "aue" → "ave" (gaue→gave, saue→save, leaue→leave, etc.)
  [/\bgaue\b/gi, 'gave'], [/\bGaue\b/g, 'Gave'],
  [/\bleaue\b/gi, 'leave'], [/\bLeaue\b/g, 'Leave'],
  [/\bsaue\b/gi, 'save'], [/\bSaue\b/g, 'Save'],
  [/\bcleaue\b/gi, 'cleave'],
  [/\bwaue\b/gi, 'wave'], [/\bwaues\b/gi, 'waves'],
  [/\bcaue\b/gi, 'cave'], [/\bcaues\b/gi, 'caves'],
  [/\bnaue\b/gi, 'nave'],
  [/\bbehaue\b/gi, 'behave'], [/\bmisbehaue\b/gi, 'misbehave'],
  [/\braue\b/gi, 'rave'],

  // Terminal "-e" on more words
  [/\bcrowne\b/gi, 'crown'], [/\bcrownes\b/gi, 'crowns'],
  [/\bcrowning\b/gi, 'crowning'],  // keep
  [/\browne\b/gi, 'own'],  // already handled but repeat
  [/\brownes\b/gi, 'owns'],
  [/\brenowne\b/gi, 'renown'],
  [/\btowne\b/gi, 'town'], [/\btownes\b/gi, 'towns'],
  [/\bgowne\b/gi, 'gown'],

  // "lfe" → "lf" (halfe→half, wolfe→wolf, etc.)
  [/\bhalfe\b/gi, 'half'],
  [/\bbehalfe\b/gi, 'behalf'],
  [/\bwolfe\b/gi, 'wolf'], [/\bwolues\b/gi, 'wolves'],
  [/\bcalfe\b/gi, 'calf'], [/\bcalues\b/gi, 'calves'],

  // "-ely" → "-ly" where appropriate (truely→truly, but not comely/namely/surely)
  [/\btruely\b/gi, 'truly'],
  [/\bearely\b/gi, 'early'],
  [/\byeerely\b/gi, 'yearly'],
  [/\bfirmely\b/gi, 'firmly'],
  [/\bscarsely\b/gi, 'scarcely'],
  [/\bsubmissely\b/gi, 'submissively'],

  // Terminal "-e" on -our words and numbers
  [/\bfoure\b/gi, 'four'],
  [/\bhoure\b/gi, 'hour'], [/\bhoures\b/gi, 'hours'],
  [/\bfloure\b/gi, 'flour'],
  [/\bdevoure\b/gi, 'devour'], [/\bdevoured\b/gi, 'devoured'],
  [/\bsauour\b/gi, 'savor'],
  [/\bbehauiour\b/gi, 'behavior'],
  [/\berrour\b/gi, 'error'], [/\berrours\b/gi, 'errors'],

  // Final stragglers
  [/\bvs\b/g, 'us'],  // case-sensitive: "vs" but not "Vs"
  [/\bvtter/gi, 'utter'],
  [/\brunne\b/gi, 'run'], [/\brunning\b/gi, 'running'],
  [/\braigne\b/gi, 'reign'], [/\braigned\b/gi, 'reigned'],
  [/\btrueth\b/gi, 'truth'],
  [/\bowne\b/gi, 'own'],
  [/\bwiues\b/gi, 'wives'], [/\bwyues\b/gi, 'wives'],
  [/\bknowne\b/gi, 'known'],
  [/\bwisedom\b/gi, 'wisdom'],
  [/\bshal\b/gi, 'shall'],
  [/\bwil\b/gi, 'will'],
  [/\bstil\b/gi, 'still'],
  [/\bful\b/gi, 'full'],
  [/\btil\b/gi, 'till'],
  [/\bvnlawful/gi, 'unlawful'],
  [/\bvniust/gi, 'unjust'],
  [/\bvnknow/gi, 'unknow'],
  [/\bvnwis/gi, 'unwis'],
  [/\bvnworth/gi, 'unworth'],
  [/\bspake\b/gi, 'spoke'],
  [/\bstake\b/gi, 'stake'],  // keep (different word)
  [/\babode\b/gi, 'abode'],  // keep (valid word)
  [/\bremooved\b/gi, 'removed'],
  [/\bprooue/gi, 'prove'],
  [/\bapprooue/gi, 'approve'],
  [/\breprooue/gi, 'reprove'],
  [/\bimprooue/gi, 'improve'],
  [/\bmooue/gi, 'move'],
  [/\bwhatsoeuer\b/gi, 'whatsoever'],
  [/\bwheresoeuer\b/gi, 'wheresoever'],
  [/\bhowsoeuer\b/gi, 'howsoever'],
  [/\bwhosoeuer\b/gi, 'whosoever'],

  // High-frequency terminal-e words caught by dictionary check
  [/\bfeare\b/gi, 'fear'], [/\bFeare\b/g, 'Fear'],
  [/\bfeared\b/gi, 'feared'],  // keep
  [/\bkeepe\b/gi, 'keep'], [/\bKeepe\b/g, 'Keep'],
  [/\bhelpe\b/gi, 'help'], [/\bHelpe\b/g, 'Help'],
  [/\bspeake\b/gi, 'speak'], [/\bSpeake\b/g, 'Speak'],
  [/\bturne\b/gi, 'turn'], [/\bTurne\b/g, 'Turn'],
  [/\bturned\b/gi, 'turned'],  // keep
  [/\bblesse\b/gi, 'bless'], [/\bBlesse\b/g, 'Bless'],
  [/\beate\b/gi, 'eat'], [/\bEate\b/g, 'Eat'],
  [/\bneere\b/gi, 'near'], [/\bNeere\b/g, 'Near'],
  [/\bchiefe\b/gi, 'chief'], [/\bChiefe\b/g, 'Chief'],
  [/\bpoore\b/gi, 'poor'], [/\bPoore\b/g, 'Poor'],
  [/\bpeace\b/gi, 'peace'],  // keep
  [/\bplease\b/gi, 'please'],  // keep
  [/\bease\b/gi, 'ease'],  // keep
  [/\bdisease\b/gi, 'disease'],  // keep

  // Terminal-e on more words
  [/\bbattell\b/gi, 'battle'], [/\bbattells\b/gi, 'battles'],
  [/\bhoste\b/gi, 'host'], [/\bhostes\b/gi, 'hosts'],
  [/\bmaner\b/gi, 'manner'], [/\bmaners\b/gi, 'manners'],
  [/\bfoorth\b/gi, 'forth'],
  [/\bmountaine\b/gi, 'mountain'], [/\bmountaines\b/gi, 'mountains'],
  [/\bcommandement\b/gi, 'commandment'], [/\bcommandements\b/gi, 'commandments'],
  [/\biudgement\b/gi, 'judgment'], [/\biudgements\b/gi, 'judgments'],
  [/\bjudgement\b/gi, 'judgment'], [/\bjudgements\b/gi, 'judgments'],
  [/\beuerlasting\b/gi, 'everlasting'],
  [/\bknowne\b/gi, 'known'], [/\bknowen\b/gi, 'known'],
  [/\bknowes\b/gi, 'knows'],
  [/\bknowest\b/gi, 'know'],
  [/\bmayest\b/gi, 'may'],
  [/\bcommeth\b/gi, 'comes'],

  // More archaic verb forms
  [/\bleaue\b/gi, 'leave'],  // might duplicate, safe to repeat
  [/\bcease\b/gi, 'cease'],  // keep  
  [/\bincrease\b/gi, 'increase'],  // keep
  [/\brelease\b/gi, 'release'],  // keep
  [/\bprayse\b/gi, 'praise'],
  [/\bsute\b/gi, 'suit'],
  [/\briches\b/gi, 'riches'],  // keep
  [/\btouche\b/gi, 'touch'],
  [/\bwaste\b/gi, 'waste'],  // keep
  [/\bhaste\b/gi, 'haste'],  // keep
  [/\btaste\b/gi, 'taste'],  // keep

  // Remaining u→v words
  [/\bvnhappy\b/gi, 'unhappy'],
  [/\bvnable\b/gi, 'unable'],
  [/\bvnlesse\b/gi, 'unless'],
  [/\bvnder\b/gi, 'under'],
  [/\bvnderstood\b/gi, 'understood'],
  [/\bvnkind\b/gi, 'unkind'],

  // ══ BROAD SYSTEMATIC PATTERNS (catch remaining stragglers) ══

  // All remaining "iu" → "iv" (captiuity→captivity, liueth→liveth→lives, giueth→gives, etc.)
  [/(\w)iu(\w)/g, (m, a, b) => a + 'iv' + b],

  // "oy" → "oi" (voyce→voice, ioyned→joined, reioycing→rejoicing, moysture→moisture)
  [/\bvoyce\b/gi, 'voice'], [/\bvoyces\b/gi, 'voices'],
  [/\bioy\b/gi, 'joy'], [/\bioyned\b/gi, 'joined'], [/\bioyful/gi, 'joyful'],
  [/\breioyce/gi, 'rejoice'], [/\breioycing/gi, 'rejoicing'],
  [/\bannoy/gi, 'annoy'], [/\bdestroy/gi, 'destroy'], // keep - already correct
  [/\bmoysture\b/gi, 'moisture'],
  [/\bchoyce\b/gi, 'choice'],
  [/\bnoyse\b/gi, 'noise'],
  [/\bpoyson/gi, 'poison'],

  // Broad terminal "-e" removal on common patterns
  [/\b(\w{3,})olde\b/gi, (m, p) => p + 'old'],  // golde→gold, bolde→bold, tolde→told
  [/\bgolde\b/gi, 'gold'], [/\bolde\b/gi, 'old'],
  [/\bbolde\b/gi, 'bold'], [/\btolde\b/gi, 'told'], [/\bholde\b/gi, 'hold'],
  [/\bcolde\b/gi, 'cold'], [/\bfolde\b/gi, 'fold'], [/\bsolde\b/gi, 'sold'],
  [/\bdepe\b/gi, 'deep'], [/\bdeepe\b/gi, 'deep'],
  [/\bsleepe\b/gi, 'sleep'], [/\baslepe\b/gi, 'asleep'],
  [/\bkeepe\b/gi, 'keep'],  // repeat is safe
  [/\bweake\b/gi, 'weak'],
  [/\bspeake\b/gi, 'speak'],
  [/\bmeate\b/gi, 'meat'],
  [/\bseate\b/gi, 'seat'],
  [/\bheate\b/gi, 'heat'],
  [/\bbeate\b/gi, 'beat'],
  [/\bgreate\b/gi, 'great'],
  [/\bdoore\b/gi, 'door'], [/\bdoores\b/gi, 'doors'],
  [/\bfoole\b/gi, 'fool'], [/\bfooles\b/gi, 'fools'],
  [/\bfoolish/gi, 'foolish'],  // keep
  [/\bpoole\b/gi, 'pool'],
  [/\bwooll?\b/gi, 'wool'],
  [/\bbacke\b/gi, 'back'],
  [/\bnecke\b/gi, 'neck'],
  [/\blocke\b/gi, 'lock'],
  [/\bstocke\b/gi, 'stock'], [/\bstockes\b/gi, 'stocks'],
  [/\blockes\b/gi, 'locks'],
  [/\brocke\b/gi, 'rock'], [/\brockes\b/gi, 'rocks'],
  [/\bmocke\b/gi, 'mock'],
  [/\bwombe\b/gi, 'womb'],
  [/\btombe\b/gi, 'tomb'],
  [/\bclimbe\b/gi, 'climb'],
  [/\blimbe\b/gi, 'limb'], [/\blimbes\b/gi, 'limbs'],
  [/\beare\b/gi, 'ear'], [/\beares\b/gi, 'ears'],
  [/\bteare\b/gi, 'tear'], [/\bteares\b/gi, 'tears'],
  [/\bfaire\b/gi, 'fair'],
  [/\bpaire\b/gi, 'pair'],
  [/\brepaire\b/gi, 'repair'],
  [/\baffaire\b/gi, 'affair'], [/\baffaires\b/gi, 'affairs'],
  [/\btalke\b/gi, 'talk'], [/\bwalke\b/gi, 'walk'],
  [/\bstalke\b/gi, 'stalk'],
  [/\bburne\b/gi, 'burn'], [/\bburnt\b/gi, 'burnt'],  // keep burnt
  [/\bturne\b/gi, 'turn'],  // repeat
  [/\breturne\b/gi, 'return'],
  [/\blearned\b/gi, 'learned'],  // keep
  [/\blearne\b/gi, 'learn'],
  [/\bconcerne\b/gi, 'concern'],
  [/\bdiscerne\b/gi, 'discern'],
  [/\bstarres\b/gi, 'stars'], [/\bstarre\b/gi, 'star'],
  [/\bwarres\b/gi, 'wars'],
  [/\berres\b/gi, 'errs'],
  [/\bsignes\b/gi, 'signs'], [/\bsigne\b/gi, 'sign'],
  [/\bdesigne\b/gi, 'design'],
  [/\blawes\b/gi, 'laws'], [/\blawe\b/gi, 'law'],
  [/\bfeete\b/gi, 'feet'],
  [/\bsweete\b/gi, 'sweet'],
  [/\bfleete\b/gi, 'fleet'],
  [/\bsheete\b/gi, 'sheet'],
  [/\bstreete\b/gi, 'street'], [/\bstreetes\b/gi, 'streets'],
  [/\bappeare\b/gi, 'appear'],
  [/\baske\b/gi, 'ask'], [/\basked\b/gi, 'asked'],
  [/\btaske\b/gi, 'task'],
  [/\blesse\b/gi, 'less'],
  [/\banswere\b/gi, 'answer'], [/\banswered\b/gi, 'answered'],
  [/\bwaite\b/gi, 'wait'],
  [/\bspoile\b/gi, 'spoil'], [/\bspoiles\b/gi, 'spoils'],
  [/\btoile\b/gi, 'toil'],
  [/\bneede\b/gi, 'need'],
  [/\bdeede\b/gi, 'deed'], [/\bdeedes\b/gi, 'deeds'],
  [/\bseede\b/gi, 'seed'],
  [/\bspeede\b/gi, 'speed'],
  [/\bgreede\b/gi, 'greed'],
  [/\bharme\b/gi, 'harm'],
  [/\bcharme\b/gi, 'charm'],
  [/\balarme\b/gi, 'alarm'],
  [/\barme\b/gi, 'arm'], [/\barmes\b/gi, 'arms'],
  [/\bgriefe\b/gi, 'grief'],
  [/\bchiefe\b/gi, 'chief'],
  [/\bbeliefe\b/gi, 'belief'],
  [/\breliefe\b/gi, 'relief'],
  [/\bmischiefe\b/gi, 'mischief'],
  [/\btheefe\b/gi, 'thief'], [/\btheeues\b/gi, 'thieves'],
  [/\bbehinde\b/gi, 'behind'],
  [/\bmaide\b/gi, 'maid'], [/\bmaides\b/gi, 'maids'],

  // Double letters and other patterns
  [/\bcattell\b/gi, 'cattle'],
  [/\blitle\b/gi, 'little'],
  [/\btitle\b/gi, 'title'],  // keep
  [/\bbottell\b/gi, 'bottle'],
  [/\bvessell\b/gi, 'vessel'], [/\bvessells\b/gi, 'vessels'],
  [/\bcounsell\b/gi, 'counsel'],
  [/\bfellowe\b/gi, 'fellow'],
  [/\bfollowe\b/gi, 'follow'],
  [/\bhollowe\b/gi, 'hollow'],
  [/\bswallowe\b/gi, 'swallow'],
  [/\bmemoriall\b/gi, 'memorial'],
  [/\bspeciall\b/gi, 'special'],
  [/\bespeciall\b/gi, 'especial'],
  [/\bmarueilous\b/gi, 'marvelous'],
  [/\bmaruell/gi, 'marvel'],
  [/\btowre\b/gi, 'tower'], [/\btowres\b/gi, 'towers'],
  [/\bpowre\b/gi, 'pour'],

  // Misc remaining archaic
  [/\breproch\b/gi, 'reproach'],
  [/\bfourty\b/gi, 'forty'],
  [/\bhundreth\b/gi, 'hundred'],
  [/\btwelue\b/gi, 'twelve'],
  [/\beleuen\b/gi, 'eleven'],
  [/\btherfore\b/gi, 'therefore'],
  [/\bsoone\b/gi, 'soon'], [/\bassoone\b/gi, 'as soon'],
  [/\bentred\b/gi, 'entered'],
  [/\bheauiness\b/gi, 'heaviness'], [/\bheauy\b/gi, 'heavy'],
  [/\bkinred\b/gi, 'kindred'],
  [/\bdarkeness\b/gi, 'darkness'],
  [/\bsaluation\b/gi, 'salvation'],
  [/\brealme\b/gi, 'realm'],
  [/\bfaile\b/gi, 'fail'],
  [/\bremembred\b/gi, 'remembered'],
  [/\bscorne\b/gi, 'scorn'],
  [/\bconuenient\b/gi, 'convenient'],
  [/\balwayes\b/gi, 'always'],
  [/\bfoules\b/gi, 'fowls'], [/\bfoule\b/gi, 'fowl'],
  [/\bsuccesse\b/gi, 'success'],
  [/\baduersari/gi, 'adversari'],
  [/\bthankes\b/gi, 'thanks'],
  [/\bfortresse\b/gi, 'fortress'],
  [/\bhelde\b/gi, 'held'],
  [/\bbeganne\b/gi, 'began'],
  [/\bslewe\b/gi, 'slew'],
  [/\bpaines\b/gi, 'pains'], [/\bpaine\b/gi, 'pain'],
  [/\bgaine\b/gi, 'gain'],
  [/\bvaine\b/gi, 'vain'],
  [/\bplaine\b/gi, 'plain'],
  [/\bworshipped\b/gi, 'worshiped'],  // modern: single p
  [/\bouercome\b/gi, 'overcome'],
  [/\bouerthrowen\b/gi, 'overthrown'],
  [/\bouerthrow\b/gi, 'overthrow'],
  [/\bmooved\b/gi, 'moved'],
  [/\bsawe\b/gi, 'saw'],
  [/\bstrawe\b/gi, 'straw'],
  [/\bdrawe\b/gi, 'draw'],
  [/\bwithdrawe\b/gi, 'withdraw'],
  [/\blieth\b/gi, 'lies'],
  [/\bdieth\b/gi, 'dies'],
  [/\bcrieth\b/gi, 'cries'],
  [/\bloueth\b/gi, 'loves'],
  [/\bseruice\b/gi, 'service'],
  [/\bserue\b/gi, 'serve'],
  [/\bpreserue\b/gi, 'preserve'],
  [/\bobserue\b/gi, 'observe'],
  [/\bdeserue\b/gi, 'deserve'],
  [/\bconserue\b/gi, 'conserve'],

  // ══ BATCH 3: from dictionary scan ══
  [/\bsaued\b/gi, 'saved'],
  [/\beuils\b/gi, 'evils'],
  [/\bmourne\b/gi, 'mourn'], [/\bmourning\b/gi, 'mourning'],
  [/\bhonourably\b/gi, 'honorably'],
  [/\buniust\b/gi, 'unjust'], [/\bvniust\b/gi, 'unjust'],
  [/\bidoles\b/gi, 'idols'], [/\bidole\b/gi, 'idol'],
  [/\bfourescore\b/gi, 'fourscore'],
  [/\bcustome\b/gi, 'custom'], [/\bcustomes\b/gi, 'customs'],
  [/\btransgresse\b/gi, 'transgress'],
  [/\bperpetuall\b/gi, 'perpetual'],
  [/\byron\b/gi, 'iron'],
  [/\bhadst\b/gi, 'had'],
  [/\bwithall\b/gi, 'with all'],
  [/\bseeth\b/gi, 'sees'],
  [/\bdwel\b/gi, 'dwell'],
  [/\bdreames\b/gi, 'dreams'], [/\bdreame\b/gi, 'dream'],
  [/\blayd\b/gi, 'laid'],
  [/\branne\b/gi, 'ran'],
  [/\bpowred\b/gi, 'poured'],
  [/\bfeareful\b/gi, 'fearful'],
  [/\bmaiesty\b/gi, 'majesty'], [/\bMaiesty\b/g, 'Majesty'],
  [/\bdistresse\b/gi, 'distress'],
  [/\bholdeth\b/gi, 'holds'],
  [/\btriall\b/gi, 'trial'],
  [/\bsicke\b/gi, 'sick'],
  [/\bwaxe\b/gi, 'wax'], [/\bwaxed\b/gi, 'waxed'],
  [/\bmarueiled\b/gi, 'marveled'],
  [/\bgivest\b/gi, 'give'],
  [/\bbreaketh\b/gi, 'breaks'],
  [/\bserued\b/gi, 'served'],
  [/\bdeale\b/gi, 'deal'],
  [/\bvertue\b/gi, 'virtue'], [/\bvertuous\b/gi, 'virtuous'],
  [/\bpurposed\b/gi, 'purposed'],  // keep — valid
  [/\boffence\b/gi, 'offense'],
  [/\bforsook\b/gi, 'forsook'],  // keep — valid
  [/\believed\b/gi, 'believed'],  // keep — valid
  [/\bescaped\b/gi, 'escaped'],  // keep — valid

  // More terminal -e patterns
  [/\bspoake\b/gi, 'spoke'],
  [/\bbroake\b/gi, 'broke'],
  [/\bstroake\b/gi, 'stroke'],
  [/\bcloake\b/gi, 'cloak'],
  [/\bsmoake\b/gi, 'smoke'],
  [/\bchoake\b/gi, 'choke'],
  [/\byoake\b/gi, 'yoke'],
  [/\bdarte\b/gi, 'dart'],
  [/\bharte\b/gi, 'hart'],
  [/\bparte\b/gi, 'part'], [/\bpartes\b/gi, 'parts'],
  [/\bdeparted\b/gi, 'departed'],  // keep
  [/\bwarre\b/gi, 'war'],
  [/\btenne\b/gi, 'ten'],
  [/\bmenne\b/gi, 'men'],
  [/\bsinne\b/gi, 'sin'], [/\bsinnes\b/gi, 'sins'], [/\bsinners\b/gi, 'sinners'],
  [/\bdinne\b/gi, 'din'],
  [/\binne\b/gi, 'inn'],
  [/\bwinne\b/gi, 'win'],
  [/\bbeganne\b/gi, 'began'],

  // More -eth verbs
  [/\bleadeth\b/gi, 'leads'], [/\bfeedeth\b/gi, 'feeds'],
  [/\bneedeth\b/gi, 'needs'], [/\bproceedeth\b/gi, 'proceeds'],
  [/\bexceedeth\b/gi, 'exceeds'], [/\bsucceedeth\b/gi, 'succeeds'],
  [/\bpleaseth\b/gi, 'pleases'], [/\bceaseth\b/gi, 'ceases'],
  [/\bincreaseth\b/gi, 'increases'], [/\breleaseth\b/gi, 'releases'],
  [/\bjudgeth\b/gi, 'judges'], [/\brejoiceth\b/gi, 'rejoices'],
  [/\bhateth\b/gi, 'hates'], [/\bloveth\b/gi, 'loves'],
  [/\bgiveth\b/gi, 'gives'], [/\bliveth\b/gi, 'lives'],
  [/\bdwelleth\b/gi, 'dwells'], [/\btelleth\b/gi, 'tells'],
  [/\bfelleth\b/gi, 'fells'], [/\bselleth\b/gi, 'sells'],
  [/\bsmelleth\b/gi, 'smells'], [/\bwelleth\b/gi, 'wells'],
  [/\bspreadeth\b/gi, 'spreads'], [/\breadeth\b/gi, 'reads'],
  [/\bworketh\b/gi, 'works'], [/\bmarketh\b/gi, 'marks'],
  [/\bwalketh\b/gi, 'walks'], [/\btalketh\b/gi, 'talks'],
  [/\bruleth\b/gi, 'rules'], [/\bpulleth\b/gi, 'pulls'],
  [/\bhelpeth\b/gi, 'helps'], [/\bfeeleth\b/gi, 'feels'],
  [/\bhealeth\b/gi, 'heals'], [/\bdealeth\b/gi, 'deals'],
  [/\bstealeth\b/gi, 'steals'], [/\brevealeth\b/gi, 'reveals'],
  [/\bcalleth\b/gi, 'calls'], [/\bfalleth\b/gi, 'falls'],
  [/\bkilleth\b/gi, 'kills'], [/\bfilleth\b/gi, 'fills'],
  [/\bwilleth\b/gi, 'wills'], [/\bstilleth\b/gi, 'stills'],
  [/\blooketh\b/gi, 'looks'], [/\bcooketh\b/gi, 'cooks'],
  [/\bsitteth\b/gi, 'sits'], [/\bhitteth\b/gi, 'hits'],
  [/\bputteth\b/gi, 'puts'], [/\bcutteth\b/gi, 'cuts'],
  [/\bruneth\b/gi, 'runs'], [/\bturneth\b/gi, 'turns'],
  [/\bburneth\b/gi, 'burns'], [/\blearneth\b/gi, 'learns'],
  [/\bcovereth\b/gi, 'covers'], [/\bdiscovereth\b/gi, 'discovers'],
  [/\boffereth\b/gi, 'offers'], [/\bsuffereth\b/gi, 'suffers'],
  [/\bdelivereth\b/gi, 'delivers'], [/\banswereth\b/gi, 'answers'],
  [/\bremembereth\b/gi, 'remembers'], [/\bgathereth\b/gi, 'gathers'],
  [/\bwandereth\b/gi, 'wanders'], [/\bpondereth\b/gi, 'ponders'],
  [/\bthundereth\b/gi, 'thunders'], [/\bwondereth\b/gi, 'wonders'],
  [/\bconsidereth\b/gi, 'considers'],
  [/\bslayeth\b/gi, 'slays'], [/\bprayeth\b/gi, 'prays'],
  [/\bsayeth\b/gi, 'says'], [/\bplayeth\b/gi, 'plays'],
  [/\bpayeth\b/gi, 'pays'], [/\blayeth\b/gi, 'lays'],
  [/\bstayeth\b/gi, 'stays'],
  [/\bblesseth\b/gi, 'blesses'], [/\bpossesseth\b/gi, 'possesses'],
  [/\bpasseth\b/gi, 'passes'], [/\bconfesseth\b/gi, 'confesses'],
  [/\bwisheth\b/gi, 'wishes'], [/\bfinisheth\b/gi, 'finishes'],
  [/\bpunisheth\b/gi, 'punishes'], [/\bnourisheth\b/gi, 'nourishes'],
  [/\bperisheth\b/gi, 'perishes'], [/\bcherisheth\b/gi, 'cherishes'],
  [/\bflourisheth\b/gi, 'flourishes'],
  [/\bdestroyeth\b/gi, 'destroys'], [/\benjoyeth\b/gi, 'enjoys'],
  [/\bemployeth\b/gi, 'employs'],
  [/\bknoweth\b/gi, 'knows'], [/\bshoweth\b/gi, 'shows'],
  [/\bfolloweth\b/gi, 'follows'], [/\bborroweth\b/gi, 'borrows'],
  [/\bsoweth\b/gi, 'sows'], [/\bgroweth\b/gi, 'grows'],
  [/\bfloweth\b/gi, 'flows'],
  [/\bheareth\b/gi, 'hears'], [/\bappeareth\b/gi, 'appears'],
  [/\bcleareth\b/gi, 'clears'], [/\bsweareth\b/gi, 'swears'],
  [/\bbeareth\b/gi, 'bears'], [/\bweareth\b/gi, 'wears'],
  [/\bseeketh\b/gi, 'seeks'], [/\bspeaketh\b/gi, 'speaks'],
  [/\bthinketh\b/gi, 'thinks'], [/\bdrinketh\b/gi, 'drinks'],
  [/\breigneth\b/gi, 'reigns'], [/\bfeigneth\b/gi, 'feigns'],
  [/\bcleaveth\b/gi, 'cleaves'], [/\bleaveth\b/gi, 'leaves'],
  [/\bweigheth\b/gi, 'weighs'],
  [/\bbelongeth\b/gi, 'belongs'], [/\bprolongeth\b/gi, 'prolongs'],
  [/\bteacheth\b/gi, 'teaches'], [/\breacheth\b/gi, 'reaches'],
  [/\bpreacheth\b/gi, 'preaches'],
  [/\bthroweth\b/gi, 'throws'], [/\bbloweth\b/gi, 'blows'],
  [/\bploweth\b/gi, 'plows'],
  [/\bstandeth\b/gi, 'stands'], [/\bcommandeth\b/gi, 'commands'],
  [/\bexpandeth\b/gi, 'expands'],
  [/\bsendeth\b/gi, 'sends'], [/\blendeth\b/gi, 'lends'],
  [/\bbendeth\b/gi, 'bends'], [/\brendeth\b/gi, 'rends'],
  [/\bfindeth\b/gi, 'finds'], [/\bbindeth\b/gi, 'binds'],
  [/\bwindeth\b/gi, 'winds'],
  [/\bkeepeth\b/gi, 'keeps'], [/\bweepeth\b/gi, 'weeps'],
  [/\bsleepeth\b/gi, 'sleeps'],
  [/\bdeparteth\b/gi, 'departs'],
  [/\bexalteth\b/gi, 'exalts'],
  [/\binsulteth\b/gi, 'insults'],
  [/\bwanteth\b/gi, 'wants'], [/\bplanteth\b/gi, 'plants'],
  [/\bgranteth\b/gi, 'grants'],
  [/\blifteth\b/gi, 'lifts'], [/\bgifteth\b/gi, 'gifts'],
  [/\bshifteth\b/gi, 'shifts'],
  [/\bsetteth\b/gi, 'sets'], [/\bgetteth\b/gi, 'gets'],
  [/\bletteth\b/gi, 'lets'],
  [/\bcasteth\b/gi, 'casts'], [/\blasteth\b/gi, 'lasts'],
  [/\bfasteth\b/gi, 'fasts'],
  [/\btesteth\b/gi, 'tests'], [/\bresteth\b/gi, 'rests'],
  [/\btrusteth\b/gi, 'trusts'],
  [/\blisteth\b/gi, 'lists'],
  [/\bboasteth\b/gi, 'boasts'],
  [/\broasteth\b/gi, 'roasts'],
  [/\bgiveth\b/gi, 'gives'],

  // ══ BATCH 4: long-tail archaic ══
  [/\bprincipall\b/gi, 'principal'],
  [/\bimmediatly\b/gi, 'immediately'],
  [/\bthankes?giuing\b/gi, 'thanksgiving'],
  [/\bthorow\b/gi, 'through'],
  [/\bdiddest\b/gi, 'did'],
  [/\bmariage\b/gi, 'marriage'],
  [/\bmeete\b/gi, 'meet'],
  [/\bprouision\b/gi, 'provision'],
  [/\bbreake\b/gi, 'break'],
  [/\bgarison\b/gi, 'garrison'],
  [/\bdarke\b/gi, 'dark'],
  [/\baduersity\b/gi, 'adversity'],
  [/\bdishonour\b/gi, 'dishonor'],
  [/\breuerence\b/gi, 'reverence'],
  [/\binherite\b/gi, 'inherit'],
  [/\badde\b/gi, 'add'],
  [/\bordeined\b/gi, 'ordained'],
  [/\btary\b/gi, 'tarry'],
  [/\bcheereful\b/gi, 'cheerful'],
  [/\bweepe\b/gi, 'weep'],
  [/\bflie\b/gi, 'fly'],
  [/\benuious\b/gi, 'envious'],
  [/\bhidde\b/gi, 'hid'],
  [/\bmarke\b/gi, 'mark'],
  [/\bballance\b/gi, 'balance'],
  [/\bdiligentl/gi, 'diligentl'],  // keep (diligently valid)
  [/\bsecretl/gi, 'secretl'],  // keep
  [/\bcouenan/gi, 'covenan'],
  [/\bgouerment\b/gi, 'government'],
  [/\bgouernou?rs?\b/gi, 'governor'],
  [/\bprouoke/gi, 'provoke'],
  [/\bprouide/gi, 'provide'],
  [/\bapproue/gi, 'approve'],
  [/\bimproue/gi, 'improve'],
  [/\bremoue/gi, 'remove'],
  [/\bmoue\b/gi, 'move'],
  [/\baboundance\b/gi, 'abundance'],
  [/\bpleasure\b/gi, 'pleasure'],  // keep
  [/\bmeasure\b/gi, 'measure'],  // keep
  [/\btreasure\b/gi, 'treasure'],  // keep
  [/\bleisure\b/gi, 'leisure'],  // keep
  [/\bcreature\b/gi, 'creature'],  // keep
  [/\bnature\b/gi, 'nature'],  // keep
  [/\bstature\b/gi, 'stature'],  // keep
  [/\bpasture\b/gi, 'pasture'],  // keep
  [/\biealous/gi, 'jealous'],
  [/\bieopard/gi, 'jeopard'],
  [/\bprayse\b/gi, 'praise'],
  [/\brayse\b/gi, 'raise'],
  [/\bdayly\b/gi, 'daily'],
  [/\bgaynes\b/gi, 'gains'],
  [/\bplayne\b/gi, 'plain'],
  [/\bstraunge/gi, 'strange'],
  [/\bdaunger/gi, 'danger'],
  [/\bchaunge/gi, 'change'],
  [/\breuenge/gi, 'revenge'],
  [/\bchalenge/gi, 'challenge'],
  [/\bsacrile/gi, 'sacrile'],  // keep sacrilege
  [/\bpriuiledge/gi, 'privilege'],
  [/\backnowledg/gi, 'acknowledg'],  // keep
  [/\bknowledg\b/gi, 'knowledge'],
  [/\biudg/gi, 'judg'],
  [/\benioyed/gi, 'enjoyed'],
  [/\benioy\b/gi, 'enjoy'],
  [/\biniury/gi, 'injury'],
  [/\biniustice/gi, 'injustice'],
  [/\bioine/gi, 'joine'],
  [/\bioyne/gi, 'joine'],

  // ══ BATCH 5: final long-tail ══
  [/\bhony\b/gi, 'honey'],
  [/\bconfirme\b/gi, 'confirm'],
  [/\bsackecloth\b/gi, 'sackcloth'],
  [/\bflowre\b/gi, 'flower'], [/\bflowres\b/gi, 'flowers'],
  [/\bloude\b/gi, 'loud'],
  [/\bstorme\b/gi, 'storm'], [/\bstormes\b/gi, 'storms'],
  [/\bcrie\b/gi, 'cry'], [/\bcries\b/gi, 'cries'],
  [/\bcloudes\b/gi, 'clouds'], [/\bcloude\b/gi, 'cloud'],
  [/\bsorow\b/gi, 'sorrow'], [/\bsorowes\b/gi, 'sorrows'],
  [/\bmortall\b/gi, 'mortal'],
  [/\bwherin\b/gi, 'in which'],
  [/\bwherof\b/gi, 'of which'],
  [/\bchambre\b/gi, 'chamber'],
  [/\bremaine\b/gi, 'remain'],
  [/\bordaine\b/gi, 'ordain'],
  [/\battaine\b/gi, 'attain'],
  [/\brestraine\b/gi, 'restrain'],
  [/\bdisdaine\b/gi, 'disdain'],
  [/\bcomplaine\b/gi, 'complain'],
  [/\bexplaine\b/gi, 'explain'],
  [/\brefraine\b/gi, 'refrain'],
  [/\bcontaine\b/gi, 'contain'],
  [/\bentertainm/gi, 'entertainm'],
  [/\bperswade/gi, 'persuade'],
  [/\bforsake\b/gi, 'forsake'],  // keep
  [/\boccasion\b/gi, 'occasion'],  // keep
  [/\breckon\b/gi, 'reckon'],  // keep
  [/\baboundance\b/gi, 'abundance'],
  [/\btribunal\b/gi, 'tribunal'],  // keep
  [/\btradition\b/gi, 'tradition'],  // keep
  [/\bsepulchre\b/gi, 'sepulcher'],
  [/\bsceptre\b/gi, 'scepter'],
  [/\bcentre\b/gi, 'center'],
  [/\btheatre\b/gi, 'theater'],
  [/\bministre\b/gi, 'minister'],
  [/\binquire\b/gi, 'inquire'],  // keep
  [/\brequire\b/gi, 'require'],  // keep
  [/\bentire\b/gi, 'entire'],  // keep
  [/\bdesire\b/gi, 'desire'],  // keep

  // ══ BATCH 6: thou/art verb agreement + broad suffix patterns ══

  // "art" → "are" (thou art → you are). Must run AFTER thou→you replacement.
  [/\bart\b/gi, (m) => m[0] === 'A' ? 'Are' : 'are'],

  // "wast" → "were", "wert" → "were" (thou wast/wert → you were)
  [/\bwast\b/gi, (m) => m[0] === 'W' ? 'Were' : 'were'],
  [/\bwert\b/gi, (m) => m[0] === 'W' ? 'Were' : 'were'],

  // "didst" → "did"
  [/\bdidst\b/gi, 'did'],
  [/\bwouldst\b/gi, 'would'],
  [/\bcouldst\b/gi, 'could'],

  // ══ COMPREHENSIVE remaining archaic words (from dictionary scan, 3+ occurrences) ══
  
  // Remaining u→v and v→u
  [/\buniust/gi, 'unjust'], [/\buniustl/gi, 'unjustl'],
  [/\bconuers/gi, 'convers'], [/\bsubiect/gi, 'subject'], [/\bsubiection/gi, 'subjection'],
  [/\breuolt/gi, 'revolt'], [/\baueng/gi, 'aveng'], [/\binuad/gi, 'invad'],
  [/\binuent/gi, 'invent'], [/\binuincib/gi, 'invincib'],
  [/\bconuey/gi, 'convey'], [/\bprouinc/gi, 'provinc'],
  [/\bvses\b/gi, 'uses'], [/\bvseth\b/gi, 'uses'],
  [/\bdeuice/gi, 'device'], [/\bvtmost\b/gi, 'utmost'],
  [/\bvowe\b/gi, 'vow'], [/\bvalour\b/gi, 'valor'],
  [/\bauthore?\b/gi, 'author'], [/\btraitour\b/gi, 'traitor'],
  [/\bcouragious/gi, 'courageous'],

  // Terminal -e words (massive batch)
  [/\blambes\b/gi, 'lambs'], [/\blambe\b/gi, 'lamb'],
  [/\bsheepe\b/gi, 'sheep'],
  [/\brammes\b/gi, 'rams'], [/\bramme\b/gi, 'ram'],
  [/\blippes\b/gi, 'lips'], [/\blippe\b/gi, 'lip'],
  [/\bwormes\b/gi, 'worms'], [/\bworme\b/gi, 'worm'],
  [/\bslacke\b/gi, 'slack'],
  [/\bwilde\b/gi, 'wild'],
  [/\bmeates\b/gi, 'meats'],
  [/\buncleane\b/gi, 'unclean'],
  [/\boppresse\b/gi, 'oppress'],
  [/\bgrauen\b/gi, 'graven'],
  [/\bsolemne\b/gi, 'solemn'],
  [/\bbarres\b/gi, 'bars'], [/\bbarre\b/gi, 'bar'],
  [/\bcompasse\b/gi, 'compass'],
  [/\bcondemne\b/gi, 'condemn'], [/\bcondemned\b/gi, 'condemned'],
  [/\bwindes\b/gi, 'winds'],
  [/\bwhome\b/gi, 'whom'],
  [/\bfledde\b/gi, 'fled'],
  [/\baray\b/gi, 'array'], [/\barayed\b/gi, 'arrayed'],
  [/\bmiddest\b/gi, 'midst'],
  [/\bcruell\b/gi, 'cruel'],
  [/\blowd\b/gi, 'loud'],
  [/\bwals\b/gi, 'walls'],
  [/\bnumbred\b/gi, 'numbered'],
  [/\bheape\b/gi, 'heap'], [/\bheapes\b/gi, 'heaps'],
  [/\bspeach\b/gi, 'speech'], [/\bspeaches\b/gi, 'speeches'],
  [/\bconfesse\b/gi, 'confess'],
  [/\bstedfast\b/gi, 'steadfast'],
  [/\bworkemanship\b/gi, 'workmanship'],
  [/\bworkeman\b/gi, 'workman'],
  [/\bleade\b/gi, 'lead'],
  [/\bpalme\b/gi, 'palm'], [/\bpalmes\b/gi, 'palms'],
  [/\bshepheard\b/gi, 'shepherd'], [/\bshepheards\b/gi, 'shepherds'],
  [/\bflocke\b/gi, 'flock'], [/\bflockes\b/gi, 'flocks'],
  [/\bsmal\b/gi, 'small'],
  [/\bcleare\b/gi, 'clear'],
  [/\bcandlesticke\b/gi, 'candlestick'],
  [/\bfeele\b/gi, 'feel'],
  [/\bdrunke\b/gi, 'drunk'],
  [/\bcorne\b/gi, 'corn'],
  [/\bothe\b/gi, 'oath'], [/\boathes\b/gi, 'oaths'],
  [/\bafraide\b/gi, 'afraid'],
  [/\bfountaines\b/gi, 'fountains'],
  [/\bapparell\b/gi, 'apparel'],
  [/\bnewe\b/gi, 'new'],
  [/\bselues\b/gi, 'selves'],
  [/\binuade\b/gi, 'invade'],
  [/\bfewe\b/gi, 'few'],
  [/\bholdes\b/gi, 'holds'],
  [/\bcounseller\b/gi, 'counselor'],
  [/\bamisse\b/gi, 'amiss'],
  [/\bpossesse\b/gi, 'possess'],
  [/\bsparke\b/gi, 'spark'], [/\bsparkes\b/gi, 'sparks'],
  [/\brecompence\b/gi, 'recompense'],
  [/\berre\b/gi, 'err'],
  [/\bmarueile\b/gi, 'marvel'],
  [/\breveale\b/gi, 'reveal'],
  [/\bhindred\b/gi, 'hindered'],
  [/\bvapour\b/gi, 'vapor'],
  [/\btrauailed\b/gi, 'labored'],
  [/\bwidowes\b/gi, 'widows'],
  [/\bpublike\b/gi, 'public'],
  [/\brenowmed\b/gi, 'renowned'],
  [/\bmilke\b/gi, 'milk'],
  [/\bhaile\b/gi, 'hail'], [/\bhailestones\b/gi, 'hailstones'],
  [/\bresolued\b/gi, 'resolved'],
  [/\bgrasse\b/gi, 'grass'],
  [/\bwhoredome\b/gi, 'whoredom'],
  [/\bbeames\b/gi, 'beams'],
  [/\bsharpe\b/gi, 'sharp'],
  [/\bbrestplate\b/gi, 'breastplate'],
  [/\bsaile\b/gi, 'sail'],
  [/\bsumme\b/gi, 'sum'],
  [/\bzeale\b/gi, 'zeal'],
  [/\bhorne\b/gi, 'horn'], [/\bhornes\b/gi, 'horns'],
  [/\barte\b/gi, 'art'],  // the noun, not the verb (verb handled separately)
  [/\bsuccour\b/gi, 'succor'],
  [/\btrie\b/gi, 'try'],
  [/\bsworne\b/gi, 'sworn'],
  [/\bpathes\b/gi, 'paths'],
  [/\bfootemen\b/gi, 'footmen'],
  [/\byeeld\b/gi, 'yield'],
  [/\bhilles\b/gi, 'hills'], [/\bhils\b/gi, 'hills'],
  [/\bslaues\b/gi, 'slaves'],
  [/\bgainesay\b/gi, 'gainsay'],
  [/\bstuffe\b/gi, 'stuff'],
  [/\bledde\b/gi, 'led'],
  [/\bouen\b/gi, 'oven'],
  [/\bfornace\b/gi, 'furnace'],
  [/\bfellowes\b/gi, 'fellows'],
  [/\bkinreds\b/gi, 'kindreds'],
  [/\bgladnes\b/gi, 'gladness'],
  [/\bhorsmen\b/gi, 'horsemen'],
  [/\bcolour\b/gi, 'color'],
  [/\bperill\b/gi, 'peril'],
  [/\bengins\b/gi, 'engines'],
  [/\bfortresses\b/gi, 'fortresses'],  // keep
  [/\bfoorthwith\b/gi, 'forthwith'],
  [/\bheede\b/gi, 'heed'],
  [/\bcheereful/gi, 'cheerful'],
  [/\bmeeke\b/gi, 'meek'], [/\bmeekeness\b/gi, 'meekness'],
  [/\bdeferre\b/gi, 'defer'],
  [/\bthiefe\b/gi, 'thief'], [/\btheeues\b/gi, 'thieves'],
  [/\bleaues\b/gi, 'leaves'],
  [/\breape\b/gi, 'reap'],
  [/\bperuerted\b/gi, 'perverted'],
  [/\bcoales\b/gi, 'coals'],
  [/\bbosome\b/gi, 'bosom'],
  [/\bbeastes\b/gi, 'beasts'],
  [/\bsinnful\b/gi, 'sinful'],
  [/\babhorre\b/gi, 'abhor'],
  [/\bmischieuous\b/gi, 'mischievous'],
  [/\bdogge\b/gi, 'dog'],
  [/\bthicke\b/gi, 'thick'],
  [/\bperforme\b/gi, 'perform'],
  [/\bprophane\b/gi, 'profane'], [/\bprophaned\b/gi, 'profaned'],
  [/\bvirgine\b/gi, 'virgin'],
  [/\blosse\b/gi, 'loss'],
  [/\bthanke\b/gi, 'thank'], [/\bthankes\b/gi, 'thanks'],
  [/\bthankesgiving\b/gi, 'thanksgiving'],
  [/\breiected\b/gi, 'rejected'],
  [/\bslouthful\b/gi, 'slothful'],
  [/\bheire\b/gi, 'heir'],
  [/\bseale\b/gi, 'seal'], [/\bseales\b/gi, 'seals'],
  [/\bgraunt\b/gi, 'grant'],
  [/\bharuest\b/gi, 'harvest'],
  [/\bbedde\b/gi, 'bed'],
  [/\bthornes\b/gi, 'thorns'],
  [/\bspeare\b/gi, 'spear'],
  [/\bsickeness\b/gi, 'sickness'],
  [/\bquicke\b/gi, 'quick'],
  [/\btwise\b/gi, 'twice'],
  [/\bintreate\b/gi, 'entreat'],
  [/\bvoyd\b/gi, 'void'],
  [/\bexpresse\b/gi, 'express'],
  [/\bnoone\b/gi, 'noon'],
  [/\bloines\b/gi, 'loins'], [/\bloynes\b/gi, 'loins'],
  [/\baduersary\b/gi, 'adversary'], [/\baduersari/gi, 'adversari'],
  [/\bheale\b/gi, 'heal'],
  [/\bharpes\b/gi, 'harps'],
  [/\boyle\b/gi, 'oil'], [/\boile\b/gi, 'oil'],
  [/\breproched\b/gi, 'reproached'],
  [/\bencrease\b/gi, 'increase'], [/\bencreased\b/gi, 'increased'],
  [/\bwhirlewinde\b/gi, 'whirlwind'],
  [/\bmouthes\b/gi, 'mouths'],
  [/\bbehaued\b/gi, 'behaved'],
  [/\breines\b/gi, 'reins'],
  [/\bofspring\b/gi, 'offspring'],
  [/\bmindes\b/gi, 'minds'],
  [/\bwherwith\b/gi, 'with which'],
  [/\bdumbe\b/gi, 'dumb'],
  [/\bcarued\b/gi, 'carved'],
  [/\bgyants\b/gi, 'giants'],
  [/\blouers\b/gi, 'lovers'],
  [/\bquailes\b/gi, 'quails'],
  [/\bstirre\b/gi, 'stir'], [/\bstirred\b/gi, 'stirred'],
  [/\bwildernes\b/gi, 'wilderness'],
  [/\bstreame\b/gi, 'stream'],
  [/\bfishes\b/gi, 'fishes'],  // keep — valid
  [/\bweekes\b/gi, 'weeks'],
  [/\bdoung\b/gi, 'dung'],
  [/\bsorowful\b/gi, 'sorrowful'],
  [/\bcariages\b/gi, 'carriages'],
  [/\bfieldes\b/gi, 'fields'],
  [/\bgroues\b/gi, 'groves'],
  [/\binhabite\b/gi, 'inhabit'],
  [/\bnowe\b/gi, 'now'],
  [/\bspred\b/gi, 'spread'],
  [/\binivry\b/gi, 'injury'],
  [/\bunlesse\b/gi, 'unless'],
  [/\bseruitude\b/gi, 'servitude'],
  [/\bmayd\b/gi, 'maid'],
  [/\blampes\b/gi, 'lamps'],
  [/\bwhensoeuer\b/gi, 'whensoever'],
  [/\breserued\b/gi, 'reserved'],
  [/\brauished\b/gi, 'ravished'],
  [/\bdranke\b/gi, 'drank'],
  [/\bfloore\b/gi, 'floor'],
  [/\bbridegrome\b/gi, 'bridegroom'],
  [/\bpriestes\b/gi, 'priests'],
  [/\btaxe\b/gi, 'tax'],
  [/\bremembereth\b/gi, 'remembers'],  // already have this but repeat
  [/\boffrings\b/gi, 'offerings'],
  [/\bsixt\b/gi, 'sixth'],
  [/\bsafegard\b/gi, 'safeguard'],
  [/\bforbeare\b/gi, 'forbear'],
  [/\bwherfore\b/gi, 'therefore'],
  [/\bferuent\b/gi, 'fervent'],
  [/\bherbes\b/gi, 'herbs'],
  [/\boffred\b/gi, 'offered'],
  [/\bnauy\b/gi, 'navy'],
  [/\bcomanded\b/gi, 'commanded'],
  [/\bwonne\b/gi, 'won'],
  [/\bconfederats\b/gi, 'confederates'],
  [/\bexpences\b/gi, 'expenses'],
  [/\bremouing\b/gi, 'removing'],
  [/\bwanne\b/gi, 'won'],
  [/\bdrachmes\b/gi, 'drachmas'],
  [/\bsitteth\b/gi, 'sits'], // repeat OK
  [/\bhonoureth\b/gi, 'honors'],
  [/\bleaueth\b/gi, 'leaves'],
  [/\bfaileth\b/gi, 'fails'],
  [/\bwickednes\b/gi, 'wickedness'], [/\brighteous?nes\b/gi, 'righteousness'],
  [/\bdarkenes\b/gi, 'darkness'],
  [/\bbecommeth\b/gi, 'becomes'],
  [/\bprevaile\b/gi, 'prevail'],
  [/\bmusicke\b/gi, 'music'],
  [/\benuy\b/gi, 'envy'], [/\benuieth\b/gi, 'envies'],
  [/\bblamelesse\b/gi, 'blameless'],
  [/\bwhilest\b/gi, 'while'],
  [/\bbewaile\b/gi, 'bewail'],
  [/\bfatherlesse\b/gi, 'fatherless'],
  [/\bshamelesse\b/gi, 'shameless'],
  [/\bruine\b/gi, 'ruin'],
  [/\bsorrowes\b/gi, 'sorrows'],
  [/\bsoiourned\b/gi, 'sojourned'],
  [/\bactes\b/gi, 'acts'],
  [/\bbattaile\b/gi, 'battle'],
  [/\bgouernments\b/gi, 'governments'],
  [/\biustly\b/gi, 'justly'], [/\biustified\b/gi, 'justified'], [/\biustify\b/gi, 'justify'],
  [/\bsayth\b/gi, 'says'],
  [/\blaboureth\b/gi, 'labors'],
  [/\bsinneth\b/gi, 'sins'],
  [/\bconsumeth\b/gi, 'consumes'],
  [/\bserueth\b/gi, 'serves'],
  [/\bcauseth\b/gi, 'causes'],
  [/\bhideth\b/gi, 'hides'],
  [/\bdevoureth\b/gi, 'devours'],
  [/\bdriveth\b/gi, 'drives'],
  [/\bwatcheth\b/gi, 'watches'],
  [/\bchangeth\b/gi, 'changes'],
  [/\bpowreth\b/gi, 'pours'],
  [/\bcounteth\b/gi, 'counts'],
  [/\bsaveth\b/gi, 'saves'],
  [/\bdishonoureth\b/gi, 'dishonors'],
  [/\bbeginneth\b/gi, 'begins'],
  [/\bupbraideth\b/gi, 'upbraids'],
  [/\bbuildeth\b/gi, 'builds'],
  [/\bcurseth\b/gi, 'curses'],
  [/\bdelighteth\b/gi, 'delights'],
  [/\bdeclareth\b/gi, 'declares'],
  [/\bsearcheth\b/gi, 'searches'],
  [/\bseemeth\b/gi, 'seems'],
  [/\bappertaineth\b/gi, 'appertains'],
  [/\beateth\b/gi, 'eats'],
  [/\bgouerneth\b/gi, 'governs'],
  [/\bshewest\b/gi, 'show'],
  [/\bcommest\b/gi, 'come'],
  [/\bcommandedst\b/gi, 'commanded'],
  [/\bsittest\b/gi, 'sit'],
  [/\bheereafter\b/gi, 'hereafter'],
  [/\bouercame\b/gi, 'overcame'],
  [/\bouerthrew\b/gi, 'overthrew'],
  [/\boutaken\b/gi, 'overtaken'],
  [/\bfoorthwith\b/gi, 'forthwith'],
  [/\bcheerefulness\b/gi, 'cheerfulness'],
  [/\bcheere\b/gi, 'cheer'],
  [/\bdishonourable\b/gi, 'dishonorable'],
  [/\bcheerefulness\b/gi, 'cheerfulness'],
  [/\breproove\b/gi, 'reprove'], [/\breprooved\b/gi, 'reproved'],
  [/\bblotted\b/gi, 'blotted'],  // keep — valid
  [/\bsetled\b/gi, 'settled'],
  [/\bstirred\b/gi, 'stirred'],  // keep — valid
  [/\bresolved\b/gi, 'resolved'],  // keep — valid
  [/\bsoeuer\b/gi, 'soever'],
  [/\bthorow\b/gi, 'through'],  // repeat
  [/\bcomanded\b/gi, 'commanded'],  // repeat
  [/\bgouerment\b/gi, 'government'],
  [/\bgouerne\b/gi, 'govern'],
  [/\bfearefulness\b/gi, 'fearfulness'],

  // Final fixes from scan
  [/\bunivst\b/gi, 'unjust'], [/\bunivstly\b/gi, 'unjustly'],
  [/\bleauing\b/gi, 'leaving'],
  [/\bsaueth\b/gi, 'saves'],
  [/\bsinnful\b/gi, 'sinful'],
  [/\bslipt\b/gi, 'slipped'],
  [/\bprocesse\b/gi, 'process'],
  [/\bseruing\b/gi, 'serving'],
  [/\bjoine\b/gi, 'join'], [/\bjoined\b/gi, 'joined'],

  // ══ GENERAL CATCH-ALL PATTERNS ══

  // General -eth → -s for ALL remaining archaic verb forms
  // Exceptions: words where "eth" is part of the root, not a verb suffix
  [/\b(\w{3,})eth\b/gi, (m, stem) => {
    const lower = m.toLowerCase();
    const skipWords = ['seth','beth','meth','death','beneath','teeth','shibboleth','nazareth',
      'elizabeth','japheth','gath','sabbath','goliath','breath','sheath','wreath','heath',
      'underneath','aftermath','growth','truth','youth','alth','alth','filth','month',
      'mammoth','zenith','azimuth','hundredth','thousandth','twentieth','thirtieth',
      'fortieth','fiftieth','sixtieth','seventieth','eightieth','ninetieth','width',
      'breadth','length','strength','warmth','earth','hearth','berth','birth','worth',
      'north','south','both','cloth','broth','sloth','moth','pith','smith','kith','with',
      'faith','health','wealth','stealth','tilth','mirth','girth','dearth','forth','fourth'];
    if (skipWords.some(w => lower === w || lower.endsWith(w))) return m;
    // For -ieth, -aeth, -ueth patterns: stem + s
    const s = stem.toLowerCase();
    // Handle special stem adjustments
    if (s.endsWith('i')) return stem.slice(0,-1) + (m[0] === m[0].toUpperCase() ? 'Ies' : 'ies');
    // Most -eth stems need +es (maketh→makes, endureth→endures, humbleth→humbles)
    // Stems ending in vowel+[wrynl] just need +s (knoweth→knows, heareth→hears)
    // But those common ones are already handled by specific patterns above,
    // so the general catch-all safely uses +es for everything remaining.
    return stem + (m[0] === m[0].toUpperCase() ? 'Es' : 'es');
  }],

  // General -est (2nd person) → base form (after thou→you)
  [/\b(\w{3,})est\b/gi, (m, stem) => {
    const lower = m.toLowerCase();
    const skipWords = ['best','test','rest','nest','west','east','feast','beast','least','chest',
      'quest','guest','crest','arrest','interest','forest','harvest','contest','protest','manifest',
      'modest','honest','earnest','nearest','greatest','highest','lowest','largest','smallest',
      'longest','strongest','weakest','richest','poorest','oldest','youngest','wisest','latest',
      'oldest','newest','finest','purest','safest','surest','truest','widest','closest'];
    if (skipWords.includes(lower)) return m;
    // Only convert if stem is a recognized verb pattern (3+ chars)
    if (stem.length < 3) return m;
    return stem + (m[0] === m[0].toUpperCase() ? '' : '');
  }],

  // General terminal -e removal on common patterns (ppe→p, tte→t, sse→ss, ffe→f, etc.)
  [/\b(\w+)ppe\b/gi, (m, p) => { const skip=['recipe','type']; return skip.includes(m.toLowerCase()) ? m : p+'p'; }],
  [/\b(\w+)tte\b/gi, (m, p) => { return p+'t'; }],  // e.g. nette→net
  [/\b(\w+)ffe\b/gi, (m, p) => { return p+'ff'; }],  // e.g. staffe→staff
  [/\b(\w+)dde\b/gi, (m, p) => { return p+'d'; }],  // e.g. bedde→bed (already done but catch remainders)
  [/\b(\w+)nne\b/gi, (m, p) => { 
    const skip = ['anne','joanne','suzanne','adrienne','ienne','enne'];
    return skip.some(s => m.toLowerCase().endsWith(s)) ? m : p+'n'; 
  }],
  [/\b(\w+)rre\b/gi, (m, p) => { return p+'r'; }],  // e.g. farre→far (already done)
  [/\b(\w+)lle\b/gi, (m, p) => { 
    const skip = ['ville','belle','gazelle','mademoiselle'];
    return skip.includes(m.toLowerCase()) ? m : p+'ll'; 
  }],

  // Remaining specific archaic words from scan
  [/\bynough\b/gi, 'enough'],
  [/\bstubborne\b/gi, 'stubborn'],
  [/\btorne\b/gi, 'torn'],
  [/\bchaines\b/gi, 'chains'], [/\bchaine\b/gi, 'chain'],
  [/\bpretious\b/gi, 'precious'],
  [/\bwindowes\b/gi, 'windows'],
  [/\bbottome\b/gi, 'bottom'],
  [/\bfielde\b/gi, 'field'],
  [/\bmusick\b/gi, 'music'],
  [/\bpauement\b/gi, 'pavement'],
  [/\bengraued\b/gi, 'engraved'],
  [/\bprouerbe\b/gi, 'proverb'], [/\bprouerbes\b/gi, 'proverbs'],
  [/\bsoueraign/gi, 'sovereign'],
  [/\bvaile\b/gi, 'veil'],
  [/\bvowes\b/gi, 'vows'],
  [/\blacke\b/gi, 'lack'],
  [/\bunleauened\b/gi, 'unleavened'],
  [/\bfourteene\b/gi, 'fourteen'],
  [/\bthirteene\b/gi, 'thirteen'],
  [/\bfifteene\b/gi, 'fifteen'],
  [/\bsixteene\b/gi, 'sixteen'],
  [/\bseuenteene\b/gi, 'seventeen'],
  [/\beighteene\b/gi, 'eighteen'],
  [/\bnineeteene\b/gi, 'nineteen'],
  [/\bafarre\b/gi, 'afar'],
  [/\bswamme\b/gi, 'swam'],
  [/\bwarriou?r\b/gi, 'warrior'],
  [/\buncouered\b/gi, 'uncovered'],
  [/\bstiffenecked\b/gi, 'stiff-necked'],
  [/\bbegate\b/gi, 'begat'],
  [/\bstablished\b/gi, 'established'],
  [/\btrivmph\b/gi, 'triumph'],
  [/\baduice\b/gi, 'advice'],
  [/\baduised\b/gi, 'advised'],
  [/\breuiling\b/gi, 'reviling'],
  [/\binivrious\b/gi, 'injurious'],
  [/\bpreheminence\b/gi, 'preeminence'],
  [/\bwilful\b/gi, 'willful'],
  [/\breproofe\b/gi, 'reproof'],
  [/\binterprete\b/gi, 'interpret'],
  [/\bwarme\b/gi, 'warm'],
  [/\bdrie\b/gi, 'dry'],
  [/\brootes\b/gi, 'roots'],
  [/\bfurrowes\b/gi, 'furrows'],
  [/\bbabling\b/gi, 'babbling'],
  [/\bupbraide\b/gi, 'upbraid'],
  [/\bwhordome\b/gi, 'whoredom'],
  [/\bwinke\b/gi, 'wink'],
  [/\bfeede\b/gi, 'feed'],
  [/\bwhithersoeuer\b/gi, 'whithersoever'],
  [/\btrauailes\b/gi, 'labors'],
  [/\bprofesse\b/gi, 'profess'],
  [/\btrespasse\b/gi, 'trespass'], [/\btrespasses\b/gi, 'trespasses'],
  [/\bexcesse\b/gi, 'excess'],
  [/\bvexe\b/gi, 'vex'],
  [/\bancestours\b/gi, 'ancestors'],
  [/\bcouetous/gi, 'covetous'],
  [/\bterrours\b/gi, 'terrors'],
  [/\bioyning\b/gi, 'joining'],

  [/\bouertaken\b/gi, 'overtaken'],
  [/\bgouernment\b/gi, 'government'],
  [/\bremembreth\b/gi, 'remembers'],
  [/\bwherupon\b/gi, 'upon which'],
  [/\bauthour\b/gi, 'author'],
  [/\bsinnful\b/gi, 'sinful'],

  // Remaining archaic 2nd person "-est" verbs (after thou→you, these need modern forms)
  [/\bdisquietest\b/gi, 'disquiet'],
  [/\bseest\b/gi, 'see'],
  [/\bsayest\b/gi, 'say'],
  [/\bgivest\b/gi, 'give'],
  [/\bknowest\b/gi, 'know'],
  [/\bgoest\b/gi, 'go'],
  [/\bdoest\b/gi, 'do'],
  [/\bcomest\b/gi, 'come'],
  [/\btakest\b/gi, 'take'],
  [/\bmakest\b/gi, 'make'],
  [/\blivest\b/gi, 'live'],
  [/\bbelievest\b/gi, 'believe'],
  [/\blovest\b/gi, 'love'],
  [/\bdespisest\b/gi, 'despise'],
  [/\bpleasest\b/gi, 'please'],
  [/\bleadest\b/gi, 'lead'],
  [/\bfeedest\b/gi, 'feed'],
  [/\bhidest\b/gi, 'hide'],
  [/\bprayest\b/gi, 'pray'],
  [/\bplayest\b/gi, 'play'],
  [/\btrustest\b/gi, 'trust'],
  [/\bpunishest\b/gi, 'punish'],
  [/\bjudgest\b/gi, 'judge'],
  [/\bteachest\b/gi, 'teach'],
  [/\bthinkest\b/gi, 'think'],
  [/\bspeakest\b/gi, 'speak'],
  [/\bhearst\b/gi, 'hear'],
  [/\bhearest\b/gi, 'hear'],
  [/\bruledst\b/gi, 'ruled'],
  [/\bformedst\b/gi, 'formed'],
  [/\bcreatedst\b/gi, 'created'],

  // Broad "-all" → "-al" suffix (immortall→immortal, perpetuall→perpetual, etc.)
  [/\b(\w{3,})all\b/gi, (m, prefix) => {
    const skip = ['all','ball','call','fall','hall','mall','tall','wall','small','stall','shall',
      'install','recall','overall','downfall','rainfall','waterfall','football','baseball',
      'appall','befall','enthrall','forestall','nightfall','pitfall','windfall','thrall',
      'marshall','installing','thrall','withal'];
    if (skip.includes(m.toLowerCase())) return m;
    return prefix + 'al';
  }],

  // Broad "-eful" → "-ful" (paineful→painful, but keep shameful, graceful, peaceful)
  [/\b(\w+)eful\b/gi, (m, prefix) => {
    const keep = ['shameful','graceful','peaceful','hopeful','wakeful','wasteful',
      'tasteful','hateful','grateful','fateful','careful','useful','spiteful','tasteful'];
    if (keep.includes(m.toLowerCase())) return m;
    return prefix + 'ful';
  }],

  // "-lly" → "-ly" where doubled (speciall→special already handled, but "especially" etc.)
  [/\bespecially\b/gi, 'especially'],  // keep — already correct

  // "iour" → "ior" (behauiour already handled, but catch remaining)
  [/\b(\w+)iour\b/gi, (m, p) => {
    if (m.toLowerCase() === 'behaviour') return p + 'ior';
    if (m.toLowerCase() === 'saviour') return p + 'ior';
    return m;  // keep others (e.g. "iour" might be part of a proper name)
  }],
];

function modernizeText(text) {
  // Apply HTML entity substitutions first
  for (const [from, to] of Object.entries(KJV_SPELLING)) {
    text = text.split(from).join(to);
  }

  // Apply exact word replacements BEFORE regex (handles specific -eth verbs, etc.)
  for (const [from, to] of Object.entries(WORD_MAP)) {
    const re = new RegExp('\\b' + from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'g');
    text = text.replace(re, to);
  }

  // Apply regex patterns (includes general catch-all -eth handler)
  for (const [pattern, replacement] of KJV_REGEX_PATTERNS) {
    if (replacement === null) continue;
    text = text.replace(pattern, replacement);
  }

  // Clean up double spaces
  text = text.replace(/  +/g, ' ');

  return text;
}

function processBook(id) {
  const filePath = path.join(CLASSICS_DIR, id + '.txt');
  if (!fs.existsSync(filePath)) return;

  const blob = fs.readFileSync(filePath, 'utf8');
  const records = [];
  let pos = 0;

  while (pos < blob.length) {
    const sep1 = blob.indexOf(SEP, pos);
    if (sep1 === -1) break;
    const ref = blob.slice(pos, sep1);
    const textStart = sep1 + 1;
    const sep2 = blob.indexOf(SEP, textStart);
    if (sep2 === -1) break;
    const text = blob.slice(textStart, sep2);
    records.push({ ref, text: modernizeText(text, true) });
    pos = sep2 + 1;
  }

  const newBlob = records.map(r => r.ref + SEP + r.text + SEP).join('');
  fs.writeFileSync(filePath, newBlob, 'utf8');

  return records.length;
}

// ── Main ──
const ALL_BOOKS = [
  // KJV Apocrypha (most modernization needed)
  'sirach', 'wisdom', 'tobit', 'judith', 'baruch', 'letterJeremiah',
  'prayerAzariah', 'susanna', 'belDragon', 'prayerManasseh',
  '1esdras', '2esdras', '1maccabees', '2maccabees',
  // Pseudepigrapha (lighter modernization)
  'enoch', 'jubilees', 'jasher', '2enoch', '2baruch', 'psalmsSolomon', 'testaments',
];

console.log('Modernizing apocrypha text...\n');

for (const id of ALL_BOOKS) {
  const count = processBook(id);
  if (count) console.log(`  ${id}: ${count} chapters modernized`);
}

console.log('\nDone. Run build-classics-gz.js to re-gzip.');
