"""Request shapes for the interview session endpoints (start / answer)."""

from __future__ import annotations

from pydantic import BaseModel, Field


class StartRequest(BaseModel):
    typeId: str = Field(description="interview type id, e.g. 'hr_screening'")
    language: str = Field(default="en", description="'en' or 'hi'")


class AnswerRequest(BaseModel):
    threadId: str = Field(description="the session id returned by /start")
    answer: str = Field(min_length=1, description="the candidate's transcribed answer")
