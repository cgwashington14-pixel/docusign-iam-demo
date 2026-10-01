"""Small JSON-file backed log of Docusign Connect events.

Serverless instances start cold, so events are persisted to disk. On Vercel the
project directory is read-only, so the log lives in the instance's temp dir.
"""

from __future__ import annotations

import json
import logging
import os
import tempfile
import threading
from datetime import UTC, datetime

from iamdemo import config

log = logging.getLogger(__name__)

MAX_EVENTS = 50

SAMPLE_EVENTS = [
    {
        "id": 1,
        "received_at": "2026-06-18T14:22:01Z",
        "event": "envelope-sent",
        "envelope_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        "status": "sent",
        "sender": "contracts@cdt.ca.gov",
        "raw": '{"event":"envelope-sent","data":{"envelopeId":"a1b2c3d4-e5f6-7890-abcd-ef1234567890"}}',
    },
    {
        "id": 2,
        "received_at": "2026-06-18T15:41:33Z",
        "event": "recipient-completed",
        "envelope_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        "status": "delivered",
        "sender": "contracts@cdt.ca.gov",
        "raw": '{"event":"recipient-completed","data":{"envelopeId":"a1b2c3d4-e5f6-7890-abcd-ef1234567890"}}',
    },
    {
        "id": 3,
        "received_at": "2026-06-18T16:08:17Z",
        "event": "envelope-completed",
        "envelope_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        "status": "completed",
        "sender": "contracts@cdt.ca.gov",
        "raw": (
            '{"event":"envelope-completed","data":{"envelopeId":"a1b2c3d4-e5f6-7890-abcd-ef1234567890",'
            '"envelopeSummary":{"status":"completed"}}}'
        ),
    },
]


def _default_path() -> str:
    base = tempfile.gettempdir() if config.IS_SERVERLESS else os.path.join(config.PROJECT_ROOT, "data")
    return os.path.join(base, "webhook_events.json")


class WebhookEventStore:
    """Thread-safe, bounded event log persisted as JSON."""

    def __init__(self, path: str | None = None, max_events: int = MAX_EVENTS):
        self.path = path or _default_path()
        self.max_events = max_events
        self._lock = threading.Lock()
        self._events: list[dict] | None = None

    # -- persistence ---------------------------------------------------------
    def _load(self) -> list[dict]:
        if self._events is None:
            try:
                with open(self.path, encoding="utf-8") as fh:
                    data = json.load(fh)
                self._events = data if isinstance(data, list) else list(SAMPLE_EVENTS)
            except FileNotFoundError:
                self._events = list(SAMPLE_EVENTS)
            except (OSError, ValueError) as exc:
                log.warning("Could not read webhook events from %s: %s", self.path, exc)
                self._events = list(SAMPLE_EVENTS)
        return self._events

    def _persist(self) -> None:
        try:
            os.makedirs(os.path.dirname(self.path), exist_ok=True)
            with open(self.path, "w", encoding="utf-8") as fh:
                json.dump(self._events or [], fh)
        except OSError as exc:
            log.warning("Could not write webhook events to %s: %s", self.path, exc)

    # -- public API ----------------------------------------------------------
    def recent(self) -> list[dict]:
        with self._lock:
            return list(self._load()[-self.max_events :])

    def add(self, payload: dict) -> dict:
        """Normalize a Connect payload into an event record and store it."""
        data = payload.get("data") or {}
        summary = data.get("envelopeSummary") or {}
        with self._lock:
            events = self._load()
            event = {
                "id": max((e.get("id", 0) for e in events), default=0) + 1,
                "received_at": datetime.now(UTC).strftime("%Y-%m-%dT%H:%M:%SZ"),
                "event": payload.get("event", "unknown"),
                "envelope_id": data.get("envelopeId", ""),
                "status": summary.get("status", ""),
                "sender": (summary.get("sender") or {}).get("email", ""),
                "raw": json.dumps(payload, indent=2)[:2000],
            }
            events.append(event)
            del events[: -self.max_events]
            self._persist()
            return event

    def clear(self) -> None:
        with self._lock:
            self._events = []
            self._persist()


store = WebhookEventStore()
