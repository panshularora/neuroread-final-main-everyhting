from __future__ import annotations

from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.services.learning.picture_match import get_picture_match

router = APIRouter()


class PictureMatchRequest(BaseModel):
    word: str = Field(..., min_length=1)


@router.post("/learning/picture-match")
def picture_match(request: PictureMatchRequest):
    return get_picture_match(request.word)
