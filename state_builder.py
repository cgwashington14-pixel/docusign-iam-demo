"""Build workflow scenarios dynamically for any US state profile."""

import copy
import json
import os

from clm_step_ui import enrich_steps, EXECUTIVE_THRESHOLD
from gov_scenarios import (
    AI_SCORECARD_SAMPLE,
    CUSTOMIZABLE_CLAUSES,
    FIRST_PARTY_SCENARIO,
    PERSONAS,
    THIRD_PARTY_SCENARIO,
)

_PROFILES_PATH = os.path.join(os.path.dirname(__file__), "state_profiles.json")

with open(_PROFILES_PATH, encoding="utf-8") as f:
    STATE_PROFILES = json.load(f)

DEFAULT_STATE = "CA"


def list_states():
    return [
        {"abbr": abbr, "state": STATE_PROFILES[abbr]["state"]}
        for abbr in sorted(STATE_PROFILES.keys(), key=lambda a: STATE_PROFILES[a]["state"])
    ]


def get_profile(abbr):
    abbr = (abbr or DEFAULT_STATE).upper()
    if abbr not in STATE_PROFILES:
        abbr = DEFAULT_STATE
    return STATE_PROFILES[abbr]


def _erp_short(profile):
    return profile.get("erp_short") or profile["erp"].split("(")[0].strip()


def build_context(profile):
    p = profile
    return {
        "state": p["state"],
        "flag": p["abbr"],
        "erp": p["erp"],
        "hris": p.get("hris", "Workday HCM / PeopleSoft HR (state instance)"),
        "procurement": p["procurement"],
        "it_authority": p["it_authority"],
        "legal": p["legal"],
        "standards": p["standards"],
        "badge": p["badge"],
        "governing_law": p["governing_law"],
        "jurisdiction": p["jurisdiction"],
    }


def build_personas(profile):
    p = profile
    fp = p["first_party"]
    base = copy.deepcopy(PERSONAS)
    base["program_manager"]["dept"] = p["it_authority"]
    base["contracts"]["dept"] = p["procurement"]
    base["legal"]["title"] = f"State Counsel ({p['state']})"
    base["legal"]["dept"] = p["legal"]
    base["signer"]["dept"] = fp["agency"]
    base["vendor"]["dept"] = fp["vendor"]
    base["erp_system"]["name"] = _erp_short(p)
    base["erp_system"]["dept"] = p["procurement"]
    return base


def build_clauses(profile):
    st = profile["state"]
    law = profile["governing_law"]
    proc = profile["procurement"]
    clauses = copy.deepcopy(CUSTOMIZABLE_CLAUSES)
    subs = {
        "ca_standard": f"state_standard",
    }
    templates = {
        "indemnification": f"Mutual indemnification per {proc} standard terms; agency not liable for vendor negligence under {law}",
        "limitation_liability": f"Cap at contract value or 12 months fees; no cap on IP infringement or confidentiality breach ({law})",
        "data_residency": f"Data stored in U.S.; SOC 2 Type II; state cybersecurity standards; breach notification per {st} law",
        "prevailing_wage": f"{st} prevailing wage requirements for applicable construction and public works contracts",
        "termination": f"Agency may terminate for convenience with 30 days notice per {proc} playbook",
        "audit_rights": f"State auditor access; records retention per {st} statute; public records compliant",
        "ip_ownership": f"Work product owned by State of {st}; vendor retains pre-existing IP with license grant",
        "anti_lobbying": f"Anti-lobbying / conflict-of-interest certification required per {st} procurement code",
    }
    for c in clauses:
        if c["id"] in templates:
            c["state_standard"] = templates[c["id"]]
            c["ca_standard"] = templates[c["id"]]
    return clauses


def _scorecard_for_state(profile, scenario_type):
    if profile["abbr"] == "CA":
        return copy.deepcopy(AI_SCORECARD_SAMPLE.get(scenario_type, {}))

    idx = sum(ord(c) for c in profile["abbr"]) % 8
    if scenario_type == "first_party":
        overall = 88 + (idx % 9)
        grade = "A" if overall >= 90 else "B+"
        summary = (
            f"Agency-generated document using {profile['first_party']['template']}. "
            f"Mandatory {profile['state']} clauses present. Minor deviation in SLA credits — within acceptable range."
        )
        base_scores = [100, 95, 98, 82, 96, 100, None, 100]
    else:
        overall = 68 + (idx % 12)
        grade = "C+" if overall < 75 else "B-"
        summary = (
            f"Vendor paper deviates from {profile['state']} Standard Terms in multiple areas. "
            f"Legal review required. Recommend mandatory redlines on liability, data residency, and auto-renewal."
        )
        base_scores = [45, 30, 20, 65, 70, 0, None, 88]

    names = [
        "Indemnification", "Limitation of Liability", "Data Residency",
        "Termination", "IP Ownership", "Anti-Lobbying / Ethics",
        "Prevailing Wage", "Audit Rights",
    ]
    statuses = ["pass", "pass", "pass", "warn", "pass", "pass", "na", "pass"]
    if scenario_type == "third_party":
        statuses = ["fail", "fail", "fail", "warn", "warn", "fail", "na", "pass"]

    clauses = []
    for name, score, status in zip(names, base_scores, statuses):
        if status == "na":
            clauses.append({"name": name, "status": "na", "score": None, "note": "N/A for this agreement type"})
        else:
            note = f"Compared to {profile['procurement']} standard language"
            if status == "fail":
                note = f"Non-compliant with {profile['state']} pre-approved terms"
            elif status == "warn":
                note = "Minor deviation — negotiable"
            clauses.append({"name": name, "status": status, "score": score, "note": note})

    return {"overall_score": overall, "grade": grade, "summary": summary, "clauses": clauses}


def _build_steps(profile, fp, tp, scenario_type):
    erp = _erp_short(profile)
    st = profile["state"]
    proc = profile["procurement"]
    it = profile["it_authority"]
    legal = profile["legal"]
    standards_ref = f"{st} Standard Terms"

    if scenario_type == "first_party":
        doc, vendor, sol = fp, fp["vendor"], fp["solicitation"]
        initiate_desc = (
            f"Program Manager pulls vendor, budget, and project data from {erp}. "
            f"DocuSign CLM generates the contract from the {fp['template']} template with SOW clauses pre-populated."
        )
        generate_desc = (
            f"CLM assembles the contract with {st}-mandatory clauses per {proc} playbook "
            f"plus customizable SOW terms for {fp['use_case']}."
        )
        prefill_system = f"{erp} + State Vendor Registry"
    else:
        doc, vendor = tp, tp["vendor"]
        sol = tp.get("solicitation", "Vendor portal intake")
        initiate_desc = (
            f"{vendor} submits their contract through the agency vendor portal. "
            f"CLM AI classifies the document and routes to the {proc} queue."
        )
        generate_desc = f"AI extracts key terms from vendor paper for {tp['use_case']}."
        prefill_system = "Vendor Portal + CLM Intake Queue"

    steps = [
        {
            "id": "initiate", "order": 1, "title": "Initiate from System of Record",
            "persona": "vendor" if scenario_type == "third_party" else "program_manager",
            "product": "CLM",
            "description": initiate_desc,
            "actions": [
                f"Query {erp} for budget authority" if scenario_type == "first_party" else "Vendor uploads contract PDF",
                "Pull vendor profile from state registry",
                f"Select {fp['template']} template" if scenario_type == "first_party" else "AI classifies document type",
                f"Merge scope: {doc.get('use_case', fp.get('use_case', ''))}",
            ],
            "api": {"method": "POST", "path": "/clm/v2/contracts", "desc": f"Create contract with {erp} pre-fill"},
        },
        {
            "id": "generate", "order": 2, "title": "Generate / Classify Document",
            "persona": "program_manager" if scenario_type == "first_party" else "contracts",
            "product": "CLM",
            "description": generate_desc,
            "actions": [
                f"Insert mandatory {st} clauses",
                "Add pricing / scope schedule",
                "Attach ethics / anti-lobbying certification",
                "Set data residency requirements",
            ],
            "clauses_highlighted": ["data_residency", "indemnification", "ip_ownership", "termination"],
        },
        {
            "id": "ai_scorecard", "order": 3, "title": "AI-Assisted Review Scorecard",
            "persona": "contracts", "product": "IAM",
            "description": (
                f"Iris AI-Assisted Review compares the document against {standards_ref} playbook. "
                f"Deviations are flagged for contracts and legal teams."
            ),
            "actions": ["Run AI clause extraction", f"Compare to {standards_ref}", "Generate risk scorecard", "Flag critical deviations"],
            "ai_review": True,
        },
        {
            "id": "contracts_review", "order": 4, "title": "Contracts Team Review",
            "persona": "contracts", "product": "CLM",
            "description": f"{proc} validates budget authority, procurement compliance ({sol}), and clause completeness.",
            "actions": [f"Verify {erp} encumbrance", "Confirm procurement compliance", "Review clause checklist", "Assign risk tier"],
        },
        {
            "id": "legal_review", "order": 5, "title": "Legal Review",
            "persona": "legal", "product": "CLM",
            "description": f"{legal} reviews indemnification, liability, and data privacy. AI flags deviations from {standards_ref}.",
            "actions": ["Run AI clause analysis", "Review indemnification", f"Validate {st} privacy terms", "Approve or request redlines"],
            "ai_review": True,
        },
        {
            "id": "external_review", "order": 6, "title": "External Vendor Review",
            "persona": "vendor", "product": "IAM",
            "description": f"Document shared with {vendor} via DocuSign Workspace for review and redlines.",
            "actions": ["Vendor receives Workspace invite", "Reviews contract terms", "Proposes redlines", "Submits counter-proposal"],
            "api": {"method": "POST", "path": "/restapi/v2.1/accounts/{id}/workspaces", "desc": "Collaborative review workspace"},
        },
        {
            "id": "negotiation", "order": 7, "title": "Negotiation & Redline Merge",
            "persona": "contracts", "product": "CLM",
            "description": f"Contracts and Legal negotiate vendor redlines against {standards_ref} baseline.",
            "actions": ["Compare redline versions", "Accept / reject changes", "Merge approved language", "Legal clearance"],
        },
        {
            "id": "signature", "order": 8, "title": "Authorized Signature",
            "persona": "signer", "product": "IAM",
            "description": f"Agency authorized signer and {vendor} execute via DocuSign eSignature. Stored in Agreement Manager repository.",
            "actions": ["Send for eSignature", "Agency signer executes", "Vendor counter-signs", "Archive in Agreement Manager"],
            "api": {"method": "POST", "path": "/restapi/v2.1/accounts/{id}/envelopes", "desc": "Execute signature envelope"},
        },
        {
            "id": "post_execution", "order": 9, "title": "Push to External Systems",
            "persona": "erp_system", "product": "IAM Platform",
            "description": f"Executed contract metadata pushed to {erp} and agency contract repository.",
            "actions": [f"POST metadata to {erp} API", "Update vendor registry", "Sync CLM obligations", "Publish to contract register"],
            "api": {"method": "POST", "path": f"/webhook/contract-executed → {erp}", "desc": "Connect webhook → ERP sync"},
        },
    ]
    return steps


def build_scenario(profile, scenario_type):
    abbr = profile["abbr"]
    fp = profile["first_party"]
    tp = profile["third_party"]
    st = profile["state"]

    if abbr == "CA":
        base = copy.deepcopy(THIRD_PARTY_SCENARIO if scenario_type == "third_party" else FIRST_PARTY_SCENARIO)
        doc = base["document"]
        base["steps"] = enrich_steps(
            base["steps"], doc.get("value", fp["value"]),
            doc.get("vendor", fp["vendor"]), st,
        )
        return base

    if scenario_type == "first_party":
        return {
            "id": "first_party",
            "title": f"First-Party — {fp['agency']} IT Agreement",
            "subtitle": (
                f"{profile['it_authority']} initiates a {fp['template']} for {fp['use_case']}, "
                f"routed through {profile['procurement']}, Legal, vendor negotiation, and signature."
            ),
            "document": {
                "type": fp["doc_type"],
                "template": fp["template"],
                "value": fp["value"],
                "term": fp["term"],
                "vendor": fp["vendor"],
                "agency": fp["agency"],
                "solicitation": fp["solicitation"],
                "use_case": fp["use_case"],
            },
            "prefill_source": {
                "system": f"{_erp_short(profile)} + State Vendor Registry",
                "fields": [
                    {"field": "Vendor Legal Name", "value": fp["vendor"], "source": f"Vendor Registry — {abbr}"},
                    {"field": "Contract Amount", "value": fp["value"], "source": f"{_erp_short(profile)} Budget Line"},
                    {"field": "Program Manager", "value": "Assigned PM", "source": f"{profile.get('hris', 'State HRIS')}"},
                    {"field": "Use Case", "value": fp["use_case"], "source": f"{profile['it_authority']} Project DB"},
                    {"field": "Solicitation", "value": fp["solicitation"], "source": profile["procurement"]},
                ],
            },
            "steps": enrich_steps(
            _build_steps(profile, fp, tp, "first_party"),
            fp["value"], fp["vendor"], st,
        ),
        }

    return {
        "id": "third_party",
        "title": f"Third-Party — {tp['agency']} Vendor Paper",
        "subtitle": (
            f"{tp['vendor']} submits standard agreement for {tp['use_case']}. "
            f"{profile['procurement']} and Legal review against {st} pre-approved language."
        ),
        "document": {
            "type": tp["doc_type"],
            "template": tp["template"],
            "value": tp["value"],
            "term": tp["term"],
            "vendor": tp["vendor"],
            "agency": tp["agency"],
            "solicitation": tp["solicitation"],
            "use_case": tp["use_case"],
        },
        "prefill_source": {
            "system": "Vendor Portal + CLM Intake Queue",
            "fields": [
                {"field": "Vendor Name", "value": tp["vendor"], "source": "Vendor self-registration portal"},
                {"field": "Document Type", "value": tp["doc_type"], "source": "AI document classification"},
                {"field": "Annual Value", "value": tp["value"], "source": "Vendor proposal attachment"},
                {"field": "Use Case", "value": tp["use_case"], "source": "CLM intake form"},
                {"field": "Agency", "value": tp["agency"], "source": profile["procurement"]},
            ],
        },
        "steps": enrich_steps(
            _build_steps(profile, fp, tp, "third_party"),
            tp["value"], tp["vendor"], st,
        ),
    }


def get_state_package(abbr):
    profile = get_profile(abbr)
    return {
        "abbr": profile["abbr"],
        "context": build_context(profile),
        "personas": build_personas(profile),
        "clauses": build_clauses(profile),
        "first_party": build_scenario(profile, "first_party"),
        "third_party": build_scenario(profile, "third_party"),
        "scorecards": {
            "first_party": _scorecard_for_state(profile, "first_party"),
            "third_party": _scorecard_for_state(profile, "third_party"),
        },
        "use_cases": {
            "first_party": profile["first_party"],
            "third_party": profile["third_party"],
        },
        "executive_threshold": EXECUTIVE_THRESHOLD,
    }
