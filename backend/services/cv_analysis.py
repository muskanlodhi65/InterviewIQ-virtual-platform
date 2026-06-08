"""
services/cv_analysis.py
------------------------
Facial/posture confidence scoring module.

WORKING TODAY: a deterministic-but-varied mock scorer so the whole
product is demoable end-to-end immediately.

TO PLUG IN THE REAL MODEL: this is exactly where your PostureGuard
MediaPipe Pose + FaceMesh pipeline (CVA + eye-contact-via-gaze-vector)
belongs. Set USE_REAL_CV_MODEL=true in config once implemented, and
replace `_mock_score` calls below with the real MediaPipe-based analysis
of the uploaded/streamed video frames.

Suggested real implementation:
    1. Reuse `geometry.calculate_cva` from PostureGuard for posture_score.
    2. Compute a gaze-direction vector from the iris landmarks
       (MediaPipe FaceMesh refine_landmarks=True) relative to the eye
       socket bounding box to estimate `eye_contact_score`.
    3. Average both scores across all sampled frames in the answer clip.
"""

from __future__ import annotations

import hashlib
from typing import Optional

from config import settings


def _deterministic_pseudo_random(seed_text: str, low: float, high: float) -> float:
    """
    Produces a stable, reproducible "random-looking" score from a seed
    string, so repeated demo runs on the same question are consistent
    rather than jarringly random -- purely a placeholder-quality
    convenience until the real model is wired in.
    """
    digest = hashlib.sha256(seed_text.encode()).hexdigest()
    fraction = int(digest[:8], 16) / 0xFFFFFFFF
    return low + fraction * (high - low)


def analyze_posture_and_eye_contact(
    question_id: str,
    avg_eye_contact_ratio: Optional[float] = None,
    avg_posture_score: Optional[float] = None,
) -> dict:
    """
    Returns {"eye_contact_score": float 0-100, "posture_score": float 0-100}.

    If the frontend already computed rough client-side signals (e.g. from
    a lightweight browser MediaPipe pass), those are trusted and rescaled.
    Otherwise falls back to the seeded mock so the API contract never
    breaks the frontend while the real model is being built.
    """
    if settings.USE_REAL_CV_MODEL:
        raise NotImplementedError(
            "USE_REAL_CV_MODEL=true but no real model is wired in yet. "
            "Implement MediaPipe-based scoring here (see module docstring)."
        )

    if avg_eye_contact_ratio is not None:
        eye_contact_score = max(0.0, min(100.0, avg_eye_contact_ratio * 100.0))
    else:
        eye_contact_score = _deterministic_pseudo_random(question_id + "eye", 55, 92)

    if avg_posture_score is not None:
        posture_score = max(0.0, min(100.0, avg_posture_score * 100.0))
    else:
        posture_score = _deterministic_pseudo_random(question_id + "posture", 60, 95)

    return {
        "eye_contact_score": round(eye_contact_score, 1),
        "posture_score": round(posture_score, 1),
    }
