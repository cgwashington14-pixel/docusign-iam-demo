import requests as http
from flask import (
    Blueprint,
    jsonify,
    render_template,
    request,
    session,
)

from iamdemo import config
from iamdemo.services.docusign import active_token_value, ds_get, ds_headers, ds_post

bp = Blueprint("ai_agent", __name__)


@bp.route("/agent")
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


@bp.route("/agent/envelope/<envelope_id>")
def agent_envelope_detail(envelope_id):
    """Full envelope context — recipients, documents, audit trail."""
    token = active_token_value()
    if not token:
        return jsonify({"error": "not authenticated"}), 401
    code_e, env = ds_get(f"/envelopes/{envelope_id}", token=token)
    code_r, rdata = ds_get(f"/envelopes/{envelope_id}/recipients", token=token)
    code_d, ddata = ds_get(f"/envelopes/{envelope_id}/documents", token=token)
    code_a, adata = ds_get(f"/envelopes/{envelope_id}/audit_events", token=token)
    if code_e != 200:
        return jsonify({"error": env.get("message", f"HTTP {code_e}")}), code_e
    recipients = rdata.get("signers", []) + rdata.get("carbonCopies", []) if code_r == 200 else []
    documents = (
        [
            {"documentId": d["documentId"], "name": d.get("name", ""), "type": d.get("type", "")}
            for d in ddata.get("envelopeDocuments", [])
        ]
        if code_d == 200
        else []
    )
    audit = adata.get("auditEvents", []) if code_a == 200 else []
    return jsonify(
        {
            "envelope": env,
            "recipients": recipients,
            "documents": documents,
            "audit_events": len(audit),
            "status": env.get("status"),
        }
    )


@bp.route("/agent/extensions")
def agent_extensions():
    """List Docusign Extensions available on the account."""
    token = active_token_value()
    if not token:
        return jsonify({"error": "not authenticated"}), 401
    acct = session.get("account_id", config.ACCOUNT_ID)
    r = http.get(
        f"https://api-d.docusign.com/v1/accounts/{acct}/extensions",
        headers=ds_headers(token),
        timeout=15,
    )
    try:
        data = r.json()
    except Exception:
        data = {}
    return jsonify({"status_code": r.status_code, "extensions": data})


@bp.route("/agent/agreement/<agreement_id>")
def agent_agreement_detail(agreement_id):
    """AI-extracted provisions from a Navigator agreement."""
    token = active_token_value()
    if not token:
        return jsonify({"error": "not authenticated"}), 401
    acct = session.get("account_id", config.ACCOUNT_ID)
    r = http.get(
        f"https://api-d.docusign.com/v1/accounts/{acct}/agreements/{agreement_id}",
        headers=ds_headers(token),
        timeout=15,
    )
    try:
        data = r.json()
    except Exception:
        data = {}
    return jsonify({"status_code": r.status_code, "agreement": data})


@bp.route("/agent/run-flow", methods=["POST"])
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

    body = request.get_json() or {}
    template_id = body.get("template_id", "")
    signer_name = body.get("signer_name", "Demo Signer")
    signer_email = body.get("signer_email", "")
    role_name = body.get("role_name", "Signer")
    steps = []

    if not template_id or not signer_email:
        return jsonify({"error": "template_id and signer_email required"}), 400

    # Step 1: Send envelope
    env_body = {
        "templateId": template_id,
        "status": "sent",
        "templateRoles": [
            {
                "email": signer_email,
                "name": signer_name,
                "roleName": role_name,
            }
        ],
    }
    code, env_data = ds_post("/envelopes", env_body, token=token)
    steps.append(
        {
            "step": 1,
            "action": "POST /envelopes",
            "decision": f"Send envelope from template {template_id[:8]}… to {signer_email}",
            "status_code": code,
            "result": {"envelopeId": env_data.get("envelopeId"), "status": env_data.get("status")}
            if code in (200, 201)
            else {"error": env_data.get("message")},
        }
    )
    if code not in (200, 201):
        return jsonify({"success": False, "steps": steps})

    envelope_id = env_data.get("envelopeId")

    # Step 2: Read envelope status
    code2, status_data = ds_get(f"/envelopes/{envelope_id}", token=token)
    steps.append(
        {
            "step": 2,
            "action": f"GET /envelopes/{envelope_id[:8]}…",
            "decision": "Verify envelope was created and is in 'sent' state",
            "status_code": code2,
            "result": {"status": status_data.get("status"), "sentDateTime": status_data.get("sentDateTime")},
        }
    )

    # Step 3: Get recipients
    code3, rec_data = ds_get(f"/envelopes/{envelope_id}/recipients", token=token)
    signers = rec_data.get("signers", []) if code3 == 200 else []
    steps.append(
        {
            "step": 3,
            "action": f"GET /envelopes/{envelope_id[:8]}…/recipients",
            "decision": "Confirm recipients received signing request",
            "status_code": code3,
            "result": [{"name": s.get("name"), "email": s.get("email"), "status": s.get("status")} for s in signers],
        }
    )

    return jsonify(
        {
            "success": True,
            "envelopeId": envelope_id,
            "steps": steps,
        }
    )
