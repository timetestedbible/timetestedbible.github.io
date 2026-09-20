// World Clock Functions
// Extracted from index.html for Phase 7 refactoring

// Get saved user location from localStorage
function getSavedUserLocation() {
  try {
    const savedLocation = localStorage.getItem('userLocation');
    const savedSource = localStorage.getItem('userLocationSource');
    if (savedLocation && (savedSource === 'gps' || savedSource === 'user')) {
      const loc = JSON.parse(savedLocation);
      if (loc.lat !== undefined && loc.lon !== undefined) {
        return loc;
      }
    }
  } catch (e) {
    // localStorage might be unavailable or corrupted
  }
  return null;
}

// Get closest city slug for coordinates (uses URLRouter if available)
function getClosestCitySlug(lat, lon, maxDistanceKm) {
  // Use URLRouter's method if available
  if (typeof URLRouter !== 'undefined' && URLRouter._getLocationSlug) {
    return URLRouter._getLocationSlug({ lat, lon });
  }
  
  // Fallback: check CITY_SLUGS directly
  if (typeof URLRouter !== 'undefined' && URLRouter.CITY_SLUGS) {
    let nearestSlug = 'jerusalem';
    let nearestDistance = Infinity;
    
    for (const [slug, coords] of Object.entries(URLRouter.CITY_SLUGS)) {
      const dLat = (coords.lat - lat) * Math.PI / 180;
      const dLon = (coords.lon - lon) * Math.PI / 180;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(lat * Math.PI / 180) * Math.cos(coords.lat * Math.PI / 180) *
                Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const distance = 6371 * c; // km
      
      if (distance < nearestDistance && distance <= maxDistanceKm) {
        nearestDistance = distance;
        nearestSlug = slug;
      }
    }
    return nearestSlug;
  }
  
  return 'jerusalem'; // Ultimate fallback
}

// Format city slug for display (e.g., "new-york" -> "New York")
function formatCitySlug(slug) {
  if (!slug) return 'Jerusalem';
  return slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

// Get local time string for a location based on longitude
function getLocalTimeForLocation(lat, lon) {
  // Get current view time - try getViewTime, then AppStore, then current time
  let viewTime;
  if (typeof getViewTime === 'function') {
    viewTime = getViewTime();
  } else if (typeof AppStore !== 'undefined' && AppStore.getState) {
    const selectedJD = AppStore.getState()?.context?.selectedDate;
    if (selectedJD && AppStore._julianToDate) {
      viewTime = AppStore._julianToDate(selectedJD);
    }
  }
  if (!viewTime) {
    viewTime = new Date();
  }
  
  // Approximate timezone from longitude (1 hour per 15 degrees)
  const tzOffsetHours = Math.round(lon / 15);
  // Convert UTC time to local time at that longitude
  const utcMs = viewTime.getTime();
  const localMs = utcMs + (tzOffsetHours * 60 * 60 * 1000);
  const localDate = new Date(localMs);
  // Format as HH:MM using UTC methods since we already adjusted
  const hours = localDate.getUTCHours();
  const minutes = localDate.getUTCMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const h12 = hours % 12 || 12;
  return `${h12}:${minutes.toString().padStart(2, '0')} ${ampm}`;
}

// Render profile icon (supports favicon URLs)
function renderProfileIcon(profile) {
  if (!profile) return '📅';
  if (profile.faviconUrl) {
    return `<img src="${profile.faviconUrl}" alt="${profile.name}" onerror="this.style.display='none';this.nextSibling.style.display='inline'"><span style="display:none">${profile.icon || '📅'}</span>`;
  }
  return profile.icon || '📅';
}

// Render profile icon for plain text contexts (dropdown options)
function renderProfileIconText(profile) {
  // For text contexts (like <option>), we can only use emoji, not images
  return profile?.icon || '📅';
}

// Get feast icons for a given lunar month and day
function getFeastIconsForLunarDay(month, day) {
  if (typeof FEASTS === 'undefined') return [];
  
  const icons = [];
  for (const f of FEASTS) {
    if (f.month === month) {
      if (f.endDay) {
        // Multi-day feast
        if (day >= f.day && day <= f.endDay) {
          if (!icons.includes(f.icon)) icons.push(f.icon);
        }
      } else if (f.day === day) {
        // Single-day feast
        if (!icons.includes(f.icon)) icons.push(f.icon);
      }
    }
  }
  return icons;
}

// Find the lunar day/month for a given Julian Day on a given profile's calendar.
// Returns { day: number, month: number } or null if unable to calculate.
// Uses JD throughout — no JS Date objects.
function getLunarDayForJD(jd, profile) {
  if (!jd || !isFinite(jd)) return null;
  
  const isHebcal = profile.calendarBackend === 'hebcal';
  const finder = isHebcal ? _findHebcalDayInMonths : _findDayInMonths;
  
  // Fast path: search the already-computed calendar from AppStore. Only valid
  // when it was built by the same backend with the same rules at the same
  // place (day boundaries move with latitude and longitude).
  try {
    if (typeof AppStore !== 'undefined') {
      const appState = AppStore.getState();
      const derived = AppStore.getDerived();
      const currentProfile = window.PROFILES?.[appState.context?.profileId] || {};
      const loc = appState.context?.location || {};
      
      const sameBackend = (currentProfile.calendarBackend === 'hebcal') === isHebcal;
      const sameProfile = sameBackend && (isHebcal || (
        profile.moonPhase === (currentProfile.moonPhase || 'full') &&
        profile.dayStartTime === (currentProfile.dayStartTime || 'morning') &&
        profile.yearStartRule === (currentProfile.yearStartRule || 'equinox') &&
        Math.abs((profile.dayStartAngle ?? 12) - (currentProfile.dayStartAngle ?? 12)) < 0.01 &&
        Math.abs((profile.crescentThreshold ?? 18) - (currentProfile.crescentThreshold ?? 18)) < 0.01 &&
        Math.abs((profile.lat ?? 31.7683) - (loc.lat ?? 31.7683)) < 0.01 &&
        Math.abs((profile.lon ?? 35.2137) - (loc.lon ?? 35.2137)) < 0.01));
      
      if (sameProfile && derived.lunarMonths && derived.lunarMonths.length > 0) {
        const result = finder(derived.lunarMonths, jd, profile);
        if (result) return result;
      }
    }
  } catch (e) {
    // fall through to the slow path
  }
  
  try {
    // Slow path: build that calendar's year. Dates before the spring new year
    // belong to the previous calendar year, so try the label year and the one before.
    const approxYear = JulianDay.jdnToDisplay(jd).year;
    for (const year of [approxYear, approxYear - 1]) {
      const calendar = getCalendarForProfile(year, profile);
      if (!calendar || !calendar.months) continue;
      const result = finder(calendar.months, jd, profile);
      if (result) return result;
    }
    return null;
  } catch (e) {
    console.warn('Error calculating lunar day for profile:', e);
    return null;
  }
}

// Build a calendar year for an arbitrary profile at its own location.
// Profiles with calendarBackend 'hebcal' come from the hebcal adapter (the
// Modern Jewish calendar is arithmetic, no sky); everything else from the
// shared LunarCalendarEngine, reconfigured per call (its own cache is keyed by
// year, place and rules, so repeat calls are cheap).
function getCalendarForProfile(year, profile) {
  const location = { lat: profile.lat ?? 31.7683, lon: profile.lon ?? 35.2137 };
  
  if (profile.calendarBackend === 'hebcal') {
    if (typeof HebcalCalendarAdapter === 'undefined' || !HebcalCalendarAdapter.isAvailable()) return null;
    if (!getCalendarForProfile._hebcal) getCalendarForProfile._hebcal = new HebcalCalendarAdapter();
    return getCalendarForProfile._hebcal.generateYear(year, location, {});
  }
  
  const calEngine = _sharedLunarEngine();
  if (!calEngine) return null;
  calEngine.configure({
    moonPhase: profile.moonPhase || 'full',
    dayStartTime: profile.dayStartTime || 'morning',
    dayStartAngle: profile.dayStartAngle ?? 12,
    yearStartRule: profile.yearStartRule || 'equinox',
    crescentThreshold: profile.crescentThreshold ?? 18
  });
  return calEngine.generateYear(year, location);
}

// One LunarCalendarEngine for every world-clock lookup (null until the
// astronomy engine has loaded).
function _sharedLunarEngine() {
  if (typeof LunarCalendarEngine === 'undefined') return null;
  if (!getLunarDayForJD._engine) {
    const astroEngine = typeof getAstroEngine === 'function' ? getAstroEngine() : null;
    if (!astroEngine) return null;
    getLunarDayForJD._engine = new LunarCalendarEngine(astroEngine);
  }
  return getLunarDayForJD._engine;
}

// Search an array of lunar months for the day containing a given JD.
// Each day has a .jd field, the instant the day begins (dawn or sunset by the
// profile). The containing day is the last one whose start is at or before the
// target. (Bucketing by whole Julian day, as this once did, put the hours
// between midnight and dawn, or between noon and sunset, in the wrong day.)
function _findDayInMonths(months, targetJD) {
  let found = null;
  for (const month of months) {
    if (!month.days || month.days.length === 0) continue;
    for (const day of month.days) {
      if (day.jd == null) continue;
      if (day.jd > targetJD) {
        return found ? { day: found.day, month: found.month } : null;  // null: before this year began
      }
      found = { day: day.lunarDay, month: month.monthNumber, jd: day.jd };
    }
  }
  // Past the last boundary we know: inside the final day only while it lasts.
  if (found && targetJD < found.jd + 1.1) return { day: found.day, month: found.month };
  return null;
}

// The hebcal adapter's days carry midnight of their civil label, not a day
// boundary, so match by label: the civil date at the observer's longitude,
// rolled forward once the sun has set there (the Jewish day begins at sunset).
function _findHebcalDayInMonths(months, targetJD, profile) {
  const lat = profile.lat ?? 31.7683, lon = profile.lon ?? 35.2137;
  let labelJDN = JulianDay.jdnOf(targetJD + lon / 360);
  const sunsetJD = _sunsetJD(labelJDN, lat, lon);
  if (sunsetJD != null && targetJD >= sunsetJD) labelJDN += 1;
  for (const month of months) {
    if (!month.days) continue;
    for (const day of month.days) {
      if (day.gregorianDate && JulianDay.displayDateToJDN(day.gregorianDate) === labelJDN) {
        return { day: day.lunarDay, month: month.monthNumber };
      }
    }
  }
  return null;
}

// Sunset, as a JD, on the civil day with the given JDN at a location; null
// without an astronomy engine.
function _sunsetJD(jdn, lat, lon) {
  try {
    const calEngine = _sharedLunarEngine();
    if (!calEngine) return null;
    // Proleptic-Gregorian fields for this JDN: the engine builds its search
    // instant from the Date's UTC fields, so no Julian label may leak in here.
    const civil = new Date((jdn - 0.5 - 2440587.5) * 86400000);
    const ms = calEngine.getSunsetTime(civil, { lat, lon });
    return ms == null ? null : JulianDay.instantToJD(new Date(ms));
  } catch (e) {
    return null;
  }
}

// ── "This Biblical Date on Other Calendars" ──────────────────────────────────

// Where a lunar year/month/day falls on some other calendar (profile at a
// location). Returns the day's label date and the instant the day begins, or
// { missing: 'month' | 'day' } when that calendar has no such date this year
// (a 12-month year has no Month 13; a 29-day month has no Day 30).
function getLunarDateOnCalendar(year, month, day, profile) {
  const calendar = getCalendarForProfile(year, profile);
  if (!calendar || !calendar.months || calendar.months.length === 0) return null;
  const monthData = calendar.months.find(m => m.monthNumber === month);
  if (!monthData) return { missing: 'month', monthsInYear: calendar.months.length };
  const days = monthData.days || [];
  const dayData = days.find(d => d.lunarDay === day);
  if (!dayData) return { missing: 'day', daysInMonth: days.length };
  
  // Lunar-engine days carry their real boundary in .jd. Adapter days carry
  // midnight of the civil label; that Jewish day began at the previous sunset.
  let startJD = dayData.jd;
  if (profile.calendarBackend === 'hebcal') {
    const labelJDN = JulianDay.displayDateToJDN(dayData.gregorianDate);
    startJD = _sunsetJD(labelJDN - 1, profile.lat ?? 31.7683, profile.lon ?? 35.2137);
  }
  return {
    year, month, day,
    gregorianDate: dayData.gregorianDate,
    weekday: dayData.weekday,
    weekdayName: dayData.weekdayName,
    startJD,
    monthsInYear: calendar.months.length,
    daysInMonth: days.length
  };
}

// Time of day of an instant (JD) at a location: the IANA zone when tz-lookup
// is present and the date is modern, else the whole-hour longitude rule that
// getLocalTimeForLocation uses.
function formatTimeAtLocation(jd, lat, lon) {
  if (jd == null || !isFinite(jd)) return '';
  const instant = JulianDay.jdToInstant(jd);
  if (instant.getUTCFullYear() >= 1900) {
    try {
      const tz = (typeof TimezoneUtils !== 'undefined' && TimezoneUtils.getTimezoneFromCoords)
        ? TimezoneUtils.getTimezoneFromCoords(lat, lon) : null;
      if (typeof tz === 'string' && tz) {
        return new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', timeZone: tz }).format(instant);
      }
    } catch (e) { /* fall through to the longitude rule */ }
  }
  const local = new Date(instant.getTime() + Math.round(lon / 15) * 3600000);
  const h = local.getUTCHours(), m = local.getUTCMinutes();
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
}

// "Thu, Nov 5, 2026" or "Wed, Mar 22, 30 (Julian)" from a display-labeled Date.
function formatShortDisplayDate(date) {
  if (typeof getFormattedDateParts === 'function') {
    const p = getFormattedDateParts(date);
    return `${p.weekdayName.slice(0, 3)}, ${p.shortMonthName} ${p.day}, ${p.yearStr}${p.calendarSuffix}`;
  }
  return date.toISOString().slice(0, 10);
}

// Go to a lunar date on another calendar: profile, location and date in one
// dispatch, so the store recomputes once and the URL becomes
// /profile/location/year/month/day.
function navigateToLunarDateOnCalendar(profileId, locationSlug, year, month, day) {
  const profile = window.PROFILES?.[profileId];
  const coords = (typeof URLRouter !== 'undefined') ? URLRouter.CITY_SLUGS?.[locationSlug] : null;
  if (!profile || !coords || typeof AppStore === 'undefined') return;
  AppStore.dispatch({
    type: 'SET_LUNAR_DATETIME',
    profileId,
    lat: coords.lat,
    lon: coords.lon,
    year, month, day
  });
}

// Legacy wrapper for callers still passing timestamps
function getLunarDayForTimestamp(timestamp, profile) {
  // Convert timestamp to JD: JD = (ms / 86400000) + 2440587.5
  const jd = (timestamp / 86400000) + 2440587.5;
  return getLunarDayForJD(jd, profile);
}

// Get default world clock entries (used when no saved entries exist)
function getDefaultWorldClockEntries() {
  const entries = [];
  const seen = new Set();
  
  // Helper to add unique entries
  const addEntry = (profileId, locationSlug, locationName) => {
    const key = `${profileId}:${locationSlug}`;
    if (seen.has(key)) return;
    seen.add(key);
    entries.push({ profileId, locationSlug, locationName });
  };
  
  // User's saved GPS location (from localStorage) - stable across navigation
  const savedLoc = getSavedUserLocation();
  if (savedLoc) {
    const savedSlug = getClosestCitySlug(savedLoc.lat, savedLoc.lon, Infinity) || 'jerusalem';
    const savedName = savedLoc.city || formatCitySlug(savedSlug);
    // Add the site-default profile at user's location first
    addEntry('timeTested2', savedSlug, savedName);
  }
  
  // All presets in Jerusalem
  const allProfiles = window.PROFILES || {};
  for (const [profileId, profile] of Object.entries(allProfiles)) {
    addEntry(profileId, 'jerusalem', 'Jerusalem');
  }
  
  return entries;
}

// Load world clock entries from localStorage
function loadWorldClockEntries() {
  try {
    const saved = localStorage.getItem('worldClockEntries');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Error loading world clock entries:', e);
  }
  return null;  // null means use defaults
}

// Save world clock entries to localStorage
function saveWorldClockEntries(entries) {
  try {
    localStorage.setItem('worldClockEntries', JSON.stringify(entries));
  } catch (e) {
    console.error('Error saving world clock entries:', e);
  }
}

// Get current world clock entries (saved or defaults)
// Once defaults are generated, they're saved to keep the list stable
function getWorldClockEntries() {
  let entries = loadWorldClockEntries();
  if (!entries) {
    entries = getDefaultWorldClockEntries();
    saveWorldClockEntries(entries);  // Save so list stays stable
  }
  return entries;
}

// Add a world clock entry
function addWorldClockEntry(profileId, locationSlug, locationName) {
  const entries = getWorldClockEntries();
  const key = `${profileId}:${locationSlug}`;
  
  // Check for duplicates
  const exists = entries.some(e => `${e.profileId}:${e.locationSlug}` === key);
  if (exists) return false;
  
  entries.push({ profileId, locationSlug, locationName });
  saveWorldClockEntries(entries);
  return true;
}

// Remove a world clock entry
function removeWorldClockEntry(index) {
  const entries = getWorldClockEntries();
  if (index >= 0 && index < entries.length) {
    entries.splice(index, 1);
    saveWorldClockEntries(entries);
    return true;
  }
  return false;
}

// Reset world clock to defaults
function resetWorldClockEntries() {
  localStorage.removeItem('worldClockEntries');
}

// Remove world clock entry and refresh the UI
function removeWorldClockEntryAndRefresh(index) {
  removeWorldClockEntry(index);
  refreshDayDetailIfVisible();
}

// Show modal to add a new World Clock entry (profile selector + interactive map)
function showAddWorldClockModal() {
  // Build profile options
  const allProfiles = window.PROFILES || {};
  const currentProfileId = (typeof AppStore !== 'undefined') ? (AppStore.getState().context?.profileId || 'timeTested') : 'timeTested';
  let profileOptionsHtml = '';
  for (const [id, profile] of Object.entries(allProfiles)) {
    const selected = id === currentProfileId ? ' selected' : '';
    profileOptionsHtml += `<option value="${id}"${selected}>${renderProfileIconText(profile)} ${profile.name}</option>`;
  }
  
  // Get current profile settings for the map
  const appState = (typeof AppStore !== 'undefined') ? AppStore.getState() : {};
  const profile = window.PROFILES?.[currentProfileId] || {};
  const defaultLat = 31.7683;
  const defaultLon = 35.2137;
  
  // Track selected location (starts at Jerusalem)
  let selectedSlug = 'jerusalem';
  let selectedLat = defaultLat;
  let selectedLon = defaultLon;
  
  // Create overlay + modal
  const overlay = document.createElement('div');
  overlay.className = 'picker-overlay';
  
  const modal = document.createElement('div');
  modal.className = 'location-picker';
  modal.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 500px; max-width: 90vw; z-index: 10001;';
  modal.onclick = (e) => e.stopPropagation();
  
  modal.innerHTML = `
    <div class="location-picker-header">
      <h3>Add Calendar</h3>
      <button class="picker-close-btn" title="Close">&#10005;</button>
    </div>
    <div class="location-picker-controls" style="display: flex; flex-direction: column; gap: 10px; padding: 12px 16px 8px;">
      <label style="color: var(--text-secondary); font-size: 0.85em;">Profile</label>
      <select id="wc-add-profile" class="location-select">${profileOptionsHtml}</select>
      <label style="color: var(--text-secondary); font-size: 0.85em;">Location (click map or select below)</label>
    </div>
    <div id="wc-map-slot" style="padding: 0 16px;"></div>
    <div style="padding: 8px 16px 16px; display: flex; gap: 8px;">
      <select id="wc-add-city" class="location-select" style="flex: 1;"></select>
      <button id="wc-add-confirm" style="padding: 8px 16px; background: var(--accent-primary); color: var(--text-inverse); border: none; border-radius: 4px; font-weight: 600; cursor: pointer; white-space: nowrap;">Add</button>
    </div>
  `;
  
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
  
  // Build city dropdown (same grouped layout as CalendarView)
  const citySelect = modal.querySelector('#wc-add-city');
  const CITY_GROUPS = {
    'Biblical': ['jerusalem', 'bethlehem', 'nazareth', 'jericho', 'hebron', 'cairo', 'alexandria'],
    'Middle East': ['tel-aviv', 'dubai', 'amman', 'baghdad', 'tehran', 'riyadh', 'istanbul', 'damascus', 'beirut'],
    'Americas': ['new-york', 'los-angeles', 'chicago', 'houston', 'denver', 'miami', 'seattle', 'toronto', 'mexico-city', 'sao-paulo'],
    'Europe': ['london', 'paris', 'berlin', 'rome', 'madrid', 'amsterdam', 'moscow', 'athens', 'zurich'],
    'Asia': ['tokyo', 'beijing', 'shanghai', 'hong-kong', 'singapore', 'mumbai', 'delhi', 'seoul', 'bangkok'],
    'Africa': ['johannesburg', 'lagos', 'nairobi', 'cape-town'],
    'Oceania': ['sydney', 'melbourne', 'auckland', 'perth']
  };
  let cityHtml = '';
  for (const [region, cities] of Object.entries(CITY_GROUPS)) {
    cityHtml += `<optgroup label="${region}">`;
    for (const slug of cities) {
      const sel = slug === 'jerusalem' ? ' selected' : '';
      cityHtml += `<option value="${slug}"${sel}>${formatCitySlug(slug)}</option>`;
    }
    cityHtml += '</optgroup>';
  }
  citySelect.innerHTML = cityHtml;
  
  // Create the DatelineMap
  const mapSlot = modal.querySelector('#wc-map-slot');
  if (typeof DatelineMap !== 'undefined') {
    const mapEl = DatelineMap.create({
      moonEventDate: new Date(),
      lat: defaultLat,
      lon: defaultLon,
      moonPhase: profile.moonPhase || 'full',
      dayStartTime: profile.dayStartTime || 'morning',
      dayStartAngle: profile.dayStartAngle || -12,
      onLocationSelect: (lat, lon, citySlug) => {
        selectedLat = lat;
        selectedLon = lon;
        selectedSlug = citySlug || (typeof URLRouter !== 'undefined' ? URLRouter._getLocationSlug({ lat, lon }) : 'jerusalem');
        // Sync the dropdown
        if (citySelect.querySelector(`option[value="${selectedSlug}"]`)) {
          citySelect.value = selectedSlug;
        }
        DatelineMap.updateLocation(mapEl, lat, lon);
      }
    });
    mapSlot.appendChild(mapEl);
  }
  
  // Sync map when dropdown changes
  citySelect.addEventListener('change', () => {
    const slug = citySelect.value;
    const coords = (typeof URLRouter !== 'undefined') ? URLRouter.CITY_SLUGS?.[slug] : null;
    if (coords && mapSlot.firstChild) {
      selectedSlug = slug;
      selectedLat = coords.lat;
      selectedLon = coords.lon;
      DatelineMap.updateLocation(mapSlot.firstChild, coords.lat, coords.lon);
    }
  });
  
  // Close handler
  const close = () => overlay.remove();
  overlay.onclick = close;
  modal.querySelector('.picker-close-btn').addEventListener('click', close);
  
  // Add button
  modal.querySelector('#wc-add-confirm').addEventListener('click', () => {
    const profileId = modal.querySelector('#wc-add-profile').value;
    if (!profileId || !selectedSlug) return;
    
    const locationName = formatCitySlug(selectedSlug);
    if (addWorldClockEntry(profileId, selectedSlug, locationName)) {
      close();
      if (typeof refreshDayDetailIfVisible === 'function') {
        refreshDayDetailIfVisible();
      }
    } else {
      alert('This calendar is already in your list.');
    }
  });
}

// Navigate to a world clock entry (switch profile and location)
function navigateToWorldClockEntry(profileId, locationSlug) {
  const profile = window.PROFILES?.[profileId];
  const coords = (typeof URLRouter !== 'undefined') ? URLRouter.CITY_SLUGS?.[locationSlug] : null;
  if (!profile || !coords) return;
  
  if (typeof AppStore !== 'undefined') {
    // Single atomic dispatch: profile + location together = one recompute, one URL push
    AppStore.dispatch({
      type: 'SET_PROFILE',
      profileId,
      location: { lat: coords.lat, lon: coords.lon }
    });
  }
}
