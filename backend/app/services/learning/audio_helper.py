"""Shared audio helper for generating TTS files for words.

Provides a fast way to ensure a word has a generated TTS audio file
and returns its static path.
"""
from __future__ import annotations

import os
from typing import Dict
from app.services.assistive.tts_service import generate_speech_audio

import hashlib

# Cache mapping word to audio URL to avoid repeated generation during games
_AUDIO_CACHE: Dict[str, str] = {}


def get_audio_url(word: str, slow: bool = False) -> str | None:
    """Get or generate the audio URL for a given word."""
    if not word or not str(word).strip():
        return None

    word_clean = str(word).strip().lower()
    suffix = "_slow" if slow else ""
    cache_key = f"{word_clean}{suffix}"
    
    # Use memory cache if available
    if cache_key in _AUDIO_CACHE:
        return _AUDIO_CACHE[cache_key]
        
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    audio_dir = os.path.join(base_dir, "static", "audio")
    os.makedirs(audio_dir, exist_ok=True)
    
    # Pre-calculate predictable filename
    safe_name = "".join(c for c in cache_key if c.isalnum() or c in ('_', '-'))
    hash_suffix = hashlib.md5(word_clean.encode()).hexdigest()[:6]
    filename = f"{safe_name}_{hash_suffix}.mp3"
    filepath = os.path.join(audio_dir, filename)
    audio_url = f"/static/audio/{filename}"

    # Use disk cache if available
    if os.path.exists(filepath):
        _AUDIO_CACHE[cache_key] = audio_url
        return audio_url

    try:
        from gtts import gTTS
        tts = gTTS(text=word_clean, lang="en", slow=slow)
        tts.save(filepath)
        _AUDIO_CACHE[cache_key] = audio_url
        return audio_url
    except Exception as e:
        print(f"Warning: Failed to generate audio for '{word_clean}': {e}")
        return None


def preload_audio(words: list[str]) -> None:
    """Preload audio for a list of words."""
    for word in words:
        get_audio_url(word)
