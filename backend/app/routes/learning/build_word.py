from __future__ import annotations

from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.services.learning.word_builder import build_word

router = APIRouter()


class BuildWordRequest(BaseModel):
    word: str = Field(..., min_length=1)


@router.post("/learning/build-word")
def build_word_route(request: BuildWordRequest):
    return build_word(request.word)
