# Phase 3 Editorial Audit Data

Generated after phase-2 accepted patches were applied.

## Counts

- Localized proposed patches: 13
- P3-C001 rough transition / metaphor / presenter-tone rows: 6
- P3-C002 long sentence / parse-load rows: 7

## Review

```bash
books/symbolic-language/editorial-review/review.py --audit-dir books/symbolic-language/editorial-review/2026-07-10-phase-3-audit ui
books/symbolic-language/editorial-review/review.py --audit-dir books/symbolic-language/editorial-review/2026-07-10-phase-3-audit list --status pending --all
books/symbolic-language/editorial-review/review.py --audit-dir books/symbolic-language/editorial-review/2026-07-10-phase-3-audit apply --dry-run
books/symbolic-language/editorial-review/review.py --audit-dir books/symbolic-language/editorial-review/2026-07-10-phase-3-audit apply --yes
```

This phase is a proposal ledger only. No manuscript file was changed by this generator.
