/**
 * Hebcal Calendar Adapter
 *
 * Implements the same interface as LunarCalendarEngine so the app can use
 * the rabbinic Hebrew calendar (@hebcal/core) as a calendar backend for comparison.
 * No npm dependency: we vendor the bundle. Run scripts/fetch-hebcal.sh to download
 * lib/hebcal/hebcal-core.min.js; hebcal-loader.js then sets window.Hebcal.
 *
 * Uses: HDate, and Rata Die ↔ JD: JD = RD + 1721424.5.
 *
 * @see docs/calendar-backend-evaluation.md
 */

(function (global) {
  'use strict';

  const RD_TO_JD_OFFSET = 1721424.5;
  const JulianDay = global.JulianDay
    || (typeof require === 'function' ? require('./julian-day.js') : null);

  function getHDate() {
    if (typeof global.Hebcal !== 'undefined' && global.Hebcal.HDate) {
      return global.Hebcal.HDate;
    }
    if (typeof global.HebcalCore !== 'undefined' && global.HebcalCore.HDate) {
      return global.HebcalCore.HDate;
    }
    try {
      if (typeof require === 'function') {
        const hebcal = require('@hebcal/core');
        return hebcal.HDate || (hebcal.default && hebcal.default.HDate);
      }
    } catch (e) {}
    return null;
  }

  /**
   * Gregorian/astronomical year to Hebrew year (Nisan-based).
   * Nisan of Hebrew year H falls in spring of Gregorian year G ≈ H - 3760.
   * G is an ASTRONOMICAL year (0 = 1 BC, -585 = 586 BC) — the same
   * convention the tests and the lunar engine use — so the formula is
   * continuous across the era boundary. (The old BC branch added 3761,
   * which assumed negated no-year-zero BC input; it mapped every BC year
   * one Hebrew year late — Av 9 of 585 BC instead of 586 BC.)
   */
  function gregorianYearToHebrew(gregYear) {
    return gregYear + 3760;
  }

  function jdToRd(jd) {
    return jd - RD_TO_JD_OFFSET;
  }

  function rdToJd(rd) {
    return rd + RD_TO_JD_OFFSET;
  }

  /**
   * JD -> display-convention civil date (Julian labels before Oct 15, 1582),
   * matching LunarCalendarEngine.jdToDisplayDate.
   */
  function jdToGregorian(jd) {
    return JulianDay.jdnToDisplay(jd);
  }

  // Convert a physical (proleptic-Gregorian) Date to the display convention the
  // engine uses: Julian-calendar labels before Oct 15, 1582. On/after the
  // reform the Date is returned as-is (its time of day is preserved).
  function toDisplayDate(gregDate) {
    const jdn = JulianDay.gregorianToJDN(
      gregDate.getUTCFullYear(), gregDate.getUTCMonth() + 1, gregDate.getUTCDate());
    if (jdn >= JulianDay.REFORM_JDN) return gregDate;
    return JulianDay.jdToDisplayDate(jdn);
  }

  function HebcalCalendarAdapter() {
    this.config = {
      moonPhase: 'dark',
      dayStartTime: 'evening',
      yearStartRule: 'hebcal',
      sabbathMode: 'saturday'
    };
    this._calendarCache = {};
  }

  HebcalCalendarAdapter.prototype.configure = function (options) {
    if (options) Object.assign(this.config, options);
    return this;
  };

  HebcalCalendarAdapter.prototype.getConfig = function () {
    return { ...this.config };
  };

  /**
   * Generate a full year in the same shape as LunarCalendarEngine.generateYear.
   * @param {number} year - Gregorian/astronomical year (negative for BC)
   * @param {Object} location - { lat, lon } (ignored by Hebcal; kept for API compatibility)
   * @param {Object} options - { includeUncertainty } (uncertainty not applicable; ignored)
   */
  HebcalCalendarAdapter.prototype.generateYear = function (year, location, options) {
    const HDate = getHDate();
    if (!HDate) {
      console.warn('[HebcalAdapter] @hebcal/core not loaded');
      return { year, months: [], location: location || {} };
    }

    const hebrewYear = gregorianYearToHebrew(year);
    const cacheKey = 'hebcal_' + year + '_' + hebrewYear;
    if (this._calendarCache[cacheKey]) {
      return this._calendarCache[cacheKey];
    }

    // This calendar's year runs Nisan to Adar, but the Hebrew year NUMBER turns
    // over at Tishri (month 7). Months 1-6 (Nisan-Elul) belong to Hebrew year H;
    // months 7-12/13 (Tishri-Adar) belong to H+1. Building every month from H
    // put Tishri a year early (2026's month 7 rendered as Sep 23, 2025, right
    // after Elul 29 = Sep 11, 2026) and read the leap status from the wrong year
    // (5787 doubles Adar; 5786 does not).
    const yearForMonth = function (m) { return m >= 7 ? hebrewYear + 1 : hebrewYear; };
    const months = [];
    const monthCount = HDate.monthsInYear ? HDate.monthsInYear(hebrewYear + 1) : 13;

    for (let m = 1; m <= monthCount; m++) {
      const hy = yearForMonth(m);
      const daysInMonth = HDate.daysInMonth ? HDate.daysInMonth(m, hy) : 30;
      const days = [];

      for (let d = 1; d <= daysInMonth; d++) {
        const hd = new HDate(d, m, hy);
        const rd = hd.abs();
        const jd = rdToJd(rd);
        // Build Date from JD so year is correct for 1-99 AD (hd.greg() uses JS Date which treats year 33 as 1933)
        // Label ancient dates in the JULIAN calendar (same convention as the
        // lunar engine's display dates), and take the weekday from the JD by
        // pure mod-7 — one law for the whole tester, no Date converters.
        const gregorianDate = toDisplayDate(new Date((jd - 2440587.5) * 86400000));
        const weekday = ((Math.round(jd) + 1) % 7 + 7) % 7;
        const weekdayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

        days.push({
          lunarDay: d,
          gregorianDate: gregorianDate,
          jd: jd,
          weekday: weekday,
          weekdayName: weekdayNames[weekday]
        });
      }

      const firstDay = days[0];
      months.push({
        monthNumber: m,
        hebrewYear: hy,
        startDate: firstDay ? firstDay.gregorianDate : null,
        startJD: firstDay ? firstDay.jd : null,
        daysInMonth: days.length,
        days: days,
        uncertainty: null
      });
    }

    const result = {
      year: year,
      location: location || {},
      config: this.getConfig(),
      yearStartUncertainty: null,
      springEquinox: null,
      months: months
    };

    this._calendarCache[cacheKey] = result;
    if (Object.keys(this._calendarCache).length > 50) {
      const keys = Object.keys(this._calendarCache);
      delete this._calendarCache[keys[0]];
    }
    return result;
  };

  HebcalCalendarAdapter.prototype.getDayInfo = function (calendar, month, day) {
    if (!calendar || !calendar.months) return null;
    const monthData = calendar.months.find(function (m) { return m.monthNumber === month; });
    if (!monthData) return null;
    const dayData = monthData.days.find(function (d) { return d.lunarDay === day; });
    if (!dayData) return null;
    return {
      lunarMonth: month,
      lunarDay: day,
      gregorianDate: dayData.gregorianDate,
      jd: dayData.jd,
      weekday: dayData.weekday,
      weekdayName: dayData.weekdayName,
      monthData: monthData
    };
  };

  HebcalCalendarAdapter.prototype.findLunarDay = function (calendar, gregorianDate) {
    const HDate = getHDate();
    if (HDate) {
      const hd = new HDate(gregorianDate);
      const weekdayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      return {
        lunarMonth: hd.getMonth(),
        lunarDay: hd.getDate(),
        gregorianDate: gregorianDate,
        weekday: hd.getDay(),
        weekdayName: weekdayNames[hd.getDay()]
      };
    }
    if (calendar && calendar.months) {
      const targetStr = gregorianDate.toISOString ? gregorianDate.toISOString().split('T')[0] : '';
      for (let i = 0; i < calendar.months.length; i++) {
        const month = calendar.months[i];
        for (let j = 0; j < month.days.length; j++) {
          const day = month.days[j];
          const dayStr = day.gregorianDate.toISOString ? day.gregorianDate.toISOString().split('T')[0] : '';
          if (dayStr === targetStr) {
            return {
              lunarMonth: month.monthNumber,
              lunarDay: day.lunarDay,
              gregorianDate: day.gregorianDate,
              weekday: day.weekday,
              weekdayName: day.weekdayName
            };
          }
        }
      }
    }
    return null;
  };

  HebcalCalendarAdapter.prototype.jdToDisplayDate = function (jd) {
    const greg = jdToGregorian(jd);
    const isJulian = (greg.year < 1582) || (greg.year === 1582 && greg.month < 10) || (greg.year === 1582 && greg.month === 10 && greg.day < 15);
    return {
      year: greg.year,
      month: greg.month,
      day: greg.day,
      isJulian: isJulian
    };
  };

  HebcalCalendarAdapter.prototype.isBeforeGregorianReform = function (date) {
    const y = date.getUTCFullYear();
    if (y < 1582) return true;
    if (y > 1582) return false;
    const m = date.getUTCMonth();
    if (m < 9) return true;
    if (m > 9) return false;
    return date.getUTCDate() < 15;
  };

  HebcalCalendarAdapter.isAvailable = function () {
    return getHDate() !== null;
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { HebcalCalendarAdapter, getHDate };
  }
  if (typeof global !== 'undefined') {
    global.HebcalCalendarAdapter = HebcalCalendarAdapter;
  }
})(typeof window !== 'undefined' ? window : global);
