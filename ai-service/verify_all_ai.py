import os
import sys

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.rag.policy_indexer import index_policy
from app.rag.rag_engine import (
    retrieve_policy_sections, retrieve_multi_policy_sections,
    compare_policies, evaluate_retrieval_quality
)
from app.services.claim_parser import parse_claim_text
from app.services.clinical_extractor import extract_clinical_evidence
from app.services.scoring import compute_appealability_score

def main():
    print("=== Verification of AI Service & AI/ML Pipeline Enhancements ===")
    
    # 1. Test Claim Parser (Regex + LLM Fallback)
    print("\n1. Testing Claim Parser...")
    claim_text = """
    Claim ID: CLM-2026-TEST
    Payer: UnitedHealth Demo
    Procedure: MRI Brain
    Denial Code: CO-16
    Amount: $2,100
    Patient Name: John Smith
    """
    parsed = parse_claim_text(claim_text)
    print("  Claim ID:", parsed["claimId"])
    print("  Payer:", parsed["payer"])
    print("  Confidence:", parsed["extractionConfidence"])
    assert parsed["claimId"] == "CLM-2026-TEST"
    assert parsed["payer"] == "UnitedHealth Demo"
    assert parsed["denialCode"] == "CO-16"
    print("  ✓ Claim Parser: PASSED")

    # 2. Test Clinical Evidence Extractor
    print("\n2. Testing Clinical Evidence Extractor...")
    clinical_note = """
    --- PAGE 1 ---
    Patient presents with lower back pain persisting for 8 weeks.
    Has completed 6 weeks of physical therapy and tried NSAIDs with no significant improvement.
    Physician recommends MRI of lumbar spine to evaluate radiculopathy.
    """
    evidence = extract_clinical_evidence(clinical_note)
    print("  Duration:", evidence["duration"])
    print("  Treatments:", evidence["conservative_treatment"])
    print("  Failed:", evidence["treatment_failed"])
    print("  Completeness:", evidence["extractionCompleteness"])
    assert evidence["duration"] == "8 weeks"
    assert evidence["treatment_failed"] is True
    print("  ✓ Clinical Evidence Extractor: PASSED")

    # 3. Test Multi-Policy Indexing & Retrieval
    print("\n3. Testing Multi-Policy RAG & Comparison...")
    pol1_id = "POL-UHC-001"
    pol1_text = """--- PAGE 1 ---\nSECTION 1 — MRI Lumbar Spine Requirements\nRequires 6 weeks of physical therapy prior to authorization."""
    index_policy(pol1_id, "UnitedHealth", "Spine Policy A", pol1_text)

    pol2_id = "POL-AETNA-002"
    pol2_text = """--- PAGE 1 ---\nSECTION 1 — Lumbar Spine Guidelines\nRequires 4 weeks of conservative management including NSAIDs."""
    index_policy(pol2_id, "Aetna", "Spine Policy B", pol2_text)

    multi_res = retrieve_multi_policy_sections([pol1_id, pol2_id], "physical therapy requirements", top_k=2)
    print("  Multi-Policy Search Result Count:", len(multi_res["topCombined"]))
    assert len(multi_res["topCombined"]) > 0

    comp = compare_policies([pol1_id, pol2_id], "lumbar spine authorization")
    print("  Policies Compared:", comp["policiesCompared"])
    assert comp["policiesCompared"] == 2
    print("  ✓ Multi-Policy RAG & Comparison: PASSED")

    # 4. Test RAG Retrieval Quality Metrics
    print("\n4. Testing RAG Retrieval Quality Metrics...")
    metrics = evaluate_retrieval_quality(pol1_id, "physical therapy requirements", top_k=2)
    print("  Average Similarity:", metrics["averageSimilarity"])
    print("  Context Density:", metrics["contextDensity"])
    print("  Retrieval Confidence:", metrics["retrievalConfidence"])
    print("  Quality Rating:", metrics["qualityRating"])
    assert metrics["retrievalConfidence"] > 0
    assert metrics["qualityRating"] in ("High", "Moderate", "Low")
    print("  ✓ RAG Retrieval Quality Metrics: PASSED")

    # 5. Test Scoring Algorithm
    print("\n5. Testing Explainable Appealability Scoring...")
    matched = [
        {"requirementId": "1", "status": "MATCH", "confidence": 90, "requirement": "Req 1", "patientEvidence": "Ev 1"},
        {"requirementId": "2", "status": "MATCH", "confidence": 85, "requirement": "Req 2", "patientEvidence": "Ev 2"},
    ]
    score_res = compute_appealability_score(matched, 0.9, True)
    print("  Appealability Score:", score_res["score"])
    print("  Classification:", score_res["classification"])
    assert score_res["score"] >= 80
    assert score_res["classification"] == "Strong"
    print("  ✓ Appealability Scoring: PASSED")

    print("\n=======================================================")
    print("=== ALL AI SERVICE PIPELINE TESTS PASSED SUCCESSFULLY! ===")
    print("=======================================================")

if __name__ == "__main__":
    main()
