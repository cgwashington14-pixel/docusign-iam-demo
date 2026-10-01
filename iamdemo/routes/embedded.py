from flask import (
    Blueprint,
    render_template,
    request,
    session,
    url_for,
)

from iamdemo import config
from iamdemo.services.documents import build_doc_extractions
from iamdemo.services.docusign import active_token_value, ds_get, ds_post

bp = Blueprint("embedded", __name__)


def start_embedded_session(token, form):
    """Create an envelope from a template and return ``(signing_url, envelope_id, error)``."""
    template_id = (form.get("template_id") or "").strip()
    signer_email = (form.get("signer_email") or "").strip()
    signer_name = (form.get("signer_name") or "").strip()
    if not (template_id and signer_email and signer_name):
        return None, None, "Choose a template and enter the signer's name and email."

    client_user_id = "demo-" + signer_email
    code, env_data = ds_post(
        "/envelopes",
        {
            "templateId": template_id,
            "status": "sent",
            "templateRoles": [
                {
                    "email": signer_email,
                    "name": signer_name,
                    "roleName": form.get("role_name", "Signer"),
                    "clientUserId": client_user_id,
                }
            ],
        },
        token=token,
    )
    if code not in (200, 201):
        return None, None, env_data.get("message", f"Envelope creation failed ({code})")

    envelope_id = env_data.get("envelopeId")
    code, view_data = ds_post(
        f"/envelopes/{envelope_id}/views/recipient",
        {
            "returnUrl": url_for("embedded.embedded_complete", _external=True),
            "authenticationMethod": "none",
            "email": signer_email,
            "userName": signer_name,
            "clientUserId": client_user_id,
        },
        token=token,
    )
    if code in (200, 201):
        return view_data.get("url"), envelope_id, None
    return None, envelope_id, view_data.get("message", f"Recipient view failed ({code})")


@bp.route("/embedded", methods=["GET", "POST"])
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
        signing_url, envelope_id, error = start_embedded_session(token, request.form)

    return render_template(
        "embedded.html",
        templates=templates,
        signing_url=signing_url,
        envelope_id=envelope_id,
        error=error,
        prefill=prefill,
        demo_defaults=demo_defaults,
    )


@bp.route("/embedded/complete")
def embedded_complete():
    event = request.args.get("event", "unknown")
    envelope_id = request.args.get("envelopeId", "")
    frame = request.args.get("frame") == "1"
    doc_key = request.args.get("docKey", "msa")
    signer_name = request.args.get("signerName", "")
    signer_email = request.args.get("signerEmail", "")
    doc_title = request.args.get("docTitle", "")

    extractions = (
        build_doc_extractions(
            doc_key,
            signer_name or "—",
            signer_email or "—",
        )
        if doc_key
        else None
    )
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
