import time

import requests as http
from flask import (
    Blueprint,
    jsonify,
    render_template,
    request,
    session,
)

from iamdemo import config
from iamdemo.services.docusign import active_token_value, ds_headers, esign_base, iam_base, webforms_base

bp = Blueprint("explorer", __name__)


@bp.route("/explorer")
def explorer():
    endpoints = [
        {
            "group": "eSignature",
            "color": "cyan",
            "routes": [
                {"method": "GET", "path": "/envelopes?from_date=2024-01-01&count=10", "desc": "List recent envelopes"},
                {"method": "POST", "path": "/envelopes", "desc": "Create & send an envelope"},
                {"method": "GET", "path": "/envelopes/{id}", "desc": "Get envelope details"},
                {"method": "PUT", "path": "/envelopes/{id}", "desc": "Modify envelope (void, resend)"},
                {"method": "GET", "path": "/envelopes/{id}/recipients", "desc": "Get all recipients"},
                {"method": "POST", "path": "/envelopes/{id}/views/recipient", "desc": "Generate embedded signing URL"},
                {"method": "POST", "path": "/envelopes/{id}/views/sender", "desc": "Generate embedded sender URL"},
                {"method": "GET", "path": "/envelopes/{id}/documents", "desc": "List envelope documents"},
                {"method": "GET", "path": "/envelopes/{id}/audit_events", "desc": "Full audit trail"},
                {"method": "GET", "path": "/templates", "desc": "List templates"},
                {"method": "POST", "path": "/templates", "desc": "Create template"},
                {"method": "GET", "path": "/connect", "desc": "List Connect configurations"},
                {"method": "POST", "path": "/connect", "desc": "Create Connect webhook config"},
            ],
        },
        {
            "group": "Web Forms",
            "color": "violet",
            "routes": [
                {"method": "GET", "path": "/forms", "desc": "List available web forms"},
                {"method": "GET", "path": "/forms/{id}?state=active", "desc": "Get active form definition"},
                {"method": "POST", "path": "/forms/{id}/instances", "desc": "Create pre-filled instance"},
                {"method": "GET", "path": "/forms/{id}/instances/{instanceId}", "desc": "Get form instance status"},
            ],
        },
        {
            "group": "Workflow Builder",
            "color": "amber",
            "routes": [
                {"method": "GET", "path": "/workflows?status=active", "desc": "List active workflows"},
                {"method": "GET", "path": "/workflows/{id}/trigger-requirements", "desc": "Get trigger input schema"},
                {"method": "POST", "path": "/workflows/{id}/actions/trigger", "desc": "Trigger workflow instance"},
                {"method": "GET", "path": "/workflows/{id}/instances/{iid}", "desc": "Get workflow instance state"},
            ],
        },
        {
            "group": "Agreement Manager",
            "color": "emerald",
            "routes": [
                {"method": "GET", "path": "/agreements", "desc": "List all agreements"},
                {"method": "GET", "path": "/agreements/{id}", "desc": "Get agreement details & provisions"},
                {"method": "GET", "path": "/agreements?filter=...", "desc": "Filter by party, date, status, type"},
            ],
        },
        {
            "group": "Workspaces",
            "color": "emerald",
            "routes": [
                {"method": "GET", "path": "/workspaces", "desc": "List all workspaces (agreement hubs)"},
                {"method": "POST", "path": "/workspaces", "desc": "Create dynamic workspace hub"},
                {"method": "GET", "path": "/workspaces/{wsId}", "desc": "Get workspace details and settings"},
                {"method": "GET", "path": "/workspaces/{wsId}/documents", "desc": "List documents in workspace"},
                {"method": "POST", "path": "/workspaces/{wsId}/documents", "desc": "Add a document to the workspace"},
                {"method": "GET", "path": "/workspaces/{wsId}/upload-requests", "desc": "List upload requests"},
            ],
        },
        {
            "group": "Rooms",
            "color": "rose",
            "routes": [
                {"method": "GET", "path": "/rooms", "desc": "List transaction rooms"},
                {"method": "POST", "path": "/rooms", "desc": "Create a new room"},
                {"method": "GET", "path": "/rooms/{id}/documents", "desc": "Get room documents"},
            ],
        },
    ]
    return render_template("explorer.html", endpoints=endpoints)


ALLOWED_METHODS = {"GET", "POST", "PUT", "DELETE"}


def resolve_explorer_url(group: str, path: str) -> str:
    """Map an Explorer endpoint group + relative path onto the matching Docusign API root."""
    if group == "Web Forms":
        return webforms_base() + path.replace("/web_forms", "")
    if group in ("Workflow Builder", "Agreement Manager"):
        rel = path.lstrip("/")
        return f"{iam_base()}/{rel.removeprefix('maestro/')}"
    if group == "Workspaces":
        # Workspaces API (beta): https://api-d.docusign.com/v1/accounts/{acct}/...
        rel = path if path.startswith("/workspaces") else f"/workspaces{path}"
        return f"{iam_base()}{rel}"
    if group == "Rooms":
        base_uri = session.get("base_uri", config.BASE_URI)
        return f"{base_uri}/restapi/v2/accounts/{session.get('account_id', config.ACCOUNT_ID)}{path}"
    return esign_base() + path


@bp.route("/explorer/call", methods=["POST"])
def explorer_call():
    token = active_token_value()
    if not token:
        return jsonify({"error": "not authenticated"}), 401

    body = request.get_json(silent=True) or {}
    path = (body.get("path") or "").strip()
    method = (body.get("method") or "GET").upper()
    if not path:
        return jsonify({"error": "No path provided"}), 400
    if method not in ALLOWED_METHODS:
        return jsonify({"error": "Unsupported method"}), 400
    if not path.startswith("/"):
        path = "/" + path

    url = resolve_explorer_url(body.get("group", "eSignature"), path)
    started = time.monotonic()
    try:
        upstream = http.request(
            method,
            url,
            headers=ds_headers(token),
            json=body.get("body") if method in ("POST", "PUT") else None,
            timeout=15,
        )
    except http.RequestException as exc:
        return jsonify({"error": str(exc)}), 502

    try:
        payload = upstream.json()
    except ValueError:
        payload = {"raw": upstream.text[:2000]}
    return jsonify(
        {
            "status_code": upstream.status_code,
            "url": url,
            "response": payload,
            "latency_ms": round((time.monotonic() - started) * 1000),
        }
    )
