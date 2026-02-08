# Citation Form Analysis - Summary Table

## Regex Patterns

**Josephus:** `(?:Josephus,?\s+)?(Antiquities(?:\s+of\s+the\s+Jews)?|Jewish\s+War|Wars\s+of\s+the\s+Jews|Against\s+Apion|Life(?:\s+of\s+Josephus)?|Ant\.|A\.J\.|B\.J\.|C\.\s*Ap\.?|Vita)\s+(\d+)(?:\.(\d+)(?:\.(\d+))?)?`

**Philo:** `(?:Philo,?\s+)?(On the Creation|On the Migration of Abraham|...|The Second Festival|...)\s+(\d+)`  
(Work names are unique canonical names from PHILO_WORK_MAP values)

## Analysis Table

| Citation | Matches? | Fix Needed |
|----------|----------|------------|
| Antiquities of the Jews (Book 18, 1:4) | ❌ NO | **Markdown:** Change to `Antiquities 18.1.4` (extract from parenthetical, convert colon to dot) |
| Antiquities 18.2.2 | ✅ YES | None |
| Josephus (Antiquities 18.2.2, 18.6.10) | ❌ NO | **Markdown:** Split into two separate citations: `Josephus Antiquities 18.2.2` and `Josephus Antiquities 18.6.10` |
| Josephus in Antiquities of the Jews | ❌ NO | No section number (intentional - OK) |
| Josephus Ant. 15.380 | ✅ YES | None |
| Antiquities of the Jews 15.11.2–3 | ✅ YES* | Matches "15.11.2" (range ignored) - OK as-is |
| Antiquities 17.2.4 | ✅ YES | None |
| Josephus, Against Apion 2.282 | ✅ YES | None |
| Josephus, Antiquities of the Jews 13.297 | ✅ YES | None |
| Jewish War 2.17.8–10 | ✅ YES* | Matches "2.17.8" (range ignored) - OK as-is |
| Antiquities 13.298 | ✅ YES | None |
| Flavius Josephus, The Jewish War 6.4.5 | ✅ YES* | Matches "Jewish War 6.4.5" (skips prefix) - OK as-is |
| Flavius Josephus, The Jewish War 6.4.8 | ✅ YES* | Matches "Jewish War 6.4.8" (skips prefix) - OK as-is |
| Philo Special Laws II, XXX | ❌ NO | **Markdown:** Change to `Philo The Second Festival 30` (use canonical name, convert Roman numeral) OR **Regex:** Add "Special Laws II" variant |
| On the Special Laws (Book 2, Section XXVIII, 162) | ❌ NO | **Markdown:** Change to `The Second Festival 162` (use canonical name, extract from parenthetical) |
| Antiquities of the Jews (Book 3, Ch 10, Section 6; 3.252 in Whiston's numbering) | ❌ NO | **Markdown:** Change to `Antiquities 3.10.6` (extract from verbose parenthetical) |
| Antiquities of the Jews (Book 3, Ch 10, Section 5) | ❌ NO | **Markdown:** Change to `Antiquities 3.10.5` (extract from parenthetical) |
| Josephus, Antiquities 17.6.4 §167 | ✅ YES | Matches (Niese ref ignored) |
| Ant. 17.6.5 §168–169 | ✅ YES | Matches (Niese range ignored) |
| Antiquities 17.8.1 §191; War 1.33.8 §665 | ❌ NO | **Markdown:** Split into two: `Antiquities 17.8.1` and `Jewish War 1.33.8` |
| Antiquities 14.8.5 | ✅ YES | None |
| Antiquities 14.9.2 | ✅ YES | None |
| Antiquities 17.6.1 & War 1.33.1 | ❌ NO | **Markdown:** Split into two: `Antiquities 17.6.1` and `Jewish War 1.33.1` |
| Antiquities 14.13.3 | ✅ YES | None |
| Antiquities 14.14.3 | ✅ YES | None |
| Antiquities 14.14.4 | ✅ YES | None |
| Antiquities 14.14.5 | ✅ YES | None |
| Antiquities 20.10.2 | ✅ YES | None |
| Antiquities of the Jews 14.16.2 | ✅ YES | None |
| Antiquities of the Jews 18.4.6 | ✅ YES | None |
| Antiquities 15.3.3 | ✅ YES | None |

## Summary

- **Matches:** 24 citations (77%) - *4 match partially (range/prefix ignored, but citation still links correctly)
- **Doesn't match:** 7 citations (23%)

### Issues Requiring Fixes:

1. **Parenthetical formats** (5 citations): Extract citation from parentheses and convert to standard format
2. **Multiple references** (3 citations): Split into separate citations (comma/semicolon/ampersand separated)
3. **Philo "Special Laws" variants** (2 citations): Use canonical names ("The Second Festival" instead of "Special Laws II") or add variants to regex
4. **Roman numerals** (1 citation): Convert to Arabic numerals (XXX → 30)

### Already Working:

- ✅ Ranges (en-dash): Regex matches up to first number, which is acceptable
- ✅ "Flavius" prefix: Regex skips it automatically
- ✅ "The" before work name: Regex skips it automatically
- ✅ Niese section markers (§): Regex ignores them
