#!/usr/bin/env node
/**
 * Classify Revelation one_way_hebrew markers by quality tier (1, 2, 3).
 * Reads data/hebrew-gospels-notes.json and outputs counts + optional JSON.
 *
 * Tier 1 — Decisive/structural: no Greek equivalent, verbatim OT, Hebrew-only wordplay.
 * Tier 2 — Strong semantic shift: different Hebrew root / semantic contrast with Greek.
 * Tier 3 — Hebraizing register: vocabulary, proper nouns, liturgical/idiom.
 */

const fs = require('fs');
const path = require('path');

const notesPath = path.join(__dirname, '..', 'data', 'hebrew-gospels-notes.json');
const data = JSON.parse(fs.readFileSync(notesPath, 'utf8'));
const R = data.Revelation || {};

function classifyMarker(text) {
  const t = text.toLowerCase();
  const has = (p) => typeof p === 'string' ? t.includes(p.toLowerCase()) : p.some(s => t.includes(s.toLowerCase()));

  // Tier 1: Decisive / structural
  if (has('verbatim') || has('word for word') || has('exact syntax') || has("prophet's exact")) return 1;
  if (has('absent from greek') || has('no greek equivalent') || has('no connection to the greek')) return 1;
  if (has('impossible in greek') || has('could not arise from back-translation')) return 1;
  if (has('back-translator would never') || has('back-translator from greek would not') || has('back-translator might produce') === false && has('back-translator')) {
    if (has('never') || has('not') || has('would not')) return 1;
  }
  if (has('wordplay') || (has('root') && (has('same root') || has('one hebrew root') || has('share no root')))) return 1;
  if (has('distinctly hebraic') || has('uniquely') && has('rabbinic')) return 1;
  if (has('bat kol') || has('בַּת קוֹל') || (has('מַּחְתּוֹת') || has('machtot') || has('fire-pans')) && has('greek')) return 1;
  if (has('isaiah') && (has('quote') || has('verbatim') || has('44:6') || has('55:4') || has('60:19') || has('34:4') || has('2:19') || has('21:9') || has('47:12') || has('55:1'))) return 1;
  if (has('ezekiel') && (has('quote') || has('verbatim') || has('47:12'))) return 1;
  if (has('genesis') && (has('quote') || has('verbatim') || has('2:9'))) return 1;
  if (has('joel') && has('echoed')) return 1;
  if (has('no lexical') || has('no conceptual counterpart')) return 1;
  if (has('sodot') && has('apocalypse')) return 1; // framing as council not uncovering
  if (has('shekinah') || has('שׁוֹרֶה עָלַי רוּחַ')) return 1;

  // Tier 2: Strong semantic shift
  if (has('vs. greek') || has('vs. χάρις') || has('vs. ὑπομονή') || has('vs. Ἀποκάλυψις') || has('vs. ἐκκλησίαι') || has('vs. ᾅδου')) return 2;
  if (has('lovingkindness') || has('חֶסֶד') || has('grace') && has('χάρις')) return 2;
  if (has('hope') && has('endurance') || has('תִּקְוָה') || has('ὑπομονή')) return 2;
  if (has('garden of eden') || has('גן עדן') || has('paradise of god')) return 2;
  if (has('good testimony') || has('עדות טובה') || has('white stone')) return 2;
  if (has('elders') && has('churches') || has('זְקֵינִים') || has('ἐκκλησίαι')) return 2;
  if (has('clan') || has('מִשְׁפַּחַת') || has('φυλή') && has('tribe')) return 2;
  if (has('semantic') || has('different hebrew root')) return 2;
  if (has('likeness of a man') || has('כִּדְמוּת אָדָם') || has('son of man')) return 2;
  if (has('ruler and commander') || has('נָגִיד') || has('מְצַוֶּה')) return 2;
  if (has('first and the last') || has('הָרִאשׁוֹן וְהָאַחֲרוֹן') || has('α καὶ ω')) return 2;
  if (has('geihinnom') || has('גֵּיהִנֹּם') || has('hades') || has('valley of hinnom')) return 2;
  if (has('families') && has('tribes') || has('מִּשְׁפְּחוֹת') || has('zechariah 12')) return 2;
  if (has('tunics') || has('כֻתּוֹנוֹת') || has('foot-length garment')) return 2;
  if (has('inheritance') && has('authority') || has('נחלה')) return 2;
  if (has('dawn') && has('morning star') || has('שחר')) return 2;
  if (has('messenger of death') || has('מַלְאָךְ הַמָּוֶת')) return 2;
  if (has('sanctuary') && has('heikhal') || has('היכל')) return 2;
  if (has('graven-image') || has('פסל') || has('idol')) return 2;

  // Tier 3: Hebraizing register
  if (has('yhwh') || has('divine name') || has('tetragrammaton')) return 3;
  if (has('yeshua') || has('yochanan') || has('elohim')) return 3;
  if (has('geihinnom') || has('gei-hinnom') || has('גיהנם')) return 3;
  if (has('menorah') || has('מְּנוֹרָה') || has('lampstand')) return 3;
  if (has('teshuvah') || has('repentance')) return 3;
  if (has('from eternity') || has('unto eternity') || has('עוֹלָם') || has('everlasting')) return 3;
  if (has('thus says') || has('כֹּה אָמַר')) return 3;
  if (has('lovingkindness and peace') || has('חֶסֶד וְשָׁלוֹם')) return 3;
  if (has('by the hand of') || has('עַל יַד') || has('בְּיַד')) return 3;
  if (has('standard hebrew') || has('hebrew idiom') || has('agency idiom')) return 3;
  if (has('priestly') || has('levitical') || has('liturgical')) return 3;
  if (has('adversary') && has('satan')) return 3;
  if (has('bavel') || has('yerushalayim') || has('yehudim')) return 3;
  if (has('shofar') || has('שופר')) return 3;
  if (has('hallelujah') || has('amen')) return 3;

  // Default: unclassified → Tier 2 (semantic/structural)
  return 2;
}

const counts = { 1: 0, 2: 0, 3: 0 };
const byChapter = {};
const details = []; // optional: { chapter, verse, tier, snippet }

for (let c = 1; c <= 22; c++) {
  const ch = R[String(c)];
  if (!ch || !ch.verses) continue;
  byChapter[c] = { 1: 0, 2: 0, 3: 0 };
  for (const verseNum of Object.keys(ch.verses)) {
    const arr = ch.verses[verseNum].one_way_hebrew;
    if (!Array.isArray(arr)) continue;
    for (const text of arr) {
      const tier = classifyMarker(text);
      counts[tier]++;
      byChapter[c][tier]++;
      details.push({ chapter: c, verse: parseInt(verseNum, 10), tier, snippet: text.slice(0, 120) + (text.length > 120 ? '…' : '') });
    }
  }
}

const total = counts[1] + counts[2] + counts[3];
console.log('Revelation one_way_hebrew markers by quality tier\n');
console.log('Total markers:', total);
console.log('  Tier 1 (decisive/structural):', counts[1]);
console.log('  Tier 2 (strong semantic shift):', counts[2]);
console.log('  Tier 3 (Hebraizing register):', counts[3]);
console.log('\nPer-chapter breakdown (T1 / T2 / T3):');
for (let c = 1; c <= 22; c++) {
  if (byChapter[c]) console.log(`  Ch ${String(c).padStart(2)}: ${byChapter[c][1]} / ${byChapter[c][2]} / ${byChapter[c][3]}`);
}

// Write JSON for use by app or research doc
const outPath = path.join(__dirname, '..', 'data', 'revelation-markers-by-tier.json');
fs.writeFileSync(outPath, JSON.stringify({
  total,
  byTier: counts,
  byChapter,
  generated: new Date().toISOString().slice(0, 10),
}, null, 2));
console.log('\nWrote', outPath);
