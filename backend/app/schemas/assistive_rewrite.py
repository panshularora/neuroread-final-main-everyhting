from typing import List, Literal

from pydantic import BaseModel, Field


class RewriteRequest(BaseModel):
    text: str = Field(..., min_length=1)
    mode: Literal["simpler", "academic", "child_friendly"] = "simpler"


class SentenceRewrite(BaseModel):
    original: str
    rewritten: str
    explanation: str


class RewriteResponse(BaseModel):
    rewrites: List[SentenceRewrite]

