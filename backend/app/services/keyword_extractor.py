"""Compatibility shim.

The real implementation lives in `app.services.assistive.keyword_extractor`.
Keep this module to avoid breaking older imports.
"""

from app.services.assistive.keyword_extractor import extract_keywords

__all__ = ["extract_keywords"]

