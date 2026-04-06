"""Legacy route shim for backward compatibility.

Prefer using `app.routes.assistive.simplify`.
"""

from app.routes.assistive.simplify import router

__all__ = ["router"]

