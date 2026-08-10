"""
Deterministic scoring — turns per-answer LLM scores into a final scorecard.

The LLM scores each answer per competency (1-5). This service AGGREGATES those
across the whole interview: average each competency over all turns, apply the
(currently equal) weights, and scale to an overall /100. No LLM here — pure
maths, so the final number is reproducible and explainable.
"""

from __future__ import annotations

from app.domain.interview import InterviewType


def aggregate_scores(t: InterviewType, turns: list[dict]) -> dict:
    """Return {competencies: [{key,label,score}], overallScore, overallOutOf5}."""
    label_by_key = {c.key: c.label for c in t.competencies}
    weight_by_key = {c.key: c.weight for c in t.competencies}
    collected: dict[str, list[int]] = {c.key: [] for c in t.competencies}

    for turn in turns:
        ev = turn.get("evaluation")
        if not ev:
            continue
        for s in ev["scores"]:
            if s["key"] in collected:
                collected[s["key"]].append(s["score"])

    competencies = []
    weighted_sum = 0.0
    weight_total = 0.0
    for key, scores in collected.items():
        avg = sum(scores) / len(scores) if scores else 0.0
        competencies.append({"key": key, "label": label_by_key[key], "score": round(avg, 1)})
        weight = weight_by_key[key]
        weighted_sum += avg * weight
        weight_total += weight

    overall5 = weighted_sum / weight_total if weight_total else 0.0
    return {
        "competencies": competencies,
        "overallOutOf5": round(overall5, 1),
        "overallScore": round(overall5 / 5 * 100),  # /100 for the gauge
    }
