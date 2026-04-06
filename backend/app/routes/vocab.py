"""Legacy route shim for backward compatibility.

Prefer using `app.routes.assistive.vocab`.
"""

from app.routes.assistive.vocab import router

__all__ = ["router"]

