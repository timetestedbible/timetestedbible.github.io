# Verse Pipeline Plan — Deep Scripture Analysis

## The Goal

Discover the hidden connections in Scripture that reveal its deeper meaning. Surface them so users can quickly get the big picture and then see the evidence. The tool helps humans discover patterns. If the tool is good at that, AI can use the same data to see patterns. AI proposes conclusions with evidence. Humans verify. The feedback loop improves everything.

## The Key Insight

Symbols and recurring phrases in Scripture function like hyperlinks. They connect passages to each other, and meaning flows through the connections. A concept's meaning isn't defined by a dictionary — it's defined by the passages it appears in and the other concepts it co-occurs with.

But you can't expand the whole graph. If you follow every connection from every word, you reach all of Scripture in 2-3 hops and drown in noise. The matrix approach (brank/) proved this — 171K words × 171K words = 27.5 GB of mostly noise.

**The solution: symbols are compressed subgraph summaries.** A symbol study takes all the passages reachable from one word/phrase, compresses them into a dense bag of context notes, and carries that context forward. When you load 5 symbol studies into a verse analysis, you're effectively seeing the graph from 5 directions — without traversing it. The symbol *is* the compression.

This means the pipeline doesn't need a giant matrix. It needs:
1. A way to identify which words/phrases are meaningful symbols
2. A rich study for each symbol (the compressed subgraph)
3. An iterative process where studies feed into each other until they stabilize

---

## The Prophetic Roadmap — What Are We Resolving?

Before analyzing individual verses, the pipeline needs to know what BIG-PICTURE QUESTIONS it's trying to answer. Scripture describes several major prophetic events/concepts. Each individual verse analysis and symbol study is gathering evidence that helps resolve THESE:

### The Major Prophetic Events

| # | Event/Concept | Key Question |
|---|---------------|-------------|
| 1 | **The Rapture / Gathering** | What is it? When does it happen relative to the other events? Who is gathered? |
| 2 | **The Return of Christ** | Literal, physical return? When? What does it look like? What triggers it? |
| 3 | **The Fall of Babylon the Great** | What IS Babylon the Great? A city? A system? When does it fall? How? What are the warning signs? |
| 4 | **Sudden Destruction** | What is suddenly destroyed? How does it relate to "birth pains" and "no escape"? |
| 5 | **Days of Noah** | First by water, then by fire. What is the scale? What parallels exist between the flood and the future destruction? |
| 6 | **Return After 3 Days** | The resurrection pattern. Does it operate at multiple scales (personal, national, cosmic)? |
| 7 | **A Day as 1000 Years** | Prophetic time scale (2 Pet 3:8). How does this affect the reading of "days," "the third day," etc.? |

These are not interpretations — they are the OPEN QUESTIONS that Scripture raises and that the symbol studies should help resolve. Every verse analysis should ask: **which of these events does this passage illuminate? What does it tell us about the timing, nature, sequence, or participants?**

### How the Roadmap Guides the Pipeline

**Bottom-up:** Symbol studies and verse analyses gather evidence from individual passages.

**Top-down:** The prophetic roadmap tells us what the evidence is FOR. When 8 symbols in Matthew 24 all point to Babylon-fall vocabulary, the roadmap says: this is evidence about Event #3 (Fall of Babylon the Great) and Event #4 (Sudden Destruction). When unfulfilled elements remain (return, gathering, cosmic signs), the roadmap says: those are Events #1 and #2, and they haven't been resolved yet.

**The pipeline's job is to resolve these events** — determine what they literally are, when they happen, how they relate to each other, and what the symbols connecting them reveal. Each verse we study is a piece of that puzzle. The symbol connections between verses are what snap the pieces together.

Without this roadmap, the pipeline grabs the nearest historical match for a slice of text and declares it done. WITH the roadmap, every analysis asks: does this resolve any of the open questions? What remains unresolved? Where should we look next?

---

## User Experience (What the Reader Sees)

Three layers, most accessible to deepest:

### Layer 1: Pattern Summary
A plain-language observation the reader absorbs in seconds.
> "8 of 10 connected passages come from oracles concerning Babylon (Isaiah 13, Jeremiah 50-51). Birth pains, earth shaking, and celestial darkening are the consistent vocabulary of Babylon's fall."

Not interpretation — describing what the cross-reference data shows. The reader draws their own conclusion.

### Layer 2: Grouped Phrase Links
Cross-references organized by concept, weighted by confidence. Expand any group to see linked passages with the connecting phrase highlighted.

### Layer 3: Inline Exploration
Hover over any word to see: Hebrew/Greek roots, semantic family, every passage sharing that concept, how each translation renders this root, the TimeTested Translation's consistent rendering.

---

## Architecture Overview

### Symbols Are Compressed Subgraphs

The fundamental data unit is the **symbol study** — not a word, not a verse, not a matrix cell. Each symbol study compresses the meaning of every passage that symbol appears in. Think of it as a lossy summary of one branch of Scripture's connection graph.

When multiple symbols in a verse independently point to the same subject (e.g., "birth pains," "nation against nation," and "earth shaken" all pointing to Babylon oracles), that convergence is high-confidence signal. No matrix required — the compressed contexts do the work.

### Don't Over-Structure — Let AI Think in Bags of Words

Previous attempts to build rigid semantic schemas failed. Weighted matrices full of numbers lost the meaning. The revised approach:

**What we structure:**
- Which symbols exist (words, phrases, Strong's numbers)
- Where they appear (which verses, which paragraphs)
- The symbol study metadata (part of speech, context types, co-occurring symbols, defining verses)

**What stays as free-form compressed notes:**
- What a symbol means in various contexts
- How passages connect to each other
- What pattern a cluster of symbols reveals
- The verse/section-level "context integration notes"

AI represents ideas as collections of words. We leverage that. The "bag of context notes" for a symbol is dense, compressed hints — not polished prose. It's optimized for AI to read in the next round, not for humans to read (that comes at the end).

---

## The Symbol Study — Core Data Structure

Each symbol (word or phrase) gets a study containing:

### Structured Fields
| Field | Purpose |
|-------|---------|
| **word/phrase** | The symbol text and its variants |
| **strongs** | Hebrew/Greek Strong's numbers |
| **part_of_speech_role** | noun-symbol (a thing), verb-symbol (an action), adjective-symbol (a quality) |
| **context_types** | The kinds of passages it appears in: prophetic oracle, narrative, law, wisdom, lament, apocalyptic, etc. |
| **co_occurring_symbols** | Which other known symbols repeatedly appear near this one |
| **defining_verses** | The ~7 verses that best establish what this symbol means |
| **compressed_meaning** | 1-word / 2-word / sentence summary |
| **opposite** | The antonym symbol |

### Free-Form Context Bag
A dense block of compressed notes covering:
- How the symbol is used in each major context type
- What literal/physical scenarios it appears in
- What other symbols cluster around it in each context
- Observations about patterns across occurrences
- Anomalies — passages where it doesn't fit the dominant pattern
- Cross-testament connections (Hebrew root → Greek equivalent via LXX)

**This is NOT a polished explanation.** It's compressed hints — shorthand that an AI can unpack in the next round. Think margin notes, not a textbook.

### Relationship to Existing Symbol Studies

The current `symbols/*.md` studies (SHEPHERD, SHEEP, GOAT, etc.) already have the right instinct: argument, proof texts, substitution tests, connections. The new format adds:
- **Context types** (missing from current studies)
- **Co-occurring symbols** (partially present as "Connection to Other Symbols")
- **The free-form context bag** (the current studies are too polished — we need the dense compressed version too)

The existing dictionary (`symbol-dictionary.js`) stores the final compressed meaning. The study stores the full context that produced that meaning.

---

## The Iterative Pipeline

### Phase 1: Symbol Identification

Pick a verse (or paragraph — the natural thought unit).

**Step 1a — Match known symbols.** Scan against the symbol dictionary (~47 entries and growing). Every known symbol in the passage gets its existing study loaded.

**Step 1b — AI identifies new candidates.** For words and phrases NOT in the dictionary, AI evaluates:
- Does this word carry weight beyond its literal meaning?
- Is it part of a recurring prophetic/poetic vocabulary?
- Does it form part of a multi-word phrase that functions as a unit? (e.g., "birth pains," "nation against nation," "thus says YHWH")
- Is it a structural pattern? ("X against X," "in a moment," "come out of")

Not every word is a symbol. "And," "the," "said" are glue. AI's job is to distinguish load-bearing words from scaffolding.

**Step 1c — Quick triage.** For each new candidate: is it worth a full study, or is it just a common word in an uncommon context? Threshold: does it appear in 3+ passages with apparent symbolic weight?

### Phase 2: Initial Symbol Studies (Round 1)

For each symbol that needs a study (new candidates from 1b, or known symbols that need enrichment):

1. **Search all Scripture** for passages containing this word/phrase (by Strong's number and English variants)
2. **Read each passage in its paragraph context** — not just the verse, but the coherent thought unit around it
3. **Compress into the context bag**: for each occurrence, note the context type, what's happening literally, what other symbols are present, what the passage header says (if prophetic)
4. **Identify the ~7 defining verses** — the passages that most clearly establish this symbol's meaning
5. **Note the part-of-speech role and co-occurring symbols**
6. **Produce the compressed meaning** — 1-word / 2-word / sentence

This is the expensive round. Every symbol needs its full Scripture search. But each symbol is studied ONCE and reused everywhere.

### Phase 3: Verse Context Integration (Round 1)

Now that every symbol in a passage has a study, bring them all together.

For a paragraph of Matthew 24 (say, vv. 6-8):

1. **Load all symbol studies**: birth pains, nation-against-nation, earth-shaken, rumors, fear/alarm
2. **Each study brings its context cloud**: birth pains brings Jer 50:43, Jer 30:6; earth-shaken brings Jer 50:46, Isa 13:13; etc.
3. **Generate "context integration notes"**: dense, compressed observations about what happens when all these context clouds overlap

The output is NOT a polished summary. It's maybe 3 paragraphs of dense notes for 1 paragraph of Scripture. Something like:

> `birth-pains + earth-shaken + nation-v-nation: 5/6 co-occurrences in Babylon oracles (Jer 50-51, Isa 13). birth-pains specifically applied to king of Babylon (Jer 50:43). rumors cluster: Jer 51:46 "rumor heard in the land" + "ruler against ruler" directly parallels Mat 24:6-7. fear-response vocabulary: θροεω (Mat) || לבב+ירא (Jer 51) || רפה+צרה (Jer 50) || ירקון (Jer 30) — four different words, one concept. inclusio note: celestial darkening at v.29 matches Isa 13:10 exactly, bookends the discourse. all symbols independently converge → Babylon-fall vocabulary cluster.`

These notes are the **compressed context** for Matthew 24:6-8. They carry the meaning forward.

### Phase 4: Iterative Refinement (Rounds 2-N)

**Round 2**: Re-study symbols, but now with richer input.

In Round 1, a symbol study for "birth pains" was built from raw verses. Now in Round 2, it can incorporate the *context integration notes* from every passage where "birth pains" appears. Instead of just knowing "Jer 50:43 mentions birth pains," the study now knows "Jer 50:43's context integration notes show that birth-pains + rumors + fear all converge on Babylon's king receiving news of attack."

This is the depth-first-search insight: **each verse's context notes summarize what the graph looks like from that verse outward.** Loading them into a symbol study is like traversing the graph one more hop — but via compressed summaries instead of raw expansion.

**Convergence tracking**: After each round, measure how much "new insight" was gained:
- Did any symbol's compressed meaning change?
- Did any verse's context integration notes change significantly?
- Did new co-occurring symbol relationships emerge?

If a symbol's study changed, every verse that uses that symbol needs re-evaluation (the PageRank analogy — propagate the update). But each round is cheaper because most things stabilize quickly.

**Typical convergence**: 3-5 rounds. Round 1 is expensive (full Scripture searches). Rounds 2+ only process changes. The long tail of stabilization is cheap.

### Phase 5: The Grand Finale

Once all context bags have stabilized — every symbol studied, every verse expanded, every round converged — the compressed notes represent a **rich, interconnected understanding** of every passage.

Now, and only now, do we produce human-readable output. Every symbol study and every verse/paragraph study gets rendered into **three tiers**:

#### Tier 1: Title
A single line — a hook that captures the core insight. This is what the reader sees first.

**For a symbol:**
> **BIRTH PAINS — The Onset of Babylon's Judgment**

**For a verse/paragraph:**
> **Matthew 24:6-8 — Jesus Opens the Olivet Discourse in Babylon-Fall Vocabulary**

The title must be specific, not generic. "Birth Pains — Suffering" is useless. "Birth Pains — The Onset of Babylon's Judgment" tells you something you didn't know.

#### Tier 2: Brief Paragraph
3-5 sentences. The reader absorbs the key insight in 15 seconds. No fluff, no filler. Every sentence carries new information.

**For a symbol:**
> Birth pains in Scripture are consistently applied to the entity being judged, not to the righteous. In 5 of 7 occurrences, the one experiencing the pains is Babylon or a Babylon-type power (Jer 50:43, Jer 30:6, Mic 4:9-10, 1 Thes 5:3, Mat 24:8). The pains mark the ONSET of judgment — the point where the power realizes its destruction has begun. Jesus's use in Matthew 24:8 ("the beginning of the birth pains") places the Olivet Discourse in this same vocabulary cluster. The birth pains are not general suffering — they are the specific agony of a system collapsing.

**For a verse/paragraph:**
> Every symbol in Matthew 24:6-8 independently traces to the Old Testament's Babylon-fall oracles. "Birth pains" → Jer 50:43 (applied to Babylon's king). "Nation against nation" → Jer 51:46 ("ruler against ruler" in the Babylon oracle). "Earthquakes" → Jer 50:46 ("the earth is shaken" at Babylon's fall) and Isa 13:13. "Rumors of wars" → Jer 51:46 ("rumor heard in the land"). Even "do not be alarmed" parallels Jer 51:46 ("do not be afraid"). The convergence is 5 for 5 — not one or two shared words, but the entire vocabulary cluster. Jesus opens the Olivet Discourse by quoting the Babylon-fall playbook.

#### Tier 3: Long-Form Blog
A full-length article (500-2000 words) that walks the reader through the evidence step by step. This is the documented trail of logic — readable by a curious layperson, rigorous enough for a scholar.

Structure for a **symbol blog**:
1. **The question** — what does this word actually mean across Scripture?
2. **The occurrences** — where it appears, organized by context type
3. **The pattern** — what clusters emerge, what subject dominates
4. **The defining verses** — the ~7 passages that anchor the meaning, with brief explanation of each
5. **The connections** — what other symbols co-occur, and what that implies
6. **The cross-language evidence** — Hebrew root, LXX Greek choice, NT usage
7. **The conclusion** — the compressed meaning, stated plainly, with the evidence trail visible

Structure for a **verse/paragraph blog**:
1. **The passage** — the text itself (TimeTested Translation if available)
2. **The symbols identified** — each with its one-line meaning
3. **The convergence** — where do the symbol studies overlap? What subject emerges?
4. **The structural evidence** — parallels with other passages, inclusio patterns, sequence matches
5. **The connections the data reveals** — grouped phrase links (as in the case study mockup)
6. **The historical cycle** — which pattern is being invoked? What prior event defines it?
7. **What's hidden** — connections that are invisible in English, conspicuous absences, incidental imports
8. **The big picture** — one paragraph stating what this passage is about, with confidence level

**The blog is evidence-first.** It doesn't argue a position — it shows what the data shows. "5 of 5 symbols trace to Babylon oracles" is a factual observation. The reader draws the conclusion. Every claim links to a specific verse, a specific Hebrew/Greek root, or a specific symbol study. Nothing is asserted without a trail.

#### Additional Grand Finale Outputs

In addition to the three-tier studies:

5. **Phrase Link Maps**: Organize the symbol connections into grouped, weighted cross-references. The case study HTML mockup shows the target format. Each link traceable to a specific root and passage.

6. **TimeTested Translation**: With converged symbol studies, produce concordance-consistent English renderings. Same root → same English word family. Connections invisible in other translations become visible.

7. **Concordance**: Root → consistent English rendering, across all of Scripture.

The Grand Finale is the cheap part. All the hard work (identification, studies, iteration) already happened. This is just organizing what's already known into human-friendly form.

---

## Prompt Templates & Note-Taking Patterns

### Design Principle: Reference, Don't Quote

LLMs have the Bible memorized. Context files should NEVER quote scripture — just cite references. "Jer 50:43" is enough; the model recalls the text. This means 500 words of notes are pure observation and annotation, not wasted on quotation.

### Design Principle: Nothing Is Accidental

Scripture is maximally compressed text. In an era when copying a scroll cost months of labor, every word earned its place. There are no throwaway details, no filler, no idle remarks.

When a detail seems "random" or disconnected from the surrounding narrative, that is a SIGNAL, not noise. It means the author is embedding a context clue — a pointer to something the reader is expected to recognize:

- **Temporal markers**: "unleavened bread" = Passover season. "grape harvest" = Sukkot. "barley harvest" = Firstfruits. These aren't setting atmosphere — they're linking the event to a specific feast, and everything that feast represents.
- **Geographic markers**: "on the road to Ephrath" = where Rachel died in childbirth. "the oaks of Mamre" = where Abraham received the covenant promise. Place names carry the weight of what happened there before.
- **Material details**: "a linen garment" (priestly), "scarlet thread" (Rahab/Tamar), "a stone pillow" (Jacob's altar). The material connects to a symbolic vocabulary.
- **Numerical details**: "seven days," "forty years," "twelve stones" — these are never arbitrary counts.
- **Seemingly redundant details**: "and he was eating" or "it was night" — if the narrative didn't need it, why include it? Because it connects to something.

The principle: **if a detail seems out of place, ask "what context does this import?"** It's either a timestamp (feast/season), a location echo (what happened here before), a symbolic object (connecting to a known symbol), or a structural marker (beginning/end of a pattern).

This is one of the most productive sources of connections — and one that mechanical word-matching completely misses.

### Design Principle: Literal → Symbols → Literal

Scripture's flow is: **literal stories and events** are connected through **symbolic words and patterns** which produce a **literal and practical expectation** of what will happen in the real world and how we should live.

```
LITERAL EVENT (past)  ──[symbols bridge]──→  LITERAL EXPECTATION (future/practical)

Past events that          Recurring words,        What will literally happen,
actually happened    ──→  phrases, patterns  ──→  how to live, what to expect,
                          that connect them        what to DO
```

Symbols are the BRIDGE between concrete realities, not the destination. The destination is always concrete and practical. A person reading a passage should walk away knowing:
- What literally happened in the past events the symbols point to
- What will literally happen based on the pattern
- What to DO about it — concrete, actionable instruction

**The anti-pattern to avoid:** Treating symbols as the endpoint. Theological abstractions that explain nothing actionable. A farmer in the original audience couldn't act on "covenant dissolution vocabulary." They need to know: what is going to happen, what does the pattern from the past tell me, and what should I DO?

**Every analysis must end with the concrete:**
1. What literally happened (or will happen) in the real world?
2. What should a person DO in response?
3. How does this apply to how we live?

The symbolic connections are the evidence trail — they show WHY we can be confident about the literal expectation. "Birth pains" connecting to Jer 50:43 isn't interesting because of the linguistic link. It's interesting because it tells you: **the thing that happened to Babylon is about to happen here, and these are the warning signs.** That's the payoff. The symbols serve the concrete meaning, not the other way around.

### Design Principle: Honestly Evaluate Fulfillment

When a passage is connected to a historical event (past or proposed), the analysis MUST critically check: **which elements were literally fulfilled, and which were NOT?**

Do not adopt any historical identification uncritically — including popular ones like 70 AD, end-times, or any other traditional framework. For EACH element in the passage:
- Was this literally fulfilled? When, where, how? Cite the evidence.
- Was this NOT fulfilled? Say so plainly. Don't hand-wave or spiritualize away the gap.
- COULD this have been fulfilled in the proposed timeframe? Or is it physically impossible?

If some elements fit a proposed fulfillment and others do not, that's the most important finding. The unfulfilled elements are what drive the analysis forward — they point to something the initial reading missed.

**The anti-pattern:** Finding a historical event that matches 60% of the passage and declaring it "fulfilled" while ignoring the other 40%. That's confirmation bias, not analysis. If the sun didn't literally darken in 70 AD, say so. If "all tribes of the earth" didn't mourn visibly, say so. The gaps are the signal.

**Patterns have multiple instances — and NONE may be the complete fulfillment.** A passage may describe a pattern that partially occurred in Babylon's fall, partially in 586 BC, partially in 70 AD, and extends to something still future. The analysis should map EACH element to EVERY known instance — and honestly note what remains unfulfilled across ALL of them.

**The scope must match the prophecy.** If you're analyzing a slice of a larger discourse, you MUST note what the FULL discourse promises — not just the section you're looking at. You cannot declare "fulfilled" on a slice while ignoring unfulfilled elements in the same prophecy. The unfulfilled elements of the broader prophecy constrain the interpretation of the fulfilled elements.

### Design Principle: Symbols Have Who, What, Why, Where, and WHEN

Every symbol study must address all dimensions:
- **WHO** — who is the symbol applied to in each occurrence?
- **WHAT** — what literally happens?
- **WHY** — what cause produces this?
- **WHERE** — what location/context?
- **WHEN** — this is critical. The SAME symbol may appear in multiple historical eras. Track EVERY era where the pattern occurs. Do not collapse them into one.

The "when" dimension forces the analysis to track MULTIPLE fulfillment windows and NOT collapse everything into a single historical event. If a symbol's context bag shows occurrences across several eras, the pattern is RECURRING — and any proposed fulfillment must account for ALL elements of the prophecy, not just the ones that conveniently fit one era.

### Design Principle: Pattern Is Prophecy

"What has been will be again, what has been done will be done again; there is nothing new under the sun." (Ecc 1:9)

Scripture treats history as cyclical. Events aren't one-off occurrences — they're instances of recurring patterns. The pattern itself is the prophecy. This has direct implications for analysis:

**History rhymes.** The same structural pattern repeats across different eras:
- Bondage → cry out → deliverer → liberation → wilderness → promised land
- This pattern plays out in Egypt/Exodus, Babylon/Return, and the prophets project it forward
- When a prophet uses Exodus vocabulary, they're not being poetic — they're saying "this pattern is happening again"

**Typology is the mechanism.** A "type" is a prior instance of a pattern. The prior event DEFINES what the prophecy means:
- The Passover lamb isn't a metaphor for Jesus — Jesus is the next iteration of the Passover pattern
- Babylon's fall in Jeremiah isn't a metaphor for some future event — it's an instance of the "corrupt system falls" pattern, and every future instance will look like this
- The Exodus isn't a metaphor for salvation — salvation IS exodus, every time

**For symbol studies this means:** When a symbol appears in a historical narrative AND in prophecy, the historical usage isn't backstory — it's the DEFINITION. The pattern in the history IS the content of the prophecy. Note which historical cycle a symbol belongs to and where in the cycle it appears.

**For context integration this means:** When a prophetic passage uses vocabulary from a specific historical event, it's not borrowing imagery — it's declaring "this pattern repeats." The connection between Mat 24 and the Babylon oracles isn't "Jesus is using similar language." It's "Jesus is identifying the same pattern recurring."

The agents should actively look for: which known historical cycle does this passage's vocabulary map to? Egypt/Exodus? Babylon/Exile? Conquest? Creation? The cycle identification often IS the interpretation.

### Design Principle: Fresh Eyes, No Tradition — Triple-Language Analysis

Do NOT rely on traditional commentary, church fathers, or received interpretations. Approach every passage as if reading it for the first time, letting the text's own internal connections speak. "What does tradition say this means?" is irrelevant. "What does the text connect to?" is everything.

**Why this matters:** Traditional readings often became fixed centuries after the text was written, filtered through Greek philosophy, Latin theology, or denominational agendas. The text itself predates all of those. Let the connections in the text override the assumptions of the reader.

**Triple-language analysis is mandatory.** For every passage, consider the Hebrew (MT), the Greek Septuagint (LXX), and the Greek NT together — not as three "versions" but as three windows into the same meaning:

- **Hebrew (MT)**: The consonantal roots, the wordplay, the sound patterns. Hebrew puns and root connections are invisible in any translation.
- **Septuagint (LXX)**: How the pre-Christian Jewish scholars understood the Hebrew. Their Greek word choices are interpretive decisions that reveal meaning — and sometimes expose connections the Hebrew alone doesn't surface.
- **Greek NT**: When NT authors quote the OT, do they follow the LXX or translate directly from Hebrew? The choice itself is significant. And the Greek word chosen sometimes creates a bridge to a different Hebrew word than expected.

**Example — the golden calf at the banquet of wine:**
The LXX rendering of key Exodus passages uses vocabulary that connects the golden calf incident to feasting/banqueting imagery in ways that the Hebrew→English pipeline alone obscures. The Greek word choices link the calf worship to the "banquet" concept, tying it to prophetic passages about false worship feasts. An English-only or Hebrew-only analysis misses this entirely — it's only visible when you see which Greek word the LXX translators chose and where else that Greek word appears.

**For symbol studies:** Every occurrence should be checked in all available languages. A Hebrew root study that ignores the LXX Greek equivalent will miss cross-testament connections. A Greek NT study that ignores the underlying Hebrew concept will miss OT echoes. The three languages form a triangulation — when all three point to the same connection, confidence is highest.

**For context integration:** When noting co-occurring symbols and structural parallels, check whether the connection is visible in Hebrew, Greek, or both. Connections visible in multiple languages are stronger. Connections visible in only one language (especially when lost in English) are often the most *interesting* — they're the ones traditional commentary missed.

### Prompt A: Symbol Identification

Given a paragraph of scripture, identify load-bearing words and phrases.

```
INPUT:
- The paragraph text (with verse numbers)
- The known symbol list (word → meaning, one line each)

TASK:
Read this paragraph. For each word or phrase, decide: is this carrying symbolic/thematic
weight, or is it scaffolding (grammar, connectives, common verbs)?

OUTPUT — list each symbol found:
  KNOWN: {word} → {symbol-name} (already in dictionary)
  NEW:   {word/phrase} — {why it might be symbolic: appears in prophetic vocabulary,
         forms a recurring pattern, etc.}
  SKIP:  (do not list scaffolding words — only list if borderline and you're explaining
         why you're skipping it)

For multi-word phrases: identify the phrase as a unit if it functions as one.
  "nation against nation" = structural pattern, not three separate words.
  "birth pains" = compound concept, not "birth" + "pains".

THRESHOLD: Would studying this word across all of Scripture reveal a pattern?
  If yes → list it. If no → it's scaffolding.
```

### Prompt B: Symbol Study (Round 1)

Given a word/phrase and its Strong's numbers, produce a compressed symbol study.

```
INPUT:
- The symbol: {word/phrase}
- Strong's numbers: {H/G numbers}
- Known occurrences: {list of verse references where this word appears}
  (You know these verses from memory — recall them, don't need them quoted.)
- Existing symbol dictionary entry (if any): {meaning, opposite}
- Related existing symbol studies (if any): {loaded context bags}

YOU HAVE TOOLS: grep KJV/ASV/LXX, look up Strong's, search MorphHB.
Use them. Don't rely solely on memory — VERIFY with searches.
If you notice a pattern, follow it. Search for related roots, check
the LXX translation choice, look at surrounding verses. Your research
is not limited to the inputs above.

TASK — FOLLOW THIS PROCESS IN ORDER:

STEP 1: EXHAUSTIVE SEARCH by Strong's numbers (not English words — English misses
  translation variants). Count total occurrences. Find: definitional ("X IS Y"),
  antithetical (contrasted with opposite), functional (what it DOES), behavioral
  (commands to "walk in X"), who it's applied to (God? humans? both?).

STEP 2: GENERATE 7+ CANDIDATES before evaluating. Write each down.
  Assume #1 is WRONG → #2. Assume #2 is WRONG → #3. Continue to 7+.
  REJECT dictionary synonyms (would a secular reader arrive at this meaning?).

STEP 3: SUBSTITUTION TEST each candidate in 5+ diverse verses.
  Write before/after. Must work in EVERY context (Genesis AND Revelation,
  narrative AND prophetic AND wisdom). Fails in ANY = wrong.

STEP 4: RESOLVE SYMBOLIC RECURSION to concrete concepts.
  If meaning contains another symbol, trace the chain until it terminates.

STEP 5: ADDITIONAL TESTS — production chain (how is it physically made?),
  legal redundancy (Torah contradiction?), opposite pairing, parable contexts,
  who is it applied to, WHEN does it appear (track every historical era).

STEP 6: FOR EACH OCCURRENCE, note (compressed):
1. SUBJECT — What is the passage about?
2. LITERAL SCENE — What is physically happening?
3. CO-OCCURRING SYMBOLS — What known symbols appear nearby?
4. ROLE — Subject, action, or descriptor?
5. CONTEXT TYPE — prophetic oracle, narrative, law, wisdom, psalm, apocalyptic, discourse
6. PASSAGE HEADER — If prophetic, what does the oracle header say?
7. SPEAKER — Who is speaking? YHWH, prophet, Jesus, narrator?
8. INCIDENTAL DETAILS — What "random" details surround this symbol in each passage?
   Scripture is maximally compressed — nothing is accidental. Note:
   - Temporal clues: feasts, seasons, times of day (→ symbolic calendar)
   - Geographic clues: place names carry echoes of prior events there
   - Material objects: clothing, food, tools (→ symbolic vocabulary)
   - Numbers: counts, measures, durations (→ structural patterns)
   Ask: "Why is THIS detail mentioned here? What context does it import?"
   e.g., "Mat 26:17 — 'first day of unleavened bread' = Passover = Exodus liberation.
          Jesus as Passover lamb is not metaphor — it's the feast's literal function."

AFTER ALL OCCURRENCES, NOTE:
- CLUSTER: Do occurrences cluster around a particular subject? (e.g., "5/7 in Babylon contexts")
- CONSISTENT READING: What meaning fits ALL occurrences? (physical/literal first)
- ANOMALIES: Which occurrences don't fit? Why?
- CROSS-TESTAMENT: Hebrew root → Greek equivalent (via LXX or NT usage)?
- TRIPLE-LANGUAGE CHECK: For key occurrences, what does each language reveal?
  - Hebrew (MT): consonantal root, wordplay, sound connections
  - LXX Greek: what word did the translators choose? Where else does that Greek word appear?
  - NT Greek: when quoting/echoing this passage, which Greek word is used?
  Connections visible in only one language are often the most valuable — they're
  what English-only analysis and traditional commentary missed.
  e.g., "LXX uses [Greek word] for [Hebrew word] in Ex passage, same Greek word
         appears in Rev passage — invisible connection in English."
- IGNORE TRADITION: Do not import traditional theological interpretations.
  Note what the TEXT connects to, not what commentaries say it means.
  If your analysis contradicts a traditional reading, that's fine — follow the text.
- HISTORICAL CYCLE: Does this symbol belong to a recurring pattern?
  Known cycles: Creation, Flood, Egypt/Exodus, Wilderness, Conquest,
  Judges cycle, Kingdom/Division, Babylon/Exile, Return, Rome.
  Which cycle(s) does this symbol appear in? Where in the cycle?
  e.g., "birth-pains: appears in Babylon/Exile cycle (judgment phase)
         and Exodus cycle (deliverance phase — Ex 1-2 Hebrew women).
         Same symbol, different position in the cycle."
  The historical instance DEFINES the pattern. Prophetic usage says "again."

OUTPUT FORMAT:
Use the symbol study file format (YAML frontmatter + context bag).
Keep context bag under 500 words. Compress aggressively — every word must earn its place.
Cite verses by reference only (e.g., "Jer 50:43") — never quote the text.
```

### Prompt C: Verse Context Integration

Given a paragraph and all its symbol studies, produce context integration notes.

```
INPUT:
- The paragraph: {book chapter:verse-verse} (recall from memory)
- Symbol studies loaded: {each symbol's context bag, ~500 words each}
- For each symbol, its top verse contexts if available: {context files from depends_on}

YOU HAVE TOOLS: grep KJV/ASV/LXX, look up Strong's, search MorphHB.
Use them freely. If a symbol study mentions a verse you want to check,
look it up. If you notice a word that isn't in the symbol list but
seems important, search for it. If the passage boundary feels wrong
(thought continues past the range, or two thoughts in one range),
say so and adjust.

You may also discover NEW symbols during integration that weren't
in the original identification. Flag them for study: NEW_SYMBOL: {word} — {reason}

TASK:
Read the paragraph. You have each symbol's full context — where else it appears,
what subjects it clusters around, what other symbols it co-occurs with.

Now look for these INTEGRATION PATTERNS:

1. CONVERGENCE — Do multiple symbols independently point to the same subject?
   e.g., "birth-pains → Babylon. earth-shaken → Babylon. rumors → Babylon. 3/3 converge."
   Count it: N of M symbols point to subject X.

2. STRUCTURAL PARALLELS — Does this paragraph's sequence of symbols match another passage?
   e.g., "Mat 24:6-7 sequence: rumors → don't fear → X-against-X.
          Jer 51:46 sequence: rumor heard → don't be afraid → ruler against ruler.
          Same structure."

3. INCLUSIO / BOOKENDS — Do symbols at the start and end of a section form a frame?
   e.g., "v.6-8 opens with Babylon-fall vocab. v.29 closes with Isa 13:10 celestial imagery.
          Bookended → entire discourse framed by Babylon."

4. SYMBOL CHAINS — Does symbol A's context bring in symbol B, which brings in symbol C?
   e.g., "birth-pains → Jer 30:6 → day-of-YHWH → Isa 13 → celestial-darkening → Mat 24:29"
   Trace the chain. Each link should be a specific verse.

5. ROLE SHIFTS — Is a symbol used differently here than in its dominant pattern?
   e.g., "birth-pains usually applied to the entity being judged.
          Here applied to 'the beginning' — onset marker, not the suffering itself."

6. WHAT'S MISSING — What major symbol is ABSENT that you'd expect?
   e.g., "No explicit mention of Babylon in Mat 24, despite all vocabulary being Babylon-sourced.
          The vocabulary identifies it; the name is conspicuously absent."

7. CYCLE IDENTIFICATION — Which historical cycle does this passage's vocabulary map to?
   When multiple symbols trace back to the same historical event/cycle, that's not
   borrowed imagery — it's declaring "this pattern repeats."
   e.g., "Mat 24:6-8 — birth-pains(Babylon) + earth-shaken(Babylon) + rumors(Babylon)
          + nation-v-nation(Babylon). Vocabulary = Babylon/Exile cycle, judgment phase.
          Jesus isn't using metaphor — He's identifying the pattern recurring."
   Note: which cycle, which phase (bondage/cry/deliverer/liberation/wilderness/promise),
   and whether the passage is describing a PAST instance or projecting FORWARD.

8. LANGUAGE-LAYER CONNECTIONS — Check for connections visible only in Hebrew or only in LXX Greek.
   - Does the LXX use a Greek word here that connects to a different passage than the Hebrew does?
   - Does a Hebrew wordplay or root connection get lost in Greek (or vice versa)?
   - When the NT echoes this passage, does it follow LXX or translate fresh from Hebrew?
   These cross-language connections are high-value because they're invisible to single-language
   analysis and therefore missed by most commentary.
   NOTE: Do NOT import traditional interpretations. Follow the text's own connections only.

9. INCIDENTAL IMPORTS — What "random" or seemingly disconnected details appear in this paragraph?
   Scripture is maximally compressed — every detail earns its place. If something seems
   off-topic or merely atmospheric, it's importing context from elsewhere:
   - Feast/season mentions → link to that feast's theology and all events on that feast
   - Place names → link to what previously happened at that location
   - Material objects, foods, garments → symbolic vocabulary pointers
   - Time-of-day markers ("it was night," "early morning") → pattern across Scripture
   e.g., "Jn 13:30 — 'and it was night.' Not atmosphere. Darkness = departure from light/Torah.
          Judas leaves the light (Jesus) and enters darkness. Echoes Gen 1, Isa 9:2, 1Jn 1:5."
   e.g., "1Sam 25:18 — Abigail brings 'two hundred loaves, two skins of wine, five dressed sheep,
          five seahs of roasted grain, a hundred raisin cakes, two hundred fig cakes.'
          Not just provisions — each item has symbolic weight. The specificity is the signal."

OUTPUT FORMAT:
Dense compressed notes. NOT prose. Use abbreviations, arrows, pipe separators.
State the SECTION SUBJECT in one line.
State CONFIDENCE (high/medium/low) with reason.
If Round 2+: note what's NEW this round vs previous.
Keep under 500 words.
```

### Prompt D: Symbol Study Update (Round 2+)

Same as Prompt B, but with enriched input.

```
INPUT (additions beyond Prompt B):
- Previous version of this symbol's context bag
- Context integration notes from every passage this symbol appears in
  (These carry the expanded view — what the graph looks like from each verse.)

ADDITIONAL TASK:
- The verse context notes contain observations that weren't visible in Round 1.
  Incorporate them. Does the convergence pattern strengthen?
- Note which insights are NEW (not in previous version).
- Recompute the cluster ratios. Has the dominant subject shifted?
- If the meaning or cluster pattern changed significantly, say so explicitly.
  (This drives the change_score for propagation.)

COMPRESSION RULE:
Your context bag must stay under 500 words. If incorporating new data would exceed this,
compress older observations. Prioritize: patterns > individual occurrences.
Round N should be DENSER than Round N-1, not longer.
```

### Note-Taking Shorthand

To maximize density within the 500-word budget, use consistent shorthand:

```
Notation          Meaning
───────────────── ──────────────────────────────
Jer.50.43         Verse reference (no "v." or "vv.")
→                 "points to" / "leads to"
||                "parallel to" / "same concept as"
+                 co-occurring with
subj:             subject of the passage
spkr:             speaker
ctx:              context type
N/M               count: N out of M total
∅                 absent / missing
Δ                 changed from previous round
=                 "is" / "means"
≠                 "is not" / "different from"
⚑                 incidental detail — "why is this here?"
📅                feast/calendar marker (→ symbolic time)
📍                geographic echo (→ what happened here before)
🔄                historical cycle match (pattern repeating)
                  e.g., 🔄Babylon/judgment or 🔄Exodus/deliverance
[H]               connection visible in Hebrew only
[G]               connection visible in Greek (LXX or NT) only
[HG]              connection visible in both — high confidence
[E∅]              connection lost in English translation
```

Example of maximally compressed context bag entry:
```
Jer.50.43 — subj: Babylon's king. spkr: narrator. ctx: prophetic-oracle.
  heard report(שמע) + hands-feeble(רפה) + anguish(צרה) + birth-pains(חבל+ילד).
  scene: king receives news of attack, body fails him. 4 fear-words in 1 verse.
  header: "concerning Babylon" (50:1). || Mat.24.6-8 (rumors→fear→birth-pains).
```

```
Lk.22.1 — ⚑📅 "feast of unleavened bread, called Passover" = not scene-setting.
  imports: Exodus liberation, lamb sacrifice, haste, removing leaven(sin).
  Jesus's arrest happens ON the feast whose entire purpose is deliverance from bondage.
  The timing IS the interpretation.
```

50-60 words per entry capturing a verse's full symbolic analysis with cross-references.

---

## The Matthew 24 Test Case

This is the benchmark. The pipeline should:

### Phase 1: Symbol Identification
Scan Matthew 24:6-8. Identify symbols:
- **Known**: (check dictionary for matches)
- **New candidates**: "birth pains" (ωδιν), "nation against nation" (structural pattern), "earthquakes" (σεισμος), "rumors of wars" (ακοη), "alarmed" (θροεω)

### Phase 2: Initial Symbol Studies
For "birth pains": search all Scripture → find Jer 50:43, Jer 30:6, Isa 26:17-18, Mic 4:9-10, 1 Thes 5:3, Rev 12:2. Note: heavily clustered in Babylon oracles.

For "earth shaken": search → find Jer 50:46, Isa 13:13, Isa 24:18-20, Joel 2:10, Hag 2:6. Note: clustered in Day-of-YHWH / Babylon passages.

(Similar for each symbol.)

### Phase 3: Context Integration
Load all studies into Mat 24:6-8. Generate dense context notes. Key observation emerges: every symbol independently traces to Babylon-fall vocabulary. The convergence is striking — not 1 or 2 connections, but ALL symbols point the same direction.

### Phase 4: Iteration
Round 2: Re-study "birth pains" with Jer 50:43's expanded context (which now includes its own symbol convergence on Babylon). The study gets richer. Note that Mat 24:29 (celestial darkening) creates an inclusio with vv.6-8 using Isa 13:10 vocabulary — the discourse is bookended by Babylon-oracle language.

### Phase 5: Grand Finale Output
> **Pattern Summary**: "This verse opens the Olivet Discourse with Babylon-fall vocabulary. The same vocabulary closes the discourse at v.29. Every symbol study traces to oracles concerning Babylon (Isaiah 13, Jeremiah 50-51). The passage structure (inclusio) identifies Babylon's fall as the principal event."

A reader sees this and can verify every claim by expanding the phrase links — each traceable to a specific Hebrew/Greek root, a specific passage with a header saying "concerning Babylon," and a symbol study with all occurrences analyzed.

The tool didn't tell them what to believe. It showed them where the Hebrew points.

---

## Cost Estimates

### Per-Symbol Study (Phase 2)
- Search: free (grep against local text files)
- AI analysis: ~$0.05-0.10 per symbol (one API call with all occurrences as context)
- Estimated symbols: ~200-500 across all of Scripture (not 2,000-5,000 — most words aren't symbols)
- Round 1 total: ~$10-50

### Per-Verse Context Integration (Phase 3)
- One API call per paragraph (~3-10 verses)
- ~1,000-2,000 paragraphs in the Bible
- Round 1 total: ~$50-100

### Iterative Rounds (Phase 4)
- Each round only processes changes
- Round 2: ~30-50% of symbols/verses updated → ~$25-50
- Round 3+: ~10-20% → ~$10-20
- Total iteration: ~$50-100

### Grand Finale (Phase 5)
- One pass through all verses with converged data
- ~$50-100

### Total Estimate: ~$160-350
Comparable to the old plan, but with meaning at every step instead of a giant numeric matrix.

---

## Execution Architecture: File-Based Multi-Agent System

The pipeline runs as a team of parallel agents coordinating through the file system. Each file is a self-contained unit of work with explicit dependency tracking. No central orchestrator holds state — the file system IS the state.

### File System Layout

```
pipeline/
  symbols/
    birth-pains.md          — one file per symbol study
    earth-shaken.md
    nation-v-nation.md
    rumors.md
    fear.md
    ...
  contexts/
    Mat/
      24.004-008.md         — agent decided vv.4-8 are one thought unit
      24.009-014.md
      24.015-028.md         — long section, agent kept it as one unit
      24.029-031.md
    Jer/
      50.041-046.md         — agent pulled in v.41 because it's the oracle header
      51.045-048.md
    Isa/
      13.001-016.md         — entire oracle as one unit (header at v.1)
    Ruth/
      1.001-005.md
      1.006-018.md          — agent split Ruth 1 at the natural scene change
    ...
  queue.json                — work queue: items needing processing
```

**Flexible grouping rules:**
- Agents decide the verse ranges, not a predefined segmentation
- The unit is the **natural thought boundary** — a parable, an oracle, a scene, a discourse unit
- Ranges can be as small as 1 verse (a dense, symbol-rich verse) or as large as an entire chapter
- Ranges can cross chapter boundaries if the thought unit does (chapters are artificial)
- Oracle/prophecy headers (e.g., "The oracle concerning Babylon" Isa 13:1) should be INCLUDED in the range they introduce — they're the label for everything that follows
- If an agent decides a range should be split or merged after initial analysis, it can: create new files and deprecate the old one (set `deprecated_by: [new files]` in the frontmatter)
- Overlapping ranges are OK when a verse belongs to two thought units (e.g., a transitional verse). Both files reference it; the overlap itself is informative.

### File Format: Symbol Study

```markdown
---
symbol: birth-pains
strongs: [H2256, H3205, G5604]
role: noun-symbol
meaning: Babylon-fall / judgment-onset
opposite: peace/rest
defining_verses: [Jer.50.43, Jer.30.6, Isa.26.17, Mic.4.9, Mat.24.8, 1Th.5.3, Rev.12.2]
co_occurring: [fear, earth-shaken, day-of-yhwh, rumors]
context_types: [prophetic-oracle, apocalyptic, discourse]
rev: 3                               — integer count of times processed
churn: 1.37                          — cumulative evolution (multiplicative)
inputs:
  contexts/Jer/50.043-046: [2, 1.22] — used rev 2 / churn 1.22 of this file
  contexts/Jer/30.005-007: [1, 1.00] — used rev 1 / churn 1.00 (first pass)
  contexts/Isa/26.017-019: [0, 0]    — not yet created when last processed
dependents: [contexts/Mat/24.006-008, contexts/1Th/5.001-005]
---

## Context Bag
birth-pains in OT: 6/7 occurrences in judgment-on-nation contexts.
Jer 50:43 — applied to king of Babylon receiving report of attack.
  paired with: fear(רפה+צרה), rumors(שמע). subject: Babylon's king.
Jer 30:6 — men writhing like women, faces pale.
  paired with: fear(ירקון), day-of-yhwh(יום+גדול). subject: Jacob's trouble.
Isa 26:17-18 — woman in labor, brought forth wind not salvation.
  paired with: earth/land. subject: Israel's failed deliverance.
Mic 4:9-10 — daughter of Zion writhing, go to Babylon, there rescued.
  paired with: king, counselor. subject: exile→rescue via Babylon.
Mat 24:8 — "beginning of birth pains" — opens discourse.
  paired with: nation-v-nation, earth-shaken, rumors, fear.
1Th 5:3 — sudden destruction like labor pains, no escape.
  paired with: peace-and-safety, day-of-Lord. subject: sudden reversal.

PATTERN: birth-pains = onset of judgment on a power/system.
  5/7 tied to Babylon or Babylon-type entity. 2/7 to Israel in distress.
  Always paired with fear-response vocabulary.
  The pains come ON the entity being judged, not on the righteous.
```

### File Format: Verse Context

```markdown
---
ref: Mat.24.6-8
symbols: [birth-pains, nation-v-nation, earth-shaken, rumors, fear]
rev: 2
churn: 1.15
inputs:
  symbols/birth-pains: [3, 1.37]
  symbols/nation-v-nation: [2, 1.08]
  symbols/earth-shaken: [2, 1.12]
  symbols/rumors: [1, 1.00]          — stale! rumors is now [2, 1.25]
  symbols/fear: [2, 1.10]
dependents: [symbols/birth-pains, symbols/fear, symbols/rumors]
---

## Context Integration Notes
birth-pains + earth-shaken + nation-v-nation: 5/6 co-occurrences in Babylon oracles
  (Jer 50-51, Isa 13). birth-pains specifically applied to king of Babylon (Jer 50:43).
rumors cluster: Jer 51:46 "rumor heard in the land" + "ruler against ruler"
  directly parallels Mat 24:6-7 structure. Same sequence: hear rumors → don't fear → X vs X.
fear-response vocab: θροεω(Mat) || לבב+ירא(Jer51) || רפה+צרה(Jer50) || ירקון(Jer30)
  — four different words, one concept. Jesus uses same "don't fear" framing as Jer 51:46.
inclusio note: celestial darkening at v.29 matches Isa 13:10 exactly, bookends discourse.
ALL symbols independently converge → Babylon-fall vocabulary cluster.

SECTION SUBJECT: Jesus describes Babylon's fall using OT prophetic vocabulary.
CONFIDENCE: high — independent convergence from 5 symbol studies.
NEW THIS ROUND: identified Jer 51:46 structural parallel (rumor→fear→X-vs-X sequence).
```

### The Dependency Graph

It's bipartite — two types of nodes, edges only between types:

```
SYMBOL STUDIES ←→ VERSE CONTEXTS

  birth-pains ──→ Mat.24.6-8  (symbol feeds into verse context)
  birth-pains ──→ Jer.50.43-46
  birth-pains ──→ 1Th.5.1-5
  Mat.24.6-8  ──→ birth-pains (verse context feeds back into symbol)
  Mat.24.6-8  ──→ fear
  Mat.24.6-8  ──→ rumors
```

A symbol study DEPENDS ON the verse contexts of every passage it appears in (to get the expanded view). A verse context DEPENDS ON the symbol studies of every symbol it contains (to get the compressed subgraph). Changes propagate across this bipartite graph.

### Agent Workflow

Each agent is stateless. It picks a work item, reads dependencies, does analysis, writes the result.

```
1. READ queue.json — pick an unprocessed item (symbol or context)
2. CLAIM it (mark in-progress, prevent other agents from duplicating)
3. READ all input files — load dependency data, note each file's current [rev, churn]
4. RESEARCH (agent discretion) — the agent may independently:
     - grep KJV/ASV/LXX for words, phrases, or patterns it notices
     - look up Strong's numbers in the Hebrew/Greek dictionaries
     - search for a root across MorphHB data
     - read surrounding verses for broader context
     - check the symbol dictionary for related entries
     - follow a hunch ("this word in Jer 50 sounds like the word in Isa 13 — let me check")
   This is NOT limited to the declared dependencies. The agent can explore freely.
   If it discovers something valuable, it notes it AND adds new dependencies/queue items.
5. ANALYZE — produce the symbol study or context integration notes,
   incorporating both dependency data and independent research
6. ASSESS CHANGE — AI estimates what % of the content changed vs previous version
   (0.0 = identical, 0.05 = minor refinement, 0.30 = significant new insight)
7. WRITE the file:
     - rev: N+1
     - churn: old_churn × (1 + change_pct)    e.g., 1.22 × 1.10 = 1.342
     - inputs: record [rev, churn] of each dependency as read
     - new_deps: any new files discovered that should be added to inputs
     - new_queue: any new symbols or verse ranges discovered during research
8. RELEASE the claim, pick next item
```

**Agent research tools** (available to every agent):

```
RESOURCE                 LOCATION                          USAGE
KJV Bible                bibles/kjv.txt                    grep for English words/phrases
ASV Bible                bibles/asv.txt                    compare translations
Septuagint (LXX)         bibles/lxx.txt                    Greek OT — cross-language links
Strong's Hebrew          strongs-hebrew-dictionary.js      H-numbers: definitions, related words,
                                                           "compare/see" cross-refs between roots
Strong's Greek           strongs-greek-dictionary.js       G-numbers: definitions, derivations
BDB (AI-enhanced)        data/bdb-ai.json                  Brown-Driver-Briggs lexicon with AI
                                                           annotations — semantic domains, usage
                                                           notes, meaning connections between entries
MorphHB                  data/morphhb.json                 Hebrew morphology, roots, word positions
NT Interlinear           data/nt-interlinear.json          Greek NT with Strong's numbers
Symbol Dictionary        symbol-dictionary.js              existing symbol meanings + Strong's index
Other translations       bibles/*.txt                      9 English translations
OpenBible Cross-refs     cross_references.txt              user-generated verse-to-verse links
                                                           with vote counts — crowd-sourced signal
```

**OpenBible cross-references are crowd-sourced signal.** These are user-generated links between verses with vote counts indicating confidence. Agents should consult them in two ways:
- **Outbound**: When studying a verse, check what other verses humans linked it to. These are candidate connections to evaluate — some will be strong (shared symbols, same subject), some will be weak or traditional (linked because of doctrinal convention rather than textual connection). The agent should assess each: does this link hold up under symbol analysis? If yes, note it. If not, note WHY it doesn't — that's also valuable.
- **Inbound**: When a symbol study identifies a verse as a key occurrence, check what cross-references that verse has. Humans may have noticed a connection the mechanical symbol search missed.
- **What's missing**: The most interesting finding is often a strong connection that the crowd-sourced data DOESN'T have. The Matthew 24 → Jeremiah 50-51 connections were missed by OpenBible entirely. When the pipeline finds a connection that humans missed, that's high-value signal — flag it.

**Strong's and BDB are built-in connection networks.** Strong's entries contain "compare" and "see also" cross-references linking related Hebrew/Greek roots — these are pre-built semantic connections between words. The AI-enhanced BDB adds semantic domain groupings, usage pattern notes, and meaning relationships between entries. Agents should actively consult these when studying a symbol:
- Look up the Strong's number → check "compare/see" references → follow those to related roots
- Look up BDB → check semantic domain → what other words share that domain?
- These are NOT just dictionaries — they're networks of meaning. A Strong's "compare H1234" is a curated connection that may reveal a symbol relationship the text alone wouldn't surface.

Agents are ENCOURAGED to go off-script. The declared dependencies are the minimum — the starting point. If an agent notices a pattern during analysis ("wait, this Hebrew root also appears in..."), it should follow that thread. The context files capture what was found; the research process doesn't have to be pre-planned.

**Boundary decisions during research:**
When an agent is processing a verse range and realizes the thought unit is different than expected:
- Too narrow (the thought continues past the range end): extend the range, or note it as `extends_to: {verse}` in frontmatter for the next agent to handle
- Too broad (there are two distinct thoughts within the range): split into two files, link them with `split_from: {original file}`
- Wrong break point: adjust and note `adjusted_from: {original range}`

The agent's judgment about where thoughts begin and end IS part of the analysis. Don't lock it in before the agent has read the text.

**Two-tier stale detection** — fast check + smart filter:

```
TIER 1 (fast): Has the input been updated at all?
  if input.current_rev > recorded_rev → potentially stale

TIER 2 (smart): Has it changed ENOUGH to matter?
  churn_delta = input.current_churn / recorded_churn
  if churn_delta > threshold (e.g., 1.05 = 5% cumulative change) → re-queue
  if churn_delta < threshold → skip, not worth re-processing
```

This prevents cascade storms. If a symbol study gets a 1% tweak (churn 1.30 → 1.313), every dependent file sees a churn_delta of 1.01 — below threshold. No unnecessary re-processing. But a 15% revision (churn 1.30 → 1.495) produces churn_delta 1.15 — above threshold, propagate.

**What each number tells you:**

| Metric | Meaning |
|--------|---------|
| `rev: 1` | First pass. Raw initial analysis. |
| `rev: 5, churn: 1.02` | Processed 5 times, barely changed. Very stable. |
| `rev: 5, churn: 2.50` | Processed 5 times, changed a LOT. Volatile — may need human review. |
| `rev: 2, churn: 1.40` | Two passes, 40% cumulative evolution. Normal early convergence. |
| `churn_delta < 1.03` | Input changed less than 3% since last read. Safe to skip. |
| `churn_delta > 1.20` | Input changed 20%+ since last read. Definitely re-process. |

### Explore / Refine Phasing

The pipeline alternates between two modes. Pure explore never converges. Pure refine never discovers. The interleaving is what makes it work — each refine wave makes the next explore wave smarter.

**EXPLORE mode** — discover new territory:
- Identify symbols in new verses
- Create initial symbol studies (rev 1)
- Create initial verse contexts (rev 1)
- Follow BFS to new verse ranges
- Follow hunches, grep, investigate
- Queue items are: new symbols, new verse ranges, new connections

**REFINE mode** — converge existing territory:
- Re-process stale files (inputs have advanced)
- Compress and sharpen notes
- Resolve conflicts between symbol studies
- Track churn until stable
- Queue items are: stale files only (no new discoveries queued)

**The wave pattern:**

```
WAVE 1: EXPLORE
  Seed: Mat 24:6-8
  → Identify 5 symbols → study each (rev 1)
  → Each study references ~7 verse ranges → queue them (BFS hop 1)
  → Process ~15-20 verse ranges → identify ~10-15 more symbols
  → Study those symbols (rev 1)
  STOP exploring when: no new symbols identified in the last batch of verse ranges

WAVE 1: REFINE
  → All symbol studies are now at rev 1, verse contexts at rev 1
  → Re-study symbols with verse context data → symbols go to rev 2
  → Re-process verse contexts with updated symbols → contexts go to rev 2
  → Check churn_deltas. Some symbols changed significantly → rev 3
  → Continue until max(churn_delta) < threshold across the cluster
  STOP refining when: cluster is converged (no stale files above threshold)

WAVE 2: EXPLORE
  → Now the converged cluster is stable. Use it to guide next exploration.
  → Follow BFS hop 2-3: process verse ranges queued but not yet touched
  → The REFINED symbol studies (rev 2-3) make identification smarter —
    the agent knows more about what "birth-pains" means, so it can
    spot related imagery it would have missed in wave 1
  → New symbols discovered at the frontier get initial studies
  STOP exploring when: new verse ranges share <2 symbols with the existing cluster
    (diminishing returns — we've reached the edge of this connection cluster)

WAVE 2: REFINE
  → Expanded cluster now includes hop 2-3 verses
  → Refine until converged
  → Some wave-1 files may go stale again (new data from wave-2 exploration)
  → That's fine — they get re-queued and refined with the richer context

WAVE 3+: repeat...
  → Each wave explores further from the seed, guided by refined understanding
  → Each wave's frontier is sparser (fewer shared symbols with the core cluster)
  → Eventually exploration yields nothing new → DONE with this seed

NEW SEED:
  → Pick next seed (e.g., Gen 1-3)
  → BFS from new seed — but many symbols already have studies from seed 1!
  → Those studies get ENRICHED with the new context (new occurrences, new clusters)
  → Cross-seed connections emerge: symbols that bridge Mat 24 cluster and Gen 1 cluster
```

**Switching rules — when to switch modes:**

| Signal | Action |
|--------|--------|
| New verse ranges processed, no new symbols found in 3+ ranges | EXPLORE → REFINE |
| All stale files processed, max churn_delta < 3% | REFINE → EXPLORE (next wave) |
| New verse ranges share <2 symbols with cluster | EXPLORE → REFINE (frontier exhausted) |
| Refine reveals a symbol changed >20% | REFINE continues (not stable yet) |
| Refine pass queues 0 new stale files | REFINE → EXPLORE (or DONE) |
| Budget checkpoint reached | Pause, report status, human decides |

**Parallelism within phases:**
- During EXPLORE: all new symbol studies run in parallel, all new verse contexts run in parallel
- During REFINE: all stale symbol studies run in parallel, then all stale contexts, alternating
- No read-write conflicts: an agent only WRITES to its own file, READS from others
- Practically: spawn 5-10 agents per wave, each claiming from the queue

**Why interleaving matters:**

In wave 1, an agent studying "earthquakes" in Mat 24:7 does a raw search and finds Jer 50:46, Isa 13:13, etc. Decent, but shallow.

By wave 2, the "birth-pains" study has converged and notes that Jer 50:43 (birth-pains applied to Babylon's king) is 3 verses before Jer 50:46 (earth shaken at Babylon's fall). The "earthquakes" study can now note: "earth-shaken and birth-pains are not just co-occurring — they're part of a SEQUENCE in Jer 50: the king feels birth-pains (v.43), THEN the earth shakes (v.46). This sequence parallels Mat 24: birth-pains (v.8), THEN earthquakes (v.7). Same order."

That sequential insight is invisible in wave 1. It only emerges because the birth-pains study was REFINED first and its context bag now carries the Jer 50 sequence information. Exploration after refinement sees deeper.

### Convergence Detection

Convergence is checked at the end of each REFINE phase:

```
1. Scan all files in the current cluster: compute churn_delta for each input
2. max_delta = highest churn_delta across all files
3. If max_delta < 1.03 (3%) → CLUSTER CONVERGED. Ready for next explore wave.
4. If max_delta is decreasing wave over wave → converging normally
5. If max_delta is stable or increasing → oscillation. Flag for human review.
```

**Dashboard (updated after each wave):**
```
Seed: Mat 24:6-8                  Wave: 2 (REFINE)
──────────────────────────────────────────────────
Cluster size:     247 files (52 symbols + 195 contexts)
Total revisions:  614 (avg 2.5 per file)
Max rev:          6   (symbols/birth-pains)
Max churn:        1.85 (symbols/birth-pains — most evolved)
Stale (>5%):      3 files  ← still refining
Stale (3-5%):     8 files
Stale (<3%):      12 files (below threshold, skipping)
BFS frontier:     34 verse ranges queued (hop 3+)
New symbols:      0 in last explore batch → frontier thinning
Budget spent:     $47.20 / $350.00 budget
──────────────────────────────────────────────────
→ STATUS: Refine wave 2 in progress. 3 files still above threshold.
```

When "stale >3%" hits zero, the cluster is converged. Move to explore wave 3, or if the frontier is exhausted, move to the next seed.

### Size Budgets

Each file has a soft size limit to enforce compression:
- Symbol study context bag: ~500-1000 words (forces conciseness)
- Verse context notes: ~200-500 words per paragraph
- If an agent produces more, it must compress before writing

This prevents unbounded growth across rounds. The notes get *denser*, not *longer*.

### Queue Management (queue.json)

```json
{
  "items": [
    {
      "file": "symbols/birth-pains",
      "type": "symbol-study",
      "reason": "initial",
      "priority": 1,
      "discovered_from": "contexts/Mat/24.006-008",
      "hop": 0,
      "claimed_by": null
    },
    {
      "file": "contexts/Jer/50.043-046",
      "type": "context",
      "reason": "stale:symbols/birth-pains(Δ1.25),symbols/fear(Δ1.12)",
      "priority": 14,
      "discovered_from": "symbols/birth-pains",
      "hop": 1,
      "claimed_by": null
    },
    {
      "file": "symbols/destroyer",
      "type": "symbol-study",
      "reason": "new-symbol:Jer.51.11",
      "priority": 5,
      "discovered_from": "contexts/Jer/51.045-048",
      "hop": 2,
      "claimed_by": "agent-3"
    }
  ],
  "seeds": ["Mat.24.6-8"],
  "round": 2,
  "stats": {
    "total_symbols": 52,
    "total_contexts": 18,
    "processed_this_round": 12,
    "avg_change_score": 0.34,
    "max_hop": 3,
    "queue_depth": 27
  }
}
```

Priority: initial studies (1) > dependency-triggered re-evaluations (2) > periodic refresh (3).

### Traversal Order: Connection-Guided BFS

The pipeline does NOT process the Bible linearly (Genesis → Revelation). It does NOT process randomly. It follows the connections — a breadth-first search where Scripture itself tells you where to go next.

**The algorithm:**

```
1. SEED: Pick a starting verse/paragraph (e.g., Mat 24:6-8)

2. IDENTIFY: Run symbol identification on the seed
   → Finds: birth-pains, nation-v-nation, earth-shaken, rumors, fear

3. STUDY: Run symbol studies for each identified symbol
   → Each study searches all Scripture and identifies ~7 defining verses
   → birth-pains brings in: Jer 50:43, Jer 30:6, Isa 26:17, Mic 4:9, 1Th 5:3, Rev 12:2
   → earth-shaken brings in: Jer 50:46, Isa 13:13, Isa 24:18, Joel 2:10, Hag 2:6
   → (etc. for each symbol)

4. QUEUE: All referenced verses/paragraphs go into the work queue
   → These are NOT arbitrary — they're where the text POINTS.
   → Priority by reference count: a verse cited by 3 symbol studies
     ranks higher than one cited by 1.

5. INTEGRATE: Generate context notes for the seed verse
   (using the freshly-completed symbol studies)

6. EXPAND: Process the next verse from the queue
   → Run symbol identification on Jer 50:43-46
   → Some symbols are already studied (birth-pains, fear) — load existing studies
   → Some are NEW (e.g., "destroyer from the north") — queue for study
   → New symbol studies bring in MORE verses → queue grows

7. REPEAT: Continue BFS until queue is empty or budget is exhausted
```

**Why this works:**

- **High-signal first.** The most connected passages get pulled in earliest because multiple symbol studies reference them. Jer 50-51 and Isa 13 will surface in the first wave from almost any prophetic seed verse — because they're hubs in the connection graph.

- **Natural clustering.** Starting from Mat 24, the BFS will explore the Babylon oracle cluster (Jer 50-51, Isa 13, Isa 47, Jer 30) before reaching distant topics. The traversal order reflects the actual structure of Scripture's connections.

- **Diminishing returns are visible.** Early waves bring in highly connected passages with many shared symbols. Later waves bring in passages with only 1 connection. You can set a cutoff: stop expanding when new passages share fewer than N symbols with already-processed passages.

- **Any seed works.** Start from Mat 24, or Gen 1, or Psalm 23, or Rev 18 — the BFS will eventually cover the same ground, just in a different order. Highly connected passages appear in the first few waves regardless of starting point.

- **Partial results are useful.** Unlike a linear pass, you can stop the BFS at any point and have a coherent cluster of deeply analyzed passages. The first 50 verses processed will be more insightful than the first 50 verses of Genesis processed linearly.

**Queue priority scoring:**

```
priority = (reference_count × 3)     # cited by more symbols = more important
         + (shared_symbols × 2)       # shares more symbols with processed verses
         + (is_defining_verse × 5)    # listed as one of a symbol's ~7 defining verses
         - (hop_distance × 1)         # prefer closer to seed (mild penalty for distance)
```

Ties broken by canonical order (earlier in the Bible first — slight preference for OT since that's where the patterns originate).

**Seeding strategy for full Bible coverage:**

The BFS from one seed won't cover everything — isolated passages (some Psalms, genealogies, certain laws) may never get referenced. Strategy:

1. **Primary seeds**: Start from 3-5 richly connected passages:
   - Mat 24 (prophetic/apocalyptic hub)
   - Gen 1-3 (creation/fall — foundational symbols)
   - Exo 12 (Passover — central to the cycle pattern)
   - Isa 53 (suffering servant — convergence point)
   - Rev 17-18 (Babylon/harlot — endpoint of many threads)

2. **Gap fill**: After BFS exhausts from all seeds, scan for unprocessed paragraphs.
   Process them in canonical order. These will be lower-connectivity passages —
   but they may still have symbols that connect back to the main clusters.

3. **Reconnection**: After gap-fill, re-run the queue propagation.
   Some gap-fill passages may have introduced new symbol connections
   that enrich the main clusters.

**Visualization:**

The traversal itself produces a valuable artifact: the **connection map**. Which passage was discovered from which, via which symbol. This is the reader-facing "how did we get here?" trail — and it's generated automatically from the queue history.

```
Mat 24:6-8  ──[birth-pains]──→  Jer 50:43-46
Mat 24:6-8  ──[earth-shaken]──→ Jer 50:46
Mat 24:6-8  ──[earth-shaken]──→ Isa 13:9-13
Mat 24:6-8  ──[rumors]────────→ Jer 51:45-48
Jer 50:43   ──[destroyer]─────→ Jer 51:11-14
Isa 13:9    ──[celestial]─────→ Mat 24:29
Mat 24:29   ──[celestial]─────→ Joel 2:10-11
...
```

---

## Relationship to brank/ (The Matrix)

The matrix work isn't wasted. It serves as a **mechanical validation layer**:

- If the symbol-driven pipeline says "birth pains" connects to Babylon oracles, the matrix should show high weights between those word positions
- The matrix can flag connections the symbol pipeline missed (words that co-occur frequently but weren't identified as symbols)
- The LXX bridge data is directly useful for cross-testament symbol studies

But the matrix is no longer the primary pipeline. It's a sanity check, not the engine.

---

## Key Design Principles

1. **Symbols are compressed subgraphs.** Each symbol study summarizes what the connection graph looks like from that word outward. Loading multiple studies into a verse gives you the graph view from multiple directions without traversing it.

2. **Dense notes, not polished prose (until the end).** The intermediate context bags are compressed hints optimized for AI to read in the next round. Human-readable output is produced only after convergence.

3. **Don't over-structure meaning.** Free-form context bags capture what rigid schemas can't. AI represents ideas as collections of words — leverage that instead of fighting it.

4. **Iterate to converge.** Single-pass analysis misses cross-symbol connections. Each round enriches symbol studies with the context integration notes from the previous round. Like PageRank, meaning stabilizes through propagation.

5. **AI identifies, AI compresses, AI integrates.** AI is good at recognizing which words carry symbolic weight, at compressing many passages into dense notes, and at seeing patterns when multiple context clouds overlap. Use AI for what AI is good at.

6. **Physical/literal first.** For every symbol, note what literally happens in every passage. Default to the most consistent literal reading. Don't reach for metaphor before checking if the literal works.

7. **Hebrew first, English second.** WLC is ground truth. Analysis happens at the consonantal root level. English is a rendering of the Hebrew, not the basis for analysis.

8. **Paragraphs, not verses.** The fundamental unit is a coherent thought (pericope/paragraph), not an arbitrary verse division. Context is fractal — verse, paragraph, section, book, Bible — and meaning comes from all levels.

9. **Study each symbol ONCE, apply everywhere.** A symbol study is done once across all occurrences, then loaded into every verse where that symbol appears. No redundant work. Consistent understanding everywhere.

10. **Show your work.** The trail from "this symbol appears here" through "these passages converge on this subject" to "this is the pattern" must be traceable. Every conclusion has evidence. The reader can verify.

---

## Sequencing

### DONE: Foundation Data
- ✅ Word histogram + frequency analysis (443K words, 14K Strong's)
- ✅ Filtered word list: 171K content words
- ✅ Dense matrix with Layer 1 (same-Strong's) — available as validation
- ✅ LXX Hebrew↔Greek bridge: 295K pairs
- ✅ ~47 symbol studies completed (symbol-dictionary.js + symbols/*.md)
- ✅ Phrase link case study (Matthew 24 mockup demonstrating target output)
- ✅ 9 English translations + MorphHB + NT interlinear

### TODO: Phase 0 — Agent Infrastructure
- Create `pipeline/` directory structure (symbols/, contexts/, queue.json)
- Build the orchestrator script: reads queue, spawns agents, manages claims
- Build the agent harness: claim → read deps → call AI → compare → write → propagate
- Build convergence reporter: scan files, compute stats, detect stabilization
- Test with 1 agent on 1 symbol manually before parallelizing

### TODO: Phase 1 — Symbol Identification
- Build the symbol identification prompt (input: a paragraph + known symbol list → output: identified symbols + new candidates)
- Seed with existing 47 symbols from symbol-dictionary.js
- Test on Matthew 24: does AI find the right symbols?
- Test on 2-3 other passage types (narrative, law, wisdom)
- Refine the "is this a symbol?" criteria
- Queue all identified symbols for study

### TODO: Phase 2 — Initial Symbol Studies (Round 1)
- Design the enriched symbol study file format (YAML frontmatter + context bag)
- Migrate existing 47 symbol studies to pipeline/symbols/ format
- Build the "study a new symbol" agent prompt (input: word + all occurrences → output: symbol study file)
- Run all agents in parallel — one per symbol
- Verify: do the studies look right for known symbols (SHEPHERD, SHEEP, etc.)?

### TODO: Phase 3 — Verse Context Integration (Round 1)
- Build paragraph boundaries (or use chapter-level as starting point)
- Build the context integration agent prompt (input: paragraph text + all symbol studies → output: context file)
- Run on Matthew 24 paragraphs as test case
- Evaluate: do the context notes capture the Babylon convergence?
- If yes: run on full Bible in parallel

### TODO: Phase 4 — Iterative Refinement (Rounds 2-N)
- Run Round 2: re-study symbols with verse context data as input
- Track change_scores across all files
- Propagate: queue dependents when change > threshold
- Monitor convergence: how many rounds until stable?
- Run on Matthew 24 until converged, then expand

### TODO: Phase 5 — Grand Finale
- Build the human-readable output generator (input: converged context files → output: pattern summaries, phrase link maps)
- TimeTested Translation with converged symbol data
- Word alignment pipeline (morpheme-level)
- Runtime integration into the app

---

## Output Artifacts

```
pipeline/                                — working data (agent-facing, compressed)
  symbols/{symbol}.md                    — symbol studies with context bags
  contexts/{Book}/{vvv-vvv}.md           — verse/paragraph context integration notes
  queue.json                             — work queue for agent orchestration

studies/                                 — human-readable output (reader-facing)
  symbols/{symbol}.json                  — per symbol: title, brief, blog, connections
  verses/{Book}/{vvv-vvv}.json           — per paragraph: title, brief, blog, phrase links
  index.json                             — master index of all studies with titles

data/phrase-links/{Book}.json            — grouped phrase link maps per book
data/verse-metadata/{Book}.json          — per-verse: symbol scores, word alignments,
                                           topic tags, red letter, consonantal flags
bibles/tt.txt                            — TimeTested Translation
data/concordance.json                    — root → consistent English rendering
```

**Study file format (studies/symbols/{symbol}.json):**
```json
{
  "symbol": "birth-pains",
  "strongs": ["H2256", "H3205", "G5604"],
  "title": "BIRTH PAINS — The Onset of Babylon's Judgment",
  "brief": "Birth pains in Scripture are consistently applied to the entity being judged...",
  "blog": "## What does 'birth pains' actually mean across Scripture?\n\n...",
  "meaning": { "one_word": "Judgment-onset", "sentence": "The agony of a system collapsing..." },
  "opposite": "peace/rest",
  "defining_verses": ["Jer.50.43", "Jer.30.6", "Isa.26.17", "Mic.4.9", "Mat.24.8", "1Th.5.3", "Rev.12.2"],
  "connections": ["fear", "earth-shaken", "day-of-yhwh", "rumors"],
  "historical_cycle": "Babylon/Exile — judgment phase",
  "pipeline_ref": "pipeline/symbols/birth-pains.md"
}
```

**Study file format (studies/verses/{Book}/{vvv-vvv}.json):**
```json
{
  "ref": "Mat.24.6-8",
  "title": "Jesus Opens the Olivet Discourse in Babylon-Fall Vocabulary",
  "brief": "Every symbol in Matthew 24:6-8 independently traces to the OT Babylon-fall oracles...",
  "blog": "## Matthew 24:6-8\n\n...",
  "symbols": ["birth-pains", "nation-v-nation", "earth-shaken", "rumors", "fear"],
  "phrase_links": [
    { "theme": "birth-pains", "targets": ["Jer.50.43", "Jer.30.6", "1Th.5.3"] },
    { "theme": "earth-shaken", "targets": ["Jer.50.46", "Isa.13.13"] }
  ],
  "section_subject": "Jesus describes Babylon's fall using OT prophetic vocabulary",
  "confidence": "high",
  "historical_cycle": "Babylon/Exile — judgment phase",
  "pipeline_ref": "pipeline/contexts/Mat/24.006-008.md"
}
```
