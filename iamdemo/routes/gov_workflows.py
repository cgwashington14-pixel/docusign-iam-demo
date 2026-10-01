from flask import (
    Blueprint,
    jsonify,
    render_template,
    request,
    session,
)

from iamdemo.content.gov_scenarios import (
    API_EXAMPLES,
    CLM_CAPABILITIES,
    CONVERGENCE_POINTS,
    GOV_CUSTOMER_PROOF,
    IAM_ESSENTIALS_CAPABILITIES,
    generate_custom_scenario,
)
from iamdemo.content.state_builder import DEFAULT_STATE, get_state_package, list_states
from iamdemo.services.docusign import active_token_value

bp = Blueprint("gov_workflows", __name__)


@bp.route("/gov-workflows")
def gov_workflows():
    state = request.args.get("state", DEFAULT_STATE).upper()
    pkg = get_state_package(state)
    return render_template(
        "gov_workflows.html",
        states=list_states(),
        current_state=state,
        ca_context=pkg["context"],
        clauses=pkg["clauses"],
        personas=pkg["personas"],
        first_party=pkg["first_party"],
        third_party=pkg["third_party"],
        solicitation=pkg["solicitation"],
        ai_scorecards=pkg["scorecards"],
        use_cases=pkg["use_cases"],
        iam_essentials=IAM_ESSENTIALS_CAPABILITIES,
        clm_capabilities=CLM_CAPABILITIES,
        convergence=CONVERGENCE_POINTS,
        api_examples=API_EXAMPLES,
        demo_signer_email=session.get("user_email") or "demo.signer@agency.ca.gov",
        demo_signer_name=session.get("user_name") or "Agency Signer",
        is_authenticated=bool(active_token_value()),
        customer_proof=GOV_CUSTOMER_PROOF,
    )


@bp.route("/api/gov-workflows/state/<state_abbr>")
def api_gov_workflows_state(state_abbr):
    pkg = get_state_package(state_abbr)
    return jsonify(pkg)


@bp.route("/api/gov-workflows/states")
def api_gov_workflows_states():
    return jsonify(list_states())


@bp.route("/api/gov-workflows/generate", methods=["POST"])
def api_gov_workflows_generate():
    data = request.get_json() or {}
    description = data.get("description", "").strip()
    state_abbr = data.get("state", DEFAULT_STATE).upper()
    if not description:
        return jsonify({"error": "Describe your workflow first."}), 400
    result = generate_custom_scenario(description)
    pkg = get_state_package(state_abbr)
    result["state"] = pkg["context"]
    result["convergence_note"] = (
        f"Both paths converge at eSignature for execution. CLM feeds the envelope; "
        f"Connect webhooks push completed metadata back to CLM and {pkg['context']['erp'].split('(')[0].strip()}."
    )
    return jsonify(result)


@bp.route("/api/gov-workflows/scenario/<scenario_id>")
def api_gov_workflows_scenario(scenario_id):
    state_abbr = request.args.get("state", DEFAULT_STATE).upper()
    pkg = get_state_package(state_abbr)
    scenario = pkg.get(scenario_id) or pkg["first_party"]
    if scenario_id not in ("first_party", "third_party", "solicitation"):
        scenario = pkg["first_party"]
    return jsonify(
        {
            "scenario": scenario,
            "scorecard": pkg["scorecards"].get(scenario_id, {}),
            "personas": pkg["personas"],
            "context": pkg["context"],
        }
    )
