"""Daily Lesson Path service.

Generates a structured lesson plan based on the user's current level.
"""
from __future__ import annotations

from typing import Dict, List

# Level definitions with sample words for each activity
_LEVELS: Dict[int, Dict[str, object]] = {
    1: {
        "focus": "Letters & Sounds",
        "activities": [
            {"id": "flashcards", "label": "Phonics Flashcards", "sampleInput": "a"},
            {"id": "sound_match", "label": "Sound Matching", "sampleInput": "s"},
        ],
        "description": "Learn individual letter sounds and match them to words.",
        "targetWords": ["cat", "dog", "sun", "bat", "hat"],
    },
    2: {
        "focus": "CVC Words",
        "activities": [
            {"id": "flashcards", "label": "Phonics Flashcards", "sampleInput": "c"},
            {"id": "sound_match", "label": "Sound Matching", "sampleInput": "b"},
            {"id": "word_builder", "label": "Word Builder", "sampleInput": "cat"},
            {"id": "rhyme", "label": "Rhyming Quiz", "sampleInput": "cat"},
        ],
        "description": "Build and break down simple consonant-vowel-consonant words.",
        "targetWords": ["cup", "pen", "map", "bus", "pig"],
    },
    3: {
        "focus": "Blends & Digraphs",
        "activities": [
            {"id": "flashcards", "label": "Phonics Flashcards", "sampleInput": "s"},
            {"id": "word_builder", "label": "Word Builder", "sampleInput": "ship"},
            {"id": "rhyme", "label": "Rhyming Quiz", "sampleInput": "bat"},
            {"id": "picture_match", "label": "Picture Matching", "sampleInput": "fish"},
        ],
        "description": "Tackle consonant blends (bl, cr, st) and digraphs (sh, ch, th).",
        "targetWords": ["ship", "fish", "tree", "star", "frog"],
    },
    4: {
        "focus": "Sentences & Comprehension",
        "activities": [
            {"id": "word_builder", "label": "Word Builder", "sampleInput": "lamp"},
            {"id": "rhyme", "label": "Rhyming Quiz", "sampleInput": "sun"},
            {"id": "picture_match", "label": "Picture Matching", "sampleInput": "cake"},
            {"id": "comprehension", "label": "Comprehension", "sampleInput": None},
        ],
        "description": "Read short sentences and answer comprehension questions.",
        "targetWords": ["lamp", "clap", "drum", "cake", "ring"],
    },
}


def get_lesson(user_id: str, current_level: int | None = None) -> Dict[str, object]:
    """Generate a daily lesson path for the given user."""
    level = current_level if current_level and current_level in _LEVELS else 1
    level_info = _LEVELS[level]

    return {
        "status": "success",
        "data": {
            "userId": user_id,
            "level": level,
            "focus": level_info["focus"],
            "activities": level_info["activities"],
            "description": level_info["description"],
            "targetWords": level_info["targetWords"],
            "totalLevels": len(_LEVELS),
        },
        "meta": {
            "difficulty": "easy" if level <= 2 else "medium" if level <= 3 else "hard",
            "level": level,
        },
    }
