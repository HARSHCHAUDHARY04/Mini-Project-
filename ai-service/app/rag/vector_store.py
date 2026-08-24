"""
VectorStore abstraction for the policy RAG pipeline.

Two backends are supported, selected via VECTOR_STORE in the environment:
  - "faiss" (default): a local, on-disk FAISS index per policy. Zero
    external dependencies — this is what makes the prototype runnable
    fully offline.
  - "qdrant": a single collection in a Qdrant Cloud cluster, with points
    tagged by `policyId` in their payload and searches filtered to that
    policy. Requires QDRANT_URL and QDRANT_API_KEY.

Everything above this layer (policy_indexer.index_policy, rag_engine.
retrieve_policy_sections) is backend-agnostic: it just calls
`get_vector_store().upsert_chunks(...)` / `.search(...)`. Swapping backends
is a single environment variable — no code changes needed anywhere else.
"""

import os
import json
import uuid
import logging
from typing import List, Dict, Any, Optional

logger = logging.getLogger("claimassist.vectorstore")

BACKEND = os.getenv("VECTOR_STORE", "faiss").lower()


class VectorStore:
    """Abstract interface every vector store backend implements."""

    def upsert_chunks(self, policy_id: str, payer: str, policy_name: str,
                       chunks: List[Dict[str, Any]], embeddings) -> int:
        """Stores (or replaces) all chunks for a policy. Returns chunk count."""
        raise NotImplementedError

    def search(self, policy_id: str, query_embedding, top_k: int) -> Optional[List[Dict[str, Any]]]:
        """Returns top_k matching chunks for a policy, or None if the policy isn't indexed."""
        raise NotImplementedError

    def is_indexed(self, policy_id: str) -> bool:
        raise NotImplementedError


# ---------------------------------------------------------------------------
# FAISS backend (local, on-disk, default — no external service required)
# ---------------------------------------------------------------------------

class FaissVectorStore(VectorStore):
    def __init__(self):
        self.index_dir = os.getenv(
            "VECTOR_INDEX_DIR",
            os.path.join(os.path.dirname(__file__), "..", "..", "storage", "indexes"),
        )
        os.makedirs(self.index_dir, exist_ok=True)

    def _paths(self, policy_id: str):
        return (
            os.path.join(self.index_dir, f"{policy_id}.faiss"),
            os.path.join(self.index_dir, f"{policy_id}.meta.json"),
        )

    def upsert_chunks(self, policy_id, payer, policy_name, chunks, embeddings) -> int:
        import numpy as np
        import faiss

        embeddings = np.array(embeddings, dtype="float32")
        dim = embeddings.shape[1]
        index = faiss.IndexFlatIP(dim)  # cosine similarity via normalized inner product
        index.add(embeddings)

        faiss_path, meta_path = self._paths(policy_id)
        faiss.write_index(index, faiss_path)

        metadata = {
            "policyId": policy_id,
            "payer": payer,
            "policyName": policy_name,
            "chunkCount": len(chunks),
            "chunks": [
                {"chunkIndex": i, "text": c["text"], "page": c["page"], "section": c["section"]}
                for i, c in enumerate(chunks)
            ],
        }
        with open(meta_path, "w", encoding="utf-8") as f:
            json.dump(metadata, f, indent=2)

        return len(chunks)

    def search(self, policy_id, query_embedding, top_k):
        import numpy as np
        import faiss

        faiss_path, meta_path = self._paths(policy_id)
        if not (os.path.exists(faiss_path) and os.path.exists(meta_path)):
            return None

        index = faiss.read_index(faiss_path)
        with open(meta_path, "r", encoding="utf-8") as f:
            metadata = json.load(f)

        query_vec = np.array([query_embedding], dtype="float32")
        k = min(top_k, metadata["chunkCount"])
        scores, indices = index.search(query_vec, k)

        results = []
        for score, idx in zip(scores[0], indices[0]):
            if idx < 0:
                continue
            chunk = metadata["chunks"][idx]
            results.append({
                "policyName": metadata["policyName"],
                "payer": metadata["payer"],
                "section": chunk["section"],
                "page": chunk["page"],
                "text": chunk["text"],
                "relevance": round(float(score), 4),
            })
        return results

    def is_indexed(self, policy_id):
        faiss_path, meta_path = self._paths(policy_id)
        return os.path.exists(faiss_path) and os.path.exists(meta_path)


# ---------------------------------------------------------------------------
# Qdrant backend (cloud, shared collection filtered by policyId payload)
# ---------------------------------------------------------------------------

class QdrantVectorStore(VectorStore):
    def __init__(self, url: str, api_key: Optional[str], collection: str, vector_size: int = 384):
        try:
            from qdrant_client import QdrantClient
            from qdrant_client.http import models as qmodels
        except ImportError as exc:
            raise RuntimeError(
                "The 'qdrant-client' package is not installed. Run "
                "`pip install qdrant-client` or set VECTOR_STORE=faiss."
            ) from exc

        self.qmodels = qmodels
        self.collection = collection
        self.vector_size = vector_size
        self.client = QdrantClient(url=url, api_key=api_key)
        self._ensure_collection()

    def _ensure_collection(self):
        existing = [c.name for c in self.client.get_collections().collections]
        if self.collection not in existing:
            logger.info("Creating Qdrant collection '%s'", self.collection)
            self.client.create_collection(
                collection_name=self.collection,
                vectors_config=self.qmodels.VectorParams(
                    size=self.vector_size, distance=self.qmodels.Distance.COSINE
                ),
            )

    def _policy_filter(self, policy_id: str):
        return self.qmodels.Filter(
            must=[self.qmodels.FieldCondition(key="policyId", match=self.qmodels.MatchValue(value=policy_id))]
        )

    def upsert_chunks(self, policy_id, payer, policy_name, chunks, embeddings) -> int:
        # Re-indexing a policy should replace, not append to, its old chunks.
        self.client.delete(
            collection_name=self.collection,
            points_selector=self.qmodels.FilterSelector(filter=self._policy_filter(policy_id)),
        )

        points = []
        for i, (chunk, vec) in enumerate(zip(chunks, embeddings)):
            point_id = str(uuid.uuid5(uuid.NAMESPACE_URL, f"{policy_id}:{i}"))
            points.append(
                self.qmodels.PointStruct(
                    id=point_id,
                    vector=[float(x) for x in vec],
                    payload={
                        "policyId": policy_id,
                        "payer": payer,
                        "policyName": policy_name,
                        "chunkIndex": i,
                        "section": chunk["section"],
                        "page": chunk["page"],
                        "text": chunk["text"],
                    },
                )
            )
        self.client.upsert(collection_name=self.collection, points=points)
        return len(points)

    def search(self, policy_id, query_embedding, top_k):
        if not self.is_indexed(policy_id):
            return None

        response = self.client.query_points(
            collection_name=self.collection,
            query=[float(x) for x in query_embedding],
            query_filter=self._policy_filter(policy_id),
            limit=top_k,
        )
        return [
            {
                "policyName": h.payload["policyName"],
                "payer": h.payload["payer"],
                "section": h.payload["section"],
                "page": h.payload["page"],
                "text": h.payload["text"],
                "relevance": round(float(h.score), 4),
            }
            for h in response.points
        ]

    def is_indexed(self, policy_id):
        result = self.client.count(
            collection_name=self.collection,
            count_filter=self._policy_filter(policy_id),
            exact=True,
        )
        return result.count > 0


_vector_store: Optional[VectorStore] = None


def get_vector_store() -> VectorStore:
    global _vector_store
    if _vector_store is not None:
        return _vector_store

    if BACKEND == "qdrant":
        url = os.getenv("QDRANT_URL")
        api_key = os.getenv("QDRANT_API_KEY")
        collection = os.getenv("QDRANT_COLLECTION", "claimassist_policy_chunks")
        vector_size = int(os.getenv("QDRANT_VECTOR_SIZE", "384"))  # 384 = all-MiniLM-L6-v2's output dim
        if not url:
            raise RuntimeError(
                "VECTOR_STORE=qdrant requires QDRANT_URL to be set (and usually QDRANT_API_KEY)."
            )
        logger.info("Using Qdrant vector store at %s (collection=%s)", url, collection)
        _vector_store = QdrantVectorStore(url, api_key, collection, vector_size=vector_size)
    else:
        logger.info("Using local FAISS vector store")
        _vector_store = FaissVectorStore()

    return _vector_store
