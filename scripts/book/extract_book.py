"""Extract the 52 methods (text + illustration) from the book PDF.

usage: extract_book.py <book.pdf> <out.json> [<images_dir>]
"""
import json
import os
import re
import sys
from collections import Counter

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import pymupdf as fitz  # noqa: E402
from booklayout import build_lines, is_light, is_marker, skel  # noqa: E402
from pdftext import page_runs  # noqa: E402

END = re.compile(r"[.!؟…»)]$")
STAT_LABELS = {"الدخلالمتوقع": "income", "رأسالمال": "capital", "أولريالخلال": "firstRiyal"}
SKIP = ("قصصنجاحواقعية", "رمزQR")


def find(lines, prefix):
    for ln in lines:
        if skel(ln.text).startswith(prefix):
            return ln
    return None


def join(lines):
    return " ".join(l.text for l in lines).strip()


def paragraphs(lines, bold_fonts=()):
    """Split consecutive lines into items: an item ends on a full stop, and the next one
    starts with a bold label, after a short last line, or after extra leading."""
    if not lines:
        return []
    lines = sorted(lines, key=lambda l: l.y)
    gaps = [b.y - a.y for a, b in zip(lines, lines[1:])]
    base = min(gaps) if gaps else 0
    left = min(l.x0 for l in lines)
    items = [[lines[0]]]
    for prev, ln, gap in zip(lines, lines[1:], gaps):
        ended = bool(END.search(prev.text))
        short = prev.x0 > left + 12
        bold = ln.lead_font in bold_fonts
        if bold or (ended and (short or gap > base + 1.5)):
            items.append([ln])
        else:
            items[-1].append(ln)
    return [join(i) for i in items]


def by_markers(lines, markers):
    """Numbered items: every line belongs to the closest numeral at or above it."""
    markers = sorted(markers, key=lambda m: m.y)
    out = {int(m.text): [] for m in markers}
    orphans = []
    for ln in sorted(lines, key=lambda l: l.y):
        owner = None
        for m in markers:
            if m.y - 6 <= ln.y:
                owner = m
        if owner is None:
            orphans.append(ln)
        else:
            out[int(owner.text)].append(ln)
    return out, orphans


def region_bold_fonts(lines):
    """The regular face carries most of the Arabic text; any other face that opens a line is a bold label."""
    c = Counter()
    for l in lines:
        for r in l.runs:
            if re.search(r"[ء-ي]", r.text):
                c[r.font] += len(r.text)
    if len(c) < 2:
        return ()
    main = c.most_common(1)[0][0]
    return tuple({l.lead_font for l in lines if l.lead_font and l.lead_font != main})


def split_label(text):
    """'الأدوات (التكلفة: 0–300 ريال): جوالك…' -> (label, rest)."""
    depth = 0
    for i, ch in enumerate(text):
        if ch in "(«":
            depth += 1
        elif ch in ")»":
            depth = max(0, depth - 1)
        elif ch == ":" and depth == 0:
            label, rest = text[:i].strip(), text[i + 1 :].strip()
            if 0 < len(label) <= 60 and rest:
                return label, rest
            break
    return None, text


def parse_method(doc, n, warn):
    odd, even = doc[2 * n], doc[2 * n + 1]
    m = {"n": n}

    # ---------- first page ----------
    runs = page_runs(doc, odd)
    markers = [r for r in runs if is_marker(r)]
    dark = [r for r in runs if not is_marker(r) and not is_light(r.color)]
    lines = build_lines(dark)
    h_why, h_num, h_start = find(lines, "ليشهذيالفرصة"), find(lines, "بعضالأرقام"), find(lines, "منأينتبدأ")
    labels = [l for l in lines if skel(l.text) in STAT_LABELS]
    if not (h_why and h_num and h_start and len(labels) == 3):
        warn(n, "missing anchors on first page")
        return m
    top = min(l.y for l in labels)
    m["title"] = join([l for l in lines if l.y < top and l.size >= 18])
    m["tagline"] = join([l for l in lines if l.y < top and 12 <= l.size < 18]).strip("«» ")

    # stat boxes sit side by side: assign runs to the box whose label they are right-aligned under
    edges = sorted(l.x1 for l in labels)
    stats = {}
    for lab in labels:
        k = edges.index(lab.x1)
        lo = edges[k - 1] + 4 if k else -1e9
        box = [r for r in dark if lab.y + 4 < r.y < h_why.y - 6 and lo < r.x1 <= lab.x1 + 6]
        stats[STAT_LABELS[skel(lab.text)]] = join(build_lines(box, split_gap=1e9))
    m["stats"] = stats

    body = [l for l in lines if l.size < 12]
    m["why"] = join([l for l in body if h_why.y < l.y < h_num.y])
    m["facts"] = paragraphs([l for l in body if h_num.y < l.y < h_start.y])
    step_lines = [l for l in body if l.y > h_start.y and not l.text.isdigit()]
    steps, orphans = by_markers(step_lines, markers)
    if orphans:
        warn(n, f"{len(orphans)} step lines above the first numeral")
    bold = set(region_bold_fonts(step_lines))

    # ---------- second page ----------
    runs = page_runs(doc, even)
    markers = [r for r in runs if is_marker(r)]
    dark = [r for r in runs if not is_marker(r) and not is_light(r.color)]
    light = [r for r in runs if not is_marker(r) and is_light(r.color)]
    lines = [l for l in build_lines(dark) if l.y > 15 and not l.text.isdigit() and not any(s in skel(l.text) for s in SKIP)]
    llines = build_lines(light)
    h_earn, h_tips = find(lines, "كمتكسب"), find(llines, "كيفتتمي")
    if not (h_earn and h_tips):
        warn(n, "missing anchors on second page")
        return m

    cont = [l for l in lines if l.y < h_earn.y - 5]
    more, orphans = by_markers(cont, [k for k in markers if k.y < h_earn.y - 5])
    bold |= set(region_bold_fonts(cont))
    last = max(steps) if steps else None
    if orphans and last is not None:
        steps[last].extend(orphans)  # a step that runs over the page break
    for k, v in more.items():
        steps.setdefault(k, []).extend(v)
    m["steps"] = []
    for k in sorted(steps):
        text = join(steps[k])
        label, rest = split_label(text) if steps[k] and steps[k][0].lead_font in bold else (None, text)
        m["steps"].append({"n": k, "label": label, "text": rest})
    if [s["n"] for s in m["steps"]] != list(range(1, len(m["steps"]) + 1)):
        warn(n, f"step numbers {[s['n'] for s in m['steps']]}")

    earn_lines = [l for l in lines if h_earn.y < l.y < h_tips.y - 4]
    earn = paragraphs(earn_lines, region_bold_fonts(earn_lines))
    m["earn"] = [e for e in earn if not re.fullmatch(r"\[.*\]", e)]
    if len(m["earn"]) != len(earn):
        warn(n, "placeholder left in the «كم تكسب؟» box: " + " | ".join(earn))

    tip_lines = [l for l in llines if l.y > h_tips.y + 4 and l.size > 8.5 and not l.text.isdigit() and skel(l.text) not in ("انتبه", "الخلاصة")]
    tips, orphans = by_markers(tip_lines, [k for k in markers if k.y > h_tips.y])
    if orphans:
        warn(n, "tip lines above the first numeral")
    m["tips"] = [join(tips[k]) for k in sorted(tips)]

    tail = sorted([l for l in lines if l.y > (max(l.y for l in tip_lines) if tip_lines else h_tips.y)], key=lambda l: l.y)
    cut = max(range(1, len(tail)), key=lambda i: tail[i].y - tail[i - 1].y) if len(tail) > 1 else len(tail)
    warn_lines, sum_lines = tail[:cut], tail[cut:]
    m["warnings"] = paragraphs(warn_lines, region_bold_fonts(warn_lines))
    m["summary"] = join(sum_lines)
    return m


def save_image(doc, page, path):
    imgs = page.get_images(full=True)
    if not imgs:
        return False
    xref, smask = imgs[0][0], imgs[0][1]
    pix = fitz.Pixmap(doc, xref)
    if pix.colorspace and pix.colorspace.n != 3:
        pix = fitz.Pixmap(fitz.csRGB, pix)
    if smask:
        pix = fitz.Pixmap(pix, fitz.Pixmap(doc, smask))
    pix.save(path)
    return True


def main():
    pdf, out = sys.argv[1], sys.argv[2]
    img_dir = sys.argv[3] if len(sys.argv) > 3 else None
    doc = fitz.open(pdf)
    notes = []
    warn = lambda n, msg: notes.append(f"#{n:02d}: {msg}")
    methods = []
    for n in range(1, 53):
        m = parse_method(doc, n, warn)
        methods.append(m)
        if img_dir:
            os.makedirs(img_dir, exist_ok=True)
            if not save_image(doc, doc[2 * n], os.path.join(img_dir, f"{n:02d}.png")):
                warn(n, "no illustration")
    with open(out, "w", encoding="utf-8") as f:
        json.dump(methods, f, ensure_ascii=False, indent=1)
    print(f"wrote {len(methods)} methods -> {out}")
    print("n  facts steps earn tips warn | title | tagline")
    for m in methods:
        print(
            f"{m['n']:2d}  {len(m.get('facts', [])):3d}  {len(m.get('steps', [])):3d}  {len(m.get('earn', [])):3d}  {len(m.get('tips', [])):3d}  {len(m.get('warnings', [])):3d}"
            f" | {m.get('title', '?')} | {m.get('tagline', '')} | {' / '.join(m.get('stats', {}).values())}"
        )
    print("\nNOTES:")
    print("\n".join(notes) or "none")


if __name__ == "__main__":
    main()
