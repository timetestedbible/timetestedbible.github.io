#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Full-book Grok API editorial review → proposal ledger only.

Reads ~/.grokapi.key (or $XAI_API_KEY), reviews every print chapter adoc,
writes books/symbolic-language/editorial-review/2026-07-11-phase-9-grok-full-book/
with issues.csv, patches/, previews/, chapter notes, and scans/.

Does NOT modify manuscript files.
"""

from __future__ import annotations

import concurrent.futures
import csv
import dataclasses
import difflib
import hashlib
import json
import os
import re
import shutil
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path


ROOT = Path(__file__).resolve().parents[3]
BOOK = ROOT / "books" / "symbolic-language"
OUT = BOOK / "editorial-review" / "2026-07-11-phase-9-grok-full-book"
RAW_DIR = OUT / "raw"
KEY_FILE = Path.home() / ".grokapi.key"
API_URL = "https://api.x.ai/v1/chat/completions"
MODEL = os.environ.get("GROK_REVIEW_MODEL", "grok-4.5")
MAX_WORKERS = int(os.environ.get("GROK_REVIEW_WORKERS", "4"))
MAX_PROPOSALS_PER_CHUNK = 8
CHUNK_WORDS = 2200
START_ID = 9001  # MEAT-9001+

SYSTEM = """You are Grok reviewing Daniel Larimer's hardcover manuscript:
MEAT — The Bible's Symbolic Language (AsciiDoc source).

You propose localized editorial fixes only. You do NOT rewrite doctrine, invent
scripture, or change quoted Bible text inside quote marks / [quote.scripture] blocks
unless the quote is clearly mistyped relative to a named translation.

HOUSE STYLE (edits that violate these get rejected):
- No hedging / meta-talk / "for the reader to weigh" / naming debates.
- No director cues: Now watch, Mark that, Notice that, Hold that, Weigh the,
  Stop and, Read that slowly, Keep that in mind, Now derive/consider/test.
- Sentences in author prose never start with That / And / But.
- Paragraphs under ~7 sentences; prefer splitting evidence→assembly seams.
- No stock AI vocabulary (delve, tapestry, pivotal, landscape, underscore, robust, nuanced, leverage).
- Assert the case; keep the author's voice, law-positive stance, and density.
- Prefer surgical one-line (or short multi-line contiguous) replacements.
- Do not reopen modernisms the author may keep deliberately unless clearly wrong
  (e.g. do not change "bunker" — already rejected).
- Do not propose changes already fixed by prior audits if the current text is clean.
- Numbers as digits for counts (603,550; 144,000). TimeTested.Bible only in
  front/back matter or footnotes, not body prose.

FIND (priority order):
1. Grammar, typos, agreement, dangling modifiers, comma splices, wrong words.
2. Residual AI/presenter staging and register slips.
3. Clarity: tangled sentences that obscure a clear claim (rewrite shorter, same meaning).
4. House-style sentence-open violations (And/But/That at start of author prose only —
   never inside scripture quotes).
5. Factual naming / internal consistency (wrong model names, broken math, mismatched titles).
6. Bad modern metaphors that fight biblical images.

SKIP:
- Pure style preference with no defect.
- Doctrine disputes (whether a symbol identification is true).
- Global em-dash thinning unless a specific line is overloaded and broken.
- Audio/ twin files (print only).
- Changing scripture quote wording except clear typos.

OUTPUT: valid JSON only, no markdown fences:
{
  "chapter_note": "3-6 sentence critical note on this chunk's strengths and issues",
  "proposals": [
    {
      "old": "exact full line or contiguous lines from the chapter as they appear",
      "new": "replacement with same structural role; preserve AsciiDoc markup, sym: links, footnotes",
      "type": "grammar|typo|ai-sounding-staging|tone-register|readability|sentence-open|factual|bad-metaphor|clarity",
      "severity": "high|medium|low",
      "summary": "one short sentence",
      "rationale": "one or two sentences"
    }
  ]
}

Rules for old/new:
- "old" MUST be an exact substring of the provided chapter text (copy-paste exact).
- Prefer whole single lines. If multi-line, include newlines exactly as in source.
- Maximum """ + str(MAX_PROPOSALS_PER_CHUNK) + """ proposals per response. Prefer fewer high-value fixes over many weak ones.
- If the chunk is already clean, return "proposals": [].
"""


@dataclasses.dataclass
class Proposal:
    file: str
    old: str
    new: str
    type: str
    severity: str
    summary: str
    rationale: str
    campaign: str = "P9-C001"
    scope: str = "localized"
    chapter_note: str = ""


def load_api_key() -> str:
    key = os.environ.get("XAI_API_KEY", "").strip()
    if not key and KEY_FILE.exists():
        key = KEY_FILE.read_text(encoding="utf-8").strip()
    if not key:
        raise SystemExit("No API key: set XAI_API_KEY or put key in ~/.grokapi.key")
    return key


def rel(path: Path) -> str:
    return str(path.relative_to(ROOT))


def hash_text(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()[:16]


def chapter_files() -> list[Path]:
    return sorted(
        p
        for p in BOOK.glob("*.adoc")
        if re.match(r"^\d", p.name) and "draft" not in p.name
    )


def load_prior_olds() -> set[str]:
    olds: set[str] = set()
    root = BOOK / "editorial-review"
    for d in root.iterdir():
        if not d.is_dir() or d.name.startswith("2026-07-11-phase-9"):
            continue
        prev = d / "previews"
        if not prev.exists():
            continue
        for md in prev.glob("MEAT-*.md"):
            t = md.read_text(encoding="utf-8")
            m = re.search(r"## Current\n\n```adoc\n(.*?)```", t, re.S)
            if m:
                olds.add(m.group(1).strip())
    return olds


def strip_front_matter(text: str) -> tuple[str, str]:
    if not text.startswith("---"):
        return "", text
    parts = text.split("---", 2)
    if len(parts) < 3:
        return "", text
    return "---" + parts[1] + "---", parts[2]


def chunk_body(body: str, max_words: int = CHUNK_WORDS) -> list[str]:
    lines = body.splitlines(keepends=True)
    chunks: list[str] = []
    buf: list[str] = []
    words = 0
    for line in lines:
        w = len(line.split())
        if buf and words + w > max_words and line.strip() == "":
            chunks.append("".join(buf))
            buf = []
            words = 0
        buf.append(line)
        words += w
    if buf:
        chunks.append("".join(buf))
    # merge tiny trailing chunk
    if len(chunks) >= 2 and len(chunks[-1].split()) < 200:
        chunks[-2] = chunks[-2] + chunks[-1]
        chunks.pop()
    return chunks or [body]


def chat(api_key: str, user: str, retries: int = 4) -> str:
    payload = {
        "model": MODEL,
        "temperature": 0.2,
        "messages": [
            {"role": "system", "content": SYSTEM},
            {"role": "user", "content": user},
        ],
    }
    data = json.dumps(payload).encode("utf-8")
    last_err: Exception | None = None
    for attempt in range(retries):
        req = urllib.request.Request(
            API_URL,
            data=data,
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
                "User-Agent": "meat-editorial-review/1.0",
            },
            method="POST",
        )
        try:
            with urllib.request.urlopen(req, timeout=300) as resp:
                body = json.loads(resp.read().decode("utf-8"))
            return body["choices"][0]["message"]["content"]
        except urllib.error.HTTPError as e:
            err = e.read().decode("utf-8", errors="replace")
            last_err = RuntimeError(f"HTTP {e.code}: {err[:400]}")
            if e.code in (429, 500, 502, 503, 504):
                time.sleep(2 ** attempt + 1)
                continue
            raise last_err from e
        except Exception as e:  # noqa: BLE001
            last_err = e
            time.sleep(2 ** attempt + 1)
    raise RuntimeError(f"API failed after retries: {last_err}")


def extract_json(text: str) -> dict:
    text = text.strip()
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?\s*", "", text)
        text = re.sub(r"\s*```$", "", text)
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        m = re.search(r"\{.*\}", text, re.S)
        if not m:
            raise
        return json.loads(m.group(0))


def normalize_old_new(s: str) -> str:
    # Models sometimes escape or trailing-space drift
    return s.replace("\r\n", "\n").rstrip("\n")


def locate_old(full_text: str, old: str) -> tuple[int, int] | None:
    """Return 1-based start_line, end_line if unique exact match."""
    old = normalize_old_new(old)
    if not old:
        return None
    # try exact
    idx = full_text.find(old)
    if idx < 0:
        # try line-normalized: strip trailing spaces per line
        lines = full_text.splitlines()
        old_lines = old.splitlines()
        for i in range(len(lines) - len(old_lines) + 1):
            window = lines[i : i + len(old_lines)]
            if all(a.rstrip() == b.rstrip() for a, b in zip(window, old_lines)):
                return i + 1, i + len(old_lines)
        return None
    # uniqueness
    if full_text.find(old, idx + 1) >= 0:
        return None  # ambiguous
    start = full_text.count("\n", 0, idx) + 1
    end = start + old.count("\n")
    return start, end


def review_chunk(
    api_key: str,
    file_rel: str,
    chunk_idx: int,
    chunk_text: str,
    title: str,
) -> dict:
    user = (
        f"File: {file_rel}\n"
        f"Chapter title: {title}\n"
        f"Chunk: {chunk_idx}\n"
        f"Word count: {len(chunk_text.split())}\n\n"
        f"CHAPTER TEXT (AsciiDoc; preserve markup):\n"
        f"-----\n{chunk_text}\n-----\n"
    )
    raw = chat(api_key, user)
    return {"raw": raw, "parsed": extract_json(raw)}


def review_chapter(api_key: str, path: Path) -> dict:
    text = path.read_text(encoding="utf-8")
    fm, body = strip_front_matter(text)
    title = path.stem
    m = re.search(r'^title:\s*"(.*)"', fm, re.M)
    if m:
        title = m.group(1)
    file_rel = rel(path)
    chunks = chunk_body(body)
    # keep front matter only for first chunk context if short chapter single chunk
    notes: list[str] = []
    proposals: list[dict] = []
    raw_parts: list[dict] = []
    for i, ch in enumerate(chunks, start=1):
        # include front matter snippet for first chunk of short files only
        payload = ch
        if i == 1 and fm and len(body.split()) < 800:
            payload = fm + "\n" + ch
        try:
            result = review_chunk(api_key, file_rel, i, payload, title)
            raw_parts.append({"chunk": i, "raw": result["raw"]})
            parsed = result["parsed"]
            if parsed.get("chapter_note"):
                notes.append(str(parsed["chapter_note"]).strip())
            for p in parsed.get("proposals") or []:
                p = dict(p)
                p["_chunk"] = i
                proposals.append(p)
        except Exception as e:  # noqa: BLE001
            raw_parts.append({"chunk": i, "error": str(e)})
    return {
        "file": file_rel,
        "title": title,
        "notes": notes,
        "proposals": proposals,
        "raw_parts": raw_parts,
        "full_text": text,
    }


def ensure_out() -> None:
    if OUT.exists():
        shutil.rmtree(OUT)
    for sub in ("previews", "patches", "campaigns", "scans", "raw", "chapter-notes"):
        (OUT / sub).mkdir(parents=True)


def write_patch(issue_id: str, file_rel: str, full_text: str, old: str, new: str) -> str:
    old_n = normalize_old_new(old)
    new_n = normalize_old_new(new)
    # replace unique occurrence
    if full_text.count(old_n) == 1:
        updated = full_text.replace(old_n, new_n, 1)
    else:
        # line-rstrip match rebuild
        lines = full_text.splitlines(keepends=True)
        old_lines = old_n.splitlines()
        new_lines = new_n.splitlines()
        found = None
        for i in range(len(lines) - len(old_lines) + 1):
            window = [lines[i + j].rstrip("\n\r") for j in range(len(old_lines))]
            if all(a.rstrip() == b.rstrip() for a, b in zip(window, old_lines)):
                found = i
                break
        if found is None:
            raise ValueError("cannot build patch; old not found")
        # preserve newline style of first line
        nl = "\n"
        if lines[found].endswith("\r\n"):
            nl = "\r\n"
        elif lines[found].endswith("\n"):
            nl = "\n"
        replacement = [ln + nl for ln in new_lines]
        # if original last line had no trailing nl at EOF, handle
        updated_lines = lines[:found] + replacement + lines[found + len(old_lines) :]
        updated = "".join(updated_lines)
    a = full_text.splitlines(keepends=True)
    b = updated.splitlines(keepends=True)
    diff = difflib.unified_diff(
        a,
        b,
        fromfile=f"a/{file_rel}",
        tofile=f"b/{file_rel}",
        lineterm="",
    )
    # difflib with keepends true can be messy; rebuild without keepends
    a2 = full_text.splitlines()
    b2 = updated.splitlines()
    diff = difflib.unified_diff(
        a2,
        b2,
        fromfile=f"a/{file_rel}",
        tofile=f"b/{file_rel}",
        lineterm="",
    )
    patch = "\n".join(diff) + "\n"
    path = OUT / "patches" / f"{issue_id}.diff"
    path.write_text(patch, encoding="utf-8")
    return rel(path)


def write_preview(
    issue_id: str,
    p: Proposal,
    start_line: int,
    end_line: int,
    patch_path: str,
    context: str,
) -> str:
    path = OUT / "previews" / f"{issue_id}.md"
    loc = f"lines {start_line}-{end_line}" if end_line != start_line else f"line {start_line}"
    path.write_text(
        f"""# {issue_id}

Status: pending
Scope: {p.scope}
Type: {p.type}
Severity: {p.severity}
Campaign: {p.campaign}
File: `{p.file}`
Location: {loc}

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
{context}
```

## Patch

`{patch_path}`
""",
        encoding="utf-8",
    )
    return rel(path)


def context_for(full_text: str, start: int, end: int, radius: int = 2) -> str:
    lines = full_text.splitlines()
    a = max(1, start - radius)
    b = min(len(lines), end + radius)
    out = []
    for n in range(a, b + 1):
        prefix = ">" if start <= n <= end else " "
        out.append(f"{prefix} {n}: {lines[n - 1]}")
    return "\n".join(out)


def validate_proposal(full_text: str, old: str, new: str) -> tuple[bool, str, tuple[int, int] | None]:
    old = normalize_old_new(old)
    new = normalize_old_new(new)
    if not old or not new:
        return False, "empty old/new", None
    if old == new:
        return False, "noop", None
    if len(old) > 1200 or len(new) > 1400:
        return False, "too long", None
    # refuse scripture-block-only rewrites that change quoted KJV-like long spans lightly? allow but skip if only whitespace
    loc = locate_old(full_text, old)
    if not loc:
        # ambiguous or missing
        if full_text.find(old) >= 0:
            return False, "ambiguous match", None
        return False, "old not found", None
    # reject if inside a pure ____ quote block? still allow grammar fixes outside
    return True, "ok", loc


def main() -> None:
    api_key = load_api_key()
    ensure_out()
    prior_olds = load_prior_olds()
    files = chapter_files()
    print(f"Model: {MODEL}")
    print(f"Chapters: {len(files)}")
    print(f"Workers: {MAX_WORKERS}")
    print(f"Prior proposal olds: {len(prior_olds)}")

    results: list[dict] = []
    # sequential progress with limited parallelism
    with concurrent.futures.ThreadPoolExecutor(max_workers=MAX_WORKERS) as ex:
        futs = {ex.submit(review_chapter, api_key, p): p for p in files}
        done = 0
        for fut in concurrent.futures.as_completed(futs):
            path = futs[fut]
            done += 1
            try:
                res = fut.result()
                results.append(res)
                nprop = len(res.get("proposals") or [])
                print(f"[{done}/{len(files)}] OK {path.name} proposals_raw={nprop}", flush=True)
            except Exception as e:  # noqa: BLE001
                print(f"[{done}/{len(files)}] FAIL {path.name}: {e}", flush=True)
                results.append(
                    {
                        "file": rel(path),
                        "title": path.stem,
                        "notes": [],
                        "proposals": [],
                        "raw_parts": [{"error": str(e)}],
                        "full_text": path.read_text(encoding="utf-8"),
                    }
                )

    # stable order by filename
    results.sort(key=lambda r: r["file"])

    # persist raw
    for res in results:
        slug = Path(res["file"]).stem
        (RAW_DIR / f"{slug}.json").write_text(
            json.dumps(
                {
                    "file": res["file"],
                    "title": res["title"],
                    "notes": res["notes"],
                    "proposals": res["proposals"],
                    "raw_parts": res["raw_parts"],
                },
                indent=2,
                ensure_ascii=False,
            )
            + "\n",
            encoding="utf-8",
        )
        if res["notes"]:
            (OUT / "chapter-notes" / f"{slug}.md").write_text(
                f"# {res['title']}\n\n" + "\n\n".join(res["notes"]) + "\n",
                encoding="utf-8",
            )

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
    reject_log: list[dict] = []
    next_id = START_ID
    seen_olds: set[str] = set(prior_olds)

    type_ok = {
        "grammar",
        "typo",
        "ai-sounding-staging",
        "tone-register",
        "readability",
        "sentence-open",
        "factual",
        "bad-metaphor",
        "clarity",
        "factual-naming",
        "factual-math",
        "word-choice",
    }
    sev_ok = {"high", "medium", "low"}

    for res in results:
        full = res["full_text"]
        for raw_p in res.get("proposals") or []:
            old = normalize_old_new(str(raw_p.get("old", "")))
            new = normalize_old_new(str(raw_p.get("new", "")))
            ptype = str(raw_p.get("type", "clarity")).strip().lower()
            if ptype not in type_ok:
                ptype = "clarity"
            sev = str(raw_p.get("severity", "medium")).strip().lower()
            if sev not in sev_ok:
                sev = "medium"
            summary = str(raw_p.get("summary", "Editorial fix")).strip()[:200]
            rationale = str(raw_p.get("rationale", "")).strip()[:500]
            if old in seen_olds:
                reject_log.append({"file": res["file"], "reason": "duplicate-prior", "old": old[:120]})
                continue
            ok, reason, loc = validate_proposal(full, old, new)
            if not ok or not loc:
                reject_log.append({"file": res["file"], "reason": reason, "old": old[:120]})
                continue
            start, end = loc
            # extract exact text from file for hash/patch stability
            lines = full.splitlines()
            exact_old = "\n".join(lines[start - 1 : end])
            # if model old had trailing space drift, use exact_old and apply same line count for new
            if exact_old != old and full.count(exact_old) == 1:
                # try to map new by replacing normalized
                old, new = exact_old, new
            issue_id = f"MEAT-{next_id:04d}"
            next_id += 1
            try:
                patch_path = write_patch(issue_id, res["file"], full, old, new)
            except Exception as e:  # noqa: BLE001
                reject_log.append({"file": res["file"], "reason": f"patch:{e}", "old": old[:120]})
                next_id -= 1
                continue
            prop = Proposal(
                file=res["file"],
                old=old,
                new=new,
                type=ptype,
                severity=sev,
                summary=summary,
                rationale=rationale or "Grok full-book review.",
                campaign="P9-C001",
            )
            preview_path = write_preview(
                issue_id,
                prop,
                start,
                end,
                patch_path,
                context_for(full, start, end),
            )
            rows.append(
                {
                    "id": issue_id,
                    "status": "pending",
                    "scope": "localized",
                    "type": ptype,
                    "severity": sev,
                    "file": res["file"],
                    "start_line": str(start),
                    "end_line": str(end),
                    "summary": summary,
                    "patch_path": patch_path,
                    "preview_path": preview_path,
                    "campaign": "P9-C001",
                    "original_hash": hash_text(lines[start - 1]),
                    "reviewer_notes": "",
                    "decided_at": "",
                    "applied_at": "",
                    "apply_error": "",
                }
            )
            seen_olds.add(old)

    # campaigns
    campaigns = {
        "P9-C001": (
            "Grok Full-Book Localized Edits",
            "High-confidence localized proposals from a full-manuscript Grok API pass "
            "(grammar, residual staging, house-style opens, clarity). All pending.",
        ),
        "P9-C002": (
            "Chapter Notes Corpus",
            "Per-chapter critical notes in chapter-notes/. Narrative assessment, not patches.",
        ),
        "P9-C003": (
            "Deferred Systematic Passes",
            "Global And/But/That opens, em-dash thinning, and doctrine fact-checks remain "
            "author judgment. See scans/ and phase-8 campaigns.",
        ),
    }
    for cid, (title, body) in campaigns.items():
        path = OUT / "campaigns" / f"{cid.lower()}.md"
        path.write_text(f"# {cid}: {title}\n\n{body}\n", encoding="utf-8")
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

    with (OUT / "issues.csv").open("w", newline="", encoding="utf-8") as fh:
        w = csv.DictWriter(fh, fieldnames=fieldnames, lineterminator="\n")
        w.writeheader()
        w.writerows(rows)

    with (OUT / "scans" / "rejected-proposals.csv").open("w", newline="", encoding="utf-8") as fh:
        w = csv.DictWriter(fh, fieldnames=["file", "reason", "old"], lineterminator="\n")
        w.writeheader()
        w.writerows(reject_log)

    # summary review
    notes_joined = []
    for res in results:
        if res["notes"]:
            notes_joined.append(f"### {res['title']}\n\n" + "\n\n".join(res["notes"]))
    (OUT / "GROK-FULL-BOOK-REVIEW.md").write_text(
        f"""# Grok Full-Book Review — *MEAT The Bible's Symbolic Language*

**Model:** {MODEL}  
**Date:** 2026-07-11  
**Scope:** All print `NN-*.adoc` chapters ({len(files)} files)  
**Mode:** Proposal ledger only — nothing applied  

## Counts

- Localized accepted into ledger: {sum(1 for r in rows if r['scope']=='localized')}
- Campaign rows: {sum(1 for r in rows if r['type']=='campaign')}
- Raw model proposals rejected by validator: {len(reject_log)}
  (not found / ambiguous / duplicate of prior audits / too long / patch fail)

## How to review

```bash
books/symbolic-language/editorial-review/review.py \\
  --audit-dir books/symbolic-language/editorial-review/2026-07-11-phase-9-grok-full-book ui
```

## Per-chapter notes

See `chapter-notes/` and excerpts below.

{chr(10).join(notes_joined[:40])}

---

*Full notes for every chapter are in `chapter-notes/`.*
""",
        encoding="utf-8",
    )

    (OUT / "README.md").write_text(
        f"""# Phase 9 — Grok Full-Book API Review

Proposal-only audit generated by `run_full_book_grok_review.py` using model `{MODEL}`.

## Counts

- Localized patches: {sum(1 for r in rows if r['scope']=='localized')}
- Campaigns: {sum(1 for r in rows if r['type']=='campaign')}
- Validator rejects (not logged as issues): {len(reject_log)}

## Review

```bash
books/symbolic-language/editorial-review/review.py --audit-dir books/symbolic-language/editorial-review/2026-07-11-phase-9-grok-full-book ui
books/symbolic-language/editorial-review/review.py --audit-dir books/symbolic-language/editorial-review/2026-07-11-phase-9-grok-full-book list --status pending --all
books/symbolic-language/editorial-review/review.py --audit-dir books/symbolic-language/editorial-review/2026-07-11-phase-9-grok-full-book validate --status pending --verbose
```

Apply only after accept:

```bash
books/symbolic-language/editorial-review/review.py --audit-dir books/symbolic-language/editorial-review/2026-07-11-phase-9-grok-full-book apply --dry-run
books/symbolic-language/editorial-review/review.py --audit-dir books/symbolic-language/editorial-review/2026-07-11-phase-9-grok-full-book apply --yes
```

## Files

- `GROK-FULL-BOOK-REVIEW.md` — overview + notes
- `chapter-notes/` — per-chapter critical notes
- `raw/` — full model JSON responses
- `scans/rejected-proposals.csv` — proposals dropped by validator
""",
        encoding="utf-8",
    )

    print(
        f"Done. Localized={sum(1 for r in rows if r['scope']=='localized')} "
        f"rejected={len(reject_log)} out={rel(OUT)}"
    )


if __name__ == "__main__":
    main()
