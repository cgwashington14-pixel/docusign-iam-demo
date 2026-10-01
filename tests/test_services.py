import base64
import time

import pytest
import requests

from iamdemo.services import docusign
from iamdemo.services.webhook_store import MAX_EVENTS, WebhookEventStore


def test_ds_get_reports_unreachable_upstream_as_503(app):
    with app.test_request_context():
        status, body = docusign.ds_get("/envelopes", token="t")
    assert status == 503 and body["error"] == "upstream_unreachable"


def test_unhandled_request_exception_becomes_502(app, client, monkeypatch):
    @app.route("/boom")
    def boom():
        raise requests.ConnectionError("down")

    resp = client.get("/boom")
    assert resp.status_code == 502 and b"Docusign is unreachable" in resp.data


def test_token_scope_decoding():
    import base64
    import json

    def jwt_with(scope):
        payload = base64.urlsafe_b64encode(json.dumps({"scope": scope}).encode()).decode().rstrip("=")
        return f"h.{payload}.s"

    token = jwt_with("signature dtr.rooms.read")
    assert docusign.decode_token_scopes(token) == ["signature", "dtr.rooms.read"]
    assert docusign.token_has_scopes(token, ["dtr.rooms.read"])
    assert not docusign.token_has_scopes(token, ["dtr.rooms.write"])
    assert docusign.token_has_scopes("opaque-token", ["anything"])  # undecodable -> assume ok
    assert docusign.decode_token_scopes("garbage") == []


def test_jwt_mint_failures_are_negatively_cached(app, monkeypatch):
    from iamdemo import config

    monkeypatch.setattr(config, "load_rsa_private_key", lambda: "key")
    calls = []

    def fail(*args, **kwargs):
        calls.append(1)
        raise requests.ConnectionError("down")

    monkeypatch.setattr(docusign, "_mint_jwt", fail)
    with app.app_context():
        assert docusign.get_jwt_token() == ""
        assert docusign.get_jwt_token() == ""
    assert len(calls) == 1


def test_jwt_success_is_cached(app, monkeypatch):
    from iamdemo import config

    monkeypatch.setattr(config, "load_rsa_private_key", lambda: "key")
    calls = []

    class Resp:
        status_code = 200
        text = ""

        def json(self):
            return {"access_token": "tok"}

    monkeypatch.setattr(docusign, "_mint_jwt", lambda *a: calls.append(1) or Resp())
    with app.app_context():
        assert docusign.get_jwt_token() == "tok"
        assert docusign.get_jwt_token() == "tok"
    assert len(calls) == 1
    docusign._jwt_cache["full"] = ("old", time.time() - 1)
    with app.app_context():
        docusign.get_jwt_token()
    assert len(calls) == 2


def test_webhook_store_bounds_and_persists(tmp_path):
    path = str(tmp_path / "e.json")
    store = WebhookEventStore(path)
    store.clear()
    for i in range(MAX_EVENTS + 10):
        store.add({"event": f"e{i}"})
    recent = store.recent()
    assert len(recent) == MAX_EVENTS
    ids = [e["id"] for e in recent]
    assert ids == sorted(set(ids)), "ids must stay unique and increasing after trimming"
    assert WebhookEventStore(path).recent()[-1]["event"] == f"e{MAX_EVENTS + 9}"


def test_webhook_store_seeds_samples_when_missing(tmp_path):
    assert len(WebhookEventStore(str(tmp_path / "new.json")).recent()) == 3


@pytest.mark.parametrize("value", [None, "", "not-a-date"])
def test_format_datetime_is_forgiving(value):
    from iamdemo.context import format_datetime

    assert format_datetime(value) in ("—", "not-a-date")


def test_every_document_template_renders_a_pdf(app):
    from iamdemo.services.documents import doc_templates, generate_pdf

    with app.app_context():
        for key in doc_templates():
            assert base64.b64decode(generate_pdf(key)).startswith(b"%PDF"), key


def test_ds_get_many_preserves_order_and_isolates_failures(app, monkeypatch):
    def fake_call(method, path, token, base, body=None):
        if path == "/boom":
            return 503, {"error": "upstream_unreachable"}
        return 200, {"path": path, "token": token, "base": base}

    monkeypatch.setattr(docusign, "_call", fake_call)
    with app.test_request_context():
        results = docusign.ds_get_many(["/a", "/boom", "/c"], token="t", base="https://x")
    assert [status for status, _ in results] == [200, 503, 200]
    assert results[0][1] == {"path": "/a", "token": "t", "base": "https://x"}
    assert results[2][1]["path"] == "/c"
