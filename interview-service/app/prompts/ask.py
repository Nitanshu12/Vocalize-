"""Prompt builder for the `ask` node — the interviewer's next question."""

from __future__ import annotations

from app.domain.interview import InterviewState, InterviewType
from app.prompts import history_text, language_name, profile_text, talking_points_text


def ask_messages(t: InterviewType, state: InterviewState) -> tuple[str, str]:
    last = state["turns"][-1] if state["turns"] else None
    probe = bool(last and last.get("evaluation") and last["evaluation"].get("probe_deeper"))
    competencies = ", ".join(c.label for c in t.competencies)

    system = (
        f"You are {t.persona.name}, {t.persona.title}, conducting a {t.label} interview. "
        f"Your style: {t.persona.tone}. Speak in {language_name(state['language'])}. "
        "Ask exactly ONE next question, 1-2 sentences, natural and conversational like a "
        "real interviewer. Return only the question text — no numbering, no preamble."
    )

    # ------------------------------------------------------------------ #
    # Candidate grounding — the difference between a quiz and an interview.
    # ------------------------------------------------------------------ #
    # A real interviewer has read your CV. They say "I see you interned at
    # Zomato — what was hardest there?", not "tell me about a challenge".
    # Injecting the brief here is what produces that behaviour.
    #
    # Two guard rails matter as much as the brief itself:
    #   1. "where it fits naturally" — without it the model crowbars the resume
    #      into all six questions and the interview stops covering competencies.
    #   2. "never invent" — a model handed a background will cheerfully ask about
    #      an internship that does not exist, which destroys the user's trust
    #      faster than a generic question ever would.
    brief = profile_text(state.get("profile"))
    if brief:
        system += (
            "\n\nYou read the candidate's background before this call:\n"
            f"{brief}\n"
            "Where it fits naturally, ground your question in their ACTUAL background — "
            "name the specific role, project or skill they mentioned. Never invent or "
            "assume any detail that is not written above."
        )

    if probe:
        instruction = "Ask a follow-up that digs deeper into the candidate's most recent answer."
    else:
        instruction = (
            f"Move to a fresh area. Competencies to explore across the interview: {competencies}. "
            f"For inspiration you may draw on: {'; '.join(t.seed_questions)}."
        )
        # The notes the extraction agent made while reading the CV. These turn
        # generic coverage into the probing a real screener does — testing a
        # bold claim rather than accepting it.
        notes = talking_points_text(state.get("profile"))
        if notes:
            instruction += (
                "\n\nNotes you made while reading their background — prefer these when "
                "one fits the area you're moving to:\n" + notes
            )

    human = f"Interview so far:\n{history_text(state['turns'])}\n\n{instruction}"
    return system, human
