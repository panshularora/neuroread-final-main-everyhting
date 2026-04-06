"""
Session Store for NeuroRead learning sessions.

Tries Redis first, falls back to in-memory dict.
Stores BKT state, IRT estimates, SM-2 schedules, and exercise history per session.
"""
import json
import logging
from datetime import datetime, timedelta
from typing import Any, Dict, Optional

logger = logging.getLogger(__name__)


class SessionStore:
    """
    Thread-safe session store with Redis backend and in-memory fallback.
    
    Session data shape:
    {
        "session_id": str,
        "user_id": str,
        "age": int,
        "session_type": "learning" | "practice",
        "created_at": ISO str,
        "bkt_state": {skill_name: p_know (float)},
        "irt_ability": float,
        "sm2_state": {
            skill_name: {
                "repetitions": int,
                "easiness": float,
                "last_interval": int,
                "last_review": ISO str,
                "next_due": ISO str,
            }
        },
        "exercise_history": [
            {
                "exercise_id": str,
                "skill": str,
                "correct": bool,
                "response_time_ms": int,
                "timestamp": ISO str,
            }
        ],
        "stats": {
            "correct": int,
            "total": int,
            "streak": int,
            "longest_streak": int,
        }
    }
    """

    _redis = None
    _fallback: Dict[str, str] = {}

    def __init__(self):
        self._try_connect_redis()

    def _try_connect_redis(self):
        """Try to connect to Redis; silently fall back to in-memory on failure."""
        try:
            import redis
            import os
            redis_url = os.environ.get("REDIS_URL", "redis://localhost:6379/0")
            client = redis.from_url(redis_url, decode_responses=True, socket_connect_timeout=2)
            client.ping()  # test connection
            SessionStore._redis = client
            logger.info("[session_store] Connected to Redis at %s", redis_url)
        except Exception as e:
            logger.warning("[session_store] Redis unavailable (%s). Using in-memory store.", e)
            SessionStore._redis = None

    def get(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve a session dict by ID. Returns None if not found."""
        try:
            if self._redis:
                raw = self._redis.get(f"session:{session_id}")
            else:
                raw = self._fallback.get(session_id)

            if raw is None:
                return None
            return json.loads(raw)
        except Exception as e:
            logger.error("[session_store] get error: %s", e)
            return None

    def set(self, session_id: str, data: Dict[str, Any], ttl_seconds: int = 86400) -> None:
        """Store a session dict. TTL defaults to 24 hours."""
        try:
            raw = json.dumps(data, default=str)
            if self._redis:
                self._redis.setex(f"session:{session_id}", ttl_seconds, raw)
            else:
                self._fallback[session_id] = raw
        except Exception as e:
            logger.error("[session_store] set error: %s", e)

    def delete(self, session_id: str) -> None:
        """Remove a session."""
        try:
            if self._redis:
                self._redis.delete(f"session:{session_id}")
            else:
                self._fallback.pop(session_id, None)
        except Exception as e:
            logger.error("[session_store] delete error: %s", e)

    def exists(self, session_id: str) -> bool:
        """Check if session exists."""
        return self.get(session_id) is not None


# Singleton instance
_store = None


def get_session_store() -> SessionStore:
    """Get or create the singleton session store."""
    global _store
    if _store is None:
        _store = SessionStore()
    return _store
