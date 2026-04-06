from __future__ import annotations

import re
from typing import List


def _split_sentences(text: str) -> List[str]:
    # Lightweight sentence splitter (keeps dependencies minimal).
    parts = re.split(r"(?<=[.!?])\s+", text.strip())
    return [p.strip() for p in parts if p and not p.isspace()]


def generate_summary(text: str, *, max_sentences: int = 2, max_chars: int = 360) -> str:
    """Generate a short summary of the text.

    This is intentionally deterministic and dependency-light. If you later want an LLM
    summary, you can swap the implementation without changing route/service contracts.
    """
    if not text or text.isspace():
        return ""

    sentences = _split_sentences(text)
    summary = " ".join(sentences[: max(1, max_sentences)])
    summary = summary.strip()

    if len(summary) <= max_chars:
        return summary

    return summary[: max_chars - 1].rstrip() + "…"

