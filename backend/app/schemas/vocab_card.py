from typing import List

from pydantic import BaseModel, Field


class VocabCardRequest(BaseModel):
    word: str = Field(..., min_length=1)


class VocabCardResponse(BaseModel):
    word: str
    definition: str
    simple_definition: str
    example_sentence: str
    synonyms: List[str]
    difficulty_score: float

