#!/usr/bin/env python3
"""
BibleRank — Query: What verses connect most strongly to a given verse?

Aggregates matrix connections for all words in a source verse,
ranks target verses by total connection weight.

This is the filter that produces input for AI evaluation.

Usage: python3 brank/query-verse.py "Matthew 24:6" "Matthew 24:7" "Matthew 24:8"
"""

import json
import os
import sys
import math
import numpy as np
from collections import defaultdict

BRANK_DIR = os.path.dirname(os.path.abspath(__file__))


def main():
    query_refs = sys.argv[1:] if len(sys.argv) > 1 else ["Matthew 24:6", "Matthew 24:7", "Matthew 24:8"]
    
    print(f"BibleRank — Verse Query")
    print(f"  Query: {', '.join(query_refs)}")
    print("=" * 60)
    
    # Load index
    with open(os.path.join(BRANK_DIR, "reduced-index.json")) as f:
        index_data = json.load(f)
    
    N = index_data["count"]
    words = index_data["words"]  # [ref, wordIdx, root, strongs, lang]
    
    # Open matrix
    matrix = np.memmap(os.path.join(BRANK_DIR, "matrix.dat"),
                       dtype=np.uint8, mode='r', shape=(N, N))
    
    # Find all words in query verses
    query_indices = []
    for ri in range(N):
        if words[ri][0] in query_refs:
            query_indices.append(ri)
    
    print(f"  Query words found: {len(query_indices)}")
    for ri in query_indices:
        w = words[ri]
        print(f"    [{ri}] {w[0]} w{w[1]} {w[2]} {w[3]} ({w[4]})")
    
    # ── Compute query-word IDF ──
    # Rare query words are more specific signals than common ones.
    # Count how many words in the matrix share each query word's Strong's.
    query_word_idf = {}
    for ri in query_indices:
        strongs_list = words[ri][3]
        # Count total matrix words with any of these Strong's
        total = 0
        for s in strongs_list:
            total += sum(1 for j in range(N) if s in words[j][3])
        # IDF: rarer = higher weight
        if total > 0:
            query_word_idf[ri] = 1.0 / (1.0 + math.log(total))
        else:
            query_word_idf[ri] = 0.0
    
    # Faster: use strongs_count from matrix words
    strongs_in_matrix = defaultdict(int)
    for ri_w in range(N):
        for s in words[ri_w][3]:
            strongs_in_matrix[s] += 1
    
    # Recompute IDF properly
    for ri in query_indices:
        total = sum(strongs_in_matrix.get(s, 0) for s in words[ri][3])
        query_word_idf[ri] = 1.0 / (1.0 + math.log(max(1, total)))
    
    print(f"\n  Query word IDF weights:")
    for ri in query_indices:
        w = words[ri]
        total = sum(strongs_in_matrix.get(s, 0) for s in w[3])
        print(f"    idf={query_word_idf[ri]:.3f} (freq={total:4})  {w[0]} [{w[2]}] {w[3]}")
    
    # ── Score target verses ──
    # For each target verse, track:
    #   - IDF-weighted connection score
    #   - Number of DISTINCT query Strong's that connect (breadth)
    #   - Combined score = breadth_bonus × idf_weighted_sum
    
    verse_idf_score = defaultdict(float)
    verse_strongs_matched = defaultdict(set)  # which query Strong's matched
    verse_details = defaultdict(list)
    
    for ri in query_indices:
        row = matrix[ri, :]
        q_strongs_set = set(words[ri][3])
        idf = query_word_idf[ri]
        
        nonzero = np.nonzero(row)[0]
        for ti in nonzero:
            weight = float(row[ti]) / 255.0  # normalize to 0-1
            t_ref = words[ti][0]
            
            if t_ref in query_refs:
                continue
            
            # IDF-weighted score
            verse_idf_score[t_ref] += weight * idf
            
            # Track distinct Strong's matched
            for s in q_strongs_set:
                verse_strongs_matched[t_ref].add(s)
            
            if weight >= 0.04:  # ~10/255
                verse_details[t_ref].append({
                    'q': f"[{words[ri][2]}] {words[ri][3]}",
                    't': f"[{words[ti][2]}] {words[ti][3]}",
                    'w': weight,
                    'idf': idf
                })
    
    # Combined score: IDF-weighted sum × breadth bonus
    # Breadth bonus: matching on 4 distinct concepts is much better than 1 concept 4 times
    verse_scores = {}
    for ref in verse_idf_score:
        breadth = len(verse_strongs_matched[ref])
        idf_sum = verse_idf_score[ref]
        # Breadth bonus: linear scaling — 2 matches = 2x, 3 matches = 3x
        verse_scores[ref] = idf_sum * breadth
    
    ranked = sorted(verse_scores.items(), key=lambda x: -x[1])
    
    print(f"\n  Total connected verses: {len(ranked):,}")
    
    # Show top 50
    print(f"\n{'=' * 60}")
    print(f"TOP 50 MOST CONNECTED VERSES")
    print(f"{'=' * 60}")
    
    NT_BOOKS = {'Matthew','Mark','Luke','John','Acts','Romans',
        '1 Corinthians','2 Corinthians','Galatians','Ephesians',
        'Philippians','Colossians','1 Thessalonians','2 Thessalonians',
        '1 Timothy','2 Timothy','Titus','Philemon','Hebrews',
        'James','1 Peter','2 Peter','1 John','2 John','3 John',
        'Jude','Revelation'}
    
    for i, (ref, score) in enumerate(ranked[:50]):
        book = ref.rsplit(' ', 1)[0]
        is_ot = book not in NT_BOOKS
        ot_marker = " ★ OT" if is_ot else ""
        breadth = len(verse_strongs_matched.get(ref, set()))
        idf_raw = verse_idf_score.get(ref, 0)
        
        details = verse_details.get(ref, [])
        detail_str = ""
        if details:
            top_details = sorted(details, key=lambda d: -(d['w'] * d['idf']))[:3]
            detail_str = " | ".join(
                f"{d['q']}→{d['t']} ({d['w']:.2f}×{d['idf']:.2f})" 
                for d in top_details)
        
        print(f"  {i+1:3}. score={score:.4f}  breadth={breadth}  {ref:30s}{ot_marker}")
        if detail_str:
            print(f"       {detail_str}")
    
    # Specifically check for our target verses
    print(f"\n{'=' * 60}")
    print(f"BABYLON TEST — Are these in the top 50?")
    print(f"{'=' * 60}")
    
    targets = [
        "Jeremiah 50:43", "Jeremiah 50:46", "Jeremiah 51:29",
        "Jeremiah 51:45", "Jeremiah 51:46",
        "Isaiah 13:8", "Isaiah 13:9", "Isaiah 13:10", "Isaiah 13:13",
        "Jeremiah 30:6", "Jeremiah 30:7",
        "2 Chronicles 15:6",
    ]
    
    for target in targets:
        if target in verse_scores:
            rank = next(i+1 for i, (r, _) in enumerate(ranked) if r == target)
            breadth = len(verse_strongs_matched.get(target, set()))
            print(f"  {'✓' if rank <= 100 else '✗'} {target:25s}  "
                  f"score={verse_scores[target]:.4f}  breadth={breadth}  rank={rank}")
        else:
            print(f"  ✗ {target:25s}  NOT CONNECTED")
    
    print("\nDone.")


if __name__ == "__main__":
    main()
