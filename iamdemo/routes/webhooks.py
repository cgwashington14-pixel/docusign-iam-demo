"""Docusign Connect: configuration page and the inbound webhook receiver."""

from __future__ import annotations

import base64
import hashlib
import hmac

from flask import Blueprint, jsonify, render_template, request

from iamdemo import config
from iamdemo.content.connect_demo import (
    CONNECT_DEMO,
    CONNECT_ENDPOINTS,
    CONNECT_STATUS_GUIDE,
    CONNECT_WALKTHROUGH,
)
from iamdemo.services.docusign import active_token_value, ds_get
from iamdemo.services.webhook_store import store

bp = Blueprint("webhooks", __name__)


def _signature_valid(raw_body: bytes, header_value: str) -> bool:
    """Connect signs the raw body with HMAC-SHA256 and sends the base64 digest."""
    digest = hmac.new(config.WEBHOOK_SECRET.encode(), raw_body, hashlib.sha256).digest()
    return hmac.compare_digest(base64.b64encode(digest).decode(), header_value)


@bp.route("/webhooks")
def webhooks():
    token = active_token_value()
    configs = []
    error = None

    if token:
        code, data = ds_get("/connect", token=token)
        if code == 200:
            configs = data.get("configurations", [])
        elif code == 403:
            error = "Connect configuration requires Admin permissions on this account."
        else:
            error = data.get("message", f"API error {code}")

    return render_template(
        "webhooks.html",
        configs=configs,
        events=store.recent(),
        error=error,
        webhook_url=request.host_url.rstrip("/") + "/webhook/receive",
        connect_demo=CONNECT_DEMO,
        connect_status_guide=CONNECT_STATUS_GUIDE,
        connect_endpoints=CONNECT_ENDPOINTS,
        connect_walkthrough=CONNECT_WALKTHROUGH,
    )


@bp.route("/webhook/receive", methods=["POST"])
def webhook_receive():
    if config.WEBHOOK_SECRET and not _signature_valid(
        request.get_data(), request.headers.get("X-DocuSign-Signature-1", "")
    ):
        return jsonify({"error": "invalid signature"}), 401

    payload = request.get_json(force=True, silent=True)
    store.add(payload if isinstance(payload, dict) else {})
    return jsonify({"received": True}), 200


@bp.route("/webhook/events")
def webhook_events_api():
    return jsonify(store.recent())


@bp.route("/webhook/clear", methods=["POST"])
def webhook_clear():
    store.clear()
    return jsonify({"cleared": True})
