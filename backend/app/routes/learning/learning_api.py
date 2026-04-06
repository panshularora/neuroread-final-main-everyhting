"""
Learning API — connects the ML backend (BKT, IRT, SM-2, ZPD) to HTTP endpoints.

Endpoints:
  POST /api/learning/session/start
  POST /api/learning/session/{session_id}/answer
  GET  /api/learning/session/{session_id}/skills
  GET  /api/learning/session/{session_id}/recommend
"""
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.ml.bkt_engine import BKTEngine
from app.ml.irt_scorer import IRTScorer
from app.ml.sm2_scheduler import SM2Scheduler
from app.ml.zpd_flow import ZPDFlow
from app.ml.exercise_generator import ExerciseGenerator
from app.session_store import get_session_store

router = APIRouter(prefix="/api/learning", tags=["learning-adaptive"])

# ── ML singletons ─────────────────────────────────────────────────────────────
bkt = BKTEngine(p_init=0.1, p_transit=0.09, p_slip=0.10, p_guess=0.25)
irt = IRTScorer()
sm2 = SM2Scheduler()
zpd = ZPDFlow()
gen = ExerciseGenerator()

# ── Default skills with initial P(know) ──────────────────────────────────────
DEFAULT_SKILLS = {
    "bd_confusion": 0.1,
    "pq_confusion": 0.1,
    "phonics_initial": 0.1,
    "phonics_final": 0.1,
    "spelling_cvc": 0.15,
    "spelling_ccvc": 0.1,
    "comprehension_short": 0.15,
    "comprehension_long": 0.1,
}

DEFAULT_SM2_STATE = {
    "repetitions": 0,
    "easiness": 2.5,
    "last_interval": 1,
    "last_review": None,
    "next_due": None,
}


# ── Pydantic schemas ──────────────────────────────────────────────────────────

class StartSessionRequest(BaseModel):
    user_id: str
    age: int = 8
    session_type: str = "learning"  # "learning" | "practice"


class AnswerRequest(BaseModel):
    exercise_id: str
    answer: str
    response_time_ms: int = 3000


# ── Helper functions ──────────────────────────────────────────────────────────

def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _find_next_skill(session: Dict[str, Any]) -> str:
    """
    Select next skill to practice based on:
    1. Lowest P(know) (most needs improvement)
    2. Balanced with ZPD (not too hard, not too easy)
    """
    bkt_state: Dict[str, float] = session["bkt_state"]
    ability = session.get("irt_ability", 0.0)

    # Find skill furthest from mastery but still learnable (ZPD)
    skills_by_need = sorted(bkt_state.items(), key=lambda kv: kv[1])
    
    # Prefer skills in ZPD range
    for skill, p_know in skills_by_need:
        # Don't repeat mastered skills unless in practice mode
        if p_know >= 0.85 and session.get("session_type") != "practice":
            continue
        return skill

    # Fallback: return skill with lowest P(know)
    return skills_by_need[0][0]


def _generate_exercise(session: Dict[str, Any], skill: str) -> Dict[str, Any]:
    """Generate the next exercise for the session."""
    age = session.get("age", 8)
    ability = session.get("irt_ability", 0.0)

    # Use ZPD to get appropriate difficulty
    target_difficulty = zpd.recommend_difficulty_0to1(ability)

    exercise = gen.generate(skill=skill, difficulty=target_difficulty, age=age)
    return exercise


def _init_session(user_id: str, age: int, session_type: str) -> Dict[str, Any]:
    """Create a new session dict with default state."""
    return {
        "session_id": str(uuid.uuid4()),
        "user_id": user_id,
        "age": age,
        "session_type": session_type,
        "created_at": _now_iso(),
        "bkt_state": dict(DEFAULT_SKILLS),
        "irt_ability": 0.0,
        "sm2_state": {skill: dict(DEFAULT_SM2_STATE) for skill in DEFAULT_SKILLS},
        "exercise_history": [],
        "current_exercise": None,
        "stats": {
            "correct": 0,
            "total": 0,
            "streak": 0,
            "longest_streak": 0,
        },
    }


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("/session/start")
def start_session(body: StartSessionRequest):
    """
    Start a new adaptive learning session.
    
    Returns the session ID and the first exercise.
    """
    store = get_session_store()
    session = _init_session(body.user_id, body.age, body.session_type)

    # Choose first skill
    skill = _find_next_skill(session)
    exercise = _generate_exercise(session, skill)
    session["current_exercise"] = exercise

    store.set(session["session_id"], session)

    return {
        "session_id": session["session_id"],
        "first_exercise": exercise,
        "session_type": body.session_type,
    }


@router.post("/session/{session_id}/answer")
def submit_answer(session_id: str, body: AnswerRequest):
    """
    Submit an answer for the current exercise.
    
    Updates BKT state, IRT ability, SM-2 schedule, and returns:
    - correct/incorrect
    - explanation
    - next exercise
    - skill update (p_know_before, p_know_after)
    - session stats
    """
    store = get_session_store()
    session = store.get(session_id)

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    current = session.get("current_exercise")
    if not current:
        raise HTTPException(status_code=400, detail="No active exercise in session")

    # ── Evaluate answer ───────────────────────────────────────────────────────
    correct_answer = current["correct_answer"].strip().lower()
    user_answer = body.answer.strip().lower()
    correct = user_answer == correct_answer

    skill = current["target_skill"]
    difficulty = current["difficulty"]

    # ── BKT update ────────────────────────────────────────────────────────────
    bkt_state = session["bkt_state"]
    p_know_before = bkt_state.get(skill, 0.1)
    p_know_after = bkt.update(p_know_before, correct)
    bkt_state[skill] = p_know_after
    session["bkt_state"] = bkt_state

    # ── IRT ability update ────────────────────────────────────────────────────
    # Convert 0-1 difficulty to IRT scale
    difficulty_irt = irt.difficulty_from_0to1(difficulty)
    old_ability = session.get("irt_ability", 0.0)
    new_ability = irt.update_ability(old_ability, correct, difficulty_irt)
    session["irt_ability"] = new_ability

    # ── SM-2 update ───────────────────────────────────────────────────────────
    sm2_state = session.get("sm2_state", {}).get(skill, dict(DEFAULT_SM2_STATE))
    last_interval = sm2_state.get("last_interval", 1)
    reps = sm2_state.get("repetitions", 0)
    easiness = sm2_state.get("easiness", 2.5)

    new_interval, new_easiness = sm2.next_interval_with_last(
        repetition=reps,
        easiness=easiness,
        last_interval=last_interval,
        correct=correct,
    )

    now_str = _now_iso()
    from datetime import timedelta
    next_due = (datetime.now(timezone.utc) + timedelta(days=new_interval)).isoformat()

    sm2_state_updated = {
        "repetitions": (reps + 1) if correct else 0,
        "easiness": new_easiness,
        "last_interval": new_interval,
        "last_review": now_str,
        "next_due": next_due,
    }
    if "sm2_state" not in session:
        session["sm2_state"] = {}
    session["sm2_state"][skill] = sm2_state_updated

    # ── Stats update ──────────────────────────────────────────────────────────
    stats = session.get("stats", {"correct": 0, "total": 0, "streak": 0, "longest_streak": 0})
    stats["total"] += 1
    if correct:
        stats["correct"] += 1
        stats["streak"] += 1
        stats["longest_streak"] = max(stats["longest_streak"], stats["streak"])
    else:
        stats["streak"] = 0
    session["stats"] = stats

    # ── Exercise history ──────────────────────────────────────────────────────
    session.setdefault("exercise_history", []).append({
        "exercise_id": body.exercise_id,
        "skill": skill,
        "correct": correct,
        "response_time_ms": body.response_time_ms,
        "timestamp": now_str,
        "p_know_before": p_know_before,
        "p_know_after": p_know_after,
    })

    # ── Generate next exercise ────────────────────────────────────────────────
    next_skill = _find_next_skill(session)
    next_exercise = _generate_exercise(session, next_skill)
    session["current_exercise"] = next_exercise

    # ── Explanation ───────────────────────────────────────────────────────────
    if correct:
        mastered = bkt.get_mastery(p_know_after)
        if mastered:
            explanation = f"Excellent! You've mastered '{skill.replace('_', ' ')}'! 🌟"
        elif stats["streak"] >= 3:
            explanation = f"Amazing! {stats['streak']} in a row! Keep it up! 🔥"
        else:
            explanation = "Well done! That's correct! 🎉"
    else:
        explanation = f"Not quite, but that's okay! The correct answer is: {current['correct_answer']}. {current.get('hint', '')}"

    # ── ZPD classification ────────────────────────────────────────────────────
    zpd_zone = zpd.classify(new_ability, irt.difficulty_from_0to1(difficulty))

    # Save updated session
    store.set(session_id, session)

    days_until = sm2.days_until_due(datetime.now(timezone.utc), new_interval)

    return {
        "correct": correct,
        "explanation": explanation,
        "next_exercise": next_exercise,
        "skill_update": {
            "skill_name": skill,
            "p_know_before": round(p_know_before, 4),
            "p_know_after": round(p_know_after, 4),
            "mastered": bkt.get_mastery(p_know_after),
            "delta": round(p_know_after - p_know_before, 4),
            # BKT parameters (for judge mode)
            "bkt_params": {
                "p_transit": bkt.p_transit,
                "p_slip": bkt.p_slip,
                "p_guess": bkt.p_guess,
            },
        },
        "sm2_update": {
            "next_review_days": new_interval,
            "next_review_label": sm2.due_description(days_until),
            "easiness_factor": round(new_easiness, 2),
        },
        "irt_update": {
            "ability_before": round(old_ability, 3),
            "ability_after": round(new_ability, 3),
            "zpd_zone": zpd_zone,
            "zpd_label": zpd.classify_label(new_ability, irt.difficulty_from_0to1(difficulty)),
        },
        "session_stats": {
            "correct": stats["correct"],
            "total": stats["total"],
            "streak": stats["streak"],
            "longest_streak": stats["longest_streak"],
        },
    }


@router.get("/session/{session_id}/skills")
def get_skills(session_id: str):
    """
    Get the current skill state for a session.
    
    Returns all skills with their P(know) values and mastery status.
    """
    store = get_session_store()
    session = store.get(session_id)

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    bkt_state = session.get("bkt_state", {})

    skills = []
    for skill_name, p_know in bkt_state.items():
        sm2_info = session.get("sm2_state", {}).get(skill_name, {})
        skills.append({
            "name": skill_name,
            "display_name": skill_name.replace("_", " ").title(),
            "p_know": round(p_know, 4),
            "mastered": bkt.get_mastery(p_know),
            "sm2": {
                "repetitions": sm2_info.get("repetitions", 0),
                "easiness": round(sm2_info.get("easiness", 2.5), 2),
                "last_interval": sm2_info.get("last_interval", 1),
                "next_due": sm2_info.get("next_due"),
                "last_review": sm2_info.get("last_review"),
            },
        })

    return {
        "skills": skills,
        "irt_ability": round(session.get("irt_ability", 0.0), 3),
        "session_stats": session.get("stats", {}),
    }


@router.get("/session/{session_id}/recommend")
def recommend_exercise(session_id: str):
    """
    Get the next recommended exercise for the session.
    
    Uses SM-2 to find due items, ZPD to select appropriate difficulty.
    Returns exercises for practice mode (SM-2 due items).
    """
    store = get_session_store()
    session = store.get(session_id)

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    sm2_state = session.get("sm2_state", {})
    bkt_state = session.get("bkt_state", {})

    # Find skills due for review
    due_skills = []
    for skill_name, sm2_info in sm2_state.items():
        last_review_str = sm2_info.get("last_review")
        interval = sm2_info.get("last_interval", 1)

        if last_review_str:
            try:
                last_review = datetime.fromisoformat(last_review_str)
                if sm2.is_due(last_review, interval):
                    due_skills.append((skill_name, bkt_state.get(skill_name, 0.1)))
            except (ValueError, TypeError):
                pass
        else:
            # Never reviewed — always due
            due_skills.append((skill_name, bkt_state.get(skill_name, 0.1)))

    if not due_skills:
        return {
            "due_count": 0,
            "all_caught_up": True,
            "message": "All caught up! 🎉 Come back tomorrow for your next review.",
            "next_exercise": None,
        }

    # Sort by lowest P(know) first (most needs review)
    due_skills.sort(key=lambda x: x[1])
    recommended_skill = due_skills[0][0]

    exercise = _generate_exercise(session, recommended_skill)
    session["current_exercise"] = exercise
    store.set(session_id, session)

    # Compute days until due for each due skill
    due_details = []
    for skill_name, p_know in due_skills:
        sm2_info = sm2_state.get(skill_name, {})
        due_details.append({
            "skill": skill_name,
            "p_know": round(p_know, 4),
            "mastered": bkt.get_mastery(p_know),
        })

    return {
        "due_count": len(due_skills),
        "all_caught_up": False,
        "due_skills": due_details,
        "next_exercise": exercise,
        "message": f"You have {len(due_skills)} item{'s' if len(due_skills) != 1 else ''} due for review today.",
    }

@router.get("/practice/generate")
def generate_practice(game_type: str):
    """
    Generate an exercise of a specific game type.
    """
    return gen.generate_practice(game_type)

class DictationEvaluationRequest(BaseModel):
    target: str
    answer: str

@router.post("/practice/evaluate/dictation")
def evaluate_dictation(body: DictationEvaluationRequest):
    from difflib import SequenceMatcher
    target = body.target.lower().strip()
    user = body.answer.lower().strip()
    
    # Simple phonetic normalizer
    def phonetics(w):
        return w.replace('ph', 'f').replace('c', 'k').replace('ck', 'k').replace('tion', 'shun').replace('gh', 'f')
    
    t_p = phonetics(target)
    u_p = phonetics(user)
    ratio = SequenceMatcher(None, t_p, u_p).ratio()
    
    # If the ratio is very high, or the stripped versions match exactly
    is_correct = ratio >= 0.75 or target == user
    
    return {
        "correct": is_correct,
        "phonetic_match_score": round(ratio, 2),
        "target": target,
        "answer": user
    }
