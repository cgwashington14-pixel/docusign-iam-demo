"""Curated presenter paths shown in the topbar "Demo paths" panel."""

from __future__ import annotations

DEMO_PATHS = [
    {
        "title": "SCView business briefing",
        "duration": "~10 min",
        "open": True,
        "steps": [
            {
                "href": "/?view=scv",
                "title": "SCView home",
                "note": "Plain-language guide on every page — link opens with SCView on",
            },
            {
                "href": "/gov-workflows?state=CA&view=scv&play=1",
                "title": "Gov Workflows",
                "note": "Auto-starts walkthrough when you press the link",
            },
            {"href": "/agreement-desk?view=scv", "title": "Agreement Desk", "note": "Intake queue in simple terms"},
            {"href": "/webhooks?view=scv", "title": "Connect finale", "note": "ERP sync — the payoff moment"},
        ],
    },
    {
        "title": "High-level guided tour",
        "duration": "~12 min",
        "open": False,
        "steps": [
            {"href": "/?view=hl", "title": "High-level home", "note": "Moment rail explains each step"},
            {
                "href": "/gov-workflows?state=CA&view=hl&play=1",
                "title": "CA walkthrough",
                "note": "Opens with High-level view and Play ready",
            },
            {"href": "/agreement-desk?view=hl", "title": "Agreement Desk", "note": "Notifications & audit trail"},
            {"href": "/embedded?prefill=permit&view=hl", "title": "Embedded signing moment", "note": ""},
        ],
    },
    {
        "title": "Executive briefing",
        "duration": "~15 min",
        "open": False,
        "steps": [
            {"href": "/?view=executive", "title": "Home — Executive View", "note": "Published win stories on home"},
            {
                "href": "/gov-workflows?state=CA&view=executive",
                "title": "Gov Workflows — CA",
                "note": "Picture storyboards — press Play to start",
            },
            {
                "href": "/agreement-desk?view=executive",
                "title": "Agreement Desk",
                "note": "Intake, audit trail, Iris AI",
            },
            {
                "href": "/embedded?prefill=permit&view=executive",
                "title": "Embedded signing",
                "note": "Citizen signs in portal",
            },
            {"href": "/navigator?view=executive", "title": "Insights dashboard", "note": "Portfolio & obligations"},
        ],
    },
    {
        "title": "Public-sector agents",
        "duration": "~12 min",
        "open": False,
        "steps": [
            {
                "href": "/gov-agents?play=1",
                "title": "Play the program",
                "note": "Housing Assistance — four lanes light up",
            },
            {
                "href": "/gov-agents?agent=hr",
                "title": "HR onboarding agent",
                "note": "CalHR packet · same as employee hire",
            },
            {
                "href": "/gov-agents?agent=procurement",
                "title": "Procurement agent",
                "note": "Hotel block · thresholds · FI$Cal",
            },
            {"href": "/gov-agents?agent=operations", "title": "Operations MOU agent", "note": "HCD · CalOES · county"},
            {
                "href": "/gov-agents?agent=constituent",
                "title": "Constituent agent",
                "note": "Resident Web Form → embedded sign",
            },
            {"href": "/webforms?sample=1", "title": "Live proof", "note": "Benefits form + HR packet"},
        ],
    },
    {
        "title": "CA integration story",
        "duration": "Session",
        "open": False,
        "steps": [
            {"href": "/integration-story", "title": "Integration story", "note": "SF · Microsoft · ServiceNow"},
            {"href": "/procurement-intake", "title": "Procurement & intake", "note": "Pre- / post-execution IAM"},
            {"href": "/envelopes/send?prefill=vendor", "title": "Pre-filled send", "note": "Record fields → envelope"},
            {"href": "/gov-workflows?state=CA", "title": "CA walkthrough", "note": "Lifecycle + FI$Cal sync"},
            {"href": "/agreement-desk", "title": "Agreement Desk + Iris", "note": "Extract → act"},
            {"href": "/webhooks", "title": "Connect write-back", "note": "Completed events home"},
        ],
    },
    {
        "title": "CLM + ERP story",
        "duration": "~20 min",
        "open": False,
        "steps": [
            {"href": "/gov-workflows?state=CA&view=consultant", "title": "First-party MSA walkthrough", "note": ""},
            {
                "href": "/gov-workflows?state=CA&scenario=third_party&view=consultant",
                "title": "Third-party vendor paper",
                "note": "",
            },
            {"href": "/workspaces?view=consultant", "title": "CA EDD vendor onboarding hub", "note": ""},
            {
                "href": "/gov-workflows?state=CA&tab=integrations&view=technical",
                "title": "ERP pre-fill patterns",
                "note": "Technical view for integration architects",
            },
        ],
    },
    {
        "title": "CLM workflow troubleshooting",
        "duration": "Workshop",
        "open": False,
        "steps": [
            {
                "href": "/clm-troubleshoot#lifecycle",
                "title": "Lifecycle 101",
                "note": "Request → approve → redline → remap",
            },
            {"href": "/clm-troubleshoot", "title": "Symptom wizard", "note": "Failed vs stuck vs false Complete"},
            {
                "href": "/clm-troubleshoot#attributes",
                "title": "Attributes & Params",
                "note": "Company, XML, Find Document refresh",
            },
            {"href": "/clm-troubleshoot#routing", "title": "Routing & errors", "note": "Decision, connectors, catalog"},
            {"href": "/clm-troubleshoot#escalate", "title": "Escalate", "note": "Admin vs developer vs Support"},
            {"href": "/workflow-discovery", "title": "Process map", "note": "If the issue is the business path"},
        ],
    },
    {
        "title": "Technical deep dive",
        "duration": "~45 min",
        "open": False,
        "steps": [
            {"href": "/envelopes/send?prefill=vendor&view=technical", "title": "Send envelope — live API", "note": ""},
            {"href": "/webforms?sample=1&view=technical", "title": "Web Forms pre-fill", "note": ""},
            {"href": "/maestro?view=technical", "title": "Workflow Builder AV1 trigger", "note": ""},
            {"href": "/explorer", "title": "API Explorer — live calls", "note": ""},
            {"href": "/webhooks", "title": "Connect webhook stream", "note": ""},
        ],
    },
]
