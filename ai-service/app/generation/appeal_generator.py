"""
AppealGenerator: assembles the final appeal letter.

Grounding strategy: this module first deterministically builds a fully
evidence-backed draft (every clinical/policy claim traceable to a citation,
missing evidence explicitly flagged as "Documentation not found in the
provided records."). Only that pre-grounded draft — never raw model
"creativity" — is what gets returned in mock mode, and it's also exactly
what's handed to a real LLM (via llm_provider) as the user_prompt, with a
system prompt that forbids adding any fact not already present. This is
the mechanism behind the "never invent clinical facts / policy sections /
citations" requirement in spec section 15.
"""

from datetime import date
from typing import Dict, Any, List

from app.services.llm_provider import get_llm_provider

DRAFT_LABEL = "AI-GENERATED DRAFT — REQUIRES HUMAN REVIEW"

SYSTEM_PROMPT = (
    "You are formatting a healthcare claim appeal letter. You MUST NOT add, "
    "infer, or embellish any clinical fact, policy section, test result, "
    "diagnosis, treatment detail, or citation that is not already explicitly "
    "present in the provided draft. You may only improve grammar, tone, and "
    "professional phrasing of the existing content. If a section says "
    "'Documentation not found in the provided records', you must preserve "
    "that statement exactly. Keep every citation bracket exactly as given."
)


def _evidence_line(item: Dict[str, Any]) -> str:
    evidence = item.get("patientEvidence") or "Documentation not found in the provided records."
    citation = f" [Clinical Note, Page {item['source']}]" if item.get("source") else ""
    return f"- {evidence}{citation}"


def _policy_line(item: Dict[str, Any]) -> str:
    citation = f" [{item['policyName']}, {item['section']}, Page {item['page']}]"
    return f"- {item['text']}{citation}"


def build_appeal_draft(
    claim: Dict[str, Any],
    denial_info: Dict[str, Any],
    policy_sections: List[Dict[str, Any]],
    matched_requirements: List[Dict[str, Any]],
    appealability: Dict[str, Any],
) -> Dict[str, Any]:
    today = date.today().isoformat()
    missing = [r for r in matched_requirements if r["status"] == "NOT_FOUND"]
    satisfied = [r for r in matched_requirements if r["status"] in ("MATCH", "PARTIAL")]

    seen_evidence_lines = []
    for r in satisfied:
        line = _evidence_line(r)
        if line not in seen_evidence_lines:
            seen_evidence_lines.append(line)
    clinical_justification_lines = seen_evidence_lines or ["Documentation not found in the provided records."]
    policy_justification_lines = [
        f"- {r['requirement']} [{policy_sections[0]['policyName'] if policy_sections else 'Policy'}, "
        f"{r['section']}, Page {r['page']}]"
        for r in matched_requirements
    ]
    evidence_mapping_lines = []
    for r in matched_requirements:
        evidence_mapping_lines.append(
            f"- Requirement: {r['requirement']}\n"
            f"  Status: {r['status']}"
            + (f" (confidence {r['confidence']}%)" if r['confidence'] else "")
            + f"\n  Evidence: {r.get('patientEvidence') or 'Documentation not found in the provided records.'}"
        )

    missing_lines = (
        [f"- {r['requirement']}" for r in missing]
        if missing
        else ["- None identified. All extracted policy requirements have supporting documentation."]
    )

    letter = f"""{DRAFT_LABEL}

Date: {today}
Payer: {claim.get('payer', 'N/A')}
Claim ID: {claim.get('claimId', 'N/A')}
Patient Identifier: {claim.get('patientId', 'N/A')}
Provider: {claim.get('provider', 'N/A')}

Subject: Request for Reconsideration — Denied Claim {claim.get('claimId', 'N/A')}

To the {claim.get('payer', 'Insurance')} Appeals Department,

This letter requests reconsideration of the denial of claim {claim.get('claimId', 'N/A')} \
for {claim.get('procedure', 'the requested service')}, dated {claim.get('dateOfService', 'N/A')}, \
which was denied under code {denial_info.get('code', 'N/A')} ({denial_info.get('category', 'N/A')}).

SUMMARY OF DENIAL
The claim was denied on the basis that {denial_info.get('explanation', 'the stated reason was not met')}.

CLINICAL JUSTIFICATION
{chr(10).join(clinical_justification_lines)}

POLICY-BASED JUSTIFICATION
{chr(10).join(policy_justification_lines) if policy_justification_lines else '- No specific policy requirements were retrieved for this denial code.'}

EVIDENCE MAPPING (Requirement → Status → Evidence)
{chr(10).join(evidence_mapping_lines)}

MISSING OR UNVERIFIED DOCUMENTATION
{chr(10).join(missing_lines)}

APPEALABILITY ASSESSMENT
This claim was scored {appealability['score']}% ({appealability['classification']}) based on policy \
requirement satisfaction, clinical evidence strength, documentation completeness, and denial \
specificity. {appealability['disclaimer']}

REQUEST FOR RECONSIDERATION
Based on the clinical and policy-based evidence summarized above, we respectfully request that \
{claim.get('payer', 'Insurance')} reconsider its determination and approve coverage for the above-referenced \
service.

SUPPORTING DOCUMENTATION ENCLOSED
- Clinical notes and treatment history
- Relevant policy sections cited above
- Original claim/EOB

Sincerely,
Billing Department, on behalf of {claim.get('provider', 'the treating provider')}

---
{DRAFT_LABEL}. This letter was generated using AI-assisted analysis of the submitted claim, \
policy documents, and clinical notes. It does not constitute legal or medical advice and must \
be reviewed, edited as needed, and approved by authorized billing personnel before submission.
"""

    llm = get_llm_provider()
    final_text = llm.complete(SYSTEM_PROMPT, letter)

    return {
        "content": final_text,
        "label": DRAFT_LABEL,
        "citations": {
            "policySources": [
                {"label": f"{p['policyName']} — {p['section']}", "page": p["page"]}
                for p in policy_sections
            ],
            "clinicalSources": [
                {"label": "Clinical Note", "page": r["source"]}
                for r in matched_requirements if r.get("source")
            ],
        },
        "missingEvidence": [r["requirement"] for r in missing],
    }
