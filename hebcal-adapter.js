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
   * JD to Gregorian date (for jdToDisplayDate). Same logic as LunarCalendarEngine.
   */
  function jdToGregorian(jd) {
    const z = Math.floor(jd + 0.5);
    const f = (jd + 0.5) - z;
    let a = z;
    if (z >= 2299161) {
      const alpha = Math.floor((z - 1867216.25) / 36524.25);
      a = z + 1 + alpha - Math.floor(alpha / 4);
    }
    const b = a + 1524;
    const c = Math.floor((b - 122.1) / 365.25);
    const d = Math.floor(365.25 * c);
    const e = Math.floor((b - d) / 30.6001);
    const day = b - d - Math.floor(30.6001 * e);
    const month = (e < 14) ? e - 1 : e - 13;
    const year = (month > 2) ? c - 4716 : c - 4715;
    return { year, month, day };
  }


  // Convert a physical (proleptic-Gregorian) Date to the display convention the
  // engine uses: Julian-calendar labels before Oct 15, 1582. Pure JDN math.
  function toDisplayDate(gregDate) {
    const y = gregDate.getUTCFullYear(), mo = gregDate.getUTCMonth() + 1, d = gregDate.getUTCDate();
    // Gregorian civil date -> JDN
    const a = Math.floor((14 - mo) / 12), yy = y + 4800 - a, mm = mo + 12 * a - 3;
    const jdn = d + Math.floor((153 * mm + 2) / 5) + 365 * yy + Math.floor(yy / 4) - Math.floor(yy / 100) + Math.floor(yy / 400) - 32045;
    if (jdn >= 2299161) return gregDate; // on/after Oct 15 1582: Gregorian labels
    // JDN -> Julian-calendar civil date
    const B = jdn + 1524, C = Math.floor((B - 122.1) / 365.25), D = Math.floor(365.25 * C), E = Math.floor((B - D) / 30.6001);
    const day = B - D - Math.floor(30.6001 * E);
    const month = E < 14 ? E - 1 : E - 13;
    const year = month > 2 ? C - 4716 : C - 4715;
    const out = new Date(Date.UTC(2000, month - 1, day));
    out.setUTCFullYear(year);
    return out;
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

    const months = [];
    const monthCount = HDate.monthsInYear ? HDate.monthsInYear(hebrewYear) : 13;

    for (let m = 1; m <= monthCount; m++) {
      const daysInMonth = HDate.daysInMonth ? HDate.daysInMonth(m, hebrewYear) : 30;
      const days = [];

      for (let d = 1; d <= daysInMonth; d++) {
        const hd = new HDate(d, m, hebrewYear);
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
