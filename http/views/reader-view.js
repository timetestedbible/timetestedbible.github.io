/**
 * ReaderView - Unified Reader for Bible, Symbols, and Time Tested Book
 * 
 * URL Structure:
 *   /reader/bible/kjv/Genesis/1     → Bible chapter
 *   /reader/symbols/tree            → Symbol word study
 *   /reader/timetested/chapter-slug → Time Tested book chapter
 * 
 * This view delegates to the appropriate renderer based on contentType.
 */

const ReaderView = {
  initialized: false,
  container: null,
  currentContentType: null,
  // Track what's currently rendered to avoid unnecessary re-renders
  _renderedContentType: null,
  _renderedSymbol: null,
  _renderedChapter: null,
  _renderedBibleKey: null,

  init() {
    console.log('[ReaderView] init');
    
    // Delegate to BibleView init if it exists
    if (typeof BibleView !== 'undefined' && BibleView.init) {
      BibleView.init();
    }
  },

  cleanup() {
    console.log('[ReaderView] cleanup');
    
    // Reset render tracking
    this._lastRenderKey = null;
    this._renderedContentType = null;
    this._renderedSymbol = null;
    this._renderedChapter = null;
    this._renderedBibleKey = null;
    
    // Delegate cleanup to sub-views
    if (typeof BibleView !== 'undefined' && BibleView.cleanup) {
      BibleView.cleanup();
    }
  },

  render(state, derived, container) {
    this.container = container;
    
    const params = state.content?.params || {};
    const contentType = params.contentType || 'bible';
    
    // Build a key for the current content to detect if we need to re-render
    let currentKey;
    switch (contentType) {
      case 'bible':
        currentKey = `bible:${params.translation}:${params.book}:${params.chapter}:${params.verse || ''}`;
        break;
      case 'symbols':
        currentKey = `symbols:${params.symbol || 'index'}`;
        break;
      case 'timetested':
        currentKey = `timetested:${params.chapterId || 'index'}`;
        break;
      default:
        currentKey = 'unknown';
    }
    
    // Check if we need to re-render (content actually changed)
    // Also check if UI state changed (Strong's panel)
    const uiKey = `${state.ui?.strongsId || ''}`;
    const fullKey = `${currentKey}:ui:${uiKey}`;
    
    if (this._lastRenderKey === fullKey && container.querySelector('#bible-explorer-page')) {
      // Content hasn't changed, skip re-render to preserve scroll position
      return;
    }
    
    this._lastRenderKey = fullKey;
    
    console.log('[ReaderView] render contentType:', contentType, 'params:', params);
    
    // Track content type changes (but don't cleanup - we want Strong's panel to stay open)
    if (this.currentContentType !== contentType) {
      // Just track the change, don't call cleanup here
      // Cleanup only happens when leaving the reader view entirely (via ReaderView.cleanup)
      this.currentContentType = contentType;
    }
    
    switch (contentType) {
      case 'bible':
        this.renderBible(state, derived, container);
        // Sync the content selector after Bible view renders
        setTimeout(() => {
          if (typeof updateReaderContentSelector === 'function') {
            updateReaderContentSelector('bible');
          }
        }, 50);
        break;
        
      case 'symbols':
        this.renderSymbolInBibleFrame(state, derived, container, params.symbol);
        // Sync UI state (Strong's panel) for non-Bible content
        this.syncUIState(state.ui);
        break;
        
      case 'timetested':
        this.renderTimeTestedInBibleFrame(state, derived, container, params.chapterId, params.section);
        // Sync UI state (Strong's panel) for non-Bible content
        this.syncUIState(state.ui);
        break;
        
      default:
        this.renderBible(state, derived, container);
    }
  },

  /**
   * Render Bible content - delegates to BibleView
   */
  renderBible(state, derived, container) {
    if (typeof BibleView !== 'undefined') {
      BibleView.render(state, derived, container);
    } else {
      container.innerHTML = '<div class="reader-error">Bible reader not available</div>';
    }
  },

  /**
   * Sync UI state (Strong's panel) with URL for non-Bible content
   */
  syncUIState(ui) {
    if (!ui) return;
    
    const currentStrongsOpen = document.getElementById('strongs-sidebar')?.classList.contains('open');
    
    // If URL has strongsId and panel isn't showing it, open it
    if (ui.strongsId && this._currentStrongsId !== ui.strongsId) {
      this._currentStrongsId = ui.strongsId;
      setTimeout(() => {
        if (typeof showStrongsPanel === 'function') {
          showStrongsPanel(ui.strongsId, '', '', null);
        }
      }, 100);
    } else if (!ui.strongsId && currentStrongsOpen) {
      // URL has no Strong's ID but panel is open - close it (skip dispatch)
      this._currentStrongsId = null;
      setTimeout(() => {
        if (typeof closeStrongsPanel === 'function') {
          closeStrongsPanel(true);
        }
      }, 100);
    }
  },

  /**
   * Render Symbol within the Bible frame (uses same header)
   */
  renderSymbolInBibleFrame(state, derived, container, symbolKey) {
    // First render the Bible structure if not already present
    const existingPage = container.querySelector('#bible-explorer-page');
    if (!existingPage) {
      if (typeof BibleView !== 'undefined') {
        BibleView.renderStructure(container);
      }
    }
    
    // Update the content selector
    setTimeout(() => {
      if (typeof updateReaderContentSelector === 'function') {
        updateReaderContentSelector('symbols');
      }
      // Update symbol selector if a symbol is selected
      if (symbolKey) {
        const symbolSelect = document.getElementById('symbol-select');
        if (symbolSelect) symbolSelect.value = symbolKey;
      }
    }, 50);
    
    // Render symbol content into the text area
    const textArea = container.querySelector('#bible-explorer-text');
    if (textArea) {
      if (!symbolKey) {
        textArea.innerHTML = this.buildSymbolIndexHTML();
      } else {
        const symbol = SYMBOL_DICTIONARY?.[symbolKey];
        if (symbol) {
          // Show loading state then load the full word study
          textArea.innerHTML = this.buildSymbolSummaryHTML(symbol, symbolKey);
          this.loadSymbolStudy(symbolKey, textArea);
          
          // Auto-open Strong's panel for the primary Strong's number
          // (only if URL doesn't already have a different strongs param)
          const urlStrongsId = state.ui?.strongsId;
          if (symbol.strongs && symbol.strongs.length > 0 && !urlStrongsId) {
            setTimeout(() => {
              if (typeof showStrongsPanel === 'function') {
                showStrongsPanel(symbol.strongs[0], '', '', null);
              }
            }, 200);
          }
        } else {
          textArea.innerHTML = `<div class="reader-error">Symbol "${symbolKey}" not found</div>`;
        }
      }
    }
    
    // Update the chapter title
    const titleEl = container.querySelector('#bible-chapter-title');
    if (titleEl) {
      titleEl.textContent = symbolKey ? `Symbol: ${SYMBOL_DICTIONARY?.[symbolKey]?.name || symbolKey}` : 'Symbol Dictionary';
    }
    
    // Hide chapter navigation for symbols
    this.hideChapterNav(container);
  },

  /**
   * Build summary HTML for a symbol (shown at top before full study)
   */
  buildSymbolSummaryHTML(symbol, symbolKey) {
    const prevNext = this.getSymbolPrevNext(symbolKey);
    
    return `
      <div class="reader-symbol-content-inline">
        <nav class="reader-symbol-nav">
          ${prevNext.prev ? `<button class="symbol-nav-btn" onclick="AppStore.dispatch({type:'SET_VIEW',view:'reader',params:{contentType:'symbols',symbol:'${prevNext.prev}'}})">◀ ${prevNext.prevName}</button>` : '<span></span>'}
          ${prevNext.next ? `<button class="symbol-nav-btn" onclick="AppStore.dispatch({type:'SET_VIEW',view:'reader',params:{contentType:'symbols',symbol:'${prevNext.next}'}})}">${prevNext.nextName} ▶</button>` : '<span></span>'}
        </nav>
        
        <header class="symbol-header">
          <h1>📖 ${symbol.name}</h1>
          <div class="symbol-meta-row">
            <span class="symbol-words"><strong>Words:</strong> ${symbol.words.join(', ')}</span>
            ${symbol.strongs ? `
            <span class="symbol-strongs-list">
              <strong>Strong's:</strong> 
              ${symbol.strongs.map(s => `<button class="symbol-strongs-btn" onclick="showStrongsPanel('${s}', '', '', event)">${s}</button>`).join(' ')}
            </span>
            ` : ''}
          </div>
        </header>
        
        <div id="symbol-study-content" class="symbol-study-content">
          <div class="symbol-study-loading">Loading word study...</div>
        </div>
      </div>
    `;
  },

  /**
   * Load and render the full symbol study markdown
   */
  async loadSymbolStudy(symbolKey, container) {
    const studyContainer = container.querySelector('#symbol-study-content');
    if (!studyContainer) return;
    
    try {
      // Symbol files are uppercase: /symbols/TREE.md
      const filename = symbolKey.toUpperCase() + '.md';
      const response = await fetch(`/symbols/${filename}`);
      
      if (!response.ok) {
        throw new Error(`Study not found: ${filename}`);
      }
      
      const markdown = await response.text();
      const html = this.renderMarkdown(markdown);
      
      studyContainer.innerHTML = `<div class="symbol-study-body">${html}</div>`;
      
      // Make scripture references clickable
      this.linkifyScriptureRefs(studyContainer);
      
      // Make symbol references interactive (links + tooltips)
      this.linkifySymbolRefs(studyContainer);
      
    } catch (e) {
      console.error('[ReaderView] Error loading symbol study:', e);
      // Show the basic symbol info as fallback
      const symbol = SYMBOL_DICTIONARY?.[symbolKey];
      if (symbol) {
        studyContainer.innerHTML = `
          <div class="symbol-fallback">
            <div class="meaning-block meaning-is">
              <div class="meaning-label">IS (What it represents):</div>
              <div class="meaning-value">${symbol.is}${symbol.is2 ? ' / ' + symbol.is2 : ''}</div>
            </div>
            ${symbol.does ? `
            <div class="meaning-block meaning-does">
              <div class="meaning-label">DOES (What it does):</div>
              <div class="meaning-value">${symbol.does}${symbol.does2 ? ' / ' + symbol.does2 : ''}</div>
            </div>
            ` : ''}
            <div class="meaning-block meaning-sentence">
              <div class="meaning-label">Full Meaning:</div>
              <p class="meaning-paragraph">${symbol.sentence}</p>
            </div>
            ${symbol.opposite ? `
            <div class="meaning-block meaning-opposite">
              <div class="meaning-label">Opposite:</div>
              <div class="meaning-value">${symbol.opposite}</div>
            </div>
            ` : ''}
          </div>
        `;
      } else {
        studyContainer.innerHTML = `<div class="reader-error">Could not load study: ${e.message}</div>`;
      }
    }
  },

  /**
   * Render markdown to HTML using marked.js library
   */
  renderMarkdown(markdown) {
    // Skip the first H1 title (we already show it in the header)
    let text = markdown.replace(/^# .+\n+/, '');
    
    // Use marked.js if available, fallback to basic rendering
    if (typeof marked !== 'undefined') {
      // Configure marked for our needs
      marked.setOptions({
        breaks: true,      // Convert \n to <br>
        gfm: true,         // GitHub Flavored Markdown (tables, code blocks, etc.)
        headerIds: true,   // Add IDs to headers for linking
        mangle: false      // Don't escape email addresses
      });
      
      // Parse with marked
      let html = marked.parse(text);
      
      // Post-process: wrap citation lines in blockquotes with <cite>
      // Pattern: lines starting with em-dash followed by text (e.g., "— Genesis 1:14")
      html = html.replace(/<p>([—–-]{1,2}\s*.+?)<\/p>/g, '<p><cite>$1</cite></p>');
      
      // Add anchor IDs to blockquotes that contain scripture citations
      html = html.replace(/<blockquote>([\s\S]*?)<\/blockquote>/g, (match, content) => {
        // Look for scripture reference in citation
        const citationMatch = content.match(/[—–-]{1,2}\s*(\d?\s*[A-Za-z]+)\s+(\d+):(\d+)/);
        if (citationMatch) {
          const book = citationMatch[1].toLowerCase().replace(/\s+/g, '');
          const chapter = citationMatch[2];
          const verse = citationMatch[3];
          const anchor = `ref-${book}-${chapter}-${verse}`;
          return `<blockquote id="${anchor}">${content}</blockquote>`;
        }
        return match;
      });
      
      // Add class to tables for styling
      html = html.replace(/<table>/g, '<table class="md-table">');
      
      return html;
    }
    
    // Fallback: very basic markdown (if marked.js fails to load)
    console.warn('[ReaderView] marked.js not available, using basic fallback');
    text = text
      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*([^*]+)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>');
    return `<p>${text}</p>`;
  },

  /**
   * Make scripture references clickable
   */
  linkifyScriptureRefs(container) {
    // Pattern for scripture references like "Isaiah 5:7" or "Romans 11:17-24"
    const pattern = /\b(Genesis|Exodus|Leviticus|Numbers|Deuteronomy|Joshua|Judges|Ruth|1 Samuel|2 Samuel|1 Kings|2 Kings|1 Chronicles|2 Chronicles|Ezra|Nehemiah|Esther|Job|Psalms?|Proverbs|Ecclesiastes|Song of Solomon|Isaiah|Jeremiah|Lamentations|Ezekiel|Daniel|Hosea|Joel|Amos|Obadiah|Jonah|Micah|Nahum|Habakkuk|Zephaniah|Haggai|Zechariah|Malachi|Matthew|Mark|Luke|John|Acts|Romans|1 Corinthians|2 Corinthians|Galatians|Ephesians|Philippians|Colossians|1 Thessalonians|2 Thessalonians|1 Timothy|2 Timothy|Titus|Philemon|Hebrews|James|1 Peter|2 Peter|1 John|2 John|3 John|Jude|Revelation)\s+(\d+):(\d+)(?:-(\d+))?\b/g;
    
    const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null, false);
    const textNodes = [];
    while (walker.nextNode()) {
      if (walker.currentNode.nodeValue.match(pattern)) {
        textNodes.push(walker.currentNode);
      }
    }
    
    // Get current translation preference
    let translation = 'kjv';
    try {
      translation = localStorage.getItem('bible_translation_preference') || 'kjv';
    } catch (e) {}
    
    textNodes.forEach(node => {
      const span = document.createElement('span');
      span.innerHTML = node.nodeValue.replace(pattern, (match, book, chapter, verse, endVerse) => {
        const url = `/reader/bible/${translation}/${encodeURIComponent(book)}/${chapter}?verse=${verse}`;
        return `<a href="${url}" class="scripture-ref" onclick="AppStore.dispatch({type:'SET_VIEW',view:'reader',params:{contentType:'bible',translation:'${translation}',book:'${book}',chapter:${chapter},verse:${verse}}}); return false;">${match}</a>`;
      });
      node.parentNode.replaceChild(span, node);
    });
  },

  /**
   * Make symbol references interactive with links and tooltips
   */
  linkifySymbolRefs(container) {
    if (typeof SYMBOL_DICTIONARY === 'undefined') return;
    
    // First, enhance existing symbol links (markdown links like [NAME](/symbols/name/))
    const symbolLinks = container.querySelectorAll('a[href*="/symbols/"]');
    symbolLinks.forEach(link => {
      // Extract symbol key from href
      const match = link.href.match(/\/symbols\/([a-z]+)\/?/i);
      if (match) {
        const symbolKey = match[1].toLowerCase();
        const symbol = SYMBOL_DICTIONARY[symbolKey];
        if (symbol) {
          // Add data attributes for tooltip
          link.classList.add('symbol-ref');
          link.dataset.symbolKey = symbolKey;
          link.dataset.symbolName = symbol.name;
          link.dataset.symbolMeaning = symbol.is2 || symbol.is;
          link.dataset.symbolSentence = symbol.sentence;
          
          // On click, open Strong's panel for this symbol (which shows symbol details)
          link.onclick = (e) => {
            e.preventDefault();
            if (symbol.strongs && symbol.strongs.length > 0 && typeof showStrongsPanel === 'function') {
              showStrongsPanel(symbol.strongs[0], '', '', e);
            } else {
              // Fallback to symbol page if no strongs number
              AppStore.dispatch({
                type: 'SET_VIEW',
                view: 'reader',
                params: { contentType: 'symbols', symbol: symbolKey }
              });
            }
          };
          
          // Add hover tooltip (first tap on mobile shows this, second tap triggers click)
          this.addSymbolTooltip(link, symbol);
        }
      }
    });
    
    // Also look for standalone symbol names in text (UPPERCASE symbol names)
    // Build pattern from known symbol names
    const symbolNames = Object.values(SYMBOL_DICTIONARY).map(s => s.name);
    if (symbolNames.length === 0) return;
    
    // Create a case-insensitive pattern that matches whole words
    // Match uppercase symbol names or capitalized (e.g., NAME, Name)
    const pattern = new RegExp(`\\b(${symbolNames.join('|')})\\b`, 'g');
    
    // Walk through text nodes
    const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null, false);
    const textNodes = [];
    while (walker.nextNode()) {
      // Skip if inside a link, code, or already processed element
      const parent = walker.currentNode.parentNode;
      if (parent && (
        parent.tagName === 'A' || 
        parent.tagName === 'CODE' ||
        parent.tagName === 'BUTTON' ||
        parent.classList?.contains('symbol-ref') ||
        parent.closest('a, code, button, .symbol-header, .symbol-nav-btn')
      )) {
        continue;
      }
      if (walker.currentNode.nodeValue.match(pattern)) {
        textNodes.push(walker.currentNode);
      }
    }
    
    textNodes.forEach(node => {
      const span = document.createElement('span');
      span.innerHTML = node.nodeValue.replace(pattern, (match) => {
        // Find the symbol by name (case-insensitive)
        const symbolKey = Object.keys(SYMBOL_DICTIONARY).find(
          k => SYMBOL_DICTIONARY[k].name.toUpperCase() === match.toUpperCase()
        );
        if (symbolKey) {
          const symbol = SYMBOL_DICTIONARY[symbolKey];
          // On click, open Strong's panel if available, otherwise go to symbol page
          const onclick = symbol.strongs && symbol.strongs.length > 0
            ? `if(typeof showStrongsPanel==='function'){showStrongsPanel('${symbol.strongs[0]}','','',event);}else{AppStore.dispatch({type:'SET_VIEW',view:'reader',params:{contentType:'symbols',symbol:'${symbolKey}'}})} return false;`
            : `AppStore.dispatch({type:'SET_VIEW',view:'reader',params:{contentType:'symbols',symbol:'${symbolKey}'}}); return false;`;
          return `<a href="/reader/symbols/${symbolKey}" 
            class="symbol-ref symbol-ref-inline" 
            data-symbol-key="${symbolKey}"
            data-symbol-name="${symbol.name}"
            data-symbol-meaning="${symbol.is2 || symbol.is}"
            data-symbol-sentence="${symbol.sentence.replace(/"/g, '&quot;')}"
            onclick="${onclick}"
          >${match}</a>`;
        }
        return match;
      });
      node.parentNode.replaceChild(span, node);
    });
    
    // Add tooltips to all newly created symbol refs
    container.querySelectorAll('.symbol-ref-inline').forEach(link => {
      const symbolKey = link.dataset.symbolKey;
      const symbol = SYMBOL_DICTIONARY[symbolKey];
      if (symbol) {
        this.addSymbolTooltip(link, symbol);
      }
    });
  },

  /**
   * Add mouseover tooltip to a symbol reference
   */
  addSymbolTooltip(element, symbol) {
    // Create tooltip on hover
    element.addEventListener('mouseenter', (e) => {
      // Remove any existing tooltip
      const existing = document.querySelector('.symbol-tooltip');
      if (existing) existing.remove();
      
      // Create tooltip
      const tooltip = document.createElement('div');
      tooltip.className = 'symbol-tooltip';
      tooltip.innerHTML = `
        <div class="symbol-tooltip-header">${symbol.name}</div>
        <div class="symbol-tooltip-meaning">${symbol.is2 || symbol.is}</div>
        <div class="symbol-tooltip-sentence">${symbol.sentence}</div>
      `;
      document.body.appendChild(tooltip);
      
      // Position tooltip near the element
      const rect = element.getBoundingClientRect();
      const tooltipRect = tooltip.getBoundingClientRect();
      
      let left = rect.left + window.scrollX;
      let top = rect.bottom + window.scrollY + 5;
      
      // Keep within viewport
      if (left + tooltipRect.width > window.innerWidth) {
        left = window.innerWidth - tooltipRect.width - 10;
      }
      if (left < 10) left = 10;
      
      // If tooltip would go below viewport, show above
      if (top + tooltipRect.height > window.innerHeight + window.scrollY) {
        top = rect.top + window.scrollY - tooltipRect.height - 5;
      }
      
      tooltip.style.left = left + 'px';
      tooltip.style.top = top + 'px';
      tooltip.style.opacity = '1';
    });
    
    element.addEventListener('mouseleave', () => {
      const tooltip = document.querySelector('.symbol-tooltip');
      if (tooltip) {
        tooltip.remove();
      }
    });
  },

  /**
   * Render Time Tested within the Bible frame (uses same header)
   * @param {object} state - App state
   * @param {object} derived - Derived state
   * @param {Element} container - Container element
   * @param {string} chapterId - Chapter ID to load
   * @param {string} section - Optional section anchor to scroll to
   */
  renderTimeTestedInBibleFrame(state, derived, container, chapterId, section) {
    // First render the Bible structure if not already present
    const existingPage = container.querySelector('#bible-explorer-page');
    if (!existingPage) {
      if (typeof BibleView !== 'undefined') {
        BibleView.renderStructure(container);
      }
    }
    
    // Update the content selector
    setTimeout(() => {
      if (typeof updateReaderContentSelector === 'function') {
        updateReaderContentSelector('timetested');
      }
      // Update chapter selector if a chapter is selected
      if (chapterId) {
        const chapterSelect = document.getElementById('timetested-chapter-select');
        if (chapterSelect) chapterSelect.value = chapterId;
      }
    }, 50);
    
    // Delegate to BookView for the actual content rendering
    const textArea = container.querySelector('#bible-explorer-text');
    if (textArea) {
      if (!chapterId) {
        // Show chapter index
        textArea.innerHTML = this.buildTimeTestedIndexHTML();
      } else {
        // Render the chapter using BookView's logic
        if (typeof BookView !== 'undefined' && typeof BookView.loadAndRenderChapter === 'function') {
          BookView.loadAndRenderChapter(chapterId, textArea, section);
        } else {
          // Fallback: create a modified state and let BookView render
          const bookState = {
            ...state,
            content: { ...state.content, params: { chapterId } }
          };
          if (typeof BookView !== 'undefined') {
            // BookView renders to the whole container, but we want just the text area
            // So we'll render a simplified version
            textArea.innerHTML = `<div class="loading">Loading chapter...</div>`;
            this.loadTimeTestedChapter(chapterId, textArea, section);
          }
        }
      }
    }
    
    // Update the chapter title
    const titleEl = container.querySelector('#bible-chapter-title');
    if (titleEl) {
      const chapter = TIME_TESTED_CHAPTERS?.find(c => c.id === chapterId);
      titleEl.textContent = chapter ? chapter.title : 'Time-Tested Tradition';
    }
    
    // Hide chapter navigation for TTT (or could add prev/next chapter)
    this.hideChapterNav(container);
  },

  /**
   * Hide Bible chapter navigation buttons
   */
  hideChapterNav(container) {
    const prevBtn = container.querySelector('#bible-prev-chapter');
    const nextBtn = container.querySelector('#bible-next-chapter');
    if (prevBtn) prevBtn.style.display = 'none';
    if (nextBtn) nextBtn.style.display = 'none';
  },

  /**
   * Show Bible chapter navigation buttons
   */
  showChapterNav(container) {
    const prevBtn = container.querySelector('#bible-prev-chapter');
    const nextBtn = container.querySelector('#bible-next-chapter');
    if (prevBtn) prevBtn.style.display = '';
    if (nextBtn) nextBtn.style.display = '';
  },

  /**
   * Build HTML for symbol index
   */
  buildSymbolIndexHTML() {
    const symbols = Object.entries(SYMBOL_DICTIONARY || {});
    return `
      <div class="reader-symbol-index">
        <header class="symbol-index-header">
          <h1>📖 Biblical Symbols</h1>
          <p>Understanding the symbolic language of Scripture</p>
        </header>
        
        <div class="symbol-index-grid">
          ${symbols.map(([key, symbol]) => `
            <button class="symbol-index-item" onclick="AppStore.dispatch({type:'SET_VIEW',view:'reader',params:{contentType:'symbols',symbol:'${key}'}})">
              <div class="symbol-index-name">${symbol.name}</div>
              <div class="symbol-index-meaning">${symbol.is2 || symbol.is}</div>
            </button>
          `).join('')}
        </div>
      </div>
    `;
  },

  /**
   * Build HTML for symbol content (displayed in Bible text area)
   */
  buildSymbolContentHTML(symbol, symbolKey) {
    const prevNext = this.getSymbolPrevNext(symbolKey);
    
    return `
      <div class="reader-symbol-content-inline">
        <nav class="reader-symbol-nav">
          ${prevNext.prev ? `<button class="symbol-nav-btn" onclick="AppStore.dispatch({type:'SET_VIEW',view:'reader',params:{contentType:'symbols',symbol:'${prevNext.prev}'}})">◀ ${prevNext.prevName}</button>` : '<span></span>'}
          ${prevNext.next ? `<button class="symbol-nav-btn" onclick="AppStore.dispatch({type:'SET_VIEW',view:'reader',params:{contentType:'symbols',symbol:'${prevNext.next}'}})>${prevNext.nextName} ▶</button>` : '<span></span>'}
        </nav>
        
        <header class="symbol-header">
          <h1>📖 ${symbol.name}</h1>
          <div class="symbol-words">
            <strong>Words:</strong> ${symbol.words.join(', ')}
          </div>
          ${symbol.strongs ? `
          <div class="symbol-strongs-list">
            <strong>Strong's:</strong> 
            ${symbol.strongs.map(s => `<button class="symbol-strongs-btn" onclick="showStrongsPanel('${s}', '', '', event)">${s}</button>`).join(' ')}
          </div>
          ` : ''}
        </header>
        
        <section class="symbol-meanings">
          <div class="meaning-block meaning-is">
            <div class="meaning-label">IS (What it represents):</div>
            <div class="meaning-value">${symbol.is}${symbol.is2 ? ' / ' + symbol.is2 : ''}</div>
          </div>
          
          ${symbol.does ? `
          <div class="meaning-block meaning-does">
            <div class="meaning-label">DOES (What it does):</div>
            <div class="meaning-value">${symbol.does}${symbol.does2 ? ' / ' + symbol.does2 : ''}</div>
          </div>
          ` : ''}
          
          <div class="meaning-block meaning-sentence">
            <div class="meaning-label">Full Meaning:</div>
            <p class="meaning-paragraph">${symbol.sentence}</p>
          </div>
          
          ${symbol.opposite ? `
          <div class="meaning-block meaning-opposite">
            <div class="meaning-label">Opposite:</div>
            <div class="meaning-value">${symbol.opposite}</div>
          </div>
          ` : ''}
        </section>
        
              </div>
    `;
  },

  /**
   * Build HTML for Time Tested index
   */
  buildTimeTestedIndexHTML() {
    const chapters = typeof TIME_TESTED_CHAPTERS !== 'undefined' ? TIME_TESTED_CHAPTERS : [];
    return `
      <div class="reader-ttt-index">
        <header class="ttt-index-header">
          <h1>📚 Time-Tested Tradition</h1>
          <p>The Renewed Biblical Calendar</p>
          <p class="ttt-author">By Daniel Larimer</p>
          <a class="ttt-pdf-download" href="/media/time-tested-tradition.pdf" download>
            <span class="icon">📥</span>
            <span>Download PDF</span>
          </a>
        </header>
        
        <div class="ttt-index-list">
          ${chapters.map(ch => `
            <button class="ttt-index-item" onclick="AppStore.dispatch({type:'SET_VIEW',view:'reader',params:{contentType:'timetested',chapterId:'${ch.id}'}})">
              <span class="ttt-chapter-title">${ch.title}</span>
            </button>
          `).join('')}
        </div>
      </div>
    `;
  },

  /**
   * Get prev/next chapter for navigation
   */
  getChapterPrevNext(currentId) {
    const chapters = typeof TIME_TESTED_CHAPTERS !== 'undefined' ? TIME_TESTED_CHAPTERS : [];
    const idx = chapters.findIndex(c => c.id === currentId);
    return {
      prev: idx > 0 ? chapters[idx - 1] : null,
      next: idx >= 0 && idx < chapters.length - 1 ? chapters[idx + 1] : null
    };
  },

  /**
   * Load Time Tested chapter content
   * @param {string} chapterId - Chapter ID to load
   * @param {Element} container - Container to render into
   * @param {string} section - Optional section anchor to scroll to (e.g., "years-of-high-priests")
   */
  async loadTimeTestedChapter(chapterId, container, section) {
    try {
      // Check if this is an extra chapter (stored in /extra/ folder)
      const chapter = TIME_TESTED_CHAPTERS?.find(c => c.id === chapterId);
      const folder = chapter?.folder || 'chapters';
      const response = await fetch(`/${folder}/${chapterId}.md`);
      if (!response.ok) throw new Error('Chapter not found');
      const markdown = await response.text();
      
      // Use the full renderMarkdown function for better formatting
      const html = this.renderMarkdown(markdown);
      
      // Get chapter title and prev/next navigation
      const chapterTitle = chapter ? chapter.title : 'Chapter';
      const nav = this.getChapterPrevNext(chapterId);
      
      container.innerHTML = `
        <div class="ttt-chapter-content">
          <h2 class="ttt-chapter-heading">${chapterTitle}</h2>
          
          <article class="ttt-chapter-body">
            ${html}
          </article>
          
          <nav class="ttt-chapter-nav ttt-chapter-nav-bottom">
            ${nav.prev ? `<button class="ttt-nav-btn" onclick="AppStore.dispatch({type:'SET_VIEW',view:'reader',params:{contentType:'timetested',chapterId:'${nav.prev.id}'}})">◀ ${nav.prev.title}</button>` : '<span></span>'}
            ${nav.next ? `<button class="ttt-nav-btn" onclick="AppStore.dispatch({type:'SET_VIEW',view:'reader',params:{contentType:'timetested',chapterId:'${nav.next.id}'}})">${nav.next.title} ▶</button>` : '<span></span>'}
          </nav>
        </div>
      `;
      
      // Make scripture references clickable (links to Bible reader)
      this.linkifyScriptureRefs(container);
      
      // Make symbol references interactive (links + tooltips)
      this.linkifySymbolRefs(container);
      
      // Scroll to section if specified
      if (section) {
        setTimeout(() => {
          this.scrollToSection(section, container);
        }, 100);
      }
      
    } catch (e) {
      container.innerHTML = `<div class="reader-error">Error loading chapter: ${e.message}</div>`;
    }
  },
  
  /**
   * Scroll to a section by ID within a container
   * Handles both exact ID match and heading text match
   * @param {string} sectionId - Section ID or heading slug
   * @param {Element} container - Container to search within
   */
  scrollToSection(sectionId, container) {
    // First try exact ID match
    let el = container.querySelector(`#${sectionId}`);
    
    // If not found, try to find a heading that matches the slug
    if (!el) {
      // Convert slug to regex pattern (e.g., "years-of-high-priests" -> /years\s+of\s+high\s+priests/i)
      const pattern = sectionId.replace(/-/g, '\\s+');
      const regex = new RegExp(pattern, 'i');
      
      // Search all headings
      const headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6');
      for (const heading of headings) {
        const text = heading.textContent.trim();
        // Also create a slug from the heading text
        const headingSlug = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        if (headingSlug === sectionId || regex.test(text)) {
          el = heading;
          break;
        }
      }
    }
    
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // Highlight briefly
      el.style.backgroundColor = 'rgba(212, 160, 23, 0.3)';
      setTimeout(() => {
        el.style.backgroundColor = '';
      }, 2000);
    }
  },

  /**
   * Render Symbol word study (standalone - legacy)
   */
  renderSymbol(state, derived, container, symbolKey) {
    if (!symbolKey) {
      // Show symbol index
      this.renderSymbolIndex(container);
      return;
    }
    
    const symbol = SYMBOL_DICTIONARY?.[symbolKey];
    if (!symbol) {
      container.innerHTML = `<div class="reader-error">Symbol "${symbolKey}" not found</div>`;
      return;
    }
    
    // Auto-open Strong's panel for the primary Strong's number
    if (symbol.strongs && symbol.strongs.length > 0) {
      const primaryStrongs = symbol.strongs[0];
      setTimeout(() => {
        if (typeof showStrongsPanel === 'function') {
          showStrongsPanel(primaryStrongs, '', '', null);
        }
      }, 100);
    }
    
    container.innerHTML = this.buildSymbolHTML(symbol, symbolKey);
    
    // Add click handlers for scripture links
    this.attachSymbolEventHandlers(container);
  },

  /**
   * Build HTML for a symbol word study
   */
  buildSymbolHTML(symbol, symbolKey) {
    const prevNext = this.getSymbolPrevNext(symbolKey);
    
    return `
      <div class="reader-symbol-view">
        <nav class="reader-symbol-nav">
          ${prevNext.prev ? `<button class="symbol-nav-btn" onclick="AppStore.dispatch({type:'SET_VIEW',view:'reader',params:{contentType:'symbols',symbol:'${prevNext.prev}'}})">◀ ${prevNext.prevName}</button>` : '<span class="symbol-nav-spacer"></span>'}
          <span class="symbol-nav-title">${symbol.name}</span>
          ${prevNext.next ? `<button class="symbol-nav-btn" onclick="AppStore.dispatch({type:'SET_VIEW',view:'reader',params:{contentType:'symbols',symbol:'${prevNext.next}'}})">▶ ${prevNext.nextName}</button>` : '<span class="symbol-nav-spacer"></span>'}
        </nav>
        
        <article class="reader-symbol-content">
          <header class="symbol-header">
            <h1>📖 ${symbol.name}</h1>
            <div class="symbol-words">
              <strong>Words:</strong> ${symbol.words.join(', ')}
            </div>
            ${symbol.strongs ? `
            <div class="symbol-strongs-list">
              <strong>Strong's:</strong> 
              ${symbol.strongs.map(s => `<button class="symbol-strongs-btn" onclick="showStrongsPanel('${s}', '', '', event)">${s}</button>`).join(' ')}
            </div>
            ` : ''}
          </header>
          
          <section class="symbol-meanings">
            <div class="meaning-block meaning-is">
              <div class="meaning-label">IS (What it represents):</div>
              <div class="meaning-value">${symbol.is}${symbol.is2 ? ' / ' + symbol.is2 : ''}</div>
            </div>
            
            ${symbol.does ? `
            <div class="meaning-block meaning-does">
              <div class="meaning-label">DOES (What it does):</div>
              <div class="meaning-value">${symbol.does}${symbol.does2 ? ' / ' + symbol.does2 : ''}</div>
            </div>
            ` : ''}
            
            <div class="meaning-block meaning-sentence">
              <div class="meaning-label">Full Meaning:</div>
              <p class="meaning-paragraph">${symbol.sentence}</p>
            </div>
            
            ${symbol.opposite ? `
            <div class="meaning-block meaning-opposite">
              <div class="meaning-label">Opposite:</div>
              <div class="meaning-value">${symbol.opposite}</div>
            </div>
            ` : ''}
          </section>
          
          ${symbol.link ? `
          <section class="symbol-full-study">
            <a href="${symbol.link}" class="full-study-link" target="_blank">
              📚 View Full Word Study (Markdown)
            </a>
          </section>
          ` : ''}
        </article>
      </div>
    `;
  },

  /**
   * Get previous and next symbols for navigation
   */
  getSymbolPrevNext(currentKey) {
    const keys = Object.keys(SYMBOL_DICTIONARY || {});
    const currentIndex = keys.indexOf(currentKey);
    
    return {
      prev: currentIndex > 0 ? keys[currentIndex - 1] : null,
      prevName: currentIndex > 0 ? SYMBOL_DICTIONARY[keys[currentIndex - 1]]?.name : null,
      next: currentIndex < keys.length - 1 ? keys[currentIndex + 1] : null,
      nextName: currentIndex < keys.length - 1 ? SYMBOL_DICTIONARY[keys[currentIndex + 1]]?.name : null
    };
  },

  /**
   * Render symbol index (list of all symbols)
   */
  renderSymbolIndex(container) {
    const symbols = Object.entries(SYMBOL_DICTIONARY || {});
    
    container.innerHTML = `
      <div class="reader-symbol-index">
        <header class="symbol-index-header">
          <h1>📖 Biblical Symbols</h1>
          <p>Understanding the symbolic language of Scripture</p>
        </header>
        
        <div class="symbol-index-grid">
          ${symbols.map(([key, symbol]) => `
            <button class="symbol-index-item" onclick="AppStore.dispatch({type:'SET_VIEW',view:'reader',params:{contentType:'symbols',symbol:'${key}'}})">
              <div class="symbol-index-name">${symbol.name}</div>
              <div class="symbol-index-meaning">${symbol.is2 || symbol.is}</div>
            </button>
          `).join('')}
        </div>
      </div>
    `;
  },

  /**
   * Attach event handlers for symbol content (scripture links, etc.)
   */
  attachSymbolEventHandlers(container) {
    // Future: make scripture references clickable
  },

  /**
   * Render Time Tested book chapter - delegates to BookView
   */
  renderTimeTested(state, derived, container, chapterId) {
    // Create a modified state with the expected params for BookView
    const bookState = {
      ...state,
      content: {
        ...state.content,
        params: {
          ...state.content.params,
          chapterId: chapterId
        }
      }
    };
    
    if (typeof BookView !== 'undefined') {
      BookView.render(bookState, derived, container);
    } else {
      container.innerHTML = '<div class="reader-error">Book reader not available</div>';
    }
  }
};

// Register with ContentManager when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  if (typeof ContentManager !== 'undefined') {
    ContentManager.registerView('reader', ReaderView);
  }
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ReaderView;
}
