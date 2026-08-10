"""feedback node — aggregate scores + write the coach wrap-up; ends the graph."""

from __future__ import annotations

from langchain_core.messages import HumanMessage, SystemMessage

from app.domain.interview import InterviewState, require_type
from app.prompts.feedback import feedback_messages
from app.schemas.evaluation import CoachFeedback
from app.services.llm_service import get_llm
from app.services.scoring_service import aggregate_scores


def feedback_node(state: InterviewState) -> dict:
    t = require_type(state["type_id"])

    # Deterministic scorecard first (pure maths), then the LLM coach note on top.
    breakdown = aggregate_scores(t, state["turns"])
    system, human = feedback_messages(t, state["turns"], breakdown, state["language"])
    coach = (
        get_llm(0.4)
        .with_structured_output(CoachFeedback)
        .invoke([SystemMessage(content=system), HumanMessage(content=human)])
    )

    report = {**breakdown, "coach": coach.model_dump()}
    return {"report": report, "finished": True}
