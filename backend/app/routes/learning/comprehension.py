from __future__ import annotations

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.services.learning.comprehension import generate_comprehension_questions

router = APIRouter()


class ComprehensionRequest(BaseModel):
    text: str = Field(..., min_length=1)
    max_questions: int = Field(default=3, ge=1, le=10)


@router.post("/learning/comprehension")
def comprehension(request: ComprehensionRequest):
    text = request.text.strip()
    if not text:
        raise HTTPException(status_code=400, detail="text is required")

    result = generate_comprehension_questions(text, max_questions=request.max_questions)
    # Temporary debug log (remove or lower verbosity later)
    print(f"[learning/comprehension] questions={len(result.get('questions', []))}")
    return result

