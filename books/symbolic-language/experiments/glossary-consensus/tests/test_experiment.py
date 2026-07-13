from __future__ import annotations

import importlib.util
import tempfile
import unittest
from pathlib import Path


MODULE_PATH = Path(__file__).resolve().parents[1] / "experiment.py"
SPEC = importlib.util.spec_from_file_location("glossary_experiment", MODULE_PATH)
exp = importlib.util.module_from_spec(SPEC)
assert SPEC and SPEC.loader
SPEC.loader.exec_module(exp)


class ExperimentTests(unittest.TestCase):
    def test_glossary_has_147_symbols_and_12_recovered_words(self):
        symbols = exp.parse_glossary(include_words=False)
        all_entries = exp.parse_glossary(include_words=True)
        self.assertEqual(147, len(symbols))
        self.assertEqual(159, len(all_entries))
        self.assertEqual(12, sum(entry["source_badge"] == "WORD" for entry in all_entries))

    def test_blind_input_does_not_expose_book_definition(self):
        entry = exp.parse_glossary(include_words=False)[0]
        prompt = exp.render_template("consensus", {"TERM": entry["term"]})
        self.assertIn(entry["term"], prompt)
        self.assertNotIn(entry["definition"], prompt)

    def test_method_evidence_is_limited_to_persuasion(self):
        entry = exp.parse_glossary(include_words=False)[0]
        method = exp.build_method_evidence()
        values = {
            "TERM": entry["term"],
            "BOOK_ENTRY": entry["definition"],
            "COMMON_VIEW": "common",
            "CITATIONS": "citations",
            "SCRIPTURE_EXCERPTS": "scripture",
            "CONSENSUS_RESPONSES": "consensus",
            "METHOD_EVIDENCE": method,
            "ACCEPTED_FINDINGS": "No prior findings were supplied.",
            "EVIDENCE_BUNDLE": "chapter",
        }
        blind = exp.render_template("consensus", values)
        persuasion = exp.render_template("persuasion", values)
        blind_flat = " ".join(blind.split())
        persuasion_flat = " ".join(persuasion.split())
        self.assertNotIn("One verse makes a candidate, not a key", blind_flat)
        self.assertIn("One verse makes a candidate, not a key", persuasion_flat)
        self.assertIn("dark sayings of old", persuasion_flat)
        self.assertIn("Four for four", persuasion)
        self.assertIn("specific counter-interpretation", persuasion_flat)
        self.assertIn("best-supported explanation", persuasion_flat)
        self.assertNotIn("definition-free", persuasion_flat)
        self.assertNotIn("How this evidence should affect a review", persuasion_flat)

    def test_snapshot_hashes_common_method_evidence(self):
        entry = exp.parse_glossary(include_words=False)[0]
        cfg = exp.load_json(exp.DEFAULT_CONFIG)
        with tempfile.TemporaryDirectory() as directory:
            run = Path(directory)
            exp.snapshot_run(run, [entry], cfg, ["openai"])
            snapshot = run / "inputs" / "method-evidence.md"
            manifest = exp.load_json(run / "manifest.json")
            self.assertEqual(exp.build_method_evidence(), snapshot.read_text(encoding="utf-8"))
            self.assertEqual(exp.sha256_text(snapshot.read_text(encoding="utf-8")), manifest["method_evidence_sha256"])
            self.assertEqual(13, manifest["protocol_version"])

    def test_calendar_application_is_ablated_from_judging_excerpt(self):
        source = "Before\n// experiment-ablation-start: calendar-application\nCalendar claim\n// experiment-ablation-end: calendar-application\nAfter"
        cleaned = exp.clean_adoc(source)
        self.assertEqual("Before\n\nAfter", cleaned)
        self.assertNotIn("Calendar claim", cleaned)

    def test_persuasion_requires_consistent_comparative_winner(self):
        persuaded = {
            "persuasion": "PERSUADED", "support_scope": "CORE_ONLY",
            "comparative_winner": "BOOK", "counter_relation_to_book_core": "SAME_CORE_BROADER",
            "evidence_book_core_cannot_explain": [],
            "unsupported_glossary_assertions": ["A disputed assertion printed in the entry"],
        }
        unpersuaded = {
            "persuasion": "UNPERSUADED", "support_scope": "NONE",
            "comparative_winner": "COUNTER", "counter_relation_to_book_core": "CONTRADICTS",
            "evidence_book_core_cannot_explain": ["A material counter-text"],
            "unsupported_glossary_assertions": ["The core identification"],
        }
        exp.validate_persuasion_decision(persuaded)
        exp.validate_persuasion_decision(unpersuaded)
        with self.assertRaises(ValueError):
            exp.validate_persuasion_decision({**unpersuaded, "counter_relation_to_book_core": "SAME_CORE_BROADER"})
        with self.assertRaises(ValueError):
            exp.validate_persuasion_decision({**unpersuaded, "evidence_book_core_cannot_explain": []})
        with self.assertRaises(ValueError):
            exp.validate_persuasion_decision({**persuaded, "support_scope": "FULL"})
        with self.assertRaises(ValueError):
            exp.validate_persuasion_decision({**persuaded, "unsupported_glossary_assertions": []})

    def test_persuasion_judges_glossary_not_chapter(self):
        prompt = exp.render_template("persuasion", {
            "TERM": "Ship",
            "BOOK_ENTRY": "A ship is a governed political body.",
            "CITATIONS": "Ezekiel 27",
            "SCRIPTURE_EXCERPTS": "Tyre is constructed as a ship.",
            "CONSENSUS_RESPONSES": "The Church.",
            "METHOD_EVIDENCE": "Method evidence.",
            "ACCEPTED_FINDINGS": "No prior findings were supplied.",
            "EVIDENCE_BUNDLE": "A chapter with broader applications.",
        })
        prompt_flat = " ".join(prompt.split())
        self.assertIn("only proposition under judgment is the exact BOOK ENTRY", prompt_flat)
        self.assertIn("Chapter-only objections do not prevent `FULL`", prompt_flat)
        self.assertIn("future chapter-level experiment", prompt_flat)

    def test_relationship_label_matches_semantic_core_relation(self):
        exp.validate_relationship_decision({"relation": "MATCH", "core_relation": "EQUIVALENT", "extension_relation": "SAME_CASES"})
        exp.validate_relationship_decision({"relation": "REFINED", "core_relation": "EQUIVALENT", "extension_relation": "PARTIAL_RECLASSIFICATION"})
        exp.validate_relationship_decision({"relation": "REFINED", "core_relation": "COMPATIBLE_OVERLAP", "extension_relation": "SAME_CASES"})
        exp.validate_relationship_decision({"relation": "REFINED", "core_relation": "BOOK_NARROWS", "extension_relation": "BOOK_SUBSET"})
        exp.validate_relationship_decision({"relation": "DIVERGENT", "core_relation": "CONTRADICTS", "extension_relation": "DIFFERENT_REFERENT"})
        exp.validate_relationship_decision({"relation": "DIVERGENT", "core_relation": "CONTRADICTS", "extension_relation": "PARTIAL_RECLASSIFICATION"})
        exp.validate_relationship_decision({"relation": "NOVEL", "core_relation": "NO_CONSENSUS", "extension_relation": "NO_BASELINE"})
        exp.validate_relationship_decision({"relation": "NOVEL", "core_relation": "COMPATIBLE_OVERLAP", "extension_relation": "DIFFERENT_REFERENT"})
        with self.assertRaises(ValueError):
            exp.validate_relationship_decision({"relation": "REFINED", "core_relation": "CONTRADICTS", "extension_relation": "BOOK_SUBSET"})
        with self.assertRaises(ValueError):
            exp.validate_relationship_decision({"relation": "REFINED", "core_relation": "BOOK_NARROWS", "extension_relation": "DIFFERENT_REFERENT"})

    def test_accepted_findings_are_provider_specific(self):
        with tempfile.TemporaryDirectory() as directory:
            runs = Path(directory)
            run = runs / "foundation"
            exp.dump_json(run / "manifest.json", {"providers": {"a": {}, "b": {}, "c": {}}})
            exp.dump_json(run / "inputs" / "glossary.json", {"entries": [
                {"anchor": "faith", "term": "Faith", "definition": "Faithfulness"},
                {"anchor": "love", "term": "Love", "definition": "Keeping commandments"},
            ]})
            for provider in ("a", "b", "c"):
                exp.dump_json(run / "normalized" / "persuasion" / "faith" / f"{provider}.json", {
                    "persuasion": "PERSUADED", "support_scope": "FULL",
                    "book_core_identification": "Faith is faithful obedience.",
                })
                exp.dump_json(run / "normalized" / "persuasion" / "love" / f"{provider}.json", {
                    "persuasion": "UNPERSUADED" if provider == "c" else "PERSUADED",
                    "support_scope": "NONE" if provider == "c" else "FULL",
                    "book_core_identification": "Love is commandment keeping.",
                })
            accepted = exp.build_accepted_findings(["foundation"], runs)
            self.assertEqual(["faith", "love"], [item["anchor"] for item in accepted["findings"]])
            love = next(item for item in accepted["findings"] if item["anchor"] == "love")
            self.assertEqual({"a", "b"}, set(love["accepted_by_provider"]))
            self.assertIn("Love", exp.accepted_findings_markdown(accepted, "a"))
            self.assertNotIn("Love", exp.accepted_findings_markdown(accepted, "c"))

    def test_call_cache_key_changes_only_with_effective_request(self):
        request = {"provider": "openai", "stage": "consensus", "url": "https://example.test", "payload": {"model": "m", "input": "Oil"}}
        same = {**request, "headers": {"authorization": "<REDACTED>"}, "cache": {"hit": False}}
        changed = {**request, "payload": {"model": "m", "input": "Faith"}}
        self.assertEqual(exp.call_cache_key(request), exp.call_cache_key(same))
        self.assertNotEqual(exp.call_cache_key(request), exp.call_cache_key(changed))

    def test_majority_requires_more_than_half(self):
        self.assertEqual("DIVERGENT", exp.majority(["DIVERGENT", "DIVERGENT", "REFINED"]))
        self.assertEqual("DISPUTED", exp.majority(["MATCH", "REFINED", "NOVEL"]))
        self.assertEqual("PERSUADED", exp.majority(["PERSUADED", "PERSUADED", "PERSUADED", "UNPERSUADED"]))
        self.assertEqual("DISPUTED", exp.majority(["PERSUADED", "PERSUADED", "UNPERSUADED", "UNPERSUADED"]))
        self.assertEqual("PENDING", exp.majority([]))

    def test_secret_is_redacted_from_saved_request(self):
        cfg = exp.load_json(exp.DEFAULT_CONFIG)["providers"]["openai"]
        payload, headers = exp.build_request("openai", cfg, "consensus", "term", exp.schema_for("consensus"))
        self.assertIn("<REDACTED>", headers["authorization"])
        self.assertNotIn("api_key", str(payload).lower())

    def test_gemini_request_uses_redacted_header_and_structured_output(self):
        cfg = exp.load_json(exp.DEFAULT_CONFIG)["providers"]["gemini"]
        schema = exp.schema_for("consensus")
        payload, headers = exp.build_request("gemini", cfg, "consensus", "term", schema)
        self.assertEqual("<REDACTED>", headers["x-goog-api-key"])
        self.assertEqual("application/json", payload["generationConfig"]["responseMimeType"])
        self.assertEqual(schema, payload["generationConfig"]["responseJsonSchema"])
        self.assertNotIn("<REDACTED>", str(payload))

    def test_gemini_response_text_extraction_ignores_thought_parts(self):
        response = {"candidates": [{"content": {"parts": [
            {"thought": True, "text": "hidden reasoning"},
            {"text": "{\"primary_meaning\":\"visible\"}"},
        ]}}]}
        self.assertEqual('{"primary_meaning":"visible"}', exp.extract_response_text("gemini_generate_content", response))

    def test_summary_splits_divergent_by_persuasion(self):
        entries = [
            {"anchor": "one", "term": "One"},
            {"anchor": "two", "term": "Two"},
        ]
        with tempfile.TemporaryDirectory() as directory:
            run = Path(directory)
            for anchor, persuasion in (("one", "PERSUADED"), ("two", "UNPERSUADED")):
                for provider in ("a", "b", "c"):
                    exp.dump_json(run / "normalized" / "relationship" / anchor / f"{provider}.json", {
                        "relation": "DIVERGENT", "citation_support": "STRONG"
                    })
                    exp.dump_json(run / "normalized" / "persuasion" / anchor / f"{provider}.json", {
                        "persuasion": persuasion
                    })
            summary = exp.summarize(run, entries, ["a", "b", "c"])
            self.assertEqual(1, summary["counts"]["DIVERGENT_PERSUADED"])
            self.assertEqual(1, summary["counts"]["DIVERGENT_UNPERSUADED"])
            adoc = (run / "results" / "summary.adoc").read_text()
            self.assertIn("Divergent — persuaded", adoc)
            self.assertIn("Divergent — unconvinced", adoc)


if __name__ == "__main__":
    unittest.main()
