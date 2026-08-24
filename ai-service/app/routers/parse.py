import json
import logging
from fastapi import APIRouter, HTTPException

from app.models.schemas import ParseClaimRequest
from app.services import claim_parser, document_processor
from app.data.denial_codes import get_denial_info

logger = logging.getLogger("claimassist.router.parse")
router = APIRouter()


@router.post("/parse-claim")
def parse_claim(req: ParseClaimRequest):
    try:
        if req.jsonPayload is not None:
            parsed = claim_parser.parse_claim_json(req.jsonPayload)
        elif req.rawText is not None:
            parsed = claim_parser.parse_claim_text(req.rawText)
        elif req.filePath is not None:
            if req.fileType == "csv":
                import pandas as pd
                df = pd.read_csv(req.filePath)
                if df.empty:
                    raise HTTPException(status_code=422, detail="CSV file is empty.")
                parsed = claim_parser.parse_claim_csv_row(df.iloc[0].to_dict())
            elif req.fileType == "json":
                with open(req.filePath, "r", encoding="utf-8") as f:
                    parsed = claim_parser.parse_claim_json(json.load(f))
            else:
                text = document_processor.extract_text(req.filePath)
                parsed = claim_parser.parse_claim_text(text)
        else:
            raise HTTPException(status_code=422, detail="Provide filePath, rawText, or jsonPayload.")

        if parsed.get("denialCode"):
            parsed["denialInfo"] = get_denial_info(parsed["denialCode"])
        return {"success": True, "data": parsed}

    except document_processor.DocumentProcessingError as exc:
        raise HTTPException(status_code=422, detail=str(exc))
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("parse_claim failed")
        raise HTTPException(status_code=500, detail=f"Claim parsing failed: {exc}")


@router.get("/denial-codes/{code}")
def denial_code_lookup(code: str):
    return {"success": True, "data": get_denial_info(code)}


@router.get("/denial-codes")
def denial_code_list():
    from app.data.denial_codes import DENIAL_CODES
    return {"success": True, "data": DENIAL_CODES}
