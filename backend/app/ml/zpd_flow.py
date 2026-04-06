"""
Zone of Proximal Development (ZPD) Flow Module
Reference: Vygotsky (1978) "Mind in Society: The Development of Higher Psychological Processes"

Classifies exercises into three zones relative to student ability and recommends
the optimal difficulty for maximum learning (just above current ability).
"""


class ZPDFlow:
    """
    ZPD-based exercise difficulty classifier and recommender.
    
    The ZPD is Vygotsky's concept of the "sweet spot" for learning:
    - Too easy: ability > difficulty + threshold (student is bored, no growth)
    - Too hard: difficulty > ability + threshold (student is frustrated)
    - ZPD: the band between too easy and too hard (optimal for learning)
    """

    ZPD_MARGIN = 0.3  # How many theta units define each zone boundary

    def classify(self, ability: float, difficulty: float) -> str:
        """
        Classify an exercise relative to student's ability.
        
        Args:
            ability: Student's IRT ability estimate (theta)
            difficulty: Exercise difficulty (theta)
        
        Returns:
            One of: "too_easy", "zone_of_proximal_development", "too_hard"
        """
        delta = ability - difficulty

        if delta > self.ZPD_MARGIN:
            return "too_easy"
        elif -delta > self.ZPD_MARGIN:  # difficulty > ability + margin
            return "too_hard"
        else:
            return "zone_of_proximal_development"

    def classify_label(self, ability: float, difficulty: float) -> str:
        """Human-readable ZPD zone label."""
        zone = self.classify(ability, difficulty)
        labels = {
            "too_easy": "Too Easy",
            "zone_of_proximal_development": "Just Right (ZPD)",
            "too_hard": "Too Hard",
        }
        return labels.get(zone, zone)

    def recommend_difficulty(self, ability: float) -> float:
        """
        Recommend a target difficulty slightly above the student's current ability.
        
        This places exercises in the ZPD: challenging enough to promote growth
        but not so hard as to cause frustration.
        
        Args:
            ability: Student's current IRT ability estimate
        
        Returns:
            Recommended difficulty (ability + 0.15, clamped to [-3, 3])
        """
        return max(-3.0, min(3.0, ability + 0.15))

    def recommend_difficulty_0to1(self, ability: float) -> float:
        """
        Returns recommended difficulty on [0, 1] scale.
        
        Converts IRT ability [-3, 3] to [0, 1] scale, adds ZPD offset.
        """
        # ability_01 = (ability + 3) / 6
        ability_01 = (ability + 3.0) / 6.0
        return max(0.0, min(1.0, ability_01 + 0.025))  # 0.025 = 0.15/6

    def is_in_zpd(self, ability: float, difficulty: float) -> bool:
        """Returns True if the exercise is in the ZPD."""
        return self.classify(ability, difficulty) == "zone_of_proximal_development"

    def zpd_score(self, ability: float, difficulty: float) -> float:
        """
        Returns a score [0, 1] for how well the difficulty matches the ZPD.
        1.0 = perfectly in ZPD, 0.0 = far outside ZPD.
        """
        delta = abs(ability - difficulty)
        if delta <= self.ZPD_MARGIN:
            return 1.0
        elif delta <= self.ZPD_MARGIN * 3:
            return max(0.0, 1.0 - (delta - self.ZPD_MARGIN) / (self.ZPD_MARGIN * 2))
        else:
            return 0.0
