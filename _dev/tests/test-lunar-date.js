#!/usr/bin/env node
/**
 * Unit test for lunar date calculation
 * Tests: December 12, 4 BC (JD 1720310) should be Lunar 9/23 on Time-Tested profile
 * Currently getting: Lunar 9/9 (14 days off)
 */

const Astronomy = require('astronomy-engine');
const { LunarCalendarEngine } = require('../../lunar-calendar-engine.js');

// Time-Tested profile settings
const PROFILE = {
  moonPhase: 'full',        // Month starts at full moon
  dayStartTime: 'morning',  // Day starts at morning
  dayStartAngle: 12,        // Noon angle
  yearStartRule: 'equinox', // Year starts at spring equinox
  crescentThreshold: 18
};

const LOCATION = { lat: 31.7683, lon: 35.2137 }; // Jerusalem

// Create astronomy engine abstraction (matching browser implementation)
const astroEngine = {
  name: 'astronomy-engine',
  
  searchMoonPhase(phase, startDate, limitDays) {
    return Astronomy.SearchMoonPhase(phase, startDate, limitDays);
  },
  
  getSeasons(year) {
    // Fix for years 0-99 (JS Date bug treats them as 1900-1999)
    if (year >= 0 && year < 100) {
      const startDate = new Date(Date.UTC(2000, 0, 1));
      startDate.setUTCFullYear(year);
      const equinox = Astronomy.SearchSunLongitude(0, startDate, 120);
      if (equinox) {
        return { mar_equinox: equinox };
      }
    }
    return Astronomy.Seasons(year);
  },
  
  searchRiseSet(body, observer, direction, startDate, limitDays) {
    const astroBody = body === 'sun' ? Astronomy.Body.Sun : Astronomy.Body.Moon;
    return Astronomy.SearchRiseSet(astroBody, observer, direction, startDate, limitDays);
  },
  
  searchAltitude(body, observer, direction, startDate, limitDays, altitude) {
    const astroBody = body === 'sun' ? Astronomy.Body.Sun : Astronomy.Body.Moon;
    return Astronomy.SearchAltitude(astroBody, observer, direction, startDate, limitDays, altitude);
  },
  
  createObserver(lat, lon, elevation = 0) {
    return new Astronomy.Observer(lat, lon, elevation);
  }
};

// Julian Day conversions
function gregorianToJulianDay(year, month, day) {
  let y = year;
  let m = month;
  
  if (m <= 2) {
    y = y - 1;
    m = m + 12;
  }
  
  const a = Math.floor(y / 100);
  const b = 2 - a + Math.floor(a / 4);
  
  return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + day + b - 1524.5;
}

function julianDayToGregorian(jd) {
  const z = Math.floor(jd + 0.5);
  const f = (jd + 0.5) - z;
  
  let a;
  if (z < 2299161) {
    a = z;
  } else {
    const alpha = Math.floor((z - 1867216.25) / 36524.25);
    a = z + 1 + alpha - Math.floor(alpha / 4);
  }
  
  const b = a + 1524;
  const c = Math.floor((b - 122.1) / 365.25);
  const d = Math.floor(365.25 * c);
  const e = Math.floor((b - d) / 30.6001);
  
  const day = b - d - Math.floor(30.6001 * e) + f;
  const month = e < 14 ? e - 1 : e - 13;
  const year = month > 2 ? c - 4716 : c - 4715;
  
  return { year: Math.floor(year), month, day: Math.floor(day) };
}

console.log('\n=== LUNAR DATE CALCULATION TEST ===\n');
console.log('Profile:', JSON.stringify(PROFILE));
console.log('Location:', JSON.stringify(LOCATION));

// Create and configure LunarCalendarEngine
const engine = new LunarCalendarEngine(astroEngine);
engine.configure(PROFILE);

console.log('\n--- Checking Spring Equinox and Full Moons ---');

// Get the spring equinox for -3 (4 BC)
const seasons = astroEngine.getSeasons(-3);
console.log('Spring Equinox -3:', seasons.mar_equinox.date.toISOString());

// Find full moons around that time
let searchDate = new Date(seasons.mar_equinox.date);
searchDate.setDate(searchDate.getDate() - 15); // Start 15 days before equinox

console.log('\nFull moons around equinox:');
for (let i = 0; i < 5; i++) {
  const fullMoon = Astronomy.SearchMoonPhase(180, searchDate, 40);
  if (fullMoon) {
    const jd = 2451545 + fullMoon.tt; // J2000 epoch to JD
    console.log(`  Full Moon ${i+1}:`, fullMoon.date.toISOString(), 'JD:', jd.toFixed(2));
    searchDate = new Date(fullMoon.date);
    searchDate.setDate(searchDate.getDate() + 1);
  }
}

console.log('\n--- Generating Year -3 (4 BC) Calendar ---');

try {
  const calendar = engine.generateYear(-3, LOCATION);
  
  if (!calendar || !calendar.months) {
    console.error('Failed to generate calendar!');
    process.exit(1);
  }
  
  console.log('Calendar generated successfully');
  console.log('Number of months:', calendar.months.length);
  
  // Show first month info
  const nisan = calendar.months[0];
  if (nisan && nisan.days && nisan.days.length > 0) {
    const nisan1 = nisan.days.find(d => d.lunarDay === 1);
    if (nisan1) {
      const nisan1Greg = julianDayToGregorian(nisan1.jd);
      console.log('\nNisan 1 (Month 1, Day 1):');
      console.log('  JD:', nisan1.jd?.toFixed(2));
      console.log('  Gregorian:', nisan1Greg.year + '/' + nisan1Greg.month + '/' + nisan1Greg.day);
    }
  }
  
  // Target: December 12, 4 BC = JD 1720310
  const testJD = 1720310;
  const testGreg = julianDayToGregorian(testJD);
  console.log('\n--- Finding lunar date for JD', testJD, '---');
  console.log('Gregorian:', testGreg.year + '/' + testGreg.month + '/' + testGreg.day);
  
  // Search for which month contains this JD
  let foundMonth = null;
  let foundDay = null;
  
  for (let m = 0; m < calendar.months.length; m++) {
    const month = calendar.months[m];
    if (!month.days) continue;
    
    for (const day of month.days) {
      // Check if this day contains our target JD
      if (day.jd && Math.floor(day.jd) === Math.floor(testJD)) {
        foundMonth = m + 1;
        foundDay = day.lunarDay;
        break;
      }
    }
    if (foundMonth) break;
  }
  
  if (foundMonth) {
    console.log('\nFound in calendar:');
    console.log('  Lunar Month:', foundMonth);
    console.log('  Lunar Day:', foundDay);
  } else {
    console.log('\nJD', testJD, 'not found directly in calendar');
    
    // Find by interpolation - which month range contains this JD?
    for (let m = 0; m < calendar.months.length; m++) {
      const month = calendar.months[m];
      if (!month.days || month.days.length === 0) continue;
      
      const monthStartJD = month.days[0]?.jd;
      const monthEndJD = month.days[month.days.length - 1]?.jd;
      
      console.log(`Month ${m + 1}: JD ${monthStartJD?.toFixed(0)} - ${monthEndJD?.toFixed(0)}`);
      
      if (testJD >= monthStartJD && testJD <= monthEndJD) {
        foundMonth = m + 1;
        foundDay = Math.floor(testJD - monthStartJD) + 1;
        console.log(`  ** Target JD ${testJD} is in this month, day ${foundDay} **`);
      }
    }
  }
  
  console.log('\n=== COMPARISON ===');
  console.log('Expected:  9/23');
  console.log('App shows: 9/9');
  console.log('Calculated:', foundMonth + '/' + foundDay);
  
  if (foundMonth === 9 && foundDay === 23) {
    console.log('\n✓ PASS - Calculation matches expected!');
  } else {
    console.log('\n✗ FAIL - Discrepancy detected');
    console.log('Difference:', foundDay ? (23 - foundDay) + ' days' : 'unknown');
  }
  
  // What Nisan 1 would give us 9/23?
  console.log('\n--- Reverse calculation ---');
  // If Dec 12 is month 9 day 23, count backwards
  // Day 23 of month 9 = 8 full months + 22 days = 8*29.53 + 22 = 258.24 days from Nisan 1
  const daysFromNisan1 = 8 * 29.53 + 22;
  const requiredNisan1JD = testJD - daysFromNisan1;
  const requiredNisan1Greg = julianDayToGregorian(requiredNisan1JD);
  console.log('For 9/23, Nisan 1 would need to be:');
  console.log('  JD:', requiredNisan1JD.toFixed(2));
  console.log('  Gregorian:', requiredNisan1Greg.year + '/' + requiredNisan1Greg.month + '/' + requiredNisan1Greg.day);
  
  // Find the nearest full moon to that date
  const nearestFM = Astronomy.SearchMoonPhase(180, new Date(Date.UTC(requiredNisan1Greg.year, requiredNisan1Greg.month - 1, requiredNisan1Greg.day - 15)), 40);
  if (nearestFM) {
    console.log('  Nearest full moon:', nearestFM.date.toISOString());
  }
  
  // What if we used March 11 full moon (before equinox)?
  console.log('\n--- If March 11 full moon was Nisan 1 ---');
  const march11JD = 1720033.64;
  const daysFromMarch11 = testJD - march11JD;
  const monthsFromMarch11 = daysFromMarch11 / 29.53;
  const month11 = Math.floor(monthsFromMarch11) + 1;
  const day11 = Math.floor((monthsFromMarch11 - Math.floor(monthsFromMarch11)) * 29.53) + 1;
  console.log('Days from March 11:', daysFromMarch11.toFixed(1));
  console.log('Lunar date would be:', month11 + '/' + day11);
  
  // Also check if the Gregorian date is actually December 12
  console.log('\n--- Verify JD conversion ---');
  // December 12, 4 BC in astronomical = December 12, -3
  const dec12JD = gregorianToJulianDay(-3, 12, 12);
  console.log('December 12, -3 calculated JD:', dec12JD.toFixed(2));
  console.log('Test JD:', testJD);
  console.log('Difference:', (testJD - dec12JD).toFixed(2), 'days');

} catch (err) {
  console.error('Error:', err.message);
  console.error(err.stack);
}
