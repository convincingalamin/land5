#!/usr/bin/env python3
"""
tools/i18n/build_dict.py : builds assets/i18n/en-dict.js from the translation sources in this folder.

  translations.json : { "<Bengali text as it appears on the page>": "<English>" }
  extra.json        : more exact-match entries (messages created by JavaScript)
  words.json        : [["<Bengali word>", "<English word>"], ...] word-level fallback for number-heavy text

A value that contains {n} means "the numbers of the Bengali text, in the same order" (so one entry covers
"28 decimal", "33 decimal" ...). Run:  python tools/i18n/build_dict.py
"""
import json, re, os
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "..", "..", "assets", "i18n", "en-dict.js")
NUM = r"[০-৯0-9]+(?:,[০-৯0-9]{2,3})*(?:\.[০-৯0-9]+)?"
load = lambda n, d: json.load(open(os.path.join(HERE, n), encoding="utf8")) if os.path.exists(os.path.join(HERE, n)) else d
tr, extra, words = load("translations.json", {}), load("extra.json", {}), load("words.json", [])
out = {}
for k, v in tr.items():
    out[re.sub(NUM, "{n}", k) if "{n}" in v else re.sub(r"\s+", " ", k).strip()] = v
out.update(extra)
words.sort(key=lambda w: -len(w[0]))
open(OUT, "w", encoding="utf8").write("window.EN=%s;\nwindow.ENW=%s;\n" % (json.dumps(out, ensure_ascii=False), json.dumps(words, ensure_ascii=False)))
print("entries:", len(out), "words:", len(words))
