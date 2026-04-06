import os
from functools import lru_cache
from dotenv import load_dotenv

from openai import OpenAI

load_dotenv()


@lru_cache(maxsize=1)
def get_groq_client() -> OpenAI:
    """
    Groq exposes an OpenAI-compatible API. This returns a configured OpenAI client with:
    - consistent timeouts
    - limited retries
    - a single shared instance per process
    """
    api_key = os.getenv("GROQ_API_KEY") or ""
    if not api_key.strip():
        # Raise a clear error so callers can fall back gracefully.
        raise RuntimeError("GROQ_API_KEY is not set.")

    return OpenAI(
        api_key=api_key,
        base_url="https://api.groq.com/openai/v1",
        timeout=15.0,
        max_retries=2,
    )

