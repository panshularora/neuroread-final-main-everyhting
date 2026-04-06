"""
Phoneme color annotation endpoint.

Returns word-level phoneme annotations for b/d/p/q confusion colors.
Research: Wilkins (2004) — color overlays; Snowling & Hulme (2011) — phonological awareness.
"""
import re
from typing import Dict, List, Optional
from fastapi import APIRouter
from pydantic import BaseModel, Field

router = APIRouter()

# Research-backed color assignments for easily confused letters
PHONEME_COLORS: Dict[str, Optional[str]] = {
    "b": "#4A90D9",   # Blue — helps distinguish from d
    "d": "#E8734A",   # Orange — helps distinguish from b
    "p": "#9B59B6",   # Purple — helps distinguish from q
    "q": "#27AE60",   # Green — helps distinguish from p
    "n": None,        # No color
    "u": None,        # No color
}


def _annotate_word(word: str) -> Dict:
    """
    Annotate a single word with per-character color data.
    
    Returns:
        {word: str, tokens: [{char: str, color: str|null}]}
    """
    tokens = []
    for char in word:
        lower_char = char.lower()
        color = PHONEME_COLORS.get(lower_char, None)
        tokens.append({"char": char, "color": color})
    return {"word": word, "tokens": tokens}


def annotate_text(text: str) -> List[Dict]:
    """
    Annotate all words in text with phoneme color data.
    
    Args:
        text: Input text
    
    Returns:
        List of word annotation objects
    """
    # Split on whitespace, preserving punctuation attached to words
    raw_words = text.split()
    result = []
    for raw in raw_words:
        # Strip trailing punctuation for annotation, but preserve in output
        match = re.match(r'^([a-zA-Z\'-]+)([^a-zA-Z\'-]*)$', raw)
        if match:
            word_part = match.group(1)
            punct_part = match.group(2)
            annotation = _annotate_word(word_part)
            if punct_part:
                annotation["tokens"].append({"char": punct_part, "color": None})
            annotation["raw"] = raw
        else:
            # Non-letter token (number, symbol, etc.)
            annotation = {"word": raw, "raw": raw, "tokens": [{"char": raw, "color": None}]}
        result.append(annotation)
    return result


class AnnotateRequest(BaseModel):
    text: str = Field(..., min_length=1, description="Text to annotate")


@router.post(
    "/assistive/annotate",
    summary="Phoneme-color annotate text for b/d/p/q discrimination.",
)
def annotate_endpoint(payload: AnnotateRequest):
    """
    Returns per-character color annotations for accessible reading.
    
    Colors b (blue), d (orange), p (purple), q (green) to help
    dyslexic readers distinguish easily confused letters.
    """
    text = payload.text.strip()
    if not text:
        return {"annotations": [], "color_map": PHONEME_COLORS}

    annotations = annotate_text(text)
    return {
        "annotations": annotations,
        "color_map": PHONEME_COLORS,
        "total_words": len(annotations),
    }
