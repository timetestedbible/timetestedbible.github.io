# Phase 7 Audio Quote and Punctuation Audit Data

Generated after applying Phase 6 audio-language fixes.

## Counts

- Localized proposed patches: 23
- Opening Scripture lead-ins: 12
- Block quote lead-ins: 7
- Quote pause fixes: 1
- Narrator punctuation fixes: 3
- Campaign: `P7-C001` audio Scripture transitions / TTS punctuation pass

## Focus

This pass keeps Scripture text unchanged. It proposes spoken lead-ins where the audio still reads like print citation apparatus, adds missing cues before block quotes, and removes a few narrator punctuation marks likely to produce awkward synthetic pauses.

Inline Scripture phrases that occur inside a narration sentence keep their quotation marks and matching print citation in the source and video path. The renderer removes only the quote marks from API-bound TTS text, so the narrator can continue smoothly into the phrase while the video still shows its quotation treatment and citation. This audit therefore does not propose removing inline quotation marks to solve a spoken-pause problem.

## Review

```bash
books/symbolic-language/editorial-review/review.py --audit-dir books/symbolic-language/editorial-review/2026-07-11-phase-7-audio-quote-punctuation-audit ui
books/symbolic-language/editorial-review/review.py --audit-dir books/symbolic-language/editorial-review/2026-07-11-phase-7-audio-quote-punctuation-audit list --status pending --all
books/symbolic-language/editorial-review/review.py --audit-dir books/symbolic-language/editorial-review/2026-07-11-phase-7-audio-quote-punctuation-audit validate --status pending --verbose
```

This phase is a proposal ledger only. No audio transcript was changed by this generator.
