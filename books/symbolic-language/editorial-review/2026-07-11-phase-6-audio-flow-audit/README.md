# Phase 6 Audio Flow Audit Data

Generated for the audiobook narration scripts after the chapter renumbering and Phase 5 wording cleanup.

## Counts

- Localized proposed patches: 27
- Candidate scan rows: 30
- Campaign: `P6-C001` audio transition / spoken-flow pass

## Focus

This pass targets narration-only issues: cold section-heading fragments, weak sequence cues, an unclear spoken pronoun, and one audio script that still had the old `twin` wording after the print cleanup.

## Review

```bash
books/symbolic-language/editorial-review/review.py --audit-dir books/symbolic-language/editorial-review/2026-07-11-phase-6-audio-flow-audit ui
books/symbolic-language/editorial-review/review.py --audit-dir books/symbolic-language/editorial-review/2026-07-11-phase-6-audio-flow-audit list --status pending --all
books/symbolic-language/editorial-review/review.py --audit-dir books/symbolic-language/editorial-review/2026-07-11-phase-6-audio-flow-audit validate --status pending --verbose
```

This phase is a proposal ledger only. No audio transcript was changed by this generator.
