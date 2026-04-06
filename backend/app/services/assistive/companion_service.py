from __future__ import annotations

import hashlib
import json
import os
import time
from typing import Any, Dict, List

from dotenv import load_dotenv
from app.services.llm_client import get_groq_client

load_dotenv()

def _client():
    return get_groq_client()

_CACHE: Dict[str, Dict[str, Any]] = {}
_CACHE_TTL_S = 60 * 5


def _key(text: str, action: str) -> str:
    raw = f"{action}::{text}"
    return hashlib.sha256(raw.encode("utf-8", errors="ignore")).hexdigest()


def _cache_get(k: str):
    item = _CACHE.get(k)
    if not item:
        return None
    if (time.time() - item["ts"]) > _CACHE_TTL_S:
        _CACHE.pop(k, None)
        return None
    return item["value"]


def _cache_set(k: str, v: Any):
    _CACHE[k] = {"ts": time.time(), "value": v}


def companion_reply(text: str, user_action: str) -> Dict[str, object]:
    """
    Conversational companion response.

    Returns:
    {
      "message": "...",
      "suggestions": [...]
    }
    """
    t = (text or "").strip()
    action = (user_action or "").strip().lower()
    if not t:
        return {"message": "Paste some text and I’ll help you read it.", "suggestions": []}

    k = _key(t[:2000], action)
    cached = _cache_get(k)
    if cached is not None:
        return cached

    system_prompt = """
You are NeuroRead, a friendly reading companion for neurodiverse learners.
Be concise and actionable.

Return ONLY valid JSON:
{
  "message": "...",
  "suggestions": ["..."]
}
"""
    action_hint = {
        "confused": "User is confused. Offer 1-2 clarifying questions and a short explanation.",
        "simplify": "User wants simplification. Suggest using simplify/rewrite and point out 2 key ideas.",
        "explain": "User wants explanation. Explain the tricky part in plain language and offer follow-ups.",
    }.get(action, "Help the user read this text more easily.")

    user_payload = {"user_action": action, "hint": action_hint, "text": t}

    try:
        resp = _client().chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": json.dumps(user_payload)},
            ],
            temperature=0.4,
        )
        content = resp.choices[0].message.content or ""
        cleaned = content.strip()
        if cleaned.startswith("```"):
            cleaned = cleaned.split("\n", 1)[1]
            cleaned = cleaned.rsplit("```", 1)[0]
        data = json.loads(cleaned)
    except Exception as e:
        emsg = str(e).lower()
        if "restricted" in emsg or "400" in emsg:
            data = {"message": "The AI Companion's API key is currently restricted (Organization Restricted). Please check your Groq billing or usage limits in the .env file.", "suggestions": ["Check .env file", "Update API key"]}
        else:
            data = {}

    message = data.get("message") or "I can help. Try clicking a sentence to get an explanation, or switch to Focus mode."
    suggestions = data.get("suggestions") or []
    if not isinstance(suggestions, list):
        suggestions = [str(suggestions)]

    suggestions_list = []
    if isinstance(suggestions, list):
        suggestions_list = [str(s).strip() for s in suggestions if str(s).strip()]
    
    out = {
        "message": str(message),
        "suggestions": suggestions_list[:6],
    }
    _cache_set(k, out)
    return out

