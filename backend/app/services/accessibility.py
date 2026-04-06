"""Compatibility shim.

The real implementation lives in `app.services.assistive.accessibility`.
Keep this module to avoid breaking older imports.
"""

from app.services.assistive.accessibility import (
    apply_dyslexia_formatting,
    generate_audio_payload,
)

__all__ = ["apply_dyslexia_formatting", "generate_audio_payload"]

