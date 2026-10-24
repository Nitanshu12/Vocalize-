from __future__ import annotations

from langgraph.checkpoint.memory import MemorySaver
from langgraph.graph import END, START, StateGraph

from app.domain.interview import InterviewState, require_type
from app.nodes.ask_node import ask_node
from app.nodes.evaluate_node import evaluate_node
from app.nodes.feedback_node import feedback_node


def _route_after_evaluate(state: InterviewState) -> str:
    """Enough questions asked -> wrap up; otherwise ask another."""
    t = require_type(state["type_id"])
    return "feedback" if len(state["turns"]) >= t.max_questions else "ask"


def build_graph():
    g = StateGraph(InterviewState)
    g.add_node("ask", ask_node)
    g.add_node("evaluate", evaluate_node)
    g.add_node("feedback", feedback_node)

    g.add_edge(START, "ask")
    g.add_edge("ask", "evaluate")  # resumes here after the interrupt
    g.add_conditional_edges("evaluate", _route_after_evaluate, {"ask": "ask", "feedback": "feedback"})
    g.add_edge("feedback", END)

    return g.compile(checkpointer=MemorySaver(), interrupt_after=["ask"])
