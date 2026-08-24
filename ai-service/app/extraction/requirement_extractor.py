"""
RequirementExtractor: turns retrieved policy chunks into discrete,
structured requirement objects (spec section 12).

Rule-based on purpose: requirement language in medical-necessity policies
is reliably signaled by modal/obligation phrasing ("must", "required",
"at least", "prior to"). Extracting requirements this way keeps every
requirement traceable to an exact sentence in an exact policy chunk —
nothing is paraphrased or invented.
"""

import re
from typing import List, Dict, Any

REQUIREMENT_SIGNAL_PATTERN = re.compile(
    r"([^.]*\b(?:must|required|at least|prior to|shall|need to)\b[^.]*\.)",
    re.IGNORECASE,
)

# Human-readable short labels inferred from keywords in the requirement text,
# used to align requirements with clinical evidence fields during matching.
LABEL_RULES = [
    (r"persist(ed)?\s+for\s+at\s+least|duration\s+of\s+symptoms|six\s*\(?6\)?\s*weeks", "symptom_duration"),
    (r"fail(ed|ure)\s+to\s+produce|meaningful\s+improvement|intolerant", "treatment_failure"),
    (r"conservative\s+treatment|physical\s+therapy|pharmacologic", "conservative_treatment"),
    (r"physician.{0,20}document|clinical\s+rationale|advanced\s+imaging", "physician_documentation"),
]


def _infer_label(sentence: str) -> str:
    for pattern, label in LABEL_RULES:
        if re.search(pattern, sentence, re.IGNORECASE):
            return label
    return "general"


def extract_requirements(policy_chunks: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    policy_chunks: results from rag_engine.retrieve_policy_sections
    Returns a de-duplicated, numbered list of requirement objects.
    """
    requirements = []
    seen_text = set()
    counter = 1

    for chunk in policy_chunks:
        for match in REQUIREMENT_SIGNAL_PATTERN.finditer(chunk["text"]):
            sentence = match.group(1).strip()
            normalized = re.sub(r"\s+", " ", sentence).lower()
            if normalized in seen_text or len(sentence) < 15:
                continue
            seen_text.add(normalized)
            requirements.append({
                "requirementId": f"REQ-{counter}",
                "label": _infer_label(sentence),
                "text": sentence,
                "section": chunk["section"],
                "page": chunk["page"],
                "policyName": chunk["policyName"],
            })
            counter += 1

    return requirements
