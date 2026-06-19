import os
import io
import json
import base64
import hmac
import hashlib
import time
from datetime import datetime, date
from flask import Flask, render_template, request, jsonify, redirect, url_for, session
from flask_cors import CORS
import requests as http
import config
from gov_scenarios import (
    AGREEMENT_CLOUD_CAPABILITIES,
    API_EXAMPLES,
    CLM_CAPABILITIES,
    CONVERGENCE_POINTS,
    generate_custom_scenario,
)
from state_builder import DEFAULT_STATE, get_state_package, list_states

app = Flask(__name__)
app.secret_key = config.SECRET_KEY
CORS(app, resources={r"/webhook/*": {"origins": "*"}})


@app.after_request
def allow_private_network_access(response):
    """Let Chrome allow DocuSign (public) to navigate an iframe back to localhost (private).
    Without this header Chrome blocks the return-URL redirect with a PNA error."""
    response.headers["Access-Control-Allow-Private-Network"] = "true"
    return response


@app.before_request
def handle_pna_preflight():
    """Respond to Chrome's PNA OPTIONS preflight before the iframe navigation."""
    from flask import make_response as mkr
    if request.method == "OPTIONS" and request.headers.get("Access-Control-Request-Private-Network"):
        resp = mkr()
        resp.headers["Access-Control-Allow-Private-Network"] = "true"
        resp.headers["Access-Control-Allow-Origin"] = request.headers.get("Origin", "*")
        resp.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
        resp.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
        return resp, 204

# ── In-memory webhook event log ──────────────────────────────────────────────
webhook_events = []


def active_token_value():
    tok = config.ACCESS_TOKEN or session.get("access_token", "")
    if not tok and config.load_rsa_private_key():
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


def webforms_base():
    acct = session.get("account_id", config.ACCOUNT_ID)
    return f"https://apps-d.docusign.com/api/webforms/v1.1/accounts/{acct}"


def iam_base():
    acct = session.get("account_id", config.ACCOUNT_ID)
    return f"https://api-d.docusign.com/v1/accounts/{acct}"


def parse_workflows(data):
    """Normalize Workflow Builder list responses."""
    if not isinstance(data, dict):
        return []
    for key in ("data", "value", "workflows"):
        items = data.get(key)
        if isinstance(items, list):
            return items
    return []


def parse_webforms(data):
    """Normalize Web Forms list responses."""
    if not isinstance(data, dict):
        return []
    for key in ("items", "forms", "data"):
        items = data.get(key)
        if isinstance(items, list):
            return items
    return []


WEBFORM_SKIP_TYPES = {
    "root", "view", "step", "summary", "esignaction", "thankyou",
    "text_block", "image", "submit", "datesigned", "signature", "welcome",
}
WEBFORM_FILLABLE_TYPES = {
    "textbox", "email", "phonenumber", "number", "date", "select",
    "radiobuttongroup", "checkboxgroup", "dropdown", "textarea", "checkbox", "radio",
}


def extract_webform_fields(data):
    """Extract pre-fillable fields from a Web Forms definition."""
    fields = []
    seen = set()

    def add_field(name, label, comp_type, required=False):
        if not name or name in seen:
            return
        if comp_type in WEBFORM_SKIP_TYPES:
            return
        seen.add(name)
        fields.append({
            "name": name,
            "label": label or name,
            "type": comp_type or "text",
            "required": required,
        })

    # Legacy array format
    for comp in data.get("components") or data.get("formProperties", {}).get("components") or []:
        if not isinstance(comp, dict):
            continue
        name = comp.get("name") or comp.get("fieldName") or comp.get("label") or ""
        comp_type = (comp.get("type") or "").lower()
        add_field(name, comp.get("label") or name, comp_type, comp.get("required", False))

    # Web Forms v1.1 object map under formContent.components
    components = data.get("formContent", {}).get("components", {})
    if isinstance(components, dict):
        for key, comp in components.items():
            if not isinstance(comp, dict):
                continue
            comp_type = (comp.get("componentType") or comp.get("type") or "").lower()
            simple_type = comp.get("type")
            if comp_type in WEBFORM_FILLABLE_TYPES or simple_type in ("TextBox", "Email"):
                name = comp.get("componentKey") or comp.get("componentName") or key
                label = comp.get("label") or comp.get("text") or name
                add_field(name, label, comp_type or simple_type.lower(), comp.get("required", False))

    return fields


def webform_instance_url(inst):
    """Build a launchable Web Form URL from createInstance response."""
    url = inst.get("formUrl") or ""
    token = inst.get("instanceToken") or ""
    if url and token and "instanceToken=" not in url:
        sep = "#" if "#" not in url else "&" if "?" in url else "#"
        if sep == "#":
            return f"{url}#instanceToken={token}"
    return url


def build_default_trigger_inputs(schema, user_email="", user_name="Demo User"):
    """Build sample trigger_inputs from a workflow trigger_input_schema."""
    values = {}
    default_user = {"email": user_email or "demo@example.gov", "name": user_name or "Demo User"}
    for field in schema or []:
        name = field.get("field_name")
        ftype = (field.get("field_data_type") or "").lower()
        if not name:
            continue
        if ftype == "date":
            values[name] = date.today().isoformat()
        elif ftype == "user":
            values[name] = dict(default_user)
        elif ftype in ("string", "text"):
            values[name] = "Demo value"
        elif ftype in ("number", "integer", "float"):
            values[name] = 0
        elif ftype == "boolean":
            values[name] = True
        else:
            values[name] = ""
    return values


def explain_trigger_failure(detail, status_code=400):
    """Turn DocuSign trigger errors into demo-friendly guidance."""
    detail = detail or ""
    if status_code == 404:
        return (
            "Workflow trigger endpoint not found. This portal uses "
            "POST /workflows/{id}/actions/trigger (not /instances)."
        )
    if "trigger type=Url" in detail:
        return (
            "This workflow uses a URL/manual trigger — it cannot be started via external API POST. "
            "Start it from the Maestro UI, or use “List Instances” below to inspect past runs."
        )
    if "Agreement-Desk" in detail:
        return (
            "This workflow is linked to Agreement Desk and cannot be triggered externally via API."
        )
    if "trigger type=Event" in detail:
        return (
            "This workflow uses an Event trigger and must be started by its configured event source."
        )
    return detail or f"Workflow trigger failed (HTTP {status_code})."


def fetch_workflow_trigger_requirements(workflow_id, token):
    code, data = ds_get(
        f"/workflows/{workflow_id}/trigger-requirements",
        token=token,
        base=iam_base(),
    )
    return code, data


def trigger_workflow(workflow_id, token, instance_name=None, trigger_inputs=None, user_email="", user_name="Demo User"):
    """Trigger a workflow via POST /workflows/{id}/actions/trigger."""
    req_code, req_data = fetch_workflow_trigger_requirements(workflow_id, token)
    schema = req_data.get("trigger_input_schema", []) if req_code == 200 else []
    inputs = trigger_inputs if trigger_inputs is not None else build_default_trigger_inputs(
        schema, user_email=user_email, user_name=user_name,
    )
    body = {
        "instance_name": instance_name or f"Portal demo — {int(time.time())}",
        "trigger_inputs": inputs,
    }
    url = f"{iam_base()}/workflows/{workflow_id}/actions/trigger"
    r = http.post(url, headers=ds_headers(token), json=body, timeout=15)
    try:
        resp = r.json()
    except Exception:
        resp = {"raw": r.text[:1000]}
    if r.status_code not in (200, 201):
        detail = resp.get("detail") or resp.get("message") or resp.get("title") or ""
        resp["friendly_error"] = explain_trigger_failure(detail, r.status_code)
    return r.status_code, resp, body, req_data if req_code == 200 else {}


def fetch_workflow_instances(workflow_id, token, limit=10):
    code, data = ds_get(
        f"/workflows/{workflow_id}/instances?limit={limit}",
        token=token,
        base=iam_base(),
    )
    if code != 200:
        return []
    return parse_workflows(data)


def _safe_json(r):
    try:
        return r.json()
    except Exception:
        return {"error": "non-JSON response", "body": r.text[:500]}


def ds_get(path, token=None, base=None):
    url = (base or esign_base()) + path
    r = http.get(url, headers=ds_headers(token), timeout=15)
    return r.status_code, _safe_json(r) if r.content else {}


def ds_post(path, body, token=None, base=None):
    url = (base or esign_base()) + path
    r = http.post(url, headers=ds_headers(token), json=body, timeout=15)
    return r.status_code, _safe_json(r) if r.content else {}


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
        private_key = config.load_rsa_private_key()
        if not private_key:
            return None
        now = int(time.time())
        payload = {
            "iss": config.INTEGRATION_KEY,
            "sub": config.USER_ID,
            "aud": "account-d.docusign.com",
            "iat": now,
            "exp": now + 3600,
            "scope": "signature impersonation adm_store_unified_repo_read aow_manage webforms_read webforms_instance_read webforms_instance_write",
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
        app.logger.warning("JWT token request failed: %s %s", resp.status_code, resp.text[:200])
        return ""
    except Exception as exc:
        app.logger.warning("JWT token error: %s", exc)
        return ""


@app.context_processor
def inject_globals():
    tok = active_token_value()
    oauth = bool(session.get("access_token"))
    return {
        "active_token": tok,
        "auth_method": "oauth" if oauth else ("jwt" if tok else None),
        "account_id":   session.get("account_id", config.ACCOUNT_ID),
        "base_uri":     session.get("base_uri",   config.BASE_URI),
        "user_email":   session.get("user_email", "") or ("Connected via JWT" if tok and not oauth else ""),
        "user_name":    session.get("user_name", "") or ("Demo Account" if tok else "Guest"),
    }


# ── Routes ───────────────────────────────────────────────────────────────────

@app.route("/")
def index():
    token = active_token_value()
    stats = {}
    recent_envelopes = []
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
        code3, recent_data = ds_get(
            "/envelopes?from_date=2024-01-01&order_by=last_modified&order=desc&count=5",
            token=token,
        )
        if code3 == 200:
            recent_envelopes = recent_data.get("envelopes", [])
    return render_template(
        "index.html",
        stats=stats,
        error=error,
        token=token,
        recent_envelopes=recent_envelopes,
    )


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
        "scope": "signature impersonation adm_store_unified_repo_read aow_manage webforms_read webforms_instance_read webforms_instance_write",
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
    access_token = data.get("access_token", "")
    session["access_token"] = access_token

    # Fetch account info so routes use the correct account_id
    userinfo = http.get(
        "https://account-d.docusign.com/oauth/userinfo",
        headers={"Authorization": f"Bearer {access_token}"},
        timeout=15,
    )
    if userinfo.status_code == 200:
        udata = userinfo.json()
        accounts = udata.get("accounts", [])
        # Pick the default account, or fall back to first
        acct = next((a for a in accounts if a.get("is_default")), accounts[0] if accounts else {})
        session["account_id"] = acct.get("account_id", config.ACCOUNT_ID)
        session["base_uri"] = acct.get("base_uri", config.BASE_URI)
        session["user_email"] = udata.get("email", "")
        session["user_name"] = udata.get("name") or udata.get("given_name", "Demo User")

    return redirect(url_for("index"))


@app.route("/oauth/logout")
def oauth_logout():
    session.clear()
    return redirect(url_for("index"))


@app.route("/debug/navigator/<account_id>")
def debug_navigator(account_id):
    tok = active_token_value()
    if not tok:
        return jsonify({"status": 0, "error": "no token"})
    r = http.get(
        f"https://api-d.docusign.com/v1/accounts/{account_id}/agreements?limit=5",
        headers=ds_headers(tok), timeout=15,
    )
    try:
        d = r.json()
    except Exception:
        d = {}
    count = d.get("response_metadata", {}).get("count", len(d.get("data", [])))
    return jsonify({"status": r.status_code, "count": count,
                    "error": d.get("detail") or d.get("message"), "sample": d.get("data", [])[:1]})


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
    token = active_token_value()
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
    token = active_token_value()
    code, env = ds_get(f"/envelopes/{envelope_id}", token=token)
    code_r, rdata = ds_get(f"/envelopes/{envelope_id}/recipients", token=token)
    recipients = rdata.get("signers", []) + rdata.get("carbonCopies", []) if code_r == 200 else []
    code_a, adata = ds_get(f"/envelopes/{envelope_id}/audit_events", token=token)
    audit = adata.get("auditEvents", []) if code_a == 200 else []
    error = None if code == 200 else env.get("message", f"Error {code}")
    return render_template(
        "envelope_detail.html", env=env, recipients=recipients, audit=audit, error=error
    )


@app.route("/api/template/<template_id>")
def api_template_detail(template_id):
    """Return roles and text tab labels for a given template — used by the send form."""
    token = active_token_value()
    if not token:
        return jsonify({"error": "not authenticated"}), 401
    code, data = ds_get(f"/templates/{template_id}", token=token)
    if code != 200:
        return jsonify({"error": data.get("message", f"HTTP {code}")}), code

    # Extract recipient roles
    recipients = data.get("recipients", {})
    roles = []
    for role in (
        recipients.get("signers", [])
        + recipients.get("certifiedDeliveries", [])
        + recipients.get("carbonCopies", [])
        + recipients.get("inPersonSigners", [])
    ):
        roles.append({
            "roleName": role.get("roleName", ""),
            "name":     role.get("name", ""),
            "email":    role.get("email", ""),
        })

    # Extract all user-fillable tab types with their actual type so the send route
    # can place each value in the correct array (textTabs, companyTabs, etc.)
    FILLABLE_TYPES = [
        "textTabs", "companyTabs", "titleTabs", "emailTabs",
        "fullNameTabs", "dateTabs", "numberTabs", "noteTabs",
    ]
    tab_defs = []
    seen = set()
    for recipient in recipients.get("signers", []) + recipients.get("certifiedDeliveries", []):
        tabs = recipient.get("tabs", {})
        for tab_type in FILLABLE_TYPES:
            for tab in tabs.get(tab_type, []):
                label = tab.get("tabLabel", "")
                # Skip internal/auto-populated labels (start with \) and duplicates
                if not label or label in seen or label.startswith("\\"):
                    continue
                # Skip read-only / locked tabs — they don't need user input
                if tab.get("locked") in (True, "true") or tab.get("editable") == "false":
                    continue
                seen.add(label)
                tab_defs.append({
                    "label":    label,
                    "type":     tab_type,
                    "required": tab.get("required", "false") in (True, "true"),
                    "value":    tab.get("value", ""),
                })

    return jsonify({"roles": roles, "tabs": tab_defs})


@app.route("/api/templates-list")
def api_templates_list():
    """Return all templates on the account — used by the Agent flow picker."""
    token = active_token_value()
    if not token:
        return jsonify({"error": "not authenticated", "templates": []}), 401
    code, data = ds_get("/templates", token=token)
    templates = [
        {"templateId": t["templateId"], "name": t.get("name", t["templateId"])}
        for t in data.get("envelopeTemplates", [])
    ] if code == 200 else []
    return jsonify({"templates": templates})


def _doc_templates():
    today = datetime.utcnow().strftime("%B %d, %Y")
    return {
        "msa": {
            "title": "Master Service Agreement",
            "short": "MSA",
            "sections": [
                ("Parties", "This Master Service Agreement (\"Agreement\") is entered into as of {date} between the City of Austin, a Texas municipal corporation (\"Agency\"), and the Vendor identified in the signature block below (\"Vendor\")."),
                ("Scope of Services", "Vendor agrees to provide the services described in any Statement of Work (\"SOW\") executed under this Agreement. Each SOW is incorporated herein by reference and shall be governed by the terms of this Agreement."),
                ("Term", "This Agreement commences on the Effective Date and continues for a period of three (3) years, unless earlier terminated in accordance with Section 8. SOWs may extend beyond the Agreement term only if expressly stated therein."),
                ("Compensation", "Agency shall pay Vendor the fees set forth in each SOW within thirty (30) days of receipt of a correct invoice. All invoices must reference the applicable SOW number and purchase order."),
                ("Confidentiality", "Each party agrees to hold the other party's Confidential Information in strict confidence and not to disclose it to third parties without prior written consent, except as required by applicable law or court order."),
                ("Intellectual Property", "All work product, deliverables, and materials created by Vendor specifically for Agency under any SOW shall be considered work made for hire and shall be the sole property of Agency upon full payment."),
                ("Warranties", "Vendor warrants that (a) all services will be performed in a professional and workmanlike manner; (b) Vendor has the right to enter into this Agreement; and (c) the services will not infringe any third-party intellectual property rights."),
                ("Termination", "Either party may terminate this Agreement or any SOW for convenience upon thirty (30) days written notice. Agency may terminate immediately for cause if Vendor materially breaches any term and fails to cure such breach within ten (10) days of notice."),
                ("Governing Law", "This Agreement shall be governed by the laws of the State of Texas without regard to its conflict of law provisions. Disputes shall be resolved in Travis County, Texas."),
                ("Signatures", "The parties have executed this Agreement as of the date first written above.\n\nAGENCY: City of Austin\n\nBy: ___________________________     Date: ___________\nName: {name}\nTitle: Authorized Representative\n\nVENDOR:\n\nBy: ___________________________     Date: ___________\nName:\nTitle:"),
            ],
        },
        "nda": {
            "title": "Non-Disclosure Agreement",
            "short": "NDA",
            "sections": [
                ("Parties", "This Non-Disclosure Agreement (\"Agreement\") is entered into as of {date} between the City of Austin (\"Disclosing Party\") and the recipient identified in the signature block below (\"Receiving Party\")."),
                ("Purpose", "The parties wish to explore a potential business relationship (\"Purpose\"). In connection with the Purpose, the Disclosing Party may disclose certain confidential and proprietary information to the Receiving Party."),
                ("Definition of Confidential Information", "\"Confidential Information\" means any non-public information disclosed by the Disclosing Party, whether orally, in writing, or by any other means, that is designated as confidential or that reasonably should be understood to be confidential given the nature of the information and circumstances of disclosure."),
                ("Obligations", "The Receiving Party shall (a) hold all Confidential Information in strict confidence; (b) not disclose Confidential Information to any third party without prior written consent; (c) use Confidential Information solely for the Purpose; and (d) protect Confidential Information using at least the same degree of care used to protect its own confidential information."),
                ("Exclusions", "Confidential Information does not include information that (a) is or becomes publicly known through no breach by the Receiving Party; (b) was rightfully known before disclosure; (c) is independently developed without use of Confidential Information; or (d) is required to be disclosed by law."),
                ("Term", "This Agreement shall remain in effect for two (2) years from the Effective Date. The confidentiality obligations shall survive termination for an additional three (3) years."),
                ("Return of Information", "Upon request, the Receiving Party shall promptly return or destroy all Confidential Information and certify in writing that it has done so."),
                ("Signatures", "The parties have executed this Agreement as of the date first written above.\n\nDISCLOSING PARTY:\n\nBy: ___________________________     Date: ___________\nName: {name}\nTitle: Authorized Representative\n\nRECEIVING PARTY:\n\nBy: ___________________________     Date: ___________\nName:\nTitle:"),
            ],
        },
        "mou": {
            "title": "Memorandum of Understanding",
            "short": "MOU",
            "sections": [
                ("Purpose", "This Memorandum of Understanding (\"MOU\") is entered into as of {date} between the City of Austin (\"City\") and the Partner Agency identified below, to set forth the terms of collaboration on a joint initiative of mutual benefit."),
                ("Background", "The parties have identified a shared interest in improving public services through coordinated action. This MOU formalizes the intent to collaborate and establishes a framework for the partnership."),
                ("Scope of Collaboration", "The parties agree to collaborate on the following activities: (a) sharing of relevant data and resources; (b) coordinating program delivery where appropriate; (c) conducting joint outreach and communications; and (d) reporting jointly on outcomes as agreed."),
                ("Roles and Responsibilities", "Each party shall designate a primary point of contact. The parties shall meet at least quarterly to review progress. Decisions requiring commitment of resources beyond those described herein require written amendment to this MOU."),
                ("Funding", "This MOU does not obligate either party to expend funds beyond those separately authorized. Any cost-sharing arrangement shall be set forth in a separate written agreement."),
                ("Term and Termination", "This MOU is effective upon signature of both parties and remains in effect for one (1) year, with the option to renew by mutual written agreement. Either party may withdraw upon thirty (30) days written notice."),
                ("No Legal Partnership", "This MOU does not create a legal partnership, joint venture, or agency relationship between the parties. Neither party may bind the other to any obligation without express written authority."),
                ("Signatures", "The parties have signed this MOU as of the date first written above.\n\nCITY OF AUSTIN:\n\nBy: ___________________________     Date: ___________\nName: {name}\nTitle: Authorized Representative\n\nPARTNER AGENCY:\n\nBy: ___________________________     Date: ___________\nName:\nTitle:"),
            ],
        },
        "grant": {
            "title": "Grant Agreement",
            "short": "Grant",
            "sections": [
                ("Award", "This Grant Agreement (\"Agreement\") is entered into as of {date} between the City of Austin Office of Grants Management (\"Grantor\") and the Recipient identified in the signature block below (\"Recipient\"). Grantor hereby awards a grant in the amount specified in Exhibit A."),
                ("Purpose of Grant", "The grant funds shall be used solely for the purposes described in Recipient's approved application, which is incorporated herein by reference. Any change in scope requires prior written approval from Grantor."),
                ("Performance Period", "The performance period commences on the Effective Date and ends as specified in Exhibit A. No funds may be expended after the end date without written approval."),
                ("Reporting Requirements", "Recipient shall submit quarterly progress reports no later than fifteen (15) days after the close of each quarter. A final performance report is due within sixty (60) days of the end of the performance period."),
                ("Financial Management", "Recipient shall maintain complete and accurate financial records for all grant expenditures for a period of five (5) years following the end of the performance period. Grantor may audit Recipient's books and records upon reasonable notice."),
                ("Allowable Costs", "Only costs that are reasonable, necessary, allocable, and allowable under applicable federal and state guidelines may be charged to this grant. Recipient shall obtain prior written approval for any budget modification exceeding 10% of any line item."),
                ("Non-Discrimination", "Recipient shall comply with all applicable federal, state, and local non-discrimination laws and shall not discriminate in the delivery of services funded under this Agreement."),
                ("Signatures", "The parties have executed this Agreement as of the date first written above.\n\nGRANTOR: City of Austin\n\nBy: ___________________________     Date: ___________\nName: {name}\nTitle: Grants Manager\n\nRECIPIENT:\n\nBy: ___________________________     Date: ___________\nName:\nTitle:"),
            ],
        },
        "vendor": {
            "title": "Vendor Agreement",
            "short": "Vendor",
            "sections": [
                ("Agreement", "This Vendor Agreement (\"Agreement\") is entered into as of {date} between the City of Austin Procurement Division (\"City\") and the Vendor identified in the signature block below (\"Vendor\")."),
                ("Products and Services", "Vendor agrees to provide the products and/or services described in the attached Purchase Order, which is incorporated by reference. Vendor shall deliver all items in accordance with the specifications and timeline set forth therein."),
                ("Pricing and Payment", "City shall pay Vendor the prices listed in the Purchase Order within forty-five (45) days of receipt and acceptance of the goods or services and a correct invoice. All prices are firm and include applicable taxes."),
                ("Delivery and Acceptance", "All deliveries are FOB destination unless otherwise specified. City reserves the right to inspect and reject any goods or services that do not conform to specifications. Rejected items must be replaced at Vendor's expense within five (5) business days."),
                ("Insurance", "Vendor shall maintain commercial general liability insurance with limits of at least $1,000,000 per occurrence and $2,000,000 aggregate, and shall provide City with certificates of insurance upon request."),
                ("Indemnification", "Vendor shall defend, indemnify, and hold harmless City and its officers, employees, and agents from any claims, damages, or expenses arising from Vendor's performance under this Agreement."),
                ("Compliance", "Vendor shall comply with all applicable federal, state, and local laws, including but not limited to the Texas Government Code, City procurement rules, and all applicable labor and employment laws."),
                ("Signatures", "The parties have executed this Agreement as of the date first written above.\n\nCITY OF AUSTIN:\n\nBy: ___________________________     Date: ___________\nName: {name}\nTitle: Procurement Officer\n\nVENDOR:\n\nBy: ___________________________     Date: ___________\nName:\nTitle:"),
            ],
        },
        "employment": {
            "title": "Employment Offer Letter",
            "short": "Offer",
            "sections": [
                ("Offer of Employment", "This Employment Offer Letter (\"Offer\") is issued as of {date} by the City of Austin Department of Human Resources. On behalf of the City, we are pleased to offer you a position as described herein, subject to the conditions set forth below."),
                ("Position and Start Date", "Position: As specified during your interview process. Department: As assigned. Start Date: As agreed with your hiring manager. This is a full-time, regular position subject to the City of Austin Civil Service Rules."),
                ("Compensation", "Your starting base salary will be as communicated by HR and is subject to standard City of Austin pay practices. Compensation is reviewed annually as part of the City's performance appraisal process."),
                ("Benefits", "You will be eligible for the City of Austin benefits package, including health, dental, and vision insurance, participation in the Texas Municipal Retirement System (TMRS), paid vacation, sick leave, and all City-observed holidays."),
                ("Conditions of Employment", "This offer is contingent upon (a) successful completion of a background check; (b) verification of your eligibility to work in the United States; and (c) any other conditions communicated by Human Resources."),
                ("At-Will Employment", "Except as otherwise provided by City policy or civil service rules, your employment is at-will and may be terminated by either party at any time, with or without cause."),
                ("Acceptance", "Please sign and return this letter by the date specified by HR to confirm your acceptance of this offer. By signing below, you acknowledge that you have read and understood the terms set forth herein."),
                ("Signatures", "Accepted and agreed:\n\nCITY OF AUSTIN:\n\nBy: ___________________________     Date: ___________\nName: {name}\nTitle: HR Director\n\nEMPLOYEE:\n\nBy: ___________________________     Date: ___________\nName:\nPrinted Name:"),
            ],
        },
    }


def build_doc_extractions(doc_key, signer_name, signer_email, subject=""):
    """Structured key fields extracted from generated document metadata."""
    templates = _doc_templates()
    tmpl = templates.get(doc_key, templates["msa"])
    today = datetime.utcnow().strftime("%B %d, %Y")
    counterparty = {
        "msa": "Vendor",
        "nda": "Receiving Party",
        "mou": "Partner Agency",
        "grant": "Grant Recipient",
        "vendor": "Vendor",
        "employment": "Employee",
    }
    term = {
        "msa": "3 years",
        "nda": "2 years (+ 3 year confidentiality)",
        "mou": "1 year",
        "grant": "Per Exhibit A",
        "vendor": "Per Purchase Order",
        "employment": "At-will",
    }
    return {
        "document_type": tmpl["title"],
        "document_short": tmpl["short"],
        "effective_date": today,
        "agency_party": "City of Austin",
        "counterparty_role": counterparty.get(doc_key, "Counterparty"),
        "signer_name": signer_name,
        "signer_email": signer_email,
        "email_subject": subject or f"{tmpl['title']} — Signature Required",
        "contract_term": term.get(doc_key, "As specified"),
        "governing_law": "State of Texas",
        "jurisdiction": "Travis County, Texas",
    }


def _match_doc_type(user_input):
    """Map free-text input to a known doc type key."""
    s = user_input.lower().strip()
    mapping = {
        "msa": "msa", "master service": "msa", "master service agreement": "msa",
        "nda": "nda", "non-disclosure": "nda", "non disclosure": "nda", "confidentiality": "nda",
        "mou": "mou", "memorandum": "mou", "memorandum of understanding": "mou",
        "grant": "grant", "grant agreement": "grant", "grant award": "grant",
        "vendor": "vendor", "vendor agreement": "vendor", "purchase": "vendor",
        "employment": "employment", "offer": "employment", "offer letter": "employment",
        "hr": "employment", "onboarding": "employment",
    }
    for key, val in mapping.items():
        if key in s:
            return val
    return "msa"  # default


def _pdf_safe(text):
    """Replace characters outside Helvetica's Latin-1 range with ASCII equivalents."""
    return (text
        .replace("—", "--")   # em dash
        .replace("–", "-")    # en dash
        .replace("‘", "'")    # left single quote
        .replace("’", "'")    # right single quote
        .replace("“", '"')    # left double quote
        .replace("”", '"')    # right double quote
        .replace("…", "...")  # ellipsis
        .replace(" ", " ")    # non-breaking space
        .replace("®", "(R)")  # registered trademark
        .replace("©", "(c)")  # copyright
    )


def _generate_pdf(doc_type_key, signer_name="Corey Washington"):
    """Generate a formatted PDF and return base64 string."""
    from fpdf import FPDF
    from fpdf.enums import XPos, YPos

    templates = _doc_templates()
    tmpl = templates.get(doc_type_key, templates["msa"])
    today = datetime.now().strftime("%B %d, %Y")

    pdf = FPDF()
    pdf.set_margins(22, 22, 22)
    pdf.add_page()

    # Header bar
    pdf.set_fill_color(13, 13, 13)
    pdf.rect(0, 0, 210, 14, "F")
    pdf.set_font("Helvetica", "B", 9)
    pdf.set_text_color(255, 255, 255)
    pdf.set_xy(22, 4)
    pdf.cell(0, 6, "CITY OF AUSTIN  |  DocuSign IAM Demo",
             new_x=XPos.LMARGIN, new_y=YPos.NEXT)

    pdf.ln(10)

    # Title
    pdf.set_font("Helvetica", "B", 20)
    pdf.set_text_color(13, 13, 13)
    pdf.cell(0, 10, _pdf_safe(tmpl["title"].upper()),
             new_x=XPos.LMARGIN, new_y=YPos.NEXT)

    # Meta line
    pdf.set_font("Helvetica", "", 9)
    pdf.set_text_color(113, 113, 122)
    pdf.cell(0, 6, f"Effective Date: {today}    |    Account 13397097    |    Demo Environment",
             new_x=XPos.LMARGIN, new_y=YPos.NEXT)

    # Divider
    pdf.set_draw_color(232, 231, 226)
    pdf.set_line_width(0.5)
    pdf.line(22, pdf.get_y() + 2, 188, pdf.get_y() + 2)
    pdf.ln(6)

    # Sections
    for i, (heading, body) in enumerate(tmpl["sections"]):
        body = _pdf_safe(body.replace("{date}", today).replace("{name}", signer_name))

        pdf.set_font("Helvetica", "B", 10)
        pdf.set_text_color(13, 13, 13)
        pdf.cell(0, 7, _pdf_safe(f"{i + 1}.  {heading.upper()}"),
                 new_x=XPos.LMARGIN, new_y=YPos.NEXT)

        pdf.set_font("Helvetica", "", 9.5)
        pdf.set_text_color(60, 60, 60)
        pdf.multi_cell(0, 5.5, body)
        pdf.ln(4)

    # Footer
    pdf.set_y(-20)
    pdf.set_font("Helvetica", "", 8)
    pdf.set_text_color(161, 161, 170)
    pdf.cell(0, 5, f"Generated via DocuSign IAM Gov Demo  |  {today}  |  DRAFT -- NOT FOR EXECUTION",
             align="C")

    raw = pdf.output()
    return base64.b64encode(bytes(raw)).decode("ascii")


@app.route("/generate-doc", methods=["POST"])
def generate_doc():
    """Generate a PDF for a given doc type, create an envelope, optionally return embedded URL."""
    token = active_token_value()
    if not token:
        return jsonify({"error": "Not authenticated. Please login first."}), 401

    data       = request.get_json() or {}
    raw_type   = data.get("doc_type", "MSA")
    name       = data.get("signer_name", "Corey Washington").strip()
    email      = data.get("signer_email", "cwdocusign1@gmail.com").strip()
    embedded   = data.get("embedded", False)
    subject    = data.get("subject", "").strip()

    doc_key    = _match_doc_type(raw_type)
    templates  = _doc_templates()
    tmpl       = templates[doc_key]

    try:
        doc_b64 = _generate_pdf(doc_key, signer_name=name)
    except Exception as e:
        return jsonify({"error": f"PDF generation failed: {e}"}), 500

    email_subject = subject or f"{tmpl['title']} — Signature Required"
    doc_name      = f"{tmpl['short']} Draft — {datetime.utcnow().strftime('%b %d %Y')}.pdf"

    signer_body = {
        "email":       email,
        "name":        name,
        "recipientId": "1",
        "tabs": {
            "signHereTabs": [{
                "documentId": "1",
                "pageNumber":  "1",
                "anchorString": "By: ___",
                "anchorUnits":  "pixels",
                "anchorXOffset": "0",
                "anchorYOffset": "0",
            }]
        },
    }

    if embedded:
        signer_body["clientUserId"] = f"demo-{email}"

    env_body = {
        "emailSubject": email_subject,
        "status": "sent",
        "documents": [{
            "documentId":    "1",
            "name":          doc_name,
            "fileExtension": "pdf",
            "documentBase64": doc_b64,
        }],
        "recipients": {"signers": [signer_body]},
    }

    api_steps = [{
        "step": 1,
        "label": "Generate PDF",
        "method": "LOCAL",
        "path": f"Document: {tmpl['title']}",
        "status": 200,
        "detail": f"{len(tmpl['sections'])} sections · anchor signature tab",
    }]

    code, env_data = ds_post("/envelopes", env_body, token=token)
    api_steps.append({
        "step": 2,
        "label": "Create envelope",
        "method": "POST",
        "path": "/restapi/v2.1/accounts/{accountId}/envelopes",
        "status": code,
        "detail": f"status=sent · recipient={email}",
    })
    if code not in (200, 201):
        return jsonify({"error": env_data.get("message", f"Envelope error {code}"), "raw": env_data, "apiSteps": api_steps}), 400

    envelope_id = env_data.get("envelopeId")
    extractions = build_doc_extractions(doc_key, name, email, subject)
    result = {
        "success":     True,
        "envelopeId":  envelope_id,
        "docType":     tmpl["title"],
        "docKey":      doc_key,
        "embedded":    embedded,
        "extractions": extractions,
        "apiSteps":    api_steps,
    }

    if embedded:
        from urllib.parse import urlencode
        return_params = urlencode({
            "frame": "1",
            "docKey": doc_key,
            "signerName": name,
            "signerEmail": email,
            "docTitle": tmpl["title"],
        })
        return_url = request.host_url.rstrip("/") + "/embedded/complete?" + return_params
        view_body  = {
            "returnUrl":            return_url,
            "authenticationMethod": "none",
            "email":                email,
            "userName":             name,
            "clientUserId":         f"demo-{email}",
        }
        code2, view_data = ds_post(
            f"/envelopes/{envelope_id}/views/recipient", view_body, token=token
        )
        api_steps.append({
            "step": 3,
            "label": "Embedded signing view",
            "method": "POST",
            "path": f"/restapi/v2.1/accounts/{{accountId}}/envelopes/{envelope_id}/views/recipient",
            "status": code2,
            "detail": "returnUrl → /embedded/complete",
        })
        if code2 in (200, 201):
            result["signingUrl"] = view_data.get("url")
        else:
            result["viewError"] = view_data.get("message", f"View error {code2}")

    return jsonify(result)


def _build_tabs(form):
    """Group form tab values by their DocuSign tab type.
    Form fields are named  tab_<tabType>__<tabLabel>  (double underscore separator).
    Falls back to  tab_<label>  → textTabs for backwards compat.
    """
    from collections import defaultdict
    buckets = defaultdict(list)
    for k, v in form.items():
        if not v.strip():
            continue
        if k.startswith("tab_") and "__" in k:
            # tab_textTabs__Company  →  textTabs, Company
            _, rest = k.split("_", 1)
            tab_type, label = rest.split("__", 1)
        elif k.startswith("tab_"):
            tab_type = "textTabs"
            label = k[4:]
        else:
            continue
        buckets[tab_type].append({"tabLabel": label, "value": v.strip()})
    return dict(buckets) if buckets else {}


@app.route("/envelopes/send", methods=["GET", "POST"])
def send_envelope():
    token = active_token_value()
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
                        **( {"tabs": _build_tabs(form)} if _build_tabs(form) else {} ),
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
            prefill={},
        )

    # Quick-launch prefill scenarios from the home page cards
    prefill_map = {
        "vendor": {"tab": "generate", "doc_type": "Vendor",     "name": "Corey Washington", "email": "cwdocusign1@gmail.com", "subject": "Vendor Contract -- Signature Required"},
        "hr":     {"tab": "generate", "doc_type": "Employment", "name": "Marcus Williams",   "email": "mwilliams@austin.gov",  "subject": "HR Onboarding Packet -- Action Required"},
    }
    prefill = prefill_map.get(request.args.get("prefill", ""), {})
    return render_template("send_envelope.html", templates=templates, result=None, error=None, prefill=prefill)


# ── EMBEDDED SIGNING ──────────────────────────────────────────────────────────

@app.route("/embedded", methods=["GET", "POST"])
def embedded_signing():
    token = active_token_value()
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

    prefill_map = {
        "permit": {"name": "Jane Smith", "email": "jsmith@citizen.gov", "subject": "Building Permit #BP-2026-0441"},
    }
    prefill = prefill_map.get(request.args.get("prefill", ""), {})
    return render_template(
        "embedded.html",
        templates=templates,
        signing_url=signing_url,
        envelope_id=envelope_id,
        error=error,
        prefill=prefill,
    )


@app.route("/embedded/complete")
def embedded_complete():
    event = request.args.get("event", "unknown")
    envelope_id = request.args.get("envelopeId", "")
    frame = request.args.get("frame") == "1"
    doc_key = request.args.get("docKey", "msa")
    signer_name = request.args.get("signerName", "")
    signer_email = request.args.get("signerEmail", "")
    doc_title = request.args.get("docTitle", "")

    extractions = build_doc_extractions(
        doc_key,
        signer_name or "—",
        signer_email or "—",
    ) if doc_key else None
    if doc_title and extractions:
        extractions["document_type"] = doc_title

    envelope_status = None
    completed_at = None
    token = active_token_value()
    if token and envelope_id:
        code, env_data = ds_get(f"/envelopes/{envelope_id}", token=token)
        if code == 200:
            envelope_status = env_data.get("status")
            completed_at = env_data.get("completedDateTime") or env_data.get("statusChangedDateTime")

    if frame:
        return render_template(
            "embedded_complete_frame.html",
            event=event,
            envelope_id=envelope_id,
            extractions=extractions,
        )

    return render_template(
        "embedded_complete.html",
        event=event,
        envelope_id=envelope_id,
        extractions=extractions,
        envelope_status=envelope_status,
        completed_at=completed_at,
    )


@app.route("/api/envelope/<envelope_id>/summary")
def api_envelope_summary(envelope_id):
    """Lightweight envelope status for post-signing UI updates."""
    token = active_token_value()
    if not token:
        return jsonify({"error": "not authenticated"}), 401
    code, data = ds_get(f"/envelopes/{envelope_id}", token=token)
    if code != 200:
        return jsonify({"error": data.get("message", f"HTTP {code}")}), code
    return jsonify({
        "envelopeId": envelope_id,
        "status": data.get("status"),
        "completedDateTime": data.get("completedDateTime"),
        "sentDateTime": data.get("sentDateTime"),
        "emailSubject": data.get("emailSubject"),
    })


# ── WEB FORMS ────────────────────────────────────────────────────────────────

@app.route("/api/webform/<form_id>")
def api_webform_detail(form_id):
    """Return form field names for a given web form — used to build the pre-fill UI."""
    token = active_token_value()
    if not token:
        return jsonify({"error": "not authenticated"}), 401

    code, data = ds_get(f"/forms/{form_id}?state=active", token=token, base=webforms_base())
    if code != 200:
        return jsonify({"error": data.get("message", f"HTTP {code}")}), code

    fields = extract_webform_fields(data)

    return jsonify({
        "formId":      form_id,
        "formName":    data.get("formProperties", {}).get("name") or data.get("name", ""),
        "description": data.get("description") or "",
        "fields":      fields,
        "field_count": len(fields),
    })


@app.route("/webforms", methods=["GET", "POST"])
def webforms():
    token = active_token_value()
    prefill_data = None
    form_url = None
    error = None
    forms_error = None

    # Fetch available web forms
    if token:
        code, wf_data = ds_get("/forms", token=token, base=webforms_base())
        forms = parse_webforms(wf_data) if code == 200 else []
        if code != 200:
            forms_error = wf_data.get("message") or wf_data.get("detail") or wf_data.get("error") or f"HTTP {code}"
    else:
        code, wf_data = 0, {}
        forms = []

    if request.method == "POST":
        form = request.form
        unique_id = form.get("unique_id", "").strip()
        form_id = form.get("form_id", "").strip()

        if not token:
            error = "Sign in with DocuSign to create form instances."
        elif form_id:
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
                f"/forms/{form_id}/instances", instance_body, token=token, base=webforms_base()
            )
            if code2 in (200, 201):
                form_url = webform_instance_url(inst)
                prefill_data = inst
                if form_url and form_url != inst.get("formUrl"):
                    prefill_data = {**inst, "launchUrl": form_url}
            else:
                error = inst.get("message") or inst.get("detail") or inst.get("error") or f"Web form instance error ({code2})"
        else:
            error = "Select a web form to launch."

    prefill_map = {
        "benefits": {"FirstName": "Robert", "LastName": "Johnson", "Program": "Housing Assistance", "CaseID": "CASE-2026-00981"},
    }
    prefill = prefill_map.get(request.args.get("prefill", ""), {})
    return render_template(
        "webforms.html", forms=forms, prefill_data=prefill_data,
        form_url=form_url, error=error, forms_error=forms_error, prefill=prefill,
        form_count=len(forms),
    )


# ── MAESTRO ───────────────────────────────────────────────────────────────────

@app.route("/debug/auth")
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


@app.route("/debug/webforms")
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
        results[url] = {"status": r.status_code, "body": _safe_json(r) if r.content else {}}
    return jsonify(results), 200


@app.route("/debug/maestro")
def debug_maestro():
    """Raw Workflow Builder API probe — shows exactly what DocuSign returns."""
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
    ui = http.get("https://account-d.docusign.com/oauth/userinfo",
                  headers={"Authorization": f"Bearer {token}"}, timeout=10)
    return jsonify({
        "url": url,
        "account_id_used": acct,
        "status_code": r.status_code,
        "response": body,
        "token_scopes": ui.json().get("accounts", [{}])[0] if ui.status_code == 200 else ui.text,
    })


@app.route("/maestro/call", methods=["POST"])
def maestro_call():
    """Proxy live Workflow Builder API calls from the interactive explorer panel."""
    token = active_token_value()
    if not token:
        return jsonify({"error": "not authenticated"}), 401
    body = request.get_json() or {}
    rel_path = body.get("path", "").lstrip("/")
    # Accept legacy explorer paths that still say maestro/
    if rel_path.startswith("maestro/"):
        rel_path = rel_path[len("maestro/"):]
    method = body.get("method", "GET").upper()
    req_body = body.get("body", None)

    url = f"{iam_base()}/{rel_path}"
    try:
        start = time.time()
        if method == "GET":
            r = http.get(url, headers=ds_headers(token), timeout=15)
        elif method == "POST":
            r = http.post(url, headers=ds_headers(token), json=req_body, timeout=15)
        elif method == "DELETE":
            r = http.delete(url, headers=ds_headers(token), timeout=15)
        else:
            return jsonify({"error": "unsupported method"}), 400
        latency = round((time.time() - start) * 1000)
        try:
            resp_data = r.json()
        except Exception:
            resp_data = {"raw": r.text[:2000]}
        return jsonify({"status_code": r.status_code, "url": url,
                        "response": resp_data, "latency_ms": latency})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/maestro")
def maestro():
    token = active_token_value()
    workflows = []
    plan_error = None
    api_call_info = None

    if not token:
        return render_template(
            "maestro.html", workflows=[], plan_error=None, api_call_info=None,
            instances=[], selected_workflow_id="", create_result=None,
        )

    url = f"{iam_base()}/workflows?status=active"
    start = time.time()
    r = http.get(url, headers=ds_headers(token), timeout=15)
    latency = round((time.time() - start) * 1000)
    try:
        data = r.json()
    except Exception:
        data = {}
    code = r.status_code

    api_call_info = {
        "method": "GET",
        "url": url,
        "status_code": code,
        "latency_ms": latency,
        "response": data,
    }

    if code == 200:
        workflows = parse_workflows(data)

    elif code == 401:
        plan_error = {
            "code": 401,
            "title": "Re-authentication Required",
            "detail": "Your token does not have the 'aow_manage' scope needed for Workflow Builder. Click Refresh Token to re-authenticate.",
            "raw": data,
            "needs_reauth": True,
        }

    elif code == 403:
        # Distinguish scope-missing 403 from plan-missing 403
        raw_msg = data.get("message") or data.get("detail") or data.get("error_description") or str(data)
        scope_issue = any(w in raw_msg.lower() for w in ["scope", "consent", "aow", "permission", "not authorized"])
        plan_error = {
            "code": 403,
            "title": "Token Missing Required Scope" if scope_issue else "Workflow Builder Access Denied",
            "detail": raw_msg,
            "raw": data,
            "needs_reauth": scope_issue,
            "upgrade": None if scope_issue else "Confirm Workflow Builder is provisioned on your demo account with your DocuSign AE.",
        }

    elif code == 404:
        raw_msg = data.get("message") or data.get("detail") or str(data)
        plan_error = {
            "code": 404,
            "title": "Workflow Builder Endpoint Not Found",
            "detail": raw_msg,
            "raw": data,
            "needs_reauth": False,
        }

    else:
        plan_error = {
            "code": code,
            "title": "API Error",
            "detail": data.get("message") or data.get("detail") or f"HTTP {code}",
            "raw": data,
        }

    selected = next((w for w in workflows if (w.get("name") or "").lower() == "alameda county"), workflows[0] if workflows else None)
    selected_id = (selected.get("id") or selected.get("workflowId")) if selected else ""
    instances = fetch_workflow_instances(selected_id, token) if selected_id and token else []

    return render_template(
        "maestro.html",
        workflows=workflows,
        plan_error=plan_error,
        api_call_info=api_call_info,
        instances=instances,
        selected_workflow_id=selected_id,
        create_result=None,
    )


@app.route("/api/workflow/<workflow_id>/requirements")
def api_workflow_requirements(workflow_id):
    token = active_token_value()
    if not token:
        return jsonify({"error": "not authenticated"}), 401
    code, data = fetch_workflow_trigger_requirements(workflow_id, token)
    if code != 200:
        return jsonify({"error": data.get("detail") or data.get("message") or f"HTTP {code}"}), code
    schema = data.get("trigger_input_schema") or []
    return jsonify({
        "workflow_id": workflow_id,
        "trigger_event_type": data.get("trigger_event_type"),
        "trigger_url": (data.get("trigger_http_config") or {}).get("url"),
        "schema": schema,
        "sample_inputs": build_default_trigger_inputs(
            schema,
            user_email=session.get("user_email", ""),
            user_name=session.get("user_name", "Demo User"),
        ),
    })


@app.route("/api/workflow/<workflow_id>/instances")
def api_workflow_instances(workflow_id):
    token = active_token_value()
    if not token:
        return jsonify({"error": "not authenticated"}), 401
    code, data = ds_get(
        f"/workflows/{workflow_id}/instances?limit=10",
        token=token,
        base=iam_base(),
    )
    if code != 200:
        return jsonify({"error": data.get("detail") or data.get("message") or f"HTTP {code}"}), code
    return jsonify({"instances": parse_workflows(data), "count": len(parse_workflows(data))})


@app.route("/maestro/create", methods=["POST"])
def maestro_create():
    token = active_token_value()
    if not token:
        return redirect(url_for("maestro"))

    list_url = f"{iam_base()}/workflows?status=active"
    r_list = http.get(list_url, headers=ds_headers(token), timeout=15)
    try:
        list_data = r_list.json()
    except Exception:
        list_data = {}

    workflows = parse_workflows(list_data) if r_list.status_code == 200 else []
    plan_error = None
    create_result = None
    workflow_id = request.form.get("workflow_id", "").strip()

    if not workflows:
        create_result = {
            "status_code": r_list.status_code,
            "success": False,
            "data": list_data or {"message": "No active workflows found."},
        }
        return render_template(
            "maestro.html", workflows=[], plan_error=plan_error,
            create_result=create_result, api_call_info=None, instances=[],
        )

    if workflow_id:
        workflow = next((w for w in workflows if (w.get("id") or w.get("workflowId")) == workflow_id), None)
    else:
        workflow = next((w for w in workflows if (w.get("name") or "").lower() == "alameda county"), None) or workflows[0]
    if not workflow:
        workflow = workflows[0]

    workflow_id = workflow.get("id") or workflow.get("workflowId")
    code, resp_data, req_body, req_meta = trigger_workflow(
        workflow_id,
        token,
        user_email=session.get("user_email", ""),
        user_name=session.get("user_name", "Demo User"),
    )

    create_result = {
        "status_code": code,
        "success": code in (200, 201),
        "data": resp_data,
        "request_body": req_body,
        "workflow_id": workflow_id,
        "workflow_name": workflow.get("name") or workflow.get("workflowName"),
        "trigger_requirements": req_meta,
    }

    instances = fetch_workflow_instances(workflow_id, token)

    return render_template(
        "maestro.html", workflows=workflows, plan_error=plan_error,
        create_result=create_result, api_call_info=None,
        instances=instances, selected_workflow_id=workflow_id,
    )


# ── NAVIGATOR / CLM ───────────────────────────────────────────────────────────

@app.route("/navigator")
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
                    "message": f"Navigator API connected — 0 agreements on account {acct}.",
                    "detail": "No agreements ingested yet. Upload contracts in the Navigator UI to populate this view.",
                }
        elif code == 403:
            detail = data.get("detail", "")
            plan_error = {
                "code": 403,
                "account": acct,
                "title": "Agreement Manager API Access Blocked",
                "detail": detail or "This account does not have Navigator API access enabled.",
                "upgrade": "Navigator API access requires enableNavigatorAPIDataOut to be enabled by your DocuSign TAM.",
            }
        elif code in (401, 0):
            plan_error = {"code": code, "title": "Authentication Error",
                          "detail": "Token expired or invalid. Click 'Refresh Token' to re-authenticate."}
        else:
            plan_error = {"code": code, "title": "API Error",
                          "detail": data.get("message", f"HTTP {code}")}

    return render_template("navigator.html", agreements=agreements, plan_error=plan_error,
                           api_status=api_status, stats=stats)


# ── WORKSPACES ────────────────────────────────────────────────────────────────

@app.route("/workspaces")
def workspaces():
    token = active_token_value()
    workspace_list = []
    error = None

    if token:
        # Workspaces API is under /restapi/v2 (not v2.1)
        acct = session.get("account_id", config.ACCOUNT_ID)
        base = session.get("base_uri", config.BASE_URI)
        r = http.get(
            f"{base}/restapi/v2/accounts/{acct}/workspaces",
            headers=ds_headers(token),
            timeout=15,
        )
        code, data = r.status_code, r.json() if r.content else {}
        if code == 200:
            workspace_list = data.get("workspaces", [])
        elif code == 403:
            error = data.get("message", "Workspaces are not enabled on this account.")
        elif code == 404:
            error = "Workspaces feature not found. Confirm the account has Workspaces enabled."
        else:
            error = data.get("message", f"API error {code}")
    else:
        error = None

    return render_template("workspaces.html", workspaces=workspace_list, error=error, needs_auth=not token)


@app.route("/workspaces/create", methods=["POST"])
def workspace_create():
    token = active_token_value()
    if not token:
        return jsonify({"error": "not authenticated"}), 401
    name = request.json.get("name", "New Workspace")
    acct = session.get("account_id", config.ACCOUNT_ID)
    base = session.get("base_uri", config.BASE_URI)
    r = http.post(
        f"{base}/restapi/v2/accounts/{acct}/workspaces",
        headers=ds_headers(token),
        json={"workspaceName": name},
        timeout=15,
    )
    return jsonify(r.json() if r.content else {}), r.status_code


# ── CONNECT / WEBHOOKS ────────────────────────────────────────────────────────

@app.route("/webhooks")
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


# ── GOV WORKFLOW SCENARIOS (50 states) ────────────────────────────────────────

@app.route("/gov-workflows")
def gov_workflows():
    state = request.args.get("state", DEFAULT_STATE).upper()
    pkg = get_state_package(state)
    return render_template(
        "gov_workflows.html",
        states=list_states(),
        current_state=state,
        ca_context=pkg["context"],
        clauses=pkg["clauses"],
        personas=pkg["personas"],
        first_party=pkg["first_party"],
        third_party=pkg["third_party"],
        ai_scorecards=pkg["scorecards"],
        use_cases=pkg["use_cases"],
        agreement_cloud=AGREEMENT_CLOUD_CAPABILITIES,
        clm_capabilities=CLM_CAPABILITIES,
        convergence=CONVERGENCE_POINTS,
        api_examples=API_EXAMPLES,
    )


@app.route("/api/gov-workflows/state/<state_abbr>")
def api_gov_workflows_state(state_abbr):
    pkg = get_state_package(state_abbr)
    return jsonify(pkg)


@app.route("/api/gov-workflows/states")
def api_gov_workflows_states():
    return jsonify(list_states())


@app.route("/api/gov-workflows/generate", methods=["POST"])
def api_gov_workflows_generate():
    data = request.get_json() or {}
    description = data.get("description", "").strip()
    state_abbr = data.get("state", DEFAULT_STATE).upper()
    if not description:
        return jsonify({"error": "Describe your workflow first."}), 400
    result = generate_custom_scenario(description)
    pkg = get_state_package(state_abbr)
    result["state"] = pkg["context"]
    result["convergence_note"] = (
        f"Both paths converge at eSignature for execution. CLM feeds the envelope; "
        f"Connect webhooks push completed metadata back to CLM and {pkg['context']['erp'].split('(')[0].strip()}."
    )
    return jsonify(result)


@app.route("/api/gov-workflows/scenario/<scenario_id>")
def api_gov_workflows_scenario(scenario_id):
    state_abbr = request.args.get("state", DEFAULT_STATE).upper()
    pkg = get_state_package(state_abbr)
    scenario = pkg["third_party"] if scenario_id == "third_party" else pkg["first_party"]
    return jsonify({
        "scenario": scenario,
        "scorecard": pkg["scorecards"].get(scenario_id, {}),
        "personas": pkg["personas"],
        "context": pkg["context"],
    })


# ── API EXPLORER ──────────────────────────────────────────────────────────────

@app.route("/explorer")
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
                {"method": "GET",    "path": "/workspaces",                        "desc": "List all workspaces on account"},
                {"method": "POST",   "path": "/workspaces",                        "desc": "Create a new workspace"},
                {"method": "GET",    "path": "/workspaces/{wsId}",                 "desc": "Get workspace details and settings"},
                {"method": "GET",    "path": "/workspaces/{wsId}/files",           "desc": "List files in a workspace"},
                {"method": "POST",   "path": "/workspaces/{wsId}/files",           "desc": "Upload file to workspace"},
                {"method": "GET",    "path": "/workspaces/{wsId}/files/{fileId}",  "desc": "Get a specific file"},
                {"method": "DELETE", "path": "/workspaces/{wsId}",                 "desc": "Delete a workspace"},
            ],
        },
        {
            "group": "Rooms",
            "color": "rose",
            "routes": [
                {"method": "GET",  "path": "/rooms",              "desc": "List transaction rooms"},
                {"method": "POST", "path": "/rooms",              "desc": "Create a new room"},
                {"method": "GET",  "path": "/rooms/{id}/documents", "desc": "Get room documents"},
            ],
        },
    ]
    return render_template("explorer.html", endpoints=endpoints)


@app.route("/explorer/call", methods=["POST"])
def explorer_call():
    token = active_token_value()
    if not token:
        return jsonify({"error": "not authenticated"}), 401

    body = request.json or {}
    group = body.get("group", "eSignature")
    path = body.get("path", "")
    method = body.get("method", "GET").upper()
    req_body = body.get("body", None)

    if not path:
        return jsonify({"error": "No path provided"}), 400

    acct = session.get("account_id", config.ACCOUNT_ID)
    base_uri = session.get("base_uri", config.BASE_URI)

    if group == "Web Forms":
        url = webforms_base() + path.replace("/web_forms", "")
    elif group in ("Workflow Builder", "Agreement Manager"):
        rel = path.lstrip("/")
        if rel.startswith("maestro/"):
            rel = rel[len("maestro/"):]
        url = f"{iam_base()}/{rel}"
    elif group == "Workspaces":
        url = f"{base_uri}/restapi/v2/accounts/{acct}{path}"
    elif group == "Rooms":
        url = f"{base_uri}/restapi/v2/accounts/{acct}{path}"
    else:
        url = esign_base() + path

    try:
        start = time.time()
        if method == "GET":
            r = http.get(url, headers=ds_headers(token), timeout=15)
        elif method == "POST":
            r = http.post(url, headers=ds_headers(token), json=req_body, timeout=15)
        elif method == "PUT":
            r = http.put(url, headers=ds_headers(token), json=req_body, timeout=15)
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
            "latency_ms": round((time.time() - start) * 1000),
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ── DOCUSIGN AGENT API ───────────────────────────────────────────────────────
# DocuSign as the agreement platform for AI agents — no external AI key needed.
# Uses the same OAuth token already in the session.


@app.route("/agent")
def agent():
    token = active_token_value()
    recent_envs = []
    if token:
        code, data = ds_get(
            "/envelopes?from_date=2024-01-01&count=20&order=desc&order_by=last_modified",
            token=token,
        )
        if code == 200:
            recent_envs = data.get("envelopes", [])
    return render_template("agent.html", recent_envs=recent_envs)


# ── Agent: envelope probe ─────────────────────────────────────────────────────

@app.route("/agent/envelope/<envelope_id>")
def agent_envelope_detail(envelope_id):
    """Full envelope context — recipients, documents, audit trail."""
    token = active_token_value()
    if not token:
        return jsonify({"error": "not authenticated"}), 401
    code_e, env      = ds_get(f"/envelopes/{envelope_id}", token=token)
    code_r, rdata    = ds_get(f"/envelopes/{envelope_id}/recipients", token=token)
    code_d, ddata    = ds_get(f"/envelopes/{envelope_id}/documents", token=token)
    code_a, adata    = ds_get(f"/envelopes/{envelope_id}/audit_events", token=token)
    if code_e != 200:
        return jsonify({"error": env.get("message", f"HTTP {code_e}")}), code_e
    recipients = rdata.get("signers", []) + rdata.get("carbonCopies", []) if code_r == 200 else []
    documents  = [
        {"documentId": d["documentId"], "name": d.get("name", ""), "type": d.get("type", "")}
        for d in ddata.get("envelopeDocuments", [])
    ] if code_d == 200 else []
    audit = adata.get("auditEvents", []) if code_a == 200 else []
    return jsonify({
        "envelope":    env,
        "recipients":  recipients,
        "documents":   documents,
        "audit_events": len(audit),
        "status":      env.get("status"),
    })


# ── Agent: extensions ─────────────────────────────────────────────────────────

@app.route("/agent/extensions")
def agent_extensions():
    """List DocuSign Extensions available on the account."""
    token = active_token_value()
    if not token:
        return jsonify({"error": "not authenticated"}), 401
    acct = session.get("account_id", config.ACCOUNT_ID)
    r = http.get(
        f"https://api-d.docusign.com/v1/accounts/{acct}/extensions",
        headers=ds_headers(token), timeout=15,
    )
    try:
        data = r.json()
    except Exception:
        data = {}
    return jsonify({"status_code": r.status_code, "extensions": data})


# ── Agent: agreement provisions (Navigator AI) ────────────────────────────────

@app.route("/agent/agreement/<agreement_id>")
def agent_agreement_detail(agreement_id):
    """AI-extracted provisions from a Navigator agreement."""
    token = active_token_value()
    if not token:
        return jsonify({"error": "not authenticated"}), 401
    acct = session.get("account_id", config.ACCOUNT_ID)
    r = http.get(
        f"https://api-d.docusign.com/v1/accounts/{acct}/agreements/{agreement_id}",
        headers=ds_headers(token), timeout=15,
    )
    try:
        data = r.json()
    except Exception:
        data = {}
    return jsonify({"status_code": r.status_code, "agreement": data})


# ── Agent: autonomous flow runner ────────────────────────────────────────────

@app.route("/agent/run-flow", methods=["POST"])
def agent_run_flow():
    """
    Execute an agentic DocuSign flow:
    1. Send envelope from template
    2. Poll status
    3. Return full envelope state
    Each step is returned so the UI can show the agent's decision trace.
    """
    token = active_token_value()
    if not token:
        return jsonify({"error": "not authenticated"}), 401

    body        = request.get_json() or {}
    template_id = body.get("template_id", "")
    signer_name = body.get("signer_name", "Demo Signer")
    signer_email = body.get("signer_email", "")
    role_name   = body.get("role_name", "Signer")
    steps       = []

    if not template_id or not signer_email:
        return jsonify({"error": "template_id and signer_email required"}), 400

    # Step 1: Send envelope
    env_body = {
        "templateId": template_id,
        "status": "sent",
        "templateRoles": [{
            "email":    signer_email,
            "name":     signer_name,
            "roleName": role_name,
        }],
    }
    code, env_data = ds_post("/envelopes", env_body, token=token)
    steps.append({
        "step":    1,
        "action":  "POST /envelopes",
        "decision": f"Send envelope from template {template_id[:8]}… to {signer_email}",
        "status_code": code,
        "result":  {"envelopeId": env_data.get("envelopeId"), "status": env_data.get("status")}
                   if code in (200, 201) else {"error": env_data.get("message")},
    })
    if code not in (200, 201):
        return jsonify({"success": False, "steps": steps})

    envelope_id = env_data.get("envelopeId")

    # Step 2: Read envelope status
    code2, status_data = ds_get(f"/envelopes/{envelope_id}", token=token)
    steps.append({
        "step":    2,
        "action":  f"GET /envelopes/{envelope_id[:8]}…",
        "decision": "Verify envelope was created and is in 'sent' state",
        "status_code": code2,
        "result":  {"status": status_data.get("status"), "sentDateTime": status_data.get("sentDateTime")},
    })

    # Step 3: Get recipients
    code3, rec_data = ds_get(f"/envelopes/{envelope_id}/recipients", token=token)
    signers = rec_data.get("signers", []) if code3 == 200 else []
    steps.append({
        "step":    3,
        "action":  f"GET /envelopes/{envelope_id[:8]}…/recipients",
        "decision": "Confirm recipients received signing request",
        "status_code": code3,
        "result":  [{"name": s.get("name"), "email": s.get("email"), "status": s.get("status")} for s in signers],
    })

    return jsonify({
        "success":    True,
        "envelopeId": envelope_id,
        "steps":      steps,
    })




if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5050))
    app.run(debug=True, port=port)
