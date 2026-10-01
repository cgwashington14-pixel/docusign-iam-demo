"""Small security helpers shared by routes."""

from __future__ import annotations


def safe_next_url(raw: str | None, *, default: str = "/") -> str:
    """Return ``raw`` only if it is a same-site relative path; otherwise ``default``.

    Prevents open redirects through ``?next=`` parameters.
    """
    value = (raw or "").strip()
    if not value.startswith("/") or value.startswith(("//", "/\\")):
        return default
    if value.startswith("/site-login"):
        return default
    return value
