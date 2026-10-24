from __future__ import annotations

import uuid

from app.agents.interview_agent import build_graph
from app.domain.interview import initial_state
from app.repositories.interview_repo import InterviewRepo


class InterviewService:
    def __init__(self) -> None:
        self._graph = build_graph()
        self._repo = InterviewRepo()

    def _config(self, thread_id: str) -> dict:
        # thread_id is how the checkpointer keys each interview's saved state.
        return {"configurable": {"thread_id": thread_id}}

    def start(self, type_id: str, language: str, profile: dict | None = None) -> dict:
        thread_id = str(uuid.uuid4())
        # The profile goes into the graph's initial state, so the checkpointer
        # carries it across every turn of this interview without the gateway
        # having to resend it on each answer.
        state = self._graph.invoke(
            initial_state(type_id, language, profile), self._config(thread_id)
        )
        self._repo.create(thread_id, type_id, language)
        return {"threadId": thread_id, "question": state["current_question"]}

    def answer(self, thread_id: str, text: str) -> dict:
        if self._repo.get(thread_id) is None:
            raise KeyError(thread_id)  # unknown/expired session -> caller maps to 404
        config = self._config(thread_id)
        # Inject the user's answer, then resume the paused graph (evaluate -> route).
        self._graph.update_state(config, {"last_answer": text})
        state = self._graph.invoke(None, config)

        if state.get("finished"):
            self._repo.finish(thread_id)
            return {"done": True, "report": state["report"]}
        return {"done": False, "question": state["current_question"]}
