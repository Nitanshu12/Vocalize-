from __future__ import annotations

from dataclasses import dataclass
from typing import TypedDict

from app.domain.competency import Competency, Persona
from app.domain.profile import TRACK_COLLEGE, TRACK_PROFESSIONAL, TRACK_SCHOOL, normalise_track


@dataclass(frozen=True)
class InterviewType:
    id: str
    label: str
    description: str
    emoji: str
    persona: Persona
    opening_line: str
    competencies: tuple[Competency, ...]
    seed_questions: tuple[str, ...] 
    max_questions: int
    target_minutes: int
    language_options: tuple[str, ...] = ("en", "hi")

    # --- Audience configuration (schema v6) ------------------------------- #
    # `tracks` decides WHO is offered this round. A type can belong to several,
    # which is why this is a tuple and not a single string.
    # `profile_depth` is the background this round works best with — the UI uses
    # it to decide what to ask for before the interview starts.
    # Adding a whole new audience is now a config entry, not an engine change:
    # that is the Open/Closed Principle doing its job.
    tracks: tuple[str, ...] = (TRACK_COLLEGE, TRACK_PROFESSIONAL)
    profile_depth: str = "guided"  # "none" | "guided" | "resume"


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
    tracks=(TRACK_COLLEGE, TRACK_PROFESSIONAL),
    profile_depth="resume",
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
    tracks=(TRACK_COLLEGE, TRACK_PROFESSIONAL),
    profile_depth="guided",
)

# A school-track round. Notice that adding an entirely new audience required ZERO
# changes to the agent, the nodes, the scoring maths or the API — only this
# config block. The persona's `tone` is what makes Meera sound right to a
# thirteen-year-old while Priya sounds right to a graduate; same engine, and the
# competencies are age-appropriate rather than watered-down corporate ones.
SELF_INTRO = InterviewType(
    id="self_intro",
    label="Introduce Yourself",
    description="A friendly first round: who you are, what you love, and what you're proud of.",
    emoji="🌟",
    persona=Persona(
        name="Meera",
        title="Communication Coach",
        tone=(
            "warm, patient and encouraging; uses simple everyday words, never rushes, "
            "and celebrates effort before pointing anything out"
        ),
    ),
    opening_line=(
        "Hi! I'm Meera, and I help people get better at speaking. There are no wrong "
        "answers here — let's just chat. So, tell me a bit about yourself!"
    ),
    competencies=(
        Competency(
            key="clarity",
            label="Clarity",
            description="Speaks in a way that is easy to follow.",
            anchors={
                1: "Very hard to follow; thoughts trail off or jump around.",
                3: "Mostly understandable, with some confusing patches.",
                5: "Easy to follow from start to finish.",
            },
        ),
        Competency(
            key="confidence",
            label="Confidence",
            description="Sounds steady and willing to speak up.",
            anchors={
                1: "Very hesitant; one-word answers or long silences.",
                3: "Speaks up but sounds unsure in places.",
                5: "Speaks steadily and seems comfortable.",
            },
        ),
        Competency(
            key="expression",
            label="Expression",
            description="Brings some energy and feeling rather than sounding flat.",
            anchors={
                1: "Flat and monotone throughout.",
                3: "Some warmth, but mostly even.",
                5: "Lively and expressive; you can hear the interest.",
            },
        ),
        Competency(
            key="detail",
            label="Detail",
            description="Gives examples instead of stopping at one-line answers.",
            anchors={
                1: "Answers in a few words with no examples.",
                3: "Gives some detail when prompted.",
                5: "Naturally offers examples and small stories.",
            },
        ),
    ),
    seed_questions=(
        "Tell me a bit about yourself.",
        "What is something you really enjoy doing?",
        "Tell me about something you made or did that you're proud of.",
        "Who is someone you look up to, and why?",
        "What is something new you would love to learn?",
    ),
    max_questions=4,
    target_minutes=6,
    tracks=(TRACK_SCHOOL,),
    profile_depth="guided",
)


# Insertion order is preserved, so this is also the order the UI shows them in.
REGISTRY: dict[str, InterviewType] = {
    SELF_INTRO.id: SELF_INTRO,
    HR_SCREENING.id: HR_SCREENING,
    PRODUCT.id: PRODUCT,
}


# --------------------------------------------------------------------------- #
# Accessors
# --------------------------------------------------------------------------- #
def get_interview_type(type_id: str) -> InterviewType | None:
    return REGISTRY.get(type_id)


def require_type(type_id: str) -> InterviewType:
    t = REGISTRY.get(type_id)
    if t is None:
        raise ValueError(f"Unknown interview type: {type_id!r}")
    return t


def to_public(t: InterviewType) -> dict:
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
        "tracks": list(t.tracks),
        "profileDepth": t.profile_depth,
    }


def list_public_types(track: str | None = None) -> list[dict]:
    """Browser-safe types in registry order, optionally narrowed to one track.

    This is the whole differentiation feature in three lines: a school user is
    never offered an HR screening round, and a graduate is never offered the
    children's one. Passing `None` returns everything (useful for admin views).
    """
    types = REGISTRY.values()
    if track is not None:
        wanted = normalise_track(track)
        types = [t for t in types if wanted in t.tracks]
    return [to_public(t) for t in types]


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
    # The candidate brief, injected by the Node gateway at /start. Read by the
    # ask node so questions can be grounded in this specific person. None when
    # the user chose to skip — every node must stay correct without it.
    profile: dict | None


def initial_state(type_id: str, language: str, profile: dict | None = None) -> InterviewState:
    """A fresh interview's starting state."""
    require_type(type_id)  # validate early
    return {
        "type_id": type_id,
        "language": language,
        "profile": profile,
        "turns": [],
        "current_question": "",
        "last_answer": "",
        "finished": False,
        "report": None,
    }
