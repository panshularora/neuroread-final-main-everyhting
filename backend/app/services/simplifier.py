"""Compatibility shim.

The real implementation lives in `app.services.assistive.simplifier`.
Keep this module to avoid breaking older imports.
"""

from app.services.assistive.simplifier import simplify_text

__all__ = ["simplify_text"]

