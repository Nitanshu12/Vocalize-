"""
The Candidate Profile — the background an interviewer reads before the call.

This module is the single definition of "what we know about a candidate", and
it is used for THREE different jobs at once:

  1. It is the structured-output schema handed to the LLM
     (`.with_structured_output(CandidateProfile)`), so the model is forced to
     return exactly these fields instead of prose we'd have to parse.
  2. It is the shape stored in Postgres (`user_profiles`).
  3. It is the shape rendered into the interviewer's system prompt.

PRIVACY BY CONSTRUCTION
-----------------------
Notice what is NOT here: no name, phone, email, address, date of birth. A
resume is full of those, but the interview does not need a single one of them.
Because the LLM can only return fields that exist on this schema, contact
details are dropped during extraction and never reach our database. The schema
*is* the privacy control — not a filter we remember to run afterwards, which is
the kind of thing that eventually gets forgotten. This matters especially
because school-age users are in scope.
"""

from __future__ import annotations

from pydantic import BaseModel, Field


class EducationItem(BaseModel):
    institution: str = Field(description="school, college or university name")
    qualification: str = Field(default="", description="degree/class, e.g. 'B.Tech CSE' or 'Class 9'")
    period: str = Field(default="", description="years, e.g. '2022-2026'; empty if unclear")
    detail: str = Field(default="", description="score, specialisation or honour, if stated")


class ExperienceItem(BaseModel):
    organisation: str = Field(description="company, club or organisation name")
    role: str = Field(description="the title or role held")
    period: str = Field(default="", description="duration, e.g. 'Jun-Aug 2025'; empty if unclear")
    highlights: list[str] = Field(
        default_factory=list,
        description="1-3 short bullet points of what they actually did or achieved",
    )


class ProjectItem(BaseModel):
    name: str = Field(description="project name")
    summary: str = Field(default="", description="one short sentence on what it does")


class CandidateProfile(BaseModel):
    """Everything the interviewer is allowed to know before the call."""

    headline: str = Field(
        description="one neutral sentence describing the candidate, "
        "e.g. 'Final-year CSE student with two internships, aiming for product roles'"
    )
    goal: str = Field(
        default="",
        description="the role or outcome they are working towards; empty if not stated",
    )
    education: list[EducationItem] = Field(default_factory=list)
    experiences: list[ExperienceItem] = Field(default_factory=list)
    projects: list[ProjectItem] = Field(default_factory=list)
    skills: list[str] = Field(
        default_factory=list, description="concrete skills and tools; 3-12 items"
    )
    # This is what turns a profile from "context" into "a real interview".
    # A human interviewer reads a resume and mentally marks the things worth
    # digging into: a bold claim, a short stint, an unexplained gap. We ask the
    # extraction model for the same list, then feed it to the ask node so it can
    # probe specifics instead of asking textbook questions.
    talking_points: list[str] = Field(
        default_factory=list,
        description=(
            "3-5 specific things an interviewer should probe, phrased as short notes "
            "(e.g. 'claims to have led a team of 5 - test how', 'six-month gap in 2024'). "
            "Base these ONLY on what the candidate actually wrote."
        ),
    )


class GuidedAnswers(BaseModel):
    """The no-resume path: four plain-language questions anyone can answer.

    Deliberately identical in outcome to the resume path — both produce a
    `CandidateProfile`. A twelve-year-old and a job-switcher walk different
    routes to the same destination, so everything downstream (storage, prompt
    injection, scoring) has exactly one shape to deal with.
    """

    studying_or_working: str = Field(default="", description="what they study or do right now")
    experience: str = Field(default="", description="anything they've built, done or taken part in")
    skills: str = Field(default="", description="what they're good at, in their own words")
    goal: str = Field(default="", description="what they're aiming for next")
