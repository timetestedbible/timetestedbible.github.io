#!/usr/bin/env python3
import json, sys, os
sys.path.insert(0, os.path.dirname(__file__))

ch = {"book":"Mark","chapter":12,"source":"Marqu - The Hebrew Gospel of Mark v1.2","verses":[],"chapter_notes":{"summary":"Mark 12 in Hebrew contains several critical one-way translation markers. The most significant are: (1) \u05d0\u05d8\u05d3\u05d9\u05dd ('thorns,' v1) vs. Greek 'fence' \u2014 the vineyard enclosed with thorns that foreshadow the son's crown of thorns, using the OT word from Judges 9:14-15; (2) \u05e2\u05d5\u05d1\u05d3\u05d9 \u05d0\u05d3\u05de\u05d4 ('workers of the ground,' v1) echoing Genesis 2-3's adam/adamah pattern; (3) \u05ea\u05de\u05d5\u05e0\u05d4 ('image,' v16) \u2014 the Second Commandment word, framing Caesar's coin as idolatry; (4) \u05d0\u05de\u05e8 \u05d4\u05d0\u05d3\u05d5\u05df \u05dc\u05d0\u05d3\u05d5\u05e0\u05d9 ('The Lord said to my lord,' v36) \u2014 Psalm 110:1 preserving the distinction between YHWH (\u05d4\u05d0\u05d3\u05d5\u05df) and the messianic lord (\u05d0\u05d3\u05d5\u05e0\u05d9), invisible in Greek; (5) \u05e7\u05e8\u05d1\u05df \u05d0\u05e0\u05d5\u05e9\u05d9 ('human offering,' v33); (6) \u05d0\u05e8\u05d5\u05df \u05d4\u05d0\u05d5\u05e6\u05e8 ('treasury ark,' v41) connecting to the Ark of the Covenant; (7) \u05e4\u05e8\u05d5\u05d8\u05d5\u05ea ('perutot,' v42) using Jewish coins with no Roman equivalent."}}

def V(n,t,w,oh=[],gd=[],tn=[],tx=[]):
    ch["verses"].append({"verse":n,"translation":t,"words":w,"notes":{"one_way_hebrew":list(oh),"greek_deviations":list(gd),"translation_notes":list(tn),"textual_notes":list(tx)}})
