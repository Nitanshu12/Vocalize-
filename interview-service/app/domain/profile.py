"""
Profile domain rules — pure functions, no framework imports.

Two concepts live here, and keeping them separate is the whole point:

  TRACK  — who the user is:  school | college | professional
  DEPTH  — how much we know: none   | guided  | resume

They are independent. A college student may arrive with no resume (college +
guided); a school child will never have one (school + guided). If we had
modelled this as a single "has resume?" boolean, every user without one would
be a second-class citizen in the code — and that is exactly the group we are
building for.
"""

from __future__ import annotations

# --------------------------------------------------------------------------- #
# Tracks
# --------------------------------------------------------------------------- #
TRACK_SCHOOL = "school"
TRACK_COLLEGE = "college"
TRACK_PROFESSIONAL = "professional"

TRACKS: tuple[str, ...] = (TRACK_SCHOOL, TRACK_COLLEGE, TRACK_PROFESSIONAL)
DEFAULT_TRACK = TRACK_COLLEGE

# Resume upload is disabled for school users: children's resumes are not a thing
# we want to hold. The guided path gives us everything the interview needs.
TRACKS_WITHOUT_RESUME: frozenset[str] = frozenset({TRACK_SCHOOL})


def normalise_track(track: str | None) -> str:
    """Never trust a caller-supplied track; fall back rather than raise."""
    return track if track in TRACKS else DEFAULT_TRACK


def resume_allowed(track: str | None) -> bool:
    return normalise_track(track) not in TRACKS_WITHOUT_RESUME


# --------------------------------------------------------------------------- #
# Completeness
# --------------------------------------------------------------------------- #
# Weights add up to 100. They encode what actually makes an interview feel
# personal: a headline and real experience matter far more than a skills list,
# because a question grounded in "you interned at X" lands, while one grounded
# in "you know Python" does not. Tune these numbers, not the code below.
_WEIGHTS: dict[str, int] = {
    "headline": 20,
    "goal": 15,
    "education": 20,
    "experiences": 25,
    "skills": 10,
    "projects": 10,
}


def completeness_score(profile: dict) -> int:
    """0-100 — how much of the profile is actually filled in.

    Drives the "add more for sharper questions" nudge in the UI. Kept as a pure
    function so it can be unit-tested without a database or an LLM.
    """
    score = 0
    for field, weight in _WEIGHTS.items():
        value = profile.get(field)
        if isinstance(value, str):
            if value.strip():
                score += weight
        elif isinstance(value, list):
            if value:
                score += weight
    return min(100, score)
