// Verse-Event Links Module
// Loads verse-event-index.json and provides lookup for timeline links on Bible verses

let _verseEventIndex = null;
let _verseEventLinks = null;
let _verseEventLoading = false;
let _verseEventPromise = null;

/**
 * Load the verse-event index (lazy, cached)
 */
async function loadVerseEventIndex() {
  if (_verseEventIndex) return _verseEventIndex;
  if (_verseEventLoading) return _verseEventPromise;
  
  _verseEventLoading = true;
  _verseEventPromise = (async () => {
    try {
      console.log('[VerseEvents] Loading verse-event index...');
      const response = await fetch('/data/verse-event-index.json');
      if (!response.ok) throw new Error('Failed to load verse-event-index.json');
      const data = await response.json();
      _verseEventIndex = data.index || {};
      _verseEventLinks = data.links || {};
      console.log(`[VerseEvents] Loaded ${Object.keys(_verseEventIndex).length} verse entries`);
      return _verseEventIndex;
    } catch (e) {
      console.warn('[VerseEvents] Failed to load:', e);
      _verseEventIndex = {};
      _verseEventLinks = {};
      return _verseEventIndex;
    } finally {
      _verseEventLoading = false;
    }
  })();
  return _verseEventPromise;
}

/**
 * Get timeline events for a verse (synchronous — returns null if not loaded yet)
 * @param {string} book - Book name (e.g., "Genesis")
 * @param {number} chapter - Chapter number
 * @param {number} verse - Verse number
 * @returns {Object|null} { events: [...], date: { year, month, day } } or null
 */
function getVerseTimelineEvents(book, chapter, verse) {
  if (!_verseEventIndex) return null;
  
  const key = `${book} ${chapter}:${verse}`;
  const entry = _verseEventIndex[key];
  
  if (entry && entry.can_link_timeline && entry.events && entry.events.length > 0) {
    // Get calendar date from links section if available
    const link = _verseEventLinks?.[key];
    const calTarget = link?.calendar_target || null;
    return { events: entry.events, date: calTarget };
  }
  
  return null;
}

/**
 * Check if a verse has timeline events (fast sync check for icon display)
 */
function hasVerseTimelineEvents(book, chapter, verse) {
  return getVerseTimelineEvents(book, chapter, verse) !== null;
}

/**
 * Format a calendar target date for display
 */
function _formatEventDate(calTarget) {
  if (!calTarget) return '';
  const year = calTarget.year;
  if (year == null) return '';
  const yearStr = year < 0 ? `${Math.abs(year) + 1} BC` : year === 0 ? '1 BC' : `${year} AD`;
  const month = calTarget.month ? `Month ${calTarget.month}` : '';
  const day = calTarget.day ? `Day ${calTarget.day}` : '';
  const parts = [day, month, yearStr].filter(Boolean);
  return parts.join(', ');
}

/**
 * Navigate to timeline focused on a specific event.
 * On mobile: first tap shows tooltip, second tap navigates.
 * On desktop: navigates immediately (tooltip shown via CSS hover).
 */
function navigateToVerseEvent(eventId, e) {
  if (e) e.stopPropagation();
  
  const el = e?.target?.closest('.verse-timeline-ref');
  
  // Mobile: if tooltip not yet visible, show it first; navigate on second tap
  if (el && 'ontouchstart' in window) {
    if (!el.classList.contains('tip-visible')) {
      e.preventDefault();
      // Remove tip-visible from all others
      document.querySelectorAll('.verse-timeline-ref.tip-visible').forEach(t => t.classList.remove('tip-visible'));
      el.classList.add('tip-visible');
      // Auto-hide after 3 seconds
      setTimeout(() => el.classList.remove('tip-visible'), 3000);
      return;
    }
    el.classList.remove('tip-visible');
  }
  
  // Focus event on timeline (scrolls + highlights)
  // On desktop, also open the detail panel (enough screen space)
  const isMobile = window.innerWidth < 768;
  const params = `focus=${encodeURIComponent(eventId)}${isMobile ? '' : '&event=' + encodeURIComponent(eventId)}`;
  const url = `/timeline?${params}`;
  history.pushState({}, '', url);
  if (typeof AppStore !== 'undefined') {
    AppStore.dispatch({ type: 'URL_CHANGED', url });
  }
}

// Expose globally
if (typeof window !== 'undefined') {
  window.getVerseTimelineEvents = getVerseTimelineEvents;
  window.hasVerseTimelineEvents = hasVerseTimelineEvents;
  window.navigateToVerseEvent = navigateToVerseEvent;
  window.loadVerseEventIndex = loadVerseEventIndex;
  window._formatEventDate = _formatEventDate;
  
  // Preload immediately so icons show correctly on first render
  loadVerseEventIndex();
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { loadVerseEventIndex, getVerseTimelineEvents, hasVerseTimelineEvents, navigateToVerseEvent };
}
