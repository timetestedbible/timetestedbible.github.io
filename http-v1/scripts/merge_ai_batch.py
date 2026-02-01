#!/usr/bin/env python3
"""Merge a batch JSON file into tipnr-ai-enrichment.json."""
import json
from pathlib import Path

DATA = Path(__file__).resolve().parent.parent / "data"
AI_FILE = DATA / "tipnr-ai-enrichment.json"

def main():
    import sys
    if len(sys.argv) < 2:
        print("Usage: python merge_ai_batch.py <batch.json> [batch2.json ...]")
        return
    ai = {}
    if AI_FILE.exists():
        ai = json.loads(AI_FILE.read_text(encoding="utf-8"))
    for path in sys.argv[1:]:
        p = Path(path)
        if not p.is_absolute():
            p = DATA / path
        if not p.exists():
            print("Skip (not found):", p)
            continue
        batch = json.loads(p.read_text(encoding="utf-8"))
        for k, v in batch.items():
            if isinstance(v, dict) and (v.get("meaning") or v.get("significance")):
                ai[k] = {**ai.get(k, {}), **v}
        print("Merged", len(batch), "from", p.name)
    AI_FILE.write_text(json.dumps(ai, indent=2, ensure_ascii=False), encoding="utf-8")
    print("Wrote", len(ai), "entries to", AI_FILE.name)

if __name__ == "__main__":
    main()
