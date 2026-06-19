"""IAM Platform / Agreement Desk screen metadata and business rules for walkthrough mockups."""

EXECUTIVE_THRESHOLD = 1_000_000  # USD — auto-route above this


def parse_contract_value(value_str):
    """Parse '$2,400,000' or '$890,000 / year' into int."""
    if not value_str:
        return 0
    s = value_str.replace(",", "").replace("$", "").split("/")[0].strip()
    multipliers = {"K": 1_000, "M": 1_000_000, "B": 1_000_000_000}
    for suffix, mult in multipliers.items():
        if suffix in s.upper():
            try:
                return int(float(s.upper().replace(suffix, "").strip()) * mult)
            except ValueError:
                return 0
    digits = "".join(c for c in s if c.isdigit() or c == ".")
    try:
        return int(float(digits)) if digits else 0
    except ValueError:
        return 0


def executive_required(value_str):
    return parse_contract_value(value_str) >= EXECUTIVE_THRESHOLD


def enrich_steps(steps, contract_value, vendor_name, state_name):
    """Attach CLM screen types, business rules, and flow hints to workflow steps."""
    needs_exec = executive_required(contract_value)
    enriched = []
    for i, step in enumerate(steps):
        s = dict(step)
        sid = s.get("id", "")
        s["clm_screen"] = _screen_for_step(sid)
        s["business_rules"] = _rules_for_step(sid, needs_exec, state_name, contract_value)
        s["flow_hint"] = _flow_hint(sid, i, steps)
        enriched.append(s)

    if needs_exec and not any(s.get("id") == "executive_approval" for s in enriched):
        enriched = _inject_executive_step(enriched, state_name)

    return enriched


def _inject_executive_step(steps, state_name):
    """Insert executive approval before signature when threshold exceeded."""
    out = []
    for s in steps:
        if s.get("id") == "signature":
            out.append({
                "id": "executive_approval",
                "order": s["order"],
                "title": "Executive Approval",
                "persona": "signer",
                "product": "CLM",
                "description": (
                    f"Contract value exceeds ${EXECUTIVE_THRESHOLD:,} threshold. "
                    "CLM automatically routes to executive approver per agency policy."
                ),
                "actions": [
                    "Rule triggered: value ≥ executive threshold",
                    "Notification sent to Department Director",
                    "Executive reviews summary packet",
                    "Approval recorded in audit trail",
                ],
                "clm_screen": "executive_approval",
                "business_rules": [{
                    "type": "threshold",
                    "label": "Executive approval required",
                    "detail": f"Auto-routed — contract value ≥ ${EXECUTIVE_THRESHOLD:,}",
                    "auto": True,
                }],
                "flow_hint": "forward",
                "ai_review": False,
            })
            s = dict(s)
            s["order"] = s["order"] + 1
        elif s.get("order", 0) >= 8:
            s = dict(s)
            s["order"] = s.get("order", 0) + 1
        out.append(s)
    return out


def _screen_for_step(step_id):
    return {
        "initiate": "agreement_desk",
        "intake": "agreement_desk",
        "sol_publish": "sol_publish",
        "sol_register": "sol_register",
        "sol_intake": "sol_intake",
        "sol_evaluation": "sol_evaluation",
        "sol_award": "sol_award",
        "generate": "document_builder",
        "ai_scorecard": "iris_review",
        "contracts_review": "approval_queue",
        "legal_review": "legal_hub",
        "external_review": "workspace",
        "negotiation": "redline_compare",
        "executive_approval": "executive_approval",
        "signature": "esign_handoff",
        "post_execution": "obligations_erp",
    }.get(step_id, "agreement_desk")


def _flow_hint(step_id, index, all_steps):
    if step_id == "negotiation":
        return "loop_back"
    if step_id == "external_review" and index > 0:
        prev = all_steps[index - 1].get("id") if index > 0 else ""
        if prev == "negotiation":
            return "forward_after_loop"
    return "forward"


def _rules_for_step(step_id, needs_exec, state_name, contract_value):
    rules = []
    if step_id == "contracts_review" and needs_exec:
        rules.append({
            "type": "threshold",
            "label": "Executive threshold detected",
            "detail": f"Value {contract_value} — will auto-route to executive approver after final contracts review",
            "auto": True,
        })
    if step_id == "legal_review":
        rules.extend([
            {
                "type": "hub_spoke",
                "label": "Legal hub-and-spoke routing",
                "detail": f"{state_name} delegated counsel selects next approver — Vendor Review or Contracts Final",
                "auto": False,
            },
            {
                "type": "playbook",
                "label": f"{state_name} Standard Terms review",
                "detail": "Articles 5–9: CPRA/data, liability cap, indemnification, Gov Code §927.8 insurance, audit rights",
                "auto": True,
            },
            {
                "type": "suggested",
                "label": "Suggested route: Vendor Review",
                "detail": "External review before signature — playbook default for IT MSAs",
                "auto": True,
            },
        ])
    if step_id == "negotiation":
        rules.append({
            "type": "loop",
            "label": "Negotiation round",
            "detail": "Redlines sent to counterparty — may loop back to vendor review",
            "auto": False,
        })
    if step_id == "executive_approval":
        rules.append({
            "type": "threshold",
            "label": "Automatic executive routing",
            "detail": f"Policy: contracts ≥ ${EXECUTIVE_THRESHOLD:,} require director-level approval",
            "auto": True,
        })
    if step_id == "ai_scorecard":
        rules.append({
            "type": "iris",
            "label": "Iris AI-Assisted Review",
            "detail": f"Compared against {state_name} Standard Terms playbook",
            "auto": True,
        })
    if step_id == "sol_evaluation":
        rules.append({
            "type": "iris",
            "label": "Iris evaluation assist",
            "detail": f"Scores proposals against {state_name} mandatory RFO requirements",
            "auto": True,
        })
    if step_id == "sol_award" and needs_exec:
        rules.append({
            "type": "threshold",
            "label": "Executive approval on contract execution",
            "detail": f"Award value {contract_value} — executive sign-off queued at signature step",
            "auto": True,
        })
    return rules
