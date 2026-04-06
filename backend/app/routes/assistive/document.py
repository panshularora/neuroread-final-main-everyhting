from fastapi import APIRouter, File, UploadFile, HTTPException
from starlette.concurrency import run_in_threadpool

from app.schemas.document import DocumentResponse, DocumentMetrics
from app.services.assistive.document_processor import process_document_bytes

router = APIRouter()


@router.post(
    "/assistive/document",
    response_model=DocumentResponse,
    summary="Upload a document (PDF, DOCX, TXT) for simplification and analysis.",
)
async def assistive_document(file: UploadFile = File(...)) -> DocumentResponse:
    """
    Accept a document upload, extract text, simplify it, and compute cognitive load.

    **Supported types**: PDF, DOCX, TXT.

    **Example response**

    ```json
    {
      "original_text": "...",
      "simplified_text": "...",
      "metrics": {
        "cognitive_load": 64.2,
        "analysis": { "...": "..." }
      },
      "keywords": ["reading", "support"]
    }
    ```
    """
    if not file or not file.filename:
        raise HTTPException(status_code=400, detail="A file upload is required.")

    try:
        data = await file.read()
        if not data:
            raise HTTPException(status_code=400, detail="Uploaded file is empty.")

        original_text, simplified_text, metrics, keywords = await run_in_threadpool(
            process_document_bytes,
            data,
            filename=file.filename or "",
            content_type=file.content_type or "",
        )
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Failed to process document: {exc}")

    return DocumentResponse(
        original_text=original_text,
        simplified_text=simplified_text,
        metrics=DocumentMetrics(**metrics),
        keywords=keywords,
    )

