"""Progress Tracker service.

Stores and retrieves user learning progress using SQLite via SQLAlchemy.
"""
from __future__ import annotations

from typing import Dict

from sqlalchemy import Column, Integer, String
from app.database import Base, SessionLocal


class LearningProgress(Base):
    """SQLAlchemy model for tracking user learning progress."""
    __tablename__ = "learning_progress"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(String, unique=True, index=True, nullable=False)
    lessons_completed = Column(Integer, default=0)
    correct_answers = Column(Integer, default=0)
    total_answers = Column(Integer, default=0)
    words_learned = Column(Integer, default=0)
    current_level = Column(Integer, default=1)


# Badge thresholds
_BADGES = [
    {"name": "Phonics Starter", "emoji": "🌱", "threshold_words": 5},
    {"name": "Word Builder", "emoji": "🧱", "threshold_words": 15},
    {"name": "Rhyme Master", "emoji": "🎵", "threshold_words": 30},
    {"name": "Reading Star", "emoji": "⭐", "threshold_words": 50},
    {"name": "Comprehension Champ", "emoji": "🧠", "threshold_words": 75},
    {"name": "Literacy Hero", "emoji": "🏆", "threshold_words": 100},
]

# Level-up thresholds (lessons completed required per level)
_LEVEL_THRESHOLDS = {1: 0, 2: 5, 3: 15, 4: 30}


def _compute_level(lessons_completed: int) -> int:
    """Determine the user's level based on lessons completed."""
    level = 1
    for lvl, threshold in sorted(_LEVEL_THRESHOLDS.items()):
        if lessons_completed >= threshold:
            level = lvl
    return level


def _compute_badges(words_learned: int) -> list[dict]:
    """Return list of badge objects the user has earned."""
    return [
        {"name": b["name"], "emoji": b["emoji"]}
        for b in _BADGES if words_learned >= b["threshold_words"]
    ]


def _next_badge(words_learned: int) -> dict | None:
    """Return the next badge to earn (or None if all earned)."""
    for b in _BADGES:
        if words_learned < b["threshold_words"]:
            return {
                "name": b["name"],
                "emoji": b["emoji"],
                "wordsNeeded": b["threshold_words"] - words_learned,
            }
    return None


def update_progress(user_id: str, exercise: str, correct: bool) -> Dict[str, object]:
    """Record a completed exercise and update progress."""
    db = SessionLocal()
    try:
        progress = db.query(LearningProgress).filter(LearningProgress.user_id == user_id).first()
        if not progress:
            progress = LearningProgress(user_id=user_id)
            db.add(progress)

        progress.total_answers = (progress.total_answers or 0) + 1
        if correct:
            progress.correct_answers = (progress.correct_answers or 0) + 1
            progress.words_learned = (progress.words_learned or 0) + 1

        progress.lessons_completed = (progress.lessons_completed or 0) + 1
        progress.current_level = _compute_level(progress.lessons_completed)

        db.commit()
        db.refresh(progress)

        accuracy = round((progress.correct_answers / progress.total_answers) * 100) if progress.total_answers > 0 else 0

        return {
            "status": "success",
            "data": {
                "userId": user_id,
                "exercise": exercise,
                "recorded": True,
                "wordsLearned": progress.words_learned,
                "accuracy": accuracy,
                "currentLevel": progress.current_level,
                "lessonsCompleted": progress.lessons_completed,
                "badges": _compute_badges(progress.words_learned),
                "nextBadge": _next_badge(progress.words_learned),
            },
            "meta": {
                "difficulty": "easy" if progress.current_level <= 2 else "medium",
                "level": progress.current_level,
            },
        }
    finally:
        db.close()


def get_progress(user_id: str) -> Dict[str, object]:
    """Retrieve user progress."""
    db = SessionLocal()
    try:
        progress = db.query(LearningProgress).filter(LearningProgress.user_id == user_id).first()
        if not progress:
            return {
                "status": "success",
                "data": {
                    "userId": user_id,
                    "wordsLearned": 0,
                    "accuracy": 0,
                    "currentLevel": 1,
                    "lessonsCompleted": 0,
                    "badges": [],
                    "nextBadge": _next_badge(0),
                },
                "meta": {"difficulty": "easy", "level": 1},
            }

        accuracy = round((progress.correct_answers / progress.total_answers) * 100) if progress.total_answers > 0 else 0

        return {
            "status": "success",
            "data": {
                "userId": user_id,
                "wordsLearned": progress.words_learned or 0,
                "accuracy": accuracy,
                "currentLevel": progress.current_level or 1,
                "lessonsCompleted": progress.lessons_completed or 0,
                "badges": _compute_badges(progress.words_learned or 0),
                "nextBadge": _next_badge(progress.words_learned or 0),
            },
            "meta": {
                "difficulty": "easy" if (progress.current_level or 1) <= 2 else "medium",
                "level": progress.current_level or 1,
            },
        }
    finally:
        db.close()
