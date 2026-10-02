"""Sidebar navigation model. Rendered by ``templates/partials/sidebar.html``."""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class NavItem:
    endpoint: str
    label: str
    hint: str
    icon: str
    badge: str = ""
    badge_tone: str = ""  # amber | indigo | sky
    also_active: tuple[str, ...] = ()  # extra endpoints (or "blueprint.") prefixes that highlight this item
    exec_hide: bool = False  # hidden in Executive View
    sub: bool = False  # indented child entry
    tech_hint: bool = False  # hint only shown in API Details mode


@dataclass(frozen=True)
class NavSection:
    label: str
    items: tuple[NavItem, ...]


NAV_SECTIONS: tuple[NavSection, ...] = (
    NavSection(
        "",
        (NavItem("portal.index", "Home", "Launch pad", "home"),),
    ),
    NavSection(
        "eSignature",
        (
            NavItem(
                "envelopes.envelopes",
                "Templates",
                "Reusable signature packets",
                "templates",
                also_active=("envelopes.envelope_detail",),
            ),
            NavItem("envelopes.send_envelope", "Send Envelope", "Create & send for signature", "send"),
            NavItem(
                "embedded.embedded_signing",
                "Embedded Signing",
                "Sign inside your portal",
                "document",
                also_active=("embedded.",),
            ),
        ),
    ),
    NavSection(
        "Automation",
        (
            NavItem("webforms.webforms", "Web Forms", "Digital intake forms", "form"),
            NavItem(
                "maestro.maestro",
                "Workflow Builder",
                "Automate multi-step processes",
                "workflow",
                also_active=("maestro.",),
                exec_hide=True,
            ),
            NavItem("portal.agreement_desk", "Agreement Desk", "Intake, audit trail & approvals", "clipboard"),
            NavItem("portal.navigator", "Agreement Manager", "Search & analyze contracts", "document"),
        ),
    ),
    NavSection(
        "Platform",
        (
            NavItem(
                "gov_workflows.gov_workflows",
                "Gov Workflows",
                "50 states · contract lifecycle",
                "calendar",
            ),
            NavItem(
                "agents.gov_agents",
                "Gov Agents",
                "HR · procurement · constituent",
                "agent",
            ),
            NavItem(
                "workspaces.workspaces",
                "Workspaces",
                "Collaborative deal rooms",
                "folder",
                also_active=("workspaces.workspace_create",),
            ),
            NavItem("webhooks.webhooks", "Connect / Webhooks", "Real-time status events", "bolt"),
        ),
    ),
    NavSection(
        "Developer",
        (
            NavItem(
                "explorer.explorer",
                "API Explorer",
                "40+ endpoints · live calls",
                "code",
                exec_hide=True,
                tech_hint=True,
            ),
            NavItem(
                "ai_agent.agent",
                "Agent API",
                "Claude · document analysis",
                "bolt",
                also_active=("ai_agent.",),
                exec_hide=True,
            ),
        ),
    ),
    NavSection(
        "Guides",
        (
            NavItem(
                "portal.workflow_discovery",
                "Workflow Discovery",
                "Process maps · discovery",
                "checklist",
                exec_hide=True,
            ),
            NavItem(
                "portal.clm_troubleshoot",
                "CLM Troubleshoot",
                "101 · Failed · attributes",
                "alert",
                exec_hide=True,
            ),
            NavItem(
                "portal.integration_story",
                "Integration Story",
                "SF · Microsoft · ServiceNow",
                "bulb",
            ),
            NavItem(
                "portal.procurement_intake",
                "Procurement & Intake",
                "Pre- / post-execution IAM",
                "document",
            ),
        ),
    ),
)


def is_nav_active(item: NavItem, endpoint: str | None) -> bool:
    """True when the current request endpoint belongs to this nav item."""
    if not endpoint:
        return False
    if endpoint == item.endpoint:
        return True
    return any(endpoint == e or (e.endswith(".") and endpoint.startswith(e)) for e in item.also_active)


def all_nav_endpoints() -> list[str]:
    return [item.endpoint for section in NAV_SECTIONS for item in section.items]


def find_nav(endpoint: str | None) -> tuple[NavSection, NavItem] | None:
    """The (section, item) pair a request endpoint belongs to, for breadcrumbs."""
    for section in NAV_SECTIONS:
        for item in section.items:
            if is_nav_active(item, endpoint):
                return section, item
    return None
