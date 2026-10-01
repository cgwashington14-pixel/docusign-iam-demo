"""Jinja filters and template context shared by every page."""

from __future__ import annotations

import hashlib
from datetime import datetime
from functools import cache
from pathlib import Path

from flask import Flask, current_app, request, session, url_for

from iamdemo import config
from iamdemo.content.demo_paths import DEMO_PATHS
from iamdemo.content.gov_scenarios import GOV_CUSTOMER_PROOF
from iamdemo.navigation import NAV_SECTIONS, is_nav_active
from iamdemo.services.docusign import active_token_value


def format_datetime(iso: str | None) -> str:
    """Render an ISO-8601 timestamp as ``Jun 18, 2026 14:22 UTC``."""
    if not iso:
        return "—"
    try:
        return datetime.fromisoformat(iso.replace("Z", "+00:00")).strftime("%b %d, %Y %H:%M UTC")
    except ValueError:
        return iso


@cache
def _content_hash(static_root: str, filename: str) -> str:
    try:
        return hashlib.md5((Path(static_root) / filename).read_bytes(), usedforsecurity=False).hexdigest()[:10]
    except OSError:
        return "0"


def asset(filename: str) -> str:
    """URL for a static file with a content hash so deploys bust browser caches."""
    return url_for("static", filename=filename, v=_content_hash(current_app.static_folder, filename))


def register_context(app: Flask) -> None:
    app.jinja_env.filters["fmtdt"] = format_datetime
    app.jinja_env.globals["asset"] = asset

    @app.context_processor
    def inject_globals():
        token = active_token_value()
        oauth = bool(session.get("prefer_oauth") and session.get("access_token"))
        return {
            "active_token": token,
            "auth_method": "oauth" if oauth else ("jwt" if token else None),
            "account_id": session.get("account_id", config.ACCOUNT_ID),
            "base_uri": session.get("base_uri", config.BASE_URI),
            "user_email": session.get("user_email", "") or ("Connected via JWT" if token and not oauth else ""),
            "user_name": session.get("user_name", "") or ("Demo Account" if token else "Guest"),
            "customer_proof": GOV_CUSTOMER_PROOF,
            # Public client ID for Docusign JS embeds (not a secret)
            "ds_integration_key": config.INTEGRATION_KEY,
            "nav_sections": NAV_SECTIONS,
            "demo_paths": DEMO_PATHS,
            "nav_active": lambda item: is_nav_active(item, request.endpoint),
        }
