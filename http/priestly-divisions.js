// ============================================================================
// PRIESTLY DIVISIONS - Calculate which priestly course is serving
// ============================================================================
// 
// Historical reference: Course 1 (Jehoiarib) was serving when the temple fell
// on the 9th of Av, 70 AD. We use this as our anchor point to calculate
// forward and backward through time.
//
// For Saturday/continuous sabbath: weeks are always 7 days
// For Lunar sabbath: weeks follow the lunar month (4 weeks per ~29.53 day month)
// ============================================================================

// Priestly divisions data (will be loaded from JSON)
let PRIESTLY_DIVISIONS = null;
let priestlyDivisionsLoadPromise = null;

// Average synodic month length in days (high precision)
const SYNODIC_MONTH = 29.530588853;

// Load priestly divisions from JSON file
async function loadPriestlyDivisions() {
  if (PRIESTLY_DIVISIONS) return PRIESTLY_DIVISIONS;
  
  // If already loading, return the existing promise
  if (priestlyDivisionsLoadPromise) return priestlyDivisionsLoadPromise;
  
  priestlyDivisionsLoadPromise = (async () => {
    try {
      const response = await fetch('/priestly_divisions.json');
      if (!response.ok) throw new Error('Failed to load priestly divisions');
      PRIESTLY_DIVISIONS = await response.json();
      return PRIESTLY_DIVISIONS;
    } catch (err) {
      console.error('Error loading priestly divisions:', err);
      return null;
    }
  })();
  
  return priestlyDivisionsLoadPromise;
}

// Ensure divisions are loaded (call this before using getPriestlyCourse)
async function ensurePriestlyDivisionsLoaded() {
  if (!PRIESTLY_DIVISIONS) {
    await loadPriestlyDivisions();
  }
  return PRIESTLY_DIVISIONS;
}

// Calculate Julian Day Number from a date
// This uses the same algorithm as astronomy-engine-abstraction.js
function dateToJulianDay(date) {
  const y = date.getUTCFullYear();
  const m = date.getUTCMonth() + 1;
  const d = date.getUTCDate();
  const h = date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600;
  
  const a = Math.floor((14 - m) / 12);
  const yy = y + 4800 - a;
  const mm = m + 12 * a - 3;
  
  // Julian calendar for dates before Oct 15, 1582
  // Gregorian calendar for dates on or after Oct 15, 1582
  let jdn;
  if (y < 1582 || (y === 1582 && (m < 10 || (m === 10 && d < 15)))) {
    jdn = d + Math.floor((153 * mm + 2) / 5) + 365 * yy + Math.floor(yy / 4) - 32083;
  } else {
    jdn = d + Math.floor((153 * mm + 2) / 5) + 365 * yy + Math.floor(yy / 4) - Math.floor(yy / 100) + Math.floor(yy / 400) - 32045;
  }
  return jdn + (h - 12) / 24;
}

// Get the reference date (9th of Av, 70 AD) for the current calendar settings
// Returns the Julian Day Number for when Course 1 was serving
function getTempleDestructionReferenceJD(profile) {
  // We need to calculate when the 9th of Av 70 AD falls under the current calendar
  // This requires generating the lunar calendar for year 70 AD
  
  // Create a temporary state-like object with the profile settings
  const tempState = {
    year: 70,
    lat: profile?.lat || 31.7683,  // Jerusalem
    lon: profile?.lon || 35.2137,
    moonPhase: profile?.moonPhase || state.moonPhase,
    dayStartTime: profile?.dayStartTime || state.dayStartTime,
    dayStartAngle: profile?.dayStartAngle || state.dayStartAngle,
    yearStartRule: profile?.yearStartRule || state.yearStartRule,
    crescentThreshold: profile?.crescentThreshold || state.crescentThreshold
  };
  
  // Get moon events for year 70 AD using the current engine
  const engine = getAstroEngine();
  const moonEvents = findMoonEvents(70, tempState.moonPhase);
  
  // Get year start point for 70 AD
  const yearStartPoint = getYearStartPoint(70);
  
  // Find the first moon event on or after year start (this is Nisan)
  let nissanMoon = moonEvents.find(m => m >= yearStartPoint);
  if (!nissanMoon) nissanMoon = moonEvents[0];
  
  // Find the 5th moon event (Av) - index 4 since we start at 0
  const nissanIndex = moonEvents.findIndex(m => Math.abs(m.getTime() - nissanMoon.getTime()) < 1000);
  const avMoonIndex = nissanIndex + 4; // 5th month
  
  if (avMoonIndex >= moonEvents.length - 1) {
    console.error('Cannot find Av moon for 70 AD');
    return null;
  }
  
  const avMoon = moonEvents[avMoonIndex];
  const nextMoon = moonEvents[avMoonIndex + 1];
  
  // Calculate when Day 1 of Av starts based on the current settings
  const observerLon = tempState.lon;
  const avMoonLocalDate = getLocalDateFromUTC(avMoon, observerLon);
  
  let monthStartDate = new Date(avMoonLocalDate.getTime());
  
  // Apply the same day start logic as buildLunarMonths
  if ((tempState.moonPhase === 'dark' || tempState.moonPhase === 'full' || tempState.moonPhase === 'crescent') && 
      tempState.dayStartTime === 'evening') {
    const sunsetOnMoonDate = getSunsetTimestamp(avMoonLocalDate);
    const moonEventLocalTime = avMoon.getTime() + (observerLon / 15) * 60 * 60 * 1000;
    const sunsetLocalTime = sunsetOnMoonDate + (observerLon / 15) * 60 * 60 * 1000;
    
    if (moonEventLocalTime > sunsetLocalTime) {
      monthStartDate.setUTCDate(monthStartDate.getUTCDate() + 1);
    }
  } else if ((tempState.moonPhase === 'dark' || tempState.moonPhase === 'full' || tempState.moonPhase === 'crescent') && 
             tempState.dayStartTime === 'morning') {
    const sunriseOnMoonDate = getSunriseTimestamp(avMoonLocalDate);
    const moonEventLocalTime = avMoon.getTime() + (observerLon / 15) * 60 * 60 * 1000;
    const sunriseLocalTime = sunriseOnMoonDate + (observerLon / 15) * 60 * 60 * 1000;
    
    if (moonEventLocalTime >= sunriseLocalTime) {
      monthStartDate.setUTCDate(monthStartDate.getUTCDate() + 1);
    }
  } else {
    monthStartDate.setUTCDate(monthStartDate.getUTCDate() + 1);
  }
  
  // The 9th of Av is 8 days after Day 1 (Day 1 + 8 = Day 9)
  const ninthOfAv = new Date(monthStartDate.getTime());
  ninthOfAv.setUTCDate(ninthOfAv.getUTCDate() + 8);
  
  return dateToJulianDay(ninthOfAv);
}

// Cache for reference JD per profile configuration
const referenceJDCache = new Map();

function getCachedReferenceJD(profile) {
  // Create a cache key from the relevant profile settings
  const key = `${profile?.moonPhase || state.moonPhase}-${profile?.dayStartTime || state.dayStartTime}-${profile?.yearStartRule || state.yearStartRule}-${profile?.crescentThreshold || state.crescentThreshold}`;
  
  if (!referenceJDCache.has(key)) {
    const jd = getTempleDestructionReferenceJD(profile);
    referenceJDCache.set(key, jd);
  }
  
  return referenceJDCache.get(key);
}

// Calculate which week within a lunar month a given day falls into
// Returns 0, 1, 2, or 3 (for weeks 1-4)
function getLunarWeekIndex(lunarDay) {
  // Days 1-7 = week 0 (days 1-7, but Sabbath is day 8)
  // Actually for lunar sabbath: 1-7=week0, 8-14=week1, 15-21=week2, 22-29/30=week3
  // But sabbaths are on 8, 15, 22, 29 which are the LAST day of each week
  // So: days 2-8 = week 1, days 9-15 = week 2, days 16-22 = week 3, days 23-29/30 = week 4
  // But day 1 is new moon day, not part of a week in some interpretations
  
  // For our calculation purposes:
  // Week 1: days 1-8 (sabbath on 8)
  // Week 2: days 9-15 (sabbath on 15)
  // Week 3: days 16-22 (sabbath on 22)
  // Week 4: days 23-29/30 (sabbath on 29)
  
  if (lunarDay <= 8) return 0;
  if (lunarDay <= 15) return 1;
  if (lunarDay <= 22) return 2;
  return 3;  // 23-30
}

// Calculate the priestly course for a given date
// 
// For Saturday sabbath: continuous 7-day weeks from reference point
// For Lunar sabbath: 4 weeks per lunar month
//
// Parameters:
//   date: JavaScript Date object for the target date
//   lunarDay: (optional) the lunar day of month (1-30) if known
//   lunarMonth: (optional) the lunar month (1-13) if known
//   profile: (optional) calendar profile settings to use
//
// Returns: { order: 1-24, course: "name", meaning: "description", weekInCycle: 1-24 }
function getPriestlyCourse(date, lunarDay = null, lunarMonth = null, profile = null) {
  if (!PRIESTLY_DIVISIONS) {
    console.warn('Priestly divisions not loaded');
    return null;
  }
  
  const sabbathMode = profile?.sabbathMode || state.sabbathMode;
  const targetJD = dateToJulianDay(date);
  const referenceJD = getCachedReferenceJD(profile);
  
  if (referenceJD === null) {
    console.error('Could not calculate reference date for temple destruction');
    return null;
  }
  
  let weekIndex;
  
  if (sabbathMode === 'lunar') {
    // Lunar sabbath calculation
    // Calculate delta months from reference, then multiply by 4 weeks per month
    
    const deltaJD = targetJD - referenceJD;
    
    // Calculate approximate months difference using high-precision synodic month
    const deltaMonths = deltaJD / SYNODIC_MONTH;
    
    // Total weeks from reference (4 weeks per month)
    // Also account for position within the current month
    let totalWeeks;
    
    if (lunarDay !== null) {
      // If we know the lunar day, we can get the exact week within the month
      const currentWeekInMonth = getLunarWeekIndex(lunarDay);
      
      // Calculate full months elapsed (floor for positive, ceil for negative)
      const fullMonths = deltaJD >= 0 ? Math.floor(deltaMonths) : Math.ceil(deltaMonths);
      
      // Calculate week index from reference
      // Reference was week 1 of its month (course 1 serving during 9th of Av)
      // The 9th of Av falls in week 2 (days 9-15), so reference week in month = 1
      const referenceWeekInMonth = 1; // 9th of Av is in the second week (index 1)
      
      // Total weeks = (full months * 4) + (current week - reference week)
      totalWeeks = (fullMonths * 4) + (currentWeekInMonth - referenceWeekInMonth);
    } else {
      // Approximate calculation when lunar day is not known
      // This is less accurate but still useful for general calculations
      totalWeeks = Math.round(deltaMonths * 4);
    }
    
    // Course 1 was serving at reference, so we need to find where we are in the cycle
    // Using modular arithmetic, handling negative values correctly
    // 24 courses cycle: 0 = course 1, 1 = course 2, ..., 23 = course 24
    weekIndex = ((totalWeeks % 24) + 24) % 24;
    
  } else {
    // Saturday/continuous sabbath calculation
    // Normalize both dates to the start of their respective Gregorian weeks
    // Week starts on Sunday (day 0) and ends on Saturday (day 6, the Sabbath)
    
    // Get day of week: (floor(JD + 1.5)) % 7 gives 0=Sunday, 1=Monday, ..., 6=Saturday
    const referenceWeekday = Math.floor(referenceJD + 1.5) % 7;
    const targetWeekday = Math.floor(targetJD + 1.5) % 7;
    
    // Normalize to start of week (Sunday)
    const referenceWeekStart = Math.floor(referenceJD) - referenceWeekday;
    const targetWeekStart = Math.floor(targetJD) - targetWeekday;
    
    // Calculate whole weeks between the two week starts
    const deltaWeeks = Math.round((targetWeekStart - referenceWeekStart) / 7);
    
    // Handle negative values with proper modular arithmetic
    weekIndex = ((deltaWeeks % 24) + 24) % 24;
  }
  
  // Get the course information
  const course = PRIESTLY_DIVISIONS[weekIndex];
  
  return {
    order: course.order,
    course: course.course,
    meaning: course.meaning,
    hebrew: course.hebrew,
    lineage: course.lineage,
    notes: course.notes || '',
    famous_people: course.famous_people || [],
    weekInCycle: weekIndex + 1  // 1-indexed week in the 24-week cycle
  };
}

// Get priestly course for a specific lunar calendar day object
// This is the main function to use from the calendar display
function getPriestlyCourseForDay(dayObj, month, profile = null) {
  if (!dayObj || !dayObj.gregorianDate) return null;
  
  return getPriestlyCourse(
    dayObj.gregorianDate,
    dayObj.lunarDay,
    month?.monthNumber || null,
    profile
  );
}

// Format the priestly course for display
function formatPriestlyCourse(courseInfo) {
  if (!courseInfo) return '';
  return `${courseInfo.course} (Course ${courseInfo.order})`;
}

// Format the priestly course with meaning
function formatPriestlyCourseWithMeaning(courseInfo) {
  if (!courseInfo) return '';
  return `${courseInfo.course} — "${courseInfo.meaning}"`;
}

// Get HTML display for priestly course (for day detail panel)
function getPriestlyCourseHtml(dayObj, month) {
  const courseInfo = getPriestlyCourseForDay(dayObj, month);
  if (!courseInfo) return '';
  
  return `
    <div class="priestly-course-display">
      <span class="priestly-course-icon">👨‍🦳</span>
      <span class="priestly-course-name">${courseInfo.course}</span>
      <span class="priestly-course-order">(Course ${courseInfo.order})</span>
      <span class="priestly-course-meaning" title="${courseInfo.meaning}">"${courseInfo.meaning}"</span>
    </div>
  `;
}

// Jump to the next/previous time this priestly course serves
// Course serves every 24 weeks (24 courses in rotation)
// direction: 1 for forward, -1 for backward
// Jumps to the FIRST day of the week when this course serves
function jumpToPriestlyCourse(courseOrder, direction) {
  if (!state.lunarMonths || state.lunarMonths.length === 0) return;
  
  const currentMonth = state.lunarMonths[state.currentMonthIndex];
  const currentDay = currentMonth.days.find(d => d.lunarDay === state.highlightedLunarDay);
  if (!currentDay) return;
  
  // For lunar sabbath: jump forward/backward ~24 weeks (6 months)
  // For Saturday sabbath: jump forward/backward 24 * 7 = 168 days
  
  if (state.sabbathMode === 'lunar') {
    // Jump by approximately 6 months (24 weeks / 4 weeks per month)
    let targetMonthIndex = state.currentMonthIndex + (direction * 6);
    let targetYear = state.year;
    
    // Handle year rollover (forward)
    while (targetMonthIndex >= state.lunarMonths.length) {
      targetMonthIndex -= state.lunarMonths.length;
      targetYear++;
    }
    
    // Handle year rollover (backward)
    while (targetMonthIndex < 0) {
      targetYear--;
      // Need to regenerate calendar to know how many months in previous year
      state.year = targetYear;
      updateUI();
      generateCalendar();
      targetMonthIndex += state.lunarMonths.length;
    }
    
    // If we changed year going forward
    if (targetYear !== state.year) {
      state.year = targetYear;
      updateUI();
      generateCalendar();
    }
    
    // Get the current week in month to find the equivalent week
    const currentWeekInMonth = getLunarWeekIndex(currentDay.lunarDay);
    const targetMonth = state.lunarMonths[targetMonthIndex];
    
    // Jump to the FIRST day of the equivalent week
    // Week 0 (days 2-8): first day is 2
    // Week 1 (days 9-15): first day is 9
    // Week 2 (days 16-22): first day is 16
    // Week 3 (days 23-29/30): first day is 23
    let targetLunarDay;
    if (currentWeekInMonth === 0) targetLunarDay = 2;
    else if (currentWeekInMonth === 1) targetLunarDay = 9;
    else if (currentWeekInMonth === 2) targetLunarDay = 16;
    else targetLunarDay = 23;
    
    // Ensure day exists in target month
    targetLunarDay = Math.min(targetLunarDay, targetMonth.daysInMonth);
    
    state.currentMonthIndex = targetMonthIndex;
    state.highlightedLunarDay = targetLunarDay;
    
    const targetDayObj = targetMonth.days.find(d => d.lunarDay === targetLunarDay);
    if (targetDayObj) {
      state.selectedTimestamp = getSunriseTimestamp(targetDayObj.gregorianDate);
      document.getElementById('goto-date').value = formatLocalDatetime(state.selectedTimestamp);
      renderMonth(targetMonth);
      updateMonthButtons();
      showDayDetail(targetDayObj, targetMonth);
      updateURL();
    }
  } else {
    // Saturday sabbath: jump forward/backward 168 days (24 weeks)
    // First, find the start of the current week (Sunday)
    const currentJD = dateToJulianDay(currentDay.gregorianDate);
    const currentWeekday = Math.floor(currentJD + 1.5) % 7; // 0=Sunday
    const currentWeekStartJD = Math.floor(currentJD) - currentWeekday;
    
    // Jump 24 weeks in the specified direction, landing on Sunday (first day of week)
    const targetWeekStartJD = currentWeekStartJD + (direction * 24 * 7);
    
    // Convert back to timestamp
    // JD to Unix timestamp: (JD - 2440587.5) * 86400000
    const targetTimestamp = (targetWeekStartJD - 2440587.5) * 86400000;
    const targetDate = new Date(targetTimestamp);
    
    // Navigate to this date
    const targetYear = targetDate.getUTCFullYear();
    const targetMonth = targetDate.getUTCMonth();
    const targetDay = targetDate.getUTCDate();
    
    navigateToTimestamp(targetTimestamp, targetYear, targetMonth, targetDay);
  }
}

// Navigate to the priestly divisions page
function showPriestlyPage() {
  navigateTo('priestly');
}

// Calculate all service dates for a given course in the current year
function getServiceDatesForCourse(courseOrder) {
  if (!state.lunarMonths || state.lunarMonths.length === 0) return [];
  
  const serviceDates = [];
  
  // Iterate through all days in all months and find when this course serves
  for (let m = 0; m < state.lunarMonths.length; m++) {
    const month = state.lunarMonths[m];
    
    // For lunar sabbath, check each week (days 2-8, 9-15, 16-22, 23-29/30)
    // For Saturday sabbath, check each day
    
    if (state.sabbathMode === 'lunar') {
      // Check each week in the month
      const weekStarts = [2, 9, 16, 23];
      for (const weekStart of weekStarts) {
        const dayObj = month.days.find(d => d.lunarDay === weekStart);
        if (!dayObj) continue;
        
        const courseInfo = getPriestlyCourseForDay(dayObj, month);
        if (courseInfo && courseInfo.order === courseOrder) {
          // Find the sabbath (end of this week)
          const sabbathDay = weekStart === 2 ? 8 : weekStart === 9 ? 15 : weekStart === 16 ? 22 : 29;
          const sabbathObj = month.days.find(d => d.lunarDay === sabbathDay);
          
          serviceDates.push({
            monthNumber: month.monthNumber,
            monthName: month.name,
            startDay: weekStart,
            endDay: sabbathDay,
            startDate: dayObj.gregorianDate,
            endDate: sabbathObj ? sabbathObj.gregorianDate : dayObj.gregorianDate,
            dayObj: dayObj,
            month: month
          });
        }
      }
    } else {
      // Saturday sabbath - check every 7 days starting from first day
      for (let d = 0; d < month.days.length; d++) {
        const dayObj = month.days[d];
        const courseInfo = getPriestlyCourseForDay(dayObj, month);
        
        if (courseInfo && courseInfo.order === courseOrder) {
          // Check if this is the start of a week (Sunday)
          const weekday = Math.floor(dateToJulianDay(dayObj.gregorianDate) + 1.5) % 7;
          if (weekday === 0) { // Sunday = start of week
            // Find Saturday (end of week)
            const saturdayIdx = d + 6;
            const sabbathObj = saturdayIdx < month.days.length ? month.days[saturdayIdx] : null;
            
            serviceDates.push({
              monthNumber: month.monthNumber,
              monthName: month.name,
              startDay: dayObj.lunarDay,
              endDay: sabbathObj ? sabbathObj.lunarDay : dayObj.lunarDay,
              startDate: dayObj.gregorianDate,
              endDate: sabbathObj ? sabbathObj.gregorianDate : dayObj.gregorianDate,
              dayObj: dayObj,
              month: month
            });
          }
        }
      }
    }
  }
  
  return serviceDates;
}

// Render the priestly divisions table
function renderPriestlyTable() {
  const tbody = document.getElementById('priestly-table-body');
  if (!tbody || !PRIESTLY_DIVISIONS) return;
  
  let html = '';
  
  for (const division of PRIESTLY_DIVISIONS) {
    const serviceDates = getServiceDatesForCourse(division.order);
    
    // Format service dates
    let datesHtml = '';
    if (serviceDates.length === 0) {
      datesHtml = '<span style="color: #666;">—</span>';
    } else {
      datesHtml = serviceDates.map(sd => {
        const startStr = formatShortDate(sd.startDate);
        return `<a class="course-date-link" onclick="jumpToPriestlyServiceDate(${sd.month.monthNumber - 1}, ${sd.startDay})">${sd.monthName} ${sd.startDay}-${sd.endDay} (${startStr})</a>`;
      }).join(', ');
    }
    
    // Check if there's additional info to show (notes or famous people)
    const hasInfo = division.notes || (division.famous_people && division.famous_people.length > 0);
    const infoIndicator = hasInfo ? ` <span class="course-notes-indicator" onclick="togglePriestlyDetails(${division.order})" title="Click for more info">ⓘ</span>` : '';
    
    // Build details row content
    let detailsHtml = '';
    if (hasInfo) {
      detailsHtml = '<div class="course-details-content">';
      if (division.notes) {
        detailsHtml += `<p class="course-detail-notes">${division.notes}</p>`;
      }
      if (division.famous_people && division.famous_people.length > 0) {
        detailsHtml += '<div class="course-famous-people"><strong>Notable Members:</strong><ul>';
        for (const person of division.famous_people) {
          detailsHtml += `<li><strong>${person.name}</strong> — ${person.notes}</li>`;
        }
        detailsHtml += '</ul></div>';
      }
      detailsHtml += '</div>';
    }
    
    html += `
      <tr class="course-row" data-order="${division.order}">
        <td class="course-order">${division.order}</td>
        <td class="course-name">${division.course}${infoIndicator}</td>
        <td class="course-hebrew">${division.hebrew || ''}</td>
        <td class="course-lineage">${division.lineage || ''}</td>
        <td class="course-meaning">${division.meaning}</td>
        <td class="course-dates">${datesHtml}</td>
      </tr>
      ${hasInfo ? `<tr class="course-details-row" data-order="${division.order}" style="display: none;"><td colspan="6">${detailsHtml}</td></tr>` : ''}
    `;
  }
  
  tbody.innerHTML = html;
}

// Toggle the details row for a priestly division
function togglePriestlyDetails(order) {
  const detailsRow = document.querySelector(`.course-details-row[data-order="${order}"]`);
  if (detailsRow) {
    const isVisible = detailsRow.style.display !== 'none';
    detailsRow.style.display = isVisible ? 'none' : 'table-row';
    
    // Toggle the indicator style
    const indicator = document.querySelector(`.course-row[data-order="${order}"] .course-notes-indicator`);
    if (indicator) {
      indicator.classList.toggle('active', !isVisible);
    }
  }
}

// Jump to a specific priestly service date
function jumpToPriestlyServiceDate(monthIndex, lunarDay) {
  // Hide priestly page
  const priestlyPage = document.getElementById('priestly-page');
  priestlyPage.style.display = 'none';
  
  // Show calendar
  const calendarOutput = document.getElementById('calendar-output');
  const dayDetailPanel = document.getElementById('day-detail-panel');
  calendarOutput.style.display = '';
  dayDetailPanel.style.display = '';
  
  // Navigate to the date
  if (monthIndex >= 0 && monthIndex < state.lunarMonths.length) {
    state.currentMonthIndex = monthIndex;
    state.highlightedLunarDay = lunarDay;
    
    const month = state.lunarMonths[monthIndex];
    const dayObj = month.days.find(d => d.lunarDay === lunarDay);
    if (dayObj) {
      state.selectedTimestamp = getSunriseTimestamp(dayObj.gregorianDate);
      document.getElementById('goto-date').value = formatLocalDatetime(state.selectedTimestamp);
      renderMonth(month);
      updateMonthButtons();
      showDayDetail(dayObj, month);
      updateURL();
    }
  }
}

// Note: Priestly divisions are loaded in the main DOMContentLoaded handler
// in index.html via loadPriestlyDivisions()
