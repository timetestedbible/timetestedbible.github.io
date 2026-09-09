/**
 * Lunar Calendar Engine
 * 
 * A pure calculation engine for lunar calendar computations.
 * No UI dependencies - just takes inputs and returns computed results.
 * 
 * Usage:
 *   const engine = new LunarCalendarEngine(astroEngine);
 *   engine.configure({ moonPhase: 'dark', dayStartTime: 'evening', ... });
 *   const calendar = engine.generateYear(32, { lat: 31.77, lon: 35.21 });
 *   const dayInfo = engine.getDayInfo(calendar, 1, 16); // Month 1, Day 16
 */

// Calendar <-> Julian Day Number arithmetic is owned by julian-day.js (the one
// copy). Browser: loaded first via <script>. Node: required here.
const JulianDay = (typeof module !== 'undefined' && module.exports)
  ? require('./julian-day.js')
  : globalThis.JulianDay;

class LunarCalendarEngine {
  
  /**
   * @param {Object} astroEngine - Astronomy engine with methods:
   *   - searchMoonPhase(phase, startDate, limitDays)
   *   - getSeasons(year)
   *   - searchRiseSet(body, observer, direction, startDate, limitDays)
   *   - searchAltitude(body, observer, direction, startDate, limitDays, altitude)
   *   - createObserver(lat, lon, elevation)
   *   - getDeltaTUncertainty(year) - optional
   */
  constructor(astroEngine) {
    this.astro = astroEngine;
    this.config = {
      moonPhase: 'dark',        // 'dark', 'full', 'crescent'
      dayStartTime: 'evening',  // 'evening', 'morning'
      dayStartAngle: 0,         // Degrees below horizon (0=horizon, 6=civil, 12=nautical, 18=astronomical)
      yearStartRule: 'equinox', // 'equinox', '1dayBefore', '14daysBefore', or 'virgoFeet'
      crescentThreshold: 18,    // Hours after conjunction for crescent visibility
    };
    
    // Instance-owned caches (no global state pollution)
    this._virgoCache = {};      // Keyed by "year_lat_lon"
    this._moonEventsCache = {}; // Keyed by year
    this._calendarCache = {};   // Keyed by "year_lat_lon_config"
  }

  /**
   * Configure calendar parameters
   * @param {Object} options - Configuration options (partial updates allowed)
   */
  configure(options) {
    Object.assign(this.config, options);
    return this;
  }

  /**
   * Get current configuration
   * @returns {Object} Current configuration
   */
  getConfig() {
    return { ...this.config };
  }

  // ==========================================================================
  // DAY-BOUNDARY LATITUDE RULE
  // ==========================================================================

  /**
   * Location used for day-boundary sun events (sunrise, sunset, twilight).
   * Beyond ±48° latitude the chosen boundary can fail to occur in midsummer —
   * astronomical dusk (18°) stops above ~48.6°, nautical dawn (12°) above
   * ~54.6°, sunrise/sunset above 66.6° — so the boundary is taken as it
   * happens at ±47° on the same meridian. (Author ruling 2026-09-09.) The
   * moon's position, visibility and the year-start rule still use the true
   * location; only WHEN the day turns over is clamped.
   * @param {{lat: number, lon: number}} location
   * @returns {{lat: number, lon: number}}
   */
  static dayBoundaryLocation(location) {
    const lat = Number(location.lat);
    if (!(Math.abs(lat) > 48)) return location;
    return { ...location, lat: lat < 0 ? -47 : 47 };
  }

  /** Observer for day-boundary sun events at a location (see dayBoundaryLocation). */
  dayBoundaryObserver(location) {
    const loc = LunarCalendarEngine.dayBoundaryLocation(location);
    return this.astro.createObserver(loc.lat, loc.lon, 0);
  }

  // ==========================================================================
  // CALENDAR SYSTEM HELPERS
  // ==========================================================================

  /**
   * JD -> display-convention civil date (Julian labels before Oct 15, 1582).
   * @param {number} jd
   * @returns {{year: number, month: number, day: number, isJulian: boolean}}
   */
  jdToDisplayDate(jd) {
    return JulianDay.jdnToDisplay(jd);
  }

  /**
   * JD -> Date whose UTC fields carry the display label (NOT the instant).
   * @param {number} jd
   * @returns {Date}
   */
  jdToDate(jd) {
    return JulianDay.jdToDisplayDate(jd);
  }

  // ==========================================================================
  // CORE ASTRONOMICAL CALCULATIONS
  // ==========================================================================

  /**
   * Find moon events (new moons, full moons, or conjunctions for crescent)
   * Uses instance-owned cache - moon events don't depend on location
   * @param {number} year - Year to search
   * @returns {Date[]} Array of moon event dates
   */
  findMoonEvents(year) {
    // Cache key includes year, moon phase, and crescent threshold (if applicable)
    const cacheKey = `${year}_${this.config.moonPhase}_${this.config.crescentThreshold || 0}`;
    
    // Check cache first - moon events are location-independent
    if (this._moonEventsCache[cacheKey]) {
      // Return copies of cached dates to prevent mutation
      return this._moonEventsCache[cacheKey].map(d => new Date(d));
    }
    
    const events = [];
    
    // Start searching from December of previous year
    let searchDate = new Date(Date.UTC(2000, 11, 1));
    searchDate.setUTCFullYear(year - 1);
    
    // End in May of next year to cover full lunar year
    let endDate = new Date(Date.UTC(2000, 5, 1));
    endDate.setUTCFullYear(year + 1);
    
    // Moon phase angles: 0 = new/dark, 180 = full
    const targetPhase = (this.config.moonPhase === 'full') ? 180 : 0;
    
    let iterations = 0;
    const maxIterations = 30; // Safety limit
    
    while (searchDate < endDate && iterations < maxIterations) {
      iterations++;
      const result = this.astro.searchMoonPhase(targetPhase, searchDate, 40);
      if (!result) break;
      
      // Handle both AstroTime objects (which have .date) and plain Date objects
      let eventDate;
      if (result.date) {
        eventDate = result.date;
      } else if (result instanceof Date) {
        eventDate = result;
      } else if (typeof result.getTime === 'function') {
        // It's a Date-like object
        eventDate = result;
      } else {
        throw new Error(`searchMoonPhase returned unexpected type: ${typeof result}, keys: ${Object.keys(result || {})}`);
      }
      
      // For crescent, add offset to conjunction
      if (this.config.moonPhase === 'crescent') {
        eventDate = new Date(eventDate.getTime() + this.config.crescentThreshold * 60 * 60 * 1000);
      }
      
      events.push(eventDate);
      searchDate = new Date(eventDate.getTime() + 20 * 24 * 60 * 60 * 1000);
    }
    
    // Cache the results (store as ISO strings for safe cloning)
    this._moonEventsCache[cacheKey] = events.map(d => d.toISOString());
    
    return events;
  }

  /**
   * Get spring equinox for a year
   * @param {number} year 
   * @returns {Date}
   */
  getSpringEquinox(year) {
    const seasons = this.astro.getSeasons(year);
    if (!seasons) {
      throw new Error(`getSeasons returned null/undefined for year ${year}`);
    }
    if (!seasons.mar_equinox) {
      throw new Error(`getSeasons has no mar_equinox for year ${year}`);
    }
    if (!seasons.mar_equinox.date) {
      throw new Error(`mar_equinox has no date for year ${year}`);
    }
    return seasons.mar_equinox.date;
  }

  /**
   * Get year start point based on yearStartRule
   * @param {number} year 
   * @param {Object} location - { lat, lon } - REQUIRED for location-dependent rules
   * @returns {Date}
   */
  getYearStartPoint(year, location) {
    if (!location || typeof location.lat !== 'number' || typeof location.lon !== 'number') {
      throw new Error('getYearStartPoint requires explicit location { lat, lon }');
    }
    
    const equinox = this.getSpringEquinox(year);
    
    if (this.config.yearStartRule === '14daysBefore') {
      // Lamb rule: Day 15 on or after equinox — year start point is 14 days before equinox
      return new Date(equinox.getTime() - 14 * 24 * 60 * 60 * 1000);
    }
    if (this.config.yearStartRule === '1dayBefore') {
      // 119-style: first conjunction on or after (equinox − 1 day), so equinox "on the day" counts
      return new Date(equinox.getTime() - 1 * 24 * 60 * 60 * 1000);
    }
    
    if (this.config.yearStartRule === 'virgoFeet') {
      // Creator's Calendar: First full moon where moon is "under Virgo's feet" (Spica)
      const virgoFullMoon = this._findVirgoFeetFullMoon(year, location);
      if (virgoFullMoon) {
        // Return a point just before the full moon so it gets selected
        return new Date(virgoFullMoon.getTime() - 1000);
      }
      console.warn(`[Engine] Virgo rule returned null for year ${year}, falling back to equinox`);
    }
    
    return equinox;
  }
  
  /**
   * Find the first full moon where Moon is "under Virgo's feet" (Moon RA > Spica RA at sunrise)
   * Uses instance-owned cache - no global state pollution
   * @param {number} year - Gregorian year
   * @param {Object} location - { lat, lon } - REQUIRED
   * @returns {Date|null} The qualifying full moon date, or null if not found
   */
  _findVirgoFeetFullMoon(year, location) {
    const cacheKey = `${year}_${location.lat.toFixed(4)}_${location.lon.toFixed(4)}`;
    
    // Check instance cache first
    if (this._virgoCache[cacheKey]) {
      return new Date(this._virgoCache[cacheKey].selectedFullMoon);
    }
    
    // Spica's RA with precession adjustment
    const PRECESSION_RATE = 0.0139;  // degrees per year
    const yearsFromJ2000 = year - 2000;
    const spicaRA_J2000 = 201.298;  // degrees
    const spicaRA = spicaRA_J2000 + (yearsFromJ2000 * PRECESSION_RATE);
    
    const observer = this.astro.createObserver(location.lat, location.lon, 0);
    // Use setUTCFullYear to avoid JS Date treating years 0-99 as 1900-based
    const searchStart = new Date(Date.UTC(2000, 0, 20));
    searchStart.setUTCFullYear(year);
    
    let searchDate = new Date(searchStart.getTime());
    const attempts = [];
    
    // Search up to 7 full moons (Jan-Jul)
    for (let attempt = 0; attempt < 7; attempt++) {
      const result = this.astro.searchMoonPhase(180, searchDate, 40);
      if (!result) break;
      
      const fullMoonDate = result.date;
      
      // Find the FIRST SUNRISE AFTER the full moon at this location
      // This is the correct time to check Moon vs Spica position
      // The rule is: "On the morning after the full moon, has Moon passed Spica?"
      
      // Search for sunrise starting from the full moon time
      // This finds the next sunrise after the full moon occurs
      const sunriseResult = this.astro.searchRiseSet('sun', observer, +1, fullMoonDate, 1);
      const sunriseTime = sunriseResult ? sunriseResult.date : fullMoonDate;
      
      // Calculate local date for logging
      const offsetHours = location.lon / 15;  // Each 15° = 1 hour
      const localSunriseTime = new Date(sunriseTime.getTime() + offsetHours * 60 * 60 * 1000);
      const localYear = localSunriseTime.getUTCFullYear();
      const localMonth = localSunriseTime.getUTCMonth();
      const localDay = localSunriseTime.getUTCDate();
      
      // Get Moon's RA at sunrise
      const moonEquator = this.astro.getEquator('moon', sunriseTime, observer);
      const moonCenterRA = moonEquator ? moonEquator.ra * 15 : 0;  // Convert hours to degrees
      const MOON_ANGULAR_RADIUS = 0.25;
      const moonLeadingEdgeRA = moonCenterRA + MOON_ANGULAR_RADIUS;
      
      const diff = moonLeadingEdgeRA - spicaRA;
      const spicaSetsFirst = diff > 0;
      
      // Virgo logging removed for cleaner console
      
      attempts.push({
        fullMoon: fullMoonDate.toISOString(),
        moonRA: moonLeadingEdgeRA.toFixed(3),
        spicaRA: spicaRA.toFixed(3),
        diff: diff.toFixed(3),
        qualifies: spicaSetsFirst
      });
      
      if (spicaSetsFirst) {
        // Found qualifying moon - cache and return
        this._virgoCache[cacheKey] = {
          year,
          selectedFullMoon: fullMoonDate.toISOString(),
          daystart: sunriseTime.toISOString(),
          moonRA: moonLeadingEdgeRA.toFixed(3),
          spicaRA: spicaRA.toFixed(3),
          difference: diff.toFixed(3),
          attempts,
          location: { lat: location.lat, lon: location.lon }
        };
        return fullMoonDate;
      }
      
      // Move to after this full moon
      searchDate = new Date(fullMoonDate.getTime() + 24 * 60 * 60 * 1000);
    }
    
    // Fallback: use last checked moon
    console.warn(`[Engine] No qualifying Virgo full moon found in 7 attempts for year ${year}`);
    const lastAttempt = attempts[attempts.length - 1];
    if (lastAttempt) {
      const fallbackDate = new Date(lastAttempt.fullMoon);
      this._virgoCache[cacheKey] = {
        year,
        selectedFullMoon: fallbackDate.toISOString(),
        fallback: true,
        attempts,
        location: { lat: location.lat, lon: location.lon }
      };
      return fallbackDate;
    }
    
    return null;
  }
  
  /**
   * Debug method: Check Moon and Spica RA at specific times
   * Call from console: AppStore._engine.debugMoonSpica(new Date('2025-04-12T17:00:00Z'), 35)
   */
  debugMoonSpica(date, lon = 0) {
    const observer = this.astro.createObserver(31.77, lon, 0);
    const moonEq = this.astro.getEquator('moon', date, observer);
    const moonRA = (moonEq?.ra || 0) * 15;  // Convert hours to degrees
    
    // Spica RA with precession
    const year = date.getUTCFullYear();
    const yearsFromJ2000 = year - 2000;
    const spicaRA = 201.298 + (yearsFromJ2000 * 0.0139);
    
    // Return data instead of logging - caller can log if needed
    return {
      date: date.toISOString(),
      lon,
      moonCenterRA: moonRA,
      moonLeadingEdgeRA: moonRA + 0.25,
      spicaRA,
      diff: moonRA + 0.25 - spicaRA
    };
    
    return { moonRA, spicaRA, diff: moonRA + 0.25 - spicaRA };
  }
  
  /**
   * Get Virgo calculation details for a specific year and location (for UI display)
   * @param {number} year
   * @param {Object} location - { lat, lon }
   * @returns {Object|null} Cached Virgo calculation details
   */
  getVirgoCalculation(year, location) {
    const cacheKey = `${year}_${location.lat.toFixed(4)}_${location.lon.toFixed(4)}`;
    return this._virgoCache[cacheKey] || null;
  }

  /**
   * Convert UTC date to local date based on longitude
   * @param {Date} utcDate 
   * @param {number} longitude 
   * @returns {Date}
   */
  getLocalDate(utcDate, longitude) {
    // Shift the instant by the solar-time offset (15° per hour) and take the
    // UTC calendar date of the shifted instant. Shifting the INSTANT lets the
    // Date roll month and year correctly. (The previous version bumped the
    // day-of-month on a year-2000 template and then restored the original
    // year, so a local midnight crossing on Dec 31 / Jan 1 landed a whole
    // year off — at Sydney or Honolulu that turned a month into 394 days.)
    const shifted = new Date(utcDate.getTime() + (longitude / 15) * 60 * 60 * 1000);
    const result = new Date(Date.UTC(2000, shifted.getUTCMonth(), shifted.getUTCDate(), 0, 0, 0));
    result.setUTCFullYear(shifted.getUTCFullYear());
    return result;
  }

  /**
   * Get sunrise timestamp for a date at given location
   * @param {Date} date 
   * @param {Object} location - { lat, lon }
   * @returns {number|null} UTC timestamp of sunrise
   */
  getSunriseTime(date, location) {
    const observer = this.dayBoundaryObserver(location);
    
    // Search from midnight
    const midnight = new Date(Date.UTC(2000, date.getUTCMonth(), date.getUTCDate(), 0, 0, 0));
    midnight.setUTCFullYear(date.getUTCFullYear());
    
    const result = this.astro.searchRiseSet('sun', observer, +1, midnight, 1);
    return result ? result.date.getTime() : null;
  }

  /**
   * Get day start time (sunset or sunrise/twilight) for a date
   * @param {Date} date 
   * @param {Object} location - { lat, lon }
   * @returns {number} UTC timestamp of day start
   */
  getDayStartTime(date, location) {
    const observer = this.dayBoundaryObserver(location);
    
    const midnight = new Date(Date.UTC(2000, date.getUTCMonth(), date.getUTCDate(), 0, 0, 0));
    midnight.setUTCFullYear(date.getUTCFullYear());
    
    let searchStart, direction;
    if (this.config.dayStartTime === 'evening') {
      // Search FORWARD from noon to find THIS day's sunset
      // (not backward from midnight which finds previous day's sunset)
      searchStart = new Date(midnight.getTime() + 12 * 60 * 60 * 1000); // noon
      direction = -1; // sunset
    } else {
      searchStart = midnight;
      direction = +1; // sunrise
    }
    
    let result;
    if (this.config.dayStartAngle === 0) {
      result = this.astro.searchRiseSet('sun', observer, direction, searchStart, 1);
    } else {
      result = this.astro.searchAltitude('sun', observer, direction, searchStart, 1, -this.config.dayStartAngle);
    }
    
    if (result) {
      return result.date.getTime();
    }
    
    // Fallback
    if (this.config.dayStartTime === 'evening') {
      return midnight.getTime() + 18 * 60 * 60 * 1000; // 6pm same day
    } else {
      return midnight.getTime() + 6 * 60 * 60 * 1000; // 6am
    }
  }

  // ==========================================================================
  // CALENDAR GENERATION
  // ==========================================================================

  /**
   * Calculate the start date of a lunar month
   * @param {Date} moonEvent - The moon event (new moon, full moon, or crescent)
   * @param {Object} location - { lat, lon }
   * @returns {Date} The date when Day 1 of the month starts
   */
  calculateMonthStart(moonEvent, location) {
    const localDate = this.getLocalDate(moonEvent, location.lon);
    const monthStart = new Date(localDate.getTime());

    if (this.config.moonPhase === 'crescent') {
      // The crescent event (conjunction + threshold) marks when the moon
      // becomes old enough to see — but a crescent is only ever SEEN at
      // dusk. Day 1 is the day the sighting evening opens: find the first
      // sunset at/after the event; that sunset begins Day 1, whose daytime
      // is the civil day AFTER it. (Author ruling 2026-08-04, 30 AD:
      // conjunction Wed Mar 22 ~8pm local -> crescent visible the evening
      // of Mar 23 -> Mar 24 is Day 1. The old rule started the month with
      // the day CONTAINING the event, calling Mar 23 Day 1 — a day on
      // which no crescent had yet been seen.)
      const sunsetTs = this.getSunsetTime(localDate, location);
      if (sunsetTs == null || moonEvent.getTime() > sunsetTs) {
        // Not old enough by this dusk - first sighting is the next dusk
        monthStart.setUTCDate(monthStart.getUTCDate() + 1);
      }
      // The sighting dusk opens the day whose daytime follows it
      monthStart.setUTCDate(monthStart.getUTCDate() + 1);
      return monthStart;
    }

    // Dark/full moon: Day 1 is the lunar day CONTAINING the event, bounded
    // by the profile's own day-start (sunset or sunrise per config).
    const dayStartTs = this.getDayStartTime(localDate, location);
    if (dayStartTs != null) {
      if (moonEvent.getTime() > dayStartTs) {
        // Moon event after this day's start - Day 1 starts next day
        monthStart.setUTCDate(monthStart.getUTCDate() + 1);
      }
    } else {
      // Fallback: add 1 day
      monthStart.setUTCDate(monthStart.getUTCDate() + 1);
    }
    
    return monthStart;
  }

  /**
   * True sunset (sun at horizon) for a local civil date — config-independent.
   * Crescent visibility is tied to dusk regardless of when the profile
   * starts its day.
   * @param {Date} date
   * @param {Object} location - { lat, lon }
   * @returns {number|null} UTC timestamp of that civil day's sunset
   */
  getSunsetTime(date, location) {
    const observer = this.dayBoundaryObserver(location);
    const noon = new Date(Date.UTC(2000, date.getUTCMonth(), date.getUTCDate(), 12, 0, 0));
    noon.setUTCFullYear(date.getUTCFullYear());
    const result = this.astro.searchRiseSet('sun', observer, -1, noon, 1);
    return result ? result.date.getTime() : null;
  }

  /**
   * Generate a full lunar calendar year
   * @param {number} year - Gregorian year (negative for BC)
   * @param {Object} location - { lat, lon } - REQUIRED
   * @param {Object} options - { includeUncertainty: boolean, debug: boolean }
   * @returns {LunarYear} Complete lunar year with all months and days
   */
  generateYear(year, location, options = {}) {
    if (!location || typeof location.lat !== 'number' || typeof location.lon !== 'number') {
      throw new Error('generateYear requires explicit location { lat, lon }');
    }
    
    const { includeUncertainty = true, debug = false } = options;
    
    // Build cache key from year, location, and all config that affects calendar
    const configKey = `${this.config.moonPhase}_${this.config.yearStartRule}_${this.config.dayStartTime}_${this.config.dayStartAngle}_${this.config.crescentThreshold || 0}`;
    const cacheKey = `${year}_${location.lat.toFixed(4)}_${location.lon.toFixed(4)}_${configKey}`;
    
    // Check cache first - calendars are expensive to compute
    if (this._calendarCache[cacheKey]) {
      if (debug) {
        console.log(`[Engine Debug] Using cached calendar for key: ${cacheKey}`);
      }
      return this._calendarCache[cacheKey];
    }
    
    const moonEvents = this.findMoonEvents(year);
    const yearStartPoint = this.getYearStartPoint(year, location);
    
    if (debug) {
      console.log(`[Engine Debug] Year: ${year}, MoonPhase: ${this.config.moonPhase}, YearStartRule: ${this.config.yearStartRule}`);
      console.log(`[Engine Debug] yearStartPoint: ${yearStartPoint.toISOString()}`);
      console.log(`[Engine Debug] Spring equinox: ${this.getSpringEquinox(year).toISOString()}`);
      console.log(`[Engine Debug] Found ${moonEvents.length} moon events`);
      if (moonEvents.length > 0) {
        console.log(`[Engine Debug] All moon events around equinox:`);
        moonEvents.forEach((e, i) => {
          const diff = (e.getTime() - yearStartPoint.getTime()) / (24*60*60*1000);
          if (Math.abs(diff) < 60) { // Only show events within 60 days of year start
            console.log(`  [${i}] ${e.toISOString()} (${diff.toFixed(1)} days from yearStart, >= yearStart: ${e >= yearStartPoint})`);
          }
        });
      }
    }
    
    // Find Nisan moon (first moon on or after year start point)
    const nissanMoonIdx = moonEvents.findIndex(e => e >= yearStartPoint);
    if (nissanMoonIdx === -1) {
      // Always log for debugging this issue
      console.log(`[Engine Debug] FAILED to find Nisan for year ${year}`);
      console.log(`[Engine Debug] yearStartPoint: ${yearStartPoint.toISOString()} (ms: ${yearStartPoint.getTime()})`);
      console.log(`[Engine Debug] Found ${moonEvents.length} moon events`);
      if (moonEvents.length > 0) {
        console.log(`[Engine Debug] First event: ${moonEvents[0].toISOString()} (ms: ${moonEvents[0].getTime()})`);
        console.log(`[Engine Debug] Last event: ${moonEvents[moonEvents.length-1].toISOString()}`);
        // Show comparison
        moonEvents.slice(0, 5).forEach((e, i) => {
          console.log(`  [${i}] ${e.toISOString()} >= ${yearStartPoint.toISOString()} ? ${e >= yearStartPoint} (diff: ${e.getTime() - yearStartPoint.getTime()})`);
        });
      }
      throw new Error(`No Nisan moon found for year ${year}`);
    }
    
    if (debug) {
      console.log(`[Engine Debug] Nisan moon index: ${nissanMoonIdx}, date: ${moonEvents[nissanMoonIdx].toISOString()}`);
    }
    
    // Calculate year-start uncertainty
    // If Nisan moon is close to year start point, ΔT could cause wrong moon selection
    const nissanMoon = moonEvents[nissanMoonIdx];
    const yearStartMarginMs = nissanMoon.getTime() - yearStartPoint.getTime();
    const yearStartMarginHours = yearStartMarginMs / (1000 * 60 * 60);
    const deltaTUncertaintyHours = this.getDeltaTUncertainty(year);
    
    let yearStartUncertainty = null;
    if (deltaTUncertaintyHours > 0 && yearStartMarginHours <= deltaTUncertaintyHours) {
      // Nisan moon is close to boundary - year selection could be wrong
      const probability = Math.round(((deltaTUncertaintyHours - yearStartMarginHours) / (2 * deltaTUncertaintyHours)) * 100);
      if (probability > 0) {
        yearStartUncertainty = {
          direction: 'ahead',  // Our dates are potentially 1 month ahead of reality
          probability: probability,
          marginHours: yearStartMarginHours,
          uncertaintyHours: deltaTUncertaintyHours
        };
      }
    }
    
    const months = [];
    
    // Get the next year's start point once - this is the boundary
    // A month belongs to this year if its full moon is BEFORE the next year's start point
    const nextYearStartPoint = this.getYearStartPoint(year + 1, location);
    
    // Generate months until we hit one that belongs to the next year
    for (let m = 0; m < 14; m++) {  // Max 14 to prevent infinite loop
      const moonIdx = nissanMoonIdx + m;
      if (moonIdx >= moonEvents.length - 1) break;
      
      const moonEvent = moonEvents[moonIdx];
      
      // A month belongs to the next year if its full moon is ON or AFTER the next year's start point
      if (moonEvent >= nextYearStartPoint) {
        break;
      }
      
      const nextMoonEvent = moonEvents[moonIdx + 1];
      
      const monthStart = this.calculateMonthStart(moonEvent, location);
      const nextMonthStart = this.calculateMonthStart(nextMoonEvent, location);
      
      const daysInMonth = Math.round((nextMonthStart - monthStart) / (24 * 60 * 60 * 1000));
      
      // Calculate uncertainty for this month (affects all days in month)
      let monthUncertainty = null;
      if (includeUncertainty) {
        monthUncertainty = this.checkDateUncertainty(year, moonEvent, location);
      }
      
      // Generate days
      const days = [];
      // Calculate month start JD for use in day iteration
      const monthStartJD = (monthStart.getTime() / 86400000) + 2440587.5;
      
      for (let d = 1; d <= daysInMonth; d++) {
        // Calculate JD for this day (using approximate day offset)
        const approxDayJD = monthStartJD + (d - 1);
        
        // Create a temporary date for astronomical calculations (sunrise/sunset)
        // This is still needed for the astronomy engine which works with Date objects
        const tempDate = new Date(monthStart.getTime());
        tempDate.setUTCDate(tempDate.getUTCDate() + d - 1);
        
        // Calculate the day boundary JD for this day at this location
        // Uses getDayStartTime which respects dayStartAngle (nautical dawn, civil dawn, etc.)
        let dayStartJD = null;
        const dayStartTs = this.getDayStartTime(tempDate, location);
        if (dayStartTs != null) {
          dayStartJD = (dayStartTs / 86400000) + 2440587.5;
        }
        // Fallback to midnight if day start time not available
        if (dayStartJD == null) {
          dayStartJD = approxDayJD;
        }
        
        // Derive the day's civil identity from the civil day this iteration
        // targets (tempDate), converted to a JDN by pure arithmetic — no Date
        // weekday converters. NOTE the boundary semantics: getDayStartTime
        // returns a boundary ON tempDate's own civil day (evening mode = THIS
        // day's sunset, i.e. the day's CLOSING boundary; morning mode = this
        // day's sunrise, its opening boundary). So dayStartJD always lies
        // within ±12h of this day's noon and Math.round(dayStartJD) === dayJDN
        // — but tempDate's labels are the primary source, valid at any
        // longitude. Date label AND weekday both derive from this one JDN, so
        // they can never refer to different physical days.
        const dayJDN = JulianDay.gregorianToJDN(
          tempDate.getUTCFullYear(), tempDate.getUTCMonth() + 1, tempDate.getUTCDate());
        const dayDate = JulianDay.jdToDisplayDate(dayJDN);
        
        // Determine if this specific day is uncertain
        // Day 30 with '+' direction is impossible (can't add days past 30)
        // All days with '-' direction could shift earlier
        let isUncertain = false;
        if (monthUncertainty && monthUncertainty.isUncertain) {
          if (monthUncertainty.direction === '-') {
            isUncertain = true; // All days could shift 1 day earlier
          } else if (monthUncertainty.direction === '+' && d < 30) {
            isUncertain = true; // Days 1-29 could shift 1 day later
          }
        }
        
        // Weekday by pure modular arithmetic on the day count — no Date
        // converters, no calendar conventions: (JDN + 1) mod 7 anchored on the
        // known fact JDN 0 = Monday. Same JDN as the date label above, so the
        // displayed date and weekday are guaranteed to agree.
        const weekday = JulianDay.jdnToWeekday(dayJDN);
        
        days.push({
          lunarDay: d,
          gregorianDate: dayDate,  // Now uses Julian calendar for ancient dates
          jd: dayStartJD,  // JD of day start (sunrise/sunset based on config)
          weekday: weekday,
          weekdayName: JulianDay.WEEKDAY_NAMES[weekday],
          isUncertain: isUncertain,
          uncertaintyDirection: isUncertain ? monthUncertainty.direction : null,
          uncertaintyProbability: isUncertain ? monthUncertainty.probability : 0,
        });
      }
      
      // Convert month start to appropriate calendar (Julian for ancient)
      const monthStartDate = JulianDay.jdToDisplayDate(monthStartJD);
      
      months.push({
        monthNumber: m + 1,
        moonEvent: moonEvent,
        startDate: monthStartDate,  // Now uses Julian calendar for ancient dates
        startJD: monthStartJD,
        daysInMonth: daysInMonth,
        days: days,
        uncertainty: monthUncertainty,
      });
    }
    
    const result = {
      year: year,
      location: location,
      config: { ...this.config },
      springEquinox: this.getSpringEquinox(year),
      yearStartPoint: yearStartPoint,
      yearStartUncertainty: yearStartUncertainty,
      months: months,
    };
    
    // Cache the result - limit cache size to prevent memory bloat
    // Size 50 allows caching ~2 years of timezone bands (24 per year)
    const cacheKeys = Object.keys(this._calendarCache);
    if (cacheKeys.length > 50) {
      // Remove oldest entry (first key)
      delete this._calendarCache[cacheKeys[0]];
    }
    this._calendarCache[cacheKey] = result;
    
    return result;
  }

  // ==========================================================================
  // DATE QUERIES
  // ==========================================================================

  /**
   * Get information about a specific lunar day
   * @param {LunarYear} calendar - Generated calendar
   * @param {number} month - Month number (1-13)
   * @param {number} day - Day number (1-30)
   * @returns {Object|null} Day information or null if not found
   */
  getDayInfo(calendar, month, day) {
    const monthData = calendar.months.find(m => m.monthNumber === month);
    if (!monthData) return null;
    
    const dayData = monthData.days.find(d => d.lunarDay === day);
    if (!dayData) return null;
    
    return {
      lunarMonth: month,
      lunarDay: day,
      gregorianDate: dayData.gregorianDate,
      jd: dayData.jd,
      weekday: dayData.weekday,
      weekdayName: dayData.weekdayName,
      monthData: monthData,
    };
  }

  /**
   * Find which lunar day a Gregorian date falls on
   * @param {LunarYear} calendar - Generated calendar
   * @param {Date} gregorianDate - Gregorian date to find
   * @returns {Object|null} Lunar day information or null if not found
   */
  findLunarDay(calendar, gregorianDate) {
    const targetDateStr = gregorianDate.toISOString().split('T')[0];
    
    for (const month of calendar.months) {
      for (const day of month.days) {
        const dayDateStr = day.gregorianDate.toISOString().split('T')[0];
        if (dayDateStr === targetDateStr) {
          return {
            lunarMonth: month.monthNumber,
            lunarDay: day.lunarDay,
            gregorianDate: day.gregorianDate,
            weekday: day.weekday,
            weekdayName: day.weekdayName,
          };
        }
      }
    }
    
    return null;
  }

  // ==========================================================================
  // WEEKDAY CALCULATIONS
  // ==========================================================================

  /**
   * True when a display-labeled Date falls before the Gregorian reform
   * (Oct 15, 1582), i.e. its UTC fields are Julian-calendar labels.
   * @param {Date} date
   * @returns {boolean}
   */
  isBeforeGregorianReform(date) {
    return JulianDay.isDisplayJulian(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate());
  }

  /**
   * Weekday of a display-labeled Date (engine output). getUTCDay() would
   * read pre-1582 Julian labels as Gregorian and drift by the era offset.
   * @param {Date} date
   * @returns {number} 0 = Sunday, 6 = Saturday
   */
  getWeekday(date) {
    return JulianDay.displayDateToWeekday(date);
  }

  /**
   * Get weekday name
   * @param {Date} date
   * @returns {string}
   */
  getWeekdayName(date) {
    return JulianDay.WEEKDAY_NAMES[this.getWeekday(date)];
  }

  // ==========================================================================
  // UNCERTAINTY CALCULATIONS
  // ==========================================================================

  /**
   * Get ΔT uncertainty in hours for a given year
   * @param {number} year 
   * @returns {number} Uncertainty in hours
   */
  getDeltaTUncertainty(year) {
    // Delegate to astronomy engine if available
    if (this.astro.getDeltaTUncertainty) {
      return this.astro.getDeltaTUncertainty(year);
    }
    
    // Modern dates: negligible uncertainty
    if (year >= 1600 && year <= 2100) {
      return 0;
    }
    
    // Ancient dates: uncertainty grows
    const yearsFromPresent = Math.abs(year - 2000);
    
    if (yearsFromPresent <= 500) return 0.25;
    if (yearsFromPresent <= 1000) return 0.5;
    if (yearsFromPresent <= 1500) return 1;
    if (yearsFromPresent <= 2000) return 1.5;
    if (yearsFromPresent <= 2500) return 2;
    if (yearsFromPresent <= 3000) return 2.5;
    if (yearsFromPresent <= 4000) return 3;
    if (yearsFromPresent <= 5000) return 4;
    return 6;
  }

  /**
   * Calculate margin between moon event and day boundary (sunset/sunrise)
   * @param {Date} moonEvent 
   * @param {Object} location - { lat, lon }
   * @returns {Object} { marginHours, isAfterBoundary }
   */
  calculateMargin(moonEvent, location) {
    const localDate = this.getLocalDate(moonEvent, location.lon);
    const moonEventLocalTime = moonEvent.getTime() + (location.lon / 15) * 60 * 60 * 1000;
    
    let boundaryTime;
    if (this.config.dayStartTime === 'evening') {
      boundaryTime = this.getSunsetTime(localDate, location);
    } else {
      boundaryTime = this.getSunriseTime(localDate, location);
    }
    
    if (boundaryTime == null) {
      return { marginHours: Infinity, isAfterBoundary: false };
    }
    
    const boundaryLocalTime = boundaryTime + (location.lon / 15) * 60 * 60 * 1000;
    const marginMs = Math.abs(moonEventLocalTime - boundaryLocalTime);
    const marginHours = marginMs / (60 * 60 * 1000);
    const isAfterBoundary = moonEventLocalTime > boundaryLocalTime;
    
    return { marginHours, isAfterBoundary };
  }

  /**
   * Check if a date calculation is uncertain due to ΔT
   * 
   * This applies to ALL moon phases (dark, full, crescent). The ΔT uncertainty
   * affects the calculated time of the astronomical event. If that event time
   * is close to the day boundary (sunset/sunrise), the uncertainty could shift
   * whether Day 1 starts on this date or the next.
   * 
   * For crescent moons: The conjunction time has ΔT uncertainty. If conjunction
   * is near the boundary, we can't be sure if the crescent would be visible
   * that evening or the next. (There's also additional visibility uncertainty
   * from atmospheric conditions, but that's separate from this calculation.)
   * 
   * @param {number} year 
   * @param {Date} moonEvent 
   * @param {Object} location 
   * @returns {Object} { isUncertain, probability, direction, marginHours, uncertaintyHours }
   */
  checkDateUncertainty(year, moonEvent, location) {
    const result = {
      isUncertain: false,
      probability: 0,
      direction: null,
      marginHours: null,
      uncertaintyHours: 0,
    };
    
    const uncertaintyHours = this.getDeltaTUncertainty(year);
    result.uncertaintyHours = uncertaintyHours;
    
    if (uncertaintyHours === 0) {
      return result;
    }
    
    const { marginHours, isAfterBoundary } = this.calculateMargin(moonEvent, location);
    result.marginHours = marginHours;
    
    if (marginHours <= uncertaintyHours) {
      // Calculate probability that the date is wrong
      // If margin is M and uncertainty is ±U, probability = (U - M) / (2U)
      // This represents the chance that true position crossed the day boundary
      result.probability = Math.round(((uncertaintyHours - marginHours) / (2 * uncertaintyHours)) * 100);
      result.isUncertain = true;
      
      // Direction indicates which way dates could shift if our calculation is wrong
      // After boundary (event after sunset): prior month got an extra day, so THIS month's
      // dates could be 1 day earlier (-) if the event was actually before boundary
      // Before boundary (event before sunset): prior month may be short a day, so THIS month's
      // dates could be 1 day later (+) if the event was actually after boundary
      result.direction = isAfterBoundary ? '-' : '+';
    }
    
    return result;
  }

  /**
   * Get uncertainty info for a generated calendar month
   * @param {Object} monthData - Month from generateYear result
   * @param {Object} location - { lat, lon }
   * @returns {Object} { isUncertain, probability, direction, marginHours, uncertaintyHours }
   */
  getMonthUncertainty(monthData, location) {
    const year = monthData.moonEvent.getUTCFullYear();
    return this.checkDateUncertainty(year, monthData.moonEvent, location);
  }
}

// ==========================================================================
// NOTES ON UNCERTAINTY
// ==========================================================================

/**
 * ΔT UNCERTAINTY (applies to all moon phases):
 * 
 * ΔT (Delta T) is the difference between terrestrial time and universal time.
 * For ancient dates, ΔT is estimated from historical eclipse records but has
 * growing uncertainty the further back we go:
 * 
 *   500 BC:  ~0.5 hours
 *   1000 BC: ~1 hour
 *   1500 BC: ~1.5 hours
 *   2000 BC: ~2 hours
 *   3000 BC: ~3 hours
 * 
 * If a moon event (conjunction, full moon, dark moon) falls within this
 * uncertainty window of a day boundary (sunset/sunrise), we cannot be certain
 * which day the month started.
 * 
 * CRESCENT VISIBILITY (additional uncertainty for crescent calendars):
 * 
 * Beyond ΔT, crescent visibility has additional uncertainty due to:
 * - Atmospheric conditions (humidity, dust, light pollution)
 * - Observer experience and eyesight
 * - Altitude and location
 * - Time of year (angle of ecliptic affects crescent visibility)
 * 
 * This visibility uncertainty is NOT calculated by this engine.
 * Historical records of first crescent sightings would be needed
 * to properly calibrate it for specific locations.
 */

// ==========================================================================
// STATIC UTILITY METHODS
// ==========================================================================

/**
 * Get uncertainty explanation text for month-level uncertainty
 * @param {Object} uncertainty - Result from checkDateUncertainty
 * @returns {string}
 */
LunarCalendarEngine.getUncertaintyExplanation = function(uncertainty) {
  if (!uncertainty || !uncertainty.isUncertain) {
    return '';
  }
  
  const { probability, direction, marginHours, uncertaintyHours } = uncertainty;
  const dirText = direction === '+' ? 'later' : 'earlier';
  
  return `Moon event was ${marginHours?.toFixed(1) || '?'} hours from day boundary. ` +
         `With ±${uncertaintyHours} hours ΔT uncertainty, there's a ${probability}% chance ` +
         `dates could be 1 day ${dirText}.`;
};

/**
 * Get year-start uncertainty explanation text
 * @param {Object} yearUncertainty - yearStartUncertainty from generateYear result
 * @returns {string}
 */
LunarCalendarEngine.getYearUncertaintyExplanation = function(yearUncertainty) {
  if (!yearUncertainty || yearUncertainty.probability <= 0) {
    return '';
  }
  
  const { probability, direction, marginHours, uncertaintyHours } = yearUncertainty;
  
  return `Nisan moon was ${marginHours?.toFixed(1) || '?'} hours after year start point. ` +
         `With ±${uncertaintyHours} hours ΔT uncertainty, there's a ${probability}% chance ` +
         `all months are 1 month ${direction}.`;
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { LunarCalendarEngine };
}
