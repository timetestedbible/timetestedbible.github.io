// Bible Events Loader
// Loads and indexes biblical events by lunar month/day for day detail display

let bibleEventsByMonthDay = null;
const eventContentCache = {}; // Cache for loaded markdown content files

// Parse markdown content file into event data structure
function parseEventMarkdown(markdown) {
  const result = {
    description: '',
    verse: '',
    quote: '',
    detailsTitle: '',
    details: []
  };
  
  const lines = markdown.split('\n');
  let section = null;
  let currentDetail = null;
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    // Skip empty lines and front matter
    if (!trimmed || trimmed === '---') continue;
    
    // Detect sections
    if (trimmed.startsWith('## Description')) {
      section = 'description';
      continue;
    } else if (trimmed.startsWith('## Verse')) {
      section = 'verse';
      continue;
    } else if (trimmed.startsWith('## Quote')) {
      section = 'quote';
      continue;
    } else if (trimmed.startsWith('## Details')) {
      section = 'details';
      result.detailsTitle = trimmed.substring(11).trim() || 'Details';
      continue;
    } else if (trimmed.startsWith('## ')) {
      section = null;
      continue;
    }
    
    // Process content based on section
    switch (section) {
      case 'description':
        result.description += (result.description ? ' ' : '') + trimmed;
        break;
      case 'verse':
        result.verse += (result.verse ? '; ' : '') + trimmed;
        break;
      case 'quote':
        result.quote += (result.quote ? ' ' : '') + trimmed;
        break;
      case 'details':
        if (trimmed.startsWith('- **')) {
          // New detail item
          const match = trimmed.match(/^\- \*\*(.+?)\*\*:?\s*(.*)$/);
          if (match) {
            currentDetail = { title: match[1], content: match[2] || '' };
            result.details.push(currentDetail);
          }
        } else if (trimmed.startsWith('- ')) {
          // Sub-item
          if (currentDetail) {
            currentDetail.content += (currentDetail.content ? ' ' : '') + trimmed.substring(2);
          }
        } else if (currentDetail) {
          // Continuation
          currentDetail.content += (currentDetail.content ? ' ' : '') + trimmed;
        }
        break;
    }
  }
  
  return result;
}

// Load a content file and cache it
async function loadEventContent(contentFile) {
  if (eventContentCache[contentFile]) return eventContentCache[contentFile];
  
  try {
    // contentFile already contains the full path like "/events/file.txt"
    const response = await fetch(contentFile);
    if (response.ok) {
      const markdown = await response.text();
      eventContentCache[contentFile] = parseEventMarkdown(markdown);
      return eventContentCache[contentFile];
    }
  } catch (err) {
    console.warn(`Failed to load event content: ${contentFile}`, err);
  }
  return null;
}

// Load bible events from JSON files
async function loadBibleEvents() {
  bibleEventsByMonthDay = {};
  let totalEvents = 0;
  const contentFilesToLoad = new Set();
  
  // Load from bible-events-by-month-day.json (legacy format)
  try {
    const response = await fetch('/bible-events-by-month-day.json?v=3');
    if (response.ok) {
      const events = await response.json();
      for (const event of events) {
        // Track content files that need loading
        if (event.contentFile) {
          contentFilesToLoad.add(event.contentFile);
        }
        const key = `${event.month}-${event.day}`;
        if (!bibleEventsByMonthDay[key]) {
          bibleEventsByMonthDay[key] = [];
        }
        bibleEventsByMonthDay[key].push(event);
        totalEvents++;
      }
    }
  } catch (err) {
    console.warn('Bible events file not available:', err.message);
  }
  
  // Load all content files in parallel
  if (contentFilesToLoad.size > 0) {
    await Promise.all([...contentFilesToLoad].map(file => loadEventContent(file)));
    
    // Merge loaded content into events
    for (const key of Object.keys(bibleEventsByMonthDay)) {
      for (const event of bibleEventsByMonthDay[key]) {
        if (event.contentFile && eventContentCache[event.contentFile]) {
          const content = eventContentCache[event.contentFile];
          // Merge content, but don't overwrite existing values
          if (!event.description && content.description) event.description = content.description;
          if (!event.verse && content.verse) event.verse = content.verse;
          if (!event.quote && content.quote) event.quote = content.quote;
          if (!event.detailsTitle && content.detailsTitle) event.detailsTitle = content.detailsTitle;
          if ((!event.details || event.details.length === 0) && content.details.length > 0) {
            event.details = content.details;
          }
        }
      }
    }
  }
  
  // Load from historical-events.json (new format)
  try {
    const response = await fetch('/historical-events.json?v=3');
    if (response.ok) {
      const data = await response.json();
      const events = data.events || [];
      
      for (const event of events) {
        // Only include events that have lunar month AND day
        if (event.dates?.lunar?.month && event.dates?.lunar?.day) {
          const key = `${event.dates.lunar.month}-${event.dates.lunar.day}`;
          if (!bibleEventsByMonthDay[key]) {
            bibleEventsByMonthDay[key] = [];
          }
          
          // Convert to legacy format for display compatibility
          // Show as anniversary on all years, noting original year if known
          const originalYear = event.dates?.gregorian?.year;
          let titleWithYear = event.title;
          if (originalYear !== undefined && originalYear !== null) {
            const yearStr = originalYear < 0 ? `${Math.abs(originalYear)} BC` : 
                           originalYear === 0 ? '1 BC' : `${originalYear} AD`;
            titleWithYear = `${event.title} (${yearStr})`;
          }
          
          const legacyEvent = {
            month: event.dates.lunar.month,
            day: event.dates.lunar.day,
            title: titleWithYear,
            description: event.description,
            verse: event.sources?.filter(s => s.type === 'scripture').map(s => s.ref).join('; ') || '',
            bookChapter: event.article,
            icon: event.icon,  // Custom icon for day cell display
            // No condition - show as anniversary every year
            condition: null,
            // Store original year for potential highlighting when viewing that year
            originalYear: originalYear,
            // Pass through original event for rich data access
            _historicalEvent: event
          };
          
          // Check if this event is already in the list (avoid duplicates)
          const newTitleLower = event.title.toLowerCase();
          const duplicateIndex = bibleEventsByMonthDay[key].findIndex(e => {
            // Exact match
            if (e.title === legacyEvent.title) return true;
            // Same historical event ID
            if (e._historicalEvent && e._historicalEvent.id === event.id) return true;
            // Fuzzy match: one title contains the other
            const existingTitleLower = e.title.toLowerCase().replace(/\s*\(\d+\s*(bc|ad)\)/gi, ''); // Remove year suffix
            if (existingTitleLower.includes(newTitleLower) || newTitleLower.includes(existingTitleLower)) return true;
            // Check for key word overlap
            const newWords = newTitleLower.split(/\s+/).filter(w => w.length > 3);
            const existingWords = existingTitleLower.split(/\s+/).filter(w => w.length > 3);
            const overlap = newWords.filter(w => existingWords.includes(w)).length;
            if (overlap >= 2 && overlap >= Math.min(newWords.length, existingWords.length) * 0.5) return true;
            return false;
          });
          
          if (duplicateIndex >= 0) {
            // Replace old event with new (more detailed) version
            bibleEventsByMonthDay[key][duplicateIndex] = legacyEvent;
          } else {
            bibleEventsByMonthDay[key].push(legacyEvent);
            totalEvents++;
          }
        }
      }
    }
  } catch (err) {
    console.warn('Historical events file not available:', err.message);
  }
  
  console.log(`Bible events loaded: ${totalEvents} events`);
  return totalEvents > 0;
}

// Get bible events for a specific lunar month and day
// Optionally filters conditional events based on Sabbath/Jubilee year status
function getBibleEvents(month, day, gregorianYear = null) {
  if (!bibleEventsByMonthDay) return [];
  const key = `${month}-${day}`;
  const events = bibleEventsByMonthDay[key] || [];
  
  // If no year provided or getJubileeInfo not available, return all non-conditional events
  if (gregorianYear === null || typeof getJubileeInfo !== 'function') {
    return events.filter(e => !e.condition);
  }
  
  // Get jubilee info for the year
  const jubileeInfo = getJubileeInfo(gregorianYear);
  
  // Filter events based on conditions
  return events.filter(event => {
    // No condition means always show
    if (!event.condition) return true;
    
    // Check specific conditions
    switch (event.condition) {
      case 'sabbath_year':
        return jubileeInfo.isSabbathYear;
      case 'jubilee_year':
        return jubileeInfo.isJubileeYear;
      case 'sabbath_or_jubilee':
        return jubileeInfo.isSabbathYear || jubileeInfo.isJubileeYear;
      default:
        // Check for year-specific conditions (e.g., "year_29" for 29 AD)
        if (event.condition.startsWith('year_')) {
          return true;
        }
        // Check for year range conditions (e.g., "year_range_28_33")
        if (event.condition.startsWith('year_range_')) {
          const parts = event.condition.substring(11).split('_');
          const startYear = parseInt(parts[0]);
          const endYear = parseInt(parts[1]);
          return gregorianYear >= startYear && gregorianYear <= endYear;
        }
        // Moon phase conditions - only show on matching calendar
        if (event.condition.startsWith('moonPhase_')) {
          const requiredPhase = event.condition.substring(10);
          // Get the actual moonPhase from the profile configuration
          if (typeof AppStore !== 'undefined' && typeof window.PROFILES !== 'undefined') {
            const profileId = AppStore.getState().context?.profileId;
            const profile = window.PROFILES[profileId];
            const moonPhase = profile?.moonPhase || 'full';
            return moonPhase === requiredPhase;
          }
          return false;
        }
        return false; // Unknown condition, don't show
    }
  });
}

// Export for browser
if (typeof window !== 'undefined') {
  window.loadBibleEvents = loadBibleEvents;
  window.getBibleEvents = getBibleEvents;
}
