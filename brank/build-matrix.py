#!/usr/bin/env python3
"""
BibleRank Phase 0 — Step 2: Build the Dense Word-to-Word Matrix

Loads the word list from build-histogram.js output, filters grammatical
words, builds a dense uint8 symmetric matrix with initial weights based
on shared Strong's numbers and distance decay.

Usage: python3 brank/build-matrix.py
"""

import json
import os
import sys
import math
import time
import numpy as np
from collections import defaultdict

BRANK_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(BRANK_DIR)

# ── Grammar exclusion list ───────────────────────────────────────────
# Pure grammatical words with no semantic content.
# We KEEP: YHWH, Israel, God, Jesus, king, earth, son, man, house,
#          את (alef-tav), and all content words.

# Frequency threshold — exclude any Strong's number with >= this many occurrences.
# At 300: cuts 220 Strong's numbers, 261K words, leaves ~182K words → ~31 GB matrix.
# This removes grammar AND ultra-common content words. Round 2 can lower threshold.
FREQUENCY_THRESHOLD = 300


def proximity_boost(same_verse, same_chapter, same_book):
    """Compute proximity boost as a step function.
    
    Cross-book connections have NO distance penalty — book order is 
    arbitrary convention, not semantic organization.
    
    Only local context (same verse, chapter, book) gets a boost:
      Same verse:   1.0  (words written together as one thought)
      Same chapter: 0.6  (same discourse/section)
      Same book:    0.3  (same author/context)
      Different book: 0.2 (flat — no distance penalty between books)
    """
    if same_verse:
        return 1.0
    if same_chapter:
        return 0.6
    if same_book:
        return 0.3
    return 0.2  # cross-book: flat, no penalty for distance


def main():
    print("BibleRank Phase 0 — Building Dense Word Matrix")
    print("=" * 55)
    
    # ── Load word list ──
    print("\nLoading word list...")
    wl_path = os.path.join(BRANK_DIR, "word-list.json")
    with open(wl_path, "r") as f:
        word_list = json.load(f)
    print(f"  Total words loaded: {len(word_list):,}")
    
    # Format: [absoluteIndex, "ref", wordIndex, "root", ["H1234", ...], "lang"]
    
    # ── Pass 1: Count Strong's occurrences ──
    print(f"\nCounting Strong's occurrences (threshold: {FREQUENCY_THRESHOLD})...")
    strongs_count = defaultdict(int)
    for w in word_list:
        for s in w[4]:
            strongs_count[s] += 1
    
    # Classify Strong's numbers
    high_freq = {s for s, c in strongs_count.items() if c >= FREQUENCY_THRESHOLD}
    hapax = {s for s, c in strongs_count.items() if c < 2}
    content = {s for s, c in strongs_count.items() if 2 <= c < FREQUENCY_THRESHOLD}
    
    print(f"  High-frequency (>={FREQUENCY_THRESHOLD}, excluded): {len(high_freq):,} Strong's")
    print(f"  Content (2-{FREQUENCY_THRESHOLD-1}, kept): {len(content):,} Strong's")
    print(f"  Hapax (1, excluded): {len(hapax):,} Strong's")
    print(f"  Strong's with 2-3 occurrences (high signal): "
          f"{sum(1 for s in content if strongs_count[s] <= 3):,}")
    
    # ── Pass 2: Filter words ──
    print("\nFiltering words...")
    filtered = []
    excluded_high_freq = 0
    excluded_hapax = 0
    excluded_no_strongs = 0
    
    for w in word_list:
        abs_idx, ref, wi, root, strongs_list, lang = w
        
        if not strongs_list:
            excluded_no_strongs += 1
            continue
        
        # Keep only Strong's in the content band
        connectable = [s for s in strongs_list if s in content]
        if not connectable:
            # All Strong's were either high-freq or hapax
            if any(s in high_freq for s in strongs_list):
                excluded_high_freq += 1
            else:
                excluded_hapax += 1
            continue
            
        filtered.append(w)
    
    N = len(filtered)
    print(f"  Excluded high-frequency: {excluded_high_freq:,}")
    print(f"  Excluded hapax: {excluded_hapax:,}")
    print(f"  Excluded no Strong's: {excluded_no_strongs:,}")
    print(f"  Total excluded: {excluded_high_freq + excluded_hapax + excluded_no_strongs:,}")
    print(f"  Remaining content words: {N:,}")
    
    matrix_bytes = N * N  # uint8, 1 byte each
    matrix_gb = matrix_bytes / (1024**3)
    print(f"  Matrix size: {N:,} × {N:,} = {matrix_bytes:,} bytes ({matrix_gb:.1f} GB)")
    
    if matrix_gb > 110:
        print(f"\n  WARNING: Matrix exceeds 110 GB. Too large for 128 GB machine.")
        print(f"  Consider more aggressive filtering.")
        sys.exit(1)
    
    if matrix_gb > 90:
        print(f"  NOTE: Large matrix. Using memory-mapped file (pages from disk).")
    
    # ── Build reduced index ──
    print("\nBuilding reduced index...")
    # reduced_idx → absolute_idx mapping
    reduced_to_abs = []
    abs_to_reduced = {}
    
    # Group by Strong's number for efficient pair generation
    strongs_groups = defaultdict(list)  # strongs_num → list of reduced indices
    
    for reduced_idx, w in enumerate(filtered):
        abs_idx, ref, wi, root, strongs_list, lang = w
        reduced_to_abs.append(abs_idx)
        abs_to_reduced[abs_idx] = reduced_idx
        
        for s in strongs_list:
            if s in content:
                strongs_groups[s].append(reduced_idx)
    
    # Save the index mapping
    index_path = os.path.join(BRANK_DIR, "reduced-index.json")
    index_data = {
        "count": N,
        "reduced_to_abs": reduced_to_abs,
        "words": [[w[1], w[2], w[3], w[4], w[5]] for w in filtered]
        # [ref, wordIdx, root, strongs, lang]
    }
    with open(index_path, "w") as f:
        json.dump(index_data, f)
    print(f"  → brank/reduced-index.json ({N:,} entries)")
    
    # ── Strong's group stats ──
    print(f"\n  Strong's groups: {len(strongs_groups):,}")
    group_sizes = sorted([(s, len(idxs)) for s, idxs in strongs_groups.items()], 
                         key=lambda x: -x[1])
    print(f"  Top 10 groups (by word count):")
    total_pairs = 0
    for s, count in group_sizes[:10]:
        pairs = count * (count - 1) // 2
        total_pairs += pairs
        print(f"    {s:10s}: {count:6,} words → {pairs:12,} pairs")
    
    remaining_pairs = sum(c * (c-1) // 2 for _, c in group_sizes[10:])
    total_pairs += remaining_pairs
    print(f"  Total pairs to compute: {total_pairs:,}")
    
    # ── Create memory-mapped matrix ──
    print(f"\nCreating matrix file ({matrix_gb:.1f} GB)...")
    matrix_path = os.path.join(BRANK_DIR, "matrix.dat")
    
    matrix = np.memmap(matrix_path, dtype=np.uint8, mode='w+', shape=(N, N))
    print(f"  → brank/matrix.dat created")
    
    # ── Populate matrix with initial weights ──
    print(f"\nPopulating matrix with {total_pairs:,} word pairs...")
    start_time = time.time()
    
    # Pre-parse verse references for proximity comparison
    # Parse "Book Ch:Vs" into (book, chapter, verse) tuples
    def parse_ref(ref):
        try:
            parts = ref.rsplit(' ', 1)
            book = parts[0]
            cv = parts[1].split(':')
            return (book, int(cv[0]), int(cv[1]))
        except:
            return (ref, 0, 0)
    
    word_refs = [parse_ref(w[0]) for w in index_data["words"]]
    
    pairs_written = 0
    groups_processed = 0
    
    # Sort groups by size (process small ones first for progress feedback)
    sorted_groups = sorted(strongs_groups.items(), key=lambda x: len(x[1]))
    
    for strongs_num, indices in sorted_groups:
        n = len(indices)
        if n < 2:
            continue
        
        groups_processed += 1
        
        ri_array = indices
        
        # IDF weight for this Strong's number  
        idf = 1.0 / (1.0 + math.log(n))
        
        for a in range(n):
            ri_a = ri_array[a]
            ref_a = word_refs[ri_a]
            
            for b in range(a + 1, n):
                ri_b = ri_array[b]
                ref_b = word_refs[ri_b]
                
                # Step-function proximity
                same_verse = (ref_a == ref_b)
                same_chapter = (ref_a[0] == ref_b[0] and ref_a[1] == ref_b[1])
                same_book = (ref_a[0] == ref_b[0])
                
                boost = proximity_boost(same_verse, same_chapter, same_book)
                weight = idf * boost
                w8 = min(255, max(1, int(weight * 255)))
                
                if w8 > matrix[ri_a, ri_b]:
                    matrix[ri_a, ri_b] = w8
                    matrix[ri_b, ri_a] = w8
                
                pairs_written += 1
                
        if groups_processed % 500 == 0:
            elapsed = time.time() - start_time
            pct = groups_processed / len(sorted_groups) * 100
            print(f"  {groups_processed:,}/{len(sorted_groups):,} groups ({pct:.0f}%), "
                  f"{pairs_written:,} pairs ({elapsed:.1f}s)")
    
    elapsed = time.time() - start_time
    print(f"\n  Done: {pairs_written:,} pairs written in {elapsed:.1f}s")
    
    # Flush to disk
    print("  Flushing to disk...")
    matrix.flush()
    
    # ── Statistics ──
    print(f"\n{'=' * 55}")
    print("MATRIX STATISTICS")
    print(f"{'=' * 55}")
    print(f"  Dimensions: {N:,} × {N:,}")
    print(f"  File size: {os.path.getsize(matrix_path) / (1024**3):.1f} GB")
    print(f"  Pairs written: {pairs_written:,}")
    print(f"  Non-zero entries: {np.count_nonzero(matrix):,}")
    
    # Sample: what does Matthew 24:8 look like?
    print(f"\n{'=' * 55}")
    print("SAMPLE: Top connections for words in Matthew 24")
    print(f"{'=' * 55}")
    
    # Find words from Matthew 24
    matt24_words = []
    for ri, w in enumerate(filtered):
        abs_idx, ref, wi, root, strongs_list, lang = w
        if ref.startswith("Matthew 24:"):
            matt24_words.append((ri, ref, root, strongs_list))
    
    # For selected Matt 24 words, show top connections
    sample_words = [w for w in matt24_words if w[1] in 
                    ["Matthew 24:6", "Matthew 24:7", "Matthew 24:8"]][:15]
    
    for ri, ref, root, strongs in sample_words:
        row = matrix[ri, :]
        top_indices = np.argsort(row)[-10:][::-1]
        top_weights = row[top_indices]
        
        if top_weights[0] == 0:
            continue
            
        print(f"\n  {ref} w{filtered[ri][2]} [{root}] {strongs}")
        for idx, weight in zip(top_indices, top_weights):
            if weight == 0:
                break
            target = filtered[idx]
            t_ref, t_wi, t_root, t_strongs, t_lang = target[1], target[2], target[3], target[4], target[5]
            print(f"    → {t_ref:25s} [{t_root:15s}] {t_strongs}  weight={weight}")
    
    print(f"\nDone. Matrix saved to brank/matrix.dat")
    print(f"Index saved to brank/reduced-index.json")


if __name__ == "__main__":
    main()
