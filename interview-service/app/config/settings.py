"""
Environment config for the interview-service.

Reads interview-service/.env (via python-dotenv) once, at import time. Keeps
secrets out of code — .env is gitignored and you fill it in yourself.
"""

import os

from dotenv import load_dotenv

load_dotenv()  # loads ./.env when the process is started from interview-service/

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")

# Shared secret the Node gateway sends (X-Internal-Key) so only it can reach the
# token-spending endpoints. If unset (local dev), the check is skipped.
INTERNAL_API_KEY = os.getenv("INTERNAL_API_KEY", "")


def require_groq() -> None:
    """Fail loudly (with a fix hint) if the Groq key is missing.

    We don't return the key — ChatGroq reads GROQ_API_KEY from the environment
    itself (load_dotenv put it there), so nothing here has to handle the secret.
    """
    if not GROQ_API_KEY:
        raise RuntimeError(
            "GROQ_API_KEY is missing. Copy .env.example to .env and paste your key."
        )
