from fastapi import APIRouter
from pydantic import BaseModel

# reuse existing working function
from app.services.cognitive_load import calculate_cognitive_load

router = APIRouter()

class SimplifyRequest(BaseModel):
    text: str


@router.post("/simplify")
def simplify_text(req: SimplifyRequest):
    try:
        # reuse working logic
        result = calculate_cognitive_load(req.text)

        return {
            "status": "success",
            "original_text": req.text,
            "simplified_text": req.text,  # placeholder for now
            "analysis": result
        }

    except Exception as e:
        print("[SIMPLIFY ERROR]", e)
        return {
            "status": "error",
            "message": str(e)
        }
