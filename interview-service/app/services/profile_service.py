"""
Candidate-profile extraction — the AI half of the profile pipeline.

Both entry points return the SAME `CandidateProfile`, so everything downstream
(storage, prompt injection, the UI) has exactly one shape to handle.

HOW STRUCTURED OUTPUT WORKS
---------------------------
`llm.with_structured_output(CandidateProfile)` hands the model our Pydantic
schema as a tool/JSON-schema definition and makes it fill that shape in. We get
back a validated `CandidateProfile` object, not a string we have to hope is
valid JSON. This is the same technique the evaluate and feedback nodes already
use — worth internalising, because it is what turns an LLM from a text
generator into a component you can build a system on.

Temperature is low (0.1): extraction is a faithfulness task, not a creative one.
We want the same resume to produce the same profile every time.
"""

from __future__ import annotations

from langchain_core.messages import HumanMessage, SystemMessage

from app.domain.profile import normalise_track
from app.prompts.profile import guided_messages, resume_messages
from app.schemas.profile import CandidateProfile, GuidedAnswers
from app.services.llm_service import get_llm

_EXTRACTION_TEMPERATURE = 0.1


def _extract(system: str, human: str) -> CandidateProfile:
    llm = get_llm(_EXTRACTION_TEMPERATURE).with_structured_output(CandidateProfile)
    return llm.invoke([SystemMessage(content=system), HumanMessage(content=human)])


def from_resume(text: str) -> CandidateProfile:
    """Resume text -> structured profile."""
    system, human = resume_messages(text)
    return _extract(system, human)


def from_guided(answers: GuidedAnswers, track: str) -> CandidateProfile:
    """Four plain-language answers -> the same structured profile."""
    system, human = guided_messages(answers, normalise_track(track))
    return _extract(system, human)
