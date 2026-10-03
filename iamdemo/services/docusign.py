"""Docusign authentication and thin REST helpers.

``ds_get`` / ``ds_post`` / ``ds_put`` return ``(status_code, json_body)`` and never raise on
network failures: an unreachable upstream is reported as status ``503`` so route handlers can
render a normal error state instead of a stack trace.
"""

from __future__ import annotations

import base64
import json
import time
from concurrent.futures import ThreadPoolExecutor

import jwt as pyjwt
import requests as http
from flask import current_app, request, session

from iamdemo import config

REQUEST_TIMEOUT = 15
OAUTH_HOST = "account-d.docusign.com"

# eSignature + IAM + Workspaces (beta) scopes for JWT / OAuth
DS_OAUTH_SCOPES = (
    "signature impersonation "
    "adm_store_unified_repo_read aow_manage "
    "webforms_read webforms_instance_read webforms_instance_write "
    "dtr.rooms.read dtr.rooms.write dtr.company.read dtr.documents.write"
)
# Used when the integration key has not been granted the Workspaces (dtr.*) scopes yet.
LEGACY_JWT_SCOPES = (
    "signature impersonation adm_store_unified_repo_read aow_manage "
    "webforms_read webforms_instance_read webforms_instance_write"
)
WORKSPACES_SCOPES = ("dtr.rooms.read", "dtr.rooms.write")


# ── Token inspection ─────────────────────────────────────────────────────────


def oauth_redirect_uri() -> str:
    """Use the current host's callback so local and Vercel both work."""
    try:
        host = (request.host or "").lower()
        scheme = "https" if request.is_secure or host.endswith("vercel.app") else "http"
        if host and "localhost" not in host and "127.0.0.1" not in host:
            return f"{scheme}://{host}/oauth/callback"
    except RuntimeError:
        pass  # outside a request context
    return config.OAUTH_REDIRECT_URI or "http://localhost:5051/oauth/callback"


def decode_token_scopes(token: str | None) -> list[str]:
    """Read the scope claim of a Docusign access token (unverified; for capability checks only)."""
    if not token or token.count(".") < 2:
        return []
    try:
        part = token.split(".")[1]
        payload = json.loads(base64.urlsafe_b64decode(part + "=" * (-len(part) % 4)))
    except (ValueError, json.JSONDecodeError):
        return []
    scopes = payload.get("scp") or payload.get("scope") or []
    if isinstance(scopes, str):
        return [s for s in scopes.replace(",", " ").split() if s]
    if isinstance(scopes, list):
        return [str(s) for s in scopes]
    return []


def token_has_scopes(token: str | None, required) -> bool:
    need = [s for s in required if s]
    if not need:
        return True
    have = set(decode_token_scopes(token))
    # Opaque tokens carry no readable scopes; assume they are fine.
    return not have or all(s in have for s in need)


# ── JWT grant (server-to-server) ─────────────────────────────────────────────

_JWT_TTL = 50 * 60  # tokens live 60 minutes; refresh early
_JWT_RETRY_AFTER = 60  # back off after a failed mint (e.g. consent missing)
_jwt_cache: dict[str, tuple[str, float]] = {}
_jwt_retry_at = 0.0


def _cached_jwt(kind: str) -> str | None:
    entry = _jwt_cache.get(kind)
    if entry and entry[1] > time.time():
        return entry[0]
    return None


def _mint_jwt(private_key: str, scopes: str) -> http.Response:
    now = int(time.time())
    assertion = pyjwt.encode(
        {
            "iss": config.INTEGRATION_KEY,
            "sub": config.USER_ID,
            "aud": OAUTH_HOST,
            "iat": now,
            "exp": now + 3600,
            "scope": scopes,
        },
        private_key,
        algorithm="RS256",
    )
    return http.post(
        f"https://{OAUTH_HOST}/oauth/token",
        data={"grant_type": "urn:ietf:params:oauth:grant-type:jwt-bearer", "assertion": assertion},
        timeout=REQUEST_TIMEOUT,
    )


def get_jwt_token(required_scopes=None) -> str | None:
    """Return a JWT-grant access token, minting (and caching in-process) when needed.

    Returns ``None`` when no signing key is configured and ``""`` when minting failed.
    """
    private_key = config.load_rsa_private_key()
    if not private_key:
        return None
    global _jwt_retry_at
    log = current_app.logger
    needs_workspaces = any(s.startswith("dtr.") for s in (required_scopes or ()))

    if token := _cached_jwt("full"):
        return token
    if not needs_workspaces and (token := _cached_jwt("legacy")):
        return token
    if time.time() < _jwt_retry_at:
        return ""

    try:
        resp = _mint_jwt(private_key, DS_OAUTH_SCOPES)
        if resp.status_code == 200:
            token = resp.json().get("access_token", "")
            _jwt_cache["full"] = (token, time.time() + _JWT_TTL)
            return token

        # Never fall back to a scope-stripped token when Workspaces scopes are required.
        if needs_workspaces:
            log.warning("JWT missing Workspaces scopes (%s %s) — consent required", resp.status_code, resp.text[:200])
            return ""

        body = (resp.text or "").lower()
        if resp.status_code in (400, 401) and any(word in body for word in ("consent", "scope")):
            resp = _mint_jwt(private_key, LEGACY_JWT_SCOPES)
            if resp.status_code == 200:
                log.warning("JWT minted without Workspaces scopes — re-consent with dtr.* to enable create")
                token = resp.json().get("access_token", "")
                _jwt_cache["legacy"] = (token, time.time() + _JWT_TTL)
                return token

        log.warning("JWT token request failed: %s %s", resp.status_code, resp.text[:200])
    except (http.RequestException, pyjwt.PyJWTError, ValueError) as exc:
        log.warning("JWT token error: %s", exc)

    _jwt_retry_at = time.time() + _JWT_RETRY_AFTER
    return ""


def active_token_value(required_scopes=None) -> str:
    """Resolve the access token for this request: session (OAuth) -> env token -> JWT grant."""
    if session.get("guest_mode"):
        return ""
    required = tuple(required_scopes or ())
    token = session.get("access_token", "")

    # Drop cached tokens that are missing required scopes (e.g. pre-consent JWT).
    if token and required and not token_has_scopes(token, required):
        session.pop("access_token", None)
        token = ""

    if token or session.get("prefer_oauth"):
        return token

    token = config.ACCESS_TOKEN or ""
    if token and required and not token_has_scopes(token, required):
        token = ""
    if token:
        return token

    if config.load_rsa_private_key():
        token = get_jwt_token(required_scopes=required or None) or ""
        if token and required and not token_has_scopes(token, required):
            return ""  # scope-stripped fallback: do not cache, callers need Workspaces
        if token:
            session["access_token"] = token
            session["token_source"] = "shared"
    return token


def credentials_are_shared() -> bool:
    """True when API calls run as the server's service account instead of the visitor's own login.

    Visitors who signed in with Docusign OAuth (or pasted their own token) act as themselves;
    everyone else borrows the portal's shared credentials, so risky actions must stay limited.
    """
    if not session.get("access_token"):
        return True
    if session.get("user_email"):  # OAuth sessions created before ``token_source`` existed
        return False
    return session.get("token_source") not in ("oauth", "manual")


# ── REST helpers ─────────────────────────────────────────────────────────────


def ds_headers(token: str | None = None) -> dict[str, str]:
    return {
        "Authorization": f"Bearer {token or active_token_value()}",
        "Content-Type": "application/json",
        "Accept": "application/json",
    }


def _account_id() -> str:
    return session.get("account_id", config.ACCOUNT_ID)


def esign_base() -> str:
    return f"{session.get('base_uri', config.BASE_URI)}/restapi/v2.1/accounts/{_account_id()}"


def webforms_base() -> str:
    return f"https://apps-d.docusign.com/api/webforms/v1.1/accounts/{_account_id()}"


def iam_base() -> str:
    return f"https://api-d.docusign.com/v1/accounts/{_account_id()}"


def safe_json(response: http.Response) -> dict:
    try:
        return response.json()
    except ValueError:
        return {"error": "non-JSON response", "body": response.text[:500]}


def _call(method: str, path: str, token: str | None, base: str | None, body=None) -> tuple[int, dict]:
    url = (base or esign_base()) + path
    try:
        resp = http.request(method, url, headers=ds_headers(token), json=body, timeout=REQUEST_TIMEOUT)
    except http.RequestException as exc:
        current_app.logger.warning("Docusign %s %s failed: %s", method, path, exc)
        return 503, {"error": "upstream_unreachable", "message": f"Could not reach Docusign: {exc}"[:300]}
    return resp.status_code, safe_json(resp) if resp.content else {}


def ds_get(path, token=None, base=None):
    return _call("GET", path, token, base)


def ds_get_many(paths, token=None, base=None):
    """GET several paths concurrently; returns ``[(status, body), ...]`` in input order."""
    token = token or active_token_value()
    base = base or esign_base()
    app = current_app._get_current_object()

    def fetch(path):
        with app.app_context():
            return _call("GET", path, token, base)

    with ThreadPoolExecutor(max_workers=len(paths) or 1) as pool:
        return list(pool.map(fetch, paths))


def ds_post(path, body, token=None, base=None):
    return _call("POST", path, token, base, body)


def ds_put(path, body, token=None, base=None):
    return _call("PUT", path, token, base, body)
