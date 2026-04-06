from __future__ import annotations

import hashlib
import time
from typing import Dict, List, Any

from app.services.cognitive_load import calculate_cognitive_load, get_difficulty_label, get_nlp

# Simple in-process cache (text hash -> payload) with TTL.
_CACHE: Dict[str, Dict[str, Any]] = {}
_CACHE_TTL_S = 60 * 5


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


def _difficulty_short(score: float) -> str:
    # Map existing label to requested "Low|Moderate|High"
    label = get_difficulty_label(score).lower()
    if "low" in label:
        return "Low"
    if "moderate" in label:
        return "Moderate"
    return "High"


def build_heatmap(text: str) -> Dict[str, List[Dict[str, object]]]:
    """
    Return sentence-level difficulty with character offsets.

    Output format:
    {
      "heatmap": [
        {"sentence": "...", "score": 72, "difficulty": "High", "start": 0, "end": 120}
      ]
    }
    """
    t = (text or "").strip()
    if not t:
        return {"heatmap": []}

    key = _cache_key(t)
    cached = _cache_get(key)
    if cached is not None:
        return cached

    # Prefer spaCy offsets if available.
    nlp = get_nlp()
    heatmap: List[Dict[str, object]] = []

    if nlp is not None:
        doc = nlp(t)
        for sent in doc.sents:
            s_text = sent.text.strip()
            if not s_text:
                continue
            analysis = calculate_cognitive_load(s_text)
            score = float(analysis.get("cognitive_load_score") or 0.0)
            heatmap.append(
                {
                    "sentence": s_text,
                    "score": int(round(score)),
                    "difficulty": _difficulty_short(score),
                    "start": int(sent.start_char),
                    "end": int(sent.end_char),
                }
            )
    else:
        # Fallback: heuristic splitting and incremental offset search.
        import re

        sentences = [s.strip() for s in re.split(r"(?<=[.!?])\s+", t) if s.strip()]
        cursor = 0
        for s_text in sentences:
            start = t.find(s_text, cursor)
            if start < 0:
                start = cursor
            end = start + len(s_text)
            cursor = end

            analysis = calculate_cognitive_load(s_text)
            score = float(analysis.get("cognitive_load_score") or 0.0)
            heatmap.append(
                {
                    "sentence": s_text,
                    "score": int(round(score)),
                    "difficulty": _difficulty_short(score),
                    "start": int(start),
                    "end": int(end),
                }
            )

    payload = {"heatmap": heatmap}
    _cache_set(key, payload)
    return payload

