#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Generate phase-2 proposal data for the symbolic-language manuscript."""

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
OUT = BOOK / "editorial-review" / "2026-07-10-phase-2-audit"
SOURCE_NOTE = (
    "_Estimate note:_ Percentages are Claude estimates from the stated categories; "
    "they are approximate, not published survey statistics."
)
RUNON_SCAN_MIN_CHARS = 650
RUNON_SCAN_MIN_SENTENCES = 3
RUNON_PATCH_MIN_CHARS = 1000
RUNON_PROPOSAL_LIMIT = 20


@dataclasses.dataclass(frozen=True)
class Proposal:
    file: str
    old: str
    new: str
    type: str
    severity: str
    summary: str
    rationale: str
    campaign: str = ""
    scope: str = "localized"


@dataclasses.dataclass(frozen=True)
class ParagraphCandidate:
    file: str
    start_line: int
    end_line: int
    lines: tuple[str, ...]
    chars: int
    sentence_count: int


MANUAL_PROPOSALS: list[Proposal] = [
    Proposal(
        "books/symbolic-language/18-liberty.adoc",
        "No slaver releases his stock by market forces; only a decree from above the slaver sets the captive walking home.",
        "Pressure, profit, or persuasion may move a slaveholder; Scripture's liberty is of another order: a decree from above him that sends the captive home.",
        "factual-nuance",
        "high",
        "Revise liberty/slavery contrast without overstating market forces.",
        "Phase 1 flagged this line as too absolute. The revision preserves the theological contrast while admitting that incentives can move human actors.",
        "P2-C004",
    ),
    Proposal(
        "books/symbolic-language/04-sign-of-jonah.adoc",
        "Mark who worships first.",
        "The first worship comes from the gentile crew.",
        "presenter-tone",
        "medium",
        "Replace imperative transition with the actual claim.",
        "The revision lowers presenter tone and tells the reader what matters in the next sentence.",
        "P2-C001",
    ),
    Proposal(
        "books/symbolic-language/04-sign-of-jonah.adoc",
        "Notice what Jonah does and does not say.",
        "Jonah's prayer is as revealing for what it omits as for what it says.",
        "presenter-tone",
        "medium",
        "Replace notice-cue with a content-bearing transition.",
        "The revised line keeps the analytical turn without asking the reader to process a stage direction first.",
        "P2-C001",
    ),
    Proposal(
        "books/symbolic-language/04-sign-of-jonah.adoc",
        "Mark the scale the symbols worked at.",
        "The scale of the symbols matters.",
        "presenter-tone",
        "low",
        "Smooth an imperative summary cue.",
        "The revision keeps the summary function while reducing repeated 'Mark...' cadence.",
        "P2-C001",
    ),
    Proposal(
        "books/symbolic-language/11-marriage-and-divorce.adoc",
        "Notice what every camp shares.",
        "Every camp shares the same assumption.",
        "presenter-tone",
        "medium",
        "Replace notice-cue with direct prose.",
        "The revised sentence names the connective point and removes a presenter instruction.",
        "P2-C001",
    ),
    Proposal(
        "books/symbolic-language/31-the-sabbath.adoc",
        "Notice what the continuous week does to the law's own grammar.",
        "The continuous week changes the law's own grammar.",
        "presenter-tone",
        "medium",
        "Turn a notice-cue into the claim itself.",
        "This keeps the argument's hinge while reducing command-to-reader cadence.",
        "P2-C001",
    ),
    Proposal(
        "books/symbolic-language/39-sea-and-waters.adoc",
        "Hold those two facts and step into the boat:",
        "Those two facts set the terms for the boat scene:",
        "presenter-tone",
        "medium",
        "Replace stage direction before the boat scene.",
        "The revision preserves the transition but avoids telling the reader how to move through it.",
        "P2-C001",
    ),
    Proposal(
        "books/symbolic-language/42-garments.adoc",
        "Mark what follows it, for the garment is a *second* gift, given inside the covenant:",
        "What follows is a *second* gift, given inside the covenant:",
        "presenter-tone",
        "medium",
        "Remove imperative framing before the garment passage.",
        "The revised sentence makes the point directly and keeps the emphasis on the second gift.",
        "P2-C001",
    ),
    Proposal(
        "books/symbolic-language/43-the-bow.adoc",
        "Mark the reason they give: a _name_ — __“lest we be scattered.”__",
        "The reason they give is a _name_ — __“lest we be scattered.”__",
        "presenter-tone",
        "medium",
        "Replace Mark-cue with direct syntax.",
        "The change removes presenter tone without weakening the covenant-name argument.",
        "P2-C001",
    ),
    Proposal(
        "books/symbolic-language/24-what-is-the-point.adoc",
        "Weigh the points, then, for what they are.",
        "The points must be weighed for what they are.",
        "presenter-tone",
        "low",
        "Reduce imperative transition.",
        "The revised line keeps the evaluative turn but reads more like book prose than a lecture cue.",
        "P2-C001",
    ),
    Proposal(
        "books/symbolic-language/28-sun-moon-and-stars.adoc",
        "Mark how a bride wears the sun.",
        "A bride wears the sun by receiving and reflecting its light.",
        "presenter-tone",
        "medium",
        "Replace Mark-cue with the actual image logic.",
        "The revision turns the transition into a clarifying claim and prepares the next sentence.",
        "P2-C001",
    ),
    Proposal(
        "books/symbolic-language/01-introduction.adoc",
        "Even so, when he gave the parables of the kingdom his own disciples did not understand, and Jesus rebuked them for it — a fair rebuke, because the keys were already in the Old Testament, the __“dark sayings of old”__ the psalm said he would utter (Mark 4:13; Psalm 78:2-3; Matthew 13:35) — and link:/books/symbolic-language/the-parables-of-the-kingdom/[a chapter ahead sits that exam].footnote:fn01parables[The link:/books/symbolic-language/the-parables-of-the-kingdom/[Parables of the Kingdom] chapter derives each parable of Matthew 13 from the Old Testament alone.]",
        "Even so, when he gave the parables of the kingdom his own disciples did not understand, and Jesus rebuked them for it. The rebuke was fair because the keys were already in the Old Testament: the __“dark sayings of old”__ the psalm said he would utter (Mark 4:13; Psalm 78:2-3; Matthew 13:35). That exam waits a chapter ahead: link:/books/symbolic-language/the-parables-of-the-kingdom/[The Parables of the Kingdom].footnote:fn01parables[The link:/books/symbolic-language/the-parables-of-the-kingdom/[Parables of the Kingdom] chapter derives each parable of Matthew 13 from the Old Testament alone.]",
        "long-sentence",
        "medium",
        "Split a long introductory sentence into three steps.",
        "The original carries rebuke, rationale, citations, link, and footnote in one sentence. The split preserves content while lowering parse load.",
        "P2-C005",
    ),
    Proposal(
        "books/symbolic-language/02-the-parables-of-the-kingdom.adoc",
        "The derivation stands on the Old Testament the disciples held: the Hebrew _peninim_, which the KJV prints as __“rubies,”__ is by Strong's own definition __“probably a pearl (as round)”__ — sym:sym-wisdom[wisdom] is __“more precious than sym:sym-pearl[pearls]”__ (Proverbs 3:15), her price __“above *pearls*”__ (Job 28:18), and the virtuous woman — the sym:sym-marriage[bride] of a later chapter — is __“far above *pearls*”__ (Proverbs 31:10); the seeker who __“searchest for her as for *hid treasures*”__ (Proverbs 2:4) is the merchant himself, one figure in Solomon's book.",
        "The derivation stands on the Old Testament the disciples held. The Hebrew _peninim_, which the KJV prints as __“rubies,”__ is by Strong's own definition __“probably a pearl (as round)”__. Wisdom is __“more precious than sym:sym-pearl[pearls]”__ (Proverbs 3:15), her price __“above *pearls*”__ (Job 28:18), and the virtuous woman — the sym:sym-marriage[bride] of a later chapter — is __“far above *pearls*”__ (Proverbs 31:10). The seeker who __“searchest for her as for *hid treasures*”__ (Proverbs 2:4) is the merchant himself, one figure in Solomon's book.",
        "long-sentence",
        "medium",
        "Split the pearl derivation into smaller claims.",
        "The original stacks lexical, wisdom, bride, and merchant evidence in one sentence. The split lets each step land.",
        "P2-C005",
    ),
    Proposal(
        "books/symbolic-language/11-marriage-and-divorce.adoc",
        "That is why Hosea, God’s sign-and-similitude marriage, must not only endure his wife’s adultery but _buy her back_ — __“So I *bought her* to me for fifteen pieces of silver”__ (Hosea 3:2) — and why the reunion is a fresh betrothal in the vocabulary this book keeps finding at the center: __“I will *betroth thee* unto me for ever; yea, I will betroth thee unto me in sym:sym-righteousness[righteousness], and in sym:sym-judgment[judgment]… and thou shalt sym:sym-knowing[know] the LORD”__ (Hosea 2:19-20).",
        "That is why Hosea, God’s sign-and-similitude marriage, must not only endure his wife’s adultery but _buy her back_ — __“So I *bought her* to me for fifteen pieces of silver”__ (Hosea 3:2). The reunion is a fresh betrothal in the vocabulary this book keeps finding at the center: __“I will *betroth thee* unto me for ever; yea, I will betroth thee unto me in sym:sym-righteousness[righteousness], and in sym:sym-judgment[judgment]… and thou shalt sym:sym-knowing[know] the LORD”__ (Hosea 2:19-20).",
        "long-sentence",
        "medium",
        "Split Hosea remarriage sentence at the quotation boundary.",
        "The revision keeps the argument intact while separating the purchase from the renewed-betrothal point.",
        "P2-C005",
    ),
    Proposal(
        "books/symbolic-language/15-heaven-and-hell.adoc",
        "The rich man and Lazarus (Luke 16) is the fourth parable in a chain of parables, told in the furniture of the day, and its own spoken point is not the architecture of the afterlife but the sufficiency of the Scriptures: __“They have *Moses and the prophets*; let them hear them… If they hear not Moses and the prophets, neither will they be persuaded, though one rose from the dead”__ (Luke 16:29, 31).",
        "The rich man and Lazarus (Luke 16) is the fourth parable in a chain, told in the furniture of the day. Its spoken point is not the architecture of the afterlife but the sufficiency of the Scriptures: __“They have *Moses and the prophets*; let them hear them… If they hear not Moses and the prophets, neither will they be persuaded, though one rose from the dead”__ (Luke 16:29, 31).",
        "long-sentence",
        "medium",
        "Split the rich man and Lazarus sentence.",
        "The revision reduces parse load and keeps the contrast focused on the parable's stated point.",
        "P2-C005",
    ),
    Proposal(
        "books/symbolic-language/42-garments.adoc",
        "In English the two senses share one word, and the pun is ours, not the Hebrew's — _or_ is the light that shines, _qal_ the light that weighs nothing, and the Greek splits them the same way — but the doctrine needs no pun: the armor made of light is also the armor that is light, because the One who wore it first carries the weight.",
        "In English the two senses share one word, and the pun is ours, not the Hebrew's: _or_ is the light that shines, _qal_ the light that weighs nothing, and the Greek splits them the same way. But the doctrine needs no pun: the armor made of light is also the armor that is light, because the One who wore it first carries the weight.",
        "long-sentence",
        "medium",
        "Split the light/lightness clarification.",
        "The split separates the lexical clarification from the doctrinal conclusion, making a dense point easier to parse.",
        "P2-C005",
    ),
]


FOLLOWUP_PROPOSALS: list[Proposal] = [
    Proposal(
        "books/symbolic-language/10-the-coin.adoc",
        "Most reach for gematria here.\nScripture uses the number first, and uses it twice: once as money, once as a census — the two things the beast's enrollment controls.",
        "Most reach for gematria here, as though Revelation were asking for another candidate whose letters add to 666.\nThis chapter's claim is different: Revelation 13 is not first a gematria problem but a covenant census problem.\nScripture uses the number first, and uses it twice: once as money, once as a census — the two things the beast's enrollment controls.",
        "content-emphasis",
        "medium",
        "Emphasize the Coin chapter's original 666 contribution.",
        "The strongest contribution is the shift from candidate-hunting by gematria to reading Revelation 13 as a covenant census problem. The revision makes that frame explicit before the evidence begins.",
        "P2-C007",
    ),
    Proposal(
        "books/symbolic-language/14-the-remnant.adoc",
        "Applied to a world of 8 billion, that is on the order of *17 million people* — roughly 1 in 500 people worldwide, or about 1 in 140 professing Christians if measured against 2.4 billion; spread across the world's millions of congregations, fewer than a handful in each, and they are not spread evenly.\nThis is the same signature this book found at the Red Sea and in the belly of the fish: too many independent lines agreeing too exactly to be anyone's literary invention.",
        "Applied to a world of 8 billion, that is on the order of *17 million people* — roughly 1 in 500 people worldwide, or about 1 in 140 professing Christians if measured against 2.4 billion; spread across the world's millions of congregations, fewer than a handful in each, and they are not spread evenly.\n\nThis is where the Coin chapter's conclusion returns.\nThere, 666 was not treated as a gematria hunt but as a covenant census problem: the _one man_ of the Hebrew Revelation stands against 666, a 1-in-666 signal near this same narrow band.\nCounting the remnant is the first step toward calculating the beast's number — the number of his name — because one census reveals the other by subtraction: population minus the redeemed, the people enrolled under the beast's name.\n\nThis is the same signature this book found at the Red Sea and in the belly of the fish: too many independent lines agreeing too exactly to be anyone's literary invention.",
        "cross-reference",
        "medium",
        "Tie the Remnant convergence back to the Coin chapter's 666 census frame.",
        "The Remnant chapter currently gives the ratio but does not remind the reader why that count matters for Revelation 13. The added paragraph connects the remnant count to the 1-in-666 signal and the subtraction logic of the beast's census.",
        "P2-C007",
    ),
]


def hash_text(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()[:16]


def rel(path: Path) -> str:
    return str(path.relative_to(ROOT))


def find_line_number(text: str, needle: str) -> int:
    idx = text.find(needle)
    if idx < 0:
        raise ValueError("needle not found")
    return text[:idx].count("\n") + 1


def is_sentence_boundary(line: str) -> bool:
    stripped = line.strip()
    return bool(re.search(r"[.!?](?:[\"')\]]|__|_|\*)*$", stripped))


def sentenceish_count(text: str) -> int:
    return len(re.findall(r"[.!?](?:[\"')\]]|__|_|\*)?(?=\s|$)", text))


def is_structural_line(stripped: str) -> bool:
    if not stripped:
        return True
    if stripped in {"'''", "---"}:
        return True
    if stripped.startswith(("=", "[", ".", "|", "//")):
        return True
    if stripped.startswith(("ifdef::", "ifndef::", "endif::")):
        return True
    if re.match(r"^(?:\*+|-+|\.+)\s+", stripped):
        return True
    if re.match(r"^\d+\.\s+", stripped):
        return True
    if stripped.startswith("image::"):
        return True
    if "::" in stripped and stripped.startswith("[["):
        return True
    return False


def should_scan_file(path: Path) -> bool:
    name = path.name
    return (
        name.endswith(".adoc")
        and not name.startswith("draft-")
        and name not in {"48-glossary.adoc", "49-about-the-author.adoc"}
    )


def runon_candidates() -> list[ParagraphCandidate]:
    candidates: list[ParagraphCandidate] = []

    for path in sorted(BOOK.glob("*.adoc")):
        if not should_scan_file(path):
            continue

        rel_file = rel(path)
        lines = path.read_text(encoding="utf-8").splitlines()
        current: list[tuple[int, str]] = []
        in_front_matter = False
        front_matter_done = False
        in_block = False
        block_delimiter = ""

        def flush() -> None:
            nonlocal current
            if not current:
                return
            paragraph = " ".join(line.strip() for _, line in current)
            chars = len(paragraph)
            sentences = sentenceish_count(paragraph)
            if (
                chars >= RUNON_SCAN_MIN_CHARS
                and sentences >= RUNON_SCAN_MIN_SENTENCES
                and len(current) >= 3
            ):
                candidates.append(
                    ParagraphCandidate(
                        rel_file,
                        current[0][0],
                        current[-1][0],
                        tuple(line for _, line in current),
                        chars,
                        sentences,
                    )
                )
            current = []

        for line_no, line in enumerate(lines, start=1):
            stripped = line.strip()

            if line_no == 1 and stripped == "---":
                flush()
                in_front_matter = True
                continue
            if in_front_matter:
                if stripped == "---":
                    in_front_matter = False
                    front_matter_done = True
                continue
            if not front_matter_done and stripped == "---":
                flush()
                in_front_matter = True
                continue

            if stripped in {"____", "----", "....", "++++"} or stripped == "|===":
                flush()
                if in_block and stripped == block_delimiter:
                    in_block = False
                    block_delimiter = ""
                else:
                    in_block = True
                    block_delimiter = stripped
                continue
            if in_block:
                continue

            if is_structural_line(stripped):
                flush()
                continue

            current.append((line_no, line))

        flush()

    return sorted(
        candidates,
        key=lambda candidate: (-candidate.chars, candidate.file, candidate.start_line),
    )


def choose_paragraph_split(lines: tuple[str, ...]) -> int | None:
    target = len(lines) / 2
    boundary_indexes = [
        index
        for index in range(1, len(lines))
        if is_sentence_boundary(lines[index - 1])
    ]
    if not boundary_indexes:
        return None
    return min(boundary_indexes, key=lambda index: abs(index - target))


def runon_paragraph_proposals(
    candidates: list[ParagraphCandidate],
) -> list[Proposal]:
    proposals: list[Proposal] = []
    manual_old_texts = [proposal.old for proposal in MANUAL_PROPOSALS]

    for candidate in candidates:
        if len(proposals) >= RUNON_PROPOSAL_LIMIT:
            break
        if candidate.chars < RUNON_PATCH_MIN_CHARS:
            continue

        old = "\n".join(candidate.lines)
        if any(manual_old in old for manual_old in manual_old_texts):
            continue

        split_index = choose_paragraph_split(candidate.lines)
        if split_index is None:
            continue

        new = "\n".join(
            [
                *candidate.lines[:split_index],
                "",
                *candidate.lines[split_index:],
            ]
        )
        opening = re.sub(r"\s+", " ", candidate.lines[0].strip())
        if len(opening) > 72:
            opening = opening[:69].rstrip() + "..."

        proposals.append(
            Proposal(
                candidate.file,
                old,
                new,
                "run-on-paragraph",
                "medium" if candidate.chars >= 1200 or candidate.sentence_count >= 6 else "low",
                f"Break long paragraph beginning '{opening}' into two paragraphs.",
                (
                    f"This paragraph is {candidate.chars} characters across "
                    f"{candidate.sentence_count} sentence-like units. The proposal only "
                    "inserts a paragraph break at an existing sentence boundary; no wording changes."
                ),
                "P2-C006",
            )
        )

    return proposals


def source_table_proposals() -> list[Proposal]:
    proposals: list[Proposal] = []
    table_re = re.compile(
        r"(?ms)^\..*?\n\[\.prevalence-table[^\n]*\]\n\|===\n.*?\|==="
    )
    for path in sorted(BOOK.glob("*.adoc")):
        rel_file = rel(path)
        text = path.read_text(encoding="utf-8")
        for match in table_re.finditer(text):
            table = match.group(0)
            if "| Rank | Common interpretation | Est. %" not in table:
                continue
            after = text[match.end() : match.end() + 180]
            if "_Estimate note:_" in after:
                continue
            title = table.splitlines()[0].lstrip(".")
            proposals.append(
                Proposal(
                    rel_file,
                    table,
                    f"{table}\n\n{SOURCE_NOTE}",
                    "source-note",
                    "medium",
                    f"Add Claude estimate note after '{title}'.",
                    "Estimated-percentage tables should disclose that they are AI estimates rather than published survey statistics.",
                    "P2-C003",
                )
            )
    return proposals


def write_runon_scan(
    candidates: list[ParagraphCandidate], rows: list[dict[str, str]]
) -> None:
    issue_by_location = {
        (row["file"], int(row["start_line"]), int(row["end_line"])): row["id"]
        for row in rows
        if row["type"] == "run-on-paragraph"
    }
    with (OUT / "scans" / "run-on-paragraphs.csv").open(
        "w", newline="", encoding="utf-8"
    ) as fh:
        writer = csv.DictWriter(
            fh,
            fieldnames=[
                "issue_id",
                "file",
                "start_line",
                "end_line",
                "chars",
                "sentences",
                "lines",
                "excerpt",
            ],
            lineterminator="\n",
        )
        writer.writeheader()
        for candidate in candidates:
            excerpt = re.sub(r"\s+", " ", " ".join(candidate.lines)).strip()
            if len(excerpt) > 240:
                excerpt = excerpt[:237].rstrip() + "..."
            writer.writerow(
                {
                    "issue_id": issue_by_location.get(
                        (candidate.file, candidate.start_line, candidate.end_line), ""
                    ),
                    "file": candidate.file,
                    "start_line": candidate.start_line,
                    "end_line": candidate.end_line,
                    "chars": candidate.chars,
                    "sentences": candidate.sentence_count,
                    "lines": len(candidate.lines),
                    "excerpt": excerpt,
                }
            )


def make_patch(file_name: str, old: str, new: str) -> str:
    path = ROOT / file_name
    text = path.read_text(encoding="utf-8")
    if old not in text:
        raise SystemExit(f"Could not find proposal text in {file_name}: {old[:120]!r}")
    updated = text.replace(old, new, 1)
    return "".join(
        difflib.unified_diff(
            text.splitlines(keepends=True),
            updated.splitlines(keepends=True),
            fromfile=f"a/{file_name}",
            tofile=f"b/{file_name}",
        )
    )


def context_block(file_name: str, start_line: int, end_line: int, radius: int = 2) -> str:
    path = ROOT / file_name
    lines = path.read_text(encoding="utf-8").splitlines()
    lo = max(1, start_line - radius)
    hi = min(len(lines), end_line + radius)
    width = len(str(hi))
    out = []
    for line_no in range(lo, hi + 1):
        marker = ">" if start_line <= line_no <= end_line else " "
        out.append(f"{marker} {line_no:{width}d}: {lines[line_no - 1]}")
    return "\n".join(out)


def write_preview(issue_id: str, row: dict[str, str], proposal: Proposal) -> None:
    preview = OUT / "previews" / f"{issue_id}.md"
    current = proposal.old
    proposed = proposal.new
    body = f"""# {issue_id}

Status: pending
Scope: {proposal.scope}
Type: {proposal.type}
Severity: {proposal.severity}
Campaign: {proposal.campaign}
File: `{proposal.file}`
Location: line {row['start_line']}

## Summary

{proposal.summary}

## Current

```adoc
{current}
```

## Proposed

```adoc
{proposed}
```

## Rationale

{proposal.rationale}

## Context

```text
{context_block(proposal.file, int(row['start_line']), int(row['end_line']))}
```

## Patch

`{row['patch_path']}`
"""
    preview.write_text(body, encoding="utf-8")


def main() -> None:
    if OUT.exists():
        shutil.rmtree(OUT)
    for subdir in ("patches", "previews", "scans"):
        (OUT / subdir).mkdir(parents=True, exist_ok=True)

    paragraph_candidates = runon_candidates()
    proposals = (
        MANUAL_PROPOSALS
        + runon_paragraph_proposals(paragraph_candidates)
        + source_table_proposals()
        + FOLLOWUP_PROPOSALS
    )
    rows: list[dict[str, str]] = []

    for index, proposal in enumerate(proposals, start=101):
        issue_id = f"MEAT-{index:04d}"
        text = (ROOT / proposal.file).read_text(encoding="utf-8")
        start_line = find_line_number(text, proposal.old)
        end_line = start_line + proposal.old.count("\n")
        patch_rel = f"{rel(OUT)}/patches/{issue_id}.diff"
        preview_rel = f"{rel(OUT)}/previews/{issue_id}.md"
        patch = make_patch(proposal.file, proposal.old, proposal.new)
        (OUT / "patches" / f"{issue_id}.diff").write_text(patch, encoding="utf-8")
        first_line = proposal.old.splitlines()[0]
        row = {
            "id": issue_id,
            "status": "pending",
            "scope": proposal.scope,
            "type": proposal.type,
            "severity": proposal.severity,
            "file": proposal.file,
            "start_line": str(start_line),
            "end_line": str(end_line),
            "summary": proposal.summary,
            "patch_path": patch_rel,
            "preview_path": preview_rel,
            "campaign": proposal.campaign,
            "original_hash": hash_text(first_line),
            "reviewer_notes": "",
            "decided_at": "",
            "applied_at": "",
            "apply_error": "",
        }
        write_preview(issue_id, row, proposal)
        rows.append(row)

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
    with (OUT / "issues.csv").open("w", newline="", encoding="utf-8") as fh:
        writer = csv.DictWriter(fh, fieldnames=fieldnames, lineterminator="\n")
        writer.writeheader()
        writer.writerows(rows)

    with (OUT / "scans" / "claude-estimate-tables.csv").open(
        "w", newline="", encoding="utf-8"
    ) as fh:
        writer = csv.DictWriter(fh, fieldnames=["id", "file", "line", "summary"], lineterminator="\n")
        writer.writeheader()
        for row in rows:
            if row["type"] == "source-note":
                writer.writerow(
                    {
                        "id": row["id"],
                        "file": row["file"],
                        "line": row["start_line"],
                        "summary": row["summary"],
                    }
                )

    write_runon_scan(paragraph_candidates, rows)

    readme = f"""# Phase 2 Editorial Audit Data

Generated after phase-1 localized edits were applied to the manuscript.

## Counts

- Localized proposed patches: {len(rows)}
- Presenter/register follow-up rows: {sum(1 for r in rows if r['campaign'] == 'P2-C001')}
- Claude estimate source-note rows: {sum(1 for r in rows if r['campaign'] == 'P2-C003')}
- Run-on paragraph break rows: {sum(1 for r in rows if r['campaign'] == 'P2-C006')}
- Run-on paragraph scan candidates: {len(paragraph_candidates)}
- Content emphasis/cross-reference rows: {sum(1 for r in rows if r['campaign'] == 'P2-C007')}
- Readability/factual nuance rows: {sum(1 for r in rows if r['campaign'] in {'P2-C004', 'P2-C005'})}

## Review

```bash
books/symbolic-language/editorial-review/review.py --audit-dir {rel(OUT)} ui
books/symbolic-language/editorial-review/review.py --audit-dir {rel(OUT)} list --status pending --limit 20
books/symbolic-language/editorial-review/review.py --audit-dir {rel(OUT)} apply --dry-run
books/symbolic-language/editorial-review/review.py --audit-dir {rel(OUT)} apply --yes
```

This phase is a proposal ledger only. No manuscript file was changed by the
generator.

The full run-on paragraph audit is in `scans/run-on-paragraphs.csv`. Rows that
also have a reviewable patch include an `issue_id`; the rest are retained as
scan data for later judgment.
"""
    (OUT / "README.md").write_text(readme, encoding="utf-8")

    print(f"Wrote {rel(OUT)}")
    print(f"Localized proposals: {len(rows)}")


if __name__ == "__main__":
    main()
