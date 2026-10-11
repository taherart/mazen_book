"""Export the 52 method illustrations (and the cover) from the book into public/.

usage: export_images.py <book.pdf> <public_dir> [<cover.png>]
Writes methods/NN.webp (transparent, for the site) and og/NN.jpg (1200x630, for link previews).
"""
import os
import sys

import pymupdf as fitz
from PIL import Image

PAPER = (247, 243, 234)
BLUE = (47, 91, 211)


def illustration(doc, page):
    xref, smask = page.get_images(full=True)[0][:2]
    pix = fitz.Pixmap(doc, xref)
    if pix.colorspace and pix.colorspace.n != 3:
        pix = fitz.Pixmap(fitz.csRGB, pix)
    if smask:
        pix = fitz.Pixmap(pix, fitz.Pixmap(doc, smask))
    mode = "RGBA" if pix.alpha else "RGB"
    return Image.frombytes(mode, (pix.width, pix.height), pix.samples).convert("RGBA")


def main():
    pdf, public = sys.argv[1], sys.argv[2]
    doc = fitz.open(pdf)
    os.makedirs(os.path.join(public, "methods"), exist_ok=True)
    os.makedirs(os.path.join(public, "og"), exist_ok=True)
    for n in range(1, 53):
        img = illustration(doc, doc[2 * n])
        img.save(os.path.join(public, "methods", f"{n:02d}.webp"), "WEBP", quality=88, method=6)
        og = Image.new("RGB", (1200, 630), PAPER)
        og.paste(BLUE, (0, 594, 1200, 630))
        art = img.resize((570, 570), Image.LANCZOS)
        og.paste(art, (315, 18), art)
        og.save(os.path.join(public, "og", f"{n:02d}.jpg"), "JPEG", quality=84, optimize=True)
    if len(sys.argv) > 3:
        os.makedirs(os.path.join(public, "brand"), exist_ok=True)
        Image.open(sys.argv[3]).convert("RGB").save(os.path.join(public, "brand", "cover.webp"), "WEBP", quality=86, method=6)
    print("exported 52 illustrations")


if __name__ == "__main__":
    main()
