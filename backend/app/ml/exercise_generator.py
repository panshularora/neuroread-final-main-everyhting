"""
Exercise Generator for NeuroRead adaptive learning.
Generates exercises based on skill, difficulty, and student age.
"""
import uuid
import random
from typing import Dict, List, Any


# ── Exercise type definitions ────────────────────────────────────────────────

EXERCISE_POOL: Dict[str, List[Dict[str, Any]]] = {

    # b/d confusion — phonics/visual discrimination
    "bd_confusion": [
        # Easy
        {
            "difficulty": 0.2,
            "type": "phonics",
            "prompt": "Which letter makes the sound at the START of 'ball'?",
            "options": ["b", "d", "p", "q"],
            "correct_answer": "b",
            "target_skill": "bd_confusion",
            "hint": "The letter 'b' has its tummy sticking to the RIGHT. Think of a bat then ball: b→at and b→all.",
        },
        {
            "difficulty": 0.25,
            "type": "phonics",
            "prompt": "Which letter comes at the START of 'dog'?",
            "options": ["b", "d", "p", "q"],
            "correct_answer": "d",
            "target_skill": "bd_confusion",
            "hint": "The letter 'd' has its tummy sticking to the LEFT. Think of a door: d→oor.",
        },
        # Medium
        {
            "difficulty": 0.45,
            "type": "phonics",
            "prompt": "Which word is spelled correctly?",
            "options": ["ded", "bed", "deb", "beb"],
            "correct_answer": "bed",
            "target_skill": "bd_confusion",
            "hint": "Remember: 'b' comes first in the alphabet. In 'bed', b comes first, then e, then d.",
        },
        {
            "difficulty": 0.50,
            "type": "matching",
            "prompt": "Match each letter to its sound: Select the letter that starts 'book'",
            "options": ["b", "d", "p", "q"],
            "correct_answer": "b",
            "target_skill": "bd_confusion",
            "hint": "Put your finger on 'b': the stick goes UP first, then the circle is on the RIGHT.",
        },
        # Hard
        {
            "difficulty": 0.75,
            "type": "spelling",
            "prompt": "Type the word you hear: 'bed'",
            "options": [],
            "correct_answer": "bed",
            "target_skill": "bd_confusion",
            "hint": "b·e·d — the first letter has the circle on the RIGHT side.",
        },
        {
            "difficulty": 0.8,
            "type": "spelling",
            "prompt": "Spell the word you hear: 'bad'",
            "options": [],
            "correct_answer": "bad",
            "target_skill": "bd_confusion",
            "hint": "b·a·d — starts with b (circle on right), ends with d (circle on left).",
        },
    ],

    # p/q confusion
    "pq_confusion": [
        {
            "difficulty": 0.2,
            "type": "phonics",
            "prompt": "Which letter makes the sound at the START of 'pig'?",
            "options": ["p", "q", "b", "d"],
            "correct_answer": "p",
            "target_skill": "pq_confusion",
            "hint": "The letter 'p' has its tail hanging DOWN and circle on the RIGHT: p·ig.",
        },
        {
            "difficulty": 0.45,
            "type": "phonics",
            "prompt": "Which word is spelled correctly?",
            "options": ["qen", "pen", "pem", "qem"],
            "correct_answer": "pen",
            "target_skill": "pq_confusion",
            "hint": "p·e·n — starts with 'p', which has the circle above the line.",
        },
        {
            "difficulty": 0.7,
            "type": "spelling",
            "prompt": "Spell the word: 'pup'",
            "options": [],
            "correct_answer": "pup",
            "target_skill": "pq_confusion",
            "hint": "p·u·p — both p's have circles above the baseline.",
        },
    ],

    # Phonics — initial sounds
    "phonics_initial": [
        {
            "difficulty": 0.15,
            "type": "phonics",
            "prompt": "What sound does 'cat' start with?",
            "options": ["c", "k", "g", "s"],
            "correct_answer": "c",
            "target_skill": "phonics_initial",
            "hint": "Listen for the hard 'kuh' sound at the start.",
        },
        {
            "difficulty": 0.2,
            "type": "phonics",
            "prompt": "What sound does 'fish' start with?",
            "options": ["f", "v", "th", "ph"],
            "correct_answer": "f",
            "target_skill": "phonics_initial",
            "hint": "Your top teeth touch your bottom lip for the 'f' sound.",
        },
        {
            "difficulty": 0.35,
            "type": "phonics",
            "prompt": "Which word starts with the 'sh' sound?",
            "options": ["shop", "chop", "stop", "top"],
            "correct_answer": "shop",
            "target_skill": "phonics_initial",
            "hint": "Put a finger to your lips: 'sh' is a shushing sound.",
        },
        {
            "difficulty": 0.55,
            "type": "phonics",
            "prompt": "Which pair of words start with the SAME sound?",
            "options": ["phone and fine", "chin and kind", "that and tan", "when and hen"],
            "correct_answer": "phone and fine",
            "target_skill": "phonics_initial",
            "hint": "ph makes the /f/ sound, same as fine.",
        },
    ],

    # Phonics — final sounds
    "phonics_final": [
        {
            "difficulty": 0.2,
            "type": "phonics",
            "prompt": "What sound does 'dog' end with?",
            "options": ["g", "k", "n", "m"],
            "correct_answer": "g",
            "target_skill": "phonics_final",
            "hint": "Dogs go 'woof' — the 'g' sound is at the back of your throat.",
        },
        {
            "difficulty": 0.4,
            "type": "phonics",
            "prompt": "Which word ends with the same sound as 'cake'?",
            "options": ["lake", "can", "car", "cap"],
            "correct_answer": "lake",
            "target_skill": "phonics_final",
            "hint": "Both 'cake' and 'lake' end with the /k/ sound.",
        },
    ],

    # Spelling — CVC (Consonant-Vowel-Consonant)
    "spelling_cvc": [
        {
            "difficulty": 0.2,
            "type": "spelling",
            "prompt": "Spell the word that means a small pet that meows: _at",
            "options": ["c", "b", "h", "s"],
            "correct_answer": "cat",
            "target_skill": "spelling_cvc",
            "hint": "c·a·t — just 3 letters!",
        },
        {
            "difficulty": 0.25,
            "type": "phonics",
            "prompt": "Which of these is a real word?",
            "options": ["mig", "big", "sig", "wig"],
            "correct_answer": "big",
            "target_skill": "spelling_cvc",
            "hint": "'big' means large. Think of a big elephant!",
        },
        {
            "difficulty": 0.35,
            "type": "spelling",
            "prompt": "Spell the word: a place you sit (3 letters)",
            "options": [],
            "correct_answer": "sit",
            "target_skill": "spelling_cvc",
            "hint": "s·i·t",
        },
    ],

    # Spelling — CCVC/CVCC more complex
    "spelling_ccvc": [
        {
            "difficulty": 0.5,
            "type": "spelling",
            "prompt": "Spell the word: something you do to jump over water",
            "options": [],
            "correct_answer": "swim",
            "target_skill": "spelling_ccvc",
            "hint": "s·w·i·m — four letters, starts with two consonants",
        },
        {
            "difficulty": 0.55,
            "type": "phonics",
            "prompt": "Which word has the 'bl' blend?",
            "options": ["black", "back", "lack", "rack"],
            "correct_answer": "black",
            "target_skill": "spelling_ccvc",
            "hint": "A 'blend' means two consonant sounds together: bl·ack",
        },
        {
            "difficulty": 0.65,
            "type": "spelling",
            "prompt": "Spell: 'frog'",
            "options": [],
            "correct_answer": "frog",
            "target_skill": "spelling_ccvc",
            "hint": "f·r·o·g — starts with the 'fr' blend",
        },
    ],

    # Comprehension — short passage
    "comprehension_short": [
        {
            "difficulty": 0.3,
            "type": "comprehension",
            "prompt": "Sam had a red ball. He kicked the ball into the garden. The ball hit a flower pot. The pot fell over.\n\nWhat did Sam kick?",
            "options": ["A flower", "A red ball", "A pot", "A garden"],
            "correct_answer": "A red ball",
            "target_skill": "comprehension_short",
            "hint": "Re-read the first sentence.",
        },
        {
            "difficulty": 0.4,
            "type": "comprehension",
            "prompt": "Ella loved to read books. Every night she read for one hour before bed. Her favourite book was about a brave dragon.\n\nHow long did Ella read each night?",
            "options": ["30 minutes", "2 hours", "One hour", "All day"],
            "correct_answer": "One hour",
            "target_skill": "comprehension_short",
            "hint": "Look for how long she read — it's in the second sentence.",
        },
    ],

    # Comprehension — longer passage
    "comprehension_long": [
        {
            "difficulty": 0.65,
            "type": "comprehension",
            "prompt": "The Arctic fox changes its coat with the seasons. In winter, its fur is white to blend in with the snow. In summer, the fur turns brown or grey to match the rocks and plants. This helps it hide from predators.\n\nWhy does the Arctic fox change colour?",
            "options": [
                "To stay warm in cold weather",
                "To hide from predators",
                "Because it gets dirty",
                "Because it grows older",
            ],
            "correct_answer": "To hide from predators",
            "target_skill": "comprehension_long",
            "hint": "The last sentence tells you why.",
        },
        {
            "difficulty": 0.75,
            "type": "comprehension",
            "prompt": "In ancient Egypt, cats were considered sacred animals. They were worshipped as gods and kept in temples. Hurting a cat — even by accident — was considered a serious crime that could be punished by law.\n\nWhat does 'sacred' most likely mean?",
            "options": ["Dangerous", "Ordinary", "Holy or very special", "Very expensive"],
            "correct_answer": "Holy or very special",
            "target_skill": "comprehension_long",
            "hint": "Think about how cats were treated — worshipped, kept in temples.",
        },
    ],
}


PRACTICE_GAMES_POOL = {
    "dictation": [
        {"id": "d1", "word": "laugh"}, {"id": "d2", "word": "friend"}, {"id": "d3", "word": "because"}, {"id": "d4", "word": "beautiful"},
        {"id": "d5", "word": "ocean"}, {"id": "d6", "word": "enough"}, {"id": "d7", "word": "though"}, {"id": "d8", "word": "caught"},
        {"id": "d9", "word": "island"}, {"id": "d10", "word": "rhythm"}, {"id": "d11", "word": "mountain"}, {"id": "d12", "word": "journey"}
    ],
    "error_correction": [
        {"id": "ec1", "sentence": "I went to the ____.", "incorrect": "stor", "options": ["store", "stoor", "stour"], "answer": "store"},
        {"id": "ec2", "sentence": "She has ____ apples.", "incorrect": "tooo", "options": ["two", "to", "too"], "answer": "two"},
        {"id": "ec3", "sentence": "I ____ you were coming.", "incorrect": "new", "options": ["knew", "new", "knwe"], "answer": "knew"},
        {"id": "ec4", "sentence": "The dog wagged its ____.", "incorrect": "tale", "options": ["tail", "tale", "tall"], "answer": "tail"},
        {"id": "ec5", "sentence": "Can you ____ the bell?", "incorrect": "heir", "options": ["hear", "here", "heir"], "answer": "hear"},
        {"id": "ec6", "sentence": "That is my ____ favorite book.", "incorrect": "hole", "options": ["whole", "hole", "whol"], "answer": "whole"}
    ],
    "word_sorting": [
        {"id": "ws1", "bucket1": "starts with b", "bucket2": "starts with d", "words": [
            {"word": "bat", "bucket": 1}, {"word": "dog", "bucket": 2}, {"word": "bed", "bucket": 1}, {"word": "dad", "bucket": 2}
        ]},
        {"id": "ws2", "bucket1": "ends with p", "bucket2": "ends with q", "words": [
            {"word": "map", "bucket": 1}, {"word": "iraq", "bucket": 2}, {"word": "top", "bucket": 1}, {"word": "macaq", "bucket": 2}
        ]},
        {"id": "ws3", "bucket1": "starts with p", "bucket2": "starts with q", "words": [
            {"word": "pig", "bucket": 1}, {"word": "queen", "bucket": 2}, {"word": "pen", "bucket": 1}, {"word": "quick", "bucket": 2}
        ]},
        {"id": "ws4", "bucket1": "starts with m", "bucket2": "starts with w", "words": [
            {"word": "man", "bucket": 1}, {"word": "water", "bucket": 2}, {"word": "mud", "bucket": 1}, {"word": "web", "bucket": 2}
        ]}
    ],
    "syllable_tapping": [
        {"id": "st1", "word": "elephant", "syllables": 3},
        {"id": "st2", "word": "cat", "syllables": 1},
        {"id": "st3", "word": "computer", "syllables": 3},
        {"id": "st4", "word": "banana", "syllables": 3},
        {"id": "st5", "word": "water", "syllables": 2},
        {"id": "st6", "word": "butterfly", "syllables": 3},
        {"id": "st7", "word": "apple", "syllables": 2},
        {"id": "st8", "word": "dog", "syllables": 1},
        {"id": "st9", "word": "umbrella", "syllables": 3},
        {"id": "st10", "word": "strawberry", "syllables": 3}
    ],
    "word_chains": [
        {"id": "wc1", "chain": ["cat", "bat", "bad", "bed"]},
        {"id": "wc2", "chain": ["pig", "dig", "dog", "log"]},
        {"id": "wc3", "chain": ["hot", "hat", "rat", "ran"]},
        {"id": "wc4", "chain": ["sun", "bun", "bug", "bag"]},
        {"id": "wc5", "chain": ["pen", "pan", "pin", "pit"]}
    ],
    "sentence_reconstruction": [
        {"id": "sr1", "words": ["the", "dog", "barked", "loud"]},
        {"id": "sr2", "words": ["she", "ate", "a", "red", "apple"]},
        {"id": "sr3", "words": ["i", "saw", "a", "big", "bird"]},
        {"id": "sr4", "words": ["we", "went", "to", "the", "park"]},
        {"id": "sr5", "words": ["he", "read", "a", "good", "book"]}
    ],
    "rhyme_finder": [
        {"id": "rf1", "target": "cat", "options": ["bat", "dog", "hat", "sun", "mat", "run"], "answers": ["bat", "hat", "mat"]},
        {"id": "rf2", "target": "light", "options": ["night", "dark", "bright", "day", "flight", "sun"], "answers": ["night", "bright", "flight"]},
        {"id": "rf3", "target": "tree", "options": ["free", "leaf", "see", "green", "three", "wood"], "answers": ["free", "see", "three"]},
        {"id": "rf4", "target": "tall", "options": ["fall", "short", "ball", "wall", "big", "call"], "answers": ["fall", "ball", "wall", "call"]}
    ],
    "flashcards": [
        {"id": "fc1", "word": "could"}, {"id": "fc2", "word": "would"}, {"id": "fc3", "word": "should"}, {"id": "fc4", "word": "there"},
        {"id": "fc5", "word": "again"}, {"id": "fc6", "word": "always"}, {"id": "fc7", "word": "around"}, {"id": "fc8", "word": "because"},
        {"id": "fc9", "word": "before"}, {"id": "fc10", "word": "best"}, {"id": "fc11", "word": "both"}, {"id": "fc12", "word": "buy"}
    ],
    "homophones": [
        {"id": "hp1", "sentence": "Can you put it over ____?", "options": ["there", "their", "they're"], "answer": "there"},
        {"id": "hp2", "sentence": "____ going to the park.", "options": ["there", "their", "they're"], "answer": "they're"},
        {"id": "hp3", "sentence": "I want to go ____.", "options": ["to", "too", "two"], "answer": "too"},
        {"id": "hp4", "sentence": "I have ____ apples.", "options": ["to", "too", "two"], "answer": "two"},
        {"id": "hp5", "sentence": "He threw the ball in the ____.", "options": ["air", "heir", "err"], "answer": "air"},
        {"id": "hp6", "sentence": "The dog wagged ____ tail.", "options": ["its", "it's"], "answer": "its"}
    ]
}


class ExerciseGenerator:
    """
    Generates exercises based on skill type, difficulty, and student age.
    Selects from a hardcoded exercise pool, choosing exercises whose
    difficulty is closest to the requested target.
    """

    def generate(self, skill: str, difficulty: float, age: int) -> Dict[str, Any]:
        """
        Generate an exercise for the given skill and difficulty.
        
        Args:
            skill: Skill name (one of EXERCISE_POOL keys)
            difficulty: Target difficulty [0, 1]
            age: Student age (used to select age-appropriate wording)
        
        Returns:
            Exercise dict with id, type, prompt, options, correct_answer,
            difficulty, target_skill, hint
        """
        pool = EXERCISE_POOL.get(skill, [])

        if not pool:
            # Fallback: any exercise from pool
            all_exercises = [ex for exercises in EXERCISE_POOL.values() for ex in exercises]
            if not all_exercises:
                return self._default_exercise(skill, difficulty)
            pool = all_exercises

        # Find exercise with difficulty closest to target
        # For young children (age < 8), bias toward easier exercises
        if age < 8:
            difficulty = min(difficulty, 0.4)
        
        pool_sorted = sorted(pool, key=lambda ex: abs(ex["difficulty"] - difficulty))
        
        # Pick from the top 3 closest exercises randomly for variety
        candidates = pool_sorted[:3]
        exercise = random.choice(candidates)

        return {
            "id": str(uuid.uuid4()),
            "type": exercise["type"],
            "prompt": exercise["prompt"],
            "options": exercise.get("options", []),
            "correct_answer": exercise["correct_answer"],
            "difficulty": exercise["difficulty"],
            "target_skill": exercise["target_skill"],
            "hint": exercise.get("hint", "Think carefully and take your time!"),
        }

    def get_exercise_pool(self) -> Dict[str, List[Dict[str, Any]]]:
        """Return the complete exercise pool."""
        return EXERCISE_POOL

    def get_available_skills(self) -> List[str]:
        """Return list of available skill names."""
        return list(EXERCISE_POOL.keys())

    def _default_exercise(self, skill: str, difficulty: float) -> Dict[str, Any]:
        """Fallback exercise when pool is empty."""
        return {
            "id": str(uuid.uuid4()),
            "type": "phonics",
            "prompt": "Which letter makes the sound at the START of 'ball'?",
            "options": ["b", "d", "p", "q"],
            "correct_answer": "b",
            "difficulty": 0.2,
            "target_skill": skill,
            "hint": "The letter 'b' has its tummy sticking to the RIGHT.",
        }

    def generate_practice(self, game_type: str) -> Dict[str, Any]:
        """Generate a dedicated practice game exercise."""
        pool = PRACTICE_GAMES_POOL.get(game_type, [])
        if not pool:
            return {"error": "Game type not found"}
        return random.choice(pool)
