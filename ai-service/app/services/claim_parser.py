"""
ClaimParser: extracts structured claim fields from raw text pulled out of an
uploaded PDF/TXT/CSV/JSON EOB or denial letter.

Uses a hybrid extraction strategy: deterministic regex parsing first for accuracy,
and an LLM-assisted NLP extraction pass as fallback when regex confidence is low
or key fields are missing.
"""

import re
import json
import logging
from typing import Optional

logger = logging.getLogger("claimassist.claim_parser")

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


def _llm_nlp_fallback(text: str, current_result: dict) -> dict:
    """Run an LLM-assisted NLP extraction pass for fields missed by regex."""
    try:
        from app.services.llm_provider import get_llm_provider
        provider = get_llm_provider()

        prompt = f"""You are a medical claim data extractor. Extract structured JSON fields from this claim document text:

TEXT:
{text[:2000]}

Extract a JSON object with these exact keys (use null if not found):
- claimId (string)
- patientId (string)
- patientName (string)
- payer (string)
- procedure (string)
- procedureCode (string)
- diagnosisCode (string)
- denialCode (string)
- denialReason (string)
- eobExplanation (string)
- amount (number)
- dateOfService (string)
- provider (string)

Respond ONLY with valid JSON. Do not include markdown code block formatting."""

        system_prompt = "You are a medical claim data extractor. Extract JSON data strictly from document text."
        raw_response = provider.complete(system_prompt=system_prompt, user_prompt=prompt)
        cleaned = raw_response.strip().replace("```json", "").replace("```", "").strip()
        data = json.loads(cleaned)

        # Merge extracted fields for any None fields in current_result
        for k, v in data.items():
            if k in current_result and current_result[k] is None and v is not None:
                current_result[k] = v

        current_result["extractionWarnings"] = [
            field for field, value in current_result.items()
            if value is None and field not in ("eobExplanation", "extractionConfidence", "extractionWarnings", "extractedByNLP")
        ]
        current_result["extractionConfidence"] = round(
            1 - (len(current_result["extractionWarnings"]) / max(len(FIELD_PATTERNS), 1)), 2
        )
        current_result["extractedByNLP"] = True
    except Exception as err:
        logger.warning("LLM NLP extraction fallback skipped: %s", err)

    return current_result


def parse_claim_text(text: str) -> dict:
    """Parse a raw EOB/claim text blob into structured fields using regex + LLM NLP fallback."""
    result = {}
    for field, pattern in FIELD_PATTERNS.items():
        match = re.search(pattern, text, re.IGNORECASE)
        result[field] = _clean(match.group(1)) if match else None

    if result.get("amount"):
        try:
            result["amount"] = float(str(result["amount"]).replace(",", ""))
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
    result["extractedByNLP"] = False

    # Trigger LLM NLP pass if confidence is low (< 0.75) or key fields are missing
    missing_keys = [k for k in ("claimId", "denialCode", "procedure", "payer") if result.get(k) is None]
    if result["extractionConfidence"] < 0.75 or missing_keys:
        logger.info("Regex extraction confidence %.2f low (missing: %s), triggering NLP pass...", result["extractionConfidence"], missing_keys)
        result = _llm_nlp_fallback(text, result)

    return result


def parse_claim_json(payload: dict) -> dict:
    """Normalize an already-structured JSON claim upload."""
    result = {field: payload.get(field) for field in FIELD_PATTERNS.keys()}
    result["eobExplanation"] = payload.get("eobExplanation")
    result["extractionWarnings"] = [f for f, v in result.items() if v is None]
    result["extractionConfidence"] = 1.0 if not result["extractionWarnings"] else 0.85
    result["extractedByNLP"] = False
    return result


def parse_claim_csv_row(row: dict) -> dict:
    """Normalize a CSV row into claim fields."""
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
    result["extractedByNLP"] = False
    return result
