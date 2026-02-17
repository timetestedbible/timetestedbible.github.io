#!/usr/bin/env python3
"""
Build PageRank scores for symbol studies based on cross-reference links.

Reads all _symbols/*.md files, extracts $symbol-key references, builds a link
graph, and runs PageRank (15 iterations, damping=0.85). Outputs ranked results
to _data/symbol_ranks.yml for use in the Jekyll landing page.

Usage:
    python3 pipeline/build-symbol-ranks.py

Run this after adding, removing, or significantly editing symbol studies.
"""

import os
import re

SYMBOLS_DIR = '_symbols'
OUTPUT_FILE = '_data/symbol_ranks.yml'

def main():
    # Build link graph
    studies = {}
    for f in sorted(os.listdir(SYMBOLS_DIR)):
        if not f.endswith('.md') or f.startswith('_'):
            continue
        key = f[:-3]
        path = os.path.join(SYMBOLS_DIR, f)
        with open(path) as fh:
            text = fh.read()
        refs = set(re.findall(r'\$([a-z][a-z0-9-]*)', text))
        refs.discard(key)  # no self-links
        studies[key] = refs

    keys = sorted(studies.keys())
    n = len(keys)

    # Build inbound map
    inbound = {k: set() for k in keys}
    for src, refs in studies.items():
        for dst in refs:
            if dst in inbound:
                inbound[dst].add(src)

    # PageRank (15 iterations, damping=0.85)
    d = 0.85
    scores = {k: 1.0 / n for k in keys}
    for _ in range(15):
        new_scores = {}
        for k in keys:
            rank = (1 - d) / n
            for src in inbound[k]:
                out_count = len(studies[src]) or 1
                rank += d * scores[src] / out_count
            new_scores[k] = rank
        scores = new_scores

    # Sort by score descending
    ranked = sorted(scores.items(), key=lambda x: -x[1])

    # Write YAML
    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
    with open(OUTPUT_FILE, 'w') as f:
        for key, score in ranked:
            inb = len(inbound[key])
            f.write(f'- key: {key}\n  score: {round(score * 10000, 1)}\n  inbound: {inb}\n')

    print(f'[symbol-ranks] Wrote {len(ranked)} entries to {OUTPUT_FILE}')
    print(f'[symbol-ranks] Top 10:')
    for key, score in ranked[:10]:
        inb = len(inbound[key])
        print(f'  {key:30s}  score={round(score*10000,1):6.1f}  inbound={inb}')

if __name__ == '__main__':
    main()
