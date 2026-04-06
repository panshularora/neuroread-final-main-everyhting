from __future__ import annotations

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.services.learning.reading_exercises import generate_fill_in_the_blank

router = APIRouter()


class ExerciseRequest(BaseModel):
    text: str = Field(..., min_length=1)
    blanks: int = Field(default=3, ge=1, le=10)


@router.post("/learning/exercise")
def exercise(request: ExerciseRequest):
    text = request.text.strip()
    if not text:
        raise HTTPException(status_code=400, detail="text is required")
    return generate_fill_in_the_blank(text, blanks=request.blanks)

