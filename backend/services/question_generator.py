"""
services/question_generator.py
---------------------------------
Generates personalized, high-stakes interview questions specifically tailored
to a candidate's Resume and target Job Description (JD).
Uses Google Gemini API when available with an intelligent fallback heuristic
engine when offline.
"""

from __future__ import annotations

import json
import os
import re
import uuid
from typing import List, Optional
from config import settings
from models import Question

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


def _extract_keywords(text: str) -> List[str]:
    """Extract common tech, frameworks, and role keywords from text."""
    known_keywords = [
        "React", "Node.js", "Python", "FastAPI", "Django", "Flask", "JavaScript",
        "TypeScript", "Java", "Spring Boot", "C++", "Go", "Docker", "Kubernetes",
        "AWS", "GCP", "Azure", "SQL", "PostgreSQL", "MongoDB", "Redis",
        "GraphQL", "REST API", "Microservices", "System Design", "TensorFlow",
        "PyTorch", "OpenCV", "NLP", "BERT", "LLM", "RAG", "Machine Learning",
        "Deep Learning", "Kafka", "CI/CD", "Git", "Next.js", "TailwindCSS",
        "Agile", "Scrum", "Redux", "Pandas", "Scikit-learn"
    ]
    found = []
    text_lower = text.lower()
    for kw in known_keywords:
        pattern = r"\b" + re.escape(kw.lower()) + r"\b"
        if re.search(pattern, text_lower):
            found.append(kw)
    return found


def _fallback_tailored_questions(
    role: str,
    num_questions: int,
    resume_text: str,
    job_description: str,
    company_name: str,
    interview_type: str,
) -> List[Question]:
    """
    Intelligent heuristic fallback when LLM is unavailable:
    Synthesizes realistic questions referencing the candidate's actual resume
    skills and the target JD requirements.
    """
    resume_skills = _extract_keywords(resume_text)
    jd_skills = _extract_keywords(job_description)

    # Pick primary skills for customization
    res_skill1 = resume_skills[0] if len(resume_skills) > 0 else "modern development frameworks"
    res_skill2 = resume_skills[1] if len(resume_skills) > 1 else "data processing and state management"
    jd_skill1 = jd_skills[0] if len(jd_skills) > 0 else f"{role} architecture"
    jd_skill2 = jd_skills[1] if len(jd_skills) > 1 else "distributed system scalability"

    company_label = f" at {company_name}" if company_name.strip() else ""

    templates = [
        {
            "category": "Resume Project Deep-Dive",
            "prompt": (
                f"I reviewed your resume and noticed your work involving {res_skill1}. "
                f"Can you walk me through the end-to-end architecture of your most impactful project with {res_skill1}, "
                f"the primary technical bottleneck you tackled, and how you verified your solution?"
            ),
            "ideal_answer_points": [
                f"Clear project context and motivation for selecting {res_skill1}",
                "Architectural breakdown, data flow, and trade-offs made",
                "Specific technical bottleneck (latency, scaling, edge-cases) and quantitative results",
            ],
            "source_context": f"Tailored from Resume Project: {res_skill1}",
        },
        {
            "category": "Target Job Description Alignment",
            "prompt": (
                f"The target job description{company_label} emphasizes deep proficiency in {jd_skill1} and {jd_skill2}. "
                f"How have you applied these technologies or design principles in production, and how would you approach "
                f"building high-reliability systems to meet our performance standards?"
            ),
            "ideal_answer_points": [
                f"Hands-on demonstration of {jd_skill1} in real-world environments",
                "Reliability patterns: error handling, observability, caching, or failover",
                "Alignment with the company's technical stack and best practices",
            ],
            "source_context": f"Tailored from Job Description: {jd_skill1}",
        },
        {
            "category": "Technical Problem Solving & Architecture",
            "prompt": (
                f"Imagine we need to scale a core service handling high concurrency using {jd_skill1} alongside {res_skill2}. "
                f"How would you design the system to prevent database contention, ensure sub-100ms response times, and monitor health?"
            ),
            "ideal_answer_points": [
                "System design decomposition: load balancer, caching layer, asynchronous queues",
                "Database optimization: indexing, read replicas, sharding, or connection pooling",
                "Observability metrics (p99 latency, error rates) and automated alerts",
            ],
            "source_context": f"Tailored Technical Scenario: {jd_skill1} + {res_skill2}",
        },
        {
            "category": "Behavioral & STAR Leadership",
            "prompt": (
                f"Tell me about a time in your past projects where you faced a critical production bug, unexpected deadline crunch, "
                f"or cross-team disagreement regarding a feature built with {res_skill1}. Using the STAR method, how did you resolve it?"
            ),
            "ideal_answer_points": [
                "Situation: Context of the project constraint or team disagreement",
                "Task: The exact responsibility and challenge owned by the candidate",
                "Action: Specific steps, diplomatic communication, and technical debugging applied",
                "Result: Quantifiable outcome, business impact, and key takeaways learned",
            ],
            "source_context": "Tailored STAR Behavioral Track",
        },
        {
            "category": "Domain Edge Cases & Future Optimization",
            "prompt": (
                f"Reflecting on your experience as detailed in your resume, if you had to rebuild your largest project from scratch "
                f"today to meet modern enterprise standards for {role}, what architectural choices would you change and why?"
            ),
            "ideal_answer_points": [
                "Honest technical self-critique of previous design decisions",
                "Modern patterns: micro-frontends, event-driven architecture, or serverless",
                "Security, maintainability, test automation, and developer ergonomics",
            ],
            "source_context": f"Tailored Architectural Evolution ({role})",
        },
    ]

    questions = []
    for i, t in enumerate(templates[:num_questions]):
        q_id = f"custom_q_{uuid.uuid4().hex[:8]}"
        questions.append(
            Question(
                id=q_id,
                role=role,
                category=t["category"],
                prompt=t["prompt"],
                ideal_answer_points=t["ideal_answer_points"],
                source_context=t["source_context"],
            )
        )
    return questions


def generate_tailored_questions(
    role: str = "SDE",
    num_questions: int = 3,
    resume_text: str = "",
    job_description: str = "",
    company_name: str = "",
    interview_type: str = "Mixed",
) -> List[Question]:
    """
    Main generator function:
    Uses Google Gemini API when configured, falling back smoothly to rule-based synthesis.
    """
    # Clean inputs
    resume_text = (resume_text or "").strip()
    job_description = (job_description or "").strip()
    company_name = (company_name or "").strip()

    # If neither resume nor JD is provided, fall back to standard synthesis
    if len(resume_text) < 15 and len(job_description) < 15:
        return _fallback_tailored_questions(
            role, num_questions, resume_text, job_description, company_name, interview_type
        )

    client = _get_genai_client()
    if not client:
        print("[Question Generator] No Gemini client available. Using heuristic tailored generator.")
        return _fallback_tailored_questions(
            role, num_questions, resume_text, job_description, company_name, interview_type
        )

    # Construct expert interviewer prompt for Gemini
    system_instruction = (
        "You are an elite Lead Interviewer and Hiring Committee Member at a top technology company. "
        "Your task is to review the candidate's actual Resume and the target Job Description (JD), "
        "and craft highly realistic, targeted, and non-generic interview questions.\n"
        "RULES:\n"
        "1. Every question must directly cross-reference specific projects, tools, or metrics in the candidate's resume "
        "   AND align them with the specific expectations of the Job Description.\n"
        "2. Do NOT ask generic textbook questions (e.g. 'What is OOP?'). Ask scenario-based, architecture-probing, "
        "   and experience-validating questions.\n"
        "3. Output MUST be ONLY a valid raw JSON array of question objects matching this schema (no markdown, no backticks):\n"
        "[\n"
        "  {\n"
        '    "id": "custom_q1",\n'
        f'    "role": "{role}",\n'
        '    "category": "Resume Deep-Dive | Technical Architecture | STAR Behavioral | JD Alignment",\n'
        '    "prompt": "The exact question phrased professionally as spoken by the interviewer",\n'
        '    "ideal_answer_points": ["Specific point candidate should mention", "Key technical trade-off", "Result metric"],\n'
        '    "source_context": "Brief tag stating which resume project or JD requirement this addresses"\n'
        "  }\n"
        "]"
    )

    user_prompt = f"""
TARGET ROLE: {role}
TARGET COMPANY: {company_name or "Tech Industry"}
INTERVIEW FOCUS: {interview_type}
TOTAL QUESTIONS REQUIRED: {num_questions}

--- CANDIDATE RESUME ---
{resume_text[:4000]}

--- TARGET JOB DESCRIPTION (JD) ---
{job_description[:4000]}
"""

    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=user_prompt,
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                response_mime_type="application/json",
                temperature=0.3,
            ),
        )

        raw_text = response.text.strip()
        if raw_text.startswith("```"):
            raw_text = raw_text.split("\n", 1)[1].rsplit("```", 1)[0].strip()

        data = json.loads(raw_text)
        if isinstance(data, list) and len(data) > 0:
            result = []
            for item in data[:num_questions]:
                q_id = f"custom_q_{uuid.uuid4().hex[:8]}"
                result.append(
                    Question(
                        id=q_id,
                        role=role,
                        category=item.get("category", "Targeted Technical"),
                        prompt=item.get("prompt", ""),
                        ideal_answer_points=item.get("ideal_answer_points", []),
                        source_context=item.get("source_context", "Custom Resume & JD Alignment"),
                    )
                )
            return result
    except Exception as e:
        print(f"[Question Generator Error] Gemini generation failed: {e}. Falling back to heuristic generator.")

    return _fallback_tailored_questions(
        role, num_questions, resume_text, job_description, company_name, interview_type
    )
