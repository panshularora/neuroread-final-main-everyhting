from __future__ import annotations

from typing import Tuple

from sqlalchemy import func

from app.database import SessionLocal
from app.models.reading import ReadingSession
from app.schemas.personalization import (
    PersonalizationUpdateRequest,
    UserReadingProfile,
)


def _compute_profile_from_stats(
    avg_cognitive_load: float,
    avg_reading_time: float,
    avg_difficult_words: float,
    total_sessions: int,
) -> Tuple[UserReadingProfile, str]:
    """
    Translate aggregate statistics into an adaptive reading profile.

    This keeps the logic fully encapsulated so it can evolve independently
    of the API layer.
    """

    if avg_reading_time <= 0:
        reading_speed_wpm = 0.0
    else:
        # Approximate word count from difficult words; we assume difficult
        # words are ~10% of the total vocabulary.
        estimated_total_words = max(1.0, avg_difficult_words * 10.0)
        reading_speed_wpm = estimated_total_words / avg_reading_time

    # Map cognitive load (0‑100) to a 0‑1 tolerance (higher = can handle more).
    complexity_tolerance = max(0.0, min(1.0, (100.0 - avg_cognitive_load) / 100.0))

    # Vocabulary tolerance grows when the user often sees difficult words
    # without overwhelming cognitive load.
    if avg_difficult_words == 0:
        vocab_tolerance = 0.1
    else:
        vocab_tolerance = max(
            0.0,
            min(
                1.0,
                (avg_difficult_words / 20.0) * (1.0 - avg_cognitive_load / 120.0),
            ),
        )

    if avg_cognitive_load >= 70:
        preferred_mode = "simplest"
        dyslexia_support_enabled = True
    elif avg_cognitive_load >= 50:
        preferred_mode = "simplified"
        dyslexia_support_enabled = True
    elif avg_cognitive_load >= 30:
        preferred_mode = "balanced"
        dyslexia_support_enabled = False
    else:
        preferred_mode = "academic"
        dyslexia_support_enabled = False

    profile = UserReadingProfile(
        reading_speed_wpm=round(reading_speed_wpm, 2),
        sentence_complexity_tolerance=round(complexity_tolerance, 2),
        vocabulary_difficulty_tolerance=round(vocab_tolerance, 2),
        preferred_mode=preferred_mode,
        dyslexia_support_enabled=dyslexia_support_enabled,
    )

    adaptation_summary = (
        f"Profile updated from {total_sessions} session(s): "
        f"avg cognitive load {avg_cognitive_load:.1f}, "
        f"approx. reading speed {reading_speed_wpm:.1f} WPM. "
        f"Recommended mode: {preferred_mode} with "
        f"{'dyslexia support enabled' if dyslexia_support_enabled else 'standard formatting'}."
    )

    return profile, adaptation_summary


from app.services.analytics.session_tracker import persist_reading_session
from app.models.user import UserProfile

def update_user_reading_profile(
    payload: PersonalizationUpdateRequest,
) -> Tuple[UserReadingProfile, str, int]:
    """
    Persist the latest session and derive an updated reading profile.
    """
    metrics = payload.session_metrics
    
    # Use centralized persistence point
    persist_reading_session(
        user_id=payload.user_id,
        reading_time=metrics.reading_time,
        pauses=metrics.pauses,
        errors=metrics.errors_count,
        difficult_words_count=metrics.difficult_words_count,
        cognitive_load=metrics.cognitive_load
    )

    db = SessionLocal()
    try:
        # Aggregate stats
        agg = (
            db.query(
                func.avg(ReadingSession.cognitive_load),
                func.avg(ReadingSession.reading_time_minutes),
                func.avg(ReadingSession.difficult_words_count),
                func.count(ReadingSession.id),
            )
            .filter(ReadingSession.user_id == payload.user_id)
            .one()
        )

        avg_cognitive_load = float(agg[0] or 0.0)
        avg_reading_time = float(agg[1] or 0.0)
        avg_difficult_words = float(agg[2] or 0.0)
        total_sessions = int(agg[3] or 0)

        profile, summary = _compute_profile_from_stats(
            avg_cognitive_load=avg_cognitive_load,
            avg_reading_time=avg_reading_time,
            avg_difficult_words=avg_difficult_words,
            total_sessions=total_sessions,
        )

        # PERSIST TO UserProfile table
        user_row = db.query(UserProfile).filter(UserProfile.user_id == payload.user_id).first()
        if not user_row:
            user_row = UserProfile(user_id=payload.user_id)
            db.add(user_row)
        
        user_row.reading_speed_wpm = profile.reading_speed_wpm
        user_row.sentence_complexity_tolerance = profile.sentence_complexity_tolerance
        user_row.vocabulary_difficulty_tolerance = profile.vocabulary_difficulty_tolerance
        user_row.preferred_mode = profile.preferred_mode
        user_row.dyslexia_support_enabled = 1 if profile.dyslexia_support_enabled else 0
        user_row.avg_cognitive_score = avg_cognitive_load
        user_row.last_score = float(metrics.cognitive_load or avg_cognitive_load)
        user_row.total_sessions = total_sessions
        
        db.commit()

        return profile, summary, total_sessions
    finally:
        db.close()

