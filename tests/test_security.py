import base64
import hashlib
import hmac
import json

from iamdemo import config
from iamdemo.security import safe_next_url


def test_safe_next_url_rejects_offsite_targets():
    assert safe_next_url("/envelopes") == "/envelopes"
    for bad in ("https://evil.example", "//evil.example", "/\\evil.example", "", None, "javascript:alert(1)"):
        assert safe_next_url(bad) == "/"
    assert safe_next_url("/site-login?next=/") == "/"


def test_site_gate_redirects_pages_and_blocks_api(gated_client):
    page = gated_client.get("/envelopes?x=1")
    assert page.status_code == 302 and page.headers["Location"].startswith("/site-login?next=/envelopes")
    api = gated_client.get("/api/webforms")
    assert api.status_code == 401 and api.get_json()["needs_site_login"] is True


def test_site_gate_exemptions(gated_client):
    assert gated_client.get("/static/favicon.svg").status_code == 200
    assert gated_client.get("/api/demo/health").status_code == 200
    assert gated_client.get("/site-login").status_code == 200


def test_site_login_flow(gated_client):
    wrong = gated_client.post("/site-login", data={"password": "nope"})
    assert wrong.status_code == 401
    ok = gated_client.post("/site-login", data={"password": "letmein", "next": "/envelopes"})
    assert ok.status_code == 302 and ok.headers["Location"] == "/envelopes"
    assert gated_client.get("/envelopes").status_code == 200


def test_site_login_unicode_password_does_not_crash(gated_client):
    assert gated_client.post("/site-login", data={"password": "pässwörd✓"}).status_code == 401


def test_site_login_ignores_offsite_next(gated_client):
    resp = gated_client.post("/site-login", data={"password": "letmein", "next": "https://evil.example"})
    assert resp.headers["Location"] == "/"


def test_oauth_login_does_not_follow_offsite_next(client, monkeypatch):
    monkeypatch.setattr(config, "INTEGRATION_KEY", "key")
    client.get("/oauth/login?next=https://evil.example")
    with client.session_transaction() as sess:
        assert sess["oauth_next"] == "/"


def _signed(body: bytes, secret: str) -> str:
    return base64.b64encode(hmac.new(secret.encode(), body, hashlib.sha256).digest()).decode()


def test_webhook_accepts_unsigned_when_no_secret(client):
    resp = client.post("/webhook/receive", json={"event": "envelope-sent", "data": {"envelopeId": "abc"}})
    assert resp.status_code == 200
    events = client.get("/webhook/events").get_json()
    assert events[-1]["envelope_id"] == "abc" and events[-1]["event"] == "envelope-sent"


def test_webhook_hmac_uses_docusign_base64_signature(client, monkeypatch):
    monkeypatch.setattr(config, "WEBHOOK_SECRET", "s3cret")
    body = json.dumps({"event": "envelope-completed", "data": {"envelopeId": "z"}}).encode()
    headers = {"Content-Type": "application/json"}

    assert client.post("/webhook/receive", data=body, headers=headers).status_code == 401
    bad = {**headers, "X-DocuSign-Signature-1": "deadbeef"}
    assert client.post("/webhook/receive", data=body, headers=bad).status_code == 401
    good = {**headers, "X-DocuSign-Signature-1": _signed(body, "s3cret")}
    assert client.post("/webhook/receive", data=body, headers=good).status_code == 200


def test_webhook_tolerates_garbage_payloads(client):
    assert client.post("/webhook/receive", data="not json", content_type="text/plain").status_code == 200
    assert client.post("/webhook/receive", json=[1, 2, 3]).status_code == 200


def test_session_cookie_flags(client):
    client.post("/token", data={"token": "abc"})
    cookie = client.get_cookie("session")
    assert cookie is not None and cookie.http_only and cookie.same_site == "Lax"
