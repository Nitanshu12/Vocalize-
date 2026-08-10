"""
Interview types (the config registry) + the in-flight interview state.

DESIGN PATTERN: each interview type is a declarative config object. One generic
agent reads a config and runs the whole interview from it. Adding a new type =
adding an entry to REGISTRY below — no engine/node code changes (Open/Closed).

NOTE: competencies, weights, BARS anchors and questions are PROVISIONAL — refine
them after real-world scoring research. They live in config, so refining = edit
values here, not logic anywhere.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import TypedDict

from app.domain.competency import Competency, Persona


@dataclass(frozen=True)
class InterviewType:
    """A full, self-contained definition of one kind of interview."""

    id: str
    label: str
    description: str
    emoji: str
    persona: Persona
    opening_line: str
    competencies: tuple[Competency, ...]
    seed_questions: tuple[str, ...]  # starter bank; the agent adapts around these
    max_questions: int
    target_minutes: int
    language_options: tuple[str, ...] = ("en", "hi")


# --------------------------------------------------------------------------- #
# The registry — add a new interview type by adding an entry here.
# --------------------------------------------------------------------------- #
HR_SCREENING = InterviewType(
    id="hr_screening",
    label="HR Screening",
    description="The first-call round: your story, your motivation, and culture fit.",
    emoji="👤",
    persona=Persona(
        name="Priya Menon",
        title="People Team",
        tone="warm, curious and encouraging; keeps things conversational",
    ),
    opening_line=(
        "Hi, I'm Priya from the People team — thanks for making the time today. "
        "To start us off, tell me a little about yourself."
    ),
    competencies=(
        Competency(
            key="communication",
            label="Communication",
            description="How clearly and coherently the answer is expressed.",
            anchors={
                1: "Rambling or hard to follow; ideas don't connect.",
                3: "Understandable but wordy, or occasionally unclear.",
                5: "Crisp, well-organised and easy to follow throughout.",
            },
        ),
        Competency(
            key="motivation",
            label="Motivation",
            description="Genuine, specific interest in the role and company.",
            anchors={
                1: "Generic or no real reason; sounds uninterested.",
                3: "Some interest, but surface-level or rehearsed.",
                5: "Specific, authentic reasons clearly tied to this role.",
            },
        ),
        Competency(
            key="professionalism",
            label="Professionalism",
            description="Mature, positive, appropriate framing (incl. of past roles).",
            anchors={
                1: "Negative, blames others, or inappropriate tone.",
                3: "Mostly appropriate with minor lapses.",
                5: "Consistently positive, mature and self-aware.",
            },
        ),
        Competency(
            key="confidence",
            label="Confidence",
            description="Composure and conviction (inferred partly from hedging).",
            anchors={
                1: "Very hesitant; constant hedging and second-guessing.",
                3: "Some hesitation but recovers and commits.",
                5: "Calm and self-assured; owns the answer without arrogance.",
            },
        ),
    ),
    seed_questions=(
        "Tell me a little about yourself.",
        "What draws you to this role?",
        "What's a strength you're proud of, and one weakness you're working on?",
        "Tell me about a time you worked closely with a team.",
        "Where do you hope to grow over the next couple of years?",
    ),
    max_questions=6,
    target_minutes=10,
)

PRODUCT = InterviewType(
    id="product",
    label="Product",
    description="Think like a PM: product sense, structure, trade-offs and metrics.",
    emoji="📊",
    persona=Persona(
        name="Ananya Iyer",
        title="Senior Product Manager",
        tone="sharp, structured and probing; pushes for reasoning and trade-offs",
    ),
    opening_line=(
        "Hey, I'm Ananya, a Senior PM here. Let's dive in — I'm keen to hear how "
        "you think about products. Ready when you are."
    ),
    competencies=(
        Competency(
            key="product_sense",
            label="Product Sense",
            description="User empathy and sound product judgment.",
            anchors={
                1: "Ignores the user; suggestions feel arbitrary.",
                3: "Reasonable ideas but shallow user insight.",
                5: "Sharp user empathy driving well-judged decisions.",
            },
        ),
        Competency(
            key="structure",
            label="Structure",
            description="Breaks the problem into a clear, logical framework.",
            anchors={
                1: "Jumps around; no discernible approach.",
                3: "Some structure but gaps or backtracking.",
                5: "Clear framework, walked through step by step.",
            },
        ),
        Competency(
            key="prioritization",
            label="Prioritization",
            description="Makes and justifies trade-offs; picks what matters first.",
            anchors={
                1: "Tries to do everything; no trade-offs made.",
                3: "Prioritises but weak justification.",
                5: "Clear, well-reasoned trade-offs with a rationale.",
            },
        ),
        Competency(
            key="metrics",
            label="Metrics",
            description="Defines how success would be measured.",
            anchors={
                1: "No success measure mentioned.",
                3: "Names metrics but generic or partly relevant.",
                5: "Defines the right metrics and why they matter.",
            },
        ),
    ),
    seed_questions=(
        "How would you improve your favourite app?",
        "Design a product for people who commute long distances every day.",
        "With limited engineering time, how would you decide what to build next?",
        "What metrics would you track for a food-delivery app, and why?",
    ),
    max_questions=5,
    target_minutes=15,
)

# Insertion order is preserved, so this is also the order the UI shows them in.
REGISTRY: dict[str, InterviewType] = {
    HR_SCREENING.id: HR_SCREENING,
    PRODUCT.id: PRODUCT,
}


# --------------------------------------------------------------------------- #
# Accessors
# --------------------------------------------------------------------------- #
def get_interview_type(type_id: str) -> InterviewType | None:
    return REGISTRY.get(type_id)


def require_type(type_id: str) -> InterviewType:
    """Like get_interview_type, but raises instead of returning None."""
    t = REGISTRY.get(type_id)
    if t is None:
        raise ValueError(f"Unknown interview type: {type_id!r}")
    return t


def to_public(t: InterviewType) -> dict:
    """Browser-safe view: drops the scoring rubric and seed questions so users
    can't see or game the grading, or peek at upcoming questions."""
    return {
        "id": t.id,
        "label": t.label,
        "description": t.description,
        "emoji": t.emoji,
        "persona": {"name": t.persona.name, "title": t.persona.title},
        "competencies": [c.label for c in t.competencies],
        "maxQuestions": t.max_questions,
        "targetMinutes": t.target_minutes,
        "languageOptions": list(t.language_options),
    }


def list_public_types() -> list[dict]:
    """Every type in registry order, browser-safe — powers the setup screen."""
    return [to_public(t) for t in REGISTRY.values()]


# --------------------------------------------------------------------------- #
# In-flight interview state — the shared memory the LangGraph agent carries.
# --------------------------------------------------------------------------- #
class Turn(TypedDict):
    question: str
    answer: str
    evaluation: dict | None  # AnswerEvaluation.model_dump()


class InterviewState(TypedDict):
    type_id: str
    language: str  # "en" | "hi"
    turns: list[Turn]  # completed Q&A + their evaluations
    current_question: str  # the question awaiting an answer ("" when none)
    last_answer: str  # the answer just captured, fed into evaluate_node
    finished: bool
    report: dict | None  # final scorecard + coach feedback (set by feedback_node)


def initial_state(type_id: str, language: str) -> InterviewState:
    """A fresh interview's starting state."""
    require_type(type_id)  # validate early
    return {
        "type_id": type_id,
        "language": language,
        "turns": [],
        "current_question": "",
        "last_answer": "",
        "finished": False,
        "report": None,
    }
