"""Turn positioned runs into logical-order lines (right-to-left paragraphs)."""
import re
from dataclasses import dataclass, field

AR = re.compile(r"[؀-ۿ]")
LAT = re.compile(r"[A-Za-z]")
DIG = re.compile(r"\d")
MIRROR = str.maketrans("()[]", ")(][")


def kind(run):
    t = run.text
    if AR.search(t):
        return "R"
    if LAT.search(t):
        return "L"
    if DIG.search(t):
        return "N"
    return "S"


def is_marker(run):
    return run.text.strip().isdigit() and run.size <= 8.2 and min(run.color) > 0.99


def is_light(color):
    return sum(color) / 3 > 0.8


@dataclass
class Line:
    y: float
    x0: float
    x1: float
    size: float
    color: tuple
    runs: list = field(default_factory=list)
    text: str = ""

    @property
    def lead_font(self):
        """Font of the first (rightmost) Arabic run: bold labels open a new item."""
        for r in sorted(self.runs, key=lambda r: -r.x1):
            if AR.search(r.text):
                return r.font
        return ""


def logical(runs):
    """Runs sorted by x (visual order) -> logical string for an RTL paragraph."""
    vis = sorted(runs, key=lambda r: (r.x0, r.x1))
    items = []  # (kind, logical text, visual text)
    prev = None
    for r in vis:
        if prev is not None:
            gap = r.x0 - prev.x1
            if gap > 0.12 * max(r.size, prev.size) and not prev.vis.endswith(" ") and not r.vis.startswith(" ") and prev.text.strip() and r.text.strip():
                items.append(("S", " ", " "))
        items.append((kind(r), r.text, r.vis))
        prev = r
    n = len(items)
    kinds = [k for k, _, _ in items]
    # digits and neutrals sitting between Latin runs read left-to-right with them
    lmask = [k == "L" for k in kinds]
    i = 0
    while i < n:
        if lmask[i]:
            j = i + 1
            while j < n and kinds[j] in ("S", "N"):
                j += 1
            if j < n and kinds[j] == "L":
                for k in range(i, j):
                    lmask[k] = True
            i = j
        else:
            i += 1
    out = []
    i = n - 1
    while i >= 0:
        if lmask[i]:
            j = i
            while j >= 0 and lmask[j]:
                j -= 1
            out.extend(v for _, _, v in items[j + 1 : i + 1])
            i = j
        else:
            k, t, _ = items[i]
            # brackets drawn in right-to-left context are stored as their mirrored glyph
            out.append(t if k == "L" else t.translate(MIRROR))
            i -= 1
    return "".join(out)


def build_lines(runs, split_gap=None):
    """Group runs into lines by baseline, splitting side-by-side boxes on wide gaps."""
    rows = []
    for r in sorted(runs, key=lambda r: r.y):
        if rows and abs(rows[-1][0] - r.y) <= 1.0:
            rows[-1][1].append(r)
        else:
            rows.append([r.y, [r]])
    lines = []
    for y, rs in rows:
        rs.sort(key=lambda r: r.x0)
        segs = [[rs[0]]]
        for r in rs[1:]:
            last = segs[-1][-1]
            limit = split_gap if split_gap is not None else max(16.0, 1.6 * max(r.size, last.size))
            if r.x0 - last.x1 > limit:
                segs.append([r])
            else:
                segs[-1].append(r)
        for seg in segs:
            if not any(s.text.strip() for s in seg):
                continue
            weight = {}
            for s in seg:
                weight[s.color] = weight.get(s.color, 0) + len(s.text.strip())
            color = max(weight, key=weight.get)
            size = max(s.size for s in seg if s.text.strip())
            ln = Line(y, min(s.x0 for s in seg), max(s.x1 for s in seg), size, color, seg)
            ln.text = clean(logical(seg))
            lines.append(ln)
    lines.sort(key=lambda l: (l.y, -l.x1))
    return lines


def clean(s):
    s = s.replace(" ", " ")
    # kashida used for justification sits between two letters; "لـ 12" keeps its tail
    s = re.sub(r"(?<=[ء-يً-ْ])ـ+(?=[ء-ي])", "", s)
    s = re.sub(r"\s+", " ", s).strip()
    s = re.sub(r"\s+([،.؛:؟!»)\]])", r"\1", s)
    s = re.sub(r"([«(\[])\s+", r"\1", s)
    return s


def skel(s):
    return re.sub(r"[^ء-ي0-9A-Za-z]", "", re.sub(r"[ً-ْٰـ]", "", s))
