from __future__ import annotations

import hashlib
import time
from typing import Any, Dict, List

_CACHE: Dict[str, Dict[str, Any]] = {}
_CACHE_TTL_S = 60 * 10


def _cache_key(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8", errors="ignore")).hexdigest()


def _cache_get(key: str):
    item = _CACHE.get(key)
    if not item:
        return None
    if (time.time() - item["ts"]) > _CACHE_TTL_S:
        _CACHE.pop(key, None)
        return None
    return item["value"]


def _cache_set(key: str, value: Any):
    _CACHE[key] = {"ts": time.time(), "value": value}


def _chunk_type(block: str) -> str:
    b = block.lower()
    if "for example" in b or "e.g." in b or "example" in b:
        return "example"
    if "because" in b or "therefore" in b or "this means" in b or "so that" in b:
        return "explanation"
    return "concept"


def build_chunks(text: str) -> Dict[str, List[Dict[str, str]]]:
    """
    Return cognitive chunks for chunk-mode reading.

    Output:
    {
      "chunks": [{"text": "...", "type": "concept|example|explanation"}]
    }
    """
    t = (text or "").strip()
    if not t:
        return {"chunks": []}

    key = _cache_key(t)
    cached = _cache_get(key)
    if cached is not None:
        return cached

    # Paragraph-based chunking with sentence fallback.
    paragraphs = [p.strip() for p in t.split("\n") if p.strip()]
    blocks: List[str] = []
    for p in paragraphs:
        if len(p) <= 600:
            blocks.append(p)
        else:
            import re

            sents = [s.strip() for s in re.split(r"(?<=[.!?])\s+", p) if s.strip()]
            current = []
            current_len = 0
            for s in sents:
                if current_len + len(s) + 1 > 600 and current:
                    blocks.append(" ".join(current))
                    current = [s]
                    current_len = len(s)
                else:
                    current.append(s)
                    current_len += len(s) + 1
            if current:
                blocks.append(" ".join(current))

    chunks = [{"text": b, "type": _chunk_type(b)} for b in blocks]
    payload = {"chunks": chunks}
    _cache_set(key, payload)
    return payload

