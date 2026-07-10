# C004: Readability Grammar And Factual Checks

Status: pending
Scope: systematic

## Problem

Local grammar, math, and rough-parse issues that can usually be handled with one-line patches.

## Review Approach

Do not apply this globally by search and replace. Use the scan CSVs to locate candidates, then approve localized patches or mark passages as intentionally retained.

## Supporting Scans

- `../scans/trigger-phrases.csv`
- `../scans/antithesis-candidates.csv`
- `../scans/em-dash-density.csv`
- `../scans/prevalence-tables.csv`
- `../scans/long-sentences.csv`
