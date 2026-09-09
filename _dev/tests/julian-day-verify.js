#!/usr/bin/env node
/**
 * julian-day-verify.js — thorough verification of julian-day.js and of every
 * file that was rewired to it.
 *
 * Layers (each is knowable without trusting this codebase):
 *  1. External anchors: Meeus, *Astronomical Algorithms* Table 7.a; the JD
 *     and Unix epochs; the 1582 reform; attested weekdays.
 *  2. Leap rules of both calendars, including year 0, negative and century
 *     years.
 *  3. Independent oracles: an iterative day counter walked one day at a time
 *     through both calendars (JD 0 → ~3500 AD; 4800 BC → 5000 AD), JavaScript's
 *     Date.UTC (proleptic Gregorian, every day 10000 BC – 10000 AD), and the
 *     astronomy-engine time scale for instant <-> JD.
 *  4. Display-convention helpers (Julian labels before Oct 15, 1582).
 *  5. Engine invariants across 8 profiles x 10 locations x 15 years
 *     (~1200 calendars): consecutive labels across the whole year, weekday ==
 *     label, boundary jd inside the labeled UTC day (morning) or the day that
 *     follows its noon (evening), findLunarDay round-trip, month lengths,
 *     year seams, 12/13 months.
 *  6. Cross-file agreement: the browser files load in layout order inside a
 *     stubbed global scope and their date helpers agree with JulianDay.
 *
 * Usage: node julian-day-verify.js [--quick]
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..', '..');
const QUICK = process.argv.includes('--quick');
const JulianDay = require(path.join(ROOT, 'julian-day.js'));
const astro = require('./astro-engine-node');
const Astronomy = require('astronomy-engine');
const { LunarCalendarEngine } = require(path.join(ROOT, 'lunar-calendar-engine.js'));

const NAMES = JulianDay.WEEKDAY_NAMES;
let failures = 0, checks = 0;
function check(label, actual, expected) {
  checks++;
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (!ok) { failures++; console.log(`  FAIL  ${label}: got ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}`); }
  return ok;
}
function section(t) { console.log(`\n— ${t} —`); }
function summary(label, n, bad, first) {
  check(`${label}: mismatches over ${n}`, bad, 0);
  if (bad && first) console.log(`        first: ${JSON.stringify(first).slice(0, 200)}`);
}
let seed = 20260909;
const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
const rInt = (a, b) => a + Math.floor(rnd() * (b - a + 1));
const t0 = Date.now();

// ---------------------------------------------------------------------------
section('1. External anchors');
// Meeus, Table 7.a (dates before 1582-10-15 are Julian calendar; ".5" = 12h UT)
const meeus = [
  ['G', 2000, 1, 1.5, 2451545.0], ['G', 1999, 1, 1.0, 2451179.5], ['G', 1987, 1, 27.0, 2446822.5],
  ['G', 1987, 6, 19.5, 2446966.0], ['G', 1988, 1, 27.0, 2447187.5], ['G', 1988, 6, 19.5, 2447332.0],
  ['G', 1900, 1, 1.0, 2415020.5], ['G', 1600, 1, 1.0, 2305447.5], ['G', 1600, 12, 31.0, 2305812.5],
  ['G', 1957, 10, 4.81, 2436116.31],
  ['J', 837, 4, 10.3, 2026871.8], ['J', -123, 12, 31.0, 1676496.5], ['J', -122, 1, 1.0, 1676497.5],
  ['J', -1000, 7, 12.5, 1356001.0], ['J', -1000, 2, 29.0, 1355866.5], ['J', -1001, 8, 17.9, 1355671.4],
  ['J', -4712, 1, 1.5, 0.0], ['J', 333, 1, 27.5, 1842713.0],
];
for (const [cal, y, m, dfrac, jd] of meeus) {
  const d = Math.floor(dfrac), frac = dfrac - d;
  const jdn = cal === 'G' ? JulianDay.gregorianToJDN(y, m, d) : JulianDay.julianToJDN(y, m, d);
  check(`Meeus ${cal} ${y}-${m}-${dfrac} -> JD`, +(jdn - 0.5 + frac).toFixed(2), jd);
}
check('JD epoch: Julian -4712-01-01 = JDN 0', JulianDay.julianToJDN(-4712, 1, 1), 0);
check('JDN 0 is a Monday', NAMES[JulianDay.jdnToWeekday(0)], 'Monday');
check('Unix epoch 1970-01-01 = JDN 2440588 (midnight JD 2440587.5)', JulianDay.gregorianToJDN(1970, 1, 1), 2440588);
check('Unix epoch is a Thursday', NAMES[JulianDay.jdnToWeekday(2440588)], 'Thursday');
check('2000-01-01 is a Saturday', NAMES[JulianDay.jdnToWeekday(JulianDay.gregorianToJDN(2000, 1, 1))], 'Saturday');
check('Gregorian 1582-10-15 = JDN 2299161 = REFORM_JDN', JulianDay.gregorianToJDN(1582, 10, 15), JulianDay.REFORM_JDN);
check('Julian 1582-10-04 is the day before the reform', JulianDay.julianToJDN(1582, 10, 4), JulianDay.REFORM_JDN - 1);
check('1582-10-04 (Julian) was a Thursday', NAMES[JulianDay.jdnToWeekday(JulianDay.julianToJDN(1582, 10, 4))], 'Thursday');
check('1582-10-15 (Gregorian) was a Friday', NAMES[JulianDay.jdnToWeekday(JulianDay.REFORM_JDN)], 'Friday');
check('Julian 1 AD Jan 1 was a Saturday', NAMES[JulianDay.jdnToWeekday(JulianDay.julianToJDN(1, 1, 1))], 'Saturday');
check('Julian 30-04-07 (crucifixion candidate) Friday', NAMES[JulianDay.jdnToWeekday(JulianDay.julianToJDN(30, 4, 7))], 'Friday');
check('Julian 33-04-03 (crucifixion candidate) Friday', NAMES[JulianDay.jdnToWeekday(JulianDay.julianToJDN(33, 4, 3))], 'Friday');
check('Gregorian 2026-02-28 = JDN 2461100, Saturday', [JulianDay.gregorianToJDN(2026, 2, 28), NAMES[JulianDay.jdnToWeekday(2461100)]], [2461100, 'Saturday']);
check('Julian/Gregorian offset is 13 days today', JulianDay.gregorianToJDN(2026, 3, 1) - JulianDay.julianToJDN(2026, 3, 1), -13);
check('Gregorian ran 2 days BEHIND Julian in 30 AD (Julian Apr 7 = Gregorian Apr 5)', JulianDay.gregorianToJDN(30, 4, 7) - JulianDay.julianToJDN(30, 4, 7), 2);
check('Julian/Gregorian offset was 0 days in 250 AD', JulianDay.gregorianToJDN(250, 6, 1) - JulianDay.julianToJDN(250, 6, 1), 0);

// ---------------------------------------------------------------------------
section('2. Leap rules');
const gregLeap = y => (y % 4 === 0) && (y % 100 !== 0 || y % 400 === 0);
const julLeap = y => y % 4 === 0;
const febLen = (toJDN, y) => toJDN(y, 3, 1) - toJDN(y, 2, 1);
for (const y of [1600, 1700, 1800, 1900, 2000, 2004, 2024, 2025, 2026, 2028, 2100, 2400, 0, -1, -4, -100, -400, -4712]) {
  check(`Gregorian Feb ${y} length`, febLen(JulianDay.gregorianToJDN, y), gregLeap(y) ? 29 : 28);
  check(`Julian Feb ${y} length`, febLen(JulianDay.julianToJDN, y), julLeap(y) ? 29 : 28);
}
check('Gregorian year 2000 has 366 days', JulianDay.gregorianToJDN(2001, 1, 1) - JulianDay.gregorianToJDN(2000, 1, 1), 366);
check('Gregorian year 1900 has 365 days', JulianDay.gregorianToJDN(1901, 1, 1) - JulianDay.gregorianToJDN(1900, 1, 1), 365);
check('Julian year 1900 has 366 days', JulianDay.julianToJDN(1901, 1, 1) - JulianDay.julianToJDN(1900, 1, 1), 366);
check('Gregorian 400-year cycle = 146097 days', JulianDay.gregorianToJDN(2400, 1, 1) - JulianDay.gregorianToJDN(2000, 1, 1), 146097);
check('Julian 4-year cycle = 1461 days', JulianDay.julianToJDN(4, 1, 1) - JulianDay.julianToJDN(0, 1, 1), 1461);

// ---------------------------------------------------------------------------
section('3. Independent oracles');
function walk(label, toJDN, fromJDN, isLeap, startY, startJDN, endJDN) {
  const c = { y: startY, m: 1, d: 1 }; let bad = 0, first = null, n = 0;
  for (let jdn = startJDN; jdn <= endJDN; jdn++) {
    n++;
    const f = toJDN(c.y, c.m, c.d), b = fromJDN(jdn);
    if (f !== jdn || b.year !== c.y || b.month !== c.m || b.day !== c.d) { bad++; first ??= { c: { ...c }, jdn, f, b }; }
    const mdays = [31, isLeap(c.y) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    c.d++; if (c.d > mdays[c.m - 1]) { c.d = 1; c.m++; if (c.m > 12) { c.m = 1; c.y++; } }
  }
  summary(`${label} day-counter walk (${n} days)`, n, bad, first);
}
walk('Julian', JulianDay.julianToJDN, JulianDay.jdnToJulian, julLeap, -4712, 0, QUICK ? 800000 : 3000000);
{ // Gregorian: seed the start JDN from Date.UTC, an implementation we did not write
  const startY = -4800, startJDN = Date.UTC(startY, 0, 1) / 86400000 + 2440588;
  walk('Gregorian', JulianDay.gregorianToJDN, JulianDay.jdnToGregorian, gregLeap, startY, startJDN, startJDN + (QUICK ? 800000 : 3579000));
}
{ // Date.UTC, every day
  let bad = 0, n = 0, first = null;
  const step = QUICK ? 7 : 1;
  for (let y = -10000; y <= 10000; y += step) for (let m = 1; m <= 12; m++) for (let d = 1; d <= 31; d++) {
    const t = new Date(Date.UTC(2000, m - 1, d)); t.setUTCFullYear(y);
    if (t.getUTCMonth() !== m - 1) continue;
    n++;
    const ref = t.getTime() / 86400000 + 2440588, jdn = JulianDay.gregorianToJDN(y, m, d);
    if (jdn !== ref || JulianDay.jdnToWeekday(jdn) !== t.getUTCDay() || JulianDay.instantToJD(t) !== ref - 0.5) { bad++; first ??= { y, m, d, jdn, ref }; }
  }
  summary(`Date.UTC oracle (JDN, weekday, instantToJD; ${n} days)`, n, bad, first);
}
{ // astronomy-engine time scale: ut = days since J2000 (JD 2451545.0)
  let bad = 0, first = null; const n = QUICK ? 5000 : 30000;
  for (let i = 0; i < n; i++) {
    const t = new Date(rInt(-4000, 4000) * 31557600000 - 62135596800000 + rnd() * 31557600000);
    const ours = JulianDay.instantToJD(t), theirs = 2451545.0 + Astronomy.MakeTime(t).ut;
    if (Math.abs(ours - theirs) > 1e-8 || Math.abs(JulianDay.jdToInstant(ours).getTime() - t.getTime()) > 1) { bad++; first ??= { t: t.toISOString(), ours, theirs }; }
  }
  summary(`astronomy-engine instant<->JD (${n} instants)`, n, bad, first);
}
{ // Negative-JDN weekday safety (before 4713 BC) and fractional-JD civil day
  check('jdnToWeekday(-3) is in 0..6', JulianDay.jdnToWeekday(-3), 5);
  check('jdnToWeekday(-1) + 1 == jdnToWeekday(0)', (JulianDay.jdnToWeekday(-1) + 1) % 7, JulianDay.jdnToWeekday(0));
  check('JD 2451545.4 (Jan 1 2000, 21:36 UT) is Saturday', NAMES[JulianDay.jdnToWeekday(2451545.4)], 'Saturday');
  check('JD 2451545.5 (Jan 2 2000, 0h UT) is Sunday', NAMES[JulianDay.jdnToWeekday(2451545.5)], 'Sunday');
  check('jdnOf(2451545.49) = 2451545', JulianDay.jdnOf(2451545.49), 2451545);
  check('jdnOf(2451545.5) = 2451546', JulianDay.jdnOf(2451545.5), 2451546);
}

// ---------------------------------------------------------------------------
section('4. Display convention (Julian labels before Oct 15, 1582)');
check('displayToJDN 1582-10-04 and 1582-10-15 are consecutive', JulianDay.displayToJDN(1582, 10, 15) - JulianDay.displayToJDN(1582, 10, 4), 1);
check('jdnToDisplay(REFORM_JDN - 1) = Julian 1582-10-04', JulianDay.jdnToDisplay(JulianDay.REFORM_JDN - 1), { year: 1582, month: 10, day: 4, isJulian: true });
check('jdnToDisplay(REFORM_JDN) = Gregorian 1582-10-15', JulianDay.jdnToDisplay(JulianDay.REFORM_JDN), { year: 1582, month: 10, day: 15, isJulian: false });
check('isDisplayJulian boundary', [JulianDay.isDisplayJulian(1582, 10, 14), JulianDay.isDisplayJulian(1582, 10, 15), JulianDay.isDisplayJulian(1581, 12, 31), JulianDay.isDisplayJulian(1583, 1, 1)], [true, false, true, false]);
check('jdToDisplayDate(1732866) = Julian 32-04-30 Wednesday (two days after the Monday Apr 28 eclipse Passover)', [JulianDay.jdToDisplayDate(1732866).toISOString(), NAMES[JulianDay.displayDateToWeekday(JulianDay.jdToDisplayDate(1732866))]], ['0032-04-30T00:00:00.000Z', 'Wednesday']);
check('jdToDisplayDate year 0 (1 BC) keeps year 0', JulianDay.jdToDisplayDate(JulianDay.julianToJDN(0, 3, 1)).getUTCFullYear(), 0);
check('jdToDisplayDate negative year', JulianDay.jdToDisplayDate(JulianDay.julianToJDN(-1445, 5, 2)).toISOString(), '-001445-05-02T00:00:00.000Z');
{
  const d = JulianDay.jdToDisplayDate(2461100); // 2026-02-28 00:00 UTC label
  check('displayDateToJD midnight = JDN - 0.5', JulianDay.displayDateToJD(d), 2461099.5);
  d.setUTCHours(12); check('displayDateToJD noon = JDN', JulianDay.displayDateToJD(d), 2461100);
  d.setUTCHours(18, 30, 0); check('displayDateToJD 18:30 = JDN + 0.2708', +JulianDay.displayDateToJD(d).toFixed(4), 2461100.2708);
  const anc = JulianDay.jdToDisplayDate(1732096); anc.setUTCHours(20);
  check('displayDateToJD reads Julian labels pre-1582 (30 AD Mar 22 20h)', +JulianDay.displayDateToJD(anc).toFixed(3), 1732096.333);
}
check('instantToDisplayDate(30 AD conjunction 1732096.23) = Julian Mar 22', JulianDay.instantToDisplayDate(JulianDay.jdToInstant(1732096.23)).toISOString(), '0030-03-22T00:00:00.000Z');
check('instantToDisplayDate(modern instant) = its UTC date', JulianDay.instantToDisplayDate(new Date(Date.UTC(2026, 1, 1, 22, 9))).toISOString(), '2026-02-01T00:00:00.000Z');
{ // display round trip for a broad random sample
  let bad = 0, first = null, unrepresentable = 0; const n = QUICK ? 20000 : 200000;
  for (let i = 0; i < n; i++) {
    const jdn = rInt(-200000, 4000000);
    const disp = JulianDay.jdnToDisplay(jdn), back = JulianDay.displayToJDN(disp.year, disp.month, disp.day);
    if (back !== jdn || disp.isJulian !== (jdn < JulianDay.REFORM_JDN)) { bad++; first ??= { jdn, disp, back }; continue; }
    // A Julian Feb 29 in a Gregorian non-leap year has no JS Date (see jdToDisplayDate doc); count it, don't test it.
    if (disp.isJulian && disp.month === 2 && disp.day === 29 && !gregLeap(disp.year)) { unrepresentable++; continue; }
    const d = JulianDay.jdToDisplayDate(jdn);
    if (JulianDay.displayDateToJDN(d) !== jdn || JulianDay.displayDateToWeekday(d) !== JulianDay.jdnToWeekday(jdn)) { bad++; first ??= { jdn, disp, d: d.toISOString() }; }
  }
  summary(`display round trip (${n} JDNs; ${unrepresentable} Julian-Feb-29-in-Gregorian-non-leap-year labels skipped)`, n, bad, first);
}
// KNOWN LIMITATION, pinned so a future change of the label representation updates this deliberately:
check('LIMITATION: Julian 1500-02-29 has no JS Date label; reads as Mar 1', JulianDay.jdToDisplayDate(JulianDay.julianToJDN(1500, 2, 29)).toISOString(), '1500-03-01T00:00:00.000Z');
check('LIMITATION does not affect the weekday computed from the JDN', NAMES[JulianDay.jdnToWeekday(JulianDay.julianToJDN(1500, 2, 29))], NAMES[(JulianDay.jdnToWeekday(JulianDay.julianToJDN(1500, 2, 28)) + 1) % 7]);
check('Julian 1200-02-29 (Gregorian leap year too) IS representable', JulianDay.jdToDisplayDate(JulianDay.julianToJDN(1200, 2, 29)).toISOString(), '1200-02-29T00:00:00.000Z');

// ---------------------------------------------------------------------------
section('5. Engine invariants across profiles, locations and eras');
const CONFIGS = {
  timeTested2:        { moonPhase: 'full',     dayStartTime: 'morning', dayStartAngle: 12, yearStartRule: 'virgoFeet' },
  creatorsCalendar:   { moonPhase: 'full',     dayStartTime: 'morning', dayStartAngle: 0,  yearStartRule: 'virgoFeet' },
  ancientTraditional: { moonPhase: 'crescent', dayStartTime: 'evening', dayStartAngle: 0,  yearStartRule: '14daysBefore' },
  rabbinicSaturday:   { moonPhase: 'dark',     dayStartTime: 'evening', dayStartAngle: 0,  yearStartRule: '14daysBefore' },
  ministries119:      { moonPhase: 'dark',     dayStartTime: 'evening', dayStartAngle: 18, yearStartRule: '1dayBefore' },
  traditionalLunar:   { moonPhase: 'crescent', dayStartTime: 'evening', dayStartAngle: 0,  yearStartRule: 'equinox' },
  fullEveningEquinox: { moonPhase: 'full',     dayStartTime: 'evening', dayStartAngle: 0,  yearStartRule: 'equinox' },
  darkMorningLamb:    { moonPhase: 'dark',     dayStartTime: 'morning', dayStartAngle: 12, yearStartRule: '14daysBefore' },
};
const LOCS = {
  Jerusalem: { lat: 31.7683, lon: 35.2137 }, Dallas: { lat: 32.7767, lon: -96.797 },
  Sydney: { lat: -33.8688, lon: 151.2093 }, Honolulu: { lat: 21.3069, lon: -157.8583 },
  Auckland: { lat: -36.8485, lon: 174.7633 }, Reykjavik: { lat: 64.1466, lon: -21.9426 },
  Tromso: { lat: 69.6492, lon: 18.9553 }, Nairobi: { lat: -1.2921, lon: 36.8219 },
  Ushuaia: { lat: -54.8019, lon: -68.303 }, Anchorage: { lat: 61.2181, lon: -149.9003 },
};
const YEARS = QUICK ? [30, 1582, 2025, 2026] : [-1445, -586, 0, 30, 33, 70, 1582, 1583, 1900, 2000, 2024, 2025, 2026, 2028, 2100];
// Strict invariants below 48° latitude. Beyond it the chosen boundary can fail
// to occur in midsummer — astronomical dusk (18°) above ~48.6°, nautical
// dawn (12°) above ~54.6°, sunrise/sunset above 66.6° — and the engine falls
// back to a fixed UTC clock time, which yields 28/31-day months and uneven
// day steps. Those locations are exercised separately and only reported.
const STRICT_LOCS = Object.keys(LOCS).filter(k => Math.abs(LOCS[k].lat) <= 48);
const POLAR_LOCS = Object.keys(LOCS).filter(k => Math.abs(LOCS[k].lat) > 48);
const LOC_NAMES = QUICK ? ['Jerusalem', 'Dallas', 'Auckland', 'Honolulu'] : STRICT_LOCS;
const labelJDN = d => JulianDay.displayDateToJDN(d);
const agg = { calendars: 0, days: 0, lenBad: 0, len2930Bad: 0, startBad: 0, consecBad: 0, weekdayBad: 0, boundaryBad: 0, jdStepBad: 0, findBad: 0, monthsBad: 0, first: {} };
const roundStats = {}; // informational: how often Math.round(jd) !== label JDN, by location+mode
const note = (k, v) => { agg[k]++; agg.first[k] ??= v; };
let idx = 0;
for (const [cn, cfg] of Object.entries(CONFIGS)) for (const ln of LOC_NAMES) for (const y of YEARS) {
  const eng = new LunarCalendarEngine(astro).configure({ ...cfg, crescentThreshold: 18 });
  const cal = eng.generateYear(y, LOCS[ln], { includeUncertainty: (idx++ % 2) === 0 });
  agg.calendars++;
  if (cal.months.length !== 12 && cal.months.length !== 13) note('monthsBad', { cn, ln, y, months: cal.months.length });
  let prevL = null, prevJd = null;
  const rk = `${ln}/${cfg.dayStartTime}`; roundStats[rk] ??= { days: 0, off: 0 };
  for (const m of cal.months) {
    if (m.days.length !== m.daysInMonth) note('lenBad', { cn, ln, y, m: m.monthNumber, len: m.days.length, daysInMonth: m.daysInMonth });
    if (m.daysInMonth !== 29 && m.daysInMonth !== 30) note('len2930Bad', { cn, ln, y, m: m.monthNumber, daysInMonth: m.daysInMonth, moon: m.moonEvent.toISOString(), start: m.startDate.toISOString() });
    if (!m.days.length) continue;
    if (labelJDN(m.startDate) !== labelJDN(m.days[0].gregorianDate)) note('startBad', { cn, ln, y, m: m.monthNumber, start: m.startDate.toISOString(), day1: m.days[0].gregorianDate.toISOString() });
    m.days.forEach((day, i) => {
      agg.days++; roundStats[rk].days++;
      const L = labelJDN(day.gregorianDate);
      if (prevL !== null && L - prevL !== 1) note('consecBad', { cn, ln, y, m: m.monthNumber, d: day.lunarDay, label: day.gregorianDate.toISOString(), prevL, L });
      if (day.weekday !== JulianDay.jdnToWeekday(L) || day.weekdayName !== NAMES[day.weekday]) note('weekdayBad', { cn, ln, y, m: m.monthNumber, d: day.lunarDay, label: day.gregorianDate.toISOString(), weekday: day.weekday, weekdayName: day.weekdayName });
      // Morning mode: the opening sunrise/dawn is found after 00:00 UTC of the labeled day, so it lies inside it.
      // Evening mode: the closing sunset/dusk is found after 12:00 UTC of the labeled day, so it lies in [noon, next noon).
      const okBoundary = cfg.dayStartTime === 'morning' ? (day.jd >= L - 0.5 && day.jd < L + 0.5) : (day.jd >= L && day.jd < L + 1);
      if (!okBoundary) note('boundaryBad', { cn, ln, y, m: m.monthNumber, d: day.lunarDay, label: day.gregorianDate.toISOString(), jd: day.jd, L });
      if (Math.round(day.jd) !== L) roundStats[rk].off++;
      if (prevJd !== null && (day.jd - prevJd < 0.85 || day.jd - prevJd > 1.15)) note('jdStepBad', { cn, ln, y, m: m.monthNumber, d: day.lunarDay, step: day.jd - prevJd });
      if (i === 0 || i === 1 || i === 14 || i === m.days.length - 1) {
        const f = eng.findLunarDay(cal, day.gregorianDate);
        if (!f || f.lunarMonth !== m.monthNumber || f.lunarDay !== day.lunarDay) note('findBad', { cn, ln, y, m: m.monthNumber, d: day.lunarDay, found: f && [f.lunarMonth, f.lunarDay] });
      }
      prevL = L; prevJd = day.jd;
    });
  }
}
console.log(`  ${agg.calendars} calendars, ${agg.days} days checked in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
for (const k of ['monthsBad', 'lenBad', 'len2930Bad', 'startBad', 'consecBad', 'weekdayBad', 'boundaryBad', 'jdStepBad', 'findBad']) {
  check(`engine: ${k}`, agg[k], 0);
  if (agg[k]) console.log(`        first: ${JSON.stringify(agg.first[k]).slice(0, 220)}`);
}
{ // year seams: last day of Y + 1 == first day of Y+1; month count 12 or 13
  let bad = 0, first = null, n = 0;
  for (const cn of ['timeTested2', 'traditionalLunar', 'rabbinicSaturday', 'ministries119']) for (const ln of ['Jerusalem', 'Dallas']) for (const y of [30, 1582, 2024, 2025]) {
    const eng = new LunarCalendarEngine(astro).configure({ ...CONFIGS[cn], crescentThreshold: 18 });
    const a = eng.generateYear(y, LOCS[ln], {}), b = eng.generateYear(y + 1, LOCS[ln], {});
    const lastA = a.months[a.months.length - 1].days.slice(-1)[0], firstB = b.months[0].days[0];
    n++;
    if (labelJDN(firstB.gregorianDate) - labelJDN(lastA.gregorianDate) !== 1) { bad++; first ??= { cn, ln, y, lastA: lastA.gregorianDate.toISOString(), firstB: firstB.gregorianDate.toISOString() }; }
  }
  summary(`year seams (${n} pairs)`, n, bad, first);
}
{ // High latitudes: report, don't fail (see STRICT_LOCS note). Year-wrap bugs (|days| > 100) DO fail anywhere.
  const polar = {}; let wrap = 0, firstWrap = null;
  for (const [cn, cfg] of Object.entries(CONFIGS)) for (const ln of POLAR_LOCS) for (const y of (QUICK ? [2025] : YEARS)) {
    const eng = new LunarCalendarEngine(astro).configure({ ...cfg, crescentThreshold: 18 });
    const cal = eng.generateYear(y, LOCS[ln], {});
    const k = `${ln}/${cn}`; polar[k] ??= { months: 0, odd: 0, years: 0, oddYears: 0 };
    polar[k].months += cal.months.length; polar[k].years++;
    if (cal.months.length !== 12 && cal.months.length !== 13) polar[k].oddYears++;
    for (const m of cal.months) {
      if (m.daysInMonth < 0 || m.daysInMonth > 100) { wrap++; firstWrap ??= { cn, ln, y, m: m.monthNumber, daysInMonth: m.daysInMonth }; }
      else if (m.daysInMonth !== 29 && m.daysInMonth !== 30) polar[k].odd++;
    }
  }
  check('high-latitude: year-wrapped months (|length| > 100)', wrap, 0);
  if (wrap) console.log(`        first: ${JSON.stringify(firstWrap)}`);
  console.log('  info — high-latitude fallbacks (months not 29/30, years not 12/13 months), by location/profile:');
  let any = false;
  for (const [k, v] of Object.entries(polar)) if (v.odd || v.oddYears) { any = true; console.log(`        ${k}: ${v.odd}/${v.months} months, ${v.oddYears}/${v.years} years`); }
  if (!any) console.log('        none');
}
console.log('  info — Math.round(jd) !== label JDN (the Sabbath Tester row-identity assumption), by location/mode:');
for (const [k, v] of Object.entries(roundStats)) if (v.off) console.log(`        ${k}: ${v.off}/${v.days} days (${(100 * v.off / v.days).toFixed(0)}%)`);
if (!Object.values(roundStats).some(v => v.off)) console.log('        none');

// ---------------------------------------------------------------------------
section('6. Cross-file agreement (browser scripts in a stubbed global scope)');
function stubElement() {
  const base = { style: {}, dataset: {}, children: [], childNodes: [], innerHTML: '', textContent: '', value: '', className: '', id: '',
    classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } } };
  return new Proxy(base, {
    get(t, k) {
      if (k in t) return t[k];
      if (k === 'querySelectorAll' || k === 'getElementsByClassName' || k === 'getElementsByTagName') return () => [];
      if (['querySelector', 'getElementById', 'closest', 'createElement', 'createElementNS', 'appendChild', 'insertBefore', 'cloneNode', 'createDocumentFragment', 'createTextNode'].includes(k)) return () => stubElement();
      if (k === 'getAttribute') return () => null;
      if (k === 'getBoundingClientRect') return () => ({ top: 0, left: 0, width: 0, height: 0, right: 0, bottom: 0 });
      if (k === 'getContext') return () => null;
      if (typeof k === 'string') return () => undefined;
      return undefined;
    },
    set(t, k, v) { t[k] = v; return true; },
  });
}
function makeStorage() { const m = new Map(); return { getItem: k => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: k => m.delete(k), clear: () => m.clear(), key: i => [...m.keys()][i] ?? null, get length() { return m.size; } }; }
function makeBrowserContext() {
  const ctx = { console, Math, Date, Object, Array, Number, String, Boolean, JSON, Intl, Map, Set, WeakMap, WeakSet, Promise, Error, TypeError, RangeError, RegExp, parseInt, parseFloat, isNaN, isFinite, Symbol, Reflect, Proxy, encodeURIComponent, decodeURIComponent, encodeURI, decodeURI, URL, URLSearchParams, TextEncoder, TextDecoder, structuredClone,
    atob: s => Buffer.from(s, 'base64').toString('binary'), btoa: s => Buffer.from(s, 'binary').toString('base64'),
    setTimeout, clearTimeout, setInterval, clearInterval, queueMicrotask, performance: { now: () => Date.now() },
    requestAnimationFrame: () => 0, cancelAnimationFrame: () => {}, requestIdleCallback: () => 0,
    fetch: () => Promise.resolve({ ok: false, status: 404, json: async () => ({}), text: async () => '' }),
    navigator: { userAgent: 'node-vm', language: 'en-US', languages: ['en-US'], onLine: true, platform: 'node', serviceWorker: { register: () => Promise.resolve({}), addEventListener() {} }, clipboard: { writeText: async () => {} } },
    location: { hostname: 'localhost', host: 'localhost', pathname: '/', search: '', hash: '', href: 'http://localhost/', origin: 'http://localhost', protocol: 'http:', reload() {} },
    history: { pushState() {}, replaceState() {}, back() {}, state: null, length: 1 },
    localStorage: makeStorage(), sessionStorage: makeStorage(), matchMedia: () => ({ matches: false, addEventListener() {}, removeEventListener() {}, addListener() {} }),
    addEventListener() {}, removeEventListener() {}, dispatchEvent() { return true; }, scrollTo() {}, getComputedStyle: () => ({ getPropertyValue: () => '' }),
    innerWidth: 1280, innerHeight: 800, devicePixelRatio: 1, screen: { width: 1280, height: 800 },
    CustomEvent: class CustomEvent { constructor(type, init) { this.type = type; this.detail = init && init.detail; } },
    Event: class Event { constructor(type) { this.type = type; } },
    HTMLElement: class HTMLElement {}, Element: class Element {}, Node: class Node {}, Image: class Image {},
    IntersectionObserver: class { observe() {} unobserve() {} disconnect() {} }, ResizeObserver: class { observe() {} unobserve() {} disconnect() {} }, MutationObserver: class { observe() {} disconnect() {} },
    crypto: globalThis.crypto, Worker: class { postMessage() {} terminate() {} addEventListener() {} },
  };
  ctx.document = stubElement(); ctx.document.documentElement = stubElement(); ctx.document.body = stubElement(); ctx.document.head = stubElement();
  ctx.document.readyState = 'complete'; ctx.document.cookie = ''; ctx.document.title = '';
  ctx.window = ctx; ctx.self = ctx; ctx.globalThis = ctx; ctx.top = ctx; ctx.parent = ctx;
  return vm.createContext(ctx);
}
// Same relative order as _layouts/default.html
const BROWSER_FILES = ['julian-day.js', 'timezone-utils.js', 'astronomy-utils.js', 'lunar-calendar-engine.js', 'hebcal-adapter.js', 'priestly-divisions.js', 'year-utils.js', 'app-store.js', 'url-router.js', 'event-resolver.js', 'day-detail.js', 'views/sabbath-tester-view.js'];
const ctx = makeBrowserContext();
const loaded = {};
for (const f of BROWSER_FILES) {
  try { vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), ctx, { filename: f }); loaded[f] = true; check(`loads: ${f}`, true, true); }
  catch (e) { loaded[f] = false; check(`loads: ${f}`, String(e).split('\n')[0].slice(0, 160), 'loaded'); }
}
const g = expr => vm.runInContext(expr, ctx);
check('layout exposes one JulianDay object shared by every script', g('JulianDay === window.JulianDay && typeof JulianDay.gregorianToJDN === "function"'), true);
check('the engine in the browser scope uses the same JulianDay', g('new LunarCalendarEngine({}).jdToDate(2461100).toISOString()'), '2026-02-28T00:00:00.000Z');
const SAMPLE = QUICK ? 5000 : 50000;
// Skip Julian Feb 29 in Gregorian non-leap years: no JS Date can carry that label (see jdToDisplayDate).
const unrepresentable = jdn => { const d = JulianDay.jdnToDisplay(jdn); return d.isJulian && d.month === 2 && d.day === 29 && !gregLeap(d.year); };
const sampleJDN = () => { let j; do { j = rInt(-100000, 3500000); } while (unrepresentable(j)); return j; };
function agree(label, fn) {
  let bad = 0, first = null;
  for (let i = 0; i < SAMPLE; i++) { const r = fn(); if (r) { bad++; first ??= r; } }
  summary(label, SAMPLE, bad, first);
}
if (loaded['astronomy-utils.js']) {
  const getCorrectWeekday = g('getCorrectWeekday'), isBefore = g('isBeforeGregorianReform'), fmt = g('formatMoonEventDate');
  agree('astronomy-utils.getCorrectWeekday == JulianDay.displayDateToWeekday', () => { const jdn = sampleJDN(); const d = JulianDay.jdToDisplayDate(jdn); d.setUTCHours(rInt(0, 23)); return getCorrectWeekday(d) === JulianDay.jdnToWeekday(jdn) ? null : { jdn }; });
  agree('astronomy-utils.isBeforeGregorianReform == (JDN < REFORM_JDN)', () => { const jdn = sampleJDN(); return isBefore(JulianDay.jdToDisplayDate(jdn)) === (jdn < JulianDay.REFORM_JDN) ? null : { jdn }; });
  const anc = fmt(JulianDay.jdToInstant(1732096.23).getTime(), 35.2137);
  check('formatMoonEventDate: 30 AD conjunction shows Wednesday, Mar 22 (Julian label, local day)', [anc.dayOfWeek, anc.monthName, anc.dayNum, anc.year], ['Wednesday', 'Mar', 22, '30']);
  const mod = fmt(Date.UTC(2026, 1, 1, 22, 9), -96.797);
  check('formatMoonEventDate: Feb 1 2026 22:09 UTC at Dallas is Sunday Feb 1, 3:41 PM local', [mod.dayOfWeek, mod.monthName, mod.dayNum, mod.year, mod.moonTimeStr], ['Sunday', 'Feb', 1, '2026', '3:41 PM']);
  const east = fmt(Date.UTC(2026, 1, 1, 22, 9), 174.7633);
  check('formatMoonEventDate: same instant at Auckland is Monday Feb 2 (local day rolls over)', [east.dayOfWeek, east.monthName, east.dayNum], ['Monday', 'Feb', 2]);
}
if (loaded['day-detail.js']) {
  const parts = g('getFormattedDateParts'), fad = g('formatAncientDate');
  agree('day-detail.getFormattedDateParts weekday/isJulian/day agree with JulianDay', () => { const jdn = sampleJDN(); const d = JulianDay.jdToDisplayDate(jdn); const p = parts(d), disp = JulianDay.jdnToDisplay(jdn); return (p.weekday === JulianDay.jdnToWeekday(jdn) && p.weekdayName === NAMES[p.weekday] && p.isJulian === disp.isJulian && p.day === disp.day && p.month === disp.month - 1 && p.year === disp.year) ? null : { jdn, p, disp }; });
  check('day-detail.formatAncientDate is defined and formats the 30 AD conjunction', fad(JulianDay.jdToInstant(1732096.23), 35.2137), 'Wednesday, Mar 22, 30');
  check('day-detail.formatAncientDate accepts a timestamp too', fad(Date.UTC(2026, 1, 1, 22, 9), -96.797), 'Sunday, Feb 1, 2026');
}
if (loaded['priestly-divisions.js']) {
  const dtj = g('dateToJulianDay');
  agree('priestly-divisions.dateToJulianDay == JulianDay.displayDateToJD', () => { const jdn = sampleJDN(); const d = JulianDay.jdToDisplayDate(jdn); d.setUTCHours(rInt(0, 23), rInt(0, 59), rInt(0, 59)); return Math.abs(dtj(d) - JulianDay.displayDateToJD(d)) < 1e-9 ? null : { d: d.toISOString() }; });
}
if (loaded['event-resolver.js']) {
  const ER = g('EventResolver');
  agree('EventResolver.gregorianToJulianDay == gregorianToJDN - 0.5 (midnight JD)', () => { const y = rInt(-4700, 5000), m = rInt(1, 12), d = rInt(1, 28); return ER.gregorianToJulianDay(y, m, d) === JulianDay.gregorianToJDN(y, m, d) - 0.5 ? null : { y, m, d }; });
  agree('EventResolver.julianDayToGregorian is proleptic Gregorian for all dates', () => { const jd = sampleJDN() + rnd() - 0.5; const a = ER.julianDayToGregorian(jd), b = JulianDay.jdnToGregorian(jd); return (a.year === b.year && a.month === b.month && a.day === b.day) ? null : { jd, a, b }; });
  agree('EventResolver.julianDayToJulianCalendar == jdnToJulian', () => { const jd = sampleJDN() + rnd() - 0.5; const a = ER.julianDayToJulianCalendar(jd), b = JulianDay.jdnToJulian(jd); return (a.year === b.year && a.month === b.month && a.day === b.day) ? null : { jd, a, b }; });
  agree('EventResolver gregorian round trip', () => { const y = rInt(-4700, 5000), m = rInt(1, 12), d = rInt(1, 28); const b = ER.julianDayToGregorian(ER.gregorianToJulianDay(y, m, d)); return (b.year === y && b.month === m && b.day === d) ? null : { y, m, d, b }; });
}
if (loaded['app-store.js']) {
  const AS = g('AppStore');
  agree('AppStore._dateToJulian == JulianDay.displayDateToJD', () => { const jdn = sampleJDN(); const d = JulianDay.jdToDisplayDate(jdn); d.setUTCHours(rInt(0, 23), rInt(0, 59), rInt(0, 59)); return Math.abs(AS._dateToJulian(d) - JulianDay.displayDateToJD(d)) < 1e-9 ? null : { d: d.toISOString() }; });
  agree('AppStore._julianToGregorian(_dateToJulian(d)) returns d\'s labels and UTC time', () => { const jdn = sampleJDN(); const d = JulianDay.jdToDisplayDate(jdn); d.setUTCHours(rInt(0, 23), rInt(0, 59)); const r = AS._julianToGregorian(AS._dateToJulian(d)); return (r.year === d.getUTCFullYear() && r.month === d.getUTCMonth() + 1 && r.day === d.getUTCDate() && r.hours === d.getUTCHours() && r.minutes === d.getUTCMinutes()) ? null : { d: d.toISOString(), r }; });
  check('AppStore._localDateToJulian(local noon 2026-02-28) = 2461100', AS._localDateToJulian(new Date(2026, 1, 28, 12, 0, 0)), 2461100);
}
if (loaded['url-router.js']) {
  const UR = g('URLRouter');
  check('URLRouter._todayJD() is the current instant (within 2 s)', Math.abs(UR._todayJD() - JulianDay.instantToJD(new Date())) < 2 / 86400, true);
  check('URLRouter._todayJD() names today\'s UTC date', JulianDay.jdnToDisplay(UR._todayJD()).day, new Date().getUTCDate());
  agree('URLRouter._julianToGregorian == JulianDay.jdnToDisplay', () => { const jd = sampleJDN() + rnd() - 0.5; const a = UR._julianToGregorian(jd), b = JulianDay.jdnToDisplay(jd); return (a.year === b.year && a.month === b.month && a.day === b.day) ? null : { jd, a, b }; });
}
if (loaded['views/sabbath-tester-view.js']) {
  const STV = g('SabbathTesterView');
  agree('SabbathTesterView.jdRowIdentity date and weekday agree with JulianDay', () => { const jdn = sampleJDN(); const r = STV.jdRowIdentity(jdn + rnd() * 0.98 - 0.49), disp = JulianDay.jdnToDisplay(jdn); const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']; const yearStr = disp.year <= 0 ? `${1 - disp.year} BC` : `${disp.year} AD`; return (r.jdn === jdn && r.weekdayName === NAMES[JulianDay.jdnToWeekday(jdn)] && r.dateStr === `${MON[disp.month - 1]} ${disp.day}, ${yearStr}`) ? null : { jdn, r, disp }; });
}
if (loaded['hebcal-adapter.js']) {
  // toDisplayDate / jdToGregorian are private to the adapter's IIFE; lift them out of the source text.
  const src = fs.readFileSync(path.join(ROOT, 'hebcal-adapter.js'), 'utf8');
  const lift = name => { const s = src.indexOf(`function ${name}(`); let i = src.indexOf('{', s), depth = 0; for (; i < src.length; i++) { if (src[i] === '{') depth++; else if (src[i] === '}' && --depth === 0) break; } return src.slice(s, i + 1); };
  const H = vm.runInContext(`(function(){ ${lift('jdToGregorian')}\n${lift('toDisplayDate')}\nreturn { jdToGregorian, toDisplayDate }; })()`, ctx);
  agree('hebcal-adapter.jdToGregorian == jdnToDisplay', () => { const jd = sampleJDN() + rnd() - 0.5; const a = H.jdToGregorian(jd), b = JulianDay.jdnToDisplay(jd); return (a.year === b.year && a.month === b.month && a.day === b.day) ? null : { jd, a, b }; });
  agree('hebcal-adapter.toDisplayDate: pre-reform instants get Julian labels, post-reform pass through', () => { const jdn = sampleJDN(); const t = JulianDay.jdToInstant(jdn + rnd() - 0.5); const out = H.toDisplayDate(t); const ok = jdn < JulianDay.REFORM_JDN ? out.getTime() === JulianDay.jdToDisplayDate(jdn).getTime() : out === t; return ok ? null : { jdn, t: t.toISOString(), out: out.toISOString() }; });
}

// ---------------------------------------------------------------------------
console.log(`\n${checks} checks in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
if (failures) { console.log(`${failures} FAILURE(S)`); process.exit(1); }
console.log('ALL JULIAN-DAY CHECKS PASS');
