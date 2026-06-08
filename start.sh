#!/usr/bin/env bash
# PostureGuard-style startup: installs deps (first run only, fast on repeat)
# and boots the FastAPI backend. Run the frontend dev server separately in
# a second Replit Shell tab with:  cd frontend && npm install && npm run dev

set -e

echo "== InterviewIQ: installing backend dependencies =="
pip install -q -r backend/requirements.txt

echo "== InterviewIQ: starting FastAPI backend on :8000 =="
cd backend
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
