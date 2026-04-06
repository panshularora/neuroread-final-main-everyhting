"""Word Builder Game service.

Breaks a word into phonemes and shuffled letters for reconstruction.
"""
from __future__ import annotations

import random
from typing import Dict, List

# Curated phoneme mapping for common CVC and short words
_WORD_PHONEMES: Dict[str, List[str]] = {
    "cat": ["k", "æ", "t"],
    "dog": ["d", "ɒ", "g"],
    "bat": ["b", "æ", "t"],
    "sun": ["s", "ʌ", "n"],
    "run": ["r", "ʌ", "n"],
    "map": ["m", "æ", "p"],
    "pen": ["p", "ɛ", "n"],
    "cup": ["k", "ʌ", "p"],
    "bus": ["b", "ʌ", "s"],
    "hat": ["h", "æ", "t"],
    "pig": ["p", "ɪ", "g"],
    "top": ["t", "ɒ", "p"],
    "net": ["n", "ɛ", "t"],
    "bed": ["b", "ɛ", "d"],
    "fox": ["f", "ɒ", "k", "s"],
    "box": ["b", "ɒ", "k", "s"],
    "fish": ["f", "ɪ", "ʃ"],
    "ship": ["ʃ", "ɪ", "p"],
    "tree": ["t", "r", "iː"],
    "star": ["s", "t", "ɑː", "r"],
    "frog": ["f", "r", "ɒ", "g"],
    "clap": ["k", "l", "æ", "p"],
    "skip": ["s", "k", "ɪ", "p"],
    "lamp": ["l", "æ", "m", "p"],
    "hen": ["h", "ɛ", "n"],
    "van": ["v", "æ", "n"],
    "jam": ["dʒ", "æ", "m"],
    "rug": ["r", "ʌ", "g"],
    "pin": ["p", "ɪ", "n"],
    "mug": ["m", "ʌ", "g"],
}


def _basic_phonemes(word: str) -> List[str]:
    """Fallback: letter-by-letter phoneme approximation."""
    _APPROX = {
        "a": "æ", "b": "b", "c": "k", "d": "d", "e": "ɛ",
        "f": "f", "g": "g", "h": "h", "i": "ɪ", "j": "dʒ",
        "k": "k", "l": "l", "m": "m", "n": "n", "o": "ɒ",
        "p": "p", "q": "kw", "r": "r", "s": "s", "t": "t",
        "u": "ʌ", "v": "v", "w": "w", "x": "ks", "y": "j",
        "z": "z",
    }
    return [_APPROX.get(ch, ch) for ch in word.lower() if ch.isalpha()]


def build_word(word: str) -> Dict[str, object]:
    """Return phonemes and shuffled letters for a given word."""
    word = (word or "").strip().lower()
    if not word or not word.isalpha():
        return {
            "status": "error",
            "data": {"message": "Please provide a valid word (letters only)."},
            "meta": {"difficulty": "easy", "level": 1},
        }

    phonemes = _WORD_PHONEMES.get(word, _basic_phonemes(word))
    letters = list(word)
    shuffled = letters[:]

    # Ensure the shuffled version is always different from the answer
    for _ in range(10):
        random.shuffle(shuffled)
        if shuffled != letters:
            break
    if shuffled == letters and len(letters) > 1:
        shuffled = letters[::-1]

    difficulty = "easy" if len(word) <= 3 else "medium" if len(word) <= 5 else "hard"

    hint_text = f"Starts with '{word[0].upper()}'"
    from app.services.learning.audio_helper import get_audio_url
    
    phoneme_details = [
        {"sound": p, "audioUrl": get_audio_url(p, slow=True)}
        for p in phonemes
    ]

    return {
        "status": "success",
        "data": {
            "word": word,
            "wordAudioUrl": get_audio_url(word),
            "phonemes": phonemes,
            "phonemeDetails": phoneme_details,
            "letters": shuffled,
            "letterCount": len(letters),
            "hint": hint_text,
            "hintAudioUrl": get_audio_url(hint_text),
        },
        "meta": {"difficulty": difficulty, "level": 1},
    }
