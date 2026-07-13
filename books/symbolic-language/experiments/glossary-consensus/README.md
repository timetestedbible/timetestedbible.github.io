# Reproducible glossary consensus experiment

This experiment measures two different questions without confusing either one
with truth:

1. **Consensus distance:** Does the book match, refine, contradict, or go beyond
   the symbolic meaning recognizable to blinded AI agents?
2. **Persuasiveness:** When the book diverges, does its full scriptural case
   persuade independent skeptical-reader agents?

The experiment does **not** decide doctrine by majority vote. Scripture carries
the book's argument. The models serve as independent proxies for recognizable
published consensus and for the objections an informed outside reader is likely
to raise.

The historical hand-run results are preserved in
[`research-glossary-vs-consensus.md`](../../research/research-glossary-vs-consensus.md).
This directory turns that process into a versioned, rerunnable protocol.

## Public dashboard

The reader-facing **MEAT Tester Experiment** is available at `/meat-tester`.
It presents the premise and controls, summarizes the current rulings, preserves
the full run history, and lets readers open every secret-free request, raw
response, normalized judgment, prompt template, and source snapshot.

After checking in a completed run, rebuild its deterministic public index:

```sh
npm run build:meat-tester
```

The dashboard treats AI as a proxy for recognizable popular teaching and as a
skeptical reader of the book's case. It does not treat model consensus as a
substitute for the reader's duty to examine the evidence.

## Design

The runner performs three stages:

1. **Blind consensus.** Claude, GPT, Gemini, and Grok receive only a headword.
   They do not receive the book, its definition, its citations, or its existing
   badge.
2. **Relationship.** Fresh calls receive all anonymized blind responses plus the
   glossary entry and its cited verses. Each classifies the entry as `MATCH`,
   `REFINED`, `DIVERGENT`, or `NOVEL` and grades the glossary citations.
3. **Persuasion.** Only majority-`DIVERGENT` entries proceed. Fresh calls receive
   the common reading, glossary entry, available KJV excerpts, and the full
   proving chapter. They also receive the same compact excerpt of the book's
   stated interpretive method and its Sower known-answer validation. These are
   contiguous source excerpts with only AsciiDoc presentation markup removed;
   no experiment-authored explanation or judging instruction is inserted into
   them. Each agent must compare the book with the strongest specific rival it
   can formulate and return `PERSUADED` or `UNPERSUADED`.

The common method evidence is protocol-wide, not tailored to a disputed term.
The selected passages are the Introduction's opening, the Parables chapter's
opening and “How the Exam Is Taken,” and the complete “Sower, Derived and
Graded” section. The selection gives the judges the book's scriptural warrant,
stated procedure, worked derivation, and comparison with Jesus's answer key in
the author's own words. No Oil-specific method material is added.

The persuasion question is an inference to the best explanation, not a demand
that the book prove itself to be the only logically possible reading. An
`UNPERSUADED` judgment must name a counter-interpretation and show that it
explains the same evidence better overall. Leaving details undefined does not
give a rival interpretation an automatic simplicity advantage. The structured
response records both explanations' advantages and the comparative winner;
the runner rejects a binary verdict that contradicts that comparison.

The judge must also separate the minimum contrastive core from secondary
elaboration. A broader or narrower restatement of the same referent cannot
defeat that referent as a “counter-interpretation.” Such a result is recorded as
`PERSUADED` with `CORE_ONLY` support when the modifiers remain disputed. An
`UNPERSUADED` result requires a materially contradictory core plus at least 1
text or detail the book's core cannot explain without contradiction.

Dependent conclusions can be tested in layers. Foundational entries are first
run through persuasion on their own proving material. A downstream run imports
findings provider by provider: GPT receives only findings accepted earlier by
the same GPT model, Claude receives Claude's, Gemini receives Gemini's, and
Grok receives Grok's. A model
that rejected a foundation is not forced to accept it; a model that accepted
one must identify genuinely new contradictory evidence before revising it. The
artifact records the source-run hash, exact model, full entry, accepted scope,
and adjudicated core. `CORE_ONLY` modifiers remain unestablished. This makes
dependencies explicit without converting a panel majority into an individual
model's premise.

Consensus distance and persuasion remain separate fields. The final generated
table therefore distinguishes:

- Divergent — persuaded by the supplied sources and argument
- Divergent — unconvinced by the supplied sources and argument

Relationship labels use both core identity and extension, not a detail count.
`MATCH` requires equivalent cores covering the same cases. `REFINED` preserves
the consensus category while narrowing, broadening, or reclassifying its
boundary; it therefore may disagree with the general reading in some cases.
`DIVERGENT` replaces the central referent or asserts a materially contradictory
core. `NOVEL` means the book's core has no consensus baseline. The structured
response records both cores, their semantic relation, the cases added or
excluded, and any material contradiction.

Every provider gets one vote. A verdict requires more than half of the available
votes. A tie, including a 2–2 split, produces `DISPUTED`; the runner never
silently breaks a tie.

## Requirements

- Python 3.10 or newer
- No third-party packages
- One or more API keys supplied through the environment

```sh
export OPENAI_API_KEY="..."
export ANTHROPIC_API_KEY="..."
export GEMINI_API_KEY="..."
export XAI_API_KEY="..."
```

Keys are sent only as HTTP headers. They are never placed in prompts, request
artifacts, manifests, logs, or response files.

The checked-in defaults currently use:

- OpenAI `gpt-5.6-sol`
- Anthropic `claude-fable-5`
- Google `gemini-3.1-pro-preview`
- xAI `grok-4.5`

Copy `config.example.json` to another filename to change a model or endpoint,
then pass `--config`. Prefer dated model snapshots when a provider offers one,
and preserve the actual config with each completed run.

## Extract and inspect the input

```sh
cd books/symbolic-language/experiments/glossary-consensus
python3 experiment.py extract
python3 -m unittest discover -s tests -v
```

The default extraction deliberately excludes the 12 entries marked `WORD`,
leaving the same 147 symbols measured by the book's Introduction.

Create an exact request plan without spending API credits:

```sh
python3 experiment.py plan --run-id 2026-07-cross-model --limit 3
```

This snapshots the glossary, proving chapters, common method evidence, prompts,
schemas, model config, and secret-free consensus requests under
`runs/2026-07-cross-model/`.

## Run or resume

```sh
python3 experiment.py run --run-id 2026-07-cross-model
```

The default run uses all four providers and all three stages. Useful options:

```sh
# A cheap end-to-end smoke test
python3 experiment.py run --run-id smoke-oil --term oil

# Adjudicate recovered WORD entries even if relationship is MATCH or REFINED
python3 experiment.py run --run-id foundations \
  --include-words --persuade-all \
  --term faith --term belief --term love --term knowing

# Reuse each provider's own accepted findings as downstream premises
python3 experiment.py run --run-id righteousness-with-foundations \
  --term righteousness --accepted-run foundations

# Run only two providers
python3 experiment.py run --run-id two-models --providers anthropic openai

# Stop after the blind phase, inspect it, and resume later
python3 experiment.py run --run-id staged --stop-after consensus
python3 experiment.py run --run-id staged

# Retry only missing/failed calls by rerunning the same command
python3 experiment.py run --run-id 2026-07-cross-model
```

Completed normalized calls are skipped unless `--force` is supplied. Provider
failures are written to `errors/`; rerunning resumes without paying again for
successful calls.

New run IDs also reuse unchanged calls across runs. The content-addressed cache
key includes provider, model, endpoint, system instruction, rendered prompt,
and response schema. Exact matches copy the prior raw and normalized response
into the new run; a changed prompt, schema, or model makes a fresh API call.
`--force` deliberately bypasses both resume behavior and this cache.

## What a run saves

```text
runs/<run-id>/
├── manifest.json             model IDs and SHA-256 hashes
├── config.json               secret-free provider configuration
├── inputs/                   glossary, chapters, method evidence, and accepted findings
├── prompts/                  prompt snapshot
├── schemas/                  response-schema snapshot
├── requests/                 exact secret-free API payloads
├── responses/                unmodified provider responses
├── normalized/               validated model judgments
├── errors/                   retryable failure records
└── results/
    ├── verdicts.csv
    ├── summary.json
    ├── summary.md
    └── summary.adoc          ready-to-review book table
```

Review raw files for accidental sensitive content, then check the complete run
into Git. Proprietary model sampling is not byte-for-byte deterministic;
reproducibility here means that another researcher can inspect and rerun the
same inputs, prompts, schemas, model identifiers, and aggregation rules.

The manifest records a separate SHA-256 hash for the common method evidence.
Older run directories retain their original prompt snapshot. Protocol version 2
was abandoned because its method bundle mixed manuscript material with
experiment-authored guidance; it must not be reported as evidence. A clean
method-aware comparison must use a version 3 run with a new run ID.
Protocol version 4 changes the persuasion question to a structured
best-explanation comparison and therefore also requires a new run ID.
Protocol version 5 removes the term-specific example used while developing
version 4, leaving the comparative rule identical and fully uniform across all
glossary entries.
Protocol version 6 makes core identity, elaboration, semantic relation, and
incompatible evidence explicit so that a judge cannot reject a conclusion by
renaming or broadening the same referent.
Protocol version 7 adds hashed, unanimous prior findings for dependency-aware
tests and permits the recovered `WORD` entries to receive full persuasion
judgments before downstream conclusions rely on them.
Protocol version 8 makes accepted premises provider-and-model-specific and adds
content-addressed cross-run caching so unchanged stages are never resampled.
Protocol version 9 makes the MATCH/REFINED/DIVERGENT/NOVEL boundary
machine-checkable through explicit core-identification and semantic-relation
fields.
Protocol version 10 separates agreement about the central category from
disagreement about its extension, so a narrowing can be recorded as a genuine
boundary divergence without being mislabeled as a replaced referent.
Protocol version 11 makes those axes independent: a core-divergent reading may
retain some consensus cases while rejecting the consensus's central referent,
so overlap or subset extension no longer forces a REFINED label.
Protocol version 12 adds Gemini 3.1 Pro Preview through Google's
GenerateContent API as a fourth independent provider. It also supports explicit
evidence-ablation markers: the frozen chapter remains intact for audit, while a
marked downstream application can be omitted from a test designed to establish
that conclusion without circularly supplying the application as a premise.

## What the percentages mean

The summary's percentages are exact shares of glossary terms assigned to each
verdict. They are not estimates of how many Christians hold a belief.

This experiment does **not** validate the separate `Est. %` tables scattered
through the topical chapters. Those tables estimate the relative popularity of
different interpretations and are explicitly not survey results. They require a
different evidence program: published-source sampling, denominational weighting,
or replacement of precise percentages with ordinal labels such as dominant,
common, minority, and rare. Keeping that question outside this experiment
prevents a reproducible symbol-classification result from appearing to validate
unrelated opinion estimates.
