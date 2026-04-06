from __future__ import annotations

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.services.learning.spelling_trainer import generate_scramble_tasks

router = APIRouter()


class SpellingRequest(BaseModel):
    text: str = Field(..., min_length=1)
    max_words: int = Field(default=5, ge=1, le=20)


@router.post("/learning/spelling")
def spelling(request: SpellingRequest):
    text = request.text.strip()
    if not text:
        raise HTTPException(status_code=400, detail="text is required")
    return generate_scramble_tasks(text, max_words=request.max_words)

