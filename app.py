"""WSGI entry point (Vercel imports ``app``; ``python app.py`` runs the dev server)."""

import os

from iamdemo import create_app

app = create_app()

if __name__ == "__main__":
    # The Werkzeug debugger allows remote code execution, so it is opt-in (FLASK_DEBUG=1) and local-only.
    app.run(host="127.0.0.1", debug=os.environ.get("FLASK_DEBUG") == "1", port=int(os.environ.get("PORT", 5050)))
