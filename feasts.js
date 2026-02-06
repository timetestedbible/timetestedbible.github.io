// Feasts Module - Biblical Appointed Times
// Defines the annual feast calendar based on lunar months

// Trumpet icon for Renewed Moon
const SHOFAR_ICON = '🎺';

// Order matters: single-day feasts should come AFTER multi-day feasts so they take priority
// Order matters for overlapping feasts: specific single-day feasts listed AFTER multi-day feasts take priority
const FEASTS = [
  // Renewed Moon Day - first day of every month (first light after full moon when waning moon is 12°+ above western horizon)
  { name: 'Renewed Moon', shortName: 'New Moon', icon: SHOFAR_ICON, month: 1, day: 1, description: 'First light after full moon — waning moon 12°+ above western horizon', chapter: '/chapters/18-appointed-times/#new-moon' },
  { name: 'Renewed Moon', shortName: 'New Moon', icon: SHOFAR_ICON, month: 2, day: 1, description: 'First light after full moon — waning moon 12°+ above western horizon', chapter: '/chapters/18-appointed-times/#new-moon' },
  { name: 'Renewed Moon', shortName: 'New Moon', icon: SHOFAR_ICON, month: 3, day: 1, description: 'First light after full moon — waning moon 12°+ above western horizon', chapter: '/chapters/18-appointed-times/#new-moon' },
  { name: 'Renewed Moon', shortName: 'New Moon', icon: SHOFAR_ICON, month: 4, day: 1, description: 'First light after full moon — waning moon 12°+ above western horizon', chapter: '/chapters/18-appointed-times/#new-moon' },
  { name: 'Renewed Moon', shortName: 'New Moon', icon: SHOFAR_ICON, month: 5, day: 1, description: 'First light after full moon — waning moon 12°+ above western horizon', chapter: '/chapters/18-appointed-times/#new-moon' },
  { name: 'Renewed Moon', shortName: 'New Moon', icon: SHOFAR_ICON, month: 6, day: 1, description: 'First light after full moon — waning moon 12°+ above western horizon', chapter: '/chapters/18-appointed-times/#new-moon' },
  { name: 'Renewed Moon', shortName: 'New Moon', icon: SHOFAR_ICON, month: 7, day: 1, description: 'First light after full moon — waning moon 12°+ above western horizon', chapter: '/chapters/18-appointed-times/#new-moon' },
  { name: 'Renewed Moon', shortName: 'New Moon', icon: SHOFAR_ICON, month: 8, day: 1, description: 'First light after full moon — waning moon 12°+ above western horizon', chapter: '/chapters/18-appointed-times/#new-moon' },
  { name: 'Renewed Moon', shortName: 'New Moon', icon: SHOFAR_ICON, month: 9, day: 1, description: 'First light after full moon — waning moon 12°+ above western horizon', chapter: '/chapters/18-appointed-times/#new-moon' },
  { name: 'Renewed Moon', shortName: 'New Moon', icon: SHOFAR_ICON, month: 10, day: 1, description: 'First light after full moon — waning moon 12°+ above western horizon', chapter: '/chapters/18-appointed-times/#new-moon' },
  { name: 'Renewed Moon', shortName: 'New Moon', icon: SHOFAR_ICON, month: 11, day: 1, description: 'First light after full moon — waning moon 12°+ above western horizon', chapter: '/chapters/18-appointed-times/#new-moon' },
  { name: 'Renewed Moon', shortName: 'New Moon', icon: SHOFAR_ICON, month: 12, day: 1, description: 'First light after full moon — waning moon 12°+ above western horizon', chapter: '/chapters/18-appointed-times/#new-moon' },
  { name: 'Renewed Moon', shortName: 'New Moon', icon: SHOFAR_ICON, month: 13, day: 1, description: 'First light after full moon — waning moon 12°+ above western horizon', chapter: '/chapters/18-appointed-times/#new-moon' },
  // Specific feasts
  { name: 'Last Supper', shortName: 'Last Supper', icon: '🍞🍷', month: 1, day: 13, description: 'The Last Supper - bread and wine', chapter: '/chapters/18-appointed-times/#passover' },
  { name: 'Passover', shortName: 'Passover', icon: '🐑†', month: 1, day: 14, description: 'Lamb slain at twilight', chapter: '/chapters/18-appointed-times/#passover' },
  { name: 'Unleavened Bread', shortName: 'Unleavened', icon: '🫓', month: 1, day: 15, endDay: 21, description: 'High Sabbath, no leaven for 7 days', chapter: '/chapters/18-appointed-times/#unleavened-bread' },
  { name: 'First Fruits', shortName: 'First Fruits', icon: '🌾', month: 1, day: 16, description: 'Wave sheaf offering (also Unleavened 2)', chapter: '/chapters/18-appointed-times/#first-fruits-of-barley' },
  { name: 'Atzeret of Unleavened', shortName: 'Atzeret', icon: '🕍', month: 1, day: 21, description: 'Solemn assembly - 7th day of Unleavened Bread', chapter: '/chapters/18-appointed-times/#unleavened-bread' },
  { name: 'Shavuot', shortName: 'Shavuot', icon: '🌾', month: 3, day: 16, description: '7 complete weeks after First Fruits', chapter: '/chapters/18-appointed-times/#shavuot---first-fruits-of-wheat' },
  { name: 'First Fruits of Wine', shortName: 'New Wine', icon: '🍷', month: 5, day: 9, description: 'First Fruits of Wine / New Wine Feast - 9th of Av', chapter: '/chapters/18-appointed-times/#first-fruits-of-wine-pentecost' },
  { name: 'Trumpets', shortName: 'Trumpets', icon: '🎺', month: 7, day: 1, description: 'Day of shouting/blowing. Falls on the day after 7 complete sabbaths from First Fruits of New Wine. Many understand this to be the First Fruits of New Oil, as we are commanded to offer first fruits of barley, wheat, wine, and oil during the "feast of weeks."', chapter: '/chapters/18-appointed-times/#trumpets---first-fruits-of-oil' },
  { name: 'Atonement', shortName: 'Atonement', icon: '🩸', month: 7, day: 10, description: 'Yom Kippur - day of fasting', chapter: '/chapters/18-appointed-times/#day-of-atonement' },
  { name: 'Tabernacles', shortName: 'Tabernacles', icon: '⛺', month: 7, day: 15, endDay: 21, description: 'Feast of Booths', chapter: '/chapters/18-appointed-times/#tabernacles' },
  { name: 'Atzeret', shortName: 'Atzeret', icon: '🕍', month: 7, day: 22, description: 'Shemini Atzeret - Last Great Day', chapter: '/chapters/18-appointed-times/#atzeret---last-great-day' },
  { name: 'Hanukkah', shortName: 'Hanukkah', icon: '🕎', month: 9, day: 25, endDay: 30, description: 'Festival of Dedication (8 days)', chapter: '/chapters/18-appointed-times/#hanukkah', continuesNextMonth: true },
  { name: 'Hanukkah', shortName: 'Hanukkah', icon: '🕎', month: 10, day: 1, endDay: 2, description: 'Festival of Dedication (continued)', chapter: '/chapters/18-appointed-times/#hanukkah', startDayNum: 7 },
  { name: 'Atzeret of Hanukkah', shortName: 'Atzeret', icon: '🕍', month: 10, day: 2, description: 'Atzeret - 8th day of Hanukkah', chapter: '/chapters/18-appointed-times/#hanukkah' },
  { name: 'Purim', shortName: 'Purim', icon: '📜', month: 12, day: 14, endDay: 15, description: 'Feast of Lots - deliverance from Haman', chapter: '/chapters/18-appointed-times/#purim' },
  { name: 'Feast of Trees', shortName: 'Trees', icon: '🌳', month: 11, day: 1, description: 'New Year for Trees - celebrating the seven species of Israel. Trees symbolize the First Fruits of Nations.', symbol: '/symbols/TREE', nonBiblical: true }
];

/**
 * Get all feasts for a specific lunar month and day
 * @param {number} monthNumber - Lunar month (1-13)
 * @param {number} lunarDay - Day of the month (1-30)
 * @returns {Array} Array of feast objects with { feast, dayNum } 
 */
function getFeastsForDay(monthNumber, lunarDay) {
  const feasts = [];
  
  for (const f of FEASTS) {
    if (f.month === monthNumber) {
      if (f.endDay) {
        // Multi-day feast
        if (lunarDay >= f.day && lunarDay <= f.endDay) {
          const dayNum = f.startDayNum ? (f.startDayNum + lunarDay - f.day) : (lunarDay - f.day + 1);
          feasts.push({ feast: f, dayNum: dayNum });
        }
      } else if (f.day === lunarDay) {
        // Single-day feast
        feasts.push({ feast: f, dayNum: null });
      }
    }
  }
  
  return feasts;
}

/**
 * Get unique feast icons for a day
 * @param {Array} feasts - Array of feast objects from getFeastsForDay
 * @returns {string} Concatenated unique icons
 */
function getFeastIcons(feasts) {
  if (!feasts || feasts.length === 0) return '';
  const icons = [...new Set(feasts.map(f => f.feast.icon))];
  return icons.join('');
}

/**
 * Get all feasts in the FEASTS array (for feast viewer)
 * @returns {Array} The FEASTS array
 */
function getAllFeasts() {
  return FEASTS;
}

// Export for module usage
if (typeof window !== 'undefined') {
  window.FEASTS = FEASTS;
  window.getFeastsForDay = getFeastsForDay;
  window.getFeastIcons = getFeastIcons;
  window.getAllFeasts = getAllFeasts;
}
