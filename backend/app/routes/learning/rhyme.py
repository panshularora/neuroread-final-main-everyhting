from __future__ import annotations

from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.services.learning.rhyme_engine import get_rhyme

router = APIRouter()


class RhymeRequest(BaseModel):
    word: str = Field(..., min_length=1)


@router.post("/learning/rhyme")
def rhyme(request: RhymeRequest):
    return get_rhyme(request.word)
