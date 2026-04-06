from __future__ import annotations

import random
import re
from typing import Dict, List


def generate_fill_in_the_blank(text: str, *, blanks: int = 3, seed: int | None = None) -> Dict[str, object]:
    """Generate a simple fill-in-the-blank exercise from text."""
    if not text or text.isspace():
        return {"original_text": "", "exercise_text": "", "answers": []}

    rng = random.Random(seed)
    words = re.findall(r"\b[\w']+\b", text)
    if not words:
        return {"original_text": text, "exercise_text": text, "answers": []}

    unique_candidates = [w for w in dict.fromkeys(words) if len(w) >= 4]
    if not unique_candidates:
        unique_candidates = [w for w in dict.fromkeys(words)]

    chosen = unique_candidates[:]
    rng.shuffle(chosen)
    chosen = chosen[: max(1, min(blanks, len(chosen)))]

    answers: List[str] = []
    exercise = text
    for idx, w in enumerate(chosen, start=1):
        # Replace first occurrence only.
        pattern = re.compile(rf"\b{re.escape(w)}\b")
        if pattern.search(exercise):
            exercise = pattern.sub(f"____({idx})", exercise, count=1)
            answers.append(w)

    return {"original_text": text, "exercise_text": exercise, "answers": answers}

