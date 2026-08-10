"""evaluate node — score the captured answer, append a completed Turn."""

from __future__ import annotations

from langchain_core.messages import HumanMessage, SystemMessage

from app.domain.interview import InterviewState, Turn, require_type
from app.prompts.evaluate import evaluate_messages
from app.schemas.evaluation import AnswerEvaluation
from app.services.llm_service import get_llm


def evaluate_node(state: InterviewState) -> dict:
    t = require_type(state["type_id"])
    question = state["current_question"]
    answer = (state.get("last_answer") or "").strip()

    system, human = evaluate_messages(t, question, answer)
    evaluation = (
        get_llm(0.2)
        .with_structured_output(AnswerEvaluation)
        .invoke([SystemMessage(content=system), HumanMessage(content=human)])
    )

    turn: Turn = {"question": question, "answer": answer, "evaluation": evaluation.model_dump()}
    # Clear the buffers so the next ask/answer round starts clean.
    return {"turns": state["turns"] + [turn], "current_question": "", "last_answer": ""}
