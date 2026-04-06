from __future__ import annotations

import re
from typing import Dict, List


_LETTER_TO_SOUND: Dict[str, str] = {
    "a": "/æ/ or /eɪ/",
    "b": "/b/",
    "c": "/k/ or /s/",
    "d": "/d/",
    "e": "/ɛ/ or /iː/",
    "f": "/f/",
    "g": "/g/ or /dʒ/",
    "h": "/h/",
    "i": "/ɪ/ or /aɪ/",
    "j": "/dʒ/",
    "k": "/k/",
    "l": "/l/",
    "m": "/m/",
    "n": "/n/",
    "o": "/ɒ/ or /oʊ/",
    "p": "/p/",
    "q": "/kw/",
    "r": "/r/",
    "s": "/s/ or /z/",
    "t": "/t/",
    "u": "/ʌ/ or /juː/",
    "v": "/v/",
    "w": "/w/",
    "x": "/ks/",
    "y": "/j/ or /aɪ/",
    "z": "/z/",
}


def phoneme_breakdown(word: str) -> Dict[str, object]:
    """Basic phoneme breakdown (letter→sound mapping).

    This is intentionally simple and deterministic; it is not a full G2P model.
    """
    w = (word or "").strip()
    if not w:
        return {"word": "", "tokens": [], "note": "No word provided."}

    letters = re.findall(r"[a-zA-Z]", w)
    tokens: List[Dict[str, str]] = []
    for ch in letters:
        lower = ch.lower()
        tokens.append(
            {
                "grapheme": ch,
                "sound": _LETTER_TO_SOUND.get(lower, "unknown"),
            }
        )

    return {"word": w, "tokens": tokens, "note": "Heuristic letter-to-sound mapping."}

