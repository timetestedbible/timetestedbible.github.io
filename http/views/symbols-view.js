/**
 * SymbolsView - Biblical Symbol Dictionary
 * 
 * Displays the biblical symbol dictionary with definitions,
 * supporting both overview grid and detailed single-symbol view.
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
    
    container.innerHTML = `
      <div class="symbols-view">
        <header class="symbols-header">
          <div class="header-icon">📖</div>
          <h1>Biblical Symbol Dictionary</h1>
          <p class="header-subtitle">Decoding the Language of Scripture</p>
        </header>
        
        <section class="symbols-intro">
          <p>
            Scripture frequently uses symbolic language where physical things represent spiritual realities.
            Understanding these symbols unlocks deeper meaning in prophetic and poetic passages.
          </p>
        </section>
        
        <section class="symbols-grid">
          ${symbols.map(([key, symbol]) => this.renderSymbolCard(key, symbol)).join('')}
        </section>
        
        <footer class="symbols-footer">
          <p>"It is the glory of God to conceal a thing: but the honour of kings is to search out a matter." — Proverbs 25:2</p>
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
      'mountain': '⛰️',
      'truth': '📜',
      'sea': '🌊',
      'island': '🏝️',
      'faith': '🙏',
      'believe': '✅',
      'rock': '🪨',
      'sand': '⏳',
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
      'mark': '✋'
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
