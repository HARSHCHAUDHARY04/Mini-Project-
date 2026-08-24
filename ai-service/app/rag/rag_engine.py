"""
RAGEngine: embeds a query, searches the configured vector store (FAISS or
Qdrant — see vector_store.py) for a given policy, and returns the top-k
relevant chunks with page/section metadata and a relevance score.

This module never generates text — it only retrieves. Keeping retrieval and
generation strictly separate is what lets ClaimAssist AI guarantee that the
LLM "must be based on retrieved documents" (spec section 10): the appeal
generator is only ever given the chunks this function returns, never asked
to freely recall policy content from its own training.
"""

import logging
from typing import List, Dict, Any

from app.rag.policy_indexer import get_embedding_model
from app.rag.vector_store import get_vector_store

logger = logging.getLogger("claimassist.rag")


class PolicyNotIndexedError(Exception):
    pass


def retrieve_policy_sections(policy_id: str, query: str, top_k: int = 5) -> List[Dict[str, Any]]:
    model = get_embedding_model()
    query_vec = model.encode([query], normalize_embeddings=True)[0]

    store = get_vector_store()
    results = store.search(policy_id, query_vec, top_k)
    if results is None:
        raise PolicyNotIndexedError(f"Policy '{policy_id}' has not been indexed yet.")
    return results
