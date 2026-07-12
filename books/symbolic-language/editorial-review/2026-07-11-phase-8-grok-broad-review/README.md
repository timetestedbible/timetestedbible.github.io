# Phase 8 — Grok Broad Review Audit

Generated as **proposals only**. No manuscript file was modified by this generator.

## Counts

- Localized proposed patches: 22
- Systematic campaign rows: 5
- Total CSV rows: 27
- Reviewer: Grok (broad editorial + residual cadence pass)
- Prior coverage: Phases 1–7 (AI cadence, run-ons, metaphors, twin, audio flow/punctuation)

## Focus

1. **Residual presenter staging** still audible after prior thinning (Now watch / Mark that / Notice that / Weigh…).
2. **Factual naming**: Introduction's "Claude Fable 5" (not a known model).
3. **Campaigns** for And/But opens, em-dash/long-sentence load, and non-patch structural notes.
4. Narrative assessment: `GROK-BROAD-REVIEW.md` in this folder.

## Not reopened

- Author-**rejected** items from earlier phases (e.g. bunker → hiding place) are left alone.
- Phase 7 audio quote/punctuation ledger remains separate (`…phase-7-…`, still pending).
- Phase 1 `MEAT-0024` still `needs-rewrite` in the initial-audit ledger (liberty / market-forces metaphor).

## Review

```bash
books/symbolic-language/editorial-review/review.py --audit-dir books/symbolic-language/editorial-review/2026-07-11-phase-8-grok-broad-review ui
books/symbolic-language/editorial-review/review.py --audit-dir books/symbolic-language/editorial-review/2026-07-11-phase-8-grok-broad-review list --status pending --all
books/symbolic-language/editorial-review/review.py --audit-dir books/symbolic-language/editorial-review/2026-07-11-phase-8-grok-broad-review validate --status pending --verbose
```

After accept/reject decisions:

```bash
books/symbolic-language/editorial-review/review.py --audit-dir books/symbolic-language/editorial-review/2026-07-11-phase-8-grok-broad-review apply --dry-run
books/symbolic-language/editorial-review/review.py --audit-dir books/symbolic-language/editorial-review/2026-07-11-phase-8-grok-broad-review apply --yes
```
