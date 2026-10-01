import os
import sys

import pytest

# Isolate tests from any real credentials in the developer's environment.
os.environ.update(
    {
        "FLASK_SECRET_KEY": "test-secret",
        "SITE_PASSWORD": "",
        "DOCUSIGN_ACCESS_TOKEN": "",
        "DOCUSIGN_ACCOUNT_ID": "",
        "DOCUSIGN_INTEGRATION_KEY": "",
        "RSA_PRIVATE_KEY": "",
        "RSA_PRIVATE_KEY_PATH": "/nonexistent",
        "WEBHOOK_SECRET": "",
    }
)
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from iamdemo import config, create_app  # noqa: E402
from iamdemo.services import docusign, webhook_store  # noqa: E402


@pytest.fixture(autouse=True)
def no_network(monkeypatch):
    """Fail fast (as an unreachable upstream) instead of calling Docusign."""
    import requests

    def refuse(*args, **kwargs):
        raise requests.ConnectionError("network disabled in tests")

    monkeypatch.setattr(requests.sessions.Session, "request", lambda self, *a, **k: refuse())
    docusign._jwt_cache.clear()
    monkeypatch.setattr(docusign, "_jwt_retry_at", 0.0)


@pytest.fixture
def app(tmp_path, monkeypatch):
    monkeypatch.setattr(webhook_store, "store", webhook_store.WebhookEventStore(str(tmp_path / "events.json")))
    import iamdemo.routes.admin as admin_routes
    import iamdemo.routes.webhooks as webhook_routes

    monkeypatch.setattr(webhook_routes, "store", webhook_store.store)
    monkeypatch.setattr(admin_routes, "store", webhook_store.store)
    application = create_app()
    application.config.update(TESTING=True, PROPAGATE_EXCEPTIONS=False)
    return application


@pytest.fixture
def client(app):
    return app.test_client()


@pytest.fixture
def gated_client(app, monkeypatch):
    monkeypatch.setattr(config, "SITE_PASSWORD", "letmein")
    return app.test_client()
