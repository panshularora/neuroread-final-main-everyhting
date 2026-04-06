from fastapi import APIRouter, HTTPException

from app.schemas.vocab_card import VocabCardRequest, VocabCardResponse
from app.services.assistive.vocab_card_service import build_vocab_card

router = APIRouter()


@router.post(
    "/assistive/vocab-card",
    response_model=VocabCardResponse,
    summary="Generate a visual vocabulary card for a word.",
)
def vocab_card(payload: VocabCardRequest) -> VocabCardResponse:
    """
    Build a rich vocabulary card for a single word.

    **Example request**

    ```json
    { "word": "resilient" }
    ```

    **Example response**

    ```json
    {
      "word": "resilient",
      "definition": "Able to withstand or recover quickly from difficult conditions.",
      "simple_definition": "Able to bounce back after hard times.",
      "example_sentence": "The resilient student kept trying, even when the work was hard.",
      "synonyms": ["strong", "tough"],
      "difficulty_score": 42.0
    }
    ```
    """
    word = payload.word.strip()
    if not word:
        raise HTTPException(status_code=400, detail="word is required")

    definition, simple_definition, example_sentence, synonyms, difficulty_score = (
        build_vocab_card(word)
    )
    return VocabCardResponse(
        word=word,
        definition=definition,
        simple_definition=simple_definition,
        example_sentence=example_sentence,
        synonyms=synonyms,
        difficulty_score=difficulty_score,
    )

