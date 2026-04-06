import re


# 🔹 Dyslexia Formatting
def apply_dyslexia_formatting(text: str):

    # Add spacing between words (letter spacing hint)
    spaced_text = " ".join([word for word in text.split()])

    # Sentence chunking (line break after each sentence)
    chunked_text = re.sub(r'([.!?])\s+', r'\1\n\n', spaced_text)

    return {
        "chunked_version": chunked_text,
        "recommended_font": "OpenDyslexic",
        "line_spacing": 1.6,
        "letter_spacing": 0.12,
        "background_color": "#FDF6E3"
    }


# 🔹 Adaptive Audio Payload (Frontend can use TTS)
def generate_audio_payload(text: str):

    words = len(text.split())

    # Slow reading speed if text still moderately complex
    if words > 20:
        speed = 0.85
    else:
        speed = 1.0

    return {
        "text_for_audio": text,
        "recommended_voice": "neutral_female",
        "speech_rate": speed,
        "pause_between_sentences_ms": 400
    }