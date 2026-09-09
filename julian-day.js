/**
 * Julian Day arithmetic — the single source for calendar <-> day-number math.
 *
 * Every other file converts through here. Do not copy these formulas.
 *
 * Conventions
 *  - Months are 1-indexed (January = 1) in every call. JS Date.getUTCMonth()
 *    is 0-indexed: always pass getUTCMonth() + 1.
 *  - Years are astronomical (1 BC = 0, 2 BC = -1).
 *  - A JDN (integer) names a civil day. The JD of that day's noon UT is the
 *    same integer; its midnight UT is JDN - 0.5. The civil day containing an
 *    instant jd is floor(jd + 0.5).
 *  - "Display" labels follow the NASA/Stellarium convention used site-wide:
 *    Julian calendar before Oct 15, 1582 (JDN 2299161), proleptic Gregorian
 *    from that day on. The engine stores display labels in a Date's UTC
 *    fields (jdToDisplayDate). Such a Date is NOT the physical instant —
 *    use instantToJD for real timestamps.
 *
 * Fliegel & Van Flandern (1968) integer algorithm, exact for every integer
 * date including negative years; inverse per Meeus ch. 7. Cross-checked
 * against the Meeus forward algorithm on every date 4100 BC – 3600 AD.
 */
(function (root, factory) {
  const lib = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = lib;
  if (root) root.JulianDay = lib;
})(typeof globalThis !== 'undefined' ? globalThis : (typeof self !== 'undefined' ? self : this), function () {
  'use strict';

  const REFORM_JDN = 2299161;       // Gregorian Oct 15, 1582: first Gregorian-labeled day
  const UNIX_EPOCH_JD = 2440587.5;  // JD of 1970-01-01T00:00:00Z
  const MS_PER_DAY = 86400000;
  const WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  // Jan/Feb count as months 13/14 of the previous year. The shift term must
  // be 1 for BOTH — (14 - month), not 13; the 13 variant silently mislabels
  // every February by 2–3 days while passing every other month.
  function shifted(year, month) {
    const a = Math.floor((14 - month) / 12);
    return { y: year + 4800 - a, m: month + 12 * a - 3 };
  }

  /** Proleptic Gregorian civil date -> JDN. */
  function gregorianToJDN(year, month, day) {
    const { y, m } = shifted(year, month);
    return day + Math.floor((153 * m + 2) / 5) + 365 * y
      + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
  }

  /** Julian-calendar civil date -> JDN. */
  function julianToJDN(year, month, day) {
    const { y, m } = shifted(year, month);
    return day + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - 32083;
  }

  /** True when a display label (y, m, d) is a Julian-calendar label. */
  function isDisplayJulian(year, month, day) {
    if (year !== 1582) return year < 1582;
    if (month !== 10) return month < 10;
    return day < 15;
  }

  /** Display-convention civil date -> JDN. */
  function displayToJDN(year, month, day) {
    return isDisplayJulian(year, month, day)
      ? julianToJDN(year, month, day)
      : gregorianToJDN(year, month, day);
  }

  // Inverse: Z is the JDN of the civil day containing jd.
  function fromZ(Z, gregorian) {
    let A = Z;
    if (gregorian) {
      const alpha = Math.floor((Z - 1867216.25) / 36524.25);
      A = Z + 1 + alpha - Math.floor(alpha / 4);
    }
    const B = A + 1524;
    const C = Math.floor((B - 122.1) / 365.25);
    const D = Math.floor(365.25 * C);
    const E = Math.floor((B - D) / 30.6001);
    const day = B - D - Math.floor(30.6001 * E);
    const month = E < 14 ? E - 1 : E - 13;
    const year = month > 2 ? C - 4716 : C - 4715;
    return { year, month, day };
  }

  /** JDN of the civil day containing instant jd (identity for integers). */
  function jdnOf(jd) { return Math.floor(jd + 0.5); }

  /** JD -> proleptic Gregorian {year, month, day}. */
  function jdnToGregorian(jd) { return fromZ(jdnOf(jd), true); }

  /** JD -> Julian-calendar {year, month, day}. */
  function jdnToJulian(jd) { return fromZ(jdnOf(jd), false); }

  /** JD -> display-convention {year, month, day, isJulian}. */
  function jdnToDisplay(jd) {
    const Z = jdnOf(jd);
    const isJulian = Z < REFORM_JDN;
    return { ...fromZ(Z, !isJulian), isJulian };
  }

  /** Weekday of a JDN (or of the civil day containing a JD): 0 = Sunday … 6 = Saturday. */
  function jdnToWeekday(jd) {
    return ((jdnOf(jd) + 1) % 7 + 7) % 7;
  }

  // ---- Real instants -------------------------------------------------------

  /** Physical Date -> JD (fractional). */
  function instantToJD(date) { return date.getTime() / MS_PER_DAY + UNIX_EPOCH_JD; }

  /** JD -> physical Date. */
  function jdToInstant(jd) { return new Date((jd - UNIX_EPOCH_JD) * MS_PER_DAY); }

  // ---- Display-labeled Dates (UTC fields carry display labels) --------------

  /** Display-labeled Date -> JDN of the labeled day. */
  function displayDateToJDN(date) {
    return displayToJDN(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate());
  }

  /** Display-labeled Date -> JD, keeping the UTC time of day (noon = .0). */
  function displayDateToJD(date) {
    return displayDateToJDN(date)
      + (date.getUTCHours() - 12) / 24
      + date.getUTCMinutes() / 1440
      + date.getUTCSeconds() / 86400;
  }

  /** Weekday of a display-labeled Date. (getUTCDay() is wrong for Julian labels.) */
  function displayDateToWeekday(date) { return jdnToWeekday(displayDateToJDN(date)); }

  /**
   * JD -> Date whose UTC fields carry the display label (midnight UTC).
   * Limitation: a JS Date is proleptic Gregorian inside, so a Julian Feb 29
   * in a Gregorian non-leap year (100, 200, 300, 500 … 1500 AD and the same
   * BC century years) has no representable Date; it reads as Mar 1. Weekdays
   * are unaffected when computed from the JDN.
   */
  function jdToDisplayDate(jd) {
    const c = jdnToDisplay(jd);
    const d = new Date(Date.UTC(2000, c.month - 1, c.day));
    d.setUTCFullYear(c.year);
    return d;
  }

  /** Physical Date -> display-labeled Date for its UTC civil day. */
  function instantToDisplayDate(date) { return jdToDisplayDate(instantToJD(date)); }

  return {
    REFORM_JDN,
    UNIX_EPOCH_JD,
    WEEKDAY_NAMES,
    gregorianToJDN,
    julianToJDN,
    displayToJDN,
    isDisplayJulian,
    jdnOf,
    jdnToGregorian,
    jdnToJulian,
    jdnToDisplay,
    jdnToWeekday,
    instantToJD,
    jdToInstant,
    displayDateToJDN,
    displayDateToJD,
    displayDateToWeekday,
    jdToDisplayDate,
    instantToDisplayDate,
  };
});
