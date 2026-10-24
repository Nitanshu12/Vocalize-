"""Request shapes for the interview session endpoints (start / answer)."""

from __future__ import annotations

from pydantic import BaseModel, Field


class StartRequest(BaseModel):
    typeId: str = Field(description="interview type id, e.g. 'hr_screening'")
    language: str = Field(default="en", description="'en' or 'hi'")
    # The candidate brief, looked up from Postgres by the Node gateway. It is
    # sent per-request rather than stored here on purpose: this service stays
    # stateless about user data, so there is exactly one place (the gateway's
    # database) that owns personal information. Optional — an interview must
    # still work for someone who skipped the profile step.
    profile: dict | None = Field(default=None, description="CandidateProfile, or null")


class AnswerRequest(BaseModel):
    threadId: str = Field(description="the session id returned by /start")
    answer: str = Field(min_length=1, description="the candidate's transcribed answer")
