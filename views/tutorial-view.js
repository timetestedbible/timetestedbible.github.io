/**
 * TutorialView - Welcome/About page
 * 
 * Comprehensive introduction to the Time-Tested calendar
 * with feature showcases, quick actions, and learning paths.
 */

const TutorialView = {
  /**
   * Render the tutorial/about view
   */
  render(state, derived, container) {
    container.innerHTML = `
      <div class="tutorial-view">
        <!-- 1. HERO: Value Prop -->
        <section class="hero-section" style="margin-top: 30px;">
          <div class="hero-card">
            <h1 class="hero-headline">"Test everything. Hold fast what is good."</h1>
            <cite class="hero-cite"><a href="#" onclick="event.preventDefault(); AppStore.dispatch({type:'SET_VIEW',view:'reader',params:{contentType:'bible',book:'1Thessalonians',chapter:5}})">— 1 Thessalonians 5:21</a></cite>
            <p class="hero-description">
              Deep Bible study tools with enhanced Strong's/BDB lexicon, interlinear Hebrew and Greek, 
              and flexible calendar profiles that let you test any theory against 2,000+ years of history.
            </p>
            <div class="hero-actions">
              <button class="hero-btn primary" onclick="AppStore.dispatch({type:'SET_VIEW',view:'reader',params:{contentType:'bible'}})">
                Open Bible
              </button>
              <button class="hero-btn secondary" onclick="AppStore.dispatch({type:'SET_VIEW',view:'calendar'})">
                View Calendar
              </button>
              <button class="hero-btn secondary" onclick="AppStore.dispatch({type:'SET_VIEW',view:'sabbath-tester'})">
                Run Sabbath Tester
              </button>
            </div>
            <div class="hero-trust">
              <span class="trust-badge"><span class="install-check">✓</span> Works 100% Offline</span>
              <span class="trust-badge"><span class="install-check">✓</span> No Ads or Tracking</span>
              <span class="trust-badge"><span class="install-check">✓</span> No Account Required</span>
              <span class="trust-badge"><span class="install-check">✓</span> Completely Free</span>
            </div>
          </div>
        </section>

        <!-- 2. FEATURES GRID -->
        <section class="features-section">
          <h2 class="section-title">Powerful Study Tools</h2>
          <div class="features-grid">
            ${this.renderFeatureCard('📖', 'Bible Reader', 
              '10 English translations with enhanced Strong\'s/BDB lexicon, Hebrew/Greek interlinear, symbol studies, and word studies. Tap any word to see its original language meaning.',
              'reader', {contentType:'bible'})}
            
            ${this.renderFeatureCard('🕊️', 'Divine Name Preferences', 
              'Choose how the divine name appears across every translation — 𐤉𐤄𐤅𐤄, YHWH, Yahweh, Yahuah, LORD, and more. Includes compound name forms. Your choice, applied everywhere.',
              'settings', null)}
            
            ${this.renderFeatureCard('📅', 'Flexible Calendar Profiles', 
              'Test lunar Sabbath, Saturday Sabbath, full moon months, crescent months, morning or evening day start — any combination against the same astronomical data.',
              'calendar', null)}
            
            ${this.renderFeatureCard('🔬', 'Sabbath Tester', 
              '7 biblical test cases where Scripture names a specific weekday. Run any calendar configuration against them and see which fits.',
              'sabbath-tester', null)}
            
            ${this.renderFeatureCard('assets/img/timeline_icon.png', 'Historical Timeline', 
              'Interactive timeline from Creation to the Temple destruction. Every event astronomically dated and cross-referenced.',
              'timeline', null, true)}
            
            ${this.renderFeatureCard('🎺', 'Feast Days & Priestly Courses', 
              'All of 𐤉𐤄𐤅𐤄\'s appointed times and the 24 priestly divisions for any year, calculated from your chosen calendar profile.',
              'feasts', null)}
          </div>
        </section>

        <!-- 3. INSTALL OPTIONS: PWA + Desktop side by side -->
        ${this.renderInstallOptions()}

        <!-- 4. THE BOOK: Go Deeper -->
        <section class="book-section">
          <h2 class="section-title">Go Deeper — Read the Research</h2>
          <div class="book-card">
            <div class="book-cover">
              <img src="/assets/img/TimeTestedBookFront.jpg" alt="Time-Tested Tradition Book Cover" class="book-cover-img">
            </div>
            <div class="book-info">
              <h3>A Time-Tested Tradition</h3>
              <p class="book-author">The Renewed Biblical Calendar — by Daniel Larimer</p>
              <p class="book-description">
                The calendar methodology is backed by a full-length book examining scriptural evidence, 
                historical records, and astronomical data. Free to read online or download as a PDF. 
                Physical copies now available.
              </p>
              <div class="book-actions">
                <a href="https://store.bookbaby.com/book/time-tested-tradition" class="book-btn primary" target="_blank" rel="noopener">
                  <span>📕</span> Buy Physical Copy
                </a>
                <button class="book-btn secondary" onclick="AppStore.dispatch({type:'SET_VIEW',view:'reader',params:{contentType:'timetested'}})">
                  <span>📖</span> Read Online
                </button>
                <a href="/media/time-tested-tradition.pdf" class="book-btn secondary" download onclick="trackBookDownload()">
                  <span>⬇️</span> Download PDF
                </a>
              </div>
            </div>
          </div>
        </section>

        <!-- 5. HOW WE STUDY: Methodology -->
        <section class="principles-section">
          <h2 class="section-title">How We Study</h2>
          <p class="section-intro">
            Don't take traditions at face value. Use primary sources, trace original language, and test every claim against Scripture and history.
          </p>
          
          <div class="principles-grid">
            <div class="principle-card" onclick="AppStore.dispatch({type:'SET_VIEW',view:'reader',params:{contentType:'bible'}})">
              <div class="principle-header">
                <span class="principle-icon">🔍</span>
                <h3>Symbol Studies</h3>
              </div>
              <p>Scripture uses consistent symbolic language — trees, mountains, water, fire — that mean the same thing everywhere they appear. Identify each symbol's meaning from clear passages, then test it across all of Scripture.</p>
              <div class="principle-verse" onclick="event.stopPropagation(); AppStore.dispatch({type:'SET_VIEW',view:'reader',params:{contentType:'bible',book:'Proverbs',chapter:25}})">
                "It is the glory of God to conceal a matter, but the glory of kings is to search out a matter." — Proverbs 25:2
              </div>
              <span class="learn-link">Explore Symbols →</span>
            </div>
            
            <div class="principle-card" onclick="AppStore.dispatch({type:'SET_VIEW',view:'reader',params:{contentType:'bible'}})">
              <div class="principle-header">
                <span class="principle-icon">📜</span>
                <h3>Word Studies</h3>
              </div>
              <p>English translations obscure the original text. Trace every word back to its Strong's/BDB entry, examine every occurrence in Hebrew or Greek, and see where translators made different choices for the same word.</p>
              <div class="principle-verse" onclick="event.stopPropagation(); AppStore.dispatch({type:'SET_VIEW',view:'reader',params:{contentType:'bible',book:'Proverbs',chapter:30}})">
                "Every word of God is pure; He is a shield to those who put their trust in Him." — Proverbs 30:5
              </div>
              <span class="learn-link">Open Bible Reader →</span>
            </div>
            
            <div class="principle-card" onclick="AppStore.dispatch({type:'SET_VIEW',view:'reader',params:{contentType:'bible'}})">
              <div class="principle-header">
                <span class="principle-icon">🔗</span>
                <h3>Verse Studies</h3>
              </div>
              <p>Compare every verse across 10 translations side by side, layer annotations, and examine interlinear Hebrew/Greek to see exactly what the original text says — no commentary needed.</p>
              <div class="principle-verse" onclick="event.stopPropagation(); AppStore.dispatch({type:'SET_VIEW',view:'reader',params:{contentType:'bible',book:'Isaiah',chapter:28}})">
                "Precept upon precept, precept upon precept; line upon line, line upon line." — Isaiah 28:10
              </div>
              <span class="learn-link">Study Scripture →</span>
            </div>
            
            <div class="principle-card" onclick="AppStore.dispatch({type:'SET_VIEW',view:'reader',params:{contentType:'philo'}})">
              <div class="principle-header">
                <span class="principle-icon">🏛️</span>
                <h3>Primary Sources</h3>
              </div>
              <p>Read Philo of Alexandria and Josephus in full — the most important extra-biblical witnesses to Second Temple period practices. Inline citation linking lets you jump between references and the source text.</p>
              <div class="principle-verse" onclick="event.stopPropagation(); AppStore.dispatch({type:'SET_VIEW',view:'reader',params:{contentType:'bible',book:'Acts',chapter:17}})">
                "They searched the Scriptures daily to see whether those things were so." — Acts 17:11
              </div>
              <span class="learn-link">Browse Primary Sources →</span>
            </div>
            
            <div class="principle-card" onclick="AppStore.dispatch({type:'SET_VIEW',view:'sabbath-tester'})">
              <div class="principle-header">
                <span class="principle-icon">⚖️</span>
                <h3>Test the Calendar</h3>
              </div>
              <p>Don't assume any calendar tradition is correct. Configure any combination of month start, day start, Sabbath pattern, and year start — then test it against astronomically dated biblical events.</p>
              <div class="principle-verse" onclick="event.stopPropagation(); AppStore.dispatch({type:'SET_VIEW',view:'reader',params:{contentType:'bible',book:'1Thessalonians',chapter:5}})">
                "Test everything; hold fast what is good." — 1 Thessalonians 5:21
              </div>
              <span class="learn-link">Run Sabbath Tester →</span>
            </div>
          </div>
        </section>

        <!-- 6. QUICK START -->
        <section class="quickstart-section">
          <h2 class="section-title">Quick Start</h2>
          <div class="quickstart-steps">
            <div class="step-card">
              <div class="step-number">1</div>
              <h4>Explore the Calendar</h4>
              <p>Start with today's date and see how the lunar calendar differs from the Gregorian calendar you're used to.</p>
              <button class="step-btn" onclick="AppStore.dispatch({type:'SET_VIEW',view:'calendar'})">
                Open Calendar
              </button>
            </div>
            
            <div class="step-card">
              <div class="step-number">2</div>
              <h4>Read the Introduction</h4>
              <p>Understand the scriptural basis for each calendar principle and the methodology behind the research.</p>
              <button class="step-btn" onclick="AppStore.dispatch({type:'SET_VIEW',view:'reader',params:{contentType:'timetested',chapterId:'01_Introduction'}})">
                Read Introduction
              </button>
            </div>
            
            <div class="step-card">
              <div class="step-number">3</div>
              <h4>Test the Theory</h4>
              <p>Use the Sabbath Tester to see how different calendar configurations match biblical test cases.</p>
              <button class="step-btn" onclick="AppStore.dispatch({type:'SET_VIEW',view:'sabbath-tester'})">
                Run Tests
              </button>
            </div>
            
            <div class="step-card">
              <div class="step-number">4</div>
              <h4>Study Scripture</h4>
              <p>Dive into the Bible reader with Strong's concordance and interlinear to verify everything for yourself.</p>
              <button class="step-btn" onclick="AppStore.dispatch({type:'SET_VIEW',view:'reader',params:{contentType:'bible'}})">
                Open Bible
              </button>
            </div>
          </div>
        </section>

        <!-- 7. CALENDAR OPTIONS -->
        <section class="compare-section">
          <h2 class="section-title">Calendar Options</h2>
          <p class="section-intro">
            Test any year, any location, any theory. The app supports multiple calendar configurations so you can compare different interpretations against the same astronomical data:
          </p>
          <div class="compare-grid">
            <div class="compare-card featured">
              <div class="compare-badge">Recommended</div>
              <div class="compare-icon-main">🌕</div>
              <h4>Time-Tested</h4>
              <ul>
                <li>Full Moon month start</li>
                <li>Morning day start</li>
                <li>Lunar Sabbaths (8,15,22,29)</li>
                <li>Spring equinox year</li>
              </ul>
              <button class="compare-btn" onclick="AppStore.dispatchBatch([{type:'SET_PROFILE',profileId:'timeTested'},{type:'SET_VIEW',view:'calendar'}])">
                Use This Profile
              </button>
            </div>
            
            <div class="compare-card">
              <div class="compare-icon-main">🌒</div>
              <h4>Ancient Traditional</h4>
              <ul>
                <li>Crescent Moon start</li>
                <li>Evening day start</li>
                <li>Saturday Sabbath</li>
                <li>Spring equinox year</li>
              </ul>
              <button class="compare-btn" onclick="AppStore.dispatchBatch([{type:'SET_PROFILE',profileId:'ancientTraditional'},{type:'SET_VIEW',view:'calendar'}])">
                Use This Profile
              </button>
            </div>
            
            <div class="compare-card">
              <div class="compare-icon-main">🌒</div>
              <h4>Traditional Lunar</h4>
              <ul>
                <li>Crescent Moon start</li>
                <li>Evening day start</li>
                <li>Lunar Sabbaths</li>
                <li>Spring equinox year</li>
              </ul>
              <button class="compare-btn" onclick="AppStore.dispatchBatch([{type:'SET_PROFILE',profileId:'traditionalLunar'},{type:'SET_VIEW',view:'calendar'}])">
                Use This Profile
              </button>
            </div>
            
            <div class="compare-card">
              <div class="compare-icon-main">🕎</div>
              <h4>Modern Jewish</h4>
              <ul>
                <li>Calculated conjunction</li>
                <li>Evening day start</li>
                <li>Saturday Sabbath</li>
                <li>Rabbinic postponement rules</li>
              </ul>
              <button class="compare-btn" onclick="AppStore.dispatchBatch([{type:'SET_PROFILE',profileId:'modernJewish'},{type:'SET_VIEW',view:'calendar'}])">
                Use This Profile
              </button>
            </div>
            
            <div class="compare-card">
              <div class="compare-icon-main">⚙️</div>
              <h4>Custom</h4>
              <ul>
                <li>Choose your month start</li>
                <li>Choose your day start</li>
                <li>Choose your Sabbath</li>
                <li>Choose your year start</li>
              </ul>
              <button class="compare-btn" onclick="TutorialView.openProfileEditor()">
                Configure Settings
              </button>
            </div>
          </div>
        </section>

        <!-- 8. FOOTER -->
        <footer class="tutorial-footer">
          <div class="footer-verse" style="cursor:pointer" onclick="AppStore.dispatch({type:'SET_VIEW',view:'reader',params:{contentType:'bible',book:'Proverbs',chapter:25}})">
            <p>"It is the glory of God to conceal a matter, but the glory of kings is to search out a matter."</p>
            <cite>— Proverbs 25:2</cite>
          </div>
          <div class="footer-links">
            <button onclick="AppStore.dispatch({type:'SET_VIEW',view:'settings'})">Settings</button>
            <span>•</span>
            <a href="/media/time-tested-tradition.pdf" download onclick="trackBookDownload()">Download Book PDF</a>
            <span>•</span>
            <a href="https://store.bookbaby.com/book/time-tested-tradition" target="_blank" rel="noopener">Buy Physical Copy</a>
          </div>
        </footer>
      </div>
    `;
  },
  
  /**
   * Render a feature card
   */
  renderFeatureCard(icon, title, description, view, params, isImage = false) {
    const iconHtml = isImage 
      ? `<img src="/${icon}" alt="${title}" class="feature-icon-img">`
      : `<span class="feature-icon">${icon}</span>`;
    
    const onclick = params 
      ? `AppStore.dispatch({type:'SET_VIEW',view:'${view}',params:${JSON.stringify(params).replace(/"/g, '&quot;')}})`
      : `AppStore.dispatch({type:'SET_VIEW',view:'${view}'})`;
    
    return `
      <div class="feature-card" onclick="${onclick}">
        <div class="feature-icon-wrap">${iconHtml}</div>
        <h3>${title}</h3>
        <p>${description}</p>
        <span class="feature-link">Explore →</span>
      </div>
    `;
  },
  
  /**
   * Render the list of book chapters
   */
  renderChapterList() {
    const chapters = [
      { id: '01_Introduction', title: 'Introduction', number: 1 },
      { id: '02_Inherited_Lies', title: 'Inherited Lies', number: 2 },
      { id: '03_Principles_of_Evaluation', title: 'Principles of Evaluation', number: 3 },
      { id: '04_Alleged_Authority_of_Sanhedrin', title: 'Authority of Sanhedrin', number: 4 },
      { id: '05_Where_Does_the_Day_Start', title: 'Where Does the Day Start?', number: 5 },
      { id: '06_When_Does_the_Day_Start', title: 'When Does the Day Start?', number: 6 },
      { id: '07_When_Does_the_Month_Start', title: 'When Does the Month Start?', number: 7 },
      { id: '08_When_does_the_Year_Start', title: 'When Does the Year Start?', number: 8 },
      { id: '09_How_to_Observe_the_Signs', title: 'How to Observe the Signs', number: 9 },
      { id: '10_When_is_the_Sabbath', title: 'When is the Sabbath?', number: 10 },
      { id: '11_The_Day_of_Saturn', title: 'The Day of Saturn', number: 11 },
      { id: '12_32_AD_Resurrection', title: '32 AD Resurrection', number: 12 },
      { id: '13_Herod_the_Great', title: 'Herod the Great', number: 13 },
      { id: '14_Passion_Week_-_3_Days_&_3_Nights', title: 'Passion Week', number: 14 },
      { id: '15_Solar_Only_Calendars', title: 'Solar Only Calendars', number: 15 },
      { id: '16_The_Path_to_Salvation', title: 'Path to Salvation', number: 16 },
      { id: '17_Commands_to_Follow', title: 'Commands to Follow', number: 17 },
      { id: '18_Appointed_Times', title: 'Appointed Times', number: 18 },
      { id: '19_Miscellaneous_Commands', title: 'Miscellaneous Commands', number: 19 }
    ];
    
    return chapters.map(ch => `
      <button class="chapter-item" 
              onclick="AppStore.dispatch({type:'SET_VIEW',view:'reader',params:{contentType:'timetested',chapterId:'${ch.id}'}})">
        <span class="chapter-number">${ch.number}</span>
        <span class="chapter-title">${ch.title}</span>
      </button>
    `).join('');
  },
  
  /**
   * Render appendix chapters
   */
  renderAppendixList() {
    const appendices = [
      { id: 'e01_Herod_Regal_vs_Defacto', title: 'Herod: Regal vs De Facto', letter: 'A' },
      { id: 'e02_Battle_of_Actium', title: 'Battle of Actium', letter: 'B' },
      { id: 'e03_Herods_Appointment', title: 'Herod\'s Appointment', letter: 'C' },
      { id: 'e04_StabilityOfAustronomy', title: 'Stability of Astronomy', letter: 'D' },
      { id: 'e05_FirstFruitsNewWine', title: 'First Fruits & New Wine', letter: 'E' }
    ];
    
    return appendices.map(ch => `
      <button class="chapter-item appendix" 
              onclick="AppStore.dispatch({type:'SET_VIEW',view:'reader',params:{contentType:'timetested',chapterId:'${ch.id}'}})">
        <span class="chapter-number">${ch.letter}</span>
        <span class="chapter-title">${ch.title}</span>
      </button>
    `).join('');
  },
  
  /**
   * Navigate to calendar and open profile editor
   */
  // SVG icons for OS logos (inline, no external deps)
  _osIcons: {
    apple: '<svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>',
    windows: '<svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M3 12V6.5l8-1.1V12H3zm0 .5h8v6.6l-8-1.1V12.5zm9 0h9V3l-9 1.3V12.5zm0 .5v6.7L21 21v-8.5h-9z"/></svg>',
    linux: '<svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M12.504 0c-.155 0-.315.008-.48.021-4.226.333-3.105 4.807-3.17 6.298-.076 1.092-.3 1.953-1.05 3.02-.885 1.051-2.127 2.75-2.716 4.521-.278.832-.41 1.684-.287 2.489a.424.424 0 00-.11.135c-.26.268-.45.6-.663.839-.199.199-.485.267-.797.4-.313.136-.658.269-.864.68-.09.189-.136.394-.132.602 0 .199.027.4.055.536.058.399.116.728.04.97-.249.68-.28 1.145-.106 1.484.174.334.535.47.94.601.81.2 1.91.135 2.774.6.926.466 1.866.67 2.616.47.526-.116.97-.464 1.208-.946.587-.003 1.23-.269 2.26-.334.699-.058 1.574.267 2.577.2.025.134.063.198.114.333l.003.003c.391.778 1.113 1.368 1.884 1.43.868.134 1.703-.272 2.191-.574.491-.305.463-.6.463-.6-.12.048-.247.134-.348.174-.498.2-.979.268-1.446.053-.467-.2-.857-.602-1.258-1.334-.067-.135-.184-.268-.315-.402-.131-.135-.294-.268-.467-.402-.086-.067-.135-.135-.227-.2h-.015c-.18-.267-.373-.539-.477-.802a2.41 2.41 0 01-.134-.73c-.004-.2.023-.399.07-.598.22-.268.385-.6.478-.866.16-.466.25-.932.26-1.398.005-.466-.075-.932-.32-1.398-.245-.466-.652-.866-1.253-1.066a4.5 4.5 0 00-.346-.135c.075-.269.1-.535.075-.804-.007-.933-.467-1.468-.933-1.866-.46-.4-1.027-.669-1.52-.533-.113.033-.222.1-.33.2-.18.199-.374.466-.52.669-.293.393-.573.78-.773 1.133-.4.532-.8 1.332-1.106 2.131-.161.4-.373.801-.645 1.066-.684.665-.974 1.335-.94 1.86z"/></svg>',
    pwa: '<svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>'
  },

  /**
   * Render combined install options: PWA + Desktop side by side
   */
  renderInstallOptions() {
    const isPWA = window.matchMedia('(display-mode: standalone)').matches ||
                  window.navigator.standalone === true;
    const isElectron = window.electronAPI && window.electronAPI.isElectron;

    // Already installed — show brief confirmation
    if (isPWA || isElectron) {
      return `
        <section class="install-section installed">
          <div class="install-card">
            <div class="install-icon">✅</div>
            <div class="install-info">
              <h3>App Installed — Works Offline</h3>
              <p>You're running the installed app. All data is stored locally on your device — Bible translations, the Hebrew lexicon, the timeline, and calendar calculations all work without an internet connection.</p>
            </div>
          </div>
        </section>
      `;
    }

    // ── PWA card ──
    const canInstall = !!TutorialView._deferredInstallPrompt;
    const installBtnStyle = canInstall ? '' : 'style="display:none"';
    const hint = canInstall ? '' : '<span class="install-hint">On iOS, tap Share → "Add to Home Screen." On desktop Chrome/Edge, look for the install icon in the address bar.</span>';

    // ── Desktop card: detect OS ──
    const RELEASE_VERSION = '2.0.0';
    const RELEASE_URL = 'https://github.com/timetestedbible/timetestedbible.github.io/releases/tag/v' + RELEASE_VERSION;
    const DL_BASE = 'https://github.com/timetestedbible/timetestedbible.github.io/releases/download/v' + RELEASE_VERSION;

    const ua = navigator.userAgent || '';
    const platform = navigator.platform || '';
    let osIcon = this._osIcons.apple;
    let primaryFile = '';
    let primaryLabel = 'Download Desktop App';
    let primaryNote = '';

    if (/Mac/i.test(platform) || /Macintosh/i.test(ua)) {
      osIcon = this._osIcons.apple;
      let isAppleSilicon = false;
      try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (gl) {
          const dbg = gl.getExtension('WEBGL_debug_renderer_info');
          if (dbg) {
            const r = gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL);
            isAppleSilicon = /Apple/.test(r) && !/Intel/.test(r);
          }
        }
      } catch (e) {}
      if (isAppleSilicon) {
        primaryFile = `Time.Tested.Bible-${RELEASE_VERSION}-arm64.dmg`;
        primaryLabel = 'Download for Mac';
        primaryNote = 'Apple Silicon (M1–M4)';
      } else {
        primaryFile = `Time.Tested.Bible-${RELEASE_VERSION}.dmg`;
        primaryLabel = 'Download for Mac';
        primaryNote = 'Intel Mac';
      }
    } else if (/Win/i.test(platform)) {
      osIcon = this._osIcons.windows;
      primaryFile = `Time.Tested.Bible.Setup.${RELEASE_VERSION}.exe`;
      primaryLabel = 'Download for Windows';
      primaryNote = '64-bit installer';
    } else if (/Linux/i.test(platform)) {
      osIcon = this._osIcons.linux;
      primaryFile = `Time.Tested.Bible-${RELEASE_VERSION}.AppImage`;
      primaryLabel = 'Download for Linux';
      primaryNote = 'x64 AppImage';
    }

    const dlHref = primaryFile ? `${DL_BASE}/${primaryFile}` : RELEASE_URL;

    return `
      <section class="install-options-section">
        <h2 class="section-title">Get the App</h2>
        <p class="section-intro">Works offline with all data stored locally. No account, no ads, no server dependency.</p>
        <div class="install-options-grid">

          <div class="install-option-card">
            <div class="install-option-icon">${this._osIcons.pwa}</div>
            <h3>Web App (PWA)</h3>
            <p>Install from your browser on any device. Always up to date — new features and fixes arrive automatically.</p>
            <div class="install-option-features">
              <span class="install-pro"><span class="install-check">✓</span> Auto-updates on every visit</span>
              <span class="install-pro"><span class="install-check">✓</span> Phone, tablet, or computer</span>
              <span class="install-pro"><span class="install-check">✓</span> No installer required</span>
              <span class="install-con">Cache may occasionally need refresh</span>
            </div>
            <div class="install-option-actions">
              <button class="install-option-btn pwa-btn" id="install-btn" ${installBtnStyle} onclick="TutorialView.installApp()">
                Install Web App
              </button>
              ${hint}
            </div>
          </div>

          <div class="install-option-card">
            <div class="install-option-icon">${osIcon}</div>
            <h3>Desktop App</h3>
            <p>Standalone app for your computer. No browser required — runs independently with its own window.</p>
            <div class="install-option-features">
              <span class="install-pro"><span class="install-check">✓</span> No browser dependency</span>
              <span class="install-pro"><span class="install-check">✓</span> No cache issues</span>
              <span class="install-pro"><span class="install-check">✓</span> Mac / Windows / Linux</span>
              <span class="install-con">Manual update for new releases</span>
            </div>
            <div class="install-option-actions">
              <a href="${dlHref}" class="install-option-btn desktop-btn">
                ${osIcon} ${primaryLabel}
              </a>
              ${primaryNote ? `<span class="install-option-note">${primaryNote}</span>` : ''}
              <a href="${RELEASE_URL}" class="install-option-all" target="_blank" rel="noopener">All platforms →</a>
            </div>
          </div>

        </div>
      </section>
    `;
  },

  openProfileEditor() {
    // First navigate to calendar
    AppStore.dispatch({type: 'SET_VIEW', view: 'calendar'});
    
    // Then open profile editor after a brief delay to let calendar render
    setTimeout(() => {
      if (typeof CalendarView !== 'undefined' && CalendarView.showProfileEditor) {
        // Create a fake event object
        CalendarView.showProfileEditor({ stopPropagation: () => {} });
      }
    }, 100);
  },

  /**
   * Handle PWA install button click
   */
  installApp() {
    if (TutorialView._deferredInstallPrompt) {
      TutorialView._deferredInstallPrompt.prompt();
      TutorialView._deferredInstallPrompt.userChoice.then(choice => {
        if (choice.outcome === 'accepted') {
          const btn = document.getElementById('install-btn');
          if (btn) btn.style.display = 'none';
          const hint = document.getElementById('install-hint');
          if (hint) hint.textContent = 'App installed successfully!';
        }
        TutorialView._deferredInstallPrompt = null;
      });
    }
  },

  /** Stored deferred prompt from beforeinstallprompt event */
  _deferredInstallPrompt: null
};

// Capture the browser's install prompt so we can trigger it from our button
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  TutorialView._deferredInstallPrompt = e;
  // If install button exists on page, make sure it's visible
  const btn = document.getElementById('install-btn');
  if (btn) btn.style.display = '';
});

// Hide install section if already installed as PWA
window.addEventListener('appinstalled', () => {
  TutorialView._deferredInstallPrompt = null;
  const section = document.getElementById('install-section');
  if (section) section.style.display = 'none';
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TutorialView;
}
