# TIPNR Name Enrichment Task

## Objective
Enrich the existing TIPNR (Translators Individualised Proper Names with References) dataset with additional context focusing on **linguistic meaning and symbolic significance** of biblical names.

## Source Data
- **Input:** `/Users/dlarimer/timetested/http/data/tipnr.json` (2,686 entries)
- **Output:** `/Users/dlarimer/timetested/http/data/tipnr-enriched.json`

## What Already Exists (DO NOT REPEAT)
Each TIPNR entry already contains:
- `n`: Name
- `t`: Type (p=person, l=place)
- `b`: Brief description (e.g., "Son of Elimelech")
- `d`: Description (living period, first mention)
- `s`: Summary (family relationships, tribe)
- `f`: Full details (extended family info)

The Strong's dictionary also provides:
- Transliteration
- KJV usage
- Basic derivation

## What To Generate

### Focus Areas (PRIORITIZE)
1. **Linguistic meaning** - Hebrew root meaning, etymology, wordplay
2. **Symbolic significance** - prophetic meaning of the name, how it reflects the person's role or fate
3. **Narrative significance** - brief note on WHY this person matters in the biblical narrative (not WHAT happened - the reader can find that)
4. **Typological connections** - if the person is a type/shadow of Christ or represents a broader theme

### What To MINIMIZE/AVOID
- ❌ Repeating family relationships (already in TIPNR)
- ❌ Listing which verses mention them (already in TIPNR)
- ❌ Summarizing events the reader can read themselves
- ❌ Generic filler like "an important biblical figure"
- ❌ Speculative claims not grounded in text or scholarship

### Target Length
- 40-80 words per entry
- Concise, information-dense

## Output Schema

```json
{
  "H1234": {
    "meaning": "Brief linguistic meaning (Hebrew root, etymology)",
    "significance": "Symbolic/prophetic/typological significance",
    "confidence": "high|medium|low",
    "review": false,
    "review_reason": null
  }
}
```

### Confidence Levels
- **high**: Major biblical figure with clear information
- **medium**: Minor figure but sufficient context available
- **low**: Obscure figure, limited narrative context, or uncertainty

### Review Flags
Flag for review when:
- Figure mentioned only in genealogy lists (no narrative)
- Multiple people share the same name (disambiguation needed)
- Name meaning is debated among scholars
- Model is uncertain about any claim
- TIPNR data appears incomplete or contradictory

## Prompt Template

```
You are a biblical scholar analyzing Hebrew names. Given the existing data about a biblical name, provide ADDITIONAL context focusing on linguistic and symbolic meaning.

EXISTING DATA:
- Strong's Number: {strongs_num}
- Name: {name}
- Transliteration: {xlit}
- Pronunciation: {pron}
- Strong's Definition: {strongs_def}
- Derivation: {derivation}
- TIPNR Brief: {brief}
- TIPNR Description: {description}
- TIPNR Summary: {summary}

INSTRUCTIONS:
1. Focus on the MEANING of the name (Hebrew root, etymology, wordplay)
2. Explain any SYMBOLIC or PROPHETIC significance
3. Note any TYPOLOGICAL connections (types/shadows)
4. DO NOT repeat family relationships or verse references
5. DO NOT summarize events the reader can discover themselves
6. Keep response to 40-80 words
7. Indicate confidence and whether manual review is needed

Respond in JSON format:
{
  "meaning": "...",
  "significance": "...",
  "confidence": "high|medium|low",
  "review": true|false,
  "review_reason": "..." or null
}
```

## Implementation

### Script Location
`/tmp/enrich_tipnr.py`

### Required Environment
- Python 3.x
- `anthropic` Python package
- API key in environment: `ANTHROPIC_API_KEY`

### Batch Processing
- Process in batches of 10-20 entries per API call to reduce overhead
- Save progress incrementally (resume capability)
- Log all flagged entries to separate file for review

### Estimated Resources
- **Model:** Claude Sonnet 4 (`claude-sonnet-4-20250514`)
- **Tokens:** ~750K total
- **Cost:** ~$3-5
- **Time:** 30-60 minutes

## Post-Processing

1. Merge enriched data with existing TIPNR
2. Review flagged entries manually
3. Update `bible-reader.js` to display new fields in Strong's panel
4. Increment service worker cache version

## Execution Command

```bash
cd /Users/dlarimer/timetested
export ANTHROPIC_API_KEY="your-key-here"
python3 /tmp/enrich_tipnr.py
```

## Review Process

After completion:
1. Check `/tmp/tipnr-flagged-for-review.json` for entries needing review
2. Spot-check 10-20 random "high confidence" entries for quality
3. Edit any corrections directly in output file
4. Copy final file to `http/data/tipnr-enriched.json`
