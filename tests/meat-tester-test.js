const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const MeatTesterView = require('../views/meat-tester-view.js');
const index = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'meat-tester-experiment.json'), 'utf8'));

assert.strictEqual(MeatTesterView.verdictLabel('DIVERGENT_PERSUADED'), 'Divergent · persuaded');
assert.strictEqual(MeatTesterView.verdictClass('DIVERGENT_PERSUADED'), 'verdict-divergent-persuaded');
assert.strictEqual(MeatTesterView.escapeHtml('<script>'), '&lt;script&gt;');
assert.strictEqual(
  MeatTesterView.displayText('A definition.\n[.opposite]Opposite: Error.'),
  'A definition. Opposite: Error.'
);
assert.strictEqual(MeatTesterView.termSortKey('The Lamb'), 'lamb');
assert.strictEqual(
  MeatTesterView.normalizeRouteParams({ ruling: 'DIVERGENT_DISPUTED' }).ruling,
  'DIVERGENT_DISPUTED'
);
assert(MeatTesterView.CLOUD_CATEGORIES.some(([verdict]) => verdict === 'DIVERGENT_DISPUTED'));
const cloudRoute = MeatTesterView.normalizeRouteParams({ cloud: 'UNTESTED,BOGUS,REFINED,UNTESTED' });
assert.strictEqual(cloudRoute.cloud, 'REFINED,UNTESTED');
MeatTesterView._routeParams = cloudRoute;
assert.strictEqual(MeatTesterView.cloudToggleHref('UNTESTED'), '/meat-tester?cloud=REFINED');

assert.deepStrictEqual(
  MeatTesterView.extractRequestPrompt({ payload: { instructions: 'system', input: 'user' } }),
  { system: 'system', user: 'user' }
);
assert.deepStrictEqual(
  MeatTesterView.extractRequestPrompt({ payload: { system: 'system', messages: [{ role: 'user', content: 'user' }] } }),
  { system: 'system', user: 'user' }
);
assert.deepStrictEqual(
  MeatTesterView.extractRequestPrompt({ payload: {
    systemInstruction: { parts: [{ text: 'system' }] },
    contents: [{ role: 'user', parts: [{ text: 'user' }] }],
  } }),
  { system: 'system', user: 'user' }
);

assert.strictEqual(index.schemaVersion, 1);
assert(index.stats.currentConclusions > 0);
assert.strictEqual(index.stats.glossaryEntries, index.glossaryEntries.length);
assert.strictEqual(index.stats.untestedEntries, index.glossaryEntries.filter(entry => !entry.tested).length);
const liveGlossaryAnchors = new Set(index.glossaryEntries.map(entry => entry.anchor));
assert(
  index.currentEntries.every(entry => liveGlossaryAnchors.has(entry.anchor)),
  'Current conclusions must not retain terms removed from the live glossary'
);
assert.strictEqual(index.currentEntries.length, index.glossaryEntries.length);
assert.strictEqual(index.stats.untestedEntries, 0);
assert(index.glossaryEntries.every(entry => entry.tested), 'Every live glossary entry should have a current ruling');
assert.strictEqual(new Set(index.glossaryEntries.map(entry => entry.anchor)).size, index.glossaryEntries.length);
assert(index.glossaryEntries.some(entry => entry.anchor === 'anointing' && entry.finalVerdict === 'REFINED'));
assert(index.glossaryEntries.some(entry => entry.anchor === 'almond' && entry.tested && entry.finalVerdict === 'MATCH'));
assert(index.glossaryEntries.some(entry => entry.anchor === 'ship' && entry.tested && entry.finalVerdict === 'DIVERGENT_PERSUADED'));
assert(index.glossaryEntries.some(entry => entry.finalVerdict === 'DIVERGENT_DISPUTED'));
assert(index.currentEntries.some(entry => entry.anchor === 'ship' && entry.finalVerdict === 'DIVERGENT_PERSUADED'));
assert(index.currentEntries.some(entry => entry.anchor === 'heart' && entry.judges.length === 4));
assert(index.currentEntries.some(entry => entry.anchor === 'lamb' && entry.term === 'The Lamb' && entry.frozenTerm === ''));
assert(index.glossaryEntries.some(entry => entry.anchor === 'lamb' && entry.term === 'The Lamb'));

MeatTesterView._data = index;
const anointingTarget = MeatTesterView.resolveRouteEntry({ term: 'anointing' });
assert.strictEqual(anointingTarget?.untested, false);
assert.strictEqual(anointingTarget.entry.term, 'Anoint, anointing');
const testedTarget = MeatTesterView.resolveRouteEntry({ term: 'ship' });
assert.strictEqual(testedTarget?.untested, false, 'A tested glossary URL should resolve to its frozen run');
const lambTarget = MeatTesterView.resolveRouteEntry({ term: 'lamb' });
assert.strictEqual(lambTarget?.entry.term, 'The Lamb');
assert.strictEqual(lambTarget?.entry.frozenTerm, '');
assert.strictEqual(lambTarget?.entry.revisionPending, false);
assert.strictEqual(lambTarget?.entry.definition, 'Jesus Christ — the unblemished Passover sacrifice, slain to redeem His people and now reigning.');
const frozenLambTarget = MeatTesterView.resolveRouteEntry({ term: 'lamb', run: '2026-07-13-all-symbols-phase-2' });
assert.strictEqual(frozenLambTarget?.entry.term, 'Lamb');
assert.strictEqual(frozenLambTarget?.entry.revisionPending, undefined);
const eastTarget = MeatTesterView.resolveRouteEntry({ term: 'east' });
assert.strictEqual(eastTarget?.entry.revisionPending, false);
assert(eastTarget?.entry.definition.startsWith('Where beginnings and returns come from'));
assert.strictEqual(eastTarget?.entry.frozenDefinition, '');
const almondEntry = index.currentEntries.find(entry => entry.anchor === 'almond');
const shipEntry = index.currentEntries.find(entry => entry.anchor === 'ship');
const wallEntry = index.currentEntries.find(entry => entry.anchor === 'wall');
assert.strictEqual(MeatTesterView.resultStage(almondEntry), 'relationship');
assert.strictEqual(MeatTesterView.resultStage(shipEntry), 'persuasion');
assert(MeatTesterView.judgeSummary(almondEntry).includes('GPT: Match'));
assert(!MeatTesterView.judgeSummary(almondEntry).includes('Not run'));
assert.strictEqual(MeatTesterView.hasJudgeConflict(wallEntry), true);

for (const entry of index.currentEntries) {
  assert(entry.runId, `${entry.anchor} is missing a current run`);
  assert(entry.judges.length > 0, `${entry.anchor} is missing judge metadata`);
  assert.strictEqual(entry.completion.relationship, entry.completion.providers, `${entry.anchor} has an incomplete relationship panel`);
  assert.strictEqual(entry.revisionPending, false, `${entry.anchor} still needs a rerun`);
  if (entry.relation === 'DIVERGENT') {
    assert.strictEqual(entry.completion.persuasion, entry.completion.providers, `${entry.anchor} has an incomplete persuasion panel`);
  }
  if (entry.completion.relationship < entry.completion.providers) {
    assert.strictEqual(entry.finalVerdict, 'PENDING', `${entry.anchor} exposes a partial panel as a final verdict`);
  }
}

for (const run of index.runs) {
  for (const entry of run.entries) {
    for (const judge of entry.judges) {
      for (const artifacts of Object.values(judge.artifacts)) {
        for (const url of Object.values(artifacts)) {
          assert(fs.existsSync(path.join(__dirname, '..', url.slice(1))), `Missing public artifact ${url}`);
        }
      }
    }
  }

  if (run.paths.sources.length) {
    const bundleUrl = run.paths.sources[0].url;
    const bundle = JSON.parse(fs.readFileSync(path.join(__dirname, '..', bundleUrl.slice(1)), 'utf8'));
    for (const source of bundle.sources) {
      const expected = run.paths.sources.find(item => item.label === source.name);
      assert(expected, `${run.id} is missing source metadata for ${source.name}`);
      const actualHash = crypto.createHash('sha256').update(source.content).digest('hex');
      assert.strictEqual(actualHash, expected.sha256, `${run.id}/${source.name} source hash changed`);
    }
  }
}

console.log(`MEAT Tester index verified: ${index.stats.currentConclusions} current conclusions across ${index.stats.archivedRuns} frozen runs.`);
