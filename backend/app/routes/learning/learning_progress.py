from __future__ import annotations

from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.services.learning.progress_tracker import (
    update_progress as update_user_progress,
    get_progress as get_user_progress,
)

router = APIRouter()


class ProgressUpdateRequest(BaseModel):
    user_id: str = Field(..., min_length=1)
    exercise: str = Field(..., min_length=1)
    correct: bool


@router.post("/learning/progress")
def update_progress(request: ProgressUpdateRequest):
    return update_user_progress(
        user_id=request.user_id,
        exercise=request.exercise,
        correct=request.correct,
    )


@router.get("/learning/progress/{user_id}")
def get_progress(user_id: str):
    return get_user_progress(user_id)
