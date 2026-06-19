import os
from dotenv import load_dotenv

load_dotenv()

ACCOUNT_ID = os.getenv("DOCUSIGN_ACCOUNT_ID", "")
BASE_URI = os.getenv("DOCUSIGN_BASE_URI", "https://demo.docusign.net")
USER_ID = os.getenv("DOCUSIGN_USER_ID", "")
ACCESS_TOKEN = os.getenv("DOCUSIGN_ACCESS_TOKEN", "")
SECRET_KEY = os.getenv("FLASK_SECRET_KEY", "")
WEBHOOK_SECRET = os.getenv("WEBHOOK_SECRET", "")

# OAuth 2.0 Authorization Code flow
INTEGRATION_KEY = os.getenv("DOCUSIGN_INTEGRATION_KEY", "")
CLIENT_SECRET = os.getenv("DOCUSIGN_CLIENT_SECRET", "")
OAUTH_REDIRECT_URI = os.getenv("DOCUSIGN_REDIRECT_URI", "http://localhost:5051/oauth/callback")

# JWT grant: inline key (Vercel) or local file path
RSA_PRIVATE_KEY = os.getenv("RSA_PRIVATE_KEY", "")
RSA_PRIVATE_KEY_PATH = os.getenv(
    "RSA_PRIVATE_KEY_PATH",
    os.path.join(os.path.dirname(__file__), "private.key"),
)

ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")

ESIGN_BASE = f"{BASE_URI}/restapi/v2.1/accounts/{ACCOUNT_ID}"
ROOMS_BASE = f"{BASE_URI}/restapi/v2/accounts/{ACCOUNT_ID}"
NAVIGATOR_BASE = f"https://api-d.docusign.com/v1/accounts/{ACCOUNT_ID}"
MAESTRO_BASE = f"https://api-d.docusign.com/v1/accounts/{ACCOUNT_ID}/maestro"


def load_rsa_private_key() -> str | None:
    """Load RSA private key from env var or local file."""
    raw = RSA_PRIVATE_KEY.strip()
    if raw:
        if "\\n" in raw:
            raw = raw.replace("\\n", "\n")
        return raw
    if RSA_PRIVATE_KEY_PATH and os.path.exists(RSA_PRIVATE_KEY_PATH):
        with open(RSA_PRIVATE_KEY_PATH, encoding="utf-8") as f:
            return f.read()
    return None
