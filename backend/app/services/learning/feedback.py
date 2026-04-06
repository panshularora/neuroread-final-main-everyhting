"""Shared smart feedback generator for learning games.

Provides structured, educational feedback explaining why an answer is right or wrong.
"""
from __future__ import annotations

import random
from typing import Dict, Any

from app.services.learning.phonics_engine import _LETTER_TO_SOUND

def generate_feedback(game_type: str, is_correct: bool, correct_answer: str, user_answer: str = "", context: Dict[str, Any] = None) -> Dict[str, str]:
    """Generate smart feedback for a game answer."""
    context = context or {}
    
    if is_correct:
        encouragements = [
            "Great job! 🎉",
            "You got it right! ⭐",
            "Awesome work! 🏆",
            "Perfect! 🚀",
            "Super reading! 📚"
        ]
        base_fb = random.choice(encouragements)
        explanation = ""
        
        if game_type == "sound_match":
            target_sound = context.get("sound", "")
            explanation = f"Yes! '{correct_answer}' starts with the /{target_sound}/ sound."
        elif game_type == "word_builder":
            explanation = f"You built '{correct_answer}' correctly!"
        elif game_type == "rhyme":
            explanation = f"Yes! '{correct_answer}' rhymes with '{context.get('word', '')}'."
        elif game_type == "picture_match":
            explanation = f"That's exactly right, that picture is a {correct_answer}."
            
        return {
            "message": base_fb,
            "explanation": explanation
        }

    # Wrong answer feedback
    oops = [
        "Almost! Let's try again 👇",
        "Not quite, but you're close! 🤔",
        "Let's look closer! 🔍",
        "Good try! Let's check the hint. 💡"
    ]
    base_fb = random.choice(oops)
    explanation = ""

    if game_type == "sound_match":
        target_sound = context.get("sound", "")
        # If the user answer starts with a different sound, point it out
        if user_answer:
            user_first_sound = _LETTER_TO_SOUND.get(user_answer[0].lower(), user_answer[0].lower())
            explanation = f"'{user_answer}' starts with the /{user_first_sound}/ sound. We need a word that starts with /{target_sound}/."
        else:
             explanation = f"We are looking for a word that starts with the /{target_sound}/ sound like in '{correct_answer}'."

    elif game_type == "word_builder":
        target_word = correct_answer
        explanation = f"The correct order is {'-'.join(list(target_word))}. It starts with the /{target_word[0].lower()}/ sound."
        
    elif game_type == "rhyme":
        target_word = context.get("word", "")
        explanation = f"'{correct_answer}' and '{target_word}' rhyme because they end with '{context.get('rhymeFamily', '')}'"

    elif game_type == "picture_match":
        explanation = f"Oops! That picture is a {user_answer}. We're looking for the {correct_answer}."
        
    else:
         explanation = f"The right answer was '{correct_answer}'."

    return {
        "message": base_fb,
        "explanation": explanation
    }
