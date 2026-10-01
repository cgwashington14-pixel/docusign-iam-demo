import time

from flask import (
    Blueprint,
    jsonify,
    render_template,
    request,
    session,
)

from iamdemo import config
from iamdemo.services.docusign import active_token_value, ds_get, webforms_base
from iamdemo.services.webforms import (
    build_webform_sample_prefill,
    create_webform_instance,
    extract_webform_fields,
    find_preferred_webform,
    parse_webforms,
    webform_display_name,
    webform_launch_payload,
)

bp = Blueprint("webforms", __name__)


@bp.route("/api/webform/<form_id>")
def api_webform_detail(form_id):
    """Return form field names for a given web form — used to build the pre-fill UI."""
    token = active_token_value()
    if not token:
        return jsonify({"error": "not authenticated"}), 401

    code, data = ds_get(f"/forms/{form_id}?state=active", token=token, base=webforms_base())
    if code != 200:
        return jsonify({"error": data.get("message", f"HTTP {code}")}), code

    fields = extract_webform_fields(data)

    return jsonify(
        {
            "formId": form_id,
            "formName": data.get("formProperties", {}).get("name") or data.get("name", ""),
            "description": data.get("description") or "",
            "fields": fields,
            "field_count": len(fields),
        }
    )


@bp.route("/api/webforms")
def api_webforms_list():
    """List web forms for embedded portal launchers."""
    token = active_token_value()
    if not token:
        return jsonify({"forms": [], "authenticated": False})
    code, wf_data = ds_get("/forms", token=token, base=webforms_base())
    if code != 200:
        return jsonify({"error": wf_data.get("message", f"HTTP {code}"), "forms": []}), code
    return jsonify({"forms": parse_webforms(wf_data), "authenticated": True})


@bp.route("/api/webform/instance", methods=["POST"])
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
    code, inst, form_url, form_name, fields = create_webform_instance(
        token,
        form_id,
        prefill=prefill,
        client_user_id=client_user_id,
        expiration_offset=body.get("expiration_offset", 60),
        return_url=return_url,
    )
    if code not in (200, 201):
        err = inst.get("message") or inst.get("detail") or inst.get("error") or f"HTTP {code}"
        return jsonify({"error": err}), code

    return jsonify(webform_launch_payload(form_id, form_name, form_url, inst, prefill, fields))


@bp.route("/api/webform/sample", methods=["POST", "GET"])
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
    code, inst, form_url, form_name, _ = create_webform_instance(
        token,
        form_id,
        prefill=prefill,
        client_user_id=f"sample-{int(time.time())}",
        return_url=request.host_url.rstrip("/") + "/webforms?sample=done",
    )
    if code not in (200, 201):
        err = inst.get("message") or inst.get("detail") or inst.get("error") or f"HTTP {code}"
        return jsonify({"error": err}), code

    return jsonify(
        webform_launch_payload(form_id, form_name or webform_display_name(preferred), form_url, inst, prefill, fields)
    )


@bp.route("/webforms", methods=["GET", "POST"])
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

            code2, inst, form_url, _, _ = create_webform_instance(
                token,
                form_id,
                prefill=prefill_values,
                client_user_id=unique_id or f"user-{int(time.time())}",
            )
            if code2 in (200, 201):
                prefill_data = inst
                if form_url and form_url != inst.get("formUrl"):
                    prefill_data = {**inst, "launchUrl": form_url}
            else:
                error = (
                    inst.get("message")
                    or inst.get("detail")
                    or inst.get("error")
                    or f"Web form instance error ({code2})"
                )
        else:
            error = "Select a web form to launch."

    # Always prepare sample prefill for the preferred travel/training form (live demo ready)
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
        "webforms.html",
        forms=forms,
        prefill_data=prefill_data,
        form_url=form_url,
        error=error,
        forms_error=forms_error,
        prefill=prefill,
        form_count=len(forms),
        preferred_form_id=preferred_form_id,
        sample_launch=sample_launch,
        demo_webform_name=config.DEMO_WEBFORM_NAME,
    )
