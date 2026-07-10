# Phase 2 Editorial Audit Data

Generated after phase-1 localized edits were applied to the manuscript.

## Counts

- Localized proposed patches: 49
- Presenter/register follow-up rows: 10
- Claude estimate source-note rows: 11
- Run-on paragraph break rows: 20
- Run-on paragraph scan candidates: 213
- Content emphasis/cross-reference rows: 2
- Readability/factual nuance rows: 6

## Review

```bash
books/symbolic-language/editorial-review/review.py --audit-dir books/symbolic-language/editorial-review/2026-07-10-phase-2-audit ui
books/symbolic-language/editorial-review/review.py --audit-dir books/symbolic-language/editorial-review/2026-07-10-phase-2-audit list --status pending --limit 20
books/symbolic-language/editorial-review/review.py --audit-dir books/symbolic-language/editorial-review/2026-07-10-phase-2-audit apply --dry-run
books/symbolic-language/editorial-review/review.py --audit-dir books/symbolic-language/editorial-review/2026-07-10-phase-2-audit apply --yes
```

This phase is a proposal ledger only. No manuscript file was changed by the
generator.

The full run-on paragraph audit is in `scans/run-on-paragraphs.csv`. Rows that
also have a reviewable patch include an `issue_id`; the rest are retained as
scan data for later judgment.
