from flask import (
    Blueprint,
    jsonify,
    render_template,
    request,
    session,
)

from iamdemo import config
from iamdemo.content.admin_dashboard import (
    ADMIN_CAPABILITIES,
    ADMIN_PAGE_CATALOG,
    BACKEND_LABELS,
    build_admin_status,
)
from iamdemo.services.docusign import active_token_value, ds_get
from iamdemo.services.webhook_store import store

bp = Blueprint("admin", __name__)


@bp.route("/admin")
def admin_dashboard():
    token = active_token_value()
    status = build_admin_status(token, session, config, ds_get, store.recent())
    return render_template(
        "admin.html",
        status=status,
        capabilities=ADMIN_CAPABILITIES,
        pages=ADMIN_PAGE_CATALOG,
        backend_labels=BACKEND_LABELS,
        webhook_url=request.host_url.rstrip("/") + "/webhook/receive",
    )


@bp.route("/api/admin/status")
def api_admin_status():
    token = active_token_value()
    status = build_admin_status(token, session, config, ds_get, store.recent())
    return jsonify(status)
