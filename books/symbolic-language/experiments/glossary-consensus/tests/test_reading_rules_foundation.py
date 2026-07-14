from __future__ import annotations

import importlib.util
import tempfile
import unittest
from pathlib import Path


RUNNER = Path(__file__).resolve().parents[1] / "foundations" / "reading-rules" / "run.py"
SPEC = importlib.util.spec_from_file_location("reading_rules_foundation", RUNNER)
rr = importlib.util.module_from_spec(SPEC)
assert SPEC and SPEC.loader
SPEC.loader.exec_module(rr)


class ReadingRulesFoundationTests(unittest.TestCase):
    def test_fairness_consensus_requires_clean_unanimous_acceptance(self):
        accepted = {
            "verdict": "FAIR_AS_WRITTEN",
            "agree_to_use_as_baseline": "YES",
            "symmetry": "PASS",
            "neutrality": "PASS",
            "reproducibility": "PASS",
            "ambiguities": [],
            "unfair_rules": [],
            "missing_rules": [],
        }
        self.assertTrue(rr.fairness_result_passes(accepted))
        self.assertFalse(rr.fairness_result_passes({**accepted, "ambiguities": [{"problem": "x"}]}))
        self.assertFalse(rr.fairness_result_passes({**accepted, "verdict": "FAIR_WITH_CLARIFICATIONS"}))

    def test_rationale_consensus_requires_no_remaining_changes(self):
        accepted = {
            "persuasion": "PERSUADED",
            "rules_are_best_objective_standard": "YES",
            "source_weight_is_not_positive_evidence": "AFFIRMED",
            "unresolved_objections": [],
            "required_rule_changes": [],
            "required_argument_changes": [],
        }
        self.assertTrue(rr.rationale_result_passes(accepted))
        self.assertFalse(rr.rationale_result_passes({**accepted, "required_argument_changes": ["Clarify R2"]}))

    def test_frozen_input_cannot_be_silently_replaced(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "rules.md"
            rr.freeze_text(path, "version one\n")
            rr.freeze_text(path, "version one\n")
            with self.assertRaises(ValueError):
                rr.freeze_text(path, "version two\n")

    def test_fairness_prompt_has_rules_but_no_rationale_slot(self):
        prompt = (RUNNER.parent / "prompts" / "02-fairness.md").read_text(encoding="utf-8")
        self.assertIn("${PROPOSED_RULES}", prompt)
        self.assertNotIn("${RULES_ARGUMENT}", prompt)

    def test_proposal_prompt_is_dispute_blind(self):
        prompt = (RUNNER.parent / "prompts" / "01-proposal.md").read_text(encoding="utf-8").lower()
        self.assertIn("${canonical_premises}", prompt)
        self.assertNotIn("pearl", prompt)
        self.assertNotIn("lamb", prompt)
        self.assertNotIn("appointed time", prompt)


if __name__ == "__main__":
    unittest.main()
