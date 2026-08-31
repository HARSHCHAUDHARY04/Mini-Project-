import pytest
from app.services.claim_parser import parse_claim_text
from app.services.document_processor import extract_text_from_txt

def test_parse_claim_text_regex():
    sample_text = """
    Claim ID: CLM-TEST-100
    Payer: BlueCross Demo
    Procedure: MRI Lumbar Spine
    Denial Code: CO-50
    Billed Amount: $1,500.00
    Patient Name: Jane Doe
    """
    res = parse_claim_text(sample_text)
    assert res["claimId"] == "CLM-TEST-100"
    assert res["payer"] == "BlueCross Demo"
    assert res["denialCode"] == "CO-50"
    assert res["amount"] == 1500.0
    assert res["extractionConfidence"] > 0.4

def test_parse_claim_text_unformatted_nlp_fallback():
    # Text without standard key: value labels -> triggers LLM NLP pass
    unformatted = "Jane Doe submitted claim CLM-UNFORMATTED for $2,400 with BlueShield regarding Lumbar MRI denied under code PR-1."
    res = parse_claim_text(unformatted)
    assert res["claimId"] is not None or res["amount"] is not None or res["extractedByNLP"] is True

def test_extract_text_from_txt(tmp_path):
    p = tmp_path / "sample.txt"
    p.write_text("--- PAGE 1 ---\nTest document content")
    text = extract_text_from_txt(str(p))
    assert "Test document content" in text
