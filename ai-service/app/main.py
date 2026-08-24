import logging
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.routers import parse, evidence, policy, rag, appeal

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
logger = logging.getLogger("claimassist.main")

app = FastAPI(
    title="ClaimAssist AI - AI Service",
    description="Claim parsing, RAG policy retrieval, clinical evidence extraction, "
                "requirement matching, and appeal generation for the ClaimAssist AI prototype. "
                "Educational prototype — synthetic data only.",
    version="1.0.0",
)

import os

ALLOWED_ORIGIN = os.getenv("ALLOWED_ORIGIN", "http://127.0.0.1:5001")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[ALLOWED_ORIGIN],  # #6 — restrict to the Node backend origin
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def validate_config():
    # #23 — Validate AI Service configuration on startup
    backend = os.getenv("VECTOR_STORE", "faiss").lower()
    if backend == "qdrant":
        if not os.getenv("QDRANT_URL"):
            raise ValueError("VECTOR_STORE=qdrant requires QDRANT_URL to be set in environment.")
    
    packet_dir = os.getenv("PACKET_OUTPUT_DIR", "./storage/packets")
    os.makedirs(packet_dir, exist_ok=True)

    provider = os.getenv("LLM_PROVIDER", "mock").lower()
    if provider in ("gemini", "anthropic"):
        api_key = os.getenv("LLM_API_KEY") or os.getenv("GEMINI_API_KEY") or os.getenv("ANTHROPIC_API_KEY")
        if not api_key:
            raise ValueError(f"LLM_PROVIDER={provider} requires LLM_API_KEY to be set in environment.")


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled exception on %s %s", request.method, request.url.path)
    return JSONResponse(
        status_code=500,
        content={"success": False, "error": "Internal AI service error. Please try again."},
    )


@app.get("/health")
def health():
    return {"status": "ok", "service": "claimassist-ai-service"}


app.include_router(parse.router, prefix="/ai", tags=["Claim Parsing"])
app.include_router(evidence.router, prefix="/ai", tags=["Clinical Evidence"])
app.include_router(policy.router, prefix="/ai", tags=["Policy Indexing"])
app.include_router(rag.router, prefix="/ai", tags=["RAG & Matching"])
app.include_router(appeal.router, prefix="/ai", tags=["Appeal Generation"])
