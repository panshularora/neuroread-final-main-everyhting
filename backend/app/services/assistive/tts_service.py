from __future__ import annotations

import os
import uuid
from dataclasses import dataclass


@dataclass(frozen=True)
class TTSResult:
    audio_url: str
    filename: str


def generate_speech_audio(
    text: str,
    *,
    slow: bool = False,
    lang: str = "en",
    static_dir: str | None = None,
) -> TTSResult:
    """Generate an MP3 for `text` and return its static URL.

    Saves files under `<static_dir>/audio/` and returns a URL like `/static/audio/<file>.mp3`.
    """
    if not text or text.isspace():
        raise ValueError("Text is required for TTS.")

    if static_dir is None:
        # Resolve to backend/app/static regardless of current working directory.
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        static_dir = os.path.join(base_dir, "static")

    audio_dir = os.path.join(static_dir, "audio")
    os.makedirs(audio_dir, exist_ok=True)

    filename = f"{uuid.uuid4()}.mp3"
    filepath = os.path.join(audio_dir, filename)

    try:
        from gtts import gTTS  # type: ignore
    except Exception as e:  # pragma: no cover
        raise RuntimeError(
            "TTS dependency is missing. Install `gtts` in your backend environment."
        ) from e

    tts = gTTS(text=text, lang=lang, slow=slow)
    tts.save(filepath)

    return TTSResult(audio_url=f"/static/audio/{filename}", filename=filename)

