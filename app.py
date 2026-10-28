"""Flask application entry point; legacy endpoints are isolated in routes.legacy."""
import os

from routes.legacy import app

app.secret_key = os.getenv("FLASK_SECRET_KEY") or os.urandom(32)

if __name__ == "__main__":
    app.run(
        host="0.0.0.0" if os.getenv("RENDER") else "127.0.0.1",
        port=int(os.getenv("PORT", "5000")),
        debug=False,
        threaded=True,
    )
