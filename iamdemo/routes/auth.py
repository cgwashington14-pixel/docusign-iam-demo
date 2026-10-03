import hmac
import secrets
import urllib.parse

import requests as http
from flask import (
    Blueprint,
    redirect,
    render_template,
    request,
    session,
    url_for,
)

from iamdemo import config
from iamdemo.security import is_cross_site_request, safe_next_url
from iamdemo.services.docusign import DS_OAUTH_SCOPES, oauth_redirect_uri

bp = Blueprint("auth", __name__)


@bp.route("/token", methods=["POST"])
def set_token():
    tok = request.form.get("token", "").strip()
    session.pop("guest_mode", None)
    session.pop("prefer_oauth", None)
    session["access_token"] = tok
    if tok:
        session["token_source"] = "manual"
    else:
        session.pop("token_source", None)
    return redirect(url_for("portal.index"))


@bp.route("/oauth/login")
def oauth_login():
    # Drop any cached JWT/OAuth token so the new scopes take effect immediately
    session.pop("access_token", None)
    session.pop("token_source", None)
    session.pop("guest_mode", None)
    next_url = safe_next_url(request.args.get("next"), default=url_for("portal.index"))
    session["oauth_next"] = next_url
    # Anti-CSRF token: the callback only accepts a login this browser actually started.
    state = secrets.token_urlsafe(24)
    session["oauth_state"] = state
    params = {
        "state": state,
        "response_type": "code",
        "scope": DS_OAUTH_SCOPES,
        "client_id": config.INTEGRATION_KEY,
        "redirect_uri": oauth_redirect_uri(),
        "prompt": "login",
    }
    url = "https://account-d.docusign.com/oauth/auth?" + urllib.parse.urlencode(params)
    return redirect(url)


@bp.route("/oauth/callback")
def oauth_callback():
    code = request.args.get("code")
    error = request.args.get("error")
    expected_state = session.pop("oauth_state", "")
    returned_state = request.args.get("state", "")

    if error:
        return render_template("oauth_error.html", error=error, desc=request.args.get("error_description", ""))

    if not code:
        return render_template(
            "oauth_error.html", error="no_code", desc="No authorization code returned from Docusign."
        )

    if not expected_state or not hmac.compare_digest(expected_state.encode(), returned_state.encode()):
        return render_template(
            "oauth_error.html",
            error="invalid_state",
            desc="This sign-in was not started from this browser. Start again from the portal.",
        )

    redirect_uri = oauth_redirect_uri()
    # Exchange code for access token using client secret (confidential client)
    token_resp = http.post(
        "https://account-d.docusign.com/oauth/token",
        auth=(config.INTEGRATION_KEY, config.CLIENT_SECRET),
        data={
            "grant_type": "authorization_code",
            "code": code,
            "redirect_uri": redirect_uri,
        },
        timeout=15,
    )

    if token_resp.status_code != 200:
        return render_template(
            "oauth_error.html", error=f"token_exchange_{token_resp.status_code}", desc=token_resp.text[:500]
        )

    data = token_resp.json()
    access_token = data.get("access_token", "")
    session.pop("guest_mode", None)
    session["prefer_oauth"] = True
    session["access_token"] = access_token
    session["token_source"] = "oauth"

    # Fetch account info so routes use the correct account_id
    userinfo = http.get(
        "https://account-d.docusign.com/oauth/userinfo",
        headers={"Authorization": f"Bearer {access_token}"},
        timeout=15,
    )
    if userinfo.status_code == 200:
        udata = userinfo.json()
        accounts = udata.get("accounts", [])
        # Pick the default account, or fall back to first
        acct = next((a for a in accounts if a.get("is_default")), accounts[0] if accounts else {})
        session["account_id"] = acct.get("account_id", config.ACCOUNT_ID)
        session["base_uri"] = acct.get("base_uri", config.BASE_URI)
        session["user_email"] = udata.get("email", "")
        session["user_name"] = udata.get("name") or udata.get("given_name", "Demo User")

    next_url = session.pop("oauth_next", None) or url_for("portal.index")
    return redirect(next_url)


@bp.route("/oauth/logout")
def oauth_logout():
    # Ignore links/images on other websites that try to sign you out.
    if is_cross_site_request():
        return redirect(url_for("portal.index"))
    session.clear()
    session["guest_mode"] = True
    session["prefer_oauth"] = True
    session.modified = True
    return redirect(url_for("portal.index"))
