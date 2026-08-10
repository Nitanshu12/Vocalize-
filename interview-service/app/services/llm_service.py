"""Central LLM access — one place that builds the Groq client."""

from __future__ import annotations

from langchain_groq import ChatGroq

from app.config.settings import GROQ_MODEL, require_groq


def get_llm(temperature: float) -> ChatGroq:
    """Build a ChatGroq client. `temperature` is per-call: low for scoring
    (consistent), higher for question generation (varied, natural)."""
    require_groq()  # ChatGroq reads GROQ_API_KEY from the env .env populated
    return ChatGroq(model=GROQ_MODEL, temperature=temperature)
