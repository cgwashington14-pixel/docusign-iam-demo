"""WSGI entry point (Vercel imports ``app``; ``python app.py`` runs the dev server)."""

import os

from iamdemo import create_app

app = create_app()

if __name__ == "__main__":
    app.run(debug=True, port=int(os.environ.get("PORT", 5050)))
