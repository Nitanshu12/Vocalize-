"""
FastAPI entrypoint. Thin: creates the app and mounts the routers. The browser
never calls this directly — the Node backend (gateway) does.
"""

from fastapi import FastAPI

from app.api.interview import router as interview_router

app = FastAPI(title="Vocalize Interview Service", version="0.1.0")


@app.get("/health")
def health() -> dict:
    """Liveness check — used by the gateway and (later) Kubernetes probes."""
    return {"status": "ok", "service": "interview-service"}


app.include_router(interview_router)
