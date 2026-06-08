# 🎤 InterviewIQ — AI-Powered Mock Interview & Communication Coach

> A full-stack platform that runs realistic mock interviews and gives you objective, multi-modal feedback on your body language, speech clarity, and answer quality — not just another LLM wrapper.

![Python](https://img.shields.io/badge/Python-3.11-blue?logo=python)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-teal?logo=fastapi)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)
![License](https://img.shields.io/badge/License-MIT-yellow)
![Status](https://img.shields.io/badge/status-Starter%20MVP-brightgreen)

---

## 📖 Overview

Most interview prep is just a friend giving subjective, inconsistent feedback. **InterviewIQ** simulates a real interview through your webcam and scores your answer across three independent AI dimensions:

1. **🧍 Body language** — eye contact & posture confidence (Computer Vision)
2. **🗣️ Delivery** — filler words, speaking pace (Speech Analytics)
3. **🧠 Content** — relevance and STAR-method structure of your answer (NLP)

Everything runs through a real, working pipeline today with clearly-documented upgrade paths to production-grade models (MediaPipe, Whisper, LLM grading) — see [Architecture](#-architecture--current-vs-upgrade-path) below.

## ✨ Features

- 🔐 JWT authentication (signup/login)
- 🎯 Role-specific question banks (SDE, Data Science, HR — easily extendable)
- 🎥 In-browser webcam capture + live speech-to-text (Web Speech API)
- 📊 Per-answer feedback: relevance, structure, eye contact, posture, pace, filler words
- 📈 Session history dashboard with score trends
- 🗄️ MongoDB Atlas ready, with a zero-setup in-memory fallback for local/Replit dev
- 🧩 Every AI module is swappable independently — upgrade CV, speech, or NLP scoring without touching the others

## 🏗️ Architecture — Current vs. Upgrade Path

```
Frontend (React + Vite)
   │  webcam video + live transcript (Web Speech API)
   ▼
Backend (FastAPI)
   ├── routers/auth.py        JWT signup/login
   ├── routers/questions.py   role-based question bank
   ├── routers/sessions.py    orchestrates scoring pipeline
   │
   ├── services/cv_analysis.py     ← posture/eye-contact
   │     TODAY:    seeded mock scorer (deterministic, demoable)
   │     UPGRADE:  plug in MediaPipe Pose + FaceMesh (reuse the
   │               CVA formula from the PostureGuard companion project)
   │
   ├── services/speech_analysis.py ← filler words & pace
   │     TODAY:    real regex-based analysis on the live transcript
   │     UPGRADE:  swap browser transcript for server-side Whisper +
   │               librosa prosody features
   │
   └── services/nlp_scoring.py     ← relevance & STAR structure
         TODAY:    real TF-IDF cosine similarity (scikit-learn) +
                   discourse-marker heuristic — genuinely working,
                   not a placeholder
         UPGRADE:  swap for an LLM-based rubric grader for nuance
```

Each service file has a `USE_REAL_*_MODEL` flag in `config.py` and a docstring with the exact suggested implementation — this repo is built to be *grown into* a production system, one module at a time, which is exactly the kind of incremental engineering story that reads well in an interview about the project itself.

## 🛠️ Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 18, Vite, React Router, Axios |
| Backend | FastAPI, Pydantic v2, Uvicorn |
| Auth | python-jose (JWT), passlib + bcrypt |
| Database | MongoDB Atlas (via Motor) with in-memory fallback |
| NLP | scikit-learn (TF-IDF) |
| CV (upgrade path) | MediaPipe Pose + FaceMesh |
| Speech (upgrade path) | OpenAI Whisper (local, free) |

## 🚀 Getting Started on Replit

1. Import this repo into a new Replit (Import from GitHub).
2. Click **Run** — `start.sh` installs backend deps and boots FastAPI on port 8000.
3. Open a **second Shell tab** and start the frontend dev server:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
4. Open the webview on port 5173 (Replit auto-detects it) — the Vite dev proxy forwards `/api/*` to the FastAPI backend automatically.
5. *(Optional)* Add a `MONGO_URI` in Replit's **Secrets** tab once you're ready for persistent storage — until then, everything works against the built-in in-memory store.

## 💻 Running Locally

```bash
# Backend
cd backend
pip install -r requirements.txt
uvicorn main:app --reload

# Frontend (separate terminal)
cd frontend
npm install
npm run dev
```

Visit `http://localhost:5173`.

## 📁 Project Structure

```
interviewiq/
├── .replit / replit.nix / start.sh   # Replit run configuration
├── .env.example                       # documented config, safe to commit
├── backend/
│   ├── main.py                        # FastAPI app entrypoint
│   ├── config.py                      # settings from env vars
│   ├── database.py                    # Mongo + in-memory fallback
│   ├── models.py                      # Pydantic schemas
│   ├── routers/                       # auth, questions, sessions
│   ├── services/                      # cv_analysis, speech_analysis, nlp_scoring
│   └── data/questions_bank.json       # seed question bank
└── frontend/
    ├── src/pages/                     # Home, Interview, Dashboard, Results
    ├── src/components/                # VideoRecorder, ScoreCard
    └── src/api/client.js              # axios wrapper
```

## 🗺️ Roadmap

- [ ] Swap CV stub for real MediaPipe-based posture/eye-contact scoring
- [ ] Server-side Whisper transcription for higher accuracy than browser STT
- [ ] LLM-based rubric grading as an alternative to the TF-IDF baseline
- [ ] Video playback with synced feedback timestamps
- [ ] Admin panel for adding custom question banks
- [ ] Exportable PDF interview report

## 🤝 Contributing

Issues and PRs welcome — open an issue first for larger changes.

## 📄 License

MIT — see [LICENSE](LICENSE).

## 👩‍💻 Author

**Muskan Lodhi** — B.Tech AI/ML, Indore Institute of Science & Technology
GitHub: [@muskanlodhi65](https://github.com/muskanlodhi65)
