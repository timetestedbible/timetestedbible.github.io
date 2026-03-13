#!/usr/bin/env python3
"""
Extract Hebrew text from the Hebrew Gospel of Luke PDF (Van Rensburg 2026).

The PDF uses DavkaDavid, a proprietary Hebrew font that maps Hebrew glyphs to
ASCII code points following the Israeli keyboard layout. pymupdf extracts Latin
characters via the font's ToUnicode CMap. This script reverses that mapping to
produce proper Hebrew Unicode text with niqqud (vowel points).

Word boundaries are determined from character bounding box gaps. Characters
within a word cluster spatially (gaps < 3 units); word breaks have larger gaps.
"""

import json
import os
import re
import sys
import tempfile
from pathlib import Path

import fitz

try:
    from fontTools.ttLib import TTFont
except ImportError:
    print("fonttools required: pip install fonttools")
    sys.exit(1)

PDF_PATH = Path(__file__).parent.parent / "data" / "Hebrew Gospel of Luke - Transcript and Translation only - Version 2,1.pdf"
OUTPUT_DIR = Path(__file__).parent.parent / "data" / "hg-raw"

TRANSCRIPT_START_PAGE = 24
WORD_GAP = 3.0

KEYBOARD_MAP = {
    'a': 'ש', 'b': 'נ', 'c': 'ב', 'd': 'ג', 'e': 'ק', 'f': 'כ',
    'g': 'ע', 'h': 'י', 'i': 'ן', 'j': 'ח', 'k': 'ל', 'l': 'ך',
    'm': 'צ', 'n': 'מ', 'o': 'ם', 'p': 'פ', 'r': 'ר', 's': 'ד',
    't': 'א', 'u': 'ו', 'v': 'ה', 'x': 'ס', 'y': 'ט', 'z': 'ז',
    ',': 'ת', ';': 'ף', '.': 'ץ',
}

DAGESH = '\u05BC'
SHIN_DOT = '\u05C1'
SIN_DOT = '\u05C2'
HOLAM = '\u05B9'

UPPERCASE_MAP = {
    'B': 'נ' + DAGESH, 'C': 'ב' + DAGESH, 'D': 'ג' + DAGESH,
    'E': 'ק' + DAGESH, 'F': 'כ' + DAGESH, 'G': 'ש' + SIN_DOT,
    'H': 'י' + DAGESH, 'I': 'ו' + HOLAM,  'J': 'ש' + SHIN_DOT,
    'K': 'ל' + DAGESH, 'M': 'צ' + DAGESH, 'N': 'מ' + DAGESH,
    'P': 'פ' + DAGESH, 'Q': 'ך' + DAGESH, 'S': 'ד' + DAGESH,
    'T': 'ת' + DAGESH, 'U': 'ו' + DAGESH, 'V': 'ה' + DAGESH,
    'W': 'ך' + DAGESH, 'X': 'ס' + DAGESH, 'Y': 'ט' + DAGESH,
    'Z': 'ז' + DAGESH,
}

SPECIAL_MAP = {
    'w': '\u05F3', 'q': '/',
    '\u00ab': HOLAM,         # «
    '\u00ac': 'ש' + DAGESH + SIN_DOT,  # ¬
    '\u00dd': '',            # Ý (section separator, strip)
    '-': '\u05BE',           # maqaf
    '"': '\u05F4',           # gershayim
    '[': '[', ']': ']', '(': '(', ')': ')',
    '/': '.', '`': ':', '\u00b6': '', '\u00c0': '',
}

NIQQUD_SIGNATURES = {
    (143, 2): '\u05B0',   # Sheva
    (308, 1): '\u05B8',   # Qamats
    (277, 3): '\u05B6',   # Segol
    (293, 2): '\u05B5',   # Tsere
    (286, 1): '\u05B7',   # Patach
    (446, 3): '\u05B2',   # Hataf Patach
    (448, 5): '\u05B1',   # Hataf Segol
    (393, 3): '\u05BB',   # Qubuts
}

HIRIQ_SIG = (149, 1)
HATAF_QAMATS_SIG = (448, 3)

GEMATRIA = {
    'א': 1, 'ב': 2, 'ג': 3, 'ד': 4, 'ה': 5, 'ו': 6, 'ז': 7,
    'ח': 8, 'ט': 9, 'י': 10, 'כ': 20, 'ל': 30,
}


# ---------------------------------------------------------------------------
# Chapter detection
# ---------------------------------------------------------------------------

def parse_chapter_id(raw_id):
    reversed_id = raw_id[::-1]
    chars = [KEYBOARD_MAP[ch] for ch in reversed_id if ch in KEYBOARD_MAP]
    total = sum(GEMATRIA.get(c, 0) for c in chars)
    return total if total > 0 else None


def extract_page_chapter(page):
    blocks = page.get_text('dict')['blocks']
    for b in blocks[:3]:
        if 'lines' not in b:
            continue
        for line in b['lines'][:4]:
            for span in line['spans']:
                if 'DavkaDavid' not in span['font'] or 'Bold' not in span['font']:
                    continue
                text = span['text'].strip()
                if not text or text.isdigit():
                    continue
                parts = re.findall(r'(?:\[[^\]]+\]\s*)?(\S+)\s+teuk', text)
                if parts:
                    ch = parse_chapter_id(parts[-1])
                    if ch and 1 <= ch <= 30:
                        return ch
                m = re.match(r'\[[^\]]+\]\s+(\S+)$', text)
                if m:
                    ch = parse_chapter_id(m.group(1))
                    if ch and 1 <= ch <= 30:
                        return ch
                m = re.match(r'(\S+)\s+teuk$', text)
                if m:
                    ch = parse_chapter_id(m.group(1))
                    if ch and 1 <= ch <= 30:
                        return ch
    return None


# ---------------------------------------------------------------------------
# Glyph classifier
# ---------------------------------------------------------------------------

class GlyphClassifier:
    def __init__(self, doc, font_xref):
        self.char_map = {}
        self._build(doc, font_xref)

    def _build(self, doc, font_xref):
        font_obj = doc.xref_object(font_xref)
        fc_m = re.search(r'/FirstChar (\d+)', font_obj)
        lc_m = re.search(r'/LastChar (\d+)', font_obj)
        if not fc_m or not lc_m:
            return
        first_char, last_char = int(fc_m.group(1)), int(lc_m.group(1))

        cmap_m = re.search(r'/ToUnicode (\d+) 0 R', font_obj)
        desc_m = re.search(r'/FontDescriptor (\d+) 0 R', font_obj)
        if not cmap_m or not desc_m:
            return
        desc_obj = doc.xref_object(int(desc_m.group(1)))
        ff_m = re.search(r'/FontFile2 (\d+) 0 R', desc_obj)
        if not ff_m:
            return

        cmap_stream = doc.xref_stream(int(cmap_m.group(1)))
        cmap_text = cmap_stream.decode('latin-1', errors='replace')
        cmap_entries = {}
        for m in re.finditer(r'<([0-9a-fA-F]+)><[0-9a-fA-F]+><([0-9a-fA-F]+)>', cmap_text):
            cmap_entries[int(m.group(1), 16)] = chr(int(m.group(2), 16))

        font_data = doc.xref_stream(int(ff_m.group(1)))
        try:
            with tempfile.NamedTemporaryFile(suffix='.ttf', delete=False) as tmp:
                tmp.write(font_data)
                tmp_path = tmp.name
            ttfont = TTFont(tmp_path)
            glyf_table = ttfont['glyf']
            hmtx_table = ttfont['hmtx']
            mac_cmap = ttfont['cmap'].tables[0].cmap
            os.unlink(tmp_path)
        except Exception:
            return

        for code in range(first_char, last_char + 1):
            glyph_name = mac_cmap.get(code)
            if not glyph_name or glyph_name not in glyf_table:
                continue
            g = glyf_table[glyph_name]
            w = hmtx_table[glyph_name][0]
            nc = g.numberOfContours

            extracted = cmap_entries.get(code)
            if extracted is not None:
                self._register(extracted)
            else:
                raw_char = chr(code)
                hebrew = self._identify_niqqud(w, nc, g)
                if hebrew is not None:
                    self.char_map[raw_char] = hebrew

    def _register(self, ch):
        if ch in KEYBOARD_MAP:
            self.char_map[ch] = KEYBOARD_MAP[ch]
        elif ch in UPPERCASE_MAP:
            self.char_map[ch] = UPPERCASE_MAP[ch]
        elif ch in SPECIAL_MAP:
            self.char_map[ch] = SPECIAL_MAP[ch]
        elif ch.isdigit() or ch == ' ':
            self.char_map[ch] = ch

    def _identify_niqqud(self, width, nc, glyph):
        if nc <= 0:
            return ''
        sig = (width, nc)
        if sig in NIQQUD_SIGNATURES:
            return NIQQUD_SIGNATURES[sig]
        if sig == HIRIQ_SIG:
            return '\u05BD' if (hasattr(glyph, 'yMin') and glyph.yMin < -200) else '\u05B4'
        if sig == HATAF_QAMATS_SIG:
            return '\u05B3'
        if nc == 3 and 600 <= width <= 620 and hasattr(glyph, 'yMax') and glyph.yMax > 600:
            return 'ש' + DAGESH + SHIN_DOT
        if hasattr(glyph, 'yMin') and glyph.yMin > 500:
            return HOLAM if width < 130 else ''
        return None

    def translate(self, ch):
        if ch in self.char_map:
            return self.char_map[ch]
        if ch in KEYBOARD_MAP:
            return KEYBOARD_MAP[ch]
        if ch in UPPERCASE_MAP:
            return UPPERCASE_MAP[ch]
        if ch in SPECIAL_MAP:
            return SPECIAL_MAP[ch]
        if ch.isdigit():
            return ch
        if ch == ' ' or ch == '\xa0':
            return ''
        if ord(ch) < 0x20:
            return ''
        return ch


def build_font_classifiers(doc):
    classifiers = {}
    for i in range(doc.xref_length()):
        try:
            obj = doc.xref_object(i)
        except Exception:
            continue
        if 'DavkaDavid' not in obj or '/ToUnicode' not in obj or '/BaseFont' not in obj:
            continue
        if '/Type /Font' not in obj:
            continue
        base_m = re.search(r'/BaseFont /(\S+)', obj)
        if not base_m:
            continue
        bf = base_m.group(1)
        if bf not in classifiers:
            classifiers[bf] = GlyphClassifier(doc, i)
    return classifiers


def get_classifier(classifiers, font_name):
    for bf, clf in classifiers.items():
        suffix = bf.split('+')[-1]
        if suffix in font_name:
            return clf
    return next(iter(classifiers.values())) if classifiers else None


HEBREW_COMBINING = set(range(0x05B0, 0x05BE)) | {0x05BF, 0x05C1, 0x05C2, 0x05C4, 0x05C5, 0x05C7}
HEBREW_LETTERS = set(range(0x05D0, 0x05EB))


def _is_combining(ch):
    return ord(ch) in HEBREW_COMBINING


def _is_hebrew_letter(ch):
    return ord(ch) in HEBREW_LETTERS


def _fix_niqqud_order(text):
    """
    Fix niqqud ordering: ensure combining marks follow their base consonant.
    When a combining mark appears before a consonant, move it after.
    """
    chars = list(text)
    i = 0
    while i < len(chars) - 1:
        if _is_combining(chars[i]) and _is_hebrew_letter(chars[i + 1]):
            # Combining mark before consonant: swap
            chars[i], chars[i + 1] = chars[i + 1], chars[i]
            # Check if there are more combining marks to attach
            if i > 0:
                i -= 1
        else:
            i += 1
    return ''.join(chars)


# ---------------------------------------------------------------------------
# Page processing with position-based word segmentation
# ---------------------------------------------------------------------------

# Page 118 has a manuscript section marker (ms "chapter 8") that splits
# canonical Luke 7 in half. This is the only non-canonical chapter break
# in the manuscript — all other headings match the standard 24-chapter system.
SKIP_HEADING_PAGES = {118}


def _is_chapter_heading(spans):
    """
    Detect inline chapter headings in bold DavkaDavid text.
    These contain 'eUk' (= reversed 'לוק' from 'לוקא') and 'P'/'p' (= פ from פרק).
    """
    bold_text = ''
    for span in spans:
        font = span.get('font', '')
        if 'DavkaDavid' in font and 'Bold' in font:
            chars = span.get('chars', [])
            bold_text += ''.join(c['c'] for c in chars)
    return 'eUk' in bold_text and ('P' in bold_text or 'p' in bold_text)


def process_page(page, classifiers, page_idx=0):
    """Extract verse numbers, chapter headings, and Hebrew text from a transcript page."""
    results = []
    blocks = page.get_text('rawdict')['blocks']

    for block in blocks:
        if 'lines' not in block:
            continue
        for line in block['lines']:
            verse_num = None
            positioned = []

            # Check if this line is an inline chapter heading
            if page_idx not in SKIP_HEADING_PAGES and _is_chapter_heading(line['spans']):
                results.append(('chapter_break', None))
                continue

            for span in line['spans']:
                font = span['font']
                chars = span.get('chars', [])
                if not chars:
                    continue

                # Verse numbers: bold DavkaDavid OR GuttmanDVilna digits
                is_verse_font = (
                    ('DavkaDavid' in font and 'Bold' in font)
                    or 'Guttman' in font
                )
                if is_verse_font:
                    text = ''.join(c['c'] for c in chars).strip()
                    if text.isdigit() and len(text) <= 3:
                        verse_num = int(text)
                    continue

                if 'DavkaDavid' not in font:
                    continue
                if 'Bold' in font:
                    continue  # skip bold headers

                clf = get_classifier(classifiers, font)
                if not clf:
                    continue

                for ch_data in chars:
                    c = ch_data['c']
                    y_top = ch_data['bbox'][1]
                    if y_top > 480:
                        continue  # skip footnote area
                    mapped = clf.translate(c)
                    if mapped and mapped.strip():
                        x_left = ch_data['bbox'][0]
                        x_right = ch_data['bbox'][2]
                        positioned.append((mapped, x_left, x_right))

            if verse_num is not None:
                results.append(('verse', verse_num))

            if not positioned:
                continue

            # Separate consonants (base chars) from combining marks (niqqud)
            consonants = []  # (mapped, x_left, x_right, index)
            combinings = []  # (mapped, x_center)

            for idx, (mapped, x_left, x_right) in enumerate(positioned):
                if all(_is_combining(ch) for ch in mapped):
                    x_center = (x_left + x_right) / 2
                    combinings.append((mapped, x_center))
                else:
                    consonants.append((mapped, x_left, x_right, idx))

            if not consonants:
                continue

            # Pair each combining mark with its nearest consonant by x overlap
            paired = {i: [] for i in range(len(consonants))}
            for cmb_str, cmb_x in combinings:
                best_idx = 0
                best_dist = abs(cmb_x - (consonants[0][1] + consonants[0][2]) / 2)
                for ci, (_, cl, cr, _) in enumerate(consonants):
                    dist = abs(cmb_x - (cl + cr) / 2)
                    if dist < best_dist:
                        best_dist = dist
                        best_idx = ci
                paired[best_idx].append(cmb_str)

            # Build word-segmented output: consonants in visual LTR order
            # with their paired niqqud, then detect word gaps
            visual_cells = []  # (cell_str, x_left, x_right)
            for ci, (base, xl, xr, _) in enumerate(consonants):
                cell = base + ''.join(paired[ci])
                visual_cells.append((cell, xl, xr))

            # Group cells into visual tokens by gap
            visual_tokens = [[visual_cells[0]]]
            for cell, xl, xr in visual_cells[1:]:
                prev_xr = visual_tokens[-1][-1][2]
                gap = xl - prev_xr
                if gap > WORD_GAP:
                    visual_tokens.append([(cell, xl, xr)])
                else:
                    visual_tokens[-1].append((cell, xl, xr))

            # Reverse tokens and chars within tokens for RTL logical order
            words = []
            for token in reversed(visual_tokens):
                word = ''.join(cell_str for cell_str, _, _ in reversed(token))
                if word:
                    words.append(word)

            hebrew_line = ' '.join(words)
            hebrew_line = hebrew_line.replace('·', '').strip()
            if hebrew_line:
                results.append(('text', hebrew_line))

    return results


# ---------------------------------------------------------------------------
# Assembly and output
# ---------------------------------------------------------------------------

def extract_all(doc, classifiers):
    chapters = {}
    current_chapter = 0
    current_verse = 0
    verse_parts = []

    def flush_verse():
        nonlocal verse_parts
        if current_chapter > 0 and current_verse > 0 and verse_parts:
            if current_chapter not in chapters:
                chapters[current_chapter] = {}
            text = ' '.join(verse_parts)
            text = re.sub(r' {2,}', ' ', text).strip()
            if text:
                prev = chapters[current_chapter].get(current_verse, '')
                chapters[current_chapter][current_verse] = (prev + ' ' + text).strip()
            verse_parts = []

    for pg_idx in range(TRANSCRIPT_START_PAGE, doc.page_count):
        page = doc[pg_idx]
        fonts = page.get_fonts()
        if not any('DavkaDavid' in f[3] for f in fonts):
            continue

        # Use running header only if we haven't started yet
        if current_chapter == 0:
            header_chapter = extract_page_chapter(page)
            if header_chapter:
                current_chapter = header_chapter
            else:
                current_chapter = 1

        results = process_page(page, classifiers, pg_idx)
        for item_type, value in results:
            if item_type == 'chapter_break':
                # Only advance if we've already seen verses (skip the first heading)
                if current_chapter in chapters or current_verse > 0:
                    flush_verse()
                    current_chapter += 1
                    current_verse = 0
                    verse_parts = []
            elif item_type == 'verse':
                flush_verse()
                current_verse = value
                verse_parts = []
            elif item_type == 'text':
                verse_parts.append(value)

    flush_verse()

    # Cap at chapter 24 (Luke has 24 chapters; ch25 if present is appendix)
    return {k: v for k, v in chapters.items() if k <= 24}


def write_output(chapters):
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    total_verses = 0
    for chap in sorted(chapters.keys()):
        verses = chapters[chap]
        verse_list = [
            {"verse": v, "hebrew": re.sub(r' {2,}', ' ', verses[v]).strip()}
            for v in sorted(verses.keys())
            if verses[v].strip()
        ]
        output = {
            "book": "Luke",
            "chapter": chap,
            "source": "Hebrew Gospel of Luke v2.1 (Van Rensburg 2026, Vat. Ebr. 100)",
            "verses": verse_list
        }
        path = OUTPUT_DIR / f"Luke-{chap}.json"
        with open(path, 'w', encoding='utf-8') as f:
            json.dump(output, f, ensure_ascii=False, indent=2)
        total_verses += len(verse_list)
        print(f"  Chapter {chap:2d}: {len(verse_list):3d} verses -> {path.name}")
    print(f"\nTotal: {len(chapters)} chapters, {total_verses} verses")


def main():
    if not PDF_PATH.exists():
        print(f"PDF not found: {PDF_PATH}")
        sys.exit(1)

    print(f"Opening {PDF_PATH.name}...")
    doc = fitz.open(str(PDF_PATH))
    print(f"  {doc.page_count} pages")

    print("\nBuilding font classifiers...")
    classifiers = build_font_classifiers(doc)
    print(f"  {len(classifiers)} DavkaDavid font subsets indexed")

    print("\nProcessing transcript pages...")
    chapters = extract_all(doc, classifiers)

    print("\nWriting output files...")
    write_output(chapters)

    if 1 in chapters and chapters[1]:
        first_v = min(chapters[1].keys())
        print(f"\nValidation - Luke 1:{first_v}:")
        print(f"  {chapters[1][first_v][:150]}")

    doc.close()
    print("\nDone.")


if __name__ == '__main__':
    main()
