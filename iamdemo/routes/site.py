import hmac

from flask import (
    Blueprint,
    redirect,
    render_template,
    request,
    session,
    url_for,
)

from iamdemo import config
from iamdemo.security import safe_next_url

bp = Blueprint("site", __name__)


@bp.route("/site-login", methods=["GET", "POST"])
def login():
    password = (config.SITE_PASSWORD or "").strip()
    if not password:
        return redirect("/")
    if session.get("site_unlocked"):
        return redirect(safe_next_url(request.args.get("next") or request.form.get("next")))

    next_url = safe_next_url(request.values.get("next"))
    error = None
    if request.method == "POST":
        submitted = (request.form.get("password") or "").strip()
        if hmac.compare_digest(submitted.encode(), password.encode()):
            session["site_unlocked"] = True
            session.permanent = True
            return redirect(next_url)
        error = "Incorrect password. Try again."
    return render_template("site_login.html", error=error, next_url=next_url), (401 if error else 200)


@bp.route("/site-logout", methods=["POST", "GET"])
def logout():
    session.pop("site_unlocked", None)
    return redirect(url_for("site.login"))
