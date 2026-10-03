import hmac

from flask import (
    Blueprint,
    make_response,
    redirect,
    render_template,
    request,
    session,
    url_for,
)

from iamdemo import config
from iamdemo.security import client_ip, is_cross_site_request, login_throttle, safe_next_url

bp = Blueprint("site", __name__)


@bp.route("/site-login", methods=["GET", "POST"])
def login():
    if config.site_gate_misconfigured():
        return make_response(
            "This deployment has no site password configured. Set SITE_PASSWORD to a long, random value.", 503
        )
    password = (config.SITE_PASSWORD or "").strip()
    if not password:
        return redirect("/")
    if session.get("site_unlocked"):
        return redirect(safe_next_url(request.args.get("next") or request.form.get("next")))

    next_url = safe_next_url(request.values.get("next"))
    error = None
    status = 200
    if request.method == "POST":
        client = client_ip()
        wait = login_throttle.retry_after(client)
        if wait:
            minutes = max(1, -(-wait // 60))
            error = f"Too many incorrect attempts. Try again in about {minutes} minute{'s' if minutes != 1 else ''}."
            resp = make_response(render_template("site_login.html", error=error, next_url=next_url), 429)
            resp.headers["Retry-After"] = str(wait)
            return resp
        submitted = (request.form.get("password") or "").strip()
        if hmac.compare_digest(submitted.encode(), password.encode()):
            login_throttle.reset(client)
            session["site_unlocked"] = True
            session.permanent = True
            return redirect(next_url)
        login_throttle.record_failure(client)
        error = "Incorrect password. Try again."
        status = 401
    return render_template("site_login.html", error=error, next_url=next_url), status


@bp.route("/site-logout", methods=["POST", "GET"])
def logout():
    # Ignore links/images on other websites that try to lock you out.
    if is_cross_site_request():
        return redirect(url_for("portal.index"))
    session.pop("site_unlocked", None)
    return redirect(url_for("site.login"))
