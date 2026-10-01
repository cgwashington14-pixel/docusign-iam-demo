import base64

import requests as http
from flask import (
    request,
)

from iamdemo import config
from iamdemo.content.workspace_demos import GOV_WORKSPACE_DEMO, HAP_CASE_ID, WORKSPACE_USE_CASES
from iamdemo.services.documents import generate_pdf
from iamdemo.services.docusign import (
    WORKSPACES_SCOPES,
    active_token_value,
    ds_get,
    ds_headers,
    ds_post,
    iam_base,
    token_has_scopes,
)


def resolve_workspace_demo(use_case=None):
    """Return demo pack for a use case key (edd | state_bar | hap)."""
    key = (use_case or "edd").strip().lower().replace("-", "_").replace(" ", "_")
    if key in ("statebar", "calbar", "oath", "oath_card", "bar"):
        key = "state_bar"
    if key in ("edd", "vendor", "employment_development"):
        key = "edd"
    if key in ("hap", "housing", "housing_assistance", "hcd", "gov_agents", "govagents"):
        key = "hap"
    return WORKSPACE_USE_CASES.get(key, GOV_WORKSPACE_DEMO)


WORKSPACE_OUTSTANDING_TARGET = 3


WORKSPACE_OUTSTANDING_STATUSES = {"sent", "delivered", "created"}


def demo_primary_signer():
    return {
        "email": (config.DEMO_SIGNER_EMAIL or "cwdocusign1@gmail.com").strip(),
        "name": (config.DEMO_SIGNER_NAME or "Corey Washington").strip(),
        "first": "Corey",
        "last": "Washington",
    }


def demo_countersigner():
    return {
        "email": (config.DEMO_COUNTERSIGNER_EMAIL or "colemitchelldocusign@gmail.com").strip(),
        "name": (config.DEMO_COUNTERSIGNER_NAME or "Cole Mitchell").strip(),
        "first": "Cole",
        "last": "Mitchell",
    }


def countersign_tabs():
    return {
        "signHereTabs": [
            {
                "documentId": "1",
                "anchorString": "Countersign: ___",
                "anchorUnits": "pixels",
                "anchorXOffset": "0",
                "anchorYOffset": "0",
            }
        ],
    }


def dual_workspace_signers(
    *,
    signer_email,
    signer_name,
    countersigner_email,
    countersigner_name,
    effective_date="",
    date_anchor="Vendor Effective Date:",
    embedded=False,
):
    first = {
        "email": signer_email,
        "name": signer_name,
        "recipientId": "1",
        "routingOrder": "1",
        "tabs": edd_signer_tabs(effective_date, date_anchor=date_anchor),
    }
    if embedded:
        first["clientUserId"] = f"demo-{signer_email}"
    second = {
        "email": countersigner_email,
        "name": countersigner_name,
        "recipientId": "2",
        "routingOrder": "1",
        "tabs": countersign_tabs(),
    }
    return [first, second]


def invite_workspace_user(workspace_id, token, email, first_name, last_name):
    return workspaces_call(
        "POST",
        f"/{workspace_id}/users",
        body={
            "email": email,
            "first_name": first_name,
            "last_name": last_name,
        },
        token=token,
    )


def recipient_emails(payload):
    if not isinstance(payload, dict):
        return set(), []
    recipients = payload.get("recipients") if isinstance(payload.get("recipients"), dict) else payload
    signers = recipients.get("signers") or []
    emails = {(s.get("email") or "").strip().lower() for s in signers if (s.get("email") or "").strip()}
    return emails, signers


def workspace_pack_needles(demo):
    needles = []
    for key in ("email_subject_prefix", "pack_name", "admin_title"):
        val = (demo or {}).get(key)
        if val:
            needles.append(str(val))
    if (demo or {}).get("use_case") == "hap":
        needles.extend([HAP_CASE_ID, "Housing Assistance"])
    return needles


def list_outstanding_dual_envelopes(token, *, subject_needles, primary_email, countersigner_email):
    """Return outstanding envelopes that already include both demo signers."""
    needles = [n for n in (subject_needles or []) if n]
    primary = (primary_email or "").strip().lower()
    counter = (countersigner_email or "").strip().lower()
    code, data = ds_get(
        "/envelopes?from_date=2026-01-01&from_to_status=changed&order_by=sent&order=desc&count=80&include=recipients",
        token=token,
    )
    if code != 200:
        return [], code, data
    found = []
    for env in data.get("envelopes") or []:
        status = (env.get("status") or "").lower()
        if status not in WORKSPACE_OUTSTANDING_STATUSES:
            continue
        subject = env.get("emailSubject") or ""
        if needles and not any(n in subject for n in needles):
            continue
        emails, signers = recipient_emails(env)
        if primary not in emails or counter not in emails:
            eid = env.get("envelopeId")
            if eid:
                rcode, rdata = ds_get(f"/envelopes/{eid}/recipients", token=token)
                if rcode == 200:
                    emails, signers = recipient_emails(rdata)
        if primary not in emails or counter not in emails:
            continue
        if signers and all(
            (s.get("status") or "").lower() in ("completed", "declined", "autoresponded") for s in signers
        ):
            continue
        found.append(
            {
                "envelope_id": env.get("envelopeId"),
                "name": subject,
                "status": env.get("status"),
                "signer_email": primary_email,
                "countersigner_email": countersigner_email,
                "recipient": f"{primary_email} → {countersigner_email}",
                "source": "existing",
            }
        )
        if len(found) >= WORKSPACE_OUTSTANDING_TARGET:
            break
    return found, 200, data


def edd_signer_tabs(effective_date="", *, date_anchor="Vendor Effective Date:"):
    """Sign Here + optional date text tab for onboarding PDFs."""
    tabs = {
        "signHereTabs": [
            {
                "documentId": "1",
                "pageNumber": "1",
                "anchorString": "By: ___",
                "anchorUnits": "pixels",
                "anchorXOffset": "0",
                "anchorYOffset": "0",
            }
        ],
        "textTabs": [
            {
                "documentId": "1",
                "pageNumber": "1",
                "anchorString": date_anchor,
                "anchorUnits": "pixels",
                "anchorXOffset": "128",
                "anchorYOffset": "-2",
                "tabLabel": "EffectiveDate",
                "required": "true",
                "locked": "false" if not effective_date else "true",
                "width": "110",
                "height": "18",
                "fontSize": "Size11",
                "value": (effective_date or "").strip(),
            }
        ],
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
    date_anchor="Vendor Effective Date:",
    email_subject_prefix="CA EDD",
    email_blurb=None,
    countersigner_email=None,
    countersigner_name=None,
):
    """
    Create an eSign envelope for workspace onboarding packs.
    Primary signer (email) then Cole as routing-order 2 countersigner.
    - embedded=False → email delivery to both signers (no clientUserId on first)
    - embedded=True  → captive recipient for iframe signing (clientUserId on first)
    """
    counter = demo_countersigner()
    signers = dual_workspace_signers(
        signer_email=signer_email,
        signer_name=signer_name,
        countersigner_email=(countersigner_email or counter["email"]),
        countersigner_name=(countersigner_name or counter["name"]),
        effective_date=effective_date,
        date_anchor=date_anchor,
        embedded=embedded,
    )
    env_body = {
        "emailSubject": f"{email_subject_prefix} — Please sign: {label}",
        "emailBlurb": email_blurb
        or (
            f"Please review and sign {label} for {vendor_name}. "
            f"{signer_name} signs first; {signers[1]['name']} countersigns."
            + (f" Effective date: {effective_date}." if effective_date else "")
        ),
        "status": status,
        "documents": [
            {
                "documentId": "1",
                "name": filename,
                "fileExtension": "pdf",
                "documentBase64": doc_b64,
            }
        ],
        "recipients": {"signers": signers},
    }
    return ds_post("/envelopes", env_body, token=token)


def create_edd_recipient_view(token, envelope_id, signer_email, signer_name, *, doc_key="vendor"):
    """Recipient view URL for embedded EDD signing iframe."""
    from urllib.parse import urlencode

    return_params = urlencode(
        {
            "frame": "1",
            "docKey": doc_key,
            "signerName": signer_name,
            "signerEmail": signer_email,
            "docTitle": "CA EDD Vendor Agreement",
            "envelopeId": envelope_id,
        }
    )
    return_url = request.host_url.rstrip("/") + "/embedded/complete?" + return_params
    view_body = {
        "returnUrl": return_url,
        "authenticationMethod": "none",
        "email": signer_email,
        "userName": signer_name,
        "clientUserId": f"demo-{signer_email}",
    }
    return ds_post(f"/envelopes/{envelope_id}/views/recipient", view_body, token=token)


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
    last = (400, {})
    try:
        for field in ("File", "file", "document"):
            r = http.post(
                url,
                headers=headers,
                files={field: (filename, content_bytes, "application/pdf")},
                timeout=60,
            )
            try:
                data = r.json() if r.content else {}
            except Exception:
                data = {"raw": r.text[:1000]}
            last = (r.status_code, data)
            if r.status_code in (200, 201):
                return last
        return last
    except Exception as exc:
        return 500, {"error": str(exc)}


def seed_edd_vendor_onboarding(workspace_id, token, demo=None, effective_date=""):
    """
    Stage a workspace pack with three outstanding dual-signer envelopes:
    Corey Washington signs first, Cole Mitchell countersigns.
    """
    demo = demo or GOV_WORKSPACE_DEMO
    primary = demo_primary_signer()
    counter = demo_countersigner()
    vendor_email = primary["email"]
    vendor_name = demo.get("vendor_name") or demo.get("agency_name") or "Participant"
    signer_name = primary["name"]
    agency_signer = demo.get("participant_name") or "Agency Officer"
    agency_name = demo.get("agency_name") or "State of California"
    date_anchor = demo.get("date_anchor") or "Vendor Effective Date:"
    email_prefix = demo.get("email_subject_prefix") or "CA Agency"
    pack_name = demo.get("pack_name") or demo.get("admin_title") or "Onboarding Pack"
    use_case = demo.get("use_case") or "edd"
    effective_date = (effective_date or "").strip()
    steps = []
    documents = []
    envelopes = []
    upload_requests = []
    vendor_user_id = None
    hub_envelope_id = None
    hub_b64 = None
    hub_spec = None
    invitation = None
    invitations = []
    esign_envelope_ids = []

    for person, step_name in (
        (primary, "invite_primary"),
        (counter, "invite_countersigner"),
    ):
        code, data = invite_workspace_user(workspace_id, token, person["email"], person["first"], person["last"])
        steps.append({"step": step_name, "status": code, "email": person["email"]})
        invited = {
            "email": person["email"],
            "name": person["name"],
            "status": "invited" if code in (200, 201, 409) else "invite_failed",
        }
        if isinstance(data, dict):
            invited["user_id"] = (
                data.get("user_id")
                or data.get("userId")
                or data.get("workspace_user_id")
                or data.get("workspaceUserId")
            )
            if step_name == "invite_primary":
                vendor_user_id = invited.get("user_id")
        invitations.append(invited)
    invitation = (
        invitations[0]
        if invitations
        else {
            "email": vendor_email,
            "name": signer_name,
            "status": "invite_failed",
        }
    )

    doc_specs = demo.get("doc_specs") or [
        {
            "key": "vendor",
            "filename": "EDD_Vendor_Services_Agreement.pdf",
            "label": "EDD Vendor Services Agreement",
            "hub": True,
        },
        {
            "key": "nda",
            "filename": "EDD_Confidentiality_Data_Sharing_NDA.pdf",
            "label": "EDD Confidentiality & Data Sharing NDA",
        },
    ]
    doc_ids = []
    for spec in doc_specs:
        try:
            b64 = generate_pdf(spec["key"], signer_name=agency_signer)
            pdf_bytes = base64.b64decode(b64)
            if spec.get("hub") or hub_b64 is None:
                hub_b64 = b64
                hub_spec = spec
        except Exception as exc:
            steps.append({"step": f"generate_{spec['key']}", "status": 500, "error": str(exc)})
            continue
        code, data = workspaces_upload_document(workspace_id, spec["filename"], pdf_bytes, token=token)
        steps.append({"step": f"upload_{spec['key']}", "status": code, "data": data})
        doc_id = None
        if isinstance(data, dict):
            doc_id = data.get("document_id") or data.get("documentId")
        if code in (200, 201) and doc_id:
            doc_ids.append(doc_id)
            documents.append(
                {
                    "document_id": doc_id,
                    "name": spec["label"],
                    "filename": spec["filename"],
                }
            )

    existing, list_code, list_data = list_outstanding_dual_envelopes(
        token,
        subject_needles=workspace_pack_needles(demo),
        primary_email=vendor_email,
        countersigner_email=counter["email"],
    )
    steps.append(
        {
            "step": "list_outstanding",
            "status": list_code,
            "count": len(existing),
            "error": None if list_code == 200 else (list_data if isinstance(list_data, dict) else str(list_data)),
        }
    )
    envelopes.extend(existing)
    needed = max(0, WORKSPACE_OUTSTANDING_TARGET - len(existing))
    send_specs = (doc_specs or [])[:WORKSPACE_OUTSTANDING_TARGET]
    if not send_specs:
        send_specs = [
            {
                "key": "vendor",
                "filename": "Agreement.pdf",
                "label": pack_name,
            }
        ]
    for index in range(needed):
        spec = send_specs[index % len(send_specs)]
        try:
            b64 = generate_pdf(spec["key"], signer_name=agency_signer)
            if spec.get("hub") or hub_b64 is None:
                hub_b64 = b64
                hub_spec = spec
        except Exception as exc:
            steps.append({"step": f"generate_outstanding_{spec['key']}", "status": 500, "error": str(exc)})
            continue
        blurb = (
            f"{agency_name} — {pack_name}. {signer_name} ({vendor_email}) signs first; "
            f"{counter['name']} ({counter['email']}) countersigns {spec['label']}."
            + (f" Effective date: {effective_date}." if effective_date else "")
        )
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
            date_anchor=spec.get("date_anchor") or date_anchor,
            email_subject_prefix=email_prefix,
            email_blurb=blurb,
            countersigner_email=counter["email"],
            countersigner_name=counter["name"],
        )
        steps.append({"step": f"esign_email_{spec['key']}", "status": ecode, "data": edata})
        if ecode in (200, 201) and isinstance(edata, dict) and edata.get("envelopeId"):
            esign_envelope_ids.append(edata["envelopeId"])
            envelopes.append(
                {
                    "envelope_id": edata["envelopeId"],
                    "name": spec["label"],
                    "source": "esign_email",
                    "status": "sent",
                    "signer_email": vendor_email,
                    "countersigner_email": counter["email"],
                    "recipient": f"{signer_name} → {counter['name']}",
                }
            )

    if envelopes and not hub_envelope_id:
        hub_envelope_id = envelopes[0].get("envelope_id")

    attach_ids = list(
        dict.fromkeys([e.get("envelope_id") for e in envelopes if e.get("envelope_id")] + esign_envelope_ids)
    )
    for eid in attach_ids:
        for body in (
            {"envelope_id": eid},
            {"envelopeId": eid},
        ):
            code, data = workspaces_call("POST", f"/{workspace_id}/envelopes", body=body, token=token)
            steps.append(
                {
                    "step": "attach_esign_envelope",
                    "status": code,
                    "envelope_id": eid,
                    "body_keys": list(body.keys()),
                }
            )
            if code in (200, 201):
                break

    return {
        "use_case": use_case,
        "vendor_user_id": vendor_user_id,
        "signer_email": vendor_email,
        "signer_name": signer_name,
        "countersigner_email": counter["email"],
        "countersigner_name": counter["name"],
        "outstanding_target": WORKSPACE_OUTSTANDING_TARGET,
        "outstanding_count": len(envelopes),
        "effective_date": effective_date,
        "hub_envelope_id": hub_envelope_id,
        "hub_doc_key": (hub_spec or {}).get("key") or "vendor",
        "invitation": invitation,
        "invitations": invitations,
        "upload_invitation": {
            "email": vendor_email,
            "name": signer_name,
            "count": 0,
            "status": "skipped",
            "items": [],
        },
        "documents": documents,
        "envelopes": envelopes[:WORKSPACE_OUTSTANDING_TARGET],
        "upload_requests": upload_requests,
        "steps": steps,
        "demo": {
            "admin_title": demo.get("admin_title"),
            "agency_name": demo.get("agency_name"),
            "agency_short": demo.get("agency_short"),
            "agency_tagline": demo.get("agency_tagline"),
        },
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
                "Workspaces requires dtr.rooms.read / dtr.rooms.write scopes. Click Refresh Token to re-authenticate."
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
        raw = data.get("message") or data.get("detail") or data.get("error_description") or data.get("error") or ""
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
