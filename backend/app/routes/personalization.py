from fastapi import APIRouter, HTTPException

from app.schemas.personalization import (
    PersonalizationUpdateRequest,
    PersonalizationUpdateResponse,
)
from app.services.personalization.profile_engine import (
    update_user_reading_profile,
)

router = APIRouter(prefix="/personalization", tags=["personalization"])


@router.post(
    "/update",
    response_model=PersonalizationUpdateResponse,
    summary="Update the adaptive reading profile for a user.",
)
def personalization_update(payload: PersonalizationUpdateRequest):
    """
    Update a user's adaptive reading profile based on the latest session metrics.

    **Example request**

    ```json
    {
      "user_id": "user-123",
      "session_metrics": {
        "cognitive_load": 62.5,
        "reading_time": 4.2,
        "difficult_words_count": 18
      }
    }
    ```

    **Example response**

    ```json
    {
      "user_profile": {
        "reading_speed_wpm": 43.0,
        "sentence_complexity_tolerance": 0.37,
        "vocabulary_difficulty_tolerance": 0.5,
        "preferred_mode": "simplified",
        "dyslexia_support_enabled": true
      },
      "adaptation_summary": "Profile updated from 3 session(s): ...",
      "source_sessions": 3
    }
    ```
    """
    try:
        profile, summary, total_sessions = update_user_reading_profile(payload)
    except Exception as exc:  # pragma: no cover - defensive
        raise HTTPException(status_code=500, detail=str(exc))

    return PersonalizationUpdateResponse(
        user_profile=profile,
        adaptation_summary=summary,
        source_sessions=total_sessions,
    )

