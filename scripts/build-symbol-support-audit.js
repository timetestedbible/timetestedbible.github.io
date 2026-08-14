#!/usr/bin/env node

/**
 * Build an evidence and documentation audit for every approved entry in
 * books/symbolic-language/49-glossary.adoc.
 *
 * The audit deliberately keeps two scores separate:
 *
 *   evidenceSupportScore       How well the definition is supported by its
 *                              cited texts and independent judgments.
 *   researchCompletenessScore  How complete the local standalone study is.
 *
 * A missing web page must not make a sound definition look scripturally weak,
 * and a polished page must not conceal a material countertext. The generated
 * review report therefore sorts by evidence support and exposes documentation
 * gaps in their own column.
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const ROOT = path.resolve(__dirname, '..');
const GLOSSARY_FILE = path.join(ROOT, 'books', 'symbolic-language', '49-glossary.adoc');
const SYMBOLS_DIR = path.join(ROOT, '_symbols');
const RESEARCH_DIR = path.join(ROOT, 'books', 'symbolic-language', 'research');
const EXPERIMENT_FILE = path.join(ROOT, 'data', 'meat-tester-experiment.json');
const JSON_OUTPUT = path.join(ROOT, 'data', 'symbol-support-audit.json');
const MARKDOWN_OUTPUT = path.join(RESEARCH_DIR, 'SYMBOL-SUPPORT-REVIEW.md');

const RESEARCH_MAP = {
  anointing: ['research-anointing.md'],
  belief: ['research-faith.md'],
  bow: ['research-bow.md'],
  bramble: ['research-bramble-thorns.md'],
  butter: ['research-butter.md'],
  cleanliness: ['research-tohar-clearness.md'],
  coin: ['research-coin.md'],
  day: ['research-day-thousand.md'],
  disciple: ['research-disciple.md'],
  divorce: ['research-marriage-divorce.md'],
  east: ['research-directions.md'],
  faith: ['research-faith.md'],
  fish: ['research-sea-verses.md'],
  'fish-2': ['research-jonah-sign-prevalence.md'],
  foreskin: ['research-foreskin.md'],
  gospel: ['research-gospel.md'],
  grace: ['research-grace-mercy-gift.md'],
  grapes: ['research-grapes.md'],
  hate: ['research-hate.md'],
  judgment: ['research-justice-judgment.md'],
  justice: ['research-justice-judgment.md'],
  liberty: ['research-liberty.md'],
  lion: ['research-lion.md'],
  marriage: ['research-marriage-divorce.md'],
  meat: ['research-meat-milk.md'],
  mercy: ['research-grace-mercy-gift.md'],
  milk: ['research-meat-milk.md'],
  moon: ['research-sun-moon-stars.md'],
  net: ['research-net.md'],
  'new-moon': ['research-pearl-fullmoon.md', 'research-sun-moon-stars.md'],
  north: ['research-directions.md'],
  oil: ['research-oil.md', 'research-ten-virgins.md'],
  peace: ['research-peace.md', 'research-peace-taken.md'],
  pearl: ['research-pearl-fullmoon.md'],
  poor: ['research-poor-rich.md'],
  rich: ['research-poor-rich.md'],
  righteousness: ['research-righteousness.md'],
  sabbath: ['research-sabbath.md'],
  seal: ['research-seal.md'],
  sea: ['research-sea-verses.md'],
  shadow: ['research-shadow.md'],
  ship: ['research-ship.md'],
  stars: ['research-sun-moon-stars.md'],
  storm: ['research-jonah-sign-prevalence.md'],
  sun: ['research-sun-moon-stars.md'],
  swine: ['research-swine.md'],
  tail: ['research-tail.md'],
  tower: ['research-tower.md'],
  virgin: ['research-ten-virgins.md', 'research-virgin-manchild.md'],
  wall: ['research-wall.md'],
  west: ['research-directions.md'],
  winepress: ['research-winepress.md'],
  wings: ['research-wings-audit.md'],
  works: ['research-works.md', 'research-dead-works.md'],
  'works-of-law': ['research-works-of-law.md'],
  worship: ['research-worship.md'],
  year: ['research-day-thousand.md']
};

function readJson(file, fallback = null) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (_) {
    return fallback;
  }
}

function parseMarkdown(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) return { frontmatter: {}, body: content };
  return { frontmatter: yaml.load(match[1]) || {}, body: match[2] };
}

function stripAsciiDoc(value) {
  return String(value || '')
    .replace(/\s+verdict:[a-z-]+\[\]/g, '')
    .replace(/sym:sym-[a-z0-9-]+\[([^\]]*)\]/g, '$1')
    .replace(/link:[^\[\s]+\[([^\]]*)\](?:\[\.chnum\]#)?/g, '$1')
    .replace(/\[\.[^\]]+\]#/g, '')
    .replace(/#/g, '')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/\b_([^_]+)_\b/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseGlossary(content) {
  const starts = [...content.matchAll(/^\[\[sym-([a-z0-9-]+)\]\](.+?)::\s*(.*?)\s*\+?\s*$/gm)];
  return starts.map((match, index) => {
    const key = match[1];
    const start = match.index;
    const end = index + 1 < starts.length ? starts[index + 1].index : content.length;
    const block = content.slice(start, end);
    const termRaw = match[2];
    const definitionRaw = match[3];
    const verdict = (termRaw.match(/verdict:([a-z-]+)\[\]/) || [])[1] || 'standard';
    const seeref = [...block.matchAll(/^\[\.seeref\]__([\s\S]*?)__\s*\+?\s*$/gm)]
      .map(item => stripAsciiDoc(item[1]));
    const citationSource = seeref[0] || '';
    const citations = citationSource.match(/^\((.*?)\)/)?.[1] || '';
    const chapterLinks = [...block.matchAll(/link:(\/books\/(symbolic-language|time-tested-tradition)\/([^/]+)\/(?:#[^\[]+)?)\[([^\]]+)\]/g)]
      .map(item => ({ url: item[1], book: item[2], slug: item[3], title: stripAsciiDoc(item[4]) }));
    const commonView = block.match(/^\[\.commonview\]__([\s\S]*?)__\s*\+?\s*$/m)?.[1] || '';
    const opposite = block.match(/^\[\.opposite\]__([\s\S]*?)__\s*\+?\s*$/m)?.[1] || '';
    const symbolLinks = [...block.matchAll(/sym:sym-([a-z0-9-]+)\[([^\]]+)\]/g)]
      .map(item => ({ key: item[1], label: stripAsciiDoc(item[2]) }));
    return {
      key,
      anchor: `sym-${key}`,
      term: stripAsciiDoc(termRaw),
      definition: stripAsciiDoc(definitionRaw),
      definitionRaw,
      verdict,
      citations,
      citationTokens: parseCitationTokens(citations),
      seeref: citationSource,
      commonView: stripAsciiDoc(commonView.replace(/^Commonly (?:taught|treated as):?\s*/i, '')),
      opposite: stripAsciiDoc(opposite.replace(/^Opposite:\s*/i, '')),
      chapterLinks: uniqueBy(chapterLinks, item => `${item.book}:${item.slug}`),
      symbolLinks: uniqueBy(symbolLinks, item => `${item.key}:${item.label.toLowerCase()}`),
      block
    };
  });
}

function parseCitationTokens(citations) {
  if (!citations) return [];
  const cleaned = citations
    .replace(/\b(?:with|compare|and cf\.|cf\.)\b/gi, ';')
    .replace(/\b(?:KJV|NKJV|ASV|WEB)\b/g, '')
    .replace(/\([^)]*\)/g, '');
  const parts = cleaned.split(/\s*;\s*/).filter(Boolean);
  const result = [];
  let lastBook = '';
  for (const part of parts) {
    for (const piece of part.split(/\s*\/\s*/)) {
      const trimmed = piece.trim();
      const match = trimmed.match(/^((?:[1-3]\s*)?[A-Za-z][A-Za-z. ]*?)\s+(\d+):(.*)$/);
      if (match) {
        lastBook = match[1].trim();
        result.push(`${lastBook} ${match[2]}:${match[3].trim()}`);
      } else if (lastBook && /^\d+:/.test(trimmed)) {
        result.push(`${lastBook} ${trimmed}`);
      } else if (trimmed) {
        result.push(trimmed);
      }
    }
  }
  return result;
}

function uniqueBy(items, keyFn) {
  const seen = new Set();
  return items.filter(item => {
    const key = keyFn(item);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function normalizeText(value) {
  return stripAsciiDoc(value)
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function artifactToLocal(url) {
  return url ? path.join(ROOT, url.replace(/^\//, '')) : '';
}

function inspectStudy(entry) {
  const file = path.join(SYMBOLS_DIR, `${entry.key}.md`);
  if (!fs.existsSync(file)) {
    return {
      exists: false,
      path: path.relative(ROOT, file),
      canonical: false,
      definitionMatches: false,
      wordCount: 0,
      headings: [],
      hasDictionaryComparison: false,
      hasDefinitionLayers: false,
      hasBibleLiteralDefinition: false,
      bibleLiteralStatus: 'missing',
      definitionLayersComplete: false,
      hasCorpusMethod: false,
      hasCountertexts: false,
      hasOccurrenceRegister: false,
      hasConclusion: false,
      completenessScore: 0,
      completenessTier: 'missing'
    };
  }

  const { frontmatter, body } = parseMarkdown(fs.readFileSync(file, 'utf8'));
  const words = body.match(/[\p{L}\p{N}][\p{L}\p{N}'’-]*/gu) || [];
  const headings = [...body.matchAll(/^#{2,3}\s+(.+)$/gm)].map(match => match[1].trim());
  const headingText = headings.join(' | ').toLowerCase();
  const canonical = Number(frontmatter.record_version) === 1;
  const declaredDefinition = frontmatter.definition || body.match(/^\*\*(.+?)\*\*\s*$/m)?.[1] || '';
  const definitionMatches = normalizeText(declaredDefinition) === normalizeText(entry.definition);
  const definitions = frontmatter.definitions || {};
  const definitionStatus = frontmatter.definition_meta?.status || frontmatter.definition_status || 'unknown';
  const bibleSymbolic = definitions.bible_symbolic || {};
  const bibleLiteral = definitions.bible_literal || {};
  const webster = definitions.webster || {};
  const hasDefinitionLayers = /definition layers|three definitions/.test(headingText);
  const hasDictionaryComparison = /dictionary|literal structure|definition layers|three definitions/.test(headingText);
  const hasBibleLiteralDefinition = Boolean(bibleLiteral.text) && bibleLiteral.status !== 'needs-research';
  const symbolicLayerComplete = entry.verdict === 'word'
    ? bibleSymbolic.status === 'not-applicable'
    : definitionStatus === 'draft'
      ? bibleSymbolic.status === 'proposed' && Boolean(bibleSymbolic.text)
      : normalizeText(bibleSymbolic.text) === normalizeText(entry.definition);
  const literalLayerComplete = entry.verdict === 'word'
    ? normalizeText(bibleLiteral.text) === normalizeText(entry.definition)
    : hasBibleLiteralDefinition;
  const websterLayerComplete = Boolean(webster.text) || webster.status === 'unavailable';
  const definitionLayersComplete = symbolicLayerComplete && literalLayerComplete && websterLayerComplete;
  const hasCorpusMethod = /corpus|method|hebrew|greek reference/.test(headingText);
  const hasCountertexts = /counter|competing|boundary|limits|tested/.test(headingText);
  const hasOccurrenceRegister = /occurrence|every use|all uses/.test(headingText);
  const hasConclusion = /conclusion/.test(headingText);
  let score = 0;
  score += Math.min(20, Math.round(words.length / 75));
  score += canonical ? 15 : 5;
  score += definitionMatches ? 10 : 0;
  score += symbolicLayerComplete ? 5 : 0;
  score += literalLayerComplete ? 5 : 0;
  score += websterLayerComplete ? 5 : 0;
  score += hasCorpusMethod ? 10 : 0;
  score += hasCountertexts ? 15 : 0;
  score += hasOccurrenceRegister ? 10 : 0;
  score += hasConclusion ? 5 : 0;
  score = Math.min(100, score);
  return {
    exists: true,
    path: path.relative(ROOT, file),
    url: `/research/symbols/${entry.key}/`,
    canonical,
    definitionMatches,
    definitionStatus,
    candidateDefinition: frontmatter.research?.candidate_definition || '',
    wordCount: words.length,
    headings,
    hasDictionaryComparison,
    hasDefinitionLayers,
    hasBibleLiteralDefinition,
    bibleLiteralStatus: bibleLiteral.status || 'missing',
    definitionLayersComplete,
    hasCorpusMethod,
    hasCountertexts,
    hasOccurrenceRegister,
    hasConclusion,
    completenessScore: score,
    completenessTier: !literalLayerComplete
      ? 'incomplete—literal sense'
      : score >= 85 ? 'complete' : score >= 60 ? 'substantial' : score >= 35 ? 'partial' : 'stub'
  };
}

function notebookFiles(entry) {
  const names = new Set(RESEARCH_MAP[entry.key] || []);
  const exact = `research-${entry.key}.md`;
  if (fs.existsSync(path.join(RESEARCH_DIR, exact))) names.add(exact);
  return [...names]
    .filter(name => fs.existsSync(path.join(RESEARCH_DIR, name)))
    .map(name => path.join('books', 'symbolic-language', 'research', name));
}

function loadExperimentArtifacts(experimentEntry) {
  if (!experimentEntry) return { judges: [], objections: [], contradictions: [], decisiveSources: [], unresolvedObjections: [], bookSummaries: [], rationales: [] };
  const judges = [];
  const objections = [];
  const contradictions = [];
  const decisiveSources = [];
  const unresolvedObjections = [];
  const bookSummaries = [];
  const rationales = [];
  for (const judge of experimentEntry.judges || []) {
    const relationPath = artifactToLocal(judge.artifacts?.relationship?.normalized);
    const persuasionPath = artifactToLocal(judge.artifacts?.persuasion?.normalized);
    const relationship = relationPath ? readJson(relationPath, {}) : {};
    const persuasion = persuasionPath ? readJson(persuasionPath, {}) : {};
    const strongestObjection = relationship.strongest_objection || '';
    const materialContradiction = relationship.material_contradiction || persuasion.material_core_denial || '';
    if (relationship.book_summary) bookSummaries.push(relationship.book_summary);
    if (relationship.rationale) rationales.push(relationship.rationale);
    if (strongestObjection) objections.push({ judge: judge.label, text: strongestObjection });
    if (materialContradiction && !/^there is no\b|^none\b|^no material\b/i.test(materialContradiction)) {
      contradictions.push({ judge: judge.label, text: materialContradiction });
    }
    for (const item of persuasion.decisive_sources || []) decisiveSources.push(item);
    for (const item of persuasion.unresolved_objections || []) {
      unresolvedObjections.push({ judge: judge.label, text: item });
    }
    judges.push({
      id: judge.id,
      label: judge.label,
      model: judge.model,
      relationship: judge.relationship,
      citationSupport: judge.citationSupport,
      persuasion: judge.persuasion,
      supportScope: judge.supportScope,
      consensusMeaning: judge.consensusMeaning,
      strongestObjection,
      materialContradiction,
      unresolvedObjections: persuasion.unresolved_objections || [],
      decisiveSources: persuasion.decisive_sources || []
    });
  }
  return {
    judges,
    objections: uniqueBy(objections, item => normalizeText(item.text)),
    contradictions: uniqueBy(contradictions, item => normalizeText(item.text)),
    decisiveSources: [...new Set(decisiveSources)],
    unresolvedObjections: uniqueBy(unresolvedObjections, item => normalizeText(item.text)),
    bookSummaries: [...new Set(bookSummaries)],
    rationales: [...new Set(rationales)]
  };
}

function average(values, fallback = 0) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : fallback;
}

function scoreEvidence(entry, experimentEntry, artifacts, notebooks) {
  const citationValues = { STRONG: 40, PARTIAL: 26, INSUFFICIENT: 8, PENDING: 18, '': 18 };
  const relationValues = { MATCH: 30, REFINED: 25, NOVEL: 18, DIVERGENT: 16, PENDING: 15, '': 15 };
  const persuasionValues = { PERSUADED: 20, UNPERSUADED: 2, PENDING: 10, NOT_APPLICABLE: 20, '': 10 };
  // A revised glossary definition invalidates earlier relationship and
  // persuasion scores. Preserve those artifacts for provenance, but do not
  // score the replacement with judgments aimed at its predecessor.
  const judges = experimentEntry?.revisionPending ? [] : artifacts.judges;

  const citationSupport = average(judges.map(judge => citationValues[judge.citationSupport] ?? 18), 18);
  let independentAgreement = average(judges.map(judge => relationValues[judge.relationship] ?? 15), 15);
  const comparativeResolution = average(judges.map(judge => {
    if (judge.relationship !== 'DIVERGENT') return 20;
    let value = persuasionValues[judge.persuasion] ?? 10;
    if (judge.persuasion === 'PERSUADED' && judge.supportScope === 'CORE_ONLY') value = 16;
    return value;
  }), judges.length ? 0 : 10);

  if (experimentEntry?.finalVerdict === 'DIVERGENT_PERSUADED') independentAgreement += 3;
  if (experimentEntry?.finalVerdict === 'DIVERGENT_UNPERSUADED') independentAgreement -= 5;
  independentAgreement = Math.max(0, Math.min(30, independentAgreement));

  const citationCount = entry.citationTokens.length;
  const sourceBreadth = Math.min(10,
    (citationCount >= 8 ? 5 : citationCount >= 4 ? 4 : citationCount >= 2 ? 3 : citationCount ? 2 : 0) +
    (entry.chapterLinks.length ? 3 : 0) +
    (notebooks.length ? 2 : 0));

  let penalty = 0;
  penalty += judges.filter(judge => judge.persuasion === 'UNPERSUADED').length * 8;
  penalty += judges.filter(judge => judge.citationSupport === 'INSUFFICIENT').length * 4;
  if (experimentEntry?.finalVerdict === 'DISPUTED') penalty += 8;
  if (experimentEntry?.finalVerdict === 'PENDING') penalty += 6;
  if (experimentEntry?.finalVerdict === 'DIVERGENT_PENDING') penalty += 5;
  if (experimentEntry?.revisionPending) penalty += 4;
  penalty = Math.min(25, penalty);

  const raw = citationSupport + independentAgreement + comparativeResolution + sourceBreadth - penalty;
  const score = Math.max(0, Math.min(100, Math.round(raw)));
  const tier = !experimentEntry
    ? 'provisional—untested'
    : experimentEntry.revisionPending ? 'provisional—revision not retested'
    : score >= 85 ? 'very strong'
    : score >= 70 ? 'supported'
    : score >= 50 ? 'needs boundary review'
    : 'needs focused review';
  return {
    score,
    tier,
    components: {
      citationSupport: Math.round(citationSupport),
      independentAgreement: Math.round(independentAgreement),
      comparativeResolution: Math.round(comparativeResolution),
      sourceBreadth,
      contradictionPenalty: penalty
    }
  };
}

function riskReasons(entry, experimentEntry, artifacts, study) {
  const reasons = [];
  const unpersuaded = artifacts.judges.filter(judge => judge.persuasion === 'UNPERSUADED');
  const insufficient = artifacts.judges.filter(judge => judge.citationSupport === 'INSUFFICIENT');
  if (experimentEntry?.revisionPending) {
    reasons.push('current glossary revision has not been retested; prior objections are historical');
  } else {
    if (unpersuaded.length) reasons.push(`${unpersuaded.length} judge${unpersuaded.length === 1 ? '' : 's'} unpersuaded`);
    if (insufficient.length) reasons.push(`${insufficient.length} judge${insufficient.length === 1 ? '' : 's'} found citation support insufficient`);
  }
  if (!experimentEntry) reasons.push('no current independent judgment');
  if (!study.exists) reasons.push('standalone study missing');
  else if (study.completenessScore < 60) reasons.push('standalone study is incomplete');
  if (study.definitionStatus === 'draft') reasons.push('current glossary wording is an unapproved draft');
  if (study.exists && !study.hasBibleLiteralDefinition && entry.verdict !== 'word') {
    reasons.push('Bible literal definition still needs a separate evidence statement');
  }
  if (artifacts.unresolvedObjections.length) reasons.push(`${artifacts.unresolvedObjections.length} unresolved objection${artifacts.unresolvedObjections.length === 1 ? '' : 's'}`);
  if (!reasons.length && artifacts.objections.length) reasons.push('bounded objections recorded');
  return reasons;
}

function markdownCell(value) {
  return String(value ?? '').replace(/\|/g, '\\|').replace(/\s+/g, ' ').trim();
}

function buildMarkdown(records, generatedAt) {
  const localParts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Chicago', year: 'numeric', month: '2-digit', day: '2-digit'
  }).formatToParts(new Date(generatedAt));
  const localDate = Object.fromEntries(localParts.map(part => [part.type, part.value]));
  const displayDate = `${localDate.year}-${localDate.month}-${localDate.day}`;
  const strongestFirst = [...records].sort((a, b) =>
    b.evidence.score - a.evidence.score || b.research.completenessScore - a.research.completenessScore || a.term.localeCompare(b.term));
  const weakestFirst = [...records].sort((a, b) =>
    a.evidence.score - b.evidence.score || a.research.completenessScore - b.research.completenessScore || a.term.localeCompare(b.term));
  const missing = records.filter(record => !record.research.exists);
  const untested = records.filter(record => !record.experiment);
  const contradicted = records.filter(record =>
    !record.experiment?.revisionPending &&
    record.judges.some(judge => judge.persuasion === 'UNPERSUADED' || judge.citationSupport === 'INSUFFICIENT'));
  const currentChallenges = weakestFirst.filter(record =>
    record.experiment && !record.experiment.revisionPending && record.objections.length && record.evidence.score < 75).slice(0, 25);
  const needsTesting = weakestFirst.filter(record =>
    !record.experiment || record.experiment.revisionPending || record.research.definitionStatus === 'draft');
  const needsLiteralDefinition = weakestFirst.filter(record =>
    record.recordType === 'symbol' && !record.research.hasBibleLiteralDefinition);

  const lines = [
    '# Symbol Support Review',
    '',
    `Generated ${displayDate} from the approved glossary, the frozen MEAT Tester judgments, local research notebooks, book chapter links, and \`_symbols/\` studies.`,
    '',
    '## How to Read the Ranking',
    '',
    'The **evidence score** ranks definitions from best supported to least supported. It combines citation support (40 points), independent agreement (30), comparative persuasion when a reading diverges (20), and source breadth (10), then subtracts explicit insufficient-support, unpersuaded-judge, disputed, pending, and stale-revision penalties. It does **not** claim to measure truth.',
    '',
    'The **research score** separately measures whether the standalone website study records every applicable definition layer, corpus and method, countertexts, occurrence register, and conclusion. Symbols normally require Bible-literal, Bible-symbolic, and Webster layers; recovered Words do not receive an invented symbolic meaning. A missing page cannot make a sound definition weak; a polished page cannot make a weak definition sound.',
    '',
    `Inventory: **${records.length} glossary entries**, **${missing.length} missing same-key studies**, **${needsLiteralDefinition.length} Symbols still needing a separately evidenced Bible-literal definition**, **${untested.length} not represented in a current independent run**, and **${contradicted.length} with at least 1 insufficient-support or unpersuaded judgment**.`,
    '',
    '## Review First — Current Contradictions and Boundary Challenges',
    '',
    'This queue excludes stale judgments against definitions that have since changed. The apparent objection column records the strongest currently preserved challenge; it is not an endorsement of the objection.',
    '',
    '| Rank | Definition | Evidence | Research | Current apparent objection |',
    '|---:|---|---:|---:|---|'
  ];
  currentChallenges.forEach((record, index) => {
    const objection = record.research.definitionStatus === 'draft'
      ? 'The glossary wording is an unapproved draft. Preserved judge objections address that older wording, not the proposed replacement, which still needs review and a fresh judgment.'
      : record.objections[0]?.text || record.riskReasons.join('; ') || 'No material countertext recorded.';
    lines.push(`| ${index + 1} | [${markdownCell(record.term)}](/research/symbols/${record.key}/) | ${record.evidence.score} — ${record.evidence.tier} | ${record.research.completenessScore} — ${record.research.completenessTier} | ${markdownCell(objection)} |`);
  });

  lines.push('', '## Needs a First Test or Retest', '',
    'These entries rank provisionally because no current independent judgment applies to the approved definition. Old objections to a superseded definition are not treated as objections to its replacement.', '',
    '| Definition | Status | Evidence | Next action |',
    '|---|---|---:|---|');
  needsTesting.forEach(record => {
    const status = record.research.definitionStatus === 'draft'
      ? 'Glossary wording is still a draft'
      : !record.experiment ? 'Untested' : 'Revised since last judgment';
    const action = record.research.definitionStatus === 'draft'
      ? 'Approve a definition, update the glossary, then run a fresh relationship judgment.'
      : !record.experiment ? 'Run blind definition and relationship phases.' : 'Rerun relationship; run persuasion only if still divergent.';
    lines.push(`| [${markdownCell(record.term)}](/research/symbols/${record.key}/) | ${status} | ${record.evidence.score} — ${record.evidence.tier} | ${action} |`);
  });

  lines.push('', '## Bible-Literal Definition Research Queue', '',
    'These Symbols already have an approved symbolic definition and an independent Webster comparison, but their ordinary biblical sense has not yet been stated separately from literal passages. The queue is ordered from weakest current symbolic support upward so the same review can test both the physical image and the proposed transfer. Words are excluded because their approved glossary entry is already their Bible-literal/lexical definition.', '',
    '| Definition | Evidence | Literal layer |',
    '|---|---:|---|');
  needsLiteralDefinition.slice(0, 40).forEach(record => {
    lines.push(`| [${markdownCell(record.term)}](/research/symbols/${record.key}/) | ${record.evidence.score} — ${record.evidence.tier} | ${markdownCell(record.research.bibleLiteralStatus)} |`);
  });
  if (needsLiteralDefinition.length > 40) {
    lines.push('', `The table shows the first 40 of ${needsLiteralDefinition.length}; the machine-readable audit contains the complete queue.`);
  }

  lines.push('', '## Full Ranking — Best Support to Least Support', '',
    '| Rank | Definition | Evidence | Verdict | Citations | Research | Review flag |',
    '|---:|---|---:|---|---:|---:|---|');
  strongestFirst.forEach((record, index) => {
    const verdict = record.research.definitionStatus === 'draft'
      ? 'DRAFT—REVIEW NEEDED'
      : record.experiment?.revisionPending ? 'RETEST NEEDED' : record.experiment?.finalVerdict || 'UNTESTED';
    lines.push(`| ${index + 1} | ${markdownCell(record.term)} | ${record.evidence.score} — ${record.evidence.tier} | ${markdownCell(verdict)} | ${record.citationTokens.length} | ${record.research.completenessScore} — ${record.research.completenessTier} | ${markdownCell(record.riskReasons.join('; ') || '—')} |`);
  });

  lines.push('', '## Detailed Review Queue', '');
  weakestFirst.slice(0, 40).forEach(record => {
    const definitionLabel = record.research.definitionStatus === 'draft' ? 'Current glossary draft' : 'Approved definition';
    lines.push(`### ${record.term}`, '',
      `- **${definitionLabel}:** ${record.definition}`,
      `- **Evidence:** ${record.evidence.score}/100 (${record.evidence.tier}); citation ${record.evidence.components.citationSupport}/40, agreement ${record.evidence.components.independentAgreement}/30, comparative resolution ${record.evidence.components.comparativeResolution}/20, breadth ${record.evidence.components.sourceBreadth}/10, penalty ${record.evidence.components.contradictionPenalty}.`,
      `- **Research:** ${record.research.completenessScore}/100 (${record.research.completenessTier}); ${record.research.exists ? record.research.path : 'same-key standalone study is missing'}.`,
      `- **Cited witnesses:** ${record.citations || 'None recorded in the glossary.'}`);
    if (record.research.definitionStatus === 'draft' && record.research.candidateDefinition) {
      lines.push(`- **Working candidate:** ${record.research.candidateDefinition}`);
    }
    if (record.objections.length && !record.experiment?.revisionPending) {
      lines.push('- **Strongest current objections:**');
      record.objections.slice(0, 4).forEach(item => lines.push(`  - ${item.judge}: ${item.text}`));
    } else if (record.experiment?.revisionPending) {
      lines.push('- **Judgment status:** The current definition supersedes the preserved judgment. Its objections are historical and require a retest before reuse.');
    }
    if (record.unresolvedObjections.length && !record.experiment?.revisionPending) {
      lines.push('- **Unresolved after persuasion:**');
      record.unresolvedObjections.slice(0, 4).forEach(item => lines.push(`  - ${item.judge}: ${item.text}`));
    }
    if (record.researchNotebooks.length) {
      lines.push(`- **Research notebooks:** ${record.researchNotebooks.join(', ')}`);
    }
    lines.push('');
  });

  lines.push('## Machine-readable Data', '',
    'The complete per-judge findings, score components, source paths, objections, and completeness checks are in [`data/symbol-support-audit.json`](/data/symbol-support-audit.json).', '');
  return `${lines.join('\n')}\n`;
}

function main() {
  const glossary = parseGlossary(fs.readFileSync(GLOSSARY_FILE, 'utf8'));
  const experiment = readJson(EXPERIMENT_FILE, { currentEntries: [] });
  const experimentByKey = new Map((experiment.currentEntries || []).map(entry => [entry.anchor, entry]));
  const generatedAt = new Date().toISOString();

  const records = glossary.map(entry => {
    const experimentEntry = experimentByKey.get(entry.key) || null;
    const artifacts = loadExperimentArtifacts(experimentEntry);
    const researchNotebooks = notebookFiles(entry);
    const study = inspectStudy(entry);
    const evidence = scoreEvidence(entry, experimentEntry, artifacts, researchNotebooks);
    return {
      key: entry.key,
      anchor: entry.anchor,
      term: entry.term,
      recordType: entry.verdict === 'word' ? 'word' : 'symbol',
      glossaryVerdict: entry.verdict,
      definition: entry.definition,
      commonView: entry.commonView,
      opposite: entry.opposite,
      citations: entry.citations,
      citationTokens: entry.citationTokens,
      chapterLinks: entry.chapterLinks,
      symbolLinks: entry.symbolLinks,
      researchNotebooks,
      research: study,
      experiment: experimentEntry ? {
        runId: experimentEntry.runId,
        relation: experimentEntry.relation,
        citationSupport: experimentEntry.citationSupport,
        persuasion: experimentEntry.persuasion,
        finalVerdict: experimentEntry.finalVerdict,
        revisionPending: experimentEntry.revisionPending
      } : null,
      judges: artifacts.judges,
      objections: artifacts.objections,
      contradictions: artifacts.contradictions,
      unresolvedObjections: artifacts.unresolvedObjections,
      decisiveSources: artifacts.decisiveSources,
      bookSummaries: artifacts.bookSummaries,
      judgmentRationales: artifacts.rationales,
      evidence,
      riskReasons: riskReasons(entry, experimentEntry, artifacts, study)
    };
  });

  const output = {
    schemaVersion: 2,
    generatedAt,
    methodology: {
      evidenceSupportScore: {
        citationSupport: 40,
        independentAgreement: 30,
        comparativeResolution: 20,
        sourceBreadth: 10,
        penalties: '8 per unpersuaded judge; 4 per insufficient-citation judgment; 8 for disputed classification; 6 for pending classification; 5 for pending divergent persuasion; 4 for an untested glossary revision; maximum 25'
      },
      researchCompletenessScore: {
        proseDepth: 20,
        canonicalRecord: 15,
        approvedDefinitionMatch: 10,
        applicableDefinitionLayers: 15,
        corpusAndMethod: 10,
        countertexts: 15,
        occurrenceRegister: 10,
        conclusion: 5,
        maximum: 100
      },
      caution: 'Scores prioritize review and do not measure truth.'
    },
    stats: {
      glossaryEntries: records.length,
      exactStudies: records.filter(record => record.research.exists).length,
      missingStudies: records.filter(record => !record.research.exists).length,
      canonicalStudies: records.filter(record => record.research.canonical).length,
      untestedEntries: records.filter(record => !record.experiment).length,
      entriesWithUnpersuadedJudge: records.filter(record => !record.experiment?.revisionPending && record.judges.some(judge => judge.persuasion === 'UNPERSUADED')).length,
      entriesWithInsufficientCitationJudge: records.filter(record => !record.experiment?.revisionPending && record.judges.some(judge => judge.citationSupport === 'INSUFFICIENT')).length,
      revisedEntriesAwaitingRetest: records.filter(record => record.experiment?.revisionPending).length,
      symbolsNeedingBibleLiteralDefinition: records.filter(record => record.recordType === 'symbol' && !record.research.hasBibleLiteralDefinition).length
    },
    strongestToWeakest: [...records]
      .sort((a, b) => b.evidence.score - a.evidence.score || b.research.completenessScore - a.research.completenessScore || a.term.localeCompare(b.term))
      .map(record => record.key),
    weakestToStrongest: [...records]
      .sort((a, b) => a.evidence.score - b.evidence.score || a.research.completenessScore - b.research.completenessScore || a.term.localeCompare(b.term))
      .map(record => record.key),
    records
  };

  fs.writeFileSync(JSON_OUTPUT, `${JSON.stringify(output, null, 2)}\n`);
  fs.writeFileSync(MARKDOWN_OUTPUT, buildMarkdown(records, generatedAt));
  console.log(`Audited ${records.length} glossary entries.`);
  console.log(`Exact standalone studies: ${output.stats.exactStudies}`);
  console.log(`Missing same-key studies: ${output.stats.missingStudies}`);
  console.log(`Wrote ${path.relative(ROOT, JSON_OUTPUT)}`);
  console.log(`Wrote ${path.relative(ROOT, MARKDOWN_OUTPUT)}`);
}

main();
