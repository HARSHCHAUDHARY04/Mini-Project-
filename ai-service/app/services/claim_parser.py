"""
ClaimParser: extracts structured claim fields from raw text pulled out of an
uploaded PDF/TXT/CSV/JSON EOB or denial letter.

This is a rule-based (regex) extractor rather than an LLM call. Claim
fields are highly structured and label-driven in real EOBs, so a
deterministic parser is both more reliable and fully auditable for a
compliance-sensitive workflow. If a field can't be found, it is returned
as None so the frontend can prompt for manual correction (per spec
section 7), rather than guessing.
"""

import re
import json
from typing import Optional


FIELD_PATTERNS = {
    "claimId": r"claim\s*id\s*[:\-]?\s*([A-Za-z0-9\-]+)",
    "payer": r"payer\s*[:\-]?\s*(.+)",
    "procedure": r"procedure\s*[:\-]?\s*(?!code)(.+)",
    "procedureCode": r"procedure\s*code\s*[:\-]?\s*([A-Za-z0-9 ]+)",
    "diagnosisCode": r"diagnosis\s*code\s*[:\-]?\s*([A-Za-z0-9.\s]+)",
    "denialCode": r"denial\s*code\s*[:\-]?\s*([A-Za-z0-9\-]+)",
    "denialReason": r"denial\s*reason\s*[:\-]?\s*(.+)",
    "amount": r"(?:billed\s*amount|amount)\s*[:\-]?\s*\$?\s*([\d,]+\.?\d*)",
    "dateOfService": r"date\s*of\s*service\s*[:\-]?\s*([\d]{4}-[\d]{2}-[\d]{2}|[\d]{1,2}/[\d]{1,2}/[\d]{2,4})",
    "provider": r"provider\s*[:\-]?\s*(.+)",
    "patientName": r"patient\s*name\s*[:\-]?\s*(.+)",
    "patientId": r"patient\s*id\s*[:\-]?\s*([A-Za-z0-9\-]+)",
}

EOB_EXPLANATION_PATTERN = r'eob\s*explanation\s*[:\-]?\s*"?(.+?)"?(?:\n\n|\Z)'


def _clean(value: Optional[str]) -> Optional[str]:
    if value is None:
        return None
    return value.strip().strip('"').strip()


def parse_claim_text(text: str) -> dict:
    """Parse a raw EOB/claim text blob into structured fields."""
    result = {}
    for field, pattern in FIELD_PATTERNS.items():
        match = re.search(pattern, text, re.IGNORECASE)
        result[field] = _clean(match.group(1)) if match else None

    if result.get("amount"):
        try:
            result["amount"] = float(result["amount"].replace(",", ""))
        except ValueError:
            result["amount"] = None

    eob_match = re.search(EOB_EXPLANATION_PATTERN, text, re.IGNORECASE | re.DOTALL)
    result["eobExplanation"] = _clean(eob_match.group(1)) if eob_match else None

    result["extractionWarnings"] = [
        field for field, value in result.items()
        if value is None and field != "eobExplanation"
    ]
    result["extractionConfidence"] = round(
        1 - (len(result["extractionWarnings"]) / max(len(FIELD_PATTERNS), 1)), 2
    )
    return result


def parse_claim_json(payload: dict) -> dict:
    """Normalize an already-structured JSON claim upload (spec section 7: JSON supported)."""
    result = {field: payload.get(field) for field in FIELD_PATTERNS.keys()}
    result["eobExplanation"] = payload.get("eobExplanation")
    result["extractionWarnings"] = [f for f, v in result.items() if v is None]
    result["extractionConfidence"] = 1.0 if not result["extractionWarnings"] else 0.85
    return result


def parse_claim_csv_row(row: dict) -> dict:
    """Normalize a CSV row (already parsed to dict by pandas) into claim fields."""
    normalized = {k.strip().lower().replace(" ", ""): v for k, v in row.items()}
    mapping = {
        "claimId": "claimid",
        "payer": "payer",
        "procedure": "procedure",
        "procedureCode": "procedurecode",
        "diagnosisCode": "diagnosiscode",
        "denialCode": "denialcode",
        "denialReason": "denialreason",
        "amount": "amount",
        "dateOfService": "dateofservice",
        "provider": "provider",
        "patientName": "patientname",
        "patientId": "patientid",
    }
    result = {field: normalized.get(key) for field, key in mapping.items()}
    if result.get("amount") is not None:
        try:
            result["amount"] = float(str(result["amount"]).replace(",", "").replace("$", ""))
        except ValueError:
            result["amount"] = None
    result["eobExplanation"] = normalized.get("eobexplanation")
    result["extractionWarnings"] = [f for f in mapping if result.get(f) is None]
    result["extractionConfidence"] = round(1 - (len(result["extractionWarnings"]) / len(mapping)), 2)
    return result
