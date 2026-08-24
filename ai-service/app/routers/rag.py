import logging
from fastapi import APIRouter, HTTPException

from app.models.schemas import (
    RetrievePolicyRequest, ExtractRequirementsRequest, MatchEvidenceRequest, ScoreRequest,
)
from app.rag.rag_engine import retrieve_policy_sections, PolicyNotIndexedError
from app.extraction.requirement_extractor import extract_requirements
from app.services.requirement_matcher import match_all_requirements
from app.services.scoring import compute_appealability_score

logger = logging.getLogger("claimassist.router.rag")
router = APIRouter()


@router.post("/retrieve-policy")
def retrieve_policy(req: RetrievePolicyRequest):
    try:
        results = retrieve_policy_sections(req.policyId, req.query, req.topK)
        return {"success": True, "data": results}
    except PolicyNotIndexedError as exc:
        raise HTTPException(status_code=422, detail=str(exc))
    except Exception as exc:
        logger.exception("retrieve_policy failed")
        raise HTTPException(status_code=500, detail=f"RAG retrieval failed: {exc}")


@router.post("/rag/search")
def rag_search(req: RetrievePolicyRequest):
    return retrieve_policy(req)


@router.post("/extract-requirements")
def extract_requirements_route(req: ExtractRequirementsRequest):
    try:
        requirements = extract_requirements(req.policyChunks)
        return {"success": True, "data": requirements}
    except Exception as exc:
        logger.exception("extract_requirements failed")
        raise HTTPException(status_code=500, detail=f"Requirement extraction failed: {exc}")


@router.post("/match-evidence")
def match_evidence_route(req: MatchEvidenceRequest):
    try:
        matched = match_all_requirements(req.requirements, req.evidence)
        return {"success": True, "data": matched}
    except Exception as exc:
        logger.exception("match_evidence failed")
        raise HTTPException(status_code=500, detail=f"Evidence matching failed: {exc}")


@router.post("/score-appealability")
def score_appealability_route(req: ScoreRequest):
    try:
        result = compute_appealability_score(
            req.matchedRequirements, req.evidenceCompleteness, req.denialCodeKnown
        )
        return {"success": True, "data": result}
    except Exception as exc:
        logger.exception("score_appealability failed")
        raise HTTPException(status_code=500, detail=f"Scoring failed: {exc}")
