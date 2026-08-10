"""Prompt builder for the `ask` node — the interviewer's next question."""

from __future__ import annotations

from app.domain.interview import InterviewState, InterviewType
from app.prompts import history_text, language_name


def ask_messages(t: InterviewType, state: InterviewState) -> tuple[str, str]:
    """Return (system, human) text for generating the next question.

    If the last answer was flagged `probe_deeper`, we ask a follow-up; otherwise
    we move to a fresh competency area (with the seed questions as inspiration).
    """
    last = state["turns"][-1] if state["turns"] else None
    probe = bool(last and last.get("evaluation") and last["evaluation"].get("probe_deeper"))
    competencies = ", ".join(c.label for c in t.competencies)

    system = (
        f"You are {t.persona.name}, {t.persona.title}, conducting a {t.label} interview. "
        f"Your style: {t.persona.tone}. Speak in {language_name(state['language'])}. "
        "Ask exactly ONE next question, 1-2 sentences, natural and conversational like a "
        "real interviewer. Return only the question text — no numbering, no preamble."
    )
    if probe:
        instruction = "Ask a follow-up that digs deeper into the candidate's most recent answer."
    else:
        instruction = (
            f"Move to a fresh area. Competencies to explore across the interview: {competencies}. "
            f"For inspiration you may draw on: {'; '.join(t.seed_questions)}."
        )
    human = f"Interview so far:\n{history_text(state['turns'])}\n\n{instruction}"
    return system, human
