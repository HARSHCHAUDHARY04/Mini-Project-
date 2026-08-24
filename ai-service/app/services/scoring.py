"""
Explainable appealability scoring (spec section 14).

The score is a weighted composite of four sub-scores, each computed from
concrete inputs so the "explanation" is not a black box:

  - policyRequirementsSatisfied: fraction of requirements at MATCH status
  - clinicalEvidenceStrength: average confidence across MATCH/PARTIAL items
  - documentationCompleteness: from ClinicalEvidenceExtractor's own
    extractionCompleteness score
  - denialSpecificity: how well-defined the denial code/category is
    (a vague/unknown code lowers confidence that the right evidence gap
    was even identified)

This is explicitly NOT a probability of approval — see the disclaimer
returned alongside the score.
"""

from typing import List, Dict, Any

WEIGHTS = {
    "policyRequirementsSatisfied": 0.40,
    "clinicalEvidenceStrength": 0.30,
    "documentationCompleteness": 0.20,
    "denialSpecificity": 0.10,
}


def _classify(score: float) -> str:
    if score >= 80:
        return "Strong"
    if score >= 60:
        return "Moderate"
    if score >= 40:
        return "Weak"
    return "Insufficient Evidence"


def compute_appealability_score(
    matched_requirements: List[Dict[str, Any]],
    evidence_completeness: float,
    denial_code_known: bool,
) -> Dict[str, Any]:
    total = len(matched_requirements) or 1
    matched = [r for r in matched_requirements if r["status"] == "MATCH"]
    partial = [r for r in matched_requirements if r["status"] == "PARTIAL"]

    policy_requirements_satisfied = round((len(matched) / total) * 100, 1)

    confidences = [r["confidence"] for r in matched_requirements if r["status"] in ("MATCH", "PARTIAL")]
    clinical_evidence_strength = round(sum(confidences) / len(confidences), 1) if confidences else 0

    documentation_completeness = round(evidence_completeness * 100, 1)
    denial_specificity = 90 if denial_code_known else 30

    final_score = round(
        policy_requirements_satisfied * WEIGHTS["policyRequirementsSatisfied"]
        + clinical_evidence_strength * WEIGHTS["clinicalEvidenceStrength"]
        + documentation_completeness * WEIGHTS["documentationCompleteness"]
        + denial_specificity * WEIGHTS["denialSpecificity"],
        1,
    )

    return {
        "score": final_score,
        "classification": _classify(final_score),
        "breakdown": {
            "policyRequirementsSatisfied": {
                "value": policy_requirements_satisfied,
                "detail": f"{len(matched)}/{total} requirements satisfied ({len(partial)} partial)",
                "weight": WEIGHTS["policyRequirementsSatisfied"],
            },
            "clinicalEvidenceStrength": {
                "value": clinical_evidence_strength,
                "detail": "Average confidence across matched/partial clinical evidence items",
                "weight": WEIGHTS["clinicalEvidenceStrength"],
            },
            "documentationCompleteness": {
                "value": documentation_completeness,
                "detail": "Share of expected clinical documentation fields present in the notes",
                "weight": WEIGHTS["documentationCompleteness"],
            },
            "denialSpecificity": {
                "value": denial_specificity,
                "detail": "Whether the denial code maps to a known, well-defined category",
                "weight": WEIGHTS["denialSpecificity"],
            },
        },
        "disclaimer": (
            "This score reflects how well current documentation aligns with the payer's "
            "stated policy requirements. It is NOT a guaranteed approval probability and "
            "does not constitute legal or medical advice."
        ),
    }
