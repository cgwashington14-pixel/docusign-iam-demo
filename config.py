import os
from dotenv import load_dotenv

load_dotenv()

ACCOUNT_ID = os.getenv("DOCUSIGN_ACCOUNT_ID", "REDACTED_ACCOUNT_ID")
BASE_URI = os.getenv("DOCUSIGN_BASE_URI", "https://demo.docusign.net")
USER_ID = os.getenv("DOCUSIGN_USER_ID", "REDACTED_USER_ID")
ACCESS_TOKEN = os.getenv("DOCUSIGN_ACCESS_TOKEN", "")
SECRET_KEY = os.getenv("FLASK_SECRET_KEY", "REDACTED_FLASK_SECRET")
WEBHOOK_SECRET = os.getenv("WEBHOOK_SECRET", "")

# OAuth 2.0 Authorization Code flow
INTEGRATION_KEY = os.getenv("DOCUSIGN_INTEGRATION_KEY", "REDACTED_INTEGRATION_KEY")
CLIENT_SECRET = os.getenv("DOCUSIGN_CLIENT_SECRET", "")
OAUTH_REDIRECT_URI = os.getenv("DOCUSIGN_REDIRECT_URI", "http://localhost:5051/oauth/callback")
RSA_PRIVATE_KEY_PATH = os.getenv("RSA_PRIVATE_KEY_PATH", os.path.join(os.path.dirname(__file__), "private.key"))

ESIGN_BASE = f"{BASE_URI}/restapi/v2.1/accounts/{ACCOUNT_ID}"
ROOMS_BASE = f"{BASE_URI}/restapi/v2/accounts/{ACCOUNT_ID}"
NAVIGATOR_BASE = f"https://api-d.docusign.com/v1/accounts/{ACCOUNT_ID}"
MAESTRO_BASE = f"https://api-d.docusign.com/v1/accounts/{ACCOUNT_ID}/maestro"
