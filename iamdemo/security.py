"""Small security helpers shared by routes."""

from __future__ import annotations

import re
import threading
import time

from flask import request

from iamdemo import config


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


_GUID_RE = re.compile(r"^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$")


def clean_guid(raw: str | None) -> str:
    """Return ``raw`` only if it is a GUID (Docusign envelope/template ids); otherwise ``""``."""
    value = (raw or "").strip()
    return value if _GUID_RE.match(value) else ""


def is_safe_api_path(path: str) -> bool:
    """Reject API paths that could escape the intended Docusign API root."""
    if not path.startswith("/") or path.startswith("//"):
        return False
    if "\\" in path or any(ord(ch) < 32 for ch in path):
        return False
    route = path.split("?", 1)[0]
    return ".." not in route.split("/") and "%2e" not in route.lower()


def is_cross_site_request() -> bool:
    """True when the browser says this request was triggered by another website."""
    return request.headers.get("Sec-Fetch-Site", "").lower() == "cross-site"


def client_ip() -> str:
    """Best-effort caller IP; trust proxy headers only on the platform that sets them."""
    if config.IS_SERVERLESS:
        forwarded = request.headers.get("X-Vercel-Forwarded-For") or request.headers.get("X-Real-IP")
        if forwarded:
            return forwarded.split(",")[0].strip()
    return request.remote_addr or "unknown"


class LoginThrottle:
    """In-memory limiter for password guesses (per caller and overall, per server instance)."""

    def __init__(self, max_per_client: int = 5, max_total: int = 40, window_seconds: int = 15 * 60):
        self.max_per_client = max_per_client
        self.max_total = max_total
        self.window = window_seconds
        self._failures: dict[str, list[float]] = {}
        self._lock = threading.Lock()

    def _prune(self, now: float) -> None:
        cutoff = now - self.window
        for key in list(self._failures):
            kept = [t for t in self._failures[key] if t > cutoff]
            if kept:
                self._failures[key] = kept
            else:
                del self._failures[key]

    def retry_after(self, client: str) -> int:
        """Seconds the caller must wait, or 0 when another attempt is allowed."""
        now = time.time()
        with self._lock:
            self._prune(now)
            mine = self._failures.get(client, [])
            total = sum(len(v) for v in self._failures.values())
            if len(mine) >= self.max_per_client:
                return max(1, int(mine[0] + self.window - now))
            if total >= self.max_total:
                oldest = min(t for v in self._failures.values() for t in v)
                return max(1, int(oldest + self.window - now))
        return 0

    def record_failure(self, client: str) -> None:
        with self._lock:
            self._failures.setdefault(client, []).append(time.time())

    def reset(self, client: str | None = None) -> None:
        with self._lock:
            if client is None:
                self._failures.clear()
            else:
                self._failures.pop(client, None)


login_throttle = LoginThrottle()
