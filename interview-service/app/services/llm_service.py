from __future__ import annotations

from langchain_groq import ChatGroq

from app.config.settings import GROQ_MODEL, require_groq


def get_llm(temperature: float) -> ChatGroq:
    require_groq() 
    return ChatGroq(model=GROQ_MODEL, temperature=temperature)
