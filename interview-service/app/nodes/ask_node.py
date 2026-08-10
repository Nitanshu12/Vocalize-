"""ask node — produce the next question and park it in `current_question`."""

from __future__ import annotations

from langchain_core.messages import HumanMessage, SystemMessage

from app.domain.interview import InterviewState, require_type
from app.prompts.ask import ask_messages
from app.services.llm_service import get_llm


def ask_node(state: InterviewState) -> dict:
    t = require_type(state["type_id"])

    # First question is the scripted opening line — warm, consistent, on-brand.
    if not state.get("turns") and not state.get("current_question"):
        return {"current_question": t.opening_line}

    system, human = ask_messages(t, state)
    resp = get_llm(0.6).invoke([SystemMessage(content=system), HumanMessage(content=human)])
    return {"current_question": resp.content.strip()}
