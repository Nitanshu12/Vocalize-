"""
FastAPI entrypoint for the interview-service.

Right now this exposes just enough to prove the service is alive and that the
config registry (Step 1) reaches the outside world:

  GET /health                  -> liveness check
  GET /interview/types         -> browser-safe list of interview types
  GET /interview/types/{id}    -> one type (for the brief screen), or 404

The Node backend (gateway) calls these server-side; the browser never talks to
this service directly. The LangGraph agent endpoints (start / answer / finish)
come in a later step.
"""

from fastapi import FastAPI, HTTPException

from app.interview_types import get_interview_type, list_public_types, to_public

app = FastAPI(title="Vocalize Interview Service", version="0.1.0")


@app.get("/health")
def health() -> dict:
    """Liveness check — used by the gateway and (later) Kubernetes probes."""
    return {"status": "ok", "service": "interview-service"}


@app.get("/interview/types")
def interview_types() -> list[dict]:
    """Every interview type, browser-safe — powers the 'choose a round' screen."""
    return list_public_types()


@app.get("/interview/types/{type_id}")
def interview_type(type_id: str) -> dict:
    """One interview type for the brief screen; 404 if the id is unknown."""
    t = get_interview_type(type_id)
    if t is None:
        raise HTTPException(status_code=404, detail="Unknown interview type")
    return to_public(t)
