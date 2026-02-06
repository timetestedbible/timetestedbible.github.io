# KJV Biblical Date Reference Analysis Report

## Executive Summary

This analysis extracted and cataloged all date/time references from the King James Bible, identified gaps in the existing timeline event structure, and added missing king events to complete the chronological chain.

## Data Extraction Results

### Total References Extracted: 5,390

| Reference Type | Count | Description |
|----------------|-------|-------------|
| duration_days | 2,477 | References to specific number of days |
| duration_years | 895 | References to years of events/lifespans |
| feast | 300 | Passover, Tabernacles, etc. |
| duration_months | 286 | References to months |
| generation | 213 | Generation references |
| day_of_month | 211 | Specific days (1st, 14th, etc.) |
| sabbath | 172 | Sabbath references |
| reign_year | 159 | Year of king's reign |
| year_of | 142 | Generic year references |
| age | 139 | Age references for genealogy |
| ordinal_month | 113 | First month, second month, etc. |
| in_days_of | 84 | "In the days of X" |
| after_time | 47 | "After N days/months/years" |
| lifespan | 30 | Lifespan references |
| month_name | 29 | Named months (Nisan, Abib, etc.) |
| duration_weeks | 28 | Week references |
| jubilee | 22 | Jubilee year references |
| end_of | 19 | "At the end of N years" |
| begat_age | 14 | Begetting ages (genealogy) |
| new_moon | 10 | New moon references |

### Hebrew Month Names Found

| Month | Count | Verses |
|-------|-------|--------|
| Abib (Nisan) | 6 | Exodus 13:4, 23:15, 34:18, Deuteronomy 16:1 |
| Zif (Iyyar) | 2 | 1 Kings 6:1, 6:37 |
| Sivan | 2 | Esther 8:9 |
| Elul | 1 | Nehemiah 6:15 |
| Ethanim (Tishri) | 1 | 1 Kings 8:2 |
| Bul | 1 | 1 Kings 6:38 |
| Chisleu (Kislev) | 3 | Nehemiah 1:1, Zechariah 7:1 |
| Tebeth | 1 | Esther 2:16 |
| Sebat (Shevat) | 1 | Zechariah 1:7 |
| Adar | 8 | Ezra 6:15, Esther 3:7, 13, 8:12, 9:1, 15, 17, 19, 21 |
| Nisan | 2 | Nehemiah 2:1, Esther 3:7 |

## Gap Analysis

### Before Additions

| Category | Count |
|----------|-------|
| Existing events in v2 | 117 |
| Existing durations in v2 | 81 |
| Covered verse references | 30 |
| Missing reign references | 156 |
| Missing specific dates | 44 |
| Missing genealogy refs | 162 |

### Missing Reign References by Person

| Person | Missing Refs | Kingdom |
|--------|--------------|---------|
| Asa | 20 | Judah |
| Darius | 18 | Persia |
| Hezekiah | 12 | Judah |
| Cyrus | 12 | Persia |
| Zedekiah | 10 | Judah |
| Josiah | 8 | Judah |
| Jehoiakim | 8 | Judah |
| Joram | 6 | Judah |
| Joash | 6 | Judah |
| Rehoboam | 4 | Judah |
| Jehoshaphat | 4 | Judah |
| Jeroboam | 4 | Israel |
| Azariah | 4 | Judah |
| Pekah | 4 | Israel |
| Hoshea | 4 | Israel |
| Artaxerxes | 4 | Persia |
| Nebuchadrezzar | 4 | Babylon |
| Belshazzar | 4 | Babylon |

## Events Added

### New King Events (16 Judah kings)

| Event ID | Title | Reign Length |
|----------|-------|--------------|
| jehoshaphat-reign | Jehoshaphat Begins to Reign | 25 years |
| jehoram-judah-reign | Jehoram of Judah Begins to Reign | 8 years |
| ahaziah-judah-reign | Ahaziah of Judah Begins to Reign | 1 year |
| athaliah-reign | Athaliah Seizes the Throne | 6 years |
| joash-judah-reign | Joash of Judah Begins to Reign | 40 years |
| amaziah-reign | Amaziah Begins to Reign | 29 years |
| uzziah-reign | Uzziah (Azariah) Begins to Reign | 52 years |
| jotham-reign | Jotham Begins to Reign | 16 years |
| ahaz-reign | Ahaz Begins to Reign | 16 years |
| hezekiah-reign | Hezekiah Begins to Reign | 29 years |
| manasseh-reign | Manasseh Begins to Reign | 55 years |
| amon-reign | Amon Begins to Reign | 2 years |
| josiah-reign | Josiah Begins to Reign | 31 years |
| jehoiakim-reign | Jehoiakim Begins to Reign | 11 years |
| jehoiachin-reign | Jehoiachin Begins to Reign | 3 months |
| zedekiah-reign | Zedekiah Begins to Reign | 11 years |

### New Durations Added (15)

All Judah king reign durations with scripture references from 2 Kings.

## Complete Judah King Chronology Chain

```
Solomon (40 years)
  └→ Rehoboam (17 years) - ~931 BCE
      └→ Abijah (3 years)
          └→ Asa (41 years)
              └→ Jehoshaphat (25 years)
                  └→ Jehoram (8 years)
                      └→ Ahaziah (1 year) - killed by Jehu (~841 BCE)
                          └→ Athaliah (6 years)
                              └→ Joash (40 years)
                                  └→ Amaziah (29 years)
                                      └→ Uzziah/Azariah (52 years) - Isaiah called in his death year
                                          └→ Jotham (16 years)
                                              └→ Ahaz (16 years)
                                                  └→ Hezekiah (29 years) - Sennacherib siege
                                                      └→ Manasseh (55 years)
                                                          └→ Amon (2 years)
                                                              └→ Josiah (31 years) - Found Book of Law
                                                                  └→ Jehoiakim (11 years)
                                                                      └→ Jehoiachin (3 months) - Captivity
                                                                          └→ Zedekiah (11 years) - Temple Destroyed ~586 BCE
```

## Verse Index Statistics

| Metric | Count |
|--------|-------|
| Total verses with date references | 3,657 |
| Verses with timeline links | 538 |
| Verses with calendar links | 259 |
| Resolved references | 525 |
| Proposed references | 59 |
| Unresolved references | 3,060 |

### Resolution Status

- **Resolved (525)**: Verses with existing events/durations - can link to timeline
- **Proposed (59)**: Verses with proposed events - need review before adding
- **Partial (13)**: Verses with durations but no point events
- **Unresolved (3,060)**: Need events/durations to resolve

### Top Books with Date References

| Book | Verses with Dates |
|------|-------------------|
| Genesis | 291 |
| Numbers | 208 |
| Leviticus | 190 |
| Luke | 176 |
| John | 166 |
| Deuteronomy | 164 |
| Jeremiah | 157 |
| Exodus | 153 |
| Isaiah | 137 |
| Ezekiel | 127 |

## Files Created

| File | Description |
|------|-------------|
| `http/data/kjv-date-references.json` | All extracted date references (5,390) |
| `http/data/kjv-date-gaps.json` | Gap analysis results |
| `http/data/kjv-proposed-additions.json` | Proposed events/durations |
| `http/data/verse-event-index.json` | Verse-to-event mapping index |
| `http/data/extract-bible-dates.py` | Extraction script |
| `http/data/analyze-date-gaps.py` | Gap analysis script |
| `http/data/generate-missing-events.py` | Event generation script |
| `http/data/create-verse-index.py` | Index creation script |

## Next Steps

### Priority 1: Complete Chronological Chains
1. Add remaining Israel (Northern Kingdom) kings
2. Add Persian/Babylonian king events for exile period
3. Add key prophetic date references (Daniel, Ezekiel)

### Priority 2: Specific Date Events
44 verses have specific month/day combinations that need events:
- Exodus 40:2: First month, first day (Tabernacle erected)
- Leviticus 23:34: 7th month, 15th day (Tabernacles)
- Numbers 9:5: First month, 14th day (Passover)
- Many more...

### Priority 3: Genealogy Dates
162 genealogy references need linking:
- Genesis 5 ages (pre-flood patriarchs)
- Genesis 11 ages (post-flood patriarchs)
- Numbers/Joshua/Judges period ages

### Priority 4: Feast/Sabbath Linking
- 172 sabbath references
- 300 feast references
- 22 jubilee references
- These can be linked to calendar patterns rather than specific events

## Resolution Strategy

To resolve the ~3,000 unresolved date references:

1. **Pattern-based resolution**: Sabbaths, new moons, annual feasts - can be calculated
2. **Relative resolution**: References "in the Nth year of X" where X has an event
3. **Anchor resolution**: Work backward from known anchors (eclipses, Assyrian records)
4. **Genealogy resolution**: Chain from Adam through patriarchs

The goal is to enable every date reference in the KJV to link to either:
- A timeline event (for absolute/relative dates)
- A calendar view (for annual patterns)
- Both where applicable
