from typing import Any, Dict, Optional
from app.database import SessionLocal
from app.models.reading import ReadingSession

def calculate_cognitive_load(reading_time: float, pauses: int, errors: int, difficult_words_count: int = 0) -> float:
    """
    Normalized cognitive load formula for NeuroRead.
    Weights: 
    - Errors: 15.0 (High struggle)
    - Pauses: 5.0 (Moderate struggle)
    - Reading time: 2.0 (Effort)
    - Difficult words: 1.5 (Complexity)
    Baseload: 10.0
    Clamped to [0.0, 100.0]
    """
    calc_load = 10.0 + (errors * 15.0) + (pauses * 5.0) + (reading_time * 2.0) + (difficult_words_count * 1.5)
    return float(min(100.0, max(0.0, calc_load)))

def persist_reading_session(
    user_id: str,
    reading_time: float,
    pauses: int,
    errors: int,
    difficult_words_count: int = 0,
    cognitive_load: Optional[float] = None
) -> Dict[str, Any]:
    """
    The single normalized persistence point for reading session metrics.
    """
    if cognitive_load is None:
        cognitive_load = calculate_cognitive_load(reading_time, pauses, errors, difficult_words_count)
    
    db = SessionLocal()
    try:
        session = ReadingSession(
            user_id=user_id,
            reading_time_minutes=float(reading_time),
            cognitive_load=float(cognitive_load),
            difficult_words_count=int(difficult_words_count),
            pauses_count=int(pauses),
            errors_count=int(errors)
        )
        db.add(session)
        db.commit()
        db.refresh(session)
        return {
            "status": "success",
            "session_id": session.id,
            "cognitive_load": float(cognitive_load)
        }
    except Exception as e:
        db.rollback()
        raise e
    finally:
        db.close()
