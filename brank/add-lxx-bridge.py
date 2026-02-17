#!/usr/bin/env python3
"""
BibleRank — Add LXX-based Hebrew↔Greek Bridge to Matrix

Uses direct LXX verse co-occurrence (no English intermediary) to add
cross-testament connections. Filters out grammar G-numbers so only
content-word bridges are used.

Usage: python3 brank/add-lxx-bridge.py
"""

import json
import os
import math
import time
import numpy as np
from collections import defaultdict

BRANK_DIR = os.path.dirname(os.path.abspath(__file__))
FREQUENCY_THRESHOLD = 300  # must match build-matrix.py


def parse_ref(ref):
    try:
        parts = ref.rsplit(' ', 1)
        book = parts[0]
        cv = parts[1].split(':')
        return (book, int(cv[0]), int(cv[1]))
    except:
        return (ref, 0, 0)

def proximity_boost(ref_a, ref_b):
    if ref_a == ref_b:
        return 1.0
    if ref_a[0] == ref_b[0] and ref_a[1] == ref_b[1]:
        return 0.6
    if ref_a[0] == ref_b[0]:
        return 0.3
    return 0.2  # cross-book: flat


def main():
    print("BibleRank — Adding LXX Hebrew↔Greek Bridge")
    print("=" * 55)
    
    # ── Load LXX bridge ──
    print("\nLoading LXX bridge data...")
    with open(os.path.join(BRANK_DIR, "lxx-bridge.json")) as f:
        bridge_raw = json.load(f)
    print(f"  Raw bridge pairs: {len(bridge_raw):,}")
    
    # ── Load word index to know what's in the matrix ──
    print("Loading word index...")
    with open(os.path.join(BRANK_DIR, "reduced-index.json")) as f:
        index_data = json.load(f)
    
    N = index_data["count"]
    reduced_to_abs = index_data["reduced_to_abs"]
    words = index_data["words"]
    print(f"  Words in matrix: {N:,}")
    
    # ── Build Strong's groups for words in matrix ──
    h_groups = defaultdict(list)
    g_groups = defaultdict(list)
    
    for ri in range(N):
        ref, wi, root, strongs_list, lang = words[ri]
        for s in strongs_list:
            if s.startswith('H'):
                h_groups[s].append(ri)
            elif s.startswith('G'):
                g_groups[s].append(ri)
    
    print(f"  H-groups in matrix: {len(h_groups):,}")
    print(f"  G-groups in matrix: {len(g_groups):,}")
    
    # ── Filter bridge to only content pairs present in matrix ──
    # Also filter out grammar G-numbers (the top co-occurrences are articles/conjunctions)
    # A bridge is valid only if BOTH H and G are in our matrix content groups
    active_bridges = []
    for h, g, cooccur_count in bridge_raw:
        if h in h_groups and g in g_groups:
            h_count = len(h_groups[h])
            g_count = len(g_groups[g])
            pairs = h_count * g_count
            active_bridges.append((h, g, cooccur_count, h_count, g_count, pairs))
    
    total_pairs = sum(b[5] for b in active_bridges)
    print(f"\n  Active bridges (both in matrix): {len(active_bridges):,}")
    print(f"  Total cross-testament pairs: {total_pairs:,}")
    
    # Sort by quality: co-occurrence count / (h_count * g_count) = selectivity
    active_bridges.sort(key=lambda x: -x[2])  # sort by co-occurrence strength
    
    print(f"\n  Top 20 bridges (by LXX co-occurrence):")
    for h, g, cooccur, hc, gc, pairs in active_bridges[:20]:
        print(f"    {h:8} ↔ {g:8} : {cooccur:4} LXX verses, {hc:3}×{gc:3}={pairs:6,} matrix pairs")
    
    # ── Open matrix ──
    print(f"\nOpening matrix ({N:,} × {N:,})...")
    matrix = np.memmap(os.path.join(BRANK_DIR, "matrix.dat"),
                       dtype=np.uint8, mode='r+', shape=(N, N))
    
    # ── Pre-parse refs ──
    word_refs = [parse_ref(w[0]) for w in words]
    
    # ── Add bridge connections ──
    # Bridge strength factor based on LXX co-occurrence count
    # More co-occurrences = stronger bridge (LXX translators consistently chose this pairing)
    print(f"\nAdding bridge connections...")
    start_time = time.time()
    
    pairs_written = 0
    bridges_done = 0
    
    for h, g, cooccur, h_count, g_count, pair_count in active_bridges:
        bridges_done += 1
        
        h_indices = h_groups[h]
        g_indices = g_groups[g]
        
        # IDF based on combined frequency
        combined_freq = h_count + g_count
        idf = 1.0 / (1.0 + math.log(combined_freq))
        
        # Bridge confidence from LXX co-occurrence
        # Normalize: 1 co-occurrence = weak, 100+ = strong
        bridge_confidence = min(1.0, math.log(1 + cooccur) / math.log(100))
        
        for ri_h in h_indices:
            ref_h = word_refs[ri_h]
            for ri_g in g_indices:
                ref_g = word_refs[ri_g]
                
                boost = proximity_boost(ref_h, ref_g)
                weight = bridge_confidence * idf * boost
                w8 = min(255, max(1, int(weight * 255)))
                
                if w8 > matrix[ri_h, ri_g]:
                    matrix[ri_h, ri_g] = w8
                    matrix[ri_g, ri_h] = w8
                
                pairs_written += 1
        
        if bridges_done % 5000 == 0:
            elapsed = time.time() - start_time
            pct = bridges_done / len(active_bridges) * 100
            print(f"  {bridges_done:,}/{len(active_bridges):,} ({pct:.0f}%), "
                  f"{pairs_written:,} pairs ({elapsed:.1f}s)")
    
    elapsed = time.time() - start_time
    print(f"\n  Done: {pairs_written:,} pairs in {elapsed:.1f}s")
    matrix.flush()
    
    # ── Test: Matthew 24 ──
    print(f"\n{'=' * 55}")
    print("TEST: Matthew 24:8 ωδίν (G5604) — birth pains")
    print(f"{'=' * 55}")
    
    for ri in range(N):
        ref, wi, root, strongs_list, lang = words[ri]
        if 'G5604' in strongs_list and "Matthew 24" in ref:
            row = matrix[ri, :]
            top_idx = np.argsort(row)[-25:][::-1]
            top_w = row[top_idx]
            
            print(f"\n  {ref} — top connections:")
            for idx, weight in zip(top_idx, top_w):
                if weight == 0:
                    break
                t = words[idx]
                marker = " ★ OT" if t[4] == 'H' else ""
                print(f"    w={weight:3}  {t[0]:30s} [{t[2]:15s}] {t[3]}{marker}")
    
    print(f"\n{'=' * 55}")
    print("TEST: Matthew 24:7 σεισμός (G4578) — earthquake")
    print(f"{'=' * 55}")
    
    for ri in range(N):
        ref, wi, root, strongs_list, lang = words[ri]
        if 'G4578' in strongs_list and "Matthew 24:7" in ref:
            row = matrix[ri, :]
            top_idx = np.argsort(row)[-25:][::-1]
            top_w = row[top_idx]
            
            print(f"\n  {ref} — top connections:")
            for idx, weight in zip(top_idx, top_w):
                if weight == 0:
                    break
                t = words[idx]
                marker = " ★ OT" if t[4] == 'H' else ""
                print(f"    w={weight:3}  {t[0]:30s} [{t[2]:15s}] {t[3]}{marker}")
    
    print("\nDone.")


if __name__ == "__main__":
    main()
