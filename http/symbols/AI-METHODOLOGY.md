# AI-Assisted Symbol Study Methodology

## Symbol Study vs Word Study — Do Not Confuse

This document is for **symbol studies** only. A **symbol study** asks: *What does X represent in Scripture?* (e.g. OIL = Proven Works.) A **word study** asks: *What does this Hebrew/Greek word mean lexically?* (etymology, root, usage.) Do not mix the two: use this methodology and prompt for symbol studies; use a different process for word studies.

---

## The Problem With Naive AI Use

If you simply ask an AI "What does BREAD symbolize in the Bible?", you will get the **weighted average of human commentary** the AI was trained on — not a fresh analysis of Scripture itself.

AI training data includes:
- Billions of words of theological commentary
- Every denominational tradition (often contradictory)
- Popular interpretations (which may be wrong)
- Scripture itself — a tiny fraction of the total

**The solution**: Use AI as a structured research assistant, not an oracle. Give it explicit methodology that forces scriptural analysis over regurgitation.

---

## The Exact Prompt Template

When commissioning an AI (any platform: ChatGPT, Claude, Grok, etc.) to perform a symbol study, copy and adapt this prompt. Replace bracketed items with your values.

```
Symbol Study Task: [SYMBOL NAME]

Context (adapt to your situation)
- I am doing a biblical symbol study (what does [SYMBOL] represent in Scripture? — not a lexical/word study). I will provide (or have already provided) a methodology document and an example study for format.
- Methodology: [Paste key steps from your methodology, or attach the file, or give the path if the AI can access it]
- Example study to follow: [Paste an example or give path — e.g. a completed study like LIGHT, BREAD, or OIL so the AI knows format and depth]

Your Task
Create a comprehensive symbol study for [SYMBOL] following the methodology and matching the format of the example study.

Process
1. Search Scripture completely and comprehensively — do not sample. Use Strong's numbers to find every occurrence of the Hebrew/Greek word(s) for [SYMBOL]. Search by Strong's (e.g. H####, G####) so you capture every verse where that word appears, regardless of English translation. Then work through the full set: definitional verses ("[SYMBOL] IS..."), antithetical verses (contrasted with its opposite), what [SYMBOL] DOES (verbs), and behavioral commands (walking in, being children of, etc.). A meaning that fits only some occurrences is wrong; the study must account for or test against the entire set.
2. Key Strong's numbers: [H#### (Hebrew), G#### (Greek)] — fill in for the symbol. Use these to run an exhaustive search, not a partial one.
3. Generate at least 7 candidate meanings before evaluating (per methodology)
4. Reject dictionary synonyms (e.g., "brightness" for LIGHT is NOT symbolic — we want what the symbol represents in Scripture)
5. Look for what [SYMBOL] represents spiritually/symbolically
6. Test each candidate using:
   - Substitution tests across the full set of verses (or a documented subset if the set is very large — and state why the subset is representative)
   - Coherence with known opposite symbol
   - Torah alignment
   - Human application test (can humans BE or WALK in [SYMBOL]?)
7. Output the study in the requested format, e.g.:
   - Symbolic Meaning table (one word, two words, sentence)
   - Opposite stated
   - The Argument (numbered sections with evidence)
   - Key Proof Texts
   - Substitution Test table
   - Conclusion
8. If I maintain a symbol dictionary or list, I will add the entry myself; otherwise omit this step.

SHOW YOUR WORK — write out every search, every candidate, every test.

Do NOT:
- Use dictionary definitions or synonyms as the symbolic meaning
- Assume consensus or tradition is correct — assume they are wrong until proven independently by Scripture
- Stop at your first candidate — generate multiple and compare
- Trust your intuition — test systematically
- Sample verses for convenience — the search must be complete and comprehensive (use Strong's for every occurrence)
```

---

## Critical Rules for AI

### 1. NEVER Accept Dictionary Definitions or Synonyms

| Symbol | REJECT (Dictionary/ synonym) | CONSIDER (Symbolic) |
|--------|-----------------------------|---------------------|
| WATER | Liquid, H2O, fluid | People/Masses |
| LIGHT | Brightness, illumination | Visible Example |
| TREE | Plant, wood, timber | Nation |
| OIL | Grease, lubricant | Proven Works |
| DARKNESS | Absence of light | Concealed Disobedience |

**Test:** Would a secular reader using only a dictionary or thesaurus arrive at this meaning? If YES → it's not the symbolic meaning.

### 2. Do Not Assume Consensus or Tradition

Assume consensus and tradition are **wrong until proven independently**. Do not treat "what most commentators say" or "what my tradition teaches" as evidence. The only evidence is Scripture itself: explicit definitions, patterns across the corpus, and tests that pass in every context. If the majority view is correct, it will survive that test; if not, it must be rejected.

### 3. Generate Multiple Candidates BEFORE Evaluating

The AI must:
1. Write down Candidate #1 (first intuition)
2. **Assume #1 is WRONG** → Generate Candidate #2 (meaningfully different)
3. **Assume #2 is WRONG** → Generate Candidate #3
4. Continue until at least 7 candidates exist
5. THEN evaluate all candidates systematically

This prevents anchoring bias.

### 4. Search Must Be Complete, Not a Sample

Do not rely on a handful of "key verses." Use Strong's numbers to retrieve **every occurrence** of the word in Scripture (concordance, Bible software, or exhaustive use of training data). The proposed meaning must be tested against the full set of occurrences. If the set is very large, the AI may work with a systematic subset (e.g. by book or genre) but must state that explicitly and justify that the subset is representative. Sampling for convenience invalidates the study.

### 5. Show All Work

The AI must explicitly write out:
- The exhaustive search performed (Strong's numbers used, total count of verses found)
- Every verse examined (or the subset used and why it represents the whole)
- Every candidate considered with reasoning
- Every substitution test with before/after
- The comparison table with scores
- The final selection with documented reasoning

"Mental math" = failure. If it's not written, it didn't happen.

### 6. Resolve Symbolic Recursion

When Scripture defines X = Y, and Y is also a symbol, the AI must trace the chain:

| Scriptural Definition | Problem | Resolution |
|-----------------------|---------|------------|
| HIGHWAY = "Way of Holiness" | "Holiness" is symbolic | Define HOLINESS first |
| ROCK = Christ | What does Christ symbolize here? | Christ = Covenant Mediator → ROCK = Covenant |
| TRUTH = Word | "Word" is symbolic | WORD = Law → TRUTH = God's Commandments |

The recursion must terminate in a **concrete concept**.

### 7. Test Across the ENTIRE Corpus

A proposed meaning must work in:
- Genesis AND Exodus AND Psalms AND John AND Revelation
- Historical books AND prophetic books AND wisdom literature
- Old Testament AND New Testament

If it fails in ANY context, the meaning is wrong or incomplete.

---

## Example AI Output Structure

```markdown
# [SYMBOL] — Symbol Study

## Symbolic Meaning

| Form | Meaning |
|------|---------|
| **One Word** | [Single word] |
| **Two Words** | [Two word phrase] |
| **Sentence** | [Full explanation] |

**Opposite**: [Opposite symbol] = [Its meaning]

---

## The Argument

### 1. The Definitional Evidence
[Verses where Scripture explicitly defines the symbol]

### 2. The Functional Evidence  
[What the symbol DOES — verbs and actions]

### 3. The Behavioral Evidence
[How we're commanded to relate to it]

### 4. The Antithetical Evidence
[Contrast with opposite symbol]

### 5. The Human Application Test
[Can humans BE this? Evidence]

### 6. Why This Meaning and Not Others?
[Candidates considered and rejected with reasons]

---

## Key Proof Texts
[3-5 most important verses with analysis]

---

## Substitution Test

| Verse | Original | Substituted |
|-------|----------|-------------|
| [Ref] | "[Quote]" | "[With meaning substituted]" ✓/✗ |

---

## Conclusion
[Summary of meaning and significance]
```

---

## Validating AI Output

After the AI generates a study, you (the human) must verify:

1. **Are all cited verses accurate?** (AI can misquote — check the references)
2. **Were candidates actually tested, not just listed?**
3. **Does the substitution test ACTUALLY work?** (Try it yourself in the cited verses)
4. **Is the meaning consistent with any symbol list or dictionary you already use?**
5. **Does it create contradictions with Torah?**

The AI is a research assistant. The human is responsible for truth.

---

## Do Not Trust AI's Conclusion — Rely on the Spirit

**Do not blindly trust the AI's conclusion.** AI lacks the Holy Spirit. It can surface scriptures, suggest connections, and organize evidence—but it cannot give true spiritual understanding. Use AI as a **tool** to find verses and patterns; **rely upon the Holy Spirit** to reveal what they mean.

The symbol studies presented in this app have all been **human-reviewed** to be sensible and scripturally grounded. We stand behind them as careful work. At the same time, we recognize they could be strengthened with even more human touch—deeper meditation, pastoral wisdom, and the kind of understanding that comes only from the Spirit. Treat the app's symbol dictionary as a helpful map, not final authority. Let the Spirit lead you into truth.

---

## Why This Works

This methodology forces AI to:
- **Search Scripture** rather than regurgitate commentary
- **Generate multiple options** rather than anchor on first guess
- **Test systematically** rather than confirm bias
- **Show work** so errors can be caught
- **Trace definitions** rather than assume meanings

The result: AI helps with the labor-intensive research while the methodology controls the process and prevents hallucination.

---

*See also your human study methodology document for the manual (non-AI) symbol study process.*
