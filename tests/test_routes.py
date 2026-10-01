"""Smoke tests: every page renders, nothing 5xx's without credentials, assets resolve."""

import re

import pytest

PLACEHOLDERS = {"state_abbr": "CA", "scenario_id": "x"}

# Pages that must render for an unauthenticated visitor.
PUBLIC_PAGES = [
    "/",
    "/admin",
    "/agent",
    "/agreement-desk",
    "/clm-troubleshoot",
    "/embedded",
    "/envelopes",
    "/envelopes/send",
    "/explorer",
    "/gov-agents",
    "/gov-workflows",
    "/integration-story",
    "/maestro",
    "/navigator",
    "/procurement-intake",
    "/webforms",
    "/webhooks",
    "/workflow-discovery",
    "/workspaces",
]


def _concrete(rule):
    url = rule.rule
    return re.sub(r"<(?:[^:>]+:)?(\w+)>", lambda m: PLACEHOLDERS.get(m.group(1), "x"), url)


@pytest.mark.parametrize("path", PUBLIC_PAGES)
def test_public_pages_render(client, path):
    resp = client.get(path)
    assert resp.status_code == 200, path
    html = resp.get_data(as_text=True)
    assert "<title>" in html and "Docusign IAM" in html
    assert "{%" not in html, "unrendered template syntax"


def test_every_get_route_survives_without_credentials(app, client):
    failures = {}
    for rule in app.url_map.iter_rules():
        if "GET" not in rule.methods or rule.endpoint == "static":
            continue
        status = client.get(_concrete(rule)).status_code
        if status >= 500:
            failures[rule.rule] = status
    assert not failures


def test_every_post_route_rejects_empty_input_gracefully(app, client):
    failures = {}
    for rule in app.url_map.iter_rules():
        if "POST" not in rule.methods or rule.endpoint == "static":
            continue
        status = client.post(_concrete(rule), json={}).status_code
        if status >= 500:
            failures[rule.rule] = status
    assert not failures


def test_unknown_route_is_branded_404_and_api_is_json(client):
    page = client.get("/no-such-page")
    assert page.status_code == 404 and b"Page not found" in page.data
    api = client.get("/api/no-such-endpoint")
    assert api.status_code == 404 and api.get_json() == {"error": "not found"}


@pytest.mark.parametrize("path", PUBLIC_PAGES)
def test_referenced_static_assets_exist(client, path):
    html = client.get(path).get_data(as_text=True)
    assets = set(re.findall(r'(?:href|src)="(/static/[^"]+)"', html))
    assert assets, "page should reference static assets"
    for url in assets:
        assert client.get(url).status_code == 200, f"{path} references missing {url}"


def test_asset_urls_are_content_versioned(client):
    html = client.get("/").get_data(as_text=True)
    assert re.search(r"/static/css/core/app\.css\?v=[0-9a-f]{10}", html)


def test_debug_routes_are_not_registered_by_default(client):
    assert client.get("/debug/token").status_code == 404


def test_internal_links_resolve(client):
    """Every same-site href on every page (including the demo-path menu) must hit a real route."""
    broken = {}
    seen = set()
    for page in PUBLIC_PAGES:
        html = client.get(page).get_data(as_text=True)
        for href in re.findall(r'href="(/[^"#]*)', html):
            href = href.replace("&amp;", "&")
            path = href.split("?")[0]
            if path in seen or path.startswith("/static/"):
                continue
            seen.add(path)
            if client.get(href).status_code == 404:
                broken[path] = page
    assert not broken, broken
