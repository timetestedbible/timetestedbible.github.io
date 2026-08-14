/**
 * MEAT Tester Experiment
 *
 * Reader-facing dashboard for the frozen glossary-consensus experiment. The
 * compact index is loaded up front; exact requests, responses, and evidence
 * snapshots are fetched only when a reader opens an audit trail.
 */
const MeatTesterView = {
  DATA_URL: '/data/meat-tester-experiment.json',
  _data: null,
  _container: null,
  _mode: 'current',
  _query: '',
  _verdict: 'ALL',
  _sort: 'TERM',
  _selected: null,
  _activeStage: 'persuasion',
  _auditCache: new Map(),
  _loadToken: 0,
  _routeParams: {},
  _routeKey: '',

  PROVIDER_ORDER: ['openai', 'anthropic', 'gemini', 'xai'],
  CLOUD_CATEGORIES: [
    ['DIVERGENT_PERSUADED', 'Divergent · persuaded'],
    ['DIVERGENT_DISPUTED', 'Divergent · panel disputed'],
    ['DIVERGENT_UNPERSUADED', 'Divergent · unconvinced'],
    ['REFINED', 'Refined'],
    ['MATCH', 'Match'],
    ['NOVEL', 'Novel'],
    ['DISPUTED', 'Disputed'],
    ['DIVERGENT_PENDING', 'Divergent · not yet judged'],
    ['UNTESTED', 'Not yet tested'],
  ],

  // Navigation state is canonical in content.params. Render from the route;
  // controls dispatch route changes, and ordinary anchors use the app router.
  render(state, _derived, container) {
    this._container = container;
    this._routeParams = this.normalizeRouteParams(state?.content?.params || {});
    if (container.querySelector('.meat-tester-view')) {
      if (this._data) this.applyRouteState(this._routeParams);
      return;
    }

    container.innerHTML = `
      <div class="meat-tester-view">
        <header class="meat-hero">
          <div class="meat-eyebrow">A reproducible challenge to inherited interpretations</div>
          <h1>MEAT Tester Experiment</h1>
          <p class="meat-hero-lede">
            Can the scriptural argument in <em>MEAT The Bible's Symbolic Language</em>
            overcome the strongest popular objections when the same AI models that
            describe the common teaching are asked to judge the evidence?
          </p>
          <div class="meat-human-banner">
            <span class="meat-human-icon" aria-hidden="true">⚖</span>
            <div>
              <strong>AI is not the ultimate judge.</strong>
              <span>Its ruling is a reason to examine the argument closely—not permission to stop thinking. You are responsible for reviewing the evidence and drawing the conclusion.</span>
            </div>
          </div>
        </header>

        <section class="meat-premise" aria-labelledby="meat-premise-title">
          <div class="meat-section-heading">
            <span>What this establishes</span>
            <h2 id="meat-premise-title">A controlled reason to take an unfamiliar reading seriously</h2>
          </div>
          <p>
            AI serves here as a proxy for recognizable orthodox or popular teaching—not
            as an oracle of truth. First it states the inherited interpretation while
            blinded to the book. Then MEAT presents its glossary definition, citations,
            method, and supporting evidence. Finally the same independent models must
            decide whether that exact glossary entry explains the evidence better than
            the strongest competing definition. The chapter itself is not being graded.
          </p>
          <p>
            When a divergent conclusion persuades that panel, the result does not prove
            doctrine by majority vote. It establishes something narrower and useful:
            informed readers should strongly consider the argument because it survived
            the objections the popular reading could marshal against it.
          </p>
        </section>

        <section class="meat-flow" aria-label="Experiment stages">
          <article>
            <span class="meat-step-number">1</span>
            <div><strong>Blind baseline</strong><p>Each model receives only the symbolic term and states the recognizable common interpretation.</p></div>
          </article>
          <span class="meat-flow-arrow" aria-hidden="true">→</span>
          <article>
            <span class="meat-step-number">2</span>
            <div><strong>Measure divergence</strong><p>The book's definition and citations are compared with the anonymized baseline.</p></div>
          </article>
          <span class="meat-flow-arrow" aria-hidden="true">→</span>
          <article>
            <span class="meat-step-number">3</span>
            <div><strong>Test the glossary entry</strong><p>The definition faces the strongest specific rival; its chapter is admitted only as supporting evidence.</p></div>
          </article>
          <span class="meat-flow-arrow" aria-hidden="true">→</span>
          <article class="meat-flow-human">
            <span class="meat-step-number">4</span>
            <div><strong>You review the evidence</strong><p>Every prompt and response is preserved so the reader can judge the judges.</p></div>
          </article>
        </section>

        <section class="meat-controls" aria-labelledby="meat-controls-title">
          <div class="meat-section-heading">
            <span>Experimental controls</span>
            <h2 id="meat-controls-title">What keeps the panel useful</h2>
          </div>
          <div class="meat-control-grid">
            <article><strong>Blind first impression</strong><p>The consensus stage never sees MEAT's definition, citations, or verdict badge.</p></article>
            <article><strong>Entry-only scope</strong><p>The glossary definition is judged. Broader chapter applications are preserved as evidence but cannot lower its ruling.</p></article>
            <article><strong>Strongest rival required</strong><p>“Unpersuaded” must identify a contradictory interpretation that explains the same evidence better.</p></article>
            <article><strong>Dependencies stay personal</strong><p>A model inherits only conclusions that the same provider and model accepted in a prior frozen run.</p></article>
            <article><strong>Strict majority</strong><p>Every provider gets one vote. A 2–2 split is disputed; no tie is silently broken.</p></article>
            <article><strong>Complete audit trail</strong><p>Model IDs, source snapshots, prompts, requests, raw responses, and normalized rulings are saved.</p></article>
          </div>
        </section>

        <section class="meat-results" id="meat-results" aria-labelledby="meat-results-title">
          <div class="meat-section-heading meat-results-heading">
            <div><span>The rulings</span><h2 id="meat-results-title">Review the experiment yourself</h2></div>
            <p>Start with the panel's conclusion, then open the evidence trail that produced it. Protocol 13 judges only the glossary entry; older frozen runs are marked as legacy scope.</p>
          </div>
          <div id="meat-dashboard-loading" class="meat-dashboard-loading" role="status">Loading the frozen experiment archive…</div>
          <div id="meat-dashboard" hidden>
            <div id="meat-stats" class="meat-stats"></div>
            <section id="meat-symbol-overview" class="meat-symbol-overview" aria-labelledby="meat-symbol-cloud-title" tabindex="-1">
              <div class="meat-symbol-overview-heading">
                <div><span>At a glance</span><h3 id="meat-symbol-cloud-title">Symbol cloud</h3></div>
                <p id="meat-symbol-cloud-summary">Every glossary entry has equal weight; color shows its ruling or testing status.</p>
              </div>
              <div id="meat-symbol-legend" class="meat-symbol-legend" aria-label="Toggle cloud categories"></div>
              <div id="meat-symbol-cloud" class="meat-symbol-cloud"></div>
            </section>
            <div class="meat-dashboard-controls" aria-label="Filter experiment results">
              <label>
                <span>View</span>
                <select id="meat-mode-filter">
                  <option value="current">Current conclusions</option>
                  <option value="history">Full run history</option>
                </select>
              </label>
              <label>
                <span>Ruling</span>
                <select id="meat-verdict-filter">
                  <option value="ALL">All rulings</option>
                  <option value="CONFLICT">Any judge conflict</option>
                  <option value="DIVERGENT_PERSUADED">Divergent · persuaded</option>
                  <option value="DIVERGENT_DISPUTED">Divergent · panel disputed</option>
                  <option value="DIVERGENT_UNPERSUADED">Divergent · unconvinced</option>
                  <option value="DIVERGENT_PENDING">Divergent · not yet judged</option>
                  <option value="REFINED">Refines the baseline</option>
                  <option value="MATCH">Matches the baseline</option>
                  <option value="NOVEL">No settled baseline</option>
                  <option value="DISPUTED">Disputed</option>
                </select>
              </label>
              <label>
                <span>Sort</span>
                <select id="meat-sort">
                  <option value="TERM">Term A–Z</option>
                  <option value="RULING">Ruling label</option>
                </select>
              </label>
              <label class="meat-search-label">
                <span>Find a conclusion</span>
                <input id="meat-search" type="search" placeholder="Oil, faith, ship…" autocomplete="off">
              </label>
            </div>
            <div class="meat-results-layout">
              <div>
                <div id="meat-result-count" class="meat-result-count" aria-live="polite"></div>
                <div id="meat-result-list" class="meat-result-list"></div>
              </div>
              <div id="meat-detail" class="meat-detail" aria-live="polite">
                <div class="meat-detail-empty">Choose a conclusion to inspect its evidence trail.</div>
              </div>
            </div>
          </div>
        </section>

        <footer class="meat-closing">
          <strong>The experiment can identify an argument that deserves a hearing.</strong>
          <p>It cannot transfer your responsibility to test all things and hold fast what is good.</p>
        </footer>
      </div>
    `;

    this.loadData();
  },

  cleanup() {
    this._loadToken += 1;
    this._routeKey = '';
    this._data = null;
    this._container = null;
  },

  async loadData() {
    const token = ++this._loadToken;
    try {
      if (!this._data) {
        const response = await fetch(this.DATA_URL, { cache: 'no-store' });
        if (!response.ok) throw new Error(`Experiment index returned ${response.status}`);
        this._data = await response.json();
      }
      if (token !== this._loadToken || !this._container) return;
      this.bindDashboard();
      this.applyRouteState(this._routeParams, true);
    } catch (error) {
      const loading = this._container?.querySelector('#meat-dashboard-loading');
      if (loading) loading.innerHTML = `<strong>The experiment archive could not be loaded.</strong><span>${this.escapeHtml(error.message)}</span>`;
    }
  },

  bindDashboard() {
    const loading = this._container.querySelector('#meat-dashboard-loading');
    const dashboard = this._container.querySelector('#meat-dashboard');
    loading.hidden = true;
    dashboard.hidden = false;

    this._container.querySelector('#meat-mode-filter').addEventListener('change', event => {
      this.dispatchRoute({ mode: event.target.value, term: null, run: null, stage: null, judge: null });
    });
    this._container.querySelector('#meat-verdict-filter').addEventListener('change', event => {
      this.dispatchRoute({ ruling: event.target.value });
    });
    this._container.querySelector('#meat-sort').addEventListener('change', event => {
      this.dispatchRoute({ sort: event.target.value });
    });
    this._container.querySelector('#meat-search').addEventListener('input', event => {
      this.dispatchRoute({ search: event.target.value.trim() }, true);
    });
  },

  normalizeRouteParams(params) {
    const mode = params.mode === 'history' ? 'history' : 'current';
    const requestedRuling = String(params.ruling || 'ALL').toUpperCase();
    const ruling = [
      'ALL',
      'CONFLICT',
      'DIVERGENT_PERSUADED',
      'DIVERGENT_DISPUTED',
      'DIVERGENT_UNPERSUADED',
      'DIVERGENT_PENDING',
      'REFINED',
      'MATCH',
      'NOVEL',
      'DISPUTED',
    ].includes(requestedRuling)
      ? requestedRuling
      : 'ALL';
    const sort = params.sort === 'RULING' ? 'RULING' : 'TERM';
    const stage = ['consensus', 'relationship', 'persuasion'].includes(params.stage) ? params.stage : '';
    const judge = this.PROVIDER_ORDER.includes(params.judge) ? params.judge : '';
    const requestedCloud = new Set(String(params.cloud || '').split(',').filter(Boolean));
    const cloud = this.CLOUD_CATEGORIES
      .map(([verdict]) => verdict)
      .filter(verdict => requestedCloud.has(verdict))
      .join(',');
    return {
      mode,
      ruling,
      sort,
      search: String(params.search || ''),
      term: String(params.term || ''),
      run: String(params.run || ''),
      stage,
      judge,
      cloud,
    };
  },

  applyRouteState(params, force = false) {
    const normalized = this.normalizeRouteParams(params);
    const routeKey = JSON.stringify(normalized);
    if (!force && routeKey === this._routeKey) return;
    this._routeKey = routeKey;
    this._routeParams = normalized;
    this._mode = normalized.mode;
    this._verdict = normalized.ruling;
    this._sort = normalized.sort;
    this._query = normalized.search.toLowerCase();

    this._container.querySelector('#meat-mode-filter').value = this._mode;
    this._container.querySelector('#meat-verdict-filter').value = this._verdict;
    this._container.querySelector('#meat-sort').value = this._sort;
    this._container.querySelector('#meat-search').value = normalized.search;

    const target = this.resolveRouteEntry(normalized);
    this._selected = target ? { runId: target.run?.id || '', anchor: target.entry.anchor } : null;
    this._activeStage = normalized.stage || (target?.untested ? 'relationship' : this.resultStage(target?.entry));
    this.renderDashboard();

    const detail = this._container.querySelector('#meat-detail');
    if (!target) {
      detail.innerHTML = '<div class="meat-detail-empty">Choose a conclusion to inspect its evidence trail.</div>';
      return;
    }
    if (target.untested) {
      this.renderUntestedDetail(target.entry);
      return;
    }
    this.renderDetail(target.run, target.entry);
    if (normalized.judge) this.openAudit(target.run, target.entry, normalized.judge);
  },

  resolveRouteEntry(params) {
    if (!params.term) return null;
    let run = params.run ? this._data.runs.find(candidate => candidate.id === params.run) : null;
    let entry = run?.entries.find(candidate => candidate.anchor === params.term);
    if (!entry) {
      const current = this._data.currentEntries.find(candidate => candidate.anchor === params.term);
      if (current) {
        run = this._data.runs.find(candidate => candidate.id === current.runId);
        entry = run ? current : null;
      }
    }
    if (run && entry) return { run, entry, untested: false };
    const glossaryEntry = this._data.glossaryEntries?.find(candidate => candidate.anchor === params.term);
    return glossaryEntry ? { run: null, entry: glossaryEntry, untested: true } : null;
  },

  routeParams(overrides = {}) {
    const merged = { ...this._routeParams, ...overrides };
    Object.keys(merged).forEach(key => {
      if (merged[key] === null || merged[key] === undefined || merged[key] === '') delete merged[key];
    });
    return this.normalizeRouteParams(merged);
  },

  dispatchRoute(overrides = {}, replace = false) {
    if (typeof AppStore === 'undefined') return;
    AppStore.dispatch({
      type: 'SET_VIEW',
      view: 'meat-tester',
      params: this.routeParams(overrides),
      replace,
    });
  },

  meatHref(overrides = {}) {
    const route = this.routeParams(overrides);
    const query = new URLSearchParams();
    if (route.term) query.set('term', route.term);
    if (route.run) query.set('run', route.run);
    if (route.mode !== 'current') query.set('mode', route.mode);
    if (route.ruling !== 'ALL') query.set('ruling', route.ruling);
    if (route.sort !== 'TERM') query.set('sort', route.sort);
    if (route.search) query.set('search', route.search);
    if (route.stage) query.set('stage', route.stage);
    if (route.judge) query.set('judge', route.judge);
    if (route.cloud) query.set('cloud', route.cloud);
    const queryString = query.toString();
    return `/meat-tester${queryString ? `?${queryString}` : ''}`;
  },

  renderDashboard() {
    const stats = this._data.stats;
    const persuaded = stats.verdicts.DIVERGENT_PERSUADED || 0;
    this._container.querySelector('#meat-stats').innerHTML = `
      <article><span>Glossary entries tested</span><strong>${stats.currentConclusions} / ${stats.glossaryEntries || stats.currentConclusions}</strong></article>
      <article><span>Divergent cases persuaded</span><strong>${persuaded}</strong></article>
      <article class="meat-model-stat">
        <span>Model families represented</span>
        <div class="meat-model-stat-value">
          <strong>${stats.providerModels}</strong>
          <div class="meat-model-icons" aria-label="GPT, Claude, Gemini, and Grok">
            ${this.providerIcon('openai', 'GPT')}
            ${this.providerIcon('anthropic', 'Claude')}
            ${this.providerIcon('gemini', 'Gemini')}
            ${this.providerIcon('xai', 'Grok')}
          </div>
        </div>
      </article>
      <article><span>Frozen runs available</span><strong>${stats.archivedRuns}</strong></article>
    `;
    this.renderSymbolLegend();
    this.renderSymbolCloud();
    this.renderResultList();
  },

  hiddenCloudVerdicts() {
    return new Set(String(this._routeParams.cloud || '').split(',').filter(Boolean));
  },

  cloudToggleHref(verdict) {
    const hidden = this.hiddenCloudVerdicts();
    hidden.has(verdict) ? hidden.delete(verdict) : hidden.add(verdict);
    const cloud = this.CLOUD_CATEGORIES
      .map(([candidate]) => candidate)
      .filter(candidate => hidden.has(candidate))
      .join(',');
    return this.meatHref({ cloud: cloud || null });
  },

  renderSymbolLegend() {
    const legend = this._container.querySelector('#meat-symbol-legend');
    if (!legend) return;
    const hidden = this.hiddenCloudVerdicts();
    legend.innerHTML = this.CLOUD_CATEGORIES.map(([verdict, label]) => {
      const visible = !hidden.has(verdict);
      return `<a class="meat-symbol-legend-item ${this.verdictClass(verdict)}${visible ? '' : ' is-hidden'}"
        href="${this.escapeAttr(this.cloudToggleHref(verdict))}"
        role="button"
        aria-pressed="${visible}"
        title="${this.escapeAttr(`${visible ? 'Hide' : 'Show'} ${label}`)}"><i aria-hidden="true"></i>${this.escapeHtml(label)}</a>`;
    }).join('') + (hidden.size
      ? `<a class="meat-symbol-legend-reset" href="${this.escapeAttr(this.meatHref({ cloud: null }))}">Show all</a>`
      : '');
  },

  renderSymbolCloud() {
    const cloud = this._container.querySelector('#meat-symbol-cloud');
    if (!cloud) return;
    const allEntries = [...(this._data.glossaryEntries || this._data.currentEntries)]
      .sort((a, b) => this.termSortKey(a.term).localeCompare(this.termSortKey(b.term)));
    const hidden = this.hiddenCloudVerdicts();
    const entries = allEntries.filter(entry => !hidden.has(entry.finalVerdict));
    const summary = this._container.querySelector('#meat-symbol-cloud-summary');
    if (summary) summary.textContent = hidden.size
      ? `${entries.length} of ${allEntries.length} glossary entries shown. Select a color label to toggle it.`
      : `All ${allEntries.length} glossary entries shown. Select a color label to toggle it.`;
    cloud.innerHTML = entries.map(entry => `
      <a class="meat-symbol-token ${this.verdictClass(entry.finalVerdict)}${this._selected?.anchor === entry.anchor ? ' is-selected' : ''}"
              href="${this.escapeAttr(this.meatHref({ mode: 'current', term: entry.anchor, run: null, stage: null, judge: null }))}"
              title="${this.escapeAttr(`${entry.term}: ${this.verdictLabel(entry.finalVerdict)}`)}"
              ${this._selected?.anchor === entry.anchor ? 'aria-current="page"' : ''}>
        ${this.escapeHtml(entry.term)}
      </a>
    `).join('') || '<span class="meat-symbol-cloud-empty">No categories selected. Use “Show all” above to restore the cloud.</span>';
  },

  entriesForMode() {
    if (this._mode === 'current') return this._data.currentEntries;
    return this._data.runs
      .flatMap(run => run.entries.map(entry => ({
        ...entry,
        runId: run.id,
        protocolVersion: run.protocolVersion,
        reportable: run.reportable,
        createdAt: run.createdAt,
      })))
      .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '') || a.term.localeCompare(b.term));
  },

  filteredEntries() {
    const entries = this.entriesForMode().filter(entry => {
      if (this._verdict === 'CONFLICT' && !this.hasJudgeConflict(entry)) return false;
      if (!['ALL', 'CONFLICT'].includes(this._verdict) && entry.finalVerdict !== this._verdict) return false;
      if (!this._query) return true;
      return [entry.term, entry.definition, entry.commonView, entry.runId]
        .some(value => String(value || '').toLowerCase().includes(this._query));
    });
    return this.sortEntries(entries);
  },

  sortEntries(entries) {
    const rulingOrder = [
      'DIVERGENT_PERSUADED',
      'DIVERGENT_DISPUTED',
      'DIVERGENT_UNPERSUADED',
      'DIVERGENT_PENDING',
      'REFINED',
      'MATCH',
      'NOVEL',
      'DISPUTED',
    ];
    return [...entries].sort((a, b) => {
      if (this._sort === 'RULING') {
        const aIndex = rulingOrder.indexOf(a.finalVerdict);
        const bIndex = rulingOrder.indexOf(b.finalVerdict);
        const categoryOrder = (aIndex < 0 ? rulingOrder.length : aIndex) - (bIndex < 0 ? rulingOrder.length : bIndex);
        if (categoryOrder) return categoryOrder;
      }
      const termOrder = this.termSortKey(a.term).localeCompare(this.termSortKey(b.term));
      if (termOrder) return termOrder;
      return String(b.createdAt || '').localeCompare(String(a.createdAt || ''));
    });
  },

  termSortKey(term) {
    return String(term || '').replace(/^the\s+/i, '').toLowerCase();
  },

  renderResultList() {
    const entries = this.filteredEntries();
    const count = this._container.querySelector('#meat-result-count');
    const list = this._container.querySelector('#meat-result-list');
    count.textContent = `${entries.length} ${entries.length === 1 ? 'ruling' : 'rulings'} shown`;

    if (!entries.length) {
      list.innerHTML = '<div class="meat-no-results">No rulings match those filters.</div>';
      return;
    }

    list.innerHTML = entries.map(entry => {
      const selected = this._selected?.runId === entry.runId && this._selected?.anchor === entry.anchor;
      const development = this._mode === 'history' && entry.reportable === false;
      return `
        <a class="meat-result-card ${this.verdictClass(entry.finalVerdict)}${selected ? ' is-selected' : ''}"
                href="${this.escapeAttr(this.meatHref({ term: entry.anchor, run: this._mode === 'history' ? entry.runId : null, stage: null, judge: null }))}"
                ${selected ? 'aria-current="page"' : ''}>
          <span class="meat-result-card-top">
            <span class="meat-verdict-badge">${this.escapeHtml(this.verdictLabel(entry.finalVerdict))}</span>
            ${development ? '<span class="meat-development-badge">Development protocol</span>' : ''}
            ${entry.revisionPending ? '<span class="meat-revision-badge">Revision · rerun needed</span>' : ''}
          </span>
          <strong>${this.escapeHtml(entry.term)}</strong>
          <span class="meat-result-definition">${this.escapeHtml(this.displayText(entry.definition) || 'No definition recorded.')}</span>
          <span class="meat-judge-dots" aria-label="${this.escapeAttr(this.judgeSummary(entry))}">
            ${entry.judges.map(judge => this.judgeDot(judge, entry)).join('')}
          </span>
          ${this._mode === 'history' ? `<span class="meat-run-label">${this.escapeHtml(entry.runId)} · protocol ${entry.protocolVersion || 'development'}</span>` : ''}
        </a>
      `;
    }).join('');
  },

  renderUntestedDetail(entry) {
    const detail = this._container.querySelector('#meat-detail');
    const entries = this._data.glossaryEntries || [];
    const index = entries.findIndex(candidate => candidate.anchor === entry.anchor);
    const previous = index > 0 ? entries[index - 1] : null;
    const next = index >= 0 && index < entries.length - 1 ? entries[index + 1] : null;
    const chapter = entry.chapterSlugs?.[0]
      ? `<a class="meat-untested-chapter" href="/books/symbolic-language/${this.escapeAttr(entry.chapterSlugs[0])}/">Read the supporting chapter →</a>`
      : '';

    detail.innerHTML = `
      <article class="meat-detail-shell">
        <header class="meat-detail-header">
          <div>
            <span class="meat-verdict-badge ${this.verdictClass('UNTESTED')}">${this.escapeHtml(this.verdictLabel('UNTESTED'))}</span>
            <h3>${this.escapeHtml(entry.term)}</h3>
          </div>
        </header>

        <aside class="meat-untested-note" role="note">
          <strong>No frozen experiment ruling yet</strong>
          <span>This entry is present in the book's current glossary, but it has not yet passed through the independent judging protocol.</span>
        </aside>

        <section class="meat-untested-definition">
          <span>Current glossary entry</span>
          <p>${this.escapeHtml(this.displayText(entry.definition) || 'No definition recorded.')}</p>
          ${chapter}
        </section>
        ${entry.citations ? `<div class="meat-citations"><strong>Cited evidence</strong><span>${this.renderCitationEvidence(entry.citations)}</span></div>` : ''}

        <nav class="meat-detail-navigation" aria-label="Glossary navigation">
          <a href="${this.escapeAttr(this.meatHref({ term: null, run: null, stage: null, judge: null }))}">↑ Symbol overview</a>
          ${previous
            ? `<a href="${this.escapeAttr(this.meatHref({ term: previous.anchor, run: null, stage: null, judge: null }))}">← Previous</a>`
            : '<span aria-disabled="true">← Previous</span>'}
          ${next
            ? `<a href="${this.escapeAttr(this.meatHref({ term: next.anchor, run: null, stage: null, judge: null }))}">Next →</a>`
            : '<span aria-disabled="true">Next →</span>'}
        </nav>
      </article>
    `;
    this.preloadVerseTooltips();
  },

  renderDetail(run, entry) {
    const detail = this._container.querySelector('#meat-detail');
    const history = this._data.runs
      .filter(candidate => candidate.entries.some(item => item.anchor === entry.anchor))
      .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    const judgment = this.getHumanJudgment(run.id, entry.anchor);
    const detailNavigation = this.detailNavigation(run.id, entry.anchor);

    detail.innerHTML = `
      <article class="meat-detail-shell">
        <header class="meat-detail-header">
          <div>
            <span class="meat-verdict-badge ${this.verdictClass(entry.finalVerdict)}">${this.escapeHtml(this.verdictLabel(entry.finalVerdict))}</span>
            <h3>${this.escapeHtml(entry.term)}</h3>
            ${entry.frozenTerm ? `<span class="meat-frozen-headword">Frozen run headword: ${this.escapeHtml(entry.frozenTerm)}</span>` : ''}
          </div>
          <label class="meat-run-select-label">
            <span>Frozen run</span>
            <select id="meat-run-select">
              ${history.map(candidate => `<option value="${this.escapeAttr(candidate.id)}"${candidate.id === run.id ? ' selected' : ''}>${this.escapeHtml(candidate.id)}${candidate.reportable ? '' : ' · development'}</option>`).join('')}
            </select>
          </label>
        </header>

        ${entry.revisionPending ? `
          <aside class="meat-revision-scope" role="note">
            <strong>Current glossary revision · rerun needed</strong>
            <span>The definition or cited evidence changed after this frozen run. The glossary wording below is current; the verdict badge and judge panels apply to the archived wording.</span>
          </aside>
        ` : ''}

        ${this.needsLegacyScopeWarning(run, entry) ? `
          <aside class="meat-legacy-scope" role="note">
            <strong>Legacy scope · protocol ${this.escapeHtml(run.protocolVersion || 'unknown')}</strong>
            <span>This frozen ruling predates the glossary-only boundary and may include objections to broader chapter arguments. It remains available for audit but should be rerun under protocol 13 before its scope qualifier is treated as a glossary ruling.</span>
          </aside>
        ` : ''}

        ${this.relationshipIsPartial(entry) ? `
          <aside class="meat-partial-scope" role="note">
            <strong>Phase 2 in progress · ${this.escapeHtml(entry.completion.relationship)}/${this.escapeHtml(entry.completion.providers)} judges</strong>
            <span>The blind definitions are saved, but the overall relationship remains Pending until every panel member has classified this glossary entry.</span>
          </aside>
        ` : ''}

        <div class="meat-comparison">
          <section><span>Recognizable common reading</span><p>${this.escapeHtml(this.displayText(entry.commonView || this.firstConsensus(entry)) || 'No consensus summary recorded.')}</p></section>
          <div class="meat-versus" aria-hidden="true">vs.</div>
          <section><span>MEAT's conclusion</span><p>${this.escapeHtml(this.displayText(entry.definition) || 'No book definition recorded.')}</p></section>
        </div>
        ${entry.citations ? `<div class="meat-citations"><strong>Cited evidence</strong><span>${this.renderCitationEvidence(entry.citations)}</span></div>` : ''}

        <nav class="meat-stage-tabs" aria-label="Experiment stage">
          ${this.stageButton('consensus', '1 · Blind baseline')}
          ${this.stageButton('relationship', '2 · Relationship')}
          ${this.stageButton('persuasion', '3 · Persuasion')}
        </nav>
        <div id="meat-stage-panel"></div>

        <section class="meat-source-archive">
          <div><span>Frozen source archive</span><strong>Inspect what every judge was given</strong></div>
          <div class="meat-source-links">
            ${this.sourceLinks(run)}
          </div>
        </section>

        <section class="meat-human-ruling">
          <div>
            <span>Your conclusion</span>
            <strong>Judge the argument, not the vote.</strong>
            <p>Your private ruling stays in this browser and is never added to the panel result.</p>
          </div>
          <div class="meat-human-buttons" role="group" aria-label="Record your private conclusion">
            ${this.humanButton('PERSUADED', 'Persuaded', judgment)}
            ${this.humanButton('UNPERSUADED', 'Unpersuaded', judgment)}
            ${this.humanButton('REVIEWING', 'Still reviewing', judgment)}
          </div>
        </section>

        <nav class="meat-detail-navigation" aria-label="Ruling navigation">
          <a href="${this.escapeAttr(this.meatHref({ term: null, run: null, stage: null, judge: null }))}">↑ Symbol overview</a>
          ${detailNavigation.previous
            ? `<a href="${this.escapeAttr(this.meatHref({ term: detailNavigation.previous.anchor, run: this._mode === 'history' ? detailNavigation.previous.runId : null, stage: null, judge: null }))}">← Previous</a>`
            : '<span aria-disabled="true">← Previous</span>'}
          ${detailNavigation.next
            ? `<a href="${this.escapeAttr(this.meatHref({ term: detailNavigation.next.anchor, run: this._mode === 'history' ? detailNavigation.next.runId : null, stage: null, judge: null }))}">Next →</a>`
            : '<span aria-disabled="true">Next →</span>'}
        </nav>
      </article>
    `;

    detail.querySelector('#meat-run-select').addEventListener('change', event => {
      this.dispatchRoute({ term: entry.anchor, run: event.target.value, judge: null });
    });
    detail.querySelectorAll('.meat-human-choice').forEach(button => {
      button.addEventListener('click', () => {
        this.setHumanJudgment(run.id, entry.anchor, button.dataset.judgment);
        this.renderDetail(run, entry);
      });
    });
    this.renderStagePanel(run, entry);
    this.preloadVerseTooltips();
  },

  detailNavigation(runId, anchor) {
    const entries = this.filteredEntries();
    const index = entries.findIndex(entry => entry.runId === runId && entry.anchor === anchor);
    if (index < 0) return { previous: null, next: null };
    return {
      previous: index > 0 ? entries[index - 1] : null,
      next: index < entries.length - 1 ? entries[index + 1] : null,
    };
  },

  renderCitationEvidence(citations) {
    const books = [
      'Song of Solomon', 'Song of Songs', '1 Thessalonians', '2 Thessalonians',
      '1 Corinthians', '2 Corinthians', '1 Chronicles', '2 Chronicles',
      'Deuteronomy', 'Ecclesiastes', 'Lamentations', 'Philippians', 'Revelation',
      'Zephaniah', 'Zechariah', 'Leviticus', 'Numbers', 'Joshua', 'Judges',
      '1 Samuel', '2 Samuel', '1 Kings', '2 Kings', 'Nehemiah', 'Esther',
      'Proverbs', 'Jeremiah', 'Ezekiel', 'Daniel', 'Habakkuk', 'Malachi',
      'Matthew', 'Romans', 'Galatians', 'Ephesians', 'Colossians', 'Hebrews',
      '1 Timothy', '2 Timothy', 'Philemon', 'James', '1 Peter', '2 Peter',
      '1 John', '2 John', '3 John', 'Genesis', 'Exodus', 'Ruth', 'Ezra', 'Job',
      'Psalms', 'Psalm', 'Isaiah', 'Hosea', 'Joel', 'Amos', 'Obadiah', 'Jonah',
      'Micah', 'Nahum', 'Haggai', 'Mark', 'Luke', 'John', 'Acts', 'Titus', 'Jude',
      'Gen', 'Exod', 'Ex', 'Lev', 'Num', 'Deut', 'Josh', 'Judg', 'Sam', 'Kgs',
      'Chr', 'Neh', 'Est', 'Ps', 'Psa', 'Prov', 'Eccl', 'Song', 'Isa', 'Jer',
      'Lam', 'Ezek', 'Dan', 'Hos', 'Obad', 'Mic', 'Nah', 'Hab', 'Zeph', 'Hag',
      'Zech', 'Mal', 'Matt', 'Mk', 'Lk', 'Jn', 'Rom', 'Cor', 'Gal', 'Eph',
      'Phil', 'Col', 'Thess', 'Tim', 'Tit', 'Phlm', 'Heb', 'Jas', 'Pet', 'Rev',
    ].sort((a, b) => b.length - a.length);
    const bookPattern = books.map(book => book.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
    const referencePattern = new RegExp(`\\b((?:[123]\\s+)?(?:${bookPattern}))\\.?\\s+(\\d+(?::\\d+(?:[-–—]\\d+)?(?:,\\s*\\d+(?:[-–—]\\d+)?)*)?(?:[-–—]\\d+(?::\\d+)?)?)`, 'gi');
    const continuationPattern = /^(\s*)(\d+:\d+(?:[-–—]\d+)?(?:,\s*\d+(?:[-–—]\d+)?)*)/;
    let currentBook = '';

    return String(citations).split(/(;)/).map(segment => {
      if (segment === ';') return ';';
      let html = '';
      let cursor = 0;
      let foundNamedReference = false;
      referencePattern.lastIndex = 0;
      let match;

      while ((match = referencePattern.exec(segment))) {
        foundNamedReference = true;
        html += this.escapeHtml(segment.slice(cursor, match.index));
        const displayBook = match[1];
        const displayReference = match[2];
        currentBook = this.normalizeCitationBook(displayBook);
        html += this.scripturePreviewLink(match[0], this.canonicalCitation(currentBook, displayReference));
        cursor = match.index + match[0].length;
      }

      if (foundNamedReference) return html + this.escapeHtml(segment.slice(cursor));

      const continuation = currentBook ? segment.match(continuationPattern) : null;
      if (!continuation) return this.escapeHtml(segment);
      const displayReference = continuation[2];
      const remainder = segment.slice(continuation[0].length);
      return `${this.escapeHtml(continuation[1])}${this.scripturePreviewLink(displayReference, this.canonicalCitation(currentBook, displayReference))}${this.escapeHtml(remainder)}`;
    }).join('');
  },

  normalizeCitationBook(book) {
    return typeof normalizeBookName === 'function' ? normalizeBookName(book) : String(book).replace(/\.$/, '');
  },

  canonicalCitation(book, reference) {
    if (/^(Obadiah|Philemon|2 John|3 John|Jude)$/i.test(book) && !reference.includes(':')) return `${book} 1:${reference}`;
    return `${book} ${reference}`;
  },

  scripturePreviewLink(display, citation) {
    const match = citation.match(/^(.+?)\s+(\d+)(?::(\d+))?/);
    const translation = typeof getDefaultTranslation === 'function' ? getDefaultTranslation() : 'akjv';
    const href = match
      ? `/reader/bible/${encodeURIComponent(translation)}/${encodeURIComponent(match[1])}/${match[2]}${match[3] ? `.${match[3]}` : ''}`
      : `/reader/bible/${encodeURIComponent(translation)}/`;
    return `<a href="${this.escapeAttr(href)}" class="scripture-ref meat-scripture-ref" data-citation="${this.escapeAttr(citation)}" data-ref="${this.escapeAttr(citation)}" onmouseenter="if(typeof showVerseTooltip==='function')showVerseTooltip(this,event)" onmouseleave="if(typeof hideVerseTooltip==='function')hideVerseTooltip()" onclick="if(typeof handleCitationClick==='function'){handleCitationClick(event);return false;}">${this.escapeHtml(display)}</a>`;
  },

  preloadVerseTooltips() {
    if (typeof Bible === 'undefined' || !Bible.loadTranslation) return;
    const translation = typeof getDefaultTranslation === 'function' ? getDefaultTranslation() : 'akjv';
    Bible.loadTranslation(translation).catch(() => {});
  },

  stageButton(stage, label) {
    return `<a href="${this.escapeAttr(this.meatHref({ stage, judge: null }))}" class="meat-stage-tab${this._activeStage === stage ? ' is-active' : ''}"${this._activeStage === stage ? ' aria-current="page"' : ''}>${label}</a>`;
  },

  renderStagePanel(run, entry) {
    const panel = this._container.querySelector('#meat-stage-panel');
    const copy = {
      consensus: ['Blind baseline', 'Only the headword was supplied. These answers establish the recognizable inherited reading before MEAT is revealed.'],
      relationship: ['Relationship ruling', 'The judges compare the book entry with the blinded baseline: match, refinement, divergence, or a genuinely novel proposal.'],
      persuasion: ['Glossary best-explanation test', 'The judges test the exact glossary entry against the strongest rival definition. The chapter supplies evidence; its broader arguments are outside this ruling.'],
    }[this._activeStage];

    panel.innerHTML = `
      <section class="meat-stage-intro"><span>${copy[0]}</span><p>${copy[1]}</p></section>
      <div class="meat-judge-grid">
        ${this.sortedJudges(entry.judges).map(judge => this.judgeCard(judge, entry)).join('')}
      </div>
      <div id="meat-audit-panel" class="meat-audit-panel">
        <div class="meat-audit-empty">Choose a judge above to inspect its exact prompt, reasoning summary, and raw response.</div>
      </div>
    `;
  },

  judgeCard(judge, entry) {
    const verdict = this.stageVerdict(judge, this._activeStage);
    const scope = this._activeStage === 'persuasion' && judge.supportScope ? ` · ${this.scopeLabel(judge.supportScope, entry.protocolVersion)}` : '';
    const hasAudit = Boolean(judge.artifacts?.[this._activeStage]);
    return `
      <article class="meat-judge-card ${this.stageVerdictClass(verdict)}">
        <div class="meat-judge-heading"><strong>${this.escapeHtml(judge.label)}</strong><span>${this.escapeHtml(judge.model)}</span></div>
        <div class="meat-judge-verdict">${this.escapeHtml(this.stageVerdictLabel(verdict, this._activeStage))}${this.escapeHtml(scope)}</div>
        ${this._activeStage === 'consensus' && judge.consensusMeaning ? `<p>${this.escapeHtml(judge.consensusMeaning)}</p>` : ''}
        ${hasAudit
          ? `<a class="meat-review-judge" href="${this.escapeAttr(this.meatHref({ term: entry.anchor, run: this._selected?.runId || null, stage: this._activeStage, judge: judge.id }))}">Inspect prompt & response</a>`
          : '<span class="meat-review-judge is-disabled">No saved response</span>'}
      </article>
    `;
  },

  async openAudit(run, entry, providerId) {
    const judge = entry.judges.find(candidate => candidate.id === providerId);
    const paths = judge?.artifacts?.[this._activeStage];
    const panel = this._container.querySelector('#meat-audit-panel');
    if (!paths || !panel) return;
    const token = ++this._loadToken;
    panel.innerHTML = '<div class="meat-audit-loading">Loading the frozen artifacts…</div>';

    try {
      const [request, response, normalized] = await Promise.all([
        this.fetchArtifact(paths.request),
        this.fetchArtifact(paths.response),
        this.fetchArtifact(paths.normalized),
      ]);
      if (token !== this._loadToken || !this._container?.querySelector('#meat-audit-panel')) return;
      const prompts = this.extractRequestPrompt(request || {});
      panel.innerHTML = `
        <header class="meat-audit-header">
          <div><span>Exact audit trail</span><strong>${this.escapeHtml(judge.label)} · ${this.escapeHtml(judge.model)}</strong></div>
          <span class="meat-verdict-badge ${this.stageVerdictClass(this.stageVerdict(judge, this._activeStage))}">${this.escapeHtml(this.stageVerdictLabel(this.stageVerdict(judge, this._activeStage), this._activeStage))}</span>
        </header>
        ${this.renderNormalizedSummary(normalized || {}, this._activeStage)}
        <details open>
          <summary>Exact user prompt</summary>
          <pre>${this.escapeHtml(prompts.user || 'No user prompt was recovered from this request format.')}</pre>
        </details>
        <details>
          <summary>Exact system instruction</summary>
          <pre>${this.escapeHtml(prompts.system || 'No separate system instruction was recorded.')}</pre>
        </details>
        <details>
          <summary>Normalized ruling</summary>
          <pre>${this.escapeHtml(JSON.stringify(normalized, null, 2))}</pre>
        </details>
        <details>
          <summary>Secret-free API request</summary>
          <pre>${this.escapeHtml(JSON.stringify(request, null, 2))}</pre>
        </details>
        <details>
          <summary>Unmodified provider response</summary>
          <pre>${this.escapeHtml(JSON.stringify(response, null, 2))}</pre>
        </details>
      `;
      panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } catch (error) {
      panel.innerHTML = `<div class="meat-audit-error"><strong>Artifact unavailable</strong><span>${this.escapeHtml(error.message)}</span></div>`;
    }
  },

  async fetchArtifact(url) {
    if (!url) return null;
    if (this._auditCache.has(url)) return this._auditCache.get(url);
    const response = await fetch(url);
    if (!response.ok) throw new Error(`${url.split('/').pop()} returned ${response.status}`);
    const value = await response.json();
    this._auditCache.set(url, value);
    return value;
  },

  extractRequestPrompt(request) {
    const payload = request?.payload || {};
    let system = payload.instructions || payload.system || '';
    let user = payload.input || '';

    if (Array.isArray(payload.messages)) {
      user = payload.messages
        .filter(message => message.role === 'user')
        .map(message => typeof message.content === 'string' ? message.content : JSON.stringify(message.content, null, 2))
        .join('\n\n');
    }
    if (payload.systemInstruction?.parts) {
      system = payload.systemInstruction.parts.map(part => part.text || '').join('\n');
    }
    if (Array.isArray(payload.contents)) {
      user = payload.contents
        .filter(content => content.role === 'user')
        .flatMap(content => content.parts || [])
        .map(part => part.text || '')
        .join('\n\n');
    }
    return { system: typeof system === 'string' ? system : JSON.stringify(system, null, 2), user: typeof user === 'string' ? user : JSON.stringify(user, null, 2) };
  },

  renderNormalizedSummary(data, stage) {
    if (!data || !Object.keys(data).length) return '';
    let rows = [];
    if (stage === 'consensus') {
      rows = [
        ['Primary meaning', data.primary_meaning],
        ['Basis', data.primary_basis],
        ['Other recognized readings', (data.alternatives || []).map(item => `${item.meaning} (${item.prominence})`)],
        ['Notes', data.notes],
      ];
    } else if (stage === 'relationship') {
      rows = [
        ['Consensus core', data.consensus_core_identification || data.consensus_summary],
        ['Book core', data.book_core_identification || data.book_summary],
        ['Why', data.rationale],
        ['Strongest objection', data.strongest_objection],
      ];
    } else {
      rows = [
        ['Glossary core', data.book_core_identification],
        ['Unsupported glossary assertions', data.unsupported_glossary_assertions],
        ['Chapter-only objections', data.chapter_only_objections],
        ['Strongest counter-interpretation', data.strongest_counter_interpretation],
        ['Why this ruling', data.rationale],
        ['Book’s explanatory advantages', data.book_explanatory_advantages],
        ['Counter-reading’s advantages', data.counter_explanatory_advantages],
        ['Unresolved objections', data.unresolved_objections],
      ];
    }
    return `<dl class="meat-ruling-summary">${rows.filter(([, value]) => value && (!Array.isArray(value) || value.length)).map(([label, value]) => `
      <div><dt>${this.escapeHtml(label)}</dt><dd>${this.formatSummaryValue(value)}</dd></div>
    `).join('')}</dl>`;
  },

  formatSummaryValue(value) {
    if (Array.isArray(value)) return `<ul>${value.map(item => `<li>${this.escapeHtml(typeof item === 'string' ? item : JSON.stringify(item))}</li>`).join('')}</ul>`;
    return this.escapeHtml(String(value));
  },

  sourceLinks(run) {
    const links = [];
    const add = (label, url) => { if (url) links.push(`<a href="${this.escapeAttr(url)}" target="_blank" rel="noopener">${this.escapeHtml(label)}</a>`); };
    add('Run manifest', run.paths.manifest);
    add('Glossary input', run.paths.glossary);
    add('Shared method evidence', run.paths.methodEvidence);
    add('Accepted prior findings', run.paths.acceptedFindings);
    add('Human review', run.paths.review);
    Object.entries(run.paths.promptTemplates || {}).forEach(([stage, url]) => add(`${this.titleCase(stage)} prompt template`, url));
    if (run.paths.sources?.length) {
      add(`Chapter source bundle · ${run.paths.sources.length} ${run.paths.sources.length === 1 ? 'file' : 'files'}`, run.paths.sources[0].url);
    }
    return links.join('');
  },

  humanButton(value, label, current) {
    return `<button class="meat-human-choice${current === value ? ' is-selected' : ''}" data-judgment="${value}" aria-pressed="${current === value}">${label}</button>`;
  },

  judgmentKey(runId, anchor) {
    return `meat-tester:judgment:${runId}:${anchor}`;
  },

  getHumanJudgment(runId, anchor) {
    try { return localStorage.getItem(this.judgmentKey(runId, anchor)) || ''; } catch (_error) { return ''; }
  },

  setHumanJudgment(runId, anchor, value) {
    try { localStorage.setItem(this.judgmentKey(runId, anchor), value); } catch (_error) {}
  },

  sortedJudges(judges) {
    return [...judges].sort((a, b) => this.PROVIDER_ORDER.indexOf(a.id) - this.PROVIDER_ORDER.indexOf(b.id));
  },

  firstConsensus(entry) {
    return entry.judges.find(judge => judge.consensusMeaning)?.consensusMeaning || '';
  },

  resultStage(entry) {
    return entry?.relation === 'DIVERGENT' && entry.persuasion !== 'PENDING'
      ? 'persuasion'
      : 'relationship';
  },

  judgeSummary(entry) {
    const stage = this.resultStage(entry);
    return entry.judges.map(judge => `${judge.label}: ${this.stageVerdictLabel(this.stageVerdict(judge, stage), stage)}`).join('; ');
  },

  hasJudgeConflict(entry) {
    const stage = this.resultStage(entry);
    const rulings = entry.judges
      .map(judge => this.stageVerdict(judge, stage))
      .filter(ruling => ruling && ruling !== 'PENDING');
    return new Set(rulings).size > 1;
  },

  judgeDot(judge, entry) {
    const stage = this.resultStage(entry);
    const verdict = this.stageVerdict(judge, stage);
    return `<span class="meat-judge-dot ${this.stageVerdictClass(verdict)}" title="${this.escapeAttr(`${judge.label}: ${this.stageVerdictLabel(verdict, stage)}`)}"><span>${this.escapeHtml(this.providerInitial(judge.id))}</span></span>`;
  },

  providerInitial(provider) {
    return ({ openai: 'GP', anthropic: 'C', gemini: 'Ge', xai: 'Gr' })[provider] || String(provider || '?').slice(0, 2);
  },

  providerIcon(provider, label) {
    return `<img class="meat-model-icon meat-model-icon--${this.escapeAttr(provider)}" src="/assets/img/reviews/${this.escapeAttr(provider === 'xai' ? 'xai' : provider)}.${provider === 'openai' ? 'png' : 'svg'}" alt="${this.escapeAttr(label)}" title="${this.escapeAttr(label)}">`;
  },

  stageVerdict(judge, stage) {
    if (stage === 'consensus') return judge.consensusMeaning ? 'RECORDED' : 'PENDING';
    if (stage === 'relationship') return judge.relationship || 'PENDING';
    return judge.persuasion || 'PENDING';
  },

  verdictLabel(verdict) {
    return ({
      DIVERGENT_PERSUADED: 'Divergent · persuaded',
      DIVERGENT_UNPERSUADED: 'Divergent · unconvinced',
      DIVERGENT_PENDING: 'Divergent · not yet judged',
      DIVERGENT_DISPUTED: 'Divergent · panel disputed',
      MATCH: 'Matches baseline',
      REFINED: 'Refines baseline',
      NOVEL: 'No settled baseline',
      DISPUTED: 'Panel disputed',
      PENDING: 'Pending',
      UNTESTED: 'Not yet tested',
    })[verdict] || this.titleCase(verdict);
  },

  stageVerdictLabel(verdict, stage) {
    if (stage === 'consensus' && verdict === 'RECORDED') return 'Baseline recorded';
    return ({
      PERSUADED: 'Persuaded',
      UNPERSUADED: 'Unpersuaded',
      MATCH: 'Match',
      REFINED: 'Refined',
      DIVERGENT: 'Divergent',
      NOVEL: 'Novel',
      PENDING: 'Not run',
      RECORDED: 'Recorded',
    })[verdict] || this.titleCase(verdict);
  },

  scopeLabel(scope, protocolVersion = 0) {
    if (Number(protocolVersion) < 13) {
      return ({ FULL: 'full', CORE_ONLY: 'core only · legacy scope', NONE: 'unsupported · legacy scope' })[scope] || `${this.titleCase(scope)} · legacy scope`;
    }
    return ({ FULL: 'whole glossary entry', CORE_ONLY: 'glossary core only', NONE: 'glossary unsupported' })[scope] || this.titleCase(scope);
  },

  needsLegacyScopeWarning(run, entry) {
    if (Number(run?.protocolVersion || 0) >= 13) return false;
    const completedJudges = (entry?.judges || []).filter(judge => judge.persuasion && judge.persuasion !== 'PENDING');
    if (!completedJudges.length) return false;
    return completedJudges.some(judge => judge.persuasion !== 'PERSUADED' || judge.supportScope !== 'FULL');
  },

  relationshipIsPartial(entry) {
    const completion = entry?.completion;
    return Boolean(completion?.providers && completion.relationship < completion.providers);
  },

  verdictClass(verdict) {
    return `verdict-${String(verdict || 'pending').toLowerCase().replace(/_/g, '-')}`;
  },

  stageVerdictClass(verdict) {
    return `stage-${String(verdict || 'pending').toLowerCase().replace(/_/g, '-')}`;
  },

  titleCase(value) {
    return String(value || '').toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, letter => letter.toUpperCase());
  },

  displayText(value) {
    return String(value || '')
      .replace(/\[\.[a-z][a-z0-9_-]*\]/gi, '')
      .replace(/\s+/g, ' ')
      .trim();
  },

  escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
  },

  escapeAttr(value) {
    return this.escapeHtml(value);
  },
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = MeatTesterView;
}
