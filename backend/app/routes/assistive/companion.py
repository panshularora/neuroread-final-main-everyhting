from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.services.assistive.companion_service import companion_reply

router = APIRouter()


class CompanionRequest(BaseModel):
    text: str = Field(..., min_length=1)
    user_action: str = Field(..., description="confused | simplify | explain")


@router.post(
    "/assistive/companion",
    summary="Reading companion: short guidance and suggestions.",
)
def assistive_companion(payload: CompanionRequest):
    text = payload.text.strip()
    if not text:
        raise HTTPException(status_code=400, detail="text is required")
    result = companion_reply(text, payload.user_action)
    print(f"[assistive/companion] action={payload.user_action}")
    return result

