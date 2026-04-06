from fastapi import APIRouter
from pydantic import BaseModel

from app.services.simplifier import simplify_text
from app.services.cognitive_load import calculate_cognitive_load
from app.services.user_profile import update_user_profile
from app.services.accessibility import (
    apply_dyslexia_formatting,
    generate_audio_payload,
)
from app.services.assistive.keyword_extractor import extract_keywords
from app.services.assistive.tts_service import generate_speech_audio
from app.schemas.personalization import PersonalizationUpdateRequest, SessionMetrics
from app.services.personalization.profile_engine import (
    update_user_reading_profile,
)
from app.services.personalization.difficulty_predictor import predict_user_difficulty

router = APIRouter()


class SimplifyRequest(BaseModel):
    text: str
    level: int | None = None
    user_id: str | None = None
    profile: str | None = "default"
    enable_dyslexia_support: bool = True
    enable_audio: bool = True


@router.post("/simplify")
def simplify(request: SimplifyRequest):

    # 1️⃣ Analyze original
    original_analysis = calculate_cognitive_load(request.text)
    original_score = original_analysis["cognitive_load_score"]

    # 2️⃣ Auto level
    if request.level is None:
        if original_score < 30:
            level = 3
        elif original_score < 60:
            level = 2
        else:
            level = 1
    else:
        level = request.level

    # Profile override
    if request.profile == "focus":
        level = 1
    elif request.profile == "easy_read":
        level = 1
    elif request.profile == "academic":
        level = 3

    # Personalized difficulty recommendation (best-effort, no breaking changes)
    difficulty_prediction = None
    if request.user_id:
        try:
            difficulty_prediction = predict_user_difficulty(request.user_id)
            # If user is predicted beginner and the request didn't force a level,
            # bias toward stronger simplification.
            if request.level is None and difficulty_prediction.get("user_level") == "Beginner":
                level = 1
            elif request.level is None and difficulty_prediction.get("user_level") == "Advanced":
                level = max(level, 3)
        except Exception:
            difficulty_prediction = None

    # 3️⃣ Simplify
    simplified_output = simplify_text(request.text, level)

    if isinstance(simplified_output, dict):
        simplified_text = simplified_output.get("simplified_text", "")
    else:
        simplified_text = simplified_output

    # 4️⃣ Analyze simplified
    simplified_analysis = calculate_cognitive_load(simplified_text)
    simplified_score = simplified_analysis["cognitive_load_score"]

    reduction = original_score - simplified_score

    # 5️⃣ Overload detection
    overload_warning = None
    isolation_mode = False

    if original_score >= 70:
        overload_warning = "This text may cause cognitive overload."
        isolation_mode = True

    # 6️⃣ Dyslexia Formatting
    dyslexia_view = None
    if request.enable_dyslexia_support:
        dyslexia_view = apply_dyslexia_formatting(simplified_text)

    # 7️⃣ Adaptive Audio Mode
    audio_payload = None
    if request.enable_audio:
        audio_payload = generate_audio_payload(simplified_text)

    # 8️⃣ Save progress + adaptive profile update
    personalization_profile = None
    if request.user_id:
        update_user_profile(
            user_id=request.user_id,
            level=level,
            score=simplified_score,
        )

        # Best-effort personalization; never break the main response.
        try:
            difficult_words = simplified_analysis.get("difficult_words", []) or []
            reading_time = simplified_analysis.get(
                "estimated_reading_time_minutes", 0.0
            ) or 0.0
            metrics = SessionMetrics(
                cognitive_load=float(simplified_score),
                reading_time=float(reading_time) if reading_time > 0 else 0.1,
                difficult_words_count=int(len(difficult_words)),
            )
            personalization_request = PersonalizationUpdateRequest(
                user_id=request.user_id,
                session_metrics=metrics,
            )
            profile, summary, _ = update_user_reading_profile(
                personalization_request
            )
            personalization_profile = {
                "user_profile": profile.model_dump(),
                "adaptation_summary": summary,
            }
        except Exception:
            personalization_profile = None

    impact_percentage = 0
    if original_score > 0:
        impact_percentage = round((reduction / original_score) * 100, 1)



    # Generate TTS only when explicitly enabled (best-effort).
    # Note: the dedicated `/assistive/tts` endpoint is the preferred path for audio.
    audio_url = None
    if request.enable_audio:
        try:
            tts_result = generate_speech_audio(simplified_text, slow=False)
            audio_url = tts_result.audio_url
        except Exception:
            audio_url = None

    # Keywords for convenience (used by new assistive endpoints too)
    keywords = extract_keywords(request.text)

    return {
        "auto_selected_level": level,
        "profile_used": request.profile,
        "overload_warning": overload_warning,
        "isolation_mode": isolation_mode,
        "original_analysis": original_analysis,
        "simplified_text": simplified_text,
        "dyslexia_optimized_text": dyslexia_view,
        "audio_mode": audio_payload,
        "simplified_analysis": simplified_analysis,
        "cognitive_load_reduction": round(reduction, 2),
        "impact_summary": f"Cognitive load reduced by {round(reduction, 2)} points ({impact_percentage}% improvement)",
        "audio_file": audio_url,
        "keywords": keywords,
        "personalization": personalization_profile,
        "difficulty_prediction": difficulty_prediction,
    }


# New path (keeps legacy `/simplify` working too)
@router.post("/assistive/simplify")
def simplify_assistive(request: SimplifyRequest):
    return simplify(request)
