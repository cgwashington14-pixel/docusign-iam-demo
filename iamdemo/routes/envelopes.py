from datetime import UTC, datetime

from flask import (
    Blueprint,
    jsonify,
    render_template,
    request,
)

from iamdemo.services.documents import build_doc_extractions, doc_templates, generate_pdf, match_doc_type
from iamdemo.services.docusign import active_token_value, ds_get, ds_get_many, ds_post

bp = Blueprint("envelopes", __name__)


@bp.route("/envelopes")
def envelopes():
    token = active_token_value()
    envs, templates, error = [], [], None
    if token:
        (code, data), (code_t, tdata) = ds_get_many(
            ["/envelopes?from_date=2024-01-01&order_by=last_modified&order=desc&count=25", "/templates"],
            token=token,
        )
        if code == 200:
            envs = data.get("envelopes", [])
        else:
            error = data.get("message", f"API error {code}")
        if code_t == 200:
            templates = tdata.get("envelopeTemplates", [])
    else:
        error = "No access token configured."
    return render_template("envelopes.html", envelopes=envs, templates=templates, error=error)


@bp.route("/envelopes/<envelope_id>")
def envelope_detail(envelope_id):
    token = active_token_value()
    code, env = ds_get(f"/envelopes/{envelope_id}", token=token)
    code_r, rdata = ds_get(f"/envelopes/{envelope_id}/recipients", token=token)
    recipients = rdata.get("signers", []) + rdata.get("carbonCopies", []) if code_r == 200 else []
    code_a, adata = ds_get(f"/envelopes/{envelope_id}/audit_events", token=token)
    audit = adata.get("auditEvents", []) if code_a == 200 else []
    error = None if code == 200 else env.get("message", f"Error {code}")
    return render_template("envelope_detail.html", env=env, recipients=recipients, audit=audit, error=error)


@bp.route("/api/template/<template_id>")
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
        roles.append(
            {
                "roleName": role.get("roleName", ""),
                "name": role.get("name", ""),
                "email": role.get("email", ""),
            }
        )

    # Extract all user-fillable tab types with their actual type so the send route
    # can place each value in the correct array (textTabs, companyTabs, etc.)
    FILLABLE_TYPES = [
        "textTabs",
        "companyTabs",
        "titleTabs",
        "emailTabs",
        "fullNameTabs",
        "dateTabs",
        "numberTabs",
        "noteTabs",
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
                tab_defs.append(
                    {
                        "label": label,
                        "type": tab_type,
                        "required": tab.get("required", "false") in (True, "true"),
                        "value": tab.get("value", ""),
                    }
                )

    return jsonify({"roles": roles, "tabs": tab_defs})


@bp.route("/api/templates-list")
def api_templates_list():
    """Return all templates on the account — used by the Agent flow picker."""
    token = active_token_value()
    if not token:
        return jsonify({"error": "not authenticated", "templates": []}), 401
    code, data = ds_get("/templates", token=token)
    templates = (
        [
            {"templateId": t["templateId"], "name": t.get("name", t["templateId"])}
            for t in data.get("envelopeTemplates", [])
        ]
        if code == 200
        else []
    )
    return jsonify({"templates": templates})


@bp.route("/generate-doc", methods=["POST"])
def generate_doc():
    """Generate a PDF for a given doc type, create an envelope, optionally return embedded URL."""
    token = active_token_value()
    if not token:
        return jsonify({"error": "Not authenticated. Please login first."}), 401

    data = request.get_json() or {}
    raw_type = data.get("doc_type", "MSA")
    name = data.get("signer_name", "Corey Washington").strip()
    email = data.get("signer_email", "cwdocusign1@gmail.com").strip()
    embedded = data.get("embedded", False)
    subject = data.get("subject", "").strip()

    doc_key = match_doc_type(raw_type)
    templates = doc_templates()
    tmpl = templates[doc_key]

    try:
        doc_b64 = generate_pdf(doc_key, signer_name=name)
    except Exception as e:
        return jsonify({"error": f"PDF generation failed: {e}"}), 500

    email_subject = subject or f"{tmpl['title']} — Signature Required"
    doc_name = f"{tmpl['short']} Draft — {datetime.now(UTC).strftime('%b %d %Y')}.pdf"

    signer_body = {
        "email": email,
        "name": name,
        "recipientId": "1",
        "tabs": {
            "signHereTabs": [
                {
                    "documentId": "1",
                    "pageNumber": "1",
                    "anchorString": "By: ___",
                    "anchorUnits": "pixels",
                    "anchorXOffset": "0",
                    "anchorYOffset": "0",
                }
            ]
        },
    }

    if embedded:
        signer_body["clientUserId"] = f"demo-{email}"

    env_body = {
        "emailSubject": email_subject,
        "status": "sent",
        "documents": [
            {
                "documentId": "1",
                "name": doc_name,
                "fileExtension": "pdf",
                "documentBase64": doc_b64,
            }
        ],
        "recipients": {"signers": [signer_body]},
    }

    api_steps = [
        {
            "step": 1,
            "label": "Generate PDF",
            "method": "LOCAL",
            "path": f"Document: {tmpl['title']}",
            "status": 200,
            "detail": f"{len(tmpl['sections'])} sections · anchor signature tab",
        }
    ]

    code, env_data = ds_post("/envelopes", env_body, token=token)
    api_steps.append(
        {
            "step": 2,
            "label": "Create envelope",
            "method": "POST",
            "path": "/restapi/v2.1/accounts/{accountId}/envelopes",
            "status": code,
            "detail": f"status=sent · recipient={email}",
        }
    )
    if code not in (200, 201):
        return jsonify(
            {"error": env_data.get("message", f"Envelope error {code}"), "raw": env_data, "apiSteps": api_steps}
        ), 400

    envelope_id = env_data.get("envelopeId")
    extractions = build_doc_extractions(doc_key, name, email, subject)
    result = {
        "success": True,
        "envelopeId": envelope_id,
        "docType": tmpl["title"],
        "docKey": doc_key,
        "embedded": embedded,
        "extractions": extractions,
        "apiSteps": api_steps,
    }

    if embedded:
        from urllib.parse import urlencode

        return_params = urlencode(
            {
                "frame": "1",
                "docKey": doc_key,
                "signerName": name,
                "signerEmail": email,
                "docTitle": tmpl["title"],
            }
        )
        return_url = request.host_url.rstrip("/") + "/embedded/complete?" + return_params
        view_body = {
            "returnUrl": return_url,
            "authenticationMethod": "none",
            "email": email,
            "userName": name,
            "clientUserId": f"demo-{email}",
        }
        code2, view_data = ds_post(f"/envelopes/{envelope_id}/views/recipient", view_body, token=token)
        api_steps.append(
            {
                "step": 3,
                "label": "Embedded signing view",
                "method": "POST",
                "path": f"/restapi/v2.1/accounts/{{accountId}}/envelopes/{envelope_id}/views/recipient",
                "status": code2,
                "detail": "returnUrl → /embedded/complete",
            }
        )
        if code2 in (200, 201):
            result["signingUrl"] = view_data.get("url")
        else:
            result["viewError"] = view_data.get("message", f"View error {code2}")

    return jsonify(result)


def build_tabs(form):
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


@bp.route("/envelopes/send", methods=["GET", "POST"])
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
                        **({"tabs": build_tabs(form)} if build_tabs(form) else {}),
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
        "vendor": {
            "tab": "generate",
            "doc_type": "Vendor",
            "name": "Corey Washington",
            "email": "cwdocusign1@gmail.com",
            "subject": "Vendor Contract -- Signature Required",
        },
        "hr": {
            "tab": "generate",
            "doc_type": "Employment",
            "name": "Marcus Williams",
            "email": "mwilliams@calhr.ca.gov",
            "subject": "HR Onboarding Packet -- Action Required",
        },
    }
    prefill = prefill_map.get(request.args.get("prefill", ""), {})
    return render_template("send_envelope.html", templates=templates, result=None, error=None, prefill=prefill)


@bp.route("/api/envelope/<envelope_id>/summary")
def api_envelope_summary(envelope_id):
    """Lightweight envelope status for post-signing UI updates."""
    token = active_token_value()
    if not token:
        return jsonify({"error": "not authenticated"}), 401
    code, data = ds_get(f"/envelopes/{envelope_id}", token=token)
    if code != 200:
        return jsonify({"error": data.get("message", f"HTTP {code}")}), code
    return jsonify(
        {
            "envelopeId": envelope_id,
            "status": data.get("status"),
            "completedDateTime": data.get("completedDateTime"),
            "sentDateTime": data.get("sentDateTime"),
            "emailSubject": data.get("emailSubject"),
        }
    )
