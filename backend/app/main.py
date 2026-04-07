from pathlib import Path
import os

print("🚀 APP STARTING...")

# Load .env safely
from dotenv import load_dotenv
try:
    load_dotenv(Path(__file__).resolve().parent.parent / ".env")
    print("[env] Loaded .env")
except Exception as e:
    print(f"[env ERROR] {e}")

from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

# DB imports
try:
    from app.database import Base, engine
    from app.models.user import UserProfile
    from app.models.reading import ReadingSession, AnalyticsCache
    from app.services.learning.progress_tracker import LearningProgress
    print("[db] Imports successful")
except Exception as e:
    print(f"[db ERROR] {e}")

app = FastAPI(title="NeuroAdapt AI Engine")

# ------------------- Exception Handlers -------------------

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
    print(f"[unhandled ERROR] {exc}")
    return JSONResponse(
        status_code=500,
        content={
            "status": "error",
            "message": "Internal server error",
        },
    )

# ------------------- Middleware -------------------

@app.middleware("http")
async def log_requests(request, call_next):
    print(f"[api] {request.method} {request.url.path}")
    response = await call_next(request)
    print(f"[api] {request.method} {request.url.path} -> {response.status_code}")
    return response

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # for deployment (safe for now)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ------------------- Static -------------------

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
STATIC_DIR = os.path.join(BASE_DIR, "static")

try:
    os.makedirs(os.path.join(STATIC_DIR, "audio"), exist_ok=True)
    app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")
    print("[static] Mounted")
except Exception as e:
    print(f"[static ERROR] {e}")

# ------------------- Startup -------------------

@app.on_event("startup")
def create_tables():
    try:
        Base.metadata.create_all(bind=engine)
        print("[startup] DB initialized")
    except Exception as e:
        print(f"[startup ERROR] DB failed: {e}")

# ------------------- Basic Routes -------------------

@app.get("/")
def root():
    return {"message": "API working"}

@app.get("/health")
def health():
    return {"status": "ok", "version": "2.0"}

# ------------------- SAFE ROUTE LOADER -------------------

def safe_include(import_path, name, prefix=None):
    try:
        module = __import__(import_path, fromlist=["router"])
        if prefix:
            app.include_router(module.router, prefix=prefix)
        else:
            app.include_router(module.router)
        print(f"[route] Loaded: {name}")
    except Exception as e:
        print(f"[route ERROR] {name}: {e}")

# ------------------- ROUTES -------------------

safe_include("app.routes.analyze", "analyze")
safe_include("app.routes.progress", "progress")

# Assistive
safe_include("app.routes.assistive.assist", "assist")
safe_include("app.routes.assistive.vocab", "vocab")
safe_include("app.routes.assistive.tts", "tts")
safe_include("app.routes.assistive.simplify", "simplify")
safe_include("app.routes.assistive.rewrite", "rewrite")
safe_include("app.routes.assistive.vocab_card", "vocab_card")
safe_include("app.routes.assistive.document", "document")
safe_include("app.routes.assistive.tutor", "tutor")
safe_include("app.routes.assistive.heatmap", "heatmap")
safe_include("app.routes.assistive.concept_graph", "concept_graph")
safe_include("app.routes.assistive.chunk", "chunk")
safe_include("app.routes.assistive.companion", "companion")
safe_include("app.routes.assistive", "assistive_root", prefix="/assistive")

# Learning
safe_include("app.routes.learning.phonics", "phonics")
safe_include("app.routes.learning.exercises", "exercises")
safe_include("app.routes.learning.spelling", "spelling")
safe_include("app.routes.learning.comprehension", "comprehension")
safe_include("app.routes.learning.flashcards", "flashcards")
safe_include("app.routes.learning.sound_match", "sound_match")
safe_include("app.routes.learning.build_word", "build_word")
safe_include("app.routes.learning.rhyme", "rhyme")
safe_include("app.routes.learning.picture_match", "picture_match")
safe_include("app.routes.learning.lesson", "lesson")
safe_include("app.routes.learning.check_answer", "check_answer")
safe_include("app.routes.learning.learning_progress", "learning_progress")

# Personalization & Analytics
safe_include("app.routes.personalization", "personalization")
safe_include("app.routes.personalization_difficulty", "personalization_difficulty")
safe_include("app.routes.analytics", "analytics")

# Optional routes
safe_include("app.routes.learning.learning_api", "learning_api")
safe_include("app.routes.assistive.annotate", "annotate")