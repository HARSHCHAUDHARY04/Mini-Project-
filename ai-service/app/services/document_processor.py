"""
DocumentProcessor: extracts text from uploaded PDF/TXT files and normalizes
it into a single string with `--- PAGE N ---` markers so downstream
extractors (clinical_extractor, policy_indexer) can attribute every finding
back to a page number for citation purposes.
"""

import os
import logging
from typing import Optional

logger = logging.getLogger("claimassist.docproc")


class DocumentProcessingError(Exception):
    pass


def extract_text_from_pdf(file_path: str) -> str:
    try:
        import fitz  # PyMuPDF
    except ImportError as exc:
        raise DocumentProcessingError(
            "PyMuPDF (fitz) is not installed. Run `pip install pymupdf`."
        ) from exc

    if not os.path.exists(file_path):
        raise DocumentProcessingError(f"File not found: {file_path}")

    try:
        doc = fitz.open(file_path)
    except Exception as exc:
        raise DocumentProcessingError(f"Failed to open PDF: {exc}") from exc

    if doc.page_count == 0:
        raise DocumentProcessingError("PDF contains no pages (empty document).")

    pages_text = []
    for i, page in enumerate(doc, start=1):
        text = page.get_text("text")
        pages_text.append(f"--- PAGE {i} ---\n{text}")
    doc.close()

    full_text = "\n\n".join(pages_text)
    if not full_text.strip().replace("---", "").replace("PAGE", ""):
        raise DocumentProcessingError(
            "Text extraction produced no content. The PDF may be scanned/image-only; "
            "OCR is not supported in this prototype."
        )
    return full_text


def extract_text_from_txt(file_path: str) -> str:
    if not os.path.exists(file_path):
        raise DocumentProcessingError(f"File not found: {file_path}")
    with open(file_path, "r", encoding="utf-8", errors="replace") as f:
        content = f.read()
    if not content.strip():
        raise DocumentProcessingError("Text file is empty.")
    return content


def extract_text(file_path: str, content_type: Optional[str] = None) -> str:
    ext = os.path.splitext(file_path)[1].lower()
    if ext == ".pdf" or content_type == "application/pdf":
        return extract_text_from_pdf(file_path)
    if ext in (".txt", ".md") or (content_type and content_type.startswith("text/")):
        return extract_text_from_txt(file_path)
    raise DocumentProcessingError(f"Unsupported file type: {ext or content_type}")
