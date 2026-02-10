/**
 * SymbolsView - Biblical Symbol Dictionary
 * 
 * Displays the biblical symbol dictionary with definitions,
 * supporting both overview grid and detailed single-symbol view.
 * Dictionary is dynamically populated from SYMBOL_DICTIONARY.
 */

const SymbolsView = {
  /**
   * Render the symbols view
   */
  render(state, derived, container) {
    // Check if we're viewing a specific symbol
    const symbolKey = state.content.params?.symbol;
    
    if (symbolKey && SYMBOL_DICTIONARY[symbolKey]) {
      this.renderSingleSymbol(SYMBOL_DICTIONARY[symbolKey], container);
    } else {
      this.renderSymbolGrid(container);
    }
  },
  
  /**
   * Render the grid of all symbols
   */
  renderSymbolGrid(container) {
    const symbols = Object.entries(SYMBOL_DICTIONARY).sort((a, b) => a[1].name.localeCompare(b[1].name));
    const symbolCount = symbols.length;
    
    container.innerHTML = `
      <div class="symbols-view">
        <header class="symbols-header">
          <div class="header-icon">🔑</div>
          <h1>Biblical Symbol Dictionary</h1>
          <p class="header-subtitle">Unlocking the Hidden Language of Scripture</p>
        </header>
        
        <!-- The Big Idea -->
        <section class="symbols-hero">
          <div class="hero-quote">
            <blockquote>
              "Without a parable spake he not unto them... I will utter things which have been <strong>kept secret from the foundation of the world</strong>."
            </blockquote>
            <cite>— Matthew 13:34-35</cite>
          </div>
          
          <div class="hero-content">
            <p class="hero-lead">
              <strong>Scripture declares it teaches through symbols.</strong> This is not a modern interpretive framework—it is the Bible's own stated methodology.
            </p>
            <p>
              God explicitly states: <em>"I have multiplied visions, and <strong>used similitudes</strong>, by the ministry of the prophets"</em> (Hosea 12:10). 
              Jesus spoke to the multitudes <strong>only</strong> in parables (Matthew 13:34). The mysteries are given to those who seek (Matthew 13:11).
            </p>
            <p class="symbols-caution">
              The symbols in this app have been human-reviewed to be sensible and scripturally grounded—but we recognize they could be strengthened with more human touch. Do not blindly trust any tool (including AI); rely on the Holy Spirit for true understanding.
            </p>
          </div>
        </section>
        
        <!-- Why This Matters -->
        <section class="symbols-why">
          <h2>Why Symbols?</h2>
          <div class="why-grid">
            <div class="why-card">
              <div class="why-icon">🛡️</div>
              <h3>Robust Across Time</h3>
              <p>Symbolic patterns survive translation and transmission. A symbol used consistently across 1,500 years of writing creates an unbreakable signal.</p>
            </div>
            <div class="why-card">
              <div class="why-icon">🔍</div>
              <h3>Self-Correcting</h3>
              <p>Wrong interpretations fail across contexts. True meanings illuminate every occurrence. The text itself corrects the seeker.</p>
            </div>
            <div class="why-card">
              <div class="why-icon">💎</div>
              <h3>Inexhaustible Depth</h3>
              <p>Plain statements have one layer. Symbols contain infinite depth—each layer true, each layer building on the others.</p>
            </div>
            <div class="why-card">
              <div class="why-icon">❤️</div>
              <h3>Tests Hearts</h3>
              <p>Parables separate seekers from casual hearers. "It is the glory of God to conceal a thing: but the honour of kings is to search out a matter."</p>
            </div>
          </div>
        </section>
        
        <!-- Learn More Links -->
        <section class="symbols-learn-more">
          <h2>Go Deeper</h2>
          <div class="learn-more-grid">
            <a href="/reader/symbols/HOW-SCRIPTURE-TEACHES" class="learn-card" onclick="event.preventDefault(); AppStore.dispatch({type:'SET_VIEW',view:'reader',params:{contentType:'symbols-article',article:'HOW-SCRIPTURE-TEACHES'}})">
              <div class="learn-icon">📜</div>
              <h3>How Scripture Teaches</h3>
              <p>Parables, similitudes, and dark sayings—Scripture's own declared teaching method.</p>
            </a>
            <a href="/reader/symbols/WHY-PARABLES" class="learn-card" onclick="event.preventDefault(); AppStore.dispatch({type:'SET_VIEW',view:'reader',params:{contentType:'symbols-article',article:'WHY-PARABLES'}})">
              <div class="learn-icon">🧠</div>
              <h3>Why Parables?</h3>
              <p>Statistical robustness and AI discovery—why symbolic encoding is optimal.</p>
            </a>
            <a href="/reader/symbols-article/METHODOLOGY" class="learn-card" onclick="event.preventDefault(); AppStore.dispatch({type:'SET_VIEW',view:'reader',params:{contentType:'symbols-article',article:'METHODOLOGY'}})">
              <div class="learn-icon">🔬</div>
              <h3>Human Study Guide</h3>
              <p>Step-by-step process for discovering what symbols mean—let Scripture interpret Scripture.</p>
            </a>
            <a href="/reader/symbols-article/AI-METHODOLOGY" class="learn-card" onclick="event.preventDefault(); AppStore.dispatch({type:'SET_VIEW',view:'reader',params:{contentType:'symbols-article',article:'AI-METHODOLOGY'}})">
              <div class="learn-icon">🤖</div>
              <h3>AI-Assisted Study</h3>
              <p>How we use AI carefully—as a research tool, not an oracle. Includes exact prompts.</p>
            </a>
            <a href="/reader/words" class="learn-card" onclick="event.preventDefault(); AppStore.dispatch({type:'SET_VIEW',view:'reader',params:{contentType:'words'}})">
              <div class="learn-icon">📚</div>
              <h3>Word Studies</h3>
              <p>Lexical and etymological studies of Hebrew/Greek words (Strong's). Distinct from symbol studies.</p>
            </a>
            <a href="/reader/numbers" class="learn-card" onclick="event.preventDefault(); AppStore.dispatch({type:'SET_VIEW',view:'reader',params:{contentType:'numbers'}})">
              <div class="learn-icon">🔢</div>
              <h3>Number Studies</h3>
              <p>Symbolic meaning of numbers in Scripture—an extension of symbol studies.</p>
            </a>
          </div>
        </section>
        
        <!-- Symbol Dictionary -->
        <section class="symbols-dictionary">
          <h2>Symbol Dictionary <span class="symbol-count">(${symbolCount} symbols)</span></h2>
          <p class="dictionary-intro">
            Each symbol below has been derived through systematic scriptural analysis—examining how the Bible itself defines, uses, and applies the term across all occurrences.
          </p>
          <div class="symbols-grid">
            ${symbols.map(([key, symbol]) => this.renderSymbolCard(key, symbol)).join('')}
          </div>
        </section>
        
        <footer class="symbols-footer">
          <blockquote>
            "It is the glory of God to conceal a thing: but the honour of kings is to search out a matter."
          </blockquote>
          <cite>— Proverbs 25:2</cite>
        </footer>
      </div>
    `;
  },
  
  /**
   * Render a single symbol card for the grid
   */
  renderSymbolCard(key, symbol) {
    const iconMap = {
      'light': '💡',
      'darkness': '🌑',
      'day': '☀️',
      'night': '🌙',
      'mountain': '⛰️',
      'truth': '📜',
      'sea': '🌊',
      'island': '🏝️',
      'faith': '🙏',
      'believe': '✅',
      'rock': '🪨',
      'sand': '⏳',
      'highway': '🛤️',
      'way': '🚶',
      'the way': '🛤️',
      'fornication': '💔',
      'idolatry': '🗿',
      'virgin': '👰',
      'harlot': '💔',
      'sleep': '😴',
      'moment': '⚡',
      'wickedness': '🔥',
      'tree': '🌳',
      'thorns': '🌿',
      'animal': '🦁',
      'babylon': '🏛️',
      'name': '📛',
      'wings': '🪽',
      'eagle': '🦅',
      'marriage': '💍',
      'fruit': '🍇',
      'oil': '🫒',
      'mark': '✋',
      'bread': '🍞',
      'wine': '🍷',
      'wind': '💨',
      'four winds': '🌀',
      'evening': '🌅'
    };
    
    const icon = iconMap[key] || '📖';
    
    return `
      <button class="symbol-card" onclick="AppStore.dispatch({type:'SET_VIEW',view:'reader',params:{contentType:'symbols',symbol:'${key}'}})">
        <div class="symbol-card-icon">${icon}</div>
        <h3 class="symbol-card-name">${symbol.name}</h3>
        <div class="symbol-card-meaning">
          <span class="symbol-is-label">IS:</span>
          <span class="symbol-is-value">${symbol.is2 || symbol.is}</span>
        </div>
        ${symbol.does ? `
        <div class="symbol-card-meaning">
          <span class="symbol-does-label">DOES:</span>
          <span class="symbol-does-value">${symbol.does}</span>
        </div>
        ` : ''}
      </button>
    `;
  },
  
  /**
   * Render a single symbol's full details
   */
  renderSingleSymbol(symbol, container) {
    const symbolKey = Object.keys(SYMBOL_DICTIONARY).find(k => SYMBOL_DICTIONARY[k] === symbol);
    
    container.innerHTML = `
      <div class="symbols-view single-symbol-view">
        <nav class="symbol-breadcrumb">
          <button onclick="AppStore.dispatch({type:'SET_VIEW',view:'reader',params:{contentType:'symbols'}})">
            ← All Symbols
          </button>
        </nav>
        
        <article class="symbol-detail">
          <header class="symbol-detail-header">
            <h1>${symbol.name}</h1>
            <div class="symbol-words">
              Words: ${symbol.words.join(', ')}
            </div>
            ${symbol.strongs ? `
            <div class="symbol-strongs">
              Strong's: ${symbol.strongs.join(', ')}
            </div>
            ` : ''}
          </header>
          
          <section class="symbol-meanings">
            <div class="meaning-row">
              <div class="meaning-label">IS (What it represents):</div>
              <div class="meaning-value">${symbol.is}${symbol.is2 ? ' / ' + symbol.is2 : ''}</div>
            </div>
            
            ${symbol.does ? `
            <div class="meaning-row">
              <div class="meaning-label">DOES (What it does):</div>
              <div class="meaning-value">${symbol.does}${symbol.does2 ? ' / ' + symbol.does2 : ''}</div>
            </div>
            ` : ''}
            
            <div class="meaning-sentence">
              <div class="meaning-label">Full Meaning:</div>
              <p>${symbol.sentence}</p>
            </div>
            
            ${symbol.opposite ? `
            <div class="meaning-opposite">
              <div class="meaning-label">Opposite:</div>
              <div class="meaning-value">${symbol.opposite}</div>
            </div>
            ` : ''}
          </section>
          
          ${symbol.link ? `
          <section class="symbol-study-link">
            <a href="${symbol.link}" class="study-link-btn">
              📖 View Full Word Study
            </a>
          </section>
          ` : ''}
        </article>
      </div>
    `;
  }
};

// Register with ContentManager when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  if (typeof ContentManager !== 'undefined') {
    ContentManager.registerView('symbols', SymbolsView);
  }
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SymbolsView;
}
