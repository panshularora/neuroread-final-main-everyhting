"""Picture-Word Matching service.

Maps words to emoji representations and provides semantically grouped distractors.
"""
from __future__ import annotations

import random
from typing import Dict, List

# Word → emoji + category for semantic grouping
_WORD_DATA: Dict[str, Dict[str, str]] = {
    "cat":  {"emoji": "🐱", "category": "animal"},
    "dog":  {"emoji": "🐶", "category": "animal"},
    "fish": {"emoji": "🐟", "category": "animal"},
    "bird": {"emoji": "🐦", "category": "animal"},
    "frog": {"emoji": "🐸", "category": "animal"},
    "sun":  {"emoji": "☀️", "category": "nature"},
    "tree": {"emoji": "🌳", "category": "nature"},
    "star": {"emoji": "⭐", "category": "nature"},
    "moon": {"emoji": "🌙", "category": "nature"},
    "ball": {"emoji": "⚽", "category": "object"},
    "book": {"emoji": "📖", "category": "object"},
    "hat":  {"emoji": "🎩", "category": "object"},
    "cup":  {"emoji": "☕", "category": "object"},
    "ring": {"emoji": "💍", "category": "object"},
    "lamp": {"emoji": "💡", "category": "object"},
    "drum": {"emoji": "🥁", "category": "object"},
    "ship": {"emoji": "🚢", "category": "vehicle"},
    "car":  {"emoji": "🚗", "category": "vehicle"},
    "bus":  {"emoji": "🚌", "category": "vehicle"},
    "cake": {"emoji": "🎂", "category": "food"},
}

_ALL_WORDS: List[str] = sorted(_WORD_DATA.keys())
_CATEGORY_WORDS: Dict[str, List[str]] = {}
for _w, _info in _WORD_DATA.items():
    _CATEGORY_WORDS.setdefault(_info["category"], []).append(_w)


def get_picture_match(word: str) -> Dict[str, object]:
    """Return a picture-word matching quiz for a given word."""
    word = (word or "").strip().lower()
    if not word:
        return {
            "status": "error",
            "data": {"message": "Please provide a word."},
            "meta": {"difficulty": "easy", "level": 1},
        }

    word_info = _WORD_DATA.get(word)
    if not word_info:
        return {
            "status": "error",
            "data": {
                "message": f"No picture data for '{word}'.",
                "availableWords": _ALL_WORDS,
            },
            "meta": {"difficulty": "easy", "level": 1},
        }

    emoji = word_info["emoji"]
    category = word_info["category"]

    # Prefer same-category distractors (visually similar concept)
    same_cat = [w for w in _CATEGORY_WORDS.get(category, []) if w != word]
    other_cat = [w for w in _ALL_WORDS if w != word and w not in same_cat]

    distractors: List[str] = []
    if same_cat:
        distractors.extend(random.sample(same_cat, min(1, len(same_cat))))
    needed = 2 - len(distractors)
    if needed > 0 and other_cat:
        distractors.extend(random.sample(other_cat, min(needed, len(other_cat))))

    options = distractors + [word]
    random.shuffle(options)

    # Build option objects with emojis
    from app.services.learning.audio_helper import get_audio_url
    option_data = []
    for opt in options:
        opt_info = _WORD_DATA.get(opt)
        option_data.append({
            "word": opt,
            "emoji": opt_info["emoji"] if opt_info else "❓",
            "audioUrl": get_audio_url(opt),
        })

    prompt = f"Which picture shows a {word}?"

    return {
        "status": "success",
        "data": {
            "wordAudioUrl": get_audio_url(word),
            "prompt": prompt,
            "promptAudioUrl": get_audio_url(prompt),
            "targetEmoji": emoji,
            "options": options,
            "optionDetails": option_data,
            "correct": word,
            "imageUrl": f"/static/images/{word}.png",
        },
        "meta": {"difficulty": "easy", "level": 1},
    }
