import os

from dotenv import load_dotenv

load_dotenv()  # loads ./.env when the process is started from interview-service/

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")


def require_groq() -> None:
    if not GROQ_API_KEY:
        raise RuntimeError(
            "GROQ_API_KEY is missing. Copy .env.example to .env and paste your key."
        )
