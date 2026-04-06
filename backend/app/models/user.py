from sqlalchemy import Column, String, Integer, Float
from app.database import Base


class UserProfile(Base):
    __tablename__ = "user_profiles"

    user_id = Column(String, primary_key=True, index=True)

    # Adaptive Profile Metrics
    reading_speed_wpm = Column(Float, default=100.0)
    sentence_complexity_tolerance = Column(Float, default=0.5)
    vocabulary_difficulty_tolerance = Column(Float, default=0.5)
    preferred_mode = Column(String, default="balanced")
    dyslexia_support_enabled = Column(Integer, default=0) # 0 for False, 1 for True

    # Aggregate Analytics
    avg_cognitive_score = Column(Float, default=0.0)
    last_score = Column(Float, default=0.0)
    total_sessions = Column(Integer, default=0)