#!/usr/bin/env node
/**
 * run-agent.js — Pipeline Agent Runner
 * 
 * Picks the next item from the queue and processes it.
 * Currently runs one item at a time (can be parallelized later).
 * 
 * Usage:
 *   node pipeline/run-agent.js                    # process next queue item
 *   node pipeline/run-agent.js --status            # show pipeline status
 *   node pipeline/run-agent.js --item <file>       # process a specific item
 * 
 * Environment:
 *   ANTHROPIC_API_KEY — required for AI calls
 *   MODEL — optional, defaults to claude-sonnet-4-20250514
 *   DRY_RUN — if set, prints the prompt but doesn't call the API
 */

const fs = require('fs');
const path = require('path');

const PIPELINE_DIR = __dirname;
const PROJECT_DIR = path.join(__dirname, '..');
const QUEUE_PATH = path.join(PIPELINE_DIR, 'queue.json');

// ─── Queue Management ───────────────────────────────────────────

function loadQueue() {
  return JSON.parse(fs.readFileSync(QUEUE_PATH, 'utf-8'));
}

function saveQueue(queue) {
  fs.writeFileSync(QUEUE_PATH, JSON.stringify(queue, null, 2));
}

function claimNext(queue) {
  const item = queue.items.find(i => i.status === 'pending');
  if (!item) return null;
  item.status = 'in-progress';
  item.claimed_by = `agent-${process.pid}`;
  saveQueue(queue);
  return item;
}

function completeItem(queue, item, newItems = []) {
  item.status = 'done';
  // Move to completed
  queue.completed.push({
    file: item.file,
    type: item.type,
    hop: item.hop,
    completed_at: new Date().toISOString()
  });
  // Remove from active items
  queue.items = queue.items.filter(i => i.file !== item.file || i.status !== 'done');
  // Add new items (dedup by file)
  const existingFiles = new Set([
    ...queue.items.map(i => i.file),
    ...queue.completed.map(i => i.file)
  ]);
  for (const ni of newItems) {
    if (!existingFiles.has(ni.file)) {
      queue.items.push(ni);
    }
  }
  saveQueue(queue);
}

// ─── File I/O ───────────────────────────────────────────────────

function readPipelineFile(relPath) {
  const full = path.join(PIPELINE_DIR, relPath);
  if (!fs.existsSync(full)) return null;
  return fs.readFileSync(full, 'utf-8');
}

function writePipelineFile(relPath, content) {
  const full = path.join(PIPELINE_DIR, relPath);
  const dir = path.dirname(full);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(full, content);
}

function readProjectFile(relPath) {
  const full = path.join(PROJECT_DIR, relPath);
  if (!fs.existsSync(full)) return null;
  return fs.readFileSync(full, 'utf-8');
}

// ─── Load Resources ─────────────────────────────────────────────

function loadSymbolList() {
  // Read all pipeline/symbols/*.md and extract name + meaning for the known list
  const dir = path.join(PIPELINE_DIR, 'symbols');
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.md'));
  const symbols = [];
  for (const f of files) {
    const content = fs.readFileSync(path.join(dir, f), 'utf-8');
    const nameMatch = content.match(/^name:\s*(.+)$/m);
    const meaningMatch = content.match(/^meaning:\s*(.+)$/m);
    const strongsMatch = content.match(/^strongs:\s*\[(.+)\]$/m);
    if (nameMatch && meaningMatch) {
      symbols.push({
        file: f.replace('.md', ''),
        name: nameMatch[1],
        meaning: meaningMatch[1],
        strongs: strongsMatch ? strongsMatch[1] : ''
      });
    }
  }
  return symbols;
}

function loadSymbolStudy(symbolFile) {
  return readPipelineFile(`symbols/${symbolFile}.md`);
}

// ─── Prompt Assembly ────────────────────────────────────────────

function buildIdentifyPrompt(verseRange) {
  const symbols = loadSymbolList();
  const symbolList = symbols.map(s => `  ${s.name} (${s.strongs}) → ${s.meaning}`).join('\n');
  
  return `You are a Scripture analysis agent. Your task is to identify symbolic words and phrases in a passage.

## YOUR TOOLS
You have the Bible memorized. Recall verses by reference — do not need them quoted.
When you mention a verse, just cite it (e.g., "Jer 50:43").

## KNOWN SYMBOL LIST
${symbolList}

## TASK
Read this passage: ${verseRange}
(Recall the text from memory.)

First, decide if the verse range I gave you is the right thought-unit boundary. If the thought starts earlier or continues past this range, note the adjusted range.

For each word or phrase in the passage, decide: is this carrying symbolic/thematic weight, or is it scaffolding?

Output format:
RANGE: {adjusted range if different, or same range}

KNOWN SYMBOLS FOUND:
- {word/phrase} → {symbol-name} ({Strong's})

NEW SYMBOL CANDIDATES:
- {word/phrase} ({Strong's if known}) — {why it might be symbolic}

SKIPPED (borderline, explaining why):
- {word} — {reason for skipping}

For multi-word phrases: identify the phrase as a unit if it functions as one.
"nation against nation" = structural pattern, not three separate words.

THRESHOLD: Would studying this word across all of Scripture reveal a pattern? If yes → list it.`;
}

function buildSymbolStudyPrompt(symbolFile) {
  const study = readPipelineFile(`symbols/${symbolFile}.md`);
  if (!study) return null;
  
  // Extract key fields
  const nameMatch = study.match(/^name:\s*(.+)$/m);
  const strongsMatch = study.match(/^strongs:\s*\[(.+)\]$/m);
  const wordsMatch = study.match(/^words:\s*\[(.+)\]$/m);
  
  const name = nameMatch ? nameMatch[1] : symbolFile;
  const strongs = strongsMatch ? strongsMatch[1] : '';
  const words = wordsMatch ? wordsMatch[1] : '';
  
  // Load any existing full study from symbols/ directory
  const fullStudyPath = path.join(PROJECT_DIR, 'symbols', `${name}.md`);
  let existingStudy = '';
  if (fs.existsSync(fullStudyPath)) {
    existingStudy = `\n## EXISTING FULL STUDY (for reference)\n${fs.readFileSync(fullStudyPath, 'utf-8').substring(0, 2000)}...\n`;
  }
  
  // Load known symbol list for co-occurrence detection
  const symbols = loadSymbolList();
  const symbolList = symbols.map(s => `  ${s.name} → ${s.meaning}`).join('\n');

  return `You are a Scripture analysis agent doing a symbol study.

## YOUR TOOLS
You have the Bible memorized. Recall verses by reference.
You know Strong's Hebrew and Greek dictionaries. Look up ${strongs} and check "compare/see" references.
You know the BDB lexicon. Check semantic domains for related words.
You know the Septuagint. Check what Greek word the LXX uses for this Hebrew word.

## SYMBOL TO STUDY
Name: ${name}
Strong's: ${strongs}
Trigger words: ${words}
${existingStudy}

## KNOWN SYMBOLS (for co-occurrence detection)
${symbolList}

## METHODOLOGY — FOLLOW THIS PROCESS IN ORDER

### Step 1: EXHAUSTIVE SEARCH
Search by Strong's numbers (${strongs}) to find EVERY occurrence — not English words which miss
translation variants. Count total occurrences. List definitional verses ("X IS Y"), antithetical
verses (contrasted with opposite), what it DOES (verbs), behavioral commands ("walk in X").

### Step 2: GENERATE 7 CANDIDATES
Before evaluating, brainstorm at least 7 candidate meanings. Write each down.
- Candidate #1 (first intuition)
- Assume #1 is WRONG → Candidate #2 (meaningfully different)
- Assume #2 is WRONG → Candidate #3
- Continue to at least 7
REJECT any candidate that is a dictionary synonym (would a secular reader arrive at it?).

### Step 3: TEST EACH CANDIDATE — SUBSTITUTION
For each surviving candidate, substitute it into 5+ diverse verses (different books, genres).
Write out the before/after. Does it produce coherent meaning in ALL of them?
A meaning that fails in ANY context is wrong or incomplete.

### Step 4: RESOLVE SYMBOLIC RECURSION
If the meaning contains another symbol (e.g., "Word of God"), trace the chain to a CONCRETE concept.
TRUTH→Word→Law→God's Commandments. The recursion must terminate in something actionable.

### Step 5: ADDITIONAL TESTS
- PRODUCTION CHAIN: How is this thing physically made? (olive→press→oil = fruit→trials→proven works)
- LEGAL REDUNDANCY: Would this meaning create a contradiction with Torah?
- OPPOSITE: Does it pair correctly with the known opposite?
- PARABLES: In any parable where this symbol appears, does the meaning work with the other symbols?
- WHO: Who does Scripture apply this to? God only? Humans? Both?
- WHEN: Does this symbol appear in multiple historical eras? Track EVERY era.

### Step 6: FOR EACH OCCURRENCE, NOTE (compressed):
1. SUBJECT — What is the passage about?
2. LITERAL SCENE — What is physically happening?
3. CO-OCCURRING SYMBOLS — What known symbols appear nearby?
4. ROLE — Subject, action, or descriptor?
5. CONTEXT TYPE — prophetic oracle, narrative, law, wisdom, psalm, apocalyptic, discourse
6. PASSAGE HEADER — If prophetic, what does the oracle header say?
7. SPEAKER — Who is speaking?
8. INCIDENTAL DETAILS — Feasts, seasons, places, materials, numbers
9. HISTORICAL CYCLE — Creation, Flood, Exodus, Wilderness, Conquest, Judges, Kingdom, Babylon/Exile, Return, Rome

### Step 7: SYNTHESIZE
- CLUSTER: Do occurrences cluster around a particular subject?
- CONSISTENT READING: Which candidate survived ALL tests? (physical/literal first)
- ANOMALIES: Which occurrences don't fit? Why?
- CROSS-TESTAMENT: Hebrew root → LXX Greek → NT Greek connections
- TRIPLE-LANGUAGE: Connections visible only in one language?

SHOW YOUR WORK. Mental math = failure. If it's not written, it didn't happen.
Do NOT assume tradition or consensus. Follow the text's own connections.

## OUTPUT FORMAT
Output a complete pipeline symbol study file in this exact format:

---
symbol: {key}
name: {NAME}
strongs: [{strongs}]
words: [{words}]
role: {noun-symbol / verb-symbol / adjective-symbol}
meaning: {one-line meaning — must NOT be a dictionary synonym}
opposite: {opposite symbol}
defining_verses: [{7 best verses, comma-separated}]
co_occurring: [{co-occurring symbols}]
context_types: [{types found}]
candidates_tested: [{list all 7 candidates, mark winner}]
all_verses: [{EVERY verse checked}]
rev: 1
churn: 1.00
inputs: {}
dependents: []
---

## Candidates & Tests
{List all 7 candidates. For each: 1-line definition, then substitution test results (pass/fail with verse refs). Mark the winner and WHY the others failed.}

## Context Bag
{Compressed notes of all occurrences + synthesis. Max 700 words. Shorthand notation.
Cite every verse by reference. Preserve the logic chain. Include production chain if applicable.}

Show your work. Compress aggressively. Every word must earn its place.`;
}

function buildContextIntegrationPrompt(verseRange, symbolFiles) {
  // Load all symbol studies for this passage
  const studies = [];
  for (const sf of symbolFiles) {
    const content = readPipelineFile(`symbols/${sf}.md`);
    if (content) {
      studies.push({ file: sf, content });
    }
  }
  
  const studyBlock = studies.map(s => 
    `### ${s.file}\n${s.content}`
  ).join('\n\n');

  return `You are a Scripture analysis agent doing verse context integration.

## CRITICAL RULES

### 1. CONCRETE AND LITERAL FIRST
Scripture describes the REAL WORLD — real events, real places, real people, real consequences.
Do NOT leap to theological abstraction. Before any symbolic analysis, answer:
- WHAT IS LITERALLY BEING DESCRIBED? Plain language. What would the original audience understand?
- WHO IS SPEAKING TO WHOM? What did the audience need to know?
- WHAT CONCRETE EVENTS does this point to — past or future?
- WHAT ACTION would this prompt? Flee? Prepare? Change behavior? Wait?
- HOW DOES THIS APPLY to real life in the real world?
Symbolic meaning is a DEEPER layer of literal meaning, not a replacement for it.

### 2. USE THE SYMBOL STUDIES
The symbol studies you're given contain connections to specific passages and eras.
Those connections are the EVIDENCE. Integrate them — don't ignore them in favor of
your own historical knowledge. The symbol studies are the pipeline's memory.

### 3. FULL DISCOURSE SCOPE
If this passage is part of a larger discourse or prophecy, list ALL major elements
promised in the ENTIRE discourse — not just this section. The unfulfilled elements
of the broader context constrain the interpretation of the section you're analyzing.

### 4. PROPHETIC ROADMAP
Scripture describes several major prophetic events that are still being resolved.
Each passage you analyze may be contributing evidence about one or more of:
- The Rapture / Gathering of believers
- The Return of Christ
- The Fall of Babylon the Great
- Sudden Destruction (birth pains / no escape)
- Days of Noah (water then fire, similar scale)
- Return after 3 days (resurrection pattern at multiple scales?)
- A day as 1000 years (prophetic time scale)
After your analysis, note: which of these events does this passage illuminate?
What does it tell us about their timing, nature, sequence, or participants?
What remains UNRESOLVED?

## YOUR TOOLS
You have the Bible memorized. Recall any verse by reference.
You know Strong's, BDB, and the Septuagint. Search freely.

## PASSAGE
${verseRange} (recall from memory)

## SYMBOL STUDIES LOADED
${studyBlock}

## TASK
You have each symbol's full context — where else it appears, what subjects it clusters around, what other symbols co-occur with it.

START with the concrete/literal reading. THEN look for these INTEGRATION PATTERNS:

1. LITERAL MEANING — What is this passage literally about? What real-world events? What practical instruction?
2. CONVERGENCE — Do multiple symbols independently point to the same subject? Count: N of M symbols point to subject X.
3. STRUCTURAL PARALLELS — Does this paragraph's sequence of symbols match another passage?
4. INCLUSIO / BOOKENDS — Do symbols at start and end of a section form a frame?
5. SYMBOL CHAINS — Does symbol A's context bring in B, which brings in C? Trace the chain.
6. ROLE SHIFTS — Is a symbol used differently here than its dominant pattern?
7. WHAT'S MISSING — What major symbol is ABSENT that you'd expect?
8. CYCLE IDENTIFICATION — Which historical cycle does this vocabulary map to? What CONCRETE historical event is the pattern pointing to?
9. LANGUAGE-LAYER CONNECTIONS — Connections visible only in Hebrew or only in LXX Greek?
10. INCIDENTAL IMPORTS — "Random" details: feasts, places, materials, numbers?
11. SO WHAT? — Symbols are the BRIDGE between literal events, not the destination.
   The destination is ALWAYS concrete and practical:
   a. What LITERALLY happened or will happen in the real world?
   b. What should a person DO in response?
   c. What pattern from a PAST literal event tells us what THIS literal event will look like?
   If your analysis ends at "covenant dissolution vocabulary" you've failed.
   It must end at "Jerusalem is about to fall like Babylon did — here are the warning signs, here's what to do."

12. FULFILLMENT AUDIT — Check the FULL SCOPE of the prophecy, not just the verses
   in this slice. If this passage is part of a larger discourse, list ALL elements
   promised in the ENTIRE discourse — not just this section.
   
   Then for EACH element, check EVERY historical era where the symbol studies
   show this pattern occurring. The symbol studies contain the connections — USE them.
   Each symbol's context bag lists the passages and eras where it appears.
   Map every element to every era the data supports.
   
   For each proposed fulfillment, honestly evaluate:
   - Which elements were literally fulfilled? Evidence?
   - Which elements were NOT fulfilled? Say so plainly.
   - Which elements COULD NOT have been fulfilled? Say so.
   
   Do NOT collapse everything into one historical event. Do NOT adopt any
   traditional framework (preterist, futurist, or otherwise) uncritically.
   Follow the data in the symbol studies.
   
   The unfulfilled elements are the most important finding — they constrain
   what the passage ultimately means and point to what you haven't found yet.

You may discover NEW symbols during integration. Flag them:
  NEW_SYMBOL: {word} — {reason}

## OUTPUT FORMAT
Output a complete pipeline context file:

---
ref: {verse range}
symbols: [{symbol keys}]
rev: 1
churn: 1.00
inputs:
  {for each symbol study: symbols/{key}: [rev, churn]}
dependents: [{symbol keys that should re-evaluate with this context}]
---

## Plain Meaning
{2-3 sentences: what is this passage literally about? What would the original audience understand?
What concrete events does it describe or predict? What action does it prompt?}

## Context Integration Notes
{Dense compressed notes. NOT prose. Use abbreviations, arrows, pipe separators.}
{State SECTION SUBJECT in one line — concrete, not abstract.}
{State CONFIDENCE (high/medium/low) with reason.}
{Max 500 words.}

## New Discoveries
{Any new symbols to study, new verse ranges to queue, adjusted boundaries}`;
}

// ─── AI Caller ──────────────────────────────────────────────────

async function callAI(prompt) {
  if (process.env.DRY_RUN) {
    console.log('\n=== DRY RUN — PROMPT ===\n');
    console.log(prompt);
    console.log('\n=== END PROMPT ===\n');
    return '[DRY RUN — no API call made]';
  }
  
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('ERROR: ANTHROPIC_API_KEY not set');
    console.error('Set it with: export ANTHROPIC_API_KEY=your-key-here');
    process.exit(1);
  }
  
  const model = process.env.MODEL || 'claude-opus-4-6';
  console.log(`Calling ${model}...`);
  
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }]
    })
  });
  
  if (!response.ok) {
    const err = await response.text();
    throw new Error(`API error ${response.status}: ${err}`);
  }
  
  const data = await response.json();
  const text = data.content[0].text;
  
  // Track cost
  const inputTokens = data.usage?.input_tokens || 0;
  const outputTokens = data.usage?.output_tokens || 0;
  console.log(`Tokens: ${inputTokens} in / ${outputTokens} out`);
  
  return text;
}

// ─── Process Item ───────────────────────────────────────────────

async function processItem(item) {
  console.log(`\nProcessing: ${item.file} (${item.type})`);
  
  switch (item.type) {
    case 'context-identify': {
      // Step 1: Identify symbols in a verse range
      // File: contexts/Mat/24.004-008.md → "Matthew 24:4-8"
      const fileParts = item.file.replace('contexts/', '').replace('.md', '').split('/');
      const book = fileParts[0]; // "Mat"
      const chapterVerse = fileParts[1]; // "24.004-008"
      const cvMatch = chapterVerse.match(/^(\d+)\.0*(\d+)-0*(\d+)$/);
      const verseRange = cvMatch 
        ? `${book} ${cvMatch[1]}:${cvMatch[2]}-${cvMatch[3]}`
        : `${book} ${chapterVerse}`;
      
      console.log(`Identifying symbols in: ${verseRange}`);
      const prompt = buildIdentifyPrompt(verseRange);
      const response = await callAI(prompt);
      
      console.log('\n=== AI Response ===\n');
      console.log(response);
      
      // Save the identification results as a working file
      writePipelineFile(item.file.replace('.md', '.identify.md'), 
        `# Symbol Identification: ${verseRange}\n\n${response}`);
      
      return { response, newItems: [] }; // User reviews and queues next steps
    }
    
    case 'symbol-study': {
      // Step 2: Do a full symbol study
      const symbolFile = item.file.replace('symbols/', '').replace('.md', '');
      console.log(`Studying symbol: ${symbolFile}`);
      const prompt = buildSymbolStudyPrompt(symbolFile);
      if (!prompt) {
        console.error(`Could not load symbol file: ${symbolFile}`);
        return { response: null, newItems: [] };
      }
      const response = await callAI(prompt);
      
      console.log('\n=== AI Response ===\n');
      console.log(response);
      
      // Extract the markdown content from the response (between --- markers)
      const mdMatch = response.match(/---[\s\S]*---[\s\S]*/);
      if (mdMatch) {
        writePipelineFile(`symbols/${symbolFile}.md`, mdMatch[0]);
        console.log(`\nWrote: pipeline/symbols/${symbolFile}.md`);
      }
      
      return { response, newItems: [] };
    }
    
    case 'context-integrate': {
      // Step 3: Integrate symbol studies for a verse range
      const ref = item.file.replace('contexts/', '').replace('.md', '');
      console.log(`Integrating context for: ${ref}`);
      
      // Load the identification file to get symbol list
      const identFile = readPipelineFile(item.file.replace('.md', '.identify.md'));
      // For now, symbols are passed in the item or parsed from the identify file
      const symbolFiles = item.symbols || [];
      
      const prompt = buildContextIntegrationPrompt(ref, symbolFiles);
      const response = await callAI(prompt);
      
      console.log('\n=== AI Response ===\n');
      console.log(response);
      
      const mdMatch = response.match(/---[\s\S]*---[\s\S]*/);
      if (mdMatch) {
        writePipelineFile(item.file, mdMatch[0]);
        console.log(`\nWrote: pipeline/${item.file}`);
      }
      
      return { response, newItems: [] };
    }
    
    default:
      console.error(`Unknown item type: ${item.type}`);
      return { response: null, newItems: [] };
  }
}

// ─── Status Report ──────────────────────────────────────────────

function showStatus() {
  const queue = loadQueue();
  const symbolDir = path.join(PIPELINE_DIR, 'symbols');
  const symbolFiles = fs.readdirSync(symbolDir).filter(f => f.endsWith('.md'));
  
  // Count symbols with context bags vs pending
  let studied = 0, pending = 0;
  for (const f of symbolFiles) {
    const content = fs.readFileSync(path.join(symbolDir, f), 'utf-8');
    if (content.includes('[PENDING')) pending++;
    else studied++;
  }
  
  // Count context files
  const contextsDir = path.join(PIPELINE_DIR, 'contexts');
  let contextCount = 0;
  if (fs.existsSync(contextsDir)) {
    const walk = (dir) => {
      for (const f of fs.readdirSync(dir)) {
        const full = path.join(dir, f);
        if (fs.statSync(full).isDirectory()) walk(full);
        else if (f.endsWith('.md') && !f.includes('.identify.')) contextCount++;
      }
    };
    walk(contextsDir);
  }
  
  console.log(`
╔══════════════════════════════════════════════════╗
║         PIPELINE STATUS                          ║
╠══════════════════════════════════════════════════╣
║  Seeds:      ${queue.seeds.join(', ').padEnd(35)}║
║  Mode:       ${queue.mode.padEnd(35)}║
║  Wave:       ${String(queue.wave).padEnd(35)}║
╠══════════════════════════════════════════════════╣
║  Symbols:    ${String(symbolFiles.length).padEnd(5)} (${studied} studied, ${pending} pending)${' '.repeat(14 - String(studied).length - String(pending).length)}║
║  Contexts:   ${String(contextCount).padEnd(35)}║
║  Queue:      ${String(queue.items.filter(i => i.status === 'pending').length).padEnd(5)} pending${' '.repeat(23)}║
║  Completed:  ${String(queue.completed.length).padEnd(35)}║
╚══════════════════════════════════════════════════╝
`);
  
  if (queue.items.length > 0) {
    console.log('Queue items:');
    for (const item of queue.items) {
      const status = item.status === 'pending' ? '○' : item.status === 'in-progress' ? '◉' : '✓';
      console.log(`  ${status} [${item.type}] ${item.file} (hop ${item.hop})`);
    }
  }
}

// ─── Main ───────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--status')) {
    showStatus();
    return;
  }
  
  if (args.includes('--dry-run')) {
    process.env.DRY_RUN = '1';
  }
  
  const queue = loadQueue();
  
  // Check for specific item
  const itemIdx = args.indexOf('--item');
  let item;
  if (itemIdx >= 0 && args[itemIdx + 1]) {
    const targetFile = args[itemIdx + 1];
    item = queue.items.find(i => i.file.includes(targetFile));
    if (!item) {
      console.error(`Item not found in queue: ${targetFile}`);
      process.exit(1);
    }
    item.status = 'in-progress';
    item.claimed_by = `agent-${process.pid}`;
    saveQueue(queue);
  } else {
    item = claimNext(queue);
  }
  
  if (!item) {
    console.log('Queue is empty. Nothing to process.');
    showStatus();
    return;
  }
  
  try {
    const result = await processItem(item);
    if (result.response) {
      completeItem(queue, item, result.newItems);
      console.log('\nDone. Run --status to see pipeline state.');
    }
  } catch (err) {
    console.error(`Error processing ${item.file}:`, err.message);
    // Release the claim
    item.status = 'pending';
    item.claimed_by = null;
    saveQueue(queue);
  }
}

main();
