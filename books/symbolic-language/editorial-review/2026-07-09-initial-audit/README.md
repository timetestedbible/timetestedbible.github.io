# Initial Editorial Audit Data

Generated from the current `books/symbolic-language/*.adoc` manuscript files.

## Counts

- Localized proposed patches: 61
- Systematic campaign rows: 5
- Total CSV rows: 66

## Files

- `issues.csv` is the control ledger.
- `previews/` contains one human-readable before/after/rationale page per localized issue.
- `patches/` contains one candidate unified diff per localized issue.
- `campaigns/` contains broader review plans that should not be applied blindly.
- `scans/` contains raw machine-readable scan data for triage.

## Important

No manuscript file was changed by this generator. The patches are proposals only.

## Basic Review Tool

Use `../review.py` from this generated folder, or run it from the repository root:

```bash
books/symbolic-language/editorial-review/review.py status
books/symbolic-language/editorial-review/review.py ui
books/symbolic-language/editorial-review/review.py next
books/symbolic-language/editorial-review/review.py accept --note "cleaner"
books/symbolic-language/editorial-review/review.py reject --note "keep original voice"
books/symbolic-language/editorial-review/review.py current
books/symbolic-language/editorial-review/review.py notes --preview
books/symbolic-language/editorial-review/review.py list --status pending --limit 20
books/symbolic-language/editorial-review/review.py show MEAT-0021
books/symbolic-language/editorial-review/review.py accept MEAT-0021 --note "math fix"
books/symbolic-language/editorial-review/review.py reject MEAT-0007
books/symbolic-language/editorial-review/review.py apply --dry-run
books/symbolic-language/editorial-review/review.py apply --yes
```

Useful filters:

```bash
books/symbolic-language/editorial-review/review.py list --campaign C001 --severity medium
books/symbolic-language/editorial-review/review.py list --grep "failure mode"
books/symbolic-language/editorial-review/review.py notes --grep "source" --preview
```

For normal review, start with `review.py ui`. It shows one issue at a time and
uses single-key actions:

```text
a accept       r reject       w needs rewrite       f fact-check
m note         n/Enter next   b back                v full preview
g goto         s search       t compact/context    q quit
[/] context    ? help
```

The default UI view shows before/after context from the manuscript file. The
old line is marked `-`, the proposed line is marked `+`, and changed words
inside those lines are highlighted red/green while unchanged words stay plain.
Use `--context N` to choose the starting number of neighboring lines,
`--compact` to start with the shorter current/proposed view, and `--color never`
if your terminal does not handle ANSI color well.

The `next` command stores a current issue in `.review-state.json` inside the
selected audit folder. If you run `accept`, `reject`, `rewrite`, `factcheck`, or
`pending` without an issue ID, the command acts on that current issue and then
shows the next pending item. Use `--no-next` to mark the current item without
advancing.

The apply command tries the stored patch first. If nearby accepted edits have
made the patch context stale, it falls back to replacing the exact `Current`
preview text with the exact `Proposed` preview text, but only when the current
text occurs exactly once in the target file. Ambiguous fallbacks fail closed.
Use `--no-fallback` for strict patch-only behavior.
