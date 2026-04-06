from __future__ import annotations

from typing import Dict

from fastapi import APIRouter, HTTPException
import textstat
from pydantic import BaseModel, Field

from app.services.cognitive_load import extract_difficult_words_with_positions

router = APIRouter()

class VocabRequest(BaseModel):
    text: str = Field(..., min_length=1)


@router.post("/assistive/vocab")
def vocab(request: VocabRequest) -> Dict[str, object]:
    """Return simple vocabulary hints for difficult words in text."""
    text = request.text.strip()
    if not text:
        raise HTTPException(status_code=400, detail="text is required")

    difficult = extract_difficult_words_with_positions(text)
    unique_words = []
    seen = set()
    for item in difficult:
        w = item.get("word")
        if not w:
            continue
        key = w.lower()
        if key not in seen:
            seen.add(key)
            unique_words.append(w)

    return {
        "difficult_words": unique_words,
        "vocabulary": {
            w: {
                "is_difficult": textstat.difficult_words(w) > 0,
                "suggested_simpler_form": w.lower(),
                "definition_hint": f"{w} might be difficult. Try a simpler synonym or break it into syllables.",
            }
            for w in unique_words
        },
    }