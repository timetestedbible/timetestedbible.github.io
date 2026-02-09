/**
 * Translation Patch System
 * 
 * Highlights and optionally replaces translation choices in Bible text.
 * Each patch targets a specific phrase in a specific verse.
 * All patches for a verse are accepted/rejected together.
 * 
 * Visual states:
 *   - Pending (orange): default-on patch, user hasn't reviewed
 *   - Accepted (muted blue): user accepted
 *   - Rejected (subtle gray): original shown, patch available
 * 
 * Patches insert indexed PUA markers (\uE010-\uE01F start, \uE001 end).
 * Each marker pair carries a patch index so tooltips are per-patch.
 * After Strong's rendering, markers are converted to styled spans.
 * 
 * State is per-verse: all patches on a verse are accepted/rejected together.
 */

const TranslationPatches = {
  _data: null,
  _verseIndex: null,   // verse ref → [patch objects]
  _userStates: null,    // verse ref → 'accepted' | 'rejected'
  _hideTimeout: null,

  // ── Init ──────────────────────────────────────────────────────

  async init() {
    try {
      const response = await fetch('/data/translation-patches.json');
      if (!response.ok) {
        console.warn('[TranslationPatches] No patch data found');
        return;
      }
      this._data = await response.json();
      this._loadUserStates();
      this._buildVerseIndex();
      console.log(`[TranslationPatches] Loaded ${this._data.patches.length} patches`);
      this._setupEventDelegation();
    } catch (e) {
      console.error('[TranslationPatches] Error loading patches:', e);
    }
  },

  _loadUserStates() {
    try {
      const stored = localStorage.getItem('patchStates');
      this._userStates = stored ? JSON.parse(stored) : {};
    } catch (e) {
      this._userStates = {};
    }
  },

  _saveUserStates() {
    try {
      localStorage.setItem('patchStates', JSON.stringify(this._userStates));
    } catch (e) {
      console.error('[TranslationPatches] Error saving patch states:', e);
    }
  },

  _buildVerseIndex() {
    this._verseIndex = {};
    if (!this._data || !this._data.patches) return;
    for (const patch of this._data.patches) {
      // Support both "verse" (new) and "verses" (old) formats
      const verses = patch.verse ? [patch.verse] : (patch.verses || []);
      for (const verse of verses) {
        if (!this._verseIndex[verse]) this._verseIndex[verse] = [];
        this._verseIndex[verse].push(patch);
      }
    }
  },

  // ── State ─────────────────────────────────────────────────────

  getVerseState(verseRef) {
    const userState = this._userStates?.[verseRef];
    if (userState === 'accepted') return 'accepted';
    if (userState === 'rejected') return 'rejected';
    const patches = this.getPatchesForVerse(verseRef);
    for (const patch of patches) {
      // Support both flat format (default on patch) and old group format
      const isDefault = patch.default || this._data?.groups?.[patch.group]?.default;
      if (isDefault) return 'pending';
    }
    return 'inactive';
  },

  getPatchesForVerse(verseRef) {
    if (!this._verseIndex) return [];
    return this._verseIndex[verseRef] || [];
  },

  hasPatchesForVerse(verseRef) {
    return this.getPatchesForVerse(verseRef).length > 0;
  },

  // ── Text Processing ───────────────────────────────────────────

  stripStrongsTags(text) {
    if (!text) return text;
    return text.replace(/\{?\(H\d+\)\}?/g, '').replace(/\{[HG]\d+\}/g, '').replace(/\s{2,}/g, ' ').trim();
  },

  /**
   * Apply patches to verse text. Inserts indexed PUA markers around replaced text.
   * Each patch gets a unique start marker (\uE010 + index) so tooltips are per-patch.
   * End marker is always \uE001.
   */
  applyPatches(verseRef, text, translationId) {
    const patches = this.getPatchesForVerse(verseRef);
    if (!patches.length) return text;

    const state = this.getVerseState(verseRef);
    if (state === 'inactive') return text;

    let result = text;
    const hasStrongs = text.includes('{H') || text.includes('{G');

    for (let i = 0; i < patches.length; i++) {
      const patch = patches[i];
      let findText = patch.find?.[translationId];
      if (!findText) continue;

      if (!hasStrongs) {
        findText = this.stripStrongsTags(findText);
      }

      const escaped = findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escaped, 'i');

      // Start marker encodes patch index: \uE010 + i
      const startMarker = String.fromCharCode(0xE010 + i);

      if (state === 'rejected') {
        // Keep original text but wrap with markers for subtle color coding
        result = result.replace(regex, startMarker + '$&' + '\uE001');
      } else {
        let replaceText = patch.replace?.[translationId];
        if (!replaceText) continue;
        if (!hasStrongs) replaceText = this.stripStrongsTags(replaceText);
        result = result.replace(regex, startMarker + replaceText + '\uE001');
      }
    }

    return result;
  },

  /**
   * Extract indexed PUA markers from text. Returns clean text + patch ranges with indices.
   * Start markers are \uE010-\uE01F, end marker is \uE001.
   */
  extractMarkers(text) {
    if (!text) return { cleanText: text, patchRanges: [] };

    let hasMarkers = false;
    for (let i = 0; i < text.length; i++) {
      const code = text.charCodeAt(i);
      if ((code >= 0xE010 && code <= 0xE01F) || code === 0xE001) {
        hasMarkers = true;
        break;
      }
    }
    if (!hasMarkers) return { cleanText: text, patchRanges: [] };

    let cleanText = '';
    const patchRanges = [];
    let rangeStart = -1;
    let currentPatchIdx = -1;

    for (let i = 0; i < text.length; i++) {
      const code = text.charCodeAt(i);
      if (code >= 0xE010 && code <= 0xE01F) {
        currentPatchIdx = code - 0xE010;
        rangeStart = cleanText.length;
        continue;
      }
      if (code === 0xE001) {
        if (rangeStart >= 0) {
          patchRanges.push({ start: rangeStart, end: cleanText.length, patchIdx: currentPatchIdx });
          rangeStart = -1;
        }
        continue;
      }
      cleanText += text[i];
    }

    return { cleanText, patchRanges };
  },

  /**
   * Get CSS class and verse attribute for patch regions.
   * Used by renderInlineStrongs to style elements inside patch ranges.
   */
  getPatchRegionInfo(verseRef) {
    const state = this.getVerseState(verseRef);
    if (state === 'inactive') return null;

    const escapedRef = this._escapeAttr(verseRef);
    const verseAttr = ` data-verse="${escapedRef}"`;

    // All states get data-verse so tooltips work everywhere
    if (state === 'accepted') {
      return { patchClass: 'patch-region-accepted', verseAttr };
    } else if (state === 'rejected') {
      return { patchClass: 'patch-region-rejected', verseAttr };
    } else {
      return { patchClass: 'patch-region-pending', verseAttr };
    }
  },

  /**
   * Convert indexed PUA markers in plain-text rendered HTML to styled spans.
   * For Strong's text, markers are handled inside renderInlineStrongs instead.
   */
  applyPatchMarkers(html, verseRef) {
    if (!html) return html;

    // Check for any indexed start markers
    let hasMarkers = false;
    for (let i = 0; i < html.length; i++) {
      const code = html.charCodeAt(i);
      if (code >= 0xE010 && code <= 0xE01F) { hasMarkers = true; break; }
    }
    if (!hasMarkers) return html;

    const state = this.getVerseState(verseRef);
    const escapedRef = this._escapeAttr(verseRef);

    return html.replace(/([\uE010-\uE01F])([\s\S]*?)\uE001/g, (match, startChar, content) => {
      const patchIdx = startChar.charCodeAt(0) - 0xE010;
      const cls = state === 'accepted' ? 'patch-region-accepted' : (state === 'rejected' ? 'patch-region-rejected' : 'patch-region-pending');
      return `<span class="${cls}" data-verse="${escapedRef}" data-patch-idx="${patchIdx}">${content}</span>`;
    });
  },

  /**
   * Highlight patched phrases in comparison translations (no text swap).
   */
  highlightComparison(verseRef, text, translationId) {
    const patches = this.getPatchesForVerse(verseRef);
    if (!patches.length) return text;

    const state = this.getVerseState(verseRef);
    if (state !== 'pending' && state !== 'accepted') return text;

    let result = text;
    for (const patch of patches) {
      let findText = patch.find?.[translationId];
      if (!findText) continue;
      findText = this.stripStrongsTags(findText);

      const escaped = findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escaped, 'i');

      result = result.replace(regex, (match) =>
        `<span class="patch-comparison-highlight">${match}</span>`
      );
    }
    return result;
  },

  // ── Interlinear Note ──────────────────────────────────────────

  getInterlinearNote(verseRef) {
    const patches = this.getPatchesForVerse(verseRef);
    if (!patches.length) return null;

    const state = this.getVerseState(verseRef);
    if (state === 'inactive') return null;

    const escapedRef = this._escapeAttr(verseRef);
    const trans = (typeof currentTranslation !== 'undefined' && currentTranslation) || 'kjv';

    let html = '<div class="patch-interlinear-note">';

    // Header
    if (state === 'pending') {
      html += '<div class="patch-note-header">Recommended Translation Patch</div>';
    } else if (state === 'accepted') {
      html += '<div class="patch-note-header patch-note-header-accepted">Translation Patch Accepted</div>';
    } else if (state === 'rejected') {
      html += '<div class="patch-note-header patch-note-header-available">Translation Patch Available</div>';
    }

    // Each patch: comparison + summary
    for (const patch of patches) {
      let origText = patch.find?.[trans];
      let patchText = patch.replace?.[trans];
      if (origText) origText = this.stripStrongsTags(origText);
      if (patchText) patchText = this.stripStrongsTags(patchText);

      if (origText && patchText) {
        html += '<div class="patch-note-comparison">';
        if (state === 'pending' || state === 'accepted') {
          html += `<div class="patch-note-original"><del>${origText}</del></div>`;
          html += `<div class="patch-note-replacement">${patchText}</div>`;
        } else {
          html += `<div class="patch-note-original">${origText}</div>`;
          html += `<div class="patch-note-replacement"><em>\u2192 ${patchText}</em></div>`;
        }
        html += '</div>';
      }

      if (patch.summary) {
        html += `<div class="patch-note-body"><p>${patch.summary}</p></div>`;
      }
    }

    // Actions
    html += '<div class="patch-note-actions">';
    const studyPatch = patches.find(p => p.study);
    if (studyPatch) {
      html += `<button class="patch-tooltip-btn patch-tooltip-study" onclick="event.stopPropagation(); TranslationPatches.openStudy('${this._escapeAttr(studyPatch.study)}', '${studyPatch.section || ''}')">Full Study \u2192</button>`;
    }
    if (state === 'pending') {
      html += `<button class="patch-tooltip-btn patch-tooltip-accept" onclick="event.stopPropagation(); TranslationPatches.acceptVerse('${escapedRef}')">Accept</button>`;
      html += `<button class="patch-tooltip-btn patch-tooltip-reject" onclick="event.stopPropagation(); TranslationPatches.rejectVerse('${escapedRef}')">Reject</button>`;
    } else if (state === 'accepted') {
      html += `<button class="patch-tooltip-btn patch-tooltip-reject" onclick="event.stopPropagation(); TranslationPatches.rejectVerse('${escapedRef}')">Revert</button>`;
    } else if (state === 'rejected') {
      html += `<button class="patch-tooltip-btn patch-tooltip-accept" onclick="event.stopPropagation(); TranslationPatches.acceptVerse('${escapedRef}')">Re-apply</button>`;
    }
    html += '</div></div>';

    return html;
  },

  // ── User Actions ──────────────────────────────────────────────

  acceptVerse(verseRef) {
    this._userStates[verseRef] = 'accepted';
    this._saveUserStates();
    this._trackEvent('accept', verseRef);
    this.hideTooltip();
    this._refreshVerseSoft(verseRef);
  },

  rejectVerse(verseRef) {
    this._userStates[verseRef] = 'rejected';
    this._saveUserStates();
    this._trackEvent('reject', verseRef);
    this.hideTooltip();
    this._refreshVerseSoft(verseRef);
  },

  // ── Navigation ────────────────────────────────────────────────

  openStudy(studyUrl, section) {
    if (!studyUrl) return;
    this._trackEvent('study', studyUrl);
    this.hideTooltip();

    const parts = studyUrl.split('/').filter(Boolean);

    if (typeof AppStore !== 'undefined' && parts[0] === 'reader' && parts[1] && parts[2]) {
      const contentType = parts[1];
      const slug = parts[2];
      const params = { contentType };

      if (contentType === 'verse-studies') params.study = slug;
      else if (contentType === 'words') params.word = slug;
      else if (contentType === 'symbols') params.symbol = slug;
      else if (contentType === 'numbers') params.number = slug;

      AppStore.dispatch({ type: 'SET_VIEW', view: 'reader', params });
      return;
    }

    // Fallback
    if (typeof URLRouter !== 'undefined') {
      history.pushState({}, '', studyUrl);
      AppStore.dispatch({ type: 'URL_CHANGED', url: window.location.href });
    } else {
      window.location.href = studyUrl;
    }
  },

  /**
   * Open the interlinear expansion for a verse (triggered from tooltip "Show Details")
   */
  showDetails(verseRef) {
    this.hideTooltip();
    const match = verseRef.match(/^(.+)\s(\d+):(\d+)$/);
    if (!match) return;
    const [, book, chapter, verse] = match;
    if (typeof showInterlinear === 'function') {
      const chVerse = parseInt(verse);
      const chChapter = parseInt(chapter);
      const verseEl = document.getElementById(`verse-${chVerse}`) ||
                       document.getElementById(`mv-${book.replace(/\s+/g, '-')}-${chapter}-${verse}`);
      if (verseEl) {
        showInterlinear(book, chChapter, chVerse, null, verseEl.id);
      }
    }
  },

  // ── Event Delegation ──────────────────────────────────────────

  _delegationSetup: false,
  _showTimeout: null,
  _currentPatchEl: null,

  _setupEventDelegation() {
    if (this._delegationSetup) return;
    this._delegationSetup = true;

    // Dismiss tooltip on scroll (it's position:fixed so it would float)
    document.addEventListener('scroll', () => this.hideTooltip(), true);

    const patchSelector = '[data-verse][data-patch-idx]';

    document.addEventListener('mouseover', (e) => {
      const el = e.target.closest(patchSelector);
      if (el && el !== this._currentPatchEl) {
        this._currentPatchEl = el;
        this._cancelHideTooltip();
        if (this._showTimeout) clearTimeout(this._showTimeout);
        this._showTimeout = setTimeout(() => this._showPatchTooltipForEl(el), 150);
      }
    });

    document.addEventListener('mouseout', (e) => {
      const el = e.target.closest(patchSelector);
      if (el) {
        if (this._showTimeout) { clearTimeout(this._showTimeout); this._showTimeout = null; }
        this.scheduleHideTooltip();
        this._currentPatchEl = null;
      }
    });

    document.addEventListener('click', (e) => {
      const el = e.target.closest(patchSelector);
      if (el) {
        e.stopPropagation();
        this._showPatchTooltipForEl(el);
      }
    });
  },

  // ── Tooltips ──────────────────────────────────────────────────

  /**
   * Show compact tooltip for a specific patch region.
   * Just the summary + "Show Details" to expand interlinear.
   */
  _showPatchTooltipForEl(el) {
    const verseRef = el.dataset.verse;
    const patchIdx = parseInt(el.dataset.patchIdx || '0');
    if (!verseRef) return;

    const patches = this.getPatchesForVerse(verseRef);
    const patch = patches[patchIdx];
    if (!patch) return;

    const state = this.getVerseState(verseRef);
    this.hideTooltip();

    const trans = (typeof currentTranslation !== 'undefined' && currentTranslation) || 'kjv';
    let html = '<div class="patch-tooltip">';

    if (state === 'accepted') {
      // Accepted: show the original translation so they know what changed
      let origText = patch.find?.[trans];
      if (origText) origText = this.stripStrongsTags(origText);
      if (origText) {
        html += `<div class="patch-tooltip-original">Original: ${origText}</div>`;
      }
    } else {
      // Pending/rejected: show why this patch is recommended
      if (patch.summary) {
        html += `<div class="patch-tooltip-body"><p>${patch.summary}</p></div>`;
      }
    }

    // Only show "Show Details" if the interlinear isn't already open for this verse
    const match = verseRef.match(/^(.+)\s(\d+):(\d+)$/);
    let interlinearOpen = false;
    if (match) {
      const vNum = match[3];
      const book = match[1];
      const ch = match[2];
      const verseEl = document.getElementById(`verse-${vNum}`) ||
                       document.getElementById(`mv-${book.replace(/\s+/g, '-')}-${ch}-${vNum}`);
      if (verseEl) interlinearOpen = verseEl.classList.contains('interlinear-expanded');
    }

    if (!interlinearOpen) {
      html += '<div class="patch-tooltip-actions">';
      html += `<button class="patch-tooltip-btn patch-tooltip-study" onclick="event.stopPropagation(); TranslationPatches.showDetails('${this._escapeAttr(verseRef)}')">Show Details \u2630</button>`;
      html += '</div>';
    }
    html += '</div>';

    // Position tooltip (fixed — matches Strong's tooltip behavior)
    const tooltipEl = document.createElement('div');
    tooltipEl.className = 'patch-tooltip-container';
    tooltipEl.innerHTML = html;
    tooltipEl.addEventListener('mouseenter', () => this._cancelHideTooltip());
    tooltipEl.addEventListener('mouseleave', () => this.scheduleHideTooltip());

    tooltipEl.style.position = 'fixed';
    tooltipEl.style.visibility = 'hidden';
    tooltipEl.style.zIndex = '10000';
    tooltipEl.style.top = '0px';
    tooltipEl.style.left = '0px';
    document.body.appendChild(tooltipEl);

    const rect = el.getBoundingClientRect();
    const tooltipRect = tooltipEl.getBoundingClientRect();

    let top = rect.top - tooltipRect.height - 8;
    let left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);

    if (left + tooltipRect.width > window.innerWidth - 16) left = window.innerWidth - tooltipRect.width - 16;
    if (left < 16) left = 16;
    if (top < 16) top = rect.bottom + 8;

    tooltipEl.style.top = top + 'px';
    tooltipEl.style.left = left + 'px';
    tooltipEl.style.visibility = 'visible';

    setTimeout(() => document.addEventListener('click', this._onDocumentClick), 0);
  },

  scheduleHideTooltip() {
    this._hideTimeout = setTimeout(() => this.hideTooltip(), 200);
  },

  _cancelHideTooltip() {
    if (this._hideTimeout) {
      clearTimeout(this._hideTimeout);
      this._hideTimeout = null;
    }
  },

  _onDocumentClick(e) {
    if (!e.target.closest('.patch-tooltip-container') && !e.target.closest('[data-verse][data-patch-idx]')) {
      TranslationPatches.hideTooltip();
    }
  },

  hideTooltip() {
    this._cancelHideTooltip();
    if (this._showTimeout) { clearTimeout(this._showTimeout); this._showTimeout = null; }
    this._currentPatchEl = null;
    document.removeEventListener('click', this._onDocumentClick);
    document.querySelectorAll('.patch-tooltip-container').forEach(el => el.remove());
  },

  // ── Internal ──────────────────────────────────────────────────

  _escapeAttr(str) {
    if (!str) return '';
    return str.replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/'/g, '&#39;');
  },

  /**
   * Soft refresh: update the interlinear note in-place without re-rendering verses.
   * Clears the chapter cache so the NEXT navigation rebuilds with new patch state,
   * but does NOT trigger an immediate re-render (which would kill the interlinear).
   */
  _refreshVerseSoft(verseRef) {
    // Update the interlinear note in-place if it's visible
    const noteEl = document.querySelector('.patch-interlinear-note');
    if (noteEl) {
      const newNote = this.getInterlinearNote(verseRef);
      if (newNote) {
        noteEl.outerHTML = newNote;
      }
    }

    // Clear chapter HTML cache so next navigation rebuilds with new patch state
    window.dispatchEvent(new Event('patchesChanged'));
    // Do NOT null BibleView.lastRenderedParams or dispatch PATCHES_CHANGED —
    // those trigger immediate re-render which destroys the DOM and kills the interlinear
  },

  _refreshVerses() {
    window.dispatchEvent(new Event('patchesChanged'));
    if (typeof BibleView !== 'undefined') BibleView.lastRenderedParams = null;
    if (typeof ReaderView !== 'undefined') ReaderView._lastRenderKey = null;
    if (typeof AppStore !== 'undefined') AppStore.dispatch({ type: 'PATCHES_CHANGED' });
  },

  _trackEvent(action, id) {
    if (typeof goatcounter !== 'undefined' && goatcounter.count) {
      goatcounter.count({
        path: `/patch/${action}/${id}`,
        title: `Patch ${action}: ${id}`,
        event: true
      });
    }
  }
};

window.TranslationPatches = TranslationPatches;
