"""
Prompt builders for candidate-profile extraction.

Two entry points, ONE output shape (`CandidateProfile`):

    resume_messages(text)          -> from an uploaded CV
    guided_messages(answers, ...)  -> from four plain-language questions

Keeping the destination identical is the design decision that makes the
no-resume path a first-class citizen rather than a degraded fallback.
"""

from __future__ import annotations

from app.domain.profile import TRACK_SCHOOL
from app.schemas.profile import GuidedAnswers

# Shared rules. Hallucination is the real risk here: a model asked to "build a
# profile" will happily invent a plausible internship, and the interviewer would
# then ask about something that never happened — which destroys trust instantly.
# So we state the no-invention rule explicitly and repeat the privacy rule that
# the schema already enforces structurally (belt and braces).
_GROUND_RULES = (
    "Extract ONLY what the text actually states. Never invent, infer or embellish "
    "an organisation, date, achievement or skill. If something is not stated, leave "
    "the field empty rather than guessing. Do not record any contact details "
    "(phone, email, address) even if present — they are not needed."
)


def resume_messages(text: str) -> tuple[str, str]:
    system = (
        "You are an experienced recruiter reading a candidate's CV and writing the "
        "short internal brief an interviewer skims before the call. "
        f"{_GROUND_RULES} "
        "Write the headline in neutral third person. For talking_points, note the "
        "things a sharp interviewer would want to test or clarify — bold claims, "
        "very short stints, unexplained gaps, or impressive work worth exploring."
    )
    human = f"Here is the CV text:\n\n{text}"
    return system, human


def guided_messages(answers: GuidedAnswers, track: str) -> tuple[str, str]:
    """Turn four free-text answers into the same structured profile.

    The school track gets a gentler brief: a child writing "I like drawing and I
    made a poster for Earth Day" has a real, usable background — it just is not
    shaped like a CV. Handling that in the PROMPT rather than in a second code
    path is what keeps one pipeline serving every kind of user.
    """
    if track == TRACK_SCHOOL:
        audience = (
            "The candidate is a school student. Treat hobbies, school activities, "
            "competitions, and things they have made as genuine experience. Keep the "
            "language simple and encouraging, and never imply their background is thin."
        )
    else:
        audience = (
            "The candidate is a student or working professional who has described "
            "their background in their own words rather than as a CV."
        )

    system = (
        "You are an experienced recruiter turning a candidate's own description of "
        "themselves into the short internal brief an interviewer skims before the call. "
        f"{audience} {_GROUND_RULES} "
        "Write the headline in neutral third person. For talking_points, note what "
        "an interviewer would naturally want to hear more about."
    )
    human = (
        "The candidate answered these questions:\n\n"
        f"What are you studying or doing right now?\n{answers.studying_or_working or '(no answer)'}\n\n"
        f"What have you built, done or taken part in?\n{answers.experience or '(no answer)'}\n\n"
        f"What are you good at?\n{answers.skills or '(no answer)'}\n\n"
        f"What are you aiming for next?\n{answers.goal or '(no answer)'}"
    )
    return system, human
