#!/usr/bin/env python3
"""Reproducible, cross-model blind test of the Symbolic Language glossary.

The runner uses only the Python standard library. It snapshots every input and
prompt, saves the exact secret-free request, saves the provider's raw response,
normalizes/validates the JSON, resumes interrupted runs, and generates the
summary table deterministically.
"""

from __future__ import annotations

import argparse
import concurrent.futures
import csv
import datetime as dt
import hashlib
import json
import os
import re
import shutil
import sys
import time
import urllib.error
import urllib.request
from collections import Counter
from pathlib import Path
from typing import Any


HERE = Path(__file__).resolve().parent
BOOK = HERE.parents[1]
ROOT = BOOK.parents[1]
GLOSSARY = BOOK / "49-glossary.adoc"
BIBLE = ROOT / "bibles" / "kjv_strongs.txt"
INPUT_FILE = HERE / "inputs" / "glossary.json"
DEFAULT_CONFIG = HERE / "config.example.json"
CALL_CACHE = HERE / ".call-cache"
STAGES = ("consensus", "relationship", "persuasion")
FOREIGN_CHAPTER_BOOKS = {
    "time-tested-tradition": ROOT / "books" / "time-tested-tradition",
}

METHOD_EXCERPTS = (
    (BOOK / "01-introduction.adoc", None, "[discrete]\n=== What Is a Symbolic Word?", "opening"),
    (BOOK / "02-the-parables-of-the-kingdom.adoc", None, "[discrete]\n=== The Sower, Derived and Graded", "opening through How the Exam Is Taken"),
    (BOOK / "02-the-parables-of-the-kingdom.adoc", "[discrete]\n=== The Sower, Derived and Graded", "[discrete]\n=== The Wheat and the Tares", "The Sower, Derived and Graded"),
)

# Some glossary conclusions depend on premises proved in earlier chapters.
# Keep those dependencies explicit so a persuasion judge receives the argument
# as the book presents it instead of treating the glossary's owner chapter as
# a self-contained essay.
EVIDENCE_DEPENDENCIES = {
    "pearl": ("sun-moon-and-stars", "lucifers-declared-plan"),
}

SYSTEMS = {
    "consensus": "Return only the requested structured result. Remain blind to the author's position.",
    "relationship": "Return only the requested structured result. Classify consensus distance without deciding the full chapter's persuasiveness.",
    "persuasion": "Return only the requested structured result. Judge the exact glossary entry against the strongest specific alternative; treat the chapter as evidence, not as an additional judgment target.",
    "vowel_points_blind": "Return only the requested structured result. Decide the foundational textual question independently, without anticipating any later biblical-symbol claim.",
    "vowel_points_adjudication": "Return only the requested structured result. Compare your frozen prior commitment with the supplied chapter, revising it only where the chapter's evidence warrants revision.",
    "reading_rules_proposal": "Return only the requested structured result. Propose a general comparison method independently, before seeing the author's rules or any disputed reading.",
    "reading_rules_fairness": "Return only the requested structured result. Evaluate the supplied rules for symmetry, neutrality, clarity, and reproducibility without inventing or assuming a rationale for them.",
    "reading_rules_rationale": "Return only the requested structured result. Decide whether the disclosed rationale establishes the already-reviewed rules as the best objective baseline, and identify any remaining defect precisely.",
}

BOOK_ALIASES = {
    "Gen": "Genesis", "Genesis": "Genesis", "Ex": "Exodus", "Exod": "Exodus", "Exodus": "Exodus",
    "Lev": "Leviticus", "Leviticus": "Leviticus", "Num": "Numbers", "Numbers": "Numbers",
    "Deut": "Deuteronomy", "Deuteronomy": "Deuteronomy", "Josh": "Joshua", "Joshua": "Joshua",
    "Judg": "Judges", "Judges": "Judges", "Ruth": "Ruth", "1 Sam": "1 Samuel", "1 Samuel": "1 Samuel",
    "2 Sam": "2 Samuel", "2 Samuel": "2 Samuel", "1 Kgs": "1 Kings", "1 Kings": "1 Kings",
    "2 Kgs": "2 Kings", "2 Kings": "2 Kings", "1 Chr": "1 Chronicles", "1 Chronicles": "1 Chronicles",
    "2 Chr": "2 Chronicles", "2 Chronicles": "2 Chronicles", "Ezra": "Ezra", "Neh": "Nehemiah",
    "Nehemiah": "Nehemiah", "Est": "Esther", "Esther": "Esther", "Job": "Job", "Ps": "Psalms",
    "Psalm": "Psalms", "Psalms": "Psalms", "Prov": "Proverbs", "Proverbs": "Proverbs",
    "Eccl": "Ecclesiastes", "Ecclesiastes": "Ecclesiastes", "Song": "Song of Solomon",
    "Song of Solomon": "Song of Solomon", "Isa": "Isaiah", "Isaiah": "Isaiah", "Jer": "Jeremiah",
    "Jeremiah": "Jeremiah", "Lam": "Lamentations", "Lamentations": "Lamentations", "Ezek": "Ezekiel",
    "Ezekiel": "Ezekiel", "Dan": "Daniel", "Daniel": "Daniel", "Hos": "Hosea", "Hosea": "Hosea",
    "Joel": "Joel", "Amos": "Amos", "Obad": "Obadiah", "Obadiah": "Obadiah", "Jonah": "Jonah",
    "Mic": "Micah", "Micah": "Micah", "Nah": "Nahum", "Nahum": "Nahum", "Hab": "Habakkuk",
    "Habakkuk": "Habakkuk", "Zeph": "Zephaniah", "Zephaniah": "Zephaniah", "Hag": "Haggai",
    "Haggai": "Haggai", "Zech": "Zechariah", "Zechariah": "Zechariah", "Mal": "Malachi",
    "Malachi": "Malachi", "Matt": "Matthew", "Matthew": "Matthew", "Mark": "Mark", "Luke": "Luke",
    "John": "John", "Acts": "Acts", "Rom": "Romans", "Romans": "Romans", "1 Cor": "1 Corinthians",
    "1 Corinthians": "1 Corinthians", "2 Cor": "2 Corinthians", "2 Corinthians": "2 Corinthians",
    "Gal": "Galatians", "Galatians": "Galatians", "Eph": "Ephesians", "Ephesians": "Ephesians",
    "Phil": "Philippians", "Philippians": "Philippians", "Col": "Colossians", "Colossians": "Colossians",
    "1 Thess": "1 Thessalonians", "1 Thessalonians": "1 Thessalonians", "2 Thess": "2 Thessalonians",
    "2 Thessalonians": "2 Thessalonians", "1 Tim": "1 Timothy", "1 Timothy": "1 Timothy",
    "2 Tim": "2 Timothy", "2 Timothy": "2 Timothy", "Titus": "Titus", "Philem": "Philemon",
    "Philemon": "Philemon", "Heb": "Hebrews", "Hebrews": "Hebrews", "Jas": "James", "James": "James",
    "1 Pet": "1 Peter", "1 Peter": "1 Peter", "2 Pet": "2 Peter", "2 Peter": "2 Peter",
    "1 John": "1 John", "2 John": "2 John", "3 John": "3 John", "Jude": "Jude", "Rev": "Revelation",
    "Revelation": "Revelation"
}
BOOK_RX = "|".join(sorted((re.escape(k) for k in BOOK_ALIASES), key=len, reverse=True))


def sha256_text(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def dump_json(path: Path, value: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def load_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def call_cache_key(request_record: dict[str, Any]) -> str:
    signature = {
        "provider": request_record["provider"],
        "stage": request_record["stage"],
        "url": request_record["url"],
        "payload": request_record["payload"],
    }
    return sha256_text(json.dumps(signature, sort_keys=True, separators=(",", ":"), ensure_ascii=False))


def store_call_cache(key: str, request_record: dict[str, Any], response: dict[str, Any], normalized: dict[str, Any], source: dict[str, str]) -> None:
    folder = CALL_CACHE / key
    dump_json(folder / "request.json", request_record)
    dump_json(folder / "response.json", response)
    dump_json(folder / "normalized.json", normalized)
    dump_json(folder / "source.json", source)


def find_cached_call(key: str, request_record: dict[str, Any], current_run: Path) -> tuple[dict[str, Any], dict[str, Any], dict[str, str]] | None:
    folder = CALL_CACHE / key
    if all((folder / name).exists() for name in ("response.json", "normalized.json", "source.json")):
        return load_json(folder / "response.json"), load_json(folder / "normalized.json"), load_json(folder / "source.json")
    stage = request_record["stage"]
    provider = request_record["provider"]
    for path in sorted((HERE / "runs").glob(f"*/requests/{stage}/*/{provider}.json")):
        source_run = path.parents[3]
        if source_run == current_run:
            continue
        try:
            prior_request = load_json(path)
        except (OSError, ValueError, json.JSONDecodeError):
            continue
        if call_cache_key(prior_request) != key:
            continue
        anchor = path.parent.name
        response_path = source_run / "responses" / stage / anchor / path.name
        normalized_path = source_run / "normalized" / stage / anchor / path.name
        if not response_path.exists() or not normalized_path.exists():
            continue
        response = load_json(response_path)
        normalized = load_json(normalized_path)
        source = {"run_id": source_run.name, "request": str(path.relative_to(HERE))}
        store_call_cache(key, request_record, response, normalized, source)
        return response, normalized, source
    return None


def split_front_matter(raw: str) -> tuple[str, str]:
    match = re.match(r"\A---\s*\n(.*?)\n---\s*\n?(.*)\Z", raw, re.S)
    return (match.group(1), match.group(2)) if match else ("", raw)


def front_value(front: str, key: str) -> str:
    match = re.search(rf"(?m)^{re.escape(key)}:\s*[\"']?([^\n\"']+)", front)
    return match.group(1).strip() if match else ""


def chapter_map(book: Path = BOOK) -> dict[str, Path]:
    result: dict[str, Path] = {}
    for path in sorted(book.glob("[0-9]*-*.adoc")):
        front, _ = split_front_matter(path.read_text(encoding="utf-8"))
        slug = front_value(front, "slug")
        if slug:
            result[slug] = path
    return result


def clean_adoc(value: str) -> str:
    value = re.sub(
        r"(?ms)^// experiment-ablation-start: ([^\n]+)\n.*?^// experiment-ablation-end: \1\s*$",
        "",
        value,
    )
    value = re.sub(r"(?m)^---.*?^---\s*", "", value, flags=re.S)
    value = re.sub(r"(?m)^(?:ifn?def|endif)::.*$", "", value)
    value = re.sub(r"(?m)^\[[^\]]+\]\s*$", "", value)
    value = re.sub(r"(?m)^_{4}$|^={3,}.*$|^'{3}$|^<<<$", "", value)
    value = re.sub(r"footnote:[^\[]+\[([^\]]*)\]", r" [Footnote: \1]", value)
    value = re.sub(r"sym:[^\[]+\[([^\]]+)\]", r"\1", value)
    value = re.sub(r"link:[^\[]+\[([^\]]+)\]", r"\1", value)
    value = re.sub(r"image::[^\n]+", "", value)
    value = value.replace("__", "").replace("**", "").replace("*", "").replace("_", "")
    value = re.sub(r"\[\.chnum\]#([^#]*)#", r"\1", value)
    value = re.sub(r"\s+\+\s*$", "", value, flags=re.M)
    value = re.sub(r"\n{3,}", "\n\n", value)
    return value.strip()


def parse_glossary(include_words: bool = False) -> list[dict[str, Any]]:
    raw = GLOSSARY.read_text(encoding="utf-8")
    chapters = chapter_map()
    foreign_chapters = {
        book_name: chapter_map(book_path)
        for book_name, book_path in FOREIGN_CHAPTER_BOOKS.items()
    }
    blocks = re.findall(r"(?ms)^\[\[sym-([^\]]+)\]\](.*?)(?=^\[\[sym-|\Z)", raw)
    entries: list[dict[str, Any]] = []
    for anchor, block in blocks:
        if "::" not in block:
            continue
        heading, rest = block.split("::", 1)
        heading = heading.strip()
        verdict_match = re.search(r"\s+verdict:(match|refined|divergent|novel|word)\[\]", heading)
        source_badge = verdict_match.group(1).upper() if verdict_match else ""
        term = re.sub(r"\s+verdict:[a-z-]+\[\]", "", heading).strip()
        if source_badge == "WORD" and not include_words:
            continue
        definition_raw = re.split(r"(?m)^\[\.(?:commonview|seeref)\]", rest, maxsplit=1)[0]
        common = re.search(r"(?ms)^\[\.commonview\]__(.*?)__", rest)
        seerefs = re.findall(r"(?ms)^\[\.seeref\]__(.*?)__", rest)
        slugs: list[str] = []
        for slug in EVIDENCE_DEPENDENCIES.get(anchor, ()):
            if slug not in slugs:
                slugs.append(slug)
        for slug in re.findall(r"link:/books/symbolic-language/([^/]+)/", "\n".join(seerefs)):
            if slug not in slugs:
                slugs.append(slug)
        chapter_files = [str(chapters[s].relative_to(ROOT)) for s in slugs if s in chapters]
        foreign_chapter_refs: list[dict[str, str]] = []
        for book_name, slug in re.findall(
            r"link:/books/(time-tested-tradition)/([^/]+)/",
            "\n".join(seerefs),
        ):
            reference = {"book": book_name, "slug": slug}
            if reference not in foreign_chapter_refs:
                foreign_chapter_refs.append(reference)
            path = foreign_chapters.get(book_name, {}).get(slug)
            if path:
                relative = str(path.relative_to(ROOT))
                if relative not in chapter_files:
                    chapter_files.append(relative)
        entry = {
            "anchor": anchor,
            "term": clean_adoc(term),
            "definition": clean_adoc(definition_raw),
            "common_view": clean_adoc(common.group(1)) if common else "",
            "citations": clean_adoc(" | ".join(seerefs)),
            "chapter_slugs": slugs,
            "chapter_files": chapter_files,
            "source_badge": source_badge,
        }
        if foreign_chapter_refs:
            entry["foreign_chapter_refs"] = foreign_chapter_refs
        entries.append(entry)
    return entries


def write_input(include_words: bool = False) -> list[dict[str, Any]]:
    entries = parse_glossary(include_words=include_words)
    dump_json(INPUT_FILE, {
        "generated_at": dt.datetime.now(dt.timezone.utc).isoformat(),
        "source": str(GLOSSARY.relative_to(ROOT)),
        "include_recovered_words": include_words,
        "entry_count": len(entries),
        "entries": entries,
    })
    return entries


def load_bible() -> dict[str, str]:
    verses: dict[str, str] = {}
    if not BIBLE.exists():
        return verses
    for line in BIBLE.read_text(encoding="utf-8").splitlines()[2:]:
        if "\t" not in line:
            continue
        ref, text = line.split("\t", 1)
        text = re.sub(r"\{[^}]+\}", "", text)
        verses[ref] = text
    return verses


def scripture_excerpts(citations: str, bible: dict[str, str], limit: int = 40) -> str:
    if not citations or not bible:
        return "No local excerpt was resolved; use the printed references."
    found: list[str] = []
    current_book = ""
    current_chapter = ""
    chunks = re.split(r"[;|]", citations)
    for chunk in chunks:
        match = re.search(rf"(?:(?P<book>{BOOK_RX})\s+)?(?P<chapter>\d+)(?::(?P<verses>\d+(?:-\d+)?(?:\s*,\s*\d+(?:-\d+)?)*))?", chunk)
        if not match:
            continue
        if match.group("book"):
            current_book = BOOK_ALIASES[match.group("book")]
        if not current_book:
            continue
        current_chapter = match.group("chapter") or current_chapter
        verse_spec = match.group("verses")
        refs: list[str] = []
        if verse_spec:
            for part in re.split(r"\s*,\s*", verse_spec):
                if "-" in part:
                    start, end = (int(x) for x in part.split("-", 1))
                    refs.extend(f"{current_book} {current_chapter}:{v}" for v in range(start, end + 1))
                else:
                    refs.append(f"{current_book} {current_chapter}:{int(part)}")
        else:
            prefix = f"{current_book} {current_chapter}:"
            refs.extend(ref for ref in bible if ref.startswith(prefix))
        for ref in refs:
            if ref in bible and ref not in found:
                found.append(ref)
            if len(found) >= limit:
                break
        if len(found) >= limit:
            break
    return "\n".join(f"{ref} — {bible[ref]}" for ref in found) or "No local excerpt was resolved; use the printed references."


def render_template(stage: str, values: dict[str, str], prompt_dir: Path | None = None) -> str:
    prompt_dir = prompt_dir or HERE / "prompts"
    text = (prompt_dir / {"consensus": "01-consensus.md", "relationship": "02-relationship.md", "persuasion": "03-persuasion.md"}[stage]).read_text(encoding="utf-8")
    for key, value in values.items():
        text = text.replace("${" + key + "}", value or "(none)")
    return text


def consensus_bundle(run_dir: Path, anchor: str, providers: list[str]) -> str:
    outputs = []
    label = ord("A")
    for provider in sorted(providers):
        path = run_dir / "normalized" / "consensus" / anchor / f"{provider}.json"
        if path.exists():
            outputs.append(f"RESPONSE {chr(label)}\n{json.dumps(load_json(path), indent=2, ensure_ascii=False)}")
            label += 1
    return "\n\n".join(outputs)


def evidence_bundle(run_dir: Path, entry: dict[str, Any]) -> str:
    parts: list[str] = []
    snapshot = run_dir / "inputs" / "chapters"
    for rel in entry.get("chapter_files", []):
        path = snapshot / Path(rel).name
        if path.exists():
            parts.append(f"SOURCE: {rel}\n\n{clean_adoc(path.read_text(encoding='utf-8'))}")
    if not parts:
        parts.append("No proving chapter was mapped automatically. Judge the glossary entry and supplied Scripture excerpts.")
    return "\n\n===== NEXT SOURCE =====\n\n".join(parts)


def build_method_evidence() -> str:
    parts: list[str] = []
    for path, start_marker, end_marker, label in METHOD_EXCERPTS:
        _, body = split_front_matter(path.read_text(encoding="utf-8"))
        start = body.index(start_marker) if start_marker else 0
        end = body.index(end_marker, start)
        excerpt = clean_adoc(body[start:end])
        source = path.relative_to(ROOT)
        parts.append(f"SOURCE EXCERPT: {source} — {label}\n\n{excerpt}")
    return "\n\n===== NEXT SOURCE EXCERPT =====\n\n".join(parts) + "\n"


def method_evidence(run_dir: Path) -> str:
    path = run_dir / "inputs" / "method-evidence.md"
    if not path.exists():
        return "No common method evidence was included in this protocol version."
    return path.read_text(encoding="utf-8").strip()


def accepted_findings_bundle(run_dir: Path, provider: str | None = None) -> str:
    if provider:
        path = run_dir / "inputs" / "accepted-findings" / f"{provider}.md"
        if path.exists():
            return path.read_text(encoding="utf-8").strip()
    legacy = run_dir / "inputs" / "accepted-findings.md"
    if legacy.exists():
        return legacy.read_text(encoding="utf-8").strip()
    return "No prior findings were supplied."


def schema_for(stage: str, schema_dir: Path | None = None) -> dict[str, Any]:
    return load_json((schema_dir or HERE / "schemas") / f"{stage}.json")


def validate_schema(value: Any, schema: dict[str, Any], path: str = "$" ) -> None:
    expected = schema.get("type")
    if expected == "object":
        if not isinstance(value, dict):
            raise ValueError(f"{path}: expected object")
        for key in schema.get("required", []):
            if key not in value:
                raise ValueError(f"{path}: missing {key}")
        if schema.get("additionalProperties") is False:
            extras = set(value) - set(schema.get("properties", {}))
            if extras:
                raise ValueError(f"{path}: unexpected keys {sorted(extras)}")
        for key, subschema in schema.get("properties", {}).items():
            if key in value:
                validate_schema(value[key], subschema, f"{path}.{key}")
    elif expected == "array":
        if not isinstance(value, list):
            raise ValueError(f"{path}: expected array")
        for index, item in enumerate(value):
            validate_schema(item, schema.get("items", {}), f"{path}[{index}]")
    elif expected == "string":
        if not isinstance(value, str):
            raise ValueError(f"{path}: expected string")
    elif expected == "boolean":
        if not isinstance(value, bool):
            raise ValueError(f"{path}: expected boolean")
    if "enum" in schema and value not in schema["enum"]:
        raise ValueError(f"{path}: {value!r} not in {schema['enum']}")


def validate_persuasion_decision(value: dict[str, Any]) -> None:
    expected = "BOOK" if value["persuasion"] == "PERSUADED" else "COUNTER"
    if value["comparative_winner"] != expected:
        raise ValueError(
            "$.comparative_winner: PERSUADED requires BOOK and UNPERSUADED requires COUNTER"
        )
    if value["persuasion"] == "PERSUADED" and value["support_scope"] == "NONE":
        raise ValueError("$.support_scope: PERSUADED requires FULL or CORE_ONLY")
    unsupported = value.get("unsupported_glossary_assertions", [])
    if value["support_scope"] == "FULL" and unsupported:
        raise ValueError(
            "$.unsupported_glossary_assertions: FULL requires no unsupported assertion from the glossary entry"
        )
    if value["support_scope"] == "CORE_ONLY" and not unsupported:
        raise ValueError(
            "$.unsupported_glossary_assertions: CORE_ONLY requires a material unsupported assertion actually printed in the glossary entry"
        )
    if value["persuasion"] == "UNPERSUADED":
        if value["support_scope"] != "NONE":
            raise ValueError("$.support_scope: UNPERSUADED requires NONE")
        if value["counter_relation_to_book_core"] != "CONTRADICTS":
            raise ValueError(
                "$.counter_relation_to_book_core: UNPERSUADED requires a materially contradictory core"
            )
        if not value["evidence_book_core_cannot_explain"]:
            raise ValueError(
                "$.evidence_book_core_cannot_explain: UNPERSUADED requires incompatible or exclusive evidence"
            )


def validate_relationship_decision(value: dict[str, Any]) -> None:
    allowed = {
        "MATCH": {"EQUIVALENT"},
        "REFINED": {"EQUIVALENT", "BOOK_NARROWS", "BOOK_BROADENS", "COMPATIBLE_OVERLAP"},
        "DIVERGENT": {"CONTRADICTS"},
        "NOVEL": {"NO_CONSENSUS", "COMPATIBLE_OVERLAP"},
    }
    if value["core_relation"] not in allowed[value["relation"]]:
        raise ValueError(
            f"$.core_relation: {value['relation']} requires one of {sorted(allowed[value['relation']])}"
        )
    extension_allowed = {
        "MATCH": {"SAME_CASES"},
        "REFINED": {"SAME_CASES", "BOOK_SUBSET", "BOOK_SUPERSET", "PARTIAL_RECLASSIFICATION"},
        "DIVERGENT": {"SAME_CASES", "BOOK_SUBSET", "BOOK_SUPERSET", "PARTIAL_RECLASSIFICATION", "DIFFERENT_REFERENT"},
        "NOVEL": {"NO_BASELINE", "DIFFERENT_REFERENT"},
    }
    if value["extension_relation"] not in extension_allowed[value["relation"]]:
        raise ValueError(
            f"$.extension_relation: {value['relation']} requires one of {sorted(extension_allowed[value['relation']])}"
        )


def build_request(provider: str, cfg: dict[str, Any], stage: str, prompt: str, schema: dict[str, Any]) -> tuple[dict[str, Any], dict[str, str]]:
    api = cfg["api"]
    if api == "anthropic_messages":
        payload = {
            "model": cfg["model"],
            "max_tokens": cfg.get("max_output_tokens", 3000),
            "system": SYSTEMS[stage],
            "messages": [{"role": "user", "content": prompt}],
            "output_config": {"format": {"type": "json_schema", "schema": schema}},
        }
        headers = {"x-api-key": "<REDACTED>", "anthropic-version": "2023-06-01", "content-type": "application/json"}
    elif api == "responses":
        payload = {
            "model": cfg["model"],
            "instructions": SYSTEMS[stage],
            "input": prompt,
            "max_output_tokens": cfg.get("max_output_tokens", 3000),
            "text": {"format": {"type": "json_schema", "name": f"meat_{stage}", "strict": True, "schema": schema}},
        }
        if cfg.get("reasoning_effort"):
            payload["reasoning"] = {"effort": cfg["reasoning_effort"]}
        headers = {"authorization": "Bearer <REDACTED>", "content-type": "application/json"}
    elif api == "gemini_generate_content":
        payload = {
            "systemInstruction": {"parts": [{"text": SYSTEMS[stage]}]},
            "contents": [{"role": "user", "parts": [{"text": prompt}]}],
            "generationConfig": {
                "maxOutputTokens": cfg.get("max_output_tokens", 12000),
                "responseMimeType": "application/json",
                "responseJsonSchema": schema,
            },
        }
        headers = {"x-goog-api-key": "<REDACTED>", "content-type": "application/json"}
    else:
        raise ValueError(f"Unsupported API style for {provider}: {api}")
    return payload, headers


def extract_response_text(api: str, response: dict[str, Any]) -> str:
    if api == "anthropic_messages":
        return "".join(block.get("text", "") for block in response.get("content", []) if block.get("type") == "text")
    if api == "gemini_generate_content":
        return "".join(
            part.get("text", "")
            for candidate in response.get("candidates", [])
            for part in candidate.get("content", {}).get("parts", [])
            if not part.get("thought")
        )
    if response.get("output_text"):
        return response["output_text"]
    texts: list[str] = []
    for output in response.get("output", []):
        for block in output.get("content", []):
            if block.get("type") in ("output_text", "text"):
                texts.append(block.get("text", ""))
    return "".join(texts)


def parse_json_text(text: str) -> Any:
    text = text.strip()
    text = re.sub(r"^```(?:json)?\s*", "", text)
    text = re.sub(r"\s*```$", "", text)
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        match = re.search(r"\{.*\}", text, re.S)
        if not match:
            raise
        return json.loads(match.group(0))


def http_json(url: str, payload: dict[str, Any], headers: dict[str, str], key: str, api: str, retries: int = 5) -> dict[str, Any]:
    live_headers = dict(headers)
    if api == "anthropic_messages":
        live_headers["x-api-key"] = key
    elif api == "gemini_generate_content":
        live_headers["x-goog-api-key"] = key
    else:
        live_headers["authorization"] = f"Bearer {key}"
    data = json.dumps(payload).encode("utf-8")
    last_error: Exception | None = None
    for attempt in range(retries):
        request = urllib.request.Request(url, data=data, headers=live_headers, method="POST")
        try:
            with urllib.request.urlopen(request, timeout=600) as response:
                return json.loads(response.read().decode("utf-8"))
        except urllib.error.HTTPError as error:
            body = error.read().decode("utf-8", errors="replace")
            last_error = RuntimeError(f"HTTP {error.code}: {body[:1000]}")
            if error.code not in (408, 409, 429, 500, 502, 503, 504):
                raise last_error from error
        except Exception as error:  # noqa: BLE001
            last_error = error
        time.sleep(min(30, 2 ** attempt + attempt))
    raise RuntimeError(f"API failed after {retries} attempts: {last_error}")


def majority(values: list[str]) -> str:
    if not values:
        return "PENDING"
    counts = Counter(values)
    value, count = counts.most_common(1)[0]
    return value if count > len(values) / 2 else "DISPUTED"


def load_votes(run_dir: Path, stage: str, anchor: str, providers: list[str], field: str) -> list[str]:
    votes: list[str] = []
    for provider in providers:
        path = run_dir / "normalized" / stage / anchor / f"{provider}.json"
        if path.exists():
            value = load_json(path).get(field)
            if value:
                votes.append(value)
    return votes


def summarize(run_dir: Path, entries: list[dict[str, Any]], providers: list[str]) -> dict[str, Any]:
    rows: list[dict[str, Any]] = []
    for entry in entries:
        anchor = entry["anchor"]
        relationship_votes = load_votes(run_dir, "relationship", anchor, providers, "relation")
        relation = majority(relationship_votes)
        citation_votes = load_votes(run_dir, "relationship", anchor, providers, "citation_support")
        citation_support = majority(citation_votes)
        persuasion_votes = load_votes(run_dir, "persuasion", anchor, providers, "persuasion")
        persuasion = majority(persuasion_votes)
        if relation == "DIVERGENT":
            if persuasion == "PERSUADED":
                final = "DIVERGENT_PERSUADED"
            elif persuasion == "UNPERSUADED":
                final = "DIVERGENT_UNPERSUADED"
            elif persuasion == "DISPUTED":
                final = "DIVERGENT_DISPUTED"
            else:
                final = "DIVERGENT_PENDING"
        else:
            final = relation
        rows.append({
            "anchor": anchor,
            "term": entry["term"],
            "relation": relation,
            "relationship_votes": relationship_votes,
            "citation_support": citation_support,
            "citation_support_votes": citation_votes,
            "persuasion": persuasion if persuasion_votes else "NOT_APPLICABLE",
            "persuasion_votes": persuasion_votes,
            "final_verdict": final,
        })
    counts = Counter(row["final_verdict"] for row in rows)
    denominator = len(rows)
    summary = {
        "entry_count": denominator,
        "providers": providers,
        "counts": dict(sorted(counts.items())),
        "rows": rows,
    }
    results = run_dir / "results"
    dump_json(results / "summary.json", summary)
    with (results / "verdicts.csv").open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(
            handle,
            fieldnames=["anchor", "term", "relation", "relationship_votes", "citation_support", "citation_support_votes", "persuasion", "persuasion_votes", "final_verdict"],
            lineterminator="\n",
        )
        writer.writeheader()
        for row in rows:
            writer.writerow({**row, "relationship_votes": "|".join(row["relationship_votes"]), "citation_support_votes": "|".join(row["citation_support_votes"]), "persuasion_votes": "|".join(row["persuasion_votes"])})
    labels = [
        ("MATCH", "Match", "book agrees with the recognizable consensus"),
        ("REFINED", "Refined", "compatible with the common reading, but sharper"),
        ("DIVERGENT_PERSUADED", "Divergent — persuaded", "contradicts common teaching; the agents find the supplied case persuasive"),
        ("DIVERGENT_UNPERSUADED", "Divergent — unconvinced", "contradicts common teaching; the agents find the supplied case insufficient"),
        ("NOVEL", "Novel", "no recognizable consensus covers the book's central claim"),
        ("DISPUTED", "Disputed", "the relationship graders did not reach a majority"),
        ("DIVERGENT_DISPUTED", "Divergent — disputed", "relationship is divergent; persuasion graders split"),
        ("DIVERGENT_PENDING", "Divergent — pending", "persuasion stage has not completed"),
        ("PENDING", "Pending", "relationship stage has not completed"),
    ]
    table_rows = [(label, meaning, counts.get(key, 0), round(100 * counts.get(key, 0) / denominator) if denominator else 0) for key, label, meaning in labels if counts.get(key, 0)]
    md = ["# Glossary consensus experiment — generated summary", "", f"Terms: {denominator}", "", "| Verdict | Meaning | Terms | Share |", "|---|---|---:|---:|"]
    md.extend(f"| {label} | {meaning} | {count} | {share}% |" for label, meaning, count, share in table_rows)
    (results / "summary.md").write_text("\n".join(md) + "\n", encoding="utf-8")
    adoc = [".The results", "[.prevalence-table%unbreakable, frame=topbot, grid=none, cols=\"^4,6,^2,^2\", options=\"header\"]", "|===", "| Verdict | Meaning | Terms | Share"]
    adoc.extend(f"| {label} | {meaning} | {count} | {share}%" for label, meaning, count, share in table_rows)
    adoc.append("|===")
    (results / "summary.adoc").write_text("\n".join(adoc) + "\n", encoding="utf-8")
    return summary


def build_accepted_findings(
    run_ids: list[str],
    runs_dir: Path | None = None,
    current_models: dict[str, str] | None = None,
) -> dict[str, Any]:
    runs_dir = runs_dir or HERE / "runs"
    findings_by_anchor: dict[str, dict[str, Any]] = {}
    sources: list[dict[str, str]] = []
    for run_id in run_ids:
        prior = runs_dir / run_id
        manifest_path = prior / "manifest.json"
        glossary_path = prior / "inputs" / "glossary.json"
        if not manifest_path.exists() or not glossary_path.exists():
            raise FileNotFoundError(f"Accepted-finding run is incomplete: {run_id}")
        manifest = load_json(manifest_path)
        providers = list(manifest["providers"])
        sources.append({
            "run_id": run_id,
            "manifest_sha256": sha256_text(manifest_path.read_text(encoding="utf-8")),
        })
        for entry in load_json(glossary_path)["entries"]:
            accepted_by_provider: dict[str, dict[str, Any]] = {}
            for provider in providers:
                path = prior / "normalized" / "persuasion" / entry["anchor"] / f"{provider}.json"
                if not path.exists():
                    continue
                judgment = load_json(path)
                prior_model = manifest["providers"][provider].get("model", "")
                if current_models and current_models.get(provider) != prior_model:
                    continue
                if judgment.get("persuasion") == "PERSUADED":
                    accepted_by_provider[provider] = {
                        "accepted_scope": judgment["support_scope"],
                        "adjudicated_core_identification": judgment["book_core_identification"],
                        "model": prior_model,
                        "source_run": run_id,
                    }
            if not accepted_by_provider:
                continue
            finding = findings_by_anchor.setdefault(entry["anchor"], {
                "anchor": entry["anchor"],
                "term": entry["term"],
                "book_entry": entry["definition"],
                "accepted_by_provider": {},
            })
            finding["term"] = entry["term"]
            finding["book_entry"] = entry["definition"]
            finding["accepted_by_provider"].update(accepted_by_provider)
    return {"sources": sources, "findings": list(findings_by_anchor.values())}


def accepted_findings_markdown(data: dict[str, Any], provider: str) -> str:
    findings = [item for item in data["findings"] if provider in item["accepted_by_provider"]]
    if not findings:
        return "No prior findings were supplied.\n"
    parts = [
        f"# Prior findings accepted by {provider}",
        "",
        "Each premise below was adjudicated PERSUADED by this same provider and model in the named frozen run.",
    ]
    for finding in findings:
        accepted = finding["accepted_by_provider"][provider]
        parts.extend([
            "",
            f"## {finding['term']} — {accepted['accepted_scope']}",
            "",
            f"Source run: `{accepted['source_run']}`",
            "",
            f"Model: `{accepted['model']}`",
            "",
            f"Book entry: {finding['book_entry']}",
            "",
            "Adjudicated core identification:",
            f"- {accepted['adjudicated_core_identification']}",
        ])
    return "\n".join(parts) + "\n"


def snapshot_run(
    run_dir: Path,
    entries: list[dict[str, Any]],
    cfg: dict[str, Any],
    providers: list[str],
    accepted_run_ids: list[str] | None = None,
    persuasion_scope: str = "divergent",
) -> None:
    if (run_dir / "manifest.json").exists():
        return
    (run_dir / "inputs" / "chapters").mkdir(parents=True, exist_ok=True)
    current_input = load_json(INPUT_FILE)
    dump_json(run_dir / "inputs" / "glossary.json", {
        **{key: value for key, value in current_input.items() if key not in ("entry_count", "entries")},
        "entry_count": len(entries),
        "entries": entries,
    })
    for entry in entries:
        for rel in entry.get("chapter_files", []):
            source = ROOT / rel
            target = run_dir / "inputs" / "chapters" / source.name
            if source.exists() and not target.exists():
                shutil.copy2(source, target)
    (run_dir / "inputs" / "method-evidence.md").write_text(build_method_evidence(), encoding="utf-8")
    current_models = {name: cfg["providers"][name]["model"] for name in providers}
    accepted = build_accepted_findings(accepted_run_ids or [], current_models=current_models)
    dump_json(run_dir / "inputs" / "accepted-findings.json", accepted)
    for provider in providers:
        path = run_dir / "inputs" / "accepted-findings" / f"{provider}.md"
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(accepted_findings_markdown(accepted, provider), encoding="utf-8")
    for folder in ("prompts", "schemas"):
        shutil.copytree(HERE / folder, run_dir / folder, dirs_exist_ok=True)
    safe_cfg = json.loads(json.dumps(cfg))
    dump_json(run_dir / "config.json", safe_cfg)
    manifest = {
        "protocol_version": 13,
        "run_id": run_dir.name,
        "created_at": dt.datetime.now(dt.timezone.utc).isoformat(),
        "entry_count": len(entries),
        "persuasion_scope": persuasion_scope,
        "providers": {name: {"model": cfg["providers"][name]["model"], "api": cfg["providers"][name]["api"], "url": cfg["providers"][name]["url"]} for name in providers},
        "input_sha256": sha256_text((run_dir / "inputs" / "glossary.json").read_text(encoding="utf-8")),
        "method_evidence_sha256": sha256_text((run_dir / "inputs" / "method-evidence.md").read_text(encoding="utf-8")),
        "accepted_findings_sha256": sha256_text((run_dir / "inputs" / "accepted-findings.json").read_text(encoding="utf-8")),
        "accepted_finding_sources": accepted["sources"],
        "prompt_sha256": {path.name: sha256_text(path.read_text(encoding="utf-8")) for path in sorted((run_dir / "prompts").glob("*.md"))},
        "notes": "API keys are never written. Proprietary model runs are procedurally reproducible but not byte-for-byte deterministic.",
    }
    dump_json(run_dir / "manifest.json", manifest)


def prompt_values(stage: str, entry: dict[str, Any], run_dir: Path, providers: list[str], bible: dict[str, str], provider: str | None = None) -> dict[str, str]:
    base = {
        "TERM": entry["term"],
        "BOOK_ENTRY": entry["definition"],
        "COMMON_VIEW": entry.get("common_view", ""),
        "CITATIONS": entry.get("citations", ""),
        "SCRIPTURE_EXCERPTS": scripture_excerpts(entry.get("citations", ""), bible),
        "CONSENSUS_RESPONSES": consensus_bundle(run_dir, entry["anchor"], providers),
        "METHOD_EVIDENCE": method_evidence(run_dir),
        "ACCEPTED_FINDINGS": accepted_findings_bundle(run_dir, provider),
        "EVIDENCE_BUNDLE": evidence_bundle(run_dir, entry),
    }
    return base


def one_call(run_dir: Path, provider: str, cfg: dict[str, Any], stage: str, entry: dict[str, Any], providers: list[str], bible: dict[str, str], force: bool) -> tuple[str, str, str, str]:
    anchor = entry["anchor"]
    normalized_path = run_dir / "normalized" / stage / anchor / f"{provider}.json"
    request_path = run_dir / "requests" / stage / anchor / f"{provider}.json"
    response_path = run_dir / "responses" / stage / anchor / f"{provider}.json"
    error_path = run_dir / "errors" / stage / anchor / f"{provider}.json"
    if normalized_path.exists() and not force:
        return stage, anchor, provider, "existing"
    schema = schema_for(stage, run_dir / "schemas")
    prompt = render_template(stage, prompt_values(stage, entry, run_dir, providers, bible, provider), run_dir / "prompts")
    payload, redacted_headers = build_request(provider, cfg, stage, prompt, schema)
    request_record = {
        "provider": provider, "stage": stage, "term": anchor, "url": cfg["url"],
        "headers": redacted_headers, "payload": payload,
    }
    cache_key = call_cache_key(request_record)
    request_record["cache_key"] = cache_key
    if not force and request_path.exists() and response_path.exists():
        prior_request = load_json(request_path)
        if prior_request.get("cache_key") == cache_key:
            try:
                raw = load_json(response_path)
                text = extract_response_text(cfg["api"], raw)
                normalized = parse_json_text(text)
                validate_schema(normalized, schema)
                if stage == "relationship":
                    validate_relationship_decision(normalized)
                if stage == "persuasion":
                    validate_persuasion_decision(normalized)
                request_record["cache"] = {"hit": True, "source": "same-run raw response"}
                dump_json(request_path, request_record)
                dump_json(normalized_path, normalized)
                error_path.unlink(missing_ok=True)
                store_call_cache(cache_key, request_record, raw, normalized, {"run_id": run_dir.name, "request": str(request_path.relative_to(HERE))})
                return stage, anchor, provider, "resume"
            except (KeyError, TypeError, ValueError, json.JSONDecodeError):
                # A saved provider response can become valid after a local
                # validator correction. If it remains invalid, fall through
                # and retry only this effective request instead of the run.
                pass
    if not force:
        cached = find_cached_call(cache_key, request_record, run_dir)
        if cached:
            raw, normalized, source = cached
            validate_schema(normalized, schema)
            if stage == "persuasion":
                validate_persuasion_decision(normalized)
            request_record["cache"] = {"hit": True, "source": source}
            dump_json(run_dir / "requests" / stage / anchor / f"{provider}.json", request_record)
            dump_json(run_dir / "responses" / stage / anchor / f"{provider}.json", raw)
            dump_json(normalized_path, normalized)
            error_path.unlink(missing_ok=True)
            return stage, anchor, provider, "cache"
    request_record["cache"] = {"hit": False}
    dump_json(run_dir / "requests" / stage / anchor / f"{provider}.json", request_record)
    key = os.environ.get(cfg["env_key"], "").strip()
    if not key:
        raise RuntimeError(f"{provider}: set {cfg['env_key']}")
    try:
        raw = http_json(cfg["url"], payload, redacted_headers, key, cfg["api"])
        dump_json(run_dir / "responses" / stage / anchor / f"{provider}.json", raw)
        text = extract_response_text(cfg["api"], raw)
        normalized = parse_json_text(text)
        validate_schema(normalized, schema)
        if stage == "relationship":
            validate_relationship_decision(normalized)
        if stage == "persuasion":
            validate_persuasion_decision(normalized)
        dump_json(normalized_path, normalized)
        error_path.unlink(missing_ok=True)
        store_call_cache(cache_key, request_record, raw, normalized, {"run_id": run_dir.name, "request": str((run_dir / "requests" / stage / anchor / f"{provider}.json").relative_to(HERE))})
    except Exception as error:  # noqa: BLE001
        dump_json(run_dir / "errors" / stage / anchor / f"{provider}.json", {"error": str(error), "provider": provider, "stage": stage, "term": anchor})
        raise
    return stage, anchor, provider, "api"


def run_stage(run_dir: Path, stage: str, entries: list[dict[str, Any]], providers: list[str], cfg: dict[str, Any], bible: dict[str, str], workers: int, force: bool) -> None:
    tasks = [(entry, provider) for entry in entries for provider in providers]
    print(f"{stage}: {len(entries)} terms × {len(providers)} providers")
    failures: list[str] = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=workers) as pool:
        futures = {pool.submit(one_call, run_dir, provider, cfg["providers"][provider], stage, entry, providers, bible, force): (entry["anchor"], provider) for entry, provider in tasks}
        for index, future in enumerate(concurrent.futures.as_completed(futures), 1):
            anchor, provider = futures[future]
            try:
                _, _, _, source = future.result()
                suffix = " (cached)" if source == "cache" else " (resumed raw)" if source == "resume" else ""
                print(f"  [{index}/{len(tasks)}] {anchor} — {provider}{suffix}")
            except Exception as error:  # noqa: BLE001
                failures.append(f"{anchor}/{provider}: {error}")
                print(f"  ERROR {anchor} — {provider}: {error}", file=sys.stderr)
    if failures:
        raise RuntimeError(f"{len(failures)} calls failed; rerun resumes completed calls")


def select_entries(entries: list[dict[str, Any]], terms: list[str], limit: int | None) -> list[dict[str, Any]]:
    if terms:
        wanted = {term.lower() for term in terms}
        entries = [entry for entry in entries if entry["anchor"].lower() in wanted or entry["term"].lower() in wanted]
    return entries[:limit] if limit else entries


def command_run(args: argparse.Namespace) -> None:
    if not INPUT_FILE.exists() or args.refresh_input:
        write_input(include_words=args.include_words)
    elif load_json(INPUT_FILE).get("include_recovered_words", False) != args.include_words:
        write_input(include_words=args.include_words)
    run_id = args.run_id or dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%dT%H%M%SZ")
    run_dir = HERE / "runs" / run_id
    run_dir.mkdir(parents=True, exist_ok=True)
    if (run_dir / "manifest.json").exists():
        entries = load_json(run_dir / "inputs" / "glossary.json")["entries"]
        cfg = load_json(run_dir / "config.json")
        providers = list(load_json(run_dir / "manifest.json")["providers"])
        if args.providers and args.providers != providers:
            raise SystemExit(f"Existing run fixes providers as {providers}; start a new run to change them")
    else:
        input_data = load_json(INPUT_FILE)
        entries = select_entries(input_data["entries"], args.term, args.limit)
        cfg = load_json(Path(args.config))
        providers = args.providers or list(cfg["providers"])
        unknown = set(providers) - set(cfg["providers"])
        if unknown:
            raise SystemExit(f"Unknown providers: {sorted(unknown)}")
        scope = "all" if args.persuade_all else "divergent"
        snapshot_run(run_dir, entries, cfg, providers, args.accepted_run, scope)
    bible = load_bible()
    stop_index = STAGES.index(args.stop_after)
    run_stage(run_dir, "consensus", entries, providers, cfg, bible, args.workers, args.force)
    if stop_index == 0:
        summarize(run_dir, entries, providers)
        return
    run_stage(run_dir, "relationship", entries, providers, cfg, bible, args.workers, args.force)
    summarize(run_dir, entries, providers)
    if stop_index == 1:
        return
    persuasion_scope = load_json(run_dir / "manifest.json").get("persuasion_scope", "divergent")
    persuasion_entries = entries if persuasion_scope == "all" else [entry for entry in entries if majority(load_votes(run_dir, "relationship", entry["anchor"], providers, "relation")) == "DIVERGENT"]
    run_stage(run_dir, "persuasion", persuasion_entries, providers, cfg, bible, args.workers, args.force)
    summary = summarize(run_dir, entries, providers)
    print(f"Wrote {run_dir / 'results'}")
    print(json.dumps(summary["counts"], indent=2))


def command_plan(args: argparse.Namespace) -> None:
    entries = write_input(include_words=args.include_words)
    entries = select_entries(entries, args.term, args.limit)
    cfg = load_json(Path(args.config))
    providers = args.providers or list(cfg["providers"])
    run_id = args.run_id or dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%dT%H%M%SZ-plan")
    run_dir = HERE / "runs" / run_id
    run_dir.mkdir(parents=True, exist_ok=True)
    scope = "all" if args.persuade_all else "divergent"
    snapshot_run(run_dir, entries, cfg, providers, args.accepted_run, scope)
    bible = load_bible()
    for entry in entries:
        for provider in providers:
            schema = schema_for("consensus", run_dir / "schemas")
            prompt = render_template("consensus", prompt_values("consensus", entry, run_dir, providers, bible, provider), run_dir / "prompts")
            payload, headers = build_request(provider, cfg["providers"][provider], "consensus", prompt, schema)
            dump_json(run_dir / "requests" / "consensus" / entry["anchor"] / f"{provider}.json", {"provider": provider, "stage": "consensus", "term": entry["anchor"], "url": cfg["providers"][provider]["url"], "headers": headers, "payload": payload})
    print(f"Planned {len(entries)} terms in {run_dir}; no API calls made")


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest="command", required=True)
    extract = sub.add_parser("extract", help="extract the current 147 symbol entries")
    extract.add_argument("--include-words", action="store_true", help="include the 12 recovered WORD entries")
    extract.set_defaults(func=lambda args: print(f"Wrote {len(write_input(args.include_words))} entries to {INPUT_FILE}"))
    for name, func in (("plan", command_plan), ("run", command_run)):
        cmd = sub.add_parser(name, help="prepare requests only" if name == "plan" else "run or resume the experiment")
        cmd.add_argument("--config", default=str(DEFAULT_CONFIG))
        cmd.add_argument("--providers", nargs="+", choices=["openai", "anthropic", "gemini", "xai"])
        cmd.add_argument("--run-id")
        cmd.add_argument("--term", action="append", default=[], help="anchor or exact headword; repeatable")
        cmd.add_argument("--limit", type=int)
        cmd.add_argument("--include-words", action="store_true", help="include the 12 recovered WORD entries")
        cmd.add_argument("--accepted-run", action="append", default=[], help="import each provider's own persuasion findings from a frozen prior run; repeatable")
        cmd.set_defaults(func=func)
    run = sub.choices["run"]
    plan = sub.choices["plan"]
    plan.add_argument("--persuade-all", action="store_true", help="plan persuasion for every selected entry, not only divergent entries")
    run.add_argument("--workers", type=int, default=4)
    run.add_argument("--stop-after", choices=STAGES, default="persuasion")
    run.add_argument("--force", action="store_true")
    run.add_argument("--refresh-input", action="store_true")
    run.add_argument("--persuade-all", action="store_true", help="run the persuasion stage for every selected entry, not only divergent entries")
    summary = sub.add_parser("summarize", help="regenerate deterministic summaries for an existing run")
    summary.add_argument("run_id")
    summary.set_defaults(func=lambda args: print(json.dumps(summarize(HERE / "runs" / args.run_id, load_json(HERE / "runs" / args.run_id / "inputs" / "glossary.json")["entries"], list(load_json(HERE / "runs" / args.run_id / "manifest.json")["providers"])), indent=2)))
    return parser


def main() -> None:
    args = build_parser().parse_args()
    args.func(args)


if __name__ == "__main__":
    main()
