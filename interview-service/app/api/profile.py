"""
HTTP routes for candidate-profile extraction.

This service PARSES but never PERSISTS. The Node gateway owns the database and
the user's identity; we receive bytes or answers, return a structured profile,
and forget it. Keeping personal data out of this process means there is exactly
one system of record to secure, audit and honour deletion requests against —
and it keeps this service horizontally scalable and stateless.

Both routes spend Groq tokens, so both sit behind the shared internal key.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile

from app.api.interview import verify_internal
from app.domain.profile import DEFAULT_TRACK, completeness_score
from app.schemas.profile import CandidateProfile, GuidedAnswers
from app.services import profile_service
from app.services.resume_service import ResumeParseError, extract_text

router = APIRouter(prefix="/profile", tags=["profile"])


def _to_response(profile: CandidateProfile, source: str) -> dict:
    """One response shape for both paths, so the gateway stores them identically."""
    data = profile.model_dump()
    return {"source": source, "profile": data, "completeness": completeness_score(data)}


@router.post("/parse-resume", dependencies=[Depends(verify_internal)])
async def parse_resume(file: UploadFile = File(...)) -> dict:
    """Uploaded CV -> structured candidate brief.

    Two distinct failure modes, deliberately mapped to different statuses:
      * ResumeParseError -> 400, because the USER can fix it (wrong file type,
        a scan, a password-protected PDF) and the message tells them how.
      * anything else    -> 502, because the model call failed and that is ours
        to fix, not theirs.
    """
    try:
        text = extract_text(await file.read(), file.filename or "")
    except ResumeParseError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    try:
        profile = profile_service.from_resume(text)
    except Exception as exc:
        raise HTTPException(
            status_code=502, detail=f"Could not read that resume right now: {exc}"
        )
    return _to_response(profile, "resume")


@router.post("/guided", dependencies=[Depends(verify_internal)])
def parse_guided(answers: GuidedAnswers, track: str = DEFAULT_TRACK) -> dict:
    """Four plain-language answers -> the same structured candidate brief."""
    if not any(
        (answers.studying_or_working, answers.experience, answers.skills, answers.goal)
    ):
        raise HTTPException(status_code=400, detail="Please answer at least one question.")

    try:
        profile = profile_service.from_guided(answers, track)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Could not build your profile: {exc}")
    return _to_response(profile, "guided")
