"""Legacy route shim for backward compatibility.

Prefer using `app.routes.assistive.tts`.
"""

from app.routes.assistive.tts import router

__all__ = ["router"]

