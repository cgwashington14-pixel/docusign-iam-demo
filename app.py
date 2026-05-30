import os
import json
import hmac
import hashlib
import time
from datetime import datetime
from flask import Flask, render_template, request, jsonify, redirect, url_for, session
from flask_cors import CORS
import requests as http
import config

app = Flask(__name__)
app.secret_key = config.SECRET_KEY
CORS(app, resources={r"/webhook/*": {"origins": "*"}})

# ── In-memory webhook event log ──────────────────────────────────────────────
webhook_events = []


def active_token_value():
    tok = config.ACCESS_TOKEN or session.get("access_token", "")
    if not tok and os.path.exists(config.RSA_PRIVATE_KEY_PATH):
        tok = get_jwt_token()
        if tok:
            session["access_token"] = tok
    return tok


def ds_headers(token=None):
    tok = token or active_token_value()
    return {
        "Authorization": f"Bearer {tok}",
        "Content-Type": "application/json",
        "Accept": "application/json",
    }


def esign_base():
    base = session.get("base_uri", config.BASE_URI)
    acct = session.get("account_id", config.ACCOUNT_ID)
    return f"{base}/restapi/v2.1/accounts/{acct}"


def ds_get(path, token=None, base=None):
    url = (base or esign_base()) + path
    r = http.get(url, headers=ds_headers(token), timeout=15)
    return r.status_code, r.json() if r.content else {}


def ds_post(path, body, token=None, base=None):
    url = (base or esign_base()) + path
    r = http.post(url, headers=ds_headers(token), json=body, timeout=15)
    return r.status_code, r.json() if r.content else {}


def fmt_dt(iso):
    if not iso:
        return "—"
    try:
        dt = datetime.fromisoformat(iso.replace("Z", "+00:00"))
        return dt.strftime("%b %d, %Y %H:%M UTC")
    except Exception:
        return iso


app.jinja_env.filters["fmtdt"] = fmt_dt


def get_jwt_token():
    """Get a fresh access token via JWT Grant (server-to-server, no user interaction)."""
    try:
        import jwt as pyjwt
        with open(config.RSA_PRIVATE_KEY_PATH, "r") as f:
            private_key = f.read()
        now = int(time.time())
        payload = {
            "iss": config.INTEGRATION_KEY,
            "sub": config.USER_ID,
            "aud": "account-d.docusign.com",
            "iat": now,
            "exp": now + 3600,
            "scope": "signature impersonation",
        }
        assertion = pyjwt.encode(payload, private_key, algorithm="RS256")
        resp = http.post(
            "https://account-d.docusign.com/oauth/token",
            data={
                "grant_type": "urn:ietf:params:oauth:grant-type:jwt-bearer",
                "assertion": assertion,
            },
            timeout=15,
        )
        if resp.status_code == 200:
            return resp.json().get("access_token", "")
        return ""
    except Exception:
        return ""


@app.context_processor
def inject_globals():
    tok = session.get("access_token", "") or config.ACCESS_TOKEN
    return {"active_token": tok}


# ── Routes ───────────────────────────────────────────────────────────────────

@app.route("/")
def index():
    token = session.get("access_token", "") or config.ACCESS_TOKEN
    stats = {}
    error = None
    if token:
        code, data = ds_get("/envelopes?from_date=2020-01-01&include=recipients", token=token)
        if code == 200:
            stats["total_envelopes"] = data.get("totalSetSize", "—")
        elif code == 401:
            error = "Access token expired. Click 'Login with DocuSign' to refresh."
        elif code == 403:
            error = f"API 403: {data.get('message') or 'Permission denied for this account.'}"
        code2, tdata = ds_get("/templates", token=token)
        if code2 == 200:
            stats["templates"] = tdata.get("totalSetSize", "—")
    return render_template("index.html", stats=stats, error=error, token=token)


@app.route("/token", methods=["POST"])
def set_token():
    tok = request.form.get("token", "").strip()
    session["access_token"] = tok
    return redirect(url_for("index"))


# ── OAuth 2.0 Authorization Code Grant (confidential client) ─────────────────

@app.route("/oauth/login")
def oauth_login():
    import urllib.parse
    params = {
        "response_type": "code",
        "scope": "signature impersonation",
        "client_id": config.INTEGRATION_KEY,
        "redirect_uri": config.OAUTH_REDIRECT_URI,
    }
    url = "https://account-d.docusign.com/oauth/auth?" + urllib.parse.urlencode(params)
    return redirect(url)


@app.route("/oauth/callback")
def oauth_callback():
    code = request.args.get("code")
    error = request.args.get("error")

    if error:
        return render_template("oauth_error.html", error=error,
                               desc=request.args.get("error_description", ""))

    if not code:
        return render_template("oauth_error.html", error="no_code",
                               desc="No authorization code returned from DocuSign.")

    # Exchange code for access token using client secret (confidential client)
    token_resp = http.post(
        "https://account-d.docusign.com/oauth/token",
        auth=(config.INTEGRATION_KEY, config.CLIENT_SECRET),
        data={
            "grant_type": "authorization_code",
            "code": code,
            "redirect_uri": config.OAUTH_REDIRECT_URI,
        },
        timeout=15,
    )

    if token_resp.status_code != 200:
        return render_template("oauth_error.html", error=f"token_exchange_{token_resp.status_code}",
                               desc=token_resp.text[:500])

    data = token_resp.json()
    # Store only the access token — keep cookie small
    session["access_token"] = data.get("access_token", "")
    return redirect(url_for("index"))


@app.route("/oauth/logout")
def oauth_logout():
    session.clear()
    return redirect(url_for("index"))


@app.route("/debug/token")
def debug_token():
    tok = session.get("access_token", "")
    masked = (tok[:8] + "..." + tok[-4:]) if len(tok) > 12 else ("empty" if not tok else tok)
    # Check userinfo to verify token validity and which account it's for
    ui_resp = http.get("https://account-d.docusign.com/oauth/userinfo",
                       headers={"Authorization": f"Bearer {tok}"}, timeout=10) if tok else None
    ui_data = ui_resp.json() if ui_resp else {}
    ui_status = ui_resp.status_code if ui_resp else 0
    # Try eSign API
    env_resp = http.get(f"{config.ESIGN_BASE}/envelopes?from_date=2026-01-01&count=1",
                        headers=ds_headers(tok), timeout=10) if tok else None
    env_data = env_resp.json() if env_resp else {}
    env_status = env_resp.status_code if env_resp else 0
    # Find the default account and its base URI from the token
    accounts = ui_data.get("accounts", [])
    default_acct = next((a for a in accounts if a.get("is_default")), accounts[0] if accounts else {})
    acct_id = default_acct.get("account_id", config.ACCOUNT_ID)
    base = default_acct.get("base_uri", config.BASE_URI)

    # Call eSign with the correct account/base from this token
    esign_url = f"{base}/restapi/v2.1/accounts/{acct_id}/envelopes?from_date=2026-01-01&count=3"
    try:
        env_resp2 = http.get(esign_url, headers={"Authorization": f"Bearer {tok}", "Accept": "application/json"}, timeout=10)
        env_data2 = env_resp2.json()
        env_status2 = env_resp2.status_code
    except Exception as e:
        env_data2 = {"exception": str(e)}
        env_status2 = -1

    return jsonify({
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
    })


# ── ENVELOPES ─────────────────────────────────────────────────────────────────

@app.route("/envelopes")
def envelopes():
    token = session.get("access_token", "") or config.ACCESS_TOKEN
    envs = []
    error = None
    if token:
        code, data = ds_get(
            "/envelopes?from_date=2024-01-01&order_by=last_modified&order=desc&count=25",
            token=token,
        )
        if code == 200:
            envs = data.get("envelopes", [])
        else:
            error = data.get("message", f"API error {code}")
    else:
        error = "No access token configured."
    code_t, tdata = ds_get("/templates", token=token) if token else (0, {})
    templates = tdata.get("envelopeTemplates", []) if code_t == 200 else []
    return render_template("envelopes.html", envelopes=envs, templates=templates, error=error)


@app.route("/envelopes/<envelope_id>")
def envelope_detail(envelope_id):
    token = session.get("access_token", "") or config.ACCESS_TOKEN
    code, env = ds_get(f"/envelopes/{envelope_id}", token=token)
    code_r, rdata = ds_get(f"/envelopes/{envelope_id}/recipients", token=token)
    recipients = rdata.get("signers", []) + rdata.get("carbonCopies", []) if code_r == 200 else []
    code_a, adata = ds_get(f"/envelopes/{envelope_id}/audit_events", token=token)
    audit = adata.get("auditEvents", []) if code_a == 200 else []
    error = None if code == 200 else env.get("message", f"Error {code}")
    return render_template(
        "envelope_detail.html", env=env, recipients=recipients, audit=audit, error=error
    )


@app.route("/envelopes/send", methods=["GET", "POST"])
def send_envelope():
    token = session.get("access_token", "") or config.ACCESS_TOKEN
    code_t, tdata = ds_get("/templates", token=token) if token else (0, {})
    templates = tdata.get("envelopeTemplates", []) if code_t == 200 else []

    if request.method == "POST":
        form = request.form
        mode = form.get("mode", "ad_hoc")
        result = None
        error = None

        if mode == "template":
            template_id = form.get("template_id")
            body = {
                "templateId": template_id,
                "status": "sent",
                "templateRoles": [
                    {
                        "email": form.get("signer_email"),
                        "name": form.get("signer_name"),
                        "roleName": form.get("role_name", "Signer"),
                        "tabs": {
                            "textTabs": [
                                {"tabLabel": k.replace("tab_", ""), "value": v}
                                for k, v in form.items()
                                if k.startswith("tab_")
                            ]
                        },
                    }
                ],
            }
        else:
            doc_b64 = (
                "JVBERi0xLjQKMSAwIG9iago8PAovVHlwZSAvQ2F0YWxvZwovUGFnZXMgMiAwIFIKPj4KZW5k"
                "b2JqCjIgMCBvYmoKPDwKL1R5cGUgL1BhZ2VzCi9LaWRzIFszIDAgUl0KL0NvdW50IDEKPJ4K"
                "ZW5kb2JqCjMgMCBvYmoKPDwKL1R5cGUgL1BhZ2UKL1BhcmVudCAyIDAgUgovTWVkaWFCb3gg"
                "WzAgMCA2MTIgNzkyXQo+PgplbmRvYmoKeHJlZgowIDQKMDAwMDAwMDAwMCA2NTUzNSBmIAow"
                "MDAwMDAwMDA5IDAwMDAwIG4gCjAwMDAwMDAwNTggMDAwMDAgbiAKMDAwMDAwMDExNSAwMDAw"
                "MCBuIAp0cmFpbGVyCjw8Ci9TaXplIDQKL1Jvb3QgMSAwIFIKPj4Kc3RhcnR4cmVmCjE5MAol"
                "JUVPRUYK"
            )
            body = {
                "emailSubject": form.get("subject", "Please sign this document"),
                "status": "sent",
                "documents": [
                    {
                        "documentId": "1",
                        "name": form.get("doc_name", "Document.pdf"),
                        "fileExtension": "pdf",
                        "documentBase64": doc_b64,
                    }
                ],
                "recipients": {
                    "signers": [
                        {
                            "email": form.get("signer_email"),
                            "name": form.get("signer_name"),
                            "recipientId": "1",
                            "tabs": {
                                "signHereTabs": [
                                    {
                                        "documentId": "1",
                                        "pageNumber": "1",
                                        "xPosition": "200",
                                        "yPosition": "400",
                                    }
                                ]
                            },
                        }
                    ]
                },
            }

        code, data = ds_post("/envelopes", body, token=token)
        if code in (200, 201):
            result = data
        else:
            error = data.get("message", f"API error {code}")

        return render_template(
            "send_envelope.html",
            templates=templates,
            result=result,
            error=error,
        )

    return render_template("send_envelope.html", templates=templates, result=None, error=None)


# ── EMBEDDED SIGNING ──────────────────────────────────────────────────────────

@app.route("/embedded", methods=["GET", "POST"])
def embedded_signing():
    token = session.get("access_token", "") or config.ACCESS_TOKEN
    code_t, tdata = ds_get("/templates", token=token) if token else (0, {})
    templates = tdata.get("envelopeTemplates", []) if code_t == 200 else []
    signing_url = None
    envelope_id = None
    error = None

    if request.method == "POST":
        form = request.form
        template_id = form.get("template_id")
        signer_email = form.get("signer_email")
        signer_name = form.get("signer_name")
        return_url = request.host_url.rstrip("/") + "/embedded/complete"

        # 1. Create envelope from template
        env_body = {
            "templateId": template_id,
            "status": "sent",
            "templateRoles": [
                {
                    "email": signer_email,
                    "name": signer_name,
                    "roleName": form.get("role_name", "Signer"),
                    "clientUserId": "demo-" + signer_email,
                }
            ],
        }
        code, env_data = ds_post("/envelopes", env_body, token=token)
        if code not in (200, 201):
            error = env_data.get("message", f"Envelope creation failed ({code})")
            return render_template("embedded.html", templates=templates, signing_url=None, error=error)

        envelope_id = env_data.get("envelopeId")

        # 2. Get recipient view URL
        view_body = {
            "returnUrl": return_url,
            "authenticationMethod": "none",
            "email": signer_email,
            "userName": signer_name,
            "clientUserId": "demo-" + signer_email,
        }
        code2, view_data = ds_post(
            f"/envelopes/{envelope_id}/views/recipient", view_body, token=token
        )
        if code2 in (200, 201):
            signing_url = view_data.get("url")
        else:
            error = view_data.get("message", f"Recipient view failed ({code2})")

    return render_template(
        "embedded.html",
        templates=templates,
        signing_url=signing_url,
        envelope_id=envelope_id,
        error=error,
    )


@app.route("/embedded/complete")
def embedded_complete():
    event = request.args.get("event", "unknown")
    envelope_id = request.args.get("envelopeId", "")
    return render_template("embedded_complete.html", event=event, envelope_id=envelope_id)


# ── WEB FORMS ────────────────────────────────────────────────────────────────

@app.route("/webforms", methods=["GET", "POST"])
def webforms():
    token = session.get("access_token", "") or config.ACCESS_TOKEN
    prefill_data = None
    form_url = None
    error = None

    # Fetch available web forms
    code, wf_data = ds_get("/web_forms/forms", token=token) if token else (0, {})
    forms = wf_data.get("items", []) if code == 200 else []

    if request.method == "POST":
        form = request.form
        unique_id = form.get("unique_id", "").strip()
        form_id = form.get("form_id", "").strip()

        if form_id:
            # Create a web form instance with pre-fill values
            prefill_values = {}
            for key, val in form.items():
                if key.startswith("pf_") and val:
                    prefill_values[key.replace("pf_", "", 1)] = val

            instance_body = {
                "clientUserId": unique_id or f"user-{int(time.time())}",
                "formValues": prefill_values,
                "expirationOffset": 60,
            }
            code2, inst = ds_post(
                f"/web_forms/forms/{form_id}/instances", instance_body, token=token
            )
            if code2 in (200, 201):
                form_url = inst.get("formUrl")
                prefill_data = inst
            else:
                error = inst.get("message", f"Web form instance error ({code2})")
        else:
            error = "Select a web form to launch."

    return render_template(
        "webforms.html", forms=forms, prefill_data=prefill_data, form_url=form_url, error=error
    )


# ── MAESTRO ───────────────────────────────────────────────────────────────────

@app.route("/maestro")
def maestro():
    token = session.get("access_token", "") or config.ACCESS_TOKEN
    workflows = []
    instances = []
    plan_error = None

    if token:
        code, data = http.get(
            f"https://api-d.docusign.com/v1/accounts/{config.ACCOUNT_ID}/maestro/workflows",
            headers=ds_headers(token),
            timeout=15,
        ).status_code, {}
        r = http.get(
            f"https://api-d.docusign.com/v1/accounts/{config.ACCOUNT_ID}/maestro/workflows",
            headers=ds_headers(token),
            timeout=15,
        )
        code, data = r.status_code, r.json() if r.content else {}
        if code == 200:
            workflows = data.get("value", [])
        elif code == 403:
            detail = data.get("detail", "")
            if "plan" in detail.lower() or "permission" in detail.lower():
                plan_error = {
                    "code": 403,
                    "title": "Maestro Not Enabled",
                    "detail": detail or "Your account plan does not include Maestro Workflow Builder.",
                    "upgrade": "Maestro requires the eSignature Advanced or IAM plan. Contact your DocuSign account executive to enable it.",
                }
            else:
                plan_error = {"code": 403, "title": "Access Denied", "detail": detail}
        else:
            plan_error = {"code": code, "title": "API Error", "detail": data.get("message", str(data))}

    return render_template("maestro.html", workflows=workflows, instances=instances, plan_error=plan_error)


# ── NAVIGATOR / CLM ───────────────────────────────────────────────────────────

@app.route("/navigator")
def navigator():
    token = session.get("access_token", "") or config.ACCESS_TOKEN
    agreements = []
    plan_error = None
    stats = {}

    if token:
        r = http.get(
            f"https://api-d.docusign.com/v1/accounts/{config.ACCOUNT_ID}/agreements?limit=20",
            headers=ds_headers(token),
            timeout=15,
        )
        code, data = r.status_code, r.json() if r.content else {}
        if code == 200:
            agreements = data.get("data", [])
            stats = {
                "total": data.get("response_metadata", {}).get("count", len(agreements)),
            }
        elif code == 403:
            detail = data.get("detail", "")
            plan_error = {
                "code": 403,
                "title": "Navigator Not Enabled",
                "detail": detail or "Your account plan does not include Navigator for CLM.",
                "upgrade": "Navigator requires EnableNavigatorAPIDataOut to be enabled on your plan. Contact your DocuSign account team.",
            }
        else:
            plan_error = {"code": code, "title": "API Error", "detail": data.get("message", str(data))}

    return render_template("navigator.html", agreements=agreements, plan_error=plan_error, stats=stats)


# ── CONNECT / WEBHOOKS ────────────────────────────────────────────────────────

@app.route("/webhooks")
def webhooks():
    token = session.get("access_token", "") or config.ACCESS_TOKEN
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
        events=webhook_events[-50:],
        error=error,
        webhook_url=request.host_url.rstrip("/") + "/webhook/receive",
    )


@app.route("/webhook/receive", methods=["POST"])
def webhook_receive():
    raw = request.get_data()
    sig = request.headers.get("X-DocuSign-Signature-1", "")

    # HMAC verification (if secret configured)
    if config.WEBHOOK_SECRET:
        expected = hmac.new(config.WEBHOOK_SECRET.encode(), raw, hashlib.sha256).hexdigest()
        if not hmac.compare_digest(expected, sig):
            return jsonify({"error": "invalid signature"}), 401

    try:
        payload = request.get_json(force=True) or {}
    except Exception:
        payload = {}

    event = {
        "id": len(webhook_events) + 1,
        "received_at": datetime.utcnow().isoformat() + "Z",
        "event": payload.get("event", "unknown"),
        "envelope_id": payload.get("data", {}).get("envelopeId", ""),
        "status": payload.get("data", {}).get("envelopeSummary", {}).get("status", ""),
        "sender": payload.get("data", {}).get("envelopeSummary", {}).get("sender", {}).get("email", ""),
        "raw": json.dumps(payload, indent=2)[:2000],
    }
    webhook_events.append(event)
    return jsonify({"received": True}), 200


@app.route("/webhook/events")
def webhook_events_api():
    return jsonify(webhook_events[-50:])


@app.route("/webhook/clear", methods=["POST"])
def webhook_clear():
    webhook_events.clear()
    return jsonify({"cleared": True})


# ── API EXPLORER ──────────────────────────────────────────────────────────────

@app.route("/explorer")
def explorer():
    endpoints = [
        {
            "group": "eSignature",
            "color": "cyan",
            "routes": [
                {"method": "GET", "path": "/envelopes", "desc": "List envelopes with filters"},
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
                {"method": "GET", "path": "/web_forms/forms", "desc": "List available web forms"},
                {"method": "GET", "path": "/web_forms/forms/{id}", "desc": "Get form definition"},
                {"method": "POST", "path": "/web_forms/forms/{id}/instances", "desc": "Create pre-filled instance"},
                {"method": "GET", "path": "/web_forms/forms/{id}/instances/{instanceId}", "desc": "Get form instance status"},
            ],
        },
        {
            "group": "Maestro",
            "color": "amber",
            "routes": [
                {"method": "GET", "path": "/maestro/workflows", "desc": "List Maestro workflows"},
                {"method": "POST", "path": "/maestro/workflows/{id}/instances", "desc": "Trigger workflow instance"},
                {"method": "GET", "path": "/maestro/workflows/{id}/instances/{iid}", "desc": "Get workflow instance state"},
                {"method": "POST", "path": "/maestro/workflows/{id}/instances/{iid}/cancel", "desc": "Cancel running instance"},
            ],
        },
        {
            "group": "Navigator (CLM)",
            "color": "emerald",
            "routes": [
                {"method": "GET", "path": "/agreements", "desc": "List all agreements"},
                {"method": "GET", "path": "/agreements/{id}", "desc": "Get agreement details & provisions"},
                {"method": "GET", "path": "/agreements?filter=...", "desc": "Filter by party, date, status, type"},
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


@app.route("/explorer/call", methods=["POST"])
def explorer_call():
    token = session.get("access_token", "") or config.ACCESS_TOKEN
    path = request.json.get("path", "")
    method = request.json.get("method", "GET").upper()
    body = request.json.get("body", None)

    if not path:
        return jsonify({"error": "No path provided"}), 400

    url = config.ESIGN_BASE + path
    try:
        if method == "GET":
            r = http.get(url, headers=ds_headers(token), timeout=15)
        elif method == "POST":
            r = http.post(url, headers=ds_headers(token), json=body, timeout=15)
        elif method == "PUT":
            r = http.put(url, headers=ds_headers(token), json=body, timeout=15)
        elif method == "DELETE":
            r = http.delete(url, headers=ds_headers(token), timeout=15)
        else:
            return jsonify({"error": "Unsupported method"}), 400

        try:
            resp_body = r.json()
        except Exception:
            resp_body = {"raw": r.text[:2000]}

        return jsonify({
            "status_code": r.status_code,
            "url": url,
            "response": resp_body,
            "latency_ms": round(r.elapsed.total_seconds() * 1000),
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5050))
    app.run(debug=True, port=port)
