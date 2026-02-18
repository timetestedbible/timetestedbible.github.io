#!/usr/bin/env python3
"""Generate processed James chapter JSON files."""
import json
import sys
import os

OUTPUT_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data', 'hg-chapters')

def write_chapter(filename, data):
    path = os.path.join(OUTPUT_DIR, filename)
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"Wrote {path} ({len(data['verses'])} verses)")

if __name__ == '__main__':
    print("Use write-james-N.py scripts to generate individual chapters")
