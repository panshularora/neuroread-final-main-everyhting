from fastapi import APIRouter
from pydantic import BaseModel
from app.services.cognitive_load import calculate_cognitive_load
from app.services.keyword_extractor import extract_keywords

router = APIRouter()

class AnalyzeRequest(BaseModel):
    text: str

@router.post("/analyze")
def analyze_text(request: AnalyzeRequest):
    load_result = calculate_cognitive_load(request.text)
    keywords = extract_keywords(request.text)

    return {
        **load_result,
        "key_concepts": keywords
    }