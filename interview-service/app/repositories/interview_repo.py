"""
Interview session persistence.

For now this is an in-memory dict — enough to track sessions during the MVP. It's
isolated behind this repository so we can swap it for Postgres later without any
caller (interview_service) changing. The LangGraph checkpointer already holds the
full conversation state; this stores the lightweight session record around it.
"""

from __future__ import annotations

from datetime import datetime, timezone


class InterviewRepo:
    def __init__(self) -> None:
        self._store: dict[str, dict] = {}

    def create(self, thread_id: str, type_id: str, language: str) -> None:
        self._store[thread_id] = {
            "threadId": thread_id,
            "typeId": type_id,
            "language": language,
            "status": "active",
            "createdAt": datetime.now(timezone.utc).isoformat(),
        }

    def finish(self, thread_id: str) -> None:
        if thread_id in self._store:
            self._store[thread_id]["status"] = "completed"

    def get(self, thread_id: str) -> dict | None:
        return self._store.get(thread_id)
