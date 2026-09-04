"""Plain-language admin dashboard data for non-technical site owners."""

from datetime import datetime

ADMIN_CAPABILITIES = [
    {
        "id": "auth",
        "icon": "🔐",
        "title": "Sign-in & sessions",
        "summary": "Keeps you logged in securely and refreshes your DocuSign access when needed.",
        "detail": "When you click Login with DocuSign, the server completes the OAuth handshake and stores a session — your browser never holds the full secret.",
    },
    {
        "id": "api",
        "icon": "📡",
        "title": "DocuSign API bridge",
        "summary": "Fetches live agreement data — envelopes, templates, web forms, workflows — on your behalf.",
        "detail": "Most demo tabs ask the server to call DocuSign, then the server builds the page with real data from your demo account.",
    },
    {
        "id": "webhooks",
        "icon": "🔔",
        "title": "Connect notifications",
        "summary": "Receives automatic status updates when agreements are sent, viewed, or signed.",
        "detail": "DocuSign pushes JSON messages to /webhook/receive. The Connect demo page shows what your ERP or case system would receive.",
    },
    {
        "id": "scenarios",
        "icon": "🗺",
        "title": "Gov workflow scenarios",
        "summary": "Serves state-specific contract stories, clauses, and personas for all 50 states.",
        "detail": "Gov Workflows content is assembled on the server from curated scenario packages — not hard-coded in the browser.",
    },
    {
        "id": "agent",
        "icon": "🤖",
        "title": "Agent orchestration",
        "summary": "Runs server-side flows that probe envelopes and agreement context for the Agent demo.",
        "detail": "The Agent tab uses backend routes to gather envelope details before presenting next-step options.",
    },
]

ADMIN_PAGE_CATALOG = [
    {
        "name": "Home",
        "path": "/",
        "category": "Overview",
        "you_see": "Launch pad with recent agreements and quick stats",
        "server_does": "Verifies login, pulls envelope counts and your five most recent agreements from DocuSign",
        "uses_docusign": True,
        "backend": "high",
    },
    {
        "name": "Templates",
        "path": "/envelopes",
        "category": "eSignature",
        "you_see": "List of reusable signature templates",
        "server_does": "Calls DocuSign to list templates in your account",
        "uses_docusign": True,
        "backend": "high",
    },
    {
        "name": "Send Envelope",
        "path": "/envelopes/send",
        "category": "eSignature",
        "you_see": "Prepare-and-send flow with product mock",
        "server_does": "Loads templates and can create/send envelopes through DocuSign when you submit",
        "uses_docusign": True,
        "backend": "high",
    },
    {
        "name": "Embedded Signing",
        "path": "/embedded",
        "category": "eSignature",
        "you_see": "Citizen signs inside your portal mock",
        "server_does": "Creates a signing session URL from DocuSign and handles the return callback",
        "uses_docusign": True,
        "backend": "high",
    },
    {
        "name": "Web Forms",
        "path": "/webforms",
        "category": "Automation",
        "you_see": "Digital intake forms and pre-fill demo",
        "server_does": "Lists forms and can launch form instances via DocuSign Web Forms API",
        "uses_docusign": True,
        "backend": "high",
    },
    {
        "name": "Workflow Builder",
        "path": "/maestro",
        "category": "Automation",
        "you_see": "Multi-step workflow automation mock",
        "server_does": "Fetches workflow definitions and can trigger workflow instances",
        "uses_docusign": True,
        "backend": "high",
    },
    {
        "name": "Agreement Desk",
        "path": "/agreement-desk",
        "category": "CLM",
        "you_see": "Intake queue and audit trail product mock",
        "server_does": "Delivers the page; most visuals are front-end demos with optional live data",
        "uses_docusign": False,
        "backend": "low",
    },
    {
        "name": "Navigator",
        "path": "/navigator",
        "category": "CLM",
        "you_see": "Portfolio and obligations insights mock",
        "server_does": "Delivers the page; insights are illustrative unless connected to live Navigator data",
        "uses_docusign": False,
        "backend": "low",
    },
    {
        "name": "Workspaces",
        "path": "/workspaces",
        "category": "CLM",
        "you_see": "Shared vendor collaboration hub",
        "server_does": "Can list and create workspaces through DocuSign API when authenticated",
        "uses_docusign": True,
        "backend": "medium",
    },
    {
        "name": "Gov Workflows",
        "path": "/gov-workflows",
        "category": "CLM",
        "you_see": "State contract lifecycle walkthroughs",
        "server_does": "Loads state-specific scenarios, clauses, and personas; optional live signing",
        "uses_docusign": True,
        "backend": "high",
    },
    {
        "name": "Connect / Webhooks",
        "path": "/webhooks",
        "category": "Integration",
        "you_see": "Real-time ERP sync story and event log",
        "server_does": "Lists Connect configs from DocuSign and displays messages received at the webhook endpoint",
        "uses_docusign": True,
        "backend": "high",
    },
    {
        "name": "API Explorer",
        "path": "/explorer",
        "category": "Integration",
        "you_see": "Browse and run DocuSign REST calls",
        "server_does": "Proxies your selected API call to DocuSign and returns the live response",
        "uses_docusign": True,
        "backend": "high",
    },
    {
        "name": "Workflow Discovery",
        "path": "/workflow-discovery",
        "category": "Discovery",
        "you_see": "Animated process maps for workshops",
        "server_does": "Delivers the page only — diagrams and narration run entirely in your browser",
        "uses_docusign": False,
        "backend": "none",
    },
    {
        "name": "CLM Troubleshoot",
        "path": "/clm-troubleshoot",
        "category": "Discovery",
        "you_see": "CLM / SpringCM workflow failure playbook",
        "server_does": "Delivers the page only — search and the symptom wizard run in the browser",
        "uses_docusign": False,
        "backend": "none",
    },
    {
        "name": "Agent",
        "path": "/agent",
        "category": "AI",
        "you_see": "AI agent agreement assistant mock",
        "server_does": "Loads recent envelopes and runs server flows to inspect agreement context",
        "uses_docusign": True,
        "backend": "high",
    },
]

EVENT_FRIENDLY = {
    "envelope-sent": "Agreement sent for signature",
    "envelope-delivered": "Signing link opened",
    "recipient-completed": "Signer completed their part",
    "envelope-completed": "Agreement fully executed",
    "envelope-declined": "Agreement declined",
    "envelope-voided": "Agreement voided",
}

BACKEND_LABELS = {
    "high": "Heavy server + DocuSign",
    "medium": "Some server calls",
    "low": "Mostly visual demo",
    "none": "Browser only",
}


def friendly_event_label(event_type):
    return EVENT_FRIENDLY.get(event_type, event_type.replace("-", " ").title())


def build_admin_status(token, session, config, ds_get_fn, webhook_events):
    """Build plain-language status for the admin dashboard."""
    oauth = bool(session.get("prefer_oauth") and session.get("access_token"))
    auth_label = "DocuSign login (OAuth)" if oauth else ("Service account (JWT)" if token else "Not signed in")
    auth_ok = bool(token)

    api_ok = False
    api_code = None
    envelope_hint = None
    if token:
        code, data = ds_get_fn("/envelopes?count=1&from_date=2024-01-01", token=token)
        api_ok = code == 200
        api_code = code
        if code == 200:
            total = data.get("totalSetSize")
            if total is not None:
                envelope_hint = f"{total} agreement(s) visible in this account"

    events = webhook_events[-8:] if webhook_events else []
    friendly_events = [
        {
            "when": e.get("received_at", ""),
            "label": friendly_event_label(e.get("event", "")),
            "status": e.get("status", ""),
            "id": e.get("envelope_id", "")[:8] + "…" if e.get("envelope_id") else "—",
        }
        for e in reversed(events)
    ]

    return {
        "auth_ok": auth_ok,
        "auth_label": auth_label,
        "user_display": session.get("user_email") or session.get("user_name") or ("Demo account" if token else "Guest"),
        "api_ok": api_ok,
        "api_code": api_code,
        "envelope_hint": envelope_hint,
        "environment": (session.get("base_uri") or config.BASE_URI or "").replace("https://", "") or "demo.docusign.net",
        "account_id": session.get("account_id") or config.ACCOUNT_ID or "—",
        "webhook_count": len(webhook_events) if webhook_events else 0,
        "recent_events": friendly_events,
        "checked_at": datetime.utcnow().strftime("%b %d, %Y · %I:%M %p UTC"),
    }
