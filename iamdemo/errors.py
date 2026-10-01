"""Error handlers: JSON for API/webhook paths, a branded page for everything else."""

from __future__ import annotations

import logging

from flask import Flask, jsonify, render_template, request
from requests.exceptions import RequestException
from werkzeug.exceptions import HTTPException

log = logging.getLogger(__name__)

API_PREFIXES = ("/api/", "/webhook/")


def _wants_json() -> bool:
    return request.path.startswith(API_PREFIXES) or request.is_json


def _page(code: int, title: str, message: str | None = None) -> str:
    return render_template("error.html", error_code=code, error_title=title, error_message=message)


def register_error_handlers(app: Flask) -> None:
    @app.errorhandler(404)
    def not_found(_error):
        if _wants_json():
            return jsonify({"error": "not found"}), 404
        return _page(404, "Page not found"), 404

    @app.errorhandler(RequestException)
    def upstream_unreachable(error):
        """A Docusign (or other upstream) call failed at the network layer."""
        log.warning("Upstream request failed: %s", error)
        if _wants_json():
            return jsonify({"error": "Upstream service unreachable", "detail": str(error)[:200]}), 502
        return _page(
            502,
            "Docusign is unreachable",
            "The portal could not reach the Docusign API. Check your connection and try again in a moment.",
        ), 502

    @app.errorhandler(Exception)
    def unexpected(error):
        if isinstance(error, HTTPException):
            return error
        log.exception("Unhandled error on %s", request.path)
        if _wants_json():
            return jsonify({"error": "Internal server error"}), 500
        return _page(
            500,
            "Something went wrong",
            "An unexpected error occurred. It has been logged; please try again.",
        ), 500
