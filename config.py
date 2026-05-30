import os
from dotenv import load_dotenv

load_dotenv()

ACCOUNT_ID = os.getenv("DOCUSIGN_ACCOUNT_ID", "your_account_id_here")
BASE_URI = os.getenv("DOCUSIGN_BASE_URI", "https://na3.docusign.net")
USER_ID = os.getenv("DOCUSIGN_USER_ID", "your_user_guid_here")
ACCESS_TOKEN = os.getenv("DOCUSIGN_ACCESS_TOKEN", "")
SECRET_KEY = os.getenv("FLASK_SECRET_KEY", "REDACTED_FLASK_SECRET")
WEBHOOK_SECRET = os.getenv("WEBHOOK_SECRET", "")

ESIGN_BASE = f"{BASE_URI}/restapi/v2.1/accounts/{ACCOUNT_ID}"
ROOMS_BASE = f"{BASE_URI}/restapi/v2/accounts/{ACCOUNT_ID}"
NAVIGATOR_BASE = f"https://api-d.docusign.com/v1/accounts/{ACCOUNT_ID}"
MAESTRO_BASE = f"https://api-d.docusign.com/v1/accounts/{ACCOUNT_ID}/maestro"
