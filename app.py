import os
import io
import json
import base64
import hmac
import hashlib
import time
import re
from datetime import datetime, date, timedelta
from flask import Flask, render_template, request, jsonify, redirect, url_for, session
from flask_cors import CORS
import requests as http
import config
from connect_demo import CONNECT_DEMO, CONNECT_STATUS_GUIDE, CONNECT_ENDPOINTS
from gov_scenarios import (
    IAM_ESSENTIALS_CAPABILITIES,
    API_EXAMPLES,
    CLM_CAPABILITIES,
    CONVERGENCE_POINTS,
    GOV_CUSTOMER_PROOF,
    generate_custom_scenario,
)
from state_builder import DEFAULT_STATE, get_state_package, list_states
from admin_dashboard import (
    ADMIN_CAPABILITIES,
    ADMIN_PAGE_CATALOG,
    BACKEND_LABELS,
    build_admin_status,
)

app = Flask(__name__)
app.secret_key = config.SECRET_KEY
CORS(app, resources={r"/webhook/*": {"origins": "*"}})


@app.after_request
def allow_private_network_access(response):
    """Let Chrome allow Docusign (public) to navigate an iframe back to localhost (private).
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


@app.before_request
def migrate_oauth_session():
    """Existing OAuth sessions before prefer_oauth flag was introduced."""
    if session.get("guest_mode"):
        return
    if session.get("access_token") and session.get("user_email") and "prefer_oauth" not in session:
        session["prefer_oauth"] = True

# ── Webhook event log (persisted for serverless cold starts) ─────────────────
WEBHOOK_EVENTS_FILE = os.path.join(os.path.dirname(__file__), "data", "webhook_events.json")
webhook_events = []

SAMPLE_WEBHOOK_EVENTS = [
    {
        "id": 1,
        "received_at": "2026-06-18T14:22:01Z",
        "event": "envelope-sent",
        "envelope_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        "status": "sent",
        "sender": "contracts@cdt.ca.gov",
        "raw": '{"event":"envelope-sent","data":{"envelopeId":"a1b2c3d4-e5f6-7890-abcd-ef1234567890"}}',
    },
    {
        "id": 2,
        "received_at": "2026-06-18T15:41:33Z",
        "event": "recipient-completed",
        "envelope_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        "status": "delivered",
        "sender": "contracts@cdt.ca.gov",
        "raw": '{"event":"recipient-completed","data":{"envelopeId":"a1b2c3d4-e5f6-7890-abcd-ef1234567890"}}',
    },
    {
        "id": 3,
        "received_at": "2026-06-18T16:08:17Z",
        "event": "envelope-completed",
        "envelope_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        "status": "completed",
        "sender": "contracts@cdt.ca.gov",
        "raw": '{"event":"envelope-completed","data":{"envelopeId":"a1b2c3d4-e5f6-7890-abcd-ef1234567890","envelopeSummary":{"status":"completed"}}}',
    },
]


def _load_webhook_events():
    global webhook_events
    try:
        os.makedirs(os.path.dirname(WEBHOOK_EVENTS_FILE), exist_ok=True)
        if os.path.isfile(WEBHOOK_EVENTS_FILE):
            with open(WEBHOOK_EVENTS_FILE, "r", encoding="utf-8") as f:
                webhook_events = json.load(f)
                return
    except Exception as exc:
        app.logger.warning("Could not load webhook events: %s", exc)
    webhook_events = list(SAMPLE_WEBHOOK_EVENTS)
    _save_webhook_events()


def _save_webhook_events():
    try:
        os.makedirs(os.path.dirname(WEBHOOK_EVENTS_FILE), exist_ok=True)
        with open(WEBHOOK_EVENTS_FILE, "w", encoding="utf-8") as f:
            json.dump(webhook_events[-50:], f)
    except Exception as exc:
        app.logger.warning("Could not save webhook events: %s", exc)


_load_webhook_events()


def oauth_redirect_uri():
    """Use the current host's callback so local and Vercel both work."""
    try:
        host = (request.host or "").lower()
        scheme = "https" if request.is_secure or host.endswith("vercel.app") else "http"
        if host and "localhost" not in host and "127.0.0.1" not in host:
            return f"{scheme}://{host}/oauth/callback"
    except RuntimeError:
        pass
    return config.OAUTH_REDIRECT_URI or "http://localhost:5051/oauth/callback"


def decode_token_scopes(token):
    """Read DocuSign access-token scope claim without verification."""
    if not token or token.count(".") < 2:
        return []
    try:
        import base64
        import json as _json
        part = token.split(".")[1]
        pad = "=" * ((4 - len(part) % 4) % 4)
        payload = _json.loads(base64.urlsafe_b64decode(part + pad))
        scp = payload.get("scp") or payload.get("scope") or []
        if isinstance(scp, str):
            return [s for s in scp.replace(",", " ").split() if s]
        if isinstance(scp, list):
            return [str(s) for s in scp]
    except Exception:
        return []
    return []


def token_has_scopes(token, required):
    have = set(decode_token_scopes(token))
    need = [s for s in required if s]
    if not need:
        return True
    # If we cannot decode scopes, assume OK (opaque tokens)
    if not have:
        return True
    return all(s in have for s in need)


WORKSPACES_SCOPES = ("dtr.rooms.read", "dtr.rooms.write")


def active_token_value(required_scopes=None):
    if session.get("guest_mode"):
        return ""
    tok = session.get("access_token", "")
    required = tuple(required_scopes or ())

    # Drop cached tokens that are missing required scopes (e.g. pre-consent JWT)
    if tok and required and not token_has_scopes(tok, required):
        session.pop("access_token", None)
        tok = ""

    if not tok and not session.get("prefer_oauth"):
        tok = config.ACCESS_TOKEN or ""
        if tok and required and not token_has_scopes(tok, required):
            tok = ""

    if not tok and not session.get("prefer_oauth") and config.load_rsa_private_key():
        tok = get_jwt_token(required_scopes=required or None)
        if tok:
            if required and not token_has_scopes(tok, required):
                # Do not cache a scope-stripped fallback when callers need Workspaces
                return tok if not required else ""
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


# eSignature + IAM + Workspaces (beta) scopes for JWT / OAuth
DS_OAUTH_SCOPES = (
    "signature impersonation "
    "adm_store_unified_repo_read aow_manage "
    "webforms_read webforms_instance_read webforms_instance_write "
    "dtr.rooms.read dtr.rooms.write dtr.company.read dtr.documents.write"
)


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
    "formsubmitaction", "section", "textdescription",
}
WEBFORM_FILLABLE_TYPES = {
    "textbox", "email", "phonenumber", "number", "date", "select",
    "radiobuttongroup", "checkboxgroup", "dropdown", "textarea", "checkbox", "radio",
}


def extract_webform_fields(data):
    """Extract pre-fillable fields from a Web Forms definition.

    formValues must use componentName (e.g. hrFullName), not componentKey
    (e.g. TextBox_8Y2kIItB).
    """
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
            if comp_type in WEBFORM_FILLABLE_TYPES or simple_type in ("TextBox", "Email", "Number", "Date", "Select"):
                # Prefer componentName — that is what formValues expects
                name = comp.get("componentName") or comp.get("name") or comp.get("componentKey") or key
                label = comp.get("label") or comp.get("text") or name
                field = {
                    "name": name,
                    "label": label,
                    "type": comp_type or (simple_type or "text").lower(),
                    "required": comp.get("required", False),
                }
                options = comp.get("options") or comp.get("items") or []
                if isinstance(options, list) and options:
                    field["options"] = [
                        {
                            "value": (o.get("value") or o.get("label") or ""),
                            "label": (o.get("label") or o.get("value") or ""),
                        }
                        for o in options if isinstance(o, dict)
                    ]
                if not name or name in seen or (comp_type or "").lower() in WEBFORM_SKIP_TYPES:
                    continue
                seen.add(name)
                fields.append(field)

    return fields


def webform_display_name(form):
    """Human-readable Web Form title from list/detail payloads."""
    if not isinstance(form, dict):
        return ""
    props = form.get("formProperties") or {}
    return (props.get("name") or form.get("name") or "").strip()


def find_preferred_webform(forms, preferred=None):
    """Pick the demo Web Form — defaults to Training/Travel Request Form."""
    if not forms:
        return None
    needle = (preferred or config.DEMO_WEBFORM_NAME or "Training/Travel Request Form").lower()
    for f in forms:
        if needle in webform_display_name(f).lower():
            return f
    # Prefer published/enabled forms with a small field set when preferred is missing
    for f in forms:
        if f.get("isPublished", True) and f.get("isEnabled", True):
            return f
    return forms[0]


def build_webform_sample_prefill(fields, user_name=None, user_email=None):
    """Map form fields to demo values so a sample launch arrives pre-filled."""
    presenter = (user_name or config.DEMO_SIGNER_NAME or "Corey Washington").strip()
    presenter_email = (user_email or config.DEMO_SIGNER_EMAIL or "cwdocusign1@gmail.com").strip()
    hire_name = config.DEMO_WEBFORM_HIRE_NAME
    hire_email = config.DEMO_WEBFORM_HIRE_EMAIL
    manager_name = getattr(config, "DEMO_WEBFORM_MANAGER_NAME", None) or "Maria Santos"
    manager_email = getattr(config, "DEMO_WEBFORM_MANAGER_EMAIL", None) or "maria.santos@cdt.ca.gov"
    first, _, last = presenter.partition(" ")
    last = last or first
    today = date.today()
    end = today + timedelta(days=2)
    begin_str = today.isoformat()
    end_str = end.isoformat()

    values = {}
    for field in fields or []:
        name = (field.get("name") or "").strip()
        if not name:
            continue
        label = (field.get("label") or name).strip()
        key = f"{name} {label}".lower().replace("_", " ").replace("-", " ").replace("/", " ")
        ftype = (field.get("type") or "").lower()
        options = field.get("options") or []

        def pick_option(*candidates):
            if not options:
                return candidates[0] if candidates else "Yes"
            labels = [(o.get("value") or o.get("label") or "") for o in options if isinstance(o, dict)]
            for cand in candidates:
                for opt in labels:
                    if opt.lower() == cand.lower():
                        return opt
            return labels[0] if labels else (candidates[0] if candidates else "Yes")

        # Travel / training request form
        if "requestor" in key or "requester" in key:
            values[name] = presenter_email if ("email" in key or ftype == "email") else presenter
        elif "department head" in key or "dept head" in key:
            values[name] = manager_email if ("email" in key or ftype == "email") else manager_name
        elif "supervisor" in key:
            values[name] = manager_email if ("email" in key or ftype == "email") else manager_name
        elif "remark" in key:
            values[name] = "Demo travel request for agreement-workflow training."
        elif "conference" in key or "seminar" in key or "course" in key or ("training" in key and "title" in key):
            values[name] = "Docusign IAM Public Sector Summit"
        elif "locatio" in key or key.strip() == "location" or "location" in key:
            values[name] = "Sacramento, CA"
        elif "begin date" in key or "start date" in key:
            values[name] = begin_str
        elif "end date" in key:
            values[name] = end_str
        elif "registration" in key and ("expense" in key or "cost" in key or "fee" in key):
            values[name] = "325.00" if ftype in ("textbox", "text", "") else 325
        elif "lodging" in key:
            values[name] = 450 if ftype == "number" else "450.00"
        elif "meal" in key:
            values[name] = 180 if ftype == "number" else "180.00"
        elif "amount requested" in key or ("amount" in key and "request" in key):
            values[name] = "955.00"
        elif "advance" in key and ("expense" in key or "money" in key or "required" in key):
            values[name] = pick_option("No", "Yes")
        elif "council" in key and "approval" in key:
            values[name] = pick_option("No", "Yes")
        elif "payment option" in key:
            values[name] = "Agency P-Card"
        elif "newhire" in key.replace(" ", "") or ("new hire" in key) or ("candidate" in key):
            values[name] = hire_email if ("email" in key or ftype == "email") else hire_name
        elif (
            ("hr" in key.split() or key.startswith("hr ") or "hrfull" in key.replace(" ", "") or "hremail" in key.replace(" ", ""))
            and "department head" not in key
        ):
            values[name] = presenter_email if ("email" in key or ftype == "email") else presenter
        elif ftype == "email" or ("email" in key and "approval" not in key):
            values[name] = presenter_email
        elif any(t in key for t in ("first name", "firstname", "given")):
            values[name] = first
        elif any(t in key for t in ("last name", "lastname", "surname", "family")):
            values[name] = last
        elif any(t in key for t in ("full name", "employee name", "signer name", "affiant", "applicant", "vendor name")):
            values[name] = presenter
        elif key.strip() in ("name",) or name.lower() in ("name", "signer_name", "emp_name", "employee_name", "requestor_name"):
            values[name] = presenter
        elif "case" in key or "badge" in key or "mrn" in key or "applicant id" in key:
            values[name] = "CASE-2026-00981"
        elif "agency" in key:
            values[name] = "California Department of Technology"
        elif "job title" in key or key.strip() == "job title":
            values[name] = "Program Analyst"
        elif "division" in key or ("department" in key and "head" not in key):
            values[name] = "Human Resources"
        elif "program" in key and "type" not in key:
            values[name] = "Housing Assistance"
        elif ftype == "date" or key.strip() == "date" or name.lower() == "date":
            values[name] = begin_str
        elif ftype == "number":
            if "lodging" in key:
                values[name] = 450
            elif "meal" in key:
                values[name] = 180
            elif "registration" in key:
                values[name] = 325
            elif "amount" in key:
                values[name] = 955
        elif ftype == "select" and options:
            values[name] = pick_option("No", "Yes")
        elif field.get("required") and ftype in ("textbox", "text", ""):
            if "amount" in key or "expense" in key:
                values[name] = "250.00"
            elif len(values) < 10 and "name" in key:
                values[name] = presenter

    return values


def coerce_webform_form_values(fields, values):
    """Coerce prefill values to types Web Forms API expects (numbers, ISO dates)."""
    if not values:
        return {}
    type_by_name = {
        (f.get("name") or ""): (f.get("type") or "").lower()
        for f in (fields or [])
        if f.get("name")
    }
    out = {}
    for key, raw in values.items():
        if raw is None or raw == "":
            continue
        ftype = type_by_name.get(key, "")
        if ftype == "number":
            try:
                num = float(str(raw).replace(",", "").strip())
                out[key] = int(num) if num.is_integer() else num
            except (TypeError, ValueError):
                continue
        elif ftype == "date":
            text = str(raw).strip()
            # Accept MM/DD/YYYY from the demo UI and convert to yyyy-MM-dd
            if re.match(r"^\d{1,2}/\d{1,2}/\d{4}$", text):
                try:
                    out[key] = datetime.strptime(text, "%m/%d/%Y").date().isoformat()
                    continue
                except ValueError:
                    pass
            out[key] = text
        else:
            out[key] = raw if not isinstance(raw, (int, float)) else raw
            if isinstance(raw, (int, float)) and ftype in ("textbox", "text", "email", ""):
                out[key] = str(raw)
            elif not isinstance(raw, (int, float, bool)):
                out[key] = str(raw)
    return out


def webform_instance_url(inst):
    """Build a launchable Web Form URL from createInstance response."""
    url = inst.get("formUrl") or ""
    token = inst.get("instanceToken") or ""
    if url and token and "instanceToken=" not in url:
        sep = "#" if "#" not in url else "&" if "?" in url else "#"
        if sep == "#":
            return f"{url}#instanceToken={token}"
    return url


def find_preferred_workflow(workflows, preferred=None):
    """Pick the demo workflow — defaults to AV1 (prefill API showcase)."""
    if not workflows:
        return None
    needle = (preferred or config.DEFAULT_WORKFLOW_NAME or "AV1").lower()
    for w in workflows:
        name = (w.get("name") or w.get("workflowName") or "").lower()
        if name == needle or needle in name:
            return w
    return workflows[0]


def sort_workflows_preferred_first(workflows, preferred=None):
    """Return workflows with the demo workflow (AV1) first in the list."""
    preferred_wf = find_preferred_workflow(workflows, preferred)
    if not preferred_wf or not workflows:
        return workflows
    pid = preferred_wf.get("id") or preferred_wf.get("workflowId")
    rest = [w for w in workflows if (w.get("id") or w.get("workflowId")) != pid]
    return [preferred_wf] + rest


def gov_prefill_trigger_inputs(user_email="", user_name="Demo User"):
    """Government-specific sample payload for Workflow Builder trigger_inputs."""
    return {
        "startDate": date.today().isoformat(),
        "workflowBuilder": {
            "name": "James Chen",
            "email": user_email or "james.chen@dgs.ca.gov",
        },
        "workflowPreparer": {
            "name": "Maria Santos",
            "email": "maria.santos@cdt.ca.gov",
        },
    }


def build_default_trigger_inputs(schema, user_email="", user_name="Demo User"):
    """Build sample trigger_inputs from a workflow trigger_input_schema."""
    gov = gov_prefill_trigger_inputs(user_email=user_email, user_name=user_name)
    values = {}
    default_user = {"email": user_email or "james.chen@dgs.ca.gov", "name": user_name or "James Chen"}
    for field in schema or []:
        name = field.get("field_name")
        ftype = (field.get("field_data_type") or "").lower()
        if not name:
            continue
        if name in gov:
            values[name] = gov[name]
        elif ftype == "date":
            values[name] = date.today().isoformat()
        elif ftype == "user":
            if name == "workflowPreparer":
                values[name] = gov["workflowPreparer"]
            elif name == "workflowBuilder":
                values[name] = gov["workflowBuilder"]
            else:
                values[name] = dict(default_user)
        elif ftype in ("string", "text"):
            if "email" in name.lower():
                values[name] = user_email or "maria.santos@cdt.ca.gov"
            elif "name" in name.lower():
                values[name] = user_name or "Maria Santos"
            elif "vendor" in name.lower():
                values[name] = "Acme Cloud Solutions, Inc."
            elif "agency" in name.lower() or "department" in name.lower():
                values[name] = "California Department of Technology"
            elif "value" in name.lower() or "amount" in name.lower():
                values[name] = "$2,400,000"
            else:
                values[name] = "REQ-CA-2026-4201"
        elif ftype in ("number", "integer", "float"):
            values[name] = 2400000
        elif ftype == "boolean":
            values[name] = True
        else:
            values[name] = ""
    if not values and schema:
        values.update(gov)
    return values


def maestro_apps_base():
    return "https://apps-d.docusign.com"


def workflow_share_start_url(workflow_id):
    """Hosted Maestro start form for link/manual (Url) trigger workflows."""
    return f"{maestro_apps_base()}/send/maestro/workflows/{workflow_id}/start"


def normalize_instance_url(data):
    if not isinstance(data, dict):
        return ""
    return data.get("instance_url") or data.get("workflowInstanceUrl") or data.get("instanceUrl") or ""


def detect_trigger_block(detail):
    detail = detail or ""
    if "trigger type=Url" in detail:
        return "url"
    if "Agreement-Desk" in detail:
        return "agreement_desk"
    if "trigger type=Event" in detail:
        return "event"
    return None


def explain_trigger_failure(detail, status_code=400):
    """Turn Docusign trigger errors into demo-friendly guidance."""
    detail = detail or ""
    if status_code == 404:
        return (
            "Workflow trigger endpoint not found. This portal uses "
            "POST /workflows/{id}/actions/trigger (not /instances)."
        )
    if "trigger type=Url" in detail:
        return (
            "This workflow uses a link/manual trigger — API POST is not allowed. "
            "Use Launch in portal below to open the Maestro start form embedded here."
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


def launch_workflow(workflow_id, token, instance_name=None, trigger_inputs=None, user_email="", user_name="Demo User"):
    """Start a workflow for portal embed — API trigger when supported, else link start URL."""
    code, resp, body, req_meta = trigger_workflow(
        workflow_id,
        token,
        instance_name=instance_name,
        trigger_inputs=trigger_inputs,
        user_email=user_email,
        user_name=user_name,
    )
    base = {
        "status_code": code,
        "request_body": body,
        "trigger_requirements": req_meta,
        "api_response": resp,
    }
    if code in (200, 201):
        embed_url = normalize_instance_url(resp)
        return {
            **base,
            "success": bool(embed_url),
            "trigger_method": "api",
            "embed_url": embed_url,
            "instance_id": resp.get("instance_id") or resp.get("instanceId") or resp.get("id"),
            "message": "Workflow triggered via API — complete steps in the embed below.",
        }

    detail = resp.get("detail") or resp.get("message") or resp.get("title") or ""
    block = detect_trigger_block(detail)
    if block == "url":
        return {
            **base,
            "success": True,
            "trigger_method": "url",
            "status_code": code,
            "embed_url": workflow_share_start_url(workflow_id),
            "instance_id": None,
            "api_trigger_blocked": True,
            "message": (
                "Link-trigger workflow — opening the Maestro start form in the portal. "
                "Sign in with Docusign if prompted."
            ),
        }

    friendly = resp.get("friendly_error") or explain_trigger_failure(detail, code)
    return {
        **base,
        "success": False,
        "trigger_method": block or "unsupported",
        "embed_url": "",
        "instance_id": None,
        "message": friendly,
    }


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


def ds_put(path, body, token=None, base=None):
    url = (base or esign_base()) + path
    r = http.put(url, headers=ds_headers(token), json=body, timeout=15)
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


def get_jwt_token(required_scopes=None):
    """Get a fresh access token via JWT Grant (server-to-server, no user interaction)."""
    try:
        import jwt as pyjwt
        private_key = config.load_rsa_private_key()
        if not private_key:
            return None
        now = int(time.time())

        def mint(scopes):
            payload = {
                "iss": config.INTEGRATION_KEY,
                "sub": config.USER_ID,
                "aud": "account-d.docusign.com",
                "iat": now,
                "exp": now + 3600,
                "scope": scopes,
            }
            assertion = pyjwt.encode(payload, private_key, algorithm="RS256")
            return http.post(
                "https://account-d.docusign.com/oauth/token",
                data={
                    "grant_type": "urn:ietf:params:oauth:grant-type:jwt-bearer",
                    "assertion": assertion,
                },
                timeout=15,
            )

        resp = mint(DS_OAUTH_SCOPES)
        if resp.status_code == 200:
            return resp.json().get("access_token", "")

        body = (resp.text or "").lower()
        needs_workspaces = bool(required_scopes) and any(
            s.startswith("dtr.") for s in required_scopes
        )
        # Never fall back to a scope-stripped token when Workspaces scopes are required
        if needs_workspaces:
            app.logger.warning(
                "JWT missing Workspaces scopes (%s %s) — consent required",
                resp.status_code,
                resp.text[:200],
            )
            return ""

        if resp.status_code in (400, 401) and any(w in body for w in ("consent", "scope")):
            legacy = (
                "signature impersonation adm_store_unified_repo_read aow_manage "
                "webforms_read webforms_instance_read webforms_instance_write"
            )
            resp2 = mint(legacy)
            if resp2.status_code == 200:
                app.logger.warning(
                    "JWT minted without Workspaces scopes — re-consent with dtr.* to enable create"
                )
                return resp2.json().get("access_token", "")
            app.logger.warning("JWT token request failed: %s %s", resp2.status_code, resp2.text[:200])
            return ""
        app.logger.warning("JWT token request failed: %s %s", resp.status_code, resp.text[:200])
        return ""
    except Exception as exc:
        app.logger.warning("JWT token error: %s", exc)
        return ""


@app.context_processor
def inject_globals():
    tok = active_token_value()
    oauth = bool(session.get("prefer_oauth") and session.get("access_token"))
    return {
        "active_token": tok,
        "auth_method": "oauth" if oauth else ("jwt" if tok else None),
        "account_id":   session.get("account_id", config.ACCOUNT_ID),
        "base_uri":     session.get("base_uri",   config.BASE_URI),
        "user_email":   session.get("user_email", "") or ("Connected via JWT" if tok and not oauth else ""),
        "user_name":    session.get("user_name", "") or ("Demo Account" if tok else "Guest"),
        "customer_proof": GOV_CUSTOMER_PROOF,
        # Public client ID for Docusign JS embeds (not a secret)
        "ds_integration_key": config.INTEGRATION_KEY,
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
            error = "Access token expired. Click 'Login with Docusign' to refresh."
            if session.get("access_token"):
                session.pop("access_token", None)
                session.modified = True
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
    session.pop("guest_mode", None)
    session.pop("prefer_oauth", None)
    session["access_token"] = tok
    return redirect(url_for("index"))


# ── OAuth 2.0 Authorization Code Grant (confidential client) ─────────────────

@app.route("/oauth/login")
def oauth_login():
    import urllib.parse
    # Drop any cached JWT/OAuth token so the new scopes take effect immediately
    session.pop("access_token", None)
    session.pop("guest_mode", None)
    next_url = request.args.get("next") or url_for("index")
    session["oauth_next"] = next_url
    params = {
        "response_type": "code",
        "scope": DS_OAUTH_SCOPES,
        "client_id": config.INTEGRATION_KEY,
        "redirect_uri": oauth_redirect_uri(),
        "prompt": "login",
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
                               desc="No authorization code returned from Docusign.")

    redirect_uri = oauth_redirect_uri()
    # Exchange code for access token using client secret (confidential client)
    token_resp = http.post(
        "https://account-d.docusign.com/oauth/token",
        auth=(config.INTEGRATION_KEY, config.CLIENT_SECRET),
        data={
            "grant_type": "authorization_code",
            "code": code,
            "redirect_uri": redirect_uri,
        },
        timeout=15,
    )

    if token_resp.status_code != 200:
        return render_template("oauth_error.html", error=f"token_exchange_{token_resp.status_code}",
                               desc=token_resp.text[:500])

    data = token_resp.json()
    access_token = data.get("access_token", "")
    session.pop("guest_mode", None)
    session["prefer_oauth"] = True
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

    next_url = session.pop("oauth_next", None) or url_for("index")
    return redirect(next_url)


@app.route("/oauth/logout")
def oauth_logout():
    session.clear()
    session["guest_mode"] = True
    session["prefer_oauth"] = True
    session.modified = True
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
                ("Parties", "This Master Service Agreement (\"Agreement\") is entered into as of {date} between the California Department of Technology, a California state agency (\"Agency\"), and the Vendor identified in the signature block below (\"Vendor\")."),
                ("Scope of Services", "Vendor agrees to provide the services described in any Statement of Work (\"SOW\") executed under this Agreement. Each SOW is incorporated herein by reference and shall be governed by the terms of this Agreement."),
                ("Term", "This Agreement commences on the Effective Date and continues for a period of three (3) years, unless earlier terminated in accordance with Section 8. SOWs may extend beyond the Agreement term only if expressly stated therein."),
                ("Compensation", "Agency shall pay Vendor the fees set forth in each SOW within thirty (30) days of receipt of a correct invoice. All invoices must reference the applicable SOW number and purchase order."),
                ("Confidentiality", "Each party agrees to hold the other party's Confidential Information in strict confidence and not to disclose it to third parties without prior written consent, except as required by applicable law or court order."),
                ("Intellectual Property", "All work product, deliverables, and materials created by Vendor specifically for Agency under any SOW shall be considered work made for hire and shall be the sole property of Agency upon full payment."),
                ("Warranties", "Vendor warrants that (a) all services will be performed in a professional and workmanlike manner; (b) Vendor has the right to enter into this Agreement; and (c) the services will not infringe any third-party intellectual property rights."),
                ("Termination", "Either party may terminate this Agreement or any SOW for convenience upon thirty (30) days written notice. Agency may terminate immediately for cause if Vendor materially breaches any term and fails to cure such breach within ten (10) days of notice."),
                ("Governing Law", "This Agreement shall be governed by the laws of the State of California without regard to its conflict of law provisions. Disputes shall be resolved in Sacramento County, California."),
                ("Signatures", "The parties have executed this Agreement as of the date first written above.\n\nAGENCY: California Department of Technology\n\nBy: ___________________________     Date: ___________\nName: {name}\nTitle: Authorized Representative\n\nVENDOR:\n\nBy: ___________________________     Date: ___________\nName:\nTitle:"),
            ],
        },
        "nda": {
            "title": "Non-Disclosure Agreement",
            "short": "NDA",
            "sections": [
                ("Parties", "This Non-Disclosure Agreement (\"Agreement\") is entered into as of {date} between the California Department of Technology (\"Disclosing Party\") and the recipient identified in the signature block below (\"Receiving Party\")."),
                ("Purpose", "The parties wish to explore a potential business relationship (\"Purpose\"). In connection with the Purpose, the Disclosing Party may disclose certain confidential and proprietary information to the Receiving Party."),
                ("Definition of Confidential Information", "\"Confidential Information\" means any non-public information disclosed by the Disclosing Party, whether orally, in writing, or by any other means, that is designated as confidential or that reasonably should be understood to be confidential given the nature of the information and circumstances of disclosure."),
                ("Obligations", "The Receiving Party shall (a) hold all Confidential Information in strict confidence; (b) not disclose Confidential Information to any third party without prior written consent; (c) use Confidential Information solely for the Purpose; and (d) protect Confidential Information using at least the same degree of care used to protect its own confidential information."),
                ("Exclusions", "Confidential Information does not include information that (a) is or becomes publicly known through no breach by the Receiving Party; (b) was rightfully known before disclosure; (c) is independently developed without use of Confidential Information; or (d) is required to be disclosed by law."),
                ("Term", "This Agreement shall remain in effect for two (2) years from the Effective Date. The confidentiality obligations shall survive termination for an additional three (3) years."),
                ("Return of Information", "Upon request, the Receiving Party shall promptly return or destroy all Confidential Information and certify in writing that it has done so."),
                ("Signatures", "The parties have executed this Agreement as of the date first written above.\n\nVendor Effective Date: ____\n\nDISCLOSING PARTY — CALIFORNIA EDD:\n\nBy: ___________________________     Date: ___________\nName: {name}\nTitle: Authorized Representative\n\nRECEIVING PARTY (VENDOR):\n\nBy: ___     Date: ___________\nName:\nTitle:"),
            ],
        },
        "mou": {
            "title": "Memorandum of Understanding",
            "short": "MOU",
            "sections": [
                ("Purpose", "This Memorandum of Understanding (\"MOU\") is entered into as of {date} between the California Department of Technology (\"Agency\") and the Partner Agency identified below, to set forth the terms of collaboration on a joint initiative of mutual benefit."),
                ("Background", "The parties have identified a shared interest in improving public services through coordinated action. This MOU formalizes the intent to collaborate and establishes a framework for the partnership."),
                ("Scope of Collaboration", "The parties agree to collaborate on the following activities: (a) sharing of relevant data and resources; (b) coordinating program delivery where appropriate; (c) conducting joint outreach and communications; and (d) reporting jointly on outcomes as agreed."),
                ("Roles and Responsibilities", "Each party shall designate a primary point of contact. The parties shall meet at least quarterly to review progress. Decisions requiring commitment of resources beyond those described herein require written amendment to this MOU."),
                ("Funding", "This MOU does not obligate either party to expend funds beyond those separately authorized. Any cost-sharing arrangement shall be set forth in a separate written agreement."),
                ("Term and Termination", "This MOU is effective upon signature of both parties and remains in effect for one (1) year, with the option to renew by mutual written agreement. Either party may withdraw upon thirty (30) days written notice."),
                ("No Legal Partnership", "This MOU does not create a legal partnership, joint venture, or agency relationship between the parties. Neither party may bind the other to any obligation without express written authority."),
                ("Signatures", "The parties have signed this MOU as of the date first written above.\n\nSTATE OF CALIFORNIA:\n\nBy: ___________________________     Date: ___________\nName: {name}\nTitle: Authorized Representative\n\nPARTNER AGENCY:\n\nBy: ___________________________     Date: ___________\nName:\nTitle:"),
            ],
        },
        "grant": {
            "title": "Grant Agreement",
            "short": "Grant",
            "sections": [
                ("Award", "This Grant Agreement (\"Agreement\") is entered into as of {date} between the California Department of General Services Office of Grants Management (\"Grantor\") and the Recipient identified in the signature block below (\"Recipient\"). Grantor hereby awards a grant in the amount specified in Exhibit A."),
                ("Purpose of Grant", "The grant funds shall be used solely for the purposes described in Recipient's approved application, which is incorporated herein by reference. Any change in scope requires prior written approval from Grantor."),
                ("Performance Period", "The performance period commences on the Effective Date and ends as specified in Exhibit A. No funds may be expended after the end date without written approval."),
                ("Reporting Requirements", "Recipient shall submit quarterly progress reports no later than fifteen (15) days after the close of each quarter. A final performance report is due within sixty (60) days of the end of the performance period."),
                ("Financial Management", "Recipient shall maintain complete and accurate financial records for all grant expenditures for a period of five (5) years following the end of the performance period. Grantor may audit Recipient's books and records upon reasonable notice."),
                ("Allowable Costs", "Only costs that are reasonable, necessary, allocable, and allowable under applicable federal and state guidelines may be charged to this grant. Recipient shall obtain prior written approval for any budget modification exceeding 10% of any line item."),
                ("Non-Discrimination", "Recipient shall comply with all applicable federal, state, and local non-discrimination laws and shall not discriminate in the delivery of services funded under this Agreement."),
                ("Signatures", "The parties have executed this Agreement as of the date first written above.\n\nGRANTOR: State of California\n\nBy: ___________________________     Date: ___________\nName: {name}\nTitle: Grants Manager\n\nRECIPIENT:\n\nBy: ___________________________     Date: ___________\nName:\nTitle:"),
            ],
        },
        "vendor": {
            "title": "Vendor Agreement",
            "short": "Vendor",
            "sections": [
                ("Agreement", "This Vendor Agreement (\"Agreement\") is entered into as of {date} between the California Employment Development Department (\"EDD\" or \"State\") and the Vendor identified in the signature block below (\"Vendor\")."),
                ("Products and Services", "Vendor agrees to provide staffing and related services described in the attached Statement of Work, which is incorporated by reference. Vendor shall deliver all services in accordance with the specifications and timeline set forth therein."),
                ("Pricing and Payment", "State shall pay Vendor the rates listed in the Statement of Work within forty-five (45) days of receipt and acceptance of services and a correct invoice. All prices are firm and include applicable taxes."),
                ("Delivery and Acceptance", "Services are subject to EDD acceptance. State reserves the right to reject any services that do not conform to specifications. Non-conforming work must be corrected at Vendor's expense within five (5) business days."),
                ("Insurance", "Vendor shall maintain commercial general liability insurance with limits of at least $1,000,000 per occurrence and $2,000,000 aggregate, Workers' Compensation as required by law, and shall provide EDD with certificates of insurance upon request."),
                ("Indemnification", "Vendor shall defend, indemnify, and hold harmless State and its officers, employees, and agents from any claims, damages, or expenses arising from Vendor's performance under this Agreement."),
                ("Compliance", "Vendor shall comply with all applicable federal, state, and local laws, including but not limited to the California Government Code, EDD contracting rules, and all applicable labor and employment laws."),
                ("Signatures", "The parties have executed this Agreement as of the date first written above.\n\nVendor Effective Date: ____\n\nSTATE OF CALIFORNIA — EMPLOYMENT DEVELOPMENT DEPARTMENT:\n\nBy: ___________________________     Date: ___________\nName: {name}\nTitle: Contracts Officer\n\nVENDOR:\n\nBy: ___     Date: ___________\nName:\nTitle:"),
            ],
        },
        "employment": {
            "title": "Employment Offer Letter",
            "short": "Offer",
            "sections": [
                ("Offer of Employment", "This Employment Offer Letter (\"Offer\") is issued as of {date} by the California Department of Human Resources (CalHR). On behalf of the State, we are pleased to offer you a position as described herein, subject to the conditions set forth below."),
                ("Position and Start Date", "Position: As specified during your interview process. Department: As assigned. Start Date: As agreed with your hiring manager. This is a full-time, regular position subject to California civil service rules."),
                ("Compensation", "Your starting base salary will be as communicated by HR and is subject to standard State of California pay practices. Compensation is reviewed annually as part of the State's performance appraisal process."),
                ("Benefits", "You will be eligible for the State of California benefits package, including health, dental, and vision insurance, participation in the California Public Employees' Retirement System (CalPERS), paid vacation, sick leave, and all State-observed holidays."),
                ("Conditions of Employment", "This offer is contingent upon (a) successful completion of a background check; (b) verification of your eligibility to work in the United States; and (c) any other conditions communicated by Human Resources."),
                ("At-Will Employment", "Except as otherwise provided by State policy or civil service rules, your employment is at-will and may be terminated by either party at any time, with or without cause."),
                ("Acceptance", "Please sign and return this letter by the date specified by HR to confirm your acceptance of this offer. By signing below, you acknowledge that you have read and understood the terms set forth herein."),
                ("Signatures", "Accepted and agreed:\n\nSTATE OF CALIFORNIA:\n\nBy: ___________________________     Date: ___________\nName: {name}\nTitle: HR Director\n\nEMPLOYEE:\n\nBy: ___________________________     Date: ___________\nName:\nPrinted Name:"),
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
        "agency_party": "California Department of Technology",
        "counterparty_role": counterparty.get(doc_key, "Counterparty"),
        "signer_name": signer_name,
        "signer_email": signer_email,
        "email_subject": subject or f"{tmpl['title']} — Signature Required",
        "contract_term": term.get(doc_key, "As specified"),
        "governing_law": "State of California",
        "jurisdiction": "Sacramento County, California",
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
    pdf.cell(0, 6, "STATE OF CALIFORNIA  |  Docusign IAM Demo",
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
    pdf.cell(0, 5, f"Generated via Docusign IAM Gov Demo  |  {today}  |  DRAFT -- NOT FOR EXECUTION",
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
    """Group form tab values by their Docusign tab type.
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
        "hr":     {"tab": "generate", "doc_type": "Employment", "name": "Marcus Williams",   "email": "mwilliams@calhr.ca.gov",  "subject": "HR Onboarding Packet -- Action Required"},
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

    prefill_map = {
        "permit": {"name": "Jane Smith", "email": "jsmith@citizen.gov", "subject": "Building Permit #BP-2026-0441"},
    }
    prefill_key = request.args.get("prefill", "")
    if prefill_key in prefill_map:
        prefill = prefill_map[prefill_key]
    else:
        prefill = {
            "name": session.get("user_name") or config.DEMO_SIGNER_NAME,
            "email": session.get("user_email") or config.DEMO_SIGNER_EMAIL,
        }

    default_template_id = None
    for t in templates:
        if (t.get("name") or "").strip().lower() == config.DEMO_EMBEDDED_TEMPLATE_NAME.lower():
            default_template_id = t.get("templateId")
            break
    if not default_template_id and templates:
        default_template_id = templates[0].get("templateId")

    demo_defaults = {
        "name": prefill.get("name") or config.DEMO_SIGNER_NAME,
        "email": prefill.get("email") or config.DEMO_SIGNER_EMAIL,
        "role": config.DEMO_EMBEDDED_ROLE,
        "templateId": default_template_id,
    }

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
        else:
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
        prefill=prefill,
        demo_defaults=demo_defaults,
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


@app.route("/api/webforms")
def api_webforms_list():
    """List web forms for embedded portal launchers."""
    token = active_token_value()
    if not token:
        return jsonify({"forms": [], "authenticated": False})
    code, wf_data = ds_get("/forms", token=token, base=webforms_base())
    if code != 200:
        return jsonify({"error": wf_data.get("message", f"HTTP {code}"), "forms": []}), code
    return jsonify({"forms": parse_webforms(wf_data), "authenticated": True})


def _create_webform_instance(token, form_id, prefill=None, client_user_id=None, expiration_offset=60, return_url=None):
    """Shared create-instance helper for page + API routes."""
    # Load field metadata first so we can coerce number/date values correctly
    form_name = ""
    fields = []
    code2, detail = ds_get(f"/forms/{form_id}?state=active", token=token, base=webforms_base())
    if code2 == 200:
        form_name = webform_display_name(detail)
        fields = extract_webform_fields(detail)

    coerced = coerce_webform_form_values(fields, prefill or {})
    instance_body = {
        "clientUserId": (client_user_id or f"portal-{int(time.time())}").strip(),
        "formValues": coerced,
        "expirationOffset": expiration_offset,
    }
    if return_url:
        instance_body["returnUrl"] = return_url
    code, inst = ds_post(
        f"/forms/{form_id}/instances", instance_body, token=token, base=webforms_base()
    )
    form_url = webform_instance_url(inst) if code in (200, 201) else None
    return code, inst, form_url, form_name, fields


def _webform_launch_payload(form_id, form_name, form_url, inst, prefill=None, fields=None):
    """Normalize launch fields for the portal embed (Docusign JS + fallback)."""
    base_url = (inst or {}).get("formUrl") or ""
    if not base_url and form_url:
        base_url = form_url.split("#", 1)[0]
    return {
        "formUrl": form_url,
        "formUrlBase": base_url,
        "instanceToken": (inst or {}).get("instanceToken") or "",
        "formId": form_id,
        "formName": form_name,
        "prefill": prefill or {},
        "fields": fields or [],
        "instance": inst,
    }


@app.route("/api/webform/instance", methods=["POST"])
def api_webform_instance():
    """Create a Web Form instance and return launch URL for iframe embed."""
    token = active_token_value()
    if not token:
        return jsonify({"error": "Sign in with Docusign to launch Web Forms."}), 401

    body = request.get_json(silent=True) or {}
    form_id = (body.get("form_id") or "").strip()
    use_sample = bool(body.get("sample") or body.get("use_sample_prefill"))
    prefill = dict(body.get("prefill") or {})

    # Resolve preferred sample form when none specified
    if not form_id or use_sample:
        code_list, wf_data = ds_get("/forms", token=token, base=webforms_base())
        forms = parse_webforms(wf_data) if code_list == 200 else []
        preferred = find_preferred_webform(forms)
        if not form_id:
            if not preferred:
                return jsonify({"error": "No Web Forms found on this account."}), 404
            form_id = preferred.get("id") or ""
        if not form_id:
            return jsonify({"error": "form_id is required"}), 400

    # Build sample prefill from live field definitions when requested
    if use_sample or body.get("auto_prefill"):
        code2, detail = ds_get(f"/forms/{form_id}?state=active", token=token, base=webforms_base())
        if code2 == 200:
            fields = extract_webform_fields(detail)
            sample = build_webform_sample_prefill(
                fields,
                user_name=session.get("user_name") or config.DEMO_SIGNER_NAME,
                user_email=session.get("user_email") or config.DEMO_SIGNER_EMAIL,
            )
            # Explicit prefill wins over sample defaults
            sample.update(prefill)
            prefill = sample

    client_user_id = (body.get("client_user_id") or f"portal-{int(time.time())}").strip()
    return_url = (body.get("return_url") or request.host_url.rstrip("/") + "/webforms").strip()
    code, inst, form_url, form_name, fields = _create_webform_instance(
        token, form_id, prefill=prefill, client_user_id=client_user_id,
        expiration_offset=body.get("expiration_offset", 60),
        return_url=return_url,
    )
    if code not in (200, 201):
        err = inst.get("message") or inst.get("detail") or inst.get("error") or f"HTTP {code}"
        return jsonify({"error": err}), code

    return jsonify(_webform_launch_payload(form_id, form_name, form_url, inst, prefill, fields))


@app.route("/api/webform/sample", methods=["POST", "GET"])
def api_webform_sample():
    """One-click sample: preferred form + demo prefill + launch URL."""
    token = active_token_value()
    if not token:
        return jsonify({"error": "Sign in with Docusign to launch Web Forms."}), 401

    code_list, wf_data = ds_get("/forms", token=token, base=webforms_base())
    if code_list != 200:
        err = wf_data.get("message") or wf_data.get("detail") or f"HTTP {code_list}"
        return jsonify({"error": err}), code_list

    forms = parse_webforms(wf_data)
    preferred = find_preferred_webform(forms)
    if not preferred:
        return jsonify({"error": "No Web Forms found on this account."}), 404

    form_id = preferred.get("id")
    code2, detail = ds_get(f"/forms/{form_id}?state=active", token=token, base=webforms_base())
    if code2 != 200:
        return jsonify({"error": detail.get("message", f"HTTP {code2}")}), code2

    fields = extract_webform_fields(detail)
    prefill = build_webform_sample_prefill(
        fields,
        user_name=session.get("user_name") or config.DEMO_SIGNER_NAME,
        user_email=session.get("user_email") or config.DEMO_SIGNER_EMAIL,
    )
    code, inst, form_url, form_name, _ = _create_webform_instance(
        token, form_id, prefill=prefill, client_user_id=f"sample-{int(time.time())}",
        return_url=request.host_url.rstrip("/") + "/webforms?sample=done",
    )
    if code not in (200, 201):
        err = inst.get("message") or inst.get("detail") or inst.get("error") or f"HTTP {code}"
        return jsonify({"error": err}), code

    return jsonify(_webform_launch_payload(
        form_id, form_name or webform_display_name(preferred), form_url, inst, prefill, fields
    ))


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
        if code == 200:
            preferred = find_preferred_webform(forms)
            if preferred:
                forms = [preferred] + [f for f in forms if f.get("id") != preferred.get("id")]
        else:
            forms_error = wf_data.get("message") or wf_data.get("detail") or wf_data.get("error") or f"HTTP {code}"
    else:
        code, wf_data = 0, {}
        forms = []

    if request.method == "POST":
        form = request.form
        unique_id = form.get("unique_id", "").strip()
        form_id = form.get("form_id", "").strip()

        if not token:
            error = "Sign in with Docusign to create form instances."
        elif form_id:
            # Create a web form instance with pre-fill values
            prefill_values = {}
            for key, val in form.items():
                if key.startswith("pf_") and val:
                    prefill_values[key.replace("pf_", "", 1)] = val

            code2, inst, form_url, _, _ = _create_webform_instance(
                token, form_id, prefill=prefill_values,
                client_user_id=unique_id or f"user-{int(time.time())}",
            )
            if code2 in (200, 201):
                prefill_data = inst
                if form_url and form_url != inst.get("formUrl"):
                    prefill_data = {**inst, "launchUrl": form_url}
            else:
                error = inst.get("message") or inst.get("detail") or inst.get("error") or f"Web form instance error ({code2})"
        else:
            error = "Select a web form to launch."

    # Always prepare sample prefill for the preferred travel/training form (live demo ready)
    prefill_key = request.args.get("prefill", "")
    sample_launch = request.args.get("sample") == "1" or request.args.get("autolaunch") == "1"
    prefill = {}
    preferred_form_id = forms[0].get("id") if forms else ""
    if token and forms:
        target = find_preferred_webform(forms) or forms[0]
        preferred_form_id = target.get("id") or preferred_form_id
        code_d, detail = ds_get(f"/forms/{preferred_form_id}?state=active", token=token, base=webforms_base())
        if code_d == 200:
            prefill = build_webform_sample_prefill(
                extract_webform_fields(detail),
                user_name=session.get("user_name") or config.DEMO_SIGNER_NAME,
                user_email=session.get("user_email") or config.DEMO_SIGNER_EMAIL,
            )

    return render_template(
        "webforms.html", forms=forms, prefill_data=prefill_data,
        form_url=form_url, error=error, forms_error=forms_error, prefill=prefill,
        form_count=len(forms), preferred_form_id=preferred_form_id,
        sample_launch=sample_launch, demo_webform_name=config.DEMO_WEBFORM_NAME,
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
        workflows = sort_workflows_preferred_first(parse_workflows(data))

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
            "upgrade": None if scope_issue else "Confirm Workflow Builder is provisioned on your demo account with your Docusign AE.",
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

    selected = find_preferred_workflow(workflows)
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
    trigger_type = data.get("trigger_event_type") or ""
    return jsonify({
        "workflow_id": workflow_id,
        "trigger_event_type": trigger_type,
        "trigger_url": (data.get("trigger_http_config") or {}).get("url"),
        "share_start_url": workflow_share_start_url(workflow_id),
        "schema": schema,
        "sample_inputs": build_default_trigger_inputs(
            schema,
            user_email=session.get("user_email", ""),
            user_name=session.get("user_name", "Demo User"),
        ),
    })


@app.route("/api/workflow/<workflow_id>/launch", methods=["POST"])
def api_workflow_launch(workflow_id):
    """Launch a workflow for portal embed — API trigger or link start URL fallback."""
    token = active_token_value()
    if not token:
        return jsonify({"error": "not authenticated"}), 401
    body = request.get_json(silent=True) or {}
    result = launch_workflow(
        workflow_id,
        token,
        instance_name=body.get("instance_name"),
        trigger_inputs=body.get("trigger_inputs"),
        user_email=session.get("user_email", ""),
        user_name=session.get("user_name", "Demo User"),
    )
    if not result.get("success"):
        return jsonify({
            "error": result.get("message") or "Could not launch workflow",
            "trigger_method": result.get("trigger_method"),
            "status_code": result.get("status_code"),
            "api_response": result.get("api_response"),
        }), 400
    return jsonify({
        "workflow_id": workflow_id,
        "embed_url": result.get("embed_url"),
        "instance_id": result.get("instance_id"),
        "trigger_method": result.get("trigger_method"),
        "api_trigger_blocked": result.get("api_trigger_blocked", False),
        "message": result.get("message"),
        "status_code": result.get("status_code"),
        "request_body": result.get("request_body"),
        "api_response": result.get("api_response"),
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

    workflows = sort_workflows_preferred_first(parse_workflows(list_data)) if r_list.status_code == 200 else []
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
        workflow = find_preferred_workflow(workflows)
    if not workflow:
        workflow = workflows[0]

    workflow_id = workflow.get("id") or workflow.get("workflowId")
    user_email = session.get("user_email", "")
    user_name = session.get("user_name", "Demo User")
    launch = launch_workflow(
        workflow_id,
        token,
        instance_name="CDT MSA — Acme Cloud (API prefill)",
        trigger_inputs=gov_prefill_trigger_inputs(user_email=user_email, user_name=user_name),
        user_email=user_email,
        user_name=user_name,
    )

    create_result = {
        "status_code": launch.get("status_code"),
        "success": launch.get("success"),
        "embed_url": launch.get("embed_url"),
        "trigger_method": launch.get("trigger_method"),
        "api_trigger_blocked": launch.get("api_trigger_blocked", False),
        "message": launch.get("message"),
        "data": launch.get("api_response"),
        "request_body": launch.get("request_body"),
        "workflow_id": workflow_id,
        "workflow_name": workflow.get("name") or workflow.get("workflowName"),
        "trigger_requirements": launch.get("trigger_requirements"),
        "instance_id": launch.get("instance_id"),
    }

    instances = fetch_workflow_instances(workflow_id, token)

    return render_template(
        "maestro.html", workflows=workflows, plan_error=plan_error,
        create_result=create_result, api_call_info=None,
        instances=instances, selected_workflow_id=workflow_id,
    )


# ── NAVIGATOR / CLM ───────────────────────────────────────────────────────────

@app.route("/agreement-desk")
def agreement_desk():
    return render_template("agreement_desk.html")


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
            plan_error = {"code": code, "title": "Authentication Error",
                          "detail": "Token expired or invalid. Click 'Refresh Token' to re-authenticate."}
        else:
            plan_error = {"code": code, "title": "API Error",
                          "detail": data.get("message", f"HTTP {code}")}

    return render_template("navigator.html", agreements=agreements, plan_error=plan_error,
                           api_status=api_status, stats=stats,
                           embed=request.args.get("embed") == "1",
                           sync=request.args.get("sync") == "1",
                           highlight_vendor=request.args.get("vendor", ""))


# ── WORKSPACES ────────────────────────────────────────────────────────────────

GOV_WORKSPACE_DEMO = {
    "admin_title": "CA EDD Vendor Onboarding — Acme Staffing",
    "participant_name": "Priya Nair",
    "participant_title": "Contracts Officer · California Employment Development Department",
    "manager_email": "priya.nair@edd.ca.gov",
    "agency_name": "California Employment Development Department",
    "agency_short": "EDD",
    "vendor_name": "Acme Staffing Solutions, Inc.",
    "vendor_contact": "Corey Washington",
    "vendor_email": "cwdocusign1@gmail.com",
    "vendor_first": "Corey",
    "vendor_last": "Washington",
    "signer_email": "cwdocusign1@gmail.com",
    "signer_name": "Corey Washington",
    "upload_requests": [
        {
            "name": "Certificate of Insurance (GL + Workers’ Comp)",
            "description": "Upload current GL ($1M/$2M) and Workers’ Compensation certificates naming California EDD as certificate holder.",
            "recipient": "Corey Washington",
            "status": "Draft",
        },
        {
            "name": "Payee Data Record (STD 204) + W-9",
            "description": "Upload completed DGS STD 204 Payee Data Record and IRS Form W-9 for EDD vendor setup.",
            "recipient": "Corey Washington",
            "status": "Draft",
        },
        {
            "name": "Business license / FTB Form 590",
            "description": "Upload California business license (or equivalent) and FTB Form 590 Withholding Exemption Certificate if applicable.",
            "recipient": "Corey Washington",
            "status": "Draft",
        },
    ],
    "participant_tasks": [
        {
            "type": "sign",
            "title": "EDD Vendor Services Agreement — Acme Staffing.pdf",
            "sender": "Priya Nair · EDD Contracts",
            "date": "8/19/2026",
            "status": "Needs your signature",
            "cta": "Sign",
        },
        {
            "type": "sign",
            "title": "EDD Confidentiality & Data Sharing NDA.pdf",
            "sender": "Priya Nair · EDD Contracts",
            "date": "8/19/2026",
            "status": "Needs your signature",
            "cta": "Sign",
        },
        {
            "type": "upload",
            "title": "Certificate of Insurance (GL + Workers’ Comp)",
            "sender": "Priya Nair · EDD Contracts",
            "date": "8/19/2026",
            "status": "Upload requested",
            "cta": "Upload",
        },
    ],
}


def edd_signer_tabs(effective_date=""):
    """Sign Here + Vendor Effective Date text tab for EDD onboarding PDFs."""
    tabs = {
        "signHereTabs": [{
            "documentId": "1",
            "pageNumber": "1",
            "anchorString": "By: ___",
            "anchorUnits": "pixels",
            "anchorXOffset": "0",
            "anchorYOffset": "0",
        }],
        "textTabs": [{
            "documentId": "1",
            "pageNumber": "1",
            "anchorString": "Vendor Effective Date:",
            "anchorUnits": "pixels",
            "anchorXOffset": "128",
            "anchorYOffset": "-2",
            "tabLabel": "VendorEffectiveDate",
            "required": "true",
            "locked": "false" if not effective_date else "true",
            "width": "110",
            "height": "18",
            "fontSize": "Size11",
            "value": (effective_date or "").strip(),
        }],
    }
    return tabs


def create_edd_esign_envelope(
    token,
    *,
    doc_b64,
    filename,
    label,
    signer_email,
    signer_name,
    vendor_name,
    effective_date="",
    embedded=False,
    status="sent",
):
    """
    Create an eSign envelope for EDD vendor onboarding.
    - embedded=False → email delivery to signer_email (no clientUserId)
    - embedded=True  → captive recipient for iframe signing (clientUserId)
    """
    signer_body = {
        "email": signer_email,
        "name": signer_name,
        "recipientId": "1",
        "routingOrder": "1",
        "tabs": edd_signer_tabs(effective_date),
    }
    if embedded:
        signer_body["clientUserId"] = f"demo-{signer_email}"
    env_body = {
        "emailSubject": f"CA EDD — Please sign: {label}",
        "emailBlurb": (
            f"California Employment Development Department vendor onboarding for "
            f"{vendor_name}. Please review and sign {label}."
            + (f" Vendor effective date: {effective_date}." if effective_date else "")
        ),
        "status": status,
        "documents": [{
            "documentId": "1",
            "name": filename,
            "fileExtension": "pdf",
            "documentBase64": doc_b64,
        }],
        "recipients": {"signers": [signer_body]},
    }
    return ds_post("/envelopes", env_body, token=token)


def create_edd_recipient_view(token, envelope_id, signer_email, signer_name, *, doc_key="vendor"):
    """Recipient view URL for embedded EDD signing iframe."""
    from urllib.parse import urlencode
    return_params = urlencode({
        "frame": "1",
        "docKey": doc_key,
        "signerName": signer_name,
        "signerEmail": signer_email,
        "docTitle": "CA EDD Vendor Agreement",
        "envelopeId": envelope_id,
    })
    return_url = request.host_url.rstrip("/") + "/embedded/complete?" + return_params
    view_body = {
        "returnUrl": return_url,
        "authenticationMethod": "none",
        "email": signer_email,
        "userName": signer_name,
        "clientUserId": f"demo-{signer_email}",
    }
    return ds_post(
        f"/envelopes/{envelope_id}/views/recipient", view_body, token=token
    )


def workspaces_upload_document(workspace_id, filename, content_bytes, token=None):
    """Upload a PDF (or other file) into a workspace via multipart/form-data."""
    token = token or active_token_value(required_scopes=WORKSPACES_SCOPES)
    if not token:
        return 401, {"error": "not authenticated", "needs_reauth": True}
    url = f"{workspaces_api_base()}/{workspace_id}/documents"
    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/json",
    }
    try:
        r = http.post(
            url,
            headers=headers,
            files={"file": (filename, content_bytes, "application/pdf")},
            timeout=60,
        )
        try:
            data = r.json() if r.content else {}
        except Exception:
            data = {"raw": r.text[:1000]}
        return r.status_code, data
    except Exception as exc:
        return 500, {"error": str(exc)}


def seed_edd_vendor_onboarding(workspace_id, token, demo=None, effective_date=""):
    """
    Stage a California EDD vendor-onboarding pack in a workspace:
    - invite vendor participant (cwdocusign1@gmail.com)
    - upload sample agreements
    - email eSign envelopes for signature (delivery to vendor email)
    - create embedded envelope for live hub iframe
    - create upload requests for insurance / STD 204 / business docs
    """
    demo = demo or GOV_WORKSPACE_DEMO
    vendor_email = demo.get("signer_email") or demo.get("vendor_email") or "cwdocusign1@gmail.com"
    vendor_first = demo.get("vendor_first") or "Corey"
    vendor_last = demo.get("vendor_last") or "Washington"
    vendor_name = demo.get("vendor_name") or "Acme Staffing Solutions, Inc."
    signer_name = demo.get("signer_name") or f"{vendor_first} {vendor_last}"
    agency_signer = demo.get("participant_name") or "Priya Nair"
    effective_date = (effective_date or "").strip()
    steps = []
    documents = []
    envelopes = []
    upload_requests = []
    vendor_user_id = None
    hub_envelope_id = None
    invitation = None
    esign_envelope_ids = []

    # 1) Invite vendor as Participate user (workspace invitation)
    invite_body = {
        "email": vendor_email,
        "first_name": vendor_first,
        "last_name": vendor_last,
    }
    code, data = workspaces_call(
        "POST",
        f"/{workspace_id}/users",
        body=invite_body,
        token=token,
    )
    steps.append({"step": "invite_vendor", "status": code, "data": data})
    if code in (200, 201) and isinstance(data, dict):
        vendor_user_id = (
            data.get("user_id")
            or data.get("userId")
            or data.get("workspace_user_id")
            or data.get("workspaceUserId")
        )
        invitation = {
            "email": vendor_email,
            "name": signer_name,
            "status": data.get("status") or data.get("invitation_status") or "invited",
            "user_id": vendor_user_id,
            "invitation_id": (
                data.get("invitation_id")
                or data.get("invitationId")
                or data.get("workspace_invitation_id")
            ),
            "raw": {k: data.get(k) for k in list(data.keys())[:12]},
        }
    else:
        invitation = {
            "email": vendor_email,
            "name": signer_name,
            "status": "invite_failed" if code not in (200, 201) else "invited",
            "error": (data or {}).get("message") if isinstance(data, dict) else str(data),
        }

    # 2) Generate + upload sample PDFs (vendor agreement + confidentiality NDA)
    doc_specs = [
        {
            "key": "vendor",
            "filename": "EDD_Vendor_Services_Agreement.pdf",
            "label": "EDD Vendor Services Agreement",
        },
        {
            "key": "nda",
            "filename": "EDD_Confidentiality_Data_Sharing_NDA.pdf",
            "label": "EDD Confidentiality & Data Sharing NDA",
        },
    ]
    doc_ids = []
    vendor_b64 = None
    for spec in doc_specs:
        try:
            b64 = _generate_pdf(spec["key"], signer_name=agency_signer)
            pdf_bytes = base64.b64decode(b64)
            if spec["key"] == "vendor":
                vendor_b64 = b64
        except Exception as exc:
            steps.append({"step": f"generate_{spec['key']}", "status": 500, "error": str(exc)})
            continue
        code, data = workspaces_upload_document(
            workspace_id, spec["filename"], pdf_bytes, token=token
        )
        steps.append({"step": f"upload_{spec['key']}", "status": code, "data": data})
        doc_id = None
        if isinstance(data, dict):
            doc_id = data.get("document_id") or data.get("documentId")
        if code in (200, 201) and doc_id:
            doc_ids.append(doc_id)
            documents.append({
                "document_id": doc_id,
                "name": spec["label"],
                "filename": spec["filename"],
            })

            # Email delivery (no clientUserId) → signer inbox
            ecode, edata = create_edd_esign_envelope(
                token,
                doc_b64=b64,
                filename=spec["filename"],
                label=spec["label"],
                signer_email=vendor_email,
                signer_name=signer_name,
                vendor_name=vendor_name,
                effective_date=effective_date,
                embedded=False,
                status="sent",
            )
            steps.append({"step": f"esign_email_{spec['key']}", "status": ecode, "data": edata})
            if ecode in (200, 201) and isinstance(edata, dict) and edata.get("envelopeId"):
                esign_envelope_ids.append(edata["envelopeId"])
                envelopes.append({
                    "envelope_id": edata["envelopeId"],
                    "name": spec["label"],
                    "source": "esign_email",
                    "status": "sent",
                    "signer_email": vendor_email,
                    "recipient": signer_name,
                })

    # 3) Embedded hub envelope (iframe) — Vendor Agreement
    if vendor_b64:
        ecode, edata = create_edd_esign_envelope(
            token,
            doc_b64=vendor_b64,
            filename="EDD_Vendor_Services_Agreement.pdf",
            label="EDD Vendor Services Agreement",
            signer_email=vendor_email,
            signer_name=signer_name,
            vendor_name=vendor_name,
            effective_date=effective_date,
            embedded=True,
            status="sent",
        )
        steps.append({"step": "esign_embedded_hub", "status": ecode, "data": edata})
        if ecode in (200, 201) and isinstance(edata, dict) and edata.get("envelopeId"):
            hub_envelope_id = edata["envelopeId"]
            envelopes.append({
                "envelope_id": hub_envelope_id,
                "name": "EDD Vendor Services Agreement (embedded hub)",
                "source": "esign_embedded",
                "status": "sent",
                "signer_email": vendor_email,
                "recipient": signer_name,
            })

    # 4) Workspace envelope from uploaded docs, then assign + send via eSign
    # (Docs: createWorkspaceEnvelope → eSign modify recipients → send)
    pack_envelope_id = None
    if doc_ids:
        code, data = workspaces_call(
            "POST",
            f"/{workspace_id}/envelopes",
            body={
                "envelope_name": f"CA EDD Vendor Onboarding Pack — {vendor_name}",
                "document_ids": doc_ids,
            },
            token=token,
        )
        steps.append({"step": "workspace_envelope", "status": code, "data": data})
        if code in (200, 201) and isinstance(data, dict):
            pack_envelope_id = data.get("envelope_id") or data.get("envelopeId")

        if pack_envelope_id:
            # Assign signer so Overview shows recipient (not Unassigned) and send invitation
            recip_body = {
                "signers": [{
                    "email": vendor_email,
                    "name": signer_name,
                    "recipientId": "1",
                    "routingOrder": "1",
                    "tabs": edd_signer_tabs(effective_date),
                }]
            }
            rcode, rdata = ds_put(
                f"/envelopes/{pack_envelope_id}/recipients", recip_body, token=token
            )
            steps.append({"step": "workspace_envelope_recipients", "status": rcode, "data": rdata})
            # Some envelopes need recipients on create — try PUT envelope status sent
            scode, sdata = ds_put(
                f"/envelopes/{pack_envelope_id}",
                {"status": "sent"},
                token=token,
            )
            steps.append({"step": "workspace_envelope_send", "status": scode, "data": sdata})
            env_status = "sent" if scode in (200, 201) else (data.get("status") if isinstance(data, dict) else "created")
            if rcode not in (200, 201):
                # Retry: recreate via eSign-sent and note in steps
                env_status = data.get("status") if isinstance(data, dict) else "created"
            envelopes.append({
                "envelope_id": pack_envelope_id,
                "name": f"CA EDD Vendor Onboarding Pack — {vendor_name}",
                "source": "workspaces",
                "status": env_status,
                "signer_email": vendor_email,
                "recipient": signer_name,
            })

    # Also try attaching previously emailed eSign envelopes into the hub
    for eid in esign_envelope_ids:
        for body in (
            {"envelope_id": eid},
            {"envelopeId": eid},
        ):
            code, data = workspaces_call(
                "POST", f"/{workspace_id}/envelopes", body=body, token=token
            )
            steps.append({
                "step": "attach_esign_envelope",
                "status": code,
                "envelope_id": eid,
                "body_keys": list(body.keys()),
            })
            if code in (200, 201):
                break

    # 5) Upload requests for vendor evidence (active so Overview shows Waiting for upload)
    due = (datetime.utcnow() + timedelta(days=14)).strftime("%Y-%m-%dT23:59:59Z")
    for req in demo.get("upload_requests") or []:
        assignment = {
            "upload_request_responsibility_type_id": "assignee",
            "email": vendor_email,
            "first_name": vendor_first,
            "last_name": vendor_last,
        }
        if vendor_user_id:
            assignment["assignee_user_id"] = vendor_user_id
        body = {
            "name": req.get("name") or "Vendor document upload",
            "description": req.get("description") or req.get("name") or "Please upload the requested document.",
            "due_date": due,
            "status": "active",
            "assignments": [assignment],
        }
        code, data = workspaces_call(
            "POST",
            f"/{workspace_id}/upload-requests",
            body=body,
            token=token,
        )
        # Some tenants reject "active" — retry as draft then try to activate
        if code >= 400:
            body["status"] = "draft"
            code, data = workspaces_call(
                "POST",
                f"/{workspace_id}/upload-requests",
                body=body,
                token=token,
            )
        steps.append({"step": "upload_request", "status": code, "name": body["name"], "data": data})
        if code in (200, 201) and isinstance(data, dict):
            ur_id = data.get("upload_request_id") or data.get("uploadRequestId")
            upload_requests.append({
                "upload_request_id": ur_id,
                "name": body["name"],
                "status": data.get("status") or body["status"],
                "recipient": signer_name,
                "recipient_email": vendor_email,
            })
            if ur_id and (data.get("status") or "").lower() == "draft":
                for activate_body in ({"status": "active"}, {"status": "pending"}):
                    acode, adata = workspaces_call(
                        "PUT",
                        f"/{workspace_id}/upload-requests/{ur_id}",
                        body=activate_body,
                        token=token,
                    )
                    steps.append({"step": "activate_upload_request", "status": acode, "id": ur_id})
                    if acode in (200, 201):
                        upload_requests[-1]["status"] = activate_body["status"]
                        break

    return {
        "vendor_user_id": vendor_user_id,
        "signer_email": vendor_email,
        "signer_name": signer_name,
        "effective_date": effective_date,
        "hub_envelope_id": hub_envelope_id,
        "invitation": invitation,
        "documents": documents,
        "envelopes": envelopes,
        "upload_requests": upload_requests,
        "steps": steps,
    }


def workspaces_api_base():
    """Workspaces API (beta) — same host as IAM: api-d.docusign.com/v1."""
    return f"{iam_base()}/workspaces"


def workspaces_call(method, suffix="", body=None, token=None):
    """Proxy a Workspaces API call under /v1/accounts/{accountId}/workspaces."""
    token = token or active_token_value(required_scopes=WORKSPACES_SCOPES)
    if not token:
        return 401, {
            "error": "not authenticated",
            "message": (
                "Workspaces requires dtr.rooms.read / dtr.rooms.write scopes. "
                "Click Refresh Token to re-authenticate."
            ),
            "needs_reauth": True,
        }
    if not token_has_scopes(token, WORKSPACES_SCOPES):
        return 403, {
            "error": "missing_scopes",
            "message": (
                "One or more required scopes missing: 'dtr.rooms.read' / 'dtr.rooms.write'. "
                "Click Refresh Token to re-authenticate."
            ),
            "needs_reauth": True,
        }
    url = workspaces_api_base() + suffix
    headers = ds_headers(token)
    timeout = 60 if method == "POST" else 30
    try:
        if method == "GET":
            r = http.get(url, headers=headers, timeout=timeout)
        elif method == "POST":
            r = http.post(url, headers=headers, json=body or {}, timeout=timeout)
        elif method == "PUT":
            r = http.put(url, headers=headers, json=body or {}, timeout=timeout)
        elif method == "DELETE":
            r = http.delete(url, headers=headers, timeout=timeout)
        else:
            return 400, {"error": f"unsupported method {method}"}
        try:
            data = r.json() if r.content else {}
        except Exception:
            data = {"raw": r.text[:1000]}
        return r.status_code, data
    except Exception as exc:
        return 500, {"error": str(exc)}


def normalize_workspace(item):
    """Map Workspaces API snake_case fields to the demo UI shape."""
    if not isinstance(item, dict):
        return item
    wid = item.get("workspaceId") or item.get("workspace_id")
    name = item.get("workspaceName") or item.get("name")
    created = item.get("created") or item.get("created_date")
    out = dict(item)
    if wid:
        out["workspaceId"] = wid
        out["workspace_id"] = wid
    if name is not None:
        out["workspaceName"] = name
        out["name"] = name
    if created is not None:
        out["created"] = created
        out["created_date"] = created
    if "status" not in out or not out["status"]:
        out["status"] = "active"
    return out


def workspaces_error_message(code, data):
    """User-facing error for Workspaces API failures."""
    raw = ""
    if isinstance(data, dict):
        raw = (
            data.get("message")
            or data.get("detail")
            or data.get("error_description")
            or data.get("error")
            or ""
        )
        if isinstance(raw, dict):
            raw = raw.get("message") or str(raw)
    raw = str(raw or f"HTTP {code}")
    low = raw.lower()
    if code in (401, 403) and any(
        w in low for w in ("scope", "consent", "dtr.", "unauthorized", "not authorized", "forbidden")
    ):
        return (
            f"{raw} — Workspaces requires dtr.rooms.read / dtr.rooms.write scopes. "
            "Click Refresh Token (or re-consent JWT) and try again."
        )
    if "allowworkspacecreate" in low.replace(" ", ""):
        return (
            f"{raw} — That message is from the legacy eSign Workspaces path. "
            "This demo now uses the Workspaces API at api-d.docusign.com/v1; refresh the page and retry."
        )
    return raw


def parse_workspace_files(data):
    """Normalize document/file list from Workspaces API responses."""
    if not isinstance(data, dict):
        return []
    for key in ("documents", "files", "workspaceItems", "workspaceFolderItems", "items"):
        items = data.get(key)
        if isinstance(items, list):
            return items
    folders = data.get("folders") or data.get("workspaceFolders") or []
    if isinstance(folders, list) and folders:
        return folders[0].get("files") or folders[0].get("workspaceFolderItems") or []
    return []


@app.route("/workspaces")
def workspaces():
    token = active_token_value(required_scopes=WORKSPACES_SCOPES)
    workspace_list = []
    error = None
    api_call_info = None

    if not token:
        # Prefer a scoped JWT/OAuth token; if consent is missing, show auth gate with reauth
        bare = active_token_value()
        if not bare:
            return render_template(
                "workspaces.html",
                workspaces=[],
                error=None,
                needs_auth=True,
                api_call_info=None,
                demo=GOV_WORKSPACE_DEMO,
            )
        return render_template(
            "workspaces.html",
            workspaces=[],
            error=(
                "Workspaces requires dtr.rooms.read / dtr.rooms.write scopes. "
                "Click Refresh Token to re-authenticate."
            ),
            needs_auth=False,
            needs_reauth=True,
            api_call_info=None,
            demo=GOV_WORKSPACE_DEMO,
        )

    url = workspaces_api_base()
    start = time.time()
    code, data = workspaces_call("GET", token=token)
    latency = round((time.time() - start) * 1000)
    api_call_info = {
        "method": "GET",
        "url": url,
        "status_code": code,
        "latency_ms": latency,
        "response_preview": data if isinstance(data, dict) else {},
    }

    if code == 200:
        workspace_list = [normalize_workspace(w) for w in (data.get("workspaces") or [])]
    elif code == 403:
        error = workspaces_error_message(code, data)
    elif code == 404:
        error = "Workspaces feature not found. Confirm the account has Workspaces enabled."
    else:
        error = workspaces_error_message(code, data)

    return render_template(
        "workspaces.html",
        workspaces=workspace_list,
        error=error,
        needs_auth=False,
        needs_reauth=bool(isinstance(data, dict) and data.get("needs_reauth")) if code != 200 else False,
        api_call_info=api_call_info,
        demo=GOV_WORKSPACE_DEMO,
    )


@app.route("/api/workspaces", methods=["GET"])
def api_workspaces_list():
    token = active_token_value(required_scopes=WORKSPACES_SCOPES)
    if not token:
        return jsonify({
            "error": (
                "Workspaces requires dtr.rooms.read / dtr.rooms.write scopes. "
                "Click Refresh Token to re-authenticate."
            ),
            "needs_reauth": True,
        }), 401
    code, data = workspaces_call("GET", token=token)
    if code != 200:
        return jsonify({
            "error": workspaces_error_message(code, data),
            "data": data,
            "needs_reauth": bool(isinstance(data, dict) and data.get("needs_reauth")),
        }), code
    items = [normalize_workspace(w) for w in (data.get("workspaces") or [])]
    return jsonify({"workspaces": items, "count": len(items)})


@app.route("/api/workspaces", methods=["POST"])
def api_workspaces_create():
    token = active_token_value(required_scopes=WORKSPACES_SCOPES)
    if not token:
        return jsonify({
            "error": (
                "Workspaces requires dtr.rooms.read / dtr.rooms.write scopes. "
                "Click Refresh Token to re-authenticate."
            ),
            "needs_reauth": True,
        }), 401
    body = request.get_json(silent=True) or {}
    name = body.get("workspaceName") or body.get("name") or GOV_WORKSPACE_DEMO["admin_title"]
    seed = body.get("seed", True)
    if isinstance(seed, str):
        seed = seed.strip().lower() not in ("0", "false", "no")
    effective_date = (
        body.get("effectiveDate")
        or body.get("effective_date")
        or body.get("vendorEffectiveDate")
        or ""
    )

    # Workspaces API (beta) requires {"name": "..."} — not legacy workspaceName
    code, data = workspaces_call("POST", body={"name": name}, token=token)
    if code not in (200, 201):
        return jsonify({
            "error": workspaces_error_message(code, data),
            "data": data,
            "needs_reauth": bool(isinstance(data, dict) and data.get("needs_reauth")),
        }), code

    result = normalize_workspace(data if isinstance(data, dict) else {})
    workspace_id = result.get("workspaceId") or result.get("workspace_id")
    if seed and workspace_id:
        try:
            result["onboarding"] = seed_edd_vendor_onboarding(
                workspace_id,
                token,
                demo=GOV_WORKSPACE_DEMO,
                effective_date=effective_date,
            )
        except Exception as exc:
            app.logger.warning("EDD onboarding seed failed: %s", exc)
            result["onboarding"] = {"error": str(exc), "steps": []}
    return jsonify(result), code


@app.route("/api/workspaces/<workspace_id>", methods=["GET"])
def api_workspace_detail(workspace_id):
    token = active_token_value(required_scopes=WORKSPACES_SCOPES)
    if not token:
        return jsonify({"error": "not authenticated", "needs_reauth": True}), 401
    code, data = workspaces_call("GET", f"/{workspace_id}", token=token)
    if code != 200:
        return jsonify({
            "error": workspaces_error_message(code, data),
            "data": data,
        }), code
    return jsonify(normalize_workspace(data if isinstance(data, dict) else {}))


@app.route("/api/workspaces/<workspace_id>/files", methods=["GET"])
def api_workspace_files(workspace_id):
    token = active_token_value(required_scopes=WORKSPACES_SCOPES)
    if not token:
        return jsonify({"error": "not authenticated", "needs_reauth": True}), 401
    code, data = workspaces_call("GET", f"/{workspace_id}/documents", token=token)
    if code != 200:
        code, data = workspaces_call("GET", f"/{workspace_id}/files", token=token)
    files = parse_workspace_files(data)
    # Also surface upload requests for the onboarding demo
    ur_code, ur_data = workspaces_call("GET", f"/{workspace_id}/upload-requests", token=token)
    upload_requests = []
    if ur_code == 200 and isinstance(ur_data, dict):
        upload_requests = ur_data.get("data") or ur_data.get("upload_requests") or []
    env_code, env_data = workspaces_call("GET", f"/{workspace_id}/envelopes", token=token)
    envelopes = []
    if env_code == 200 and isinstance(env_data, dict):
        envelopes = env_data.get("envelopes") or []
    return jsonify({
        "files": files,
        "upload_requests": upload_requests,
        "envelopes": envelopes,
        "raw": data,
        "count": len(files),
    })


@app.route("/api/workspaces/<workspace_id>/open-signing", methods=["POST"])
def api_workspace_open_signing(workspace_id):
    """
    Open live embedded signing for the EDD hub iframe.
    Creates (or reuses) a captive recipient envelope for cwdocusign1@gmail.com
    and returns a recipient-view signingUrl.
    Optionally also emails a parallel signing link (no clientUserId).
    """
    token = active_token_value()
    if not token:
        return jsonify({"error": "Not authenticated. Please login first.", "needs_reauth": True}), 401

    body = request.get_json(silent=True) or {}
    demo = GOV_WORKSPACE_DEMO
    signer_email = (
        body.get("signerEmail")
        or body.get("signer_email")
        or demo.get("signer_email")
        or "cwdocusign1@gmail.com"
    ).strip()
    signer_name = (
        body.get("signerName")
        or body.get("signer_name")
        or demo.get("signer_name")
        or "Corey Washington"
    ).strip()
    effective_date = (
        body.get("effectiveDate")
        or body.get("effective_date")
        or body.get("vendorEffectiveDate")
        or ""
    ).strip()
    send_email = body.get("sendEmail", body.get("send_email", False))
    if isinstance(send_email, str):
        send_email = send_email.strip().lower() not in ("0", "false", "no")
    envelope_id = (body.get("envelopeId") or body.get("envelope_id") or "").strip() or None
    agency_signer = demo.get("participant_name") or "Priya Nair"
    vendor_name = demo.get("vendor_name") or "Acme Staffing Solutions, Inc."

    api_steps = []
    email_envelope_id = None

    try:
        doc_b64 = _generate_pdf("vendor", signer_name=agency_signer)
    except Exception as exc:
        return jsonify({"error": f"PDF generation failed: {exc}"}), 500

    if not envelope_id:
        ecode, edata = create_edd_esign_envelope(
            token,
            doc_b64=doc_b64,
            filename="EDD_Vendor_Services_Agreement.pdf",
            label="EDD Vendor Services Agreement",
            signer_email=signer_email,
            signer_name=signer_name,
            vendor_name=vendor_name,
            effective_date=effective_date,
            embedded=True,
            status="sent",
        )
        api_steps.append({
            "step": "create_embedded_envelope",
            "status": ecode,
            "data": {k: edata.get(k) for k in ("envelopeId", "status", "errorCode", "message") if isinstance(edata, dict)},
        })
        if ecode not in (200, 201) or not isinstance(edata, dict) or not edata.get("envelopeId"):
            return jsonify({
                "error": (edata or {}).get("message", f"Envelope error {ecode}") if isinstance(edata, dict) else f"Envelope error {ecode}",
                "raw": edata,
                "apiSteps": api_steps,
            }), 400
        envelope_id = edata["envelopeId"]

    vcode, vdata = create_edd_recipient_view(
        token, envelope_id, signer_email, signer_name, doc_key="vendor"
    )
    api_steps.append({
        "step": "recipient_view",
        "status": vcode,
        "envelopeId": envelope_id,
    })
    if vcode not in (200, 201) or not isinstance(vdata, dict) or not vdata.get("url"):
        # Envelope may be completed/voided — create a fresh one and retry once
        ecode, edata = create_edd_esign_envelope(
            token,
            doc_b64=doc_b64,
            filename="EDD_Vendor_Services_Agreement.pdf",
            label="EDD Vendor Services Agreement",
            signer_email=signer_email,
            signer_name=signer_name,
            vendor_name=vendor_name,
            effective_date=effective_date,
            embedded=True,
            status="sent",
        )
        api_steps.append({"step": "create_embedded_envelope_retry", "status": ecode})
        if ecode not in (200, 201) or not isinstance(edata, dict) or not edata.get("envelopeId"):
            return jsonify({
                "error": (vdata or {}).get("message", f"Recipient view error {vcode}") if isinstance(vdata, dict) else f"View error {vcode}",
                "raw": vdata,
                "apiSteps": api_steps,
            }), 400
        envelope_id = edata["envelopeId"]
        vcode, vdata = create_edd_recipient_view(
            token, envelope_id, signer_email, signer_name, doc_key="vendor"
        )
        api_steps.append({"step": "recipient_view_retry", "status": vcode})
        if vcode not in (200, 201) or not isinstance(vdata, dict) or not vdata.get("url"):
            return jsonify({
                "error": (vdata or {}).get("message", f"Recipient view error {vcode}") if isinstance(vdata, dict) else f"View error {vcode}",
                "raw": vdata,
                "apiSteps": api_steps,
            }), 400

    if send_email:
        ecode, edata = create_edd_esign_envelope(
            token,
            doc_b64=doc_b64,
            filename="EDD_Vendor_Services_Agreement.pdf",
            label="EDD Vendor Services Agreement",
            signer_email=signer_email,
            signer_name=signer_name,
            vendor_name=vendor_name,
            effective_date=effective_date,
            embedded=False,
            status="sent",
        )
        api_steps.append({"step": "email_delivery_envelope", "status": ecode})
        if ecode in (200, 201) and isinstance(edata, dict):
            email_envelope_id = edata.get("envelopeId")

    return jsonify({
        "success": True,
        "workspaceId": workspace_id,
        "envelopeId": envelope_id,
        "emailEnvelopeId": email_envelope_id,
        "signingUrl": vdata.get("url"),
        "signerEmail": signer_email,
        "signerName": signer_name,
        "effectiveDate": effective_date,
        "apiSteps": api_steps,
    })


@app.route("/workspaces/create", methods=["POST"])
def workspace_create():
    """Legacy create route — forwards to API helper with EDD onboarding seed."""
    token = active_token_value(required_scopes=WORKSPACES_SCOPES)
    if not token:
        return jsonify({"error": "not authenticated", "needs_reauth": True}), 401
    body = request.get_json(silent=True) or {}
    name = body.get("name") or body.get("workspaceName") or GOV_WORKSPACE_DEMO["admin_title"]
    effective_date = (
        body.get("effectiveDate")
        or body.get("effective_date")
        or body.get("vendorEffectiveDate")
        or ""
    )
    code, data = workspaces_call("POST", body={"name": name}, token=token)
    if code not in (200, 201):
        err = workspaces_error_message(code, data)
        payload = data if isinstance(data, dict) else {}
        payload = {**payload, "error": err}
        return jsonify(payload), code
    result = normalize_workspace(data if isinstance(data, dict) else {})
    workspace_id = result.get("workspaceId") or result.get("workspace_id")
    if workspace_id and body.get("seed", True):
        result["onboarding"] = seed_edd_vendor_onboarding(
            workspace_id,
            token,
            demo=GOV_WORKSPACE_DEMO,
            effective_date=effective_date,
        )
    return jsonify(result), code


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
        connect_demo=CONNECT_DEMO,
        connect_status_guide=CONNECT_STATUS_GUIDE,
        connect_endpoints=CONNECT_ENDPOINTS,
        connect_walkthrough=[
            {
                "id": "sent",
                "event": "envelope-sent",
                "headline": "Contract sent for signature",
                "plain": "Procurement sent the MSA to the vendor. Docusign notifies your systems that the envelope is out.",
                "action": "Case tracker shows “Awaiting signature” — no manual update.",
            },
            {
                "id": "delivered",
                "event": "envelope-delivered",
                "headline": "Vendor opened the signing link",
                "plain": "The recipient viewed the agreement but has not signed yet.",
                "action": "Optional reminder if no action after 48 hours.",
            },
            {
                "id": "recipient",
                "event": "recipient-completed",
                "headline": "Agency director signed",
                "plain": "One signer finished. Multi-signer envelopes may still be in progress.",
                "action": "Route to vendor counter-signer if needed.",
            },
            {
                "id": "completed",
                "event": "envelope-completed",
                "headline": "Contract fully executed",
                "plain": "All parties signed. Trigger ERP and contract register updates from this event.",
                "action": "Middleware posts encumbrance + metadata to FI$Cal.",
            },
        ],
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
    _save_webhook_events()
    return jsonify({"received": True}), 200


@app.route("/webhook/events")
def webhook_events_api():
    return jsonify(webhook_events[-50:])


@app.route("/webhook/clear", methods=["POST"])
def webhook_clear():
    webhook_events.clear()
    _save_webhook_events()
    return jsonify({"cleared": True})


@app.route("/api/demo/health")
def demo_health():
    token = active_token_value()
    oauth = bool(session.get("prefer_oauth") and session.get("access_token"))
    result = {
        "ok": bool(token),
        "api_ok": False,
        "auth_method": "oauth" if oauth else ("jwt" if token else None),
        "checked_at": datetime.utcnow().isoformat() + "Z",
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
        solicitation=pkg["solicitation"],
        ai_scorecards=pkg["scorecards"],
        use_cases=pkg["use_cases"],
        iam_essentials=IAM_ESSENTIALS_CAPABILITIES,
        clm_capabilities=CLM_CAPABILITIES,
        convergence=CONVERGENCE_POINTS,
        api_examples=API_EXAMPLES,
        demo_signer_email=session.get("user_email") or "demo.signer@agency.ca.gov",
        demo_signer_name=session.get("user_name") or "Agency Signer",
        is_authenticated=bool(active_token_value()),
        customer_proof=GOV_CUSTOMER_PROOF,
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
    scenario = pkg.get(scenario_id) or pkg["first_party"]
    if scenario_id not in ("first_party", "third_party", "solicitation"):
        scenario = pkg["first_party"]
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
                {"method": "GET",    "path": "/workspaces",                        "desc": "List all workspaces (agreement hubs)"},
                {"method": "POST",   "path": "/workspaces",                        "desc": "Create dynamic workspace hub"},
                {"method": "GET",    "path": "/workspaces/{wsId}",                 "desc": "Get workspace details and settings"},
                {"method": "GET",    "path": "/workspaces/{wsId}/documents",       "desc": "List documents in workspace"},
                {"method": "POST",   "path": "/workspaces/{wsId}/documents",       "desc": "Add a document to the workspace"},
                {"method": "GET",    "path": "/workspaces/{wsId}/upload-requests", "desc": "List upload requests"},
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
        # Workspaces API (beta): https://api-d.docusign.com/v1/accounts/{acct}/...
        rel = path if path.startswith("/") else f"/{path}"
        if not rel.startswith("/workspaces"):
            rel = f"/workspaces{rel}"
        url = f"{iam_base()}{rel}"
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
# Docusign as the agreement platform for AI agents — no external AI key needed.
# Uses the same OAuth token already in the session.


@app.route("/workflow-discovery")
def workflow_discovery():
    return render_template("workflow_discovery.html")


@app.route("/integration-story")
def integration_story():
    return render_template("integration_story.html")


@app.route("/procurement-intake")
def procurement_intake():
    return render_template("procurement_intake.html")


@app.route("/admin")
def admin_dashboard():
    token = active_token_value()
    status = build_admin_status(token, session, config, ds_get, webhook_events)
    return render_template(
        "admin.html",
        status=status,
        capabilities=ADMIN_CAPABILITIES,
        pages=ADMIN_PAGE_CATALOG,
        backend_labels=BACKEND_LABELS,
        webhook_url=request.host_url.rstrip("/") + "/webhook/receive",
    )


@app.route("/api/admin/status")
def api_admin_status():
    token = active_token_value()
    status = build_admin_status(token, session, config, ds_get, webhook_events)
    return jsonify(status)


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
    """List Docusign Extensions available on the account."""
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
    Execute an agentic Docusign flow:
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


@app.errorhandler(404)
def not_found(e):
    if request.path.startswith("/api/") or request.path.startswith("/webhook/"):
        return jsonify({"error": "not found"}), 404
    return render_template("404.html"), 404


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5050))
    app.run(debug=True, port=port)
