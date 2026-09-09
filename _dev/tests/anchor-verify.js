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
// February is the one month where the Fliegel–Van Flandern 'a' term bites:
// a = floor((14 - m) / 12) must be 1 for BOTH Jan and Feb. A 13-for-14 slip
// passes every March–December (and January) test yet labels Feb 28 2026 as
// 'Feb 25' — 3 days behind (2 in leap years) — then snaps back on Mar 1.
check('Gregorian 2026-02-28 JDN', eng.gregorianCalendarToJDN(2026, 1, 28), 2461100);
check('Gregorian 2026-02-28 weekday', NAMES[eng.jdnToWeekday(eng.gregorianCalendarToJDN(2026, 1, 28))], 'Saturday');
check('Gregorian 2000-02-29 JDN (leap day)', eng.gregorianCalendarToJDN(2000, 1, 29), 2451604);
check('Gregorian 2000-03-01 JDN (day after leap day)', eng.gregorianCalendarToJDN(2000, 2, 1), 2451605);
check('Julian 2000-02-01 JDN (= Gregorian 2000-02-14)', eng.julianCalendarToJDN(2000, 1, 1), 2451589);
check('Julian 30-02-28 -> 30-03-01 consecutive', eng.julianCalendarToJDN(30, 2, 1) - eng.julianCalendarToJDN(30, 1, 28), 1);

console.log('— Historically attested ancient weekdays (Julian calendar dates) —');
// Julian April 7, 30 AD — the classical crescent-Passover crucifixion candidate — was a Friday.
check('Julian 30-04-07 weekday', NAMES[eng.jdnToWeekday(eng.julianCalendarToJDN(30, 3, 7))], 'Friday');
// Julian April 3, 33 AD — the other classical candidate — was a Friday.
check('Julian 33-04-03 weekday', NAMES[eng.jdnToWeekday(eng.julianCalendarToJDN(33, 3, 3))], 'Friday');
// Julian April 28, 32 AD — the solar-eclipse Passover — was a Monday.
check('Julian 32-04-28 weekday', NAMES[eng.jdnToWeekday(eng.julianCalendarToJDN(32, 3, 28))], 'Monday');

console.log('— Author-ruled month anchors (2026-08-04) —');
// 30 AD: conjunction Wed Mar 22 ~8pm Jerusalem local (computed: JD 1732096.23).
// Conjunction AFTER sunset -> dark-moon Day 1 = Mar 23. Crescent (18h) is
// first VISIBLE the dusk of Mar 23, and the sighting evening opens the day
// whose daytime is Mar 24 -> crescent Day 1 = Mar 24. With the same rule,
// 33 AD crescent Nisan 14 lands on Friday Apr 3 — the classical date.
{
  const cases = [
    { phase: 'dark',     year: 30, month: 1, day: 1,  jdn: eng.julianCalendarToJDN(30, 2, 23), name: 'Julian 30-03-23' },
    { phase: 'crescent', year: 30, month: 1, day: 1,  jdn: eng.julianCalendarToJDN(30, 2, 24), name: 'Julian 30-03-24' },
    { phase: 'dark',     year: 30, month: 1, day: 14, jdn: eng.julianCalendarToJDN(30, 3, 5),  name: 'Julian 30-04-05' },
    { phase: 'crescent', year: 30, month: 1, day: 14, jdn: eng.julianCalendarToJDN(30, 3, 6),  name: 'Julian 30-04-06' },
    { phase: 'crescent', year: 33, month: 1, day: 14, jdn: eng.julianCalendarToJDN(33, 3, 3),  name: 'Julian 33-04-03 (classical Friday)' },
  ];
  for (const c of cases) {
    const e = new LunarCalendarEngine(astro);
    e.configure({ moonPhase: c.phase, dayStartTime: 'evening', dayStartAngle: 0, yearStartRule: '14daysBefore', crescentThreshold: 18 });
    const cal = e.generateYear(c.year, { lat: 31.7683, lon: 35.2137 }, {});
    const info = e.getDayInfo(cal, c.month, c.day);
    check(`${c.phase} y${c.year} Nisan ${c.day} = ${c.name}`, info ? Math.round(info.jd) : null, c.jdn);
  }
}

console.log('— Engine end-to-end: date label and weekday must name the SAME day —');
// For every profile family and era, the reported weekday must equal the weekday
// of the reported date-label (read in the label's own calendar).
const profiles = [
  { id: 'crescent-evening', moonPhase: 'crescent', dayStartTime: 'evening', dayStartAngle: 0, yearStartRule: '14daysBefore', crescentThreshold: 18 },
  { id: 'dark-evening', moonPhase: 'dark', dayStartTime: 'evening', dayStartAngle: 0, yearStartRule: 'equinox', crescentThreshold: 18 },
  { id: 'full-morning', moonPhase: 'full', dayStartTime: 'morning', dayStartAngle: 12, yearStartRule: 'equinox', crescentThreshold: 18 },
];
for (const [year, month, day] of [[30, 1, 14], [32, 1, 16], [-1445, 2, 22], [2024, 1, 14], [2025, 11, 27]]) {
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
    // The stored boundary jd must lie ON the labeled day (within ±12h of its
    // noon). Catches opening/closing-boundary confusion (the JDN-v6 off-by-one).
    check(`${p.id} y${year} m${month} d${day} boundary jd on labeled day`,
      Math.round(info.jd), labelJDN);
  }
}

console.log('— Consecutive lunar days carry consecutive date labels (no jumps) —');
// Reported 2026-09-09: Dallas, Time-Tested 2nd Ed (full moon, daybreak 12°,
// virgoFeet), 2025 month 11 read 'Feb 25' for day 27 and 'Mar 1' for day 28.
// Whatever the month-start rule decides, within a month each day's label must
// be exactly one JDN after the previous day's, and the boundary jd must fall
// on the labeled day. Both facts hold independent of this codebase.
{
  const labelJDN = (d) => {
    const y2 = d.getUTCFullYear(), m2 = d.getUTCMonth(), day2 = d.getUTCDate();
    return (y2 < 1582 || (y2 === 1582 && (m2 < 9 || (m2 === 9 && day2 < 15))))
      ? eng.julianCalendarToJDN(y2, m2, day2)
      : Math.floor(Date.UTC(y2, m2, day2) / 86400000 + 2440587.5 + 0.5);
  };
  const runs = [
    { id: 'Dallas full-morning-12 virgoFeet y2025', year: 2025, loc: { lat: 32.7767, lon: -96.7970 },
      cfg: { moonPhase: 'full', dayStartTime: 'morning', dayStartAngle: 12, yearStartRule: 'virgoFeet', crescentThreshold: 18 } },
    { id: 'Jerusalem crescent-evening equinox y2023', year: 2023, loc: { lat: 31.7683, lon: 35.2137 },
      cfg: { moonPhase: 'crescent', dayStartTime: 'evening', dayStartAngle: 0, yearStartRule: 'equinox', crescentThreshold: 18 } },
    { id: 'Jerusalem dark-evening equinox y30', year: 30, loc: { lat: 31.7683, lon: 35.2137 },
      cfg: { moonPhase: 'dark', dayStartTime: 'evening', dayStartAngle: 0, yearStartRule: 'equinox', crescentThreshold: 18 } },
  ];
  for (const r of runs) {
    const e = new LunarCalendarEngine(astro);
    e.configure(r.cfg);
    const cal = e.generateYear(r.year, r.loc, {});
    let jumps = 0, offDay = 0, total = 0;
    for (const m of cal.months) {
      for (let i = 0; i < m.days.length; i++) {
        const cur = labelJDN(m.days[i].gregorianDate);
        total++;
        if (Math.round(m.days[i].jd) !== cur) offDay++;
        if (i > 0 && cur - labelJDN(m.days[i - 1].gregorianDate) !== 1) jumps++;
      }
    }
    check(`${r.id}: label jumps across ${total} days`, jumps, 0);
    check(`${r.id}: boundary jd off labeled day`, offDay, 0);
  }
  // The reported cells themselves.
  const e = new LunarCalendarEngine(astro);
  e.configure(runs[0].cfg);
  const cal = e.generateYear(2025, runs[0].loc, {});
  const d27 = e.getDayInfo(cal, 11, 27), d28 = e.getDayInfo(cal, 11, 28);
  check('Dallas 2025 m11 d27/d28 labels one day apart',
    labelJDN(d28.gregorianDate) - labelJDN(d27.gregorianDate), 1);
  check('Dallas 2025 m11 d27 label names the boundary day',
    labelJDN(d27.gregorianDate), Math.round(d27.jd));
}

console.log('');
if (failures) { console.log(`${failures} ANCHOR FAILURE(S)`); process.exit(1); }
console.log('ALL ANCHORS PASS');
