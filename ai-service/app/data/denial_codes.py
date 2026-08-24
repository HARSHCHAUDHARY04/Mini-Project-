"""
Demo denial-code dictionary.

This is intentionally a small, illustrative dictionary for a college
prototype and is NOT an authoritative source of CARC/RARC codes.
Unknown codes are handled gracefully via `get_denial_info`.
"""

DENIAL_CODES = {
    "CO-16": {
        "category": "Missing/Incomplete Information",
        "explanation": (
            "Claim was denied because required information (e.g. a modifier, "
            "referral, or supporting documentation) was missing or incomplete."
        ),
    },
    "CO-18": {
        "category": "Duplicate Claim/Service",
        "explanation": (
            "Service was denied because it is an exact duplicate of a claim "
            "or service already submitted and adjudicated."
        ),
    },
    "CO-29": {
        "category": "Timely Filing",
        "explanation": (
            "Claim was denied because it was submitted after the payer's "
            "timely filing limit had expired."
        ),
    },
    "CO-45": {
        "category": "Charge Exceeds Fee Schedule",
        "explanation": (
            "The charge exceeds the maximum allowable amount under the "
            "payer's fee schedule or contracted rate."
        ),
    },
    "CO-50": {
        "category": "Medical Necessity",
        "explanation": (
            "Service was denied because the payer determined that medical "
            "necessity requirements were not sufficiently demonstrated in "
            "the submitted documentation."
        ),
    },
    "CO-96": {
        "category": "Non-Covered Charge",
        "explanation": (
            "Charge is considered non-covered under the terms of the "
            "member's benefit plan."
        ),
    },
    "CO-97": {
        "category": "Bundled/Included Service",
        "explanation": (
            "The benefit for this service is included in the payment or "
            "allowance for another service that has already been adjudicated."
        ),
    },
    "PR-1": {
        "category": "Patient Deductible",
        "explanation": (
            "Amount applied to the member's deductible; this is a patient "
            "responsibility adjustment rather than a denial of coverage."
        ),
    },
    "PR-2": {
        "category": "Patient Coinsurance",
        "explanation": (
            "Amount applied to the member's coinsurance; this is a patient "
            "responsibility adjustment rather than a denial of coverage."
        ),
    },
}

UNKNOWN_CODE_FALLBACK = {
    "category": "Unknown / Unmapped Denial Code",
    "explanation": (
        "This denial code is not present in the demo dictionary. Manual "
        "review is required to determine the denial category and whether "
        "an appeal is appropriate."
    ),
}


def get_denial_info(code: str) -> dict:
    if not code:
        return {"code": None, **UNKNOWN_CODE_FALLBACK}
    normalized = code.strip().upper()
    info = DENIAL_CODES.get(normalized, UNKNOWN_CODE_FALLBACK)
    return {"code": normalized, **info}
