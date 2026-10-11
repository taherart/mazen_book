"""Exact text extraction for the Chrome/Skia-generated book PDF.

Skia writes Arabic as visually-ordered glyph runs wrapped in /ReversedChars, and
wraps every cluster whose glyphs do not map 1:1 to characters in /Span /ActualText.
Generic extractors mis-order the diacritics, so this walks the content stream
directly and rebuilds logical text from those markers.
"""
import re
from dataclasses import dataclass, field

import pymupdf as fitz

WS = " \t\r\n\x00\x0c"
DELIM = WS + "/<>[]()%"
NUM_RE = re.compile(r"[+-]?(?:\d+\.?\d*|\.\d+)")


def tokenize(s):
    i, n = 0, len(s)
    while i < n:
        c = s[i]
        if c in WS:
            i += 1
        elif c == "%":
            j = s.find("\n", i)
            i = n if j < 0 else j + 1
        elif c == "<":
            if s.startswith("<<", i):
                depth, j = 0, i
                while j < n:
                    if s.startswith("<<", j):
                        depth += 1
                        j += 2
                    elif s.startswith(">>", j):
                        depth -= 1
                        j += 2
                        if depth == 0:
                            break
                    elif s[j] == "<":
                        j = s.index(">", j) + 1
                    else:
                        j += 1
                yield ("dict", s[i:j])
                i = j
            else:
                j = s.index(">", i)
                yield ("hex", bytes.fromhex(re.sub(r"\s+", "", s[i + 1 : j])))
                i = j + 1
        elif c == "(":
            depth, j = 1, i + 1
            while j < n and depth:
                if s[j] == "\\":
                    j += 2
                    continue
                if s[j] == "(":
                    depth += 1
                elif s[j] == ")":
                    depth -= 1
                j += 1
            yield ("str", s[i + 1 : j - 1])
            i = j
        elif c == "[":
            j = s.index("]", i)
            yield ("arr", s[i : j + 1])
            i = j + 1
        elif c == "/":
            j = i + 1
            while j < n and s[j] not in DELIM:
                j += 1
            yield ("name", s[i + 1 : j])
            i = j
        elif c in "+-.0123456789":
            m = NUM_RE.match(s, i)
            yield ("num", float(m.group()))
            i = m.end()
        else:
            j = i
            while j < n and s[j] not in DELIM:
                j += 1
            if j == i:
                j = i + 1
            yield ("op", s[i:j])
            i = j


def parse_tounicode(cm):
    out = {}

    def dec(h):
        b = bytes.fromhex(h)
        return b.decode("utf-16-be", errors="ignore")

    for blk in re.findall(r"beginbfchar(.*?)endbfchar", cm, flags=re.S):
        for a, b in re.findall(r"<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]*)>", blk):
            out[int(a, 16)] = dec(b)
    for blk in re.findall(r"beginbfrange(.*?)endbfrange", cm, flags=re.S):
        for a, b, rest in re.findall(r"<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>\s*(\[[^\]]*\]|<[0-9A-Fa-f]+>)", blk):
            lo, hi = int(a, 16), int(b, 16)
            if rest.startswith("["):
                for k, h in enumerate(re.findall(r"<([0-9A-Fa-f]+)>", rest)):
                    out[lo + k] = dec(h)
            else:
                base = dec(rest.strip("<>"))
                for k in range(hi - lo + 1):
                    out[lo + k] = base[:-1] + chr(ord(base[-1]) + k)
    return out


@dataclass
class Font:
    name: str
    nbytes: int
    cmap: dict
    first: int = 0
    widths: list = field(default_factory=list)

    def width(self, code):
        k = code - self.first
        if 0 <= k < len(self.widths):
            return self.widths[k] * 0.001
        return 0.5


def load_fonts(doc, form_xref):
    kind, val = doc.xref_get_key(form_xref, "Resources/Font")
    if kind == "xref":
        val = doc.xref_object(int(val.split()[0]))
    fonts = {}
    for name, fx in re.findall(r"/(\w+)\s+(\d+)\s+0\s+R", val):
        fx = int(fx)
        obj = doc.xref_object(fx)
        sub = re.search(r"/Subtype\s*/(\w+)", obj)
        nbytes = 2 if sub and sub.group(1) == "Type0" else 1
        cmap = {}
        tu = doc.xref_get_key(fx, "ToUnicode")
        if tu[0] == "xref":
            cmap = parse_tounicode(doc.xref_stream(int(tu[1].split()[0])).decode("latin-1"))
        f = Font(name, nbytes, cmap)
        fc = re.search(r"/FirstChar\s+(\d+)", obj)
        if fc:
            f.first = int(fc.group(1))
        w = re.search(r"/Widths\s*\[([^\]]*)\]", obj)
        if w:
            f.widths = [float(x) for x in w.group(1).split()]
        else:
            wr = re.search(r"/Widths\s+(\d+)\s+0\s+R", obj)
            if wr:
                f.widths = [float(x) for x in re.findall(r"[\d.]+", doc.xref_object(int(wr.group(1))))]
        fonts[name] = f
    return fonts


@dataclass
class Run:
    x0: float
    x1: float
    y: float
    size: float
    color: tuple
    font: str
    mcid: int
    rtl: bool
    text: str  # logical order
    vis: str = ""  # as drawn, left to right


def mul(m, n):
    a, b, c, d, e, f = m
    A, B, C, D, E, F = n
    return (a * A + b * C, a * B + b * D, c * A + d * C, c * B + d * D, e * A + f * C + E, e * B + f * D + F)


def is_pua(ch):
    return 0xE000 <= ord(ch) <= 0xF8FF


def page_runs(doc, page):
    """All text runs of a page, each with logical-order text and device position (pt, y down)."""
    xos = page.get_xobjects()
    form = max(xos, key=lambda x: len(doc.xref_stream(x[0]) or b""))[0]
    fonts = load_fonts(doc, form)
    stream = doc.xref_stream(form).decode("latin-1")
    base = (0.24, 0, 0, 0.24, 0, 0)  # form px -> pt; relative positions are all we need

    ctm = (1, 0, 0, 1, 0, 0)
    gstack = []
    fill = (0.0, 0.0, 0.0)
    font, fsize = None, 0.0
    tlm = (1, 0, 0, 1, 0, 0)
    mc = []  # marked content stack
    mcid = -1
    in_text = False
    atoms = []  # (x, x_end, text)
    rtl = False
    run_y = 0.0
    base_y = 0.0
    run_size = 0.0
    run_color = fill
    run_font = ""
    runs = []
    ops = []

    def dev(x, y):
        m = mul(ctm, base)
        return (x * m[0] + y * m[2] + m[4], x * m[1] + y * m[3] + m[5])

    def flush():
        nonlocal atoms
        if atoms:
            seq = list(reversed(atoms)) if rtl else atoms
            text = "".join(a[2] for a in seq).replace("\x00", "")
            vis = "".join(a[2] for a in atoms).replace("\x00", "")
            if text and not all(is_pua(ch) for ch in text):
                runs.append(Run(min(a[0] for a in atoms), max(a[1] for a in atoms), run_y, run_size, run_color, run_font, mcid, rtl, text, vis))
        atoms = []

    for kind, val in tokenize(stream):
        if kind != "op":
            ops.append((kind, val))
            continue
        op = val
        if op == "q":
            gstack.append((ctm, fill))
        elif op == "Q":
            if gstack:
                ctm, fill = gstack.pop()
        elif op == "cm":
            ctm = mul(tuple(v for _, v in ops[-6:]), ctm)
        elif op == "rg":
            fill = tuple(v for _, v in ops[-3:])
        elif op == "g":
            fill = (ops[-1][1],) * 3
        elif op == "BT":
            in_text = True
            atoms, rtl = [], False
            tlm = (1, 0, 0, 1, 0, 0)
        elif op == "ET":
            flush()
            in_text = False
            rtl = False
        elif op == "Tf":
            font, fsize = fonts.get(ops[-2][1]), ops[-1][1]
        elif op == "Tm":
            tlm = tuple(v for _, v in ops[-6:])
            base_y = dev(tlm[4], tlm[5])[1]
        elif op == "Td":
            tx, ty = ops[-2][1], ops[-1][1]
            a, b, c, d, e, f = tlm
            tlm = (a, b, c, d, e + tx * a + ty * c, f + tx * b + ty * d)
        elif op == "Tj":
            data = ops[-1][1]
            if font is not None and isinstance(data, (bytes, bytearray)):
                step = font.nbytes
                x, y = tlm[4], tlm[5]
                scale = (ctm[0] * base[0])
                for k in range(0, len(data), step):
                    code = int.from_bytes(data[k : k + step], "big")
                    w = font.width(code) * fsize * tlm[0]
                    dx0, dy0 = dev(x, y)
                    dx1, _ = dev(x + w, y)
                    if not atoms:
                        # baseline comes from Tm: mark glyphs carry their own y offset
                        run_y, run_size, run_color, run_font = base_y, fsize * abs(scale), fill, font.name
                    atoms.append((dx0, dx1, font.cmap.get(code, "")))
                    x += w
        elif op == "BMC":
            tag = ops[-1][1]
            mc.append(("bmc", tag, None))
            if tag == "ReversedChars":
                rtl = True
        elif op == "BDC":
            tag = ops[-2][1] if len(ops) >= 2 else ""
            props = ops[-1][1] if ops[-1][0] == "dict" else ""
            m = re.search(r"/MCID\s+(\d+)", props)
            at = re.search(r"/ActualText\s*<([0-9A-Fa-f\s]*)>", props)
            if at:
                raw = bytes.fromhex(re.sub(r"\s+", "", at.group(1)))
                txt = raw[2:].decode("utf-16-be", errors="ignore") if raw[:2] == b"\xfe\xff" else raw.decode("latin-1")
                mc.append(("actual", txt, len(atoms)))
            elif m:
                mc.append(("mcid", mcid, None))
                mcid = int(m.group(1))
            else:
                mc.append(("bdc", tag, None))
        elif op == "EMC":
            if mc:
                k, v, start = mc.pop()
                if k == "actual":
                    grp = atoms[start:] if start <= len(atoms) else atoms
                    if grp:
                        del atoms[len(atoms) - len(grp) :]
                        atoms.append((min(a[0] for a in grp), max(a[1] for a in grp), v))
                elif k == "mcid":
                    mcid = v
        ops = []
    return runs
