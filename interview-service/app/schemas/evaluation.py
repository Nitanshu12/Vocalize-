"""
Structured LLM outputs. Passed to `.with_structured_output(...)` so the model is
forced to return exactly these shapes — validated data, not prose to parse.
"""

from __future__ import annotations

from pydantic import BaseModel, Field


class CompetencyScore(BaseModel):
    key: str = Field(description="the competency key being scored, e.g. 'communication'")
    score: int = Field(ge=1, le=5, description="1-5, chosen strictly by the rating anchors")
    reason: str = Field(description="one concise sentence justifying this score")


class AnswerEvaluation(BaseModel):
    """One answer, scored against every competency."""

    scores: list[CompetencyScore] = Field(description="one entry per competency")
    strength: str = Field(description="one specific thing the candidate did well")
    improvement: str = Field(description="one specific, actionable thing to improve")
    probe_deeper: bool = Field(
        description="true if a follow-up question would meaningfully sharpen the assessment"
    )


class CoachFeedback(BaseModel):
    """The whole-interview wrap-up, written like a supportive coach."""

    headline: str = Field(description="one encouraging sentence summarising the interview")
    strengths: list[str] = Field(description="2-3 specific strengths shown across the interview")
    improvements: list[str] = Field(description="2-3 specific, actionable improvements")
    next_tip: str = Field(description="one concrete thing to practise before the next interview")
