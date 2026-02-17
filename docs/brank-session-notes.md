# BibleRank Session Notes — Feb 10-11, 2026

## Where We Started

Designing a system to surface hidden connections in Scripture — starting from a cross-reference summary mockup, evolving through several key insights into a Bible-wide analysis pipeline.

## The Journey of Ideas

### 1. Cross-Reference Summaries → Phrase Links
Started with grouping existing cross-references by theme. Realized the connections aren't verse-to-verse — they're **phrase-to-phrase**. "Birth pains" in Matthew 24 links to "woman in travail" in Jeremiah 50, not the whole verse.

### 2. English → Hebrew
Attempted phrase linking in English, made errors (confused קול "sound" with שׁמועה "rumor" because both can mean "noise" in English). Realized all analysis must happen at the **Hebrew/Greek root level**, not English.

### 3. Word Alignment + TimeTested Translation
If AI is analyzing every Hebrew word anyway, it's essentially translating. Capture that as a **concordance-consistent translation** that preserves symbolic connections other translations obscure (e.g., "birth-pains" not "sorrows").

### 4. Concept Studies Before Per-Verse Processing
Don't study "birth pains" separately for every verse that contains it. Study it **once across ALL occurrences**, with full passage context. Then apply the converged study to every verse. Eliminates redundancy, ensures consistency.

### 5. Symbols as a Language
Symbols aren't just a dictionary — they have grammatical roles (noun/verb/adjective) and combine into "sentences" within passages. The combination of symbols tells you what the passage means at the symbolic level.

### 6. Passage Context is Everything
"Birth pains" in isolation means nothing. "Birth pains in a passage titled 'The oracle concerning Babylon'" means everything. The concept study must include the **block/passage context** for every occurrence, not just the verse.

### 7. Iterative Convergence (PageRank Analogy)
You can't know what "birth pains" means until you know what its co-occurring concepts mean, which you can't know until you know what THEIR passages are about. Meaning resolves through **iteration** — like PageRank. Symbols and phrases are hyperlinks. Meaning flows through the link graph.

### 8. The Matrix
The ultimate data structure: every content word in the Bible connected to every other content word with a weight. Two layers:
- **Layer 1 (root match):** Same Strong's number → flat IDF weight, NO distance penalty
- **Layer 2 (proximity):** Different words near each other → distance-decayed weight, computed on the fly

### 9. The Matthew 24 Test Case
We identified that Matthew 24:6-8 uses Babylon-fall vocabulary (birth pains, earth shaking, rumors, nation against nation). The crowd-sourced cross-references **completely miss** the Jeremiah 50-51 and Isaiah 13 connections. Fresh Opus 4.6 gets close (finds the right verses) but stops at "70 AD" — doesn't follow through to "Babylon the Great."

The full reading: Matthew 24 is structured as an inclusio — opens (v.6-8) and closes (v.29) with Babylon-fall vocabulary. Babylon falls suddenly. The tribulation (v.9-28) is what follows — famine, power vacuum, persecution. "Immediately after" the sun/moon darken from the smoke/fire of the destruction.

## What We Built

### brank/ directory
- `build-histogram.js` — Parses MorphHB (305K OT words) + NT interlinear (138K NT words). Builds frequency histogram. 443K total words, 14K unique Strong's numbers.
- `build-matrix-v3.py` — Builds dense uint8 matrix (171K × 171K, 27.5 GB). Layer 1: same-Strong's connections with flat IDF weight. Layer 3: LXX bridge connections.
- `build-lxx-bridge.py` — Direct Hebrew↔Greek bridge from LXX verse co-occurrence. 295K bridge pairs. No English intermediary. Successfully maps: ילד→τίκτω, גוי→ἔθνος, שׁמשׁ→ἥλιος, חשׁך→σκότος, מלך→βασιλεύς, etc.
- `query-verse.py` — Queries the matrix for a verse's top connections. IDF-weighted scoring with breadth bonus (distinct concept matches).

### LXX Data
- Cloned `eliranwong/LXX-Rahlfs-1935` — 623K Greek words with Strong's numbers + verse boundaries. Direct Hebrew→Greek bridge without English.

## Where We Got Stuck

### The Matrix Alone Doesn't Surface "Babylon"

The mechanical matrix query for Matthew 24:6-8 puts the Babylon oracle verses (Jeremiah 50:43, 51:46, Isaiah 13:8) at ranks 300-600, not top 50. Top results are dominated by generic kingdom/war/nation verses.

**Root cause:** Common words (βασιλεία "kingdom" at 162 occurrences, ἔθνος "nation" at 162) create massive noise through the LXX bridge to hundreds of generic OT verses. Rare specific words (ωδίν "birth pains" at 4 occurrences) have high IDF but connect to very few verses, so their aggregate contribution is small.

**The fundamental issue:** The matrix finds **lexical** connections (shared words). But identifying "Babylon" as the shared topic requires **reading comprehension** — understanding what the connected passages are ABOUT. That's AI's job, not the matrix's job.

## Key Realization: AI For Initial Connections May Be Most Efficient

The matrix approach is trying to mechanically replicate what AI does naturally — reading passages and identifying thematic connections. The matrix CAN surface the right verses (they're at rank 300-600), but with too much noise to be a clean filter.

**It may be more efficient to simply ask AI to identify the verse connections directly.** AI already knows the Bible. Given a verse, it can:
1. Identify the key concepts and their Hebrew/Greek roots
2. Find other passages using the same imagery/vocabulary
3. Read those passages and identify what they're about
4. Produce the connection with the passage-level context ("this is from the oracle concerning Babylon")

The matrix is still valuable as:
- **Validation:** Does the matrix independently confirm what AI identifies?
- **Discovery:** Does the matrix surface connections AI missed?
- **Weighting:** The matrix provides quantitative connection strength that AI's qualitative judgments lack.
- **Exhaustiveness:** The matrix covers every word in the Bible; AI might skip less obvious connections.

The optimal approach may be **AI first, matrix as validation/enrichment:**
1. AI identifies connections for each verse (using its training data + our Hebrew/Greek roots)
2. Matrix independently scores those connections (quantitative confirmation)
3. Matrix surfaces additional connections AI missed (mechanical discovery)
4. Combined result: AI-identified connections weighted by matrix scores

## Design Principles Established

1. **WLC is ground truth.** All analysis at Hebrew/Greek root level, not English.
2. **Blocks, not verses.** The unit of meaning is a passage/block, not an artificial verse division.
3. **Fractal context.** Meaning exists at verse, paragraph, section, book, and Bible level simultaneously.
4. **Don't over-structure meaning.** Encode the graph (what connects to what). Let AI produce the understanding (what it means).
5. **Physical/literal first.** Check what literally happens in every passage before reaching for metaphor. "Sun darkened" = smoke from fire, not "kingdom loses power."
6. **Show your work.** AI must reason through consonantal alternatives and connections explicitly. Forces quality.
7. **Frequency is the filter.** Rare shared roots = strong signal. Common shared roots = noise.
8. **Iterate to converge.** Single-pass misses cross-concept connections. Studies feed into each other.
9. **The tool and AI are partners.** Tool surfaces patterns → AI proposes conclusions → humans verify.
10. **Same root = no distance penalty.** רעש in Genesis and רעש in Revelation are equally connected. Book order is arbitrary.
11. **Proximity computed on the fly.** Don't store distance in the matrix — compute from known positions during PageRank.

## Tunable Parameters (Current Values)
```
FREQUENCY_THRESHOLD = 300    # Strong's with >= this excluded from matrix
PROXIMITY_RADIUS = 500       # max word distance for proximity
PROXIMITY_POWER = 0.5        # decay: 1/d^0.5 (inverse sqrt)
PROXIMITY_WEIGHT_SHARE = 0.3 # 30% proximity, 70% root/bridge in PageRank
PAGERANK_DAMPING = 0.85
PAGERANK_ITERATIONS = 20
```

## Next Session: Options

### Option A: AI-First Approach
Skip the matrix for initial connection identification. Ask AI directly:
- "For Matthew 24:6-8, what OT passages use the same prophetic vocabulary? Cite Hebrew roots."
- Use the matrix to validate and weight the connections AI identifies.
- More expensive per verse but higher precision.

### Option B: Improve the Matrix
- Filter LXX bridge more aggressively (top 3 G-equivalents per H-number only)
- Use only rare query words for scoring (IDF > 0.25 threshold)
- Add proximity layer (not yet implemented in v3)
- Retest Matthew 24

### Option C: Hybrid
- Matrix provides the candidate set (top 200-500 verses)
- AI evaluates the candidate set (reads passages, identifies themes)
- Best of both: mechanical completeness + AI comprehension

### Option D: Start from concept studies
- Use the existing symbol dictionary + AI to identify all recurring concepts
- Study each concept across all occurrences (the iterative approach)
- Use concept studies as the foundation, not the matrix
- Matrix becomes a validation/weighting tool, not the primary discovery mechanism

## Files Created This Session
```
brank/
  build-histogram.js       — word extraction + frequency analysis
  build-matrix.py          — v1 matrix builder (superseded)
  build-matrix-v2.py       — v2 with proximity (superseded)
  build-matrix-v3.py       — v3: clean root+bridge, PageRank with live proximity
  build-lxx-bridge.py      — LXX Hebrew↔Greek bridge from verse co-occurrence
  add-bridge.py            — English-mediated bridge (superseded by LXX)
  add-lxx-bridge.py        — LXX bridge injector (superseded by v3)
  query-verse.py           — verse connection query with IDF scoring
  root-frequency.json      — consonantal root frequencies
  strongs-frequency.json   — Strong's number frequencies
  word-list.json           — all 443K words with positions
  reduced-index.json       — filtered 171K word index
  lxx-bridge.json          — 295K Hebrew↔Greek bridge pairs
  hebrew-greek-bridge.json — English-mediated bridge (superseded)
  matrix.dat               — 27.5 GB dense uint8 matrix
  lxx-source/              — cloned LXX-Rahlfs-1935 repo
  .venv/                   — Python virtual environment

docs/
  verse-pipeline-plan.md   — complete pipeline plan
  
phrase-link-case-study.html — interactive visualization mockup
xref-summary-mockup.html   — original cross-reference summary mockup
```
