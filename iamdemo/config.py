"""Runtime configuration, read once from the environment (and a local .env file)."""

from __future__ import annotations

import os

from dotenv import load_dotenv

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

load_dotenv(os.path.join(PROJECT_ROOT, ".env"))


def _flag(name: str, default: bool = False) -> bool:
    raw = os.getenv(name)
    if raw is None:
        return default
    return raw.strip().lower() in {"1", "true", "yes", "on"}


# ── Runtime ──────────────────────────────────────────────────────────────────
IS_SERVERLESS = bool(os.getenv("VERCEL"))
# Diagnostic /debug/* routes expose account details; opt in explicitly.
DEBUG_ROUTES = _flag("ENABLE_DEBUG_ROUTES")

# ── Docusign account ─────────────────────────────────────────────────────────
ACCOUNT_ID = os.getenv("DOCUSIGN_ACCOUNT_ID", "")
BASE_URI = os.getenv("DOCUSIGN_BASE_URI", "https://demo.docusign.net")
USER_ID = os.getenv("DOCUSIGN_USER_ID", "")
ACCESS_TOKEN = os.getenv("DOCUSIGN_ACCESS_TOKEN", "")

# ── Flask ────────────────────────────────────────────────────────────────────
SECRET_KEY = os.getenv("FLASK_SECRET_KEY", "")
WEBHOOK_SECRET = os.getenv("WEBHOOK_SECRET", "")
# Shared demo gate password. Set SITE_PASSWORD= (empty) to disable the gate.
SITE_PASSWORD = os.getenv("SITE_PASSWORD", "docusign-iam")

# ── OAuth 2.0 authorization code flow ────────────────────────────────────────
INTEGRATION_KEY = os.getenv("DOCUSIGN_INTEGRATION_KEY", "")
CLIENT_SECRET = os.getenv("DOCUSIGN_CLIENT_SECRET", "")
OAUTH_REDIRECT_URI = os.getenv("DOCUSIGN_REDIRECT_URI", "http://localhost:5051/oauth/callback")

# ── JWT grant: inline key (Vercel) or local file path ────────────────────────
RSA_PRIVATE_KEY = os.getenv("RSA_PRIVATE_KEY", "")
RSA_PRIVATE_KEY_PATH = os.getenv("RSA_PRIVATE_KEY_PATH", os.path.join(PROJECT_ROOT, "private.key"))

ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")

# ── Derived API roots ────────────────────────────────────────────────────────
ESIGN_BASE = f"{BASE_URI}/restapi/v2.1/accounts/{ACCOUNT_ID}"
ROOMS_BASE = f"{BASE_URI}/restapi/v2/accounts/{ACCOUNT_ID}"
NAVIGATOR_BASE = f"https://api-d.docusign.com/v1/accounts/{ACCOUNT_ID}"
MAESTRO_BASE = f"https://api-d.docusign.com/v1/accounts/{ACCOUNT_ID}/maestro"

# ── Demo defaults (override via env) ─────────────────────────────────────────
# Default Workflow Builder demo — AV1 showcases API prefill (trigger_inputs)
DEFAULT_WORKFLOW_NAME = os.getenv("DEFAULT_WORKFLOW_NAME", "AV1")

DEMO_SIGNER_NAME = os.getenv("DEMO_SIGNER_NAME", "Corey Washington")
DEMO_SIGNER_EMAIL = os.getenv("DEMO_SIGNER_EMAIL", "cwdocusign1@gmail.com")
DEMO_COUNTERSIGNER_NAME = os.getenv("DEMO_COUNTERSIGNER_NAME", "Cole Mitchell")
DEMO_COUNTERSIGNER_EMAIL = os.getenv("DEMO_COUNTERSIGNER_EMAIL", "colemitchelldocusign@gmail.com")
DEMO_EMBEDDED_TEMPLATE_NAME = os.getenv("DEMO_EMBEDDED_TEMPLATE_NAME", "Employee Policy")
DEMO_EMBEDDED_ROLE = os.getenv("DEMO_EMBEDDED_ROLE", "Employee")
# Preferred Web Form for one-click sample launch with prefill
DEMO_WEBFORM_NAME = os.getenv("DEMO_WEBFORM_NAME", "Training/Travel Request Form")
DEMO_WEBFORM_HIRE_NAME = os.getenv("DEMO_WEBFORM_HIRE_NAME", "Alex Rivera")
DEMO_WEBFORM_HIRE_EMAIL = os.getenv("DEMO_WEBFORM_HIRE_EMAIL", "alex.rivera@city.gov")
DEMO_WEBFORM_MANAGER_NAME = os.getenv("DEMO_WEBFORM_MANAGER_NAME", "Maria Santos")
DEMO_WEBFORM_MANAGER_EMAIL = os.getenv("DEMO_WEBFORM_MANAGER_EMAIL", "maria.santos@cdt.ca.gov")


def load_rsa_private_key() -> str | None:
    """Return the JWT signing key from the env var (``\\n`` escaped) or the key file."""
    raw = RSA_PRIVATE_KEY.strip()
    if raw:
        return raw.replace("\\n", "\n") if "\\n" in raw else raw
    if RSA_PRIVATE_KEY_PATH and os.path.exists(RSA_PRIVATE_KEY_PATH):
        with open(RSA_PRIVATE_KEY_PATH, encoding="utf-8") as fh:
            return fh.read()
    return None
