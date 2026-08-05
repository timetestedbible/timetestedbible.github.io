/**
 * SabbathTesterView - Test biblical events against calendar theories
 * 
 * Ported from http-v1/sabbath-tester.js
 * Adapted to use LunarCalendarEngine and AppStore architecture
 */

// Biblical test cases - extensible array
//
// expectedWeekPosition: which day of the 7-day cycle the lunar date must fall on
//   7 = Sabbath (7th day), 1 = 1st day (day after Sabbath), 6 = 6th day (day before Sabbath), etc.
//
// For lunar sabbath calendars, the week position is inherent in the lunar date:
//   Days 8,15,22,29 = 7th day (Sabbath)
//   Days 2,9,16,23  = 1st day (day after Sabbath)
//   Days 3,10,17,24 = 2nd day, etc.
//
// For fixed-weekday sabbath calendars, the expected Gregorian weekday is computed
// from the profile's sabbathMode + expectedWeekPosition at test time.
const BIBLICAL_TESTS = [
  {
    id: 'manna-sabbath',
    name: 'First Sabbath of Manna',
    description: 'Israel arrived in the Wilderness of Sin on the 15th of the Second Month, 1446 BC (Exodus 16:1). Manna first fell on the 16th (the morning after arrival). They gathered manna for 6 days (16th-21st), and the 22nd was explicitly called the Sabbath when no manna fell (Exodus 16:22-26). Therefore, the 22nd of the 2nd month must be the 7th day of the week — which is Saturday for Saturday-Sabbath calendars, and is always true for Lunar Sabbath calendars where the 22nd is inherently the Sabbath.',
    scripture: 'Exodus 16:1-26',
    year: -1445,  // Astronomical year (1446 BC = -1445)
    alternateYears: [-1446, -1444],  // 1447 BC / 1445 BC — exodus-date ±1 sensitivity
    month: 2,     // Second month (Iyar)
    day: 22,
    expectedWeekPosition: 7,  // 7th day = Sabbath
    location: { lat: 29.1500, lon: 33.4000, name: 'Wilderness of Sin' }
  },
  {
    id: 'first-fruits-1406',
    name: 'First Fruits After Jordan Crossing',
    description: 'The 16th of the First Month, 1406 BC was First Fruits when Israel ate the produce of Canaan for the first time (Joshua 5:10-12). According to Leviticus 23:11, First Fruits is offered "on the day after the Sabbath," which means the 16th must be the 1st day of the week — Sunday for Saturday-Sabbath calendars, and always true for Lunar Sabbath calendars where the 16th is inherently the day after the 15th (Sabbath).',
    scripture: 'Joshua 5:10-12, Leviticus 23:11',
    year: -1405,  // Astronomical year (1406 BC = -1405)
    alternateYears: [-1406, -1404],  // 1407 BC / 1405 BC — tied to exodus ±1
    month: 1,     // First month (Nisan)
    day: 16,
    expectedWeekPosition: 1,  // 1st day = day after Sabbath
    location: { lat: 31.8500, lon: 35.4500, name: 'Jericho' }
  },
  {
    id: 'resurrection-32ad',
    name: 'Resurrection of Jesus (32 AD)',
    description: 'Jesus rose from the dead on the 1st day of the week (Matthew 28:1, Mark 16:2, Luke 24:1, John 20:1), which was also First Fruits (Leviticus 23:11). He was crucified on Passover (14th), rested in the tomb on the 15th (Sabbath), and rose on the 16th. The 16th must be the 1st day of the week — Sunday for Saturday-Sabbath calendars, and always true for Lunar Sabbath calendars.',
    scripture: 'Matthew 28:1, 1 Corinthians 15:20',
    year: 32,  // 32 AD
    month: 1,  // First month (Nisan)
    day: 16,   // First Fruits / Resurrection
    expectedWeekPosition: 1,  // 1st day = day after Sabbath
    location: { lat: 31.7683, lon: 35.2137, name: 'Jerusalem' }
  },
  {
    id: 'passover-30ad',
    name: 'Passover / Crucifixion (30 AD)',
    description: 'Alternative crucifixion year theory. Jesus was crucified on Passover, the 14th of Nisan (John 19:14). For Jesus to rest in the tomb on the Sabbath (15th) and rise on the 1st day of the week (16th), the 14th must be the 6th day of the week — Friday for Saturday-Sabbath calendars, and always true for Lunar Sabbath calendars where the 14th is inherently the day before the 15th (Sabbath).',
    scripture: 'John 19:14, Matthew 27:62, Mark 15:42',
    year: 30,  // 30 AD
    month: 1,  // First month (Nisan)
    day: 14,   // Passover / Crucifixion
    expectedWeekPosition: 6,  // 6th day = day before Sabbath
    location: { lat: 31.7683, lon: 35.2137, name: 'Jerusalem' },
    excludeFromScore: true  // Alternative theory - don't include in main score
  },
  {
    id: 'resurrection-33ad',
    name: 'Passover / Crucifixion (33 AD)',
    description: 'Alternative crucifixion year theory — the classical "Good Friday, April 3, 33 AD." Jesus was crucified on Passover, the 14th of Nisan (John 19:14). For Jesus to rest in the tomb on the Sabbath (15th) and rise on the 1st day of the week (16th), the 14th must be the 6th day of the week — Friday for Saturday-Sabbath calendars, and always true for Lunar Sabbath calendars where the 14th is inherently the day before the 15th (Sabbath).',
    scripture: 'John 19:14, Matthew 27:62, Mark 15:42',
    year: 33,  // 33 AD
    month: 1,  // First month (Nisan)
    day: 14,   // Passover / Crucifixion
    expectedWeekPosition: 6,  // 6th day = day before Sabbath
    location: { lat: 31.7683, lon: 35.2137, name: 'Jerusalem' },
    excludeFromScore: true  // Alternative theory - don't include in main score
  },
  {
    id: 'temple1-talmud',
    name: 'First Temple Destruction (Talmud)',
    description: 'The Talmud (Ta\'anit 29a) claims both Temples fell on the 9th of Av "at the conclusion of Shabbat" (post-Sabbath). The Talmud reconciles biblical accounts (7th in 2 Kings, 10th in Jeremiah) by describing a multi-day process where the fire was set toward the end of the 9th. This tests whether the 9th of Av falls on the 1st day of the week (day after Sabbath) — Sunday for Saturday-Sabbath calendars, and always true for Lunar Sabbath calendars where the 9th is inherently the day after the 8th (Sabbath).',
    scripture: 'Talmud Ta\'anit 29a, Arakhin 11b',
    year: -585,  // Astronomical year (586 BC = -585)
    month: 5,    // Fifth month (Av)
    day: 9,      // 9th of Av per Talmud
    expectedWeekPosition: 1,  // 1st day = day after Sabbath ("post-Shabbat")
    location: { lat: 31.7683, lon: 35.2137, name: 'Jerusalem' },
    excludeFromScore: true,  // Extra-biblical tradition test
    extraBiblical: true  // counts in the HISTORY score, never the BIBLE score
  },
  {
    id: 'temple2-talmud',
    name: 'Second Temple Destruction (Talmud)',
    description: 'The Talmud claims the Second Temple also fell on the 9th of Av "at the conclusion of Shabbat" (1st day of the week), mirroring the First Temple. Josephus records the destruction on the 10th and notes the Romans built siege ramps on the 8th while Jews rested (implying the 8th was a Sabbath). This tests whether the 9th of Av falls on the 1st day — Sunday for Saturday-Sabbath calendars, and always true for Lunar Sabbath calendars.',
    scripture: 'Talmud Ta\'anit 29a, Josephus Jewish War 6.4',
    year: 70,    // 70 AD
    month: 5,    // Fifth month (Av)
    day: 9,      // 9th of Av per Talmud
    expectedWeekPosition: 1,  // 1st day = day after Sabbath ("post-Shabbat")
    location: { lat: 31.7683, lon: 35.2137, name: 'Jerusalem' },
    excludeFromScore: true,  // Extra-biblical tradition test
    extraBiblical: true  // counts in the HISTORY score, never the BIBLE score
  }
];

const SabbathTesterView = {
  _isRendering: false,
  _hasRendered: false, // Track if we've completed rendering
  _testCache: {}, // Cache for test results: { 'testId-profileId': result }
  // Cache version: fingerprint of the actual computation inputs (the test
  // definitions + profile configs), NOT APP_VERSION — site.time changes on
  // every Jekyll rebuild (every deploy, and every file save under local
  // `jekyll serve --watch`), which busted the cache constantly. Any change
  // to tests or profiles re-fingerprints automatically; pure engine-algorithm
  // changes need a manual bump of the seed prefix in the fp assignment below.
  // The fingerprint also includes the ACTIVE astronomy engine identity, so
  // results computed by the fallback engine can never satisfy a cache lookup
  // once the real (Swiss/hybrid) engine is loaded. Only call after
  // astroEngineReady() resolves — it memoizes on first use.
  _cv: null,
  _cacheVersionGet() {
    if (this._cv) return this._cv;
    const djb2 = (str) => {
      let h = 5381;
      for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) >>> 0;
      return h.toString(36);
    };
    let fp = 'v11';
    try {
      const eng = (typeof getAstroEngine === 'function') ? getAstroEngine() : null;
      fp += ':' + (eng && eng.name ? djb2(String(eng.name) + '|' + String(eng.version || '')) : 'noeng');
      fp += ':' + djb2(JSON.stringify(typeof BIBLICAL_TESTS !== 'undefined' ? BIBLICAL_TESTS : []));
      fp += ':' + djb2(JSON.stringify(this.getSabbathTestProfiles()));
    } catch (e) {
      fp += ':' + String(typeof APP_VERSION !== 'undefined' ? APP_VERSION : 0);
    }
    this._cv = fp;
    return fp;
  },
  
  render(state, derived, container) {
    if (this._isRendering) return; // Prevent re-render loops
    
    // Skip re-render if we've already rendered and content is still there
    // The Sabbath Tester generates its own historical calendars and doesn't
    // depend on app state (location, current date, etc.)
    if (this._hasRendered && container.querySelector('.sabbath-tester-view')) {
      return;
    }
    
    container.innerHTML = `
      <div class="sabbath-tester-view">
        <div class="sabbath-tester-header">
          <h2>🔬 Sabbath Theory Tester</h2>
        </div>
        <div class="sabbath-tester-content">
          <div class="sabbath-tester-intro">
            <p>This tool tests the <strong>built-in calendar profiles</strong> against historical biblical events where specific weekdays are mentioned in Scripture.</p>
            <p>All tests use <strong>Jerusalem location</strong>. The goal is to determine which calendar configuration produces dates that align with the biblical record.</p>
          </div>
          <div id="sabbath-tester-configs-container"></div>
          <div id="sabbath-tester-loading" class="sabbath-test-loading">
            <div id="sabbath-progress-text">Loading tests...</div>
            <div class="sabbath-engine-build" id="sabbath-diagnostic" style="font-size:11px;color:var(--text-secondary);margin-top:4px;white-space:pre-wrap;font-family:monospace;">engine build: JDN-v11 — collecting diagnostics…</div>
            <div class="sabbath-progress-bar" id="sabbath-progress-bar" style="display:none">
              <div class="sabbath-progress-fill" id="sabbath-progress-fill"></div>
            </div>
          </div>
          <div id="sabbath-tester-results"></div>
        </div>
      </div>
    `;
    
    const configContainer = container.querySelector('#sabbath-tester-configs-container');
    if (configContainer) {
      configContainer.innerHTML = this.buildConfigurationsSectionHTML();
    }
    
    this._ensureTipHandlers();

    // Start rendering tests (async — yields between computations)
    this._isRendering = true;
    console.log('[SabbathTester] view build: JDN-v11 | engine has jdnToWeekday:',
      typeof LunarCalendarEngine !== 'undefined' && typeof LunarCalendarEngine.prototype.jdnToWeekday === 'function');
    this.renderTests(container);
  },
  
  /**
   * Year-start rule display: icon sequence + label
   * scales + calendar + lamb = month after eq; calendar + scales + lamb = passover after eq
   */
  getYearStartDisplay(rule) {
    switch (rule) {
      case 'equinox':
        return { icons: '⚖️📅🐑', label: 'Month after Eq' };
      case '1dayBefore':
        return { icons: '⚖️−1📅', label: 'Eq −1 day' };
      case '14daysBefore':
        return { icons: '📅⚖️🐑', label: 'Passover after Eq' };
      case 'virgoFeet':
        return { icons: '♍', label: "Moon under Virgo's feet" };
      case 'hebcal':
        return { icons: '🕎', label: 'Molad (Hebcal)' };
      default:
        return { icons: '⚖️📅🐑', label: rule || 'Month after Eq' };
    }
  },

  /**
   * Build HTML for the calendar configurations section (what each profile means)
   */
  buildConfigurationsSectionHTML() {
    const profiles = this.getSabbathTestProfiles();
    const moonLabels = { full: 'Full', dark: 'Dark', crescent: 'Crescent' };
    const dayStartLabels = { morning: 'Morning', evening: 'Evening' };
    const sabbathLabels = { lunar: 'Lunar (8,15,22,29)', saturday: 'Saturday' };

    let html = `
      <div class="sabbath-tester-configs">
        <h3>Calendar configurations tested</h3>
        <p class="configs-legend">
          <strong>Year start:</strong> ⚖️📅🐑 = Month after Eq (renewed moon after equinox). 
          📅⚖️🐑 = Passover after Eq (Day 15 on or after equinox).
        </p>
        <div class="configs-grid">
    `;
    for (const p of profiles) {
      const yearRule = p.calendarBackend === 'hebcal' ? 'hebcal' : p.yearStartRule;
      const yearDisplay = this.getYearStartDisplay(yearRule);
      const moon = moonLabels[p.moonPhase] || p.moonPhase;
      const dayStart = dayStartLabels[p.dayStartTime] || p.dayStartTime;
      const sabbath = sabbathLabels[p.sabbathMode] || p.sabbathMode;
      html += `
        <div class="config-card" data-profile="${p.id}">
          <div class="config-card-header">${this.profileTipSpan(p)}</div>
          <ul class="config-card-details">
            <li><strong>Month:</strong> ${moon}</li>
            <li><strong>Day start:</strong> ${dayStart}</li>
            <li><strong>Year start:</strong> <span class="config-year-icons" title="${yearDisplay.label}">${yearDisplay.icons}</span> ${yearDisplay.label}</li>
            <li><strong>Sabbath:</strong> ${sabbath}</li>
          </ul>
        </div>
      `;
    }
    html += `
        </div>
      </div>
    `;
    return html;
  },

  /**
   * Get test profiles from the built-in app profiles
   */
  /**
   * One-glance definition of a profile, composed from its actual config so
   * the text can never drift from what the engine computes.
   */
  profileTipText(p) {
    if (p.calendarBackend === 'hebcal') {
      return 'The fixed calculated rabbinic calendar (Hillel II molad arithmetic, via Hebcal) projected back in time — arithmetic, not observation. Fixed Saturday sabbath.';
    }
    const NOTES = {
      timeTested: "The book's 1st-edition reconstruction.",
      timeTested2: "The book's 2nd-edition reconstruction: Creator's Calendar boundaries moved to first light/last light.",
      ancientTraditional: 'The classical reconstruction behind Friday-crucifixion dating.',
      traditionalSaturday: 'Same as Ancient Traditional except the year rule: waits for the first month AFTER the equinox.',
      traditionalLunar: 'Crescent months with the sabbath counted from the month, not a fixed weekday.'
    };
    const moon = { full: 'Months begin at the full moon', dark: 'Months begin at the dark moon (conjunction)', crescent: 'Months begin at the first visible crescent' }[p.moonPhase] || '';
    const day = p.dayStartTime === 'evening'
      ? (p.dayStartAngle ? 'days begin at dusk (sun ' + p.dayStartAngle + '\u00B0 below horizon)' : 'days begin at sunset')
      : (p.dayStartAngle ? 'days begin at dawn (sun ' + p.dayStartAngle + '\u00B0 below horizon)' : 'days begin at sunrise');
    const year = {
      equinox: 'year starts with the first month after the spring equinox',
      '1dayBefore': 'year anchored to the equinox (month may begin one day before it)',
      '14daysBefore': 'year chosen so Passover falls on or after the equinox',
      virgoFeet: "year begins with the moon under Virgo's feet (Rev 12:1 Hebrew: Virgo is 'first of the twelve' constellations)"
    }[p.yearStartRule] || '';
    const sab = p.sabbathMode === 'lunar' ? 'sabbath on lunar days 8/15/22/29' : 'fixed Saturday sabbath';
    const note = NOTES[p.id] ? NOTES[p.id] + ' ' : '';
    return note + moon + '; ' + day + '; ' + year + '; ' + sab + '.';
  },

  /** Profile name wrapped for the shared tooltip (hover or tap). */
  profileTipSpan(p, label) {
    const tip = this.profileTipText(p).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
    return '<span class="profile-tip" data-tip="' + tip + '">' + (label || p.name) + '</span>';
  },

  /** Shared floating tooltip: hover on desktop, tap to toggle on mobile. */
  _ensureTipHandlers() {
    if (this._tipHandlersInstalled) return;
    this._tipHandlersInstalled = true;
    const pop = document.createElement('div');
    pop.id = 'profile-tip-pop';
    pop.style.display = 'none';
    document.body.appendChild(pop);
    let sticky = null;
    const show = (el) => {
      pop.textContent = el.getAttribute('data-tip') || '';
      pop.style.display = 'block';
      const r = el.getBoundingClientRect();
      pop.style.left = Math.max(8, Math.min(r.left, window.innerWidth - pop.offsetWidth - 8)) + 'px';
      const below = r.bottom + 8;
      const top = (below + pop.offsetHeight > window.innerHeight - 8) ? (r.top - pop.offsetHeight - 8) : below;
      pop.style.top = Math.max(8, top) + 'px';
    };
    const hide = () => { pop.style.display = 'none'; sticky = null; };
    document.addEventListener('mouseover', (e) => {
      const el = e.target.closest && e.target.closest('.profile-tip');
      if (el) show(el); else if (!sticky) hide();
    });
    // Capture phase + stopPropagation so a tap on the name doesn't also
    // trigger row handlers (scoreboard rows toggle on click).
    document.addEventListener('click', (e) => {
      const el = e.target.closest && e.target.closest('.profile-tip');
      if (el) {
        e.stopPropagation();
        if (sticky === el) hide(); else { sticky = el; show(el); }
      } else {
        hide();
      }
    }, true);
    window.addEventListener('scroll', hide, true);
  },

  getSabbathTestProfiles() {
    const allProfiles = window.PROFILES || {};
    const profiles = [];
    
    for (const [id, p] of Object.entries(allProfiles)) {
      profiles.push({
        id: id,
        name: `${p.icon || ''} ${p.name}`.trim(),
        moonPhase: p.moonPhase,
        dayStartTime: p.dayStartTime,
        dayStartAngle: p.dayStartAngle ?? (p.dayStartTime === 'morning' ? 12 : 0),
        yearStartRule: p.yearStartRule,
        crescentThreshold: p.crescentThreshold || 18,
        sabbathMode: p.sabbathMode || 'lunar',
        calendarBackend: p.calendarBackend,
        lat: 31.7683,  // Jerusalem for all tests
        lon: 35.2137
      });
    }
    
    return profiles;
  },
  
  /**
   * Get abbreviated weekday name
   * @param {string} weekdayName - Full weekday name
   * @returns {string} 3-letter abbreviation
   */
  getShortWeekday(weekdayName) {
    if (!weekdayName) return 'N/A';
    return weekdayName.substring(0, 3);
  },
  
  /**
   * Get human-readable label for a week position
   * @param {number} pos - 1-7 (1 = 1st day after Sabbath, 7 = Sabbath)
   * @returns {string}
   */
  weekPositionLabel(pos) {
    if (pos === 7) return 'Sabbath (7th day of the week)';
    if (pos === 1) return '1st day of the week (day after Sabbath)';
    const ordinals = ['', '1st', '2nd', '3rd', '4th', '5th', '6th'];
    return `${ordinals[pos]} day of the week`;
  },
  
  /**
   * Get cache key for a test/profile combination
   */
  getCacheKey(testId, profileId) {
    return `${testId}-${profileId}`;
  },
  
  /**
   * Get cached test result if available
   */
  getCachedResult(testId, profileId) {
    this._hydrateCache();
    const cacheKey = this.getCacheKey(testId, profileId);
    const cached = this._testCache[cacheKey];
    
    // Check if cache exists and is valid
    if (cached && cached.version === this._cacheVersionGet()) {
      return cached.result;
    }
    
    return null;
  },
  
  /**
   * Load the persisted result cache from localStorage (once per page load).
   * Keyed to APP_VERSION: results survive page refreshes within a deploy
   * and recompute after any deploy, so they always reflect current code.
   */
  _hydrated: false,
  _persistTimer: null,
  _hydrateCache() {
    if (this._hydrated) return;
    this._hydrated = true;
    try {
      const raw = localStorage.getItem('sabbathTesterCacheV2');
      if (!raw) return;
      const saved = JSON.parse(raw);
      if (saved && saved.version === this._cacheVersionGet() && saved.entries) {
        Object.assign(this._testCache, saved.entries);
      }
    } catch (e) { /* corrupt cache — ignore, recompute */ }
  },
  
  /**
   * Persist the in-memory cache to localStorage (throttled).
   */
  _persistCache() {
    if (this._persistTimer) return;
    this._persistTimer = setTimeout(() => {
      this._persistTimer = null;
      try {
        localStorage.setItem('sabbathTesterCacheV2', JSON.stringify({
          version: this._cacheVersionGet(),
          entries: this._testCache
        }));
      } catch (e) { /* quota — skip persistence */ }
    }, 500);
  },
  
  /**
   * Cache a test result — in memory and written through to localStorage,
   * so a page refresh does not recompute. Error results (e.g. astronomy
   * engine not yet loaded) are never cached.
   */
  cacheResult(testId, profileId, result) {
    if (result && result.result === 'error') return;
    const cacheKey = this.getCacheKey(testId, profileId);
    this._testCache[cacheKey] = {
      version: this._cacheVersionGet(),
      result: result,
      timestamp: Date.now()
    };
    this._persistCache();
  },
  
  /**
   * Clear all cached results
   */
  clearCache() {
    this._testCache = {};
    try {
      localStorage.removeItem('sabbathTesterCache');
      localStorage.removeItem('sabbathTesterCacheV2');
    } catch (e) {
      // Ignore
    }
  },
  
  /**
   * Run a single biblical test against a profile using LunarCalendarEngine
   */
  _computeTest(test, profile) {
      // Get astronomy engine
      if (typeof getAstroEngine !== 'function') {
        return { result: 'error', error: 'Astronomy engine not available' };
      }
      
      let engine;
      if (profile.calendarBackend === 'hebcal' && typeof HebcalCalendarAdapter !== 'undefined' && HebcalCalendarAdapter.isAvailable()) {
        engine = new HebcalCalendarAdapter();
        engine.configure({
          moonPhase: profile.moonPhase || 'full',
          dayStartTime: profile.dayStartTime === 'morning' ? 'morning' : 'evening',
          yearStartRule: 'hebcal',
          sabbathMode: profile.sabbathMode || 'saturday'
        });
      } else {
        const astroEngine = getAstroEngine();
        if (!astroEngine) {
          return { result: 'error', error: 'Astronomy engine not initialized' };
        }
        engine = new LunarCalendarEngine(astroEngine);
        engine.configure({
          moonPhase: profile.moonPhase,
          dayStartTime: profile.dayStartTime === 'morning' ? 'morning' : 'evening',
          dayStartAngle: profile.dayStartAngle,
          yearStartRule: profile.yearStartRule,
          crescentThreshold: profile.crescentThreshold
        });
      }
      
      // Generate calendar for test year
      const calendar = engine.generateYear(test.year, test.location, { includeUncertainty: true });
      
      // Get day info
      const dayInfo = engine.getDayInfo(calendar, test.month, test.day);
      if (!dayInfo) {
        return { result: 'error', error: 'Day not found in calendar' };
      }
      
      const calculatedWeekday = dayInfo.weekday;
      const calculatedWeekdayName = dayInfo.weekdayName;
      const gregorianDate = dayInfo.gregorianDate;
      const jd = dayInfo.jd; // Julian Day Number for debugging
      
      // Get uncertainty information
      const monthData = dayInfo.monthData;
      const uncertainty = monthData?.uncertainty || null;
      const yearUncertainty = calendar.yearStartUncertainty || null;
      
      // Determine result based on sabbath mode
      let result, probability = null;
      
      if (profile.sabbathMode === 'lunar') {
        // Lunar sabbath: week position is inherent in the lunar date
        // Days 2-8 = week 1, 9-15 = week 2, 16-22 = week 3, 23-29 = week 4
        // Position within week: ((day - 2) % 7) + 1  (1 = 1st day, 7 = Sabbath)
        const lunarWeekPos = ((test.day - 2) % 7) + 1;
        result = (lunarWeekPos === test.expectedWeekPosition) ? 'pass' : 'fail';
      } else {
        // Fixed-weekday sabbath: compute expected weekday from sabbathMode + position
        const sabbathDayMap = { sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6 };
        const sabbathDay = sabbathDayMap[profile.sabbathMode] ?? 6;
        // expectedWeekPosition 7 = sabbath day, 1 = day after sabbath, etc.
        const expectedWeekday = (sabbathDay + test.expectedWeekPosition) % 7;
        
        if (calculatedWeekday === expectedWeekday) {
          // Calculated matches expected
          if (uncertainty && uncertainty.probability > 0) {
            result = 'uncertain';
            probability = 100 - uncertainty.probability;
          } else {
            result = 'pass';
          }
        } else {
          // Check if uncertainty could explain the mismatch
          if (uncertainty && uncertainty.probability > 0) {
            let alternativeWeekday = null;
            if (uncertainty.direction === '-') {
              alternativeWeekday = (calculatedWeekday + 6) % 7;
            } else if (uncertainty.direction === '+') {
              alternativeWeekday = (calculatedWeekday + 1) % 7;
            }
            
            if (alternativeWeekday === expectedWeekday) {
              result = 'uncertain';
              probability = uncertainty.probability;
            } else {
              result = 'fail';
            }
          } else {
            result = 'fail';
          }
        }
      }
      
      // For lunar sabbath, display lunar week position instead of Gregorian day name
      let displayWeekday = calculatedWeekdayName;  // Full name: "Saturday", "Sunday", etc.
      let displayWeekdayShort = this.getShortWeekday(calculatedWeekdayName);  // Short: "Sat", "Sun", etc.
      if (profile.sabbathMode === 'lunar') {
        const lunarWeekPos = ((test.day - 2) % 7) + 1;
        const posLabelsFull = ['', '1st', '2nd', '3rd', '4th', '5th', '6th', 'Sabbath'];
        const posLabelsShort = ['', '1st', '2nd', '3rd', '4th', '5th', '6th', 'Sab'];
        displayWeekday = posLabelsFull[lunarWeekPos];
        displayWeekdayShort = posLabelsShort[lunarWeekPos];
      }
      
      const testResult = {
        result,
        calculatedWeekday,
        calculatedWeekdayName,
        displayWeekday,
        displayWeekdayShort,
        gregorianDate,
        jd, // Julian Day Number for debugging
        uncertaintyHours: uncertainty ? (uncertainty.marginHours || 0) : 0,
        marginHours: uncertainty ? (uncertainty.marginHours || Infinity) : Infinity,
        probability,
        dateUncertaintyProbability: uncertainty ? uncertainty.probability : 0,
        dateUncertaintyDirection: uncertainty ? uncertainty.direction : null,
        moonEventDate: monthData?.moonEvent || null,
        yearUncertainty
      };
      
      return testResult;
  },

  /**
   * Run a single biblical test against a profile — cached. For tests that
   * carry alternateYears (the exodus-chronology window), a FAILING result
   * is re-tested at each alternate year and annotated, so the results show
   * whether the failure is specific to the assumed year (e.g. 1446 BC) or
   * holds across all probable years.
   */
  runBiblicalTest(test, profile) {
    const cached = this.getCachedResult(test.id, profile.id);
    if (cached !== null) {
      console.log('[SabbathTester] CACHE HIT', test.id, profile.id, '| stored jd:', cached.jd,
        '| stored weekday:', cached.calculatedWeekdayName, '| stored date:', cached.gregorianDate);
      return cached;
    }
    try {
      const testResult = this._computeTest(test, profile);
      console.log('[SabbathTester] FRESH COMPUTE', test.id, profile.id, '| jd:', testResult.jd,
        '| engine weekday:', testResult.calculatedWeekdayName,
        '| engine date:', testResult.gregorianDate && testResult.gregorianDate.toISOString ? testResult.gregorianDate.toISOString().slice(0,10) : testResult.gregorianDate,
        '| result:', testResult.result);
      if (testResult && testResult.result === 'fail' && Array.isArray(test.alternateYears)) {
        testResult.alternateYears = test.alternateYears.map((y) => {
          const label = y <= 0 ? `${1 - y} BC` : `${y} AD`;
          try {
            const alt = this._computeTest({ ...test, year: y }, profile);
            return { year: y, label, result: alt.result, weekday: alt.displayWeekdayShort || alt.calculatedWeekdayName || '' };
          } catch (e) {
            return { year: y, label, result: 'error', weekday: '' };
          }
        });
      }
      this.cacheResult(test.id, profile.id, testResult);
      return testResult;
    } catch (e) {
      console.error('Error running biblical test:', e);
      // NOT cached: transient failures (e.g. astronomy engine still loading)
      // must never persist into localStorage.
      return { result: 'error', error: e.message };
    }
  },
  
  /**
   * Render all tests and results
   */
  async renderTests(container) {
    const loadingEl = container.querySelector('#sabbath-tester-loading');
    const resultsEl = container.querySelector('#sabbath-tester-results');
    const progressText = container.querySelector('#sabbath-progress-text');
    const progressBar = container.querySelector('#sabbath-progress-bar');
    const progressFill = container.querySelector('#sabbath-progress-fill');
    
    if (!loadingEl || !resultsEl) {
      this._isRendering = false;
      return;
    }
    
    // Clear any stale localStorage cache from older versions
    try { localStorage.removeItem('sabbathTesterCache'); } catch (e) {}
    
    loadingEl.style.display = 'block';
    resultsEl.innerHTML = '';

    // RACE FIX: the app loads Swiss Ephemeris/NASA data in the background and
    // getAstroEngine() returns a synchronous fallback until then. Computing
    // (or even fingerprinting the cache) before the selection is final mixes
    // backends within one run and caches fallback numbers as authoritative.
    // No calculation starts until all astronomy data is loaded.
    if (typeof astroEngineReady === 'function') {
      if (progressText) progressText.textContent = 'Loading astronomy engine\u2026';
      try { await astroEngineReady(); } catch (e) {}
      if (!container.querySelector('#sabbath-tester-results')) {
        this._isRendering = false;
        return;
      }
    }
    const engineDesc = (typeof getAstroEngine === 'function' && getAstroEngine())
      ? (getAstroEngine().name + ' v' + getAstroEngine().version) : 'unknown';
    console.log('[SabbathTester] astronomy engine ready:', engineDesc,
      '| cache version:', this._cacheVersionGet());

    const profiles = this.getSabbathTestProfiles();
    const allResults = [];
    const total = BIBLICAL_TESTS.length * profiles.length;
    let completed = 0;
    let cacheHits = 0;
    let cacheMisses = 0;
    
    // Check how many need computation
    let needsComputation = 0;
    for (const test of BIBLICAL_TESTS) {
      for (const profile of profiles) {
        if (this.getCachedResult(test.id, profile.id) === null) needsComputation++;
      }
    }
    
    // Show progress bar only if there are uncached computations
    if (needsComputation > 0 && progressBar) {
      progressBar.style.display = 'block';
      if (progressText) progressText.textContent = `Computing ${needsComputation} calendars...`;
    }
    
    // Yield once to let the UI render the progress bar
    await new Promise(r => setTimeout(r, 0));
    
    // Run all tests against all profiles — yield between uncached computations
    for (const test of BIBLICAL_TESTS) {
      const testResults = [];
      for (const profile of profiles) {
        // Check if user navigated away
        if (!container.querySelector('#sabbath-tester-results')) {
          this._isRendering = false;
          return;
        }
        
        const cached = this.getCachedResult(test.id, profile.id);
        let result;
        
        if (cached !== null) {
          cacheHits++;
          result = cached;
        } else {
          cacheMisses++;
          result = this.runBiblicalTest(test, profile);
          
          // Yield to UI after each heavy computation
          completed++;
          if (progressFill) {
            const pct = Math.round((completed / needsComputation) * 100);
            progressFill.style.width = pct + '%';
          }
          if (progressText) {
            progressText.textContent = `Computing calendars... ${completed}/${needsComputation}`;
          }
          await new Promise(r => setTimeout(r, 0));
        }
        
        testResults.push({
          profile,
          ...result
        });
      }
      allResults.push({
        test,
        results: testResults
      });
    }
    
    if (cacheHits > 0 || cacheMisses > 0) {
      console.log(`[SabbathTester] Cache: ${cacheHits} hits, ${cacheMisses} misses (${Math.round(cacheHits / (cacheHits + cacheMisses) * 100)}% hit rate)`);
    }

    // On-page diagnostics — visible without DevTools
    try {
      const diag = container.querySelector('#sabbath-diagnostic');
      if (diag) {
        const t30 = allResults.find(x => x.test.id === 'passover-30ad');
        const lines = [
          'engine build: JDN-v11 | cache: ' + cacheHits + ' hits / ' + cacheMisses + ' fresh | seed: ' + this._cacheVersionGet().slice(0, 24),
          'astro engine: ' + engineDesc,
          'engine.jdnToWeekday loaded: ' + (typeof LunarCalendarEngine !== 'undefined' && typeof LunarCalendarEngine.prototype.jdnToWeekday === 'function')
        ];
        if (t30) {
          for (const r of t30.results) {
            const ident = this.jdRowIdentity(r.jd);
            lines.push('30AD ' + (r.profile && r.profile.id) + ': raw jd=' + r.jd +
              ' -> ' + (ident ? ident.dateStr + ' / ' + ident.weekdayName + ' / JDN ' + ident.jdn : 'null') +
              ' | engine said: ' + (r.calculatedWeekdayName || '?'));
          }
        }
        diag.textContent = lines.join('\n');
      }
    } catch (e) { /* diagnostics must never break rendering */ }
      
      // Calculate scoreboard
      const scoreboard = {};
      const baseScoreWithout32AD = {};
      const testResultsByProfile = {};
      
      for (const profile of profiles) {
        scoreboard[profile.id] = {
          profile,
          passed: 0,
          failed: 0,
          uncertain: 0,
          totalScore: 0,
          // HISTORY = BIBLE tests + extra-biblical witnesses (temple falls)
          historyScore: 0
        };
        baseScoreWithout32AD[profile.id] = {
          totalScore: 0,
          testResults: []
        };
        testResultsByProfile[profile.id] = [];
      }
      
      for (const { test, results } of allResults) {
        for (const r of results) {
          const score = scoreboard[r.profile.id];
          const baseScore = baseScoreWithout32AD[r.profile.id];
          const countsForScore = !test.excludeFromScore;
          // HISTORY: every BIBLE test plus the extra-biblical temple witnesses
          const countsForHistory = countsForScore || test.extraBiblical === true;
          const countsForBaseScore = !test.excludeFromScore && test.id !== 'resurrection-32ad';
          
          if (countsForScore || test.extraBiblical) {
            testResultsByProfile[r.profile.id].push({
              testName: test.name,
              testId: test.id,
              result: r.result,
              probability: r.probability,
              extraBiblical: test.extraBiblical === true
            });
          }
          
          if (r.result === 'pass') {
            if (countsForScore) {
              score.passed++;
              score.totalScore += 1;
            }
            if (countsForHistory) score.historyScore += 1;
            if (countsForBaseScore) {
              baseScore.totalScore += 1;
              baseScore.testResults.push({ testName: test.name, testId: test.id, result: 'pass' });
            }
          } else if (r.result === 'uncertain') {
            if (countsForScore) {
              score.uncertain++;
              score.totalScore += (r.probability || 50) / 100;
            }
            if (countsForHistory) score.historyScore += (r.probability || 50) / 100;
            if (countsForBaseScore) {
              baseScore.totalScore += (r.probability || 50) / 100;
              baseScore.testResults.push({ testName: test.name, testId: test.id, result: 'uncertain', probability: r.probability });
            }
          } else if (r.result === 'fail') {
            if (countsForScore) {
              score.failed++;
            }
            if (countsForBaseScore) {
              baseScore.testResults.push({ testName: test.name, testId: test.id, result: 'fail' });
            }
          }
        }
      }
      
      // Sort scoreboard
      const sortedScores = Object.values(scoreboard).sort((a, b) => {
        if (b.passed !== a.passed) return b.passed - a.passed;
        if (a.failed !== b.failed) return a.failed - b.failed;
        if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
        return b.historyScore - a.historyScore;
      });
      
      // Build HTML
      let html = this.buildScoreboardHTML(sortedScores, testResultsByProfile, BIBLICAL_TESTS);
      html += this.buildTestCardsHTML(allResults, baseScoreWithout32AD, BIBLICAL_TESTS);
      
    loadingEl.style.display = 'none';
    resultsEl.innerHTML = html;
    
    this._isRendering = false;
    this._hasRendered = true;
  },
  
  /**
   * Build scoreboard HTML
   */
  buildScoreboardHTML(sortedScores, testResultsByProfile, tests) {
    const numTests = tests.filter(t => !t.excludeFromScore).length;
    const numHistoryTests = numTests + tests.filter(t => t.extraBiblical === true).length;
    const bibleTip = 'BIBLE score — biblical testimony only: the first Sabbath of Manna (Exodus 16), First Fruits after the Jordan crossing (Joshua 5), and the Resurrection on First Fruits (Matthew 28).';
    const historyTip = 'HISTORY score — the combined score: every biblical test PLUS the extra-biblical witnesses: both Temples falling &quot;at the conclusion of Shabbat&quot; (Talmud Ta\u02bcanit 29a) — 9 Av 586 BC and 9 Av 70 AD.';
    
    let html = `
      <div class="sabbath-scoreboard">
        <div class="sabbath-scoreboard-title">📊 Summary Scoreboard</div>
        <div class="sabbath-scoreboard-intro">
          <p>This scoreboard tests each calendar configuration against biblical events where both the lunar date and weekday can be determined from Scripture. Tests include the first Sabbath of Manna (Exodus 16), the First Fruits offering after crossing the Jordan (Joshua 5), and the Resurrection on First Fruits (Matthew 28).</p>
          <p>Each profile carries two scores: <strong>BIBLE</strong> uses only biblical testimony; <strong>HISTORY</strong> is the combined score, adding the extra-biblical temple-fall witnesses (Talmud Ta\u02bcanit 29a). Hover or tap a column heading for details.</p>
          <div class="scoreboard-conclusion">
            <p><strong>Key Finding:</strong> The <span class="result-pass">Lunar Sabbath</span> is compatible with all scored tests. It is also compatible with Rabbinic tradition that both Temples fell "the day after the Sabbath" (Talmud Ta'anit 29a) and Josephus' record that Romans built siege ramps on the Sabbath when the 8th of Av fell on that day.</p>
            <p>For <span class="result-uncertain">Saturday Sabbath</span>, the strongest single result is the classical one: the crescent calendar with the Lamb year start places Passover on <strong>Friday, April 3, 33 AD</strong>. But that same configuration fails the Manna Sabbath, the Jordan-crossing First Fruits, and the 32 AD Resurrection tests — and no fixed-Saturday configuration passes those tests together under any year-start rule. The 33 AD Friday stands alone, and it carries the chronological cautions noted below.</p>
          </div>
        </div>
        <table class="sabbath-scoreboard-table">
          <thead>
            <tr>
              <th>Calendar Profile</th>
              <th><span class="profile-tip" data-tip="${bibleTip}">BIBLE</span></th>
              <th><span class="profile-tip" data-tip="${historyTip}">HISTORY</span></th>
            </tr>
          </thead>
          <tbody>
    `;
    
    const scoreClassFor = (pct) => {
      if (pct >= 90) return 'score-perfect';
      if (pct >= 70) return 'score-good';
      if (pct >= 50) return 'score-medium';
      return 'score-poor';
    };
    for (const score of sortedScores) {
      const pct = Math.round((score.totalScore / numTests) * 100);
      const historyPct = Math.round((score.historyScore / numHistoryTests) * 100);
      const scoreClass = scoreClassFor(pct);
      const historyClass = scoreClassFor(historyPct);
      
      const profileTests = testResultsByProfile[score.profile.id] || [];
      const passedTests = profileTests.filter(t => t.result === 'pass');
      const failedTests = profileTests.filter(t => t.result === 'fail');
      const uncertainTests = profileTests.filter(t => t.result === 'uncertain');
      
      const formatName = (t) => {
        const marker = t.extraBiblical ? '\uD83C\uDFDB\uFE0F ' : '';
        if (t.testId === 'resurrection-32ad') return marker + 'Resurrection 32 AD';
        return marker + t.testName.replace(/ \([^)]+\)$/, '');
      };
      
      let testBreakdown = '<div class="score-breakdown">';
      if (passedTests.length > 0) {
        testBreakdown += `<div class="breakdown-section"><span class="breakdown-label result-pass">✅ Passed:</span> ${passedTests.map(formatName).join(', ')}</div>`;
      }
      if (uncertainTests.length > 0) {
        testBreakdown += `<div class="breakdown-section"><span class="breakdown-label result-uncertain">⚠️ Uncertain:</span> ${uncertainTests.map(t => `${formatName(t)} (${t.probability}%)`).join(', ')}</div>`;
      }
      if (failedTests.length > 0) {
        testBreakdown += `<div class="breakdown-section"><span class="breakdown-label result-fail">❌ Failed:</span> ${failedTests.map(formatName).join(', ')}</div>`;
      }
      testBreakdown += '</div>';
      
      const rowId = `scoreboard-row-${score.profile.id.replace(/[^a-zA-Z0-9]/g, '-')}`;
      
      html += `
        <tr class="scoreboard-expandable" onclick="SabbathTesterView.toggleScoreboardRow('${rowId}')">
          <td><span class="expand-arrow">▶</span> ${this.profileTipSpan(score.profile)}</td>
          <td class="${scoreClass}">${pct}%</td>
          <td class="${historyClass}">${historyPct}%</td>
        </tr>
        <tr class="scoreboard-details" id="${rowId}" style="display: none;">
          <td colspan="3">${testBreakdown}</td>
        </tr>
      `;
    }
    
    html += `
          </tbody>
        </table>
      </div>
    `;
    
    return html;
  },
  
  /**
   * Build test cards HTML
   */
  buildTestCardsHTML(allResults, baseScoreWithout32AD, tests) {
    let html = '';
    const numTests = tests.filter(t => !t.excludeFromScore).length;
    
    for (const { test, results } of allResults) {
      const yearDisplay = test.year < 0 ? `${Math.abs(test.year) + 1} BC` : `${test.year} AD`;
      const excludedNote = test.excludeFromScore ? ' <span style="font-size: 0.8em; color: var(--text-secondary);">(not scored)</span>' : '';
      
      html += `
        <div class="sabbath-test-card">
          <div class="sabbath-test-title">
            <span>📜 ${test.name}${excludedNote}</span>
          </div>
          <div class="sabbath-test-date">
            ${test.day}${this.getDaySuffix(test.day)} of Month ${test.month}, ${yearDisplay}
          </div>
          <div class="sabbath-test-scripture">${test.scripture}</div>
          <div class="sabbath-test-description">${test.description}</div>
          ${this.buildTestEvidenceHTML(test)}
          <div class="sabbath-test-expected">
            <strong>Expected:</strong> ${this.weekPositionLabel(test.expectedWeekPosition)}
          </div>
          ${this.buildTestResultsTableHTML(test, results, baseScoreWithout32AD, numTests)}
        </div>
      `;
    }
    
    return html;
  },
  
  /**
   * Build evidence accordion HTML for specific tests
   */
  buildTestEvidenceHTML(test) {
    if (test.id === 'resurrection-32ad') {
      return `
        <details class="test-evidence-accordion">
          <summary>📖 Why 32 AD? See the Evidence</summary>
          <div class="test-evidence-content">
            <p>Multiple independent chronological anchors converge on 32 AD:</p>
            <ul>
              <li><strong>Tiberius' 15th Year (Fall 28-29 AD)</strong> — John the Baptist began his ministry in the 15th year of Tiberius (Luke 3:1-2). Standard Roman historiography dates this to fall 28 – fall 29 AD.</li>
              <li><strong>Year of Release (Fall 29 AD)</strong> — Jesus proclaimed "the year of the Lord's favor" in Nazareth (Luke 4:18-19). This sabbatical year proclamation aligns with Day of Atonement 29 AD, based on the 7-year cycle from the Jordan crossing in 1406 BC.</li>
              <li><strong>46 Years Building the Temple (30 AD)</strong> — At the first Passover in John's Gospel, the Jews said the temple had been under construction 46 years (John 2:20). Herod began rebuilding ~17-16 BC, placing this first Passover in spring 30 AD.</li>
              <li><strong>Three Passovers in John</strong> — John explicitly mentions three Passovers: 30 AD (John 2:13), 31 AD (John 6:4), and the final Passover 32 AD (John 11:55).</li>
              <li><strong>Daniel's 490-Year Prophecy (32 AD)</strong> — The decree to restore Jerusalem was issued in Artaxerxes' 7th year, spring 458 BC (Ezra 7:7-9). The 490th year lands on spring 32 AD (Daniel 9:24-25).</li>
              <li><strong>Passover Solar Eclipse (April 28, 32 AD)</strong> — NASA documents a partial solar eclipse visible in Jerusalem at midday on Passover 32 AD, matching the darkness recorded in Matthew 27:45.</li>
            </ul>
            <p>These independent lines of evidence—Tiberius' reign, the sabbatical cycle, temple construction, John's Passovers, Daniel's prophecy, and astronomical data—all align naturally on 32 AD without requiring ad hoc adjustments.</p>
            <p style="margin-top: 15px;"><a href="/reader/timetested/12_32_AD_Resurrection" style="color: var(--accent-primary);">📖 Read the full chapter: 32 AD Resurrection</a></p>
          </div>
        </details>
      `;
    }
    
    if (test.id === 'first-fruits-1406') {
      return `
        <details class="test-evidence-accordion">
          <summary>📖 Why 1406 BC? The chronology window</summary>
          <div class="test-evidence-content">
            <p>The conquest year is anchored to the exodus (1446 BC + 40 years in the wilderness). Failing results below are automatically re-tested at 1407 and 1405 BC (the ±1 year window) and annotated: <span class="alt-year-note alt-year-pass">±1yr:✓</span> means an adjacent year would pass; <span class="alt-year-note alt-year-fail">±1yr:✗ all years</span> means the configuration fails across the whole probable window.</p>
            <p><strong>1407 BC is excluded by the New Testament itself.</strong> The sabbatical cycle counts from the Jordan crossing, and Jesus proclaimed "the acceptable year of the LORD" (Luke 4:18-19) — a Year of Release proclamation made on the Day of Atonement 29 AD under the 1406 BC anchor. Moving the crossing to 1407 BC shifts every sabbath year back one year, forcing that proclamation to Atonement 28 AD — before John the Baptist's ministry had begun (the 15th year of Tiberius, fall 28-29 AD, Luke 3:1), and therefore before Jesus' baptism. The declaration cannot precede the baptism that opened his ministry, so a calendar rescued only by 1407 BC is not rescued at all.</p>
          </div>
        </details>
      `;
    }
    
    if (test.id === 'resurrection-33ad') {
      return `
        <details class="test-evidence-accordion">
          <summary>⚠️ Cautions with 33 AD</summary>
          <div class="test-evidence-content">
            <p>While 33 AD is a popular alternative, it requires assumptions that conflict with other evidence:</p>
            <ul>
              <li><strong>Exceeds Daniel's 490 Years</strong> — The decree to restore Jerusalem was issued in Artaxerxes' 7th year, spring 458 BC (Ezra 7:7-9). The 490th year ends spring 32 AD (Daniel 9:24-25). A 33 AD crucifixion falls in the 491st year, requiring non-literal or non-inclusive counting of Daniel's prophecy.</li>
              <li><strong>Requires Undocumented 4th Passover</strong> — John explicitly mentions only three Passovers during Jesus' ministry (John 2:13, 6:4, 11:55). For 33 AD to work with John's ministry starting fall 28-29 AD (Tiberius' 15th year), a fourth unrecorded Passover must be assumed, extending to a 4-year ministry.</li>
              <li><strong>No Passover Solar Eclipse</strong> — NASA documents a partial solar eclipse visible in Jerusalem at midday on April 28, 32 AD, matching the darkness at the cross (Matthew 27:45). There is no similar eclipse alignment for Passover 33 AD. Phlegon's record placing it in the "4th year of the 202nd Olympiad" (July 32 – July 33 AD) is approximate and written 105+ years after the event.</li>
            </ul>
            <p>These issues don't necessarily disprove 33 AD, but they require ad hoc adjustments that are unnecessary with a 32 AD crucifixion date.</p>
            <p style="margin-top: 15px;"><a href="/reader/timetested/12_32_AD_Resurrection" style="color: var(--accent-primary);">📖 Read the full chapter: 32 AD Resurrection</a></p>
          </div>
        </details>
        <div class="test-interpretation">
          <p><strong>Interpreting the Results Below:</strong></p>
          <ul>
            <li><strong>Traditional April 3rd Friday</strong> — The popular "April 3, 33 AD" Friday crucifixion date emerges naturally: the crescent moon calendar with the Lamb (Passover after equinox) year start places Nisan 14 on Friday, April 3, 33 AD — the Ancient Traditional row above passes this test directly.</li>
            <li><strong>Other Passing Calendars Break Tradition</strong> — Any other configuration that places the 14th on Friday in 33 AD abandons traditional assumptions: a different year-start rule, full moon month starts instead of crescent, or a daybreak day start instead of sunset — each a departure from the rabbinic traditions 33 AD proponents typically assume.</li>
            <li><strong>Passing 33 AD Does Not Rescue the Rest</strong> — Expand the "Alt Score" column to see how each configuration performs on the other biblical tests. The crescent configuration that lands April 3 on Friday fails the Manna Sabbath, the Jordan-crossing First Fruits, and the 32 AD Resurrection tests — and no fixed-Saturday configuration passes those exodus-era tests under any year-start rule. The 33 AD Friday stands alone; it cannot carry a Saturday calendar across the rest of Scripture's witnesses.</li>
          </ul>
        </div>
      `;
    }
    
    return '';
  },
  
  /**
   * Build test results table HTML
   */
  buildTestResultsTableHTML(test, results, baseScoreWithout32AD, numTests) {
    // Sort results: pass first, then uncertain, then fail
    const sortedResults = [...results].sort((a, b) => {
      const order = { pass: 0, uncertain: 1, fail: 2, error: 3 };
      return (order[a.result] || 3) - (order[b.result] || 3);
    });
    
    const hasAltScore = test.id === 'passover-30ad' || test.id === 'resurrection-33ad';
    
    let html = `
      <table class="sabbath-test-results-table">
        <thead>
          <tr>
            <th>Profile</th>
            <th class="date-cell-full">${test.year < 1582 ? 'Julian Date' : 'Gregorian Date'}</th>
            <th class="date-cell-compact">Date</th>
            <th class="weekday-cell-full">Day</th>
            <th class="weekday-cell-compact">Day</th>
            <th>JD</th>
            <th>Result</th>
            ${hasAltScore ? '<th title="Score if this year replaces 32 AD as the resurrection test">Alt</th>' : ''}
          </tr>
        </thead>
        <tbody>
    `;
    
    for (const r of sortedResults) {
      let resultText, resultClass;
      if (r.result === 'pass') {
        resultText = '✅ Pass';
        resultClass = 'result-pass';
      } else if (r.result === 'uncertain') {
        resultText = `⚠️ ${r.probability}%`;
        resultClass = 'result-uncertain';
      } else if (r.result === 'fail') {
        resultText = '❌ Fail';
        resultClass = 'result-fail';
      } else {
        resultText = '⚠️ Error';
        resultClass = 'result-uncertain';
      }
      
      // One source of truth per row: derive date, weekday, and JD from r.jd.
      const ident = this.jdRowIdentity(r.jd);
      console.log('[SabbathTester] RENDER', test.id, r.profile && r.profile.id, '| raw jd:', r.jd,
        '| derived:', ident ? (ident.dateStr + ' / ' + ident.weekdayName + ' / JDN ' + ident.jdn) : 'null',
        '| legacy fields (ignored):', (r.gregorianDate || 'n/a') + ' / ' + (r.calculatedWeekdayName || 'n/a'));
      const isLunarMode = r.profile && r.profile.sabbathMode === 'lunar';
      const dateStr = ident ? ident.dateStr : (r.gregorianDate ? this.formatAncientDate(r.gregorianDate, false) : 'N/A');
      const weekdayFull = isLunarMode ? (r.displayWeekday || 'N/A') : (ident ? ident.weekdayName : (r.calculatedWeekdayName || 'N/A'));
      const weekdayShort = isLunarMode ? (r.displayWeekdayShort || 'N/A') : (ident ? ident.weekdayShort : this.getShortWeekday(r.calculatedWeekdayName));
      const profileName = r.profile.name;
      
      let yearUncertaintyIcon = '';
      if (r.yearUncertainty && r.yearUncertainty.probability > 0) {
        const tooltipText = `Year uncertainty: ${r.yearUncertainty.probability}% chance all dates are 1 month ${r.yearUncertainty.direction} (ΔT uncertainty ±${Math.round(r.uncertaintyHours)} hours, Nisan margin: ${r.yearUncertainty.marginHours.toFixed(1)} hours)`;
        yearUncertaintyIcon = ` <span class="year-uncertainty-icon" title="${tooltipText}">⚠️${r.yearUncertainty.probability}%</span>`;
      }
      
      // Chronology sensitivity: did a failing test pass in an adjacent year?
      let altYearsNote = '';
      if (r.alternateYears && r.alternateYears.length) {
        const passing = r.alternateYears.filter(a => a.result === 'pass' || a.result === 'uncertain');
        const detail = r.alternateYears.map(a => `${a.label}: ${a.result}${a.weekday ? ' (' + a.weekday + ')' : ''}`).join('; ');
        altYearsNote = passing.length
          ? ` <span class="alt-year-note alt-year-pass" title="Chronology sensitivity — ${detail}">±1yr:✓${passing.map(a => a.label).join(',')}</span>`
          : ` <span class="alt-year-note alt-year-fail" title="Chronology sensitivity — ${detail}">±1yr:✗ all years</span>`;
      }
      
      const jdTooltip = r.jd != null ? `JD: ${r.jd.toFixed(2)}` : '';
      const profileId = r.profile.id;
      const dateLink = r.gregorianDate ? 
        `<a class="sabbath-test-date-link" title="${jdTooltip}" onclick="SabbathTesterView.navigateToTestResult('${test.id}', '${profileId}')">${dateStr}</a>${yearUncertaintyIcon}${altYearsNote}` :
        dateStr;
      
      // Calculate alternative score for 30 AD and 33 AD tests
      let altScoreCell = '';
      if (hasAltScore) {
        const baseScoreData = baseScoreWithout32AD[profileId];
        const baseScore = baseScoreData?.totalScore || 0;
        const baseTestResults = baseScoreData?.testResults || [];
        
        let thisTestScore = 0;
        if (r.result === 'pass') thisTestScore = 1;
        else if (r.result === 'uncertain') thisTestScore = (r.probability || 50) / 100;
        
        const altTotalScore = baseScore + thisTestScore;
        const altPct = Math.round((altTotalScore / numTests) * 100);
        
        let altScoreClass = 'score-poor';
        if (altPct >= 90) altScoreClass = 'score-perfect';
        else if (altPct >= 70) altScoreClass = 'score-good';
        else if (altPct >= 50) altScoreClass = 'score-medium';
        
        const passedTests = baseTestResults.filter(t => t.result === 'pass');
        const failedTests = baseTestResults.filter(t => t.result === 'fail');
        const uncertainTests = baseTestResults.filter(t => t.result === 'uncertain');
        
        const formatTestName = (t) => {
          if (t.testId === 'resurrection-32ad') return 'Resurrection 32 AD';
          return t.testName.replace(/ \([^)]+\)$/, '').replace('First Sabbath of ', '').replace('First Fruits After ', '');
        };
        
        let altBreakdown = '';
        if (passedTests.length > 0) {
          altBreakdown += `<div class="breakdown-section"><span class="breakdown-label result-pass">✅</span> ${passedTests.map(formatTestName).join(', ')}</div>`;
        }
        if (uncertainTests.length > 0) {
          altBreakdown += `<div class="breakdown-section"><span class="breakdown-label result-uncertain">⚠️</span> ${uncertainTests.map(t => `${formatTestName(t)} (${t.probability}%)`).join(', ')}</div>`;
        }
        if (failedTests.length > 0) {
          altBreakdown += `<div class="breakdown-section"><span class="breakdown-label result-fail">❌</span> ${failedTests.map(formatTestName).join(', ')}</div>`;
        }
        
        altScoreCell = `<td data-label="Alt Score" class="${altScoreClass}">
          <details class="alt-score-details">
            <summary>${altPct}%</summary>
            <div class="alt-score-breakdown">${altBreakdown}</div>
          </details>
        </td>`;
      }
      
      // Build compact date link for mobile
      const dateStrCompact = ident ? ident.dateStrCompact : (r.gregorianDate ? this.formatAncientDate(r.gregorianDate, false, true) : 'N/A');
      const dateLinkCompact = r.gregorianDate ? 
        `<a class="sabbath-test-date-link" title="${jdTooltip}" onclick="SabbathTesterView.navigateToTestResult('${test.id}', '${profileId}')">${dateStrCompact}</a>${yearUncertaintyIcon}${altYearsNote}` :
        dateStrCompact;
      
      const jdStr = ident ? ident.jdn.toString() : 'N/A';
      
      html += `
        <tr>
          <td data-label="Profile" class="profile-cell">${this.profileTipSpan(r.profile, profileName)}</td>
          <td data-label="Date" class="date-cell-full">${dateLink}</td>
          <td data-label="Date" class="date-cell-compact">${dateLinkCompact}</td>
          <td data-label="Day" class="weekday-cell-full">${weekdayFull}</td>
          <td data-label="Day" class="weekday-cell-compact">${weekdayShort}</td>
          <td data-label="JD" class="jd-cell" style="font-size:0.8em;color:var(--text-secondary)">${jdStr}</td>
          <td data-label="Result" class="${resultClass}">${resultText}</td>
          ${altScoreCell}
        </tr>
      `;
    }
    
    html += `
        </tbody>
      </table>
    `;
    
    return html;
  },
  
  /**
   * Navigate to a specific date on a test profile
   */
  navigateToTestResult(testId, profileId) {
    const test = BIBLICAL_TESTS.find(t => t.id === testId);
    if (!test) {
      console.error('Test not found:', testId);
      return;
    }
    
    // Single atomic dispatch — profile + location + date + view all at once
    AppStore.dispatch({
      type: 'SET_LUNAR_DATETIME',
      year: test.year,
      month: test.month,
      day: test.day,
      profileId: profileId,
      lat: test.location.lat,
      lon: test.location.lon,
      view: 'calendar'
    });
  },
  
  /**
   * Toggle scoreboard row expansion
   */
  toggleScoreboardRow(rowId) {
    const detailsRow = document.getElementById(rowId);
    const mainRow = detailsRow?.previousElementSibling;
    
    if (detailsRow && mainRow) {
      const isExpanded = detailsRow.style.display !== 'none';
      detailsRow.style.display = isExpanded ? 'none' : 'table-row';
      mainRow.classList.toggle('expanded', !isExpanded);
      const arrow = mainRow.querySelector('.expand-arrow');
      if (arrow) {
        arrow.textContent = isExpanded ? '▶' : '▼';
      }
    }
  },
  
  /**
   * Format a Gregorian/Julian date for display
   * Uses JDN-based weekday calculation for accuracy with ancient dates
   * Uses the same formula as LunarCalendarEngine for consistency
   * @param {Date|string} date - The date to format
   * @param {boolean} includeWeekday - Whether to include weekday (not used, kept for API compat)
   * @param {boolean} compact - Whether to use compact format for mobile
   */

  /**
   * Derive the display date and weekday for a result row from its JD alone.
   * The JD is the row's single source of truth: date label (Julian calendar
   * before Oct 15 1582, Gregorian after) and weekday (JDN+1 mod 7, anchored
   * on JDN 0 = Monday) are both pure functions of it, so the three cells of
   * a row can never contradict each other — even when the underlying result
   * was cached by an older engine.
   * The stored jd is a boundary lying ON the day's own civil day: evening
   * mode stores THIS day's sunset (closing boundary, ~+4h after noon at
   * Jerusalem), morning mode this day's sunrise (~-9h), hebcal rows the
   * integer noon itself. All are within ±12h of the day's noon, so the
   * civil-day JDN is Math.round(jd) — nearest noon. (floor(jd)+1 was the
   * JDN-v6 bug: it treated the sunset as an OPENING boundary and pushed
   * every evening-mode row one day late.)
   */
  jdRowIdentity(jd) {
    if (jd == null || isNaN(jd)) return null;
    const jdn = Math.round(jd);
    const weekdayNum = ((jdn + 1) % 7 + 7) % 7;
    const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    let year, month, day;
    if (jdn < 2299161) { // Julian calendar labels before Oct 15, 1582
      const B = jdn + 1524, C = Math.floor((B - 122.1) / 365.25), D = Math.floor(365.25 * C), E = Math.floor((B - D) / 30.6001);
      day = B - D - Math.floor(30.6001 * E);
      month = E < 14 ? E - 1 : E - 13;
      year = month > 2 ? C - 4716 : C - 4715;
    } else {
      const a = jdn + 32044, b = Math.floor((4 * a + 3) / 146097), c = a - Math.floor(146097 * b / 4);
      const d2 = Math.floor((4 * c + 3) / 1461), e = c - Math.floor(1461 * d2 / 4), m = Math.floor((5 * e + 2) / 153);
      day = e - Math.floor((153 * m + 2) / 5) + 1;
      month = m + 3 - 12 * Math.floor(m / 10);
      year = 100 * b + d2 - 4800 + Math.floor(m / 10);
    }
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const yearStr = year <= 0 ? `${1 - year} BC` : `${year} AD`;
    return {
      jdn,
      weekdayName: weekdays[weekdayNum],
      weekdayShort: weekdays[weekdayNum].slice(0, 3),
      dateStr: `${months[month - 1]} ${day}, ${yearStr}`,
      dateStrCompact: `${months[month - 1]} ${day}`
    };
  },

  formatAncientDate(date, includeWeekday = true, compact = false) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    // Ensure date is a Date object (cached results may have serialized it to string)
    if (!(date instanceof Date)) {
      date = new Date(date);
    }
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'Invalid Date';
    }
    
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth(); // 0-indexed
    const day = date.getUTCDate();
    const monthName = months[month];
    const yearStr = year < 0 ? `${Math.abs(year) + 1} BC` : `${year} AD`;
    
    // Compact format: just month and day (year shown elsewhere)
    if (compact) {
      return `${monthName} ${day}`;
    }
    
    return `${monthName} ${day}, ${yearStr}`;
  },
  
  /**
   * Get day suffix (1st, 2nd, 3rd, etc.)
   */
  getDaySuffix(day) {
    if (day >= 11 && day <= 13) return 'th';
    switch (day % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  }
};

// Make available globally (browser only)
if (typeof window !== 'undefined') {
  window.SabbathTesterView = SabbathTesterView;
  window.BIBLICAL_TESTS = BIBLICAL_TESTS; // Expose for debugging
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SabbathTesterView, BIBLICAL_TESTS };
}
