"""
Smoke test — proves LangGraph + Groq are wired up before we build the real agent.

A trivial ONE-node graph: take a prompt, call Groq once, return the reply. This
is not the interview agent — it just confirms the plumbing (key, model, network,
LangGraph compile/invoke) works. Run from interview-service/ with the venv:

    source .venv/bin/activate
    python -m app.llm_smoke
"""

from typing import TypedDict

from langchain_groq import ChatGroq
from langgraph.graph import StateGraph, START, END

from app.config import GROQ_MODEL, require_groq


# The graph's shared memory. Every node receives it and returns partial updates
# that LangGraph merges back in. Here: an input prompt and the LLM's reply.
class SmokeState(TypedDict):
    prompt: str
    reply: str


def call_llm(state: SmokeState) -> dict:
    """The single node: send the prompt to Groq, capture the answer."""
    require_groq()  # ChatGroq reads GROQ_API_KEY from the env that .env populated
    llm = ChatGroq(model=GROQ_MODEL, temperature=0.4)
    result = llm.invoke(state["prompt"])
    return {"reply": result.content}


def build_graph():
    """START -> call_llm -> END. The smallest possible LangGraph."""
    g = StateGraph(SmokeState)
    g.add_node("call_llm", call_llm)
    g.add_edge(START, "call_llm")
    g.add_edge("call_llm", END)
    return g.compile()


if __name__ == "__main__":
    graph = build_graph()
    out = graph.invoke(
        {"prompt": "In one warm sentence, wish a nervous candidate good luck before their interview."}
    )
    print("Groq replied:\n", out["reply"])
