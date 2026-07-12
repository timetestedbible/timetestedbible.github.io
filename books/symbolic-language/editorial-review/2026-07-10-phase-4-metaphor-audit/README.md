# Phase 4 Metaphor Audit Data

Generated after phase-3 accepted patches were applied and `MEAT-0202` was marked superseded.

## Counts

- Localized proposed patches: 22
- Candidate scan rows: 32
- Campaign: `P4-C001` bad / overloaded metaphor pass

## Review

```bash
books/symbolic-language/editorial-review/review.py --audit-dir books/symbolic-language/editorial-review/2026-07-10-phase-4-metaphor-audit ui
books/symbolic-language/editorial-review/review.py --audit-dir books/symbolic-language/editorial-review/2026-07-10-phase-4-metaphor-audit list --status pending --all
books/symbolic-language/editorial-review/review.py --audit-dir books/symbolic-language/editorial-review/2026-07-10-phase-4-metaphor-audit apply --dry-run
books/symbolic-language/editorial-review/review.py --audit-dir books/symbolic-language/editorial-review/2026-07-10-phase-4-metaphor-audit apply --yes
```

This phase is a proposal ledger only. No manuscript file was changed by this generator.

## Scan Notes

The candidate scan is in `scans/metaphor-candidates.csv`. Items marked `keep` were reviewed and left out of the patch queue because the metaphor is literal in context, a Scripture quotation, or a deliberate sustained comparison.
