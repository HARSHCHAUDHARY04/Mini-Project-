"""
ClinicalEvidenceExtractor: pulls structured clinical evidence out of raw
clinical-note text, with source location tracking (page markers like
"--- PAGE 2 ---" are preserved by the document processor, see
document_processor.py) so every extracted fact can later be cited.

Approach: deterministic keyword / regex extraction tuned to the kinds of
statements medical necessity policies actually check for (symptom
duration, conservative treatment, treatment failure, physician
recommendation). This intentionally avoids letting a generative model
"summarize" clinical notes, since summarization is exactly where
hallucinated facts creep in. Every value returned here is either a direct
regex capture from the source text or a source-quoted match.
"""

import re
from typing import List, Dict, Any


DURATION_PATTERN = r"(?:for|persisted for|x)\s*(\d+)\s*(week|month|day)s?"
SYMPTOM_KEYWORDS = [
    "lower back pain", "low back pain", "neck pain", "radiculopathy",
    "numbness", "tingling", "weakness", "sciatica",
]
_WORD_NUM = r"(?:\d+|one|two|three|four|five|six|seven|eight|nine|ten|twelve)"
CONSERVATIVE_TREATMENT_PATTERNS = [
    (rf"({_WORD_NUM}\s*weeks?\s*of\s*physical\s*therapy)", "physical therapy"),
    (rf"(physical\s*therapy.{{0,40}}?{_WORD_NUM}\s*weeks?)", "physical therapy"),
    (r"(NSAID[S]?\b[^.]*)", "NSAID medication"),
    (r"(home\s*exercise\s*program[^.]*)", "home exercise program"),
]
FAILURE_KEYWORDS = [
    "did not provide sufficient improvement", "no significant improvement",
    "no meaningful reduction", "minimal improvement", "failed", "unsuccessful",
    "discontinued due to lack of efficacy",
]
RECOMMENDATION_PATTERN = r"(?:physician\s*)?recommends?\s+([^.\n]+)"


def _split_pages(text: str) -> List[Dict[str, Any]]:
    """Split text on '--- PAGE N ---' markers; default everything to page 1 if absent."""
    parts = re.split(r"---\s*PAGE\s*(\d+)\s*---", text, flags=re.IGNORECASE)
    if len(parts) == 1:
        return [{"page": 1, "text": text}]
    pages = []
    # parts alternates [preamble, page_num, page_text, page_num, page_text, ...]
    if parts[0].strip():
        pages.append({"page": 1, "text": parts[0]})
    for i in range(1, len(parts), 2):
        page_num = int(parts[i])
        page_text = parts[i + 1] if i + 1 < len(parts) else ""
        pages.append({"page": page_num, "text": page_text})
    return pages


def _normalize_whitespace(text: str) -> str:
    """Collapse line-wraps within a paragraph to single spaces, so regexes
    like duration/recommendation patterns aren't broken by mid-sentence
    line breaks, while still treating blank lines as paragraph breaks."""
    paragraphs = re.split(r"\n\s*\n", text)
    return "\n\n".join(" ".join(p.split()) for p in paragraphs)


def _find_with_source(pattern: str, pages: List[Dict[str, Any]], flags=re.IGNORECASE):
    for page in pages:
        match = re.search(pattern, _normalize_whitespace(page["text"]), flags)
        if match:
            return match, page["page"]
    return None, None


def extract_clinical_evidence(text: str) -> Dict[str, Any]:
    pages = _split_pages(text)
    evidence: Dict[str, Any] = {
        "symptoms": [],
        "duration": None,
        "severity": None,
        "conservative_treatment": [],
        "previous_medications": [],
        "treatment_failed": False,
        "physician_recommendation": None,
        "sources": {},
    }

    lowered_full = text.lower()

    # Symptoms
    for kw in SYMPTOM_KEYWORDS:
        if kw in lowered_full:
            evidence["symptoms"].append(kw)

    # Severity
    severity_match = re.search(r"\b(mild|moderate|severe)\b", text, re.IGNORECASE)
    if severity_match:
        evidence["severity"] = severity_match.group(1).lower()
        evidence["sources"]["severity"] = _page_of(pages, severity_match.group(0))

    # Duration
    match, page = _find_with_source(DURATION_PATTERN, pages)
    if match:
        evidence["duration"] = f"{match.group(1)} {match.group(2)}s"
        evidence["sources"]["duration"] = page

    # Conservative treatment
    for pattern, label in CONSERVATIVE_TREATMENT_PATTERNS:
        m, page = _find_with_source(pattern, pages)
        if m:
            snippet = m.group(0).strip()
            if label not in evidence["conservative_treatment"]:
                evidence["conservative_treatment"].append(label)
            if "NSAID" in label.upper():
                evidence["previous_medications"].append("NSAIDs")
            evidence["sources"].setdefault("conservative_treatment", []).append(
                {"label": label, "snippet": snippet, "page": page}
            )

    # Treatment failure
    for kw in FAILURE_KEYWORDS:
        m, page = _find_with_source(re.escape(kw), pages)
        if m:
            evidence["treatment_failed"] = True
            evidence["sources"]["treatment_failed"] = {"snippet": kw, "page": page}
            break

    # Physician recommendation
    m, page = _find_with_source(RECOMMENDATION_PATTERN, pages)
    if m:
        evidence["physician_recommendation"] = m.group(1).strip().rstrip(".")
        evidence["sources"]["physician_recommendation"] = page

    if evidence["sources"].get("duration"):
        evidence.setdefault("sources", {})

    evidence["extractionCompleteness"] = _score_completeness(evidence)
    return evidence


def _page_of(pages: List[Dict[str, Any]], snippet: str):
    for page in pages:
        if snippet in page["text"]:
            return page["page"]
    return None


def _score_completeness(evidence: Dict[str, Any]) -> float:
    fields = [
        bool(evidence["symptoms"]),
        bool(evidence["duration"]),
        bool(evidence["conservative_treatment"]),
        evidence["treatment_failed"],
        bool(evidence["physician_recommendation"]),
    ]
    return round(sum(fields) / len(fields), 2)
