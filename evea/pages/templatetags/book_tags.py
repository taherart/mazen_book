import re

from django import template
from django.utils.html import conditional_escape
from django.utils.safestring import mark_safe

register = template.Library()

# 40–80 | 1,500–4,000 | +4,000 | 30–100% | 3–7
_NUM = re.compile(r"\+?\d[\d,]*(?:\s?[–-]\s?\d[\d,]*)?%?")


@register.filter(needs_autoescape=True)
def ltr_nums(value, autoescape=True):
    """Keep numeric ranges (40–80) as one left-to-right unit inside Arabic text."""
    esc = conditional_escape if autoescape else (lambda s: s)
    text = str(value)
    out, last = [], 0
    for m in _NUM.finditer(text):
        out.append(esc(text[last:m.start()]))
        out.append('<bdi dir="ltr">%s</bdi>' % esc(m.group(0)))
        last = m.end()
    out.append(esc(text[last:]))
    return mark_safe("".join(out))
