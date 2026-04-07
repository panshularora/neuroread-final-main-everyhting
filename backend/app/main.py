from pathlib import Path

from dotenv import load_dotenv

# Load backend/.env regardless of current working directory
load_dotenv(Path(__file__).resolve().parent.parent / ".env")

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi import HTTPException
import os

from app.database import Base, engine
from app.models.user import UserProfile
from app.models.reading import ReadingSession, AnalyticsCache
from app.services.learning.progress_tracker import LearningProgress  # auto-create table

app = FastAPI(title="NeuroAdapt AI Engine")

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=422,
        content={
            "status": "error",
            "message": "Validation failed",
            "detail": exc.errors(),
        },
    )


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "status": "error",
            "message": str(exc.detail),
        },
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    # Avoid leaking stack traces to clients.
    return JSONResponse(
        status_code=500,
        content={
            "status": "error",
            "message": "Internal server error",
        },
    )

@app.middleware("http")
async def log_requests(request, call_next):
    # Temporary debug log for request/response flow
    print(f"[api] {request.method} {request.url.path}")
    response = await call_next(request)
    print(f"[api] {request.method} {request.url.path} -> {response.status_code}")
    return response

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:5174",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
    ],
    allow_origin_regex=r"^http://(localhost|127\.0\.0\.1|(\d{1,3}\.){3}\d{1,3})(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure static/audio folder exists (use absolute path so cwd doesn't matter)
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
STATIC_DIR = os.path.join(BASE_DIR, "static")
os.makedirs(os.path.join(STATIC_DIR, "audio"), exist_ok=True)

# Mount static folder
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

# Create DB tables
@app.on_event("startup")
def create_tables():
    Base.metadata.create_all(bind=engine)


@app.get("/")
def root():
    return {"message": "API working"}


@app.get("/health")
def health():
    return {"status": "ok", "version": "2.0"}


# Routes
# NOTE: The Assistive routers already expose legacy compatibility paths (e.g. `/simplify`)
# so we avoid including legacy shim routers here to prevent duplicate route registration.
from app.routes.analyze import router as analyze_router
app.include_router(analyze_router)

from app.routes.progress import router as progress_router
app.include_router(progress_router)

# Grouped routes (Assistive + Learning)
from app.routes.assistive.assist import router as assist_router
app.include_router(assist_router)

from app.routes.assistive.vocab import router as assistive_vocab_router
app.include_router(assistive_vocab_router)

from app.routes.assistive.tts import router as assistive_tts_router
app.include_router(assistive_tts_router)

from app.routes.assistive.simplify import router as assistive_simplify_router
app.include_router(assistive_simplify_router)

from app.routes.assistive.rewrite import router as assistive_rewrite_router
app.include_router(assistive_rewrite_router)

from app.routes.assistive.vocab_card import router as assistive_vocab_card_router
app.include_router(assistive_vocab_card_router)

from app.routes.assistive.document import router as assistive_document_router
app.include_router(assistive_document_router)

from app.routes.assistive.tutor import router as assistive_tutor_router
app.include_router(assistive_tutor_router)

from app.routes.assistive.heatmap import router as assistive_heatmap_router
app.include_router(assistive_heatmap_router)

from app.routes.assistive.concept_graph import router as assistive_concept_graph_router
app.include_router(assistive_concept_graph_router)

from app.routes.assistive.chunk import router as assistive_chunk_router
app.include_router(assistive_chunk_router)

from app.routes.assistive.companion import router as assistive_companion_router
app.include_router(assistive_companion_router)

from app.routes.learning.phonics import router as learning_phonics_router
app.include_router(learning_phonics_router)

from app.routes.learning.exercises import router as learning_exercises_router
app.include_router(learning_exercises_router)

from app.routes.learning.spelling import router as learning_spelling_router
app.include_router(learning_spelling_router)

from app.routes.learning.comprehension import router as learning_comprehension_router
app.include_router(learning_comprehension_router)

# New dyslexia-focused learning routes
from app.routes.learning.flashcards import router as learning_flashcards_router
app.include_router(learning_flashcards_router)

from app.routes.learning.sound_match import router as learning_sound_match_router
app.include_router(learning_sound_match_router)

from app.routes.learning.build_word import router as learning_build_word_router
app.include_router(learning_build_word_router)

from app.routes.learning.rhyme import router as learning_rhyme_router
app.include_router(learning_rhyme_router)

from app.routes.learning.picture_match import router as learning_picture_match_router
app.include_router(learning_picture_match_router)

from app.routes.learning.lesson import router as learning_lesson_router
app.include_router(learning_lesson_router)

from app.routes.learning.check_answer import router as learning_check_answer_router
app.include_router(learning_check_answer_router)

from app.routes.learning.learning_progress import router as learning_progress_router
app.include_router(learning_progress_router)

from app.routes.personalization import router as personalization_router
app.include_router(personalization_router)

from app.routes.personalization_difficulty import router as personalization_difficulty_router
app.include_router(personalization_difficulty_router)

from app.routes.analytics import router as analytics_router
app.include_router(analytics_router)

from app.routes.assistive import router as assistive_router
app.include_router(assistive_router, prefix="/assistive")

# ── New ML-wired learning endpoints ──────────────────────────────────────────
try:
    from app.routes.learning.learning_api import router as learning_api_router
    app.include_router(learning_api_router)
except Exception as e:
    print(f"[main] WARNING: learning_api failed to load: {e}")

# ── Phoneme annotation endpoint ───────────────────────────────────────────────
try:
    from app.routes.assistive.annotate import router as annotate_router
    app.include_router(annotate_router)
except Exception as e:
    print(f"[main] WARNING: annotate route failed to load: {e}")