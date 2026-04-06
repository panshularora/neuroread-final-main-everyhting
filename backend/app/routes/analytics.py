from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.services.analytics.dashboard import get_user_dashboard, log_user_session

class SessionLogCreate(BaseModel):
    user_id: str
    reading_time: float
    pauses: int
    errors: int
    difficult_words_count: int = 0

router = APIRouter(prefix="/analytics", tags=["analytics"])

@router.get(
    "/dashboard/{user_id}",
    summary="Get analytics dashboard data for a user.",
)
def analytics_dashboard(user_id: str):
    """
    Return cognitive‑load analytics for the given user.

    **Example response**

    ```json
    {
      "avg_cognitive_load": 48.7,
      "improvement_trend": [72.3, 61.0, 48.7],
      "session_history": [
        {
          "session_id": 1,
          "cognitive_load": 72.3,
          "reading_time": 3.8,
          "difficult_words_count": 24,
          "timestamp": "2025-01-01T10:00:00Z"
        }
      ],
      "difficulty_distribution": {
        "low": 0,
        "moderate": 1,
        "high": 2
      }
    }
    ```
    """
    try:
        return get_user_dashboard(user_id)
    except Exception as exc:  # pragma: no cover - defensive
        raise HTTPException(status_code=500, detail=str(exc))

@router.post(
    "/session",
    summary="Log a user reading session (time, pauses, errors).",
)
def submit_session_log(session_data: SessionLogCreate):
    try:
        return log_user_session(
            user_id=session_data.user_id,
            reading_time=session_data.reading_time,
            pauses=session_data.pauses,
            errors=session_data.errors,
            difficult_words_count=session_data.difficult_words_count
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
