"""Sound Matching Game service.

Given a target sound, returns the correct matching word and carefully chosen
distractors that start with similar-sounding consonants.
"""
from __future__ import annotations

import random
from typing import Dict, List

# Maps sound keys to words that start with that sound
_SOUND_TO_WORDS: Dict[str, List[str]] = {
    "k": ["cat", "kite", "cup", "car", "cake", "king", "key", "cow"],
    "s": ["sun", "star", "snake", "sock", "sand", "seal", "sit"],
    "b": ["ball", "bat", "bear", "bus", "book", "bed", "bird"],
    "d": ["dog", "duck", "drum", "door", "doll", "dive", "dig"],
    "f": ["fish", "fan", "frog", "fire", "flag", "fox", "flip"],
    "g": ["goat", "grape", "girl", "gate", "gift", "gap", "gum"],
    "h": ["hat", "hen", "house", "horse", "hill", "hop", "hug"],
    "j": ["jam", "jet", "jug", "jump", "jungle", "joy", "jog"],
    "l": ["lion", "lamp", "leaf", "leg", "ladder", "lip", "log"],
    "m": ["moon", "map", "milk", "mouse", "mango", "mat", "mud"],
    "n": ["nest", "net", "nose", "nut", "nail", "nap", "nod"],
    "p": ["pig", "pen", "pot", "pizza", "parrot", "pin", "pup"],
    "r": ["rain", "ring", "rabbit", "robot", "rose", "run", "rug"],
    "t": ["tree", "top", "turtle", "train", "tiger", "tap", "tin"],
    "v": ["van", "vase", "violin", "vest", "vine", "vet", "vim"],
    "w": ["water", "web", "whale", "wind", "wagon", "wax", "win"],
    "z": ["zebra", "zero", "zoo", "zipper", "zone", "zap", "zing"],
}

# Similar-sounding consonant pairs — used to pick confusing (good) distractors
_SIMILAR_SOUNDS: Dict[str, List[str]] = {
    "b": ["p", "d"],
    "d": ["t", "b"],
    "f": ["v", "s"],
    "g": ["k", "d"],
    "h": ["f", "k"],
    "j": ["g", "d"],
    "k": ["g", "t"],
    "l": ["r", "n"],
    "m": ["n", "b"],
    "n": ["m", "l"],
    "p": ["b", "t"],
    "r": ["l", "w"],
    "s": ["z", "f"],
    "t": ["d", "p"],
    "v": ["f", "w"],
    "w": ["v", "r"],
    "z": ["s", "j"],
}


def get_sound_match(sound: str) -> Dict[str, object]:
    """Return a sound-match quiz for the given sound."""
    sound = (sound or "").strip().lower()
    if not sound:
        return {
            "status": "error",
            "data": {"message": "Please provide a sound."},
            "meta": {"difficulty": "easy", "level": 1},
        }

    matching_words = _SOUND_TO_WORDS.get(sound)
    if not matching_words:
        return {
            "status": "error",
            "data": {
                "message": f"No words found for sound '{sound}'.",
                "availableSounds": sorted(_SOUND_TO_WORDS.keys()),
            },
            "meta": {"difficulty": "easy", "level": 1},
        }

    correct = random.choice(matching_words)

    # Pick distractors from similar-sounding groups first
    similar = _SIMILAR_SOUNDS.get(sound, [])
    distractor_pool: List[str] = []
    for sim_sound in similar:
        sim_words = _SOUND_TO_WORDS.get(sim_sound, [])
        distractor_pool.extend(sim_words)

    # Fallback: add words from other sounds if not enough
    if len(distractor_pool) < 2:
        for other_sound, words in _SOUND_TO_WORDS.items():
            if other_sound != sound and other_sound not in similar:
                distractor_pool.extend(words)

    # Remove any words that also match the target sound
    distractor_pool = [w for w in distractor_pool if w not in matching_words and w != correct]
    distractors = random.sample(distractor_pool, min(2, len(distractor_pool)))

    options = distractors + [correct]
    random.shuffle(options)

    prompt = f"Which word starts with the /{sound}/ sound?"
    
    from app.services.learning.audio_helper import get_audio_url

    option_details = [
        {"word": opt, "audioUrl": get_audio_url(opt)}
        for opt in options
    ]

    return {
        "status": "success",
        "data": {
            "sound": sound,
            "soundAudioUrl": get_audio_url(sound, slow=True),
            "prompt": prompt,
            "promptAudioUrl": get_audio_url(prompt),
            "options": options,
            "optionDetails": option_details,
            "correct": correct,
        },
        "meta": {"difficulty": "easy", "level": 1},
    }
