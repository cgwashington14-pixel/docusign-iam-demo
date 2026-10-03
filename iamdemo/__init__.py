"""Docusign IAM public-sector demo portal."""

from __future__ import annotations

import logging
import os
import secrets
from datetime import timedelta

from flask import Flask
from flask_cors import CORS

from iamdemo import config
from iamdemo.context import register_context
from iamdemo.errors import register_error_handlers
from iamdemo.middleware import register_middleware
from iamdemo.routes import (
    admin,
    agents,
    ai_agent,
    auth,
    debug,
    embedded,
    envelopes,
    explorer,
    gov_workflows,
    maestro,
    portal,
    site,
    webforms,
    webhooks,
    workspaces,
)

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

BLUEPRINTS = (
    site,
    auth,
    portal,
    envelopes,
    embedded,
    webforms,
    maestro,
    workspaces,
    webhooks,
    gov_workflows,
    agents,
    explorer,
    admin,
    ai_agent,
)


def create_app() -> Flask:
    app = Flask(
        __name__,
        root_path=ROOT,
        template_folder=os.path.join(ROOT, "templates"),
        static_folder=os.path.join(ROOT, "static"),
    )

    if config.secret_key_is_strong():
        app.secret_key = config.SECRET_KEY
    else:
        # Sessions still work, but signed cookies are invalidated on every restart/instance.
        app.secret_key = secrets.token_hex(32)
        logging.getLogger(__name__).warning(
            "FLASK_SECRET_KEY is missing, a placeholder, or shorter than %d characters; using a throwaway key",
            config.MIN_SECRET_KEY_LENGTH,
        )

    app.config.update(
        PERMANENT_SESSION_LIFETIME=timedelta(days=14),
        SESSION_COOKIE_HTTPONLY=True,
        SESSION_COOKIE_SAMESITE="Lax",
        SESSION_COOKIE_SECURE=config.IS_SERVERLESS,
    )

    CORS(app, resources={r"/webhook/receive": {"origins": "*"}})
    register_middleware(app)
    register_context(app)
    register_error_handlers(app)

    for module in BLUEPRINTS:
        app.register_blueprint(module.bp)
    # Diagnostics expose account details: never register them on a deployed instance.
    if config.DEBUG_ROUTES and not config.IS_SERVERLESS:
        app.register_blueprint(debug.bp)

    return app
