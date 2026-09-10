import pytest
from app.services.claim_parser import parse_claim_text, parse_claim_json, parse_claim_csv_row


def test_parse_claim_text_complete():
    sample_text = """
    CLAIM ID: CLM-98765
    PATIENT ID: PAT-4321
    PATIENT NAME: Jane Doe
    PAYER: Blue Cross Blue Shield
    PROCEDURE: Lumbar Spine MRI
    PROCEDURE CODE: 72148
    DIAGNOSIS CODE: M54.5
    DENIAL CODE: CO-50
    DENIAL REASON: Not deemed medically necessary without conservative therapy
    AMOUNT: $2,450.00
    DATE OF SERVICE: 2026-03-15
    PROVIDER: Metro Imaging Center
    EOB EXPLANATION: Claim denied based on Clinical Coverage Guideline 4.02.
    """
    result = parse_claim_text(sample_text)

    assert result["claimId"] == "CLM-98765"
    assert result["patientId"] == "PAT-4321"
    assert result["patientName"] == "Jane Doe"
    assert result["payer"] == "Blue Cross Blue Shield"
    assert result["procedure"] == "Lumbar Spine MRI"
    assert result["procedureCode"] == "72148"
    assert result["diagnosisCode"] == "M54.5"
    assert result["denialCode"] == "CO-50"
    assert result["amount"] == 2450.0
    assert result["dateOfService"] == "2026-03-15"
    assert result["provider"] == "Metro Imaging Center"
    assert result["extractionConfidence"] >= 0.8


def test_parse_claim_json():
    payload = {
        "claimId": "CLM-JSON-1",
        "payer": "Aetna",
        "procedure": "Knee Arthroscopy",
        "amount": 4200.0,
        "denialCode": "CO-197",
    }
    result = parse_claim_json(payload)
    assert result["claimId"] == "CLM-JSON-1"
    assert result["payer"] == "Aetna"
    assert result["procedure"] == "Knee Arthroscopy"
    assert result["amount"] == 4200.0


def test_parse_claim_csv_row():
    row = {
        "Claim ID": "CLM-CSV-100",
        "Payer": "UnitedHealthcare",
        "Procedure": "Cardiac CT",
        "Amount": "$1,850.50",
        "Denial Code": "CO-50",
    }
    result = parse_claim_csv_row(row)
    assert result["claimId"] == "CLM-CSV-100"
    assert result["payer"] == "UnitedHealthcare"
    assert result["procedure"] == "Cardiac CT"
    assert result["amount"] == 1850.50
    assert result["denialCode"] == "CO-50"
