#!/usr/bin/env python3
"""Create conservative audio-script twins from print AsciiDoc chapters.

This is deliberately a structural transform, not a prose rewriter. It keeps
the print argument and Scripture text, removes print-only apparatus, and adds
the narration scaffolding required by render.py. Hand-edited audio scripts are
never overwritten unless --force is supplied.
"""

from __future__ import annotations

import argparse
import re
import subprocess
from pathlib import Path


HERE = Path(__file__).resolve().parent
BOOK = HERE.parent

NUMBER_WORDS = {
    0: "Zero", 1: "One", 2: "Two", 3: "Three", 4: "Four", 5: "Five",
    6: "Six", 7: "Seven", 8: "Eight", 9: "Nine", 10: "Ten",
    11: "Eleven", 12: "Twelve", 13: "Thirteen", 14: "Fourteen",
    15: "Fifteen", 16: "Sixteen", 17: "Seventeen", 18: "Eighteen",
    19: "Nineteen", 20: "Twenty", 30: "Thirty", 40: "Forty",
    50: "Fifty",
}

BOOK_NAMES = (
    "Genesis|Exodus|Leviticus|Numbers|Deuteronomy|Joshua|Judges|Ruth|"
    "Samuel|Kings|Chronicles|Ezra|Nehemiah|Esther|Job|Psalms?|Proverbs|"
    "Ecclesiastes|Song of Solomon|Isaiah|Jeremiah|Lamentations|Ezekiel|"
    "Daniel|Hosea|Joel|Amos|Obadiah|Jonah|Micah|Nahum|Habakkuk|"
    "Zephaniah|Haggai|Zechariah|Malachi|Matthew|Mark|Luke|John|Acts|"
    "Romans|Corinthians|Galatians|Ephesians|Philippians|Colossians|"
    "Thessalonians|Timothy|Titus|Philemon|Hebrews|James|Peter|Jude|"
    "Revelation|Gen|Ex|Lev|Num|Deut|Josh|Ps|Prov|Eccl|Isa|Jer|Ezek|"
    "Dan|Hos|Obad|Hab|Zech|Mal|Matt|Rom|Cor|Thess|Tim|Phil|Col|Rev|"
    "Jas|Kgs|Sam|Chr|Neh|Lam|Mic"
)
BOOK_REF = rf"(?:[1-3]\s+)?(?:{BOOK_NAMES})"
CITATION = re.compile(
    rf"\s*\((?:{BOOK_REF})\.?\s+\d+(?::[\d,\-\s]+)?"
    rf"(?:\s*[;,]\s*(?:(?:{BOOK_REF})\.?\s+)?\d+(?::[\d,\-\s]+)?)*"
    rf"(?:\s*\([^)]*\))?\)",
    re.I,
)
BIBLE_PAREN = re.compile(
    rf"\s*\((?=[^)]*{BOOK_REF}\.?\s+\d)[^)]*\)", re.I
)


def number_words(number: int) -> str:
    if number in NUMBER_WORDS:
        return NUMBER_WORDS[number]
    tens, ones = divmod(number, 10)
    return NUMBER_WORDS[tens * 10] + "-" + NUMBER_WORDS[ones]


def front_matter(raw: str) -> tuple[str, str, str, str]:
    match = re.match(r"\A---\s*\n(.*?)\n---\s*\n(.*)\Z", raw, re.S)
    if not match:
        raise ValueError("missing front matter")
    fm, body = match.groups()
    title = re.search(r'^title:\s*"(.*)"\s*$', fm, re.M)
    order = re.search(r"^order:\s*([0-9.]+)\s*$", fm, re.M)
    if not title or not order:
        raise ValueError("front matter needs title and order")
    return fm, body, title.group(1), order.group(1)


def source_hash(path: Path) -> str:
    result = subprocess.run(
        ["git", "log", "-1", "--format=%h", "--", str(path.relative_to(BOOK.parent))],
        cwd=BOOK.parent,
        text=True,
        capture_output=True,
        check=False,
    )
    return result.stdout.strip() or "uncommitted"


def choose_audio_branch(lines: list[str]) -> list[str]:
    """Keep the non-print branch where a source distinguishes editions."""
    out: list[str] = []
    keep = True
    stack: list[bool] = []
    for line in lines:
        if re.match(r"^ifndef::print-edition\[\]$", line):
            stack.append(keep)
            continue
        if re.match(r"^ifdef::print-edition\[\]$", line):
            stack.append(keep)
            keep = False
            continue
        if re.match(r"^endif::\[\]$", line):
            if stack:
                keep = stack.pop()
            continue
        if keep:
            out.append(line)
    return out


def remove_footnotes(text: str) -> str:
    """Remove footnote macros while tolerating brackets inside their text."""
    out: list[str] = []
    i = 0
    while i < len(text):
        marker = text.find("footnote:", i)
        if marker < 0:
            out.append(text[i:])
            break
        out.append(text[i:marker])
        bracket = text.find("[", marker)
        if bracket < 0:
            i = marker + len("footnote:")
            continue
        depth = 1
        j = bracket + 1
        while j < len(text) and depth:
            if text[j] == "[":
                depth += 1
            elif text[j] == "]":
                depth -= 1
            j += 1
        i = j
    return "".join(out)


def clean_inline(text: str, *, citations: bool = True) -> str:
    """Strip print-only markup without changing the words it decorates."""
    text = remove_footnotes(text)
    text = re.sub(r"\[\[[^\]]+\]\]", "", text)
    text = re.sub(r"(?:sym|link|xref):[^\[]+\[([^\]]*)\]", r"\1", text)
    text = re.sub(r"(?:https?://|mailto:)[^\[]+\[([^\]]*)\]", r"\1", text)
    text = re.sub(r"verdict:[a-z-]+\[\]", "", text)
    text = re.sub(r"\[\.(?:commonview|chnum|seeref)[^\]]*\]", "", text)
    text = re.sub(r"\[\.\w[^\]]*\]#?", "", text)
    text = re.sub(r"pass:\[([^\]]*)\]", r"\1", text)
    text = text.replace("{nbsp}", " ")
    text = re.sub(r"\s*\+\s*$", "", text)
    if citations:
        # A citation may contain explanatory glue ("so also 26:1"), which
        # makes it too irregular for the narrower canonical-reference regex.
        text = BIBLE_PAREN.sub("", text)
        text = CITATION.sub("", text)
    text = re.sub(r"[ \t]{2,}", " ", text)
    return text.strip()


def clean_table_cell(text: str) -> str:
    return clean_inline(text).replace("%", " percent")


def table_to_narration(caption: str | None, table: list[str]) -> list[str]:
    rows: list[list[str]] = []
    for line in table:
        stripped = line.strip()
        if not stripped or not stripped.startswith("|"):
            continue
        rows.append([clean_table_cell(cell) for cell in stripped[1:].split("|")])
    if not rows:
        return []
    headers = rows[0]
    width = len(headers)
    cells = [cell for row in rows[1:] for cell in row]
    body_rows = [cells[index:index + width]
                 for index in range(0, len(cells), width)
                 if len(cells[index:index + width]) == width]
    out: list[str] = []
    if caption:
        out.append(f"The table is titled, {clean_inline(caption)}.")
    for row in body_rows:
        parts: list[str] = []
        for header, cell in zip(headers, row):
            if header.lower() == "rank":
                parts.append(f"Rank {cell}.")
            elif header.lower().startswith("est."):
                parts.append(f"Estimated share: {cell}.")
            else:
                parts.append(f"{header}: {cell}.")
        out.append(" ".join(parts))
    out.append("[pause]")
    return out


def is_table_caption(lines: list[str], index: int) -> bool:
    if not lines[index].startswith(".") or lines[index].startswith(".."):
        return False
    return any(line.strip() == "|===" for line in lines[index + 1:index + 4])


def chapter_opener(order: str, title: str) -> str:
    number = float(order)
    if number.is_integer():
        label = f"Chapter {number_words(int(number))}: {title}."
    else:
        label = f"Bonus Study: {title}."
    return f"MEAT The Bible's Symbolic Language. [beat] {label}"


def adapt_body(body: str) -> str:
    lines = choose_audio_branch(body.splitlines())
    out: list[str] = []
    in_quote = False
    pending_caption: str | None = None
    glossary_entries = 0
    i = 0
    while i < len(lines):
        line = lines[i]
        stripped = line.strip()

        if is_table_caption(lines, i):
            pending_caption = line[1:].strip()
            i += 1
            continue
        if stripped == "|===":
            end = i + 1
            while end < len(lines) and lines[end].strip() != "|===":
                end += 1
            if end == len(lines):
                raise ValueError("unterminated table")
            out.extend(table_to_narration(pending_caption, lines[i + 1:end]))
            pending_caption = None
            i = end + 1
            continue
        if stripped.startswith("[quote"):
            out.extend(["Let's read:", "", stripped])
            i += 1
            continue
        if stripped == "____":
            out.append("____")
            in_quote = not in_quote
            if not in_quote:
                out.extend(["", "[pause]"])
            i += 1
            continue
        if not in_quote and re.match(r"^\[.*\]$", stripped):
            i += 1
            continue
        if not in_quote and re.match(r"^={2,}\s+", stripped):
            heading = re.sub(r"^=+\s+", "", stripped)
            heading = clean_inline(heading)
            if heading:
                out.extend(["[long pause]", "", f"Now consider {heading}.", "", "[long pause]"])
            i += 1
            continue
        if stripped == "'''":
            out.extend(["[long pause]", ""])
            i += 1
            continue
        if stripped.startswith("image::") or stripped.startswith("//"):
            i += 1
            continue
        if stripped.startswith("[.seeref]"):
            i += 1
            continue
        if stripped.startswith(".") and not in_quote:
            # A display-only caption not attached to a table or image.
            i += 1
            continue

        entry = re.match(r"^\[\[[^\]]+\]\](.+?)::\s*(.*)$", line)
        if entry:
            term = clean_inline(entry.group(1))
            definition = clean_inline(entry.group(2))
            if glossary_entries:
                out.extend(["", "[pause]", ""])
            if term and definition:
                out.append(f"{term}. [beat] {definition}")
            elif term:
                out.append(f"{term}.")
            glossary_entries += 1
            i += 1
            continue

        cleaned = clean_inline(line, citations=not in_quote)
        if cleaned.startswith("* ") or cleaned.startswith("- "):
            cleaned = cleaned[2:]
        if cleaned:
            out.append(cleaned)
        elif not out or out[-1] != "":
            out.append("")
        i += 1

    # Keep whitespace human-readable without leaking blank runs into the script.
    compact: list[str] = []
    for line in out:
        if not line and (not compact or not compact[-1]):
            continue
        compact.append(line)
    return "\n".join(compact).strip() + "\n"


def eligible_sources(names: list[str]) -> list[Path]:
    wanted = set(names)
    paths: list[tuple[float, Path]] = []
    for source in BOOK.glob("[0-9]*.adoc"):
        if source.name.startswith("00-") or source.name in {
            "38x-further-studies.adoc",
            "49-glossary.adoc",
        }:
            continue
        if wanted and source.name not in wanted and source.stem not in wanted:
            continue
        raw = source.read_text(encoding="utf-8")
        try:
            _, _, _, order = front_matter(raw)
        except ValueError:
            continue
        paths.append((float(order), source))
    return [path for _, path in sorted(paths)]


def build(source: Path) -> str:
    raw = source.read_text(encoding="utf-8")
    _, body, title, order = front_matter(raw)
    header = "\n".join((
        "---",
        f'title: "{title}"',
        f"audio-of: {source.name}",
        f"synced-to: {source_hash(source)}",
        "---",
        chapter_opener(order, title),
        "",
        "[long pause]",
        "",
    ))
    return header + adapt_body(body)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("chapters", nargs="*", help="source filename or stem")
    parser.add_argument("--write", action="store_true", help="write new audio scripts")
    parser.add_argument("--force", action="store_true", help="allow overwriting an existing script")
    parser.add_argument("--show", action="store_true", help="print generated text instead of writing")
    args = parser.parse_args()
    if not args.write and not args.show:
        parser.error("choose --write or --show")

    for source in eligible_sources(args.chapters):
        target = HERE / source.name
        if target.exists() and not args.force:
            print(f"skip {target.name}: already exists")
            continue
        generated = build(source)
        if args.show:
            print(f"### {target.name}\n")
            print(generated)
        if args.write:
            target.write_text(generated, encoding="utf-8")
            print(f"wrote {target.name}")


if __name__ == "__main__":
    main()
