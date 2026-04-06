from __future__ import annotations

from typing import Any, Dict, List

from app.database import SessionLocal
from app.models.reading import ReadingSession


def _difficulty_bucket(score: float) -> str:
    if score < 30:
        return "low"
    elif score < 60:
        return "moderate"
    return "high"


from app.services.analytics.session_tracker import persist_reading_session

def log_user_session(
    *,
    user_id: str,
    reading_time: float,
    pauses: int,
    errors: int,
    difficult_words_count: int = 0,
) -> Dict[str, Any]:
    """Persist a reading session log using the centralized session tracker."""
    return persist_reading_session(
        user_id=user_id,
        reading_time=reading_time,
        pauses=pauses,
        errors=errors,
        difficult_words_count=difficult_words_count
    )


def get_user_dashboard(user_id: str) -> Dict[str, Any]:
    """
    Aggregate reading sessions for a user into a structured dashboard payload.
    """
    db = SessionLocal()
    try:
        sessions: List[ReadingSession] = (
            db.query(ReadingSession)
            .filter(ReadingSession.user_id == user_id)
            .order_by(ReadingSession.created_at.asc())
            .all()
        )

        insights = []

        if not sessions:
            insights.append({
                "type": "info",
                "title": "Welcome to NeuroRead",
                "desc": "Complete your first reading session to start receiving personalized analytics."
            })
            return {
                "avg_cognitive_load": 0.0,
                "improvement_trend": [],
                "session_history": [],
                "difficulty_distribution": {"low": 0, "moderate": 0, "high": 0},
                "insights": insights
            }

        scores = [float(s.cognitive_load or 0.0) for s in sessions]
        avg_cognitive_load = float(sum(scores) / len(scores))

        improvement_trend = scores

        session_history = [
            {
                "session_id": s.id,
                "cognitive_load": float(s.cognitive_load or 0.0),
                "reading_time": float(s.reading_time_minutes or 0.0),
                "difficult_words_count": int(s.difficult_words_count or 0),
                "pauses": int(getattr(s, 'pauses_count', 0)),
                "errors": int(getattr(s, 'errors_count', 0)),
                "timestamp": s.created_at.isoformat() if s.created_at else None,
            }
            for s in sessions
        ]

        distribution = {"low": 0, "moderate": 0, "high": 0}
        for score in scores:
            bucket = _difficulty_bucket(score)
            distribution[bucket] += 1

        recent_sessions = sessions[-3:]
        recent_errors_avg = sum(getattr(s, 'errors_count', getattr(s, 'difficult_words_count', 0)) for s in recent_sessions) / len(recent_sessions)
        recent_pauses_avg = sum(getattr(s, 'pauses_count', 0) for s in recent_sessions) / len(recent_sessions)
        recent_load_avg = sum(s.cognitive_load for s in recent_sessions) / len(recent_sessions)
        
        if recent_pauses_avg >= 3:
            insights.append({
                "type": "struggle",
                "title": "Struggle Detection",
                "desc": f"You paused an average of {recent_pauses_avg:.1f} times recently. Consider enabling the Smart Simplifier for dense paragraphs."
            })
            
        if recent_errors_avg >= 2:
            insights.append({
                "type": "phonics",
                "title": "Phonics Needs Improvement",
                "desc": "Recent sessions show slight difficulty with certain words. Practicing them in the Phonics Lab will build lasting fluency."
            })
            
        if recent_load_avg < 50 and recent_errors_avg < 2 and recent_pauses_avg < 3:
            insights.append({
                "type": "success",
                "title": "Great Reading Flow",
                "desc": "Your cognitive load has been low and you are reading smoothly. Your reading retention is improving beautifully."
            })
            
        if not insights:
            insights.append({
                "type": "info",
                "title": "Steady Reading Pattern",
                "desc": "You are maintaining a steady reading pace with healthy cognitive load. Keep it up!"
            })

        return {
            "avg_cognitive_load": round(avg_cognitive_load, 2),
            "improvement_trend": improvement_trend,
            "session_history": session_history,
            "difficulty_distribution": distribution,
            "insights": insights
        }
    finally:
        db.close()



