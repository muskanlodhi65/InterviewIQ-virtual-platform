"""
services/language_analysis.py
--------------------------------
Comprehensive speech, grammar, pronunciation, and contextual analysis service.

Features:
1. Grammar & Syntax Analysis (Subject-verb agreement, tense errors, awkward phrases)
2. Pronunciation & Phonetic Guidance (Identify misspoken or tricky interview words)
3. Contextual Appropriateness & Professional Vocabulary evaluation
"""

from __future__ import annotations

import re
from typing import Dict, List, Any

# Common grammar issue patterns & suggestions
GRAMMAR_PATTERNS = [
    (r"\b(i|he|she|it|they|we)\s+(goes|does|is|was)\b", "Subject-verb alignment check needed"),
    (r"\b(i)\s+(is|was|goes|has took|has came)\b", "Subject-verb disagreement"),
    (r"\b(more|most)\s+(better|faster|easier|harder|smarter)\b", "Double comparative error (e.g. use 'better' instead of 'more better')"),
    (r"\b(did|didn't|did not)\s+(went|came|saw|did|took|made)\b", "Use base verb after auxiliary 'did' (e.g. 'didn't go' instead of 'didn't went')"),
    (r"\b(gooder|badder|fastly)\b", "Non-standard word choice"),
    (r"\b(me and my|me and him|me and her)\s+(did|built|worked|led)\b", "Use 'My team and I' or 'He and I' for subject position"),
]

# Phonetic guide for words commonly mispronounced or rushed in interviews
PRONUNCIATION_DICTIONARY: Dict[str, Dict[str, str]] = {
    "specifically": {"phonetic": "speh-SIF-ih-klee", "tip": "Don't say 'pacifically'. Emphasize the initial 'Sp' sound."},
    "ask": {"phonetic": "AH-sk", "tip": "Avoid pronouncing as 'aks' or 'ax'. Keep the 's' sound before 'k'."},
    "library": {"phonetic": "LYE-brer-ee", "tip": "Remember the first 'r' sound after 'b'."},
    "especially": {"phonetic": "eh-SPESH-uh-lee", "tip": "Don't add an 'x' sound (avoid 'ex-specially')."},
    "often": {"phonetic": "OFF-en", "tip": "The 't' is traditionally silent or very soft."},
    "algorithm": {"phonetic": "AL-guh-rith-um", "tip": "Pronounce 'th' softly with tip of tongue between teeth."},
    "hierarchy": {"phonetic": "HYE-er-ar-kee", "tip": "Three syllables: LYE-er-ar-kee. Don't skip the middle 'ar'."},
    "architecture": {"phonetic": "ARK-ih-tek-cher", "tip": "The 'ch' sounds like a hard 'k' (Ark)."},
    "cache": {"phonetic": "KASH", "tip": "Rhymes with 'cash', not 'cash-ay'."},
    "sql": {"phonetic": "ESS-kue-ELL / SEE-kwul", "tip": "Pronounced as S-Q-L or 'Sequel'."},
    "kubernetes": {"phonetic": "koo-ber-NET-ees", "tip": "Four syllables with emphasis on 'NET'."},
    "asynchronous": {"phonetic": "ay-SING-kruh-nuss", "tip": "Starts with 'ay', not 'ah'."},
    "definitely": {"phonetic": "DEF-ih-nit-lee", "tip": "Avoid saying 'defiantly'."},
    "probably": {"phonetic": "PROB-uh-blee", "tip": "Pronounce both 'b' sounds clearly; avoid 'prolly'."},
}

# Professional vocabulary words that boost context score
PROFESSIONAL_KEYWORDS = {
    "implemented", "orchestrated", "collaborated", "optimized", "spearheaded",
    "architecture", "scalability", "deliverable", "stakeholders", "mitigated",
    "efficiency", "refactored", "benchmark", "strategy", "methodology", "impact"
}


def analyze_grammar(transcript: str) -> List[Dict[str, str]]:
    """Identifies grammar and syntax errors in the transcript."""
    errors = []
    if not transcript or not transcript.strip():
        return errors

    lowered = transcript.lower()
    
    for pattern, explanation in GRAMMAR_PATTERNS:
        matches = re.finditer(pattern, lowered)
        for match in matches:
            matched_text = match.group(0)
            errors.append({
                "original": matched_text,
                "suggestion": explanation,
                "context": transcript[max(0, match.start() - 15): min(len(transcript), match.end() + 15)]
            })
            
    # Check sentence length / run-on sentences
    sentences = re.split(r"[.!?]+", transcript)
    for sentence in sentences:
        words = sentence.strip().split()
        if len(words) > 40:
            errors.append({
                "original": f"Sentence with {len(words)} words",
                "suggestion": "Sentence is too long. Break complex ideas into shorter, punchy sentences.",
                "context": sentence.strip()[:50] + "..."
            })

    return errors


def analyze_pronunciation_risks(transcript: str) -> List[Dict[str, str]]:
    """Finds words present in candidate transcript that are frequently mispronounced."""
    tips = []
    if not transcript:
        return tips

    words_in_transcript = set(re.findall(r"\b[a-zA-Z]+\b", transcript.lower()))

    for word, guide in PRONUNCIATION_DICTIONARY.items():
        if word in words_in_transcript:
            tips.append({
                "word": word,
                "phonetic": guide["phonetic"],
                "tip": guide["tip"]
            })

    return tips


def analyze_context_and_vocab(transcript: str) -> float:
    """Calculates context score (0-100) based on professional vocabulary and structure."""
    if not transcript or len(transcript.strip()) < 10:
        return 20.0

    words = re.findall(r"\b[a-zA-Z]+\b", transcript.lower())
    total_words = len(words)

    if total_words < 15:
        return 40.0

    prof_count = sum(1 for w in words if w in PROFESSIONAL_KEYWORDS)
    vocab_ratio = prof_count / (total_words / 20.0)  # normalized expected density

    base_score = 65.0 + min(30.0, vocab_ratio * 15.0)

    # Bonus for clean punctuation / complete thoughts
    if "." in transcript or "," in transcript:
        base_score += 5.0

    return round(min(100.0, base_score), 1)


def perform_full_language_analysis(transcript: str) -> Dict[str, Any]:
    """Runs full language, grammar, pronunciation and context evaluation."""
    grammar_errors = analyze_grammar(transcript)
    pronunciation_tips = analyze_pronunciation_risks(transcript)
    context_score = analyze_context_and_vocab(transcript)

    # Calculate grammar score
    grammar_penalty = len(grammar_errors) * 12.0
    grammar_score = round(max(30.0, 100.0 - grammar_penalty), 1)

    # Calculate pronunciation score (risk-based)
    pronunciation_score = 95.0 if not pronunciation_tips else 85.0

    return {
        "grammar_score": grammar_score,
        "pronunciation_score": pronunciation_score,
        "context_score": context_score,
        "grammar_errors": grammar_errors,
        "pronunciation_tips": pronunciation_tips
    }
