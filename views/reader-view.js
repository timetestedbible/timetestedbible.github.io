/**
 * ReaderView - Unified Reader for Bible, Symbols, and Time Tested Book
 * 
 * URL Structure:
 *   /reader/bible/kjv/Genesis/1     → Bible chapter
 *   /reader/symbols/tree            → Symbol study
 *   /reader/words/H2320             → Word study (lexical)
 *   /reader/numbers/666              → Number study (symbolic meaning of numbers)
 *   /reader/timetested/chapter-slug  → Time Tested book chapter
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
  /** Cache of Time Tested chapter HTML by chapterId to avoid "Loading chapter..." on revisit */
  _chapterCache: new Map(),

  init() {
    console.log('[ReaderView] init');
    
    // Delegate to BibleView init if it exists
    if (typeof BibleView !== 'undefined' && BibleView.init) {
      BibleView.init();
    }
  },

  cleanup() {
    console.log('[ReaderView] cleanup');
    
    // Disconnect scroll spy observer
    this.teardownScrollSpy();
    
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

  /**
   * Render view-specific controls into the global sub-nav bar.
   * Delegates to BibleView which owns the selector DOM.
   * Not shown on the reader landing page (no contentType).
   */
  renderSubNav(state, derived, container) {
    const contentType = state?.content?.params?.contentType;
    if (!contentType) return; // Landing page — no sub-nav
    if (contentType === 'blog') return; // Blog posts — no sub-nav
    
    if (typeof BibleView !== 'undefined' && BibleView.renderSubNav) {
      BibleView.renderSubNav(state, derived, container);
    }
  },

  render(state, derived, container) {
    this.container = container;
    
    const params = state.content?.params || {};
    const contentType = params.contentType;

    // Restore default OG meta tags when navigating away from blog
    if (contentType !== 'blog' && this._blogMetaActive) {
      const defaultDesc = 'Bible study app with lunar calendar, Strong\'s concordance, interlinear Hebrew/Greek, word studies, and historical timeline.';
      const resetMeta = (prop, content) => {
        let el = document.querySelector(`meta[property="${prop}"]`) || document.querySelector(`meta[name="${prop}"]`);
        if (el) el.setAttribute('content', content);
      };
      resetMeta('og:title', 'Time Tested Bible');
      resetMeta('og:description', defaultDesc);
      resetMeta('og:image', 'https://timetested.bible/icons/icon-512.png');
      resetMeta('twitter:title', 'Time Tested Bible');
      resetMeta('twitter:description', defaultDesc);
      resetMeta('twitter:image', 'https://timetested.bible/icons/icon-512.png');
      this._blogMetaActive = false;
    }

    // Update document title based on current content
    {
      let pageTitle = 'Time Tested Bible';
      switch (contentType) {
        case 'bible':
          if (params.book && params.chapter) pageTitle = `${params.book} ${params.chapter} — Time Tested Bible`;
          else if (params.book) pageTitle = `${params.book} — Time Tested Bible`;
          break;
        case 'timetested':
          if (params.chapterId) {
            const name = (params.chapterId || '').replace(/^\d+_/, '').replace(/_/g, ' ');
            pageTitle = `${name} — Time Tested Bible`;
          }
          break;
        case 'blog':
          break; // handled in loadBlogPost
        case 'words':
          if (params.word) pageTitle = `${params.word} — Word Study — Time Tested Bible`;
          break;
        case 'symbols':
          if (params.symbol) pageTitle = `${params.symbol.replace(/-/g, ' ')} — Symbol Study — Time Tested Bible`;
          break;
        case 'verse-studies':
          if (params.study) {
            const vstudyMeta = (typeof VERSE_STUDY_INDEX !== 'undefined' ? VERSE_STUDY_INDEX : []).find(s => s.id === params.study);
            if (vstudyMeta) {
              pageTitle = `${vstudyMeta.ref} — ${vstudyMeta.title} — Time Tested Bible`;
            } else {
              pageTitle = `${params.study.replace(/-/g, ' ')} — Verse Study — Time Tested Bible`;
            }
          }
          break;
        case 'numbers':
          if (params.number) pageTitle = `${params.number} — Number Study — Time Tested Bible`;
          break;
        case 'philo':
          if (params.work) pageTitle = `${params.work.replace(/-/g, ' ')} — Philo — Time Tested Bible`;
          break;
        case 'apocrypha': {
          const apoBookName = this._APOCRYPHA_NAMES[params.book] || 'Apocrypha';
          const apoChTitle = params.book && params.chapter && this._CHAPTER_TITLES?.[params.book]?.[params.chapter];
          if (params.book && params.chapter) {
            pageTitle = `${apoBookName} ${params.chapter}${apoChTitle ? ' — ' + apoChTitle : ''} — Time Tested Bible`;
          } else if (params.book) {
            pageTitle = `${apoBookName} — Time Tested Bible`;
          } else {
            pageTitle = 'Apocrypha — Time Tested Bible';
          }
          break;
        }
        case 'multiverse':
          pageTitle = 'Multiverse View — Time Tested Bible';
          break;
      }
      if (contentType !== 'blog') document.title = pageTitle;
    }
    
    // If no contentType specified, show landing page
    if (!contentType) {
      const landingKey = 'reader:landing';
      const uiKey = `${state.ui?.strongsId || ''}`;
      const fullKey = `${landingKey}:ui:${uiKey}`;
      
      if (this._lastRenderKey === fullKey && container.querySelector('.reader-landing-page')) {
        return; // Already rendered
      }
      this._lastRenderKey = fullKey;
      
      this.renderLandingPage(state, derived, container);
      return;
    }
    
    // Not landing page - remove landing page class and reset html/body height
    document.body.classList.remove('reader-landing');
    document.documentElement.style.removeProperty('height');
    document.body.style.removeProperty('height');
    
    // Build a key for the current content to detect if we need to re-render
    let currentKey;
    switch (contentType) {
      case 'bible':
        currentKey = `bible:${params.translation}:${params.book}:${params.chapter}:${params.verse || ''}`;
        break;
      case 'multiverse':
        currentKey = `multiverse:${params.translation || getDefaultTranslation()}:${(params.multiverse || '').replace(/"/g, '')}`;
        break;
      case 'symbols':
        currentKey = `symbols:${params.symbol || 'index'}`;
        break;
      case 'symbols-article':
        currentKey = `symbols-article:${params.article || 'index'}`;
        break;
      case 'words':
        currentKey = `words:${params.word || 'index'}`;
        break;
      case 'verse-studies':
        currentKey = `verse-studies:${params.study || 'index'}`;
        break;
      case 'numbers':
        currentKey = `numbers:${params.number || 'index'}`;
        break;
      case 'timetested':
        currentKey = `timetested:${params.chapterId || 'index'}`;
        break;
      case 'books':
        currentKey = `books:${params.bookSlug || ''}:${params.chapterSlug || 'index'}`;
        break;
      case 'blog':
        currentKey = `blog:${params.slug || 'index'}`;
        break;
      case 'philo':
        // Key only on work — section changes scroll within the same rendered page
        currentKey = `philo:${params.work || 'index'}`;
        break;
      case 'josephus':
        // Key on work + book — section changes scroll within the same rendered book
        currentKey = `josephus:${params.work || 'index'}:${params.book || ''}`;
        break;
      case 'apocrypha':
        currentKey = `apocrypha:${params.book || 'index'}:${params.chapter || ''}`;
        break;
      default:
        currentKey = 'unknown';
    }
    
    // Check if we need to re-render (content actually changed)
    // Don't include strongsId in key — Strong's panel is UI-only,
    // shouldn't trigger content reload (which loses scroll position and destroys the panel)
    const uiKey = '';
    const fullKey = `${currentKey}:ui:${uiKey}`;
    
    if (this._lastRenderKey === fullKey && container.querySelector('#bible-explorer-page')) {
      // Content hasn't changed — but sync UI-only state (gematria, panels, Strong's)
      this._syncGematriaState(state.ui);
      if (typeof BibleView !== 'undefined' && BibleView.restoreUIState) {
        BibleView.restoreUIState(state.ui);
      }
      
      // For classics, check if section changed (scroll to it)
      if (contentType === 'philo' && params.work && params.section) {
        const anchor = container.querySelector('#section-' + params.section);
        if (anchor) anchor.scrollIntoView({ behavior: 'smooth', block: 'start' });
        // Sync section dropdown
        const sel = document.getElementById('classics-section-select');
        if (sel) sel.value = params.section;
      } else if (contentType === 'josephus' && params.book != null && params.chapter != null && params.section != null) {
        const anchor = container.querySelector('#section-' + params.book + '-' + params.chapter + '-' + params.section);
        if (anchor) anchor.scrollIntoView({ behavior: 'smooth', block: 'start' });
        const sel = document.getElementById('classics-section-select');
        if (sel) sel.value = params.book + '.' + params.chapter + '.' + params.section;
      } else if (contentType === 'apocrypha' && params.verse) {
        this._scrollToApocryphaVerse(container, params.verse);
      }
      return;
    }
    
    this._lastRenderKey = fullKey;
    
    console.log('[ReaderView] render contentType:', contentType, 'params:', params);
    
    // Track content type changes (but don't cleanup - we want Strong's panel to stay open)
    if (this.currentContentType !== contentType) {
      // Disconnect scroll spy when switching content types
      this.teardownScrollSpy();
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

      case 'multiverse':
        this.renderBible(state, derived, container);
        this.syncUIState(state.ui);
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
        setTimeout(() => {
          if (typeof updateReaderContentSelector === 'function') {
            updateReaderContentSelector('symbols');
          }
        }, 50);
        break;
        
      case 'symbols-article':
        this.renderSymbolArticleInBibleFrame(state, derived, container, params.article);
        break;
        
      case 'words':
        this.renderWordStudyInBibleFrame(state, derived, container, params.word);
        this.syncUIState(state.ui);
        setTimeout(() => {
          if (typeof updateReaderContentSelector === 'function') {
            updateReaderContentSelector('words');
          }
        }, 50);
        break;
        
      case 'verse-studies':
        this.renderVerseStudyInBibleFrame(state, derived, container, params.study);
        this.syncUIState(state.ui);
        setTimeout(() => {
          if (typeof updateReaderContentSelector === 'function') {
            updateReaderContentSelector('verse-studies');
          }
        }, 50);
        break;
        
      case 'numbers':
        this.renderNumberStudyInBibleFrame(state, derived, container, params.number);
        this.syncUIState(state.ui);
        setTimeout(() => {
          if (typeof updateReaderContentSelector === 'function') {
            updateReaderContentSelector('numbers');
          }
        }, 50);
        break;
        
      case 'timetested':
        this.renderTimeTestedInBibleFrame(state, derived, container, params.chapterId, params.section);
        // Sync UI state (Strong's panel) for non-Bible content
        this.syncUIState(state.ui);
        setTimeout(() => {
          if (typeof updateReaderContentSelector === 'function') {
            updateReaderContentSelector('timetested');
          }
        }, 50);
        break;

      case 'books':
        // "The Bible's Symbolic Language" (and future AsciiDoc books)
        this.renderBookInBibleFrame(state, derived, container, params.bookSlug, params.chapterSlug, params.section);
        this.syncUIState(state.ui);
        break;

      case 'blog': {
        // Render the Bible frame structure first (includes research panel)
        const blogState = { content: { params: { contentType: 'blog' } } };
        const existingBlogPage = container.querySelector('#bible-explorer-page');
        if (!existingBlogPage) {
          if (typeof BibleView !== 'undefined') {
            BibleView.renderStructure(container, blogState);
          }
        } else if (typeof BibleView !== 'undefined' && BibleView.syncSelectorVisibility) {
          BibleView.syncSelectorVisibility(blogState);
        }
        
        // Load blog content into the text area
        const blogTextArea = container.querySelector('#bible-explorer-text') || container.querySelector('.bible-text-area') || container;
        if (params.slug) {
          blogTextArea.innerHTML = `<div class="loading">Loading article...</div>`;
          this.loadBlogPost(params.slug, blogTextArea);
        } else {
          blogTextArea.innerHTML = `<div class="reader-error">No blog post specified.</div>`;
        }
        this.syncUIState(state.ui);
        break;
      }
        
      case 'philo':
        this.renderClassicsInBibleFrame(state, derived, container, 'philo', params);
        this.syncUIState(state.ui);
        setTimeout(() => {
          if (typeof updateReaderContentSelector === 'function') {
            updateReaderContentSelector('philo');
          }
        }, 50);
        break;
        
      case 'josephus':
        this.renderClassicsInBibleFrame(state, derived, container, 'josephus', params);
        this.syncUIState(state.ui);
        setTimeout(() => {
          if (typeof updateReaderContentSelector === 'function') {
            updateReaderContentSelector('josephus');
          }
        }, 50);
        break;

      case 'apocrypha':
        this.renderApocryphaInBibleFrame(state, derived, container, params);
        this.syncUIState(state.ui);
        setTimeout(() => {
          if (typeof updateReaderContentSelector === 'function') {
            updateReaderContentSelector('apocrypha');
          }
        }, 50);
        break;

      case 'people':
        // Future: People studies - for now, show landing page
        this.renderLandingPage(state, derived, container);
        setTimeout(() => {
          if (typeof updateReaderContentSelector === 'function') {
            updateReaderContentSelector('people');
          }
        }, 50);
        break;
        
      default:
        this.renderBible(state, derived, container);
    }
  },

  /**
   * Render landing page for /reader showing all available content types
   * Uses same pattern as TutorialView - just set innerHTML, let CSS handle scrolling
   */
  renderLandingPage(state, derived, container) {
    // Add body class for CSS scrolling rules (same pattern as view-tutorial)
    document.body.classList.add('reader-landing');
    
    // Override html/body height constraint to allow body scrolling
    // This is necessary because base CSS sets html, body { height: 100% }
    document.documentElement.style.setProperty('height', 'auto', 'important');
    document.body.style.setProperty('height', 'auto', 'important');
    
    // Get counts for each content type
    const symbolCount = typeof SYMBOL_DICTIONARY !== 'undefined'
      ? Object.values(SYMBOL_DICTIONARY).filter(symbol => symbol.recordType !== 'alias').length
      : 0;
    const wordStudyCount = typeof WORD_STUDY_DICTIONARY !== 'undefined' ? Object.keys(WORD_STUDY_DICTIONARY).length : 0;
    const numberStudyFiles = ['GEMATRIA', '666', '7', '40', '12', '3', '6', '10', '70', '1000']; // Common ones
    const chapterCount = typeof TIME_TESTED_CHAPTERS !== 'undefined' ? TIME_TESTED_CHAPTERS.length : 0;
    
    // Render directly to container - CSS handles scrolling
    container.innerHTML = `
      <div class="reader-landing-page">
        <header class="reader-landing-header">
          <h1>📖 Reader</h1>
          <p class="reader-landing-subtitle">Explore Scripture through multiple lenses</p>
        </header>
        
        <div class="reader-content-grid">
          <!-- Bible -->
          <div class="reader-content-card" onclick="AppStore.dispatch({type:'SET_VIEW',view:'reader',params:{contentType:'bible'}})">
            <div class="reader-card-icon">📜</div>
            <h2>Bible</h2>
            <p>Read Scripture with interlinear data, Strong's numbers, and symbol highlighting. Multiple translations available.</p>
            <button class="reader-card-btn">
              Open Bible →
            </button>
          </div>
          
          <!-- Symbols -->
          <div class="reader-content-card" onclick="AppStore.dispatch({type:'SET_VIEW',view:'reader',params:{contentType:'symbols'}})">
            <div class="reader-card-icon">🔑</div>
            <h2>Symbol Studies</h2>
            <p>Discover the symbolic meaning of words in Scripture. Scripture declares it teaches through symbols—unlock the hidden language.</p>
            <div class="reader-card-meta">${symbolCount} symbols</div>
            <button class="reader-card-btn">
              Browse Symbols →
            </button>
          </div>
          
          <!-- Word Studies -->
          <div class="reader-content-card" onclick="AppStore.dispatch({type:'SET_VIEW',view:'reader',params:{contentType:'words'}})">
            <div class="reader-card-icon">📚</div>
            <h2>Word Studies</h2>
            <p>Lexical and etymological studies of Hebrew/Greek words (Strong's). Understand the root meanings and usage patterns.</p>
            <div class="reader-card-meta">${wordStudyCount} studies</div>
            <button class="reader-card-btn">
              Browse Word Studies →
            </button>
          </div>
          
          <!-- Verse Studies -->
          <div class="reader-content-card" onclick="AppStore.dispatch({type:'SET_VIEW',view:'reader',params:{contentType:'verse-studies'}})">
            <div class="reader-card-icon">📖</div>
            <h2>Verse Studies</h2>
            <p>In-depth studies of specific verses — translation analysis, consonantal ambiguities, and patterns that connect across Scripture.</p>
            <div class="reader-card-meta">${typeof VERSE_STUDY_INDEX !== 'undefined' ? VERSE_STUDY_INDEX.length : 0} studies</div>
            <button class="reader-card-btn">
              Browse Verse Studies →
            </button>
          </div>
          
          <!-- Number Studies -->
          <div class="reader-content-card" onclick="AppStore.dispatch({type:'SET_VIEW',view:'reader',params:{contentType:'numbers'}})">
            <div class="reader-card-icon">🔢</div>
            <h2>Number Studies</h2>
            <p>Symbolic meaning of numbers in Scripture—an extension of symbol studies. Explore gematria and numerical patterns.</p>
            <div class="reader-card-meta">Multiple studies</div>
            <button class="reader-card-btn">
              Browse Number Studies →
            </button>
          </div>
          
          <!-- Time Tested Tradition -->
          <div class="reader-content-card" onclick="AppStore.dispatch({type:'SET_VIEW',view:'reader',params:{contentType:'timetested'}})">
            <div class="reader-card-icon">📘</div>
            <h2>Time-Tested Tradition</h2>
            <p>The Renewed Biblical Calendar. A comprehensive study of biblical timekeeping, appointed times, and calendar principles.</p>
            <div class="reader-card-meta">${chapterCount} chapters</div>
            <button class="reader-card-btn">
              Read Book →
            </button>
          </div>
          
          <!-- Classics: Philo -->
          <div class="reader-content-card" onclick="AppStore.dispatch({type:'SET_VIEW',view:'reader',params:{contentType:'philo'}})">
            <div class="reader-card-icon">🏛️</div>
            <h2>Philo of Alexandria</h2>
            <p>First-century Jewish philosopher. Allegorical commentaries on the Torah, referenced throughout the book for calendar and Sabbath evidence.</p>
            <button class="reader-card-btn">
              Browse Philo →
            </button>
          </div>
          
          <!-- Classics: Josephus -->
          <div class="reader-content-card" onclick="AppStore.dispatch({type:'SET_VIEW',view:'reader',params:{contentType:'josephus'}})">
            <div class="reader-card-icon">🏛️</div>
            <h2>Josephus</h2>
            <p>First-century Jewish historian. Antiquities, Jewish War, Against Apion, and Life — primary sources for Second Temple period history.</p>
            <button class="reader-card-btn">
              Browse Josephus →
            </button>
          </div>
          
          <!-- Apocrypha -->
          <div class="reader-content-card" onclick="AppStore.dispatch({type:'SET_VIEW',view:'reader',params:{contentType:'apocrypha'}})">
            <div class="reader-card-icon">📜</div>
            <h2>Apocrypha</h2>
            <p>Extra-biblical texts: 1 Enoch, Jubilees, and Jasher. Ancient sources frequently referenced alongside Scripture.</p>
            <button class="reader-card-btn">
              Browse Apocrypha →
            </button>
          </div>
        </div>
        
        <section class="reader-landing-features">
          <h2>Features</h2>
          <ul class="reader-features-list">
            <li>📖 <strong>Interlinear Bible</strong> with Strong's numbers and original language text</li>
            <li>🔍 <strong>Symbol highlighting</strong> - words with symbolic meaning are automatically highlighted</li>
            <li>📚 <strong>Integrated studies</strong> - click symbols, Strong's numbers, or scripture references to explore</li>
            <li>🔢 <strong>Gematria calculator</strong> - explore numerical values of Hebrew and Greek words</li>
            <li>🔗 <strong>Cross-references</strong> - seamless navigation between Bible, symbols, words, and chapters</li>
          </ul>
        </section>
      </div>
    `;
    
    // Update title
    const titleEl = container.querySelector('#bible-chapter-title');
    if (titleEl) titleEl.textContent = 'Reader';
    this.hideChapterNav(container);
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
    
    const currentStrongsOpen = document.getElementById('research-panel')?.classList.contains('open');
    
    // If URL has strongsId and panel isn't showing it, open it
    if (ui.strongsId && this._currentStrongsId !== ui.strongsId) {
      this._currentStrongsId = ui.strongsId;
      setTimeout(() => {
        if (typeof showStrongsPanel === 'function') {
          // Pass skipDispatch=true to prevent re-dispatching to AppStore (we're syncing FROM state)
          showStrongsPanel(ui.strongsId, '', '', null, true);
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
    
    // Sync gematria expanded state
    this._syncGematriaState(ui);
  },
  
  /**
   * Sync gematria expanded state with DOM (runs on every state change, even early returns)
   */
  _syncGematriaState(ui) {
    if (!ui) return;
    const gematriaRelated = document.getElementById('gematria-related');
    if (gematriaRelated) {
      const expanded = !!ui.gematriaExpanded;
      gematriaRelated.style.display = expanded ? 'block' : 'none';
      const expandIcon = gematriaRelated.closest('.strongs-gematria-section')?.querySelector('.strongs-gematria-expand');
      if (expandIcon) expandIcon.textContent = expanded ? '▲' : '▼';
    }
  },

  /**
   * Render Symbol within the Bible frame (uses same header)
   */
  renderSymbolInBibleFrame(state, derived, container, symbolKey) {
    // First render the Bible structure if not already present
    const symbolState = { content: { params: { contentType: 'symbols' } } };
    const existingPage = container.querySelector('#bible-explorer-page');
    if (!existingPage) {
      if (typeof BibleView !== 'undefined') {
        BibleView.renderStructure(container, symbolState);
      }
    } else if (typeof BibleView !== 'undefined' && BibleView.syncSelectorVisibility) {
      BibleView.syncSelectorVisibility(symbolState);
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
          
          // Strong's panel only opens when user clicks a Strong's button
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
   * Render Symbol Article (like HOW-SCRIPTURE-TEACHES.md) within the Bible frame
   */
  renderSymbolArticleInBibleFrame(state, derived, container, articleName) {
    // First render the Bible structure if not already present
    const symbolState = { content: { params: { contentType: 'symbols-article' } } };
    const existingPage = container.querySelector('#bible-explorer-page');
    if (!existingPage) {
      if (typeof BibleView !== 'undefined') {
        BibleView.renderStructure(container, symbolState);
      }
    } else if (typeof BibleView !== 'undefined' && BibleView.syncSelectorVisibility) {
      BibleView.syncSelectorVisibility(symbolState);
    }
    
    // Update the content selector to show symbols
    setTimeout(() => {
      if (typeof updateReaderContentSelector === 'function') {
        updateReaderContentSelector('symbols');
      }
    }, 50);
    
    // Render article content into the text area
    const textArea = container.querySelector('#bible-explorer-text');
    if (textArea) {
      // Show loading state
      const articleTitles = {
        'HOW-SCRIPTURE-TEACHES': 'How Scripture Teaches',
        'WHY-PARABLES': 'Why Parables?',
        'METHODOLOGY': 'Human Study Methodology',
        'AI-METHODOLOGY': 'AI-Assisted Study Methodology'
      };
      const displayTitle = articleTitles[articleName] || articleName;
      
      textArea.innerHTML = `
        <div class="reader-symbol-article">
          <nav class="reader-symbol-nav">
            <button class="symbol-nav-btn" onclick="AppStore.dispatch({type:'SET_VIEW',view:'reader',params:{contentType:'symbols'}})">
              ← Back to Symbol Dictionary
            </button>
          </nav>
          <div id="symbol-article-content" class="symbol-article-content">
            <div class="symbol-study-loading">Loading article...</div>
          </div>
        </div>
      `;
      
      this.loadSymbolArticle(articleName, textArea);
    }
    
    // Update the chapter title
    const titleEl = container.querySelector('#bible-chapter-title');
    if (titleEl) {
      const articleTitles = {
        'HOW-SCRIPTURE-TEACHES': 'How Scripture Teaches',
        'WHY-PARABLES': 'Why Parables?',
        'METHODOLOGY': 'Human Study Methodology',
        'AI-METHODOLOGY': 'AI-Assisted Study Methodology'
      };
      titleEl.textContent = articleTitles[articleName] || articleName;
    }
    
    // Hide chapter navigation
    this.hideChapterNav(container);
  },

  /**
   * Load and render a symbol article markdown file
   */
  async loadSymbolArticle(articleName, container) {
    const articleContainer = container.querySelector('#symbol-article-content');
    if (!articleContainer) return;
    
    try {
      // All symbol articles are now in /symbols/ folder
      const response = await fetch(`/symbols/${articleName}.md`);
      
      if (!response.ok) {
        throw new Error(`Article not found: ${articleName}`);
      }
      
      const markdown = await response.text();
      const html = this.renderMarkdown(markdown);
      
      articleContainer.innerHTML = `<div class="symbol-article-body">${html}</div>`;
      
      // Make scripture references clickable
      this.linkifyScriptureRefs(articleContainer);
      
      // Make symbol references interactive
      this.linkifySymbolRefs(articleContainer);
      
      // Intercept internal reader links (symbols-article, symbols) so they use SPA navigation
      this.linkifyReaderLinks(articleContainer);
      
      // Scroll spy + deep-link into hash heading
      const scrollRoot = container.closest('#bible-explorer-text') || container;
      this.setupScrollSpy(scrollRoot);
      this.scrollToHashHeading(scrollRoot);
      
    } catch (e) {
      console.error('[ReaderView] Error loading symbol article:', e);
      articleContainer.innerHTML = `<div class="reader-error">Could not load article: ${e.message}</div>`;
    }
  },

  /**
   * Render Word Study (lexical/etymological study of a Hebrew/Greek word) in the reader frame.
   * Distinct from symbol studies: word studies cover root, usage, translation; symbol studies cover what a term represents.
   */
  renderWordStudyInBibleFrame(state, derived, container, wordId) {
    const existingPage = container.querySelector('#bible-explorer-page');
    if (!existingPage && typeof BibleView !== 'undefined') {
      // Pass state with contentType: 'words' so selectors are hidden
      BibleView.renderStructure(container, { content: { params: { contentType: 'words' } } });
    } else if (existingPage && typeof BibleView !== 'undefined' && BibleView.syncSelectorVisibility) {
      // Sync selector visibility if structure already exists
      BibleView.syncSelectorVisibility({ content: { params: { contentType: 'words' } } });
    }
    const textArea = container.querySelector('#bible-explorer-text');
    if (!textArea) return;
    if (!wordId) {
      // Index: list all word studies (from WORD_STUDY_DICTIONARY if available)
      const studies = typeof WORD_STUDY_DICTIONARY !== 'undefined'
        ? Object.values(WORD_STUDY_DICTIONARY).filter((s, i, a) => a.findIndex(x => x.strongs === s.strongs) === i)
        : [];
      textArea.innerHTML = `
        <div class="reader-word-study-index">
          <nav class="reader-symbol-nav">
            <button class="symbol-nav-btn" onclick="AppStore.dispatch({type:'SET_VIEW',view:'reader',params:{}})">
              ← Back to Reader
            </button>
          </nav>
          <h1>📚 Word Studies</h1>
          <p class="word-study-index-intro">Lexical and etymological studies of Hebrew/Greek words (Strong's). Distinct from <strong>symbol studies</strong>, which ask what a term <em>represents</em> in Scripture.</p>
          <div class="word-study-index-list">
            ${studies.length ? studies.sort((a, b) => (a.strongs || '').localeCompare(b.strongs || '')).map(s => `
              <button class="word-study-index-item" onclick="AppStore.dispatch({type:'SET_VIEW',view:'reader',params:{contentType:'words',word:'${s.strongs}'}})">
                <span class="word-study-strongs">${s.strongs}</span>
                <span class="word-study-lemma">${s.lemma || ''}</span>
                <span class="word-study-summary">${(s.summary || '').slice(0, 80)}…</span>
              </button>
            `).join('') : '<p>No word studies in dictionary yet. Word studies are opened from the Bible when you click a Strong\'s number that has an associated study.</p>'}
          </div>
        </div>
      `;
    } else {
      textArea.innerHTML = `
        <div class="reader-word-study">
          <nav class="reader-symbol-nav">
            <button class="symbol-nav-btn" onclick="AppStore.dispatch({type:'SET_VIEW',view:'reader',params:{contentType:'words'}})">
              ← Back to Word Studies
            </button>
          </nav>
          <div id="word-study-content" class="word-study-content">
            <div class="symbol-study-loading">Loading word study...</div>
          </div>
        </div>
      `;
      this.loadWordStudy(wordId, textArea);
    }
    const titleEl = container.querySelector('#bible-chapter-title');
    if (titleEl) titleEl.textContent = wordId ? `Word: ${wordId}` : 'Word Studies';
    this.hideChapterNav(container);
  },

  async loadWordStudy(wordId, container) {
    const contentEl = container.querySelector('#word-study-content');
    if (!contentEl) return;

    // Check dictionary for redirect — some entries (e.g. root verbs) link
    // to a combined study under a different Strong's number
    if (typeof WORD_STUDY_DICTIONARY !== 'undefined' && WORD_STUDY_DICTIONARY[wordId]) {
      const entry = WORD_STUDY_DICTIONARY[wordId];
      const linkMatch = (entry.link || '').match(/\/reader\/words\/([^/?#]+)/);
      if (linkMatch && linkMatch[1].toUpperCase() !== wordId.toUpperCase()) {
        // Defer redirect to avoid dispatching from within a render cycle
        queueMicrotask(() => {
          AppStore.dispatch({
            type: 'SET_VIEW',
            view: 'reader',
            params: { contentType: 'words', word: linkMatch[1].toUpperCase() }
          });
        });
        return;
      }
    }

    try {
      const response = await fetch(`/words/${wordId}.md`);
      if (!response.ok) throw new Error(`Word study not found: ${wordId}`);
      const markdown = await response.text();
      const html = this.renderMarkdown(markdown);
      contentEl.innerHTML = `<div class="word-study-body">${html}</div>`;
      this.linkifyScriptureRefs(contentEl);
      this.linkifyReaderLinks(contentEl);
      // Scroll spy + deep-link into hash heading
      const scrollRoot = container.closest('#bible-explorer-text') || container;
      this.setupScrollSpy(scrollRoot);
      this.scrollToHashHeading(scrollRoot);
    } catch (e) {
      console.error('[ReaderView] Error loading word study:', e);
      contentEl.innerHTML = `<div class="reader-error">Could not load word study: ${e.message}</div>`;
    }
  },

  /**
   * Render verse study in Bible frame (same pattern as word studies)
   * Verse studies are in-depth articles attached to specific verses,
   * with optional alternative translations.
   */
  renderVerseStudyInBibleFrame(state, derived, container, studyId) {
    const existingPage = container.querySelector('#bible-explorer-page');
    if (!existingPage && typeof BibleView !== 'undefined') {
      BibleView.renderStructure(container, { content: { params: { contentType: 'verse-studies' } } });
    } else if (existingPage && typeof BibleView !== 'undefined' && BibleView.syncSelectorVisibility) {
      BibleView.syncSelectorVisibility({ content: { params: { contentType: 'verse-studies' } } });
    }
    const textArea = container.querySelector('#bible-explorer-text');
    if (!textArea) return;
    if (!studyId) {
      // Index: list all verse studies with three sort orders
      const studies = typeof VERSE_STUDY_INDEX !== 'undefined' ? VERSE_STUDY_INDEX : [];

      const byBible = [...studies].sort((a, b) =>
        typeof Bible !== 'undefined' && Bible.compareRefs ? Bible.compareRefs(a.ref, b.ref) : 0
      );

      const byRank = [...studies].sort((a, b) => {
        const ra = typeof getVstudyRank === 'function' ? getVstudyRank(a.id) : 0;
        const rb = typeof getVstudyRank === 'function' ? getVstudyRank(b.id) : 0;
        return rb - ra;
      });

      const renderList = (list) => list.map(s => `
        <button class="word-study-index-item" onclick="AppStore.dispatch({type:'SET_VIEW',view:'reader',params:{contentType:'verse-studies',study:'${s.id}'}})">
          <span class="word-study-strongs">${s.ref}</span>
          <span class="word-study-summary">${s.title}</span>
          <span class="word-study-summary" style="opacity:0.7;font-size:0.85em;margin-top:4px;">${s.desc}</span>
        </button>
      `).join('');

      const groupOrder = ['Torah Eternal', 'Clean and Unclean', 'Nature of Hell', 'Second Death Sources', 'Prophecy', 'Eden and Creation', 'Other'];
      const getGroups = (s) => {
        if (Array.isArray(s.groups)) return s.groups;
        if (typeof s.groups === 'string') return [s.groups];
        if (typeof s.group === 'string') return [s.group];
        return ['Other'];
      };
      const renderGrouped = (list) => {
        const groups = {};
        for (const s of list) {
          for (const g of getGroups(s)) {
            if (!groups[g]) groups[g] = [];
            groups[g].push(s);
          }
        }
        let html = '';
        const allGroups = [...groupOrder, ...Object.keys(groups).filter(g => !groupOrder.includes(g))];
        for (const g of allGroups) {
          if (!groups[g] || groups[g].length === 0) continue;
          const sorted = [...groups[g]].sort((a, b) =>
            typeof Bible !== 'undefined' && Bible.compareRefs ? Bible.compareRefs(a.ref, b.ref) : 0
          );
          const count = sorted.length;
          const gid = 'vsg-' + g.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
          html += `<div class="symbol-topic-group">`;
          html += `<h3 class="symbol-topic-heading vstudy-group-toggle" onclick="var el=document.getElementById('${gid}');var arr=this.querySelector('.vstudy-group-arrow');if(el.style.display==='none'){el.style.display='';arr.textContent='▾'}else{el.style.display='none';arr.textContent='▸'}" style="cursor:pointer;user-select:none;display:flex;align-items:center;gap:8px;"><span class="vstudy-group-arrow" style="font-size:0.8em;opacity:0.5;">▾</span>${g}<span style="font-size:0.75em;opacity:0.5;font-weight:400;margin-left:4px;">(${count})</span></h3>`;
          html += `<div class="word-study-index-list" id="${gid}">${renderList(sorted)}</div></div>`;
        }
        return html;
      };

      const sortClick = `(function(mode, btn) {
        document.getElementById('vstudy-list-bible').style.display = mode === 'bible' ? '' : 'none';
        document.getElementById('vstudy-list-rank').style.display = mode === 'rank' ? '' : 'none';
        document.getElementById('vstudy-list-topic').style.display = mode === 'topic' ? '' : 'none';
        btn.parentElement.querySelectorAll('.symbol-sort-btn').forEach(function(b) { b.classList.remove('active'); });
        btn.classList.add('active');
      })`;

      textArea.innerHTML = `
        <div class="reader-word-study-index">
          <nav class="reader-symbol-nav">
            <button class="symbol-nav-btn" onclick="AppStore.dispatch({type:'SET_VIEW',view:'reader',params:{}})">
              ← Back to Reader
            </button>
          </nav>
          <h1>Verse Studies</h1>
          <p class="word-study-index-intro">In-depth studies attached to specific verses — examining translation choices, Hebrew gospel evidence, and patterns that cross-reference multiple passages.</p>
          <div class="symbol-sort-controls" style="margin-bottom:var(--spacing-md)">
            <button class="symbol-sort-btn active" onclick="${sortClick}('topic', this)">By Topic</button>
            <button class="symbol-sort-btn" onclick="${sortClick}('bible', this)">Bible Order</button>
            <button class="symbol-sort-btn" onclick="${sortClick}('rank', this)">By Relevance</button>
          </div>
          <div id="vstudy-list-topic">
            ${renderGrouped(studies)}
          </div>
          <div class="word-study-index-list" id="vstudy-list-bible" style="display:none">
            ${renderList(byBible)}
          </div>
          <div class="word-study-index-list" id="vstudy-list-rank" style="display:none">
            ${renderList(byRank)}
          </div>
        </div>
      `;
    } else {
      textArea.innerHTML = `
        <div class="reader-word-study">
          <nav class="reader-symbol-nav">
            <button class="symbol-nav-btn" onclick="AppStore.dispatch({type:'SET_VIEW',view:'reader',params:{contentType:'verse-studies'}})">
              ← Back to Verse Studies
            </button>
          </nav>
          <div id="verse-study-content" class="word-study-content">
            <div class="symbol-study-loading">Loading verse study...</div>
          </div>
        </div>
      `;
      this.loadVerseStudy(studyId, textArea);
    }
    const titleEl = container.querySelector('#bible-chapter-title');
    if (titleEl) {
      if (studyId) {
        const vstudyMeta = (typeof VERSE_STUDY_INDEX !== 'undefined' ? VERSE_STUDY_INDEX : []).find(s => s.id === studyId);
        titleEl.textContent = vstudyMeta ? `${vstudyMeta.ref} — ${vstudyMeta.title}` : `Verse Study: ${studyId}`;
      } else {
        titleEl.textContent = 'Verse Studies';
      }
    }
    this.hideChapterNav(container);
  },

  async loadVerseStudy(studyId, container) {
    const contentEl = container.querySelector('#verse-study-content');
    if (!contentEl) return;
    try {
      let articleHtml;

      // Path 1: Use cached article from Jekyll page (initial load)
      if (window.__jekyllArticle && window.__jekyllArticle.type === 'verse') {
        articleHtml = window.__jekyllArticle.html;
        delete window.__jekyllArticle;
      }

      // Path 2: Try Jekyll collection at /research/verses/{key}/
      if (!articleHtml) {
        const jekyllResponse = await fetch(`/research/verses/${studyId}/`);
        if (jekyllResponse.ok) {
          const pageHtml = await jekyllResponse.text();
          const doc = new DOMParser().parseFromString(pageHtml, 'text/html');
          const article = doc.querySelector('.verse-study-content');
          if (article) articleHtml = article.innerHTML;
        }
      }

      // Path 3: Legacy — try words/ directory (H369, DANIEL-9), then symbols/
      if (!articleHtml) {
        let response = await fetch(`/words/${studyId}.md`);
        if (!response.ok) {
          response = await fetch(`/symbols/${studyId}.md`);
        }
        if (response.ok) {
          const markdown = await response.text();
          articleHtml = this.renderMarkdown(markdown);
        }
      }

      if (!articleHtml) throw new Error(`Verse study not found: ${studyId}`);

      contentEl.innerHTML = `<div class="word-study-body symbol-article-body">${articleHtml}</div>`;
      this.processStudyMarkup(contentEl);
      this.linkifyScriptureRefs(contentEl);
      this.linkifySymbolRefs(contentEl);
      this.linkifyReaderLinks(contentEl);
      const scrollRoot = container.closest('#bible-explorer-text') || container;
      this.setupScrollSpy(scrollRoot);
      this.scrollToHashHeading(scrollRoot);
    } catch (e) {
      console.error('[ReaderView] Error loading verse study:', e);
      contentEl.innerHTML = `<div class="reader-error">Could not load verse study: ${e.message}</div>`;
    }
  },

  /**
   * Render number study in Bible frame (similar to word studies)
   */
  renderNumberStudyInBibleFrame(state, derived, container, numberId) {
    const existingPage = container.querySelector('#bible-explorer-page');
    if (!existingPage && typeof BibleView !== 'undefined') {
      // Pass state with contentType: 'numbers' so selectors are hidden
      BibleView.renderStructure(container, { content: { params: { contentType: 'numbers' } } });
    } else if (existingPage && typeof BibleView !== 'undefined' && BibleView.syncSelectorVisibility) {
      // Sync selector visibility if structure already exists
      BibleView.syncSelectorVisibility({ content: { params: { contentType: 'numbers' } } });
    }
    const textArea = container.querySelector('#bible-explorer-text');
    if (!textArea) return;
    
    if (!numberId) {
      // Index: list all number studies
      // We'll fetch the list dynamically, but for now show the landing page
      textArea.innerHTML = `
        <div class="reader-number-study-index">
          <nav class="reader-symbol-nav">
            <button class="symbol-nav-btn" onclick="AppStore.dispatch({type:'SET_VIEW',view:'reader',params:{}})">
              ← Back to Reader
            </button>
          </nav>
          <div id="number-study-content" class="number-study-content">
            <div class="symbol-study-loading">Loading number studies...</div>
          </div>
        </div>
      `;
      this.loadNumberStudy('index', textArea);
    } else {
      textArea.innerHTML = `
        <div class="reader-number-study">
          <nav class="reader-symbol-nav">
            <button class="symbol-nav-btn" onclick="AppStore.dispatch({type:'SET_VIEW',view:'reader',params:{contentType:'numbers'}})">
              ← Back to Number Studies
            </button>
          </nav>
          <div id="number-study-content" class="number-study-content">
            <div class="symbol-study-loading">Loading number study...</div>
          </div>
        </div>
      `;
      this.loadNumberStudy(numberId, textArea);
    }
    const titleEl = container.querySelector('#bible-chapter-title');
    if (titleEl) titleEl.textContent = numberId && numberId !== 'index' ? `Number: ${numberId}` : 'Number Studies';
    this.hideChapterNav(container);
  },

  async loadNumberStudy(numberId, container) {
    const contentEl = container.querySelector('#number-study-content');
    if (!contentEl) return;
    try {
      // For index, load numbers/index.md, otherwise load numbers/{numberId}.md
      const filename = numberId === 'index' ? 'index.md' : `${numberId}.md`;
      const response = await fetch(`/numbers/${filename}`);
      if (!response.ok) throw new Error(`Number study not found: ${numberId}`);
      const markdown = await response.text();
      const html = this.renderMarkdown(markdown);
      // On index, put Available Number Studies at the top (dropdown in header; grid here)
      if (numberId === 'index') {
        const listHtml = this.getNumberStudyListHTML();
        contentEl.innerHTML = `<div class="number-study-list">${listHtml}</div><div class="number-study-body">${html}</div>`;
      } else {
        contentEl.innerHTML = `<div class="number-study-body">${html}</div>`;
      }
      this.linkifyScriptureRefs(contentEl);
      this.linkifyReaderLinks(contentEl);
      // Scroll spy + deep-link into hash heading
      const scrollRoot = container.closest('#bible-explorer-text') || container;
      this.setupScrollSpy(scrollRoot);
      this.scrollToHashHeading(scrollRoot);
    } catch (e) {
      console.error('[ReaderView] Error loading number study:', e);
      contentEl.innerHTML = `<div class="reader-error">Could not load number study: ${e.message}</div>`;
    }
  },

  getNumberStudyListHTML() {
    const knownNumbers = [
      '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '17', '18',
      '20', '24', '30', '31', '40', '42', '49', '50', '70', '71', '77', '80',
      '100', '120', '144', '153', '490', '666', '1000', 'GEMATRIA'
    ];
    return `
      <h2>Available Number Studies</h2>
      <div class="number-study-grid">
        ${knownNumbers.map(num => `
          <button class="number-study-item" onclick="AppStore.dispatch({type:'SET_VIEW',view:'reader',params:{contentType:'numbers',number:'${num}'}})">
            <span class="number-study-value">${num}</span>
          </button>
        `).join('')}
      </div>
    `;
  },

  /**
   * Build summary HTML for a symbol (shown at top before full study)
   */
  _renderStrongsButtons(strongsList) {
    if (!strongsList || !strongsList.length) return '';
    return strongsList.map(s => {
      let label = s;
      if (typeof getStrongsEntry === 'function') {
        const entry = getStrongsEntry(s);
        if (entry) {
          label = (typeof extractGloss === 'function' ? extractGloss(entry, s) : '') || entry.xlit || s;
        }
      }
      return `<button class="symbol-strongs-btn" data-strongs="${s}" onmouseenter="if(typeof showStrongsButtonTooltip==='function')showStrongsButtonTooltip(this,event)" onmouseleave="if(typeof hideStrongsButtonTooltip==='function')hideStrongsButtonTooltip()" onclick="showStrongsPanel('${s}', '', '', event)">${label}</button>`;
    }).join(' ');
  },

  buildSymbolSummaryHTML(symbol, symbolKey) {
    return `
      <div class="reader-symbol-content-inline">
        <div id="symbol-study-content" class="symbol-study-content">
          <div class="symbol-study-loading">Loading study...</div>
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
      let articleHtml;
      
      // Path 1: Use cached article from Jekyll page (initial load —
      // the layout script cached the HTML before ContentManager replaced #content-area)
      if (window.__jekyllArticle && window.__jekyllArticle.type === 'symbol') {
        articleHtml = window.__jekyllArticle.html;
        delete window.__jekyllArticle;
      } else {
        // Path 2: SPA navigation — fetch from network
        const response = await fetch(`/research/symbols/${symbolKey}/`);
        
        if (!response.ok) {
          throw new Error(`Study not found: ${symbolKey}`);
        }
        
        const pageHtml = await response.text();
        const doc = new DOMParser().parseFromString(pageHtml, 'text/html');
        const article = doc.querySelector('.symbol-study-content');
        
        if (!article) {
          throw new Error(`No article content found for: ${symbolKey}`);
        }
        articleHtml = article.innerHTML;
      }
      
      studyContainer.innerHTML = `<div class="symbol-study-body symbol-article-body">${articleHtml}</div>`;
      
      // Process study markup ($symbol, H####/G####, abbreviated verse refs)
      this.processStudyMarkup(studyContainer);
      
      // Make full-name scripture references clickable (complements abbreviated refs above)
      this.linkifyScriptureRefs(studyContainer);
      
      // Make symbol references interactive (links + tooltips)
      this.linkifySymbolRefs(studyContainer);
      
      // Intercept internal reader links so they use SPA navigation
      this.linkifyReaderLinks(studyContainer);
      
      // Scroll spy + deep-link into hash heading
      const scrollRoot = container.closest('#bible-explorer-text') || container;
      this.setupScrollSpy(scrollRoot);
      this.scrollToHashHeading(scrollRoot);
      
    } catch (e) {
      console.error('[ReaderView] Error loading symbol study:', e);
      // Show the basic symbol info as fallback
      const symbol = SYMBOL_DICTIONARY?.[symbolKey];
      if (symbol) {
        studyContainer.innerHTML = `
          <div class="symbol-fallback">
            <div class="meaning-block meaning-is">
              <div class="meaning-label">Meaning:</div>
              <div class="meaning-value">${symbol.meaning}</div>
            </div>
            <div class="meaning-block meaning-sentence">
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
      
      // Support {#anchor-name} syntax in headings — strip from display, use as id
      html = html.replace(/<(h[1-6])([^>]*)>(.*?)\s*\{#([\w-]+)\}\s*<\/(h[1-6])>/g, '<$1$2 id="$4">$3</$5>');
      
      // Post-process: wrap citation lines in blockquotes with <cite> so CSS (e.g. text-align: right) applies
      // 1) When quote and citation are on consecutive lines, marked puts them in one <p>; split so citation gets <cite>
      html = html.replace(/<blockquote>([\s\S]*?)<\/blockquote>/g, (match, content) => {
        const withCite = content.replace(
          /<p>([\s\S]*?)(?:\n|<br>\s*)([—–-]{1,2}\s*.+?)<\/p>/g,
          '<p>$1</p><p><cite>$2</cite></p>'
        );
        return '<blockquote>' + withCite + '</blockquote>';
      });
      // 2) Citation-only paragraph (e.g. blank line between quote and citation in markdown)
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
   * Process study markup: $symbol refs, H####/G#### Strong's, and abbreviated verse references.
   * Used for both Jekyll static symbol-study pages and SPA-loaded markdown.
   * Handles all BOOK_NAME_MAP abbreviations and full names (with colon-required verse format).
   */
  processStudyMarkup(container) {
    // Helper: collect text nodes, skipping those inside interactive elements
    const collectTextNodes = (root, pattern) => {
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null, false);
      const nodes = [];
      while (walker.nextNode()) {
        const el = walker.currentNode.parentNode;
        if (el && (el.tagName === 'A' || el.tagName === 'CODE' || el.tagName === 'BUTTON' ||
            el.tagName === 'PRE' || el.closest?.('a, code, button, pre, .no-name-swap'))) continue;
        pattern.lastIndex = 0;
        if (pattern.test(walker.currentNode.nodeValue)) {
          nodes.push(walker.currentNode);
        }
      }
      return nodes;
    };

    // --- Pass 1: $symbol-key references ---
    // Two forms:  $wings      → display as dictionary name (e.g. "WINGS")
    //             $[name]     → display as written text, resolve as symbol (for use in quotes)
    {
      const symPattern = /\$\[([a-zA-Z][a-zA-Z0-9 -]*[a-zA-Z0-9])\]|\$([a-z][a-z0-9-]*)/g;
      const dict = typeof SYMBOL_DICTIONARY !== 'undefined' ? SYMBOL_DICTIONARY : {};

      // Alias map: maps unresolvable keys to their correct dictionary keys
      const SYMBOL_ALIASES = {
        'four-winds': 'four-horsemen', 'brass': 'bronze-brass',
        'skandalizo': 'skandalizo-stumble', 'whore': 'harlot', 'harlots': 'harlot',
        'thorn': 'thorns', 'thief': 'thief-in-night', 'beast': 'animal',
        'beasts': 'animal', 'stone': 'rock', 'rocks': 'rock', 'waters': 'water',
        'seas': 'sea', 'moon': 'new-moon', 'bride': 'marriage',
        'bridegroom': 'marriage', 'covenant': 'rock', 'wicked': 'wickedness',
        'earthquakes': 'earthquake', 'mountains': 'mountain', 'mount': 'mountain',
        'trees': 'tree', 'nations': 'sea', 'nation': 'sea', 'islands': 'island',
        'eagles': 'eagle', 'shepherds': 'shepherd', 'virgins': 'virgin',
        'cloud': 'clouds', 'trumpets': 'trumpet', 'nets': 'net',
        'snares': 'snare', 'idols': 'idolatry', 'idol': 'idolatry', 'seals': 'seal',
        'names': 'name', 'days': 'day', 'animals': 'animal', 'stars': 'sun-moon-stars',
        'sun': 'sun-moon-stars', 'peace': 'peace-shalom', 'curses': 'curse',
        'cursed': 'curse', 'wars-and-rumors-of-wars': 'wars-rumors',
        'wars and rumors of wars': 'wars-rumors', 'end': 'the-end',
        'earth': 'sea', 'kingdom': 'mountain', 'death': 'perpetual-sleep',
        'dead': 'perpetual-sleep', 'asleep': 'sleep', 'horse': 'four-horsemen',
        'vine': 'wine', 'olive': 'oil', 'fisherman': 'fish', 'pearl': 'sea',
        'pearls': 'sea', 'fear': 'alarmed-fear', 'booths': 'shadow',
        'morning': 'day', 'law': 'way', 'righteousness': 'truth',
        'faithfulness': 'faith', 'believed': 'believe', 'wilderness': 'highway',
        'woman': 'harlot', 'shepherd-king': 'shepherd', 'white': 'light',
        'wheat': 'bread', 'rest': 'sleep', 'life': 'light', 'spirit': 'wind',
        'flesh': 'bread', 'dust': 'sand', 'sorrows': 'birth-pains',
        'rod': 'sword', 'remnant': 'elect',
      };

      collectTextNodes(container, symPattern).forEach(node => {
        const span = document.createElement('span');
        symPattern.lastIndex = 0;
        span.innerHTML = node.nodeValue.replace(symPattern, (match, bracketKey, bareKey) => {
          const keepText = !!bracketKey;  // $[name] = keep display text as-is
          const rawKey = bracketKey || bareKey;
          // Normalize key: spaces → hyphens, lowercase for dictionary lookup
          let lookupKey = rawKey.replace(/\s+/g, '-').toLowerCase();
          // Strip trailing hyphens (malformed refs like $babylon-)
          lookupKey = lookupKey.replace(/-+$/, '');
          // Check aliases for unresolvable keys
          const aliasedKey = SYMBOL_ALIASES[lookupKey] || SYMBOL_ALIASES[rawKey.toLowerCase()];
          // Try: direct key → aliased key → strip trailing 's' for plurals
          let symbol = dict[lookupKey] || (aliasedKey && dict[aliasedKey]) || dict[rawKey];
          let resolvedKey = aliasedKey || lookupKey;
          if (!symbol && lookupKey.endsWith('s') && dict[lookupKey.slice(0, -1)]) {
            symbol = dict[lookupKey.slice(0, -1)];
            resolvedKey = lookupKey.slice(0, -1);
          }
          if (!symbol && typeof SYMBOL_WORD_INDEX !== 'undefined') {
            symbol = SYMBOL_WORD_INDEX[lookupKey.toLowerCase()] || SYMBOL_WORD_INDEX[rawKey.toLowerCase()];
            if (symbol && symbol.key) resolvedKey = symbol.key;
          }
          // Final alias resolution if symbol found via alias
          if (!symbol && aliasedKey) { resolvedKey = aliasedKey; symbol = dict[aliasedKey]; }
          const displaySymbol = symbol;
          if (symbol && symbol.aliasOf && dict[symbol.aliasOf]) {
            resolvedKey = symbol.aliasOf;
            symbol = dict[symbol.aliasOf];
          }
          // $[name] → display "name" as written; $name → display alias name or canonical name
          const displayName = keepText ? rawKey
            : (displaySymbol ? displaySymbol.name
              : rawKey.replace(/(^|-)([a-z])/g, (m, sep, c) => (sep ? '-' : '') + c.toUpperCase()));
          // If no symbol found, render as styled text (not a broken link)
          if (!symbol) {
            return `<span class="symbol-ref-unresolved">${displayName}</span>`;
          }
          const safeSentence = (symbol.sentence || '').replace(/"/g, '&quot;');
          const safeMeaning = (symbol.meaning || '').replace(/"/g, '&quot;');
          return `<a href="/research/symbols/${resolvedKey}/" class="symbol-ref symbol-ref-inline" data-symbol-key="${resolvedKey}" data-symbol-name="${symbol.name}" data-symbol-meaning="${safeMeaning}" data-symbol-sentence="${safeSentence}">${displayName}</a>`;
        });
        node.parentNode.replaceChild(span, node);
      });
      // Add tooltips to symbol refs that have dictionary entries
      container.querySelectorAll('.symbol-ref-inline:not([data-tooltip-added])').forEach(link => {
        const symbol = dict[link.dataset.symbolKey];
        if (symbol && typeof this.addSymbolTooltip === 'function') {
          this.addSymbolTooltip(link, symbol);
          link.dataset.tooltipAdded = '1';
        }
      });
    }

    // --- Pass 2: H####/G#### Strong's references ---
    // When author writes "H7585 *sheol*", make "sheol" the clickable link for H7585.
    // When H#### appears alone (no following italic), show a button with the dictionary gloss.
    const strongsPattern = /\b([HG]\d{1,5})\b/g;
    collectTextNodes(container, strongsPattern).forEach(node => {
      strongsPattern.lastIndex = 0;
      const matches = [];
      let m;
      while ((m = strongsPattern.exec(node.nodeValue)) !== null) {
        matches.push({ id: m[1], index: m.index, length: m[0].length });
      }
      if (matches.length === 0) return;

      const frag = document.createDocumentFragment();
      let lastIdx = 0;

      for (const match of matches) {
        if (match.index > lastIdx) {
          frag.appendChild(document.createTextNode(node.nodeValue.slice(lastIdx, match.index)));
        }

        const id = match.id;
        const afterText = node.nodeValue.slice(match.index + match.length);
        const nextSibling = node.nextSibling;
        const trailingSpace = /^\s*$/.test(afterText);
        const nextIsItalic = nextSibling && (nextSibling.nodeName === 'EM' || nextSibling.nodeName === 'I');

        if (trailingSpace && nextIsItalic && matches.indexOf(match) === matches.length - 1) {
          // Author pattern: "H7585 *sheol*" — make the italic word the clickable element
          const italicEl = nextSibling;
          const label = italicEl.textContent;
          const btn = document.createElement('button');
          btn.className = 'symbol-strongs-btn';
          btn.dataset.strongs = id;
          btn.setAttribute('onmouseenter', "if(typeof showStrongsButtonTooltip==='function')showStrongsButtonTooltip(this,event)");
          btn.setAttribute('onmouseleave', "if(typeof hideStrongsButtonTooltip==='function')hideStrongsButtonTooltip()");
          btn.setAttribute('onclick', `if(typeof showStrongsPanel==='function')showStrongsPanel('${id}','','',event)`);
          btn.textContent = label;
          btn.style.fontStyle = 'italic';
          frag.appendChild(btn);
          // Mark the italic element for removal after processing
          italicEl.dataset._strongsAbsorbed = '1';
        } else {
          // Standalone H#### — show dictionary gloss as before
          let label = id;
          if (typeof getStrongsEntry === 'function') {
            const entry = getStrongsEntry(id);
            if (entry) {
              label = (typeof extractGloss === 'function' ? extractGloss(entry, id) : '') || entry.xlit || id;
            }
          }
          const btn = document.createElement('button');
          btn.className = 'symbol-strongs-btn';
          btn.dataset.strongs = id;
          btn.setAttribute('onmouseenter', "if(typeof showStrongsButtonTooltip==='function')showStrongsButtonTooltip(this,event)");
          btn.setAttribute('onmouseleave', "if(typeof hideStrongsButtonTooltip==='function')hideStrongsButtonTooltip()");
          btn.setAttribute('onclick', `if(typeof showStrongsPanel==='function')showStrongsPanel('${id}','','',event)`);
          btn.textContent = label;
          frag.appendChild(btn);
        }

        lastIdx = match.index + match.length;
      }

      if (lastIdx < node.nodeValue.length) {
        frag.appendChild(document.createTextNode(node.nodeValue.slice(lastIdx)));
      }

      node.parentNode.replaceChild(frag, node);
    });

    // Remove italic elements that were absorbed into Strong's buttons
    container.querySelectorAll('em[data-_strongs-absorbed], i[data-_strongs-absorbed]').forEach(el => el.remove());

    // Preload BDB lexicon so tooltips have rich sense data ready
    // Then update Strong's badge labels with BDB glosses (they were created above before BDB loaded)
    if (typeof loadBDB === 'function') loadBDB().then(() => {
      if (typeof bdbData !== 'undefined' && bdbData) {
        container.querySelectorAll('.symbol-strongs-btn[data-strongs]').forEach(btn => {
          const id = btn.dataset.strongs;
          const bdb = bdbData[id] || bdbData[id.replace(/[a-z]$/, '')];
          if (bdb && bdb.gloss) btn.textContent = bdb.gloss;
        });
      }
    });

    // --- Pass 3: Abbreviated + full-name verse references (requires chapter:verse) ---
    if (typeof BOOK_NAME_MAP !== 'undefined' && typeof normalizeBookName === 'function') {
      // Build and cache the pattern from BOOK_NAME_MAP keys (sorted longest first)
      if (!this._studyVersePattern) {
        const keys = Object.keys(BOOK_NAME_MAP).sort((a, b) => b.length - a.length);
        const bookAlts = keys.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
        this._studyVersePattern = new RegExp(
          `\\b(${bookAlts})\\.?\\s+(\\d+):(\\d+(?:[-–—]\\d+(?!:\\d))?(?:,\\s*\\d+(?:[-–—]\\d+(?!:\\d))?)*)(?:[-–—](\\d+)(?::(\\d+))?)?`,
          'gi'
        );
      }
      const versePattern = this._studyVersePattern;

      let translation = getDefaultTranslation();

      collectTextNodes(container, versePattern).forEach(node => {
        const span = document.createElement('span');
        versePattern.lastIndex = 0;
        span.innerHTML = node.nodeValue.replace(versePattern, (match, rawBook, chapter, verseStr, _endChapter, _endVerse) => {
          const book = normalizeBookName(rawBook);
          const firstVerse = verseStr.split(/[,]/)[0].split(/[-–—]/)[0].trim();
          const targetVerse = parseInt(firstVerse, 10);
          const url = `/reader/bible/${translation}/${encodeURIComponent(book)}/${chapter}.${targetVerse}`;
          const dataRef = `${book} ${chapter}:${verseStr}`;
          return `<a href="${url}" class="scripture-ref" data-ref="${dataRef}" onmouseenter="if(typeof showVerseTooltip==='function')showVerseTooltip(this,event)" onmouseleave="if(typeof hideVerseTooltip==='function')hideVerseTooltip()" onclick="return handleScriptureNav(this,event)">${match}</a>`;
        });
        node.parentNode.replaceChild(span, node);
      });
    }

    // --- Pass 4: Apply user's preferred divine name substitutions (LORD → Yahuah, etc.) ---
    if (typeof applyNamePreferencesHTML === 'function') {
      // Walk text nodes (not inside <code> or <pre>) and apply substitutions
      const namePattern = /\b(LORD|GOD|God|Lord|Jesus|Christ)\b/g;
      collectTextNodes(container, namePattern).forEach(node => {
        const original = node.nodeValue;
        const substituted = applyNamePreferencesHTML(original);
        if (substituted !== original) {
          const span = document.createElement('span');
          span.innerHTML = substituted;
          node.parentNode.replaceChild(span, node);
        }
      });
    }

    // Hook up derivation tooltips for [data-derive-key] elements
    container.querySelectorAll('[data-derive-key]').forEach(el => {
      el.setAttribute('onmouseenter', "if(typeof showDeriveTooltip==='function'&&typeof _lastPointerType!=='undefined'&&_lastPointerType!=='touch')showDeriveTooltip(this,event)");
      el.setAttribute('onmouseleave', "if(typeof hideDeriveTooltip==='function')hideDeriveTooltip()");
      el.setAttribute('onclick', "if(typeof handleDeriveTap==='function')handleDeriveTap(this,event)");
      el.style.cursor = 'pointer';
    });

    // Hook up derivation step tabs
    container.querySelectorAll('.derive-steps').forEach(tabs => {
      tabs.querySelectorAll('.derive-step-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const target = btn.dataset.step;
          tabs.querySelectorAll('.derive-step-btn').forEach(b => b.classList.toggle('active', b.dataset.step === target));
          tabs.querySelectorAll('.derive-step-panel').forEach(p => p.classList.toggle('active', p.dataset.step === target));
        });
      });
    });
  },

  /**
   * Make scripture references clickable
   */
  linkifyScriptureRefs(container) {
    // Pattern for scripture references:
    // - "Isaiah 5:7" or "Romans 11:17-24" (chapter:verse or verse range)
    // - "Matthew 13" (chapter only)
    // - "Psalm 78:2" or "Psalms 78:2" (handles both singular/plural)
    const books = 'Genesis|Exodus|Leviticus|Numbers|Deuteronomy|Joshua|Judges|Ruth|1 Samuel|2 Samuel|1 Kings|2 Kings|1 Chronicles|2 Chronicles|Ezra|Nehemiah|Esther|Job|Psalms?|Proverbs|Ecclesiastes|Song of Solomon|Isaiah|Jeremiah|Lamentations|Ezekiel|Daniel|Hosea|Joel|Amos|Obadiah|Jonah|Micah|Nahum|Habakkuk|Zephaniah|Haggai|Zechariah|Malachi|Matthew|Mark|Luke|John|Acts|Romans|1 Corinthians|2 Corinthians|Galatians|Ephesians|Philippians|Colossians|1 Thessalonians|2 Thessalonians|1 Timothy|2 Timothy|Titus|Philemon|Hebrews|James|1 Peter|2 Peter|1 John|2 John|3 John|Jude|Revelation';
    
    // Match: Book Chapter:Verse(,Verse)*(-EndVerse)? OR Book Chapter (chapter only)
    // Supports comma-separated verses like Deuteronomy 16:9,10,16
    const pattern = new RegExp(`\\b(${books})\\s+(\\d+)(?::(\\d+(?:[-–—]\\d+(?!:\\d))?(?:,\\s*\\d+(?:[-–—]\\d+(?!:\\d))?)*))?(?:[-–—](\\d+)(?::(\\d+))?)?\\b`, 'g');
    
    const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null, false);
    const textNodes = [];
    while (walker.nextNode()) {
      // Skip text inside links (may already be linkified by processStudyMarkup)
      const parent = walker.currentNode.parentNode;
      if (parent && (parent.tagName === 'A' || parent.closest?.('a'))) continue;
      if (walker.currentNode.nodeValue.match(pattern)) {
        textNodes.push(walker.currentNode);
      }
    }
    
    // Get current translation preference
    let translation = getDefaultTranslation();
    
    textNodes.forEach(node => {
      const span = document.createElement('span');
      // Reset lastIndex since we reuse the regex
      pattern.lastIndex = 0;
      span.innerHTML = node.nodeValue.replace(pattern, (match, book, chapter, verseStr, _endChapter, _endVerse) => {
        // Build URL - if no verse, default to verse 1
        // Extract first verse number from potentially comma-separated string
        const firstVerse = verseStr ? verseStr.split(/[,]/)[0].split(/[-–—]/)[0].trim() : '1';
        const targetVerse = parseInt(firstVerse, 10);
        const url = `/reader/bible/${translation}/${encodeURIComponent(book)}/${chapter}.${targetVerse}`;
        // id matches book-scripture-index anchor format (ref-book-chapter-verse) for scroll-from-Bible
        const anchorId = 'ref-' + (book || '').toLowerCase().replace(/\s+/g, '-') + '-' + chapter + '-' + targetVerse;
        const dataRef = `${book} ${chapter}:${targetVerse}`;
        return `<a id="${anchorId}" href="${url}" class="scripture-ref" data-ref="${dataRef}" onmouseenter="if(typeof showVerseTooltip==='function')showVerseTooltip(this,event)" onmouseleave="if(typeof hideVerseTooltip==='function')hideVerseTooltip()" onclick="return handleScriptureNav(this,event)">${match}</a>`;
      });
      node.parentNode.replaceChild(span, node);
    });
  },

  /**
   * Make symbol references interactive with links and tooltips
   */
  linkifySymbolRefs(container) {
    if (typeof SYMBOL_DICTIONARY === 'undefined') return;
    
    // First, enhance existing symbol links (markdown links like [NAME](/symbols/name/) or /research/symbols/name/)
    const symbolLinks = container.querySelectorAll('a[href*="/symbols/"]');
    symbolLinks.forEach(link => {
      // Extract symbol key from href (supports hyphens and digits in key)
      const match = link.href.match(/\/symbols\/([a-z][a-z0-9-]*)\/?/i);
      if (match) {
        const symbolKey = match[1].toLowerCase();
        const symbol = SYMBOL_DICTIONARY[symbolKey];
        if (symbol) {
          // Add data attributes for tooltip
          link.classList.add('symbol-ref');
          link.dataset.symbolKey = symbolKey;
          link.dataset.symbolName = symbol.name;
          link.dataset.symbolMeaning = symbol.meaning;
          link.dataset.symbolSentence = symbol.sentence;
          
          // Update href to canonical path
          link.href = `/research/symbols/${symbolKey}/`;
          
          // Add hover tooltip
          this.addSymbolTooltip(link, symbol);
        }
      }
    });
    
  },

  /**
   * Make internal reader links (symbols-article, symbols) use SPA navigation instead of full page load.
   * Fixes broken "See also" and other /reader/... links inside markdown content.
   */
  linkifyReaderLinks(container) {
    if (!container) return;
    const links = container.querySelectorAll('a[href*="/reader/symbols-article/"], a[href*="/reader/symbols/"], a[href*="/research/symbols/"], a[href*="/reader/words/"], a[href*="/reader/numbers/"]');
    links.forEach(link => {
      const href = link.getAttribute('href') || '';
      const articleMatch = href.match(/\/reader\/symbols-article\/([^/?#]+)/);
      const symbolMatch = href.match(/\/(?:reader|research)\/symbols\/([^/?#]+)/);
      const wordMatch = href.match(/\/reader\/words\/([^/?#]+)/);
      const numberMatch = href.match(/\/reader\/numbers\/([^/?#]+)/);
      link.addEventListener('click', (e) => {
        e.preventDefault();
        if (articleMatch) {
          AppStore.dispatch({
            type: 'SET_VIEW',
            view: 'reader',
            params: { contentType: 'symbols-article', article: articleMatch[1] }
          });
        } else if (symbolMatch) {
          AppStore.dispatch({
            type: 'SET_VIEW',
            view: 'reader',
            params: { contentType: 'symbols', symbol: symbolMatch[1].toLowerCase() }
          });
        } else if (wordMatch) {
          AppStore.dispatch({
            type: 'SET_VIEW',
            view: 'reader',
            params: { contentType: 'words', word: wordMatch[1].toUpperCase() }
          });
        } else if (numberMatch) {
          AppStore.dispatch({
            type: 'SET_VIEW',
            view: 'reader',
            params: { contentType: 'numbers', number: numberMatch[1].toUpperCase() }
          });
        }
      });
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
        <div class="symbol-tooltip-meaning">${symbol.meaning}</div>
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

    element.addEventListener('click', (e) => {
      e.preventDefault();
      const tooltip = document.querySelector('.symbol-tooltip');
      if (tooltip) tooltip.remove();
      const key = element.dataset.symbolKey;
      if (key && typeof navigateToSymbolStudy === 'function') {
        navigateToSymbolStudy(key);
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
  /**
   * Render an AsciiDoc book chapter ("The Bible's Symbolic Language") inside
   * the Bible reader frame. Chapters are pre-rendered to HTML by Jekyll;
   * here we reuse that HTML (cached on first load, fetched on SPA navigation)
   * and wrap it in the book's header + prev/next navigation.
   */
  renderBookInBibleFrame(state, derived, container, bookSlug, chapterSlug, section) {
    const bookState = { content: { params: { contentType: 'books' } } };
    const existingPage = container.querySelector('#bible-explorer-page');
    if (!existingPage) {
      if (typeof BibleView !== 'undefined') {
        BibleView.renderStructure(container, bookState);
      }
    } else if (typeof BibleView !== 'undefined' && BibleView.syncSelectorVisibility) {
      BibleView.syncSelectorVisibility(bookState);
    }

    const bookHelper = (typeof window !== 'undefined' && window.BOOKS_BY_SLUG && window.BOOKS_BY_SLUG[bookSlug])
      || ((typeof SymbolicLanguageBook !== 'undefined') ? SymbolicLanguageBook : null);
    const book = bookHelper ? bookHelper.book : null;
    if (book && book.slug) bookSlug = book.slug;  // canonicalize legacy aliases
    const bookTitle = book ? book.title : 'Book';
    const textArea = container.querySelector('#bible-explorer-text');
    const titleEl = container.querySelector('#bible-chapter-title');

    if (!textArea) return;

    // No chapter → show the table of contents
    if (!chapterSlug) {
      if (titleEl) titleEl.textContent = bookTitle;
      const items = (book ? book.chapters : []).map(c =>
        `<li class="book-toc-item${c.plate ? ' has-plate' : ''}"><a href="${bookHelper.chapterPath(c.slug)}"
            onclick="event.preventDefault();AppStore.dispatch({type:'SET_VIEW',view:'reader',params:{contentType:'books',bookSlug:'${bookSlug || book.slug}',chapterSlug:'${c.slug}'}})">
            ${c.plate ? `<img class="book-toc-thumb" src="${c.plate}-160.webp" alt="" loading="lazy" width="160" height="240">` : ''}
            <span class="book-toc-text">
              <span class="book-toc-title">${c.title}</span>
              ${c.summary ? `<span class="book-toc-desc">${c.summary}</span>` : ''}
            </span>
          </a></li>`).join('');
      const offerLive = book && book.offer && book.offer.href && Date.now() < Date.parse(book.offer.until);
      const offer = offerLive
        ? `<a class="hero-btn primary book-offer-btn" href="${book.offer.href}"
             onclick="if(typeof trackPreorder==='function')trackPreorder('${book.slug}')">${book.offer.label}</a>
           <p class="book-offer-note">${book.offer.note}</p>`
        : '';
      // One action while the offer runs: purchase entries demote to text links
      const purchase = offerLive
        ? ''
        : (book && book.purchase ? book.purchase : []).map(p => p.soon
            ? `<span class="book-soon">${p.soon}</span>`
            : `<a class="hero-btn secondary" href="${p.href}" target="_blank" rel="noopener" onclick="if(typeof trackBuyBook==='function')trackBuyBook()">${p.label}</a>`
          ).join('');
      const purchaseLinks = offerLive
        ? (book && book.purchase ? book.purchase : []).filter(p => !p.soon).map(p =>
            `<a href="${p.href}" target="_blank" rel="noopener" onclick="if(typeof trackBuyBook==='function')trackBuyBook()">${p.label}</a>`
          ).join(' · ')
        : '';
      const downloads = (book && book.downloads ? book.downloads : []).map(d =>
        `<a href="${d.href}" onclick="if(typeof trackBookFile==='function')trackBookFile('${d.track}','${d.fmt}')">${d.label}</a>`
      ).join(' · ');
      const header = (book && book.cover)
        ? `<div class="book-index-hero">
            <img class="book-index-cover" src="${book.cover}" alt="${bookTitle} — front cover" width="640" height="960">
            <div class="book-index-hero-info">
              <h1 class="book-index-title">${bookTitle}</h1>
              ${book.tagline ? `<p class="book-index-tagline">${book.tagline}</p>` : ''}
              <div class="book-actions">${offer}${purchase}</div>
              ${downloads ? `<p class="book-downloads">Download: ${downloads}</p>` : ''}
              ${purchaseLinks ? `<p class="book-downloads">${purchaseLinks}</p>` : ''}
            </div>
          </div>`
        : `<header class="book-index-header"><h1 class="book-index-title">${bookTitle}</h1></header>`;
      textArea.innerHTML = `
        <div class="book-index-content">
          ${header}
          <ol class="book-index-toc">${items}</ol>
        </div>`;
      this.hideChapterNav(container);
      return;
    }

    const chapter = bookHelper ? bookHelper.getChapter(chapterSlug) : null;
    const chapterTitle = chapter ? chapter.title : 'Chapter';
    if (titleEl) titleEl.textContent = chapterTitle;

    const nav = bookHelper ? bookHelper.getPrevNext(chapterSlug) : { prev: null, next: null };
    const navBtn = (ch, dir) => ch
      ? `<button class="book-nav-btn book-nav-${dir}" onclick="AppStore.dispatch({type:'SET_VIEW',view:'reader',params:{contentType:'books',bookSlug:'${bookSlug}',chapterSlug:'${ch.slug}'}})">${dir === 'prev' ? '← ' : ''}${ch.title}${dir === 'next' ? ' →' : ''}</button>`
      : '<span></span>';

    textArea.innerHTML = `
      <div class="book-chapter-content">
        <figure class="book-chapter-plate" id="book-chapter-plate" style="display:none"></figure>
        <div class="book-chapter-epigraphs" id="book-chapter-epigraphs" style="display:none"></div>
        <header class="book-chapter-header">
          <button class="book-chapter-booktitle" onclick="AppStore.dispatch({type:'SET_VIEW',view:'reader',params:{contentType:'books',bookSlug:'${bookSlug}'}})">${bookTitle}</button>
          <h1 class="book-chapter-title">${chapterTitle}</h1>
        </header>
        <div class="book-chapter-body" id="book-chapter-body"><div class="book-loading">Loading…</div></div>
        <nav class="book-chapter-nav">
          ${navBtn(nav.prev, 'prev')}
          <button class="book-nav-btn book-nav-toc" onclick="AppStore.dispatch({type:'SET_VIEW',view:'reader',params:{contentType:'books',bookSlug:'${bookSlug}'}})">Contents</button>
          ${navBtn(nav.next, 'next')}
        </nav>
      </div>`;

    this.loadBookChapter(bookSlug, chapterSlug, textArea, section);
    this.hideChapterNav(container);
  },

  /**
   * Load a book chapter's rendered body: reuse the Jekyll-cached article on
   * initial page load, otherwise fetch the pre-rendered page over the network.
   */
  async loadBookChapter(bookSlug, chapterSlug, container, section) {
    const body = container.querySelector('#book-chapter-body');
    const epiEl = container.querySelector('#book-chapter-epigraphs');
    if (!body) return;
    try {
      let html, epigraphsHtml = '', plateHtml = '';
      // Path 1: cached article from the Jekyll page (initial load)
      if (window.__jekyllArticle && window.__jekyllArticle.type === 'book' &&
          (!window.__jekyllArticle.slug || window.__jekyllArticle.slug === chapterSlug)) {
        html = window.__jekyllArticle.html;
        epigraphsHtml = window.__jekyllArticle.epigraphsHtml || '';
        plateHtml = window.__jekyllArticle.plateHtml || '';
        delete window.__jekyllArticle;
      } else {
        // Path 2: SPA navigation — fetch the pre-rendered page
        const response = await fetch(`/books/${bookSlug}/${chapterSlug}/`);
        if (!response.ok) throw new Error(`Chapter not found: ${chapterSlug}`);
        const pageHtml = await response.text();
        const doc = new DOMParser().parseFromString(pageHtml, 'text/html');
        const article = doc.querySelector('.book-chapter-body');
        if (!article) throw new Error(`No chapter body found for: ${chapterSlug}`);
        html = article.innerHTML;
        const epiSrc = doc.querySelector('.book-chapter-epigraphs');
        epigraphsHtml = epiSrc ? epiSrc.innerHTML : '';
        const plateSrc = doc.querySelector('.book-chapter-plate');
        plateHtml = plateSrc ? plateSrc.innerHTML : '';
      }

      // Chapter plate sits above the epigraphs, as in the print/epub openings
      const plateEl = container.querySelector('#book-chapter-plate');
      if (plateEl) {
        if (plateHtml) { plateEl.innerHTML = plateHtml; plateEl.style.display = ''; }
        else { plateEl.innerHTML = ''; plateEl.style.display = 'none'; }
      }

      // Chapter epigraphs sit above the title
      if (epiEl) {
        if (epigraphsHtml) { epiEl.innerHTML = epigraphsHtml; epiEl.style.display = ''; }
        else { epiEl.innerHTML = ''; epiEl.style.display = 'none'; }
      }

      body.innerHTML = html;

      // Scripture quote blocks get ref-… ids (from their attribution line) so
      // the Bible reader's book links can land on the exact quote
      body.querySelectorAll('.quoteblock').forEach(qb => {
        if (qb.id) return;
        const att = qb.querySelector('.attribution');
        const m = att && att.textContent.match(/(\d?\s*[A-Za-z]+)\s+(\d+):(\d+)/);
        if (!m) return;
        const id = `ref-${m[1].trim().toLowerCase().replace(/\s+/g, '')}-${m[2]}-${m[3]}`;
        if (!body.querySelector(`#${id}`)) qb.id = id;
      });

      // Reuse the site's content enhancers
      if (epiEl && epiEl.innerHTML) this.linkifyScriptureRefs(epiEl);
      this.linkifyScriptureRefs(body);
      this.linkifySymbolRefs(body);
      if (typeof this.linkifyClassicsRefs === 'function') this.linkifyClassicsRefs(body);
      if (typeof this.linkifyReaderLinks === 'function') this.linkifyReaderLinks(body);

      // In-book chapter cross-links (link:/books/... in the sources, which may
      // carry a book's pre-rename slug): stay in-app and canonicalize
      body.querySelectorAll('a[href^="/books/"]:not(.symbol)').forEach(a => {
        if (a.dataset.spaBound) return;
        const m = (a.getAttribute('href') || '').match(/^\/books\/([a-z0-9-]+)\/(?:([a-z0-9-]+)\/?)?(?:#(.+))?$/);
        if (!m) return;
        a.dataset.spaBound = '1';
        a.addEventListener('click', (e) => {
          e.preventDefault();
          const slug = (window.BOOK_SLUG_ALIASES && window.BOOK_SLUG_ALIASES[m[1]]) || m[1];
          const params = { contentType: 'books', bookSlug: slug };
          if (m[2]) params.chapterSlug = m[2];
          if (m[3]) params.section = m[3];
          AppStore.dispatch({ type: 'SET_VIEW', view: 'reader', params });
        });
      });

      // Glossary sym links (both books use MEAT's glossary): hover/tap popups,
      // and desktop clicks stay in-app instead of a full page reload
      [body, epiEl].forEach(root => {
        if (!root) return;
        if (window.GlossaryPopup) window.GlossaryPopup.attach(root);
        root.querySelectorAll('a.symbol[href*="/glossary/#sym-"]').forEach(a => {
          if (a.dataset.spaBound) return;
          a.dataset.spaBound = '1';
          a.addEventListener('click', (e) => {
            if (window.matchMedia && window.matchMedia('(hover: none)').matches) return; // touch: first tap previews, second follows the href
            const m = (a.getAttribute('href') || '').match(/\/books\/([a-z0-9-]+)\/([a-z0-9-]+)\/#(sym-[a-z0-9-]+)/);
            if (!m) return;
            e.preventDefault();
            AppStore.dispatch({ type: 'SET_VIEW', view: 'reader', params: { contentType: 'books', bookSlug: m[1], chapterSlug: m[2], section: m[3] } });
          });
        });
      });

      const scrollRoot = container.closest('#bible-explorer-text') || container;
      if (typeof this.setupScrollSpy === 'function') this.setupScrollSpy(scrollRoot);
      if (section && typeof this.scrollToSection === 'function') {
        setTimeout(() => this.scrollToSection(section, container), 100);
      } else if (typeof this.scrollToHashHeading === 'function') {
        this.scrollToHashHeading(scrollRoot);
      }
    } catch (e) {
      console.error('[ReaderView] Error loading book chapter:', e);
      body.innerHTML = `<div class="reader-error">Could not load chapter: ${e.message}</div>`;
    }
  },

  renderTimeTestedInBibleFrame(state, derived, container, chapterId, section) {
    // First render the Bible structure if not already present
    const tttState = { content: { params: { contentType: 'timetested' } } };
    const existingPage = container.querySelector('#bible-explorer-page');
    if (!existingPage) {
      if (typeof BibleView !== 'undefined') {
        BibleView.renderStructure(container, tttState);
      }
    } else if (typeof BibleView !== 'undefined' && BibleView.syncSelectorVisibility) {
      BibleView.syncSelectorVisibility(tttState);
    }
    
    // Update the content selector
    setTimeout(() => {
      if (typeof updateReaderContentSelector === 'function') {
        updateReaderContentSelector('timetested');
        // updateReaderContentSelector calls populateTimeTestedDropdown(), so we need to set the value after it
      }
      // Set the chapter dropdown value after updateReaderContentSelector has populated it
      // Use a small delay to ensure the dropdown is fully rendered
      setTimeout(() => {
        const chapterSelect = document.getElementById('timetested-chapter-select');
        if (chapterSelect) {
          if (chapterId) {
            // Verify the option exists before setting
            const optionExists = Array.from(chapterSelect.options).some(opt => opt.value === chapterId);
            if (optionExists) {
              chapterSelect.value = chapterId;
            } else {
              console.warn(`Chapter ID "${chapterId}" not found in dropdown`);
            }
          } else {
            // Show Index as selected when viewing index
            chapterSelect.value = '';
          }
        }
      }, 10);
    }, 50);
    
    // Delegate to BookView for the actual content rendering
    const textArea = container.querySelector('#bible-explorer-text');
    if (textArea) {
      if (!chapterId) {
        // Show chapter index
        textArea.innerHTML = this.buildTimeTestedIndexHTML();
      } else if (chapterId === '__reviews__') {
        // Load AI Reviews page (separate section, not a chapter)
        textArea.innerHTML = `<div class="loading">Loading...</div>`;
        this.loadTimeTestedReviewsPage(textArea);
      } else {
        // Render the chapter: use cache if available so we don't show "Loading chapter..." on revisit
        if (this._chapterCache && this._chapterCache.has(chapterId)) {
          textArea.innerHTML = this._chapterCache.get(chapterId);
          this.linkifyScriptureRefs(textArea);
          this.linkifySymbolRefs(textArea);
          this.linkifyClassicsRefs(textArea);
          if (section) {
            setTimeout(() => this.scrollToSection(section, textArea), 100);
          }
          setTimeout(() => this.scrollToVerseAnchor(textArea), 150);
        } else if (typeof BookView !== 'undefined' && typeof BookView.loadAndRenderChapter === 'function') {
          BookView.loadAndRenderChapter(chapterId, textArea, section);
        } else {
          textArea.innerHTML = `<div class="loading">Loading chapter...</div>`;
          this.loadTimeTestedChapter(chapterId, textArea, section);
        }
      }
    }
    
    // Update the chapter title
    const titleEl = container.querySelector('#bible-chapter-title');
    if (titleEl) {
      if (chapterId === '__reviews__') {
        titleEl.textContent = 'AI Reviews';
      } else {
        const chapter = TIME_TESTED_CHAPTERS?.find(c => c.id === chapterId);
        titleEl.textContent = chapter ? chapter.title : 'Time-Tested Tradition';
      }
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
   * Build HTML for symbol index (within reader context)
   * Dynamically populated from SYMBOL_DICTIONARY
   */
  buildSymbolIndexHTML() {
    const allSymbols = Object.entries(SYMBOL_DICTIONARY || {})
      .filter(([, symbol]) => symbol.recordType !== 'alias');
    const byRank = [...allSymbols].sort((a, b) => (b[1].rank || 0) - (a[1].rank || 0));
    const byAlpha = [...allSymbols].sort((a, b) => a[1].name.localeCompare(b[1].name));
    const symbolCount = allSymbols.length;
    
    function buildCard(key, symbol) {
      const aliases = (symbol.words || []).filter(w => w.toLowerCase() !== key.replace(/-/g, ' ')).join(', ');
      return `<button class="symbol-index-item" onclick="AppStore.dispatch({type:'SET_VIEW',view:'reader',params:{contentType:'symbols',symbol:'${key}'}})">
          <div class="symbol-index-name">${symbol.name}</div>
          ${aliases ? `<div class="symbol-index-aliases">${aliases}</div>` : ''}
          <div class="symbol-index-meaning">${symbol.meaning}</div>
        </button>`;
    }
    
    function buildGrid(symbols) {
      return symbols.map(([key, symbol]) => buildCard(key, symbol)).join('');
    }
    
    // Build grouped-by-topic view
    function buildTopicView(symbols) {
      // Collect unique categories in order, with subcategories
      const catOrder = [];
      const catMap = {};
      for (const [key, sym] of symbols) {
        const cat = sym.category || 'Uncategorized';
        const sub = sym.subcategory || null;
        if (!catMap[cat]) {
          catMap[cat] = { subs: {}, flat: [] };
          catOrder.push(cat);
        }
        if (sub) {
          if (!catMap[cat].subs[sub]) catMap[cat].subs[sub] = [];
          catMap[cat].subs[sub].push([key, sym]);
        } else {
          catMap[cat].flat.push([key, sym]);
        }
      }
      
      let html = '';
      for (const cat of catOrder) {
        const data = catMap[cat];
        html += `<div class="symbol-topic-group">`;
        html += `<h3 class="symbol-topic-heading">${cat}</h3>`;
        
        const subNames = Object.keys(data.subs);
        if (subNames.length > 0) {
          for (const sub of subNames) {
            html += `<h4 class="symbol-topic-subheading">${sub}</h4>`;
            html += `<div class="symbol-index-grid">`;
            for (const [key, sym] of data.subs[sub]) {
              html += buildCard(key, sym);
            }
            html += `</div>`;
          }
        }
        if (data.flat.length > 0) {
          html += `<div class="symbol-index-grid">`;
          for (const [key, sym] of data.flat) {
            html += buildCard(key, sym);
          }
          html += `</div>`;
        }
        html += `</div>`;
      }
      return html;
    }
    
    // Sort toggle handler (inline — switches between three pre-rendered grids)
    const sortClick = `(function(mode, btn) {
      document.getElementById('symbol-grid-rank').style.display = mode === 'rank' ? '' : 'none';
      document.getElementById('symbol-grid-alpha').style.display = mode === 'alpha' ? '' : 'none';
      document.getElementById('symbol-grid-topic').style.display = mode === 'topic' ? '' : 'none';
      btn.parentElement.querySelectorAll('.symbol-sort-btn').forEach(function(b) { b.classList.remove('active'); });
      btn.classList.add('active');
    })`;
    
    return `
      <div class="reader-symbol-index">
        <header class="symbol-index-header">
          <h1>🔑 Biblical Symbol Dictionary</h1>
          <p>Unlocking the Hidden Language of Scripture</p>
        </header>
        
        <section class="symbol-index-intro">
          <p>
            <strong>Scripture declares it teaches through symbols.</strong>
            God says: <em>"I have multiplied visions, and used similitudes"</em> (Hosea 12:10).
            Jesus spoke to the multitudes <strong>only</strong> in parables (Matthew 13:34).
          </p>
          <div class="symbol-intro-links">
            <button class="symbol-intro-link" onclick="AppStore.dispatch({type:'SET_VIEW',view:'reader',params:{contentType:'symbols-article',article:'HOW-SCRIPTURE-TEACHES'}})">
              📜 How Scripture Teaches
            </button>
            <button class="symbol-intro-link" onclick="AppStore.dispatch({type:'SET_VIEW',view:'reader',params:{contentType:'symbols-article',article:'WHY-PARABLES'}})">
              🧠 Why Parables?
            </button>
            <button class="symbol-intro-link" onclick="AppStore.dispatch({type:'SET_VIEW',view:'reader',params:{contentType:'symbols-article',article:'METHODOLOGY'}})">
              🔬 Human Study Guide
            </button>
            <button class="symbol-intro-link" onclick="AppStore.dispatch({type:'SET_VIEW',view:'reader',params:{contentType:'symbols-article',article:'AI-METHODOLOGY'}})">
              🤖 AI-Assisted Study
            </button>
          </div>
        </section>
        
        <section class="symbol-index-dictionary">
          <div class="symbol-index-header-row">
            <h2>Symbol Dictionary <span class="symbol-count">(${symbolCount} symbols)</span></h2>
            <div class="symbol-sort-controls">
              <button class="symbol-sort-btn" onclick="${sortClick}('rank', this)">By Relevance</button>
              <button class="symbol-sort-btn" onclick="${sortClick}('alpha', this)">A–Z</button>
              <button class="symbol-sort-btn active" onclick="${sortClick}('topic', this)">By Topic</button>
            </div>
          </div>
          <div class="symbol-index-grid" id="symbol-grid-rank" style="display:none">
            ${buildGrid(byRank)}
          </div>
          <div class="symbol-index-grid" id="symbol-grid-alpha" style="display:none">
            ${buildGrid(byAlpha)}
          </div>
          <div id="symbol-grid-topic">
            ${buildTopicView(byRank)}
          </div>
        </section>
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
            <strong>Strong's:</strong> ${this._renderStrongsButtons(symbol.strongs)}
          </div>
          ` : ''}
        </header>
        
        <section class="symbol-meanings">
          <div class="meaning-block meaning-is">
            <div class="meaning-label">Meaning:</div>
            <div class="meaning-value">${symbol.meaning}</div>
          </div>
          
          <div class="meaning-block meaning-sentence">
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
    const mainChapters = chapters.filter(ch => ch.folder === 'chapters');
    const extraChapters = chapters.filter(ch => ch.folder === 'extra');
    
    return `
      <div class="reader-ttt-index">
        <header class="ttt-index-header">
          <div class="ttt-hero ttt-hero-card">
            <img src="/assets/img/TimeTestedBookFront.jpg" alt="Time-Tested Tradition Book Cover" class="ttt-hero-cover">
            <div class="ttt-hero-info">
              <h2 class="ttt-hero-book-title">A Time-Tested Tradition</h2>
              <p class="ttt-hero-subtitle">The Renewed Biblical Calendar</p>
              <p class="ttt-hero-author">by Daniel Larimer</p>
              <p class="ttt-hero-desc">An exploration of biblical calendar methodology using first-principles physics, astronomical calculations, and Scripture to determine when the day, month, year, and Sabbath begin.</p>
              <div class="ttt-hero-actions">
                <a class="ttt-hero-download ttt-hero-buy"
                   style="background:#1a6b7a;border:1px solid #0f4250;color:#ffffff;"
                   href="https://store.bookbaby.com/book/time-tested-tradition"
                   target="_blank" rel="noopener"
                   onclick="if(typeof trackBuyBook==='function')trackBuyBook()">
                  <span class="icon">📕</span>
                  <span>Buy Physical Copy</span>
                </a>
                <a class="ttt-hero-download"
                   style="background:#ffffff;border:1px solid #1a6b7a;color:#1a6b7a;"
                   href="/media/time-tested-tradition.pdf"
                   download
                   onclick="trackBookDownload()">
                  <span class="icon">📥</span>
                  <span>Download PDF</span>
                </a>
              </div>
            </div>
          </div>

          <div class="ttt-reviews-compact">
            <div class="ttt-reviews-icons">
              <img class="ttt-review-icon" src="/assets/img/reviews/openai.png" alt="GPT-5.2" title="GPT-5.2">
              <img class="ttt-review-icon" src="/assets/img/reviews/xai.svg" alt="Grok" title="Grok">
              <img class="ttt-review-icon" src="/assets/img/reviews/anthropic.svg" alt="Claude" title="Claude">
            </div>
            <p class="ttt-reviews-summary">"Provocative and rigorous" · "Rigorous but dense" · "Ambitious biblical calendar revisionism demanding critical engagement"</p>
            <a class="ttt-reviews-link" href="#" onclick="AppStore.dispatch({type:'SET_VIEW',view:'reader',params:{contentType:'timetested',chapterId:'__reviews__'}}); return false;">
              Read full AI reviews →
            </a>
          </div>
        </header>
        
        <div class="ttt-index-list">
          ${mainChapters.map(ch => `
            <button class="ttt-index-item" onclick="AppStore.dispatch({type:'SET_VIEW',view:'reader',params:{contentType:'timetested',chapterId:'${ch.id}'}})">
              <div class="ttt-index-item-header">
                <span class="ttt-chapter-title">${ch.title}</span>
              </div>
              ${ch.summary ? `<div class="ttt-chapter-summary">${ch.summary}</div>` : ''}
            </button>
          `).join('')}
        </div>
        
        ${extraChapters.length > 0 ? `
          <h2 class="ttt-index-section-header">Extra Chapters</h2>
          <div class="ttt-index-list">
            ${extraChapters.map(ch => `
              <button class="ttt-index-item" onclick="AppStore.dispatch({type:'SET_VIEW',view:'reader',params:{contentType:'timetested',chapterId:'${ch.id}'}})">
                <div class="ttt-index-item-header">
                  <span class="ttt-chapter-title">${ch.title}</span>
                </div>
                ${ch.summary ? `<div class="ttt-chapter-summary">${ch.summary}</div>` : ''}
              </button>
            `).join('')}
          </div>
        ` : ''}
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
      
      if (this._chapterCache) this._chapterCache.set(chapterId, container.innerHTML);
      
      // Make scripture references clickable (links to Bible reader)
      this.linkifyScriptureRefs(container);
      
      // Make symbol references interactive (links + tooltips)
      this.linkifySymbolRefs(container);
      
      // Make Philo/Josephus citations clickable
      this.linkifyClassicsRefs(container);
      
      // Scroll to section if specified
      if (section) {
        setTimeout(() => {
          this.scrollToSection(section, container);
        }, 100);
      }
      // Scroll to verse citation when opening from Bible book icon (e.g. #ref-genesis-10-8)
      setTimeout(() => this.scrollToVerseAnchor(container), 150);
      
    } catch (e) {
      container.innerHTML = `<div class="reader-error">Error loading chapter: ${e.message}</div>`;
    }
  },

  /**
   * Load a blog post (HTML fragment with phrase-linking) into the reader view
   * @param {string} slug - Blog post slug (e.g., 'blood-moon-over-the-moon-city')
   * @param {Element} container - Container to render into
   */
  // Cache blog post HTML so back-navigation is instant and scroll position restores
  _blogCache: new Map(),

  async loadBlogPost(slug, container) {
    try {
      let html;
      if (this._blogCache.has(slug)) {
        html = this._blogCache.get(slug);
      } else {
        // Path 1: Use cached article from Jekyll page (initial load —
        // the layout script cached the visible article HTML before ContentManager replaced #content-area)
        if (window.__jekyllArticle && window.__jekyllArticle.type === 'blog') {
          html = window.__jekyllArticle.html;
          delete window.__jekyllArticle;
        } else {
          // Path 2: SPA navigation — fetch the Jekyll-generated blog page and extract content
          const response = await fetch(`/blog/${slug}/`);
          if (!response.ok) {
            const legacyResponse = await fetch(`/blog/${slug}.html`);
            if (!legacyResponse.ok) throw new Error('Blog post not found');
            html = await legacyResponse.text();
          } else {
            const pageHtml = await response.text();
            const doc = new DOMParser().parseFromString(pageHtml, 'text/html');
            const article = doc.querySelector('.blog-article-content');
            if (article) {
              html = article.innerHTML;
            } else {
              const legacyResponse = await fetch(`/blog/${slug}.html`);
              if (!legacyResponse.ok) throw new Error('Blog post not found');
              html = await legacyResponse.text();
            }
          }
        }
        this._blogCache.set(slug, html);
      }
      
      container.innerHTML = `
        <div class="ttt-chapter-content">
          <article class="ttt-chapter-body">
            ${html}
          </article>
        </div>
      `;
      
      // Process $symbol markup (same as symbol studies)
      this.processStudyMarkup(container);

      // Make plain-text scripture references clickable
      this.linkifyScriptureRefs(container);
      
      // Add verse tooltips to existing manually-created scripture links
      // (linkifyScriptureRefs only handles text nodes; blog HTML has pre-wrapped <a> tags)
      container.querySelectorAll('a[onclick*="contentType:\'bible\'"]').forEach(link => {
        const m = link.getAttribute('onclick')?.match(/book:'([^']+)'.*?chapter:(\d+)(?:.*?verse:(\d+))?/);
        if (m) {
          const rawBook = m[1], ch = m[2], v = m[3];
          const book = (typeof normalizeBookName === 'function') ? normalizeBookName(rawBook) : rawBook;
          const ref = `${book} ${ch}${v ? ':' + v : ''}`;
          link.dataset.ref = ref;
          link.classList.add('scripture-ref');
          const trans = (typeof getDefaultTranslation === 'function') ? getDefaultTranslation() : 'akjv';
          link.href = `/reader/bible/${trans}/${encodeURIComponent(book)}/${ch}${v ? '.' + v : ''}`;
          link.setAttribute('onmouseenter', "if(typeof showVerseTooltip==='function')showVerseTooltip(this,event)");
          link.setAttribute('onmouseleave', "if(typeof hideVerseTooltip==='function')hideVerseTooltip()");
          link.setAttribute('onclick', "return handleScriptureNav(this,event)");
        }
      });
      
      // Add Strong's number hover tooltips (both explicit strongs-link and data-strongs annotated elements)
      container.querySelectorAll('a.strongs-link, [data-strongs]').forEach(link => {
        if (link.dataset.deriveKey) return; // data-derive-key elements get their own handler
        link.setAttribute('onmouseenter', "if(typeof showStrongsTooltip==='function')showStrongsTooltip(this,event)");
        link.setAttribute('onmouseleave', "if(typeof hideStrongsTooltip==='function')hideStrongsTooltip()");
        if (!link.getAttribute('onclick') && link.dataset.strongs) {
          link.setAttribute('onclick', "navigateToStrongs('" + link.dataset.strongs + "', event)");
          link.style.cursor = 'pointer';
        }
      });

      // Ensure Bible data is loaded so verse tooltips can show text
      if (typeof Bible !== 'undefined' && Bible.loadTranslation) {
        Bible.loadTranslation(getDefaultTranslation()).catch(() => {});
      }
      
      // Re-execute any inline scripts from the loaded HTML
      container.querySelectorAll('script').forEach(oldScript => {
        const newScript = document.createElement('script');
        newScript.textContent = oldScript.textContent;
        oldScript.parentNode.replaceChild(newScript, oldScript);
      });

      // Update SEO meta tags for this blog post (for SPA navigation)
      if (typeof BlogView !== 'undefined') {
        const posts = await BlogView.loadPosts();
        const post = posts.find(p => p.slug === slug);
        if (post) {
          document.title = `${post.title} — Time Tested Bible`;
          const setMeta = (prop, content) => {
            let el = document.querySelector(`meta[property="${prop}"]`) || document.querySelector(`meta[name="${prop}"]`);
            if (el) el.setAttribute('content', content);
          };
          setMeta('og:title', post.title);
          setMeta('og:description', post.summary);
          setMeta('twitter:title', post.title);
          setMeta('twitter:description', post.summary);
          if (post.image) {
            const absImage = post.image.startsWith('http') ? post.image : `https://timetested.bible${post.image}`;
            setMeta('og:image', absImage);
            setMeta('twitter:image', absImage);
          }
          ReaderView._blogMetaActive = true;
        }
      }

    } catch (e) {
      container.innerHTML = `<div class="reader-error">Error loading blog post: ${e.message}</div>`;
    }
  },

  /**
   * Load the AI Reviews page (not a chapter; content from /extra/AI_REVIEWS_PAGE.md)
   */
  async loadTimeTestedReviewsPage(container) {
    try {
      const response = await fetch('/extra/AI_REVIEWS_PAGE.md');
      if (!response.ok) throw new Error('Reviews page not found');
      const markdown = await response.text();
      const html = this.renderMarkdown(markdown);
      const chapters = typeof TIME_TESTED_CHAPTERS !== 'undefined' ? TIME_TESTED_CHAPTERS : [];
      const lastChapter = chapters.length > 0 ? chapters[chapters.length - 1] : null;
      container.innerHTML = `
        <div class="ttt-chapter-content">
          <h2 class="ttt-chapter-heading">What Reviewers Say</h2>
          <article class="ttt-chapter-body">
            ${html}
          </article>
          <nav class="ttt-chapter-nav ttt-chapter-nav-bottom">
            ${lastChapter ? `<button class="ttt-nav-btn" onclick="AppStore.dispatch({type:'SET_VIEW',view:'reader',params:{contentType:'timetested',chapterId:'${lastChapter.id}'}})">◀ ${lastChapter.title}</button>` : '<span></span>'}
            <button class="ttt-nav-btn" onclick="AppStore.dispatch({type:'SET_VIEW',view:'reader',params:{contentType:'timetested'}})">📚 Index</button>
          </nav>
        </div>
      `;
      this.linkifyScriptureRefs(container);
      this.linkifySymbolRefs(container);
    } catch (e) {
      container.innerHTML = `<div class="reader-error">Error loading reviews: ${e.message}</div>`;
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
      el.style.backgroundColor = 'var(--reader-highlight)';
      setTimeout(() => {
        el.style.backgroundColor = '';
      }, 2000);
    }
  },

  /**
   * Scroll to verse citation anchor (e.g. #ref-genesis-1-14) when opening chapter from Bible book icon
   * @param {Element} container - Container to search within (e.g. #bible-explorer-text)
   */
  scrollToVerseAnchor(container) {
    const hash = window.location.hash;
    if (!hash || !container) return;
    const id = hash.slice(1);
    if (!id.startsWith('ref-')) return;
    const el = container.querySelector(`#${CSS.escape(id)}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  },

  /**
   * Set up IntersectionObserver scroll spy that updates URL hash as user scrolls past headings.
   * Uses replaceState (not pushState) to avoid polluting browser history.
   * @param {Element} container - Scrollable container with heading elements
   */
  setupScrollSpy(container) {
    // Clean up any previous observer
    this.teardownScrollSpy();

    const headings = container.querySelectorAll('h1[id], h2[id], h3[id], h4[id], h5[id], h6[id]');
    if (!headings.length) return;

    const visibleHeadings = new Set();

    this._scrollSpyObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          visibleHeadings.add(entry.target);
        } else {
          visibleHeadings.delete(entry.target);
        }
      });

      // Pick the topmost visible heading (by DOM order)
      let topHeading = null;
      for (const h of headings) {
        if (visibleHeadings.has(h)) { topHeading = h; break; }
      }
      if (topHeading) {
        const newHash = '#' + topHeading.id;
        if (window.location.hash !== newHash) {
          history.replaceState(history.state, '', newHash);
        }
      }
    }, {
      root: container,
      rootMargin: '0px 0px -80% 0px'
    });

    headings.forEach(h => this._scrollSpyObserver.observe(h));
  },

  /**
   * Disconnect the scroll spy observer (call on navigation away or new content)
   */
  teardownScrollSpy() {
    if (this._scrollSpyObserver) {
      this._scrollSpyObserver.disconnect();
      this._scrollSpyObserver = null;
    }
  },

  /**
   * Scroll to a heading matching the current URL hash (for deep-linking into study sections).
   * Handles any heading with an id, complementing scrollToVerseAnchor which only handles ref-* anchors.
   * @param {Element} container - Container to search within
   */
  scrollToHashHeading(container) {
    const hash = window.location.hash;
    if (!hash || !container) return;
    const id = hash.slice(1);
    // Skip ref-* anchors — those are handled by scrollToVerseAnchor
    if (id.startsWith('ref-')) return;
    const el = container.querySelector(`#${CSS.escape(id)}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
    
    // Strong's panel only opens when user clicks a Strong's button
    
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
              <strong>Strong's:</strong> ${this._renderStrongsButtons(symbol.strongs)}
            </div>
            ` : ''}
          </header>
          
          <section class="symbol-meanings">
            <div class="meaning-block meaning-is">
              <div class="meaning-label">Meaning:</div>
              <div class="meaning-value">${symbol.meaning}</div>
            </div>
            
            <div class="meaning-block meaning-sentence">
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
              📚 View Full Study
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
    const keys = Object.entries(SYMBOL_DICTIONARY || {})
      .filter(([, symbol]) => symbol.recordType !== 'alias')
      .map(([key]) => key);
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
    const symbols = Object.entries(SYMBOL_DICTIONARY || {})
      .filter(([, symbol]) => symbol.recordType !== 'alias');
    
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
              <div class="symbol-index-meaning">${symbol.meaning}</div>
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
  },

  // ═══════════════════════════════════════════════════════════════════════
  // APOCRYPHA (1 Enoch, Jubilees, Jasher)
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Render Apocrypha content within the Bible frame.
   * Uses params.book (enoch/jubilees/jasher) and params.chapter.
   */
  renderApocryphaInBibleFrame(state, derived, container, params) {
    const existingPage = container.querySelector('#bible-explorer-page');
    if (!existingPage && typeof BibleView !== 'undefined') {
      BibleView.renderStructure(container, { content: { params: { contentType: 'apocrypha' } } });
    } else if (existingPage && typeof BibleView !== 'undefined' && BibleView.syncSelectorVisibility) {
      BibleView.syncSelectorVisibility({ content: { params: { contentType: 'apocrypha' } } });
    }

    const textArea = container.querySelector('#bible-explorer-text');
    if (!textArea) return;

    const bookSlug = params.book; // 'enoch', 'jubilees', 'jasher'
    if (!bookSlug) {
      this._renderApocryphaIndex(textArea);
      const titleEl = container.querySelector('#bible-chapter-title');
      if (titleEl) titleEl.textContent = 'Apocrypha';
      this.hideChapterNav(container);
      return;
    }

    const bookName = this._APOCRYPHA_NAMES[bookSlug] || bookSlug;

    if (typeof Classics !== 'undefined' && !Classics.isLoaded(bookSlug)) {
      textArea.innerHTML = `<div class="symbol-study-loading">Loading ${bookName}...</div>`;
      Classics.loadAuthor(bookSlug).then(() => {
        this._renderPseudepigraphaContent(textArea, bookSlug, bookName, params);
      });
    } else {
      this._renderPseudepigraphaContent(textArea, bookSlug, bookName, params);
    }

    const titleEl = container.querySelector('#bible-chapter-title');
    if (titleEl) titleEl.textContent = params.chapter ? `${bookName} ${params.chapter}` : bookName;
    this.hideChapterNav(container);
  },

  _scrollToApocryphaVerse(container, verse) {
    const el = container.querySelector(`#apo-v-${verse}`);
    if (el) {
      container.querySelectorAll('.apo-verse-highlight').forEach(v => v.classList.remove('apo-verse-highlight'));
      el.classList.add('apo-verse-highlight');
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  },

  _formatApocryphaText(text) {
    // Split into lines (each line typically starts with "N. verse text")
    const lines = text.split('\n');
    const formatted = lines.map(line => {
      // Match verse number at start: "1. text" or "23. text"
      const match = line.match(/^(\d+)\.\s+(.*)$/);
      if (match) {
        const vn = match[1];
        const vtext = match[2];
        return `<span id="apo-v-${vn}" class="apo-verse"><span class="apo-verse-num">${vn}</span>${vtext}</span>`;
      }
      return `<span class="apo-verse">${line}</span>`;
    });
    return formatted.join('\n');
  },

  _linkifyExclusionText(text, bookSlug) {
    if (!text) return text;

    // Helper: apply a regex replacement only to text outside HTML tags
    function replaceOutsideTags(html, regex, replacer) {
      return html.replace(/(<[^>]+>)|([^<]+)/g, (m, tag, txt) => {
        if (tag) return tag;
        return txt.replace(regex, replacer);
      });
    }

    // First pass: linkify self-references (ch. N, N:N) BEFORE scripture linkification
    // "ch. N" or "ch. N–M"
    text = replaceOutsideTags(text, /ch\.\s*(\d+)(?:\s*[\u2013-]\s*(\d+))?/g, (match, ch1) => {
      const url = `/reader/apocrypha/${bookSlug}/${ch1}`;
      const onclick = `AppStore.dispatch({type:'SET_VIEW',view:'reader',params:{contentType:'apocrypha',book:'${bookSlug}',chapter:${ch1}}}); return false;`;
      return `<a href="${url}" onclick="${onclick}" class="not-scripture-link">${match}</a>`;
    });

    // Linkify canonical scripture references (Genesis 1:14, Ecclesiastes 9:5, etc.)
    // This runs second so it wraps "BookName N:N" patterns; bare N:N already handled above
    if (typeof linkifyScriptureReferences === 'function') {
      text = linkifyScriptureReferences(text);
    }

    // Final pass: linkify bare N:N self-references not yet wrapped (only outside tags)
    text = replaceOutsideTags(text, /(\d+):(\d+)(?:\s*[\u2013-]\s*(\d+))?/g, (match, ch, v1) => {
      const url = `/reader/apocrypha/${bookSlug}/${ch}.${v1}`;
      const onclick = `AppStore.dispatch({type:'SET_VIEW',view:'reader',params:{contentType:'apocrypha',book:'${bookSlug}',chapter:${parseInt(ch)},verse:${parseInt(v1)}}}); return false;`;
      return `<a href="${url}" onclick="${onclick}" class="not-scripture-link">${match}</a>`;
    });

    return text;
  },

  _getBookWarning(bookSlug) {
    const info = this._BOOK_INFO[bookSlug];
    let warning = info?.warning || 'This text is not canonical Scripture.';
    warning = this._linkifyExclusionText(warning, bookSlug);
    const blogBooks = ['enoch', 'jubilees', 'jasher'];
    const link = blogBooks.includes(bookSlug)
      ? ` <a href="/blog/why-jasher-jubilees-enoch-are-not-scripture" class="not-scripture-link" onclick="event.preventDefault();AppStore.dispatch({type:'SET_VIEW',view:'reader',params:{contentType:'blog',slug:'why-jasher-jubilees-enoch-are-not-scripture'}})">Read more</a>`
      : '';
    return warning + link;
  },

  _renderApocryphaIndex(textArea) {
    const sections = [
      { label: 'Pseudepigrapha', books: [
        { slug: 'enoch', name: '1 Enoch', desc: 'Apocalyptic text attributed to Enoch. 108 chapters. R.H. Charles (1917).' },
        { slug: '2enoch', name: '2 Enoch', desc: 'Secrets of Enoch. 68 chapters. Slavonic apocalyptic text.' },
        { slug: 'jubilees', name: 'Jubilees', desc: 'Retelling of Genesis through Exodus 12. 50 chapters. R.H. Charles (1913).' },
        { slug: 'jasher', name: 'Jasher', desc: 'Narrative history paralleling Genesis through Joshua. 91 chapters. (1840).' },
        { slug: '2baruch', name: '2 Baruch', desc: 'Syriac Apocalypse of Baruch. 87 chapters.' },
        { slug: 'psalmsSolomon', name: 'Psalms of Solomon', desc: '18 psalms from the Second Temple period.' },
        { slug: 'testaments', name: 'Testaments of XII Patriarchs', desc: 'Final words of Jacob\'s twelve sons. 12 testaments.' },
      ]},
      { label: 'Deuterocanon (KJV Apocrypha)', books: [
        { slug: 'sirach', name: 'Sirach', desc: 'Wisdom of Ben Sira (Ecclesiasticus). 51 chapters.' },
        { slug: 'wisdom', name: 'Wisdom of Solomon', desc: 'Wisdom literature. 19 chapters.' },
        { slug: 'tobit', name: 'Tobit', desc: 'Narrative of Tobit and Tobias. 14 chapters.' },
        { slug: 'judith', name: 'Judith', desc: 'Narrative of Judith and Holofernes. 16 chapters.' },
        { slug: 'baruch', name: 'Baruch', desc: 'Attributed to Baruch son of Neriah. 5 chapters.' },
        { slug: '1esdras', name: '1 Esdras', desc: 'Parallel account of Chronicles–Ezra–Nehemiah. 9 chapters.' },
        { slug: '2esdras', name: '2 Esdras', desc: 'Apocalyptic visions of Ezra (4 Ezra). 16 chapters.' },
        { slug: '1maccabees', name: '1 Maccabees', desc: 'Hasmonean revolt and kingdom. 16 chapters.' },
        { slug: '2maccabees', name: '2 Maccabees', desc: 'Parallel account of the Maccabean period. 15 chapters.' },
      ]},
      { label: 'Additions to Daniel & Esther', books: [
        { slug: 'letterJeremiah', name: 'Letter of Jeremiah', desc: 'Epistle against idolatry.' },
        { slug: 'prayerAzariah', name: 'Prayer of Azariah', desc: 'Song of the Three Holy Children.' },
        { slug: 'susanna', name: 'Susanna', desc: 'Daniel vindicates a falsely accused woman.' },
        { slug: 'belDragon', name: 'Bel and the Dragon', desc: 'Daniel exposes idol worship.' },
        { slug: 'prayerManasseh', name: 'Prayer of Manasseh', desc: 'Penitential prayer of King Manasseh.' },
      ]},
    ];

    const renderSection = (section) => {
      let html = `<h2 class="classics-section-label">${section.label}</h2>`;
      html += `<div class="classics-works-list">`;
      html += section.books.map(b => `
        <a href="/reader/apocrypha/${b.slug}" class="classics-work-item" onclick="AppStore.dispatch({type:'SET_VIEW',view:'reader',params:{contentType:'apocrypha',book:'${b.slug}'}}); return false;">
          <span class="classics-work-name">${b.name}</span>
          <span class="classics-work-meta">${b.desc}</span>
        </a>`).join('');
      html += `</div>`;
      return html;
    };

    textArea.innerHTML = `
      <div class="classics-index">
        <h1 class="classics-index-title">Apocrypha</h1>
        <p class="classics-index-intro">Extra-biblical texts frequently referenced alongside Scripture. Select a book to begin reading.</p>
        <div class="not-scripture-banner">These texts contain useful historical context but are not canonical Scripture. Each book page explains the specific reasons for its exclusion from the canon.</div>
        ${sections.map(renderSection).join('')}
      </div>
    `;
  },

  // ═══════════════════════════════════════════════════════════════════════
  // CLASSICS (Philo & Josephus)
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Render Classics content (Philo or Josephus) within the Bible frame.
   * Shows index → work → section with lazy loading of data.
   */
  renderClassicsInBibleFrame(state, derived, container, authorId, params) {
    // Ensure Bible structure exists
    const existingPage = container.querySelector('#bible-explorer-page');
    if (!existingPage && typeof BibleView !== 'undefined') {
      BibleView.renderStructure(container, { content: { params: { contentType: authorId } } });
    } else if (existingPage && typeof BibleView !== 'undefined' && BibleView.syncSelectorVisibility) {
      BibleView.syncSelectorVisibility({ content: { params: { contentType: authorId } } });
    }

    const textArea = container.querySelector('#bible-explorer-text');
    if (!textArea) return;

    const workSlug = params.work;
    const AUTHOR_NAMES = { philo: 'Philo', josephus: 'Josephus' };
    const authorName = AUTHOR_NAMES[authorId] || authorId;

    // Lazy-load data, then render
    if (typeof Classics !== 'undefined' && !Classics.isLoaded(authorId)) {
      textArea.innerHTML = `<div class="symbol-study-loading">Loading ${authorName}...</div>`;
      Classics.loadAuthor(authorId).then(() => {
        this._renderClassicsContent(textArea, container, authorId, authorName, workSlug, params);
      });
    } else {
      this._renderClassicsContent(textArea, container, authorId, authorName, workSlug, params);
    }

    // Update title
    const titleEl = container.querySelector('#bible-chapter-title');
    if (titleEl) titleEl.textContent = authorName;
    this.hideChapterNav(container);
  },

  /**
   * Internal: render classics content once data is loaded.
   * Continuous-scroll design: entire work (Philo) or entire book (Josephus) rendered at once.
   */
  _renderClassicsContent(textArea, container, authorId, authorName, workSlug, params) {
    if (!workSlug) {
      this._renderClassicsIndex(textArea, authorId, authorName);
      return;
    }

    const workName = typeof Classics !== 'undefined' ? Classics.getWorkBySlug(authorId, workSlug) : null;
    if (!workName) {
      textArea.innerHTML = `<div class="reader-error">Work "${workSlug}" not found for ${authorName}. <a href="#" onclick="AppStore.dispatch({type:'SET_VIEW',view:'reader',params:{contentType:'${authorId}'}}); return false;">Back to index</a></div>`;
      return;
    }

    if (authorId === 'philo') {
      this._renderPhiloWork(textArea, workName, workSlug, params.section);
    } else {
      const book = params.book;
      if (book == null) {
        // No book selected — default to book 1
        const sections = Classics.getSectionList('josephus', workName);
        const firstBook = sections.length > 0 ? parseInt(sections[0].split('|')[1]) : 1;
        AppStore.dispatch({ type: 'SET_VIEW', view: 'reader', params: { contentType: 'josephus', work: workSlug, book: firstBook } });
        return;
      }
      this._renderJosephusBook(textArea, workName, workSlug, book, params.chapter, params.section);
    }
  },

  /**
   * Render author index — clean list of works (not button grids)
   */
  _renderClassicsIndex(textArea, authorId, authorName) {
    const works = typeof Classics !== 'undefined' ? Classics.getWorks(authorId) : [];
    const intro = authorId === 'philo'
      ? 'Philo of Alexandria (c. 20 BC – c. 50 AD). Hellenistic Jewish philosopher whose allegorical Torah commentaries provide key evidence for Second Temple calendar and Sabbath practices.'
      : 'Flavius Josephus (37 – c. 100 AD). First-century Jewish historian and our primary extra-biblical source for Second Temple period history.';

    textArea.innerHTML = `
      <div class="classics-index">
        <h1 class="classics-index-title">${authorName}</h1>
        <p class="classics-index-intro">${intro}</p>
        <div class="classics-works-list">
          ${works.map(work => {
            const slug = Classics.getWorkSlug(work);
            const count = Classics.getSectionList(authorId, work).length;
            const onclick = authorId === 'josephus'
              ? `onClassicsWorkChange('${slug}')`
              : `AppStore.dispatch({type:'SET_VIEW',view:'reader',params:{contentType:'${authorId}',work:'${slug}'}})`;
            return `
              <a href="/reader/${authorId}/${slug}" class="classics-work-item" onclick="${onclick}; return false;">
                <span class="classics-work-name">${work}</span>
                <span class="classics-work-meta">${count} sections</span>
              </a>`;
          }).join('')}
        </div>
      </div>
    `;
  },

  _APOCRYPHA_NAMES: {
    enoch: '1 Enoch', jubilees: 'Jubilees', jasher: 'Jasher',
    '2enoch': '2 Enoch', '2baruch': '2 Baruch', psalmsSolomon: 'Psalms of Solomon',
    testaments: 'Testaments of XII Patriarchs',
    sirach: 'Sirach', wisdom: 'Wisdom of Solomon', tobit: 'Tobit', judith: 'Judith',
    baruch: 'Baruch', letterJeremiah: 'Letter of Jeremiah', prayerAzariah: 'Prayer of Azariah',
    susanna: 'Susanna', belDragon: 'Bel and the Dragon', prayerManasseh: 'Prayer of Manasseh',
    '1esdras': '1 Esdras', '2esdras': '2 Esdras',
    '1maccabees': '1 Maccabees', '2maccabees': '2 Maccabees',
  },

  _BOOK_INFO: {
    enoch: {
      intro: 'The Book of Enoch (1 Enoch). R.H. Charles translation (1917). Apocalyptic text attributed to Enoch, great-grandfather of Noah. 108 chapters covering the Watchers, Parables, Astronomical Book, Dream Visions, and Epistle of Enoch.',
      exclusion: '1 Enoch teaches a conscious intermediate state for the dead (ch. 22), with separate compartments for righteous and wicked souls awaiting final judgment. This directly contradicts Ecclesiastes 9:5 ("the dead know nothing") and Psalm 146:4 ("his thoughts perish"). The Astronomical Book (ch. 72\u201382) promotes a 364-day solar calendar that contradicts the lunar-observable calendar established in Genesis 1:14 and Psalm 104:19. While Jude 14\u201315 quotes from 1 Enoch, citation does not imply canonization\u2014Paul likewise quoted pagan poets (Acts 17:28, Titus 1:12) without endorsing their works as Scripture.',
      warning: '1 Enoch contradicts Scripture on the state of the dead (Ecclesiastes 9:5) and the calendar (Genesis 1:14).',
    },
    jubilees: {
      intro: 'The Book of Jubilees. R.H. Charles translation (1913). Retelling of Genesis through Exodus 12, structured around jubilee periods. 50 chapters covering creation through the Passover.',
      exclusion: 'Jubilees imposes a rigid 364-day solar calendar (ch. 6:32\u201338) and condemns anyone who observes the moon, directly contradicting Genesis 1:14\u201316 which appoints the moon as a sign for seasons. It elevates Sabbath-breaking to a capital offense punishable by death in heaven (ch. 2:25\u201327), going beyond what Torah prescribes. The book also introduces an elaborate angelology and demonology (the "Prince of Mastema") that has no basis in the Torah. While it preserves useful chronological details, its theological additions and calendar polemics place it outside the canonical tradition.',
      warning: 'Jubilees contradicts Genesis 1:14\u201316 by condemning lunar observation and imposing a solar-only calendar.',
    },
    jasher: {
      intro: 'The Book of Jasher. Translation from Hebrew (1840). Narrative history paralleling Genesis through Joshua. 91 chapters covering creation through the conquest of Canaan.',
      exclusion: 'The Book of Jasher claims to be the ancient text referenced in Joshua 10:13 and 2 Samuel 1:18, but this identification is unverifiable and most scholars consider the 1840 "translation" a medieval composition, not an ancient document. While its narrative largely follows the biblical account and contains useful midrashic expansions, it introduces fictional embellishments (Abram destroying Terah\'s idols, Nimrod casting Abram into a furnace) that have no basis in Scripture and can be mistaken for biblical history. The text was never part of any Jewish or Christian canonical list.',
      warning: 'Jasher is likely a medieval composition, not the ancient text referenced in Joshua 10:13.',
    },
    '2enoch': {
      intro: 'The Secrets of Enoch (2 Enoch). Slavonic apocalyptic text. 68 chapters describing Enoch\'s journey through ten heavens and God\'s revelation of creation.',
      exclusion: '2 Enoch survives only in Slavonic manuscripts dating to the 14th century or later, with no Hebrew or Greek original extant. Its theology diverges significantly from the Torah: it describes ten heavens with elaborate angelic hierarchies (ch. 20\u201322), teaches the pre-existence of souls, and presents a creation account (ch. 25\u201333) that contradicts Genesis in multiple details. The text shows clear Christian interpolation (references to the Trinity in some manuscripts) and contains mystical speculation about Melchizedek\'s miraculous birth (ch. 68\u201373) that has no basis in Scripture. Its late manuscript tradition and theological inconsistencies place it well outside any canonical consideration.',
      warning: '2 Enoch survives only in late Slavonic manuscripts with no ancient original. It contains theological ideas foreign to Torah.',
    },
    '2baruch': {
      intro: 'The Syriac Apocalypse of Baruch (2 Baruch). 87 chapters of apocalyptic visions attributed to Baruch, Jeremiah\'s scribe.',
      exclusion: '2 Baruch teaches an elaborate eschatology including a conscious intermediate state for the dead (ch. 30), a transformed resurrection body that becomes like angels or stars (ch. 49\u201351), and a messianic kingdom on earth followed by a separate eternal age (ch. 29\u201330, 72\u201374). These doctrines have no basis in Torah, which teaches that the dead "sleep in the dust" (Daniel 12:2). The text was written after 70 AD (it reflects the destruction of the Second Temple) and was attributed pseudonymously to Baruch to give it authority. It survives primarily in a single Syriac manuscript, and was never included in any Jewish or Christian canonical list.',
      warning: '2 Baruch teaches doctrines about the afterlife and resurrection that have no basis in Torah.',
    },
    psalmsSolomon: {
      intro: 'Psalms of Solomon. 18 psalms from the Second Temple period (1st century BC), likely composed in response to Pompey\'s conquest of Jerusalem in 63 BC.',
      exclusion: 'The Psalms of Solomon are pseudonymously attributed to King Solomon but were composed roughly 900 years after his death, in response to Pompey\'s conquest of Jerusalem (63 BC). While they contain beautiful devotional poetry, Psalm 17 introduces a militant messianic figure who will violently purge Jerusalem of Gentiles and rule with an iron rod\u2014a political theology at odds with the Torah\'s vision of Israel as a "kingdom of priests" (Exodus 19:6). The collection was known to early Christians but was never included in the Hebrew Bible, the Septuagint canon, or any authoritative canonical list.',
      warning: 'The Psalms of Solomon were composed ~900 years after Solomon and were never part of any canonical list.',
    },
    testaments: {
      intro: 'Testaments of the Twelve Patriarchs. Final words and moral instruction attributed to each of Jacob\'s twelve sons. 12 testaments with multiple chapters.',
      exclusion: 'The Testaments of the Twelve Patriarchs contain extensive Christian interpolations that betray their final form as a 2nd-century AD Christian editing of older Jewish material. References to the virgin birth, the crucifixion, and the Trinity appear throughout (e.g., Testament of Levi 2:11, Testament of Benjamin 3:8). The original Jewish core may be ancient, but the Christian reworking makes it impossible to separate authentic pre-Christian material from later additions. The ethical teachings are often excellent, but the theological framework reflects post-biblical developments foreign to Torah.',
      warning: 'The Testaments contain extensive Christian interpolations that make it impossible to recover the original Jewish text.',
    },
    sirach: {
      intro: 'The Wisdom of Ben Sira, also called Sirach or Ecclesiasticus. 51 chapters of wisdom literature. KJV 1611 Apocrypha text.',
      exclusion: 'The rabbis debated Sirach\'s status extensively (Tosefta Yadayim 2:13) and ultimately excluded it, ruling that "the books of Ben Sira and all books written from then on do not defile the hands"\u2014the technical term for canonical status. The primary concern was chronological: Ben Sira wrote around 180 BC, well after the prophetic period was considered closed. The Hebrew original was lost for centuries and only partially recovered in the Cairo Geniza (1896) and at Masada, raising questions about textual integrity. While its wisdom is often excellent and echoes Proverbs, its teachings on almsgiving as atonement for sin (3:30, 29:12) approach a doctrine of merit-based salvation absent from Torah.',
      warning: 'Sirach was explicitly excluded by the rabbis (Tosefta Yadayim 2:13) as written after the close of the prophetic era.',
    },
    wisdom: {
      intro: 'The Wisdom of Solomon. 19 chapters of wisdom literature. KJV 1611 Apocrypha text.',
      exclusion: 'Despite its attribution to Solomon, the Wisdom of Solomon was composed in Greek (not Hebrew) in Alexandria, Egypt, probably in the 1st century BC\u2014roughly 900 years after Solomon\'s death. The pseudonymous attribution is the primary concern: the author writes in Solomon\'s voice ("I also am a mortal man," 7:1) but the Greek language, Hellenistic literary style, and engagement with Greek philosophical concepts (the pre-existence of the soul in 8:19\u201320, the body as a "burden" to the soul in 9:15) place it firmly in the Alexandrian diaspora. While some passages can be read in harmony with Torah (e.g. "the souls of the righteous are in the hand of God" in 3:1 need not imply consciousness), the overall framework draws heavily on Platonic categories foreign to the Hebrew wisdom tradition. It was never part of the Hebrew Bible.',
      warning: 'Wisdom of Solomon was composed in Greek ~900 years after Solomon under a pseudonymous attribution.',
    },
    tobit: {
      intro: 'The Book of Tobit. 14 chapters of narrative set during the Assyrian exile. KJV 1611 Apocrypha text.',
      exclusion: 'Tobit contains practices that directly conflict with Torah: burning the heart and liver of a fish to produce smoke that drives away a demon (6:7\u20138, 8:2\u20133). This is a form of magical incantation that Deuteronomy 18:10\u201312 explicitly prohibits. The angel Raphael also practices deception, traveling under a false identity (5:12\u201318), and the narrative includes folklore elements (a demon who serially kills seven husbands) more characteristic of ancient Near Eastern folk tales than biblical revelation. While the story promotes piety and family devotion, these elements disqualified it from the Hebrew canon. It survives in multiple contradictory Greek recensions, suggesting extensive editing over time.',
      warning: 'Tobit describes magical practices (burning fish organs to repel demons) prohibited by Deuteronomy 18:10\u201312.',
    },
    judith: {
      intro: 'The Book of Judith. 16 chapters of narrative. KJV 1611 Apocrypha text.',
      exclusion: 'Judith contains well-known historical inaccuracies that even ancient readers recognized. The opening verse calls Nebuchadnezzar "king of the Assyrians, who reigned in Nineveh"\u2014but Nebuchadnezzar was king of Babylon, and Nineveh had already been destroyed before his reign. The book also places the story after the return from exile (4:3, 5:18\u201319) while simultaneously describing pre-exilic conditions, creating an impossible chronology. The heroine Judith uses deliberate deception and seduction as her primary strategy (10:11\u201319, 12:10\u201320), and the narrative celebrates this without qualification. Most scholars consider the book a historical novel rather than a record of actual events.',
      warning: 'Judith contains clear historical errors: it calls Nebuchadnezzar "king of the Assyrians, who reigned in Nineveh."',
    },
    baruch: {
      intro: 'The Book of Baruch. 5 chapters attributed to Baruch son of Neriah, Jeremiah\'s scribe. KJV 1611 Apocrypha text.',
      exclusion: 'Baruch claims to have been written by Jeremiah\'s scribe in Babylon (1:1\u20132), but its literary dependence on Daniel (which was written later) and its polished Greek style suggest a much later composition, likely the 2nd or 1st century BC. The text is largely a mosaic of phrases borrowed from Jeremiah, Isaiah, Deuteronomy, and Job, arranged into new compositions. While devotionally earnest, it introduces no new prophetic revelation and was never part of the Hebrew canon. Jerome noted that "the Hebrews neither read nor possess" the book.',
      warning: 'Baruch claims authorship by Jeremiah\'s scribe but shows literary dependence on later texts. Jerome noted the Hebrews did not possess it.',
    },
    letterJeremiah: {
      intro: 'The Letter of Jeremiah. A single chapter warning against idolatry, attributed to Jeremiah. KJV 1611 Apocrypha text.',
      exclusion: 'The Letter of Jeremiah purports to be written by the prophet Jeremiah to the exiles in Babylon, but its Greek composition, repetitive rhetorical style, and dependence on Jeremiah 10 and Isaiah 44\u201346 suggest it is a later composition in Jeremiah\'s name. A Greek fragment was found among the Dead Sea Scrolls (7Q2), dating it to at least the 1st century BC, but pseudonymous attribution disqualifies it under the Torah\'s own standard that prophets must speak in their own name and be accountable for their words (Deuteronomy 18:20\u201322).',
      warning: 'The Letter of Jeremiah is pseudonymously attributed to the prophet and was composed in Greek, not Hebrew.',
    },
    prayerAzariah: {
      intro: 'The Prayer of Azariah and the Song of the Three Holy Children. An addition to Daniel 3 in the Greek Septuagint. KJV 1611 Apocrypha text.',
      exclusion: 'This text is an addition inserted into the Greek translation of Daniel between verses 23 and 24 of chapter 3. It does not appear in the Hebrew/Aramaic text of Daniel. The prayer and hymn are devotionally beautiful but were recognized as additions: Jerome included them in the Vulgate but marked them as not found in the Hebrew. Their absence from the original Semitic text of Daniel, combined with their interruption of the narrative flow, indicates they are liturgical compositions inserted by later editors.',
      warning: 'This text was inserted into the Greek Daniel. It does not appear in the Hebrew/Aramaic original.',
    },
    susanna: {
      intro: 'The Story of Susanna. An addition to Daniel in the Greek Septuagint. KJV 1611 Apocrypha text.',
      exclusion: 'Susanna is an addition to the Book of Daniel found only in the Greek text, not in the Hebrew/Aramaic original. The story contains a wordplay on Greek tree names (mastic/cut, holm oak/cleave in verses 54\u201359) that only works in Greek, proving it was composed in Greek rather than translated from a Semitic original. This Greek wordplay was noted by Julius Africanus in the 3rd century as evidence against its authenticity. While the story illustrates Daniel\'s wisdom, its Greek origin disqualifies it from a Hebrew canon.',
      warning: 'Susanna contains Greek wordplays proving it was composed in Greek, not translated from Hebrew.',
    },
    belDragon: {
      intro: 'Bel and the Dragon. An addition to Daniel in the Greek Septuagint. KJV 1611 Apocrypha text.',
      exclusion: 'Bel and the Dragon comprises two short narratives appended to Daniel in the Greek text. Like Susanna, it is absent from the Hebrew/Aramaic Daniel. The stories (Daniel exposing the priests of Bel through scattered ashes, Daniel killing a dragon by feeding it pitch cakes) read as folk tales rather than prophetic history. Jerome included them in the Vulgate but noted they were not in the Hebrew. The narrative of Daniel destroying a living dragon by feeding it an explosive concoction (v. 27) has no parallel in canonical Scripture and reflects the genre of Jewish folk legend.',
      warning: 'Bel and the Dragon is absent from the Hebrew Daniel. Its folk-tale style differs from canonical prophetic literature.',
    },
    prayerManasseh: {
      intro: 'The Prayer of Manasseh. A penitential prayer attributed to the wicked king Manasseh of Judah. KJV 1611 Apocrypha text.',
      exclusion: 'The Prayer of Manasseh claims to be the prayer referenced in 2 Chronicles 33:12\u201313, where Manasseh humbles himself before God during his captivity. However, 2 Chronicles itself does not include the text of that prayer\u2014it simply records that he prayed. This text was composed to fill that gap, likely in the 2nd or 1st century BC. It is not found in the Hebrew Bible or the Septuagint proper (it appears only in some manuscripts as an appendix). While its penitential theology is beautiful, its late and pseudonymous composition places it outside canonical consideration.',
      warning: 'The Prayer of Manasseh was composed centuries later to fill a gap in 2 Chronicles 33. It is not found in the Hebrew Bible.',
    },
    '1esdras': {
      intro: '1 Esdras. 9 chapters. A parallel account of 2 Chronicles 35\u201336, Ezra, and Nehemiah 7:38\u20138:12. KJV 1611 Apocrypha text.',
      exclusion: '1 Esdras largely reproduces material already found in 2 Chronicles and Ezra-Nehemiah, but rearranges the chronology and adds the "Debate of the Three Guardsmen" (ch. 3\u20134), a Persian court tale in which Zerubbabel wins a contest by arguing that "truth is strongest." This addition has no parallel in canonical Scripture and reads as wisdom literature grafted onto a historical framework. The chronological rearrangements create contradictions with the canonical order of events in Ezra-Nehemiah. Jerome rejected it, and it was never part of the Hebrew canon.',
      warning: '1 Esdras rearranges the chronology of Ezra-Nehemiah and adds a non-biblical court tale.',
    },
    '2esdras': {
      intro: '2 Esdras (4 Ezra). 16 chapters of apocalyptic visions. KJV 1611 Apocrypha text.',
      exclusion: '2 Esdras was written pseudonymously after 70 AD (it laments the destruction of the Temple) but attributed to Ezra, who lived roughly 500 years earlier. Chapters 1\u20132 and 15\u201316 are widely recognized as later Christian additions not present in the original text. Notably, 7:28 refers to "my son Jesus"\u2014a Latin rendering that reflects Christian editorial influence on the manuscript tradition. The text survives in Latin, Syriac, Ethiopic, Georgian, and Arabic but not in Greek or Hebrew, making the original irrecoverable. On the state of the dead, the KJV text is actually broadly compatible with Torah: 7:32 describes the dead as "asleep" in the earth, "dwelling in silence," awaiting future restoration\u2014language consistent with Daniel 12:2 and Ecclesiastes 9:5. Some later manuscript traditions include an additional passage (7:75\u2013101, discovered in 1875) that introduces conscious intermediate states, but this passage does not appear in the KJV 1611 text.',
      warning: '2 Esdras was written after 70 AD under the pseudonym of Ezra. Chapters 1\u20132 and 15\u201316 are later Christian additions.',
    },
    '1maccabees': {
      intro: '1 Maccabees. 16 chapters of Hasmonean history (175\u2013134 BC). KJV 1611 Apocrypha text.',
      exclusion: '1 Maccabees is arguably the most historically reliable of the Apocrypha. It was originally written in Hebrew (now lost) and provides an invaluable primary source for the Maccabean revolt. However, it was excluded from the Hebrew canon likely because it was composed too late (after ~100 BC) to be considered part of the prophetic tradition, which the rabbis believed ended with Malachi. The author himself acknowledges this: "there was great distress in Israel, such as had not been since the time that prophets ceased to appear among them" (9:27). The book records history, not prophecy, and makes no claim to divine inspiration.',
      warning: '1 Maccabees is valuable history but was written after the prophetic era closed. Its author acknowledges no prophet existed in his time (9:27).',
    },
    '2maccabees': {
      intro: '2 Maccabees. 15 chapters covering the Maccabean period (180\u2013161 BC). KJV 1611 Apocrypha text.',
      exclusion: '2 Maccabees introduces doctrines absent from Torah and used to support later theological developments: prayers and offerings for the dead (12:43\u201345, the primary proof-text for the Catholic doctrine of purgatory), the intercession of dead saints (15:12\u201316, where the deceased Onias and Jeremiah pray for Israel), and the pre-existence of the Temple in heaven (2:4\u20138). The compiler openly admits his work is an abridgment of a five-volume history by Jason of Cyrene (2:23) and apologizes for any errors (15:38\u201339)\u2014an admission inconsistent with inspired Scripture. Written in Greek, not Hebrew, it reflects Hellenistic Jewish theology from the Diaspora.',
      warning: '2 Maccabees introduces prayers for the dead (12:43\u201345) and intercession by dead saints\u2014doctrines absent from Torah.',
    },
  },

  // Chapter titles for pseudepigrapha (keyed by authorId)
  _CHAPTER_TITLES: {
    enoch: {
      1: 'Blessing of Enoch; The Coming Judgement',
      2: 'The Order of the Luminaries',
      3: 'The Evergreen Trees',
      4: 'The Heat of Summer',
      5: 'The Cycle of Nature; Obedience of Creation',
      6: 'The Fall of the Watchers',
      7: 'The Nephilim and Their Wickedness',
      8: 'The Teachings of Azazel',
      9: 'The Cry of the Archangels',
      10: 'God\'s Judgement on the Watchers',
      11: 'The Blessings of the Righteous',
      12: 'Enoch Hidden; Sent to the Watchers',
      13: 'Enoch\'s Message to Azazel',
      14: 'The Vision of the Heavenly Throne',
      15: 'God Rebukes the Watchers',
      16: 'The Spirits of the Giants',
      17: 'The First Journey: Fire and Darkness',
      18: 'The Treasuries of the Winds; The Corner-Stone',
      19: 'The Angels Who Sinned with Women',
      20: 'The Names of the Holy Angels',
      21: 'The Chaotic Place; Seven Bound Stars',
      22: 'The Hollow Places of the Dead',
      23: 'The Burning Fire in the West',
      24: 'The Seven Mountains and the Tree of Life',
      25: 'The Fragrant Tree Promised to the Righteous',
      26: 'Jerusalem: The Blessed Mountain',
      27: 'The Valley of the Accursed',
      28: 'The Desert in the East',
      29: 'Aromatic Trees of Frankincense',
      30: 'The Valley of Fragrant Waters',
      31: 'The Garden of Righteousness',
      32: 'The Mountains to the North-East',
      33: 'The Ends of the Earth; The Portals of Heaven',
      34: 'The Portals of the North',
      35: 'The Portals of the West',
      36: 'The Portals of the South and East',
      37: 'Introduction to the Parables',
      38: 'The First Parable: Judgement of the Wicked',
      39: 'The Dwelling-Places of the Righteous',
      40: 'The Four Archangels',
      41: 'The Secrets of the Heavens',
      42: 'Wisdom Finds No Dwelling-Place',
      43: 'Lightning and the Stars',
      44: 'Other Lightnings',
      45: 'The Second Parable: The Lot of the Apostates',
      46: 'The Head of Days and the Son of Man',
      47: 'The Prayer of the Righteous',
      48: 'The Fountain of Righteousness; The Son of Man',
      49: 'The Power and Wisdom of the Elect One',
      50: 'The Resurrection of the Dead',
      51: 'The Elect One on the Throne of Glory',
      52: 'The Six Metal Mountains',
      53: 'The Valley of Judgement',
      54: 'The Punishment of the Fallen Angels',
      55: 'The Third Parable: The Flood',
      56: 'The Host of Azazel Cast into the Furnace',
      57: 'The Return from the East and West',
      58: 'The Light of the Righteous',
      59: 'The Lights and the Thunder',
      60: 'The Quaking of Heaven; Leviathan and Behemoth',
      61: 'The Angels Measure Paradise',
      62: 'The Judgement of Kings and the Mighty',
      63: 'The Vain Repentance of Kings',
      64: 'The Fallen Angels in the Abyss',
      65: 'Enoch Foretells the Flood to Noah',
      66: 'The Angels of Punishment Prepare the Flood',
      67: 'God\'s Promise to Noah',
      68: 'Michael and Raphael Astonished at the Judgement',
      69: 'The Names and Deeds of the Fallen Angels',
      70: 'The Translation of Enoch',
      71: 'Two Earlier Visions of Enoch',
      72: 'The Course of the Sun',
      73: 'The Course of the Moon',
      74: 'The Lunar Year',
      75: 'The Intercalary Days and the Stars',
      76: 'The Twelve Portals of the Winds',
      77: 'The Four Quarters and the Rivers',
      78: 'The Names of Sun and Moon',
      79: 'The Law of the Stars Completed',
      80: 'The Sinners Alter the Courses',
      81: 'The Heavenly Tablets',
      82: 'The Leaders of the Seasons and Months',
      83: 'The First Dream-Vision: The Deluge',
      84: 'Enoch\'s Prayer Against the Flood',
      85: 'The Second Dream-Vision: The History of the World',
      86: 'The Fallen Star and the Oxen',
      87: 'The Coming of the Angels',
      88: 'The Punishment of the Fallen Star',
      89: 'The Deluge to the Exodus',
      90: 'The Seventy Shepherds; The New Jerusalem',
      91: 'Enoch\'s Admonition to His Children',
      92: 'The Book of Enoch\'s Wisdom',
      93: 'The Apocalypse of Weeks (Part 1)',
      94: 'Admonitions to the Righteous',
      95: 'Woes Against the Sinners',
      96: 'Hope for the Righteous; Woes for the Wicked',
      97: 'Woes Against Those Who Trust in Wealth',
      98: 'All Sin Recorded in Heaven',
      99: 'Woes for the Godless in the Last Days',
      100: 'The Mutual Slaughter of the Sinners',
      101: 'Exhortation to Fear God',
      102: 'The Terrors of the Day of Judgement',
      103: 'The Destiny of the Righteous Dead',
      104: 'Assurances to the Righteous',
      105: 'God and the Messiah to Dwell with Man',
      106: 'The Birth of Noah',
      107: 'The Transgression of Future Generations',
      108: 'Appendix: The Book for Methuselah',
    },
    jubilees: {
      1: 'Moses on Mount Sinai; God\'s Covenant',
      2: 'The Six Days of Creation; The Sabbath',
      3: 'Adam Names the Animals; The Garden of Eden',
      4: 'Cain and Abel; The Generations to Enoch',
      5: 'The Watchers and the Flood',
      6: 'Noah\'s Sacrifice; The Feast of Weeks',
      7: 'Noah\'s Vineyard; The Commandments of Noah',
      8: 'The Division of the Earth Among Noah\'s Sons',
      9: 'The Portions of Shem, Ham, and Japheth',
      10: 'The Demons and the Healing of Noah\'s Sons',
      11: 'The Generations from Reu to Abram',
      12: 'Abram Rejects Idolatry',
      13: 'Abram Journeys to Canaan and Egypt',
      14: 'The Covenant of the Pieces',
      15: 'The Covenant of Circumcision; Birth of Ishmael',
      16: 'The Three Angels; The Destruction of Sodom',
      17: 'Isaac Weaned; Ishmael\'s Jealousy',
      18: 'The Binding of Isaac',
      19: 'The Death of Sarah; Isaac and Rebecca',
      20: 'Abraham\'s Farewell Exhortation',
      21: 'Abraham\'s Charge to Isaac',
      22: 'The Death of Abraham; His Blessing on Jacob',
      23: 'The Death of Abraham; The Decline of Generations',
      24: 'Isaac in Gerar; God\'s Promise',
      25: 'Rebecca\'s Counsel to Jacob',
      26: 'Isaac\'s Blessing on Jacob',
      27: 'Jacob Flees to Laban',
      28: 'Jacob Serves Laban; His Wives and Children',
      29: 'Jacob\'s Departure from Laban',
      30: 'The Defilement of Dinah; Levi and the Priesthood',
      31: 'Jacob at Bethel; Levi\'s Dream',
      32: 'The Tithe at Bethel; Jacob Wrestles',
      33: 'The Sin of Reuben; The Laws of Incest',
      34: 'The War of the Amorites Against Jacob',
      35: 'Rebecca\'s Plea; Isaac\'s Blessing on Levi and Judah',
      36: 'Isaac\'s Farewell; The Oath of Esau',
      37: 'The War of Esau Against Jacob',
      38: 'The War Continues; Esau Falls',
      39: 'Joseph in Egypt; Potiphar\'s Wife',
      40: 'Pharaoh\'s Dreams; Joseph\'s Exaltation',
      41: 'Judah and Tamar',
      42: 'The Famine; Joseph\'s Brothers in Egypt',
      43: 'Joseph Reveals Himself',
      44: 'Jacob Goes Down to Egypt',
      45: 'Israel in Goshen; Jacob Blesses Pharaoh',
      46: 'The Deaths of Jacob and Joseph',
      47: 'Moses\' Birth and Early Life',
      48: 'The Exodus; The Prince of Mastema',
      49: 'The Commandments of the Passover',
      50: 'The Sabbath Laws',
    },
    jasher: {
      1: 'Creation, Adam and Eve, Cain and Abel',
      2: 'Seth and the Generations of Adam',
      3: 'Enoch Walks with God',
      4: 'The Ascension of Enoch',
      5: 'The Wickedness Before the Flood',
      6: 'Noah and the Flood',
      7: 'The Sons of Noah and the Nations',
      8: 'The Birth of Abram',
      9: 'Haran, Nahor, and the Family of Terah',
      10: 'The Scattering of the Nations',
      11: 'Nimrod and the Cities of Shinar',
      12: 'Abram Cast into the Furnace',
      13: 'Terah Departs Ur for Haran',
      14: 'Rikayon and the Rise of Egypt',
      15: 'Abram Goes Down to Egypt',
      16: 'The War of the Kings',
      17: 'Wars Among the Nations',
      18: 'The Covenant of Circumcision',
      19: 'The Sins of Sodom',
      20: 'Abraham in the Land of the Philistines',
      21: 'The Birth of Isaac',
      22: 'Ishmael Sent Away',
      23: 'The Binding of Isaac',
      24: 'The Death and Burial of Sarah',
      25: 'Keturah and the Death of Abraham',
      26: 'Jacob and Esau; The Birthright',
      27: 'Esau the Hunter; The Death of Nimrod',
      28: 'Isaac and the Philistines',
      29: 'Jacob Obtains the Blessing',
      30: 'Jacob\'s Vision at Bethel',
      31: 'Jacob Serves Laban',
      32: 'Jacob Sends Messengers to Esau',
      33: 'Jacob at Shechem; Dinah',
      34: 'The Destruction of Shechem',
      35: 'The Kings of the Amorites Against Jacob',
      36: 'Jacob Returns to Bethel',
      37: 'Joseph and His Brothers',
      38: 'The Wars of the Sons of Jacob',
      39: 'The Sons of Jacob at Tapnach',
      40: 'The Sons of Jacob at Bethchorin',
      41: 'Joseph Sold into Slavery',
      42: 'Joseph Cast into the Pit',
      43: 'The Brothers\' Remorse; Judah and Tamar',
      44: 'Joseph Brought to Egypt',
      45: 'The Sons of Jacob in Canaan',
      46: 'Joseph in Prison',
      47: 'The Death of Isaac',
      48: 'Pharaoh\'s Dreams',
      49: 'Joseph Appointed Over Egypt',
      50: 'Wars of Ishmael and Tarshish',
      51: 'Jacob Sends His Sons to Egypt',
      52: 'The Brothers Return from Egypt',
      53: 'Benjamin Brought to Egypt',
      54: 'Joseph Reveals Himself',
      55: 'Jacob Goes Down to Egypt',
      56: 'The Death of Jacob',
      57: 'The War with the Sons of Esau',
      58: 'The Death of Joseph',
      59: 'The Descendants of Israel in Egypt',
      60: 'Zepho and the Wars of Edom',
      61: 'Israel\'s Burdens Begin',
      62: 'The Deaths of the Elders of Israel',
      63: 'The Death of Levi; Israel Oppressed',
      64: 'Balaam and the Kings of Chittim',
      65: 'The Counsel Against Israel',
      66: 'Israel\'s Bondage Deepens',
      67: 'The Birth of Moses',
      68: 'Miriam\'s Prophecy; Moses Hidden',
      69: 'Pharaoh\'s Daughter Finds Moses',
      70: 'The Young Moses Before Pharaoh',
      71: 'Moses Flees to Cush',
      72: 'Moses and the War in Cush',
      73: 'Moses Reigns Over Cush',
      74: 'Kings of Edom; Moab and Midian',
      75: 'The Children of Ephraim Leave Egypt Early',
      76: 'Moses Departs from Cush',
      77: 'The Reign of Pharaoh Adikam',
      78: 'The Death of Baal Channan, King of Edom',
      79: 'Moses in Midian; The Burning Bush',
      80: 'Moses Returns to Egypt; The Plagues Begin',
      81: 'The Exodus; The Crossing of the Red Sea',
      82: 'Israel at Sinai; The Giving of the Law',
      83: 'The Tabernacle and the Priesthood',
      84: 'Korah\'s Rebellion',
      85: 'Wars with the Canaanites; Balaam and Balak',
      86: 'The Numbering of Israel',
      87: 'The Death of Moses',
      88: 'Joshua Leads Israel into Canaan',
      89: 'Joshua\'s Song of Victory',
      90: 'The Wars of Edom and Chittim',
      91: 'After Joshua; Judah Leads Israel',
    },
    sirach: {
      1: 'The Prologue; The Fear of the Lord',
      2: 'Patience in Temptation',
      3: 'Duties to Parents',
      4: 'Compassion for the Poor',
      5: 'Presumption and Repentance',
      6: 'True and False Friendship',
      7: 'Miscellaneous Precepts',
      8: 'Prudence in Dealings',
      9: 'Warnings About Women',
      10: 'The Wise Ruler',
      11: 'Humility and Appearances',
      12: 'Discernment in Giving',
      13: 'Rich and Poor',
      14: 'Happiness and the Pursuit of Wisdom',
      15: 'Wisdom and the Law',
      16: 'Divine Justice',
      17: 'The Creation of Man',
      18: 'The Greatness of God',
      19: 'Drunkenness and Gossip',
      20: 'Wise and Foolish Speech',
      21: 'Sin and Folly',
      22: 'The Sluggard and the Fool',
      23: 'Prayer Against Sin',
      24: 'Wisdom\'s Self-Praise',
      25: 'Three Beautiful Things',
      26: 'Good and Evil Wives',
      27: 'Honesty in Trade',
      28: 'Forgiveness and the Tongue',
      29: 'Lending and Almsgiving',
      30: 'The Discipline of Children',
      31: 'Riches and Feasting',
      32: 'Conduct at a Banquet',
      33: 'Trust in the Lord',
      34: 'Dreams and Travel',
      35: 'Sacrifices and Justice',
      36: 'Prayer for Israel',
      37: 'Counsel and Advisors',
      38: 'The Physician; Mourning',
      39: 'The Scholar and the Craftsman',
      40: 'Hardships of Life',
      41: 'Death; Shame',
      42: 'Proper and Improper Shame',
      43: 'The Wonders of Creation',
      44: 'Praise of the Fathers',
      45: 'Moses, Aaron, and Phinehas',
      46: 'Joshua and Caleb; Samuel',
      47: 'Nathan, David, and Solomon',
      48: 'Elijah and Elisha',
      49: 'Josiah and the Prophets',
      50: 'Simon the High Priest',
      51: 'A Prayer of Thanksgiving',
    },
    wisdom: {
      1: 'Seek Righteousness, Not Death',
      2: 'The Reasoning of the Wicked',
      3: 'The Destiny of the Righteous',
      4: 'The Reward of Virtue',
      5: 'The Vindication of the Just',
      6: 'Exhortation to Seek Wisdom',
      7: 'Solomon\'s Prayer for Wisdom',
      8: 'Wisdom as a Bride',
      9: 'Solomon\'s Prayer',
      10: 'Wisdom in History: Adam to Moses',
      11: 'God\'s Mercy in the Exodus',
      12: 'God\'s Patience with the Canaanites',
      13: 'Folly of Nature Worship',
      14: 'The Origin of Idolatry',
      15: 'Israel\'s Fidelity; Foolish Idols',
      16: 'Contrasts: Plagues and Blessings',
      17: 'Darkness on Egypt; Light for Israel',
      18: 'The Night of the Passover',
      19: 'The Red Sea and Final Judgments',
    },
    tobit: {
      1: 'Tobit\'s Faithfulness in Nineveh',
      2: 'Tobit\'s Blindness',
      3: 'Tobit\'s Prayer; Sarah\'s Plight',
      4: 'Tobit\'s Instructions to Tobias',
      5: 'Tobias Meets the Angel Raphael',
      6: 'The Fish and the Cure',
      7: 'The Wedding of Tobias and Sarah',
      8: 'The Wedding Night; The Demon Defeated',
      9: 'Raphael Recovers the Money',
      10: 'The Anxious Parents',
      11: 'Tobit\'s Sight Restored',
      12: 'Raphael Reveals His Identity',
      13: 'Tobit\'s Song of Praise',
      14: 'Tobit\'s Final Words and Death',
    },
    judith: {
      1: 'Nebuchadnezzar\'s War with Arphaxad',
      2: 'Holofernes\' Campaign',
      3: 'The Nations Submit',
      4: 'Israel Prepares to Resist',
      5: 'Achior\'s Account of Israel',
      6: 'Achior Delivered to the Israelites',
      7: 'The Siege of Bethulia',
      8: 'Judith\'s Rebuke of the Elders',
      9: 'Judith\'s Prayer',
      10: 'Judith Goes to the Assyrian Camp',
      11: 'Judith Before Holofernes',
      12: 'The Banquet',
      13: 'Judith Slays Holofernes',
      14: 'The Head Displayed; Achior Converts',
      15: 'The Assyrians Flee',
      16: 'Judith\'s Song of Triumph',
    },
    baruch: {
      1: 'Baruch Reads the Book in Babylon',
      2: 'Confession of Israel\'s Sins',
      3: 'Prayer for Mercy; Praise of Wisdom',
      4: 'Encouragement for Jerusalem',
      5: 'Jerusalem\'s Future Glory',
    },
    '1esdras': {
      1: 'Josiah\'s Passover; The Fall of Jerusalem',
      2: 'Cyrus\'s Decree; Opposition',
      3: 'The Debate of the Three Guardsmen',
      4: 'Zerubbabel\'s Argument: Truth Is Strongest',
      5: 'The Return from Exile',
      6: 'The Building of the Temple Resumes',
      7: 'The Temple Completed and Dedicated',
      8: 'Ezra\'s Mission to Jerusalem',
      9: 'The Problem of Mixed Marriages',
    },
    '2esdras': {
      1: 'The Genealogy of Ezra; God\'s Reproach',
      2: 'God Turns to the Gentiles',
      3: 'Ezra\'s First Vision: Why Does Evil Prevail?',
      4: 'The Angel Uriel\'s Response',
      5: 'Signs of the End',
      6: 'The Second Vision: Creation and the Age to Come',
      7: 'The Third Vision: The Narrow Way; The Fate of Souls',
      8: 'Ezra\'s Lament; God\'s Response',
      9: 'The Fourth Vision: The Mourning Woman (Zion)',
      10: 'The Vision of the Heavenly City',
      11: 'The Fifth Vision: The Eagle',
      12: 'Interpretation of the Eagle Vision',
      13: 'The Sixth Vision: The Man from the Sea',
      14: 'The Seventh Vision: The Restoration of Scripture',
      15: 'Prophecies of Woe Against the Nations',
      16: 'Tribulation and Endurance',
    },
    '1maccabees': {
      1: 'Alexander and Antiochus; The Persecution',
      2: 'Mattathias and the Revolt',
      3: 'Judas Maccabeus Takes Command',
      4: 'Victories Over Gorgias and Lysias',
      5: 'Wars with Neighboring Peoples',
      6: 'The Death of Antiochus; Siege of Zion',
      7: 'Demetrius Sends Bacchides and Alcimus',
      8: 'Alliance with Rome',
      9: 'The Death of Judas; Jonathan Succeeds',
      10: 'Alexander Epiphanes and Jonathan',
      11: 'Ptolemy\'s Invasion; Jonathan\'s Alliances',
      12: 'Renewed Alliances; Jonathan Captured',
      13: 'Simon Takes Command',
      14: 'The Glory of Simon\'s Rule',
      15: 'Antiochus VII and Simon',
      16: 'John Hyrcanus Succeeds Simon',
    },
    '2maccabees': {
      1: 'Letters to the Jews in Egypt',
      2: 'Jeremiah Hides the Ark; The Compiler\'s Preface',
      3: 'Heliodorus Repelled from the Temple',
      4: 'Corruption of the High Priesthood',
      5: 'Antiochus Plunders the Temple',
      6: 'The Persecution; Eleazar\'s Martyrdom',
      7: 'The Martyrdom of the Seven Brothers',
      8: 'Judas Maccabeus Rallies Israel',
      9: 'The Death of Antiochus',
      10: 'Purification of the Temple',
      11: 'Lysias\'s Campaign and Treaty',
      12: 'Campaigns Against Neighboring Peoples',
      13: 'Antiochus V and Lysias Invade',
      14: 'Demetrius and Nicanor',
      15: 'The Defeat and Death of Nicanor',
    },
    '2enoch': {
      1: 'Enoch\'s Call to Heaven',
      2: 'Enoch\'s Instructions to His Sons',
      3: 'The First Heaven: Clouds and Stars',
      4: 'The Rulers of the Stars',
      5: 'The Treasuries of Snow and Dew',
      6: 'The Treasure-Houses of Dew',
      7: 'The Second Heaven: The Imprisoned Angels',
      8: 'The Third Heaven: Paradise',
      9: 'The Place Prepared for the Righteous',
      10: 'The Place of Torment in the North',
      11: 'The Fourth Heaven: Sun and Moon',
      12: 'The Phoenixes and Chalkydri',
      13: 'The Eastern Gates of the Sun',
      14: 'The Western Gates of the Sun',
      15: 'The Song of the Phoenixes',
      16: 'The Course of the Moon',
      17: 'The Armed Soldiers of the Fourth Heaven',
      18: 'The Fifth Heaven: The Grigori',
      19: 'The Sixth Heaven: The Archangels',
      20: 'The Seventh Heaven: The Great Light',
      21: 'The Cherubim and Seraphim',
      22: 'The Tenth Heaven: The Face of the Lord',
      23: 'God Reveals All Things to Enoch',
      24: 'Enoch Sits at God\'s Left Hand',
      25: 'The Creation: Adoil',
      26: 'The Foundation: Archas',
      27: 'The Separation of Light and Darkness',
      28: 'The Firmament and the Dry Land',
      29: 'The Creation of the Angels',
      30: 'The Third Day: Trees, Paradise, and Adam',
      31: 'Adam in the Garden; The Command',
      32: 'Adam\'s Return to Earth',
      33: 'The Eighth Day; The Ages of the World',
      34: 'God\'s Rejection of the Disobedient',
      35: 'The Future Generation',
      36: 'Enoch\'s Return for Thirty Days',
      37: 'The Angel Transforms Enoch\'s Appearance',
      38: 'Enoch Returns to Earth',
      39: 'Enoch Admonishes His Children',
      40: 'Enoch\'s Knowledge of All Things',
      41: 'Enoch Weeps for Adam\'s Sin',
      42: 'The Key-Holders of Hell',
      43: 'Measure and Righteous Judgment',
      44: 'God Created Man in His Likeness',
      45: 'Offerings Before the Lord',
      46: 'Gifts and a Loyal Heart',
      47: 'The Books of Enoch\'s Handwriting',
      48: 'The Solar and Lunar Courses',
      49: 'Enoch\'s Oath',
      50: 'Every Man\'s Work in Writing',
      51: 'Give to the Poor',
      52: 'Praise and Cursing',
      53: 'No Helper for the Sinner',
      54: 'Enoch\'s Final Instructions',
      55: 'The Sons of Enoch Build an Altar',
      56: 'Methusalam Serves as Priest',
      57: 'Enoch\'s Instructions About Sacrifice',
      58: 'Enoch\'s Praise of the Lord',
      59: 'Enoch\'s Warning to His Sons',
      60: 'Enoch\'s Final Address',
      61: 'Enoch Taken Up; Methusalam\'s Sacrifice',
      62: 'The People Gather at Achuzan',
      63: 'The Elders of the People Consult',
      64: 'Nir and His Wife; The Birth of Melchisedek',
      65: 'The Death of Nir\'s Wife',
      66: 'The People Learn of the Child',
      67: 'God Commands Michael About Melchisedek',
      68: 'The Conclusion; The Flood Begins',
    },
    '2baruch': {
      1: 'God Warns Baruch of Jerusalem\'s Fall',
      2: 'Baruch\'s Anguish',
      3: 'God\'s Answer: The True Zion Endures',
      4: 'The Heavenly Jerusalem',
      5: 'The Fall of Jerusalem Foretold',
      6: 'Angels Hide the Holy Vessels',
      7: 'The City Delivered to Its Enemies',
      8: 'Baruch\'s Lament at the Ruins',
      9: 'Baruch\'s Prayer',
      10: 'Baruch Mourns Over Zion',
      11: 'Baruch\'s Lament for the Land',
      12: 'Why Has Israel Been Given to the Gentiles?',
      13: 'God Speaks of Coming Judgment',
      14: 'The Reward of the Righteous',
      15: 'The Suffering of This World',
      16: 'The Building That Is to Come',
      17: 'The Conflict of Good and Evil',
      18: 'The World of Corruption',
      19: 'Adam\'s Sin and Its Consequences',
      20: 'The Time of Tribulation Approaches',
      21: 'Baruch\'s Prayer for Understanding',
      22: 'God\'s Response; The Coming End',
      23: 'The Numbering of Souls',
      24: 'The Time of the Messiah',
      25: 'Signs of the Last Days',
      26: 'The Twelve Woes',
      27: 'The Sequence of Tribulations',
      28: 'The Final Tribulation',
      29: 'The Messiah\'s Reign; The Plenty of the Land',
      30: 'The Resurrection of the Dead',
      31: 'Baruch Speaks to the People',
      32: 'The Promise of Consolation',
      33: 'The Vine and the Cedar',
      34: 'Baruch Asks About the Vision',
      35: 'The Vision of the Forest and the Vine',
      36: 'The Forest, the Plain, and the Vine',
      37: 'Baruch\'s Question About the Vision',
      38: 'The Interpretation Begins',
      39: 'The Four Kingdoms',
      40: 'The Last Leader and the Messiah',
      41: 'The Fate of the Righteous and Wicked',
      42: 'The Hope of the World to Come',
      43: 'Those Who Left the Covenant',
      44: 'Baruch\'s Farewell to the People',
      45: 'Baruch Goes to Hebron',
      46: 'Baruch\'s Letter to the Exiles',
      47: 'Baruch\'s Fasting and Prayer',
      48: 'Baruch\'s Great Prayer',
      49: 'The Resurrection Body',
      50: 'The Transformation of the Righteous',
      51: 'Glory of the Righteous; Shame of the Wicked',
      52: 'The Vision of the Cloud',
      53: 'The Cloud and the Bright and Dark Waters',
      54: 'Baruch Asks for Interpretation',
      55: 'The Angel Ramiel Interprets',
      56: 'The Dark and Bright Waters Explained',
      57: 'The Bright Waters of Abraham',
      58: 'The Dark Waters of Egypt',
      59: 'The Bright Waters of Moses',
      60: 'The Dark Waters of the Judges',
      61: 'The Bright Waters of David and Solomon',
      62: 'The Dark Waters of Jeroboam',
      63: 'The Bright Waters of Hezekiah',
      64: 'The Dark Waters of Manasseh',
      65: 'The Bright Waters of Josiah',
      66: 'The Dark Waters of the Destruction',
      67: 'The Bright Waters of the Rebuilding',
      68: 'The Dark Waters of the Greek Period',
      69: 'The Bright Waters of the Maccabees',
      70: 'The Dark Waters of the Last Days',
      71: 'The Final Bright Waters',
      72: 'The Messiah\'s Rule',
      73: 'The Age of Peace',
      74: 'The End of This World',
      75: 'God Confirms the Vision',
      76: 'Baruch Told to Go to the Mountain',
      77: 'Baruch\'s Epistle to the Nine and a Half Tribes',
      78: 'The Letter: Remember Zion\'s Glory',
      79: 'The Letter: Remember Moses\' Warning',
      80: 'The Letter: Your Sufferings Will End',
      81: 'The Letter: The Coming Judgment',
      82: 'The Letter: Comfort from the Law',
      83: 'The Letter: God Will Avenge You',
      84: 'The Letter: Keep the Commandments',
      85: 'The Letter: Former Prophets Helped You',
      86: 'The Letter: Read This in Your Congregations',
      87: 'The Letter Sent by Eagle',
    },
    psalmsSolomon: {
      1: 'A Cry in Distress',
      2: 'The Fall of Jerusalem to Pompey',
      3: 'The Righteous and the Sinners',
      4: 'Against the Men-Pleasers',
      5: 'Praise of God as Refuge',
      6: 'In Hope',
      7: 'A Prayer for Deliverance',
      8: 'The Sound of War; Israel\'s Sins',
      9: 'Israel\'s Captivity and Repentance',
      10: 'God\'s Discipline of the Righteous',
      11: 'The Return of the Exiles',
      12: 'Against the Slanderous Tongue',
      13: 'Comfort for the Righteous',
      14: 'God\'s Faithfulness to the Pious',
      15: 'Help for the Pious',
      16: 'When the Soul Slumbers',
      17: 'The Messianic King',
      18: 'The Anointed of the Lord',
    },
    testaments: {
      1: 'Reuben: On Impure Thoughts',
      2: 'Reuben: Warning Against Fornication',
      3: 'Simeon: On Envy',
      4: 'Simeon: Repentance',
      5: 'Simeon: Prophecy of the Messiah',
      6: 'Levi: Vision of Heaven',
      7: 'Levi: Judgment and Priesthood',
      8: 'Levi: The Destruction of Shechem',
      9: 'Levi: Fear the Lord',
      10: 'Levi: The Seventy Weeks of the Priesthood',
      11: 'Judah: Valor in War',
      12: 'Judah: Sin with Bathshua and Tamar',
      13: 'Judah: Warning Against Wine and Lust',
      14: 'Judah: Love Levi',
      15: 'Issachar: On Simplicity',
      16: 'Issachar: Warning for the Last Times',
      17: 'Zebulun: On Compassion',
      18: 'Zebulun: Show Mercy',
      19: 'Dan: On Anger',
      20: 'Dan: Depart from Wrath',
      21: 'Naphtali: On Natural Goodness',
      22: 'Naphtali: Vision on the Mount of Olives',
      23: 'Gad: On Hatred',
      24: 'Gad: Love One Another',
      25: 'Asher: Two Faces of Vice and Virtue',
      26: 'Joseph: On Chastity',
      27: 'Joseph: Patience and Prayer',
      28: 'Benjamin: On a Pure Mind',
      29: 'Benjamin: Flee Evil, Cleave to Good',
    },
  },

  /**
   * Render pseudepigrapha content (1 Enoch, Jubilees, Jasher).
   * Chapter index or single chapter view with prev/next navigation.
   */
  _renderPseudepigraphaContent(textArea, authorId, authorName, params) {
    const works = typeof Classics !== 'undefined' ? Classics.getWorks(authorId) : [];
    if (works.length === 0) {
      textArea.innerHTML = `<div class="reader-error">No data loaded for ${authorName}.</div>`;
      return;
    }

    const workName = works[0];
    const sections = Classics.getSectionList(authorId, workName);
    const totalChapters = sections.length;
    const chapter = params.chapter;
    const titles = this._CHAPTER_TITLES[authorId] || {};

    if (!chapter) {
      const info = this._BOOK_INFO[authorId] || {};
      const exclusionHtml = info.exclusion
        ? `<div class="not-scripture-banner">${this._linkifyExclusionText(info.exclusion, authorId)}</div>`
        : '';
      textArea.innerHTML = `
        <div class="classics-index">
          <h1 class="classics-index-title">${authorName}</h1>
          <p class="classics-index-intro">${info.intro || ''}</p>
          ${exclusionHtml}
          <div class="classics-works-list">
            ${sections.map(ref => {
              const ch = ref.split('|')[1];
              const title = titles[ch] || '';
              const subtitle = title ? `<span class="classics-work-meta">${title}</span>` : '';
              return `
                <a href="/reader/apocrypha/${authorId}/${ch}" class="classics-work-item" onclick="AppStore.dispatch({type:'SET_VIEW',view:'reader',params:{contentType:'apocrypha',book:'${authorId}',chapter:${ch}}}); return false;">
                  <span class="classics-work-name">Chapter ${ch}</span>
                  ${subtitle}
                </a>`;
            }).join('')}
          </div>
        </div>
      `;
      return;
    }

    // Render single chapter
    const ref = `${workName}|${chapter}`;
    const text = Classics.getSection(authorId, ref);
    if (!text) {
      textArea.innerHTML = `<div class="reader-error">Chapter ${chapter} not found in ${authorName}. <a href="#" onclick="AppStore.dispatch({type:'SET_VIEW',view:'reader',params:{contentType:'apocrypha',book:'${authorId}'}}); return false;">Back to index</a></div>`;
      return;
    }

    const chapterTitle = titles[chapter] ? ` — ${titles[chapter]}` : '';
    const prevCh = chapter > 1 ? chapter - 1 : null;
    const nextCh = chapter < totalChapters ? chapter + 1 : null;
    const prevLink = prevCh ? `<a href="/reader/apocrypha/${authorId}/${prevCh}" class="classics-nav-link" onclick="AppStore.dispatch({type:'SET_VIEW',view:'reader',params:{contentType:'apocrypha',book:'${authorId}',chapter:${prevCh}}}); return false;">&laquo; Ch. ${prevCh}</a>` : '<span class="classics-nav-spacer">&laquo; Ch.</span>';
    const nextLink = nextCh ? `<a href="/reader/apocrypha/${authorId}/${nextCh}" class="classics-nav-link" onclick="AppStore.dispatch({type:'SET_VIEW',view:'reader',params:{contentType:'apocrypha',book:'${authorId}',chapter:${nextCh}}}); return false;">Ch. ${nextCh} &raquo;</a>` : '<span class="classics-nav-spacer">Ch. &raquo;</span>';
    const allChaptersLink = `<a href="/reader/apocrypha/${authorId}" class="classics-nav-home" onclick="AppStore.dispatch({type:'SET_VIEW',view:'reader',params:{contentType:'apocrypha',book:'${authorId}'}}); return false;">All Chapters</a>`;

    const formattedText = this._formatApocryphaText(text);

    textArea.innerHTML = `
      <div class="classics-reader">
        <header class="classics-reader-header">
          <h1>${authorName} ${chapter}${chapterTitle}</h1>
          <div class="not-scripture-banner not-scripture-banner-sm">${this._getBookWarning(authorId)}</div>
          <nav class="classics-chapter-nav">${prevLink}${allChaptersLink}${nextLink}</nav>
        </header>
        <article class="classics-reader-body">
          ${formattedText}
        </article>
        <footer class="classics-chapter-nav classics-chapter-nav-bottom">${prevLink}${allChaptersLink}${nextLink}</footer>
      </div>
    `;

    if (params.verse) {
      setTimeout(() => this._scrollToApocryphaVerse(textArea, params.verse), 100);
    }
  },

  /**
   * Render an entire Philo work as continuous scrollable text.
   * Each section gets an anchor; section dropdown scrolls to anchor.
   */
  _renderPhiloWork(textArea, workName, workSlug, scrollToSection) {
    const sections = typeof Classics !== 'undefined' ? Classics.getSectionList('philo', workName) : [];
    if (sections.length === 0) {
      textArea.innerHTML = `<div class="reader-error">No sections found for "${workName}".</div>`;
      return;
    }

    let html = `<div class="classics-reader">`;
    html += `<header class="classics-reader-header"><h1>${workName}</h1><p class="classics-reader-meta">${sections.length} sections</p></header>`;
    html += `<article class="classics-reader-body">`;

    for (const ref of sections) {
      const sec = ref.split('|')[1];
      const text = Classics.getSection('philo', workName, sec);
      html += `<section id="section-${sec}" class="classics-passage">`;
      html += `<span class="classics-section-num" title="§${sec}">§${sec}</span>`;
      html += `<p>${(text || '').replace(/\n/g, '</p><p>')}</p>`;
      html += `</section>`;
    }

    html += `</article></div>`;
    textArea.innerHTML = html;

    // Linkify scripture refs and footnote markers
    this.linkifyScriptureRefs(textArea);
    this._linkifyFootnoteMarkers(textArea, workName, null);

    // Scroll to specific section if requested
    if (scrollToSection) {
      setTimeout(() => {
        const anchor = textArea.querySelector('#section-' + scrollToSection);
        if (anchor) anchor.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  },

  /**
   * Render an entire Josephus book as continuous scrollable text.
   * Grouped by chapter with section anchors.
   */
  _renderJosephusBook(textArea, workName, workSlug, book, scrollChapter, scrollSection) {
    const allSections = typeof Classics !== 'undefined' ? Classics.getSectionList('josephus', workName) : [];
    const bookSections = allSections.filter(ref => parseInt(ref.split('|')[1]) === book);

    // Find prev/next book for navigation
    const allBooks = [...new Set(allSections.map(ref => parseInt(ref.split('|')[1])))].sort((a, b) => a - b);
    const bookIdx = allBooks.indexOf(book);
    const prevBook = bookIdx > 0 ? allBooks[bookIdx - 1] : null;
    const nextBook = bookIdx >= 0 && bookIdx < allBooks.length - 1 ? allBooks[bookIdx + 1] : null;

    if (bookSections.length === 0) {
      textArea.innerHTML = `<div class="reader-error">No sections found for "${workName}" Book ${book}.</div>`;
      return;
    }

    // Group by chapter
    const byChapter = {};
    for (const ref of bookSections) {
      const parts = ref.split('|');
      const ch = parseInt(parts[2]);
      if (!byChapter[ch]) byChapter[ch] = [];
      byChapter[ch].push({ chapter: ch, section: parseInt(parts[3]), ref });
    }
    const chapters = Object.keys(byChapter).map(Number).sort((a, b) => a - b);

    let html = `<div class="classics-reader">`;
    html += `<header class="classics-reader-header">`;
    html += `<h1>${workName} — Book ${book}</h1>`;
    html += `<p class="classics-reader-meta">${bookSections.length} sections across ${chapters.length} chapter${chapters.length !== 1 ? 's' : ''}</p>`;
    html += `<nav class="classics-book-nav">`;
    if (prevBook != null) html += `<a href="/reader/josephus/${workSlug}/${prevBook}" class="classics-book-nav-btn" onclick="AppStore.dispatch({type:'SET_VIEW',view:'reader',params:{contentType:'josephus',work:'${workSlug}',book:${prevBook}}}); return false;">◀ Book ${prevBook}</a>`;
    if (nextBook != null) html += `<a href="/reader/josephus/${workSlug}/${nextBook}" class="classics-book-nav-btn" onclick="AppStore.dispatch({type:'SET_VIEW',view:'reader',params:{contentType:'josephus',work:'${workSlug}',book:${nextBook}}}); return false;">Book ${nextBook} ▶</a>`;
    html += `</nav></header>`;
    html += `<article class="classics-reader-body">`;

    for (const ch of chapters) {
      html += `<h2 id="chapter-${book}-${ch}" class="classics-chapter-heading">Chapter ${ch}</h2>`;
      for (const item of byChapter[ch]) {
        const text = Classics.getSection('josephus', item.ref);
        html += `<section id="section-${book}-${ch}-${item.section}" class="classics-passage">`;
        html += `<span class="classics-section-num" title="${book}.${ch}.${item.section}">${book}.${ch}.${item.section}</span>`;
        html += `<p>${(text || '').replace(/\n/g, '</p><p>')}</p>`;
        html += `</section>`;
      }
    }

    html += `</article>`;
    // Bottom nav
    html += `<nav class="classics-book-nav classics-book-nav-bottom">`;
    if (prevBook != null) html += `<a href="/reader/josephus/${workSlug}/${prevBook}" class="classics-book-nav-btn" onclick="AppStore.dispatch({type:'SET_VIEW',view:'reader',params:{contentType:'josephus',work:'${workSlug}',book:${prevBook}}}); return false;">◀ Book ${prevBook}</a>`;
    if (nextBook != null) html += `<a href="/reader/josephus/${workSlug}/${nextBook}" class="classics-book-nav-btn" onclick="AppStore.dispatch({type:'SET_VIEW',view:'reader',params:{contentType:'josephus',work:'${workSlug}',book:${nextBook}}}); return false;">Book ${nextBook} ▶</a>`;
    html += `</nav></div>`;

    textArea.innerHTML = html;
    this.linkifyScriptureRefs(textArea);
    this._linkifyFootnoteMarkers(textArea, workName, book);

    // Scroll to specific section if requested
    if (scrollChapter != null && scrollSection != null) {
      setTimeout(() => {
        const anchor = textArea.querySelector('#section-' + book + '-' + scrollChapter + '-' + scrollSection);
        if (anchor) anchor.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  },

  /**
   * Make Philo/Josephus citations clickable in chapter content.
   * Call after linkifyScriptureRefs and linkifySymbolRefs.
   */
  linkifyClassicsRefs(container) {
    if (typeof Classics === 'undefined') return;

    // Josephus patterns — matches:
    //   "Antiquities 18.2.2", "Ant. 18.2.2", "Jewish War 2.17.8", "Against Apion 2.282"
    //   "Josephus, Antiquities 18.2.2", "Flavius Josephus, Jewish War 6.4.5"
    //   "War 1.33.8" (standalone shorthand)
    const josephusWorks = 'Antiquities(?:\\s+of\\s+the\\s+Jews)?|(?:The\\s+)?Jewish\\s+War|Wars\\s+of\\s+the\\s+Jews|Against\\s+Apion|War|Life(?:\\s+of\\s+Josephus)?|Ant\\.|A\\.J\\.|B\\.J\\.|C\\.\\s*Ap\\.?|Vita';
    const josephusPattern = new RegExp(`(?:(?:Flavius\\s+)?Josephus,?\\s+)?(${josephusWorks})\\s+(\\d+)(?:\\.(\\d+)(?:\\.(\\d+))?)?`, 'g');

    // Philo patterns — matches:
    //   "On the Creation 42", "Special Laws II, XXX", "On Mating with the Preliminary Studies 102"
    //   "Philo, On the Creation 42", "Philo of Alexandria, ..."
    // Build pattern from all unique canonical work names
    const philoWorks = Object.values(Classics.PHILO_WORK_MAP)
      .filter((v, i, a) => a.indexOf(v) === i)
      .map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      .join('|');
    // Also match "Special Laws I-IV" with Roman numeral sections: "Special Laws II, XXX"
    const philoSpecialLaws = 'Special\\s+Laws\\s+(?:I{1,3}V?|IV)';
    const philoAllWorks = `${philoSpecialLaws}|${philoWorks}`;
    // Section can be a number OR a Roman numeral (I, II, ... L, etc.) optionally preceded by comma
    const philoPattern = new RegExp(`(?:(?:Philo(?:\\s+of\\s+Alexandria)?,?\\s+))(${philoAllWorks}),?\\s+([IVXLCDM]+|\\d+)`, 'g');
    // Also match without "Philo" prefix for known work names + number
    const philoPatternDirect = new RegExp(`(${philoAllWorks})\\s+(\\d+)`, 'g');

    // Pseudepigrapha patterns — matches:
    //   "1 Enoch 42", "Enoch 42", "Book of Enoch 42"
    //   "Jubilees 5", "Jub 5", "Jub. 5", "Book of Jubilees 5"
    //   "Jasher 12", "Book of Jasher 12"
    const pseudoPattern = /(?:(?:Book\s+of\s+)?(?:1\s+)?Enoch|Jubilees|Jub\.?|(?:Book\s+of\s+)?Jasher)\s+(\d+)/g;

    const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null, false);
    const textNodes = [];
    while (walker.nextNode()) {
      const parent = walker.currentNode.parentNode;
      if (parent && (parent.tagName === 'A' || parent.tagName === 'CODE' || parent.tagName === 'BUTTON' || parent.closest('a, code, button'))) continue;
      const text = walker.currentNode.nodeValue;
      josephusPattern.lastIndex = 0;
      philoPattern.lastIndex = 0;
      philoPatternDirect.lastIndex = 0;
      pseudoPattern.lastIndex = 0;
      if (josephusPattern.test(text) || philoPattern.test(text) || philoPatternDirect.test(text) || pseudoPattern.test(text)) {
        textNodes.push(walker.currentNode);
      }
    }

    const makeJosephusLink = (match) => {
      const parsed = Classics.parseJosephusCitation(match);
      if (!parsed) return match;
      const slug = Classics.getWorkSlug(parsed.work);
      const url = `/reader/josephus/${slug}/${parsed.book}/${parsed.chapter}/${parsed.section}`;
      return `<a href="${url}" class="classics-citation-link" onclick="AppStore.dispatch({type:'SET_VIEW',view:'reader',params:{contentType:'josephus',work:'${slug}',book:${parsed.book},chapter:${parsed.chapter},section:${parsed.section}}}); return false;">${match}</a>`;
    };

    const makePhiloLink = (match) => {
      const parsed = Classics.parsePhiloCitation(match);
      if (!parsed) return match;
      const slug = Classics.getWorkSlug(parsed.work);
      const url = `/reader/philo/${slug}/${parsed.section}`;
      return `<a href="${url}" class="classics-citation-link" onclick="AppStore.dispatch({type:'SET_VIEW',view:'reader',params:{contentType:'philo',work:'${slug}',section:'${parsed.section}'}}); return false;">${match}</a>`;
    };

    const makePseudoLink = (match) => {
      const parsed = Classics.parsePseudepigraphaCitation(match);
      if (!parsed) return match;
      const url = `/reader/apocrypha/${parsed.author}/${parsed.chapter}`;
      return `<a href="${url}" class="classics-citation-link" onclick="AppStore.dispatch({type:'SET_VIEW',view:'reader',params:{contentType:'apocrypha',book:'${parsed.author}',chapter:${parsed.chapter}}}); return false;">${match}</a>`;
    };

    textNodes.forEach(node => {
      let html = node.nodeValue;
      josephusPattern.lastIndex = 0;
      html = html.replace(josephusPattern, (match) => makeJosephusLink(match));
      philoPattern.lastIndex = 0;
      html = html.replace(philoPattern, (match) => makePhiloLink(match));
      philoPatternDirect.lastIndex = 0;
      html = html.replace(philoPatternDirect, (match) => {
        if (html.indexOf(`>${match}</a>`) !== -1) return match;
        return makePhiloLink(match);
      });
      pseudoPattern.lastIndex = 0;
      html = html.replace(pseudoPattern, (match) => {
        if (html.indexOf(`>${match}</a>`) !== -1) return match;
        return makePseudoLink(match);
      });
      if (html !== node.nodeValue) {
        const span = document.createElement('span');
        span.innerHTML = html;
        node.parentNode.replaceChild(span, node);
      }
    });
  },

  /**
   * Convert inline (N) and [N] footnote markers to superscript elements with tooltips.
   * Loads footnotes from Classics.getFootnotes() if available.
   */
  _linkifyFootnoteMarkers(container, workName, book) {
    if (!container) return;

    // Load footnotes data
    let footnoteData = null;
    if (typeof Classics !== 'undefined' && Classics.getFootnotes) {
      footnoteData = Classics.getFootnotes('josephus', workName, book);
    }

    // Walk text nodes and replace (N) patterns with superscript elements
    const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null, false);
    const textNodes = [];
    const pattern = /\((\d+)\)|\[(\d+)\]/g;
    while (walker.nextNode()) {
      const parent = walker.currentNode.parentNode;
      if (parent && (parent.tagName === 'A' || parent.tagName === 'SUP' || parent.classList?.contains('classics-section-num'))) continue;
      if (pattern.test(walker.currentNode.nodeValue)) {
        textNodes.push(walker.currentNode);
      }
      pattern.lastIndex = 0;
    }

    textNodes.forEach(node => {
      const span = document.createElement('span');
      span.innerHTML = node.nodeValue.replace(pattern, (match, parenNum, bracketNum) => {
        const num = parenNum || bracketNum;
        const type = parenNum ? 'fn' : 'note';
        const footnoteText = (type === 'fn' && footnoteData && footnoteData[num])
          ? footnoteData[num].replace(/"/g, '&quot;').replace(/</g, '&lt;')
          : null;
        const tooltip = footnoteText
          ? ` data-footnote="${footnoteText}" onclick="showFootnoteTooltip(event)" onmouseenter="showFootnoteTooltip(event)" onmouseleave="hideFootnoteTooltip()"`
          : '';
        const cls = footnoteText ? 'classics-fn has-footnote' : 'classics-fn';
        return `<sup class="${cls}"${tooltip}>${match}</sup>`;
      });
      node.parentNode.replaceChild(span, node);
    });
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
