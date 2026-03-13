#!/usr/bin/env python3
"""
Extract the English translation of the Hebrew Gospel of John from the
Van Rensburg PDF. This PDF contains only the English translation (no Hebrew
source text). Attribution: HebrewGospels.com / Van Rensburg family.

Outputs data/hg-chapters/John-{N}.json
"""

import json
import re
import sys
from pathlib import Path

try:
    import fitz
except ImportError:
    print("pymupdf required: pip install pymupdf")
    sys.exit(1)

PDF_PATH = Path(__file__).parent.parent / "data" / "The Hebrew Gospels from Sepharad - John .pdf"
OUTPUT_CHAPTERS = Path(__file__).parent.parent / "data" / "hg-chapters"

SOURCE = "Hebrew Gospel of John v1.1 (Van Rensburg / HebrewGospels.com, 2021, Vat. Ebr. 100)"

TRANSLATION_START_PAGE = 22
TRANSLATION_END_PAGE = 105


def extract_body_text(doc):
    """Extract translation body text, stripping headers, footers, and footnotes."""
    pages = []
    for pg_idx in range(TRANSLATION_START_PAGE, min(TRANSLATION_END_PAGE, doc.page_count)):
        page = doc[pg_idx]
        blocks = page.get_text('dict')['blocks']

        # Separate body text from footnotes by y-position
        # Footnotes are typically in the lower portion of the page
        # and use smaller font sizes
        body_lines = []
        for block in blocks:
            if 'lines' not in block:
                continue
            for line in block['lines']:
                spans = line['spans']
                if not spans:
                    continue
                y = spans[0]['bbox'][1]
                size = spans[0]['size']
                text = ''.join(s['text'] for s in spans).strip()

                if not text:
                    continue
                # Skip headers/footers
                if re.match(r'^\d+$', text):
                    continue
                if re.match(r'^Version \d', text):
                    continue
                if re.match(r'^Yoch(\.|anan)\s*\d*', text):
                    continue
                # Skip footnotes (smaller font, typically < 9pt)
                if size < 9.0:
                    continue

                body_lines.append(text)

        pages.append(' '.join(body_lines))

    return ' '.join(pages)


def parse_chapters_and_verses(text):
    """Parse chapter:verse structure from the running text."""
    # Remove folio references like (117v), (118r)
    text = re.sub(r'\(\d+[rv]\)', '', text)
    # Remove double spaces
    text = re.sub(r'\s{2,}', ' ', text)

    chapters = {}
    current_chapter = 0
    current_verse = 0

    # Split on chapter markers first: "N: V" where N is chapter number
    # These appear as "1: 1 ...", "2: 1 ...", etc.
    chapter_pattern = re.compile(r'(?:^|\s)(\d{1,2}):\s*(\d{1,3})\s')

    # Find all chapter start positions
    chapter_starts = []
    for m in chapter_pattern.finditer(text):
        ch = int(m.group(1))
        vs = int(m.group(2))
        if 1 <= ch <= 21 and vs == 1:
            chapter_starts.append((m.start(), ch, vs, m.end()))

    if not chapter_starts:
        print("  ERROR: No chapter markers found!")
        return chapters

    # Process each chapter section
    for ci, (start, ch, vs, text_start) in enumerate(chapter_starts):
        end = chapter_starts[ci + 1][0] if ci + 1 < len(chapter_starts) else len(text)
        chapter_text = text[text_start:end].strip()

        # Split verses within this chapter
        # Verse numbers appear as: "V " where V is a number after sentence-ending punctuation
        # or at the very start
        verse_texts = {}
        current_v = 1
        current_parts = []

        # Use regex to split on verse markers within the chapter text
        # Verse markers: a number preceded by sentence-end or start, followed by a capital letter or special char
        tokens = re.split(r'(?<=[.!?;)\u201d\u2019])\s+(\d{1,3})\s+(?=[A-Z(\u201c\u2018\[])', chapter_text)

        # First token is verse 1 text
        if tokens:
            current_parts.append(tokens[0].strip())

        i = 1
        while i < len(tokens):
            if i + 1 < len(tokens):
                try:
                    v = int(tokens[i])
                    if v > current_v and v < current_v + 10:
                        # Flush current verse
                        verse_text = ' '.join(current_parts).strip()
                        verse_text = re.sub(r'\s{2,}', ' ', verse_text)
                        if verse_text:
                            verse_texts[current_v] = verse_text
                        current_v = v
                        current_parts = [tokens[i + 1].strip()]
                        i += 2
                        continue
                except ValueError:
                    pass
            current_parts.append(tokens[i].strip())
            i += 1

        # Flush last verse
        verse_text = ' '.join(current_parts).strip()
        verse_text = re.sub(r'\s{2,}', ' ', verse_text)
        if verse_text:
            verse_texts[current_v] = verse_text

        chapters[ch] = verse_texts

    return chapters


def clean_text(text):
    """Clean up extracted verse text."""
    # Remove remaining footnote superscripts (digits right after words)
    text = re.sub(r'(\w)\d+(\s)', r'\1\2', text)
    text = re.sub(r'(\w)\d+$', r'\1', text)
    text = re.sub(r'\s{2,}', ' ', text)
    return text.strip()


def write_outputs(chapters):
    """Write per-chapter JSON files."""
    OUTPUT_CHAPTERS.mkdir(parents=True, exist_ok=True)

    total_verses = 0
    for ch_num in sorted(chapters.keys()):
        verses = chapters[ch_num]
        verse_list = []
        for v_num in sorted(verses.keys()):
            text = clean_text(verses[v_num])
            if text:
                verse_list.append({
                    "verse": v_num,
                    "translation": text,
                    "words": [],
                    "literal": "",
                    "notes": {
                        "one_way_hebrew": [],
                        "greek_deviations": [],
                        "translation_notes": [],
                        "textual_notes": []
                    }
                })

        ch_output = {
            "book": "John",
            "chapter": ch_num,
            "source": SOURCE,
            "phase": "translation-only",
            "method": "English translation by HebrewGospels.com / Van Rensburg family from Vat. Ebr. 100 Hebrew manuscript. Hebrew source text not digitally available.",
            "verses": verse_list
        }
        ch_path = OUTPUT_CHAPTERS / f"John-{ch_num}.json"
        with open(ch_path, 'w', encoding='utf-8') as f:
            json.dump(ch_output, f, ensure_ascii=False, indent=2)

        total_verses += len(verse_list)
        print(f"  Chapter {ch_num:2d}: {len(verse_list):3d} verses")

    print(f"\nTotal: {len(chapters)} chapters, {total_verses} verses")


def main():
    if not PDF_PATH.exists():
        print(f"PDF not found: {PDF_PATH}")
        sys.exit(1)

    print(f"Opening {PDF_PATH.name}...")
    doc = fitz.open(str(PDF_PATH))
    print(f"  {doc.page_count} pages")

    print("\nExtracting body text...")
    body = extract_body_text(doc)
    print(f"  {len(body):,} characters")

    print("\nParsing chapters and verses...")
    chapters = parse_chapters_and_verses(body)

    print("\nWriting output files...")
    write_outputs(chapters)

    # Spot check
    if 1 in chapters:
        print(f"\nJohn 1:1: {chapters[1].get(1, '???')[:120]}")
        print(f"John 1:14: {chapters[1].get(14, '???')[:120]}")

    doc.close()
    print("\nDone.")


if __name__ == '__main__':
    main()
