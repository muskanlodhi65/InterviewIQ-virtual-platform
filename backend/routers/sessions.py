"""
routers/sessions.py
----------------------
Orchestrates an interview session end-to-end: create a session with a
question set, accept an answer submission per question (running it
through the CV + speech + NLP scoring services), and expose session
results / history for the dashboard.
"""

from __future__ import annotations

import json
import os
import random
import uuid
from datetime import datetime
from functools import lru_cache
from typing import List

from fastapi import APIRouter, Depends, HTTPException

from database import get_db
from models import (
    AnswerFeedback,
    Question,
    SessionAnswer,
    SessionCreate,
    SessionHistoryItem,
    SessionResult,
)
from routers.auth import get_current_user
from services import cv_analysis, nlp_scoring, speech_analysis, language_analysis, llm_analysis

router = APIRouter(prefix="/sessions", tags=["sessions"])

_QUESTIONS_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "questions_bank.json")


@lru_cache(maxsize=1)
def _load_questions() -> List[Question]:
    with open(_QUESTIONS_PATH, "r", encoding="utf-8") as f:
        raw = json.load(f)
    return [Question(**item) for item in raw]


def _generate_tips(feedback: AnswerFeedback) -> List[str]:
    tips = []
    if feedback.filler_word_count > 5:
        tips.append("Try to reduce filler words like 'um' and 'like' — pause silently instead.")
    if feedback.speaking_pace_wpm > 0 and feedback.speaking_pace_wpm < 110:
        tips.append("Your pace was a bit slow — aim for 120-150 words per minute for confident delivery.")
    elif feedback.speaking_pace_wpm > 170:
        tips.append("You spoke quite fast — slow down slightly so the interviewer can follow easily.")
    if feedback.eye_contact_score < 65:
        tips.append("Work on maintaining more consistent eye contact with the camera.")
    if feedback.posture_score < 65:
        tips.append("Sit upright and keep your shoulders back — posture affects perceived confidence.")
    if feedback.grammar_score < 75:
        tips.append("Review your grammar feedback: practice correct subject-verb alignment and verb tenses.")
    if feedback.context_score < 70:
        tips.append("Incorporate more industry-specific technical vocabulary to strengthen your contextual relevance.")
    if feedback.answer_structure_score < 50:
        tips.append("Structure your answer with the STAR method: Situation, Task, Action, Result.")
    if feedback.answer_relevance_score < 50:
        tips.append("Try to address the core of the question more directly with specific examples.")
    if not tips:
        tips.append("Strong answer overall — keep this consistency across all your responses.")
    return tips


def _overall_score(feedback: AnswerFeedback) -> float:
    weights = {
        "answer_relevance_score": 0.25,
        "grammar_score": 0.20,
        "context_score": 0.15,
        "answer_structure_score": 0.15,
        "eye_contact_score": 0.10,
        "posture_score": 0.10,
        "speaking_pace_score": 0.05,
    }
    ideal_low, ideal_high = 120, 150
    pace = feedback.speaking_pace_wpm
    if ideal_low <= pace <= ideal_high:
        pace_score = 100.0
    else:
        distance = min(abs(pace - ideal_low), abs(pace - ideal_high))
        pace_score = max(0.0, 100.0 - distance)

    filler_penalty = min(20.0, feedback.filler_word_count * 3.0)

    score = (
        feedback.answer_relevance_score * weights["answer_relevance_score"]
        + feedback.grammar_score * weights["grammar_score"]
        + feedback.context_score * weights["context_score"]
        + feedback.answer_structure_score * weights["answer_structure_score"]
        + feedback.eye_contact_score * weights["eye_contact_score"]
        + feedback.posture_score * weights["posture_score"]
        + pace_score * weights["speaking_pace_score"]
    )
    return round(max(0.0, min(100.0, score - filler_penalty)), 1)


@router.post("", response_model=dict)
async def create_session(payload: SessionCreate, current_user: dict = Depends(get_current_user)):
    pool = [q for q in _load_questions() if q.role.lower() == payload.role.lower()]
    if not pool:
        raise HTTPException(status_code=404, detail=f"No questions found for role '{payload.role}'")

    sample_size = min(payload.num_questions, len(pool))
    selected = random.sample(pool, sample_size)

    db = get_db()
    session_doc = {
        "_id": str(uuid.uuid4()),
        "user_id": current_user["_id"],
        "role": payload.role,
        "question_ids": [q.id for q in selected],
        "created_at": datetime.utcnow().isoformat(),
        "answers": [],
    }
    await db["sessions"].insert_one(session_doc)

    return {"session_id": session_doc["_id"], "questions": [q.dict() for q in selected]}


@router.post("/{session_id}/answers", response_model=AnswerFeedback)
async def submit_answer(
    session_id: str, payload: SessionAnswer, current_user: dict = Depends(get_current_user)
):
    db = get_db()
    session_doc = await db["sessions"].find_one({"_id": session_id})
    if not session_doc or session_doc["user_id"] != current_user["_id"]:
        raise HTTPException(status_code=404, detail="Session not found")

    question = next((q for q in _load_questions() if q.id == payload.question_id), None)
    if question is None:
        raise HTTPException(status_code=404, detail="Question not found")

    cv_result = cv_analysis.analyze_posture_and_eye_contact(
        payload.question_id, payload.avg_eye_contact_ratio, payload.avg_posture_score
    )
    speech_result = speech_analysis.analyze_speech(payload.transcript, payload.duration_seconds)
    nlp_result = nlp_scoring.score_answer(payload.transcript, question.ideal_answer_points)
    lang_result = llm_analysis.analyze_with_llm(payload.transcript, question.prompt)

    feedback = AnswerFeedback(
        question_id=payload.question_id,
        filler_word_count=speech_result["filler_word_count"],
        speaking_pace_wpm=speech_result["speaking_pace_wpm"],
        eye_contact_score=cv_result["eye_contact_score"],
        posture_score=cv_result["posture_score"],
        answer_relevance_score=nlp_result["answer_relevance_score"],
        answer_structure_score=nlp_result["answer_structure_score"],
        grammar_score=lang_result["grammar_score"],
        pronunciation_score=lang_result["pronunciation_score"],
        context_score=lang_result["context_score"],
        grammar_errors=lang_result["grammar_errors"],
        pronunciation_tips=lang_result["pronunciation_tips"],
        overall_score=0.0,
        tips=[],
    )
    feedback.overall_score = _overall_score(feedback)
    feedback.tips = _generate_tips(feedback)

    session_doc["answers"].append(feedback.dict())
    await db["sessions"].update_one({"_id": session_id}, {"$set": {"answers": session_doc["answers"]}})

    return feedback


@router.get("/{session_id}", response_model=SessionResult)
async def get_session_result(session_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    session_doc = await db["sessions"].find_one({"_id": session_id})
    if not session_doc or session_doc["user_id"] != current_user["_id"]:
        raise HTTPException(status_code=404, detail="Session not found")

    answers = [AnswerFeedback(**a) for a in session_doc["answers"]]
    overall = round(sum(a.overall_score for a in answers) / len(answers), 1) if answers else 0.0

    summary_tips = []
    if answers:
        weakest = min(answers, key=lambda a: a.overall_score)
        summary_tips = weakest.tips[:2]

    return SessionResult(
        session_id=session_id,
        role=session_doc["role"],
        created_at=datetime.fromisoformat(session_doc["created_at"]),
        answers=answers,
        overall_session_score=overall,
        summary_tips=summary_tips,
    )


@router.get("", response_model=List[SessionHistoryItem])
async def list_session_history(current_user: dict = Depends(get_current_user)):
    db = get_db()
    all_sessions = await db["sessions"].find({"user_id": current_user["_id"]})

    history = []
    for s in all_sessions:
        answers = s.get("answers", [])
        overall = round(sum(a["overall_score"] for a in answers) / len(answers), 1) if answers else 0.0
        history.append(
            SessionHistoryItem(
                session_id=s["_id"],
                role=s["role"],
                created_at=datetime.fromisoformat(s["created_at"]),
                overall_session_score=overall,
            )
        )
    history.sort(key=lambda h: h.created_at, reverse=True)
    return history
