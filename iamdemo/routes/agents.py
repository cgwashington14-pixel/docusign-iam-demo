from flask import (
    Blueprint,
    jsonify,
    render_template,
    request,
)

from iamdemo import config
from iamdemo.content.workspace_demos import DOCUSIGN_AUTOMATIONS_URL, HAP_AGENT_STUDIO_PROMPT, HAP_CASE_ID
from iamdemo.services.docusign import WORKSPACES_SCOPES, active_token_value, ds_get, token_has_scopes
from iamdemo.services.hap import (
    GOV_AGENT_RUNS,
    collect_hap_workspace,
    find_named_workspace,
    hap_workspace_payload,
    send_and_stage_hap_envelope,
)
from iamdemo.services.workflows import (
    find_hap_automation_workflow,
    find_preferred_workflow,
    hap_prefill_trigger_inputs,
    launch_workflow,
    list_active_workflows,
    serialize_workflow,
)
from iamdemo.services.workspaces import workspaces_error_message

bp = Blueprint("agents", __name__)


@bp.route("/gov-agents")
def gov_agents():
    token = active_token_value()
    return render_template(
        "gov_agents.html",
        live_ready=bool(token),
        demo_signer_name=config.DEMO_SIGNER_NAME,
        demo_signer_email=config.DEMO_SIGNER_EMAIL,
        demo_countersigner_name=config.DEMO_COUNTERSIGNER_NAME,
        demo_countersigner_email=config.DEMO_COUNTERSIGNER_EMAIL,
    )


def gov_agents_workspace_token():
    return active_token_value(required_scopes=WORKSPACES_SCOPES) or active_token_value()


@bp.route("/api/gov-agents/live")
def api_gov_agents_live():
    token = active_token_value()
    ws_token = active_token_value(required_scopes=WORKSPACES_SCOPES)
    workspace = None
    if ws_token:
        existing, _, _ = find_named_workspace(ws_token, HAP_CASE_ID)
        if existing:
            workspace = hap_workspace_payload(existing)
    return jsonify(
        {
            "ready": bool(token),
            "workspacesReady": bool(ws_token),
            "caseId": HAP_CASE_ID,
            "signerName": config.DEMO_SIGNER_NAME,
            "signerEmail": config.DEMO_SIGNER_EMAIL,
            "countersignerName": config.DEMO_COUNTERSIGNER_NAME,
            "countersignerEmail": config.DEMO_COUNTERSIGNER_EMAIL,
            "workspace": workspace,
        }
    )


@bp.route("/api/gov-agents/envelopes")
def api_gov_agents_envelopes():
    token = active_token_value()
    if not token:
        return jsonify({"error": "not authenticated", "envelopes": []}), 401
    code, data = ds_get(
        "/envelopes?from_date=2026-01-01&order_by=last_modified&order=desc&count=40",
        token=token,
    )
    if code != 200:
        return jsonify({"error": data.get("message", f"HTTP {code}"), "envelopes": []}), code
    envelopes = []
    for env in data.get("envelopes", []):
        subject = env.get("emailSubject") or ""
        if "HAP-2026" not in subject and "Housing Assistance" not in subject:
            continue
        envelopes.append(
            {
                "envelopeId": env.get("envelopeId"),
                "status": env.get("status"),
                "emailSubject": subject,
                "sentDateTime": env.get("sentDateTime") or env.get("lastModifiedDateTime"),
            }
        )
        if len(envelopes) >= 12:
            break
    workspace = None
    ws_token = active_token_value(required_scopes=WORKSPACES_SCOPES)
    if ws_token:
        existing, _, _ = find_named_workspace(ws_token, HAP_CASE_ID)
        if existing:
            workspace = hap_workspace_payload(existing)
    return jsonify({"envelopes": envelopes, "caseId": HAP_CASE_ID, "workspace": workspace})


@bp.route("/api/gov-agents/workspace", methods=["GET", "POST"])
def api_gov_agents_workspace():
    """Find or create the HAP workspace and drop existing HAP envelopes into it."""
    token = gov_agents_workspace_token()
    if not token:
        return jsonify({"error": "not authenticated", "login": "/oauth/login"}), 401
    if not token_has_scopes(token, WORKSPACES_SCOPES):
        return jsonify(
            {
                "error": (
                    "Workspaces requires dtr.rooms.read / dtr.rooms.write scopes. "
                    "Click Refresh Token to re-authenticate."
                ),
                "needs_reauth": True,
                "login": "/oauth/login?next=/gov-agents",
            }
        ), 401

    if request.method == "GET":
        existing, code, data = find_named_workspace(token, HAP_CASE_ID)
        if existing:
            return jsonify(
                {
                    "success": True,
                    "caseId": HAP_CASE_ID,
                    "workspace": hap_workspace_payload(existing),
                }
            )
        if code != 200:
            return jsonify(
                {
                    "error": workspaces_error_message(code, data),
                    "workspace": None,
                    "caseId": HAP_CASE_ID,
                }
            ), code
        return jsonify(
            {
                "success": True,
                "caseId": HAP_CASE_ID,
                "workspace": None,
            }
        )

    workspace, error = collect_hap_workspace(token, signer_email=config.DEMO_SIGNER_EMAIL)
    if error:
        return jsonify(
            {
                "success": False,
                "error": error,
                "caseId": HAP_CASE_ID,
                "workspace": workspace,
            }
        ), 502
    return jsonify(
        {
            "success": True,
            "caseId": HAP_CASE_ID,
            "workspace": workspace,
            "runs": (workspace or {}).get("seedRuns") or [],
        }
    )


@bp.route("/api/gov-agents/run", methods=["POST"])
def api_gov_agents_run():
    token = active_token_value()
    if not token:
        return jsonify({"error": "not authenticated", "login": "/oauth/login"}), 401

    body = request.get_json() or {}
    agent_id = (body.get("agent") or "").strip().lower()
    signer_email = (body.get("signer_email") or config.DEMO_SIGNER_EMAIL).strip()
    if agent_id == "program":
        selected = list(GOV_AGENT_RUNS.keys())
    elif agent_id in GOV_AGENT_RUNS:
        selected = [agent_id]
    else:
        return jsonify({"error": "Unknown agent. Use hr, procurement, operations, constituent, or program."}), 400

    workspace = None
    workspace_error = None
    workspace_id = None
    ws_token = gov_agents_workspace_token()
    if ws_token and token_has_scopes(ws_token, WORKSPACES_SCOPES):
        workspace, workspace_error = collect_hap_workspace(
            ws_token,
            signer_email=signer_email,
            seed_if_empty=True,
        )
        if workspace:
            workspace_id = workspace.get("workspaceId")
    elif ws_token:
        workspace_error = (
            "Workspaces requires dtr.rooms.read / dtr.rooms.write scopes. Click Refresh Token to re-authenticate."
        )

    seed_runs = (workspace or {}).get("seedRuns") or []
    if agent_id == "program" and seed_runs:
        runs = seed_runs
    else:
        runs = []
        for key in selected:
            spec = GOV_AGENT_RUNS[key]
            signer_name = (body.get("signer_name") or spec["signer_name"]).strip()
            result = send_and_stage_hap_envelope(
                spec,
                signer_name,
                signer_email,
                token,
                workspace_id=workspace_id,
            )
            result["agent"] = key
            result["label"] = spec["label"]
            runs.append(result)
        if workspace and workspace_id:
            attached = sum(1 for r in runs if r.get("workspaceAttached"))
            workspace["attached"] = (workspace.get("attached") or 0) + attached

    success = all(r.get("success") for r in runs)
    return jsonify(
        {
            "success": success,
            "agent": agent_id,
            "caseId": HAP_CASE_ID,
            "signerEmail": signer_email,
            "runs": runs,
            "workspace": workspace,
            "workspaceError": workspace_error,
        }
    ), (200 if success else 207)


@bp.route("/api/gov-agents/automations")
def api_gov_agents_automations():
    """List Workflow Builder automations and the HAP-preferred workflow."""
    token = active_token_value()
    if not token:
        return jsonify({"error": "not authenticated", "login": "/oauth/login"}), 401
    code, workflows, data = list_active_workflows(token)
    if code != 200:
        return jsonify(
            {
                "error": (data or {}).get("detail") or (data or {}).get("message") or f"HTTP {code}",
                "needs_reauth": code in (401, 403),
                "workflows": [],
            }
        ), code
    preferred = find_hap_automation_workflow(workflows)
    return jsonify(
        {
            "caseId": HAP_CASE_ID,
            "agentStudioPrompt": HAP_AGENT_STUDIO_PROMPT,
            "automationsUrl": DOCUSIGN_AUTOMATIONS_URL,
            "workflow": serialize_workflow(preferred) if preferred else None,
            "workflows": [serialize_workflow(w) for w in workflows[:12]],
        }
    )


@bp.route("/api/gov-agents/automation", methods=["POST"])
def api_gov_agents_automation():
    """
    Start the HAP program in Docusign Automations (Workflow Builder).
    Agent Studio agents are created in the Docusign UI; this launches the
    matching live workflow so the run appears under Automations.
    """
    token = active_token_value()
    if not token:
        return jsonify({"error": "not authenticated", "login": "/oauth/login"}), 401
    body = request.get_json(silent=True) or {}
    agent_id = (body.get("agent") or "program").strip().lower()
    labels = {
        "program": "Housing Assistance orchestrator",
        "hr": "HR onboarding agent",
        "procurement": "Procurement agent",
        "operations": "Operations MOU agent",
        "constituent": "Constituent agent",
    }
    code, workflows, data = list_active_workflows(token)
    if code != 200:
        return jsonify(
            {
                "error": (data or {}).get("detail") or (data or {}).get("message") or f"HTTP {code}",
                "needs_reauth": code in (401, 403),
            }
        ), code
    preferred_name = "HR Offer Letter" if agent_id == "hr" else None
    workflow = (
        find_preferred_workflow(workflows, preferred=preferred_name) if preferred_name else None
    ) or find_hap_automation_workflow(workflows)
    if not workflow:
        return jsonify(
            {
                "error": "No active Workflow Builder automations on this demo account.",
                "automationsUrl": DOCUSIGN_AUTOMATIONS_URL,
            }
        ), 404
    workflow_id = workflow.get("id") or workflow.get("workflowId")
    instance_name = f"{HAP_CASE_ID} · {labels.get(agent_id, 'Housing Assistance')}"
    launch = launch_workflow(
        workflow_id,
        token,
        instance_name=instance_name,
        trigger_inputs=hap_prefill_trigger_inputs(
            user_email=config.DEMO_SIGNER_EMAIL,
            user_name=config.DEMO_SIGNER_NAME,
        ),
        user_email=config.DEMO_SIGNER_EMAIL,
        user_name=config.DEMO_SIGNER_NAME,
    )
    if not launch.get("success"):
        return jsonify(
            {
                "success": False,
                "error": launch.get("message") or "Could not start the automation",
                "workflow": serialize_workflow(workflow),
                "agentStudioPrompt": HAP_AGENT_STUDIO_PROMPT,
                "automationsUrl": DOCUSIGN_AUTOMATIONS_URL,
                "status_code": launch.get("status_code"),
            }
        ), 400
    return jsonify(
        {
            "success": True,
            "caseId": HAP_CASE_ID,
            "agent": agent_id,
            "instanceName": instance_name,
            "instanceId": launch.get("instance_id"),
            "embedUrl": launch.get("embed_url"),
            "triggerMethod": launch.get("trigger_method"),
            "message": launch.get("message"),
            "workflow": serialize_workflow(workflow),
            "agentStudioPrompt": HAP_AGENT_STUDIO_PROMPT,
            "automationsUrl": DOCUSIGN_AUTOMATIONS_URL,
            "maestroHref": "/maestro",
        }
    )
