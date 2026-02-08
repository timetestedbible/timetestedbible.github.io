# Citation Form Analysis

## Regex Patterns

**Josephus Pattern:**
```
(?:Josephus,?\s+)?(Antiquities(?:\s+of\s+the\s+Jews)?|Jewish\s+War|Wars\s+of\s+the\s+Jews|Against\s+Apion|Life(?:\s+of\s+Josephus)?|Ant\.|A\.J\.|B\.J\.|C\.\s*Ap\.?|Vita)\s+(\d+)(?:\.(\d+)(?:\.(\d+))?)?
```

**Philo Pattern:**
```
(?:Philo,?\s+)?(On the Creation|On the Migration of Abraham|...|The Second Festival|...)\s+(\d+)
```
(Where the work names are unique canonical names from PHILO_WORK_MAP values)

## Analysis Table

| # | Citation Text | Matches? | Fix Needed |
|---|---------------|----------|------------|
| 1 | Antiquities of the Jews (Book 18, 1:4) | ❌ NO | Change to: `Antiquities 18.1.4` (remove parenthetical, convert colon to dot) |
| 2 | Antiquities 18.2.2 | ✅ YES | None |
| 3 | Josephus (Antiquities 18.2.2, 18.6.10) | ❌ NO | Split into two: `Josephus Antiquities 18.2.2` and `Josephus Antiquities 18.6.10` |
| 4 | Josephus in Antiquities of the Jews | ❌ NO | No section number (intentional - OK) |
| 5 | Josephus Ant. 15.380 | ✅ YES | None (matches as Ant. abbreviation) |
| 6 | Antiquities of the Jews 15.11.2–3 | ✅ YES* | Matches "Antiquities of the Jews 15.11.2" (range ignored) - OK as-is |
| 7 | Antiquities 17.2.4 | ✅ YES | None |
| 8 | Josephus, Against Apion 2.282 | ✅ YES | None |
| 9 | Josephus, Antiquities of the Jews 13.297 | ✅ YES | None |
| 10 | Jewish War 2.17.8–10 | ✅ YES* | Matches "Jewish War 2.17.8" (range ignored) - OK as-is |
| 11 | Antiquities 13.298 | ✅ YES | Matches as 2-part (book.chapter) |
| 12 | Flavius Josephus, The Jewish War 6.4.5 | ✅ YES* | Matches "Jewish War 6.4.5" (skips "Flavius Josephus, The") - OK as-is |
| 13 | Flavius Josephus, The Jewish War 6.4.8 | ✅ YES* | Matches "Jewish War 6.4.8" (skips "Flavius Josephus, The") - OK as-is |
| 14 | Philo Special Laws II, XXX | ❌ NO | Change to: `Philo The Second Festival 30` (use canonical name, convert Roman numeral) OR add "Special Laws II" variant to regex |
| 15 | On the Special Laws (Book 2, Section XXVIII, 162) | ❌ NO | Change to: `On the Special Laws 162` OR `The Second Festival 162` (simplify, use canonical name) |
| 16 | Antiquities of the Jews (Book 3, Ch 10, Section 6; 3.252 in Whiston's numbering) | ❌ NO | Change to: `Antiquities 3.10.6` (extract from verbose parenthetical) |
| 17 | Antiquities of the Jews (Book 3, Ch 10, Section 5) | ❌ NO | Change to: `Antiquities 3.10.5` (extract from parenthetical) |
| 18 | Josephus, Antiquities 17.6.4 §167 | ✅ YES | Matches (Niese section ref ignored) |
| 19 | Ant. 17.6.5 §168–169 | ✅ YES | Matches (Niese range ignored) |
| 20 | Antiquities 17.8.1 §191; War 1.33.8 §665 | ❌ NO | Split into two: `Antiquities 17.8.1` and `Jewish War 1.33.8` (semicolon separates multiple refs) |
| 21 | Antiquities 14.8.5 | ✅ YES | None |
| 22 | Antiquities 14.9.2 | ✅ YES | None |
| 23 | Antiquities 17.6.1 & War 1.33.1 | ❌ NO | Split into two: `Antiquities 17.6.1` and `Jewish War 1.33.1` (ampersand separates multiple refs) |
| 24 | Antiquities 14.13.3 | ✅ YES | None |
| 25 | Antiquities 14.14.3 | ✅ YES | None |
| 26 | Antiquities 14.14.4 | ✅ YES | None |
| 27 | Antiquities 14.14.5 | ✅ YES | None |
| 28 | Antiquities 20.10.2 | ✅ YES | None |
| 29 | Antiquities of the Jews 14.16.2 | ✅ YES | None |
| 30 | Antiquities of the Jews 18.4.6 | ✅ YES | None |
| 31 | Antiquities 15.3.3 | ✅ YES | None |

## Summary

- **Matches:** 24 citations (77%) - *4 match partially (range/prefix ignored, but citation still links)
- **Doesn't match:** 7 citations (23%)

### Common Issues:

1. **Parenthetical formats** (5 citations): Citations in parentheses like `(Book 18, 1:4)` need to be extracted and converted to standard format. The regex won't match text inside parentheses if the citation format is non-standard.
2. **Multiple references** (3 citations): Citations with commas/semicolons/ampersands separating multiple refs need to be split into separate citations. The regex matches one citation at a time.
3. **Ranges** (2 citations): Citations with en-dash ranges like `15.11.2–3` partially match (matches up to the first number), which is acceptable. The range portion is ignored.
4. **"Flavius" prefix** (2 citations): ✅ Already works - regex skips "Flavius Josephus, " and matches the work name
5. **"The" before work name** (2 citations): ✅ Already works - regex skips "The " and matches "Jewish War"
6. **Philo "Special Laws" variants** (2 citations): Need canonical names ("The Second Festival" instead of "Special Laws II") or add variants to regex. Roman numerals also need conversion.
7. **Roman numerals** (1 citation): Need conversion to Arabic numerals (XXX → 30)
8. **Verbose parentheticals** (2 citations): Need extraction of book.chapter.section from verbose format like `(Book 3, Ch 10, Section 6)`
