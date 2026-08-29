"""
models.py
---------
Pydantic schemas shared across routers. Kept framework-agnostic of the
storage layer so switching between in-memory and MongoDB never touches
this file.
"""

from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, EmailStr, Field


# =========================================================================
# Auth
# =========================================================================

class UserSignup(BaseModel):
    name: str
    email: EmailStr
    password: str = Field(min_length=6)
    role: str = "candidate"  # "candidate", "interviewer", or "admin"


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserPublic(BaseModel):
    id: str
    name: str
    email: EmailStr
    role: str = "candidate"


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserPublic


# =========================================================================
# Questions
# =========================================================================

class Question(BaseModel):
    id: str
    role: str            # e.g. "SDE", "Data Science", "HR"
    category: str        # e.g. "Behavioral", "Technical", "System Design"
    prompt: str
    ideal_answer_points: List[str] = []


# =========================================================================
# Interview Sessions
# =========================================================================

class SessionCreate(BaseModel):
    role: str
    num_questions: int = 5


class SessionAnswer(BaseModel):
    question_id: str
    transcript: str
    duration_seconds: float
    # Raw per-frame CV signal, sent from the frontend after local
    # MediaPipe processing (or uploaded video, in a later iteration).
    avg_eye_contact_ratio: Optional[float] = None
    avg_posture_score: Optional[float] = None


class AnswerFeedback(BaseModel):
    question_id: str
    filler_word_count: int
    speaking_pace_wpm: float
    eye_contact_score: float       # 0-100
    posture_score: float           # 0-100
    answer_relevance_score: float  # 0-100
    answer_structure_score: float  # 0-100 (STAR-method adherence, etc.)
    grammar_score: float = 85.0    # 0-100
    pronunciation_score: float = 90.0 # 0-100
    context_score: float = 80.0    # 0-100
    grammar_errors: List[dict] = []
    pronunciation_tips: List[dict] = []
    overall_score: float           # 0-100
    tips: List[str]


class SessionResult(BaseModel):
    session_id: str
    role: str
    created_at: datetime
    answers: List[AnswerFeedback]
    overall_session_score: float
    summary_tips: List[str]


class SessionHistoryItem(BaseModel):
    session_id: str
    role: str
    created_at: datetime
    overall_session_score: float
