# Docusign IAM — Government Demo Portal

A Flask app that drives live Docusign APIs (eSignature, Web Forms, Workflow Builder / Maestro,
Workspaces, Connect, Navigator) through public-sector scenarios. Production: <https://docusign-iam-demo.vercel.app>.

## Quick start

```bash
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt -r requirements-dev.txt
cp .env.example .env            # fill in Docusign credentials
python app.py                   # http://localhost:5050
```

Without credentials every page still renders; API-backed panels show a sign-in / error state.

## Layout

```
app.py                  WSGI entry point (Vercel imports `app`)
iamdemo/
  __init__.py           create_app(): config, middleware, blueprints
  config.py             environment-driven settings
  middleware.py         site password gate, private-network preflight, response headers
  context.py            Jinja globals/filters (asset(), nav, auth state)
  navigation.py         sidebar model (rendered by templates/partials/sidebar.html)
  errors.py             branded HTML errors, JSON errors for /api and /webhook
  routes/               one blueprint per feature area (thin: parse request -> call service -> render)
  services/             Docusign clients and business logic (no Flask routing)
  content/              static demo data: scenarios, state profiles, presenter paths
templates/              base shell + partials/ + one template per page
static/css/{core,chrome,modes,components,pages}/
static/js/{core,modes,components,pages}/
tests/                  pytest suite (no network)
scripts/                one-off maintenance scripts
```

Static assets are referenced with `{{ asset('css/core/app.css') }}`, which appends a content hash so
deploys bust browser caches. CSS load order lives in `templates/base.html` (later files override earlier ones);
`css/core/utilities.css` loads last.

## Authentication

Requests resolve a token in this order: OAuth session (Login with Docusign) → `DOCUSIGN_ACCESS_TOKEN`
→ JWT grant using `RSA_PRIVATE_KEY` / `private.key`. JWT tokens are cached in-process for 50 minutes and a
failed mint is not retried for 60 seconds.

The portal sits behind a shared password (`SITE_PASSWORD`; set it empty to disable locally).
Diagnostic `/debug/*` routes are only registered when `ENABLE_DEBUG_ROUTES=1`.

## Development

```bash
pytest                   # routes, nav, security, services
ruff check . && ruff format --check .
```

Deploys: every push to `master` is built by Vercel (`vercel.json` routes all traffic to `app.py`).
On Vercel the webhook event log lives in the instance's temp directory.
