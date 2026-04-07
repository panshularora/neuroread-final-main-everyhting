from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.services.assistive.simplifier import simplify_text
from app.services.cognitive_load import calculate_cognitive_load

router = APIRouter()

class SimplifyRequest(BaseModel):
    text: str
    level: int | None = None

@router.post("/simplify")
def simplify(req: SimplifyRequest):
    if not req.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")
        
    try:
        # 1. Analyze original
        original_analysis = calculate_cognitive_load(req.text)
        original_score = original_analysis.get("cognitive_load_score", 0)
        
        # 2. Decide level if not provided
        level = req.level
        if level is None:
            if original_score < 30: level = 3
            elif original_score < 60: level = 2
            else: level = 1
            
        # 3. Simplify using the real LLM service (with fallback)
        simplified_result = simplify_text(req.text, level)
        simplified_text = simplified_result.get("simplified_text", req.text)
        
        # 4. Analyze simplified
        simplified_analysis = calculate_cognitive_load(simplified_text)
        simplified_score = simplified_analysis.get("cognitive_load_score", original_score)
        
        reduction = original_score - simplified_score
        
        return {
            "status": "success",
            "auto_selected_level": level,
            "original_analysis": original_analysis,
            "simplified_text": simplified_text,
            "simplified_analysis": simplified_analysis,
            "cognitive_load_reduction": round(reduction, 2),
            "impact_summary": f"Reduced load by {round(reduction, 2)} points",
            "details": simplified_result # Includes bullets, definitions, etc.
        }
    except Exception as e:
        print(f"[SIMPLIFY ERROR] {e}")
        return {
            "status": "error",
            "message": str(e)
        }
