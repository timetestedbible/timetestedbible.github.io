// Torah Portions Module
// Handles Torah portion determination for both Lunar and Saturday Sabbath calendars

let torahPortions = null;
let torahSpecialReadings = null;

// Load Torah portion data
async function loadTorahPortions() {
  try {
    const [cycleResponse, specialResponse] = await Promise.all([
      fetch('/TorahReadingCycle.json'),
      fetch('/torah-special-readings.json')
    ]);
    
    if (!cycleResponse.ok) throw new Error(`Torah cycle: HTTP ${cycleResponse.status}`);
    if (!specialResponse.ok) throw new Error(`Special readings: HTTP ${specialResponse.status}`);
    
    torahPortions = await cycleResponse.json();
    torahSpecialReadings = await specialResponse.json();
    
    console.log(`Torah portions loaded: ${torahPortions.length} portions, ${torahSpecialReadings.holiday_replacements.length} replacements, ${torahSpecialReadings.maftir_additions.length} maftir additions`);
    return true;
  } catch (err) {
    console.warn('Torah portions not available:', err.message);
    return false;
  }
}

// Get the Torah portion for a specific Sabbath day
// Returns: { portion, maftirAddition, holidayReplacement, isSpecial }
function getTorahPortionForSabbath(dayObj, month, sabbathMode) {
  if (!torahPortions || !torahSpecialReadings) return null;
  if (!isSabbath(dayObj)) return null;
  
  const lunarMonth = month.monthNumber;
  const lunarDay = dayObj.lunarDay;
  
  // Check for holiday replacement first
  const holidayReplacement = getHolidayReplacement(lunarMonth, lunarDay, sabbathMode);
  if (holidayReplacement) {
    return {
      portion: null,
      maftirAddition: null,
      holidayReplacement: holidayReplacement,
      isSpecial: true
    };
  }
  
  // Get the regular Torah portion based on calendar type
  const portion = sabbathMode === 'lunar' 
    ? getLunarSabbathPortion(lunarMonth, lunarDay, state.lunarMonths)
    : getSaturdaySabbathPortion(dayObj.gregorianDate, state.lunarMonths);
  
  // Check for maftir additions
  const maftirAddition = getMaftirAddition(lunarMonth, lunarDay, sabbathMode, state.lunarMonths);
  
  return {
    portion: portion,
    maftirAddition: maftirAddition,
    holidayReplacement: null,
    isSpecial: maftirAddition !== null
  };
}

// Check if this Sabbath has a holiday replacement reading
function getHolidayReplacement(lunarMonth, lunarDay, sabbathMode) {
  if (!torahSpecialReadings) return null;
  
  for (const replacement of torahSpecialReadings.holiday_replacements) {
    // Check if this is a day range condition
    if (replacement.condition_day_range) {
      if (replacement.condition_month === lunarMonth &&
          lunarDay >= replacement.condition_day_range[0] &&
          lunarDay <= replacement.condition_day_range[1]) {
        // For lunar sabbath, only days 8, 15, 22, 29 can be Sabbaths
        // So check if our lunarDay is actually a Sabbath in this range
        if (sabbathMode === 'lunar' && ![8, 15, 22, 29].includes(lunarDay)) {
          continue; // This day isn't a lunar Sabbath, skip
        }
        return replacement;
      }
    } 
    // Check single day condition
    else if (replacement.condition_month === lunarMonth && 
             replacement.condition_day === lunarDay) {
      return replacement;
    }
  }
  
  return null;
}

// Get the Torah portion for a Lunar Sabbath
// Lunar Sabbaths are always on days 8, 15, 22, 29
// Cycle starts on day 29 of month 7 (first Sabbath after Shemini Atzeret)
function getLunarSabbathPortion(lunarMonth, lunarDay, lunarMonths) {
  if (!torahPortions || !lunarMonths) return null;
  
  // Determine the number of months in the current year
  const totalMonths = lunarMonths.length;
  
  // Torah cycle for lunar Sabbath:
  // - Day 29 of Month 7 = Bereshit (index 0) - first Sabbath after Shemini Atzeret
  // - Cycle runs through months 8-12/13, then 1-6, ending at day 8 of month 7
  // - Day 15 (Sukkot) and Day 22 (Shemini Atzeret) are holidays with special readings
  
  let sabbathIndex = 0;
  
  if (lunarMonth === 7) {
    if (lunarDay === 15 || lunarDay === 22) {
      // Sukkot day 1 or Shemini Atzeret - handled by holiday replacement
      return null;
    } else if (lunarDay === 29) {
      // First Sabbath of the new Torah cycle = Bereshit
      sabbathIndex = 0;
    } else if (lunarDay === 8) {
      // Last regular Sabbath before Sukkot - end of current year's Torah cycle
      // Count: day 29 of month 7 (1) + months 8-12/13 (4 each) + months 1-6 (24) = final position
      const monthsAfter7 = totalMonths - 7; // 5 or 6 months (8 through 12 or 13)
      sabbathIndex = 1 + (monthsAfter7 * 4) + 24; // Total Sabbaths from start to day 8 month 7
    }
  } else {
    // Count Sabbaths from month 7 day 29 to current position
    sabbathIndex = countLunarSabbathsFromCycleStart(lunarMonth, lunarDay, totalMonths);
  }
  
  // Map the sabbath index to a Torah portion
  const portionIndex = getPortionIndexForSabbath(sabbathIndex, totalMonths);
  
  if (portionIndex >= 0 && portionIndex < torahPortions.length) {
    return torahPortions[portionIndex];
  }
  
  return null;
}

// Count how many Sabbaths from month 7 day 29 to the given date
function countLunarSabbathsFromCycleStart(targetMonth, targetDay, totalMonths) {
  // Month order for counting: 7, 8, 9, 10, 11, 12, [13], 1, 2, 3, 4, 5, 6
  // (or 7, 8, 9, 10, 11, 12, 1, 2, 3, 4, 5, 6 for 12-month year)
  
  const sabbathDays = [8, 15, 22, 29];
  let count = 0;
  
  // Start from month 7, day 29 (which is index 0, Bereshit)
  // First, finish month 7 - only day 29 counts (days 8, 15, 22 are before or special)
  // count starts at 0 for day 29 of month 7
  
  // Build the month order for this year
  const monthOrder = [];
  // Months 8-12/13 first
  for (let m = 8; m <= totalMonths; m++) {
    monthOrder.push(m);
  }
  // Then months 1-6
  for (let m = 1; m <= 6; m++) {
    monthOrder.push(m);
  }
  // Then back to month 7 (partial - only day 8 before holidays)
  // Don't include month 7 in the order since we handle it specially
  
  // If target is in month 7, handle specially
  if (targetMonth === 7) {
    if (targetDay === 29) return 0;
    if (targetDay === 8) {
      // Day 8 of month 7 is near the END of the cycle (before it restarts)
      // Count all Sabbaths through the year
      let total = 1; // Start with 1 for day 29 of month 7
      for (const m of monthOrder) {
        total += 4; // 4 Sabbaths per month
      }
      // Day 8 is the first regular Sabbath of month 7 in the new year
      return total;
    }
    // Days 15 and 22 are holidays
    return -1;
  }
  
  // Count from day 29 month 7 through the months
  count = 1; // Day 29 of month 7 is Sabbath #1
  
  for (const m of monthOrder) {
    if (m === targetMonth) {
      // We've reached the target month
      // Count Sabbaths up to and including targetDay
      for (const sd of sabbathDays) {
        if (sd <= targetDay) {
          count++;
          if (sd === targetDay) {
            return count - 1; // Return 0-based index
          }
        }
      }
      return count - 1;
    } else {
      // Full month of Sabbaths
      count += 4;
    }
  }
  
  return count - 1;
}

// Get total Sabbaths in a lunar year
function getSabbathsInYear(totalMonths) {
  // Each month has 4 Sabbaths (days 8, 15, 22, 29)
  // Month 7 has 2 special days (15 Sukkot, 22 Shemini Atzeret)
  // So: (totalMonths * 4) - 2 regular Sabbaths + 2 special = totalMonths * 4
  return totalMonths * 4;
}

// Map a Sabbath index to the appropriate Torah portion(s)
// Some weeks have "doubled" portions (e.g., Vayakhel-Pekudei)
// Returns the first portion for the given week_order
function getPortionIndexForSabbath(sabbathIndex, totalMonths) {
  const totalWeeks = 47; // Number of unique week_order values in the Torah cycle
  
  if (sabbathIndex < 0) return -1;
  
  // Map the sabbath index to a week order (1-47, wrapping as needed)
  const weekOrder = (sabbathIndex % totalWeeks) + 1;
  
  // Find the first portion with this week_order
  // (Some weeks have doubled portions, we'll return the first one)
  for (let i = 0; i < torahPortions.length; i++) {
    if (torahPortions[i].week_order === weekOrder) {
      return i;
    }
  }
  
  return -1;
}

// Get all portions for a given week (handles doubled portions)
function getPortionsForWeek(weekOrder) {
  if (!torahPortions) return [];
  return torahPortions.filter(p => p.week_order === weekOrder);
}

// Get the Torah portion for a Saturday Sabbath
// Uses a reference date to calculate week number
function getSaturdaySabbathPortion(gregorianDate, lunarMonths) {
  if (!torahPortions || !lunarMonths) return null;
  
  // For Saturday Sabbath, we need to figure out which Torah portion week this is
  // The cycle starts on Simchat Torah (the Saturday after Shemini Atzeret)
  
  // First, find when Shemini Atzeret is this year (month 7, day 22)
  let sheminiAtzeretDate = null;
  for (const month of lunarMonths) {
    if (month.monthNumber === 7) {
      const day22 = month.days.find(d => d.lunarDay === 22);
      if (day22) {
        sheminiAtzeretDate = day22.gregorianDate;
        break;
      }
    }
  }
  
  if (!sheminiAtzeretDate) {
    // Fall back to using TorahReadingCycle.json dates which have pre-calculated values
    return getPortionFromPreCalculatedDates(gregorianDate);
  }
  
  // Find Simchat Torah (next Saturday after Shemini Atzeret)
  // For Saturday Sabbath mode, Simchat Torah is when the cycle restarts
  let simchatTorah = new Date(sheminiAtzeretDate);
  const dayOfWeek = getCorrectWeekday(simchatTorah);
  const daysToSaturday = (6 - dayOfWeek + 7) % 7;
  if (daysToSaturday === 0 && dayOfWeek !== 6) {
    simchatTorah.setDate(simchatTorah.getDate() + 7);
  } else {
    simchatTorah.setDate(simchatTorah.getDate() + daysToSaturday);
  }
  
  // Now count weeks from Simchat Torah to the target date
  const targetDate = new Date(gregorianDate);
  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  
  // If target is before Simchat Torah, we're in the previous year's cycle
  if (targetDate < simchatTorah) {
    // Need to find last year's Simchat Torah
    // For now, approximate by going back ~365 days
    const prevSimchatTorah = new Date(simchatTorah);
    prevSimchatTorah.setDate(prevSimchatTorah.getDate() - 364);
    // Adjust to Saturday
    const prevDayOfWeek = getCorrectWeekday(prevSimchatTorah);
    const adjustDays = (6 - prevDayOfWeek + 7) % 7;
    prevSimchatTorah.setDate(prevSimchatTorah.getDate() + adjustDays);
    
    const weeksDiff = Math.floor((targetDate - prevSimchatTorah) / msPerWeek);
    return weeksDiff >= 0 && weeksDiff < torahPortions.length ? torahPortions[weeksDiff] : null;
  }
  
  const weeksDiff = Math.floor((targetDate - simchatTorah) / msPerWeek);
  return weeksDiff >= 0 && weeksDiff < torahPortions.length ? torahPortions[weeksDiff] : null;
}

// Fallback: use the pre-calculated dates in TorahReadingCycle.json
function getPortionFromPreCalculatedDates(gregorianDate) {
  if (!torahPortions) return null;
  
  // The JSON has hebrew_month and hebrew_day for each portion
  // Try to match based on the current lunar date
  // This is a rough approximation
  
  return null; // For now, return null if we can't calculate
}

// Check for maftir additions (Shekalim, Zachor, Parah, HaChodesh)
function getMaftirAddition(lunarMonth, lunarDay, sabbathMode, lunarMonths) {
  if (!torahSpecialReadings) return null;
  
  for (const maftir of torahSpecialReadings.maftir_additions) {
    if (checkMaftirRule(maftir, lunarMonth, lunarDay, sabbathMode, lunarMonths)) {
      return maftir;
    }
  }
  
  return null;
}

// Check if a maftir addition rule applies to this Sabbath
function checkMaftirRule(maftir, lunarMonth, lunarDay, sabbathMode, lunarMonths) {
  const sabbathDays = sabbathMode === 'lunar' ? [8, 15, 22, 29] : null;
  
  switch (maftir.rule_type) {
    case 'shabbat_on_or_before':
      // Find the Sabbath on or before target month/day
      return isShabbatOnOrBefore(lunarMonth, lunarDay, maftir.target_month, maftir.target_day, 
                                  maftir.search_months, sabbathMode, lunarMonths);
    
    case 'shabbat_before':
      // Sabbath immediately before target date (e.g., Purim)
      // For Zachor: Shabbat before Purim (month 6 or 12, day 14)
      const targetMonth = lunarMonths.length === 13 ? maftir.target_month : 
                          (maftir.alt_target_month || maftir.target_month);
      return isShabbatImmediatelyBefore(lunarMonth, lunarDay, targetMonth, maftir.target_day, sabbathMode);
    
    case 'shabbat_after':
      // Sabbath immediately after target date (e.g., Purim for Parah)
      const targetMonth2 = lunarMonths.length === 13 ? maftir.target_month : 
                           (maftir.alt_target_month || maftir.target_month);
      return isShabbatImmediatelyAfter(lunarMonth, lunarDay, targetMonth2, maftir.target_day, sabbathMode);
    
    default:
      return false;
  }
}

// Check if this is the Sabbath on or before a target date
function isShabbatOnOrBefore(lunarMonth, lunarDay, targetMonth, targetDay, searchMonths, sabbathMode, lunarMonths) {
  // For lunar Sabbath, this is deterministic
  if (sabbathMode === 'lunar') {
    // Check if current date is a valid search month and day is <= target
    if (searchMonths && searchMonths.includes(lunarMonth)) {
      // Find the Sabbath on or before target day in this month
      const sabbathDays = [8, 15, 22, 29];
      const validSabbaths = sabbathDays.filter(d => d <= targetDay);
      if (validSabbaths.length > 0) {
        const lastValidSabbath = validSabbaths[validSabbaths.length - 1];
        return lunarDay === lastValidSabbath;
      }
    }
    // Also check if we're in the month before and this is day 29
    if (lunarMonth === targetMonth - 1 || (targetMonth === 1 && lunarMonth === lunarMonths.length)) {
      return lunarDay === 29;
    }
  }
  
  return false;
}

// Check if this is the Sabbath immediately before a target date
function isShabbatImmediatelyBefore(lunarMonth, lunarDay, targetMonth, targetDay, sabbathMode) {
  if (sabbathMode === 'lunar') {
    const sabbathDays = [8, 15, 22, 29];
    
    if (lunarMonth === targetMonth) {
      // Find the Sabbath immediately before targetDay
      const validSabbaths = sabbathDays.filter(d => d < targetDay);
      if (validSabbaths.length > 0) {
        return lunarDay === validSabbaths[validSabbaths.length - 1];
      }
    }
    // If no Sabbath before target in same month, check previous month day 29
    if (lunarMonth === targetMonth - 1 || (targetMonth === 1 && lunarMonth === 13)) {
      if (lunarDay === 29) {
        // Verify target isn't <= first Sabbath of its month
        return targetDay > 8;
      }
    }
  }
  
  return false;
}

// Check if this is the Sabbath immediately after a target date
function isShabbatImmediatelyAfter(lunarMonth, lunarDay, targetMonth, targetDay, sabbathMode) {
  if (sabbathMode === 'lunar') {
    const sabbathDays = [8, 15, 22, 29];
    
    if (lunarMonth === targetMonth) {
      // Find the first Sabbath after targetDay
      const validSabbaths = sabbathDays.filter(d => d > targetDay);
      if (validSabbaths.length > 0) {
        return lunarDay === validSabbaths[0];
      }
    }
    // If no Sabbath after target in same month, check next month day 8
    if (lunarMonth === targetMonth + 1 || (targetMonth === 13 && lunarMonth === 1)) {
      if (lunarDay === 8) {
        // Verify target is after last Sabbath of its month
        return targetDay > 22;
      }
    }
  }
  
  return false;
}

// Make a citation clickable - opens Bible reader when clicked
function makeClickableCitation(citation, title = '') {
  if (typeof makeCitationClickable === 'function') {
    return makeCitationClickable(citation, title);
  }
  // Fallback if Bible reader not loaded
  return citation;
}

// Format Torah portion info for display
function formatTorahPortionDisplay(portionInfo) {
  if (!portionInfo) return '';
  
  let html = '<div class="torah-portion-section">';
  html += `<div class="torah-portion-header">
    <span>📖 Torah Portion for This Sabbath</span>
    <button class="torah-info-btn" onclick="openTorahPortionInfo()" title="How is this portion determined?">ⓘ</button>
  </div>`;
  html += '<div class="torah-portion-content">';
  
  if (portionInfo.holidayReplacement) {
    // Holiday replacement reading
    const hr = portionInfo.holidayReplacement;
    const citationLink = makeClickableCitation(hr.citation, hr.name);
    html += `
      <div class="torah-portion-item torah-holiday-replacement">
        <div class="torah-portion-name">🎺 ${hr.name}</div>
        <div class="torah-portion-citation">${citationLink}</div>
        <div class="torah-portion-summary">${hr.summary}</div>
        <div class="torah-portion-note">Special holiday reading (replaces regular portion)</div>
      </div>
    `;
  } else if (portionInfo.portion) {
    // Check for doubled portions (multiple portions with same week_order)
    const weekOrder = portionInfo.portion.week_order;
    const allPortions = getPortionsForWeek(weekOrder);
    
    if (allPortions.length > 1) {
      // Doubled portion (e.g., Vayakhel-Pekudei, Tazria-Metzora)
      const names = allPortions.map(p => p.parashah).join('-');
      const meanings = allPortions.map(p => p.meaning).join(' / ');
      const citationLinks = allPortions.map(p => makeClickableCitation(p.citation, p.parashah)).join('; ');
      
      html += `
        <div class="torah-portion-item torah-double-portion">
          <div class="torah-portion-name">
            <span class="torah-portion-hebrew">${names}</span>
            <span class="torah-portion-meaning">(${meanings})</span>
          </div>
          <div class="torah-portion-citation">${citationLinks}</div>
      `;
      
      // Show summaries for each portion
      for (const p of allPortions) {
        html += `
          <div class="torah-portion-summary-item">
            <strong>${p.parashah}:</strong> ${p.summary}
          </div>
        `;
      }
      
      html += '</div>';
    } else {
      // Single portion
      const p = portionInfo.portion;
      const citationLink = makeClickableCitation(p.citation, p.parashah);
      html += `
        <div class="torah-portion-item">
          <div class="torah-portion-name">
            <span class="torah-portion-hebrew">${p.parashah}</span>
            <span class="torah-portion-meaning">(${p.meaning})</span>
          </div>
          <div class="torah-portion-citation">${citationLink}</div>
          <div class="torah-portion-summary">${p.summary}</div>
        </div>
      `;
    }
    
    // Add maftir addition if present
    if (portionInfo.maftirAddition) {
      const ma = portionInfo.maftirAddition;
      const maftirCitationLink = makeClickableCitation(ma.citation, ma.name);
      html += `
        <div class="torah-portion-item torah-maftir-addition">
          <div class="torah-portion-name">📜 ${ma.name} <span class="maftir-label">(Special Maftir)</span></div>
          <div class="torah-portion-citation">${maftirCitationLink}</div>
          <div class="torah-portion-summary">${ma.summary}</div>
        </div>
      `;
    }
  }
  
  html += '</div></div>';
  return html;
}

// Open the Torah portion info modal
function openTorahPortionInfo() {
  const modal = document.getElementById('torah-info-modal');
  if (modal) {
    modal.classList.add('open');
    document.body.classList.add('torah-info-open');
  }
}

// Close the Torah portion info modal
function closeTorahPortionInfo() {
  const modal = document.getElementById('torah-info-modal');
  if (modal) {
    modal.classList.remove('open');
    document.body.classList.remove('torah-info-open');
  }
}

// Toggle the summary row for a Torah portion in the full list
function toggleTorahSummary(portionNum) {
  const summaryRow = document.getElementById(`torah-summary-${portionNum}`);
  const portionRow = document.querySelector(`.torah-portion-row[data-portion="${portionNum}"]`);
  const btn = portionRow ? portionRow.querySelector('.torah-expand-btn') : null;
  
  if (summaryRow) {
    const isVisible = summaryRow.classList.contains('visible');
    summaryRow.classList.toggle('visible');
    
    if (portionRow) {
      portionRow.classList.toggle('expanded');
    }
    if (btn) {
      btn.classList.toggle('expanded');
      btn.textContent = isVisible ? '▼' : '▲';
    }
  }
}
