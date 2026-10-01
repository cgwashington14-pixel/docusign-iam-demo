from flask import (
    current_app,
)

from iamdemo import config
from iamdemo.content.workspace_demos import GOV_HAP_WORKSPACE_DEMO, HAP_CASE_ID, HAP_WORKSPACE_NAME
from iamdemo.services.documents import doc_templates, generate_pdf
from iamdemo.services.docusign import ds_get, ds_post
from iamdemo.services.workspaces import (
    demo_countersigner,
    demo_primary_signer,
    dual_workspace_signers,
    invite_workspace_user,
    normalize_workspace,
    seed_edd_vendor_onboarding,
    workspaces_call,
    workspaces_error_message,
)

GOV_AGENT_RUNS = {
    "hr": {
        "doc_key": "hap_hr",
        "label": "HR onboarding agent",
        "signer_name": "Marcus Williams",
        "subject": "HAP-2026-014 · Case worker onboarding packet — Marcus Williams",
    },
    "procurement": {
        "doc_key": "hap_vendor",
        "label": "Procurement agent",
        "signer_name": "Pacific Stay Hotels",
        "subject": "HAP-2026-014 · Emergency lodging agreement — Pacific Stay",
    },
    "operations": {
        "doc_key": "hap_mou",
        "label": "Operations agent",
        "signer_name": "Sacramento County",
        "subject": "HAP-2026-014 · Inter-agency MOU — HCD · CalOES · County",
    },
    "constituent": {
        "doc_key": "hap_resident",
        "label": "Constituent agent",
        "signer_name": "Robert Johnson",
        "subject": "HAP-2026-014 · Housing assistance agreement — CASE-2026-00981",
    },
}


def send_generated_envelope(doc_key, signer_name, signer_email, subject, token, status="sent"):
    """Generate a PDF from a doc template and send it as a Docusign envelope."""
    templates = doc_templates()
    tmpl = templates.get(doc_key) or templates["msa"]
    steps = []
    try:
        doc_b64 = generate_pdf(doc_key, signer_name=signer_name)
        steps.append(
            {
                "action": "Generate PDF",
                "decision": f"Assemble {tmpl['title']} from the HAP playbook",
                "status_code": 200,
                "result": {"document": tmpl["short"], "sections": len(tmpl["sections"])},
            }
        )
    except Exception as exc:
        steps.append(
            {
                "action": "Generate PDF",
                "decision": f"Assemble {tmpl['title']}",
                "status_code": 500,
                "result": {"error": str(exc)},
            }
        )
        return {"success": False, "steps": steps, "error": f"PDF generation failed: {exc}"}

    env_body = {
        "emailSubject": subject,
        "status": status,
        "documents": [
            {
                "documentId": "1",
                "name": f"{tmpl['short']} — {HAP_CASE_ID}.pdf",
                "fileExtension": "pdf",
                "documentBase64": doc_b64,
            }
        ],
        "recipients": {
            "signers": dual_workspace_signers(
                signer_email=signer_email,
                signer_name=signer_name,
                countersigner_email=demo_countersigner()["email"],
                countersigner_name=demo_countersigner()["name"],
            )
        },
    }
    code, env_data = ds_post("/envelopes", env_body, token=token)
    envelope_id = env_data.get("envelopeId") if code in (200, 201) else None
    steps.append(
        {
            "action": "POST /envelopes",
            "decision": (f"Send {tmpl['title']} to {signer_email}, then {demo_countersigner()['email']}"),
            "status_code": code,
            "result": (
                {"envelopeId": envelope_id, "status": env_data.get("status")}
                if envelope_id
                else {"error": env_data.get("message", f"HTTP {code}")}
            ),
        }
    )
    if not envelope_id:
        return {
            "success": False,
            "docType": tmpl["title"],
            "steps": steps,
            "error": env_data.get("message", f"Envelope error {code}"),
        }

    code2, status_data = ds_get(f"/envelopes/{envelope_id}", token=token)
    steps.append(
        {
            "action": f"GET /envelopes/{envelope_id[:8]}…",
            "decision": "Verify the envelope is sent in the demo account",
            "status_code": code2,
            "result": {
                "status": status_data.get("status"),
                "sentDateTime": status_data.get("sentDateTime"),
            },
        }
    )
    return {
        "success": True,
        "docType": tmpl["title"],
        "docKey": doc_key,
        "envelopeId": envelope_id,
        "status": status_data.get("status") or env_data.get("status"),
        "sentDateTime": status_data.get("sentDateTime"),
        "signerName": signer_name,
        "signerEmail": signer_email,
        "countersignerName": demo_countersigner()["name"],
        "countersignerEmail": demo_countersigner()["email"],
        "subject": subject,
        "steps": steps,
    }


def find_named_workspace(token, needle):
    """Return the newest workspace whose name contains needle, or None."""
    code, data = workspaces_call("GET", token=token)
    if code != 200:
        return None, code, data
    matches = []
    for item in data.get("workspaces") or []:
        ws = normalize_workspace(item)
        name = ws.get("workspaceName") or ws.get("name") or ""
        if needle in name:
            matches.append(ws)
    if not matches:
        return None, 200, data
    matches.sort(key=lambda w: w.get("created") or w.get("created_date") or "", reverse=True)
    return matches[0], 200, data


def attach_envelope_to_workspace(workspace_id, envelope_id, token):
    """Attach an existing eSign envelope to a workspace hub."""
    last = (400, {})
    for body in ({"envelope_id": envelope_id}, {"envelopeId": envelope_id}):
        code, data = workspaces_call("POST", f"/{workspace_id}/envelopes", body=body, token=token)
        last = (code, data)
        if code in (200, 201):
            return code, data
        blob = str(data or "").lower()
        if code in (409, 422) or "already" in blob or "duplicate" in blob:
            return 200, data if isinstance(data, dict) else {"attached": True}
    return last


def ensure_hap_workspace(token):
    """Find or create the HAP-2026-014 Housing Assistance workspace."""
    existing, code, data = find_named_workspace(token, HAP_CASE_ID)
    if existing:
        return existing, False, None
    if code != 200:
        return None, False, workspaces_error_message(code, data)
    code, data = workspaces_call("POST", body={"name": HAP_WORKSPACE_NAME}, token=token)
    if code not in (200, 201):
        return None, False, workspaces_error_message(code, data)
    return normalize_workspace(data if isinstance(data, dict) else {}), True, None


def invite_hap_workspace_participant(workspace_id, token, signer_email=None):
    primary = demo_primary_signer()
    counter = demo_countersigner()
    email = signer_email or primary["email"]
    first = invite_workspace_user(workspace_id, token, email, primary["first"], primary["last"])
    second = invite_workspace_user(workspace_id, token, counter["email"], counter["first"], counter["last"])
    return first if first[0] not in (200, 201, 409) else second


def hap_workspace_payload(ws, *, created=False, attached=0, invited=None, error=None):
    if not ws and not error:
        return None
    wid = (ws or {}).get("workspaceId") or (ws or {}).get("workspace_id")
    name = (ws or {}).get("workspaceName") or (ws or {}).get("name") or HAP_WORKSPACE_NAME
    payload = {
        "workspaceId": wid,
        "workspaceName": name,
        "created": created,
        "attached": attached,
        "href": f"/workspaces?open={wid}&useCase=hap" if wid else "/workspaces?useCase=hap",
    }
    if invited is not None:
        payload["invited"] = invited
    if error:
        payload["error"] = error
    return payload


def send_and_stage_hap_envelope(spec, signer_name, signer_email, token, workspace_id=None):
    """Send a HAP envelope under the shared program case ID."""
    return send_generated_envelope(
        spec["doc_key"],
        signer_name,
        signer_email,
        spec["subject"],
        token,
        status="sent",
    )


def hap_seed_runs_from_onboarding(onboarding):
    runs = []
    for env in (onboarding or {}).get("envelopes") or []:
        eid = env.get("envelope_id") or env.get("envelopeId")
        runs.append(
            {
                "success": bool(eid),
                "agent": "workspace",
                "label": env.get("name") or "HAP envelope",
                "envelopeId": eid,
                "status": env.get("status"),
                "signerEmail": env.get("signer_email") or config.DEMO_SIGNER_EMAIL,
                "countersignerEmail": env.get("countersigner_email") or config.DEMO_COUNTERSIGNER_EMAIL,
            }
        )
    return runs


def collect_hap_workspace(token, *, extra_envelope_ids=None, signer_email=None, seed_if_empty=True):
    """Create or reuse the HAP workspace hub for Housing Assistance envelopes."""
    ws, created, error = ensure_hap_workspace(token)
    if not ws:
        return None, error or "Could not create HAP workspace"
    workspace_id = ws.get("workspaceId") or ws.get("workspace_id")
    invite_code, _invite_data = invite_hap_workspace_participant(workspace_id, token, signer_email=signer_email)
    invited = invite_code in (200, 201, 409)

    onboarding = None
    if seed_if_empty:
        try:
            onboarding = seed_edd_vendor_onboarding(
                workspace_id,
                token,
                demo=GOV_HAP_WORKSPACE_DEMO,
            )
        except Exception as exc:
            current_app.logger.warning("HAP workspace seed failed: %s", exc)
            onboarding = {"error": str(exc), "envelopes": []}

    attached = 0
    attach_ids = list(extra_envelope_ids or [])
    for env in (onboarding or {}).get("envelopes") or []:
        attach_ids.append(env.get("envelope_id") or env.get("envelopeId"))
    for eid in attach_ids:
        if not eid:
            continue
        code, _data = attach_envelope_to_workspace(workspace_id, eid, token)
        if code in (200, 201):
            attached += 1

    payload = hap_workspace_payload(ws, created=created, attached=attached, invited=invited)
    if onboarding:
        payload["onboarding"] = onboarding
        payload["seedRuns"] = hap_seed_runs_from_onboarding(onboarding)
        payload["outstanding"] = onboarding.get("outstanding_count")
    return payload, None
