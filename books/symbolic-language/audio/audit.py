#!/usr/bin/env python3
"""Audit MEAT narration scripts against their print-source chapters.

The check is intentionally structural. It cannot decide whether prose is
beautiful, but it can prevent the failures that make editorial review
unreliable: missing studies, stale sources, moved or altered Scripture blocks,
cold voice switches, print-only markup, and large content drift.
"""

from __future__ import annotations

import argparse
import difflib
import re
from pathlib import Path

import sync_from_print as sync
import render


HERE = Path(__file__).resolve().parent
BOOK = HERE.parent
FRONT_MATTER = re.compile(r"\A---\s*\n(.*?)\n---\s*\n(.*)\Z", re.S)
QUOTE_MARKER = re.compile(r"^\[quote\.scripture,\s*(.*?)\]\s*$")
WORD = re.compile(r"[a-z0-9]+(?:'[a-z]+)?", re.I)
SPEECH_CUE = re.compile(
    r"\b(?:read|hear|listen|consider|record(?:s|ed)?|writ(?:e|es|ten)|"
    r"say|says|said|ask|asks|answer|answers|continue|continues|declare|"
    r"declares|command|commands|warn|warns|promise|promises|sing|sings|"
    r"pray|prays|testify|testifies|name|names|call|calls|open|opens|give|"
    r"gives|state|states|speak|speaks|reply|replies|tell|tells|show|shows|"
    r"describe|describes|foretell|foretells|explain|explains|confess|"
    r"confesses|announce|announces|recount|recounts|quote|quotes)\b",
    re.I,
)
PRINT_ONLY = re.compile(r"(?:^<{3}$|^>{3}$|sym:|xref:|link:|footnote:|image::|pass:\[)")
HEBREW_CHAR = re.compile(r"[\u0590-\u05ff]")
VISUAL_DEPENDENCY = re.compile(
    r"\b(?:as (?:you|we) can see|on the (?:page|screen)|"
    r"the (?:following|preceding|above|below) (?:table|figure|image|passage|verses)|"
    r"(?:as|discussed|shown|listed|quoted|noted) (?:above|below)|"
    r"(?:verses?|lines?|paragraphs?|section) (?:above|below)|turn to page)\b",
    re.I,
)


def parse_audio(path: Path) -> tuple[dict[str, str], str]:
    match = FRONT_MATTER.match(path.read_text(encoding="utf-8"))
    if not match:
        return {}, path.read_text(encoding="utf-8")
    raw_front, body = match.groups()
    front: dict[str, str] = {}
    for line in raw_front.splitlines():
        if ":" in line:
            key, value = line.split(":", 1)
            front[key.strip()] = value.strip().strip('"')
    return front, body


def quote_blocks(text: str) -> list[tuple[str, str]]:
    lines = text.splitlines()
    blocks: list[tuple[str, str]] = []
    index = 0
    while index < len(lines):
        marker = QUOTE_MARKER.match(lines[index].strip())
        if not marker:
            index += 1
            continue
        reference = re.sub(r"\s+", " ", marker.group(1).strip().strip('"'))
        index += 1
        while index < len(lines) and lines[index].strip() != "____":
            index += 1
        index += 1
        body: list[str] = []
        while index < len(lines) and lines[index].strip() != "____":
            body.append(lines[index])
            index += 1
        blocks.append((reference, "\n".join(body).strip()))
        index += 1
    return blocks


def speech_tokens(text: str) -> list[str]:
    text = sync.clean_inline(text, citations=False)
    text = re.sub(r"[_*“”\"'’]", "", text)
    return [match.group(0).lower() for match in WORD.finditer(text)]


def core_tokens(text: str) -> list[str]:
    lines: list[str] = []
    for line in text.splitlines():
        stripped = line.strip()
        if not stripped or stripped in {
            "[pause]", "[long pause]", "[beat]", "Let's read:", "____"
        }:
            continue
        if stripped.startswith("[quote"):
            continue
        if stripped.startswith("Now consider ") and stripped.endswith("."):
            continue
        lines.append(stripped)
    return speech_tokens(" ".join(lines))


def source_audio_coverage(source_body: str, audio_body: str) -> tuple[float, float]:
    source = core_tokens(source_body)
    audio = core_tokens(audio_body)
    if not source:
        return 1.0, 0.0
    matcher = difflib.SequenceMatcher(None, source, audio, autojunk=False)
    matched = sum(block.size for block in matcher.get_matching_blocks())
    coverage = matched / len(source)
    extra = (len(audio) - matched) / max(1, len(audio))
    return coverage, extra


def cue_warnings(path: Path, body: str) -> tuple[list[str], int]:
    warnings: list[str] = []
    generic = 0
    lines = body.splitlines()
    for index, line in enumerate(lines):
        if not QUOTE_MARKER.match(line.strip()):
            continue
        previous = ""
        cursor = index - 1
        while cursor >= 0:
            candidate = lines[cursor].strip()
            if candidate and candidate not in {"[pause]", "[long pause]"}:
                previous = candidate
                break
            cursor -= 1
        if re.match(r"(?i)^(?:let(?:'s| us) read|hear|listen|consider|read)\b", previous):
            generic += 1
        if previous.endswith(":") or SPEECH_CUE.search(previous):
            continue
        warnings.append(
            f"{path.name}:{index + 1}: Scripture voice begins without an audible cue"
        )
    return warnings, generic


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("chapters", nargs="*", help="source filename or stem")
    parser.add_argument("--strict", action="store_true", help="fail on warnings too")
    args = parser.parse_args()

    errors: list[str] = []
    warnings: list[str] = []
    generic_total = 0
    checked = 0
    sources = sync.eligible_sources(args.chapters)
    expected = {source.name for source in sources}

    for source in sources:
        audio = HERE / source.name
        if not audio.exists():
            errors.append(f"{source.name}: missing audio twin")
            continue
        checked += 1
        front, audio_body = parse_audio(audio)
        if front.get("audio-of") != source.name:
            errors.append(f"{audio.name}: audio-of does not name {source.name}")
        wanted_digest = sync.source_digest(source)
        actual_digest = front.get("source-digest")
        if actual_digest != wanted_digest:
            warnings.append(
                f"{audio.name}: stale or unaudited source digest "
                f"({actual_digest or 'missing'} != {wanted_digest})"
            )

        raw = source.read_text(encoding="utf-8")
        _, source_print_body, _, _ = sync.front_matter(raw)
        source_body = sync.adapt_body(source_print_body)
        source_blocks = quote_blocks(source_body)
        audio_blocks = quote_blocks(audio_body)
        source_refs = [reference for reference, _ in source_blocks]
        audio_refs = [reference for reference, _ in audio_blocks]
        if source_refs != audio_refs:
            errors.append(
                f"{audio.name}: Scripture block sequence differs "
                f"(source {len(source_refs)}, audio {len(audio_refs)})"
            )
        else:
            changed_quotes = [
                reference
                for (reference, source_quote), (_, audio_quote)
                in zip(source_blocks, audio_blocks)
                if speech_tokens(source_quote) != speech_tokens(audio_quote)
            ]
            if changed_quotes:
                errors.append(
                    f"{audio.name}: altered Scripture text in "
                    + ", ".join(changed_quotes[:4])
                    + (" …" if len(changed_quotes) > 4 else "")
                )

        for reference, _ in audio_blocks:
            if not render.spoken_citation(reference):
                errors.append(f"{audio.name}: citation cannot be spoken naturally: {reference}")

        segments = render.parse_script(audio)
        scripture_segments = sum(role == "scripture" for role, _ in segments)
        if scripture_segments != len(audio_blocks):
            errors.append(
                f"{audio.name}: voice-role mismatch "
                f"({len(audio_blocks)} Scripture blocks, {scripture_segments} Scripture segments)"
            )
        chunks = render.chunk(segments)
        longest = max((len(text) for _, text in chunks), default=0)
        if longest > render.MAX_CHARS:
            errors.append(
                f"{audio.name}: render chunk exceeds API limit "
                f"({longest} > {render.MAX_CHARS})"
            )

        coverage, extra = source_audio_coverage(source_body, audio_body)
        if coverage < 0.90 or extra > 0.20:
            errors.append(
                f"{audio.name}: major content drift "
                f"(source coverage {coverage:.1%}, unmatched audio {extra:.1%})"
            )
        elif coverage < 0.95 or extra > 0.10:
            warnings.append(
                f"{audio.name}: review content drift "
                f"(source coverage {coverage:.1%}, unmatched audio {extra:.1%})"
            )

        cue_notes, generic = cue_warnings(audio, audio_body)
        warnings.extend(cue_notes)
        generic_total += generic
        fences = sum(1 for line in audio_body.splitlines() if line.strip() == "____")
        if fences % 2:
            errors.append(f"{audio.name}: unbalanced quote fences")
        for number, line in enumerate(audio_body.splitlines(), start=1):
            if PRINT_ONLY.search(line):
                errors.append(f"{audio.name}:{number}: print-only markup remains")
            if HEBREW_CHAR.search(line):
                errors.append(f"{audio.name}:{number}: raw Hebrew letters need a spoken form")
            if VISUAL_DEPENDENCY.search(line):
                warnings.append(f"{audio.name}:{number}: visual dependency: {line.strip()[:90]}")

    if not args.chapters:
        for audio in HERE.glob("[0-9]*.adoc"):
            if audio.name not in expected:
                warnings.append(f"{audio.name}: audio script has no narrated source target")

    print(
        f"Audited {checked}/{len(sources)} chapters; "
        f"generic Scripture lead-ins: {generic_total}; "
        f"errors: {len(errors)}; warnings: {len(warnings)}"
    )
    if errors:
        print("\nERRORS")
        print("\n".join(f"- {item}" for item in errors))
    if warnings:
        print("\nWARNINGS")
        print("\n".join(f"- {item}" for item in warnings))
    return 1 if errors or (args.strict and warnings) else 0


if __name__ == "__main__":
    raise SystemExit(main())
