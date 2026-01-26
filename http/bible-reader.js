// Bible Reader Module
// Parses KJV text and provides verse lookup functionality

// Cache version - increment this when kjv.txt format changes or is updated
const BIBLE_CACHE_VERSION = 1;
const BIBLE_CACHE_KEY = 'kjv_bible_cache';

let bibleData = null;
let bibleIndex = {}; // Index by "Book Chapter:Verse" for fast lookup

// Load Bible from cache or parse from source
async function loadBible() {
  // Try to load from cache first
  const cached = loadBibleFromCache();
  if (cached) {
    bibleData = cached.data;
    rebuildIndex();
    console.log(`Bible loaded from cache: ${bibleData.length} verses (v${cached.version})`);
    return true;
  }
  
  // Parse from source file
  try {
    const response = await fetch('/kjv.txt');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const text = await response.text();
    
    bibleData = parseBibleText(text);
    rebuildIndex();
    
    // Cache the parsed data
    saveBibleToCache(bibleData);
    
    console.log(`Bible parsed and cached: ${bibleData.length} verses (v${BIBLE_CACHE_VERSION})`);
    return true;
  } catch (err) {
    console.warn('Bible not available:', err.message);
    return false;
  }
}

// Parse the KJV text file into structured data
function parseBibleText(text) {
  const data = [];
  const lines = text.split('\n');
  
  for (let i = 2; i < lines.length; i++) { // Skip header lines
    const line = lines[i].trim();
    if (!line) continue;
    
    const tabIndex = line.indexOf('\t');
    if (tabIndex === -1) continue;
    
    const reference = line.substring(0, tabIndex);
    const verseText = line.substring(tabIndex + 1);
    
    // Parse reference: "Book Chapter:Verse"
    const match = reference.match(/^(.+?)\s+(\d+):(\d+)$/);
    if (!match) continue;
    
    const [, book, chapter, verse] = match;
    data.push({
      book: book,
      chapter: parseInt(chapter),
      verse: parseInt(verse),
      text: verseText,
      reference: reference
    });
  }
  
  return data;
}

// Rebuild the index from bibleData
function rebuildIndex() {
  bibleIndex = {};
  if (bibleData) {
    for (const entry of bibleData) {
      bibleIndex[entry.reference] = entry;
    }
  }
}

// Load Bible data from localStorage cache
function loadBibleFromCache() {
  try {
    const cached = localStorage.getItem(BIBLE_CACHE_KEY);
    if (!cached) return null;
    
    const parsed = JSON.parse(cached);
    
    // Check version
    if (parsed.version !== BIBLE_CACHE_VERSION) {
      console.log(`Bible cache version mismatch (cached: ${parsed.version}, current: ${BIBLE_CACHE_VERSION}), reparsing...`);
      localStorage.removeItem(BIBLE_CACHE_KEY);
      return null;
    }
    
    // Validate data
    if (!parsed.data || !Array.isArray(parsed.data) || parsed.data.length === 0) {
      console.log('Bible cache invalid, reparsing...');
      localStorage.removeItem(BIBLE_CACHE_KEY);
      return null;
    }
    
    return parsed;
  } catch (err) {
    console.warn('Failed to load Bible cache:', err.message);
    localStorage.removeItem(BIBLE_CACHE_KEY);
    return null;
  }
}

// Save Bible data to localStorage cache
function saveBibleToCache(data) {
  try {
    const cacheData = {
      version: BIBLE_CACHE_VERSION,
      timestamp: Date.now(),
      data: data
    };
    
    localStorage.setItem(BIBLE_CACHE_KEY, JSON.stringify(cacheData));
    console.log('Bible data cached successfully');
  } catch (err) {
    // localStorage might be full or disabled
    console.warn('Failed to cache Bible data:', err.message);
  }
}

// Clear the Bible cache (useful for forcing a refresh)
function clearBibleCache() {
  localStorage.removeItem(BIBLE_CACHE_KEY);
  console.log('Bible cache cleared');
}

// Parse a citation string into structured format
// Handles formats like:
// - "Genesis 1:1-6:8" (multi-chapter range)
// - "Exodus 30:11–16" (single chapter, en-dash)
// - "Genesis 21:1–34 + Numbers 29:1–6" (multiple citations)
function parseCitation(citationStr) {
  if (!citationStr) return [];
  
  // Split by + or ; for multiple citations
  const parts = citationStr.split(/\s*[+;]\s*/);
  const citations = [];
  
  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    
    // Handle range with en-dash or hyphen: "Book Start:Verse-End:Verse" or "Book Start:Verse-Verse"
    // Pattern: "Book Chapter:Verse–Chapter:Verse" or "Book Chapter:Verse–Verse"
    const rangeMatch = trimmed.match(/^(.+?)\s+(\d+):(\d+)[–-](?:(\d+):)?(\d+)$/);
    
    if (rangeMatch) {
      const [, book, startChapter, startVerse, endChapter, endVerse] = rangeMatch;
      citations.push({
        book: book.trim(),
        startChapter: parseInt(startChapter),
        startVerse: parseInt(startVerse),
        endChapter: endChapter ? parseInt(endChapter) : parseInt(startChapter),
        endVerse: parseInt(endVerse)
      });
    } else {
      // Try single verse: "Book Chapter:Verse"
      const singleMatch = trimmed.match(/^(.+?)\s+(\d+):(\d+)$/);
      if (singleMatch) {
        const [, book, chapter, verse] = singleMatch;
        citations.push({
          book: book.trim(),
          startChapter: parseInt(chapter),
          startVerse: parseInt(verse),
          endChapter: parseInt(chapter),
          endVerse: parseInt(verse)
        });
      }
    }
  }
  
  return citations;
}

// Get verses for a parsed citation
function getVersesForCitation(citation) {
  if (!bibleData) return [];
  
  const verses = [];
  let inRange = false;
  
  for (const entry of bibleData) {
    if (entry.book !== citation.book) {
      if (inRange) break; // We've passed the range
      continue;
    }
    
    // Check if this verse is within the range
    const isAfterStart = 
      entry.chapter > citation.startChapter ||
      (entry.chapter === citation.startChapter && entry.verse >= citation.startVerse);
    
    const isBeforeEnd =
      entry.chapter < citation.endChapter ||
      (entry.chapter === citation.endChapter && entry.verse <= citation.endVerse);
    
    if (isAfterStart && isBeforeEnd) {
      inRange = true;
      verses.push(entry);
    } else if (inRange) {
      break; // We've passed the end of the range
    }
  }
  
  return verses;
}

// Get all verses for a citation string (handles multiple citations)
function getVersesForCitationString(citationStr) {
  const citations = parseCitation(citationStr);
  const allVerses = [];
  
  for (const citation of citations) {
    const verses = getVersesForCitation(citation);
    if (allVerses.length > 0 && verses.length > 0) {
      // Add a separator between different citation ranges
      allVerses.push({ isSeparator: true, book: verses[0].book });
    }
    allVerses.push(...verses);
  }
  
  return allVerses;
}

// Format verses for display, grouped by chapter
function formatVersesForDisplay(verses, title = '') {
  if (!verses || verses.length === 0) {
    return '<div class="bible-reader-empty">No verses found for this citation.</div>';
  }
  
  let html = '<div class="bible-reader-content">';
  
  if (title) {
    html += `<div class="bible-reader-title">${title}</div>`;
  }
  
  let currentBook = '';
  let currentChapter = -1;
  
  for (const verse of verses) {
    if (verse.isSeparator) {
      // Add visual separator between citation ranges
      html += '<div class="bible-chapter-separator"></div>';
      currentChapter = -1;
      continue;
    }
    
    // New book header
    if (verse.book !== currentBook) {
      if (currentBook !== '') {
        html += '</div>'; // Close previous book
      }
      currentBook = verse.book;
      currentChapter = -1;
      html += `<div class="bible-book-section">`;
      html += `<div class="bible-book-name">${verse.book}</div>`;
    }
    
    // New chapter header
    if (verse.chapter !== currentChapter) {
      if (currentChapter !== -1) {
        html += '</div>'; // Close previous chapter
      }
      currentChapter = verse.chapter;
      html += `<div class="bible-chapter-section">`;
      html += `<div class="bible-chapter-header">Chapter ${verse.chapter}</div>`;
      html += '<div class="bible-chapter-text">';
    }
    
    // Verse with superscript verse number
    html += `<span class="bible-verse"><sup class="bible-verse-num">${verse.verse}</sup>${verse.text} </span>`;
  }
  
  // Close remaining tags
  if (currentChapter !== -1) {
    html += '</div></div>'; // Close chapter text and section
  }
  if (currentBook !== '') {
    html += '</div>'; // Close book section
  }
  
  html += '</div>';
  return html;
}

// Open the Bible reader with a specific citation
function openBibleReader(citationStr, title = '') {
  if (!bibleData) {
    console.warn('Bible data not loaded');
    return;
  }
  
  const verses = getVersesForCitationString(citationStr);
  const displayTitle = title || citationStr;
  const html = formatVersesForDisplay(verses, displayTitle);
  
  // Update modal content
  const contentEl = document.getElementById('bible-reader-text');
  const titleEl = document.getElementById('bible-reader-modal-title');
  
  if (contentEl) {
    contentEl.innerHTML = html;
  }
  if (titleEl) {
    titleEl.textContent = displayTitle;
  }
  
  // Show the modal
  const modal = document.getElementById('bible-reader-modal');
  if (modal) {
    modal.classList.add('open');
    document.body.classList.add('bible-reader-open');
  }
}

// Close the Bible reader
function closeBibleReader() {
  const modal = document.getElementById('bible-reader-modal');
  if (modal) {
    modal.classList.remove('open');
    document.body.classList.remove('bible-reader-open');
  }
}

// Handle click on citation link
function handleCitationClick(event) {
  event.preventDefault();
  const citation = event.target.dataset.citation;
  const title = event.target.dataset.title || '';
  if (citation) {
    openBibleReader(citation, title);
  }
}

// Make a citation string clickable
function makeCitationClickable(citationStr, title = '') {
  return `<a href="#" class="bible-citation-link" data-citation="${citationStr}" data-title="${title}" onclick="handleCitationClick(event)">${citationStr}</a>`;
}
