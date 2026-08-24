import os
import logging
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse

from app.models.schemas import GenerateAppealRequest, GeneratePacketRequest
from app.generation.appeal_generator import build_appeal_draft
from app.generation.pdf_generator import generate_appeal_packet_pdf

logger = logging.getLogger("claimassist.router.appeal")
router = APIRouter()

PACKET_DIR = os.getenv("PACKET_OUTPUT_DIR", os.path.join(os.path.dirname(__file__), "..", "..", "storage", "packets"))


@router.post("/generate-appeal")
def generate_appeal(req: GenerateAppealRequest):
    try:
        result = build_appeal_draft(
            req.claim, req.denialInfo, req.policySections, req.matchedRequirements, req.appealability
        )
        return {"success": True, "data": result}
    except Exception as exc:
        logger.exception("generate_appeal failed")
        raise HTTPException(status_code=500, detail=f"Appeal generation failed: {exc}")


@router.post("/generate-packet")
def generate_packet(req: GeneratePacketRequest):
    try:
        os.makedirs(PACKET_DIR, exist_ok=True)
        filename = req.outputFileName or f"{req.claim.get('claimId', 'appeal')}-packet.pdf"
        output_path = os.path.join(PACKET_DIR, filename)
        generate_appeal_packet_pdf(
            output_path=output_path,
            claim=req.claim,
            denial_info=req.denialInfo,
            matched_requirements=req.matchedRequirements,
            evidence=req.evidence,
            appeal=req.appeal,
            appealability=req.appealability,
            reviewer_status=req.reviewerStatus or "Pending Review",
        )
        return {"success": True, "data": {"filePath": output_path, "fileName": filename}}
    except Exception as exc:
        logger.exception("generate_packet failed")
        raise HTTPException(status_code=500, detail=f"PDF packet generation failed: {exc}")


@router.get("/packet/{filename}")
def download_packet(filename: str):
    path = os.path.join(PACKET_DIR, filename)
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="Packet not found.")
    return FileResponse(path, media_type="application/pdf", filename=filename)
