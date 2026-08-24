from typing import Optional, List, Dict, Any
from pydantic import BaseModel


class ParseClaimRequest(BaseModel):
    filePath: Optional[str] = None
    rawText: Optional[str] = None
    jsonPayload: Optional[Dict[str, Any]] = None
    fileType: Optional[str] = None  # pdf | txt | csv | json


class ExtractEvidenceRequest(BaseModel):
    filePath: Optional[str] = None
    rawText: Optional[str] = None


class IndexPolicyRequest(BaseModel):
    policyId: str
    payer: str
    policyName: str
    filePath: Optional[str] = None
    rawText: Optional[str] = None


class RetrievePolicyRequest(BaseModel):
    policyId: str
    query: str
    topK: int = 5


class ExtractRequirementsRequest(BaseModel):
    policyChunks: List[Dict[str, Any]]


class MatchEvidenceRequest(BaseModel):
    requirements: List[Dict[str, Any]]
    evidence: Dict[str, Any]


class ScoreRequest(BaseModel):
    matchedRequirements: List[Dict[str, Any]]
    evidenceCompleteness: float
    denialCodeKnown: bool


class GenerateAppealRequest(BaseModel):
    claim: Dict[str, Any]
    denialInfo: Dict[str, Any]
    policySections: List[Dict[str, Any]]
    matchedRequirements: List[Dict[str, Any]]
    appealability: Dict[str, Any]


class GeneratePacketRequest(BaseModel):
    claim: Dict[str, Any]
    denialInfo: Dict[str, Any]
    matchedRequirements: List[Dict[str, Any]]
    evidence: Dict[str, Any]
    appeal: Dict[str, Any]
    appealability: Dict[str, Any]
    reviewerStatus: Optional[str] = "Pending Review"
    outputFileName: Optional[str] = None
