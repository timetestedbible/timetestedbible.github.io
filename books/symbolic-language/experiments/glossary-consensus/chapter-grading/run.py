#!/usr/bin/env python3
"""Run a reproducible cross-provider chapter grade under a frozen rubric."""

from __future__ import annotations

import argparse
import concurrent.futures
import datetime as dt
import importlib.util
import json
import os
import shutil
from collections import Counter
from pathlib import Path
from typing import Any


HERE = Path(__file__).resolve().parent
EXPERIMENT = HERE.parent
MODULE_PATH = EXPERIMENT / "experiment.py"
DEFAULT_CONFIG = EXPERIMENT / "config.example.json"
STAGE = "chapter_argument_grade"
SYSTEM = (
    "Return only the requested structured result. Apply the frozen rubric "
    "symmetrically, separate claim categories, and request only outcome-changing evidence."
)

SPEC = importlib.util.spec_from_file_location("glossary_experiment", MODULE_PATH)
exp = importlib.util.module_from_spec(SPEC)
assert SPEC and SPEC.loader
SPEC.loader.exec_module(exp)
exp.SYSTEMS[STAGE] = SYSTEM


def render(template: str, values: dict[str, str]) -> str:
    for key, value in values.items():
        template = template.replace("${" + key + "}", value)
    return template


def freeze_text(path: Path, value: str) -> str:
    if path.exists():
        if path.read_text(encoding="utf-8") != value:
            raise ValueError(f"Refusing to change frozen input: {path}")
    else:
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(value, encoding="utf-8")
    return exp.sha256_text(value)


def load_key_files(specs: list[str], cfg: dict[str, Any]) -> None:
    for spec in specs:
        if "=" not in spec:
            raise ValueError("--key-file must be provider=/absolute/path")
        provider, raw_path = spec.split("=", 1)
        if provider not in cfg["providers"]:
            raise ValueError(f"Unknown key-file provider: {provider}")
        secret = Path(raw_path).expanduser().read_text(encoding="utf-8").strip()
        if not secret:
            raise ValueError(f"Empty credential file for {provider}")
        os.environ[cfg["providers"][provider]["env_key"]] = secret


def snapshot(
    run_dir: Path,
    cfg: dict[str, Any],
    providers: list[str],
    chapter: Path,
    rules: Path,
    premises: Path,
    backgrounds: list[Path],
) -> None:
    chapter_text = chapter.read_text(encoding="utf-8")
    rules_text = rules.read_text(encoding="utf-8")
    premises_text = premises.read_text(encoding="utf-8")
    background_texts = [(path.name, path.read_text(encoding="utf-8")) for path in backgrounds]

    hashes = {
        "chapter": freeze_text(run_dir / "inputs" / "chapter" / chapter.name, chapter_text),
        "rules": freeze_text(run_dir / "inputs" / "rules.md", rules_text),
        "premises": freeze_text(run_dir / "inputs" / "premises.md", premises_text),
        "background": {
            name: freeze_text(run_dir / "inputs" / "background" / name, text)
            for name, text in background_texts
        },
    }
    freeze_text(run_dir / "prompts" / "grade.md", (HERE / "prompt.md").read_text(encoding="utf-8"))
    schema_text = (HERE / "schema.json").read_text(encoding="utf-8")
    freeze_text(run_dir / "schemas" / "grade.json", schema_text)
    frozen_cfg = {**cfg, "providers": {name: cfg["providers"][name] for name in providers}}
    exp.dump_json(run_dir / "config.json", frozen_cfg)

    manifest = {
        "protocol": "chapter-argument-grade",
        "protocol_version": 1,
        "run_id": run_dir.name,
        "created_at": dt.datetime.now(dt.timezone.utc).isoformat(),
        "providers": {
            name: {
                "model": cfg["providers"][name]["model"],
                "api": cfg["providers"][name]["api"],
                "url": cfg["providers"][name]["url"],
            }
            for name in providers
        },
        "input_sha256": hashes,
        "prompt_sha256": exp.sha256_text((HERE / "prompt.md").read_text(encoding="utf-8")),
        "schema_sha256": exp.sha256_text(schema_text),
        "notes": (
            "The chapter is the sole grading target. Background files are frozen evidence dependencies. "
            "Provider agreement is not evidence. Credential contents are never written."
        ),
    }
    manifest_path = run_dir / "manifest.json"
    if manifest_path.exists():
        prior = exp.load_json(manifest_path)
        for key in ("providers", "input_sha256", "prompt_sha256", "schema_sha256"):
            if prior[key] != manifest[key]:
                raise ValueError(f"Frozen run mismatch in {key}: {run_dir}")
    else:
        exp.dump_json(manifest_path, manifest)


def prompt_and_schema(run_dir: Path) -> tuple[str, dict[str, Any]]:
    template = (run_dir / "prompts" / "grade.md").read_text(encoding="utf-8")
    chapter_files = sorted((run_dir / "inputs" / "chapter").glob("*"))
    if len(chapter_files) != 1:
        raise ValueError("A run must contain exactly one target chapter")
    backgrounds = []
    for path in sorted((run_dir / "inputs" / "background").glob("*")):
        backgrounds.append(f"### {path.name}\n\n{path.read_text(encoding='utf-8')}")
    prompt = render(template, {
        "PREMISES": (run_dir / "inputs" / "premises.md").read_text(encoding="utf-8"),
        "RULES": (run_dir / "inputs" / "rules.md").read_text(encoding="utf-8"),
        "BACKGROUND": "\n\n".join(backgrounds) if backgrounds else "No background packet supplied.",
        "CHAPTER": chapter_files[0].read_text(encoding="utf-8"),
    })
    return prompt, exp.load_json(run_dir / "schemas" / "grade.json")


def call_provider(run_dir: Path, provider: str, provider_cfg: dict[str, Any]) -> str:
    normalized_path = run_dir / "normalized" / f"{provider}.json"
    error_path = run_dir / "errors" / f"{provider}.json"
    if normalized_path.exists():
        error_path.unlink(missing_ok=True)
        return "existing"

    prompt, schema = prompt_and_schema(run_dir)
    payload, headers = exp.build_request(provider, provider_cfg, STAGE, prompt, schema)
    request_record = {
        "provider": provider,
        "stage": STAGE,
        "url": provider_cfg["url"],
        "headers": headers,
        "payload": payload,
    }
    request_record["cache_key"] = exp.call_cache_key(request_record)
    request_path = run_dir / "requests" / f"{provider}.json"
    exp.dump_json(request_path, request_record)

    cached = exp.find_cached_call(request_record["cache_key"], request_record, run_dir)
    if cached:
        raw, normalized, source = cached
        exp.validate_schema(normalized, schema)
        request_record["cache"] = {"hit": True, "source": source}
        exp.dump_json(request_path, request_record)
        exp.dump_json(run_dir / "responses" / f"{provider}.json", raw)
        exp.dump_json(normalized_path, normalized)
        error_path.unlink(missing_ok=True)
        return "cache"

    api_key = os.environ.get(provider_cfg["env_key"], "").strip()
    if not api_key:
        raise RuntimeError(f"{provider}: set {provider_cfg['env_key']} or supply --key-file")
    raw = exp.http_json(provider_cfg["url"], payload, headers, api_key, provider_cfg["api"])
    exp.dump_json(run_dir / "responses" / f"{provider}.json", raw)
    normalized = exp.parse_json_text(exp.extract_response_text(provider_cfg["api"], raw))
    exp.validate_schema(normalized, schema)
    exp.dump_json(normalized_path, normalized)
    error_path.unlink(missing_ok=True)
    exp.store_call_cache(
        request_record["cache_key"],
        request_record,
        raw,
        normalized,
        {"run_id": run_dir.name, "request": str(request_path.relative_to(EXPERIMENT))},
    )
    return "api"


def summarize(run_dir: Path, providers: list[str], cfg: dict[str, Any]) -> None:
    verdicts: dict[str, str] = {}
    rows = [
        "# Chapter argument grade",
        "",
        "| Provider | Model | Verdict | Confidence | Material gaps |",
        "|---|---|---|---|---:|",
    ]
    complete = True
    for provider in providers:
        path = run_dir / "normalized" / f"{provider}.json"
        if not path.exists():
            complete = False
            rows.append(f"| {provider} | {cfg['providers'][provider]['model']} | PENDING | | |")
            continue
        value = exp.load_json(path)
        verdicts[provider] = value["overall_verdict"]
        rows.append(
            f"| {provider} | {cfg['providers'][provider]['model']} | {value['overall_verdict']} | "
            f"{value['confidence']} | {len(value['material_gaps'])} |"
        )
    counts = Counter(verdicts.values())
    rows += [
        "",
        f"Complete: **{'YES' if complete else 'NO'}**",
        "",
        "Provider agreement is descriptive only and is not evidence for the chapter.",
    ]
    result = {
        "complete": complete,
        "providers": providers,
        "verdicts": verdicts,
        "counts": dict(sorted(counts.items())),
    }
    exp.dump_json(run_dir / "results" / "summary.json", result)
    (run_dir / "results").mkdir(parents=True, exist_ok=True)
    (run_dir / "results" / "summary.md").write_text("\n".join(rows) + "\n", encoding="utf-8")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--run-id", required=True)
    parser.add_argument("--chapter", type=Path, required=True)
    parser.add_argument("--rules", type=Path, required=True)
    parser.add_argument("--premises", type=Path, required=True)
    parser.add_argument("--background", type=Path, action="append", default=[])
    parser.add_argument("--config", type=Path, default=DEFAULT_CONFIG)
    parser.add_argument("--providers", nargs="+", default=None)
    parser.add_argument("--key-file", action="append", default=[])
    args = parser.parse_args()

    cfg = exp.load_json(args.config)
    providers = args.providers or list(cfg["providers"])
    unknown = [provider for provider in providers if provider not in cfg["providers"]]
    if unknown:
        raise ValueError(f"Unknown providers: {unknown}")
    load_key_files(args.key_file, cfg)
    run_dir = HERE / "runs" / args.run_id
    snapshot(run_dir, cfg, providers, args.chapter, args.rules, args.premises, args.background)

    statuses: dict[str, str] = {}
    with concurrent.futures.ThreadPoolExecutor(max_workers=len(providers)) as pool:
        future_map = {
            pool.submit(call_provider, run_dir, provider, cfg["providers"][provider]): provider
            for provider in providers
        }
        for future in concurrent.futures.as_completed(future_map):
            provider = future_map[future]
            try:
                statuses[provider] = future.result()
            except Exception as error:  # noqa: BLE001
                statuses[provider] = "error"
                exp.dump_json(run_dir / "errors" / f"{provider}.json", {
                    "provider": provider,
                    "error": str(error),
                })
    summarize(run_dir, providers, cfg)
    print(json.dumps(statuses, indent=2, sort_keys=True))


if __name__ == "__main__":
    main()
