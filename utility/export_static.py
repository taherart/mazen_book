"""Export the landing page as a plain static site (no Django needed to host it).

    python utility/export_static.py            # writes ./static_site/
    python utility/export_static.py out_dir

Upload the output folder to any static host (Netlify, Vercel, GitHub Pages, cPanel...).
The sample form needs an endpoint: edit action="" in index.html (Formspree, etc.).
"""
import os
import re
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(ROOT / "evea"))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.local")

import django  # noqa: E402

django.setup()

from django.conf import settings  # noqa: E402
from django.test import Client  # noqa: E402
from django.test.utils import override_settings  # noqa: E402

out = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "static_site"
if out.exists():
    shutil.rmtree(out)
out.mkdir(parents=True)

with override_settings(
    ALLOWED_HOSTS=["testserver"],
    DEBUG_TOOLBAR_CONFIG={"SHOW_TOOLBAR_CALLBACK": lambda request: False},
    BOOK_SAMPLE_FORM_ACTION="",
):
    html = Client().get("/").content.decode()

html = re.sub(r'\s*<input type="hidden" name="csrfmiddlewaretoken"[^>]*>', "", html)
html = html.replace('action="/sample/"', 'action=""')
html = html.replace('href="/static/', 'href="static/').replace('src="/static/', 'src="static/')
html = html.replace("url('/static/", "url('static/")
(out / "index.html").write_text(html, encoding="utf-8")

static = ROOT / "evea" / "static"
needed = [
    "css/style.min.css",
    "js/vendors.min.js",
    "js/app.min.js",
    "images/favicon.ico",
]
for f in needed:
    dst = out / "static" / f
    dst.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(static / f, dst)
shutil.copytree(static / "fonts" / "book", out / "static" / "fonts" / "book")
for optional in ("images/book-cover.png", "images/author.jpg"):
    if (static / optional).exists():
        shutil.copy2(static / optional, out / "static" / optional)

print("Exported to", out)
