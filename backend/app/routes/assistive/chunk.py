from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.services.assistive.chunk_service import build_chunks

router = APIRouter()


class ChunkRequest(BaseModel):
    text: str = Field(..., min_length=1)


@router.post(
    "/assistive/chunk",
    summary="Chunk text into semantic blocks for chunk-mode reading.",
)
def assistive_chunk(payload: ChunkRequest):
    text = payload.text.strip()
    if not text:
        raise HTTPException(status_code=400, detail="text is required")

    result = build_chunks(text)
    print(f"[assistive/chunk] chunks={len(result.get('chunks', []))}")
    return result

