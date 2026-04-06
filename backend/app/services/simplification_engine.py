def check_text_difficulty(text: str, user_ability: float = 0.0) -> dict:
    """
    IRT-based proactive difficulty detection.
    Runs BEFORE simplification to tell the user whether they need it.
    
    Maps cognitive_load score to IRT theta scale:
    difficulty = (flesch_kincaid_grade - 6) / 3.0
    (centers at 0 for grade 6, ±1 per 3 grade levels, clamped to [-3, 3])
    
    Returns whether the text exceeds the user's comfortable reading ability
    by more than 0.5 theta units — the ZPD upper boundary.
    """
    import textstat
    
    # Flesch-Kincaid grade level (0-18 scale)
    fk_grade = textstat.flesch_kincaid_grade(text)
    fk_grade = max(0, min(18, fk_grade))
    
    # Map to IRT theta (-3 to +3)
    irt_difficulty = (fk_grade - 6) / 3.0
    irt_difficulty = max(-3.0, min(3.0, irt_difficulty))
    
    # Sentence count and avg length for additional signals
    sentences = [s.strip() for s in text.split('.') if s.strip()]
    avg_sentence_length = sum(len(s.split()) for s in sentences) / max(len(sentences), 1)
    
    # ZPD boundary: text is "too hard" if difficulty > user_ability + 0.5
    should_simplify = irt_difficulty > (user_ability + 0.5)
    
    # Human-readable grade descriptor
    if fk_grade <= 3:
        grade_label = "Very easy"
    elif fk_grade <= 6:
        grade_label = "Easy"
    elif fk_grade <= 9:
        grade_label = "Moderate"
    elif fk_grade <= 12:
        grade_label = "Hard"
    else:
        grade_label = "Very hard"
    
    # Recommendation sentence
    if should_simplify:
        recommendation = (
            f"This text reads at a {grade_label.lower()} level "
            f"(grade {fk_grade:.0f}). Simplifying it is recommended."
        )
    else:
        recommendation = (
            f"This text reads at a {grade_label.lower()} level "
            f"(grade {fk_grade:.0f}). It should be comfortable to read."
        )
    
    return {
        "fk_grade": round(fk_grade, 1),
        "irt_difficulty": round(irt_difficulty, 2),
        "user_ability": round(user_ability, 2),
        "avg_sentence_length": round(avg_sentence_length, 1),
        "grade_label": grade_label,
        "should_simplify": should_simplify,
        "recommendation": recommendation,
        "sentence_count": len(sentences),
        "word_count": len(text.split()),
    }
