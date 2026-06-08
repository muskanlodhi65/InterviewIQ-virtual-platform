"""
services/speech_analysis.py
-----------------------------
Speech disfluency + pace analytics.

WORKING TODAY: operates on the *transcript text* the frontend sends
(from the browser's Web Speech API or any STT you wire up), so filler-word
counting and words-per-minute already work with zero ML dependencies.

TO PLUG IN THE REAL MODEL: swap the browser transcript for a local
Whisper transcription of the recorded audio blob for higher accuracy,
and add prosodic features (pause detection, pitch variance) from the raw
audio waveform using `librosa`. Flip USE_REAL_SPEECH_MODEL on once done.

Suggested real implementation:
    1. POST the recorded audio blob to a new /analysis/transcribe route.
    2. Run `whisper.transcribe(audio_path)` (openai-whisper, local, free).
    3. Use word-level timestamps from Whisper to compute true pause
       durations instead of approximating pace from transcript length.
"""

from __future__ import annotations

import re
from typing import List

from config import settings

FILLER_WORDS = {
    "um", "uh", "like", "you know", "actually", "basically",
    "literally", "so", "i mean", "kind of", "sort of", "right",
}


def _tokenize(text: str) -> List[str]:
    return re.findall(r"[a-zA-Z']+", text.lower())


def count_filler_words(transcript: str) -> int:
    lowered = f" {transcript.lower()} "
    count = 0
    for filler in FILLER_WORDS:
        count += lowered.count(f" {filler} ")
    return count


def compute_speaking_pace_wpm(transcript: str, duration_seconds: float) -> float:
    if duration_seconds <= 0:
        return 0.0
    word_count = len(_tokenize(transcript))
    minutes = duration_seconds / 60.0
    return round(word_count / minutes, 1) if minutes > 0 else 0.0


def analyze_speech(transcript: str, duration_seconds: float) -> dict:
    """
    Returns {"filler_word_count": int, "speaking_pace_wpm": float}.

    Ideal pace for interview answers is roughly 120-150 WPM; this is
    surfaced to the frontend so it can render "too fast / too slow / good
    pace" guidance without the backend needing to own UI copy.
    """
    if settings.USE_REAL_SPEECH_MODEL:
        raise NotImplementedError(
            "USE_REAL_SPEECH_MODEL=true but Whisper pipeline isn't wired "
            "in yet. See module docstring for the suggested implementation."
        )

    return {
        "filler_word_count": count_filler_words(transcript),
        "speaking_pace_wpm": compute_speaking_pace_wpm(transcript, duration_seconds),
    }
