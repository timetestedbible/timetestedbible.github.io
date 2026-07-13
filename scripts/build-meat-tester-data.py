#!/usr/bin/env python3
"""Build the public MEAT Tester dashboard index from frozen experiment runs.

The index contains only enough data to render and filter the dashboard. Exact
requests, raw responses, normalized judgments, prompts, and source snapshots
remain in their frozen run directories and are fetched only when a reader opens
the audit trail.
"""

from __future__ import annotations

import json
import hashlib
import shutil
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
EXPERIMENT = ROOT / "books" / "symbolic-language" / "experiments" / "glossary-consensus"
RUNS = EXPERIMENT / "runs"
OUTPUT = ROOT / "data" / "meat-tester-experiment.json"
SOURCE_OUTPUT = ROOT / "data" / "meat-tester-sources"
PUBLIC_RUNS = "/books/symbolic-language/experiments/glossary-consensus/runs"
STAGES = ("consensus", "relationship", "persuasion")
PROVIDER_LABELS = {
    "anthropic": "Claude",
    "gemini": "Gemini",
    "openai": "GPT",
    "xai": "Grok",
}


def load_json(path: Path, default: Any = None) -> Any:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return default


def artifact_paths(run_dir: Path, run_url: str, anchor: str, provider: str) -> dict[str, dict[str, str]]:
    result: dict[str, dict[str, str]] = {}
    for stage in STAGES:
        stage_paths = {
            "request": run_dir / "requests" / stage / anchor / f"{provider}.json",
            "response": run_dir / "responses" / stage / anchor / f"{provider}.json",
            "normalized": run_dir / "normalized" / stage / anchor / f"{provider}.json",
        }
        available = {
            name: f"{run_url}/{path.relative_to(run_dir).as_posix()}"
            for name, path in stage_paths.items()
            if path.exists()
        }
        if available:
            result[stage] = available
    return result


def provider_judgment(run_dir: Path, provider: str, anchor: str, model: str, api: str) -> dict[str, Any]:
    consensus = load_json(run_dir / "normalized" / "consensus" / anchor / f"{provider}.json", {})
    relationship = load_json(run_dir / "normalized" / "relationship" / anchor / f"{provider}.json", {})
    persuasion = load_json(run_dir / "normalized" / "persuasion" / anchor / f"{provider}.json", {})
    run_url = f"{PUBLIC_RUNS}/{run_dir.name}"
    return {
        "id": provider,
        "label": PROVIDER_LABELS.get(provider, provider.title()),
        "model": model,
        "api": api,
        "consensusMeaning": consensus.get("primary_meaning", ""),
        "consensusConfidence": consensus.get("confidence", ""),
        "relationship": relationship.get("relation", "PENDING"),
        "citationSupport": relationship.get("citation_support", "PENDING"),
        "persuasion": persuasion.get("persuasion", "PENDING"),
        "supportScope": persuasion.get("support_scope", ""),
        "persuasionConfidence": persuasion.get("confidence", ""),
        "artifacts": artifact_paths(run_dir, run_url, anchor, provider),
    }


def build_index() -> dict[str, Any]:
    if SOURCE_OUTPUT.exists():
        shutil.rmtree(SOURCE_OUTPUT)
    SOURCE_OUTPUT.mkdir(parents=True)
    runs: list[dict[str, Any]] = []
    by_anchor: dict[str, list[tuple[str, str]]] = defaultdict(list)

    for run_dir in sorted(path for path in RUNS.iterdir() if path.is_dir()):
        manifest = load_json(run_dir / "manifest.json")
        summary = load_json(run_dir / "results" / "summary.json")
        glossary = load_json(run_dir / "inputs" / "glossary.json")
        if not manifest or not summary or not glossary:
            continue

        protocol = int(manifest.get("protocol_version") or 0)
        reportable = protocol >= 3
        providers_config = manifest.get("providers", {})
        glossary_entries = {entry["anchor"]: entry for entry in glossary.get("entries", [])}
        run_url = f"{PUBLIC_RUNS}/{run_dir.name}"
        chapter_dir = run_dir / "inputs" / "chapters"
        source_records = []
        for path in sorted(chapter_dir.glob("*")):
            if not path.is_file():
                continue
            raw = path.read_bytes()
            source_records.append({
                "name": path.name,
                "sha256": hashlib.sha256(raw).hexdigest(),
                "content": raw.decode("utf-8"),
            })
        source_paths = []
        if source_records:
            bundle_path = SOURCE_OUTPUT / f"{run_dir.name}.json"
            bundle_path.write_text(
                json.dumps({"runId": run_dir.name, "sources": source_records}, ensure_ascii=False, indent=2) + "\n",
                encoding="utf-8",
            )
            source_paths = [
                {
                    "label": source["name"],
                    "url": f"/data/meat-tester-sources/{run_dir.name}.json",
                    "sha256": source["sha256"],
                }
                for source in source_records
            ]

        entries: list[dict[str, Any]] = []
        for row in summary.get("rows", []):
            anchor = row.get("anchor", "")
            book_entry = glossary_entries.get(anchor, {})
            judges = [
                provider_judgment(
                    run_dir,
                    provider,
                    anchor,
                    cfg.get("model", ""),
                    cfg.get("api", ""),
                )
                for provider, cfg in providers_config.items()
            ]
            entry = {
                "anchor": anchor,
                "term": row.get("term") or book_entry.get("term") or anchor,
                "definition": book_entry.get("definition", ""),
                "commonView": book_entry.get("common_view", ""),
                "citations": book_entry.get("citations", ""),
                "sourceBadge": book_entry.get("source_badge", ""),
                "relation": row.get("relation", "PENDING"),
                "citationSupport": row.get("citation_support", "PENDING"),
                "persuasion": row.get("persuasion", "PENDING"),
                "finalVerdict": row.get("final_verdict", "PENDING"),
                "judges": judges,
            }
            entries.append(entry)
            if reportable:
                by_anchor[anchor].append((manifest.get("created_at", ""), run_dir.name))

        run_paths = {
            "manifest": f"{run_url}/manifest.json",
            "config": f"{run_url}/config.json",
            "glossary": f"{run_url}/inputs/glossary.json",
            "methodEvidence": f"{run_url}/inputs/method-evidence.md",
            "acceptedFindings": f"{run_url}/inputs/accepted-findings.json",
            "review": f"{run_url}/results/review.md" if (run_dir / "results" / "review.md").exists() else "",
            "summary": f"{run_url}/results/summary.json",
            "sources": source_paths,
            "promptTemplates": {
                stage: f"{run_url}/prompts/{number:02d}-{stage}.md"
                for number, stage in enumerate(STAGES, start=1)
                if (run_dir / "prompts" / f"{number:02d}-{stage}.md").exists()
            },
        }
        runs.append({
            "id": run_dir.name,
            "createdAt": manifest.get("created_at", ""),
            "protocolVersion": protocol,
            "reportable": reportable,
            "persuasionScope": manifest.get("persuasion_scope", "divergent"),
            "acceptedFindingSources": manifest.get("accepted_finding_sources", []),
            "providers": [
                {
                    "id": provider,
                    "label": PROVIDER_LABELS.get(provider, provider.title()),
                    "model": cfg.get("model", ""),
                }
                for provider, cfg in providers_config.items()
            ],
            "entries": entries,
            "paths": run_paths,
        })

    current_runs = {
        anchor: max(candidates, key=lambda item: (item[0], item[1]))[1]
        for anchor, candidates in by_anchor.items()
    }
    run_lookup = {run["id"]: run for run in runs}
    current_entries: list[dict[str, Any]] = []
    for anchor, run_id in current_runs.items():
        run = run_lookup[run_id]
        entry = next(entry for entry in run["entries"] if entry["anchor"] == anchor)
        current_entries.append({**entry, "runId": run_id, "protocolVersion": run["protocolVersion"]})
    current_entries.sort(key=lambda entry: entry["term"].lower())

    verdict_counts = Counter(entry["finalVerdict"] for entry in current_entries)
    provider_models = {
        (provider["id"], provider["model"])
        for run in runs
        if run["reportable"]
        for provider in run["providers"]
    }
    latest_at = max((run["createdAt"] for run in runs if run["createdAt"]), default="")
    return {
        "schemaVersion": 1,
        "generatedFromLatestRun": latest_at,
        "experimentBase": "/books/symbolic-language/experiments/glossary-consensus",
        "stats": {
            "currentConclusions": len(current_entries),
            "archivedRuns": len(runs),
            "reportableRuns": sum(1 for run in runs if run["reportable"]),
            "providerModels": len(provider_models),
            "verdicts": dict(sorted(verdict_counts.items())),
        },
        "currentRuns": current_runs,
        "currentEntries": current_entries,
        "runs": runs,
    }


def main() -> None:
    index = build_index()
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(json.dumps(index, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
    print(f"Wrote {OUTPUT} ({len(index['runs'])} runs, {len(index['currentEntries'])} current conclusions)")


if __name__ == "__main__":
    main()
