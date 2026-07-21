#!/usr/bin/env python3

import tempfile
import unittest
from pathlib import Path

import render
import sync_from_print as sync


class CitationTests(unittest.TestCase):
    def test_complete_citations(self):
        cases = {
            "John 14:6": "John chapter 14, verse 6",
            "2 John 4-6": "Second John, verses 4 through 6",
            "Matthew 4:23; 9:35":
                "Matthew chapter 4, verse 23, and chapter 9, verse 35",
            "1 Corinthians 13:8, 10, 12, NKJV":
                "First Corinthians chapter 13, verses 8, 10, and 12",
            "Daniel 2:35 (NKJV)": "Daniel chapter 2, verse 35",
        }
        for reference, expected in cases.items():
            with self.subTest(reference=reference):
                self.assertEqual(render.spoken_citation(reference)[1], expected)

    def test_citation_weaves_into_cue(self):
        self.assertEqual(
            render.weave_citation("Jesus answers:", "John 14:6"),
            "Jesus answers in John chapter 14, verse 6:",
        )

    def test_historical_attribution_stays_with_narrator(self):
        self.assertEqual(
            render.weave_attribution(
                "The older witness is next. Let's read:",
                "Hilary of Poitiers (c. 350 AD), on Matthew 25",
            ),
            "The older witness is next. Hear Hilary of Poitiers, circa 350 A D, on Matthew 25:",
        )


class VoiceTests(unittest.TestCase):
    def parse(self, body):
        with tempfile.NamedTemporaryFile("w", suffix=".adoc", delete=False) as handle:
            handle.write("---\ntitle: Test\n---\n" + body)
            path = Path(handle.name)
        try:
            return render.parse_script(path)
        finally:
            path.unlink()

    def test_only_scripture_marker_switches_voice(self):
        historical = self.parse(
            "The historian writes:\n[quote, Historian]\n____\nA claim.\n____\n"
        )
        scripture = self.parse(
            "Moses states it:\n[quote.scripture, Deuteronomy 4:24]\n"
            "____\nGod is a consuming fire.\n____\n"
        )
        self.assertNotIn("scripture", [role for role, _ in historical])
        self.assertIn("scripture", [role for role, _ in scripture])

    def test_long_parts_fit_api_limit(self):
        text = ("A sentence with a clean boundary. " * 300).strip()
        chunks = render.chunk([("narrator", text)])
        self.assertTrue(chunks)
        self.assertLessEqual(max(len(chunk) for _, chunk in chunks), render.MAX_CHARS)


class SyncTests(unittest.TestCase):
    def test_heading_transition_keeps_heading_words(self):
        heading = "The Inscription, Quoted"
        self.assertIn(heading, sync.heading_transition(heading, 0))

    def test_multiline_table_cells_stay_aligned(self):
        table = [
            "| Log | Masorete | MEAT | Prophecy",
            "",
            "| — | received | alternate +",
            "division | with^2^ +",
            "the sign^3^",
        ]
        narration = " ".join(sync.table_to_narration("A test", table))
        self.assertIn("received text leaves this term untranslated", narration)
        self.assertIn("Proposed: with the sign", narration)


if __name__ == "__main__":
    unittest.main()
