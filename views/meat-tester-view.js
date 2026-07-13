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
  _selected: null,
  _activeStage: 'persuasion',
  _auditCache: new Map(),
  _loadToken: 0,

  PROVIDER_ORDER: ['openai', 'anthropic', 'gemini', 'xai'],

  render(_state, _derived, container) {
    this._container = container;
    if (container.querySelector('.meat-tester-view')) return;

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
            blinded to the book. Then MEAT presents its definition, citations, method,
            and full argument. Finally the same independent models must formulate the
            strongest competing explanation and decide which reading accounts for the
            supplied evidence better.
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
            <div><strong>Test the argument</strong><p>The proving chapter faces the strongest specific rival in a best-explanation comparison.</p></div>
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
            <article><strong>Same evidence standard</strong><p>Judges receive frozen excerpts from the book, not an experimenter's paraphrase of its case.</p></article>
            <article><strong>Strongest rival required</strong><p>“Unpersuaded” must identify a contradictory interpretation that explains the same evidence better.</p></article>
            <article><strong>Dependencies stay personal</strong><p>A model inherits only conclusions that the same provider and model accepted in a prior frozen run.</p></article>
            <article><strong>Strict majority</strong><p>Every provider gets one vote. A 2–2 split is disputed; no tie is silently broken.</p></article>
            <article><strong>Complete audit trail</strong><p>Model IDs, source snapshots, prompts, requests, raw responses, and normalized rulings are saved.</p></article>
          </div>
        </section>

        <section class="meat-results" id="meat-results" aria-labelledby="meat-results-title">
          <div class="meat-section-heading meat-results-heading">
            <div><span>The rulings</span><h2 id="meat-results-title">Review the experiment yourself</h2></div>
            <p>Start with the panel's conclusion, then open the evidence trail that produced it.</p>
          </div>
          <div id="meat-dashboard-loading" class="meat-dashboard-loading" role="status">Loading the frozen experiment archive…</div>
          <div id="meat-dashboard" hidden>
            <div id="meat-stats" class="meat-stats"></div>
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
                  <option value="DIVERGENT_PERSUADED">Divergent · persuaded</option>
                  <option value="DIVERGENT_UNPERSUADED">Divergent · unconvinced</option>
                  <option value="DIVERGENT_PENDING">Divergent · not yet judged</option>
                  <option value="REFINED">Refines the baseline</option>
                  <option value="MATCH">Matches the baseline</option>
                  <option value="NOVEL">No settled baseline</option>
                  <option value="DISPUTED">Disputed</option>
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
    this._container = null;
  },

  async loadData() {
    const token = ++this._loadToken;
    try {
      if (!this._data) {
        const response = await fetch(this.DATA_URL);
        if (!response.ok) throw new Error(`Experiment index returned ${response.status}`);
        this._data = await response.json();
      }
      if (token !== this._loadToken || !this._container) return;
      this.bindDashboard();
      this.renderDashboard();
      const featured = this._data.currentEntries.find(entry => entry.anchor === 'ship') || this._data.currentEntries[0];
      if (featured) this.selectEntry(featured.runId, featured.anchor, false);
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
      this._mode = event.target.value;
      this._selected = null;
      this.renderDashboard();
      this._container.querySelector('#meat-detail').innerHTML = '<div class="meat-detail-empty">Choose a conclusion to inspect its evidence trail.</div>';
    });
    this._container.querySelector('#meat-verdict-filter').addEventListener('change', event => {
      this._verdict = event.target.value;
      this.renderResultList();
    });
    this._container.querySelector('#meat-search').addEventListener('input', event => {
      this._query = event.target.value.trim().toLowerCase();
      this.renderResultList();
    });
  },

  renderDashboard() {
    const stats = this._data.stats;
    const persuaded = stats.verdicts.DIVERGENT_PERSUADED || 0;
    this._container.querySelector('#meat-stats').innerHTML = `
      <article><span>Current conclusions</span><strong>${stats.currentConclusions}</strong></article>
      <article><span>Divergent cases persuaded</span><strong>${persuaded}</strong></article>
      <article><span>Model families represented</span><strong>${stats.providerModels}</strong></article>
      <article><span>Frozen runs available</span><strong>${stats.archivedRuns}</strong></article>
    `;
    this.renderResultList();
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
    return this.entriesForMode().filter(entry => {
      if (this._verdict !== 'ALL' && entry.finalVerdict !== this._verdict) return false;
      if (!this._query) return true;
      return [entry.term, entry.definition, entry.commonView, entry.runId]
        .some(value => String(value || '').toLowerCase().includes(this._query));
    });
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
        <button class="meat-result-card ${this.verdictClass(entry.finalVerdict)}${selected ? ' is-selected' : ''}"
                data-run="${this.escapeAttr(entry.runId)}" data-anchor="${this.escapeAttr(entry.anchor)}"
                aria-pressed="${selected}">
          <span class="meat-result-card-top">
            <span class="meat-verdict-badge">${this.escapeHtml(this.verdictLabel(entry.finalVerdict))}</span>
            ${development ? '<span class="meat-development-badge">Development protocol</span>' : ''}
          </span>
          <strong>${this.escapeHtml(entry.term)}</strong>
          <span class="meat-result-definition">${this.escapeHtml(entry.definition || 'No definition recorded.')}</span>
          <span class="meat-judge-dots" aria-label="${this.escapeAttr(this.judgeSummary(entry))}">
            ${entry.judges.map(judge => this.judgeDot(judge, entry)).join('')}
          </span>
          ${this._mode === 'history' ? `<span class="meat-run-label">${this.escapeHtml(entry.runId)} · protocol ${entry.protocolVersion || 'development'}</span>` : ''}
        </button>
      `;
    }).join('');

    list.querySelectorAll('.meat-result-card').forEach(button => {
      button.addEventListener('click', () => this.selectEntry(button.dataset.run, button.dataset.anchor));
    });
  },

  selectEntry(runId, anchor, scroll = true) {
    const run = this._data.runs.find(candidate => candidate.id === runId);
    const entry = run?.entries.find(candidate => candidate.anchor === anchor);
    if (!run || !entry) return;
    this._loadToken += 1;
    this._selected = { runId, anchor };
    this._activeStage = entry.persuasion !== 'PENDING' ? 'persuasion' : 'relationship';
    this.renderResultList();
    this.renderDetail(run, entry);
    if (scroll && window.innerWidth < 980) {
      this._container.querySelector('#meat-detail').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  },

  renderDetail(run, entry) {
    const detail = this._container.querySelector('#meat-detail');
    const history = this._data.runs
      .filter(candidate => candidate.entries.some(item => item.anchor === entry.anchor))
      .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    const judgment = this.getHumanJudgment(run.id, entry.anchor);

    detail.innerHTML = `
      <article class="meat-detail-shell">
        <header class="meat-detail-header">
          <div>
            <span class="meat-verdict-badge ${this.verdictClass(entry.finalVerdict)}">${this.escapeHtml(this.verdictLabel(entry.finalVerdict))}</span>
            <h3>${this.escapeHtml(entry.term)}</h3>
          </div>
          <label class="meat-run-select-label">
            <span>Frozen run</span>
            <select id="meat-run-select">
              ${history.map(candidate => `<option value="${this.escapeAttr(candidate.id)}"${candidate.id === run.id ? ' selected' : ''}>${this.escapeHtml(candidate.id)}${candidate.reportable ? '' : ' · development'}</option>`).join('')}
            </select>
          </label>
        </header>

        <div class="meat-comparison">
          <section><span>Recognizable common reading</span><p>${this.escapeHtml(entry.commonView || this.firstConsensus(entry) || 'No consensus summary recorded.')}</p></section>
          <div class="meat-versus" aria-hidden="true">vs.</div>
          <section><span>MEAT's conclusion</span><p>${this.escapeHtml(entry.definition || 'No book definition recorded.')}</p></section>
        </div>
        ${entry.citations ? `<div class="meat-citations"><strong>Cited evidence</strong><span>${this.escapeHtml(entry.citations)}</span></div>` : ''}

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
      </article>
    `;

    detail.querySelector('#meat-run-select').addEventListener('change', event => this.selectEntry(event.target.value, entry.anchor, false));
    detail.querySelectorAll('.meat-stage-tab').forEach(button => {
      button.addEventListener('click', () => {
        this._activeStage = button.dataset.stage;
        this.renderDetail(run, entry);
      });
    });
    detail.querySelectorAll('.meat-human-choice').forEach(button => {
      button.addEventListener('click', () => {
        this.setHumanJudgment(run.id, entry.anchor, button.dataset.judgment);
        this.renderDetail(run, entry);
      });
    });
    this.renderStagePanel(run, entry);
  },

  stageButton(stage, label) {
    return `<button class="meat-stage-tab${this._activeStage === stage ? ' is-active' : ''}" data-stage="${stage}" aria-pressed="${this._activeStage === stage}">${label}</button>`;
  },

  renderStagePanel(run, entry) {
    const panel = this._container.querySelector('#meat-stage-panel');
    const copy = {
      consensus: ['Blind baseline', 'Only the headword was supplied. These answers establish the recognizable inherited reading before MEAT is revealed.'],
      relationship: ['Relationship ruling', 'The judges compare the book entry with the blinded baseline: match, refinement, divergence, or a genuinely novel proposal.'],
      persuasion: ['Best-explanation test', 'The judges receive the book’s method and proving material, formulate the strongest rival reading, and decide which explanation handles the evidence better.'],
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
    panel.querySelectorAll('.meat-review-judge').forEach(button => {
      button.addEventListener('click', () => this.openAudit(run, entry, button.dataset.provider));
    });
  },

  judgeCard(judge, entry) {
    const verdict = this.stageVerdict(judge, this._activeStage);
    const scope = this._activeStage === 'persuasion' && judge.supportScope ? ` · ${this.scopeLabel(judge.supportScope)}` : '';
    const hasAudit = Boolean(judge.artifacts?.[this._activeStage]);
    return `
      <article class="meat-judge-card ${this.stageVerdictClass(verdict)}">
        <div class="meat-judge-heading"><strong>${this.escapeHtml(judge.label)}</strong><span>${this.escapeHtml(judge.model)}</span></div>
        <div class="meat-judge-verdict">${this.escapeHtml(this.stageVerdictLabel(verdict, this._activeStage))}${this.escapeHtml(scope)}</div>
        ${this._activeStage === 'consensus' && judge.consensusMeaning ? `<p>${this.escapeHtml(judge.consensusMeaning)}</p>` : ''}
        <button class="meat-review-judge" data-provider="${this.escapeAttr(judge.id)}"${hasAudit ? '' : ' disabled'}>
          ${hasAudit ? 'Inspect prompt & response' : 'No saved response'}
        </button>
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
        ['Book core', data.book_core_identification],
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

  judgeSummary(entry) {
    return entry.judges.map(judge => `${judge.label}: ${this.stageVerdictLabel(this.stageVerdict(judge, entry.persuasion !== 'PENDING' ? 'persuasion' : 'relationship'), entry.persuasion !== 'PENDING' ? 'persuasion' : 'relationship')}`).join('; ');
  },

  judgeDot(judge, entry) {
    const stage = entry.persuasion !== 'PENDING' ? 'persuasion' : 'relationship';
    const verdict = this.stageVerdict(judge, stage);
    return `<span class="meat-judge-dot ${this.stageVerdictClass(verdict)}" title="${this.escapeAttr(`${judge.label}: ${this.stageVerdictLabel(verdict, stage)}`)}"><span>${this.escapeHtml(this.providerInitial(judge.id))}</span></span>`;
  },

  providerInitial(provider) {
    return ({ openai: 'GP', anthropic: 'C', gemini: 'Ge', xai: 'Gr' })[provider] || String(provider || '?').slice(0, 2);
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

  scopeLabel(scope) {
    return ({ FULL: 'full argument', CORE_ONLY: 'core only', NONE: 'no support' })[scope] || this.titleCase(scope);
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
