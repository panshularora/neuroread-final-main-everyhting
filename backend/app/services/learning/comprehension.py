"""Comprehension Questions service.

Generates meaningful comprehension questions with multiple-choice answers.
"""
from __future__ import annotations

import re
import random
from typing import Dict, List


def _extract_nouns_simple(sentence: str) -> List[str]:
    """Very basic noun extraction — picks capitalised / long words."""
    words = re.findall(r"\b[A-Za-z]{3,}\b", sentence)
    # Skip common stop words
    stop = {"the", "and", "was", "were", "are", "for", "with",
            "that", "this", "from", "they", "have", "has", "had",
            "been", "not", "but", "what", "all", "can", "her",
            "his", "one", "our", "out", "you", "who", "its",
            "just", "about", "over", "very", "also", "into"}
    return [w for w in words if w.lower() not in stop]


def _make_mcq(question: str, correct: str, pool: List[str]) -> Dict[str, object]:
    """Build a multiple-choice question dict."""
    distractors = [w for w in pool if w.lower() != correct.lower()]
    chosen = random.sample(distractors, min(3, len(distractors)))
    options = chosen + [correct]
    random.shuffle(options)
    return {
        "question": question,
        "options": options,
        "correct": correct,
    }


def generate_comprehension_questions(
    text: str, *, max_questions: int = 3
) -> Dict[str, object]:
    """Generate comprehension questions with multiple-choice answers."""
    if not text or text.isspace():
        return {
            "status": "success",
            "data": {"questions": [], "passage": ""},
            "meta": {"difficulty": "easy", "level": 1},
        }

    cleaned = " ".join(text.split())
    sentences = re.split(r"(?<=[.!?])\s+", cleaned)
    sentences = [s.strip() for s in sentences if s.strip()]

    all_nouns = _extract_nouns_simple(cleaned)
    # Deduplicate while preserving order
    seen = set()
    unique_nouns: List[str] = []
    for n in all_nouns:
        nl = n.lower()
        if nl not in seen:
            seen.add(nl)
            unique_nouns.append(n)

    generic_pool = [
        "running", "sleeping", "eating", "playing", "reading",
        "mountain", "river", "house", "school", "garden",
        "happy", "strong", "bright", "cold", "warm",
    ]

    questions: List[Dict[str, object]] = []

    # Q1: What is the passage about? (pick first key noun as answer)
    if unique_nouns:
        first_noun = unique_nouns[0]
        pool = [n for n in unique_nouns[1:4]] + random.sample(generic_pool, min(3, len(generic_pool)))
        questions.append(_make_mcq(
            "What is this passage mainly about?",
            first_noun,
            pool,
        ))

    # Q2: Sentence-specific question for the first sentence
    if sentences:
        s1_nouns = _extract_nouns_simple(sentences[0])
        if len(s1_nouns) >= 2:
            subject, detail = s1_nouns[0], s1_nouns[1]
            pool = random.sample(generic_pool, min(4, len(generic_pool)))
            questions.append(_make_mcq(
                f"In the first sentence, what is mentioned along with '{subject}'?",
                detail,
                pool,
            ))
        elif s1_nouns:
            pool = random.sample(generic_pool, min(4, len(generic_pool)))
            questions.append(_make_mcq(
                f"What is mentioned in the first sentence?",
                s1_nouns[0],
                pool,
            ))

    # Q3: If there are multiple sentences, ask about the second
    if len(sentences) > 1:
        s2_nouns = _extract_nouns_simple(sentences[1])
        if s2_nouns:
            key_word = s2_nouns[0]
            pool = random.sample(generic_pool, min(4, len(generic_pool)))
            questions.append(_make_mcq(
                f"What happens next in the passage?",
                key_word,
                pool,
            ))

    # Q4: True/False style — does the passage mention a particular word?
    if len(unique_nouns) >= 2:
        mentioned = random.choice(unique_nouns[:3])
        questions.append({
            "question": f"Does the passage mention '{mentioned}'?",
            "options": ["Yes", "No"],
            "correct": "Yes",
        })

    return {
        "status": "success",
        "data": {
            "passage": cleaned,
            "questions": questions[:max(1, max_questions)],
        },
        "meta": {"difficulty": "medium", "level": 1},
    }
