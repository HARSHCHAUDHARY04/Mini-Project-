import os
import sys

# Add current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.rag.policy_indexer import index_policy
from app.rag.rag_engine import retrieve_policy_sections

def main():
    print("=== Testing RAG Pipeline End-to-End ===")
    policy_id = "TEST-POL-001"
    payer = "Test Payer"
    policy_name = "Test Spine MRI Policy"
    text = """
--- PAGE 1 ---
SECTION 1 — Clinical Indications
Magnetic Resonance Imaging (MRI) of the lumbar spine is medically necessary when the patient has low back pain associated with radiculopathy.

--- PAGE 2 ---
SECTION 2 — Prior Authorization Requirements
All lumbar spine MRI procedures require prior clinical authorization from the insurance provider.
"""
    
    print("1. Running Policy Indexer...")
    try:
        res = index_policy(policy_id, payer, policy_name, text)
        print("Indexer Response:", res)
        
        print("\n2. Running RAG Engine Retrieval...")
        query = "What are the indications for a lumbar spine MRI?"
        retrieved = retrieve_policy_sections(policy_id, query, top_k=2)
        print("Retrieval Query:", query)
        print("Retrieved Chunks:")
        for i, r in enumerate(retrieved):
            print(f"\nChunk [{i+1}]:")
            print(f"  Payer: {r['payer']}")
            print(f"  Policy: {r['policyName']}")
            print(f"  Section: {r['section']}")
            print(f"  Page: {r['page']}")
            print(f"  Relevance Score: {r['relevance']}")
            print(f"  Text: {r['text']}")
            
        print("\n=== RAG Pipeline Verification: SUCCESS ===")
    except Exception as e:
        print(f"\n=== RAG Pipeline Verification: FAILED ===\nError: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
