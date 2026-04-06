from __future__ import annotations

from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.services.learning.phonics_flashcards import get_flashcard

router = APIRouter()


class FlashcardRequest(BaseModel):
    letter: str = Field(..., min_length=1, max_length=1)


@router.post("/learning/flashcards")
def flashcards(request: FlashcardRequest):
    return get_flashcard(request.letter)
