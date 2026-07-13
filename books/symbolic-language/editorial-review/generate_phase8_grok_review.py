#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Generate Phase 8 Grok broad-review proposal ledger.

Proposals only — does not edit manuscript chapters.
IDs: MEAT-0801+
"""

from __future__ import annotations

import csv
import dataclasses
import difflib
import hashlib
import re
import shutil
from pathlib import Path


ROOT = Path(__file__).resolve().parents[3]
BOOK = ROOT / "books" / "symbolic-language"
OUT = BOOK / "editorial-review" / "2026-07-11-phase-8-grok-broad-review"


@dataclasses.dataclass(frozen=True)
class Proposal:
    file: str
    old: str
    new: str
    type: str
    severity: str
    summary: str
    rationale: str
    campaign: str = "P8-C001"
    scope: str = "localized"


# Residual presenter / staging cues after Phases 1–7, plus one factual naming fix.
# Author-rejected items (e.g. bunker → hiding place) are not reopened.
PROPOSALS: list[Proposal] = [
    Proposal(
        "books/symbolic-language/01-introduction.adoc",
        "One set of AI agents — Claude Fable 5, the most advanced model available to me at this writing — was given only the bare list of terms, with no access to this book, and asked for each term's generally accepted symbolic meaning and the scriptural basis for it.",
        "One set of AI agents — Claude, the most advanced model available to me at this writing — was given only the bare list of terms, with no access to this book, and asked for each term's generally accepted symbolic meaning and the scriptural basis for it.",
        "factual-naming",
        "high",
        "Fix nonexistent model name 'Claude Fable 5'.",
        "There is no public Claude model named Fable 5. Elsewhere the book simply says 'Claude.' Naming a nonexistent model invites a hostile reader to dismiss the blind test as careless. Author may prefer a specific real model string (e.g. Claude Opus) — confirm before applying.",
        "P8-C002",
    ),
    Proposal(
        "books/symbolic-language/01-introduction.adoc",
        "Now go back to the synagogue at Capernaum, where this book began — and notice that Jesus began with sym:sym-bread[bread].",
        "Return to the synagogue at Capernaum, where this book began: Jesus began with sym:sym-bread[bread].",
        "ai-sounding-staging",
        "medium",
        "Remove dual stage cues ('Now go back' + 'notice that').",
        "Two presenter instructions in one sentence. The revision keeps the turn and the observation.",
        "P8-C001",
    ),
    Proposal(
        "books/symbolic-language/01-introduction.adoc",
        "Mark that distinction, because the common teaching runs exactly backwards.",
        "The distinction matters, because the common teaching runs exactly backwards.",
        "ai-sounding-staging",
        "medium",
        "Replace 'Mark that' imperative cue.",
        "House style rejects director's-cue staging. The revised line asserts the point without commanding the reader.",
        "P8-C001",
    ),
    Proposal(
        "books/symbolic-language/01-introduction.adoc",
        "But first we must prepare the ground by explaining the difference between a word and a symbol.",
        "First the ground must be prepared: the difference between a word and a symbol.",
        "sentence-open",
        "low",
        "Avoid sentence-initial 'But' (house style).",
        "House style: sentences never start with That/And/But. The revision keeps the roadmap and drops the banned openers.",
        "P8-C003",
    ),
    Proposal(
        "books/symbolic-language/02-the-parables-of-the-kingdom.adoc",
        "Stop and weigh that rebuke.",
        "That rebuke is the hinge of the chapter.",
        "ai-sounding-staging",
        "medium",
        "Replace 'Stop and weigh' presenter command.",
        "Among the loudest residual AI/presenter cues after prior audits. States the weight without staging the reader.",
        "P8-C001",
    ),
    Proposal(
        "books/symbolic-language/02-the-parables-of-the-kingdom.adoc",
        "Close the Gospels; what could a hearer of Moses and the prophets make of that?",
        "Set the Gospels aside: what could a hearer of Moses and the prophets make of that?",
        "ai-sounding-staging",
        "low",
        "Soften stage-direction 'Close the Gospels'.",
        "'Close the Gospels' reads as a classroom instruction. 'Set aside' keeps the closed-book method without the cue stick.",
        "P8-C001",
    ),
    Proposal(
        "books/symbolic-language/02-the-parables-of-the-kingdom.adoc",
        "Now derive what the thorns *mean*, for the Old Testament assigns that too.",
        "The Old Testament assigns the thorns a meaning as well.",
        "ai-sounding-staging",
        "medium",
        "Replace 'Now derive' workshop cue.",
        "The argument already derives; the cue tells the reader to perform the author's step. State the claim.",
        "P8-C001",
    ),
    Proposal(
        "books/symbolic-language/03-signs-and-similitudes.adoc",
        "But watch what Scripture calls a sign, and notice that there is no wonder in it anywhere.",
        "Scripture's own uses of the word carry no wonder on the spot.",
        "ai-sounding-staging",
        "medium",
        "Remove stacked 'watch' + 'notice that' cues.",
        "Two stage directions plus a But-open. The revision asserts the finding directly.",
        "P8-C001",
    ),
    Proposal(
        "books/symbolic-language/03-signs-and-similitudes.adoc",
        "Now test the definition on the most famous sign in the Bible:",
        "The most famous sign in the Bible tests the definition:",
        "ai-sounding-staging",
        "low",
        "Replace 'Now test' imperative transition.",
        "Keeps the pivot into Isaiah 7:14 without a lab-instruction cadence.",
        "P8-C001",
    ),
    Proposal(
        "books/symbolic-language/03-signs-and-similitudes.adoc",
        "But mark what happened on the day the sign was given: nothing.",
        "On the day the sign was given, nothing happened.",
        "ai-sounding-staging",
        "medium",
        "Replace 'But mark what happened' cue.",
        "The blunt fact ('nothing') is stronger without the presenter frame.",
        "P8-C001",
    ),
    Proposal(
        "books/symbolic-language/08-the-name.adoc",
        "Notice that God, answering, plays on David’s own word — for a __“house”__ in Scripture is a building _and_ a family line, and a family line is exactly what carries a name.",
        "God, answering, plays on David’s own word — for a __“house”__ in Scripture is a building _and_ a family line, and a family line is exactly what carries a name.",
        "ai-sounding-staging",
        "low",
        "Drop 'Notice that' prefix.",
        "The observation is strong enough without the finger-pointing opener.",
        "P8-C001",
    ),
    Proposal(
        "books/symbolic-language/15-the-remnant.adoc",
        "Weigh the chapter the way the evidence is built.",
        "The chapter is built the way the evidence is built.",
        "ai-sounding-staging",
        "medium",
        "Replace chapter-opening 'Weigh the…' command.",
        "A method chapter should demonstrate method, not instruct the reader how to hold the scales. Alternative if preferred: 'The evidence is built in independent lines.'",
        "P8-C001",
    ),
    Proposal(
        "books/symbolic-language/15-the-remnant.adoc",
        "The most demonstratively religious one percent was not enough — hold that word __“exceed”__; the Hebrew of the remnant will hand it back to us shortly.",
        "The most demonstratively religious one percent was not enough — the word __“exceed”__ returns in the Hebrew of the remnant shortly.",
        "ai-sounding-staging",
        "low",
        "Replace 'hold that word' aside.",
        "Keeps the lexical foreshadow without a stage whisper to the reader.",
        "P8-C001",
    ),
    Proposal(
        "books/symbolic-language/24-path-to-salvation.adoc",
        "Now watch what the formula leaves out.",
        "The formula leaves something out.",
        "ai-sounding-staging",
        "medium",
        "Replace last residual 'Now watch' in print manuscript.",
        "Only remaining 'Now watch' after Phases 1–7. One of the most quotable AI-presenter fingerprints.",
        "P8-C001",
    ),
    Proposal(
        "books/symbolic-language/31-the-pearl.adoc",
        "Weigh them all; the reading asks no favors.",
        "Taken together, the readings ask no favors.",
        "ai-sounding-staging",
        "low",
        "Replace 'Weigh them all' closer cue.",
        "The list has already done the weighing; the line can close without a command.",
        "P8-C001",
    ),
    Proposal(
        "books/symbolic-language/32-the-sabbath.adoc",
        "Read the commandment again with the unit in view, and notice that it legislates all seven days:",
        "Read with the unit in view: the commandment legislates all seven days:",
        "ai-sounding-staging",
        "low",
        "Trim double cue before Exodus quote.",
        "Keeps the re-read invitation, drops 'notice that.'",
        "P8-C001",
    ),
    Proposal(
        "books/symbolic-language/33-time-tested-tradition.adoc",
        "Before weighing the evidence, weigh the witnesses, for Scripture itself commands it.",
        "The witnesses come first, for Scripture itself commands it.",
        "ai-sounding-staging",
        "low",
        "Replace double 'weigh' legal-presenter open.",
        "The next block already cites the witness texts. State the order without the scales metaphor twice.",
        "P8-C001",
    ),
    Proposal(
        "books/symbolic-language/35-the-fall-of-babylon.adoc",
        "And mark what an almond *is*: a fruit that is itself a sym:sym-seed[seed] — and __“the seed is the *word of God*”__ (Luke 8:11).",
        "An almond *is* a fruit that is itself a sym:sym-seed[seed] — and __“the seed is the *word of God*”__ (Luke 8:11).",
        "ai-sounding-staging",
        "low",
        "Drop 'And mark what… is' frame.",
        "House style: no And-open, no mark-cue. The definition stands cleaner alone.",
        "P8-C001",
    ),
    Proposal(
        "books/symbolic-language/39-mountain.adoc",
        "Now consider this poetic picture from Joel:",
        "Joel gives the same picture in poetry:",
        "ai-sounding-staging",
        "medium",
        "Replace 'Now consider this poetic picture'.",
        "Presenter packaging around a quote. Joel can introduce himself.",
        "P8-C001",
    ),
    Proposal(
        "books/symbolic-language/40-sea-and-waters.adoc",
        "Notice that this is the very same chapter that defined the mountain (Revelation 17:9-10).",
        "This is the same chapter that defined the mountain (Revelation 17:9-10).",
        "ai-sounding-staging",
        "low",
        "Drop 'Notice that' before cross-chapter bridge.",
        "The bridge is already clear; the cue only adds AI cadence.",
        "P8-C001",
    ),
    Proposal(
        "books/symbolic-language/22-worship.adoc",
        "Now consider the first time the word appears in the Bible, because Scripture’s first use of a word is a teacher.",
        "Scripture’s first use of a word is a teacher, and the first appearance of this one is no exception.",
        "ai-sounding-staging",
        "low",
        "Replace 'Now consider the first time…' cue.",
        "States the method claim without a workshop lead-in.",
        "P8-C001",
    ),
    Proposal(
        "books/symbolic-language/16x-weeping-and-gnashing.adoc",
        "Now walk the seven texts and mark who is cast out — for it is never the heathen:",
        "The seven texts name who is cast out — and it is never the heathen:",
        "ai-sounding-staging",
        "medium",
        "Replace dual 'walk… and mark' staging.",
        "Digital bonus chapter still carries the presenter pair Phases 1–7 largely cleared from print core.",
        "P8-C001",
    ),
]


CAMPAIGNS = {
    "P8-C001": (
        "Residual Presenter Staging (Grok)",
        "After Phases 1–7, a thin residual layer of Now-watch / Mark-that / Notice-that / "
        "Weigh-the… cues remains. These are the same director's-cue fingerprints the initial "
        "AI-audit flagged. Localized rewrites propose asserting the point instead of staging "
        "the reader. Accept/reject per line — some retained cues may be deliberate voice.",
    ),
    "P8-C002": (
        "Factual Naming And Blind-Test Disclosure",
        "The Introduction's blind-test attribution names 'Claude Fable 5,' which is not a "
        "known model. Align naming with the rest of the book's plain 'Claude' (or the real "
        "model string the author used). Optional follow-up: one consistent footnote style for "
        "prevalence-table method already centralized in How to Use.",
    ),
    "P8-C003": (
        "Sentence-Open House Style (And/But/That)",
        "House style bans sentence-initial That/And/But in author prose. Scans still find "
        "hundreds of hits, many inside scripture quotes (correct) and many in author lines "
        "(candidates). Not a blind global replace — only clear prose opens belong in this ledger; "
        "the campaign tracks the broader pass.",
    ),
    "P8-C004": (
        "Em-Dash Density And Long-Sentence Load",
        "Em-dash rates remain ~18–32 per 1,000 words across major chapters (trade prose is "
        "often several times sparser). ~246 prose sentences run 55+ words. Neither is a defect "
        "per se in this book's dense style, but peaks (Noah Uncovered, Pearl, Sun/Moon/Stars, "
        "glossary) are the best thinning targets if a further cadence pass is wanted. No "
        "automatic patches — chapter-level judgment only.",
    ),
    "P8-C005": (
        "Broad Critical Notes (Non-Patch)",
        "Structural and reader-experience notes from the Grok broad review: part architecture, "
        "argument interdependence, accessibility of dense chapters, residual AI-seam risk "
        "where polished chapters sit beside rougher human strata. See GROK-BROAD-REVIEW.md "
        "in this audit folder. No manuscript patches attached to campaign rows.",
    ),
}


def rel(path: Path) -> str:
    return str(path.relative_to(ROOT))


def hash_text(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()[:16]


def ensure_clean_out() -> None:
    if OUT.exists():
        shutil.rmtree(OUT)
    for sub in ("previews", "patches", "campaigns", "scans"):
        (OUT / sub).mkdir(parents=True)


def find_line(file_rel: str, old: str) -> tuple[int, list[str]]:
    path = ROOT / file_rel
    lines = path.read_text(encoding="utf-8").splitlines(keepends=True)
    for i, line in enumerate(lines, start=1):
        if line.rstrip("\n") == old:
            return i, lines
    raise ValueError(f"Could not find exact source line in {file_rel}: {old[:90]!r}")


def context_for(lines: list[str], line_no: int, radius: int = 2) -> str:
    start = max(1, line_no - radius)
    end = min(len(lines), line_no + radius)
    out = []
    for n in range(start, end + 1):
        prefix = ">" if n == line_no else " "
        out.append(f"{prefix} {n}: {lines[n - 1].rstrip()}")
    return "\n".join(out)


def write_patch(issue_id: str, p: Proposal, line_no: int, lines: list[str]) -> str:
    old_lines = [line.rstrip("\n") for line in lines]
    new_lines = list(old_lines)
    new_lines[line_no - 1] = p.new
    diff = difflib.unified_diff(
        old_lines,
        new_lines,
        fromfile=f"a/{p.file}",
        tofile=f"b/{p.file}",
        lineterm="",
    )
    patch = "\n".join(diff) + "\n"
    path = OUT / "patches" / f"{issue_id}.diff"
    path.write_text(patch, encoding="utf-8")
    return rel(path)


def write_preview(
    issue_id: str, p: Proposal, line_no: int, lines: list[str], patch_path: str
) -> str:
    path = OUT / "previews" / f"{issue_id}.md"
    preview = f"""# {issue_id}

Status: pending
Scope: {p.scope}
Type: {p.type}
Severity: {p.severity}
Campaign: {p.campaign}
File: `{p.file}`
Location: line {line_no}

## Summary

{p.summary}

## Current

```adoc
{p.old}
```

## Proposed

```adoc
{p.new}
```

## Rationale

{p.rationale}

## Context

```text
{context_for(lines, line_no)}
```

## Patch

`{patch_path}`
"""
    path.write_text(preview, encoding="utf-8")
    return rel(path)


def write_campaigns() -> list[dict[str, str]]:
    rows: list[dict[str, str]] = []
    for cid, (title, body) in CAMPAIGNS.items():
        path = OUT / "campaigns" / f"{cid.lower()}.md"
        path.write_text(
            f"# {cid}: {title}\n\n{body}\n",
            encoding="utf-8",
        )
        rows.append(
            {
                "id": f"MEAT-{cid}",
                "status": "pending",
                "scope": "systematic",
                "type": "campaign",
                "severity": "medium",
                "file": "",
                "start_line": "",
                "end_line": "",
                "summary": title,
                "patch_path": "",
                "preview_path": rel(path),
                "campaign": cid,
                "original_hash": "",
                "reviewer_notes": "",
                "decided_at": "",
                "applied_at": "",
                "apply_error": "",
            }
        )
    return rows


def write_scans() -> None:
    files = sorted(
        p
        for p in BOOK.glob("*.adoc")
        if re.match(r"^\d", p.name) and "draft" not in p.name
    )
    staging_rx = re.compile(
        r"\b(Now watch|Now go|Now derive|Now test|Now consider|Stop and weigh|"
        r"Mark that|But mark|And mark|Notice that|Weigh the|Weigh them|"
        r"hold that word|Close the Gospels|Read the commandment again)\b",
        re.I,
    )
    with (OUT / "scans" / "residual-staging.csv").open("w", newline="", encoding="utf-8") as fh:
        w = csv.writer(fh, lineterminator="\n")
        w.writerow(["file", "line", "match", "text"])
        for path in files:
            text = path.read_text(encoding="utf-8")
            for m in staging_rx.finditer(text):
                ln = text.count("\n", 0, m.start()) + 1
                line = text.splitlines()[ln - 1].strip()
                w.writerow([rel(path), ln, m.group(0), line])

    with (OUT / "scans" / "em-dash-density.csv").open("w", newline="", encoding="utf-8") as fh:
        w = csv.writer(fh, lineterminator="\n")
        w.writerow(["file", "words", "em_dashes", "per_1000"])
        for path in files:
            text = path.read_text(encoding="utf-8")
            if text.startswith("---"):
                parts = text.split("---", 2)
                body = parts[2] if len(parts) >= 3 else text
            else:
                body = text
            words = len(re.findall(r"\b[\w’']+\b", body))
            dashes = body.count("—")
            rate = round(dashes * 1000 / words, 2) if words else 0
            w.writerow([rel(path), words, dashes, rate])


def write_readme(n_local: int, n_campaign: int) -> None:
    (OUT / "README.md").write_text(
        f"""# Phase 8 — Grok Broad Review Audit

Generated as **proposals only**. No manuscript file was modified by this generator.

## Counts

- Localized proposed patches: {n_local}
- Systematic campaign rows: {n_campaign}
- Total CSV rows: {n_local + n_campaign}
- Reviewer: Grok (broad editorial + residual cadence pass)
- Prior coverage: Phases 1–7 (AI cadence, run-ons, metaphors, twin, audio flow/punctuation)

## Focus

1. **Residual presenter staging** still audible after prior thinning (Now watch / Mark that / Notice that / Weigh…).
2. **Factual naming**: Introduction's "Claude Fable 5" (not a known model).
3. **Campaigns** for And/But opens, em-dash/long-sentence load, and non-patch structural notes.
4. Narrative assessment: `GROK-BROAD-REVIEW.md` in this folder.

## Not reopened

- Author-**rejected** items from earlier phases (e.g. bunker → hiding place) are left alone.
- Phase 7 audio quote/punctuation ledger remains separate (`…phase-7-…`, still pending).
- Phase 1 `MEAT-0024` still `needs-rewrite` in the initial-audit ledger (liberty / market-forces metaphor).

## Review

```bash
books/symbolic-language/editorial-review/review.py --audit-dir books/symbolic-language/editorial-review/2026-07-11-phase-8-grok-broad-review ui
books/symbolic-language/editorial-review/review.py --audit-dir books/symbolic-language/editorial-review/2026-07-11-phase-8-grok-broad-review list --status pending --all
books/symbolic-language/editorial-review/review.py --audit-dir books/symbolic-language/editorial-review/2026-07-11-phase-8-grok-broad-review validate --status pending --verbose
```

After accept/reject decisions:

```bash
books/symbolic-language/editorial-review/review.py --audit-dir books/symbolic-language/editorial-review/2026-07-11-phase-8-grok-broad-review apply --dry-run
books/symbolic-language/editorial-review/review.py --audit-dir books/symbolic-language/editorial-review/2026-07-11-phase-8-grok-broad-review apply --yes
```
""",
        encoding="utf-8",
    )


def write_broad_review() -> None:
    (OUT / "GROK-BROAD-REVIEW.md").write_text(
        """# Grok Broad Review — *MEAT The Bible's Symbolic Language*

**Reviewer:** Grok  
**Mode:** Broad critical + residual editorial pass  
**Manuscript:** `books/symbolic-language/*.adoc` (~157k words, print + digital bonus)  
**Date:** 2026-07-11  
**Integration rule:** Proposals only. Apply only after author accept via `review.py`.

---

## 1. What this book is

This is not a devotion book and not a survey of “biblical imagery.” It is a method book that claims Scripture defines its own vocabulary by cross-text use, then applies that method across a large glossary and a sequence of case studies (parables → recovered words → covenant symbols → end-time images). The Introduction’s milk/meat frame and the Parables exam set the rules; later chapters spend the capital those rules mint.

As a thesis-driven work of biblical interpretation, its ambition is high and largely earned: the best chapters (Parables, Sign of Jonah, Coin, Remnant, Pearl, Sea) do not merely assert symbols — they force the reader through witnesses until the common reading has to answer for itself.

---

## 2. Strengths (protect these)

1. **Method first, glossary second.** The book teaches a procedure (gather uses, demand multiple witnesses, refuse one-verse doctrine) before it sells definitions. That is rarer and more valuable than another symbol dictionary.
2. **Doctrinal spine is idiosyncratic and sustained.** Law-positive, obedience-before-clarity (John 7:17), meat as completed word, remnant ratios, calendar/sabbath threads — this is not autocomplete theology. Hostile readers may reject it; they cannot call it generic.
3. **Scripture density with scene, not proof-text spray.** Strong chapters put the scene first, quote enough text to carry the point, then conclude — matching the house style and reading like argument, not concordance dump.
4. **Honest tooling disclosure.** Blind AI consensus test, prevalence tables tagged as estimates, copyright page admitting AI image/language assistance: this is more transparent than most religious nonfiction that used the same tools silently.
5. **Prior editorial work is real.** Phases 1–7 already removed the worst AI-cadence, run-on, metaphor, twin, and audio-flow defects. The manuscript is no longer the rough AI-assisted draft the 2026-07-07 forensic audit described.

---

## 3. Residual risks (what a sharp critic still hears)

### 3.1 Presenter residue (patchable — this ledger)

A thin layer of director’s cues remains: *Now watch / Mark that / Notice that / Weigh the / Stop and weigh / Now derive*. Volume is far below the original ~80+ imperative stack, but the survivors sit in high-traffic chapters (Introduction, Parables, Signs, Path to Salvation, Remnant). They are the same fingerprint class as Phase 1’s C001. Localized proposals in this audit target the loudest residues only.

### 3.2 Cadence sameness (campaign, not blind patch)

Em-dash density is still high (~18–32 / 1k words in major chapters). Long sentences (55+ words) remain common where quote chains run. Neither is fatal for this author’s voice — density *is* the book’s texture — but peaks (Pearl, Sun/Moon/Stars, Noah Uncovered, Sea) will still read “machine-polished” next to any chapter that kept human roughness. If the hardcover must silence the AI-seam critique, thin dashes and split evidence→assembly seams at the peaks, not globally.

### 3.3 And/But/That opens (house style debt)

House style forbids sentence-initial *And/But/That* in author prose. Scans still find hundreds of hits; many are inside quotes (keep), many are author lines (fix). Only a few clear prose opens are patched here; a full pass is P8-C003.

### 3.4 Factual naming slip (high priority)

Introduction: **“Claude Fable 5”** — not a known model. Everywhere else the book says “Claude.” This is a small line with outsized reputational cost next to a blind-test claim. See MEAT-0801.

### 3.5 Structural load on the reader

- **Interdependence:** Reject the method (or a key early symbol) and large stretches of Parts III–V weaken together. That is a feature of the design, but the Introduction could state the dependency more plainly for skeptical readers.
- **Length variance:** Sea (~7.8k), Pearl (~5.8k), Remnant (~5.5k) vs thinner chapters (Four Winds, etc.) create uneven pacing. Not a defect if intentional; worth a final TOC pass for “can a reader finish one argument in one sitting?”
- **Digital bonuses** (`16x`, `38x`, `41x`) carry slightly more staging residue than the print spine — fine for web, slightly less tight for anyone reading the full digital bundle as one book.

### 3.6 Open ledger items outside this phase

| Item | Where | Note |
|------|--------|------|
| MEAT-0024 needs-rewrite | Phase 1, Liberty | market-forces metaphor — rewrite still owed |
| Phase 7 pending (23) | Audio quote punctuation | separate accept pass |
| Prevalence “I asked Claude” body lines | Mountain, Sea, etc. | How-to-use note centralized; body still names Claude often — author voice or footnote polish |

---

## 4. Argument quality (broad, not verse-by-verse audit)

- **Best-in-book pattern work:** Parables of the Kingdom, Sign of Jonah, Sea and Waters, Remnant — multiple independent lines, counter-texts engaged, conclusions earned.
- **Recovered-word chapters** (Gospel, Knowing/Faith/Love/Belief, Path to Salvation): high stakes; generally careful with Strong’s and parallel witnesses. A full skeptical fact-check of every Hebrew claim is *not* what this pass did; treat contested lexical moves (unpointed readings, single-occurrence verbs) as always needing the research/ file behind them.
- **Calendar / TTT bridge chapters** assume the companion book’s frame. Fair if the reader has it; abrupt if not. The Time Tested Tradition chapter should remain a doorway, not a second full calendar treatise inside MEAT.
- **Prevalence tables:** Method disclosure in How to Use is the right fix. Body prose that still says “I asked Claude…” is consistent voice; just don’t let it become the emotional climax of a section.

---

## 5. Production / reader experience (spot check)

- Copyright page is in good shape (ISBN, NKJV/ESV/AMP notices, AI illustration/text disclosure, free-reproduction clause).
- How to Use correctly frames Est. % columns.
- Glossary scale and chapter cross-links are a major product feature; keep badge counts true after any glossary edit.
- Audio twins: Phase 6–7 show the right discipline (print is source of truth; audio gets spoken lead-ins). Finish Phase 7 before regenerating narration for affected chapters.

---

## 6. Verdict

**Publishable hardcover quality is within reach** after prior audit phases. What remains is not “is this a real book?” but “can a hostile reviewer still quote AI-presenter residue and one bad model name?” This phase logs the cleanest remaining fixes for that question, plus campaigns for deeper cadence work the author may defer.

**Overall:** rigorous, original, scripture-heavy, methodologically serious. Residual polish is about *voice hygiene and one factual string*, not about inventing an argument the book lacks.

---

## 7. Review formats

### One paragraph

*MEAT The Bible’s Symbolic Language* teaches a cross-text method for recovering Scripture’s own vocabulary, then spends that method across a large glossary and a sequence of demanding case studies. Its best chapters earn their overturns with multiple witnesses and scene-first quotation; its main remaining editorial risk is a thin residue of presenter cues and cadence sameness after otherwise successful anti-AI-polish passes — plus one high-visibility model-name error in the Introduction’s blind test. Serious Bible students who will test claims will find it substantial; readers seeking light devotion will not.

### One sentence

A serious, method-driven recovery of biblical symbolic vocabulary whose arguments are largely earned and whose remaining work is residual voice hygiene, not structural rescue.

### One phrase

Method first, polish left

---

## 8. How proposals are logged (for the author)

| Artifact | Role |
|----------|------|
| `issues.csv` | Ledger: status, type, severity, file, lines, campaign |
| `previews/MEAT-*.md` | Human before/after + rationale |
| `patches/MEAT-*.diff` | Candidate `git apply` patch |
| `campaigns/` | Systematic notes — **not** blind-applied |
| `scans/` | Machine triage CSVs |
| `review.py` | UI accept/reject/apply |

Statuses: `pending` → `accepted` / `rejected` / `needs-rewrite` / `needs-fact-check` → `apply` → `applied`.

**Nothing in this folder has been applied to the manuscript.**
""",
        encoding="utf-8",
    )


def main() -> None:
    ensure_clean_out()
    write_scans()
    write_broad_review()

    fieldnames = [
        "id",
        "status",
        "scope",
        "type",
        "severity",
        "file",
        "start_line",
        "end_line",
        "summary",
        "patch_path",
        "preview_path",
        "campaign",
        "original_hash",
        "reviewer_notes",
        "decided_at",
        "applied_at",
        "apply_error",
    ]
    rows: list[dict[str, str]] = []
    next_id = 801

    for p in PROPOSALS:
        issue_id = f"MEAT-{next_id:04d}"
        next_id += 1
        line_no, lines = find_line(p.file, p.old)
        patch_path = write_patch(issue_id, p, line_no, lines)
        preview_path = write_preview(issue_id, p, line_no, lines, patch_path)
        rows.append(
            {
                "id": issue_id,
                "status": "pending",
                "scope": p.scope,
                "type": p.type,
                "severity": p.severity,
                "file": p.file,
                "start_line": str(line_no),
                "end_line": str(line_no),
                "summary": p.summary,
                "patch_path": patch_path,
                "preview_path": preview_path,
                "campaign": p.campaign,
                "original_hash": hash_text(p.old),
                "reviewer_notes": "",
                "decided_at": "",
                "applied_at": "",
                "apply_error": "",
            }
        )

    campaign_rows = write_campaigns()
    rows.extend(campaign_rows)
    write_readme(len(PROPOSALS), len(campaign_rows))

    with (OUT / "issues.csv").open("w", newline="", encoding="utf-8") as fh:
        writer = csv.DictWriter(fh, fieldnames=fieldnames, lineterminator="\n")
        writer.writeheader()
        writer.writerows(rows)

    print(f"Wrote {len(rows)} rows to {rel(OUT)}")
    print(f"  localized: {len(PROPOSALS)}")
    print(f"  campaigns: {len(campaign_rows)}")


if __name__ == "__main__":
    main()
