#!/usr/bin/env python3
"""
Remap existing Luke translations to corrected chapter:verse assignments.

The original extraction had a false chapter break (manuscript section marker at
page 118 splitting canonical Luke 7). This shifted chapters 8-24 by +1. The raw
Hebrew has been re-extracted with correct alignment. This script matches old
translations to new verse assignments by Hebrew content, preserving all
existing translation work.
"""

import json
import os
import re
from pathlib import Path

ROOT = Path(__file__).parent.parent
HG_CHAPTERS = ROOT / "data" / "hg-chapters"
HG_RAW = ROOT / "data" / "hg-raw"


def normalize(t):
    t = re.sub(r'[\u0591-\u05BD\u05BF-\u05C7]', '', t)
    t = re.sub(r'[·\[\]()!.%\u05F3\u05F4\u05BE]', '', t)
    t = re.sub(r'\s+', ' ', t).strip()
    return t


def build_old_index():
    """Index all old translations by normalized consonantal text."""
    by_full = {}
    by_short = {}

    for f in sorted(os.listdir(HG_CHAPTERS)):
        if not f.startswith('Luke-') or not f.endswith('.json') or '-batch' in f:
            continue
        with open(HG_CHAPTERS / f) as fh:
            d = json.load(fh)
        for v in d.get('verses', []):
            words = v.get('words', [])
            if not words:
                continue
            full_key = normalize(' '.join(w[0] for w in words))
            short_key = normalize(' '.join(w[0] for w in words[:4]))
            by_full[full_key] = v
            if short_key not in by_short:
                by_short[short_key] = v

    return by_full, by_short


def find_translation(hebrew, by_full, by_short):
    """Find a matching old translation for a Hebrew verse."""
    cons = normalize(hebrew)
    words = cons.split()

    # Try full text match
    if cons in by_full:
        return by_full[cons]

    # Try first 4 words
    short = ' '.join(words[:4])
    if short in by_short:
        return by_short[short]

    # Try first 3 words
    shorter = ' '.join(words[:3])
    if shorter in by_short:
        return by_short[shorter]

    return None


def main():
    print("Building index of old translations...")
    by_full, by_short = build_old_index()
    print(f"  {len(by_full)} full-text entries, {len(by_short)} short-key entries")

    matched = 0
    unmatched = []
    total = 0

    for ch in range(1, 25):
        raw_path = HG_RAW / f"Luke-{ch}.json"
        if not raw_path.exists():
            continue

        with open(raw_path) as f:
            raw = json.load(f)

        new_verses = []
        for rv in raw['verses']:
            total += 1
            old = find_translation(rv['hebrew'], by_full, by_short)
            if old:
                matched += 1
                # Remap: keep translation data but update verse number
                remapped = dict(old)
                remapped['verse'] = rv['verse']
                new_verses.append(remapped)
            else:
                unmatched.append(f"Luke {ch}:{rv['verse']}")
                # Placeholder for unmatched verses
                new_verses.append({
                    "verse": rv['verse'],
                    "translation": "",
                    "literal": "",
                    "amplified": "",
                    "words": [],
                    "work": [],
                    "ambiguities": [],
                    "notes": {
                        "one_way_hebrew": [],
                        "greek_deviations": [],
                        "translation_notes": ["PENDING: Translation not yet generated for this verse."],
                        "textual_notes": []
                    }
                })

        # Write updated chapter file
        output = {
            "book": "Luke",
            "chapter": ch,
            "source": "Hebrew Gospel of Luke v2.1 (Van Rensburg 2026, Vat. Ebr. 100)",
            "phase": 1,
            "method": "Consonantal analysis — niqqud stripped, no English/Greek reference provided",
            "verses": new_verses
        }

        out_path = HG_CHAPTERS / f"Luke-{ch}.json"
        with open(out_path, 'w', encoding='utf-8') as f:
            json.dump(output, f, ensure_ascii=False, indent=2)

        ch_matched = sum(1 for v in new_verses if v.get('translation') or v.get('amplified'))
        ch_pending = len(new_verses) - ch_matched
        status = f" ({ch_pending} pending)" if ch_pending else ""
        print(f"  Luke {ch:2d}: {len(new_verses)} verses, {ch_matched} translated{status}")

    print(f"\nTotal: {matched}/{total} matched, {len(unmatched)} need translation")
    if unmatched:
        print(f"\nPending verses ({len(unmatched)}):")
        for u in unmatched:
            print(f"  {u}")


if __name__ == '__main__':
    main()
