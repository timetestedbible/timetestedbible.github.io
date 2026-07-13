const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const MeatTesterView = require('../views/meat-tester-view.js');
const index = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'meat-tester-experiment.json'), 'utf8'));

assert.strictEqual(MeatTesterView.verdictLabel('DIVERGENT_PERSUADED'), 'Divergent · persuaded');
assert.strictEqual(MeatTesterView.verdictClass('DIVERGENT_PERSUADED'), 'verdict-divergent-persuaded');
assert.strictEqual(MeatTesterView.escapeHtml('<script>'), '&lt;script&gt;');
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
assert(index.glossaryEntries.length > index.currentEntries.length, 'The symbol cloud should include untested glossary entries');
assert.strictEqual(new Set(index.glossaryEntries.map(entry => entry.anchor)).size, index.glossaryEntries.length);
assert(index.glossaryEntries.some(entry => entry.anchor === 'anointing' && entry.finalVerdict === 'UNTESTED'));
assert(index.glossaryEntries.some(entry => entry.anchor === 'almond' && entry.tested && entry.finalVerdict === 'MATCH'));
assert(index.glossaryEntries.some(entry => entry.anchor === 'ship' && entry.tested && entry.finalVerdict === 'DIVERGENT_PERSUADED'));
assert(index.currentEntries.some(entry => entry.anchor === 'ship' && entry.finalVerdict === 'DIVERGENT_PERSUADED'));
assert(index.currentEntries.some(entry => entry.anchor === 'heart' && entry.judges.length === 4));

MeatTesterView._data = index;
const untestedTarget = MeatTesterView.resolveRouteEntry({ term: 'anointing' });
assert(untestedTarget?.untested, 'An untested glossary URL should resolve to its glossary detail');
assert.strictEqual(untestedTarget.entry.term, 'Anoint, anointing');
const testedTarget = MeatTesterView.resolveRouteEntry({ term: 'ship' });
assert.strictEqual(testedTarget?.untested, false, 'A tested glossary URL should resolve to its frozen run');

for (const entry of index.currentEntries) {
  assert(entry.runId, `${entry.anchor} is missing a current run`);
  assert(entry.judges.length > 0, `${entry.anchor} is missing judge metadata`);
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
