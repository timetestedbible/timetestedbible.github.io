#!/usr/bin/env python3
"""
Merge Hitchcock's Names List (NamesList.txt) into TIPNR enrichment.
Only adds/merges where Hitchcock provides unique or additive value.
Output: updates tipnr-ai-enrichment.json with merged meanings (union).
"""
import json
import re
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
HTTP_DIR = SCRIPT_DIR.parent
DATA_DIR = HTTP_DIR / "data"
FACTS_DIR = HTTP_DIR / "facts"
NAMES_LIST_PATH = FACTS_DIR / "NamesList.txt"
TIPNR_PATH = DATA_DIR / "tipnr.json"
AI_ENRICHMENT_PATH = DATA_DIR / "tipnr-ai-enrichment.json"
OUT_PATH = DATA_DIR / "tipnr-ai-enrichment.json"


def parse_names_list(path: Path) -> dict[str, list[str]]:
    """Parse NamesList.txt into name -> list of meaning strings (some names appear twice)."""
    text = path.read_text(encoding="utf-8", errors="replace")
    # Line format: "Name, meaning1; meaning2" or "Name, meaning"
    # Skip header, ---, single letters, page numbers
    name_to_meanings: dict[str, list[str]] = {}
    for line in text.splitlines():
        line = line.strip()
        if not line or line == "---" or re.match(r"^[A-Z]$", line) or line.isdigit():
            continue
        if "Biblical Names" in line or "HITCHCOCK" in line or "This dictionary" in line:
            continue
        if line.startswith("--") or "published" in line or "copyright" in line:
            continue
        # Must have comma: "Name, meaning"
        if "," not in line:
            continue
        name_part, _, meaning_part = line.partition(",")
        name = name_part.strip()
        meaning = meaning_part.strip()
        if not name or not meaning:
            continue
        # Normalize name: strip "or X" suffix sometimes present
        if " or " in name and " " in name:
            name = name.split(" or ")[0].strip()
        if name not in name_to_meanings:
            name_to_meanings[name] = []
        name_to_meanings[name].append(meaning)
    return name_to_meanings


def normalize_name_for_match(s: str) -> str:
    """Lowercase, strip parenthetical/prefix for matching."""
    s = s.lower().strip()
    # Strip "father_of_", "mother_of_", "daughter_of_", "son_of_" etc. for matching
    for prefix in ("father_of_", "mother_of_", "daughter_of_", "son_of_", "father_of ", "mother_of "):
        if s.startswith(prefix):
            s = s[len(prefix):].strip()
    return s


def main():
    if not NAMES_LIST_PATH.exists():
        print(f"Names list not found: {NAMES_LIST_PATH}")
        return
    print("Parsing NamesList.txt...")
    hitchcock = parse_names_list(NAMES_LIST_PATH)
    # Collapse multiple meanings per name into one string
    hitchcock_flat = {}
    for name, meanings in hitchcock.items():
        combined = " ".join(meanings) if len(meanings) == 1 else " | ".join(meanings)
        hitchcock_flat[name] = combined
    print(f"  Loaded {len(hitchcock_flat)} names from Hitchcock")

    print("Loading TIPNR...")
    tipnr = json.loads(TIPNR_PATH.read_text(encoding="utf-8"))
    # Build: normalized_name -> list of (tipnr_key, display_name)
    name_to_keys: dict[str, list[tuple[str, str]]] = {}
    for key, entry in tipnr.items():
        n = entry.get("n", "")
        if not n:
            continue
        norm = normalize_name_for_match(n)
        if norm not in name_to_keys:
            name_to_keys[norm] = []
        name_to_keys[norm].append((key, n))
    # Also map exact display name (e.g. "Aaron") for exact match
    for key, entry in tipnr.items():
        n = entry.get("n", "")
        if not n:
            continue
        if n not in name_to_keys:
            name_to_keys[n] = []
        if (key, n) not in name_to_keys[n]:
            name_to_keys[n].append((key, n))

    print("Loading AI enrichment...")
    ai = json.loads(AI_ENRICHMENT_PATH.read_text(encoding="utf-8"))

    updated = 0
    added_new = 0
    for hitch_name, hitch_meaning in hitchcock_flat.items():
        norm = normalize_name_for_match(hitch_name)
        keys_candidates = name_to_keys.get(norm) or name_to_keys.get(hitch_name)
        if not keys_candidates:
            continue
        for tipnr_key, display_name in keys_candidates:
            if tipnr_key not in ai:
                ai[tipnr_key] = {}
            current = ai[tipnr_key]
            current_meaning = (current.get("meaning") or "").strip()
            current_sig = (current.get("significance") or "").strip()
            # Additive: add Hitchcock if not already subsumed
            if not hitch_meaning or len(hitch_meaning) < 3:
                continue
            # Skip if current meaning already contains this Hitchcock text
            if hitch_meaning in current_meaning:
                continue
            # Prefer exact display name match when multiple TIPNR entries share similar norm (e.g. two Abels)
            if current_meaning and "Hitchcock" in current_meaning:
                continue  # already merged
            new_meaning = current_meaning
            if new_meaning:
                new_meaning = new_meaning.rstrip()
                if not new_meaning.endswith("."):
                    new_meaning += "."
                new_meaning += " Hitchcock: " + hitch_meaning
            else:
                new_meaning = "Hitchcock: " + hitch_meaning
                added_new += 1
            ai[tipnr_key]["meaning"] = new_meaning
            updated += 1

    print(f"Updated {updated} entries ({added_new} meaning-only adds)")
    OUT_PATH.write_text(json.dumps(ai, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"Wrote {OUT_PATH}")


if __name__ == "__main__":
    main()
