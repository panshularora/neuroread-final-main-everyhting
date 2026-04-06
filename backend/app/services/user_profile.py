from app.database import SessionLocal
from app.models.user import UserProfile


def update_user_profile(user_id: str, level: int, score: float):
    db = SessionLocal()
    try:
        user = db.query(UserProfile).filter(UserProfile.user_id == user_id).first()

        if user:
            user.preferred_level = level
            user.last_score = float(score)
            user.total_sessions = int(user.total_sessions or 0) + 1

            # Rolling average update
            if user.total_sessions > 1:
                prev_avg = float(user.avg_cognitive_score or 0.0)
                user.avg_cognitive_score = ((prev_avg * (user.total_sessions - 1)) + float(score)) / user.total_sessions
            else:
                user.avg_cognitive_score = float(score)
        else:
            user = UserProfile(
                user_id=user_id,
                preferred_level=level,
                avg_cognitive_score=float(score),
                last_score=float(score),
                total_sessions=1,
            )
            db.add(user)

        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()