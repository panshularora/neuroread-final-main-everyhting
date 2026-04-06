from fastapi import APIRouter, HTTPException
from app.database import SessionLocal
from app.models.user import UserProfile

router = APIRouter()


@router.get("/progress/{user_id}")
def get_progress(user_id: str):

    db = SessionLocal()
    try:
        user = db.query(UserProfile).filter(UserProfile.user_id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        return {
            "user_id": user.user_id,
            "preferred_level": user.preferred_level,
            "average_cognitive_score": float(user.avg_cognitive_score or 0.0),
            "last_score": float(user.last_score or 0.0),
            "total_sessions": int(user.total_sessions or 0),
        }
    finally:
        db.close()