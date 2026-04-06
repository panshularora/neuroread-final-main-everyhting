"""Endpoint for checking answers and returning smart feedback."""
from typing import Dict, Any, Optional

from fastapi import APIRouter
from pydantic import BaseModel

from app.services.learning.feedback import generate_feedback

router = APIRouter(prefix="/learning", tags=["Learning"])


class AnswerRequest(BaseModel):
    gameType: str
    userAnswer: str
    correctAnswer: str
    gameContext: Optional[Dict[str, Any]] = None


@router.post("/check-answer")
def check_answer(req: AnswerRequest):
    """
    Checks the user's answer and provides structured educational feedback.
    """
    is_correct = req.userAnswer.lower().strip() == req.correctAnswer.lower().strip()
    
    feedback = generate_feedback(
        game_type=req.gameType,
        is_correct=is_correct,
        correct_answer=req.correctAnswer,
        user_answer=req.userAnswer,
        context=req.gameContext,
    )
    
    return {
        "status": "success",
        "is_correct": is_correct,
        "correct_answer": req.correctAnswer,
        "feedback": feedback["message"],
        "explanation": feedback["explanation"],
    }
