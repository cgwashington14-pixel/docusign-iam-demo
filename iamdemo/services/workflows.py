import time
from datetime import date

import requests as http

from iamdemo import config
from iamdemo.content.workspace_demos import HAP_AUTOMATION_PREFERRED
from iamdemo.services.docusign import ds_get, ds_headers, iam_base


def parse_workflows(data):
    """Normalize Workflow Builder list responses."""
    if not isinstance(data, dict):
        return []
    for key in ("data", "value", "workflows"):
        items = data.get(key)
        if isinstance(items, list):
            return items
    return []


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


def hap_prefill_trigger_inputs(user_email="", user_name="Demo User"):
    """HAP-flavored Workflow Builder trigger_inputs."""
    email = user_email or config.DEMO_SIGNER_EMAIL
    return {
        "startDate": date.today().isoformat(),
        "workflowBuilder": {
            "name": "Elena Vasquez",
            "email": email,
        },
        "workflowPreparer": {
            "name": user_name or config.DEMO_SIGNER_NAME,
            "email": email,
        },
    }


def list_active_workflows(token):
    code, data = ds_get("/workflows?status=active", token=token, base=iam_base())
    if code != 200:
        return code, [], data
    return code, sort_workflows_preferred_first(parse_workflows(data)), data


def find_hap_automation_workflow(workflows):
    """Prefer HR Offer Letter, then AV1, then the first active workflow."""
    for needle in HAP_AUTOMATION_PREFERRED:
        match = find_preferred_workflow(workflows, preferred=needle)
        if match:
            name = (match.get("name") or match.get("workflowName") or "").lower()
            if needle.lower() in name or name == needle.lower():
                return match
    return find_preferred_workflow(workflows)


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
        return "This workflow is linked to Agreement Desk and cannot be triggered externally via API."
    if "trigger type=Event" in detail:
        return "This workflow uses an Event trigger and must be started by its configured event source."
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
    inputs = (
        trigger_inputs
        if trigger_inputs is not None
        else build_default_trigger_inputs(
            schema,
            user_email=user_email,
            user_name=user_name,
        )
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


def serialize_workflow(item):
    if not isinstance(item, dict):
        return item
    wid = item.get("id") or item.get("workflowId")
    name = item.get("name") or item.get("workflowName")
    return {
        "id": wid,
        "name": name,
        "status": item.get("status") or "active",
        "startUrl": workflow_share_start_url(wid) if wid else "",
    }
