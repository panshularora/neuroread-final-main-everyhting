"""Rhyming Quiz service.

Uses curated rhyme families (ending-based) to find rhyming words.
"""
from __future__ import annotations

import random
from typing import Dict, List

# Curated rhyming families keyed by word ending
_RHYME_FAMILIES: Dict[str, List[str]] = {
    "at": ["cat", "bat", "hat", "mat", "rat", "sat", "pat", "flat", "chat"],
    "an": ["can", "fan", "man", "pan", "ran", "van", "plan", "tan", "ban"],
    "ap": ["cap", "map", "nap", "tap", "clap", "flap", "snap", "wrap", "lap"],
    "ag": ["bag", "tag", "wag", "rag", "flag", "drag", "brag", "nag", "sag"],
    "ig": ["big", "dig", "fig", "pig", "wig", "jig", "rig", "twig", "gig"],
    "in": ["bin", "fin", "pin", "tin", "win", "chin", "grin", "spin", "thin"],
    "it": ["bit", "fit", "hit", "kit", "sit", "lit", "pit", "spit", "slit"],
    "ip": ["dip", "hip", "lip", "rip", "sip", "tip", "zip", "chip", "drip"],
    "og": ["dog", "fog", "hog", "log", "jog", "cog", "frog", "blog", "bog"],
    "op": ["cop", "hop", "mop", "pop", "top", "chop", "drop", "shop", "stop"],
    "ot": ["cot", "dot", "got", "hot", "lot", "not", "pot", "rot", "shot"],
    "un": ["bun", "fun", "gun", "nun", "run", "sun", "pun", "spun", "stun"],
    "ug": ["bug", "dug", "hug", "jug", "mug", "rug", "tug", "plug", "slug"],
    "up": ["cup", "pup", "sup"],
    "ub": ["cub", "hub", "pub", "rub", "sub", "tub", "club", "grub", "stub"],
    "ed": ["bed", "fed", "led", "red", "shed", "sled", "wed", "fled", "bred"],
    "en": ["den", "hen", "men", "pen", "ten", "then", "when", "glen", "wren"],
    "et": ["bet", "get", "jet", "let", "met", "net", "pet", "set", "wet"],
    "ell": ["bell", "cell", "fell", "sell", "tell", "well", "yell", "shell", "spell"],
    "ake": ["bake", "cake", "fake", "lake", "make", "rake", "take", "wake", "shake"],
    "ine": ["dine", "fine", "line", "mine", "nine", "pine", "vine", "wine", "shine"],
    "ore": ["bore", "core", "more", "pore", "sore", "tore", "wore", "shore", "store"],
    "ail": ["bail", "fail", "hail", "jail", "mail", "nail", "pail", "rail", "sail"],
    "ay": ["bay", "day", "hay", "jay", "may", "pay", "ray", "say", "way"],
    "ee": ["bee", "fee", "see", "tree", "free", "knee", "three", "flee", "glee"],
}

# Build a reverse index: word -> ending key
_WORD_TO_ENDING: Dict[str, str] = {}
for _ending, _words in _RHYME_FAMILIES.items():
    for _w in _words:
        _WORD_TO_ENDING[_w] = _ending

# Non-rhyming distractor pool (diverse categories to avoid accidental rhymes)
_DISTRACTOR_POOL = [
    "milk", "ship", "lamp", "star", "book", "fish", "drum", "nest",
    "ring", "moon", "cloud", "train", "whale", "grape", "queen", "clock",
    "plum", "desk", "globe", "brick", "shelf", "storm", "plant", "crab",
]


def _find_ending(word: str) -> str | None:
    """Find the rhyme family ending for a word."""
    if word in _WORD_TO_ENDING:
        return _WORD_TO_ENDING[word]
    for length in range(min(4, len(word)), 1, -1):
        ending = word[-length:]
        if ending in _RHYME_FAMILIES:
            return ending
    return None


def get_rhyme(word: str) -> Dict[str, object]:
    """Return a rhyming quiz for the given word."""
    word = (word or "").strip().lower()
    if not word:
        return {
            "status": "error",
            "data": {"message": "Please provide a word."},
            "meta": {"difficulty": "easy", "level": 1},
        }

    ending = _find_ending(word)
    if not ending:
        return {
            "status": "error",
            "data": {
                "message": f"No rhymes found for '{word}'. Try a simpler word like 'cat' or 'sun'.",
                "word": word,
            },
            "meta": {"difficulty": "easy", "level": 1},
        }

    rhymes = [w for w in _RHYME_FAMILIES[ending] if w != word]
    if not rhymes:
        return {
            "status": "error",
            "data": {"message": "Not enough rhymes found.", "word": word},
            "meta": {"difficulty": "easy", "level": 1},
        }

    correct = random.choice(rhymes)

    # Pick 3 distractors that do NOT rhyme with the target
    safe_distractors = [
        w for w in _DISTRACTOR_POOL
        if w != word and w != correct and w not in _RHYME_FAMILIES.get(ending, [])
    ]
    distractors = random.sample(safe_distractors, min(3, len(safe_distractors)))

    options = distractors + [correct]
    random.shuffle(options)

    prompt = f"Which word rhymes with '{word}'?"
    
    from app.services.learning.audio_helper import get_audio_url

    option_details = [
        {"word": opt, "audioUrl": get_audio_url(opt)}
        for opt in options
    ]

    return {
        "status": "success",
        "data": {
            "word": word,
            "wordAudioUrl": get_audio_url(word),
            "prompt": prompt,
            "promptAudioUrl": get_audio_url(prompt),
            "options": options,
            "optionDetails": option_details,
            "correct": correct,
            "rhymeFamily": ending,
        },
        "meta": {"difficulty": "easy" if len(ending) == 2 else "medium", "level": 1},
    }
