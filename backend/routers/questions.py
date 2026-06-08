"""
routers/questions.py
----------------------
Serves the interview question bank. Backed by a static JSON seed file
today; swap `_load_questions` for a database-backed CRUD admin panel once
you want to let users/admins add their own question sets.
"""

from __future__ import annotations

import json
import os
import random
from functools import lru_cache
from typing import List, Optional

from fastapi import APIRouter, Query

from models import Question

router = APIRouter(prefix="/questions", tags=["questions"])

_QUESTIONS_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "questions_bank.json")


@lru_cache(maxsize=1)
def _load_questions() -> List[Question]:
    with open(_QUESTIONS_PATH, "r", encoding="utf-8") as f:
        raw = json.load(f)
    return [Question(**item) for item in raw]


@router.get("", response_model=List[Question])
async def list_questions(
    role: Optional[str] = Query(default=None, description="Filter by role, e.g. SDE"),
    category: Optional[str] = Query(default=None, description="Filter by category"),
):
    questions = _load_questions()
    if role:
        questions = [q for q in questions if q.role.lower() == role.lower()]
    if category:
        questions = [q for q in questions if q.category.lower() == category.lower()]
    return questions


@router.get("/random", response_model=List[Question])
async def random_questions(
    role: str = Query(..., description="Role to draw questions for, e.g. SDE"),
    count: int = Query(default=5, ge=1, le=20),
):
    pool = [q for q in _load_questions() if q.role.lower() == role.lower()]
    if not pool:
        return []
    sample_size = min(count, len(pool))
    return random.sample(pool, sample_size)


@router.get("/roles", response_model=List[str])
async def list_roles():
    return sorted({q.role for q in _load_questions()})
