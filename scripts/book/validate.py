"""Cross-check the extraction: (1) same letters per page as xpdf's pdftotext, (2) no field text lost,
(3) words unknown to the clean authoring corpus (final_script.md + current site)."""
import json
import os
import re
import subprocess
import sys
from collections import Counter

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import pymupdf as fitz  # noqa: E402
from booklayout import skel  # noqa: E402
from pdftext import page_runs  # noqa: E402

pdf, methods_json, corpus_files = sys.argv[1], sys.argv[2], sys.argv[3:]
doc = fitz.open(pdf)

bad = 0
for pno in range(3, 107):
    mine = Counter(skel("".join(r.text for r in page_runs(doc, doc[pno - 1]))))
    ref = subprocess.run(["pdftotext", "-enc", "UTF-8", "-f", str(pno), "-l", str(pno), pdf, "-"], capture_output=True).stdout.decode("utf-8", "ignore")
    ref = Counter(skel(ref))
    if mine != ref:
        bad += 1
        diff = {k: mine[k] - ref[k] for k in set(mine) | set(ref) if mine[k] != ref[k]}
        print(f"page {pno}: letter diff (mine - xpdf) {diff}")
print(f"[1] pages whose letters differ from xpdf: {bad} / 104")

methods = json.load(open(methods_json, encoding="utf-8"))


def all_text(m):
    parts = [m["title"], m["tagline"], *m["stats"].values(), m["why"], *m["facts"], *m["earn"], *m["tips"], *m["warnings"], m["summary"]]
    for s in m["steps"]:
        parts += [s["label"] or "", s["text"]]
    return " ".join(parts)


lost = 0
for m in methods:
    n = m["n"]
    page_letters = Counter()
    for p in (2 * n, 2 * n + 1):
        page_letters += Counter(skel("".join(r.text for r in page_runs(doc, doc[p]))))
    got = Counter(skel(all_text(m)))
    missing = sum((page_letters - got).values())
    extra = sum((got - page_letters).values())
    # headings, labels, page numbers and the running header are expected leftovers
    if extra or missing > 260:
        lost += 1
        print(f"#{n:02d}: letters not in any field={missing}, letters not on page={extra}")
print(f"[2] methods with suspicious leftovers: {lost}")

corpus = ""
for f in corpus_files:
    corpus += open(f, encoding="utf-8").read() + "\n"
corpus = re.sub(r"<[^>]+>", " ", corpus)
norm = lambda w: re.sub(r"[أإآ]", "ا", skel(w))
vocab = {norm(w) for w in re.findall(r"[ء-ْٰ]+", corpus)}
unknown = Counter()
where = {}
for m in methods:
    for w in re.findall(r"[ء-ْٰ]+", all_text(m)):
        k = norm(w)
        if len(k) > 1 and k not in vocab:
            unknown[w] += 1
            where.setdefault(w, m["n"])
print(f"[3] words not in the authoring corpus: {len(unknown)} distinct")
print(" ".join(f"{w}(#{where[w]})" for w, _ in unknown.most_common(400)))
single = Counter()
for m in methods:
    for w in re.findall(r"(?<![ء-ْ])[ء-ي][ً-ْ]*(?![ء-ْ])", all_text(m)):
        single[w] += 1
print("[4] single-letter tokens:", dict(single))
odd = [f"#{m['n']}" for m in methods if re.search(r"[)\]»][(\[«]|\(\s*\)|[ً-ْ]{3,}|\s[ً-ْ]", all_text(m))]
print("[5] methods with odd punctuation/diacritic patterns:", odd)
