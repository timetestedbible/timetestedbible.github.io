#!/usr/bin/env python3
"""Build the non-narrated Scripture-reference companion for the audiobook.

Major block citations are spoken before the Scripture voice. This companion
keeps the exact addresses for inline quotations and citation clusters without
forcing the listener through a parenthesis after every sentence.
"""

from __future__ import annotations

import re

import sync_from_print as sync


BLOCK = re.compile(r"^\[quote\.scripture,\s*(.*?)\]\s*$")


def references_for(source):
    raw = source.read_text(encoding="utf-8")
    _, body, title, order = sync.front_matter(raw)
    body = sync.remove_footnotes(body)
    found: list[str] = []
    seen: set[str] = set()
    for line in body.splitlines():
        block = BLOCK.match(line.strip())
        candidates: list[str] = []
        if block:
            candidates.append(block.group(1).strip().strip('"'))
        else:
            candidates.extend(
                match.group(0).strip()[1:-1].strip()
                for match in sync.BIBLE_PAREN.finditer(line)
            )
            candidates.extend(
                match.group(0).strip()[1:-1].strip()
                for match in sync.CITATION.finditer(line)
            )
        for candidate in candidates:
            candidate = re.sub(r"\s+", " ", candidate)
            if candidate and candidate not in seen:
                found.append(candidate)
                seen.add(candidate)
    return float(order), title, found


def build_companion():
    out = [
        "# MEAT — audiobook Scripture-reference companion",
        "",
        "Block-quotation locations are spoken in the audiobook. This list also "
        "preserves the exact references attached to inline quotations and "
        "evidence clusters in the print edition.",
        "",
    ]
    for source in sync.eligible_sources([]):
        order, title, references = references_for(source)
        label = str(int(order)) if order.is_integer() else "Bonus study"
        out.extend((f"## {label}. {title}", ""))
        out.extend(f"- {reference}" for reference in references)
        out.append("")
    return "\n".join(out).rstrip() + "\n"


if __name__ == "__main__":
    print(build_companion(), end="")
