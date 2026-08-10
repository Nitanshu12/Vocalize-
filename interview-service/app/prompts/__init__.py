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
