"""Fictional Connect demo data — plain-language government contract scenario."""

CONNECT_DEMO = {
    "contract_title": "Master Services Agreement — Acme IT Solutions",
    "department": "California Department of Technology",
    "requester": "Maria Chen, Program Manager",
    "vendor": "Acme IT Solutions, Inc.",
    "envelope_id": "8f3a2b1c-4d5e-6f7a-8b9c-0d1e2f3a4b5c",
    "webhook_url_suffix": "/webhook/receive",
    "erp_system": "FI$Cal",
    "register_system": "Agency Contract Register",
}

CONNECT_STATUS_GUIDE = [
    {
        "event": "envelope-sent",
        "status": "sent",
        "headline": "Agreement sent for signature",
        "plain": "Docusign emailed the contract to the signer. Your case system can mark the request as “Out for signature.”",
        "action": "Notify the program manager; start SLA clock for signature.",
        "color": "sky",
    },
    {
        "event": "envelope-delivered",
        "status": "delivered",
        "headline": "Signer opened the email",
        "plain": "The recipient viewed the signing link — they have not signed yet.",
        "action": "Optional reminder if no action after 48 hours.",
        "color": "indigo",
    },
    {
        "event": "recipient-completed",
        "status": "signed",
        "headline": "One signer finished",
        "plain": "A recipient completed their part. Multi-signer envelopes may still be in progress.",
        "action": "Update workflow task; route to next approver if needed.",
        "color": "green",
    },
    {
        "event": "envelope-completed",
        "status": "completed",
        "headline": "Fully executed — legally binding",
        "plain": "All signers finished. This is the trigger most agencies use to update ERP and contract registers.",
        "action": "Push encumbrance, contract ID, and PDF to FI$Cal / SQL register via your middleware.",
        "color": "green",
    },
    {
        "event": "envelope-declined",
        "status": "declined",
        "headline": "Signer declined",
        "plain": "Someone refused to sign. The envelope stops — no execution.",
        "action": "Alert contracts team; reopen negotiation or void and restart.",
        "color": "red",
    },
    {
        "event": "envelope-voided",
        "status": "voided",
        "headline": "Envelope cancelled",
        "plain": "An admin voided the envelope before completion.",
        "action": "Reverse any pending ERP holds; archive the request.",
        "color": "amber",
    },
]

CONNECT_ENDPOINTS = [
    {
        "method": "POST",
        "path": "/webhook/receive",
        "audience": "Your IT team",
        "plain": "Docusign POSTs JSON here whenever a subscribed event occurs.",
        "note": "Configure this URL in Docusign Admin → Connect.",
    },
    {
        "method": "GET",
        "path": "/connect",
        "audience": "Admins",
        "plain": "List Connect configurations on your Docusign account.",
        "note": "Requires admin API access.",
    },
    {
        "method": "POST",
        "path": "/connect",
        "audience": "Admins",
        "plain": "Create a Connect configuration programmatically.",
        "note": "Use during automated environment setup.",
    },
    {
        "method": "GET",
        "path": "/envelopes/{envelopeId}",
        "audience": "Integrations",
        "plain": "Poll envelope status if you cannot use Connect yet.",
        "note": "Connect is preferred — near real-time, no polling.",
    },
]
