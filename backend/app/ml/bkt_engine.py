"""
Bayesian Knowledge Tracing (BKT) Engine
Reference: Corbett & Anderson (1994) "Knowledge tracing: Modeling the acquisition of procedural knowledge"
"""

class BKTEngine:
    """
    Standard BKT model with four parameters:
    - p_init: Initial probability of knowing a skill
    - p_transit: Probability of learning (transitioning from not-knowing to knowing)
    - p_slip: Probability of making an error despite knowing
    - p_guess: Probability of correct answer despite not knowing
    """

    def __init__(
        self,
        p_init: float = 0.1,
        p_transit: float = 0.09,
        p_slip: float = 0.10,
        p_guess: float = 0.25,
    ):
        self.p_init = p_init
        self.p_transit = p_transit
        self.p_slip = p_slip
        self.p_guess = p_guess

    def update(self, p_know: float, correct: bool) -> float:
        """
        Standard BKT update formula.
        
        Step 1: Compute posterior P(know | observation)
            P(correct | know) = 1 - p_slip
            P(correct | !know) = p_guess
            
        Step 2: Apply learning (transition)
            p_know_new = p_know_given_obs + (1 - p_know_given_obs) * p_transit
        
        Returns updated P(know).
        """
        if correct:
            p_obs_know = 1.0 - self.p_slip       # P(correct | know)
            p_obs_notknow = self.p_guess           # P(correct | !know)
        else:
            p_obs_know = self.p_slip               # P(wrong | know)
            p_obs_notknow = 1.0 - self.p_guess     # P(wrong | !know)

        # P(correct) = P(correct|know)*P(know) + P(correct|!know)*P(!know)
        p_obs = p_obs_know * p_know + p_obs_notknow * (1.0 - p_know)

        # Avoid division by zero
        if p_obs < 1e-9:
            p_know_given_obs = p_know
        else:
            # Bayes: P(know | obs) = P(obs | know) * P(know) / P(obs)
            p_know_given_obs = (p_obs_know * p_know) / p_obs

        # Apply learning transition
        p_know_new = p_know_given_obs + (1.0 - p_know_given_obs) * self.p_transit

        # Clamp to [0, 1]
        return max(0.0, min(1.0, p_know_new))

    def get_mastery(self, p_know: float) -> bool:
        """Returns True if P(know) >= 0.85 (mastery threshold)."""
        return p_know >= 0.85

    def p_correct(self, p_know: float) -> float:
        """Probability of answering correctly given current P(know)."""
        return p_know * (1.0 - self.p_slip) + (1.0 - p_know) * self.p_guess
