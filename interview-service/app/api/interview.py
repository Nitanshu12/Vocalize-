"""HTTP routes for Interview Mode — types (public) + session flow (start/answer)."""

from __future__ import annotations

from fastapi import APIRouter, Depends, Header, HTTPException

from app.config.settings import INTERNAL_API_KEY
from app.domain.interview import get_interview_type, list_public_types, to_public
from app.schemas.session import AnswerRequest, StartRequest
from app.services.interview_service import InterviewService

router = APIRouter(prefix="/interview", tags=["interview"])

# One service instance for the process: it holds the compiled graph + the
# in-memory checkpointer that carries each interview's state between turns.
_service = InterviewService()


def verify_internal(x_internal_key: str = Header(default="", alias="X-Internal-Key")) -> None:
    """Only the Node gateway (which knows INTERNAL_API_KEY) may hit token-spending
    routes. Skipped when the key is unset (local dev)."""
    if INTERNAL_API_KEY and x_internal_key != INTERNAL_API_KEY:
        raise HTTPException(status_code=401, detail="Unauthorized")


# --------------------------------------------------------------------------- #
# Types (public — power the setup + brief screens)
# --------------------------------------------------------------------------- #
@router.get("/types")
def interview_types() -> list[dict]:
    return list_public_types()


@router.get("/types/{type_id}")
def interview_type(type_id: str) -> dict:
    t = get_interview_type(type_id)
    if t is None:
        raise HTTPException(status_code=404, detail="Unknown interview type")
    return to_public(t)


# --------------------------------------------------------------------------- #
# Session flow (guarded — these run the agent and spend tokens)
# --------------------------------------------------------------------------- #
@router.post("/start", dependencies=[Depends(verify_internal)])
def start(body: StartRequest) -> dict:
    """Begin an interview; returns { threadId, question } (the opening line)."""
    try:
        return _service.start(body.typeId, body.language)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/answer", dependencies=[Depends(verify_internal)])
def answer(body: AnswerRequest) -> dict:
    """Submit an answer; returns the next { question } or { done, report }."""
    try:
        return _service.answer(body.threadId, body.answer)
    except KeyError:
        raise HTTPException(status_code=404, detail="Unknown interview session")
