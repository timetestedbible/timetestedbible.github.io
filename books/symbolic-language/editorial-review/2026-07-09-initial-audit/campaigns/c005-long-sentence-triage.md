# C005: Long Sentence Triage

Status: pending
Scope: systematic

## Problem

Very long prose sentences should be reviewed in context; many are defensible, but the top candidates add avoidable parse load.

## Review Approach

Do not apply this globally by search and replace. Use the scan CSVs to locate candidates, then approve localized patches or mark passages as intentionally retained.

## Supporting Scans

- `../scans/trigger-phrases.csv`
- `../scans/antithesis-candidates.csv`
- `../scans/em-dash-density.csv`
- `../scans/prevalence-tables.csv`
- `../scans/long-sentences.csv`
