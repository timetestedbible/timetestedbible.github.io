#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Minimal review/apply tool for MEAT editorial audit data."""

from __future__ import annotations

import argparse
import csv
import datetime as dt
import difflib
import hashlib
import json
import os
import re
import shutil
import subprocess
import sys
import termios
import textwrap
import tty
from collections import Counter
from pathlib import Path


ROOT = Path(__file__).resolve().parents[3]
REVIEW_ROOT = ROOT / "books" / "symbolic-language" / "editorial-review"
EXTRA_COLUMNS = ["reviewer_notes", "decided_at", "applied_at", "apply_error"]
VALID_STATUSES = {
    "pending",
    "accepted",
    "rejected",
    "needs-rewrite",
    "needs-fact-check",
    "applied",
}
ANSI = {
    "reset": "\033[0m",
    "bold": "\033[1m",
    "dim": "\033[2m",
    "red": "\033[31m",
    "green": "\033[32m",
    "yellow": "\033[33m",
    "blue": "\033[34m",
    "magenta": "\033[35m",
    "cyan": "\033[36m",
    "bold_red": "\033[1;31m",
    "bold_green": "\033[1;32m",
    "bold_yellow": "\033[1;33m",
}
TOKEN_RE = re.compile(r"\s+|[A-Za-z0-9]+(?:[-'][A-Za-z0-9]+)*|[^\w\s]", re.UNICODE)


def utc_now() -> str:
    return dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat()


def hash_text(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()[:16]


def latest_audit_dir() -> Path:
    candidates = sorted(
        p for p in REVIEW_ROOT.iterdir() if p.is_dir() and (p / "issues.csv").exists()
    )
    if not candidates:
        raise SystemExit(f"No audit directory with issues.csv found under {REVIEW_ROOT}")
    return candidates[-1]


def resolve_audit_dir(value: str | None) -> Path:
    if not value:
        return latest_audit_dir()
    path = Path(value)
    if not path.is_absolute():
        path = ROOT / path
    if not (path / "issues.csv").exists():
        raise SystemExit(f"Audit directory has no issues.csv: {path}")
    return path


def load_rows(audit_dir: Path) -> tuple[list[dict[str, str]], list[str]]:
    path = audit_dir / "issues.csv"
    with path.open(newline="", encoding="utf-8") as fh:
        reader = csv.DictReader(fh)
        rows = [dict(row) for row in reader]
        fieldnames = list(reader.fieldnames or [])
    for col in EXTRA_COLUMNS:
        if col not in fieldnames:
            fieldnames.append(col)
        for row in rows:
            row.setdefault(col, "")
    return rows, fieldnames


def save_rows(audit_dir: Path, rows: list[dict[str, str]], fieldnames: list[str]) -> None:
    path = audit_dir / "issues.csv"
    with path.open("w", newline="", encoding="utf-8") as fh:
        writer = csv.DictWriter(fh, fieldnames=fieldnames, lineterminator="\n")
        writer.writeheader()
        writer.writerows(rows)


def normalize_id(value: str) -> str:
    value = value.strip()
    upper = value.upper()
    if upper.startswith("MEAT-"):
        return upper
    if value.isdigit():
        return f"MEAT-{int(value):04d}"
    raise SystemExit(f"Bad issue id: {value}")


def row_by_id(rows: list[dict[str, str]], issue_id: str) -> dict[str, str]:
    wanted = normalize_id(issue_id)
    for row in rows:
        if row["id"].upper() == wanted:
            return row
    raise SystemExit(f"Unknown issue id: {wanted}")


def matches_filters(row: dict[str, str], args: argparse.Namespace) -> bool:
    for attr in ("status", "type", "severity", "campaign", "scope"):
        value = getattr(args, attr, None)
        if value and value != "any" and row.get(attr) != value:
            return False
    grep = getattr(args, "grep", None)
    if grep:
        haystack = " ".join(
            row.get(k, "")
            for k in ("id", "summary", "file", "type", "campaign", "status", "reviewer_notes")
        ).lower()
        if grep.lower() not in haystack:
            return False
    return True


def rel(path: Path) -> str:
    try:
        return str(path.relative_to(ROOT))
    except ValueError:
        return str(path)


def resolve_repo_path(value: str) -> Path:
    path = Path(value)
    if not path.is_absolute():
        path = ROOT / path
    return path


def current_line_hash(row: dict[str, str]) -> tuple[str, str]:
    file_name = row.get("file", "")
    line_s = row.get("start_line", "")
    if not file_name or not line_s:
        return "", ""
    path = resolve_repo_path(file_name)
    try:
        line_no = int(line_s)
        lines = path.read_text(encoding="utf-8").splitlines()
        current = lines[line_no - 1]
    except (OSError, ValueError, IndexError):
        return "", ""
    return hash_text(current), current


def hash_matches(row: dict[str, str]) -> bool:
    expected = row.get("original_hash", "")
    if not expected:
        return True
    actual, _ = current_line_hash(row)
    return actual == expected


def patch_path(audit_dir: Path, row: dict[str, str]) -> Path:
    raw = row.get("patch_path", "")
    if not raw:
        raise ValueError(f"{row['id']} has no patch_path")
    return resolve_repo_path(raw)


def run_git_apply(patch: Path, check_only: bool) -> subprocess.CompletedProcess[str]:
    cmd = ["git", "apply"]
    if check_only:
        cmd.append("--check")
    cmd.append(str(patch))
    return subprocess.run(cmd, cwd=ROOT, text=True, capture_output=True)


def preview_replacement(row: dict[str, str]) -> tuple[str, str]:
    _, current, proposed, _ = issue_preview_parts(row)
    return current, proposed


def exact_preview_replacement(
    row: dict[str, str],
    write: bool,
) -> tuple[bool, str, bool]:
    """Fallback for patches whose context drifted after nearby accepted edits.

    Returns (ok, message, changed_file). It only changes a file when the current
    preview text appears exactly once.
    """
    file_name = row.get("file", "")
    if not file_name:
        return False, "fallback unavailable: no target file", False

    current, proposed = preview_replacement(row)
    if not current or not proposed:
        return False, "fallback unavailable: preview current/proposed text missing", False
    if current == proposed:
        return True, "fallback skipped: current and proposed text are identical", False

    path = resolve_repo_path(file_name)
    try:
        text = path.read_text(encoding="utf-8")
    except OSError as exc:
        return False, f"fallback unavailable: could not read {file_name}: {exc}", False

    current_count = text.count(current)
    if current_count == 1:
        if write:
            path.write_text(text.replace(current, proposed, 1), encoding="utf-8")
        return True, "fallback exact text replacement", True

    proposed_count = text.count(proposed)
    if current_count == 0 and proposed_count == 1:
        return True, "fallback already applied", False
    if current_count == 0:
        return (
            False,
            f"fallback failed: current text not found; proposed text occurrences: {proposed_count}",
            False,
        )
    return False, f"fallback failed: current text occurs {current_count} times", False


def print_table(rows: list[dict[str, str]], limit: int | None) -> None:
    shown = rows if limit is None else rows[:limit]
    if not shown:
        print("No matching issues.")
        return
    headers = ["id", "status", "severity", "type", "file:line", "summary"]
    print(" | ".join(headers))
    print(" | ".join("-" * len(h) for h in headers))
    for row in shown:
        loc = ""
        if row.get("file"):
            loc = f"{row['file']}:{row.get('start_line', '')}"
        values = [
            row.get("id", ""),
            row.get("status", ""),
            row.get("severity", ""),
            row.get("type", ""),
            loc,
            row.get("summary", ""),
        ]
        print(" | ".join(values))
    if limit is not None and len(rows) > limit:
        print(f"... {len(rows) - limit} more; rerun with --all or --limit N")


def state_path(audit_dir: Path) -> Path:
    return audit_dir / ".review-state.json"


def load_state(audit_dir: Path) -> dict[str, str]:
    path = state_path(audit_dir)
    if not path.exists():
        return {}
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return {}
    return data if isinstance(data, dict) else {}


def save_state(audit_dir: Path, state: dict[str, str]) -> None:
    state_path(audit_dir).write_text(
        json.dumps(state, indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
    )


def get_current_id(audit_dir: Path) -> str:
    return load_state(audit_dir).get("current_id", "")


def set_current_id(audit_dir: Path, issue_id: str) -> None:
    state = load_state(audit_dir)
    state["current_id"] = issue_id
    save_state(audit_dir, state)


def print_issue_preview(audit_dir: Path, row: dict[str, str]) -> int:
    print(
        f"Current: {row['id']} | {row.get('status', '')} | "
        f"{row.get('severity', '')} | {row.get('type', '')}"
    )
    print(f"Summary: {row.get('summary', '')}")
    if row.get("file"):
        print(f"Location: {row['file']}:{row.get('start_line', '')}")
    print()

    preview = row.get("preview_path", "")
    if not preview:
        print(f"{row['id']} has no preview_path.")
        return 1
    path = resolve_repo_path(preview)
    try:
        print(path.read_text(encoding="utf-8"), end="")
    except OSError as exc:
        print(f"Could not read preview for {row['id']}: {exc}")
        return 1
    return 0


def find_next_row(
    rows: list[dict[str, str]],
    args: argparse.Namespace,
    after_issue_id: str = "",
) -> dict[str, str] | None:
    matches = [idx for idx, row in enumerate(rows) if matches_filters(row, args)]
    if not matches:
        return None

    start_idx = -1
    if after_issue_id:
        try:
            normalized = normalize_id(after_issue_id)
        except SystemExit:
            normalized = ""
        if normalized:
            for idx, row in enumerate(rows):
                if row.get("id", "").upper() == normalized:
                    start_idx = idx
                    break

    for idx in matches:
        if idx > start_idx:
            return rows[idx]
    return rows[matches[0]]


def resolve_current_row(audit_dir: Path, rows: list[dict[str, str]]) -> dict[str, str]:
    current = get_current_id(audit_dir)
    if not current:
        raise SystemExit("No current issue. Run `review.py next` first.")
    try:
        return row_by_id(rows, current)
    except SystemExit as exc:
        raise SystemExit(f"Current issue is stale ({current}). Run `review.py next`.") from exc


def explicit_or_current_rows(
    args: argparse.Namespace,
    audit_dir: Path,
    rows: list[dict[str, str]],
) -> tuple[list[dict[str, str]], bool]:
    if args.issue_ids:
        return [row_by_id(rows, issue_id) for issue_id in args.issue_ids], False
    return [resolve_current_row(audit_dir, rows)], True


def is_issue_id_token(value: str) -> bool:
    upper = value.upper()
    return upper.startswith("MEAT-") or value.isdigit()


def mark_rows(
    rows: list[dict[str, str]],
    target_rows: list[dict[str, str]],
    status: str,
    note: str = "",
) -> list[str]:
    now = utc_now()
    changed: list[str] = []
    for row in target_rows:
        row["status"] = status
        row["decided_at"] = now
        if note:
            existing = row.get("reviewer_notes", "")
            row["reviewer_notes"] = f"{existing} | {note}" if existing else note
        if status != "applied":
            row["apply_error"] = ""
        changed.append(row["id"])
    return changed


def cmd_status(args: argparse.Namespace) -> int:
    audit_dir = resolve_audit_dir(args.audit_dir)
    rows, _ = load_rows(audit_dir)
    print(f"Audit: {rel(audit_dir)}")
    print(f"Current: {get_current_id(audit_dir) or '(none)'}")
    print(f"Rows: {len(rows)}")
    for label in ("status", "scope", "type", "severity", "campaign"):
        print(f"\n{label}:")
        for key, count in Counter(row.get(label, "") or "(blank)" for row in rows).most_common():
            print(f"  {key}: {count}")
    return 0


def cmd_list(args: argparse.Namespace) -> int:
    audit_dir = resolve_audit_dir(args.audit_dir)
    rows, _ = load_rows(audit_dir)
    rows = [row for row in rows if matches_filters(row, args)]
    limit = None if args.all else args.limit
    print_table(rows, limit)
    return 0


def cmd_show(args: argparse.Namespace) -> int:
    audit_dir = resolve_audit_dir(args.audit_dir)
    rows, _ = load_rows(audit_dir)
    row = row_by_id(rows, args.issue_id)
    set_current_id(audit_dir, row["id"])
    return print_issue_preview(audit_dir, row)


def cmd_current(args: argparse.Namespace) -> int:
    audit_dir = resolve_audit_dir(args.audit_dir)
    rows, _ = load_rows(audit_dir)
    row = resolve_current_row(audit_dir, rows)
    return print_issue_preview(audit_dir, row)


def cmd_next(args: argparse.Namespace) -> int:
    audit_dir = resolve_audit_dir(args.audit_dir)
    rows, _ = load_rows(audit_dir)
    row = find_next_row(rows, args, get_current_id(audit_dir))
    if not row:
        print("No matching issues.")
        return 1
    set_current_id(audit_dir, row["id"])
    return print_issue_preview(audit_dir, row)


def set_status(args: argparse.Namespace, status: str) -> int:
    audit_dir = resolve_audit_dir(args.audit_dir)
    rows, fieldnames = load_rows(audit_dir)
    target_rows, used_current = explicit_or_current_rows(args, audit_dir, rows)
    changed = mark_rows(rows, target_rows, status, args.note)
    save_rows(audit_dir, rows, fieldnames)
    print(f"{status}: {', '.join(changed)}")
    if used_current and not args.no_next:
        next_args = argparse.Namespace(
            status="pending",
            type=None,
            severity=None,
            campaign=None,
            scope=None,
            grep=None,
        )
        next_row = find_next_row(rows, next_args, changed[-1])
        if next_row:
            set_current_id(audit_dir, next_row["id"])
            print()
            print_issue_preview(audit_dir, next_row)
        else:
            print("No pending issues remain.")
    return 0


def cmd_note(args: argparse.Namespace) -> int:
    audit_dir = resolve_audit_dir(args.audit_dir)
    rows, fieldnames = load_rows(audit_dir)
    if not args.note_args:
        raise SystemExit("Missing note text.")
    if len(args.note_args) == 1 and is_issue_id_token(args.note_args[0]):
        raise SystemExit("Missing note text.")
    if len(args.note_args) > 1 and is_issue_id_token(args.note_args[0]):
        row = row_by_id(rows, args.note_args[0])
        note = " ".join(args.note_args[1:])
    else:
        row = resolve_current_row(audit_dir, rows)
        note = " ".join(args.note_args)
    existing = row.get("reviewer_notes", "")
    row["reviewer_notes"] = f"{existing} | {note}" if existing else note
    row["decided_at"] = utc_now()
    save_rows(audit_dir, rows, fieldnames)
    print(f"noted: {row['id']}")
    return 0


def print_note_scan(rows: list[dict[str, str]], limit: int | None, preview: bool) -> None:
    shown = rows if limit is None else rows[:limit]
    if not shown:
        print("No matching noted issues.")
        return

    for idx, row in enumerate(shown, start=1):
        if idx > 1:
            print()
        loc = f"{row['file']}:{row.get('start_line', '')}" if row.get("file") else "(no file)"
        print(f"{row['id']} | {row.get('status', '')} | {row.get('severity', '')} | {row.get('type', '')}")
        print(f"Location: {loc}")
        print(f"Summary: {row.get('summary', '')}")
        print(f"Notes: {row.get('reviewer_notes', '')}")
        if preview:
            _, current, proposed, rationale = issue_preview_parts(row)
            if current:
                print("\nCurrent:")
                wrap_print(current, terminal_width(), "  ")
            if proposed:
                print("\nProposed:")
                wrap_print(proposed, terminal_width(), "  ")
            if rationale:
                print("\nRationale:")
                wrap_print(rationale, terminal_width(), "  ")

    if limit is not None and len(rows) > limit:
        print(f"\n... {len(rows) - limit} more; rerun with --all or --limit N")


def cmd_notes(args: argparse.Namespace) -> int:
    audit_dir = resolve_audit_dir(args.audit_dir)
    rows, _ = load_rows(audit_dir)
    rows = [
        row
        for row in rows
        if row.get("reviewer_notes", "").strip() and matches_filters(row, args)
    ]
    limit = None if args.all else args.limit
    print_note_scan(rows, limit, args.preview)
    return 0


def terminal_width() -> int:
    return max(72, min(shutil.get_terminal_size((100, 30)).columns, 132))


def color_enabled(mode: str) -> bool:
    if mode == "always":
        return True
    if mode == "never":
        return False
    return sys.stdout.isatty() and "NO_COLOR" not in os.environ


def paint(text: str, style: str, enabled: bool) -> str:
    if not enabled:
        return text
    return f"{ANSI[style]}{text}{ANSI['reset']}"


def styled(text: str, style: str, enabled: bool) -> str:
    return paint(text, style, enabled) if style else text


def status_style(status: str) -> str:
    return {
        "accepted": "green",
        "rejected": "red",
        "needs-rewrite": "yellow",
        "needs-fact-check": "magenta",
        "applied": "blue",
    }.get(status, "cyan")


def severity_style(severity: str) -> str:
    return {
        "high": "red",
        "medium": "yellow",
        "low": "green",
    }.get(severity, "dim")


def clear_screen(enabled: bool) -> None:
    if enabled and sys.stdout.isatty():
        print("\033[2J\033[H", end="")


def read_preview_text(row: dict[str, str]) -> str:
    preview = row.get("preview_path", "")
    if not preview:
        return ""
    try:
        return resolve_repo_path(preview).read_text(encoding="utf-8")
    except OSError:
        return ""


def markdown_section(text: str, heading: str) -> str:
    lines = text.splitlines()
    marker = f"## {heading}"
    start: int | None = None
    for idx, line in enumerate(lines):
        if line.strip() == marker:
            start = idx + 1
            break
    if start is None:
        return ""

    collected: list[str] = []
    for line in lines[start:]:
        if line.startswith("## "):
            break
        collected.append(line)

    while collected and not collected[0].strip():
        collected.pop(0)
    while collected and not collected[-1].strip():
        collected.pop()
    if len(collected) >= 2 and collected[0].startswith("```") and collected[-1].startswith("```"):
        collected = collected[1:-1]
    return "\n".join(collected).strip()


def issue_preview_parts(row: dict[str, str]) -> tuple[str, str, str, str]:
    preview_text = read_preview_text(row)
    return (
        preview_text,
        markdown_section(preview_text, "Current"),
        markdown_section(preview_text, "Proposed"),
        markdown_section(preview_text, "Rationale"),
    )


def tokenize_for_diff(text: str) -> list[str]:
    return TOKEN_RE.findall(text)


def diff_word_segments(before: str, after: str) -> tuple[list[tuple[str, str]], list[tuple[str, str]]]:
    before_tokens = tokenize_for_diff(before)
    after_tokens = tokenize_for_diff(after)
    matcher = difflib.SequenceMatcher(None, before_tokens, after_tokens, autojunk=False)
    before_segments: list[tuple[str, str]] = []
    after_segments: list[tuple[str, str]] = []

    for tag, i1, i2, j1, j2 in matcher.get_opcodes():
        before_style = "" if tag == "equal" else "bold_red"
        after_style = "" if tag == "equal" else "bold_green"
        for token in before_tokens[i1:i2]:
            before_segments.append((token, "" if token.isspace() else before_style))
        for token in after_tokens[j1:j2]:
            after_segments.append((token, "" if token.isspace() else after_style))
    return before_segments, after_segments


def split_segments_by_line(segments: list[tuple[str, str]]) -> list[list[tuple[str, str]]]:
    lines: list[list[tuple[str, str]]] = [[]]
    for text, style in segments:
        parts = text.split("\n")
        for idx, part in enumerate(parts):
            if idx:
                lines.append([])
            if part:
                lines[-1].append((part, style))
    return lines


def diff_lines_by_word(
    before_lines: list[str],
    after_lines: list[str],
) -> tuple[list[list[tuple[str, str]]], list[list[tuple[str, str]]]]:
    before_segments, after_segments = diff_word_segments(
        "\n".join(before_lines),
        "\n".join(after_lines),
    )
    return split_segments_by_line(before_segments), split_segments_by_line(after_segments)


def source_context(
    row: dict[str, str],
    current: str,
    proposed: str,
    radius: int,
) -> dict[str, object] | None:
    file_name = row.get("file", "")
    start_s = row.get("start_line", "")
    end_s = row.get("end_line", "") or start_s
    if not file_name or not start_s:
        return None

    try:
        start = int(start_s)
        end = int(end_s)
    except ValueError:
        return None

    path = resolve_repo_path(file_name)
    try:
        lines = path.read_text(encoding="utf-8").splitlines()
    except OSError:
        return None
    if not lines:
        return None

    start = max(1, min(start, len(lines)))
    end = max(start, min(end, len(lines)))
    radius = max(0, radius)

    before_start = max(1, start - radius)
    after_end = min(len(lines), end + radius)
    before = [(line_no, lines[line_no - 1]) for line_no in range(before_start, start)]
    original = [(line_no, lines[line_no - 1]) for line_no in range(start, end + 1)]
    after = [(line_no, lines[line_no - 1]) for line_no in range(end + 1, after_end + 1)]
    proposed_lines = proposed.splitlines() or current.splitlines()
    proposed_block = [(start + idx, line) for idx, line in enumerate(proposed_lines)]

    return {
        "before": before,
        "original": original,
        "proposed": proposed_block,
        "after": after,
    }


def wrap_print(text: str, width: int, indent: str = "") -> None:
    wrap_width = max(40, width - len(indent))
    for raw_line in text.splitlines() or [""]:
        if not raw_line:
            print()
            continue
        wrapped = textwrap.wrap(
            raw_line,
            width=wrap_width,
            break_long_words=False,
            break_on_hyphens=False,
        )
        if not wrapped:
            print()
            continue
        for line in wrapped:
            print(f"{indent}{line}")


def print_ui_block(title: str, body: str, width: int) -> None:
    if not body:
        return
    print(f"\n{title}")
    print("-" * len(title))
    wrap_print(body, width)


def print_colored_block(title: str, body: str, width: int, color: bool, title_style: str = "bold") -> None:
    if not body:
        return
    print(f"\n{paint(title, title_style, color)}")
    print(paint("-" * len(title), "dim", color))
    wrap_print(body, width)


def print_context_line(
    sign: str,
    line_no: int | None,
    text: str,
    width: int,
    color: bool,
    style: str,
) -> None:
    number = f"{line_no:>5}" if line_no is not None else "     "
    prefix = f"{sign} {number}: "
    wrap_width = max(30, width - len(prefix))
    wrapped = textwrap.wrap(
        text,
        width=wrap_width,
        break_long_words=False,
        break_on_hyphens=False,
    ) or [""]
    for idx, chunk in enumerate(wrapped):
        visible_prefix = prefix if idx == 0 else " " * len(prefix)
        if sign == " ":
            print(f"{paint(visible_prefix, 'dim', color)}{paint(chunk, 'dim', color)}")
        else:
            print(f"{paint(visible_prefix, style, color)}{paint(chunk, style, color)}")


def flush_segment_line(
    prefix: str,
    prefix_style: str,
    segments: list[tuple[str, str]],
    color: bool,
) -> None:
    rendered = "".join(styled(text, style, color) for text, style in segments)
    prefix_text = paint(prefix, prefix_style, color) if prefix else ""
    print(f"{prefix_text}{rendered}")


def print_wrapped_segments(
    prefix: str,
    continuation_prefix: str,
    prefix_style: str,
    segments: list[tuple[str, str]],
    width: int,
    color: bool,
) -> None:
    wrap_width = max(30, width - len(prefix))
    current_prefix = prefix
    line_segments: list[tuple[str, str]] = []
    line_len = 0

    def flush() -> None:
        nonlocal current_prefix, line_segments, line_len
        flush_segment_line(current_prefix, prefix_style, line_segments, color)
        current_prefix = continuation_prefix
        line_segments = []
        line_len = 0

    for text, style in segments:
        chunks = text.split("\n")
        for chunk_idx, chunk in enumerate(chunks):
            if chunk_idx:
                flush()
            rest = chunk
            while rest:
                if line_len == 0 and rest.isspace():
                    break
                available = wrap_width - line_len
                if available <= 0:
                    flush()
                    available = wrap_width
                if len(rest) <= available:
                    line_segments.append((rest, style))
                    line_len += len(rest)
                    break
                if line_len == 0:
                    line_segments.append((rest[:wrap_width], style))
                    rest = rest[wrap_width:]
                    line_len = wrap_width
                    flush()
                    continue
                flush()
                if rest.isspace():
                    break

    if line_segments or not segments:
        flush_segment_line(current_prefix, prefix_style, line_segments, color)


def print_context_segments(
    sign: str,
    line_no: int | None,
    segments: list[tuple[str, str]],
    width: int,
    color: bool,
    prefix_style: str,
) -> None:
    number = f"{line_no:>5}" if line_no is not None else "     "
    prefix = f"{sign} {number}: "
    continuation_prefix = " " * len(prefix)
    print_wrapped_segments(prefix, continuation_prefix, prefix_style, segments, width, color)


def print_diff_text_block(
    title: str,
    segments: list[tuple[str, str]],
    width: int,
    color: bool,
    title_style: str,
) -> None:
    if not segments:
        return
    print(f"\n{paint(title, title_style, color)}")
    print(paint("-" * len(title), "dim", color))
    print_wrapped_segments("", "", "dim", segments, width, color)


def print_context_view(
    row: dict[str, str],
    current: str,
    proposed: str,
    rationale: str,
    width: int,
    radius: int,
    color: bool,
) -> bool:
    context = source_context(row, current, proposed, radius)
    if not context:
        return False

    hash_warning = ""
    if row.get("original_hash") and not hash_matches(row):
        hash_warning = "Source line changed since this proposal was generated; validate before applying."

    original_lines = [text for _, text in context["original"]]  # type: ignore[index]
    proposed_lines = [text for _, text in context["proposed"]]  # type: ignore[index]
    original_diff, proposed_diff = diff_lines_by_word(original_lines, proposed_lines)

    print(f"\n{paint('BEFORE CONTEXT', 'bold', color)}")
    print(paint("-" * len("BEFORE CONTEXT"), "dim", color))
    for line_no, text in context["before"]:  # type: ignore[index]
        print_context_line(" ", line_no, text, width, color, "dim")
    for idx, (line_no, text) in enumerate(context["original"]):  # type: ignore[index]
        segments = original_diff[idx] if idx < len(original_diff) else [(text, "bold_red")]
        print_context_segments("-", line_no, segments, width, color, "red")
    for line_no, text in context["after"]:  # type: ignore[index]
        print_context_line(" ", line_no, text, width, color, "dim")

    print(f"\n{paint('AFTER CONTEXT', 'bold', color)}")
    print(paint("-" * len("AFTER CONTEXT"), "dim", color))
    for line_no, text in context["before"]:  # type: ignore[index]
        print_context_line(" ", line_no, text, width, color, "dim")
    for idx, (line_no, text) in enumerate(context["proposed"]):  # type: ignore[index]
        segments = proposed_diff[idx] if idx < len(proposed_diff) else [(text, "bold_green")]
        print_context_segments("+", line_no, segments, width, color, "green")
    for line_no, text in context["after"]:  # type: ignore[index]
        print_context_line(" ", line_no, text, width, color, "dim")

    print_colored_block("RATIONALE", rationale, width, color, "yellow")
    if hash_warning:
        print()
        wrap_print(paint(hash_warning, "red", color), width)
    return True


def status_counts(rows: list[dict[str, str]]) -> str:
    counts = Counter(row.get("status", "") for row in rows)
    parts = []
    for status in ("pending", "accepted", "rejected", "needs-rewrite", "needs-fact-check"):
        count = counts.get(status, 0)
        if count:
            parts.append(f"{status} {count}")
    return " | ".join(parts) if parts else "no rows"


def filter_label(filters: argparse.Namespace) -> str:
    parts = []
    for attr in ("status", "type", "severity", "campaign", "scope"):
        value = getattr(filters, attr, None)
        if value:
            parts.append(f"{attr}={value}")
    grep = getattr(filters, "grep", None)
    if grep:
        parts.append(f"grep={grep!r}")
    return ", ".join(parts) if parts else "none"


def print_concise_issue(
    audit_dir: Path,
    rows: list[dict[str, str]],
    row: dict[str, str],
    filters: argparse.Namespace,
    message: str,
    no_clear: bool,
    context_radius: int,
    color: bool,
    compact: bool,
) -> None:
    clear_screen(not no_clear)
    width = terminal_width()
    try:
        position = rows.index(row) + 1
    except ValueError:
        position = 0
    total = len(rows)
    status = row.get("status", "")
    severity = row.get("severity", "")
    header = (
        f"{paint(row['id'], 'bold', color)}  "
        f"[{paint(status, status_style(status), color)}]  "
        f"{paint(severity, severity_style(severity), color)}  "
        f"{row.get('type', '')}"
    )
    print(header)
    print(paint("=" * min(width, 88), "dim", color))
    print(f"Row: {position}/{total}    {status_counts(rows)}")
    print(f"Filter: {filter_label(filters)}")
    print(f"View: {'compact' if compact else f'context ({context_radius} lines)'}")
    if row.get("file"):
        print(f"File: {row['file']}:{row.get('start_line', '')}")
    print(f"Summary: {row.get('summary', '')}")
    if row.get("reviewer_notes"):
        print(f"Notes: {row.get('reviewer_notes', '')}")

    preview_text, current, proposed, rationale = issue_preview_parts(row)

    showed_context = False
    if not compact:
        showed_context = print_context_view(row, current, proposed, rationale, width, context_radius, color)

    if showed_context:
        pass
    elif current or proposed or rationale:
        current_segments, proposed_segments = diff_word_segments(current, proposed)
        print_diff_text_block("CURRENT", current_segments, width, color, "red")
        print_diff_text_block("PROPOSED", proposed_segments, width, color, "green")
        print_colored_block("RATIONALE", rationale, width, color, "yellow")
    elif preview_text:
        lines = preview_text.splitlines()
        excerpt = "\n".join(lines[: min(len(lines), 28)])
        print_colored_block("PREVIEW", excerpt, width, color)

    print("\nCommands")
    print("  a accept   r reject   w rewrite   f fact-check   m note   n/Enter next   b back")
    print("  A/R/W/F ask note first   g goto   s search   c clear search   t toggle view")
    print("  [ less context   ] more context   v full preview   ? help   q quit")
    print("  Decisions update issues.csv only. Run `review.py apply` later to patch manuscript files.")
    if message:
        print(f"\n{message}")


def read_key(prompt: str) -> str:
    if not sys.stdin.isatty():
        value = input(prompt)
        return value[:1] if value else "\n"

    print(prompt, end="", flush=True)
    fd = sys.stdin.fileno()
    old_settings = termios.tcgetattr(fd)
    try:
        tty.setcbreak(fd)
        char = sys.stdin.read(1)
    finally:
        termios.tcsetattr(fd, termios.TCSADRAIN, old_settings)
    if char == "\x03":
        raise KeyboardInterrupt
    print()
    return char


def prompt_line(prompt: str) -> str:
    try:
        return input(prompt).strip()
    except EOFError:
        return ""


def wait_for_key() -> None:
    try:
        read_key("Press any key to continue...")
    except KeyboardInterrupt:
        pass


def find_prev_row(
    rows: list[dict[str, str]],
    args: argparse.Namespace,
    before_issue_id: str = "",
) -> dict[str, str] | None:
    matches = [idx for idx, row in enumerate(rows) if matches_filters(row, args)]
    if not matches:
        return None

    start_idx = len(rows)
    if before_issue_id:
        try:
            normalized = normalize_id(before_issue_id)
        except SystemExit:
            normalized = ""
        if normalized:
            for idx, row in enumerate(rows):
                if row.get("id", "").upper() == normalized:
                    start_idx = idx
                    break

    for idx in reversed(matches):
        if idx < start_idx:
            return rows[idx]
    return rows[matches[-1]]


def ask_note_for_key(key: str) -> str:
    if key.isupper():
        return prompt_line("Decision note: ")
    return ""


def print_full_preview(audit_dir: Path, row: dict[str, str], no_clear: bool) -> None:
    clear_screen(not no_clear)
    print_issue_preview(audit_dir, row)
    print()
    wait_for_key()


def cmd_ui(args: argparse.Namespace) -> int:
    audit_dir = resolve_audit_dir(args.audit_dir)
    rows, fieldnames = load_rows(audit_dir)
    filters = argparse.Namespace(
        status=args.status,
        type=args.type,
        severity=args.severity,
        campaign=args.campaign,
        scope=args.scope,
        grep=args.grep,
    )

    current: dict[str, str] | None = None
    current_id = get_current_id(audit_dir)
    if current_id:
        try:
            candidate = row_by_id(rows, current_id)
            if matches_filters(candidate, filters):
                current = candidate
        except SystemExit:
            current = None
    if current is None:
        current = find_next_row(rows, filters)
    if current is None:
        print(f"No issues match: {filter_label(filters)}")
        return 1
    set_current_id(audit_dir, current["id"])

    color = color_enabled(args.color)
    context_radius = max(0, args.context)
    compact = args.compact
    message = ""
    while True:
        print_concise_issue(
            audit_dir,
            rows,
            current,
            filters,
            message,
            args.no_clear,
            context_radius,
            color,
            compact,
        )
        message = ""
        try:
            key = read_key("Action: ")
        except KeyboardInterrupt:
            print("\nQuit.")
            return 130

        if key in ("q", "Q"):
            print("Saved review state. No manuscript patches applied.")
            return 0

        if key in ("\n", "\r", " ", "n", "N"):
            next_row = find_next_row(rows, filters, current["id"])
            if next_row:
                current = next_row
                set_current_id(audit_dir, current["id"])
            else:
                message = "No matching issue found."
            continue

        if key in ("b", "B"):
            prev_row = find_prev_row(rows, filters, current["id"])
            if prev_row:
                current = prev_row
                set_current_id(audit_dir, current["id"])
            else:
                message = "No matching issue found."
            continue

        if key in ("a", "A", "r", "R", "w", "W", "f", "F", "u", "U"):
            status_map = {
                "a": "accepted",
                "r": "rejected",
                "w": "needs-rewrite",
                "f": "needs-fact-check",
                "u": "pending",
            }
            status = status_map[key.lower()]
            note = ask_note_for_key(key)
            changed = mark_rows(rows, [current], status, note)
            save_rows(audit_dir, rows, fieldnames)
            next_row = find_next_row(rows, filters, current["id"])
            if next_row:
                current = next_row
                set_current_id(audit_dir, current["id"])
                message = f"{status}: {', '.join(changed)}"
            else:
                message = f"{status}: {', '.join(changed)}; no more matching issues."
            continue

        if key in ("m", "M"):
            note = prompt_line("Note: ")
            if note:
                existing = current.get("reviewer_notes", "")
                current["reviewer_notes"] = f"{existing} | {note}" if existing else note
                current["decided_at"] = utc_now()
                save_rows(audit_dir, rows, fieldnames)
                message = f"noted: {current['id']}"
            continue

        if key in ("g", "G"):
            wanted = prompt_line("Issue id: ")
            if wanted:
                try:
                    current = row_by_id(rows, wanted)
                    set_current_id(audit_dir, current["id"])
                    message = f"current: {current['id']}"
                except SystemExit as exc:
                    message = str(exc)
            continue

        if key == "s":
            grep = prompt_line("Search text (blank clears): ")
            filters.grep = grep or None
            next_row = find_next_row(rows, filters)
            if next_row:
                current = next_row
                set_current_id(audit_dir, current["id"])
                message = f"search: {grep or 'cleared'}"
            else:
                filters.grep = None
                message = f"No matches for search; search cleared: {grep}"
            continue

        if key in ("c", "C"):
            filters.grep = None
            message = "search cleared"
            continue

        if key in ("t", "T"):
            compact = not compact
            message = f"view: {'compact' if compact else 'context'}"
            continue

        if key == "[":
            context_radius = max(0, context_radius - 1)
            compact = False
            message = f"context: {context_radius} line(s)"
            continue

        if key == "]":
            context_radius += 1
            compact = False
            message = f"context: {context_radius} line(s)"
            continue

        if key in ("v", "V"):
            print_full_preview(audit_dir, current, args.no_clear)
            continue

        if key == "?":
            clear_screen(not args.no_clear)
            print("Interactive review keys")
            print("=======================")
            print("a accept current proposal")
            print("r reject current proposal")
            print("w mark current proposal needs-rewrite")
            print("f mark current proposal needs-fact-check")
            print("A/R/W/F do the same after prompting for a decision note")
            print("u return current proposal to pending")
            print("m add a note without changing status")
            print("n, Enter, or Space skip to next matching issue")
            print("b go back to previous matching issue")
            print("g jump to an issue id, such as MEAT-0021 or 21")
            print("s search within id, summary, file, type, campaign, and status")
            print("c clear the current search")
            print("t toggle compact/context display")
            print("[ reduce context lines")
            print("] increase context lines")
            print("v show the full preview markdown")
            print("q quit")
            print()
            wait_for_key()
            continue

        message = f"Unknown key: {key!r}. Press ? for help."


def selected_rows(args: argparse.Namespace, rows: list[dict[str, str]]) -> list[dict[str, str]]:
    if args.issue_ids:
        return [row_by_id(rows, issue_id) for issue_id in args.issue_ids]
    return [row for row in rows if row.get("status") == args.status]


def cmd_validate(args: argparse.Namespace) -> int:
    audit_dir = resolve_audit_dir(args.audit_dir)
    rows, _ = load_rows(audit_dir)
    targets = selected_rows(args, rows)
    failures = 0
    checked = 0
    for row in targets:
        if not row.get("patch_path"):
            if args.verbose:
                print(f"skip {row['id']}: no patch")
            continue
        checked += 1
        result = run_git_apply(patch_path(audit_dir, row), check_only=True)
        if not result.returncode:
            if args.verbose:
                suffix = ""
                if not args.ignore_hash and not hash_matches(row):
                    suffix = " (source-line hash drifted, patch still applies)"
                print(f"ok {row['id']}{suffix}")
            continue

        if not args.no_fallback:
            ok, message, _ = exact_preview_replacement(row, write=False)
            if ok:
                if args.verbose:
                    print(f"ok {row['id']}: {message}")
                continue

        failures += 1
        print(f"patch check failed {row['id']}: {result.stderr.strip()}")
        if not args.no_fallback:
            ok, message, _ = exact_preview_replacement(row, write=False)
            print(f"fallback check failed {row['id']}: {message}")
    print(f"validated {checked} patch rows; failures: {failures}")
    return 1 if failures else 0


def cmd_apply(args: argparse.Namespace) -> int:
    audit_dir = resolve_audit_dir(args.audit_dir)
    rows, fieldnames = load_rows(audit_dir)
    targets = [row for row in selected_rows(args, rows) if row.get("patch_path")]
    if not targets:
        print("No patch rows selected.")
        return 0
    if args.dry_run:
        validate_args = argparse.Namespace(**vars(args))
        validate_args.verbose = True
        return cmd_validate(validate_args)
    if not args.yes:
        if not sys.stdin.isatty():
            print("Refusing to apply without --yes in a non-interactive shell.")
            return 2
        print(f"Apply {len(targets)} patch(es) to manuscript files? Type yes to continue:")
        if input().strip().lower() != "yes":
            print("Cancelled.")
            return 2

    failures = 0
    applied: list[str] = []
    for row in targets:
        row["apply_error"] = ""
        patch = patch_path(audit_dir, row)
        check = run_git_apply(patch, check_only=True)
        if check.returncode:
            if not args.no_fallback:
                ok, message, _ = exact_preview_replacement(row, write=True)
                if ok:
                    row["status"] = "applied"
                    row["applied_at"] = utc_now()
                    applied.append(row["id"])
                    print(f"applied {row['id']} ({message})")
                    continue

            failures += 1
            fallback_message = ""
            if not args.no_fallback:
                _, fallback_message, _ = exact_preview_replacement(row, write=False)
            row["apply_error"] = check.stderr.strip()
            if fallback_message:
                row["apply_error"] = f"{row['apply_error']} | {fallback_message}"
            print(f"skip {row['id']}: patch check failed")
            if check.stderr.strip():
                print(check.stderr.strip())
            if fallback_message:
                print(fallback_message)
            if not args.keep_going:
                break
            continue

        result = run_git_apply(patch, check_only=False)
        if result.returncode:
            if not args.no_fallback:
                ok, message, _ = exact_preview_replacement(row, write=True)
                if ok:
                    row["status"] = "applied"
                    row["applied_at"] = utc_now()
                    applied.append(row["id"])
                    print(f"applied {row['id']} ({message})")
                    continue

            failures += 1
            row["apply_error"] = result.stderr.strip()
            print(f"failed {row['id']}: {result.stderr.strip()}")
            if not args.keep_going:
                break
            continue
        row["status"] = "applied"
        row["applied_at"] = utc_now()
        applied.append(row["id"])
        print(f"applied {row['id']}")
    save_rows(audit_dir, rows, fieldnames)
    print(f"applied: {len(applied)}; failures: {failures}")
    return 1 if failures else 0


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Review and apply MEAT editorial audit proposals.",
    )
    parser.add_argument(
        "--audit-dir",
        help="Audit directory containing issues.csv. Defaults to latest generated audit.",
    )
    sub = parser.add_subparsers(dest="command", required=True)

    sub.add_parser("status", help="Show ledger counts.").set_defaults(func=cmd_status)

    list_p = sub.add_parser("list", help="List issues.")
    list_p.add_argument("--status")
    list_p.add_argument("--type")
    list_p.add_argument("--severity")
    list_p.add_argument("--campaign")
    list_p.add_argument("--scope")
    list_p.add_argument("--grep")
    list_p.add_argument("--limit", type=int, default=40)
    list_p.add_argument("--all", action="store_true")
    list_p.set_defaults(func=cmd_list)

    next_p = sub.add_parser("next", help="Show the next matching issue and make it current.")
    next_p.add_argument("--status", default="pending")
    next_p.add_argument("--type")
    next_p.add_argument("--severity")
    next_p.add_argument("--campaign")
    next_p.add_argument("--scope")
    next_p.add_argument("--grep")
    next_p.set_defaults(func=cmd_next)

    sub.add_parser("current", help="Show the current issue.").set_defaults(func=cmd_current)

    ui_p = sub.add_parser("ui", help="Run an interactive single-key review UI.")
    ui_p.add_argument("--status", default="pending", choices=sorted(VALID_STATUSES | {"any"}))
    ui_p.add_argument("--type")
    ui_p.add_argument("--severity")
    ui_p.add_argument("--campaign")
    ui_p.add_argument("--scope")
    ui_p.add_argument("--grep")
    ui_p.add_argument("--no-clear", action="store_true", help="Do not clear the screen between issues.")
    ui_p.add_argument("--context", type=int, default=2, help="Neighboring source lines to show around changes.")
    ui_p.add_argument("--compact", action="store_true", help="Start with compact current/proposed blocks.")
    ui_p.add_argument(
        "--color",
        choices=("auto", "always", "never"),
        default="auto",
        help="Colorize the interactive UI. Defaults to auto.",
    )
    ui_p.set_defaults(func=cmd_ui)

    show_p = sub.add_parser("show", help="Print a preview markdown file.")
    show_p.add_argument("issue_id")
    show_p.set_defaults(func=cmd_show)

    for name, status in [
        ("accept", "accepted"),
        ("reject", "rejected"),
        ("pending", "pending"),
        ("rewrite", "needs-rewrite"),
        ("factcheck", "needs-fact-check"),
    ]:
        p = sub.add_parser(name, help=f"Mark issue(s) {status}.")
        p.add_argument("issue_ids", nargs="*")
        p.add_argument("--note", default="")
        p.add_argument(
            "--no-next",
            action="store_true",
            help="When no issue ID is supplied, do not advance to the next pending issue.",
        )
        p.set_defaults(func=lambda args, s=status: set_status(args, s))

    note_p = sub.add_parser("note", help="Append reviewer notes to the current issue or one issue.")
    note_p.add_argument("note_args", nargs="+")
    note_p.set_defaults(func=cmd_note)

    notes_p = sub.add_parser("notes", help="Scan issues with reviewer notes.")
    notes_p.add_argument("--status")
    notes_p.add_argument("--type")
    notes_p.add_argument("--severity")
    notes_p.add_argument("--campaign")
    notes_p.add_argument("--scope")
    notes_p.add_argument("--grep")
    notes_p.add_argument("--limit", type=int, default=40)
    notes_p.add_argument("--all", action="store_true")
    notes_p.add_argument("--preview", action="store_true", help="Include current/proposed/rationale text.")
    notes_p.set_defaults(func=cmd_notes)

    validate_p = sub.add_parser("validate", help="Check hashes and patch applicability.")
    validate_p.add_argument("issue_ids", nargs="*")
    validate_p.add_argument("--status", default="accepted")
    validate_p.add_argument("--ignore-hash", action="store_true")
    validate_p.add_argument("--no-fallback", action="store_true")
    validate_p.add_argument("--verbose", action="store_true")
    validate_p.set_defaults(func=cmd_validate)

    apply_p = sub.add_parser("apply", help="Apply selected accepted patches.")
    apply_p.add_argument("issue_ids", nargs="*")
    apply_p.add_argument("--status", default="accepted")
    apply_p.add_argument("--dry-run", action="store_true")
    apply_p.add_argument("--yes", action="store_true")
    apply_p.add_argument("--ignore-hash", action="store_true")
    apply_p.add_argument("--no-fallback", action="store_true")
    apply_p.add_argument("--keep-going", action="store_true")
    apply_p.set_defaults(func=cmd_apply)

    return parser


def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    return args.func(args)


if __name__ == "__main__":
    raise SystemExit(main())
