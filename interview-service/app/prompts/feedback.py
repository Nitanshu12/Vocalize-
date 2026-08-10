"""Prompt builder for the `feedback` node — the whole-interview coach wrap-up."""

from __future__ import annotations

from app.domain.interview import InterviewType
from app.prompts import history_text, language_name


def feedback_messages(
    t: InterviewType, turns: list[dict], breakdown: dict, language: str
) -> tuple[str, str]:
    """Return (system, human) text for the final coach feedback."""
    scores_line = ", ".join(f"{c['label']} {c['score']}/5" for c in breakdown["competencies"])

    system = (
        f"You are {t.persona.name}, a supportive {t.label} interview coach. "
        f"Write your feedback in {language_name(language)}. Be specific and kind, but honest. "
        "Base every point on what the candidate actually said."
    )
    human = (
        f"Overall score: {breakdown['overallScore']}/100.\n"
        f"Competency scores: {scores_line}.\n\n"
        f"Full interview:\n{history_text(turns)}\n\n"
        "Give a short encouraging headline, 2-3 concrete strengths, 2-3 actionable "
        "improvements, and one thing to practise before the next interview."
    )
    return system, human
