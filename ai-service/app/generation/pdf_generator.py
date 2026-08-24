"""
PDFGenerator: builds the downloadable Appeal Packet PDF (spec section 18).

Structure:
  Page 1  Claim Summary
  Page 2  Denial Analysis
  Page 3  Policy Requirements
  Page 4  Clinical Evidence
  Page 5+ Generated Appeal
  Last    Evidence & Citations
"""

import os
from typing import Dict, Any, List
from datetime import date

from reportlab.lib.pagesizes import LETTER
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak,
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

PRIMARY = colors.HexColor("#4F46E5")
MUTED = colors.HexColor("#6B7280")


def _styles():
    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle(name="H1Brand", parent=styles["Heading1"], textColor=PRIMARY, spaceAfter=12))
    styles.add(ParagraphStyle(name="H2Brand", parent=styles["Heading2"], textColor=PRIMARY, spaceBefore=6, spaceAfter=8))
    styles.add(ParagraphStyle(name="Body", parent=styles["BodyText"], spaceAfter=8, leading=15))
    styles.add(ParagraphStyle(name="Muted", parent=styles["BodyText"], textColor=MUTED, fontSize=9))
    styles.add(ParagraphStyle(name="Mono", parent=styles["BodyText"], fontName="Courier", fontSize=9, leading=13))
    return styles


def _kv_table(pairs: List[List[str]]):
    table = Table(pairs, colWidths=[2.2 * inch, 3.8 * inch])
    table.setStyle(TableStyle([
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("TEXTCOLOR", (0, 0), (0, -1), MUTED),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("LINEBELOW", (0, 0), (-1, -1), 0.5, colors.HexColor("#E5E7EB")),
    ]))
    return table


def generate_appeal_packet_pdf(
    output_path: str,
    claim: Dict[str, Any],
    denial_info: Dict[str, Any],
    matched_requirements: List[Dict[str, Any]],
    evidence: Dict[str, Any],
    appeal: Dict[str, Any],
    appealability: Dict[str, Any],
    reviewer_status: str = "Pending Review",
) -> str:
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    styles = _styles()
    doc = SimpleDocTemplate(output_path, pagesize=LETTER,
                             topMargin=0.75 * inch, bottomMargin=0.75 * inch)
    story = []

    # PAGE 1 — Claim Summary
    story.append(Paragraph("ClaimAssist AI — Appeal Packet", styles["H1Brand"]))
    story.append(Paragraph("Educational Prototype — Synthetic Data Only", styles["Muted"]))
    story.append(Spacer(1, 12))
    story.append(Paragraph("Claim Summary", styles["H2Brand"]))
    story.append(_kv_table([
        ["Claim ID", str(claim.get("claimId", "N/A"))],
        ["Patient", str(claim.get("patientName", claim.get("patientId", "N/A")))],
        ["Payer", str(claim.get("payer", "N/A"))],
        ["Procedure", str(claim.get("procedure", "N/A"))],
        ["Denied Amount", f"${claim.get('amount', 0):,.2f}"],
        ["Date of Service", str(claim.get("dateOfService", "N/A"))],
        ["Appealability Score", f"{appealability.get('score', 'N/A')}% ({appealability.get('classification', 'N/A')})"],
        ["Generated Date", date.today().isoformat()],
        ["Reviewer Status", reviewer_status],
    ]))
    story.append(PageBreak())

    # PAGE 2 — Denial Analysis
    story.append(Paragraph("Denial Analysis", styles["H1Brand"]))
    story.append(_kv_table([
        ["Denial Code", str(denial_info.get("code", "N/A"))],
        ["Category", str(denial_info.get("category", "N/A"))],
    ]))
    story.append(Spacer(1, 10))
    story.append(Paragraph(denial_info.get("explanation", ""), styles["Body"]))
    story.append(PageBreak())

    # PAGE 3 — Policy Requirements
    story.append(Paragraph("Policy Requirements", styles["H1Brand"]))
    for r in matched_requirements:
        story.append(Paragraph(f"<b>{r['requirementId']}</b> ({r['section']}, Page {r['page']}): {r['requirement']}", styles["Body"]))
    story.append(PageBreak())

    # PAGE 4 — Clinical Evidence
    story.append(Paragraph("Clinical Evidence", styles["H1Brand"]))
    story.append(Paragraph(f"Symptoms: {', '.join(evidence.get('symptoms', [])) or 'Not documented'}", styles["Body"]))
    story.append(Paragraph(f"Duration: {evidence.get('duration') or 'Not documented'}", styles["Body"]))
    story.append(Paragraph(f"Conservative treatment: {', '.join(evidence.get('conservative_treatment', [])) or 'Not documented'}", styles["Body"]))
    story.append(Paragraph(f"Treatment failed: {'Yes' if evidence.get('treatment_failed') else 'Not documented'}", styles["Body"]))
    story.append(Paragraph(f"Physician recommendation: {evidence.get('physician_recommendation') or 'Not documented'}", styles["Body"]))
    story.append(Spacer(1, 10))
    story.append(Paragraph("Requirement Matching", styles["H2Brand"]))
    match_rows = [["Requirement", "Status", "Confidence", "Evidence"]]
    for r in matched_requirements:
        match_rows.append([
            Paragraph(r["requirement"][:70] + ("…" if len(r["requirement"]) > 70 else ""), styles["Body"]),
            r["status"],
            f"{r['confidence']}%",
            Paragraph((r.get("patientEvidence") or "")[:60], styles["Body"]),
        ])
    match_table = Table(match_rows, colWidths=[2.3 * inch, 0.8 * inch, 0.8 * inch, 2.1 * inch], repeatRows=1)
    match_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), PRIMARY),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTSIZE", (0, 0), (-1, -1), 8),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E5E7EB")),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ]))
    story.append(match_table)
    story.append(PageBreak())

    # PAGE 5+ — Generated Appeal
    story.append(Paragraph("Generated Appeal Letter", styles["H1Brand"]))
    story.append(Paragraph(appeal.get("label", ""), styles["Muted"]))
    story.append(Spacer(1, 8))
    for para in appeal.get("content", "").split("\n\n"):
        safe = para.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
        story.append(Paragraph(safe.replace("\n", "<br/>"), styles["Mono"]))
        story.append(Spacer(1, 4))
    story.append(PageBreak())

    # Final page — Evidence & Citations
    story.append(Paragraph("Evidence & Citations", styles["H1Brand"]))
    story.append(Paragraph("Policy Sources", styles["H2Brand"]))
    for s in appeal.get("citations", {}).get("policySources", []):
        story.append(Paragraph(f"• {s['label']} — Page {s['page']}", styles["Body"]))
    story.append(Paragraph("Clinical Sources", styles["H2Brand"]))
    for s in appeal.get("citations", {}).get("clinicalSources", []):
        story.append(Paragraph(f"• {s['label']} — Page {s['page']}", styles["Body"]))

    def footer(canvas, _doc):
        canvas.saveState()
        canvas.setFont("Helvetica", 8)
        canvas.setFillColor(MUTED)
        canvas.drawCentredString(LETTER[0] / 2, 0.4 * inch,
                                  "Generated by ClaimAssist AI — Educational Prototype")
        canvas.restoreState()

    doc.build(story, onFirstPage=footer, onLaterPages=footer)
    return output_path
