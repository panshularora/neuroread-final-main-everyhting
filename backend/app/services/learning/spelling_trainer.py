from __future__ import annotations

import random
import re
from typing import Dict, List


def generate_scramble_tasks(text: str, *, max_words: int = 5, seed: int | None = None) -> Dict[str, object]:
    """Generate scrambled-word spelling tasks from text."""
    if not text or text.isspace():
        return {"tasks": []}

    rng = random.Random(seed)
    words = [w for w in re.findall(r"\b[\w']+\b", text) if len(w) >= 4]
    words = list(dict.fromkeys(words))  # unique, stable order
    rng.shuffle(words)
    words = words[: max(1, min(max_words, len(words)))]

    tasks: List[Dict[str, str]] = []
    for w in words:
        letters = list(w)
        rng.shuffle(letters)
        scrambled = "".join(letters)
        # Avoid returning identical scramble if shuffle didn't change.
        if scrambled.lower() == w.lower() and len(w) > 1:
            scrambled = w[-1] + w[:-1]
        tasks.append({"word": w, "scrambled": scrambled})

    return {"tasks": tasks}

