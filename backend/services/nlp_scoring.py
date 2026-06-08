"""
services/nlp_scoring.py
-------------------------
Answer quality scoring: relevance to the ideal-answer keypoints, and
structural adherence to the STAR method (Situation, Task, Action, Result)
for behavioral questions.

WORKING TODAY: this one is a *real*, working baseline (not a mock) --
TF-IDF cosine similarity via scikit-learn for relevance, and a keyword/
discourse-marker heuristic for structure. It genuinely scores answers,
just with a simpler model than an LLM would give you.

TO UPGRADE: swap `_tfidf_relevance` for an LLM-based rubric grader (e.g.
prompt an LLM with the question, ideal_answer_points, and transcript,
asking for a 0-100 relevance score + structured feedback). Flip
USE_REAL_NLP_SCORER on once wired in, and keep this TF-IDF version as a
fast, free, offline fallback -- it's genuinely useful, not just a
placeholder to throw away.
"""

from __future__ import annotations

import re
from typing import List

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from config import settings

STAR_MARKERS = {
    "situation": ["situation", "context", "when i", "at my", "while working", "background"],
    "task": ["task", "goal", "objective", "needed to", "was asked", "responsible for"],
    "action": ["i did", "i decided", "i implemented", "i built", "i led", "so i", "my approach"],
    "result": ["result", "outcome", "impact", "learned", "improved", "increased", "reduced", "successfully"],
}


def _tfidf_relevance(transcript: str, ideal_answer_points: List[str]) -> float:
    """
    Cosine similarity (0-100) between the candidate's transcript and the
    concatenated ideal-answer keypoints, using TF-IDF vectorization.
    Returns a neutral 50.0 if there's nothing to compare against.
    """
    if not ideal_answer_points or not transcript.strip():
        return 50.0

    reference_text = " ".join(ideal_answer_points)
    corpus = [transcript, reference_text]

    try:
        vectorizer = TfidfVectorizer(stop_words="english")
        tfidf_matrix = vectorizer.fit_transform(corpus)
        similarity = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]
    except ValueError:
        # Happens if the transcript has zero overlapping vocabulary at all
        return 30.0

    return round(float(similarity) * 100, 1)


def _star_structure_score(transcript: str) -> float:
    """
    Heuristic 0-100 score for STAR-method structural completeness: checks
    which of the four STAR components have a linguistic marker present,
    and rewards covering more of them.
    """
    lowered = transcript.lower()
    components_present = 0
    for _, markers in STAR_MARKERS.items():
        if any(marker in lowered for marker in markers):
            components_present += 1

    base_score = (components_present / len(STAR_MARKERS)) * 100

    # Small bonus for reasonable answer length (very short answers can't
    # possibly have real structure, regardless of keyword hits).
    word_count = len(re.findall(r"\w+", transcript))
    if word_count < 25:
        base_score *= 0.6

    return round(min(100.0, base_score), 1)


def score_answer(transcript: str, ideal_answer_points: List[str]) -> dict:
    """
    Returns {"answer_relevance_score": float, "answer_structure_score": float}.
    """
    if settings.USE_REAL_NLP_SCORER:
        raise NotImplementedError(
            "USE_REAL_NLP_SCORER=true but the LLM-based rubric grader isn't "
            "wired in yet. See module docstring for the suggested upgrade."
        )

    return {
        "answer_relevance_score": _tfidf_relevance(transcript, ideal_answer_points),
        "answer_structure_score": _star_structure_score(transcript),
    }
