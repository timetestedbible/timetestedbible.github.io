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
const JulianDay = require('../../julian-day.js');

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
check('JDN 0 weekday', NAMES[JulianDay.jdnToWeekday(0)], 'Monday');
// JDN 2451545 = 2000-01-01 (Gregorian), a Saturday.
check('JDN 2451545 (2000-01-01) weekday', NAMES[JulianDay.jdnToWeekday(2451545)], 'Saturday');
// February is the one month where the Fliegel–Van Flandern 'a' term bites:
// a = floor((14 - m) / 12) must be 1 for BOTH Jan and Feb. A 13-for-14 slip
// passes every March–December (and January) test yet labels Feb 28 2026 as
// 'Feb 25' — 3 days behind (2 in leap years) — then snaps back on Mar 1.
check('Gregorian 2026-02-28 JDN', JulianDay.gregorianToJDN(2026, 2, 28), 2461100);
check('Gregorian 2026-02-28 weekday', NAMES[JulianDay.jdnToWeekday(JulianDay.gregorianToJDN(2026, 2, 28))], 'Saturday');
check('Gregorian 2000-02-29 JDN (leap day)', JulianDay.gregorianToJDN(2000, 2, 29), 2451604);
check('Gregorian 2000-03-01 JDN (day after leap day)', JulianDay.gregorianToJDN(2000, 3, 1), 2451605);
check('Julian 2000-02-01 JDN (= Gregorian 2000-02-14)', JulianDay.julianToJDN(2000, 2, 1), 2451589);
check('Julian 30-02-28 -> 30-03-01 consecutive', JulianDay.julianToJDN(30, 3, 1) - JulianDay.julianToJDN(30, 2, 28), 1);
// JD 2451545.0 is 2000-01-01 12:00 UT — the JD epoch tie to Unix time.
check('instantToJD(2000-01-01T12:00Z)', JulianDay.instantToJD(new Date(Date.UTC(2000, 0, 1, 12))), 2451545);
// Every civil day 1900–2100 must round-trip through both the Gregorian and the
// display converters and agree with Date.UTC epoch arithmetic.
{
  let bad = 0;
  for (let y = 1900; y <= 2100; y++) for (let m = 1; m <= 12; m++) for (let d = 1; d <= 31; d++) {
    const t = new Date(Date.UTC(2000, m - 1, d)); t.setUTCFullYear(y);
    if (t.getUTCMonth() !== m - 1) continue;
    const ref = Math.round(t.getTime() / 86400000 + 2440587.5);
    const jdn = JulianDay.gregorianToJDN(y, m, d), back = JulianDay.jdnToGregorian(jdn);
    const disp = JulianDay.jdnToDisplay(JulianDay.displayToJDN(y, m, d));
    if (jdn !== ref || back.year !== y || back.month !== m || back.day !== d
        || disp.year !== y || disp.month !== m || disp.day !== d || disp.isJulian
        || JulianDay.jdnToWeekday(jdn) !== t.getUTCDay()) bad++;
  }
  check('Gregorian round-trip 1900–2100 mismatches', bad, 0);
}
// Julian-calendar round-trip, 1500 BC – 1582 AD (every 7th year, all months).
{
  let bad = 0;
  for (let y = -1500; y <= 1580; y += 7) for (let m = 1; m <= 12; m++) for (let d = 1; d <= 28; d++) {
    const back = JulianDay.jdnToJulian(JulianDay.julianToJDN(y, m, d));
    if (back.year !== y || back.month !== m || back.day !== d) bad++;
  }
  check('Julian round-trip 1500 BC–1582 mismatches', bad, 0);
}

console.log('— Local calendar date of an instant (solar-time offset, 15° per hour) —');
// 2028-12-31 16:48 UTC is already Jan 1 2029 at Sydney (+10.08h) and still Dec 31 at Honolulu (-10.5h).
check('Sydney local date of 2028-12-31T16:48Z', eng.getLocalDate(new Date(Date.UTC(2028, 11, 31, 16, 48)), 151.2093).toISOString(), '2029-01-01T00:00:00.000Z');
check('Honolulu local date of 2028-12-31T16:48Z', eng.getLocalDate(new Date(Date.UTC(2028, 11, 31, 16, 48)), -157.8583).toISOString(), '2028-12-31T00:00:00.000Z');
// -1444-01-01 09:55 UTC is still Dec 31 of -1445 at Honolulu.
check('Honolulu local date of -1444-01-01T09:55Z', eng.getLocalDate(new Date(Date.UTC(-1444, 0, 1, 9, 55)), -157.8583).toISOString(), '-001445-12-31T00:00:00.000Z');
check('Jerusalem local date of 2026-02-28T22:30Z rolls to Mar 1', eng.getLocalDate(new Date(Date.UTC(2026, 1, 28, 22, 30)), 35.2137).toISOString(), '2026-03-01T00:00:00.000Z');
check('Dallas local date of 2026-03-01T03:00Z is still Feb 28', eng.getLocalDate(new Date(Date.UTC(2026, 2, 1, 3, 0)), -96.797).toISOString(), '2026-02-28T00:00:00.000Z');

console.log('— Day-boundary latitude rule (author ruling 2026-09-09): beyond ±48° use ±47°, same meridian —');
check('dayBoundaryLocation 69.65N -> 47N', JSON.stringify(LunarCalendarEngine.dayBoundaryLocation({ lat: 69.6492, lon: 18.9553 })), JSON.stringify({ lat: 47, lon: 18.9553 }));
check('dayBoundaryLocation 54.8S -> 47S', JSON.stringify(LunarCalendarEngine.dayBoundaryLocation({ lat: -54.8019, lon: -68.303 })), JSON.stringify({ lat: -47, lon: -68.303 }));
check('dayBoundaryLocation 48N unchanged', JSON.stringify(LunarCalendarEngine.dayBoundaryLocation({ lat: 48, lon: 10 })), JSON.stringify({ lat: 48, lon: 10 }));
check('dayBoundaryLocation 47.9N unchanged', LunarCalendarEngine.dayBoundaryLocation({ lat: 47.9, lon: 10 }).lat, 47.9);
{
  const midsummer = new Date(Date.UTC(2025, 5, 21)), midwinter = new Date(Date.UTC(2025, 11, 21));
  const tromso = { lat: 69.6492, lon: 18.9553 }, tromso47 = { lat: 47, lon: 18.9553 };
  const ushuaia = { lat: -54.8019, lon: -68.303 }, ushuaia47 = { lat: -47, lon: -68.303 };
  const e12 = new LunarCalendarEngine(astro).configure({ dayStartTime: 'morning', dayStartAngle: 12 });
  const e18 = new LunarCalendarEngine(astro).configure({ dayStartTime: 'evening', dayStartAngle: 18 });
  const e0 = new LunarCalendarEngine(astro).configure({ dayStartTime: 'evening', dayStartAngle: 0 });
  for (const d of [midsummer, midwinter]) {
    const tag = d.toISOString().slice(0, 10);
    check(`Tromso dawn (12°) ${tag} == 47N on its meridian`, e12.getDayStartTime(d, tromso), e12.getDayStartTime(d, tromso47));
    check(`Tromso sunset ${tag} == 47N on its meridian`, e0.getSunsetTime(d, tromso), e0.getSunsetTime(d, tromso47));
    check(`Tromso sunrise ${tag} == 47N on its meridian`, e0.getSunriseTime(d, tromso), e0.getSunriseTime(d, tromso47));
    check(`Ushuaia dusk (18°) ${tag} == 47S on its meridian`, e18.getDayStartTime(d, ushuaia), e18.getDayStartTime(d, ushuaia47));
  }
  // At 47° every boundary occurs even at midsummer, so the value is a real event, never the clock-time fallback.
  check('Tromso midsummer dawn is a real event, not the 06:00 UTC fallback', e12.getDayStartTime(midsummer, tromso) !== Date.UTC(2025, 5, 21) + 6 * 3600000, true);
  check('Tromso midsummer sunset exists', e0.getSunsetTime(midsummer, tromso) !== null, true);
  check('Ushuaia December astronomical dusk exists', e18.getDayStartTime(midwinter, ushuaia) !== Date.UTC(2025, 11, 21) + 18 * 3600000, true);
  // Below the limit nothing changes.
  const jer = { lat: 31.7683, lon: 35.2137 };
  check('Jerusalem is its own boundary location', LunarCalendarEngine.dayBoundaryLocation(jer) === jer, true);
}

console.log('— Virgo year rule (author ruling 2026-09-09): twelve months, then read the sign once —');
{
  const cfg = { moonPhase: 'full', dayStartTime: 'morning', dayStartAngle: 12, yearStartRule: 'virgoFeet', crescentThreshold: 18 };
  const reyk = { lat: 64.1466, lon: -21.9426 }, jer = { lat: 31.7683, lon: 35.2137 };
  const e = new LunarCalendarEngine(astro).configure(cfg);
  // The former per-year search gave Reykjavik 11 months in 1583 (May 6 1583 -> Mar 26 1584) and 13 in 1584.
  check('Reykjavik 1583 has 12 months', e.generateYear(1583, reyk, {}).months.length, 12);
  check('Reykjavik 1584 has 12 months', e.generateYear(1584, reyk, {}).months.length, 12);
  check('Reykjavik 1584 opens Apr 24 (the moon after month 12 of 1583 was month 13)', e.generateYear(1584, reyk, {}).months[0].moonEvent.toISOString().slice(0, 10), '1584-04-24');
  check('Reykjavik 1584 diagnostics: previous year (1583) had 12 months', e.getVirgoCalculation(1584, reyk).monthsInPreviousYear, 12);
  check('Reykjavik 1583 diagnostics: previous year (1582) had 13 months', e.getVirgoCalculation(1583, reyk).monthsInPreviousYear, 13);
  { // Every year reports a 12- or 13-month predecessor. (A year whose moon after month 12 fails
    // is, by definition, one whose bare observation lies 13 months after the previous one — an
    // unambiguous year — so the walk records the observation itself; the by-count branch of
    // _nextVirgoYearStart is reached only through the safety cap.)
    let ok = 0, n = 0;
    for (let y = 1900; y <= 2100; y++) { n++; const c = e.getVirgoCalculation(y, jer); if (c && (c.monthsInPreviousYear === 12 || c.monthsInPreviousYear === 13)) ok++; }
    check('Jerusalem 1900–2100: every year reports a 12- or 13-month predecessor', ok, n);
  }
  check('Reykjavik 1583 opens May 6 (Apr 7 was month 13 of 1582)', e.generateYear(1583, reyk, {}).months[0].moonEvent.toISOString().slice(0, 10), '1583-05-06');
  // In an ordinary year the chain and the bare observation agree (Jerusalem 2020–2030).
  let agree = 0; for (let y = 2020; y <= 2030; y++) { const chain = e._findVirgoFeetFullMoon(y, jer).getTime(); const plain = new Date(e._observeFirstVirgoMoon(y, jer).selectedFullMoon).getTime(); if (chain === plain) agree++; }
  check('Jerusalem 2020–2030: chained start == observed start', agree, 11);
  // Order independence: asking for 2026 first, or 1990 first, must not change 2025.
  const fresh = new LunarCalendarEngine(astro).configure(cfg).generateYear(2025, jer, {}).months[0].moonEvent.getTime();
  const warm = new LunarCalendarEngine(astro).configure(cfg); warm.generateYear(2026, jer, {}); warm.generateYear(1990, jer, {});
  check('Jerusalem 2025 start independent of evaluation order', warm.generateYear(2025, jer, {}).months[0].moonEvent.getTime(), fresh);
  // The count is carried back only to the nearest unambiguous year — a few years, not decades.
  let maxWalk = 0; for (let y = 1900; y <= 2100; y++) { e._findVirgoFeetFullMoon(y, reyk); maxWalk = Math.max(maxWalk, y - e.getVirgoCalculation(y, reyk).baseYear); }
  check('Reykjavik 1900–2100: longest walk back to an unambiguous year is <= 3 years', maxWalk <= 3, true);
}

console.log('— Historically attested ancient weekdays (Julian calendar dates) —');
// Julian April 7, 30 AD — the classical crescent-Passover crucifixion candidate — was a Friday.
check('Julian 30-04-07 weekday', NAMES[JulianDay.jdnToWeekday(JulianDay.julianToJDN(30, 4, 7))], 'Friday');
// Julian April 3, 33 AD — the other classical candidate — was a Friday.
check('Julian 33-04-03 weekday', NAMES[JulianDay.jdnToWeekday(JulianDay.julianToJDN(33, 4, 3))], 'Friday');
// Julian April 28, 32 AD — the solar-eclipse Passover — was a Monday.
check('Julian 32-04-28 weekday', NAMES[JulianDay.jdnToWeekday(JulianDay.julianToJDN(32, 4, 28))], 'Monday');

console.log('— Author-ruled month anchors (2026-08-04) —');
// 30 AD: conjunction Wed Mar 22 ~8pm Jerusalem local (computed: JD 1732096.23).
// Conjunction AFTER sunset -> dark-moon Day 1 = Mar 23. Crescent (18h) is
// first VISIBLE the dusk of Mar 23, and the sighting evening opens the day
// whose daytime is Mar 24 -> crescent Day 1 = Mar 24. With the same rule,
// 33 AD crescent Nisan 14 lands on Friday Apr 3 — the classical date.
{
  const cases = [
    { phase: 'dark',     year: 30, month: 1, day: 1,  jdn: JulianDay.julianToJDN(30, 3, 23), name: 'Julian 30-03-23' },
    { phase: 'crescent', year: 30, month: 1, day: 1,  jdn: JulianDay.julianToJDN(30, 3, 24), name: 'Julian 30-03-24' },
    { phase: 'dark',     year: 30, month: 1, day: 14, jdn: JulianDay.julianToJDN(30, 4, 5),  name: 'Julian 30-04-05' },
    { phase: 'crescent', year: 30, month: 1, day: 14, jdn: JulianDay.julianToJDN(30, 4, 6),  name: 'Julian 30-04-06' },
    { phase: 'crescent', year: 33, month: 1, day: 14, jdn: JulianDay.julianToJDN(33, 4, 3),  name: 'Julian 33-04-03 (classical Friday)' },
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
      ? JulianDay.julianToJDN(y2, m2 + 1, day2)
      : Math.floor(Date.UTC(y2, m2, day2) / 86400000 + 2440587.5 + 0.5);
    check(`${p.id} y${year} m${month} d${day} label/weekday agree (label ${d.toISOString().slice(0, 10)})`,
      info.weekdayName, NAMES[JulianDay.jdnToWeekday(labelJDN)]);
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
      ? JulianDay.julianToJDN(y2, m2 + 1, day2)
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
