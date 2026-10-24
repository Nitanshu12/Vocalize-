"""Shared prompt helpers used across the ask / evaluate / feedback prompts."""

from __future__ import annotations


def language_name(code: str) -> str:
    return {"en": "English", "hi": "Hindi"}.get(code, "English")


def history_text(turns: list[dict]) -> str:
    """Render the conversation so far for the LLM's context."""
    if not turns:
        return "(no questions asked yet)"
    parts = []
    for i, turn in enumerate(turns, 1):
        parts.append(f"Q{i} (interviewer): {turn['question']}\nA{i} (candidate): {turn['answer']}")
    return "\n\n".join(parts)


def profile_text(profile: dict | None) -> str:
    """Render a CandidateProfile into the compact brief an interviewer would skim.

    WHY PLAIN TEXT AND NOT JSON: models follow instructions written the way a
    human would read them far more reliably than they follow a JSON blob, and
    prose costs fewer tokens than the same data wrapped in braces and quotes.

    WHY THE WHOLE PROFILE GOES IN (and we are not doing RAG here): a profile is
    roughly 300-800 tokens, which fits comfortably in the prompt. Chunking it,
    embedding it, and retrieving "relevant" pieces per question would cost more
    code and more latency while risking the loss of the one detail that made a
    question land. Retrieval earns its place when a corpus cannot fit — which is
    what cross-session memory (many past interviews) will be. Not this.

    Returns "" when there is no profile, so callers can simply check falsiness.
    """
    if not profile:
        return ""

    lines: list[str] = []

    if profile.get("headline"):
        lines.append(profile["headline"])
    if profile.get("goal"):
        lines.append(f"Aiming for: {profile['goal']}")

    for item in profile.get("education") or []:
        bits = [item.get("qualification", ""), item.get("institution", "")]
        line = " at ".join(b for b in bits if b) or item.get("institution", "")
        for extra in (item.get("period"), item.get("detail")):
            if extra:
                line += f" ({extra})"
        if line:
            lines.append(f"Education: {line}")

    for item in profile.get("experiences") or []:
        line = f"{item.get('role', '')} at {item.get('organisation', '')}".strip(" at ")
        if item.get("period"):
            line += f" ({item['period']})"
        if item.get("highlights"):
            line += " — " + "; ".join(item["highlights"])
        if line:
            lines.append(f"Experience: {line}")

    for item in profile.get("projects") or []:
        line = item.get("name", "")
        if item.get("summary"):
            line += f" — {item['summary']}"
        if line:
            lines.append(f"Project: {line}")

    if profile.get("skills"):
        lines.append("Skills: " + ", ".join(profile["skills"]))

    return "\n".join(lines)


def talking_points_text(profile: dict | None) -> str:
    """The interviewer's private 'things to dig into' notes, if we have any."""
    points = (profile or {}).get("talking_points") or []
    return "\n".join(f"- {p}" for p in points)
