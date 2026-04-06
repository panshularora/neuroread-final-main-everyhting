from fastapi import APIRouter, HTTPException

from app.schemas.assistive_rewrite import RewriteRequest, RewriteResponse
from app.services.assistive.rewrite_service import generate_rewrites

router = APIRouter()


@router.post(
    "/assistive/rewrite",
    response_model=RewriteResponse,
    summary="Generate per‑sentence rewrite suggestions.",
)
def assistive_rewrite(payload: RewriteRequest) -> RewriteResponse:
    """
    Generate sentence‑level rewrite suggestions for a given text.

    **Example request**

    ```json
    {
      "text": "Neurodiverse learners may face challenges when reading dense academic texts.",
      "mode": "simpler"
    }
    ```

    **Example response**

    ```json
    {
      "rewrites": [
        {
          "original": "Neurodiverse learners may face challenges when reading dense academic texts.",
          "rewritten": "Students who think and learn differently can struggle when reading long and complex school articles.",
          "explanation": "Shortens phrases, replaces jargon, and adds clearer wording."
        }
      ]
    }
    ```
    """
    text = payload.text.strip()
    if not text:
        raise HTTPException(status_code=400, detail="text is required")

    rewrites = generate_rewrites(text, payload.mode)
    return RewriteResponse(rewrites=rewrites)

