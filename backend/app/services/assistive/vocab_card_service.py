from __future__ import annotations

import json
import os
from typing import List, Tuple

from dotenv import load_dotenv
from app.services.llm_client import get_groq_client

load_dotenv()

def _client():
    return get_groq_client()


def _from_wordnet(word: str) -> Tuple[str, str, str, List[str], float] | None:
    try:
        from nltk.corpus import wordnet as wn  # type: ignore
    except Exception:
        return None

    try:
        synsets = wn.synsets(word)
    except LookupError:
        # WordNet corpus not downloaded in this environment.
        return None
    except Exception:
        return None
    if not synsets:
        return None

    primary = synsets[0]
    definition = primary.definition()
    examples = primary.examples()
    example_sentence = examples[0] if examples else f"Here is an example with {word}."

    synonyms = sorted({lemma.name().replace("_", " ") for lemma in primary.lemmas()})

    # Simple heuristic: depth in the hypernym tree as difficulty proxy.
    depth = primary.max_depth() or 0
    difficulty_score = max(0.0, min(1.0, depth / 15.0)) * 100.0

    simple_definition = definition

    return definition, simple_definition, example_sentence, synonyms, round(
        difficulty_score, 2
    )


def _from_llm(word: str) -> Tuple[str, str, str, List[str], float]:
    system_prompt = """
You are a helpful vocabulary tutor.

Return ONLY valid JSON with the following schema:
{
  "definition": "...",
  "simple_definition": "...",
  "example_sentence": "...",
  "synonyms": ["..."],
  "difficulty_score": 0.0
}
"""

    user_prompt = f"Build a vocabulary card for the English word '{word}'."

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
        cleaned = content.strip()
        if cleaned.startswith("```"):
            cleaned = cleaned.split("\n", 1)[1]
            cleaned = cleaned.rsplit("```", 1)[0]
        data = json.loads(cleaned)
    except Exception:
        data = {}

    definition = data.get("definition") or f"A definition for {word}."
    simple_definition = (
        data.get("simple_definition")
        or f"{word.capitalize()} means something you should learn."
    )
    example_sentence = (
        data.get("example_sentence") or f"This sentence helps explain the word {word}."
    )
    synonyms = data.get("synonyms") or []
    if not isinstance(synonyms, list):
        synonyms = [str(synonyms)]
    difficulty_score = float(data.get("difficulty_score") or 50.0)

    return (
        str(definition),
        str(simple_definition),
        str(example_sentence),
        [str(s).strip() for s in synonyms if str(s).strip()],
        round(difficulty_score, 2),
    )


def build_vocab_card(word: str):
    """
    Try WordNet first, fall back to Groq LLM.
    """
    word = word.strip()
    wn_data = _from_wordnet(word)
    if wn_data is not None:
        return wn_data
    return _from_llm(word)

