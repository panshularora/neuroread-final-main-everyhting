from __future__ import annotations

from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.services.assistive.keyword_extractor import extract_keywords
from app.services.assistive.simplifier import simplify_text
from app.services.assistive.summary_service import generate_summary
from app.services.cognitive_load import extract_difficult_words_with_positions

router = APIRouter()


class AssistRequest(BaseModel):
    text: str = Field(..., min_length=1)
    level: Optional[int] = Field(default=None, ge=1, le=3)
    top_keywords: int = Field(default=5, ge=1, le=20)


@router.post("/assistive/assist")
def assist(request: AssistRequest) -> Dict[str, Any]:
    """Combined assistive endpoint: simplify + keywords + summary + vocabulary hints."""
    text = request.text.strip()
    if not text:
        raise HTTPException(status_code=400, detail="text is required")

    level = request.level or 2

    simplified = simplify_text(text, level)
    simplified_text = simplified.get("simplified_text") if isinstance(simplified, dict) else str(simplified)

    keywords: List[str] = extract_keywords(text, top_n=request.top_keywords)
    summary: str = generate_summary(text)

    difficult = extract_difficult_words_with_positions(text)
    vocab: Dict[str, str] = {
        item["word"]: f"{item['word']} might be difficult. Try a simpler synonym or break it into syllables."
        for item in difficult
        if "word" in item
    }

    return {
        "simplified_text": simplified_text,
        "keywords": keywords,
        "summary": summary,
        "vocabulary": vocab,
    }

