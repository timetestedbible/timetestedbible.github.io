# Global Search Implementation Plan

## Overview
Move the Bible search bar to the top navigation to become a global search feature. Search results will display in a collapsible region between the header and content area.

---

## Phase 1: Fix Timeline Responsiveness

### Goal
Ensure all views use `var(--top-nav-height)` CSS variable instead of hardcoded values, so they respond correctly when header height changes.

### Files to Check/Fix

1. **`http/styles.css`**
   - Search for hardcoded `56px` or `top: 56px` values
   - Replace with `var(--top-nav-height)`
   - Known issue: `.biblical-timeline-page` uses `top: 56px` (around line 2487)

2. **`http/assets/css/bible-styles.css`**
   - Check for any hardcoded header heights

### Testing
After fixes:
1. Manually change `--top-nav-height` in browser dev tools to `100px`
2. Verify timeline, calendar, bible, reader views all adjust correctly
3. Verify panels (feasts, priestly, sidebar) position correctly

### Commit
"Fix timeline to use CSS variable for header height"

---

## Phase 2: Global Search Implementation

### 2A: Add Search Bar to Top Navigation

**File: `http/index.html`**

Add search elements to `#top-nav`:
```html
<div class="top-nav-right">
  <!-- NEW: Global search -->
  <div id="global-search-container" class="global-search">
    <input type="text" id="global-search-input" 
           placeholder="Search..." 
           onkeydown="if(event.key==='Enter') globalSearch()">
    <button class="global-search-btn" onclick="toggleGlobalSearch()" title="Search">🔍</button>
    <button class="global-search-close" onclick="closeGlobalSearch()" style="display:none">✕</button>
  </div>
  
  <!-- Existing nav buttons -->
  <div class="nav-history-buttons">...
```

**File: `http/styles.css`**

Add styles for global search:
```css
/* Global Search in Top Nav */
.global-search {
  display: flex;
  align-items: center;
  gap: 4px;
}

.global-search input {
  width: 200px;
  padding: 6px 12px;
  border: 1px solid rgba(255,255,255,0.2);
  border-radius: 4px;
  background: rgba(0,0,0,0.3);
  color: #fff;
  font-size: 0.9em;
}

/* Mobile: Collapse to button, expand on tap */
@media (max-width: 600px) {
  .global-search input {
    width: 0;
    padding: 0;
    border: none;
    opacity: 0;
    transition: all 0.3s ease;
  }
  
  .global-search.expanded input {
    width: calc(100vw - 120px);
    padding: 6px 12px;
    border: 1px solid rgba(255,255,255,0.2);
    opacity: 1;
  }
  
  .global-search.expanded .brand {
    display: none;
  }
}
```

### 2B: Add Search Results Region

**File: `http/index.html`**

Add new region between header and app-container:
```html
<header id="top-nav" class="top-nav">...</header>

<!-- NEW: Global search results (collapsible) -->
<div id="global-search-results" class="global-search-results" style="display: none;">
  <div class="search-results-content" id="search-results-content">
    <!-- Results rendered here -->
  </div>
  <div class="search-results-handle" id="search-results-handle">
    <div class="handle-bar"></div>
  </div>
</div>

<div id="app-container" class="app-container">...
```

**File: `http/styles.css`**

```css
/* Global Search Results Region */
.global-search-results {
  background: var(--color-bg-dark);
  border-bottom: 2px solid var(--color-accent-gold);
  max-height: 50vh;
  overflow-y: auto;
  position: relative;
}

.search-results-content {
  padding: 12px;
}

.search-results-handle {
  height: 8px;
  background: rgba(0,0,0,0.3);
  cursor: ns-resize;
  display: flex;
  justify-content: center;
  align-items: center;
}

.search-results-handle .handle-bar {
  width: 40px;
  height: 4px;
  background: rgba(255,255,255,0.3);
  border-radius: 2px;
}
```

### 2C: Create Global Search Module

**File: `http/global-search.js`** (NEW)

```javascript
const GlobalSearch = {
  resultsHeight: 200, // Default height, persisted
  
  // Initialize search functionality
  init() {
    // Load saved results height from localStorage
    // Set up resize handle drag
    // Set up keyboard shortcuts (Escape to close)
    // Set up click-outside to close
  },
  
  // Main search function - determines search type and routes accordingly
  search(query) {
    if (!query.trim()) return;
    
    // Check for Strong's number (H1234, G5678)
    if (/^[HGhg]\d+$/.test(query)) {
      this.searchStrongs(query);
      return;
    }
    
    // Check for verse reference (John 3:16, Gen 1:1)
    const verseRef = this.parseVerseReference(query);
    if (verseRef) {
      this.navigateToVerse(verseRef);
      return;
    }
    
    // Check for date (Phase 3 - placeholder for now)
    // const date = this.parseDate(query);
    // if (date) { this.navigateToDate(date); return; }
    
    // Default: text search across Bible
    this.searchBibleText(query);
  },
  
  // Show results panel
  showResults(html) {
    const container = document.getElementById('global-search-results');
    const content = document.getElementById('search-results-content');
    content.innerHTML = html;
    container.style.display = 'block';
    container.style.height = this.resultsHeight + 'px';
    
    // Update URL
    AppStore.dispatch({ type: 'SET_GLOBAL_SEARCH', query: this.currentQuery });
  },
  
  // Close results panel
  close() {
    const container = document.getElementById('global-search-results');
    container.style.display = 'none';
    
    // Clear URL param
    AppStore.dispatch({ type: 'CLOSE_GLOBAL_SEARCH' });
  },
  
  // Handle resize drag
  setupResizeHandle() {
    // Implement drag to resize results height
    // Save to localStorage
  }
};
```

### 2D: Update AppStore for Global Search State

**File: `http/app-store.js`**

Add to UI state:
```javascript
ui: {
  // ... existing
  globalSearchQuery: null,  // NEW
}
```

Add action handlers:
```javascript
case 'SET_GLOBAL_SEARCH':
  s.ui.globalSearchQuery = event.query;
  return true;

case 'CLOSE_GLOBAL_SEARCH':
  s.ui.globalSearchQuery = null;
  return true;
```

### 2E: Update URL Router

**File: `http/url-router.js`**

Parse `?q=` query param:
```javascript
if (searchParams.get('q')) {
  result.ui.globalSearchQuery = searchParams.get('q');
}
```

Build URL with search:
```javascript
if (ui.globalSearchQuery) {
  params.set('q', ui.globalSearchQuery);
}
```

### 2F: Migrate Bible Search Functions

**File: `http/bible-reader.js`**

- Keep existing search functions (`startConceptSearch`, `findTextMatchVerses`, etc.)
- Modify to render results into `#search-results-content` instead of `#concept-search-results`
- Update element ID references

**File: `http/views/bible-view.js`**

- Remove search bar from Bible header (or hide it)
- Keep `#concept-search-results` div for backwards compatibility or remove entirely

### 2G: Mobile Behavior

On mobile (width <= 600px):
1. Search shows as icon button only
2. Tapping icon:
   - Hides brand
   - Expands search input across available space
   - Shows X button to close
3. Blur or X closes the expanded search
4. Hamburger menu remains visible

---

## Phase 3: Date Parsing (Future)

Add date parsing to `GlobalSearch.search()`:
- Support formats: `Jan 15, 2025`, `1/15/2025`, `2025-01-15`
- Default to current year if not specified
- Navigate to calendar view with parsed date

---

## Testing Checklist

### Phase 1
- [ ] Timeline responds to `--top-nav-height` changes
- [ ] All panels position correctly
- [ ] No visual regressions

### Phase 2
- [ ] Search bar appears in top nav (desktop)
- [ ] Search bar collapses to icon (mobile)
- [ ] Search expands/collapses correctly on mobile
- [ ] Results display below header
- [ ] Results can be resized via drag handle
- [ ] Clicking result navigates correctly
- [ ] Back button restores search results
- [ ] Escape closes search
- [ ] Click outside closes search
- [ ] Strong's number search works
- [ ] Verse reference search works
- [ ] Text search works
- [ ] URL reflects search state

---

## File Summary

### Modified Files
- `http/styles.css` - Header height fix, global search styles
- `http/index.html` - Search bar, results region
- `http/app-store.js` - Global search state
- `http/url-router.js` - Search query param
- `http/bible-reader.js` - Update result rendering target
- `http/views/bible-view.js` - Remove/hide local search bar

### New Files
- `http/global-search.js` - Global search module

### Service Worker Update
- `http/sw.js` - Add `global-search.js` to precache list
