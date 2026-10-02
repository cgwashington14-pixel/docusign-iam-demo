"""Inline outline glyphs that replace pictographic emoji in page content.

Rendered through the ``glyph(name)`` Jinja global so they inherit ``currentColor``
and stay crisp in both themes. Paths use a 24x24 grid with a 1.6 stroke.
"""

from __future__ import annotations

from markupsafe import Markup

_PATHS: dict[str, str] = {
    "bolt": '<path d="M13 3 5 13.5h6L10 21l8-10.5h-6z"/>',
    "document": '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/><path d="M9 13h6M9 17h4"/>',
    "monitor": '<rect x="3.5" y="4.5" width="17" height="11" rx="2"/><path d="M9 20h6M12 15.5V20"/>',
    "building": '<path d="M5 20V5a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v15"/><path d="M15 9h3a1 1 0 0 1 1 1v10"/><path d="M3.5 20h17"/><path d="M9 8h2M9 12h2M9 16h2"/>',
    "lock": '<rect x="5" y="10.5" width="14" height="9.5" rx="2"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/>',
    "clipboard": '<rect x="5" y="4.5" width="14" height="16" rx="2"/><path d="M9 4.5V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v.5"/><path d="M9 11h6M9 15h4"/>',
    "folder": '<path d="M3.5 7a2 2 0 0 1 2-2H10l2 2.5h6.5a2 2 0 0 1 2 2V17a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z"/>',
    "search": '<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/>',
    "bot": '<rect x="4.5" y="8" width="15" height="11" rx="3"/><path d="M12 8V4.5"/><circle cx="12" cy="4" r="1"/><path d="M9 13v1.5M15 13v1.5"/>',
    "calendar": '<rect x="4" y="5.5" width="16" height="14.5" rx="2"/><path d="M4 10h16M8.5 3.5v4M15.5 3.5v4"/>',
    "link": '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
    "tag": '<path d="M3.5 12.2V5.5a2 2 0 0 1 2-2h6.7l8.3 8.3a2 2 0 0 1 0 2.8l-6.4 6.4a2 2 0 0 1-2.8 0z"/><circle cx="8" cy="8" r="1.2"/>',
    "upload": '<path d="M12 16V4.5M7.5 9 12 4.5 16.5 9"/><path d="M4.5 15v3a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-3"/>',
    "bell": '<path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 2H4.5z"/><path d="M10 21h4"/>',
    "chart": '<path d="M4 4v16h16"/><path d="M8 16v-4M12.5 16V8M17 16v-6"/>',
    "branch": '<circle cx="7" cy="6" r="2"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="9" r="2"/><path d="M7 8v8M17 11c0 3-4 3-8.5 6"/>',
    "scale": '<path d="M12 4v16M7 20h10"/><path d="M5 7h14"/><path d="m5 7-3 7a3.2 3.2 0 0 0 6 0zM19 7l-3 7a3.2 3.2 0 0 0 6 0z"/>',
    "coins": '<ellipse cx="9" cy="7" rx="5.5" ry="2.8"/><path d="M3.5 7v5c0 1.5 2.5 2.8 5.5 2.8M3.5 12v5c0 1.5 2.5 2.8 5.5 2.8"/><path d="M14.5 10.5c3 0 5.5 1.2 5.5 2.7v4c0 1.500-2.500 2.800-5.500 2.800S9 18.700 9 17.200v-4"/>',
    "users": '<circle cx="9" cy="8.5" r="3.2"/><path d="M3.5 19.5a5.5 5.5 0 0 1 11 0"/><path d="M16 5.700a3.200 3.200 0 0 1 0 5.600M17.500 14.500a5.500 5.500 0 0 1 3 5"/>',
    "globe": '<circle cx="12" cy="12" r="8.5"/><path d="M3.500 12h17M12 3.500c2.500 2.500 3.500 5.500 3.500 8.500s-1 6-3.500 8.500c-2.500-2.500-3.500-5.500-3.500-8.500s1-6 3.500-8.500z"/>',
    "inbox": '<path d="M4 13.500 6.500 5.500h11L20 13.500V18a1.500 1.500 0 0 1-1.500 1.500h-13A1.500 1.500 0 0 1 4 18z"/><path d="M4 13.500h4.500a3.500 3.500 0 0 0 7 0H20"/>',
    "pencil": '<path d="M4 20h4L19 9a2.800 2.800 0 0 0-4-4L4 16z"/><path d="m13.500 6.500 4 4"/>',
    "paperclip": '<path d="m20 11-8.500 8.500a5 5 0 0 1-7-7L13 4a3.300 3.300 0 0 1 4.700 4.700L9.200 17.200a1.700 1.700 0 0 1-2.400-2.400L14.500 7"/>',
    "target": '<circle cx="12" cy="12" r="8.500"/><circle cx="12" cy="12" r="4.500"/><circle cx="12" cy="12" r="1"/>',
    "signature": '<path d="M3.500 17c2.500 0 3-8 5-8s0 8 2.500 8 2-5 4-5 .5 4 2.500 4h3"/><path d="M3.500 20.500h17"/>',
    "flag": '<path d="M5 21V4.500"/><path d="M5 5h13l-2.500 4L18 13H5"/>',
    "hand": '<path d="M9 11V5.500a1.500 1.500 0 0 1 3 0V10m0-1.500a1.500 1.500 0 0 1 3 0V11m0-1a1.500 1.500 0 0 1 3 0v4.500A6.500 6.500 0 0 1 11.500 21H11a6 6 0 0 1-5-2.700L3.500 14.500a1.500 1.500 0 0 1 2.400-1.800L9 15.500"/>',
    "alert": '<path d="M12 4 3 19.500h18z"/><path d="M12 10v4.500M12 17.200v.1"/>',
    "refresh": '<path d="M19.500 12a7.500 7.500 0 0 1-13 5M4.500 12a7.500 7.500 0 0 1 13-5"/><path d="M18 3.500V7h-3.500M6 20.500V17h3.500"/>',
    "cloud": '<path d="M7 18.500a4.500 4.500 0 0 1-.6-8.960A6 6 0 0 1 18 11a3.800 3.800 0 0 1-.5 7.500z"/>',
    "shield": '<path d="M12 3.500 5 6v5.500c0 4.300 2.800 7.600 7 9 4.200-1.400 7-4.700 7-9V6z"/><path d="m9 12 2.200 2.200L15 10.500"/>',
    "clock": '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.500V12l3 2"/>',
    "check": '<circle cx="12" cy="12" r="8.500"/><path d="m8.500 12.200 2.500 2.500 4.500-5"/>',
    "chat": '<path d="M4.500 6.500a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H11l-4.500 3.500v-3.500a2 2 0 0 1-2-2z"/>',
    "sparkles": '<path d="M12 4c.6 4 2.500 6 7 8-4.500 2-6.400 4-7 8-.6-4-2.500-6-7-8 4.500-2 6.400-4 7-8z"/>',
    "user": '<circle cx="12" cy="8.500" r="3.500"/><path d="M5 20a7 7 0 0 1 14 0"/>',
    "mail": '<rect x="3.500" y="5.500" width="17" height="13" rx="2"/><path d="m4 7.500 8 6 8-6"/>',
    "gear": '<circle cx="12" cy="12" r="3"/><path d="M12 3.500v2.200M12 18.300v2.200M3.500 12h2.200M18.300 12h2.200M6 6l1.500 1.500M16.500 16.500 18 18M18 6l-1.500 1.500M7.500 16.500 6 18"/>',
    "shuffle": '<path d="M4 7h3.500c3 0 4 3 6 5s3 5 6 5H21M4 17h3.500c1.500 0 2.500-.7 3.500-1.800M16 7h5M18.500 4.500 21 7l-2.500 2.500M18.500 14.500 21 17l-2.500 2.500"/>',
}


def glyph(name: str, size: str = "1em") -> Markup:
    body = _PATHS.get(name, _PATHS["document"])
    return Markup(
        f'<svg class="glyph" width="{size}" height="{size}" viewBox="0 0 24 24" fill="none" '
        'stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" '
        f'aria-hidden="true" focusable="false">{body}</svg>'
    )


def glyph_map() -> dict[str, str]:
    """Raw SVG markup by name, exposed to page scripts as ``dsGlyph(name)``."""
    return {name: str(glyph(name)) for name in _PATHS}
