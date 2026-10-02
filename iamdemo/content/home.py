"""Static copy and link data rendered on the home page (``templates/index.html``)."""

from __future__ import annotations

from typing import TypedDict


class Scenario(TypedDict):
    title: str
    summary: str
    badge: str
    icon: str
    href: str
    cta: str
    endpoint: str
    prefill: list[tuple[str, str]]


class Feature(TypedDict):
    title: str
    description: str
    icon: str
    href: str
    cta: str
    status: str  # live | plan | stream
    status_label: str
    method: str  # GET | POST | "" for a plain-text endpoint note
    endpoint: str


class ScriptStep(TypedDict):
    title: str
    note: str
    href: str


HERO_STEPS: tuple[tuple[str, str], ...] = (
    ("Sign in", "One-click Docusign OAuth"),
    ("Choose a scenario", "Pre-filled and ready to run"),
    ("Watch it execute", "Real API responses, instantly"),
)

COMPLIANCE_BADGES: tuple[str, ...] = (
    "FedRAMP Moderate",
    "Section 508",
    "SOC 2 Type II",
    "CJIS-aligned",
    "StateRAMP ready",
)

SCENARIOS: tuple[Scenario, ...] = (
    {
        "title": "Gov Agents · Housing Assistance",
        "summary": "One program — HR, procurement, operations, and resident intake agents.",
        "badge": "Iris agents",
        "icon": "agent",
        "href": "/gov-agents?play=1",
        "cta": "Play the program",
        "endpoint": "Agent Studio",
        "prefill": [
            ("Story", "HCD stands up HAP"),
            ("Agents", "Hire · buy · partner · serve"),
            ("Loop", "Intake → ground → act → monitor"),
        ],
    },
    {
        "title": "Vendor Contract",
        "summary": "Send a pre-filled MOU to a vendor for signature.",
        "badge": "Ready to send",
        "icon": "send",
        "href": "/envelopes/send?prefill=vendor",
        "cta": "Send now",
        "endpoint": "POST /envelopes",
        "prefill": [
            ("To", "vendor@acmecorp.gov"),
            ("Subject", "Q3 MOU — Acme Corp"),
            ("Type", "vendor_contract_template"),
        ],
    },
    {
        "title": "Permit Application",
        "summary": "Embedded signing — the citizen signs without leaving your portal.",
        "badge": "Ready to sign",
        "icon": "document",
        "href": "/embedded?prefill=permit",
        "cta": "Open signing",
        "endpoint": "POST /views/recipient",
        "prefill": [
            ("Signer", "Jane Smith"),
            ("Doc", "Building Permit #BP-2026-0441"),
            ("Return", "portal (no redirect)"),
        ],
    },
    {
        "title": "Benefits Enrollment",
        "summary": "Web form with constituent data pre-populated via case ID.",
        "badge": "Pre-filled form",
        "icon": "form",
        "href": "/webforms?sample=1",
        "cta": "Launch form",
        "endpoint": "POST /web_forms/instances",
        "prefill": [
            ("Applicant", "Robert Johnson"),
            ("Case ID", "CASE-2026-00981"),
            ("Program", "Housing Assistance"),
        ],
    },
    {
        "title": "HR Onboarding Packet",
        "summary": "Send a full onboarding bundle to a new city employee.",
        "badge": "Ready to send",
        "icon": "templates",
        "href": "/envelopes/send?prefill=hr",
        "cta": "Send packet",
        "endpoint": "POST /envelopes",
        "prefill": [
            ("Employee", "Marcus Williams"),
            ("Dept", "Public Works"),
            ("Start", "June 16, 2026"),
        ],
    },
    {
        "title": "Gov Contract Lifecycle",
        "summary": "Auto-play workflows for all 50 states — Intelligent Agreement Management.",
        "badge": "Walkthrough",
        "icon": "calendar",
        "href": "/gov-workflows?state=CA",
        "cta": "Start walkthrough",
        "endpoint": "50 states",
        "prefill": [
            ("Default", "California (CA)"),
            ("States", "50 · agency-specific use cases"),
            ("Demo", "First-party & third-party"),
        ],
    },
    {
        "title": "CA Integration Story",
        "summary": "Salesforce, Microsoft, ServiceNow — record → envelope → write-back.",
        "badge": "Presentation",
        "icon": "bolt",
        "href": "/integration-story",
        "cta": "Open story",
        "endpoint": "Customer-ready",
        "prefill": [
            ("Audience", "California agencies"),
            ("Focus", "SF · SharePoint · Power Apps · SN"),
            ("Pattern", "Record → envelope → record"),
        ],
    },
    {
        "title": "Procurement & Intake",
        "summary": "IAM pre- and post-execution — intake, triage, approvals, unlock data.",
        "badge": "Presentation",
        "icon": "clipboard",
        "href": "/procurement-intake",
        "cta": "Open story",
        "endpoint": "Customer-ready",
        "prefill": [
            ("Audience", "Procurement · legal · intake"),
            ("Focus", "Lifecycle · audit trail · connective tissue"),
            ("Pattern", "Request → approval → obligation"),
        ],
    },
)

FEATURES: tuple[Feature, ...] = (
    {
        "title": "Envelopes",
        "description": "Track procurement contracts, HR packets, and inter-agency agreements with a full audit trail for compliance and FOIA readiness.",
        "icon": "templates",
        "href": "/envelopes",
        "cta": "Browse",
        "status": "live",
        "status_label": "Live API",
        "method": "GET",
        "endpoint": "/envelopes",
    },
    {
        "title": "Send Envelope",
        "description": "Issue contracts, MOUs, and vendor agreements from a template. Pre-populate fields and route to multiple signatories.",
        "icon": "send",
        "href": "/envelopes/send",
        "cta": "Send",
        "status": "live",
        "status_label": "Live API",
        "method": "POST",
        "endpoint": "/envelopes",
    },
    {
        "title": "Embedded Signing",
        "description": "Embed the signing ceremony directly in your citizen portal. No Docusign account required for signers.",
        "icon": "document",
        "href": "/embedded",
        "cta": "Launch",
        "status": "live",
        "status_label": "Live API",
        "method": "POST",
        "endpoint": "/views/recipient",
    },
    {
        "title": "Web Forms",
        "description": "Pre-fill permit applications, benefit enrollments, and license renewals via case ID — less data entry for staff and citizens.",
        "icon": "form",
        "href": "/webforms",
        "cta": "Try it",
        "status": "live",
        "status_label": "Live API",
        "method": "POST",
        "endpoint": "/web_forms/instances",
    },
    {
        "title": "Workflow Builder",
        "description": "Launch the AV1 workflow with API prefill — map FI$Cal and agency data into trigger_inputs at runtime.",
        "icon": "workflow",
        "href": "/maestro",
        "cta": "Explore",
        "status": "plan",
        "status_label": "Requires plan",
        "method": "POST",
        "endpoint": "/workflows/…/actions/trigger",
    },
    {
        "title": "Agreement Desk",
        "description": "State agency intake queue with audit trail, AI-assisted redlines, approval routing, and Iris chat — FI$Cal pre-fill to signature.",
        "icon": "clipboard",
        "href": "/agreement-desk",
        "cta": "Explore",
        "status": "live",
        "status_label": "CLM Light",
        "method": "GET",
        "endpoint": "/requests",
    },
    {
        "title": "Agreement Manager",
        "description": "AI-extracted provisions from executed contracts — expiration dates, renewal terms, vendor obligations — searchable across your repository.",
        "icon": "document",
        "href": "/navigator",
        "cta": "Explore",
        "status": "plan",
        "status_label": "Requires plan",
        "method": "GET",
        "endpoint": "/agreements",
    },
    {
        "title": "Workspaces · CA EDD",
        "description": "California EDD vendor onboarding hubs — stage agreements to sign, collect insurance / STD 204 uploads, and open a branded workspace.",
        "icon": "folder",
        "href": "/workspaces",
        "cta": "Explore",
        "status": "live",
        "status_label": "API beta",
        "method": "POST",
        "endpoint": "/workspaces",
    },
    {
        "title": "Connect / Webhooks",
        "description": "See how status updates flow from Docusign to FI$Cal — animated walkthrough, plain-English payloads, and a live event log.",
        "icon": "bolt",
        "href": "/webhooks",
        "cta": "Watch live",
        "status": "stream",
        "status_label": "Live stream",
        "method": "POST",
        "endpoint": "/webhook/receive",
    },
    {
        "title": "API Explorer",
        "description": "Browse every Docusign REST endpoint across eSignature, Web Forms, Workflow Builder, and Agreement Manager. Edit and run live.",
        "icon": "code",
        "href": "/explorer",
        "cta": "Open",
        "status": "stream",
        "status_label": "Interactive",
        "method": "",
        "endpoint": "40+ endpoints · 5 APIs",
    },
    {
        "title": "Gov Agents",
        "description": "Housing Assistance as the story — Iris agents for HR onboarding, vendor contracts, inter-agency MOUs, and resident applications.",
        "icon": "agent",
        "href": "/gov-agents",
        "cta": "Play",
        "status": "stream",
        "status_label": "Iris",
        "method": "",
        "endpoint": "Iris · Agent Studio",
    },
    {
        "title": "CLM Troubleshoot",
        "description": "101 of request → approve → external redline → remap attributes, then diagnose failed and stuck CLM workflows.",
        "icon": "alert",
        "href": "/clm-troubleshoot",
        "cta": "Open",
        "status": "plan",
        "status_label": "Playbook",
        "method": "",
        "endpoint": "SpringCM · workflow runbook",
    },
)

DEMO_SCRIPT: tuple[ScriptStep, ...] = (
    {"title": "Authenticate", "note": "One-click OAuth — show live API access", "href": "/oauth/login"},
    {
        "title": "Vendor Contract",
        "note": "Send a pre-filled MOU in one click",
        "href": "/envelopes/send?prefill=vendor",
    },
    {"title": "Embedded Signing", "note": "Citizen signs inside your portal", "href": "/embedded?prefill=permit"},
    {"title": "Web Forms", "note": "Launch sample form with HRIS pre-fill", "href": "/webforms?sample=1"},
    {"title": "Gov Agents", "note": "Housing Assistance — four Iris agents", "href": "/gov-agents?play=1"},
    {"title": "Agent API", "note": "Autonomous envelope flow with decision trace", "href": "/agent"},
    {"title": "API Explorer", "note": "Run a live REST call on stage", "href": "/explorer"},
)
