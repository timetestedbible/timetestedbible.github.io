# Unpointed-reading rules consensus

This is an argument-neutral foundation experiment. It does not submit a book
chapter or a disputed word. Its output is a frozen set of rules for comparing
two admissible vocalizations of the same unpointed Hebrew or Aramaic text.

The protocol is deliberately staged:

1. **Proposal** — every provider independently proposes its own rules before
   seeing the author's rules.
2. **Fairness** — providers receive the author's rules, but not the argument
   for them. Each provider also receives its own frozen proposal. A rules round
   passes only when every provider says `FAIR_AS_WRITTEN` and agrees to use the
   rules as the baseline.
3. **Rationale** — only after a rules round passes, providers receive the exact
   approved rules plus the separately frozen argument for them. This round
   passes only when every provider is persuaded that the rules are the best
   objective standard.

Clarifications and revisions are append-only rounds. If the rules change after
a fairness review, the revised text must pass a new fairness round before any
rationale is disclosed. The runner enforces this by comparing SHA-256 hashes.

No downstream experiment should import this foundation until both consensus
gates pass. The resulting baseline should contain the approved rules and the
provider commitments, not a book chapter.

## Commands

Start with independent proposals:

```sh
python foundations/reading-rules/run.py \
  --run-id RULES-CAMPAIGN \
  --phase proposal \
  --premises foundations/reading-rules/drafts/canonical-premises-v1.md
```

Review a rules draft without its rationale:

```sh
python foundations/reading-rules/run.py \
  --run-id RULES-CAMPAIGN \
  --phase fairness \
  --round rules-v1 \
  --rules /path/to/rules-v1.md
```

After unanimous fairness approval, disclose the rationale:

```sh
python foundations/reading-rules/run.py \
  --run-id RULES-CAMPAIGN \
  --phase rationale \
  --round rationale-v1 \
  --rules /path/to/rules-v1.md \
  --argument /path/to/rationale-v1.md \
  --fairness-round rules-v1
```

Credential files may be supplied at runtime as `provider=/path` using repeated
`--key-file` arguments. Their contents are loaded into memory and never copied
to the run directory.
