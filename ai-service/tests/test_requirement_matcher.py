import pytest
from app.services.requirement_matcher import (
    match_requirement,
    match_all_requirements,
    STATUS_MATCH,
    STATUS_PARTIAL,
    STATUS_NOT_FOUND,
)


def test_match_requirement_symptom_duration_match():
    req = {
        "requirementId": "REQ-1",
        "label": "symptom_duration",
        "text": "Requires at least 6 weeks of persistent symptoms",
        "section": "Coverage Criteria",
        "page": 1,
    }
    evidence = {
        "duration": "8 weeks",
        "sources": {"duration": "Progress Note Page 1"},
    }
    result = match_requirement(req, evidence)
    assert result["status"] == STATUS_MATCH
    assert result["confidence"] == 98
    assert "8 weeks" in result["patientEvidence"]


def test_match_requirement_symptom_duration_partial():
    req = {
        "requirementId": "REQ-1",
        "label": "symptom_duration",
        "text": "Requires at least 6 weeks of persistent symptoms",
        "section": "Coverage Criteria",
        "page": 1,
    }
    evidence = {
        "duration": "3 weeks",
    }
    result = match_requirement(req, evidence)
    assert result["status"] == STATUS_PARTIAL
    assert result["confidence"] == 55


def test_match_requirement_not_found():
    req = {
        "requirementId": "REQ-2",
        "label": "conservative_treatment",
        "text": "Documented completion of physical therapy",
        "section": "Conservative Therapy",
        "page": 2,
    }
    evidence = {}
    result = match_requirement(req, evidence)
    assert result["status"] == STATUS_NOT_FOUND
    assert result["confidence"] == 0


def test_match_all_requirements():
    reqs = [
        {
            "requirementId": "REQ-1",
            "label": "symptom_duration",
            "text": "Requires 6 weeks symptoms",
            "section": "Section A",
            "page": 1,
        },
        {
            "requirementId": "REQ-2",
            "label": "physician_documentation",
            "text": "Physician recommendation letter required",
            "section": "Section B",
            "page": 2,
        },
    ]
    evidence = {
        "duration": "10 weeks",
        "physician_recommendation": "Orthopedic surgeon orders MRI due to radiculopathy.",
    }
    results = match_all_requirements(reqs, evidence)
    assert len(results) == 2
    assert results[0]["status"] == STATUS_MATCH
    assert results[1]["status"] == STATUS_MATCH
