"""Prompt builder for the `evaluate` node — scoring one answer against BARS."""

from __future__ import annotations

from app.domain.interview import InterviewType


def rubric_text(t: InterviewType) -> str:
    """Flatten competencies + BARS anchors into a prompt block for scoring."""
    lines = []
    for c in t.competencies:
        anchors = " | ".join(f"{level}={desc}" for level, desc in sorted(c.anchors.items()))
        lines.append(f"- {c.key} ({c.label}): {c.description} [Anchors: {anchors}]")
    return "\n".join(lines)


def evaluate_messages(t: InterviewType, question: str, answer: str) -> tuple[str, str]:
    """Return (system, human) text for scoring a single answer."""
    system = (
        f"You are an expert interviewer scoring ONE answer in a {t.label} interview. "
        "Score every competency from 1 to 5 using ONLY the rating anchors provided. "
        "Be fair but discerning — do not inflate scores. Justify each score in one sentence."
    )
    human = (
        f"Competencies and rating anchors:\n{rubric_text(t)}\n\n"
        f"Question asked: {question}\n"
        f"Candidate's answer: {answer or '(no answer was given)'}\n\n"
        "Score each competency by its key, then give one strength and one improvement."
    )
    return system, human
