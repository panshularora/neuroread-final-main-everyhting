"""Phonics Flashcards service.

Returns letter, its sound(s), example words, and optional audio URL.
Reuses the phonics_engine for letter-to-sound mapping.
"""
from __future__ import annotations

import random
from typing import Dict, List

from app.services.learning.phonics_engine import _LETTER_TO_SOUND

# Curated word bank keyed by starting letter
_LETTER_EXAMPLES: Dict[str, List[str]] = {
    "a": ["apple", "ant", "alligator", "astronaut", "arrow"],
    "b": ["ball", "bat", "bear", "bus", "book"],
    "c": ["cat", "cup", "car", "cake", "cow"],
    "d": ["dog", "duck", "drum", "door", "dolphin"],
    "e": ["egg", "elephant", "elf", "engine", "eagle"],
    "f": ["fish", "fan", "frog", "fire", "flag"],
    "g": ["goat", "grape", "girl", "gate", "gift"],
    "h": ["hat", "hen", "house", "horse", "hill"],
    "i": ["igloo", "insect", "ice", "island", "iron"],
    "j": ["jam", "jet", "jug", "jump", "jungle"],
    "k": ["kite", "king", "key", "kitten", "kangaroo"],
    "l": ["lion", "lamp", "leaf", "leg", "ladder"],
    "m": ["moon", "map", "milk", "mouse", "mango"],
    "n": ["nest", "net", "nose", "nut", "nail"],
    "o": ["orange", "owl", "octopus", "otter", "onion"],
    "p": ["pig", "pen", "pot", "pizza", "parrot"],
    "q": ["queen", "quilt", "quiz", "quarter", "quail"],
    "r": ["rain", "ring", "rabbit", "robot", "rose"],
    "s": ["sun", "star", "snake", "ship", "sock"],
    "t": ["tree", "top", "turtle", "train", "tiger"],
    "u": ["umbrella", "unicorn", "under", "up", "uniform"],
    "v": ["van", "vase", "violin", "vest", "volcano"],
    "w": ["water", "web", "whale", "wind", "wagon"],
    "x": ["xylophone", "x-ray", "xenon", "xerox", "xi"],
    "y": ["yak", "yarn", "yellow", "yogurt", "yo-yo"],
    "z": ["zebra", "zero", "zoo", "zipper", "zone"],
}

# Short mnemonic phrases for each letter
_LETTER_MNEMONICS: Dict[str, str] = {
    "a": "A is for Apple — /æ/ like 'cat'",
    "b": "B is for Ball — /b/ like 'bat'",
    "c": "C is for Cat — /k/ like 'cup'",
    "d": "D is for Dog — /d/ like 'drum'",
    "e": "E is for Egg — /ɛ/ like 'bed'",
    "f": "F is for Fish — /f/ like 'fun'",
    "g": "G is for Goat — /g/ like 'gate'",
    "h": "H is for Hat — /h/ like 'hop'",
    "i": "I is for Igloo — /ɪ/ like 'sit'",
    "j": "J is for Jam — /dʒ/ like 'jump'",
    "k": "K is for Kite — /k/ like 'key'",
    "l": "L is for Lion — /l/ like 'leg'",
    "m": "M is for Moon — /m/ like 'map'",
    "n": "N is for Nest — /n/ like 'net'",
    "o": "O is for Orange — /ɒ/ like 'hot'",
    "p": "P is for Pig — /p/ like 'pen'",
    "q": "Q is for Queen — /kw/ like 'quiz'",
    "r": "R is for Rain — /r/ like 'run'",
    "s": "S is for Sun — /s/ like 'sit'",
    "t": "T is for Tree — /t/ like 'top'",
    "u": "U is for Umbrella — /ʌ/ like 'cup'",
    "v": "V is for Van — /v/ like 'vet'",
    "w": "W is for Water — /w/ like 'win'",
    "x": "X is for X-ray — /ks/ like 'box'",
    "y": "Y is for Yak — /j/ like 'yes'",
    "z": "Z is for Zebra — /z/ like 'zoo'",
}


def get_flashcard(letter: str) -> Dict[str, object]:
    """Return a flashcard for a given letter."""
    letter = (letter or "").strip().lower()
    if not letter or len(letter) != 1 or not letter.isalpha():
        return {
            "status": "error",
            "data": {"message": "Please provide a single letter (a-z)."},
            "meta": {"difficulty": "easy", "level": 1},
        }

    sound = _LETTER_TO_SOUND.get(letter, "unknown")
    examples = _LETTER_EXAMPLES.get(letter, [])
    mnemonic = _LETTER_MNEMONICS.get(letter, "")

    # Determine letter index for level hint
    letter_index = ord(letter) - ord("a") + 1

    from app.services.learning.audio_helper import get_audio_url
    
    # Generate examples with audio
    examples_with_audio = [
        {"word": ex, "audioUrl": get_audio_url(ex)}
        for ex in examples
    ]

    return {
        "status": "success",
        "data": {
            "letter": letter.upper(),
            "letterLower": letter,
            "sound": sound,
            "examples": examples, # kept for backward compat
            "exampleDetails": examples_with_audio,
            "mnemonic": mnemonic,
            "audioUrl": get_audio_url(letter),
            "soundAudioUrl": get_audio_url(sound, slow=True) if sound != "unknown" else None,
        },
        "meta": {
            "difficulty": "easy" if letter_index <= 10 else "medium" if letter_index <= 20 else "hard",
            "level": 1,
            "totalLetters": 26,
            "letterIndex": letter_index,
        },
    }
