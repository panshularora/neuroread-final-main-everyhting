from typing import List, Literal

from pydantic import BaseModel, Field


class TutorRequest(BaseModel):
    text: str = Field(..., min_length=1)
    question: str = Field(..., min_length=1)
    mode: Literal["explain", "summarize", "example"] = "explain"


class TutorResponse(BaseModel):
    answer: str
    suggested_questions: List[str]
    confidence_score: float

