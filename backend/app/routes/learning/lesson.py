from __future__ import annotations

from fastapi import APIRouter

from app.services.learning.lesson_engine import get_lesson
from app.services.learning.progress_tracker import get_progress as get_user_progress

router = APIRouter()


@router.get("/learning/lesson/{user_id}")
def lesson(user_id: str):
    """Get a daily lesson plan for the user based on their current level."""
    # Try to get the user's current level from progress tracker
    progress = get_user_progress(user_id)
    current_level = progress.get("current_level", 1)
    return get_lesson(user_id, current_level=current_level)
