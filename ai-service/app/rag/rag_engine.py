"""
RAGEngine: embeds a query, searches the configured vector store (FAISS or
Qdrant — see vector_store.py) for given policies, and returns top-k
relevant chunks with page/section metadata, multi-policy comparison capability,
and retrieval quality metrics.
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


def retrieve_multi_policy_sections(policy_ids: List[str], query: str, top_k: int = 5) -> Dict[str, Any]:
    """Search across multiple policies and aggregate top results per policy."""
    model = get_embedding_model()
    query_vec = model.encode([query], normalize_embeddings=True)[0]
    store = get_vector_store()

    policy_results = {}
    all_chunks = []

    for pid in policy_ids:
        try:
            res = store.search(pid, query_vec, top_k)
            if res is not None:
                policy_results[pid] = res
                for item in res:
                    item_copy = dict(item)
                    item_copy["policyId"] = pid
                    all_chunks.append(item_copy)
        except Exception as err:
            logger.warning("Error searching policy %s: %s", pid, err)

    all_chunks.sort(key=lambda x: x.get("relevance", 0), reverse=True)
    return {
        "query": query,
        "policyResults": policy_results,
        "topCombined": all_chunks[:top_k],
        "policiesSearched": len(policy_results),
    }


def compare_policies(policy_ids: List[str], query: str) -> Dict[str, Any]:
    """Side-by-side comparison of retrieved policy sections across payers/policies."""
    multi_res = retrieve_multi_policy_sections(policy_ids, query, top_k=3)
    comparison = {}

    for pid, chunks in multi_res["policyResults"].items():
        top_chunk = chunks[0] if chunks else None
        comparison[pid] = {
            "topSection": top_chunk["section"] if top_chunk else "N/A",
            "topPage": top_chunk["page"] if top_chunk else None,
            "relevanceScore": top_chunk["relevance"] if top_chunk else 0.0,
            "summarySnippet": top_chunk["text"][:150] + "..." if top_chunk else "No matching section found.",
            "chunkCount": len(chunks),
        }

    return {
        "query": query,
        "comparison": comparison,
        "policiesCompared": len(comparison),
    }


def evaluate_retrieval_quality(policy_id: str, query: str, top_k: int = 5) -> Dict[str, Any]:
    """Calculate RAG retrieval quality metrics (similarity scores, density, confidence index)."""
    results = retrieve_policy_sections(policy_id, query, top_k)
    if not results:
        return {
            "policyId": policy_id,
            "query": query,
            "chunkCount": 0,
            "averageSimilarity": 0.0,
            "maxSimilarity": 0.0,
            "contextDensity": 0.0,
            "retrievalConfidence": 0.0,
            "qualityRating": "Low",
        }

    scores = [r.get("relevance", 0.0) for r in results]
    avg_sim = round(sum(scores) / len(scores), 4)
    max_sim = round(max(scores), 4)

    total_chars = sum(len(r.get("text", "")) for r in results)
    context_density = round(min(1.0, total_chars / 2500.0), 2)

    # Retrieval confidence score formula
    confidence = round(min(100.0, (avg_sim * 0.6 + max_sim * 0.4) * 100), 1)

    if confidence >= 75:
        rating = "High"
    elif confidence >= 50:
        rating = "Moderate"
    else:
        rating = "Low"

    return {
        "policyId": policy_id,
        "query": query,
        "chunkCount": len(results),
        "averageSimilarity": avg_sim,
        "maxSimilarity": max_sim,
        "contextDensity": context_density,
        "retrievalConfidence": confidence,
        "qualityRating": rating,
        "retrievedSections": [r.get("section") for r in results],
    }
