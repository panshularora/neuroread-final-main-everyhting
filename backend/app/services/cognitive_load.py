from __future__ import annotations

from dataclasses import dataclass
from functools import lru_cache
from typing import Dict, List

import textstat
try:
    import spacy  # type: ignore
except Exception:  # pragma: no cover
    spacy = None
import re


# Run once:
# python -m spacy download en_core_web_sm


# -------------------- NLP LOADER --------------------

@lru_cache(maxsize=1)
def get_nlp():
    """Lazy-load spaCy model once."""
    if spacy is None:
        return None
    try:
        return spacy.load("en_core_web_sm", exclude=["ner"])
    except Exception:
        # Fallback to a lightweight pipeline with a sentencizer.
        nlp = spacy.blank("en")
        if "sentencizer" not in nlp.pipe_names:
            nlp.add_pipe("sentencizer")
        return nlp


# -------------------- DATA STRUCTURE --------------------

@dataclass
class CognitiveLoadResult:
    readability_score: float
    avg_sentence_length: float
    complex_word_ratio: float
    cognitive_load_score: float

    def as_dict(self) -> Dict[str, float]:
        return {
            "readability_score": self.readability_score,
            "avg_sentence_length": self.avg_sentence_length,
            "complex_word_ratio": self.complex_word_ratio,
            "cognitive_load_score": self.cognitive_load_score,
        }


# -------------------- FEATURE EXTRACTORS --------------------

def compute_readability_score(text: str) -> float:
    if not text or text.isspace():
        return 100.0
    return float(textstat.flesch_reading_ease(text))


def compute_avg_sentence_length(text: str, doc=None) -> float:
    if not text or text.isspace():
        return 0.0

    if doc is None:
        nlp = get_nlp()
        if nlp is None:
            # Simple fallback: approximate sentence length by splitting.
            import re

            sentences = [s for s in re.split(r"(?<=[.!?])\s+", text.strip()) if s]
            if not sentences:
                return 0.0
            word_counts = [len([w for w in s.split() if w.isalpha()]) for s in sentences]
            word_counts = [c for c in word_counts if c > 0]
            return (sum(word_counts) / len(word_counts)) if word_counts else 0.0
        doc = nlp(text)

    sentence_lengths = []

    for sent in doc.sents:
        token_count = sum(1 for t in sent if t.is_alpha)
        if token_count > 0:
            sentence_lengths.append(token_count)

    if not sentence_lengths:
        return 0.0

    return sum(sentence_lengths) / len(sentence_lengths)


def compute_complex_word_ratio(text: str) -> float:
    if not text or text.isspace():
        return 0.0

    total_words = textstat.lexicon_count(text, removepunct=True)
    if total_words == 0:
        return 0.0

    complex_words = textstat.difficult_words(text)
    ratio = complex_words / total_words

    return max(0.0, min(1.0, float(ratio)))


# -------------------- SCORING LOGIC --------------------

def _clamp01(x: float) -> float:
    return max(0.0, min(1.0, x))


def _map_to_cognitive_load(
    readability_score: float,
    avg_sentence_length: float,
    complex_word_ratio: float,
) -> float:

    fre_clamped = max(0.0, min(100.0, readability_score))
    readability_load = 1.0 - fre_clamped / 100.0
    readability_load = _clamp01(readability_load)

    sent_load = (avg_sentence_length - 5.0) / 30.0
    sent_load = _clamp01(sent_load)

    complex_load = complex_word_ratio / 0.30
    complex_load = _clamp01(complex_load)

    w_read, w_sent, w_complex = 0.4, 0.3, 0.3

    combined = (
        w_read * readability_load
        + w_sent * sent_load
        + w_complex * complex_load
    )

    return round(combined * 100.0, 2)


def get_difficulty_label(score: float) -> str:
    if score < 30:
        return "Low Cognitive Load"
    elif score < 60:
        return "Moderate Cognitive Load"
    else:
        return "High Cognitive Load"


# -------------------- DYSLEXIA SUPPORT UTILITIES --------------------

def extract_difficult_words_with_positions(text: str) -> List[Dict]:
    """
    Return "difficult" words with start/end offsets.

    Avoid calling `textstat.difficult_words()` per-token (very slow) by using a
    lightweight heuristic suitable for highlighting.
    """
    results: List[Dict] = []
    if not text or text.isspace():
        return results

    for match in re.finditer(r"\b[\w']+\b", text):
        word = match.group()
        w = word.strip("'")
        if not w:
            continue

        # Heuristic: long words or multi-syllable words are more likely difficult.
        # This is used only for UI highlighting, not scoring.
        try:
            syllables = textstat.syllable_count(w)
        except Exception:
            syllables = 0

        if len(w) >= 9 or syllables >= 3:
            results.append(
                {
                    "word": word,
                    "start": match.start(),
                    "end": match.end(),
                }
            )

    return results


def sentence_level_analysis(text: str, doc=None) -> List[Dict]:
    if doc is None:
        nlp = get_nlp()
        if nlp is None:
            import re

            sentences = [s.strip() for s in re.split(r"(?<=[.!?])\s+", text) if s.strip()]
            doc = sentences
        else:
            doc = nlp(text)

    results = []

    if hasattr(doc, "sents"):
        sents_iter = doc.sents
    else:
        sents_iter = doc  # type: ignore

    for sent in sents_iter:
        sentence_text = sent.text.strip() if hasattr(sent, "text") else str(sent).strip()
        if not sentence_text:
            continue

        readability = compute_readability_score(sentence_text)
        if hasattr(sent, "__iter__"):
            # spaCy Span: compute directly without re-running NLP.
            avg_len = float(sum(1 for t in sent if getattr(t, "is_alpha", False)))
        else:
            avg_len = compute_avg_sentence_length(sentence_text)
        complex_ratio = compute_complex_word_ratio(sentence_text)

        score = _map_to_cognitive_load(
            readability,
            avg_len,
            complex_ratio
        )

        results.append({
            "sentence": sentence_text,
            "score": score,
            "difficulty_label": get_difficulty_label(score)
        })

    return results


def estimate_reading_time(text: str) -> float:
    words = textstat.lexicon_count(text, removepunct=True)
    if words == 0:
        return 0.0

    minutes = words / 200
    return round(minutes, 2)


# -------------------- PUBLIC API --------------------

def calculate_cognitive_load(text: str) -> Dict:

    if not text or text.isspace():
        return {}

    nlp = get_nlp()
    doc = nlp(text) if nlp is not None else None

    readability = compute_readability_score(text)
    avg_len = compute_avg_sentence_length(text, doc)
    complex_ratio = compute_complex_word_ratio(text)
    final_score = _map_to_cognitive_load(readability, avg_len, complex_ratio)

    result = CognitiveLoadResult(
        readability_score=readability,
        avg_sentence_length=avg_len,
        complex_word_ratio=complex_ratio,
        cognitive_load_score=final_score,
    )

    return {
        **result.as_dict(),
        "difficulty_label": get_difficulty_label(final_score),
        "estimated_reading_time_minutes": estimate_reading_time(text),
        "difficult_words": extract_difficult_words_with_positions(text),
        "sentence_heatmap": sentence_level_analysis(text, doc)
    }


# -------------------- QUICK TEST --------------------

if __name__ == "__main__":
    sample = (
        "This is a simple sentence. "
        "However, the subsequent sentence, replete with specialized terminology "
        "and subordinate clauses, may impose a higher cognitive burden."
    )

    result = calculate_cognitive_load(sample)
    print(result)