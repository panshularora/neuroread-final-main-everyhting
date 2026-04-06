from typing import List, Dict, Any

from pydantic import BaseModel


class DocumentMetrics(BaseModel):
    cognitive_load: float | None = None
    analysis: Dict[str, Any] | None = None


class DocumentResponse(BaseModel):
    original_text: str
    simplified_text: str
    metrics: DocumentMetrics
    keywords: List[str]

