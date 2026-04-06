from __future__ import annotations

import json
from typing import List

from dotenv import load_dotenv
import os

from app.services.cognitive_load import get_nlp
from app.schemas.assistive_rewrite import SentenceRewrite
from app.services.llm_client import get_groq_client

load_dotenv()

def _client():
    return get_groq_client()


def _split_sentences(text: str) -> List[str]:
    nlp = get_nlp()
    if nlp is None:
        import re

        return [s.strip() for s in re.split(r"(?<=[.!?])\s+", text.strip()) if s.strip()]
    doc = nlp(text)
    return [s.text.strip() for s in doc.sents if s.text.strip()]


def generate_rewrites(text: str, mode: str) -> List[SentenceRewrite]:
    sentences = _split_sentences(text)
    if not sentences:
        return []

    system_prompt = """
You are an AI writing assistant that rewrites sentences to match a target style
while preserving meaning and improving readability.

Return ONLY valid JSON with the following structure:
[
  {
    "original": "...",
    "rewritten": "...",
    "explanation": "Why the rewrite improves readability"
  }
]
"""

    mode_instruction = {
        "simpler": "Rewrite each sentence using shorter, clearer language suitable for a general audience.",
        "academic": "Rewrite each sentence in a more formal, academic tone while keeping it readable.",
        "child_friendly": "Rewrite each sentence so that a 10‑year‑old could understand it, using simple words and examples.",
    }.get(mode, "Rewrite each sentence in a clearer, more readable way.")

    user_prompt = {
        "mode": mode,
        "instruction": mode_instruction,
        "sentences": sentences,
    }

    try:
        response = _client().chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {"role": "system", "content": system_prompt},
                {
                    "role": "user",
                    "content": json.dumps(user_prompt),
                },
            ],
            temperature=0.4,
        )
        content = response.choices[0].message.content or ""
    except Exception:
        # Fallback: simple local transformation.
        return [
            SentenceRewrite(
                original=s,
                rewritten=s,
                explanation="Fallback mode: original sentence returned because the rewrite service was unavailable.",
            )
            for s in sentences
        ]

    try:
        cleaned = content.strip()
        if cleaned.startswith("```"):
            cleaned = cleaned.split("\n", 1)[1]
            cleaned = cleaned.rsplit("```", 1)[0]
        data = json.loads(cleaned)
    except Exception:
        # Best-effort heuristic parsing failure.
        return [
            SentenceRewrite(
                original=s,
                rewritten=s,
                explanation="The rewrite model returned an unexpected format; original sentence preserved.",
            )
            for s in sentences
        ]

    rewrites: List[SentenceRewrite] = []
    for idx, s in enumerate(sentences):
        item = data[idx] if isinstance(data, list) and idx < len(data) else None
        if isinstance(item, dict):
            original = item.get("original") or s
            rewritten = item.get("rewritten") or s
            explanation = item.get("explanation") or "Improved for clarity and readability."
        else:
            original = s
            rewritten = s
            explanation = "Improved for clarity and readability."

        rewrites.append(
            SentenceRewrite(
                original=original,
                rewritten=rewritten,
                explanation=explanation,
            )
        )

    return rewrites

