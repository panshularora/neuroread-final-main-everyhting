from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.services.assistive.heatmap_service import build_heatmap

router = APIRouter()


class HeatmapRequest(BaseModel):
    text: str = Field(..., min_length=1)


@router.post(
    "/assistive/heatmap",
    summary="Return sentence-level cognitive load heatmap for text.",
)
def assistive_heatmap(payload: HeatmapRequest):
    text = payload.text.strip()
    if not text:
        raise HTTPException(status_code=400, detail="text is required")

    result = build_heatmap(text)
    print(f"[assistive/heatmap] sentences={len(result.get('heatmap', []))}")
    return result

