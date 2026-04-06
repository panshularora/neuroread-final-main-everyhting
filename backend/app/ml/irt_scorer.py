"""
Item Response Theory (IRT) Scorer
Reference: Lord (1952) "A theory of test scores"

1-Parameter Logistic (1PL) model also known as Rasch model.
"""
import math


class IRTScorer:
    """
    IRT-based ability estimation and exercise difficulty calibration.
    Uses the 1PL (Rasch) model: P(correct) = 1 / (1 + exp(-D*(theta - b)))
    where D is discrimination, theta is ability, b is difficulty.
    """

    def __init__(self):
        # Default discrimination parameter
        self.D = 1.0  # can be overridden per item

    def probability_correct(
        self,
        ability: float,
        difficulty: float,
        discrimination: float = 1.0,
    ) -> float:
        """
        1PL IRT probability of correct response.
        
        P(correct | ability, difficulty) = 1 / (1 + exp(-discrimination * (ability - difficulty)))
        
        Args:
            ability: Student ability theta (typically -3 to +3)
            difficulty: Item difficulty parameter b (typically -3 to +3)
            discrimination: Item discrimination parameter a (default 1.0 for Rasch)
        
        Returns:
            Probability of correct response [0, 1]
        """
        try:
            logit = discrimination * (ability - difficulty)
            # Clamp logit to avoid overflow
            logit = max(-10.0, min(10.0, logit))
            return 1.0 / (1.0 + math.exp(-logit))
        except (OverflowError, ValueError):
            return 0.5

    def update_ability(
        self,
        ability: float,
        correct: bool,
        difficulty: float,
        discrimination: float = 1.0,
        learning_rate: float = 0.1,
    ) -> float:
        """
        Simple gradient-based ability update.
        
        delta = correct - P(correct | ability, difficulty)
        ability_new = ability + learning_rate * delta
        
        Args:
            ability: Current ability estimate theta
            correct: Whether the student answered correctly
            difficulty: Item difficulty
            discrimination: Item discrimination
            learning_rate: Step size for ability update (default 0.1)
        
        Returns:
            Updated ability estimate
        """
        p_correct = self.probability_correct(ability, difficulty, discrimination)
        delta = (1.0 if correct else 0.0) - p_correct
        new_ability = ability + learning_rate * delta

        # Clamp to reasonable range
        return max(-3.0, min(3.0, new_ability))

    def ability_to_grade(self, ability: float) -> float:
        """Convert IRT ability theta to approximate grade level (0-12)."""
        # Map [-3, 3] -> [0, 12]
        return max(0.0, min(12.0, (ability + 3.0) * 2.0))

    def difficulty_0to1(self, difficulty_irt: float) -> float:
        """Convert IRT difficulty [-3,3] to [0,1] scale."""
        return max(0.0, min(1.0, (difficulty_irt + 3.0) / 6.0))

    def difficulty_from_0to1(self, difficulty_01: float) -> float:
        """Convert [0,1] difficulty to IRT difficulty [-3,3]."""
        return (difficulty_01 * 6.0) - 3.0
