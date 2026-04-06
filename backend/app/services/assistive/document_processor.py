from __future__ import annotations

from typing import List, Tuple

from docx import Document as DocxDocument  # type: ignore

from app.services.assistive.keyword_extractor import extract_keywords
from app.services.cognitive_load import calculate_cognitive_load
from app.services.simplifier import simplify_text


def _read_pdf(file_bytes: bytes) -> str:
    # Prefer PyMuPDF if available; otherwise fall back to pypdf (pure Python).
    try:
        import fitz  # type: ignore

        doc = fitz.open(stream=file_bytes, filetype="pdf")
        texts: List[str] = []
        for page in doc:
            texts.append(page.get_text())
        doc.close()
        return "\n".join(texts).strip()
    except Exception:
        from io import BytesIO

        try:
            from pypdf import PdfReader  # type: ignore
        except Exception as e:
            raise RuntimeError(
                "PDF support requires either `pypdf` (recommended) or `PyMuPDF`."
            ) from e

        reader = PdfReader(BytesIO(file_bytes))
        texts: List[str] = []
        for page in reader.pages:
            texts.append(page.extract_text() or "")
        return "\n".join(texts).strip()


def _read_docx(file_bytes: bytes) -> str:
    from io import BytesIO

    bio = BytesIO(file_bytes)
    doc = DocxDocument(bio)
    paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
    return "\n".join(paragraphs).strip()


def _read_txt(file_bytes: bytes) -> str:
    return file_bytes.decode("utf-8", errors="ignore")


def extract_text_from_bytes(
    file_bytes: bytes, *, filename: str = "", content_type: str = ""
) -> str:
    """
    Extract plain text from a document payload.

    Bytes-based so routes can `await file.read()` and offload parsing to a threadpool.
    """
    lower_name = (filename or "").lower()

    if lower_name.endswith(".pdf"):
        return _read_pdf(file_bytes)
    if lower_name.endswith(".docx") or "wordprocessingml.document" in (
        content_type or ""
    ):
        return _read_docx(file_bytes)
    return _read_txt(file_bytes)


def _chunk_text(text: str, max_chars: int = 1500) -> List[str]:
    chunks: List[str] = []
    current = []
    current_len = 0
    for paragraph in text.split("\n"):
        p = paragraph.strip()
        if not p:
            continue
        if current_len + len(p) + 1 > max_chars and current:
            chunks.append("\n".join(current))
            current = [p]
            current_len = len(p)
        else:
            current.append(p)
            current_len += len(p) + 1
    if current:
        chunks.append("\n".join(current))
    return chunks


def process_document_bytes(
    file_bytes: bytes, *, filename: str = "", content_type: str = ""
) -> Tuple[str, str, dict, list]:
    """
    Extract text, run simplification on chunks, and compute cognitive load.

    Returns (original_text, simplified_text, metrics, keywords).
    """
    original_text = extract_text_from_bytes(
        file_bytes, filename=filename or "", content_type=content_type or ""
    )
    if not original_text.strip():
        return "", "", {}, []

    chunks = _chunk_text(original_text)
    simplified_chunks: List[str] = []
    for ch in chunks:
        simplified_output = simplify_text(ch, level=2)
        if isinstance(simplified_output, dict):
            simplified_chunks.append(simplified_output.get("simplified_text", ch))
        else:
            simplified_chunks.append(str(simplified_output))

    simplified_text = "\n\n".join(simplified_chunks).strip()

    analysis = calculate_cognitive_load(original_text)
    metrics = {
        "cognitive_load": analysis.get("cognitive_load_score"),
        "analysis": analysis,
    }

    keywords = extract_keywords(original_text)

    return original_text, simplified_text, metrics, keywords

