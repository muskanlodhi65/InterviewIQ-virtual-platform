"""
main.py
-------
FastAPI application entrypoint. Wires up routers, CORS, and a health
check. Run with:

    uvicorn main:app --reload

(or just `bash start.sh` from the project root on Replit).
"""

from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from database import is_using_real_mongo
from routers import auth, questions, sessions

app = FastAPI(title=settings.APP_NAME, version=settings.APP_VERSION)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(questions.router)
app.include_router(sessions.router)


@app.get("/")
async def root():
    return {
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "running",
        "database": "MongoDB Atlas" if is_using_real_mongo() else "in-memory (set MONGO_URI to persist)",
    }


@app.get("/health")
async def health():
    return {"status": "ok"}
