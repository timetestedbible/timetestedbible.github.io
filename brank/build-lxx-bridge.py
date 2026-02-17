#!/usr/bin/env python3
"""
BibleRank — Build Hebrew↔Greek Bridge from LXX verse co-occurrence.

For each OT verse, the Hebrew (MorphHB) has H-Strong's numbers and the
LXX Greek has G-Strong's numbers. H/G pairs that co-occur in the same
verse are bridge candidates. Pairs co-occurring in many verses = strong bridges.

No English in the loop. Direct Hebrew→Greek via LXX translation decisions.

Usage: python3 brank/build-lxx-bridge.py
"""

import json
import os
import csv
from collections import defaultdict

BRANK_DIR = os.path.dirname(os.path.abspath(__file__))

# Book name mapping: MorphHB "Genesis" → LXX "Gen"
BOOK_MAP = {
    'Genesis': 'Gen', 'Exodus': 'Exod', 'Leviticus': 'Lev',
    'Numbers': 'Num', 'Deuteronomy': 'Deut', 'Joshua': 'Josh',
    'Judges': 'Judg', 'Ruth': 'Ruth', '1 Samuel': '1Sam',
    '2 Samuel': '2Sam', '1 Kings': '1Kgs', '2 Kings': '2Kgs',
    '1 Chronicles': '1Chr', '2 Chronicles': '2Chr', 'Ezra': 'Ezra',
    'Nehemiah': 'Neh', 'Esther': 'Esth', 'Job': 'Job',
    'Psalms': 'Ps', 'Proverbs': 'Prov', 'Ecclesiastes': 'Eccl',
    'Song of Solomon': 'Song', 'Isaiah': 'Isa', 'Jeremiah': 'Jer',
    'Lamentations': 'Lam', 'Ezekiel': 'Ezek', 'Daniel': 'Dan',
    'Hosea': 'Hos', 'Joel': 'Joel', 'Amos': 'Amos',
    'Obadiah': 'Obad', 'Jonah': 'Jonah', 'Micah': 'Mic',
    'Nahum': 'Nah', 'Habakkuk': 'Hab', 'Zephaniah': 'Zeph',
    'Haggai': 'Hag', 'Zechariah': 'Zech', 'Malachi': 'Mal'
}


def main():
    print("BibleRank — Building LXX Hebrew↔Greek Bridge")
    print("=" * 55)
    
    # ── Load LXX data ──
    print("\nLoading LXX Strong's numbers...")
    lxx_dir = os.path.join(BRANK_DIR, "lxx-source")
    
    # Load Strong's numbers (one per line, indexed from 1)
    strongs_file = os.path.join(lxx_dir, "07_StrongNumber", "final_Strongs.csv")
    lxx_strongs = ['']  # 1-indexed, pad with empty at 0
    with open(strongs_file) as f:
        for line in f:
            parts = line.strip().split('\t')
            if len(parts) >= 2:
                lxx_strongs.append(parts[1].strip())
            else:
                lxx_strongs.append('')
    print(f"  LXX words with Strong's: {len(lxx_strongs) - 1:,}")
    
    # Load verse boundaries (verse_ref → start_word_index)
    verse_file = os.path.join(lxx_dir, "08_versification", "001_verse_c_modified_KEEP.csv")
    verse_starts = []  # [(ref, start_idx), ...]
    with open(verse_file) as f:
        for line in f:
            parts = line.strip().split('\t')
            if len(parts) >= 2:
                verse_starts.append((parts[0], int(parts[1])))
    print(f"  LXX verse boundaries: {len(verse_starts):,}")
    
    # Build verse → G-numbers mapping
    lxx_verses = {}  # "Gen.1.1" → set of G-numbers
    for i in range(len(verse_starts)):
        ref = verse_starts[i][0]
        start = verse_starts[i][1]
        end = verse_starts[i + 1][1] if i + 1 < len(verse_starts) else len(lxx_strongs)
        
        g_nums = set()
        for wi in range(start, end):
            if wi < len(lxx_strongs) and lxx_strongs[wi]:
                g_nums.add(lxx_strongs[wi])
        
        if g_nums:
            lxx_verses[ref] = g_nums
    
    print(f"  LXX verses with Strong's data: {len(lxx_verses):,}")
    
    # ── Load MorphHB data ──
    print("\nLoading MorphHB Hebrew data...")
    morphhb_path = os.path.join(BRANK_DIR, "..", "data", "morphhb.json")
    with open(morphhb_path) as f:
        morphhb = json.load(f)
    
    # Build verse → H-numbers mapping
    heb_verses = {}  # "Gen.1.1" → set of H-numbers
    
    for book_name, book_data in morphhb.items():
        lxx_book = BOOK_MAP.get(book_name)
        if not lxx_book or not book_data:
            continue
        
        for ch in range(1, len(book_data)):
            chapter = book_data[ch]
            if not chapter:
                continue
            for vs in range(1, len(chapter)):
                verse = chapter[vs]
                if not verse:
                    continue
                
                lxx_ref = f"{lxx_book}.{ch}.{vs}"
                h_nums = set()
                
                for word in verse:
                    lemma = word[1]
                    if not lemma:
                        continue
                    # Parse H-numbers from lemma
                    for part in lemma.split('/'):
                        part = part.strip()
                        if not part or part[0].isalpha():
                            continue  # prefix marker
                        # Extract number
                        num = ''
                        for c in part:
                            if c.isdigit():
                                num += c
                            else:
                                break
                        if num:
                            h_nums.add(f"H{num}")
                
                if h_nums:
                    heb_verses[lxx_ref] = h_nums
    
    print(f"  Hebrew verses with Strong's: {len(heb_verses):,}")
    
    # ── Build co-occurrence bridge ──
    print("\nBuilding verse-level co-occurrence bridge...")
    
    # For each verse that exists in both, count H↔G co-occurrences
    hg_cooccur = defaultdict(int)  # (H-num, G-num) → verse count
    matched_verses = 0
    
    for ref in heb_verses:
        if ref in lxx_verses:
            matched_verses += 1
            h_nums = heb_verses[ref]
            g_nums = lxx_verses[ref]
            
            for h in h_nums:
                for g in g_nums:
                    hg_cooccur[(h, g)] += 1
    
    print(f"  Matched verses (both Hebrew and LXX): {matched_verses:,}")
    print(f"  Raw H↔G pairs: {len(hg_cooccur):,}")
    
    # Filter: keep pairs that co-occur in 2+ verses (reduces noise)
    strong_pairs = {k: v for k, v in hg_cooccur.items() if v >= 2}
    print(f"  Strong pairs (2+ verse co-occurrences): {len(strong_pairs):,}")
    
    # Sort by co-occurrence count
    sorted_pairs = sorted(strong_pairs.items(), key=lambda x: -x[1])
    
    # Stats
    print(f"\n  Top 20 H↔G bridges (by verse co-occurrence):")
    for (h, g), count in sorted_pairs[:20]:
        print(f"    {h:8} ↔ {g:8} : {count:4} verses")
    
    # How many unique H and G numbers?
    unique_h = set(h for (h, g) in strong_pairs)
    unique_g = set(g for (h, g) in strong_pairs)
    print(f"\n  Unique Hebrew roots bridged: {len(unique_h):,}")
    print(f"  Unique Greek words bridged: {len(unique_g):,}")
    
    # ── Test: key pairs we care about ──
    print(f"\n{'=' * 55}")
    print("KEY TEST PAIRS")
    print(f"{'=' * 55}")
    
    test_pairs = [
        ('H7493', 'H7494', 'רעש shake'),      # → should find G4579/G4578
        ('H2256', None, 'חבל birth-pang'),      # → should find G5604
        ('H3205', None, 'ילד give-birth'),      # → should find G5088
        ('H1471', None, 'גוי nation'),          # → should find G1484
        ('H8085', None, 'שׁמע hear'),           # → should find G189/G191
        ('H776', None, 'ארץ earth'),            # → should find G1093
        ('H8121', None, 'שׁמשׁ sun'),           # → should find G2246
        ('H3394', None, 'ירח moon'),            # → should find G4582
        ('H2822', None, 'חשׁך darkness'),       # → should find G4655/G4656
        ('H4428', None, 'מלך king'),            # → should find G935
        ('H7462', None, 'רעה shepherd'),        # → should find G4166
        ('H6629', None, 'צאן flock'),           # → should find G4263
        ('H2342', None, 'חול writhe/labor'),    # → should find G5604/G5605
    ]
    
    for entry in test_pairs:
        h_nums = [entry[0]]
        if entry[1]:
            h_nums.append(entry[1])
        label = entry[2] if len(entry) > 2 else entry[-1]
        
        # Find all G-numbers bridged to these H-numbers
        bridges = []
        for h in h_nums:
            for (hh, gg), count in sorted_pairs:
                if hh == h and count >= 2:
                    bridges.append((gg, count))
        
        bridges.sort(key=lambda x: -x[1])
        top = bridges[:5]
        if top:
            print(f"\n  {'/'.join(h_nums)} ({label}):")
            for g, count in top:
                print(f"    → {g:8} : {count:3} verse co-occurrences")
        else:
            print(f"\n  {'/'.join(h_nums)} ({label}): NO BRIDGES FOUND")
    
    # ── Save bridge ──
    # Format: [[H-num, G-num, co-occurrence-count], ...]
    bridge_data = [[h, g, c] for (h, g), c in sorted_pairs]
    
    output_path = os.path.join(BRANK_DIR, "lxx-bridge.json")
    with open(output_path, 'w') as f:
        json.dump(bridge_data, f)
    
    print(f"\n{'=' * 55}")
    print(f"Saved {len(bridge_data):,} LXX bridge pairs to brank/lxx-bridge.json")
    print("(sorted by co-occurrence count, filtered to 2+ verses)")


if __name__ == "__main__":
    main()
