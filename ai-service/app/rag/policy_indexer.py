"""
PolicyIndexer: splits a policy document into meaningful chunks (respecting
section boundaries and page markers), embeds each chunk with fastembed
(ONNX runtime, no PyTorch — chosen to fit low-memory free-tier hosting),
and hands them off to the configured VectorStore backend (local FAISS by
default, or Qdrant Cloud — see vector_store.py) along with metadata (payer,
policy name, page number, section, chunk text) so the RAG engine can later
return citation-ready results.
"""

import os
import re
import logging
from typing import List, Dict, Any

from app.rag.vector_store import get_vector_store

logger = logging.getLogger("claimassist.indexer")

EMBEDDING_MODEL_NAME = os.getenv("EMBEDDING_MODEL", "sentence-transformers/all-MiniLM-L6-v2")

_model = None


class _FastEmbedWrapper:
    """Adapts fastembed's TextEmbedding to the .encode(texts, normalize_embeddings=) shape the rest of the app expects."""

    def __init__(self, model_name: str):
        from fastembed import TextEmbedding
        self._model = TextEmbedding(model_name=model_name)

    def encode(self, texts, normalize_embeddings: bool = True):
        import numpy as np
        vectors = np.array(list(self._model.embed(texts)), dtype="float32")
        if normalize_embeddings:
            norms = np.linalg.norm(vectors, axis=1, keepdims=True)
            norms[norms == 0] = 1
            vectors = vectors / norms
        return vectors


def get_embedding_model():
    global _model
    if _model is None:
        logger.info("Loading embedding model %s", EMBEDDING_MODEL_NAME)
        _model = _FastEmbedWrapper(EMBEDDING_MODEL_NAME)
    return _model


SECTION_HEADER_PATTERN = re.compile(r"^SECTION\s+(\d+(?:\.\d+)?)\s*[—\-–]?\s*(.*)$", re.IGNORECASE)
SUBSECTION_HEADER_PATTERN = re.compile(r"^(\d+\.\d+)\s+(.+)$")
PAGE_MARKER_PATTERN = re.compile(r"---\s*PAGE\s*(\d+)\s*---", re.IGNORECASE)


def chunk_policy_text(text: str, max_chunk_chars: int = 900) -> List[Dict[str, Any]]:
    """
    Splits policy text into chunks. Each chunk tracks the page it came from
    (via PAGE markers) and the section/subsection heading it falls under, so
    later citations can say e.g. "Section 4.2, Page 7".
    """
    lines = text.splitlines()
    chunks: List[Dict[str, Any]] = []

    current_page = 1
    current_section = "General"
    buffer: List[str] = []
    buffer_start_page = current_page
    buffer_section = current_section

    def flush():
        nonlocal buffer, buffer_start_page, buffer_section
        content = "\n".join(buffer).strip()
        if content:
            chunks.append({
                "text": content,
                "page": buffer_start_page,
                "section": buffer_section,
            })
        buffer = []

    for line in lines:
        page_match = PAGE_MARKER_PATTERN.match(line.strip())
        if page_match:
            current_page = int(page_match.group(1))
            continue

        section_match = SECTION_HEADER_PATTERN.match(line.strip())
        subsection_match = SUBSECTION_HEADER_PATTERN.match(line.strip())
        if section_match or subsection_match:
            flush()
            if section_match:
                current_section = f"Section {section_match.group(1)} — {section_match.group(2)}".strip(" —")
            else:
                current_section = f"Section {subsection_match.group(1)} — {subsection_match.group(2)}".strip(" —")
            buffer_start_page = current_page
            buffer_section = current_section
            continue

        buffer.append(line)
        if sum(len(l) for l in buffer) > max_chunk_chars:
            flush()
            buffer_start_page = current_page
            buffer_section = current_section

    flush()
    # Drop near-empty boilerplate chunks
    return [c for c in chunks if len(c["text"]) > 20]


def index_policy(policy_id: str, payer: str, policy_name: str, text: str) -> Dict[str, Any]:
    import numpy as np

    chunks = chunk_policy_text(text)
    if not chunks:
        raise ValueError("No indexable content found in policy document.")

    model = get_embedding_model()
    embeddings = model.encode([c["text"] for c in chunks], normalize_embeddings=True)
    embeddings = np.array(embeddings, dtype="float32")

    store = get_vector_store()
    chunk_count = store.upsert_chunks(policy_id, payer, policy_name, chunks, embeddings)

    logger.info("Indexed policy %s (%d chunks)", policy_id, chunk_count)
    return {"policyId": policy_id, "chunkCount": chunk_count, "indexed": True}
