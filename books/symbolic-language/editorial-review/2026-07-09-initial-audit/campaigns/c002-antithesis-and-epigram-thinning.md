# C002: Antithesis And Epigram Thinning

Status: pending
Scope: systematic

## Problem

Book-wide thinning of repeated 'not X but Y' formulas and minted one-line section closers. These need chapter-level judgment, not blind replacement.

## Review Approach

Do not apply this globally by search and replace. Use the scan CSVs to locate candidates, then approve localized patches or mark passages as intentionally retained.

## Supporting Scans

- `../scans/trigger-phrases.csv`
- `../scans/antithesis-candidates.csv`
- `../scans/em-dash-density.csv`
- `../scans/prevalence-tables.csv`
- `../scans/long-sentences.csv`
