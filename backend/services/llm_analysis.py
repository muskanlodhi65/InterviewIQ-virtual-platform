"""
services/llm_analysis.py
--------------------------
LLM-powered real-time grammar, pronunciation, and contextual feedback service.
Uses Google Gemini API when GEMINI_API_KEY is available, with instant fallback
to rule-based analysis if offline or unconfigured.
"""

from __future__ import annotations

import json
import os
from typing import Dict, Any, List
from config import settings

# Attempt import of Google GenAI SDK
try:
    from google import genai
    from google.genai import types
    GENAI_AVAILABLE = True
except ImportError:
    GENAI_AVAILABLE = False


def _get_genai_client():
    api_key = settings.GEMINI_API_KEY or os.environ.get("GEMINI_API_KEY", "")
    if GENAI_AVAILABLE and api_key:
        return genai.Client(api_key=api_key)
    return None


def analyze_with_llm(transcript: str, question_prompt: str = "") -> Dict[str, Any]:
    """
    Sends the candidate transcript to Gemini LLM for deep grammar correction,
    pronunciation guidance, and contextual appropriateness scoring.
    """
    client = _get_genai_client()

    if not client or not transcript or len(transcript.strip()) < 5:
        # Fallback to local rule-based engine if LLM API Key isn't provided
        from services.language_analysis import perform_full_language_analysis
        return perform_full_language_analysis(transcript)

    system_prompt = (
        "You are an expert AI speech coach and interview evaluator. Analyze the candidate's spoken response "
        "for grammar mistakes, pronunciation disfluency risks, and contextual technical appropriateness.\n"
        "Return ONLY a raw valid JSON object with the following schema (no markdown, no backticks):\n"
        "{\n"
        '  "grammar_score": float (0-100),\n'
        '  "pronunciation_score": float (0-100),\n'
        '  "context_score": float (0-100),\n'
        '  "grammar_errors": [\n'
        '     {"original": "incorrect word/phrase", "suggestion": "clear correction explanation", "context": "sentence snippet"}\n'
        '  ],\n'
        '  "pronunciation_tips": [\n'
        '     {"word": "target word", "phonetic": "PHO-net-ik guide", "tip": "how to articulate clearly"}\n'
        '  ]\n'
        "}"
    )

    user_content = f"Question: {question_prompt}\nCandidate Transcript: {transcript}"

    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=user_content,
            config=types.GenerateContentConfig(
                system_instruction=system_prompt,
                response_mime_type="application/json",
                temperature=0.2,
            ),
        )

        raw_text = response.text.strip()
        # Clean any accidental markdown code block wrapper if present
        if raw_text.startswith("```"):
            raw_text = raw_text.split("\n", 1)[1].rsplit("```", 1)[0].strip()

        data = json.loads(raw_text)
        return {
            "grammar_score": float(data.get("grammar_score", 85.0)),
            "pronunciation_score": float(data.get("pronunciation_score", 90.0)),
            "context_score": float(data.get("context_score", 80.0)),
            "grammar_errors": data.get("grammar_errors", []),
            "pronunciation_tips": data.get("pronunciation_tips", []),
        }
    except Exception as e:
        print(f"[LLM Analysis Warning] Gemini API call failed: {e}. Falling back to local engine.")
        from services.language_analysis import perform_full_language_analysis
        return perform_full_language_analysis(transcript)
