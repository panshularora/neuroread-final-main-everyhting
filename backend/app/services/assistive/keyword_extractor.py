from __future__ import annotations

import os
import re
from collections import Counter
from functools import lru_cache
from typing import List, Optional


@lru_cache(maxsize=1)
def get_model():
    """
    KeyBERT can be extremely heavy (often pulls sentence-transformers / torch).
    Default to a lightweight extractor unless explicitly enabled.
    """
    if os.getenv("NEUROREAD_USE_KEYBERT", "").strip() != "1":
        return None
    try:
        from keybert import KeyBERT  # type: ignore
    except Exception:
        return None
    try:
        return KeyBERT()
    except Exception:
        return None


_STOP = {
    "the","a","an","and","or","but","if","then","so","because","as","of","to","in","on","for","with","at","by",
    "is","are","was","were","be","been","being","it","this","that","these","those","i","you","we","they","he","she",
    "them","his","her","their","our","your","from","not","no","yes","do","does","did","can","could","will","would",
    "should","may","might","must","about","into","over","under","between","within","without","than","also","more","most",
}


def _lightweight_keywords(text: str, top_n: int) -> List[str]:
    # Basic token frequency with stopword filtering.
    tokens = re.findall(r"[A-Za-z][A-Za-z']{2,}", text.lower())
    tokens = [t for t in tokens if t not in _STOP]
    if not tokens:
        return []
    counts = Counter(tokens)
    return [w for (w, _) in counts.most_common(top_n)]


def extract_keywords(text: str, top_n: int = 5) -> List[str]:
    t = (text or "").strip()
    if not t:
        return []

    model = get_model()
    if model is None:
        return _lightweight_keywords(t, top_n=top_n)

    try:
        keywords = model.extract_keywords(
            t,
            keyphrase_ngram_range=(1, 2),
            stop_words="english",
            top_n=top_n,
        )
        return [kw[0] for kw in keywords if kw and kw[0]]
    except Exception:
        return _lightweight_keywords(t, top_n=top_n)