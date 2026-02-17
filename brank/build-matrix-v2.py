#!/usr/bin/env python3
"""
BibleRank — Build Matrix v2

Two-layer weight model:
  Layer 1: Same Strong's number → weight = IDF. No distance penalty.
  Layer 2: Different words within ~500 word distance → proximity-decayed weight.
  Layer 3: LXX Hebrew↔Greek bridge → weight = bridge_confidence × IDF. No distance penalty.
  Layer 4: OpenBible user cross-refs → weight = vote-based. No distance penalty.

Usage: source brank/.venv/bin/activate && python3 brank/build-matrix-v2.py
"""

import json
import os
import math
import time
import numpy as np
from collections import defaultdict

BRANK_DIR = os.path.dirname(os.path.abspath(__file__))
FREQUENCY_THRESHOLD = 300
PROXIMITY_RADIUS = 500  # words


def main():
    print("BibleRank v2 — Two-Layer Matrix Build")
    print("=" * 60)
    t0 = time.time()

    # ══════════════════════════════════════════════════════════
    # LOAD DATA
    # ══════════════════════════════════════════════════════════
    print("\n[1/7] Loading word list...")
    with open(os.path.join(BRANK_DIR, "word-list.json")) as f:
        word_list = json.load(f)
    print(f"  Total words: {len(word_list):,}")

    # ── Count Strong's + filter ──
    print("\n[2/7] Filtering words (threshold={})...".format(FREQUENCY_THRESHOLD))
    strongs_count = defaultdict(int)
    for w in word_list:
        for s in w[4]:
            strongs_count[s] += 1

    high_freq = {s for s, c in strongs_count.items() if c >= FREQUENCY_THRESHOLD}
    hapax = {s for s, c in strongs_count.items() if c < 2}
    content = {s for s, c in strongs_count.items() if 2 <= c < FREQUENCY_THRESHOLD}

    filtered = []
    for w in word_list:
        if not w[4]:
            continue
        connectable = [s for s in w[4] if s in content]
        if not connectable:
            continue
        filtered.append(w)

    N = len(filtered)
    matrix_gb = N * N / (1024**3)
    print(f"  Content words: {N:,}")
    print(f"  Matrix: {N:,} × {N:,} = {matrix_gb:.1f} GB")

    if matrix_gb > 110:
        print("  ERROR: Too large. Exiting.")
        return

    # ── Build index structures ──
    print("\n[3/7] Building indices...")

    # Strong's groups: strongs_num → [reduced_indices]
    strongs_groups = defaultdict(list)
    reduced_to_abs = []

    for ri, w in enumerate(filtered):
        abs_idx, ref, wi, root, strongs_list, lang = w
        reduced_to_abs.append(abs_idx)
        for s in strongs_list:
            if s in content:
                strongs_groups[s].append(ri)

    # Save index
    index_data = {
        "count": N,
        "reduced_to_abs": reduced_to_abs,
        "words": [[w[1], w[2], w[3], w[4], w[5]] for w in filtered]
    }
    with open(os.path.join(BRANK_DIR, "reduced-index.json"), "w") as f:
        json.dump(index_data, f)

    # Pre-compute absolute positions as numpy array for fast distance calc
    abs_positions = np.array(reduced_to_abs, dtype=np.int64)

    total_root_pairs = sum(len(v) * (len(v) - 1) // 2
                           for v in strongs_groups.values() if len(v) >= 2)
    print(f"  Strong's groups: {len(strongs_groups):,}")
    print(f"  Layer 1 pairs (same root): {total_root_pairs:,}")

    # ══════════════════════════════════════════════════════════
    # CREATE MATRIX
    # ══════════════════════════════════════════════════════════
    print(f"\n[4/7] Creating matrix ({matrix_gb:.1f} GB)...")
    matrix_path = os.path.join(BRANK_DIR, "matrix.dat")
    matrix = np.memmap(matrix_path, dtype=np.uint8, mode='w+', shape=(N, N))
    print(f"  → matrix.dat created")

    # ══════════════════════════════════════════════════════════
    # LAYER 1: Same Strong's → IDF weight, NO distance penalty
    # ══════════════════════════════════════════════════════════
    print(f"\n[5/7] Layer 1: Same-root connections (no distance penalty)...")
    t1 = time.time()
    pairs_l1 = 0

    sorted_groups = sorted(strongs_groups.items(), key=lambda x: len(x[1]))
    for strongs_num, indices in sorted_groups:
        n = len(indices)
        if n < 2:
            continue

        # IDF: rare words get higher weight
        idf = 1.0 / (1.0 + math.log(n))
        w8 = min(255, max(1, int(idf * 255)))

        # Connect every pair — FLAT weight, no distance
        for a in range(n):
            ri_a = indices[a]
            for b in range(a + 1, n):
                ri_b = indices[b]
                if w8 > matrix[ri_a, ri_b]:
                    matrix[ri_a, ri_b] = w8
                    matrix[ri_b, ri_a] = w8
                pairs_l1 += 1

        if pairs_l1 % 2_000_000 == 0 and pairs_l1 > 0:
            print(f"  {pairs_l1:,} pairs ({time.time()-t1:.1f}s)")

    print(f"  Layer 1 done: {pairs_l1:,} pairs ({time.time()-t1:.1f}s)")

    # ══════════════════════════════════════════════════════════
    # LAYER 2: Proximity — different words within PROXIMITY_RADIUS
    # ══════════════════════════════════════════════════════════
    print(f"\n[6/7] Layer 2: Proximity connections (within {PROXIMITY_RADIUS} words)...")
    t2 = time.time()
    pairs_l2 = 0

    # Sort by absolute position for sliding window
    sorted_by_pos = np.argsort(abs_positions)

    # Sliding window: for each word, connect to all words within radius
    # Use a pointer-based approach for efficiency
    PROXIMITY_BASE = 15  # max uint8 value for proximity (much lower than root match)

    left = 0
    for right in range(N):
        ri_right = int(sorted_by_pos[right])
        pos_right = int(abs_positions[ri_right])

        # Advance left pointer to maintain window
        while left < right and (pos_right - int(abs_positions[int(sorted_by_pos[left])])) > PROXIMITY_RADIUS:
            left += 1

        # Connect right to everything in [left, right)
        for mid in range(left, right):
            ri_left = int(sorted_by_pos[mid])
            pos_left = int(abs_positions[ri_left])
            dist = pos_right - pos_left

            if dist <= 0:
                continue

            # Decay: strong for nearby, weak for far
            # ~10 words: weight ~15, ~50 words: ~8, ~200 words: ~4, ~500 words: ~2
            decay = 1.0 / (1.0 + math.sqrt(dist / 5.0))
            w8 = max(1, int(PROXIMITY_BASE * decay))

            # Only write if no stronger connection exists (root match takes priority)
            if w8 > matrix[ri_left, ri_right]:
                matrix[ri_left, ri_right] = w8
                matrix[ri_right, ri_left] = w8

            pairs_l2 += 1

        if right % 50000 == 0 and right > 0:
            elapsed = time.time() - t2
            pct = right / N * 100
            print(f"  {right:,}/{N:,} words ({pct:.0f}%), {pairs_l2:,} pairs ({elapsed:.1f}s)")

    print(f"  Layer 2 done: {pairs_l2:,} pairs ({time.time()-t2:.1f}s)")

    # ══════════════════════════════════════════════════════════
    # LAYER 3: LXX Hebrew↔Greek bridge
    # ══════════════════════════════════════════════════════════
    print(f"\n[7/7] Layer 3: LXX Hebrew↔Greek bridge...")
    t3 = time.time()

    bridge_path = os.path.join(BRANK_DIR, "lxx-bridge.json")
    if not os.path.exists(bridge_path):
        print("  lxx-bridge.json not found — skipping. Run build-lxx-bridge.py first.")
    else:
        with open(bridge_path) as f:
            bridge_raw = json.load(f)

        # Build H and G groups from matrix words
        h_groups = defaultdict(list)
        g_groups = defaultdict(list)
        for ri in range(N):
            for s in index_data["words"][ri][3]:  # strongs list
                if s.startswith('H') and s in content:
                    h_groups[s].append(ri)
                elif s.startswith('G') and s in content:
                    g_groups[s].append(ri)

        # Filter to active bridges
        active = []
        for h, g, cooccur in bridge_raw:
            if h in h_groups and g in g_groups:
                active.append((h, g, cooccur, len(h_groups[h]), len(g_groups[g])))

        pairs_l3 = 0
        for h, g, cooccur, hc, gc in active:
            combined = hc + gc
            idf = 1.0 / (1.0 + math.log(combined))
            bridge_conf = min(1.0, math.log(1 + cooccur) / math.log(100))

            # Flat weight — no distance penalty for bridge connections
            w8 = min(255, max(1, int(bridge_conf * idf * 255)))

            for ri_h in h_groups[h]:
                for ri_g in g_groups[g]:
                    if w8 > matrix[ri_h, ri_g]:
                        matrix[ri_h, ri_g] = w8
                        matrix[ri_g, ri_h] = w8
                    pairs_l3 += 1

            if pairs_l3 % 5_000_000 == 0 and pairs_l3 > 0:
                print(f"  {pairs_l3:,} bridge pairs ({time.time()-t3:.1f}s)")

        print(f"  Layer 3 done: {pairs_l3:,} pairs ({time.time()-t3:.1f}s)")

    # ══════════════════════════════════════════════════════════
    # FLUSH + STATS
    # ══════════════════════════════════════════════════════════
    print("\nFlushing to disk...")
    matrix.flush()

    total_time = time.time() - t0
    nonzero = np.count_nonzero(matrix)
    print(f"\n{'=' * 60}")
    print(f"MATRIX COMPLETE")
    print(f"{'=' * 60}")
    print(f"  Dimensions: {N:,} × {N:,}")
    print(f"  File size: {os.path.getsize(matrix_path) / (1024**3):.1f} GB")
    print(f"  Layer 1 (same root): {pairs_l1:,} pairs")
    print(f"  Layer 2 (proximity): {pairs_l2:,} pairs")
    print(f"  Non-zero entries: {nonzero:,}")
    print(f"  Total time: {total_time:.1f}s")

    # ══════════════════════════════════════════════════════════
    # TEST: Matthew 24
    # ══════════════════════════════════════════════════════════
    print(f"\n{'=' * 60}")
    print("TEST: Matthew 24:6-8 — Top connections")
    print(f"{'=' * 60}")

    words = index_data["words"]
    test_words = [
        ("G5604", "birth-pains"),
        ("G4578", "earthquake"),
        ("G189",  "report/rumor"),
        ("G2360", "alarmed"),
        ("G1484", "nation"),
    ]

    for target_strongs, label in test_words:
        # Find this word in Matthew 24
        found_ri = None
        for ri in range(N):
            ref, wi, root, strongs_list, lang = words[ri]
            if target_strongs in strongs_list and "Matthew 24:" in ref:
                found_ri = ri
                break

        if found_ri is None:
            print(f"\n  {target_strongs} ({label}): not found in Matthew 24")
            continue

        ref = words[found_ri][0]
        row = matrix[found_ri, :]
        top_idx = np.argsort(row)[-20:][::-1]
        top_w = row[top_idx]

        print(f"\n  {ref} — {target_strongs} ({label}):")
        for idx, weight in zip(top_idx, top_w):
            if weight == 0:
                break
            t = words[idx]
            lang_marker = ""
            if t[4] == 'H':
                lang_marker = " ★ OT"
            print(f"    w={weight:3}  {t[0]:30s} [{t[2]:15s}] {t[3]}{lang_marker}")

    print(f"\nDone.")


if __name__ == "__main__":
    main()
