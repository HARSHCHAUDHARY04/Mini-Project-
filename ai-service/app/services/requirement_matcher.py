"""
RequirementMatcher: deterministic + confidence-scored matching between
policy requirements (from requirement_extractor) and structured clinical
evidence (from clinical_extractor).

Design principle (spec section 13): "Do not automatically mark missing
evidence as satisfied." Every requirement starts as NOT_FOUND; it is only
promoted to MATCH/PARTIAL if a corresponding, explicit piece of clinical
evidence exists. Confidence scores are derived from how directly the
evidence field maps to the requirement's inferred label plus simple
numeric checks (e.g. duration in weeks meets the policy's threshold).
"""

import re
from typing import Dict, Any, List

STATUS_MATCH = "MATCH"
STATUS_PARTIAL = "PARTIAL"
STATUS_NOT_FOUND = "NOT_FOUND"
STATUS_CONFLICT = "CONFLICT"


def _duration_weeks(duration_str: str) -> float:
    if not duration_str:
        return 0
    m = re.match(r"(\d+)\s*(week|month|day)", duration_str)
    if not m:
        return 0
    n, unit = int(m.group(1)), m.group(2)
    return n * (4.345 if unit == "month" else 1 if unit == "week" else 1 / 7)


def _threshold_weeks(requirement_text: str) -> float:
    m = re.search(r"(\d+)\s*\)?\s*weeks?", requirement_text, re.IGNORECASE)
    return float(m.group(1)) if m else 6.0  # default policy convention in this domain


def match_requirement(requirement: Dict[str, Any], evidence: Dict[str, Any]) -> Dict[str, Any]:
    label = requirement["label"]
    result = {
        "requirementId": requirement["requirementId"],
        "requirement": requirement["text"],
        "section": requirement["section"],
        "page": requirement["page"],
        "patientEvidence": None,
        "status": STATUS_NOT_FOUND,
        "confidence": 0,
        "source": None,
    }

    if label == "symptom_duration":
        if evidence.get("duration"):
            needed = _threshold_weeks(requirement["text"])
            actual = _duration_weeks(evidence["duration"])
            result["patientEvidence"] = f"Patient has symptoms for {evidence['duration']}"
            result["source"] = evidence.get("sources", {}).get("duration")
            if actual >= needed:
                result["status"] = STATUS_MATCH
                result["confidence"] = 98
            elif actual > 0:
                result["status"] = STATUS_PARTIAL
                result["confidence"] = 55
            else:
                result["status"] = STATUS_NOT_FOUND

    elif label == "conservative_treatment":
        treatments = evidence.get("conservative_treatment", [])
        if treatments:
            result["patientEvidence"] = "; ".join(treatments)
            result["status"] = STATUS_MATCH if len(treatments) >= 1 else STATUS_PARTIAL
            result["confidence"] = 96 if len(treatments) >= 2 else 80
            src = evidence.get("sources", {}).get("conservative_treatment")
            result["source"] = src[0]["page"] if src else None

    elif label == "treatment_failure":
        if evidence.get("treatment_failed"):
            snippet = evidence.get("sources", {}).get("treatment_failed", {}).get("snippet", "")
            result["patientEvidence"] = f"Conservative treatment documented as unsuccessful ({snippet})" if snippet else "Conservative treatment failed"
            result["status"] = STATUS_MATCH
            result["confidence"] = 91
            result["source"] = evidence.get("sources", {}).get("treatment_failed", {}).get("page")
        elif evidence.get("conservative_treatment"):
            result["patientEvidence"] = "Conservative treatment attempted; outcome not explicitly documented"
            result["status"] = STATUS_PARTIAL
            result["confidence"] = 45

    elif label == "physician_documentation":
        if evidence.get("physician_recommendation"):
            result["patientEvidence"] = f"Physician recommendation on file: {evidence['physician_recommendation']}"
            result["status"] = STATUS_MATCH
            result["confidence"] = 99
            result["source"] = evidence.get("sources", {}).get("physician_recommendation")

    else:
        result["patientEvidence"] = "Documentation not found in the provided records."
        result["status"] = STATUS_NOT_FOUND
        result["confidence"] = 0

    if result["status"] == STATUS_NOT_FOUND and result["patientEvidence"] is None:
        result["patientEvidence"] = "Documentation not found in the provided records."

    return result


def match_all_requirements(requirements: List[Dict[str, Any]], evidence: Dict[str, Any]) -> List[Dict[str, Any]]:
    return [match_requirement(r, evidence) for r in requirements]
