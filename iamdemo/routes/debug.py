import time

import requests as http
from flask import (
    Blueprint,
    jsonify,
    session,
)

from iamdemo import config
from iamdemo.services.docusign import active_token_value, ds_headers, iam_base, safe_json, webforms_base

bp = Blueprint("debug", __name__)


@bp.route("/debug/navigator/<account_id>")
def debug_navigator(account_id):
    tok = active_token_value()
    if not tok:
        return jsonify({"status": 0, "error": "no token"})
    r = http.get(
        f"https://api-d.docusign.com/v1/accounts/{account_id}/agreements?limit=5",
        headers=ds_headers(tok),
        timeout=15,
    )
    try:
        d = r.json()
    except Exception:
        d = {}
    count = d.get("response_metadata", {}).get("count", len(d.get("data", [])))
    return jsonify(
        {
            "status": r.status_code,
            "count": count,
            "error": d.get("detail") or d.get("message"),
            "sample": d.get("data", [])[:1],
        }
    )


@bp.route("/debug/token")
def debug_token():
    tok = session.get("access_token", "")
    masked = (tok[:8] + "..." + tok[-4:]) if len(tok) > 12 else (tok or "empty")
    # Check userinfo to verify token validity and which account it's for
    ui_resp = (
        http.get(
            "https://account-d.docusign.com/oauth/userinfo", headers={"Authorization": f"Bearer {tok}"}, timeout=10
        )
        if tok
        else None
    )
    ui_data = ui_resp.json() if ui_resp else {}
    ui_status = ui_resp.status_code if ui_resp else 0
    # Find the default account and its base URI from the token
    accounts = ui_data.get("accounts", [])
    default_acct = next((a for a in accounts if a.get("is_default")), accounts[0] if accounts else {})
    acct_id = default_acct.get("account_id", config.ACCOUNT_ID)
    base = default_acct.get("base_uri", config.BASE_URI)

    # Call eSign with the correct account/base from this token
    esign_url = f"{base}/restapi/v2.1/accounts/{acct_id}/envelopes?from_date=2026-01-01&count=3"
    try:
        env_resp2 = http.get(
            esign_url, headers={"Authorization": f"Bearer {tok}", "Accept": "application/json"}, timeout=10
        )
        env_data2 = env_resp2.json()
        env_status2 = env_resp2.status_code
    except Exception as e:
        env_data2 = {"exception": str(e)}
        env_status2 = -1

    return jsonify(
        {
            "token_in_session": bool(tok),
            "token_length": len(tok),
            "token_preview": masked,
            "userinfo_status": ui_status,
            "userinfo_email": ui_data.get("email"),
            "default_account": default_acct.get("account_name"),
            "default_account_id": acct_id,
            "default_base_uri": base,
            "configured_account_id": config.ACCOUNT_ID,
            "all_accounts": [(a.get("account_name"), a.get("account_id")) for a in accounts],
            "esign_with_token_account": {"status": env_status2, "data": env_data2},
        }
    )


@bp.route("/debug/auth")
def debug_auth():
    """Non-secret diagnostics for JWT/serverless auth."""
    key = config.load_rsa_private_key()
    info = {
        "has_rsa_key": bool(key),
        "has_integration_key": bool(config.INTEGRATION_KEY),
        "has_user_id": bool(config.USER_ID),
        "has_account_id": bool(config.ACCOUNT_ID),
        "has_flask_secret": bool(config.SECRET_KEY),
        "rsa_key_format_ok": bool(key and "BEGIN RSA PRIVATE KEY" in key and "END RSA PRIVATE KEY" in key),
    }
    try:
        import jwt as pyjwt

        now = int(time.time())
        payload = {
            "iss": config.INTEGRATION_KEY,
            "sub": config.USER_ID,
            "aud": "account-d.docusign.com",
            "iat": now,
            "exp": now + 3600,
            "scope": "signature impersonation",
        }
        assertion = pyjwt.encode(payload, key, algorithm="RS256") if key else ""
        resp = http.post(
            "https://account-d.docusign.com/oauth/token",
            data={
                "grant_type": "urn:ietf:params:oauth:grant-type:jwt-bearer",
                "assertion": assertion,
            },
            timeout=10,
        )
        info["jwt_status"] = resp.status_code
        info["jwt_ok"] = resp.status_code == 200
        if resp.status_code != 200:
            info["jwt_error"] = resp.text[:300]
    except Exception as exc:
        info["jwt_ok"] = False
        info["jwt_error"] = str(exc)[:300]
    info["active_token"] = bool(active_token_value())
    return jsonify(info)


@bp.route("/debug/webforms")
def debug_webforms():
    """Raw Web Forms API probe — tries multiple URL patterns."""
    token = active_token_value()
    if not token:
        return jsonify({"error": "no token in session"}), 401
    acct = session.get("account_id", config.ACCOUNT_ID)
    results = {}
    candidates = [
        f"{webforms_base()}/forms",
        f"{webforms_base()}/forms?user_filter=all",
        f"https://apps-d.docusign.com/v1.0/accounts/{acct}/forms",
        f"https://demo.docusign.net/restapi/v2.1/accounts/{acct}/web_forms/forms",
    ]
    for url in candidates:
        r = http.get(url, headers=ds_headers(token), timeout=15)
        results[url] = {"status": r.status_code, "body": safe_json(r) if r.content else {}}
    return jsonify(results), 200


@bp.route("/debug/maestro")
def debug_maestro():
    """Raw Workflow Builder API probe — shows exactly what Docusign returns."""
    token = active_token_value()
    if not token:
        return jsonify({"error": "no token in session"}), 401
    acct = session.get("account_id", config.ACCOUNT_ID)
    url = f"{iam_base()}/workflows?status=active"
    r = http.get(url, headers=ds_headers(token), timeout=15)
    try:
        body = r.json()
    except Exception:
        body = {"raw_text": r.text[:2000]}
    # Also surface token scopes from userinfo
    ui = http.get(
        "https://account-d.docusign.com/oauth/userinfo", headers={"Authorization": f"Bearer {token}"}, timeout=10
    )
    return jsonify(
        {
            "url": url,
            "account_id_used": acct,
            "status_code": r.status_code,
            "response": body,
            "token_scopes": ui.json().get("accounts", [{}])[0] if ui.status_code == 200 else ui.text,
        }
    )
