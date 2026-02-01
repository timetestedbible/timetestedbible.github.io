#!/usr/bin/env python3
"""
Audit TIPNR enrichment: compare enriched output to source data.
Classify each entry: NEW (AI/unique insight) vs REPACKAGED (Strong's/TIPNR only).
"""
import json
import re
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
HTTP_DIR = SCRIPT_DIR.parent
DATA_DIR = HTTP_DIR / "data"
TIPNR_PATH = DATA_DIR / "tipnr.json"
ENRICHED_PATH = DATA_DIR / "tipnr-enriched.json"
AI_PATH = DATA_DIR / "tipnr-ai-enrichment.json"


def normalize_key(key):
    if key[0] in ("H", "G") and len(key) > 1:
        num = key[1:].lstrip("0") or "0"
        return key[0] + num
    return key


def extract_js_object(filepath, var_name):
    text = filepath.read_text(encoding="utf-8", errors="replace")
    start_marker = f"var {var_name} = "
    idx = text.find(start_marker)
    if idx == -1:
        raise ValueError(f"Could not find {start_marker}")
    start = idx + len(start_marker)
    depth = 0
    i = start
    while i < len(text) and text[i] != "{":
        i += 1
    start = i
    depth = 1
    i = start + 1
    in_string = None
    escape = False
    while i < len(text) and depth > 0:
        c = text[i]
        if escape:
            escape = False
            i += 1
            continue
        if c == "\\" and in_string:
            escape = True
            i += 1
            continue
        if in_string:
            if c == in_string:
                in_string = None
            i += 1
            continue
        if c in ('"', "'"):
            in_string = c
            i += 1
            continue
        if c == "{":
            depth += 1
        elif c == "}":
            depth -= 1
        i += 1
    return json.loads(text[start:i])


def source_strongs_text(strongs_entry):
    """What Strong's contributed (derivation + def)."""
    if not strongs_entry:
        return ""
    d = (strongs_entry.get("derivation") or "").strip(" ;")
    s = (strongs_entry.get("strongs_def") or "").strip()
    return " ".join(filter(None, [d, s]))


def source_tipnr_text(entry):
    """What TIPNR contributed (b + d + first 100 chars of s)."""
    b = entry.get("b") or ""
    d = entry.get("d") or ""
    s = (entry.get("s") or "")[:100]
    return " ".join(filter(None, [b, d, s]))


def is_mostly_from_source(enriched_text, source_text):
    """True if enriched is mostly just source rephrased or prefixed."""
    if not enriched_text or not source_text:
        return False
    # Normalize: lowercase, collapse spaces
    e = re.sub(r"\s+", " ", enriched_text.lower().strip())
    s = re.sub(r"\s+", " ", source_text.lower().strip())
    # Remove common prefixes
    for prefix in ("name meaning:", "minor figure; name:", "from ", "meaning:", "significance:"):
        e = e.replace(prefix, "")
    # If >70% of source words appear in enriched in order, treat as repackaged
    s_words = s.split()
    e_clean = e
    if len(s_words) < 3:
        return s in e or e in s
    matches = 0
    pos = 0
    for w in s_words:
        if len(w) < 3:
            continue
        idx = e_clean.find(w, pos)
        if idx != -1:
            matches += 1
            pos = idx + len(w)
    return matches >= max(2, len([w for w in s_words if len(w) >= 3]) * 0.7)


def has_new_insight(meaning, significance, strongs_text, tipnr_text):
    """Check for typology, narrative, wordplay, extra etymology not in Strong's."""
    new_markers = [
        "type of", "typolog", "shadow", "symbol", "prophet", "priest", "king",
        "narrative", "ironic", "contrast", "name vs", "fits his role", "fits the",
        "warning", "example of", "represents", "backdrop", "occasion of",
        "federal head", "covenant", "deliverance", "mediator", "sacrifice",
        "persian", "egyptian", "wordplay", "same word", "echoes", "name and deed",
        "name and role", "name confesses", "name (", "name:", "—", " (Gen ", " (Ex ",
        " (1 Sam ", " (2 Sam ", " (1 Ki ", " (2 Ki ", " (Acts ", " (Heb ", " (Rom ",
    ]
    combined = (meaning or "") + " " + (significance or "")
    combined_lower = combined.lower()
    has_marker = any(m in combined_lower for m in new_markers)
    # Also: significantly longer than source = likely added content
    source_len = len(strongs_text) + len(tipnr_text)
    enriched_len = len(meaning or "") + len(significance or "")
    much_longer = enriched_len > source_len + 80
    return has_marker or much_longer


def main():
    print("Loading data...")
    tipnr = json.loads(TIPNR_PATH.read_text(encoding="utf-8"))
    enriched = json.loads(ENRICHED_PATH.read_text(encoding="utf-8"))
    ai_keys = set(json.loads(AI_PATH.read_text(encoding="utf-8")).keys()) if AI_PATH.exists() else set()

    strongs_h = extract_js_object(HTTP_DIR / "strongs-hebrew-dictionary.js", "strongsHebrewDictionary")
    strongs_g = extract_js_object(HTTP_DIR / "strongs-greek-dictionary.js", "strongsGreekDictionary")

    new_count = 0
    repackaged_count = 0
    ai_used = 0
    examples_new = []
    examples_repackaged = []

    for key, ent in enriched.items():
        tipnr_ent = tipnr.get(key, {})
        key_norm = normalize_key(key)
        strongs_ent = strongs_h.get(key_norm) if key.startswith("H") else strongs_g.get(key_norm)
        strongs_text = source_strongs_text(strongs_ent)
        tipnr_text = source_tipnr_text(tipnr_ent)
        meaning = ent.get("meaning") or ""
        significance = ent.get("significance") or ""

        in_ai = key in ai_keys
        if in_ai:
            ai_used += 1

        meaning_from_strongs = is_mostly_from_source(meaning, strongs_text)
        sig_from_strongs = is_mostly_from_source(significance, strongs_text)
        sig_from_tipnr = is_mostly_from_source(significance, tipnr_text)
        has_new = has_new_insight(meaning, significance, strongs_text, tipnr_text)

        if in_ai or has_new and not (meaning_from_strongs and sig_from_strongs):
            new_count += 1
            if len(examples_new) < 8:
                examples_new.append((key, tipnr_ent.get("n"), meaning[:80], significance[:80]))
        else:
            repackaged_count += 1
            if len(examples_repackaged) < 8:
                examples_repackaged.append((key, tipnr_ent.get("n"), meaning[:80], significance[:80]))

    total = len(enriched)
    print()
    print("=" * 60)
    print("TIPNR ENRICHMENT AUDIT")
    print("=" * 60)
    print(f"Total entries:        {total}")
    print(f"In AI file:           {len(ai_keys)} (merged into enriched)")
    print()
    print("Classification (heuristic):")
    print(f"  NEW / unique info:  {new_count}  ({100*new_count/total:.1f}%)")
    print(f"  REPACKAGED:         {repackaged_count}  ({100*repackaged_count/total:.1f}%)")
    print()
    print("Examples of NEW (AI or added insight):")
    for key, name, m, s in examples_new:
        print(f"  {key} {name}")
        print(f"    meaning:      {m}...")
        print(f"    significance: {s}...")
        print()
    print("Examples of REPACKAGED (Strong's/TIPNR only):")
    for key, name, m, s in examples_repackaged:
        print(f"  {key} {name}")
        print(f"    meaning:      {m}...")
        print(f"    significance: {s}...")
        print()
    print("=" * 60)
    print("Conclusion: Most entries are REPACKAGED (meaning/significance from Strong's).")
    print("Only entries in tipnr-ai-enrichment.json (or with typology/narrative markers) add NEW info.")
    print("To add more unique insight, expand tipnr-ai-enrichment.json with AI-generated content.")
    print("=" * 60)


if __name__ == "__main__":
    main()
