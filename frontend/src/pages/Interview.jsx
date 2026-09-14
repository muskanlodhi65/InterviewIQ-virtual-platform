import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { createSession, getRoles, submitAnswer } from "../api/client";
import VideoRecorder from "../components/VideoRecorder";
import ScoreCard from "../components/ScoreCard";

const SAMPLE_RESUME = `Muskan Lodhi — Full Stack AI/ML Developer & SDE
Education: B.Tech in Artificial Intelligence & Machine Learning (IIST)
Technical Skills: Python, FastAPI, React.js, Vite, Node.js, JavaScript, OpenCV, PyTorch, TensorFlow, Google Gemini API, MongoDB, Docker, RESTful APIs, Git

Key Projects:
1. SUVIDHA (Smart Civic Service Platform - National Hackathon Winner ₹3L):
   - Built industrial touchscreen React interface & FastAPI backend for municipal complaint resolution.
   - Integrated autonomous AI complaint classification pipeline to route issues automatically to municipal departments with offline resilience.
2. FactSeeker (Autonomous Multi-Agent Misinformation Detection System):
   - Developed multi-agent verification system combining web scraping, HuggingFace BERT classification, and Google Gemini API synthesis.
   - Computes confidence scores with explanatory factual rationales.
3. PostureGuard (Real-time Computer Vision Ergonomic Tracker):
   - Implemented webcam pose estimation calculating Craniovertebral Angle (CVA) using MediaPipe & OpenCV to correct sitting posture.`;

const SAMPLE_JD = `Position: Software Development Engineer (Full Stack & AI Systems)
Company: NextGen Tech Solutions
Key Responsibilities:
- Architect, build, and scale production-ready web applications using React.js, TypeScript, and FastAPI microservices.
- Integrate Generative AI models (LLMs, prompt engineering, RAG pipelines) into high-performance user interfaces.
- Design resilient RESTful APIs, manage MongoDB/PostgreSQL schemas, and optimize concurrency for sub-100ms response times.
- Collaborate with cross-functional product and engineering teams using Agile/Scrum best practices.

Qualifications:
- 2+ years equivalent experience with Python, FastAPI, and React/Next.js.
- Strong understanding of Computer Vision or NLP applications and LLM API integrations.
- Demonstrated experience delivering full-lifecycle software projects with clean modular architecture.`;

export default function Interview() {
  const navigate = useNavigate();

  const [roles, setRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState("SDE");
  const [numQuestions, setNumQuestions] = useState(3);

  // Resume & Job Description targeting state
  const [targetingMode, setTargetingMode] = useState("personalized"); // "personalized" | "standard"
  const [resumeText, setResumeText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [interviewType, setInterviewType] = useState("Mixed");
  const [isGenerating, setIsGenerating] = useState(false);

  const [session, setSession] = useState(null); // { session_id, questions }
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lastFeedback, setLastFeedback] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);

  const fileInputRef = useRef(null);

  useEffect(() => {
    getRoles()
      .then((r) => {
        setRoles(r);
        if (r.length && !selectedRole) setSelectedRole(r[0]);
      })
      .catch(() => setError("Could not load roles. Is the backend running?"));
  }, []);

  // Voice AI Agent: Speak question when current question changes
  const speakQuestion = (text) => {
    if (!("speechSynthesis" in window)) return;

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const englishVoice =
      voices.find((v) => (v.lang.includes("en-US") || v.lang.includes("en-GB")) && v.name.includes("Natural")) ||
      voices.find((v) => v.lang.startsWith("en"));

    if (englishVoice) utterance.voice = englishVoice;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    if (session && session.questions[currentIndex] && !lastFeedback) {
      const prompt = session.questions[currentIndex].prompt;
      const timer = setTimeout(() => {
        speakQuestion(prompt);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [session, currentIndex, lastFeedback]);

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.name.endsWith(".txt") || file.name.endsWith(".md") || file.type.includes("text")) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setResumeText(event.target.result);
      };
      reader.readAsText(file);
    } else {
      // For PDF/Word docs without local OCR, prompt candidate
      alert("Uploaded: " + file.name + "\nNote: For best results, paste your text summary or plain text resume below.");
    }
  };

  const startSession = async () => {
    setError("");
    setIsGenerating(true);
    try {
      const payload = {
        role: selectedRole || "SDE",
        num_questions: numQuestions,
        resume_text: targetingMode === "personalized" ? resumeText : "",
        job_description: targetingMode === "personalized" ? jobDescription : "",
        company_name: companyName,
        interview_type: interviewType,
      };

      const data = await createSession(payload);
      setSession(data);
      setCurrentIndex(0);
      setLastFeedback(null);
    } catch (err) {
      setError(err.response?.data?.detail || "Could not start session. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAnswerFinished = async ({ transcript, durationSeconds }) => {
    window.speechSynthesis.cancel();
    setSubmitting(true);
    setError("");
    try {
      const question = session.questions[currentIndex];
      const feedback = await submitAnswer(session.session_id, {
        question_id: question.id,
        transcript: transcript || "",
        duration_seconds: durationSeconds,
      });
      setLastFeedback(feedback);
    } catch (err) {
      setError(err.response?.data?.detail || "Could not submit answer.");
    } finally {
      setSubmitting(false);
    }
  };

  const nextQuestion = () => {
    window.speechSynthesis.cancel();
    setLastFeedback(null);
    if (currentIndex + 1 < session.questions.length) {
      setCurrentIndex(currentIndex + 1);
    } else {
      navigate(`/results/${session.session_id}`);
    }
  };

  if (!session) {
    return (
      <div className="setup-wrapper">
        <div className="setup-card-main">
          <div className="setup-header-title">
            <span>🎯</span> Customize Your Mock Interview
          </div>
          <p className="setup-header-subtitle">
            Provide your <strong>Resume</strong> and target <strong>Job Description (JD)</strong> so our AI can cross-examine
            your real projects and probe qualifications expected for this specific role.
          </p>

          {/* Mode Tabs */}
          <div className="targeting-mode-tabs">
            <button
              className={`targeting-tab-btn ${targetingMode === "personalized" ? "active" : ""}`}
              onClick={() => setTargetingMode("personalized")}
            >
              <span>✨</span> Tailor by Resume & Job Description (Recommended)
            </button>
            <button
              className={`targeting-tab-btn ${targetingMode === "standard" ? "active" : ""}`}
              onClick={() => setTargetingMode("standard")}
            >
              <span>📚</span> Standard Role Question Bank
            </button>
          </div>

          {/* Basic Metadata Row */}
          <div className="setup-meta-grid">
            <div className="input-group">
              <label>Target Role</label>
              <select value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)}>
                {roles.length > 0 ? (
                  roles.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="SDE">Software Development Engineer (SDE)</option>
                    <option value="Data Science">Data Science & AI/ML</option>
                    <option value="HR">HR & Behavioral</option>
                  </>
                )}
              </select>
            </div>

            <div className="input-group">
              <label>Target Company (Optional)</label>
              <input
                type="text"
                placeholder="e.g. Google, Amazon, Startup"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
              />
            </div>

            <div className="input-group">
              <label>Interview Focus / Round</label>
              <select value={interviewType} onChange={(e) => setInterviewType(e.target.value)}>
                <option value="Mixed">Mixed (Projects + Tech + STAR)</option>
                <option value="Technical">Technical Architecture & Coding</option>
                <option value="Behavioral">Behavioral & Leadership (STAR)</option>
              </select>
            </div>
          </div>

          {/* Personalized Resume & JD Inputs */}
          {targetingMode === "personalized" && (
            <div className="targeting-inputs-grid">
              {/* Resume Card */}
              <div className="targeting-card">
                <div className="targeting-card-head">
                  <div className="targeting-card-title">
                    <span>📄</span> Candidate Resume / Experience
                  </div>
                  <button
                    type="button"
                    className="quick-sample-btn"
                    onClick={() => setResumeText(SAMPLE_RESUME)}
                  >
                    ⚡ Load Sample Resume
                  </button>
                </div>
                <textarea
                  className="targeting-textarea"
                  placeholder="Paste your resume text here (Projects, work experience, tech stack, key accomplishments)..."
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                />
                <div className="targeting-file-upload">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept=".txt,.md,.pdf,.doc,.docx"
                    style={{ display: "none" }}
                    onChange={handleFileUpload}
                  />
                  <span
                    className="file-upload-label"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    📎 Or upload resume (.txt, .md, .pdf)
                  </span>
                  {resumeText && (
                    <span style={{ fontSize: "11px", color: "#3fb950", marginLeft: "auto" }}>
                      ✓ {resumeText.length} characters loaded
                    </span>
                  )}
                </div>
              </div>

              {/* Job Description Card */}
              <div className="targeting-card">
                <div className="targeting-card-head">
                  <div className="targeting-card-title">
                    <span>🎯</span> Target Job Description (JD)
                  </div>
                  <button
                    type="button"
                    className="quick-sample-btn"
                    onClick={() => setJobDescription(SAMPLE_JD)}
                  >
                    ⚡ Load Sample JD
                  </button>
                </div>
                <textarea
                  className="targeting-textarea"
                  placeholder="Paste the target job description or core requirements from LinkedIn, company career page..."
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                />
                <div style={{ marginTop: "10px", display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: "12px", color: "var(--text-dim)" }}>
                    AI matches technical qualifications & behavioral rubrics
                  </span>
                  {jobDescription && (
                    <span style={{ fontSize: "11px", color: "#3fb950" }}>
                      ✓ {jobDescription.length} characters loaded
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Number of Questions & Action Button */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "16px", marginTop: "10px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <label style={{ fontSize: "13px", color: "#c9d1d9", fontWeight: "600" }}>
                Number of questions:
              </label>
              <select
                value={numQuestions}
                onChange={(e) => setNumQuestions(Number(e.target.value))}
                style={{ width: "90px", padding: "8px" }}
              >
                <option value={3}>3 Questions</option>
                <option value={5}>5 Questions</option>
                <option value={7}>7 Questions</option>
              </select>
            </div>

            <button
              className="btn btn-primary"
              onClick={startSession}
              disabled={isGenerating || !selectedRole}
              style={{ padding: "12px 28px", fontSize: "15px", display: "flex", alignItems: "center", gap: "8px" }}
            >
              {isGenerating ? (
                <>
                  <span className="spinner-icon"></span>
                  <span>Generating Tailored Questions with AI...</span>
                </>
              ) : (
                <>
                  <span>🚀</span>
                  <span>Begin Tailored Interview</span>
                </>
              )}
            </button>
          </div>

          {isGenerating && (
            <div className="loading-interview-banner" style={{ marginTop: "20px" }}>
              <span className="spinner-icon"></span>
              <div>
                <strong>Analyzing Resume & Job Description...</strong>
                <p style={{ margin: "4px 0 0", fontSize: "12.5px", color: "#c9d1d9" }}>
                  Google Gemini AI is extracting your key project achievements and crafting non-generic interview questions.
                </p>
              </div>
            </div>
          )}

          {error && <p className="error-text" style={{ marginTop: "16px" }}>{error}</p>}
        </div>
      </div>
    );
  }

  const question = session.questions[currentIndex];

  return (
    <div className="interview-page">
      <div className="progress-label">
        Question {currentIndex + 1} of {session.questions.length}
      </div>

      {question.source_context && (
        <div className="source-context-badge">
          <span>✨</span>
          <span>{question.source_context}</span>
        </div>
      )}

      <h2 className="question-prompt">{question.prompt}</h2>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "1rem" }}>
        <span className="question-category">{question.category}</span>
        <button
          onClick={() => speakQuestion(question.prompt)}
          style={{
            background: isSpeaking ? "#238636" : "rgba(255,255,255,0.08)",
            color: "#fff",
            border: "1px solid rgba(255,255,255,0.15)",
            padding: "4px 12px",
            borderRadius: "16px",
            cursor: "pointer",
            fontSize: "0.85rem",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          {isSpeaking ? "🔊 AI Speaking..." : "🔊 Replay Question"}
        </button>
      </div>

      {!lastFeedback && <VideoRecorder onFinish={handleAnswerFinished} />}

      {submitting && <p className="hint-text">Analyzing your answer with Multi-Modal AI...</p>}
      {error && <p className="error-text">{error}</p>}

      {lastFeedback && (
        <>
          <ScoreCard feedback={lastFeedback} />
          <button className="btn btn-primary" onClick={nextQuestion}>
            {currentIndex + 1 < session.questions.length ? "Next Question →" : "View Full Results →"}
          </button>
        </>
      )}
    </div>
  );
}
