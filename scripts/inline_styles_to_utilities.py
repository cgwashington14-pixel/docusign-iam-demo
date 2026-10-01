#!/usr/bin/env python3
"""Replace simple inline ``style="..."`` attributes in templates with utility classes.

Only attributes whose declarations *all* map to a utility in ``static/css/core/utilities.css``
are rewritten; anything else (JS-toggled ``display:none``, Jinja-driven values, bespoke
layouts) is left untouched. Tags containing Jinja and ``<script>`` bodies are skipped.

Usage: python scripts/inline_styles_to_utilities.py [--write]
"""

from __future__ import annotations

import re
import sys
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SPACES = {0, 2, 4, 6, 8, 10, 12, 14, 16, 20, 24, 32}
GAPS = {4, 6, 8, 10, 12, 14, 16, 20, 24}
FONT_SIZES = {11, 12, 13, 14, 15, 16, 18}

STATIC = {
    "font-weight:400": "fw-400",
    "font-weight:500": "fw-500",
    "font-weight:600": "fw-600",
    "font-weight:700": "fw-700",
    "color:var(--muted)": "text-muted",
    "color:var(--muted-2)": "text-muted-2",
    "color:var(--text)": "text-body",
    "text-align:center": "text-center",
    "text-align:left": "text-left",
    "text-align:right": "text-right",
    "text-transform:uppercase": "uppercase",
    "display:flex": "flex",
    "flex-direction:column": "flex-col",
    "flex-wrap:wrap": "flex-wrap",
    "align-items:center": "items-center",
    "align-items:flex-start": "items-start",
    "align-items:start": "items-start",
    "justify-content:center": "justify-center",
    "justify-content:space-between": "justify-between",
    "flex:1": "flex-1",
    "width:100%": "w-full",
}


def utility_for(decl: str) -> str | None:
    decl = re.sub(r"\s*:\s*", ":", decl.strip().rstrip(";"))
    if decl in STATIC:
        return STATIC[decl]
    if m := re.fullmatch(r"margin-(top|bottom):(\d+)(?:px)?", decl):
        n = int(m.group(2))
        return f"m{m.group(1)[0]}-{n}" if n in SPACES else None
    if m := re.fullmatch(r"font-size:(\d+)px", decl):
        n = int(m.group(1))
        return f"fs-{n}" if n in FONT_SIZES else None
    if m := re.fullmatch(r"gap:(\d+)px", decl):
        n = int(m.group(1))
        return f"gap-{n}" if n in GAPS else None
    return None


TAG = re.compile(r"<(?!/|!)[a-zA-Z][^<>]*>")
STYLE = re.compile(r'\sstyle="([^"]*)"')
CLASS = re.compile(r'\sclass="([^"]*)"')
SCRIPT = re.compile(r"<script\b.*?</script>", re.S | re.I)


def rewrite_tag(tag: str, stats: Counter) -> str:
    if "{{" in tag or "{%" in tag:
        return tag
    style = STYLE.search(tag)
    if not style:
        return tag
    decls = [d for d in style.group(1).split(";") if d.strip()]
    classes = [utility_for(d) for d in decls]
    if not decls or any(c is None for c in classes):
        stats["kept"] += 1
        return tag
    stats["converted"] += 1
    tag = tag.replace(style.group(0), "", 1)
    add = " ".join(c for c in classes if c)
    existing = CLASS.search(tag)
    if existing:
        merged = " ".join(dict.fromkeys(f"{existing.group(1)} {add}".split()))
        return tag.replace(existing.group(0), f' class="{merged}"', 1)
    # insert class right after the tag name
    return re.sub(r"^(<[a-zA-Z][\w-]*)", rf'\1 class="{add}"', tag, count=1)


def process(text: str, stats: Counter) -> str:
    out, last = [], 0
    for script in SCRIPT.finditer(text):
        out.append(TAG.sub(lambda m: rewrite_tag(m.group(0), stats), text[last : script.start()]))
        out.append(script.group(0))
        last = script.end()
    out.append(TAG.sub(lambda m: rewrite_tag(m.group(0), stats), text[last:]))
    return "".join(out)


def main() -> None:
    write = "--write" in sys.argv
    total = Counter()
    for path in sorted((ROOT / "templates").rglob("*.html")):
        stats: Counter = Counter()
        text = path.read_text()
        new = process(text, stats)
        if stats:
            print(f"{path.relative_to(ROOT)}: {stats['converted']} converted, {stats['kept']} kept")
        total.update(stats)
        if write and new != text:
            path.write_text(new)
    print(dict(total))


if __name__ == "__main__":
    main()
