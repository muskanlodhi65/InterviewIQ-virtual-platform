"""
config.py
---------
Central settings for the InterviewIQ backend. Reads from environment
variables (Replit "Secrets" tab) with sensible local-dev defaults, so the
app runs out of the box even before you've configured MongoDB Atlas.
"""

import os


class Settings:
    APP_NAME: str = "InterviewIQ API"
    APP_VERSION: str = "0.1.0"

    # --- Database ---
    # Leave MONGO_URI unset to run on the built-in in-memory store
    # (great for local/Replit dev; swap in a real MongoDB Atlas URI for
    # persistence). Set it via Replit's Secrets tab, never hardcode it.
    MONGO_URI: str = os.environ.get("MONGO_URI", "")
    MONGO_DB_NAME: str = os.environ.get("MONGO_DB_NAME", "interviewiq")

    # --- Auth ---
    JWT_SECRET: str = os.environ.get("JWT_SECRET", "dev-only-insecure-secret-change-me")
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRY_MINUTES: int = 60 * 24  # 24 hours

    # --- CORS ---
    ALLOWED_ORIGINS: list = os.environ.get(
        "ALLOWED_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173"
    ).split(",")

    # --- ML service toggles ---
    # Flip these on once you plug in real models; stubs run by default so
    # the whole app is demoable on day one.
    USE_REAL_CV_MODEL: bool = os.environ.get("USE_REAL_CV_MODEL", "false").lower() == "true"
    USE_REAL_SPEECH_MODEL: bool = os.environ.get("USE_REAL_SPEECH_MODEL", "false").lower() == "true"
    # --- LLM API ---
    GEMINI_API_KEY: str = os.environ.get("GEMINI_API_KEY", "")


settings = Settings()
