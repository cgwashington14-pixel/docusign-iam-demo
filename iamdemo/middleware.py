"""Request hooks: private-network preflight, legacy session migration, and the shared-password gate."""

from __future__ import annotations

from flask import Flask, jsonify, make_response, redirect, request, session, url_for

from iamdemo import config

# Paths reachable without unlocking the site (assets, Docusign callbacks, health probe).
GATE_EXEMPT_PREFIXES = (
    "/static/",
    "/webhook/receive",
    "/embedded/complete",
    "/oauth/callback",
    "/api/demo/health",
)
GATE_EXEMPT_PATHS = frozenset({"/site-login", "/site-logout", "/favicon.ico", "/robots.txt"})


def is_gate_exempt(path: str) -> bool:
    return path in GATE_EXEMPT_PATHS or path.startswith(GATE_EXEMPT_PREFIXES)


def _wants_json(path: str) -> bool:
    return (
        path.startswith(("/api/", "/token"))
        or "application/json" in (request.headers.get("Accept") or "")
        or request.is_json
    )


def register_middleware(app: Flask) -> None:
    @app.before_request
    def private_network_preflight():
        """Answer Chrome's Private Network Access preflight so Docusign can return to localhost."""
        # Only meaningful for local development; a deployed site is not on a private network.
        if (
            not config.IS_SERVERLESS
            and request.method == "OPTIONS"
            and request.headers.get("Access-Control-Request-Private-Network")
        ):
            resp = make_response("", 204)
            resp.headers["Access-Control-Allow-Private-Network"] = "true"
            resp.headers["Access-Control-Allow-Origin"] = request.headers.get("Origin", "*")
            resp.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
            resp.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
            return resp
        return None

    @app.before_request
    def migrate_oauth_session():
        """Sessions created before the ``prefer_oauth`` flag existed keep using their OAuth token."""
        if session.get("guest_mode"):
            return
        if session.get("access_token") and session.get("user_email") and "prefer_oauth" not in session:
            session["prefer_oauth"] = True

    @app.before_request
    def refuse_unprotected_deployment():
        """Fail closed: a deployed instance without a strong SITE_PASSWORD serves nothing."""
        if not config.site_gate_misconfigured() or request.path == "/api/demo/health":
            return None
        message = "This deployment has no site password configured. Set SITE_PASSWORD to a long, random value."
        if _wants_json(request.path or "/"):
            return jsonify({"error": message}), 503
        return make_response(message, 503)

    @app.before_request
    def require_site_password():
        """Shared-password gate in front of the demo portal."""
        password = (config.SITE_PASSWORD or "").strip()
        if not password or session.get("site_unlocked"):
            return None
        path = request.path or "/"
        if is_gate_exempt(path) or request.method == "OPTIONS":
            return None
        if _wants_json(path):
            return jsonify({"error": "Site login required", "login_url": "/site-login", "needs_site_login": True}), 401
        next_url = request.full_path.removesuffix("?") or "/"
        return redirect(url_for("site.login", next=next_url))

    @app.after_request
    def add_response_headers(response):
        # Chrome blocks Docusign (public) -> localhost (private) iframe returns without this.
        if not config.IS_SERVERLESS:
            response.headers["Access-Control-Allow-Private-Network"] = "true"
        response.headers.setdefault("X-Content-Type-Options", "nosniff")
        response.headers.setdefault("Referrer-Policy", "strict-origin-when-cross-origin")
        return response
