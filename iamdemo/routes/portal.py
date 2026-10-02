from datetime import UTC, datetime

import requests as http
from flask import (
    Blueprint,
    jsonify,
    render_template,
    request,
    session,
)

from iamdemo import config
from iamdemo.content import home as home_content
from iamdemo.services.docusign import active_token_value, ds_get, ds_get_many, ds_headers, iam_base

bp = Blueprint("portal", __name__)


@bp.route("/")
def index():
    token = active_token_value()
    stats = {}
    recent_envelopes = []
    error = None
    if token:
        (code, data), (code_t, templates), (code_r, recent) = ds_get_many(
            [
                "/envelopes?from_date=2020-01-01&include=recipients",
                "/templates",
                "/envelopes?from_date=2024-01-01&order_by=last_modified&order=desc&count=5",
            ],
            token=token,
        )
        if code == 200:
            stats["total_envelopes"] = data.get("totalSetSize", "—")
        elif code == 401:
            error = "Access token expired. Click 'Login with Docusign' to refresh."
            if session.get("access_token"):
                session.pop("access_token", None)
                session.modified = True
        elif code == 403:
            error = f"API 403: {data.get('message') or 'Permission denied for this account.'}"
        if code_t == 200:
            stats["templates"] = templates.get("totalSetSize", "—")
        if code_r == 200:
            recent_envelopes = recent.get("envelopes", [])
    return render_template(
        "index.html",
        stats=stats,
        error=error,
        token=token,
        recent_envelopes=recent_envelopes,
        hero_steps=home_content.HERO_STEPS,
        compliance_badges=home_content.COMPLIANCE_BADGES,
        scenarios=home_content.SCENARIOS,
        features=home_content.FEATURES,
        demo_script=home_content.DEMO_SCRIPT,
    )


@bp.route("/agreement-desk")
def agreement_desk():
    return render_template("agreement_desk.html")


@bp.route("/navigator")
def navigator():
    token = active_token_value()
    agreements = []
    plan_error = None
    api_status = None
    stats = {}

    if token:
        acct = session.get("account_id", config.ACCOUNT_ID)
        try:
            r = http.get(
                f"{iam_base()}/agreements?limit=20&sort=metadata.created_at&direction=desc",
                headers=ds_headers(token),
                timeout=15,
            )
            code, data = r.status_code, r.json() if r.content else {}
        except Exception as e:
            code, data = 0, {"message": str(e)}

        if code == 200:
            agreements = data.get("data", [])
            total = data.get("response_metadata", {}).get("count", len(agreements))
            stats = {"total": total, "account": acct}
            if not agreements:
                api_status = {
                    "connected": True,
                    "total": 0,
                    "account": acct,
                    "message": f"Agreement Manager API connected — 0 agreements on account {acct}.",
                    "detail": "No agreements ingested yet. Upload contracts in Agreement Manager to populate this view.",
                }
        elif code == 403:
            detail = data.get("detail", "")
            plan_error = {
                "code": 403,
                "account": acct,
                "title": "Agreement Manager API Access Blocked",
                "detail": detail or "This account does not have Agreement Manager API access enabled.",
                "upgrade": "Agreement Manager API access requires enableNavigatorAPIDataOut to be enabled by your Docusign TAM.",
            }
        elif code in (401, 0):
            plan_error = {
                "code": code,
                "title": "Authentication Error",
                "detail": "Token expired or invalid. Click 'Refresh Token' to re-authenticate.",
            }
        else:
            plan_error = {"code": code, "title": "API Error", "detail": data.get("message", f"HTTP {code}")}

    return render_template(
        "navigator.html",
        agreements=agreements,
        plan_error=plan_error,
        api_status=api_status,
        stats=stats,
        embed=request.args.get("embed") == "1",
        sync=request.args.get("sync") == "1",
        highlight_vendor=request.args.get("vendor", ""),
    )


@bp.route("/api/demo/health")
def demo_health():
    token = active_token_value()
    oauth = bool(session.get("prefer_oauth") and session.get("access_token"))
    result = {
        "ok": bool(token),
        "api_ok": False,
        "auth_method": "oauth" if oauth else ("jwt" if token else None),
        "checked_at": datetime.now(UTC).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "needs_login": False,
    }
    if token:
        code, _ = ds_get("/envelopes?count=1&from_date=2024-01-01", token=token)
        result["api_ok"] = code == 200
        result["api_code"] = code
        if code == 401 and session.get("access_token"):
            session.pop("access_token", None)
            session.modified = True
            if session.get("prefer_oauth"):
                result["ok"] = False
                result["api_ok"] = False
                result["needs_login"] = True
                result["auth_method"] = "oauth"
    return jsonify(result)


@bp.route("/workflow-discovery")
def workflow_discovery():
    return render_template("workflow_discovery.html")


@bp.route("/clm-troubleshoot")
def clm_troubleshoot():
    return render_template("clm_troubleshoot.html")


@bp.route("/integration-story")
def integration_story():
    return render_template("integration_story.html")


@bp.route("/procurement-intake")
def procurement_intake():
    return render_template("procurement_intake.html")
