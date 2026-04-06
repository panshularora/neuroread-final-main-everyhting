from __future__ import annotations

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.services.learning.phonics_engine import phoneme_breakdown

router = APIRouter()


class PhonicsRequest(BaseModel):
    word: str = Field(..., min_length=1)


@router.post("/learning/phonics")
def phonics(request: PhonicsRequest):
    word = request.word.strip()
    if not word:
        raise HTTPException(status_code=400, detail="word is required")
    return phoneme_breakdown(word)

