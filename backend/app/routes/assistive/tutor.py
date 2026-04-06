from fastapi import APIRouter, HTTPException

from app.schemas.tutor import TutorRequest, TutorResponse
from app.services.assistive.tutor_service import run_tutor

router = APIRouter()


@router.post(
    "/assistive/tutor",
    response_model=TutorResponse,
    summary="AI reading tutor in conversational mode.",
)
def assistive_tutor(payload: TutorRequest) -> TutorResponse:
    """
    Ask an AI reading tutor a question about a text.

    **Example request**

    ```json
    {
      "text": "Photosynthesis is the process by which plants make their own food...",
      "question": "How do plants use sunlight?",
      "mode": "explain"
    }
    ```

    **Example response**

    ```json
    {
      "answer": "Plants use sunlight to power a chemical reaction ...",
      "suggested_questions": [
        "Why is photosynthesis important for humans?",
        "What would happen if plants could not get sunlight?"
      ],
      "confidence_score": 0.87
    }
    ```
    """
    text = payload.text.strip()
    question = payload.question.strip()
    if not text or not question:
        raise HTTPException(
            status_code=400, detail="Both text and question are required."
        )

    answer, suggested_questions, confidence = run_tutor(
        text, question, payload.mode
    )
    return TutorResponse(
        answer=answer,
        suggested_questions=suggested_questions,
        confidence_score=confidence,
    )

