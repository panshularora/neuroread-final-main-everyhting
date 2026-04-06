"""
SM-2 Spaced Repetition Algorithm
Reference: Wozniak (1987) "Optimization of learning" — SuperMemo algorithm

SM-2 scheduling:
- Repetition 0: interval = 1 day
- Repetition 1: interval = 6 days  
- Repetition n: interval = interval_{n-1} * easiness_factor
- Easiness factor updated based on answer quality (0-5)
"""
from datetime import datetime, timedelta, timezone
from typing import Tuple


class SM2Scheduler:
    """
    SM-2 spaced repetition scheduler.
    
    Tracks review intervals and easiness factors for spaced repetition.
    Designed for dyslexia education: forgetting patterns are frequent,
    so default easiness allows shorter intervals.
    """

    MIN_EASINESS = 1.3
    DEFAULT_EASINESS = 2.5

    def __init__(self):
        pass

    def next_interval(
        self,
        repetition: int,
        easiness: float,
        correct: bool,
        quality: int = None,
    ) -> Tuple[int, float]:
        """
        Compute next review interval and updated easiness factor.
        
        Args:
            repetition: Number of successful repetitions so far (0-indexed)
            easiness: Current easiness factor (min 1.3, default 2.5)
            correct: Whether the answer was correct
            quality: Answer quality 0-5 (optional; if None, derived from correct)
        
        Returns:
            (interval_days, new_easiness_factor)
        """
        if quality is None:
            quality = 4 if correct else 1

        if not correct or quality < 3:
            # Reset on failure
            return (1, max(self.MIN_EASINESS, easiness - 0.2))

        # Update easiness factor: EF' = EF + (0.1 - (5-q)*(0.08 + (5-q)*0.02))
        easiness_delta = 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)
        new_easiness = max(self.MIN_EASINESS, easiness + easiness_delta)

        # Compute interval
        if repetition == 0:
            interval = 1
        elif repetition == 1:
            interval = 6
        else:
            # For higher repetitions, we need the previous interval
            # We'll use a conservative approximation: 6 * (easiness ^ (rep-1))
            # In practice, the caller should store the last interval
            interval = round(6 * (new_easiness ** (repetition - 1)))

        return (max(1, interval), new_easiness)

    def next_interval_with_last(
        self,
        repetition: int,
        easiness: float,
        last_interval: int,
        correct: bool,
        quality: int = None,
    ) -> Tuple[int, float]:
        """
        Compute next interval given the previous interval (more accurate).
        
        Args:
            repetition: Current repetition count
            easiness: Current easiness factor
            last_interval: Previous interval in days
            correct: Whether the answer was correct
            quality: Answer quality 0-5
        
        Returns:
            (interval_days, new_easiness_factor)
        """
        if quality is None:
            quality = 4 if correct else 1

        if not correct or quality < 3:
            return (1, max(self.MIN_EASINESS, easiness - 0.2))

        easiness_delta = 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)
        new_easiness = max(self.MIN_EASINESS, easiness + easiness_delta)

        if repetition == 0:
            interval = 1
        elif repetition == 1:
            interval = 6
        else:
            interval = round(last_interval * new_easiness)

        return (max(1, interval), new_easiness)

    def is_due(self, last_review: datetime, interval_days: int) -> bool:
        """
        Check if an item is due for review.
        
        Args:
            last_review: Datetime of last review
            interval_days: Scheduled interval in days
        
        Returns:
            True if the item is due (or overdue)
        """
        due_date = last_review + timedelta(days=interval_days)
        now_utc = datetime.now(timezone.utc).replace(tzinfo=None)
        due_date_naive = due_date.replace(tzinfo=None)
        return now_utc >= due_date_naive

    def days_until_due(self, last_review: datetime, interval_days: int) -> int:
        """Returns number of days until next review (negative if overdue)."""
        due_date = last_review + timedelta(days=interval_days)
        now_utc = datetime.now(timezone.utc).replace(tzinfo=None)
        due_date_naive = due_date.replace(tzinfo=None)
        delta = due_date_naive - now_utc
        return delta.days

    def due_description(self, days_until: int) -> str:
        """Human-readable description of when next review is due."""
        if days_until <= 0:
            return "Due now"
        elif days_until == 1:
            return "Tomorrow"
        elif days_until < 7:
            return f"In {days_until} days"
        elif days_until < 14:
            return "In about a week"
        elif days_until < 30:
            return f"In {days_until // 7} weeks"
        else:
            return f"In {days_until // 30} months"

