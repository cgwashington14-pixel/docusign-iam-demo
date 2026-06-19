"""
California state agency contract workflow scenarios for the Gov Portal demo.
Hypothetical walkthroughs — illustrative, not live API integrations.
"""

CA_AGENCY_CONTEXT = {
    "state": "California",
    "flag": "CA",
    "erp": "FI$Cal (Financial Information System for California)",
    "hris": "Workday HCM (State HR)",
    "procurement": "Department of General Services (DGS)",
    "it_authority": "California Department of Technology (CDT)",
    "legal": "Department of Justice — delegated agency counsel",
    "standards": [
        "DGS STD 213 — IT Goods & Services Master Agreement",
        "CalGov Code §§ 19130–19134 — personal services contracts",
        "Gov Code § 927.8 — insurance requirements",
        "Labor Code § 1770 — prevailing wage (construction)",
        "Public Contract Code — competitive bidding thresholds",
        "CCPA / CPRA — data privacy & public records",
    ],
}

CUSTOMIZABLE_CLAUSES = [
    {
        "id": "indemnification",
        "label": "Indemnification",
        "ca_standard": "Mutual indemnification per DGS STD 213 §8; agency not liable for vendor negligence",
        "customizable": True,
        "risk_if_deviated": "High",
    },
    {
        "id": "limitation_liability",
        "label": "Limitation of Liability",
        "ca_standard": "Cap at contract value or 12 months fees; no cap on IP infringement or confidentiality breach",
        "customizable": True,
        "risk_if_deviated": "High",
    },
    {
        "id": "data_residency",
        "label": "Data Residency & Security",
        "ca_standard": "Data stored in U.S.; SOC 2 Type II; CJIS-aligned for law enforcement data; breach notification per CA Civ Code §1798.82",
        "customizable": True,
        "risk_if_deviated": "Critical",
    },
    {
        "id": "prevailing_wage",
        "label": "Prevailing Wage (Construction)",
        "ca_standard": "Labor Code §1770 compliance; certified payroll records; DIR registration",
        "customizable": False,
        "risk_if_deviated": "Critical",
    },
    {
        "id": "termination",
        "label": "Termination for Convenience",
        "ca_standard": "Agency may terminate with 30 days notice; pro-rata payment for accepted deliverables",
        "customizable": True,
        "risk_if_deviated": "Medium",
    },
    {
        "id": "audit_rights",
        "label": "Audit & Records Retention",
        "ca_standard": "State Auditor access; 7-year retention per CalGov Code; CPRA-compliant",
        "customizable": False,
        "risk_if_deviated": "High",
    },
    {
        "id": "ip_ownership",
        "label": "Intellectual Property",
        "ca_standard": "Work product owned by State; vendor retains pre-existing IP with license grant",
        "customizable": True,
        "risk_if_deviated": "Medium",
    },
    {
        "id": "anti_lobbying",
        "label": "Anti-Lobbying Certification",
        "ca_standard": "Required per Public Contract Code §2010; Form STD 204 included",
        "customizable": False,
        "risk_if_deviated": "Critical",
    },
]

PERSONAS = {
    "program_manager": {
        "name": "Maria Santos",
        "title": "IT Program Manager",
        "dept": "California Department of Technology",
        "icon": "PM",
        "color": "indigo",
    },
    "contracts": {
        "name": "James Chen",
        "title": "Senior Contract Analyst",
        "dept": "DGS — Procurement Division",
        "icon": "CT",
        "color": "sky",
    },
    "legal": {
        "name": "Patricia Okonkwo",
        "title": "Deputy Attorney General (Delegated)",
        "dept": "Agency Legal Office",
        "icon": "LG",
        "color": "amber",
    },
    "vendor": {
        "name": "David Park",
        "title": "Account Executive",
        "dept": "Acme Cloud Solutions, Inc.",
        "icon": "VD",
        "color": "slate",
    },
    "signer": {
        "name": "Director Rebecca Alvarez",
        "title": "Department Director / Authorized Signer",
        "dept": "California [Agency Name]",
        "icon": "SG",
        "color": "green",
    },
    "erp_system": {
        "name": "FI$Cal",
        "title": "System of Record",
        "dept": "State Controller's Office",
        "icon": "ERP",
        "color": "muted",
    },
}

FIRST_PARTY_SCENARIO = {
    "id": "first_party",
    "title": "First-Party — Agency-Generated IT Master Agreement",
    "subtitle": "CDT initiates a DGS STD 213 MSA with custom SOW clauses, routed through Contracts, Legal, vendor negotiation, and signature.",
    "document": {
        "type": "Master Services Agreement + Statement of Work",
        "template": "DGS STD 213 — IT Goods & Services MSA",
        "value": "$2,400,000",
        "term": "3 years + two 1-year options",
        "vendor": "Acme Cloud Solutions, Inc.",
        "agency": "California Department of Technology",
        "solicitation": "RFO-CDT-2026-0142",
    },
    "prefill_source": {
        "system": "FI$Cal + SRM (Supplier Relationship Management)",
        "fields": [
            {"field": "Vendor Legal Name", "value": "Acme Cloud Solutions, Inc.", "source": "SRM Vendor ID 0048217"},
            {"field": "Contract Amount", "value": "$2,400,000", "source": "FI$Cal Budget Line 3100-IT-042"},
            {"field": "Program Manager", "value": "Maria Santos", "source": "Workday HCM — Employee ID 882104"},
            {"field": "Appropriation", "value": "3100-001-042", "source": "FI$Cal Appropriation Table"},
            {"field": "SOW Deliverables", "value": "Cloud migration Phase II", "source": "CDT Project Portfolio DB"},
        ],
    },
    "steps": [
        {
            "id": "initiate",
            "order": 1,
            "title": "Initiate from System of Record",
            "persona": "program_manager",
            "product": "CLM",
            "description": "Program Manager pulls vendor, budget, and project data from FI$Cal and SRM. DocuSign CLM generates the MSA from the DGS STD 213 template with SOW-specific clauses pre-populated.",
            "actions": ["Query FI$Cal for budget authority", "Pull vendor profile from SRM", "Select DGS STD 213 template", "Merge SOW deliverables from project DB"],
            "api": {
                "method": "POST",
                "path": "/clm/v2/contracts",
                "desc": "Create contract from template with ERP pre-fill",
            },
        },
        {
            "id": "generate",
            "order": 2,
            "title": "Generate Document with Custom Clauses",
            "persona": "program_manager",
            "product": "CLM",
            "description": "CLM assembles the agreement with California-mandatory clauses (prevailing wage attestation, anti-lobbying, insurance per Gov Code §927.8) plus customizable SOW terms for cloud services scope.",
            "actions": ["Insert mandatory CA clauses", "Add SOW pricing schedule", "Attach STD 204 anti-lobbying cert", "Set data residency requirements"],
            "clauses_highlighted": ["data_residency", "indemnification", "ip_ownership", "termination"],
        },
        {
            "id": "contracts_review",
            "order": 3,
            "title": "Contracts Team Review",
            "persona": "contracts",
            "product": "CLM",
            "description": "DGS Contracts validates budget authority, confirms competitive process (RFO-CDT-2026-0142), and checks clause completeness against the agency's approved playbook.",
            "actions": ["Verify FI$Cal encumbrance", "Confirm RFO compliance", "Review clause checklist", "Assign risk tier: Tier 2 IT"],
        },
        {
            "id": "legal_review",
            "order": 4,
            "title": "Legal Review",
            "persona": "legal",
            "product": "CLM",
            "description": "Delegated agency counsel reviews indemnification, liability caps, and data privacy against California Standard Terms and DGS STD 213. Iris flags are resolved; counsel assigns the next approver via hub-and-spoke routing.",
            "actions": ["Run AI clause analysis", "Review Article 8 Indemnification", "Validate CCPA/CPRA data terms", "Approve or request redlines"],
            "ai_review": True,
        },
        {
            "id": "external_review",
            "order": 5,
            "title": "External Vendor Review",
            "persona": "vendor",
            "product": "IAM",
            "description": "Agreement is shared with Acme Cloud via DocuSign Workspace. Vendor reviews terms, proposes redlines to limitation of liability and SLA credits.",
            "actions": ["Vendor receives Workspace invite", "Reviews MSA + SOW", "Proposes redlines on Article 6 Liability", "Submits counter-proposal"],
            "api": {
                "method": "POST",
                "path": "/restapi/v2.1/accounts/{id}/workspaces",
                "desc": "Create collaborative review workspace",
            },
        },
        {
            "id": "negotiation",
            "order": 6,
            "title": "Negotiation & Redline Merge",
            "persona": "contracts",
            "product": "CLM",
            "description": "Contracts and Legal negotiate vendor redlines in CLM. Version comparison shows changes against the pre-approved CA language baseline.",
            "actions": ["Compare v1.0 vs v1.1 redlines", "Accept liability cap modification", "Reject data residency change", "Merge approved changes"],
        },
        {
            "id": "contracts_final",
            "order": 7,
            "title": "Contracts Final Approval",
            "persona": "contracts",
            "product": "CLM",
            "description": "Final package approved. Obligation dates, renewal triggers, and insurance certificate deadlines are captured for lifecycle management.",
            "actions": ["Final clause sign-off", "Set obligation calendar", "Prepare signature packet", "Notify authorized signer"],
        },
        {
            "id": "signature",
            "order": 8,
            "title": "Authorized Signature",
            "persona": "signer",
            "product": "IAM",
            "description": "Director signs via DocuSign eSignature. Counter-signature routed to vendor. Completed agreement stored in Agreement Manager with AI-extracted metadata.",
            "actions": ["Send for eSignature", "Director signs", "Vendor counter-signs", "Store in Agreement Manager"],
            "api": {
                "method": "POST",
                "path": "/restapi/v2.1/accounts/{id}/envelopes",
                "desc": "Send final agreement for signature",
            },
        },
        {
            "id": "post_execution",
            "order": 9,
            "title": "Push to External Systems",
            "persona": "erp_system",
            "product": "IAM Platform",
            "description": "Executed contract metadata, obligations, and encumbrance details pushed back to FI$Cal. Agreement provisions synced to ERP and agency contract repository.",
            "actions": ["POST contract metadata to FI$Cal API", "Update SRM vendor status", "Sync obligations to CLM calendar", "Publish to agency contract register"],
            "api": {
                "method": "POST",
                "path": "/webhook/contract-executed → FI$Cal encumbrance API",
                "desc": "Connect webhook pushes execution data to ERP",
            },
        },
    ],
}

THIRD_PARTY_SCENARIO = {
    "id": "third_party",
    "title": "Third-Party — Vendor Paper Intake & Negotiation",
    "subtitle": "A SaaS vendor submits their standard agreement. Contracts and Legal review against CA pre-approved language, negotiate, and execute.",
    "document": {
        "type": "Vendor SaaS Subscription Agreement (Vendor Paper)",
        "template": "Third-party paper — not agency template",
        "value": "$890,000 / year",
        "term": "3 years auto-renew",
        "vendor": "TechVista Analytics, Inc.",
        "agency": "California Employment Development Department (EDD)",
        "solicitation": "Informal — under PCC §19130 threshold",
    },
    "prefill_source": {
        "system": "Vendor Portal + CLM Intake Queue",
        "fields": [
            {"field": "Vendor Name", "value": "TechVista Analytics, Inc.", "source": "Vendor self-registration portal"},
            {"field": "Document Type", "value": "SaaS Subscription Agreement", "source": "AI document classification"},
            {"field": "Annual Value", "value": "$890,000", "source": "Vendor proposal attachment"},
            {"field": "Business Owner", "value": "EDD Analytics Division", "source": "CLM intake form"},
            {"field": "Existing Vendor", "value": "No — new vendor", "source": "SRM lookup — no match"},
        ],
    },
    "steps": [
        {
            "id": "intake",
            "order": 1,
            "title": "Vendor Document Intake",
            "persona": "vendor",
            "product": "CLM",
            "description": "TechVista submits their SaaS agreement through the agency vendor portal. CLM AI classifies the document, extracts key terms, and routes to the Contracts queue.",
            "actions": ["Vendor uploads PDF via portal", "AI classifies: SaaS Agreement", "Extract parties, term, value", "Route to Contracts queue"],
            "api": {
                "method": "POST",
                "path": "/clm/v2/documents/intake",
                "desc": "Ingest third-party paper",
            },
        },
        {
            "id": "ai_scorecard",
            "order": 2,
            "title": "AI-Assisted Review Scorecard",
            "persona": "contracts",
            "product": "IAM",
            "description": "Agreement Manager AI compares vendor paper against the agency's pre-approved California Standard Terms library. Scorecard highlights deviations requiring negotiation or legal review.",
            "actions": ["Run AI clause extraction", "Compare to CA Standard Terms", "Generate risk scorecard", "Flag 4 critical deviations"],
            "ai_review": True,
        },
        {
            "id": "contracts_triage",
            "order": 3,
            "title": "Contracts Team Triage",
            "persona": "contracts",
            "product": "CLM",
            "description": "Contracts analyst reviews AI scorecard, assigns priority, and determines whether the vendor paper can be adapted or must be replaced with agency template.",
            "actions": ["Review AI scorecard (72/100)", "Assign Contract Analyst", "Decision: negotiate vendor paper", "Set 10-day review SLA"],
        },
        {
            "id": "legal_review",
            "order": 4,
            "title": "Legal Risk Assessment",
            "persona": "legal",
            "product": "CLM",
            "description": "Legal reviews AI-flagged clauses: unlimited liability, non-US data storage, and unilateral auto-renewal. Recommends mandatory redlines before execution.",
            "actions": ["Review 4 critical flags", "Draft mandatory redlines", "Require US data residency", "Cap liability at contract value"],
            "ai_review": True,
        },
        {
            "id": "negotiation_out",
            "order": 5,
            "title": "Send for Negotiation",
            "persona": "contracts",
            "product": "IAM Platform",
            "description": "Agency redlines sent to TechVista via CLM negotiation workflow. Workspace enables real-time comment threads on specific clauses.",
            "actions": ["Generate redline package", "Send via CLM negotiation", "Vendor receives redline v1", "Track response deadline"],
            "api": {
                "method": "PUT",
                "path": "/clm/v2/contracts/{id}/versions",
                "desc": "Upload agency redline version",
            },
        },
        {
            "id": "negotiation_return",
            "order": 6,
            "title": "Vendor Counter & Resolution",
            "persona": "vendor",
            "product": "CLM",
            "description": "Vendor accepts data residency and liability cap changes but counters on SLA credits. Contracts resolves remaining items and Legal gives final clearance.",
            "actions": ["Vendor counter-proposal received", "Accept SLA compromise", "Legal final clearance", "Mark negotiation complete"],
        },
        {
            "id": "contracts_approval",
            "order": 7,
            "title": "Contracts Final Approval",
            "persona": "contracts",
            "product": "CLM",
            "description": "Final negotiated agreement approved. Insurance certificates and SOC 2 report verified. Signature packet prepared.",
            "actions": ["Verify COI on file", "Confirm SOC 2 Type II", "Final approval in CLM", "Route to signer"],
        },
        {
            "id": "signature",
            "order": 8,
            "title": "Dual Signature Execution",
            "persona": "signer",
            "product": "IAM",
            "description": "EDD Director and TechVista VP sign via DocuSign. Agreement stored with full audit trail and AI-extracted obligations.",
            "actions": ["Agency signer executes", "Vendor counter-signs", "Audit trail captured", "Agreement archived"],
            "api": {
                "method": "POST",
                "path": "/restapi/v2.1/accounts/{id}/envelopes",
                "desc": "Execute dual-signature envelope",
            },
        },
        {
            "id": "post_execution",
            "order": 9,
            "title": "Sync to Systems of Record",
            "persona": "erp_system",
            "product": "IAM Platform",
            "description": "Contract value, renewal date, and key obligations pushed to FI$Cal and the agency's SQL contract repository. Connect webhook notifies downstream systems.",
            "actions": ["Encumber $890K in FI$Cal", "Set renewal alert (3 yr)", "Sync to SQL contract DB", "Notify business owner"],
            "api": {
                "method": "POST",
                "path": "Connect webhook → agency SQL + FI$Cal",
                "desc": "Post-execution system sync",
            },
        },
    ],
}

SOLICITATION_SCENARIO = {
    "id": "solicitation",
    "title": "Solicitation — Competitive RFO to Award",
    "subtitle": "CDT publishes an IT services RFO, collects vendor proposals via Web Forms, evaluates offers, and awards to the top-ranked vendor — then generates and executes the contract in IAM.",
    "document": {
        "type": "Request for Offer (RFO) — IT Goods & Services",
        "template": "DGS RFO Template — IT Goods & Services",
        "value": "$2,400,000 (estimated)",
        "term": "3 years + two 1-year options",
        "vendor": "Acme Cloud Solutions, Inc.",
        "agency": "California Department of Technology (CDT)",
        "solicitation": "RFO-CDT-2026-0142",
        "use_case": "Enterprise cloud infrastructure modernization — Phase II",
        "bid_count": 3,
        "due_date": "July 15, 2026",
    },
    "prefill_source": {
        "system": "Cal eProcure + DocuSign Web Forms + FI$Cal",
        "fields": [
            {"field": "Solicitation ID", "value": "RFO-CDT-2026-0142", "source": "Cal eProcure / CDT procurement"},
            {"field": "Estimated Value", "value": "$2,400,000", "source": "FI$Cal Budget Line 3100-IT-042"},
            {"field": "Proposal Due", "value": "July 15, 2026 · 2:00 PM PT", "source": "Published RFO schedule"},
            {"field": "Evaluation Model", "value": "Best value (70% technical / 30% cost)", "source": "CDT IT procurement playbook"},
            {"field": "Recommended Awardee", "value": "Acme Cloud Solutions, Inc.", "source": "Evaluation committee — Rank #1"},
        ],
    },
    "steps": [
        {
            "id": "sol_publish",
            "order": 1,
            "title": "Publish Solicitation",
            "persona": "program_manager",
            "product": "IAM",
            "description": "CDT publishes RFO-CDT-2026-0142 to Cal eProcure and deploys a DocuSign Web Form for vendor Q&A registration. Mandatory clauses and DGS STD 213 terms are attached as exhibits.",
            "actions": [
                "Post notice to Cal eProcure",
                "Publish Web Form for vendor registration",
                "Attach DGS STD 213 baseline terms",
                "Set proposal due date & protest window",
            ],
            "api": {
                "method": "POST",
                "path": "/forms/{id}/instances",
                "desc": "Create vendor registration Web Form instance",
            },
        },
        {
            "id": "sol_register",
            "order": 2,
            "title": "Vendor Registration & Q&A",
            "persona": "vendor",
            "product": "IAM",
            "description": "Vendors register through the Web Form portal. IAM tracks registrants, distributes addenda, and logs Q&A responses for audit — 14 vendors registered, 3 intend to bid.",
            "actions": [
                "Vendor completes Web Form registration",
                "Agency publishes Addendum No. 1",
                "Q&A responses posted to all registrants",
                "Confirm 3 qualified bidders",
            ],
        },
        {
            "id": "sol_intake",
            "order": 3,
            "title": "Proposal Intake & Deadline",
            "persona": "contracts",
            "product": "IAM Platform",
            "description": "Proposals submitted through the vendor portal before the deadline. Agreement Desk queues responsive offers for evaluation — late submissions automatically rejected.",
            "actions": [
                "Monitor proposal deadline countdown",
                "Receive 3 responsive proposals",
                "Reject 1 late submission (timestamp logged)",
                "Route packages to evaluation committee",
            ],
            "api": {
                "method": "POST",
                "path": "/clm/v2/documents/intake",
                "desc": "Ingest proposal packages into evaluation queue",
            },
        },
        {
            "id": "sol_evaluation",
            "order": 4,
            "title": "Evaluation & Scoring",
            "persona": "contracts",
            "product": "IAM Platform",
            "description": "Evaluation committee scores technical approach, cost, and past performance. Iris summarizes proposal compliance against RFO mandatory requirements. Acme Cloud ranks #1 with 94/100.",
            "actions": [
                "Score technical approach (70%)",
                "Normalize cost proposals (30%)",
                "Run Iris compliance check on mandatory terms",
                "Draft evaluation summary & ranking",
            ],
            "ai_review": True,
        },
        {
            "id": "legal_review",
            "order": 5,
            "title": "Legal & Protest Review",
            "persona": "legal",
            "product": "IAM Platform",
            "description": "Delegated agency counsel reviews the draft contract terms, protest window, and STD 204 certifications. Confirms award documentation meets Public Contract Code requirements.",
            "actions": [
                "Review protest period status (5-day window)",
                "Validate anti-lobbying / STD 204 certs",
                "Confirm DGS STD 213 terms in award package",
                "Clear for intent-to-award notice",
            ],
            "ai_review": True,
        },
        {
            "id": "sol_award",
            "order": 6,
            "title": "Award Recommendation",
            "persona": "contracts",
            "product": "IAM Platform",
            "description": "Contracts publishes intent-to-award to Acme Cloud Solutions. FI$Cal encumbrance validated. Route to contract generation upon protest period close.",
            "actions": [
                "Publish intent-to-award notice",
                "Notify unsuccessful bidders",
                "Verify FI$Cal budget encumbrance",
                "Trigger contract generation workflow",
            ],
        },
        {
            "id": "generate",
            "order": 7,
            "title": "Generate Contract from Award",
            "persona": "program_manager",
            "product": "IAM Platform",
            "description": "IAM merges the winning proposal, RFO terms, and DGS STD 213 MSA template into an executable contract — pre-filling vendor, amount, and SOW from the evaluation record.",
            "actions": [
                "Merge award record into DGS STD 213 MSA",
                "Insert SOW from winning proposal",
                "Attach evaluation summary to contract file",
                "Route to Contracts final review",
            ],
            "clauses_highlighted": ["data_residency", "indemnification", "ip_ownership", "termination"],
        },
        {
            "id": "signature",
            "order": 8,
            "title": "Contract Execution",
            "persona": "signer",
            "product": "IAM",
            "description": "CDT Director and Acme Cloud execute the awarded contract via DocuSign eSignature. Full audit trail links back to RFO-CDT-2026-0142 and evaluation record.",
            "actions": ["Send for eSignature", "Agency signer executes", "Vendor counter-signs", "Archive in Agreement Manager"],
            "api": {"method": "POST", "path": "/restapi/v2.1/accounts/{id}/envelopes", "desc": "Execute awarded contract"},
        },
        {
            "id": "post_execution",
            "order": 9,
            "title": "Award Sync to Systems",
            "persona": "erp_system",
            "product": "IAM Platform",
            "description": "Executed contract, award ID, and vendor master record sync to FI$Cal and Cal eProcure. Agreement Manager captures obligations and renewal dates.",
            "actions": [
                "POST award metadata to FI$Cal",
                "Update Cal eProcure contract record",
                "Sync obligations to Agreement Manager",
                "Publish to agency contract register",
            ],
            "api": {"method": "POST", "path": "/webhook/contract-executed → FI$Cal", "desc": "Connect webhook → ERP + eProcure"},
        },
    ],
}

AI_SCORECARD_SAMPLE = {
    "first_party": {
        "overall_score": 94,
        "grade": "A",
        "summary": "Agency-generated document using DGS STD 213 template. All mandatory California clauses present. Minor deviation in SLA credits — within acceptable range.",
        "clauses": [
            {"name": "Indemnification", "status": "pass", "score": 100, "note": "Matches DGS STD 213 §8"},
            {"name": "Limitation of Liability", "status": "pass", "score": 95, "note": "Cap at contract value — compliant"},
            {"name": "Data Residency", "status": "pass", "score": 100, "note": "U.S. storage, SOC 2 required"},
            {"name": "Termination", "status": "warn", "score": 82, "note": "30-day convenience — vendor requested 60 days"},
            {"name": "IP Ownership", "status": "pass", "score": 98, "note": "Work product assigned to State"},
            {"name": "Anti-Lobbying", "status": "pass", "score": 100, "note": "STD 204 attached"},
            {"name": "Prevailing Wage", "status": "na", "score": None, "note": "N/A — IT services, not construction"},
            {"name": "Audit Rights", "status": "pass", "score": 100, "note": "CalGov Code compliant"},
        ],
    },
    "third_party": {
        "overall_score": 72,
        "grade": "C+",
        "summary": "Vendor paper deviates from CA Standard Terms in 4 critical areas. Legal review required before negotiation. Recommend mandatory redlines on liability, data residency, and auto-renewal.",
        "clauses": [
            {"name": "Indemnification", "status": "fail", "score": 45, "note": "One-way vendor favor — must revise"},
            {"name": "Limitation of Liability", "status": "fail", "score": 30, "note": "Unlimited vendor liability — non-compliant"},
            {"name": "Data Residency", "status": "fail", "score": 20, "note": "Non-US storage permitted — critical"},
            {"name": "Termination", "status": "warn", "score": 65, "note": "Auto-renew without agency opt-out"},
            {"name": "IP Ownership", "status": "warn", "score": 70, "note": "Vendor retains all derivatives"},
            {"name": "Anti-Lobbying", "status": "fail", "score": 0, "note": "Missing STD 204 certification"},
            {"name": "Prevailing Wage", "status": "na", "score": None, "note": "N/A — SaaS agreement"},
            {"name": "Audit Rights", "status": "pass", "score": 88, "note": "Acceptable with minor edits"},
        ],
    },
    "solicitation": {
        "overall_score": 94,
        "grade": "A",
        "summary": "Acme Cloud Solutions ranked #1 of 3 responsive offers for RFO-CDT-2026-0142. Best-value score 94/100 — recommended for award pending protest window.",
        "clauses": [
            {"name": "Technical Approach", "status": "pass", "score": 96, "note": "Acme Cloud — exceeds mandatory requirements"},
            {"name": "Cost / Price", "status": "pass", "score": 91, "note": "Lowest responsive offer — 30% weight"},
            {"name": "Past Performance", "status": "pass", "score": 94, "note": "3 comparable state cloud projects"},
            {"name": "Mandatory Terms", "status": "pass", "score": 98, "note": "DGS STD 213 terms accepted without deviation"},
            {"name": "Security / SOC 2", "status": "pass", "score": 100, "note": "SOC 2 Type II attestation on file"},
            {"name": "STD 204 Certification", "status": "pass", "score": 100, "note": "Anti-lobbying cert included"},
            {"name": "Small Business", "status": "na", "score": None, "note": "N/A — offeror not SB-certified"},
            {"name": "Local Preference", "status": "pass", "score": 88, "note": "CA business — preference applied"},
        ],
    },
}

IAM_ESSENTIALS_CAPABILITIES = [
    {"icon": "sign", "title": "eSignature", "desc": "Send, sign, and track documents — the execution layer within IAM."},
    {"icon": "desk", "title": "Agreement Desk", "desc": "Central intake hub — request, track, and route contract work from email or portal."},
    {"icon": "nav", "title": "Agreement Manager", "desc": "AI-powered repository — search, extract provisions, and analyze executed contracts."},
    {"icon": "webforms", "title": "Web Forms", "desc": "Digital intake for vendor registration, contract requests, and citizen applications."},
    {"icon": "maestro", "title": "Workflow Builder", "desc": "Automate routing for approval chains — department head → contracts → sign."},
    {"icon": "connect", "title": "Connect", "desc": "Real-time events to ERP, CRM, and agency systems when documents are sent or completed."},
]

CLM_CAPABILITIES = [
    {"icon": "template", "title": "Template & Clause Library", "desc": "DGS STD forms, CA mandatory clauses, and agency-specific playbooks with approved fallback language."},
    {"icon": "workflow", "title": "Multi-Stage Approval Workflows", "desc": "Contracts → Legal → Negotiation → Signature with parallel and conditional routing."},
    {"icon": "redline", "title": "Redline & Version Control", "desc": "Side-by-side comparison against pre-approved baseline; merge vendor counter-proposals."},
    {"icon": "obligations", "title": "Obligation Management", "desc": "Renewal dates, insurance renewals, audit deadlines, and SLA tracking post-execution."},
    {"icon": "erp", "title": "ERP / SOR Integration", "desc": "Bi-directional sync with FI$Cal, Workday, SQL databases, and agency contract registers."},
    {"icon": "ai", "title": "AI-Assisted Review", "desc": "Score vendor paper against CA Standard Terms; flag deviations before legal review."},
]

CONVERGENCE_POINTS = [
    {"from": "IAM Platform", "to": "IAM eSignature", "flow": "Approved contract package → signature envelope", "api": "POST /envelopes (from IAM workflow step)"},
    {"from": "IAM", "to": "IAM Platform", "flow": "Executed envelope → obligation record", "api": "Connect webhook → contract update"},
    {"from": "Agreement Manager", "to": "IAM Platform", "flow": "AI-extracted provisions → clause library enrichment", "api": "GET /agreements/{id} → metadata sync"},
    {"from": "IAM Platform", "to": "FI$Cal", "flow": "Encumbrance & contract value → state ERP", "api": "POST FI$Cal Contract API (via Connect)"},
    {"from": "ERP", "to": "IAM Platform", "flow": "Budget authority & vendor master → contract initiation", "api": "IAM ERP connector pre-fill"},
]

API_EXAMPLES = {
    "erp_prefill": {
        "title": "Pre-fill from FI$Cal (ERP)",
        "desc": "Pull vendor, budget, and approver data from the state system of record before generating the contract.",
        "request": """POST /clm/v2/contracts/from-template
Authorization: Bearer {token}
Content-Type: application/json

{
  "templateId": "dgs-std-213-msa",
  "externalSource": {
    "system": "FI$Cal",
    "lookupKey": "encumbrance_id",
    "lookupValue": "ENC-2026-CDT-0048217"
  },
  "fieldMapping": {
    "vendor_name": "{{erp.vendor_legal_name}}",
    "contract_amount": "{{erp.encumbered_amount}}",
    "appropriation": "{{erp.appropriation_code}}",
    "program_manager": "{{hris.employee_name}}",
    "start_date": "{{erp.fiscal_year_start}}"
  }
}""",
        "response": """{
  "contractId": "CTR-2026-0142",
  "status": "draft",
  "prefilledFields": 12,
  "source": "FI$Cal ENC-2026-CDT-0048217",
  "missingFields": []
}""",
    },
    "hris_prefill": {
        "title": "Pre-fill Signer from Workday (HRIS)",
        "desc": "Resolve authorized signer from HRIS based on department and dollar threshold.",
        "request": """POST /restapi/v2.1/accounts/{accountId}/envelopes
{
  "templateId": "hr-onboarding-bundle",
  "status": "sent",
  "templateRoles": [{
    "roleName": "Employee",
    "email": "{{hris.work_email}}",
    "name": "{{hris.full_name}}",
    "tabs": {
      "textTabs": [
        {"tabLabel": "Department", "value": "{{hris.dept_name}}"},
        {"tabLabel": "StartDate", "value": "{{hris.start_date}}"},
        {"tabLabel": "SalaryGrade", "value": "{{hris.salary_grade}}"}
      ]
    }
  }]
}""",
        "response": """{
  "envelopeId": "a1b2c3d4-...",
  "status": "sent",
  "prefillSource": "Workday HCM — Employee ID 882104"
}""",
    },
    "sql_prefill": {
        "title": "Pre-fill from Agency SQL Database",
        "desc": "Agency contract register or project database feeds CLM initiation via custom connector.",
        "request": """POST /clm/v2/contracts/from-template
{
  "templateId": "agency-sow-template",
  "externalSource": {
    "system": "AgencyContractDB",
    "connector": "sql-server-connector",
    "query": "SELECT vendor_id, project_name, budget FROM projects WHERE project_id = @id",
    "params": {"id": "PRJ-2026-0089"}
  }
}""",
        "response": """{
  "contractId": "CTR-2026-0089",
  "prefilledFields": 8,
  "source": "AgencyContractDB — PRJ-2026-0089"
}""",
    },
    "post_execution": {
        "title": "Push Executed Agreement to External Systems",
        "desc": "Connect webhook fires on envelope-completed; agency middleware pushes metadata to FI$Cal and contract register.",
        "request": """POST https://agency.ca.gov/api/contracts/sync
Authorization: Bearer {agency_service_token}
Content-Type: application/json

{
  "event": "envelope-completed",
  "envelopeId": "a1b2c3d4-...",
  "contractId": "CTR-2026-0142",
  "extractedMetadata": {
    "effective_date": "2026-07-01",
    "expiration_date": "2029-06-30",
    "total_value": 2400000,
    "vendor": "Acme Cloud Solutions, Inc.",
    "obligations": [
      {"type": "insurance_renewal", "due": "2027-07-01"},
      {"type": "annual_report", "due": "2027-06-30"}
    ]
  },
  "targetSystems": ["FI$Cal", "AgencyContractDB", "CLM"]
}""",
        "response": """{
  "synced": true,
  "fi_cal_encumbrance": "ENC-2026-CDT-0048217",
  "clm_obligations_created": 2,
  "contract_register_id": "REG-2026-4421"
}""",
    },
    "ai_review": {
        "title": "AI-Assisted Clause Review (Agreement Manager)",
        "desc": "Analyze uploaded vendor paper against the agency's pre-approved CA Standard Terms library.",
        "request": """POST /v1/accounts/{accountId}/agreements/analyze
{
  "documentBase64": "...",
  "compareAgainst": "ca-standard-terms-v2026",
  "extractProvisions": true,
  "scoreDeviations": true
}""",
        "response": """{
  "agreementId": "agr-882104",
  "overallScore": 72,
  "grade": "C+",
  "deviations": [
    {"clause": "Limitation of Liability", "severity": "critical", "score": 30},
    {"clause": "Data Residency", "severity": "critical", "score": 20}
  ],
  "provisions": {
    "effective_date": "2026-07-01",
    "parties": ["TechVista Analytics, Inc.", "State of California — EDD"],
    "governing_law": "Delaware"
  }
}""",
    },
}

SCENARIO_BUILDER_KEYWORDS = {
    "contracts": {"step": "Contracts Team Review", "persona": "contracts", "product": "CLM"},
    "legal": {"step": "Legal Review", "persona": "legal", "product": "CLM"},
    "negotiat": {"step": "Negotiation", "persona": "contracts", "product": "CLM"},
    "sign": {"step": "Signature", "persona": "signer", "product": "IAM"},
    "vendor": {"step": "Vendor Review", "persona": "vendor", "product": "IAM"},
    "erp": {"step": "ERP Sync", "persona": "erp_system", "product": "CLM"},
    "fi$cal": {"step": "FI$Cal Integration", "persona": "erp_system", "product": "CLM"},
    "workday": {"step": "HRIS Pre-fill", "persona": "program_manager", "product": "IAM"},
    "generate": {"step": "Document Generation", "persona": "program_manager", "product": "CLM"},
    "intake": {"step": "Document Intake", "persona": "vendor", "product": "CLM"},
    "ai": {"step": "AI Review Scorecard", "persona": "contracts", "product": "IAM"},
    "approval": {"step": "Approval Routing", "persona": "contracts", "product": "CLM"},
    "external": {"step": "External Review", "persona": "vendor", "product": "IAM"},
}


def get_scenario(scenario_id):
    if scenario_id == "third_party":
        return THIRD_PARTY_SCENARIO
    if scenario_id == "solicitation":
        return SOLICITATION_SCENARIO
    return FIRST_PARTY_SCENARIO


def get_all_scenarios():
    return [FIRST_PARTY_SCENARIO, THIRD_PARTY_SCENARIO, SOLICITATION_SCENARIO]


def generate_custom_scenario(description):
    """Parse free-text workflow description into IAM vs CLM paths."""
    desc_lower = description.lower()
    detected = []
    for keyword, meta in SCENARIO_BUILDER_KEYWORDS.items():
        if keyword in desc_lower:
            detected.append(meta)

    if not detected:
        detected = [
            {"step": "Document Generation", "persona": "program_manager", "product": "CLM"},
            {"step": "Contracts Review", "persona": "contracts", "product": "CLM"},
            {"step": "Legal Review", "persona": "legal", "product": "CLM"},
            {"step": "Signature", "persona": "signer", "product": "IAM"},
        ]

    # Deduplicate by step name
    seen = set()
    unique = []
    for d in detected:
        if d["step"] not in seen:
            seen.add(d["step"])
            unique.append(d)

    iam_steps = [s for s in unique if s["product"] == "IAM"]
    clm_steps = unique  # Full IAM platform path includes all steps

    return {
        "description": description,
        "detected_steps": unique,
        "iam_path": {
            "title": "IAM Essentials Path",
            "subtitle": "Intelligent Agreement Management for send-sign-analyze workflows — Iris AI review, Agreement Manager, and Connect webhooks.",
            "steps": iam_steps if iam_steps else [{"step": "eSignature", "persona": "signer", "product": "IAM"}],
            "products": ["IAM Essentials", "eSignature", "Agreement Manager", "Agreement Desk", "Connect"],
        },
        "clm_path": {
            "title": "IAM Platform Path",
            "subtitle": "Full Intelligent Agreement Management lifecycle — template generation, multi-party approval, negotiation, obligations, and ERP sync.",
            "steps": clm_steps,
            "products": ["IAM Platform", "CLM", "eSignature", "Agreement Manager", "Connect", "ERP Connector"],
        },
        "convergence_note": "Both paths converge at eSignature for execution. IAM Platform feeds the envelope; Connect webhooks push completed metadata back to CLM and your system of record.",
    }
