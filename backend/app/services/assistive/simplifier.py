import os
import json
from typing import Any, Dict

from dotenv import load_dotenv
from app.services.llm_client import get_groq_client

load_dotenv()

def _client():
    return get_groq_client()

def _fallback_simplify(text: str, level: int) -> Dict[str, Any]:
    """Deterministic local fallback when the LLM call fails."""
    import re

    t = " ".join((text or "").strip().split())
    if not t:
        return {
            "simplified_text": "",
            "bullet_points": [],
            "definitions": {},
            "step_by_step_explanation": [],
        }

    # More aggressive simplification at lower levels.
    max_sentences = 3 if level == 1 else 5 if level == 2 else 8
    max_len = 120 if level == 1 else 160 if level == 2 else 220

    sentences = [s.strip() for s in re.split(r"(?<=[.!?])\s+", t) if s.strip()]
    short = []
    for s in sentences[:max_sentences]:
        if len(s) > max_len:
            s = s[: max_len - 1].rstrip() + "…"
        short.append(s)

    simplified_text = " ".join(short)
    bullet_points = short

    return {
        "simplified_text": simplified_text,
        "bullet_points": bullet_points,
        "definitions": {},
        "step_by_step_explanation": bullet_points,
    }


def simplify_text(text: str, level: int) -> Dict[str, Any]:
    """Call Groq (OpenAI‑style) to simplify text for neurodiverse learners."""
    system_prompt = """
You are an AI accessibility assistant for neurodiverse learners.

Simplify the given text based on the level:

Level 1 = very simple, short sentences.
Level 2 = moderately simplified.
Level 3 = lightly simplified.

Return ONLY valid JSON in this exact format:

{
  "simplified_text": "...",
  "bullet_points": ["..."],
  "definitions": {"term": "..."},
  "step_by_step_explanation": ["step 1", "step 2"]
}

Do not return anything outside JSON.
"""

    user_prompt = f"""
Simplification level: {level}

Text:
{text}
"""

    try:
        response = _client().chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.3,
        )
        content = response.choices[0].message.content or ""
    except Exception as e:
        # If the provider is unreachable (network/DNS/timeout), fall back so the API doesn't 500.
        print(f"LLM Fetch Error: {e}")
        return _fallback_simplify(text, level)

    try:
        cleaned = content.strip()
        if cleaned.startswith("```"):
            cleaned = cleaned.split("\n", 1)[1]
            cleaned = cleaned.rsplit("```", 1)[0]
        return json.loads(cleaned)
    except Exception:
        return {
            "simplified_text": content,
            "bullet_points": [],
            "definitions": {},
            "step_by_step_explanation": [],
        }