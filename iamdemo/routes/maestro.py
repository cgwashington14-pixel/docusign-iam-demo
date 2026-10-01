import time

import requests as http
from flask import (
    Blueprint,
    jsonify,
    redirect,
    render_template,
    request,
    session,
    url_for,
)

from iamdemo.services.docusign import active_token_value, ds_get, ds_headers, iam_base
from iamdemo.services.workflows import (
    build_default_trigger_inputs,
    fetch_workflow_instances,
    fetch_workflow_trigger_requirements,
    find_preferred_workflow,
    gov_prefill_trigger_inputs,
    launch_workflow,
    parse_workflows,
    sort_workflows_preferred_first,
    workflow_share_start_url,
)

bp = Blueprint("maestro", __name__)


@bp.route("/maestro/call", methods=["POST"])
def maestro_call():
    """Proxy live Workflow Builder API calls from the interactive explorer panel."""
    token = active_token_value()
    if not token:
        return jsonify({"error": "not authenticated"}), 401
    body = request.get_json() or {}
    rel_path = body.get("path", "").lstrip("/")
    # Accept legacy explorer paths that still say maestro/
    if rel_path.startswith("maestro/"):
        rel_path = rel_path[len("maestro/") :]
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
        return jsonify({"status_code": r.status_code, "url": url, "response": resp_data, "latency_ms": latency})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@bp.route("/maestro")
def maestro():
    token = active_token_value()
    workflows = []
    plan_error = None
    api_call_info = None

    if not token:
        return render_template(
            "maestro.html",
            workflows=[],
            plan_error=None,
            api_call_info=None,
            instances=[],
            selected_workflow_id="",
            create_result=None,
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
            "upgrade": None
            if scope_issue
            else "Confirm Workflow Builder is provisioned on your demo account with your Docusign AE.",
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


@bp.route("/api/workflow/<workflow_id>/requirements")
def api_workflow_requirements(workflow_id):
    token = active_token_value()
    if not token:
        return jsonify({"error": "not authenticated"}), 401
    code, data = fetch_workflow_trigger_requirements(workflow_id, token)
    if code != 200:
        return jsonify({"error": data.get("detail") or data.get("message") or f"HTTP {code}"}), code
    schema = data.get("trigger_input_schema") or []
    trigger_type = data.get("trigger_event_type") or ""
    return jsonify(
        {
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
        }
    )


@bp.route("/api/workflow/<workflow_id>/launch", methods=["POST"])
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
        return jsonify(
            {
                "error": result.get("message") or "Could not launch workflow",
                "trigger_method": result.get("trigger_method"),
                "status_code": result.get("status_code"),
                "api_response": result.get("api_response"),
            }
        ), 400
    return jsonify(
        {
            "workflow_id": workflow_id,
            "embed_url": result.get("embed_url"),
            "instance_id": result.get("instance_id"),
            "trigger_method": result.get("trigger_method"),
            "api_trigger_blocked": result.get("api_trigger_blocked", False),
            "message": result.get("message"),
            "status_code": result.get("status_code"),
            "request_body": result.get("request_body"),
            "api_response": result.get("api_response"),
        }
    )


@bp.route("/api/workflow/<workflow_id>/instances")
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


@bp.route("/maestro/create", methods=["POST"])
def maestro_create():
    token = active_token_value()
    if not token:
        return redirect(url_for("maestro.maestro"))

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
            "maestro.html",
            workflows=[],
            plan_error=plan_error,
            create_result=create_result,
            api_call_info=None,
            instances=[],
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
        "maestro.html",
        workflows=workflows,
        plan_error=plan_error,
        create_result=create_result,
        api_call_info=None,
        instances=instances,
        selected_workflow_id=workflow_id,
    )
