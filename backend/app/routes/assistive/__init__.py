from fastapi import APIRouter, Request, HTTPException

router = APIRouter()

@router.post("/difficulty-check")
async def difficulty_check(request: Request):
    """
    Proactive difficulty detection endpoint.
    Call this before /simplify to decide whether simplification is needed.
    """
    body = await request.json()
    text = body.get("text", "").strip()
    user_ability = float(body.get("user_ability", 0.0))
    
    if not text:
        raise HTTPException(status_code=400, detail="text field is required")
    if len(text) < 20:
        raise HTTPException(status_code=400, detail="text too short to analyze")
    
    from app.services.simplification_engine import check_text_difficulty
    result = check_text_difficulty(text, user_ability)
    return result
