from __future__ import annotations

from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.services.learning.sound_match import get_sound_match

router = APIRouter()


class SoundMatchRequest(BaseModel):
    sound: str = Field(..., min_length=1)


@router.post("/learning/sound-match")
def sound_match(request: SoundMatchRequest):
    return get_sound_match(request.sound)
