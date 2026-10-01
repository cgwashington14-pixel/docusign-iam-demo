import time

from flask import (
    Blueprint,
    current_app,
    jsonify,
    render_template,
    request,
)

from iamdemo.content.workspace_demos import GOV_HAP_WORKSPACE_DEMO, GOV_STATE_BAR_DEMO, GOV_WORKSPACE_DEMO
from iamdemo.services.documents import generate_pdf
from iamdemo.services.docusign import WORKSPACES_SCOPES, active_token_value
from iamdemo.services.workspaces import (
    create_edd_esign_envelope,
    create_edd_recipient_view,
    normalize_workspace,
    parse_workspace_files,
    resolve_workspace_demo,
    seed_edd_vendor_onboarding,
    workspaces_api_base,
    workspaces_call,
    workspaces_error_message,
)

bp = Blueprint("workspaces", __name__)


@bp.route("/workspaces")
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
                state_bar=GOV_STATE_BAR_DEMO,
                hap=GOV_HAP_WORKSPACE_DEMO,
            )
        return render_template(
            "workspaces.html",
            workspaces=[],
            error=(
                "Workspaces requires dtr.rooms.read / dtr.rooms.write scopes. Click Refresh Token to re-authenticate."
            ),
            needs_auth=False,
            needs_reauth=True,
            api_call_info=None,
            demo=GOV_WORKSPACE_DEMO,
            state_bar=GOV_STATE_BAR_DEMO,
            hap=GOV_HAP_WORKSPACE_DEMO,
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
        state_bar=GOV_STATE_BAR_DEMO,
        hap=GOV_HAP_WORKSPACE_DEMO,
    )


@bp.route("/api/workspaces", methods=["GET"])
def api_workspaces_list():
    token = active_token_value(required_scopes=WORKSPACES_SCOPES)
    if not token:
        return jsonify(
            {
                "error": (
                    "Workspaces requires dtr.rooms.read / dtr.rooms.write scopes. "
                    "Click Refresh Token to re-authenticate."
                ),
                "needs_reauth": True,
            }
        ), 401
    code, data = workspaces_call("GET", token=token)
    if code != 200:
        return jsonify(
            {
                "error": workspaces_error_message(code, data),
                "data": data,
                "needs_reauth": bool(isinstance(data, dict) and data.get("needs_reauth")),
            }
        ), code
    items = [normalize_workspace(w) for w in (data.get("workspaces") or [])]
    return jsonify({"workspaces": items, "count": len(items)})


@bp.route("/api/workspaces", methods=["POST"])
def api_workspaces_create():
    token = active_token_value(required_scopes=WORKSPACES_SCOPES)
    if not token:
        return jsonify(
            {
                "error": (
                    "Workspaces requires dtr.rooms.read / dtr.rooms.write scopes. "
                    "Click Refresh Token to re-authenticate."
                ),
                "needs_reauth": True,
            }
        ), 401
    body = request.get_json(silent=True) or {}
    use_case = body.get("useCase") or body.get("use_case") or "edd"
    demo = resolve_workspace_demo(use_case)
    name = body.get("workspaceName") or body.get("name") or demo["admin_title"]
    seed = body.get("seed", True)
    if isinstance(seed, str):
        seed = seed.strip().lower() not in ("0", "false", "no")
    effective_date = (
        body.get("effectiveDate")
        or body.get("effective_date")
        or body.get("vendorEffectiveDate")
        or body.get("oathEffectiveDate")
        or ""
    )

    # Workspaces API (beta) requires {"name": "..."} — not legacy workspaceName
    code, data = workspaces_call("POST", body={"name": name}, token=token)
    if code not in (200, 201):
        return jsonify(
            {
                "error": workspaces_error_message(code, data),
                "data": data,
                "needs_reauth": bool(isinstance(data, dict) and data.get("needs_reauth")),
            }
        ), code

    result = normalize_workspace(data if isinstance(data, dict) else {})
    workspace_id = result.get("workspaceId") or result.get("workspace_id")
    result["useCase"] = demo.get("use_case") or use_case
    if seed and workspace_id:
        try:
            result["onboarding"] = seed_edd_vendor_onboarding(
                workspace_id,
                token,
                demo=demo,
                effective_date=effective_date,
            )
        except Exception as exc:
            current_app.logger.warning("Workspace onboarding seed failed (%s): %s", use_case, exc)
            result["onboarding"] = {"error": str(exc), "steps": []}
    return jsonify(result), code


@bp.route("/api/workspaces/<workspace_id>", methods=["GET"])
def api_workspace_detail(workspace_id):
    token = active_token_value(required_scopes=WORKSPACES_SCOPES)
    if not token:
        return jsonify({"error": "not authenticated", "needs_reauth": True}), 401
    code, data = workspaces_call("GET", f"/{workspace_id}", token=token)
    if code != 200:
        return jsonify(
            {
                "error": workspaces_error_message(code, data),
                "data": data,
            }
        ), code
    return jsonify(normalize_workspace(data if isinstance(data, dict) else {}))


@bp.route("/api/workspaces/<workspace_id>/files", methods=["GET"])
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
    return jsonify(
        {
            "files": files,
            "upload_requests": upload_requests,
            "envelopes": envelopes,
            "raw": data,
            "count": len(files),
        }
    )


@bp.route("/api/workspaces/<workspace_id>/seed", methods=["POST"])
def api_workspace_seed(workspace_id):
    """
    Restage onboarding pack into an existing workspace (documents, eSign emails,
    upload invitations). Used to refresh a State Bar / EDD hub without recreating it.
    """
    token = active_token_value(required_scopes=WORKSPACES_SCOPES)
    if not token:
        return jsonify(
            {
                "error": (
                    "Workspaces requires dtr.rooms.read / dtr.rooms.write scopes. "
                    "Click Refresh Token to re-authenticate."
                ),
                "needs_reauth": True,
            }
        ), 401
    body = request.get_json(silent=True) or {}
    use_case = body.get("useCase") or body.get("use_case") or "edd"
    demo = resolve_workspace_demo(use_case)
    effective_date = (
        body.get("effectiveDate")
        or body.get("effective_date")
        or body.get("vendorEffectiveDate")
        or body.get("oathEffectiveDate")
        or ""
    )
    try:
        onboarding = seed_edd_vendor_onboarding(
            workspace_id,
            token,
            demo=demo,
            effective_date=effective_date,
        )
    except Exception as exc:
        current_app.logger.warning("Workspace reseed failed (%s): %s", use_case, exc)
        return jsonify({"error": str(exc), "useCase": demo.get("use_case") or use_case}), 500
    return jsonify(
        {
            "workspaceId": workspace_id,
            "useCase": demo.get("use_case") or use_case,
            "onboarding": onboarding,
        }
    )


@bp.route("/api/workspaces/<workspace_id>/open-signing", methods=["POST"])
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
    use_case = body.get("useCase") or body.get("use_case") or "edd"
    demo = resolve_workspace_demo(use_case)
    hub_spec = next(
        (s for s in (demo.get("doc_specs") or []) if s.get("hub")),
        (demo.get("doc_specs") or [{"key": "vendor", "filename": "doc.pdf", "label": "Agreement"}])[0],
    )
    doc_key = body.get("docKey") or body.get("doc_key") or hub_spec.get("key") or "vendor"
    signer_email = (
        body.get("signerEmail") or body.get("signer_email") or demo.get("signer_email") or "cwdocusign1@gmail.com"
    ).strip()
    signer_name = (
        body.get("signerName") or body.get("signer_name") or demo.get("signer_name") or "Corey Washington"
    ).strip()
    effective_date = (
        body.get("effectiveDate")
        or body.get("effective_date")
        or body.get("vendorEffectiveDate")
        or body.get("oathEffectiveDate")
        or ""
    ).strip()
    send_email = body.get("sendEmail", body.get("send_email", False))
    if isinstance(send_email, str):
        send_email = send_email.strip().lower() not in ("0", "false", "no")
    envelope_id = (body.get("envelopeId") or body.get("envelope_id") or "").strip() or None
    agency_signer = demo.get("participant_name") or "Agency Officer"
    vendor_name = demo.get("vendor_name") or demo.get("agency_name") or "Participant"
    date_anchor = demo.get("date_anchor") or "Vendor Effective Date:"
    email_prefix = demo.get("email_subject_prefix") or "CA Agency"
    filename = hub_spec.get("filename") or f"{doc_key}.pdf"
    label = hub_spec.get("label") or "Agreement"

    api_steps = []
    email_envelope_id = None

    try:
        doc_b64 = generate_pdf(doc_key, signer_name=agency_signer)
    except Exception as exc:
        return jsonify({"error": f"PDF generation failed: {exc}"}), 500

    if not envelope_id:
        ecode, edata = create_edd_esign_envelope(
            token,
            doc_b64=doc_b64,
            filename=filename,
            label=label,
            signer_email=signer_email,
            signer_name=signer_name,
            vendor_name=vendor_name,
            effective_date=effective_date,
            embedded=True,
            status="sent",
            date_anchor=date_anchor,
            email_subject_prefix=email_prefix,
        )
        api_steps.append(
            {
                "step": "create_embedded_envelope",
                "status": ecode,
                "data": {
                    k: edata.get(k) for k in ("envelopeId", "status", "errorCode", "message") if isinstance(edata, dict)
                },
            }
        )
        if ecode not in (200, 201) or not isinstance(edata, dict) or not edata.get("envelopeId"):
            return jsonify(
                {
                    "error": (edata or {}).get("message", f"Envelope error {ecode}")
                    if isinstance(edata, dict)
                    else f"Envelope error {ecode}",
                    "raw": edata,
                    "apiSteps": api_steps,
                }
            ), 400
        envelope_id = edata["envelopeId"]

    vcode, vdata = create_edd_recipient_view(token, envelope_id, signer_email, signer_name, doc_key=doc_key)
    api_steps.append(
        {
            "step": "recipient_view",
            "status": vcode,
            "envelopeId": envelope_id,
        }
    )
    if vcode not in (200, 201) or not isinstance(vdata, dict) or not vdata.get("url"):
        # Envelope may be completed/voided — create a fresh one and retry once
        ecode, edata = create_edd_esign_envelope(
            token,
            doc_b64=doc_b64,
            filename=filename,
            label=label,
            signer_email=signer_email,
            signer_name=signer_name,
            vendor_name=vendor_name,
            effective_date=effective_date,
            embedded=True,
            status="sent",
            date_anchor=date_anchor,
            email_subject_prefix=email_prefix,
        )
        api_steps.append({"step": "create_embedded_envelope_retry", "status": ecode})
        if ecode not in (200, 201) or not isinstance(edata, dict) or not edata.get("envelopeId"):
            return jsonify(
                {
                    "error": (vdata or {}).get("message", f"Recipient view error {vcode}")
                    if isinstance(vdata, dict)
                    else f"View error {vcode}",
                    "raw": vdata,
                    "apiSteps": api_steps,
                }
            ), 400
        envelope_id = edata["envelopeId"]
        vcode, vdata = create_edd_recipient_view(token, envelope_id, signer_email, signer_name, doc_key=doc_key)
        api_steps.append({"step": "recipient_view_retry", "status": vcode})
        if vcode not in (200, 201) or not isinstance(vdata, dict) or not vdata.get("url"):
            return jsonify(
                {
                    "error": (vdata or {}).get("message", f"Recipient view error {vcode}")
                    if isinstance(vdata, dict)
                    else f"View error {vcode}",
                    "raw": vdata,
                    "apiSteps": api_steps,
                }
            ), 400

    if send_email:
        ecode, edata = create_edd_esign_envelope(
            token,
            doc_b64=doc_b64,
            filename=filename,
            label=label,
            signer_email=signer_email,
            signer_name=signer_name,
            vendor_name=vendor_name,
            effective_date=effective_date,
            embedded=False,
            status="sent",
            date_anchor=date_anchor,
            email_subject_prefix=email_prefix,
        )
        api_steps.append({"step": "email_delivery_envelope", "status": ecode})
        if ecode in (200, 201) and isinstance(edata, dict):
            email_envelope_id = edata.get("envelopeId")

    return jsonify(
        {
            "success": True,
            "workspaceId": workspace_id,
            "envelopeId": envelope_id,
            "emailEnvelopeId": email_envelope_id,
            "signingUrl": vdata.get("url"),
            "signerEmail": signer_email,
            "signerName": signer_name,
            "effectiveDate": effective_date,
            "useCase": demo.get("use_case") or use_case,
            "docKey": doc_key,
            "apiSteps": api_steps,
        }
    )


@bp.route("/workspaces/create", methods=["POST"])
def workspace_create():
    """Legacy create route — forwards to API helper with onboarding seed."""
    token = active_token_value(required_scopes=WORKSPACES_SCOPES)
    if not token:
        return jsonify({"error": "not authenticated", "needs_reauth": True}), 401
    body = request.get_json(silent=True) or {}
    use_case = body.get("useCase") or body.get("use_case") or "edd"
    demo = resolve_workspace_demo(use_case)
    name = body.get("name") or body.get("workspaceName") or demo["admin_title"]
    effective_date = (
        body.get("effectiveDate")
        or body.get("effective_date")
        or body.get("vendorEffectiveDate")
        or body.get("oathEffectiveDate")
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
    result["useCase"] = demo.get("use_case") or use_case
    if workspace_id and body.get("seed", True):
        result["onboarding"] = seed_edd_vendor_onboarding(
            workspace_id,
            token,
            demo=demo,
            effective_date=effective_date,
        )
    return jsonify(result), code
