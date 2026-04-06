from datetime import datetime

from sqlalchemy import Column, String, Integer, Float, DateTime, Text

from app.database import Base


class ReadingSession(Base):
    """
    Stores per-session reading analytics for a user.
    Used by the personalization engine and analytics dashboard.
    """

    __tablename__ = "reading_sessions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(String, index=True, nullable=False)

    cognitive_load = Column(Float, nullable=False)
    reading_time_minutes = Column(Float, nullable=False)
    difficult_words_count = Column(Integer, nullable=False, default=0)
    pauses_count = Column(Integer, nullable=False, default=0)
    errors_count = Column(Integer, nullable=False, default=0)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class AnalyticsCache(Base):
    """
    Optional cache for pre-computed analytics blobs (per user).
    This keeps the design ready for heavier traffic without being required
    by the main logic.
    """

    __tablename__ = "analytics_cache"

    user_id = Column(String, primary_key=True, index=True)
    avg_cognitive_load = Column(Float, nullable=True)
    data = Column(Text, nullable=True)
    last_updated = Column(DateTime, default=datetime.utcnow, nullable=False)

