# Engine Snapshot Tests

Snapshot tests for the LunarCalendarEngine. These verify that all Sabbath Tester biblical test results remain stable after code changes.

## Setup

```bash
cd tests
npm install
```

## Run Tests

```bash
npm test
```

This runs three verifiers in sequence:

1. `snapshot-verify.js` — all 84 Sabbath Tester combinations (7 biblical tests x 12 calendar profiles) against the golden snapshot. Detects drift only; it will happily enshrine a bug.
2. `anchor-verify.js` — external ground truth: attested weekdays, the JD epoch, author-ruled month anchors, and label/weekday/boundary self-consistency. If these fail the engine is wrong regardless of the snapshot.
3. `julian-day-verify.js` — thorough verification of `julian-day.js` (the one copy of calendar <-> day-number math) and everything rewired to it: Meeus anchors, both leap rules, day-by-day oracle walks of both calendars, Date.UTC and astronomy-engine oracles, the display convention, engine invariants over 8 profiles x 7 locations x 15 years, and cross-file agreement of the browser scripts loaded in layout order. `npm run test:quick` runs a reduced grid.

## Update Snapshot

After an intentional engine change (e.g. fixing a calculation), regenerate the golden file:

```bash
npm run snapshot:update
```

Then review the git diff on `snapshots/sabbath-tester.json` to confirm the changes are expected before committing.

## What Gets Tested

Each snapshot entry captures the full calendar pipeline:

1. Moon phase search (full, dark, crescent)
2. Year start point (equinox vs 13-days-before)
3. Month start calculation (sunrise vs sunset boundary)
4. Day boundary and JD assignment
5. Weekday derivation from JD
6. Pass/fail determination against expected weekday

The 12 profiles are all combinations of:
- **Moon phase:** Full, Dark, Crescent
- **Day start:** Daybreak (angle 12), Sunset (angle 0)
- **Year rule:** Equinox, Lamb (13 days before)

The 7 biblical tests are defined in `http/views/sabbath-tester-view.js` (`BIBLICAL_TESTS`).

## Files

- `astro-engine-node.js` — Node.js wrapper for the astronomy-engine npm package
- `snapshot-generate.js` — generates the golden snapshot JSON
- `snapshot-verify.js` — verifies current engine output matches the snapshot
- `anchor-verify.js` — external-truth anchors (weekdays, epochs, author rulings, self-consistency)
- `julian-day-verify.js` — oracles, anchors, engine invariants and cross-file agreement for the shared day-number math
- `snapshots/sabbath-tester.json` — the golden reference data
