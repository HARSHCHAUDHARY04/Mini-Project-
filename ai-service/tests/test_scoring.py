import pytest
from app.services.scoring import compute_appealability_score

def test_compute_appealability_score_strong():
    matched_requirements = [
        {"requirementId": "1", "status": "MATCH", "confidence": 90, "requirement": "Req 1", "patientEvidence": "Evidence 1"},
        {"requirementId": "2", "status": "MATCH", "confidence": 80, "requirement": "Req 2", "patientEvidence": "Evidence 2"},
    ]
    result = compute_appealability_score(
        matched_requirements=matched_requirements,
        evidence_completeness=0.9,
        denial_code_known=True
    )
    assert result["score"] > 80
    assert result["classification"] == "Strong"
    assert "disclaimer" in result

def test_compute_appealability_score_insufficient():
    matched_requirements = [
        {"requirementId": "1", "status": "NOT_FOUND", "confidence": 0, "requirement": "Req 1", "patientEvidence": None},
    ]
    result = compute_appealability_score(
        matched_requirements=matched_requirements,
        evidence_completeness=0.1,
        denial_code_known=False
    )
    assert result["score"] < 30
    assert result["classification"] == "Insufficient Evidence"
