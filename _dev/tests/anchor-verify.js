#!/usr/bin/env node
/**
 * Anchor Verification — external ground truth for the Sabbath Tester engine.
 *
 * Unlike snapshot-verify.js (which only detects DRIFT from a stored baseline
 * and will happily enshrine a bug), every assertion here is a fact knowable
 * WITHOUT this codebase: historically attested weekdays, the JD epoch, and
 * internal date/weekday self-consistency. If these fail, the engine is wrong
 * no matter what the snapshots say.
 *
 * Usage: node anchor-verify.js
 */

const astro = require('./astro-engine-node');
const { LunarCalendarEngine } = require('../../lunar-calendar-engine.js');

const NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const eng = new LunarCalendarEngine(astro);
let failures = 0;

function check(label, actual, expected) {
  const ok = actual === expected;
  if (!ok) failures++;
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${label}: got ${actual}, expected ${expected}`);
}

console.log('— JD epoch and modern anchors —');
// JD 0 (noon, Jan 1, 4713 BC Julian) is a Monday — the epoch's defining fact.
check('JDN 0 weekday', NAMES[eng.jdnToWeekday(0)], 'Monday');
// JDN 2451545 = 2000-01-01 (Gregorian), a Saturday.
check('JDN 2451545 (2000-01-01) weekday', NAMES[eng.jdnToWeekday(2451545)], 'Saturday');

console.log('— Historically attested ancient weekdays (Julian calendar dates) —');
// Julian April 7, 30 AD — the classical crescent-Passover crucifixion candidate — was a Friday.
check('Julian 30-04-07 weekday', NAMES[eng.jdnToWeekday(eng.julianCalendarToJDN(30, 3, 7))], 'Friday');
// Julian April 3, 33 AD — the other classical candidate — was a Friday.
check('Julian 33-04-03 weekday', NAMES[eng.jdnToWeekday(eng.julianCalendarToJDN(33, 3, 3))], 'Friday');
// Julian April 28, 32 AD — the solar-eclipse Passover — was a Monday.
check('Julian 32-04-28 weekday', NAMES[eng.jdnToWeekday(eng.julianCalendarToJDN(32, 3, 28))], 'Monday');

console.log('— Engine end-to-end: date label and weekday must name the SAME day —');
// For every profile family and era, the reported weekday must equal the weekday
// of the reported date-label (read in the label's own calendar).
const profiles = [
  { id: 'crescent-evening', moonPhase: 'crescent', dayStartTime: 'evening', dayStartAngle: 0, yearStartRule: '14daysBefore', crescentThreshold: 18 },
  { id: 'dark-evening', moonPhase: 'dark', dayStartTime: 'evening', dayStartAngle: 0, yearStartRule: 'equinox', crescentThreshold: 18 },
  { id: 'full-morning', moonPhase: 'full', dayStartTime: 'morning', dayStartAngle: 12, yearStartRule: 'equinox', crescentThreshold: 18 },
];
for (const [year, month, day] of [[30, 1, 14], [32, 1, 16], [-1445, 2, 22], [2024, 1, 14]]) {
  for (const p of profiles) {
    const e = new LunarCalendarEngine(astro);
    e.configure({ moonPhase: p.moonPhase, dayStartTime: p.dayStartTime, dayStartAngle: p.dayStartAngle, yearStartRule: p.yearStartRule, crescentThreshold: p.crescentThreshold });
    const cal = e.generateYear(year, { lat: 31.7683, lon: 35.2137 }, {});
    const info = e.getDayInfo(cal, month, day);
    if (!info) { console.log(`  SKIP  ${p.id} y${year} m${month} d${day}: no day info`); continue; }
    const d = info.gregorianDate;
    const y2 = d.getUTCFullYear(), m2 = d.getUTCMonth(), day2 = d.getUTCDate();
    // Label is Julian-calendar for pre-1582, Gregorian after (jdToDisplayDate).
    const labelJDN = (y2 < 1582 || (y2 === 1582 && (m2 < 9 || (m2 === 9 && day2 < 15))))
      ? eng.julianCalendarToJDN(y2, m2, day2)
      : Math.floor(Date.UTC(y2, m2, day2) / 86400000 + 2440587.5 + 0.5);
    check(`${p.id} y${year} m${month} d${day} label/weekday agree (label ${d.toISOString().slice(0, 10)})`,
      info.weekdayName, NAMES[eng.jdnToWeekday(labelJDN)]);
  }
}

console.log('');
if (failures) { console.log(`${failures} ANCHOR FAILURE(S)`); process.exit(1); }
console.log('ALL ANCHORS PASS');
