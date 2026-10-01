import pytest

from iamdemo.routes import explorer


def test_explorer_requires_token(client):
    resp = client.post("/explorer/call", json={"path": "/envelopes"})
    assert resp.status_code == 401


@pytest.fixture
def authed(client):
    client.post("/token", data={"token": "tok"})
    return client


def test_explorer_validates_input(authed):
    assert authed.post("/explorer/call", json={}).status_code == 400
    assert authed.post("/explorer/call", json={"path": "/x", "method": "PATCH"}).status_code == 400


def test_explorer_reports_unreachable_upstream(authed):
    resp = authed.post("/explorer/call", json={"path": "/envelopes", "method": "GET"})
    assert resp.status_code == 502


@pytest.mark.parametrize(
    ("group", "path", "suffix"),
    [
        ("eSignature", "/envelopes", "/envelopes"),
        ("Workspaces", "/123", "/workspaces/123"),
        ("Workspaces", "/workspaces/123", "/workspaces/123"),
        ("Workflow Builder", "/maestro/workflows", "/workflows"),
        ("Web Forms", "/web_forms/abc", "/abc"),
    ],
)
def test_resolve_explorer_url(app, group, path, suffix):
    with app.test_request_context():
        assert explorer.resolve_explorer_url(group, path).endswith(suffix)
