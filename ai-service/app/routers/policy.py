import logging
from fastapi import APIRouter, HTTPException

from app.models.schemas import IndexPolicyRequest
from app.rag.policy_indexer import index_policy
from app.services import document_processor

logger = logging.getLogger("claimassist.router.policy")
router = APIRouter()


@router.post("/index-policy")
def index_policy_route(req: IndexPolicyRequest):
    try:
        if req.rawText is not None:
            text = req.rawText
        elif req.filePath is not None:
            text = document_processor.extract_text(req.filePath)
        else:
            raise HTTPException(status_code=422, detail="Provide filePath or rawText.")

        result = index_policy(req.policyId, req.payer, req.policyName, text)
        return {"success": True, "data": result}

    except document_processor.DocumentProcessingError as exc:
        raise HTTPException(status_code=422, detail=str(exc))
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("index_policy failed")
        raise HTTPException(status_code=500, detail=f"Policy indexing failed: {exc}")
