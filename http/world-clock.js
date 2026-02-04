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

// Calculate what lunar day a timestamp falls on for a given profile's settings
// Returns { day: number, month: number } or null if unable to calculate
function getLunarDayForTimestamp(timestamp, profile) {
  try {
    const date = new Date(timestamp);
    let year = date.getFullYear();
    
    // Make sure we have the required functions and state
    if (typeof state === 'undefined' || typeof getAstroEngine === 'undefined' || typeof findMoonEventsForYear === 'undefined') {
      return null;
    }
    
    // Temporarily store current state and apply profile settings
    const savedState = {
      moonPhase: state.moonPhase,
      dayStartTime: state.dayStartTime,
      dayStartAngle: state.dayStartAngle,
      yearStartRule: state.yearStartRule,
      crescentThreshold: state.crescentThreshold,
      lat: state.lat,
      lon: state.lon
    };
    
    // Apply profile settings temporarily (with defaults for undefined values)
    state.moonPhase = profile.moonPhase || 'full';
    state.dayStartTime = profile.dayStartTime || 'morning';
    state.dayStartAngle = profile.dayStartAngle ?? 12;
    state.yearStartRule = profile.yearStartRule || 'equinox';
    state.crescentThreshold = profile.crescentThreshold ?? 18;
    state.lat = profile.lat ?? 31.7683;
    state.lon = profile.lon ?? 35.2137;
    
    const engine = getAstroEngine();
    
    // Check if timestamp is before this year's spring equinox - if so, use previous year
    const thisYearEquinox = engine.getSeasons(year).mar_equinox.date;
    if (date < thisYearEquinox) {
      year = year - 1;
    }
    
    // Find moon events for the year (need events spanning into next year)
    const moonEvents = findMoonEventsForYear(year, profile.moonPhase);
    if (!moonEvents || moonEvents.length === 0) {
      Object.assign(state, savedState);
      return null;
    }
    
    // Find the spring equinox for the lunar year
    const springEquinox = engine.getSeasons(year).mar_equinox.date;
    
    // Find the first moon event on or after the spring equinox for Nisan
    let nissanMoon = null;
    for (const event of moonEvents) {
      if (event >= springEquinox) {
        nissanMoon = event;
        break;
      }
    }
    
    // If no moon event after equinox, check the last one before
    if (!nissanMoon && moonEvents.length > 0) {
      for (let i = moonEvents.length - 1; i >= 0; i--) {
        if (moonEvents[i] < springEquinox) {
          nissanMoon = moonEvents[i];
          break;
        }
      }
    }
    
    if (!nissanMoon) {
      Object.assign(state, savedState);
      return null;
    }
    
    // Build simplified lunar months to find the day
    const observerLon = profile.lon;
    let currentMoonIdx = moonEvents.findIndex(m => Math.abs(m.getTime() - nissanMoon.getTime()) < 1000);
    if (currentMoonIdx === -1) currentMoonIdx = moonEvents.findIndex(m => m >= nissanMoon);
    
    // Iterate through months to find where the timestamp falls
    for (let m = 0; m < 13 && currentMoonIdx < moonEvents.length - 1; m++) {
      const moonEvent = moonEvents[currentMoonIdx];
      const nextMoonEvent = moonEvents[currentMoonIdx + 1];
      
      // Calculate month start date (similar to buildLunarMonths)
      const moonEventLocalDate = new Date(moonEvent.getTime());
      const monthStartDate = new Date(Date.UTC(
        moonEventLocalDate.getUTCFullYear(),
        moonEventLocalDate.getUTCMonth(),
        moonEventLocalDate.getUTCDate(),
        0, 0, 0
      ));
      
      // Apply day offset based on settings
      if ((profile.moonPhase === 'dark' || profile.moonPhase === 'full' || profile.moonPhase === 'crescent') && profile.dayStartTime === 'evening') {
        if (typeof getSunsetTimestamp === 'function') {
          const sunsetOnMoonDate = getSunsetTimestamp(moonEventLocalDate);
          if (sunsetOnMoonDate != null) {
            const moonEventLocalTime = moonEvent.getTime() + (observerLon / 15) * 60 * 60 * 1000;
            const sunsetLocalTime = sunsetOnMoonDate + (observerLon / 15) * 60 * 60 * 1000;
            if (moonEventLocalTime > sunsetLocalTime) {
              monthStartDate.setUTCDate(monthStartDate.getUTCDate() + 1);
            }
          }
        }
      }
      
      // Calculate next month start
      const nextMoonEventLocalDate = new Date(nextMoonEvent.getTime());
      const nextMonthStart = new Date(Date.UTC(
        nextMoonEventLocalDate.getUTCFullYear(),
        nextMoonEventLocalDate.getUTCMonth(),
        nextMoonEventLocalDate.getUTCDate(),
        0, 0, 0
      ));
      
      if ((profile.moonPhase === 'dark' || profile.moonPhase === 'full' || profile.moonPhase === 'crescent') && profile.dayStartTime === 'evening') {
        if (typeof getSunsetTimestamp === 'function') {
          const sunsetOnNextMoonDate = getSunsetTimestamp(nextMoonEventLocalDate);
          if (sunsetOnNextMoonDate != null) {
            const nextMoonEventLocalTime = nextMoonEvent.getTime() + (observerLon / 15) * 60 * 60 * 1000;
            const nextSunsetLocalTime = sunsetOnNextMoonDate + (observerLon / 15) * 60 * 60 * 1000;
            if (nextMoonEventLocalTime > nextSunsetLocalTime) {
              nextMonthStart.setUTCDate(nextMonthStart.getUTCDate() + 1);
            }
          }
        }
      }
      
      // Check if timestamp falls in this month
      const timestampDate = new Date(timestamp);
      const timestampDayStart = new Date(Date.UTC(
        timestampDate.getUTCFullYear(),
        timestampDate.getUTCMonth(),
        timestampDate.getUTCDate(),
        0, 0, 0
      ));
      
      if (timestampDayStart >= monthStartDate && timestampDayStart < nextMonthStart) {
        // Found the month - calculate the day
        const dayOffset = Math.floor((timestampDayStart - monthStartDate) / (24 * 60 * 60 * 1000));
        const lunarDay = dayOffset + 1;
        
        // Restore state
        Object.assign(state, savedState);
        return { day: lunarDay, month: m + 1 };
      }
      
      currentMoonIdx++;
    }
    
    // Restore state
    Object.assign(state, savedState);
    return null;
  } catch (e) {
    console.warn('Error calculating lunar day for profile:', e);
    return null;
  }
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
    // Add Time-Tested at user's location first
    addEntry('timeTested', savedSlug, savedName);
  }
  
  // All presets in Jerusalem (use window.PROFILES or PRESET_PROFILES if available)
  const allProfiles = window.PROFILES || (typeof PRESET_PROFILES !== 'undefined' ? PRESET_PROFILES : {});
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

// Open location picker for World Clock (adds new entry)
function openLocationPickerForWorldClock() {
  locationPickerMode = 'worldclock';
  locationPickerCallback = (locationSlug, locationName, coords, profileId) => {
    if (addWorldClockEntry(profileId, locationSlug, locationName)) {
      refreshDayDetailIfVisible();
    } else {
      alert('This calendar is already in your list.');
    }
  };
  showUnifiedLocationPicker('Add Calendar', true);
}

// Populate profile selector in location picker (for World Clock mode)
function populatePickerProfileSelect() {
  const select = document.getElementById('city-picker-profile-select');
  if (!select) return;
  
  const allProfiles = window.PROFILES || {};
  const selectedProfileId = typeof state !== 'undefined' ? (state.selectedProfile || 'timeTested') : 'timeTested';
  
  select.innerHTML = '';
  for (const [id, profile] of Object.entries(allProfiles)) {
    const opt = document.createElement('option');
    opt.value = id;
    opt.textContent = `${renderProfileIconText(profile)} ${profile.name}`;
    if (id === selectedProfileId) {
      opt.selected = true;
    }
    select.appendChild(opt);
  }
}

// Get currently selected profile in picker (for World Clock mode)
function getPickerSelectedProfile() {
  const select = document.getElementById('city-picker-profile-select');
  const defaultProfile = typeof state !== 'undefined' ? (state.selectedProfile || 'timeTested') : 'timeTested';
  return select ? select.value : defaultProfile;
}

// Confirm adding a World Clock entry
function confirmWorldClockAdd() {
  // Use the previewed location, or current selection from dropdown
  let slug = previewedLocationSlug;
  let coords = previewedLocationCoords;
  
  if (!slug) {
    // Fallback to dropdown selection
    const select = document.getElementById('city-picker-select');
    slug = select ? select.value : null;
    coords = slug ? CITY_SLUGS[slug] : null;
  }
  
  if (!slug || !coords) {
    alert('Please select a location first.');
    return;
  }
  
  const locationName = formatCitySlug(slug);
  confirmLocationSelection(slug, locationName, coords);
}

// Show modal to add new world clock entry (now uses unified picker)
function showAddWorldClockModal() {
  openLocationPickerForWorldClock();
}

// Legacy function for compatibility
function hideAddWorldClockModal() {
  toggleCityPicker();
}

// Legacy function kept for old modal (no longer used but kept for safety)
function addWorldClockFromModal() {
  // Now handled by confirmLocationSelection
}

// Navigate to a world clock entry (switch profile and location)
function navigateToWorldClockEntry(profileId, locationSlug) {
  const profile = window.PROFILES?.[profileId] || (typeof PRESET_PROFILES !== 'undefined' ? PRESET_PROFILES[profileId] : null);
  const coords = typeof CITY_SLUGS !== 'undefined' ? CITY_SLUGS[locationSlug] : null;
  if (!profile || !coords) return;
  
  // Apply profile settings
  if (typeof state !== 'undefined') {
    state.moonPhase = profile.moonPhase;
    state.dayStartTime = profile.dayStartTime;
    state.dayStartAngle = profile.dayStartAngle;
    state.yearStartRule = profile.yearStartRule;
    state.crescentThreshold = profile.crescentThreshold ?? 18;
    state.sabbathMode = profile.sabbathMode;
    state.selectedProfile = profileId;
    
    // Apply location
    state.lat = coords.lat;
    state.lon = coords.lon;
    
    // Regenerate calendar with new settings
    if (typeof saveState === 'function') saveState();
    if (typeof regenerateCalendarPreservingScroll === 'function') {
      regenerateCalendarPreservingScroll();
    } else if (typeof CalendarView !== 'undefined' && typeof CalendarView.render === 'function') {
      CalendarView.render(document.getElementById('app-content'));
    }
  } else if (typeof AppStore !== 'undefined') {
    // Use AppStore if state is not directly available
    AppStore.dispatch({
      type: 'SET_PROFILE',
      profileId: profileId,
      lat: coords.lat,
      lon: coords.lon
    });
  }
}
