#!/usr/bin/env python3
"""
BibleRank Phase 0 — Step 3: Add Hebrew↔Greek Bridge to Matrix

Loads the bridge table (Hebrew Strong's ↔ Greek Strong's via shared
KJV translations) and adds cross-testament connections to the matrix.

Usage: python3 brank/add-bridge.py
"""

import json
import os
import sys
import math
import time
import numpy as np
from collections import defaultdict

BRANK_DIR = os.path.dirname(os.path.abspath(__file__))

def parse_ref(ref):
    try:
        parts = ref.rsplit(' ', 1)
        book = parts[0]
        cv = parts[1].split(':')
        return (book, int(cv[0]), int(cv[1]))
    except:
        return (ref, 0, 0)

def proximity_boost(ref_a, ref_b):
    """Step-function proximity. No penalty for cross-book distance."""
    if ref_a == ref_b:
        return 1.0
    if ref_a[0] == ref_b[0] and ref_a[1] == ref_b[1]:
        return 0.6  # same chapter
    if ref_a[0] == ref_b[0]:
        return 0.3  # same book
    return 0.2  # different book — flat, no distance penalty


def main():
    print("BibleRank — Adding Hebrew↔Greek Bridge Connections")
    print("=" * 55)
    
    # Load bridge table
    print("\nLoading bridge table...")
    with open(os.path.join(BRANK_DIR, "hebrew-greek-bridge.json")) as f:
        bridge_raw = json.load(f)
    
    # Build H→G and G→H lookup
    # Each entry: [h_num, g_num, [via_words]]
    h_to_g = defaultdict(set)
    g_to_h = defaultdict(set)
    for h, g, via in bridge_raw:
        h_to_g[h].add(g)
        g_to_h[g].add(h)
    
    print(f"  Bridge pairs: {len(bridge_raw):,}")
    print(f"  Hebrew numbers with Greek bridges: {len(h_to_g):,}")
    print(f"  Greek numbers with Hebrew bridges: {len(g_to_h):,}")
    
    # Load reduced index
    print("\nLoading word index...")
    with open(os.path.join(BRANK_DIR, "reduced-index.json")) as f:
        index_data = json.load(f)
    
    N = index_data["count"]
    reduced_to_abs = index_data["reduced_to_abs"]
    words = index_data["words"]  # [ref, wordIdx, root, strongs, lang]
    
    print(f"  Words in matrix: {N:,}")
    
    # Group words by Strong's number and language
    h_groups = defaultdict(list)  # H-number → list of reduced indices
    g_groups = defaultdict(list)  # G-number → list of reduced indices
    
    for ri in range(N):
        ref, wi, root, strongs_list, lang = words[ri]
        for s in strongs_list:
            if s.startswith('H'):
                h_groups[s].append(ri)
            elif s.startswith('G'):
                g_groups[s].append(ri)
    
    print(f"  Hebrew Strong's groups in matrix: {len(h_groups):,}")
    print(f"  Greek Strong's groups in matrix: {len(g_groups):,}")
    
    # Find bridge pairs that exist in our matrix
    active_bridges = []
    for h, g, via in bridge_raw:
        if h in h_groups and g in g_groups:
            h_count = len(h_groups[h])
            g_count = len(g_groups[g])
            pairs = h_count * g_count
            active_bridges.append((h, g, via, h_count, g_count, pairs))
    
    total_pairs = sum(b[5] for b in active_bridges)
    print(f"\n  Active bridge pairs (both sides in matrix): {len(active_bridges):,}")
    print(f"  Total cross-testament pairs to add: {total_pairs:,}")
    
    # Top bridges by pair count
    active_bridges.sort(key=lambda x: -x[5])
    print(f"\n  Top 15 bridges by pair count:")
    for h, g, via, hc, gc, pairs in active_bridges[:15]:
        print(f"    {h:8} ↔ {g:8} ({hc:3}×{gc:3}={pairs:6,}) via: {', '.join(via[:3])}")
    
    # Open matrix for update
    print(f"\nOpening matrix ({N:,} × {N:,})...")
    matrix_path = os.path.join(BRANK_DIR, "matrix.dat")
    matrix = np.memmap(matrix_path, dtype=np.uint8, mode='r+', shape=(N, N))
    
    # Add bridge connections
    print(f"Adding {total_pairs:,} cross-testament connections...")
    start_time = time.time()
    
    BRIDGE_FACTOR = 0.7  # Bridge connections slightly weaker than direct same-root
    
    # Pre-parse verse references
    word_refs = [parse_ref(w[0]) for w in words]
    
    pairs_written = 0
    bridges_processed = 0
    
    for h, g, via, h_count, g_count, pair_count in active_bridges:
        bridges_processed += 1
        
        h_indices = h_groups[h]
        g_indices = g_groups[g]
        
        # Combined frequency for IDF
        combined_freq = h_count + g_count
        idf = 1.0 / (1.0 + math.log(combined_freq))
        
        for ri_h in h_indices:
            ref_h = word_refs[ri_h]
            for ri_g in g_indices:
                ref_g = word_refs[ri_g]
                
                # Cross-testament = always different book → flat 0.2 boost
                # (no distance penalty between books)
                boost = proximity_boost(ref_h, ref_g)
                weight = BRIDGE_FACTOR * idf * boost
                w8 = min(255, max(1, int(weight * 255)))
                
                if w8 > matrix[ri_h, ri_g]:
                    matrix[ri_h, ri_g] = w8
                    matrix[ri_g, ri_h] = w8
                
                pairs_written += 1
        
        if bridges_processed % 2000 == 0:
            elapsed = time.time() - start_time
            pct = bridges_processed / len(active_bridges) * 100
            print(f"  {bridges_processed:,}/{len(active_bridges):,} bridges ({pct:.0f}%), "
                  f"{pairs_written:,} pairs ({elapsed:.1f}s)")
    
    elapsed = time.time() - start_time
    print(f"\n  Done: {pairs_written:,} cross-testament pairs in {elapsed:.1f}s")
    
    # Flush
    print("  Flushing to disk...")
    matrix.flush()
    
    # Test: Matthew 24 connections now
    print(f"\n{'=' * 55}")
    print("TEST: Matthew 24:8 ωδίν (G5604 birth-pains) connections")
    print(f"{'=' * 55}")
    
    # Find ωδίν words in Matthew 24
    odin_indices = []
    for ri in range(N):
        ref, wi, root, strongs_list, lang = words[ri]
        if 'G5604' in strongs_list:
            odin_indices.append((ri, ref))
    
    print(f"  G5604 (ωδίν) occurrences in matrix: {len(odin_indices)}")
    
    for ri, ref in odin_indices:
        if "Matthew 24" in ref:
            row = matrix[ri, :]
            top_idx = np.argsort(row)[-20:][::-1]
            top_w = row[top_idx]
            
            print(f"\n  {ref} — top connections:")
            for idx, weight in zip(top_idx, top_w):
                if weight == 0:
                    break
                t = words[idx]
                t_ref, t_root, t_strongs, t_lang = t[0], t[2], t[3], t[4]
                marker = " ← OT!" if t_lang == 'H' else ""
                print(f"    w={weight:3}  {t_ref:30s} [{t_root:15s}] {t_strongs}{marker}")
    
    # Also check for earthquake/shake connections
    print(f"\n{'=' * 55}")
    print("TEST: Matthew 24:7 σεισμός (G4578 earthquake) connections")
    print(f"{'=' * 55}")
    
    for ri in range(N):
        ref, wi, root, strongs_list, lang = words[ri]
        if 'G4578' in strongs_list and "Matthew 24" in ref:
            row = matrix[ri, :]
            top_idx = np.argsort(row)[-20:][::-1]
            top_w = row[top_idx]
            
            print(f"\n  {ref} — top connections:")
            for idx, weight in zip(top_idx, top_w):
                if weight == 0:
                    break
                t = words[idx]
                t_ref, t_root, t_strongs, t_lang = t[0], t[2], t[3], t[4]
                marker = " ← OT!" if t_lang == 'H' else ""
                print(f"    w={weight:3}  {t_ref:30s} [{t_root:15s}] {t_strongs}{marker}")
    
    print(f"\nDone.")


if __name__ == "__main__":
    main()
