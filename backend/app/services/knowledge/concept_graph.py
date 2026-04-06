from __future__ import annotations

import hashlib
import json
import os
import time
from typing import Any, Dict, List, Tuple

from dotenv import load_dotenv
from app.services.llm_client import get_groq_client

from app.services.cognitive_load import get_nlp
from app.services.assistive.keyword_extractor import extract_keywords

load_dotenv()

def _client():
    return get_groq_client()

_CACHE: Dict[str, Dict[str, Any]] = {}
_CACHE_TTL_S = 60 * 10


def _cache_key(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8", errors="ignore")).hexdigest()


def _cache_get(key: str):
    item = _CACHE.get(key)
    if not item:
        return None
    if (time.time() - item["ts"]) > _CACHE_TTL_S:
        _CACHE.pop(key, None)
        return None
    return item["value"]


def _cache_set(key: str, value: Any):
    _CACHE[key] = {"ts": time.time(), "value": value}


def _extract_concepts(text: str, top_k: int = 8) -> List[str]:
    t = (text or "").strip()
    if not t:
        return []

    concepts: List[str] = []

    nlp = get_nlp()
    if nlp is not None:
        doc = nlp(t)
        seen = set()
        # noun chunks if available (depends on pipeline)
        noun_chunks = []
        try:
            noun_chunks = list(doc.noun_chunks)
        except Exception:
            noun_chunks = []

        for chunk in noun_chunks:
            c = chunk.text.strip()
            if not c:
                continue
            c = c[:60]
            key = c.lower()
            if key in seen:
                continue
            seen.add(key)
            concepts.append(c)

    # Add keyword extractor output (works even without spaCy model)
    try:
        kws = extract_keywords(t, top_n=10)
        for k in kws:
            k2 = str(k).strip()
            if k2 and k2.lower() not in {c.lower() for c in concepts}:
                concepts.append(k2[:60])
    except Exception:
        pass

    # De-dup while preserving order
    out = []
    seen2 = set()
    for c in concepts:
        key = c.lower()
        if key in seen2:
            continue
        seen2.add(key)
        out.append(c)

    return out[:top_k]


def _llm_edges(concepts: List[str]) -> List[Dict[str, str]]:
    if len(concepts) < 2:
        return []

    system_prompt = """
You create a small concept relationship graph.

Return ONLY valid JSON:
{
  "edges": [
    {"source": "ConceptA", "target": "ConceptB", "relation": "..." }
  ]
}

Constraints:
- Only use sources/targets from the provided concept list exactly.
- Create 3-10 edges.
- Keep relations short (<= 8 words).
"""
    user_prompt = json.dumps({"concepts": concepts})

    try:
        resp = _client().chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.3,
        )
        content = resp.choices[0].message.content or ""
        cleaned = content.strip()
        if cleaned.startswith("```"):
            cleaned = cleaned.split("\n", 1)[1]
            cleaned = cleaned.rsplit("```", 1)[0]
        data = json.loads(cleaned)
        edges = data.get("edges") if isinstance(data, dict) else None
        if isinstance(edges, list):
            out = []
            allowed = set(concepts)
            for e in edges:
                if not isinstance(e, dict):
                    continue
                s = e.get("source")
                t = e.get("target")
                r = e.get("relation") or "related to"
                if s in allowed and t in allowed and s != t:
                    out.append({"source": s, "target": t, "relation": str(r)[:80]})
            return out[:15]
    except Exception:
        return []

    return []


def build_concept_graph(text: str) -> Dict[str, Any]:
    t = (text or "").strip()
    if not t:
        return {"nodes": [], "edges": []}

    key = _cache_key(t)
    cached = _cache_get(key)
    if cached is not None:
        return cached

    concepts = _extract_concepts(t)
    nodes = [{"id": c, "type": "concept"} for c in concepts]

    edges = _llm_edges(concepts)
    if not edges:
        # deterministic fallback: chain concepts
        edges = []
        for i in range(len(concepts) - 1):
            edges.append(
                {
                    "source": concepts[i],
                    "target": concepts[i + 1],
                    "relation": "connects to",
                }
            )

    payload = {"nodes": nodes, "edges": edges}
    _cache_set(key, payload)
    return payload

