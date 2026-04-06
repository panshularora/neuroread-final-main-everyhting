from fastapi import APIRouter, HTTPException

from app.services.personalization.difficulty_predictor import predict_user_difficulty

router = APIRouter(prefix="/personalization", tags=["personalization"])


@router.get(
    "/difficulty/{user_id}",
    summary="Predict personalized reading difficulty for a user.",
)
def get_difficulty_prediction(user_id: str):
    user_id = (user_id or "").strip()
    if not user_id:
        raise HTTPException(status_code=400, detail="user_id is required")

    result = predict_user_difficulty(user_id)
    print(f"[personalization/difficulty] user={user_id} -> {result.get('user_level')}")
    return result

