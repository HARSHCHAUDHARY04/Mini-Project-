import logging
from fastapi import APIRouter, HTTPException

from app.models.schemas import ExtractEvidenceRequest
from app.services import clinical_extractor, document_processor

logger = logging.getLogger("claimassist.router.evidence")
router = APIRouter()


@router.post("/extract-clinical-evidence")
def extract_clinical_evidence(req: ExtractEvidenceRequest):
    try:
        if req.rawText is not None:
            text = req.rawText
        elif req.filePath is not None:
            text = document_processor.extract_text(req.filePath)
        else:
            raise HTTPException(status_code=422, detail="Provide filePath or rawText.")

        evidence = clinical_extractor.extract_clinical_evidence(text)
        return {"success": True, "data": evidence}

    except document_processor.DocumentProcessingError as exc:
        raise HTTPException(status_code=422, detail=str(exc))
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("extract_clinical_evidence failed")
        raise HTTPException(status_code=500, detail=f"Clinical evidence extraction failed: {exc}")
