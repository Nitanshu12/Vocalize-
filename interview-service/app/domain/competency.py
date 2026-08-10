"""
Domain building blocks — the smallest interview entities. Pure data, no
framework imports, so everything else can depend on this safely.
"""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class Persona:
    """The interviewer character. Drives tone of voice + (later) the TTS voice."""

    name: str
    title: str
    tone: str  # short style hint injected into the agent's system prompt


@dataclass(frozen=True)
class Competency:
    """One dimension an answer is scored on.

    `weight` lets a round emphasise some competencies over others. For now every
    weight is 1.0 (equal) — after research, change ONLY these numbers and the
    score maths follows automatically.

    `anchors` are BARS (Behaviorally Anchored Rating Scales): concrete
    descriptions of what a 1, a 3, and a 5 look like, injected into the scoring
    prompt so the LLM grades against a fixed yardstick. `description` + `anchors`
    are INTERNAL (never sent to the browser).
    """

    key: str
    label: str
    description: str
    anchors: dict[int, str]
    weight: float = 1.0
