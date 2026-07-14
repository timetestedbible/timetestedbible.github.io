#!/usr/bin/env python3
"""Freeze cross-provider commitments on Masoretic vowel-point authority."""

from __future__ import annotations

import argparse
import datetime as dt
import importlib.util
import json
import os
import shutil
import sys
from pathlib import Path
from typing import Any


HERE = Path(__file__).resolve().parent
EXPERIMENT = HERE.parents[1]
BOOK = EXPERIMENT.parents[1]
ROOT = BOOK.parents[1]
MODULE_PATH = EXPERIMENT / "experiment.py"
DEFAULT_CONFIG = EXPERIMENT / "config.example.json"
CHAPTER = BOOK / "25-what-is-the-point.adoc"

SPEC = importlib.util.spec_from_file_location("glossary_experiment", MODULE_PATH)
exp = importlib.util.module_from_spec(SPEC)
assert SPEC and SPEC.loader
SPEC.loader.exec_module(exp)


def render(text: str, values: dict[str, str]) -> str:
    for key, value in values.items():
        text = text.replace("${" + key + "}", value)
    return text


def snapshot(run_dir: Path, cfg: dict[str, Any], providers: list[str]) -> None:
    if (run_dir / "manifest.json").exists():
        return
    for folder in ("prompts", "schemas"):
        shutil.copytree(HERE / folder, run_dir / folder, dirs_exist_ok=True)
    chapter_target = run_dir / "inputs" / CHAPTER.name
    chapter_target.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(CHAPTER, chapter_target)
    exp.dump_json(run_dir / "config.json", cfg)
    manifest = {
        "protocol": "vowel-points-foundation",
        "protocol_version": 1,
        "run_id": run_dir.name,
        "created_at": dt.datetime.now(dt.timezone.utc).isoformat(),
        "stages": ["blind", "adjudication"],
        "providers": {
            name: {
                "model": cfg["providers"][name]["model"],
                "api": cfg["providers"][name]["api"],
                "url": cfg["providers"][name]["url"],
            }
            for name in providers
        },
        "chapter": str(CHAPTER.relative_to(ROOT)),
        "chapter_sha256": exp.sha256_text(CHAPTER.read_text(encoding="utf-8")),
        "prompt_sha256": {
            path.name: exp.sha256_text(path.read_text(encoding="utf-8"))
            for path in sorted((run_dir / "prompts").glob("*.md"))
        },
        "schema_sha256": {
            path.name: exp.sha256_text(path.read_text(encoding="utf-8"))
            for path in sorted((run_dir / "schemas").glob("*.json"))
        },
        "notes": "The blind commitment is completed before that provider receives the chapter. API keys are never written.",
    }
    exp.dump_json(run_dir / "manifest.json", manifest)


def stage_inputs(run_dir: Path, provider: str, stage: str) -> tuple[str, dict[str, Any], str]:
    if stage == "blind":
        prompt = (run_dir / "prompts" / "01-blind.md").read_text(encoding="utf-8")
        schema = exp.load_json(run_dir / "schemas" / "01-blind.json")
        return prompt, schema, "vowel_points_blind"
    prior = exp.load_json(run_dir / "normalized" / "blind" / f"{provider}.json")
    chapter = exp.clean_adoc((run_dir / "inputs" / CHAPTER.name).read_text(encoding="utf-8"))
    template = (run_dir / "prompts" / "02-adjudication.md").read_text(encoding="utf-8")
    prompt = render(template, {
        "PRIOR_COMMITMENT": json.dumps(prior, indent=2, ensure_ascii=False),
        "CHAPTER": chapter,
    })
    schema = exp.load_json(run_dir / "schemas" / "02-adjudication.json")
    return prompt, schema, "vowel_points_adjudication"


def call(run_dir: Path, provider: str, provider_cfg: dict[str, Any], stage: str, plan: bool) -> str:
    normalized_path = run_dir / "normalized" / stage / f"{provider}.json"
    error_path = run_dir / "errors" / f"{provider}.json"
    if normalized_path.exists():
        error_path.unlink(missing_ok=True)
        return "existing"
    prompt, schema, request_stage = stage_inputs(run_dir, provider, stage)
    payload, headers = exp.build_request(provider, provider_cfg, request_stage, prompt, schema)
    request_record = {
        "provider": provider,
        "stage": stage,
        "request_stage": request_stage,
        "url": provider_cfg["url"],
        "headers": headers,
        "payload": payload,
    }
    request_record["cache_key"] = exp.call_cache_key({**request_record, "stage": request_stage})
    exp.dump_json(run_dir / "requests" / stage / f"{provider}.json", request_record)
    if plan:
        return "planned"
    cached = exp.find_cached_call(request_record["cache_key"], {**request_record, "stage": request_stage}, run_dir)
    if cached:
        raw, normalized, source = cached
        exp.validate_schema(normalized, schema)
        request_record["cache"] = {"hit": True, "source": source}
        exp.dump_json(run_dir / "requests" / stage / f"{provider}.json", request_record)
        exp.dump_json(run_dir / "responses" / stage / f"{provider}.json", raw)
        exp.dump_json(normalized_path, normalized)
        error_path.unlink(missing_ok=True)
        return "cache"
    key = os.environ.get(provider_cfg["env_key"], "").strip()
    if not key:
        raise RuntimeError(f"{provider}: set {provider_cfg['env_key']}")
    raw = exp.http_json(provider_cfg["url"], payload, headers, key, provider_cfg["api"])
    exp.dump_json(run_dir / "responses" / stage / f"{provider}.json", raw)
    normalized = exp.parse_json_text(exp.extract_response_text(provider_cfg["api"], raw))
    exp.validate_schema(normalized, schema)
    exp.dump_json(normalized_path, normalized)
    error_path.unlink(missing_ok=True)
    exp.store_call_cache(
        request_record["cache_key"],
        {**request_record, "stage": request_stage},
        raw,
        normalized,
        {"run_id": run_dir.name, "request": str((run_dir / "requests" / stage / f"{provider}.json").relative_to(EXPERIMENT))},
    )
    return "api"


def summarize(run_dir: Path, providers: list[str]) -> None:
    results: dict[str, Any] = {"run_id": run_dir.name, "providers": {}}
    premises: dict[str, Any] = {
        "source_run": run_dir.name,
        "manifest_sha256": exp.sha256_text((run_dir / "manifest.json").read_text(encoding="utf-8")),
        "providers": {},
    }
    rows = [
        "# Vowel-point foundation — frozen commitments",
        "",
        "| Provider | Blind authority | After chapter | Chapter | Change | Alternate vocalization | Pointing alone vetoes? |",
        "|---|---|---|---|---|---|---|",
    ]
    for provider in providers:
        blind = run_dir / "normalized" / "blind" / f"{provider}.json"
        final = run_dir / "normalized" / "adjudication" / f"{provider}.json"
        blind_value = exp.load_json(blind) if blind.exists() else None
        final_value = exp.load_json(final) if final.exists() else None
        results["providers"][provider] = {
            "blind": blind_value,
            "after_chapter": final_value,
        }
        if final_value:
            premises["providers"][provider] = {
                "model": exp.load_json(run_dir / "manifest.json")["providers"][provider]["model"],
                "vowel_points_original_to_written_text": final_value["vowel_points_original_to_written_text"],
                "vowel_points_authority": final_value["vowel_points_authority"],
                "cantillation_authority": final_value["cantillation_authority"],
                "alternate_vocalization_admissible": final_value["alternate_vocalization_admissible"],
                "received_pointing_alone_can_veto": final_value["received_pointing_alone_can_veto"],
                "burden_of_proof": final_value["burden_of_proof"],
                "required_support": final_value["required_support"],
                "core_rule": final_value["core_rule"],
                "confidence": final_value["confidence"],
            }
        rows.append(
            "| {provider} | {blind_authority} | {final_authority} | {assessment} | {change} | {alternate} | {veto} |".format(
                provider=provider,
                blind_authority=blind_value["vowel_points_authority"] if blind_value else "PENDING",
                final_authority=final_value["vowel_points_authority"] if final_value else "PENDING",
                assessment=final_value["chapter_assessment"] if final_value else "PENDING",
                change=final_value["commitment_change"] if final_value else "PENDING",
                alternate=final_value["alternate_vocalization_admissible"] if final_value else "PENDING",
                veto=final_value["received_pointing_alone_can_veto"] if final_value else "PENDING",
            )
        )
    exp.dump_json(run_dir / "results" / "commitments.json", results)
    exp.dump_json(run_dir / "results" / "frozen-premises.json", premises)
    (run_dir / "results" / "summary.md").write_text("\n".join(rows) + "\n", encoding="utf-8")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--run-id", default=dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%dT%H%M%SZ"))
    parser.add_argument("--config", default=str(DEFAULT_CONFIG))
    parser.add_argument("--providers", nargs="+", choices=["openai", "anthropic", "gemini", "xai"])
    parser.add_argument("--plan", action="store_true")
    args = parser.parse_args()

    cfg = exp.load_json(Path(args.config))
    providers = args.providers or list(cfg["providers"])
    run_dir = HERE / "runs" / args.run_id
    snapshot(run_dir, cfg, providers)
    failures: list[str] = []
    for provider in providers:
        try:
            source = call(run_dir, provider, cfg["providers"][provider], "blind", args.plan)
            print(f"blind — {provider}: {source}")
            if args.plan:
                continue
            source = call(run_dir, provider, cfg["providers"][provider], "adjudication", False)
            print(f"adjudication — {provider}: {source}")
        except Exception as error:  # noqa: BLE001
            failures.append(f"{provider}: {error}")
            exp.dump_json(run_dir / "errors" / f"{provider}.json", {"provider": provider, "error": str(error)})
            print(f"ERROR — {provider}: {error}", file=sys.stderr)
    summarize(run_dir, providers)
    print(f"Wrote {run_dir}")
    if failures:
        raise SystemExit("; ".join(failures))


if __name__ == "__main__":
    main()
