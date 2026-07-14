#!/usr/bin/env python3
"""Negotiate provider-neutral rules for comparing unpointed readings."""

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
MODULE_PATH = EXPERIMENT / "experiment.py"
DEFAULT_CONFIG = EXPERIMENT / "config.example.json"

SPEC = importlib.util.spec_from_file_location("glossary_experiment", MODULE_PATH)
exp = importlib.util.module_from_spec(SPEC)
assert SPEC and SPEC.loader
SPEC.loader.exec_module(exp)

STAGE_FILES = {
    "proposal": ("01-proposal.md", "01-proposal.json", "reading_rules_proposal"),
    "fairness": ("02-fairness.md", "02-fairness.json", "reading_rules_fairness"),
    "rationale": ("03-rationale.md", "03-rationale.json", "reading_rules_rationale"),
}


def render(text: str, values: dict[str, str]) -> str:
    for key, value in values.items():
        text = text.replace("${" + key + "}", value)
    return text


def stage_key(phase: str, round_name: str | None = None) -> str:
    return phase if phase == "proposal" else f"{phase}/{round_name}"


def snapshot_campaign(
    run_dir: Path,
    cfg: dict[str, Any],
    providers: list[str],
    premises_path: Path | None = None,
) -> None:
    manifest_path = run_dir / "manifest.json"
    if manifest_path.exists():
        manifest = exp.load_json(manifest_path)
        frozen = list(manifest["providers"])
        if providers != frozen:
            raise ValueError(f"Provider order is frozen as {frozen}; received {providers}")
        return

    for folder in ("prompts", "schemas"):
        shutil.copytree(HERE / folder, run_dir / folder, dirs_exist_ok=True)
    premises_hash = None
    if premises_path:
        premises = premises_path.read_text(encoding="utf-8")
        premises_target = run_dir / "inputs" / "canonical-premises.md"
        premises_hash = freeze_text(premises_target, premises)
    frozen_cfg = {**cfg, "providers": {name: cfg["providers"][name] for name in providers}}
    exp.dump_json(run_dir / "config.json", frozen_cfg)
    manifest = {
        "protocol": "unpointed-reading-rules-consensus",
        "protocol_version": 2 if premises_hash else 1,
        "run_id": run_dir.name,
        "created_at": dt.datetime.now(dt.timezone.utc).isoformat(),
        "stages": ["proposal", "fairness", "rationale"],
        "providers": {
            name: {
                "model": cfg["providers"][name]["model"],
                "api": cfg["providers"][name]["api"],
                "url": cfg["providers"][name]["url"],
            }
            for name in providers
        },
        "prompt_sha256": {
            path.name: exp.sha256_text(path.read_text(encoding="utf-8"))
            for path in sorted((run_dir / "prompts").glob("*.md"))
        },
        "schema_sha256": {
            path.name: exp.sha256_text(path.read_text(encoding="utf-8"))
            for path in sorted((run_dir / "schemas").glob("*.json"))
        },
        "canonical_premises_sha256": premises_hash,
        "consensus_gates": {
            "fairness": "Every provider: FAIR_AS_WRITTEN + YES + all checks PASS",
            "rationale": "Every provider: PERSUADED + YES + no required changes",
        },
        "notes": "No chapter or disputed reading is an input. Credential contents are never written.",
    }
    exp.dump_json(manifest_path, manifest)


def freeze_text(path: Path, text: str) -> str:
    if path.exists():
        frozen = path.read_text(encoding="utf-8")
        if frozen != text:
            raise ValueError(f"Refusing to change frozen input: {path}")
    else:
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(text, encoding="utf-8")
    return exp.sha256_text(text)


def snapshot_fairness_round(run_dir: Path, round_name: str, rules_path: Path) -> None:
    rules = rules_path.read_text(encoding="utf-8")
    target = run_dir / "inputs" / "fairness" / round_name / "rules.md"
    rules_hash = freeze_text(target, rules)
    meta = {
        "phase": "fairness",
        "round": round_name,
        "created_at": dt.datetime.now(dt.timezone.utc).isoformat(),
        "rules_sha256": rules_hash,
        "rationale_disclosed": False,
    }
    meta_path = target.parent / "meta.json"
    if meta_path.exists():
        prior = exp.load_json(meta_path)
        if prior["rules_sha256"] != rules_hash:
            raise ValueError(f"Rules hash changed for frozen round {round_name}")
    else:
        exp.dump_json(meta_path, meta)


def fairness_result_passes(value: dict[str, Any]) -> bool:
    return (
        value.get("verdict") == "FAIR_AS_WRITTEN"
        and value.get("agree_to_use_as_baseline") == "YES"
        and value.get("symmetry") == "PASS"
        and value.get("neutrality") == "PASS"
        and value.get("reproducibility") == "PASS"
        and not value.get("ambiguities")
        and not value.get("unfair_rules")
        and not value.get("missing_rules")
    )


def rationale_result_passes(value: dict[str, Any]) -> bool:
    return (
        value.get("persuasion") == "PERSUADED"
        and value.get("rules_are_best_objective_standard") == "YES"
        and value.get("source_weight_is_not_positive_evidence") == "AFFIRMED"
        and not value.get("unresolved_objections")
        and not value.get("required_rule_changes")
        and not value.get("required_argument_changes")
    )


def round_consensus(run_dir: Path, phase: str, round_name: str, providers: list[str]) -> bool:
    predicate = fairness_result_passes if phase == "fairness" else rationale_result_passes
    values = []
    for provider in providers:
        path = run_dir / "normalized" / phase / round_name / f"{provider}.json"
        if not path.exists():
            return False
        values.append(exp.load_json(path))
    return bool(values) and all(predicate(value) for value in values)


def snapshot_rationale_round(
    run_dir: Path,
    round_name: str,
    rules_path: Path,
    argument_path: Path,
    fairness_round: str,
    providers: list[str],
) -> None:
    if not round_consensus(run_dir, "fairness", fairness_round, providers):
        raise ValueError(f"Fairness round {fairness_round!r} has not passed unanimously")

    rules = rules_path.read_text(encoding="utf-8")
    argument = argument_path.read_text(encoding="utf-8")
    fairness_rules = run_dir / "inputs" / "fairness" / fairness_round / "rules.md"
    if not fairness_rules.exists():
        raise ValueError(f"Missing frozen rules for fairness round {fairness_round!r}")
    if fairness_rules.read_text(encoding="utf-8") != rules:
        raise ValueError("Rationale rules differ from the exact rules that passed blind fairness review")

    target_dir = run_dir / "inputs" / "rationale" / round_name
    rules_hash = freeze_text(target_dir / "rules.md", rules)
    argument_hash = freeze_text(target_dir / "argument.md", argument)
    meta = {
        "phase": "rationale",
        "round": round_name,
        "created_at": dt.datetime.now(dt.timezone.utc).isoformat(),
        "fairness_round": fairness_round,
        "rules_sha256": rules_hash,
        "argument_sha256": argument_hash,
    }
    meta_path = target_dir / "meta.json"
    if meta_path.exists():
        prior = exp.load_json(meta_path)
        comparable = {key: prior[key] for key in ("fairness_round", "rules_sha256", "argument_sha256")}
        expected = {key: meta[key] for key in comparable}
        if comparable != expected:
            raise ValueError(f"Inputs changed for frozen rationale round {round_name}")
    else:
        exp.dump_json(meta_path, meta)


def validate_semantics(phase: str, value: dict[str, Any]) -> None:
    if phase == "fairness":
        if value["verdict"] == "FAIR_AS_WRITTEN" and not fairness_result_passes(value):
            raise ValueError("FAIR_AS_WRITTEN requires YES, all checks PASS, and no listed defects")
        if value["agree_to_use_as_baseline"] == "YES" and value["verdict"] != "FAIR_AS_WRITTEN":
            raise ValueError("Baseline agreement requires FAIR_AS_WRITTEN")
    if phase == "rationale":
        if value["rules_are_best_objective_standard"] == "YES" and value["persuasion"] != "PERSUADED":
            raise ValueError("Best-objective-standard YES requires PERSUADED")
        if value["persuasion"] == "PERSUADED" and not rationale_result_passes(value):
            raise ValueError("PERSUADED requires YES, the safeguard affirmed, and no required changes")


def stage_inputs(
    run_dir: Path,
    provider: str,
    phase: str,
    round_name: str | None,
    fairness_round: str | None,
) -> tuple[str, dict[str, Any], str]:
    prompt_file, schema_file, request_stage = STAGE_FILES[phase]
    template = (run_dir / "prompts" / prompt_file).read_text(encoding="utf-8")
    schema = exp.load_json(run_dir / "schemas" / schema_file)
    premises_path = run_dir / "inputs" / "canonical-premises.md"
    premises = premises_path.read_text(encoding="utf-8") if premises_path.exists() else "No additional premises were supplied."
    template = render(template, {"CANONICAL_PREMISES": premises})
    if phase == "proposal":
        return template, schema, request_stage

    own = exp.load_json(run_dir / "normalized" / "proposal" / f"{provider}.json")
    if phase == "fairness":
        rules = (run_dir / "inputs" / "fairness" / str(round_name) / "rules.md").read_text(encoding="utf-8")
        prompt = render(template, {
            "OWN_PROPOSAL": json.dumps(own, indent=2, ensure_ascii=False),
            "RULES_ROUND": str(round_name),
            "PROPOSED_RULES": rules,
        })
        return prompt, schema, request_stage

    assert fairness_round
    target = run_dir / "inputs" / "rationale" / str(round_name)
    rules = (target / "rules.md").read_text(encoding="utf-8")
    argument = (target / "argument.md").read_text(encoding="utf-8")
    review = exp.load_json(run_dir / "normalized" / "fairness" / fairness_round / f"{provider}.json")
    prompt = render(template, {
        "FAIRNESS_ROUND": fairness_round,
        "APPROVED_RULES": rules,
        "FAIRNESS_REVIEW": json.dumps(review, indent=2, ensure_ascii=False),
        "RATIONALE_ROUND": str(round_name),
        "RULES_ARGUMENT": argument,
    })
    return prompt, schema, request_stage


def call(
    run_dir: Path,
    provider: str,
    provider_cfg: dict[str, Any],
    phase: str,
    round_name: str | None,
    fairness_round: str | None,
    plan: bool,
) -> str:
    key = stage_key(phase, round_name)
    normalized_path = run_dir / "normalized" / key / f"{provider}.json"
    error_path = run_dir / "errors" / key / f"{provider}.json"
    if normalized_path.exists():
        error_path.unlink(missing_ok=True)
        return "existing"

    prompt, schema, request_stage = stage_inputs(run_dir, provider, phase, round_name, fairness_round)
    payload, headers = exp.build_request(provider, provider_cfg, request_stage, prompt, schema)
    request_record = {
        "provider": provider,
        "stage": request_stage,
        "phase": phase,
        "round": round_name,
        "request_stage": request_stage,
        "url": provider_cfg["url"],
        "headers": headers,
        "payload": payload,
    }
    request_record["cache_key"] = exp.call_cache_key(request_record)
    request_path = run_dir / "requests" / key / f"{provider}.json"
    exp.dump_json(request_path, request_record)
    if plan:
        error_path.unlink(missing_ok=True)
        return "planned"

    cached = exp.find_cached_call(request_record["cache_key"], request_record, run_dir)
    if cached:
        raw, normalized, source = cached
        exp.validate_schema(normalized, schema)
        validate_semantics(phase, normalized)
        request_record["cache"] = {"hit": True, "source": source}
        exp.dump_json(request_path, request_record)
        exp.dump_json(run_dir / "responses" / key / f"{provider}.json", raw)
        exp.dump_json(normalized_path, normalized)
        error_path.unlink(missing_ok=True)
        return "cache"

    api_key = os.environ.get(provider_cfg["env_key"], "").strip()
    if not api_key:
        raise RuntimeError(f"{provider}: set {provider_cfg['env_key']} or supply --key-file")
    raw = exp.http_json(provider_cfg["url"], payload, headers, api_key, provider_cfg["api"])
    exp.dump_json(run_dir / "responses" / key / f"{provider}.json", raw)
    normalized = exp.parse_json_text(exp.extract_response_text(provider_cfg["api"], raw))
    exp.validate_schema(normalized, schema)
    validate_semantics(phase, normalized)
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


def summarize(run_dir: Path, phase: str, round_name: str | None, providers: list[str]) -> None:
    key = stage_key(phase, round_name)
    rows = [f"# {key} — provider results", ""]
    if phase == "proposal":
        rows += [
            "| Provider | Pointing role | Rules | Confidence |",
            "|---|---|---:|---|",
        ]
    elif phase == "fairness":
        rows += [
            "| Provider | Verdict | Baseline | Symmetry | Neutrality | Reproducibility |",
            "|---|---|---|---|---|---|",
        ]
    else:
        rows += [
            "| Provider | Persuasion | Best standard | Rule changes | Argument changes |",
            "|---|---|---|---:|---:|",
        ]

    complete = True
    for provider in providers:
        path = run_dir / "normalized" / key / f"{provider}.json"
        if not path.exists():
            complete = False
            rows.append(f"| {provider} | PENDING | | |" if phase == "proposal" else f"| {provider} | PENDING | | | | |")
            continue
        value = exp.load_json(path)
        if phase == "proposal":
            rows.append(f"| {provider} | {value['received_pointing_role']} | {len(value['comparison_rules'])} | {value['confidence']} |")
        elif phase == "fairness":
            rows.append(
                f"| {provider} | {value['verdict']} | {value['agree_to_use_as_baseline']} | "
                f"{value['symmetry']} | {value['neutrality']} | {value['reproducibility']} |"
            )
        else:
            rows.append(
                f"| {provider} | {value['persuasion']} | {value['rules_are_best_objective_standard']} | "
                f"{len(value['required_rule_changes'])} | {len(value['required_argument_changes'])} |"
            )

    consensus = False
    if complete and phase in {"fairness", "rationale"}:
        assert round_name
        consensus = round_consensus(run_dir, phase, round_name, providers)
    rows += ["", f"Complete: **{'YES' if complete else 'NO'}**"]
    if phase in {"fairness", "rationale"}:
        rows.append(f"Unanimous gate passed: **{'YES' if consensus else 'NO'}**")

    summary_path = run_dir / "results" / key / "summary.md"
    summary_path.parent.mkdir(parents=True, exist_ok=True)
    summary_path.write_text("\n".join(rows) + "\n", encoding="utf-8")
    exp.dump_json(run_dir / "results" / key / "status.json", {
        "phase": phase,
        "round": round_name,
        "complete": complete,
        "unanimous_gate_passed": consensus if phase in {"fairness", "rationale"} else None,
    })

    if phase == "rationale" and consensus:
        assert round_name
        meta = exp.load_json(run_dir / "inputs" / "rationale" / round_name / "meta.json")
        rules = (run_dir / "inputs" / "rationale" / round_name / "rules.md").read_text(encoding="utf-8")
        commitments = {
            provider: exp.load_json(run_dir / "normalized" / "rationale" / round_name / f"{provider}.json")
            for provider in providers
        }
        exp.dump_json(run_dir / "results" / "baseline.json", {
            "protocol": "unpointed-reading-rules-consensus",
            "source_run": run_dir.name,
            "rationale_round": round_name,
            "fairness_round": meta["fairness_round"],
            "rules_sha256": meta["rules_sha256"],
            "rules": rules,
            "provider_commitments": commitments,
        })


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--run-id", default=dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%dT%H%M%SZ"))
    parser.add_argument("--phase", required=True, choices=["proposal", "fairness", "rationale"])
    parser.add_argument("--round")
    parser.add_argument("--rules")
    parser.add_argument("--argument")
    parser.add_argument("--fairness-round")
    parser.add_argument("--config", default=str(DEFAULT_CONFIG))
    parser.add_argument("--premises")
    parser.add_argument("--providers", nargs="+", choices=["openai", "anthropic", "gemini", "xai"])
    parser.add_argument("--key-file", action="append", default=[])
    parser.add_argument("--plan", action="store_true")
    args = parser.parse_args()

    if args.phase != "proposal" and (not args.round or not args.rules):
        parser.error("fairness and rationale phases require --round and --rules")
    if args.phase == "rationale" and (not args.argument or not args.fairness_round):
        parser.error("rationale phase requires --argument and --fairness-round")

    run_dir = HERE / "runs" / args.run_id
    if (run_dir / "config.json").exists():
        cfg = exp.load_json(run_dir / "config.json")
        frozen_providers = list(exp.load_json(run_dir / "manifest.json")["providers"])
        providers = args.providers or frozen_providers
    else:
        cfg = exp.load_json(Path(args.config))
        providers = args.providers or list(cfg["providers"])
    premises_path = Path(args.premises) if args.premises else None
    if not (run_dir / "manifest.json").exists() and not premises_path:
        parser.error("a new campaign requires --premises")
    snapshot_campaign(run_dir, cfg, providers, premises_path)
    cfg = exp.load_json(run_dir / "config.json")
    load_key_files(args.key_file, cfg)

    if args.phase == "fairness":
        snapshot_fairness_round(run_dir, args.round, Path(args.rules))
    elif args.phase == "rationale":
        snapshot_rationale_round(
            run_dir,
            args.round,
            Path(args.rules),
            Path(args.argument),
            args.fairness_round,
            providers,
        )

    failures: list[str] = []
    for provider in providers:
        try:
            source = call(
                run_dir,
                provider,
                cfg["providers"][provider],
                args.phase,
                args.round,
                args.fairness_round,
                args.plan,
            )
            print(f"{stage_key(args.phase, args.round)} — {provider}: {source}")
        except Exception as error:  # noqa: BLE001
            failures.append(f"{provider}: {error}")
            exp.dump_json(
                run_dir / "errors" / stage_key(args.phase, args.round) / f"{provider}.json",
                {"provider": provider, "phase": args.phase, "round": args.round, "error": str(error)},
            )
            print(f"ERROR — {provider}: {error}", file=sys.stderr)

    summarize(run_dir, args.phase, args.round, providers)
    print(f"Wrote {run_dir}")
    if failures:
        raise SystemExit("; ".join(failures))


if __name__ == "__main__":
    main()
