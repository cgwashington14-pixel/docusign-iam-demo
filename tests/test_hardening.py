"""Regression tests for the security hardening (gate, explorer, webhooks, XSS, OAuth)."""

import pytest

from iamdemo import config, create_app
from iamdemo.routes import explorer as explorer_routes
from iamdemo.security import clean_guid, is_safe_api_path, login_throttle

GUID = "8f3a2b1c-4d5e-6f7a-8b9c-0d1e2f3a4b5c"


@pytest.fixture(autouse=True)
def reset_throttle():
    login_throttle.reset()
    yield
    login_throttle.reset()


# ── Site password gate ───────────────────────────────────────────────────────


def test_password_guessing_is_throttled(gated_client):
    for _ in range(5):
        assert gated_client.post("/site-login", data={"password": "nope"}).status_code == 401
    blocked = gated_client.post("/site-login", data={"password": "nope"})
    assert blocked.status_code == 429
    assert int(blocked.headers["Retry-After"]) > 0
    # Even the correct password is refused while locked out.
    assert gated_client.post("/site-login", data={"password": "letmein"}).status_code == 429


def test_correct_password_unlocks_and_clears_failures(gated_client):
    gated_client.post("/site-login", data={"password": "nope"})
    resp = gated_client.post("/site-login", data={"password": "letmein"})
    assert resp.status_code == 302
    assert gated_client.get("/").status_code == 200


@pytest.mark.parametrize("password", ["", "docusign-iam", "Change-Me"])
def test_deployed_site_without_strong_password_refuses_to_serve(app, monkeypatch, password):
    monkeypatch.setattr(config, "IS_SERVERLESS", True)
    monkeypatch.setattr(config, "SITE_PASSWORD", password)
    client = app.test_client()
    assert client.get("/").status_code == 503
    assert client.get("/envelopes").status_code == 503
    assert client.get("/site-login").status_code == 503
    assert client.post("/webhook/receive", json={}).status_code == 503


def test_deployed_site_with_strong_password_still_gates(app, monkeypatch):
    monkeypatch.setattr(config, "IS_SERVERLESS", True)
    monkeypatch.setattr(config, "SITE_PASSWORD", "a-long-random-passphrase-9f2c")
    resp = app.test_client().get("/")
    assert resp.status_code == 302 and "/site-login" in resp.headers["Location"]


def test_weak_flask_secret_keys_are_rejected(monkeypatch):
    for weak in ("", "change-me-in-production", "short"):
        monkeypatch.setattr(config, "SECRET_KEY", weak)
        assert not config.secret_key_is_strong()
    monkeypatch.setattr(config, "SECRET_KEY", "x" * 64)
    assert config.secret_key_is_strong()


def test_cross_site_logout_is_ignored(app):
    client = app.test_client()
    with client.session_transaction() as sess:
        sess["site_unlocked"] = True
    client.get("/site-logout", headers={"Sec-Fetch-Site": "cross-site"})
    with client.session_transaction() as sess:
        assert sess.get("site_unlocked") is True
    client.get("/site-logout", headers={"Sec-Fetch-Site": "same-origin"})
    with client.session_transaction() as sess:
        assert "site_unlocked" not in sess


# ── API Explorer ─────────────────────────────────────────────────────────────


@pytest.fixture
def explorer_client(app, monkeypatch):
    monkeypatch.setattr(explorer_routes, "active_token_value", lambda *a, **k: "service-token")
    return app.test_client()


@pytest.mark.parametrize("method", ["POST", "PUT", "DELETE"])
def test_explorer_is_read_only_on_shared_credentials(explorer_client, method):
    resp = explorer_client.post("/explorer/call", json={"method": method, "path": "/envelopes", "body": {}})
    assert resp.status_code == 403
    assert resp.get_json()["status_code"] == 403


def test_explorer_allows_writes_for_signed_in_users(explorer_client, monkeypatch):
    calls = []

    class Fake:
        status_code = 201
        text = "{}"

        def json(self):
            return {"ok": True}

    monkeypatch.setattr(
        explorer_routes.http, "request", lambda method, url, **kw: calls.append((method, url)) or Fake()
    )
    with explorer_client.session_transaction() as sess:
        sess["access_token"] = "users-own-token"
        sess["token_source"] = "oauth"
        sess["user_email"] = "me@example.com"
    resp = explorer_client.post("/explorer/call", json={"method": "POST", "path": "/envelopes", "body": {}})
    assert resp.status_code == 200 and calls and calls[0][0] == "POST"


def test_explorer_rejects_path_tricks(explorer_client):
    for path in ("/envelopes/../../admin", "//evil.example/x", "/envelopes\\..\\x", "/a/%2e%2e/b"):
        resp = explorer_client.post("/explorer/call", json={"method": "GET", "path": path})
        assert resp.status_code == 400, path


def test_path_helpers():
    assert is_safe_api_path("/envelopes?from_date=2024-01-01&count=10")
    assert not is_safe_api_path("/envelopes/../x")
    assert clean_guid(GUID) == GUID
    assert clean_guid("1'); alert(1);//") == ""


# ── Embedded signing return page (reachable without the password) ────────────


def test_embedded_complete_never_echoes_unsafe_envelope_ids(client):
    payload = "');alert(document.cookie);//"
    html = client.get("/embedded/complete", query_string={"envelopeId": payload}).get_data(as_text=True)
    assert "alert(document.cookie)" not in html


def test_embedded_complete_renders_valid_envelope_id_as_json_string(client):
    html = client.get("/embedded/complete", query_string={"envelopeId": GUID}).get_data(as_text=True)
    assert f"copyText(&#34;{GUID}&#34;, this)" in html


def test_embedded_complete_skips_lookup_until_site_unlocked(gated_client, monkeypatch):
    from iamdemo.routes import embedded

    lookups = []
    monkeypatch.setattr(embedded, "active_token_value", lambda *a, **k: lookups.append(1) or "tok")
    monkeypatch.setattr(embedded, "ds_get", lambda *a, **k: lookups.append(2) or (200, {"status": "completed"}))
    gated_client.get("/embedded/complete", query_string={"envelopeId": GUID})
    assert lookups == []


# ── Webhooks ─────────────────────────────────────────────────────────────────


def test_webhook_store_keeps_only_short_plain_strings(client):
    evil = {"event": "<img src=x onerror=alert(1)>" * 20, "data": {"envelopeId": {"a": 1}, "envelopeSummary": "x"}}
    assert client.post("/webhook/receive", json=evil).status_code == 200
    event = client.get("/webhook/events").get_json()[-1]
    assert len(event["event"]) <= 64
    assert event["envelope_id"] == "" and event["status"] == "" and event["sender"] == ""


def test_webhook_rejects_oversized_payloads(client):
    resp = client.post("/webhook/receive", data=b"x" * (600 * 1024), content_type="application/json")
    assert resp.status_code == 413


def test_webhook_requires_valid_signature_when_secret_set(client, monkeypatch):
    import base64
    import hashlib
    import hmac

    monkeypatch.setattr(config, "WEBHOOK_SECRET", "s3cret")
    body = b'{"event":"envelope-sent"}'
    assert client.post("/webhook/receive", data=body, content_type="application/json").status_code == 401
    sig = base64.b64encode(hmac.new(b"s3cret", body, hashlib.sha256).digest()).decode()
    ok = client.post(
        "/webhook/receive", data=body, content_type="application/json", headers={"X-DocuSign-Signature-1": sig}
    )
    assert ok.status_code == 200


# ── OAuth callback ───────────────────────────────────────────────────────────


def test_oauth_callback_requires_matching_state(client):
    resp = client.get("/oauth/callback", query_string={"code": "abc", "state": "forged"})
    assert b"invalid_state" in resp.data


def test_oauth_login_sends_state(client):
    resp = client.get("/oauth/login")
    assert resp.status_code == 302 and "state=" in resp.headers["Location"]


# ── Debug routes ─────────────────────────────────────────────────────────────


def test_debug_routes_never_registered_when_deployed(monkeypatch):
    monkeypatch.setattr(config, "DEBUG_ROUTES", True)
    monkeypatch.setattr(config, "IS_SERVERLESS", True)
    monkeypatch.setattr(config, "SITE_PASSWORD", "a-long-random-passphrase-9f2c")
    client = create_app().test_client()
    with client.session_transaction() as sess:
        sess["site_unlocked"] = True
    assert client.get("/debug/auth").status_code == 404
