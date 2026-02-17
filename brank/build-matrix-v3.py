#!/usr/bin/env python3
"""
BibleRank v3 — Clean Matrix + PageRank with Live Proximity

Matrix stores ONLY non-derivable connections:
  - Same Strong's number → IDF weight (no distance penalty)
  - LXX Hebrew↔Greek bridge → confidence × IDF (no distance penalty)

Proximity is NOT stored — computed on the fly during PageRank.

PageRank iteration combines matrix connections + live proximity
at float64 precision, then writes converged ranks back.

Usage: source brank/.venv/bin/activate && python3 brank/build-matrix-v3.py
"""

import json
import os
import math
import time
import numpy as np
from collections import defaultdict

BRANK_DIR = os.path.dirname(os.path.abspath(__file__))

# ── Tunable parameters ──
FREQUENCY_THRESHOLD = 300       # Strong's with >= this many occurrences are excluded
PROXIMITY_RADIUS = 500          # max word distance for proximity connections
PROXIMITY_POWER = 0.5           # decay exponent: 0.5=√, 1.0=linear, 0.3=gentle
PROXIMITY_WEIGHT_SHARE = 0.3    # fraction of PageRank from proximity (vs 0.7 from root/bridge)
PAGERANK_DAMPING = 0.85
PAGERANK_ITERATIONS = 20


def proximity_weight(distance):
    """Power-law decay for proximity between different words.
    
    distance=1:   1.00  (adjacent words)
    distance=5:   0.45  (same phrase)
    distance=15:  0.26  (same verse)
    distance=50:  0.14  (same paragraph)
    distance=200: 0.07  (same passage)
    distance=500: 0.04  (edge of radius)
    """
    if distance <= 0 or distance > PROXIMITY_RADIUS:
        return 0.0
    return 1.0 / (distance ** PROXIMITY_POWER)


def main():
    print("BibleRank v3 — Matrix + PageRank")
    print("=" * 60)
    t0 = time.time()

    # ══════════════════════════════════════════════════════════
    # LOAD + FILTER
    # ══════════════════════════════════════════════════════════
    print("\n[1/6] Loading and filtering words...")
    with open(os.path.join(BRANK_DIR, "word-list.json")) as f:
        word_list = json.load(f)

    strongs_count = defaultdict(int)
    for w in word_list:
        for s in w[4]:
            strongs_count[s] += 1

    content = {s for s, c in strongs_count.items() if 2 <= c < FREQUENCY_THRESHOLD}

    filtered = []
    for w in word_list:
        if not w[4]:
            continue
        if any(s in content for s in w[4]):
            filtered.append(w)

    N = len(filtered)
    matrix_gb = N * N / (1024**3)
    print(f"  Content words: {N:,}  Matrix: {matrix_gb:.1f} GB")

    # Build index structures
    strongs_groups = defaultdict(list)
    reduced_to_abs = []

    for ri, w in enumerate(filtered):
        abs_idx = w[0]
        reduced_to_abs.append(abs_idx)
        for s in w[4]:
            if s in content:
                strongs_groups[s].append(ri)

    abs_positions = np.array(reduced_to_abs, dtype=np.int64)

    # Save index
    words_data = [[w[1], w[2], w[3], w[4], w[5]] for w in filtered]
    index_data = {"count": N, "reduced_to_abs": reduced_to_abs, "words": words_data}
    with open(os.path.join(BRANK_DIR, "reduced-index.json"), "w") as f:
        json.dump(index_data, f)

    # ══════════════════════════════════════════════════════════
    # BUILD MATRIX — root matches + bridge only
    # ══════════════════════════════════════════════════════════
    print(f"\n[2/6] Creating matrix...")
    matrix_path = os.path.join(BRANK_DIR, "matrix.dat")
    matrix = np.memmap(matrix_path, dtype=np.uint8, mode='w+', shape=(N, N))

    # Layer 1: Same Strong's → flat IDF weight
    print(f"\n[3/6] Layer 1: Same-root connections...")
    t1 = time.time()
    pairs_l1 = 0

    for strongs_num, indices in strongs_groups.items():
        n = len(indices)
        if n < 2:
            continue
        idf = 1.0 / (1.0 + math.log(n))
        w8 = min(255, max(1, int(idf * 255)))

        for a in range(n):
            for b in range(a + 1, n):
                ri_a, ri_b = indices[a], indices[b]
                if w8 > matrix[ri_a, ri_b]:
                    matrix[ri_a, ri_b] = w8
                    matrix[ri_b, ri_a] = w8
                pairs_l1 += 1

    print(f"  {pairs_l1:,} pairs ({time.time()-t1:.1f}s)")

    # Layer 3: LXX bridge
    print(f"\n[4/6] Layer 3: LXX bridge...")
    t3 = time.time()
    pairs_l3 = 0

    bridge_path = os.path.join(BRANK_DIR, "lxx-bridge.json")
    if os.path.exists(bridge_path):
        with open(bridge_path) as f:
            bridge_raw = json.load(f)

        h_groups = defaultdict(list)
        g_groups = defaultdict(list)
        for ri in range(N):
            for s in words_data[ri][3]:
                if s.startswith('H') and s in content:
                    h_groups[s].append(ri)
                elif s.startswith('G') and s in content:
                    g_groups[s].append(ri)

        for h, g, cooccur in bridge_raw:
            if h not in h_groups or g not in g_groups:
                continue
            combined = len(h_groups[h]) + len(g_groups[g])
            idf = 1.0 / (1.0 + math.log(combined))
            conf = min(1.0, math.log(1 + cooccur) / math.log(100))
            w8 = min(255, max(1, int(conf * idf * 255)))

            for ri_h in h_groups[h]:
                for ri_g in g_groups[g]:
                    if w8 > matrix[ri_h, ri_g]:
                        matrix[ri_h, ri_g] = w8
                        matrix[ri_g, ri_h] = w8
                    pairs_l3 += 1

        print(f"  {pairs_l3:,} pairs ({time.time()-t3:.1f}s)")
    else:
        print("  lxx-bridge.json not found — skipping")

    matrix.flush()
    nonzero = np.count_nonzero(matrix)
    print(f"\n  Matrix built: {nonzero:,} non-zero entries")

    # ══════════════════════════════════════════════════════════
    # PAGERANK with live proximity
    # ══════════════════════════════════════════════════════════
    print(f"\n[5/6] PageRank ({PAGERANK_ITERATIONS} iterations, "
          f"damping={PAGERANK_DAMPING}, proximity_radius={PROXIMITY_RADIUS})...")

    # Build proximity neighbor list (sorted by position, for fast lookup)
    print("  Building proximity neighbor index...")
    sorted_indices = np.argsort(abs_positions)
    sorted_positions = abs_positions[sorted_indices]

    # For each word, find its neighbors within PROXIMITY_RADIUS
    # Store as list of (neighbor_ri, distance) for efficiency
    prox_neighbors = [[] for _ in range(N)]
    left = 0
    for right in range(N):
        ri_right = int(sorted_indices[right])
        pos_right = int(sorted_positions[right])

        while left < right and (pos_right - int(sorted_positions[left])) > PROXIMITY_RADIUS:
            left += 1

        for mid in range(left, right):
            ri_left = int(sorted_indices[mid])
            dist = pos_right - int(sorted_positions[mid])
            pw = proximity_weight(dist)
            if pw > 0:
                prox_neighbors[ri_right].append((ri_left, pw))
                prox_neighbors[ri_left].append((ri_right, pw))

    total_prox = sum(len(nb) for nb in prox_neighbors) // 2
    print(f"  Proximity pairs: {total_prox:,}")

    # Initialize ranks uniformly
    ranks = np.full(N, 1.0 / N, dtype=np.float64)
    new_ranks = np.zeros(N, dtype=np.float64)

    # Precompute matrix row sums for normalization
    print("  Running iterations...")

    for iteration in range(PAGERANK_ITERATIONS):
        t_iter = time.time()
        new_ranks[:] = (1.0 - PAGERANK_DAMPING) / N

        # Matrix contribution (root matches + bridge)
        for i in range(N):
            row = matrix[i, :]
            nonzero_idx = np.nonzero(row)[0]
            if len(nonzero_idx) > 0:
                weights = row[nonzero_idx].astype(np.float64) / 255.0
                contrib = np.sum(weights * ranks[nonzero_idx])
                root_share = 1.0 - PROXIMITY_WEIGHT_SHARE
                new_ranks[i] += PAGERANK_DAMPING * contrib * root_share

        # Proximity contribution (live computation)
        for i in range(N):
            prox_contrib = 0.0
            for j, pw in prox_neighbors[i]:
                prox_contrib += pw * ranks[j]
            new_ranks[i] += PAGERANK_DAMPING * prox_contrib * PROXIMITY_WEIGHT_SHARE

        # Normalize
        total = np.sum(new_ranks)
        if total > 0:
            new_ranks /= total

        # Check convergence
        diff = np.sum(np.abs(new_ranks - ranks))
        ranks[:] = new_ranks

        elapsed = time.time() - t_iter
        print(f"    Iteration {iteration+1:2}/{PAGERANK_ITERATIONS}: "
              f"diff={diff:.8f}  ({elapsed:.1f}s)")

        if diff < 1e-8:
            print(f"  Converged at iteration {iteration+1}")
            break

    # ══════════════════════════════════════════════════════════
    # RESULTS
    # ══════════════════════════════════════════════════════════
    print(f"\n[6/6] Results...")

    # Top ranked words overall
    top_indices = np.argsort(ranks)[-30:][::-1]
    print(f"\n  Top 30 highest-ranked words:")
    for ri in top_indices:
        w = words_data[ri]
        print(f"    rank={ranks[ri]:.8f}  {w[0]:30s} [{w[2]:15s}] {w[3]}  ({w[4]})")

    # Matthew 24 test
    print(f"\n{'=' * 60}")
    print("TEST: Highest-ranked words in Matthew 24:1-31")
    print(f"{'=' * 60}")

    matt24 = []
    for ri in range(N):
        ref = words_data[ri][0]
        if ref.startswith("Matthew 24:"):
            try:
                verse_num = int(ref.split(":")[1])
                if 1 <= verse_num <= 31:
                    matt24.append((ri, ranks[ri]))
            except:
                pass

    matt24.sort(key=lambda x: -x[1])
    for ri, rank in matt24[:25]:
        w = words_data[ri]
        # What are its top matrix connections?
        row = matrix[ri, :]
        top_conn = np.argsort(row)[-5:][::-1]
        conns = []
        for ci in top_conn:
            if row[ci] > 0:
                conns.append(f"{words_data[ci][0]}({row[ci]})")
        conn_str = ", ".join(conns[:3]) if conns else "none"
        print(f"  rank={rank:.8f}  {w[0]:20s} [{w[2]:12s}] {w[3]:12s}  → {conn_str}")

    total_time = time.time() - t0
    print(f"\nTotal time: {total_time:.1f}s")
    print("Done.")


if __name__ == "__main__":
    main()
