from __future__ import annotations

from typing import Dict, List, Tuple

from sqlalchemy import func

from app.database import SessionLocal
from app.models.reading import ReadingSession


def _bucket_level(avg_load: float, avg_difficult_words: float, avg_duration: float) -> Tuple[str, str]:
    """
    Simple heuristic predictor:
    - Higher cognitive load suggests the user needs easier text.
    - Higher difficult words count combined with low load suggests advanced tolerance.
    """
    if avg_load >= 65 or avg_duration >= 8:
        return "Beginner", "grade 5-7"
    if avg_load >= 40:
        return "Intermediate", "grade 7-9"

    # Low load: check vocabulary exposure
    if avg_difficult_words >= 18:
        return "Advanced", "grade 9-12"
    return "Intermediate", "grade 7-9"


def predict_user_difficulty(user_id: str) -> Dict[str, object]:
    """
    Predict a user's reading level using stored session history.

    Returns:
    {
      "user_level": "Beginner|Intermediate|Advanced",
      "recommended_complexity": "grade 5–7"
    }
    """
    db = SessionLocal()
    try:
        agg = (
            db.query(
                func.avg(ReadingSession.cognitive_load),
                func.avg(ReadingSession.difficult_words_count),
                func.avg(ReadingSession.reading_time_minutes),
                func.count(ReadingSession.id),
            )
            .filter(ReadingSession.user_id == user_id)
            .one()
        )

        avg_load = float(agg[0] or 0.0)
        avg_difficult_words = float(agg[1] or 0.0)
        avg_duration = float(agg[2] or 0.0)
        total_sessions = int(agg[3] or 0)

        if total_sessions == 0:
            return {
                "user_level": "Intermediate",
                "recommended_complexity": "grade 7-9",
            }

        user_level, complexity = _bucket_level(avg_load, avg_difficult_words, avg_duration)
        return {
            "user_level": user_level,
            "recommended_complexity": complexity,
        }
    finally:
        db.close()

