import html as htmllib
import re

from iamdemo.navigation import NAV_SECTIONS, all_nav_endpoints, is_nav_active


def test_every_nav_endpoint_exists(app):
    endpoints = {rule.endpoint for rule in app.url_map.iter_rules()}
    assert set(all_nav_endpoints()) <= endpoints


def test_nav_endpoints_are_unique():
    endpoints = all_nav_endpoints()
    assert len(endpoints) == len(set(endpoints))


def _active_labels(html):
    return re.findall(r'class="nav-item[^"]* active"[^>]*>.*?nav-item-label">([^<\n]+)', html, flags=re.S)


def test_exactly_one_item_highlighted_on_each_nav_page(client):
    for section in NAV_SECTIONS:
        for item in section.items:
            from flask import url_for

            with client.application.test_request_context():
                path = url_for(item.endpoint)
            html = client.get(path).get_data(as_text=True)
            labels = [htmllib.unescape(label).strip() for label in _active_labels(html)]
            assert labels == [item.label], f"{path}: {labels}"


def test_blueprint_prefix_matching():
    item = next(i for s in NAV_SECTIONS for i in s.items if i.endpoint == "ai_agent.agent")
    assert is_nav_active(item, "ai_agent.agent_run_flow")
    assert not is_nav_active(item, "envelopes.envelope_detail")
    assert not is_nav_active(item, None)
