from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.services.knowledge.concept_graph import build_concept_graph

router = APIRouter()


class ConceptGraphRequest(BaseModel):
    text: str = Field(..., min_length=1)


@router.post(
    "/assistive/concept-graph",
    summary="Generate a concept graph (nodes/edges) for the given text.",
)
def assistive_concept_graph(payload: ConceptGraphRequest):
    text = payload.text.strip()
    if not text:
        raise HTTPException(status_code=400, detail="text is required")

    result = build_concept_graph(text)
    print(
        f"[assistive/concept-graph] nodes={len(result.get('nodes', []))} edges={len(result.get('edges', []))}"
    )
    return result

