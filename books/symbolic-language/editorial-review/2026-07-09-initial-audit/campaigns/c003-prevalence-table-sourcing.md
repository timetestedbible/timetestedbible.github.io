# C003: Prevalence Table Sourcing

Status: pending
Scope: systematic

## Problem

Tables with estimated percentages need a source note, research trail, or softened language so the numbers do not look invented.

## Review Approach

Do not apply this globally by search and replace. Use the scan CSVs to locate candidates, then approve localized patches or mark passages as intentionally retained.

## Reviewer Direction

Tables with estimated percentages should be sourced as AI estimates, naming the
model or models used, unless a real external source is available and should be
cited instead.

Suggested note pattern:

`Note: Percentages are AI estimates by Claude, Grok, and/or GPT from the stated assumptions; treat them as approximate, not independently published statistics.`

For each affected table:

- Name the model source actually used; do not imply all three were used if only one was.
- Prefer ranges or approximate language over false precision.
- If the table is based on a non-AI published source, cite that source instead of this AI-estimate note.
- Keep the source note close to the table so the percentages do not read as unsourced fact.

## Supporting Scans

- `../scans/trigger-phrases.csv`
- `../scans/antithesis-candidates.csv`
- `../scans/em-dash-density.csv`
- `../scans/prevalence-tables.csv`
- `../scans/long-sentences.csv`
