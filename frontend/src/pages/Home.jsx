import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login, setAuthToken, signup } from "../api/client";

export default function Home() {
  const navigate = useNavigate();
  const [mode, setMode] = useState("login"); // "login" | "signup"
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("candidate"); // "candidate" | "interviewer" | "admin"
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Interactive Pipeline Explorer State
  const [activePipelineStep, setActivePipelineStep] = useState(0);

  // Interactive FAQ Accordion State
  const [openFaq, setOpenFaq] = useState(null);

  const pipelineStages = [
    {
      id: "ingestion",
      stepNum: "01",
      name: "In-Browser Multi-Modal Ingestion",
      shortDesc: "Simultaneous webcam stream capture & continuous speech recognition.",
      badge: "Edge Stream Processing",
      fullDesc:
        "Captures real-time 1080p webcam frames alongside an uninterrupted audio stream using the browser Web Speech API. Ensures zero latency and privacy-friendly on-device audio buffering.",
      specs: [
        { label: "Video Feed", val: "WebRTC / MediaStream (30 FPS)" },
        { label: "Speech Engine", val: "Web Speech API (Real-time STT)" },
        { label: "Frame Rate", val: "Zero-latency in-browser capture" },
        { label: "Privacy", val: "100% on-device capture buffer" },
      ],
      codeSnippet: `// Ingestion Pipeline
navigator.mediaDevices.getUserMedia({ video: true, audio: true })
  .then(stream => {
    videoRef.current.srcObject = stream;
    recognition.continuous = true;
    recognition.start();
  });`,
    },
    {
      id: "cv",
      stepNum: "02",
      name: "Computer Vision Visual Analytics",
      shortDesc: "Keypoint tracking for posture alignment & eye contact stability.",
      badge: "Vision AI Engine",
      fullDesc:
        "Processes facial orientation and skeletal pose landmarks via MediaPipe Pose & FaceMesh. Computes Craniovertebral Angle (CVA) for posture confidence and gaze angle to evaluate candidate eye contact.",
      specs: [
        { label: "Posture Metric", val: "Craniovertebral Angle (CVA)" },
        { label: "Eye Tracking", val: "Pupil-to-Camera Gaze Vector" },
        { label: "Engine", val: "MediaPipe Pose + FaceMesh" },
        { label: "Sampling", val: "15 keyframe samples/sec" },
      ],
      codeSnippet: `# Computer Vision Scoring
def analyze_body_language(video_landmarks):
    eye_contact = calculate_gaze_stability(video_landmarks.face)
    posture = calculate_cva_angle(video_landmarks.pose)
    return {"eye_contact": eye_contact, "posture": posture}`,
    },
    {
      id: "speech",
      stepNum: "03",
      name: "Acoustic & Speech Analytics",
      shortDesc: "Pace calculation (WPM), speech hesitations & filler word detection.",
      badge: "Speech Analytics",
      fullDesc:
        "Analyzes raw verbal flow to compute words per minute (WPM), cadence variations, and filler word density (such as 'um', 'uh', 'like', 'basically') to quantify speaking clarity and calm delivery.",
      specs: [
        { label: "Pacing Metric", val: "Words Per Minute (Target: 120-150)" },
        { label: "Filler Dictionary", val: "um, uh, like, you know, basically" },
        { label: "Hesitation", val: "Silence gap & cadence detection" },
        { label: "Feedback", val: "Clarity & articulation tips" },
      ],
      codeSnippet: `# Speech Analytics Service
def analyze_speech(transcript, duration_seconds):
    words = transcript.split()
    wpm = (len(words) / duration_seconds) * 60
    filler_count = count_fillers(transcript, FILLER_WORDS)
    return {"wpm": wpm, "filler_count": filler_count}`,
    },
    {
      id: "nlp",
      stepNum: "04",
      name: "Semantic NLP & Google Gemini LLM",
      shortDesc: "Rubric relevance scoring & STAR-method answer structuring.",
      badge: "Cognitive Intelligence",
      fullDesc:
        "Employs scikit-learn TF-IDF cosine similarity for domain keyword relevance, combined with Google Gemini 1.5 LLM for in-depth STAR (Situation, Task, Action, Result) framework evaluation and executive grammar enhancement.",
      specs: [
        { label: "Relevance Metric", val: "TF-IDF Cosine Similarity" },
        { label: "Rubric Grader", val: "Google Gemini 1.5 LLM" },
        { label: "Behavioral Logic", val: "STAR Framework Verification" },
        { label: "Language Polish", val: "Pronunciation & Grammar Fixes" },
      ],
      codeSnippet: `# Gemini LLM Rubric Grading
prompt = f"""Evaluate response using STAR method:
Question: {question}
Candidate: {transcript}
Provide grammar feedback and score (0-100)."""
analysis = gemini_model.generate_content(prompt)`,
    },
    {
      id: "scoring",
      stepNum: "05",
      name: "Multi-Modal Score Aggregation",
      shortDesc: "Unified 0-100 composite score with actionable coaching feedback.",
      badge: "Holistic Evaluation",
      fullDesc:
        "Fuses visual body language, acoustic pacing, and semantic content scores into a weighted 0-100 interview readiness score. Provides clear radar breakdowns and personalized coaching drills.",
      specs: [
        { label: "Composite Range", val: "0 to 100 Holistic Index" },
        { label: "Dimensions", val: "Posture, Eyes, Pace, Fillers, Content" },
        { label: "Reports", val: "Per-question & session trends" },
        { label: "Storage", val: "MongoDB Atlas / In-Memory cache" },
      ],
      codeSnippet: `# Unified Multi-Modal Aggregator
overall = (
    0.35 * content_score +
    0.25 * eye_contact +
    0.15 * posture +
    0.15 * speech_pace +
    0.10 * (100 - filler_penalty)
)`,
    },
  ];

  const benefits = [
    {
      icon: "🎯",
      title: "Objective Multi-Modal Assessment",
      desc: "Goes beyond simple text chat. Evaluates real physical eye contact, posture confidence, speech cadence, and domain expertise simultaneously.",
      tag: "Vision + Speech + NLP",
    },
    {
      icon: "🗣️",
      title: "Autonomous Voice AI Interviewer",
      desc: "Interactive Text-to-Speech agent reads interview prompts aloud with human-like cadence, creating the authentic pressure of a real technical round.",
      tag: "Real-Time TTS Agent",
    },
    {
      icon: "⚡",
      title: "Instant Multi-Dimensional Feedback",
      desc: "No waiting days for mentor notes. Receive immediate granular scores, filler word counts, and executive rephrasing suggestions right after answering.",
      tag: "Instant 0-100 Scorecard",
    },
    {
      icon: "🧠",
      title: "STAR-Method & Grammar Polish",
      desc: "Integrated Google Gemini LLM highlights missing Action or Result steps in your stories and flags phrasing errors for executive polish.",
      tag: "Gemini 1.5 Integrated",
    },
    {
      icon: "👥",
      title: "Multi-Role Practice Matrix",
      desc: "Tailored question tracks for Candidates sharpening skills, Interviewers practicing candidate evaluation, and Admins configuring custom question pools.",
      tag: "Candidate · Interviewer · Admin",
    },
    {
      icon: "🔒",
      title: "Edge-First Privacy & Zero Setup",
      desc: "Fully functional in modern browsers with zero driver installation. Video frames are processed locally with strict privacy standards.",
      tag: "Private & Zero-Config",
    },
  ];

  const workingSteps = [
    {
      num: "1",
      title: "Select Your Track & Role",
      desc: "Choose your role (Candidate, Interviewer, or Admin) and pick from curated question banks including Software Engineering (SDE), Data Science, and HR Behavioral.",
    },
    {
      num: "2",
      title: "AI Voice Agent Delivers the Prompt",
      desc: "The autonomous AI interviewer speaks the question aloud using speech synthesis, simulating authentic face-to-face interview conditions.",
    },
    {
      num: "3",
      title: "Answer Naturally on Live Camera",
      desc: "Speak your response while the in-browser pipeline records video landmarks and transcribes your speech in real time with continuous recognition.",
    },
    {
      num: "4",
      title: "Multi-Modal AI Pipeline Executes",
      desc: "FastAPI orchestrates parallel evaluation: Computer Vision tracks posture & gaze, acoustic filters count filler words, and Gemini LLM analyzes STAR answer structure.",
    },
    {
      num: "5",
      title: "Review Actionable Coaching Scorecard",
      desc: "Inspect your overall score, category radar, filler word highlights, grammar fixes, and track your performance trends on the dashboard.",
    },
  ];

  const faqs = [
    {
      q: "How does the multi-modal pipeline calculate my overall score?",
      a: "InterviewIQ combines three independent AI dimensions into a balanced 0-100 score: Visual confidence (eye contact & posture stability via Computer Vision), Delivery metrics (speaking pace in WPM & filler word frequency), and Content quality (TF-IDF keyword relevance & Google Gemini STAR-method answer evaluation).",
    },
    {
      q: "What makes InterviewIQ different from standard ChatGPT interview bots?",
      a: "ChatGPT only reads static text. In contrast, InterviewIQ is a true multi-modal platform that watches your posture, tracks eye contact, listens to your speaking cadence, counts vocal hesitations ('um', 'uh', 'like'), and uses Google Gemini to evaluate real-time conversational delivery.",
    },
    {
      q: "Is my webcam video or audio recorded and stored on servers?",
      a: "No. Video frames and live audio streams are processed on-device in your browser to extract landmarks and transcripts. We do not store raw video recordings on remote servers, ensuring candidate privacy and compliance.",
    },
    {
      q: "How does Google Gemini evaluate my answers and grammar?",
      a: "Once your response transcript is generated, it is passed to our Google Gemini 1.5 LLM integration alongside the target question. Gemini checks whether your response adheres to the STAR (Situation, Task, Action, Result) framework, highlights grammatical flaws, and provides high-impact alternative phrasings.",
    },
    {
      q: "What roles and interview tracks are currently supported?",
      a: "The platform offers role-specific tracks for Software Development Engineers (SDE - algorithms, systems, OOP), Data Science (machine learning, statistics, SQL), and HR/Behavioral questions (leadership, conflict resolution, cultural fit).",
    },
    {
      q: "Can interviewers and hiring managers also use the platform?",
      a: "Yes! InterviewIQ includes dedicated Role-Based Access Control (RBAC). Candidates use it to prepare, while Interviewers and Admins can practice evaluating answers, managing candidate sessions, and reviewing custom question pools.",
    },
  ];

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = mode === "login" ? await login(email, password) : await signup(name, email, password, role);
      setAuthToken(data.access_token);
      localStorage.setItem("interviewiq_user", JSON.stringify(data.user));
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.detail || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="landing-wrapper">
      {/* Sticky Navigation Bar */}
      <header className="landing-nav">
        <a href="#" className="brand-logo">
          <div className="brand-icon">🎤</div>
          <span>InterviewIQ</span>
          <span className="brand-version">Multi-Modal v2.0</span>
        </a>

        <nav className="nav-links">
          <a href="#pipeline" onClick={(e) => { e.preventDefault(); scrollToSection("pipeline"); }}>
            Pipeline
          </a>
          <a href="#how-it-works" onClick={(e) => { e.preventDefault(); scrollToSection("how-it-works"); }}>
            How It Works
          </a>
          <a href="#benefits" onClick={(e) => { e.preventDefault(); scrollToSection("benefits"); }}>
            Benefits
          </a>
          <a href="#faq" onClick={(e) => { e.preventDefault(); scrollToSection("faq"); }}>
            FAQ
          </a>
          <a href="#auth-section" className="nav-cta-btn" onClick={(e) => { e.preventDefault(); scrollToSection("auth-section"); }}>
            Get Started
          </a>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="landing-hero">
        <div className="hero-pill">
          <span>✨</span> Next-Gen AI Interview Intelligence
        </div>

        <h1 className="hero-title">
          Master High-Stakes Interviews with <span className="hero-gradient-text">Multi-Modal AI</span>
        </h1>

        <p className="hero-subtitle">
          Experience realistic mock interviews evaluated across Computer Vision posture, acoustic speech pacing,
          and Google Gemini NLP answer grading. Objective, bias-free, and real-time.
        </p>

        <div className="hero-actions">
          <button className="btn-hero-primary" onClick={() => scrollToSection("auth-section")}>
            🚀 Start Practice Session
          </button>
          <button className="btn-hero-secondary" onClick={() => scrollToSection("pipeline")}>
            🔍 Explore AI Pipeline
          </button>
        </div>

        {/* Hero Interactive Showcase Simulator */}
        <div className="hero-showcase-box">
          <div className="showcase-header-bar">
            <div className="showcase-status">
              <span className="pulse-dot"></span>
              <span>LIVE MULTI-MODAL PIPELINE SIMULATION</span>
            </div>
            <span style={{ fontSize: "12px", color: "var(--text-dim)" }}>FastAPI + React + Gemini 1.5</span>
          </div>

          <div className="showcase-chips">
            <div className="showcase-chip">
              <div className="chip-title">🎯 STAR Answer Relevance</div>
              <div className="chip-val">94% <span className="chip-sub">Top Tier</span></div>
            </div>
            <div className="showcase-chip">
              <div className="chip-title">👁️ Eye Contact Stability</div>
              <div className="chip-val">96% <span className="chip-sub">Direct</span></div>
            </div>
            <div className="showcase-chip">
              <div className="chip-title">🎙️ Speaking Cadence</div>
              <div className="chip-val">135 <span className="chip-sub">WPM Optimal</span></div>
            </div>
            <div className="showcase-chip">
              <div className="chip-title">⚡ Filler Word Frequency</div>
              <div className="chip-val">0.4% <span className="chip-sub">Ultra Clear</span></div>
            </div>
          </div>
        </div>
      </section>

      {/* Pipeline Section */}
      <section id="pipeline" className="landing-section">
        <div className="section-head">
          <span className="section-pill">Project Pipelining & Architecture</span>
          <h2 className="section-title">The Multi-Modal Intelligence Engine</h2>
          <p className="section-desc">
            InterviewIQ orchestrates multiple state-of-the-art AI modules concurrently. Click through any stage below
            to inspect its underlying architecture, data streams, and scoring logic.
          </p>
        </div>

        <div className="pipeline-container">
          {/* Stage Selector List */}
          <div className="pipeline-list">
            {pipelineStages.map((stage, idx) => (
              <div
                key={stage.id}
                className={`pipeline-step-item ${activePipelineStep === idx ? "active" : ""}`}
                onClick={() => setActivePipelineStep(idx)}
              >
                <div className="pipeline-number">{stage.stepNum}</div>
                <div className="pipeline-info">
                  <h4>{stage.name}</h4>
                  <p>{stage.shortDesc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Active Stage Deep Dive Card */}
          <div className="pipeline-detail-card">
            <span className="pipeline-badge">{pipelineStages[activePipelineStep].badge}</span>
            <h3 className="pipeline-detail-title">{pipelineStages[activePipelineStep].name}</h3>
            <p className="pipeline-detail-desc">{pipelineStages[activePipelineStep].fullDesc}</p>

            <div className="pipeline-specs-grid">
              {pipelineStages[activePipelineStep].specs.map((spec, i) => (
                <div key={i} className="spec-box">
                  <div className="spec-title">{spec.label}</div>
                  <div className="spec-val">{spec.val}</div>
                </div>
              ))}
            </div>

            <div className="spec-title" style={{ marginBottom: "8px" }}>Implementation Blueprint</div>
            <pre className="pipeline-code-preview">
              <code>{pipelineStages[activePipelineStep].codeSnippet}</code>
            </pre>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="landing-section" style={{ background: "rgba(22, 27, 34, 0.4)" }}>
        <div className="section-head">
          <span className="section-pill">Working Workflow</span>
          <h2 className="section-title">How InterviewIQ Works</h2>
          <p className="section-desc">
            From role selection to real-time AI scoring, discover how candidate responses are processed seamlessly.
          </p>
        </div>

        <div className="steps-container">
          {workingSteps.map((step) => (
            <div key={step.num} className="step-card">
              <div className="step-badge">{step.num}</div>
              <div className="step-content">
                <h3>{step.title}</h3>
                <p>{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="landing-section">
        <div className="section-head">
          <span className="section-pill">Why InterviewIQ</span>
          <h2 className="section-title">Core Benefits & Competitive Edge</h2>
          <p className="section-desc">
            Engineered specifically to solve the pitfalls of subjective human mocks and one-dimensional chatbot prompts.
          </p>
        </div>

        <div className="benefits-grid">
          {benefits.map((b, idx) => (
            <div key={idx} className="benefit-card">
              <div className="benefit-icon-wrapper">{b.icon}</div>
              <h3 className="benefit-title">{b.title}</h3>
              <p className="benefit-desc">{b.desc}</p>
              <span className="benefit-tag">{b.tag}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Interactive FAQ Section */}
      <section id="faq" className="landing-section" style={{ background: "rgba(22, 27, 34, 0.4)" }}>
        <div className="section-head">
          <span className="section-pill">Frequently Asked Questions</span>
          <h2 className="section-title">Everything You Need to Know</h2>
          <p className="section-desc">
            Have questions about privacy, scoring models, or role setup? Find comprehensive answers below.
          </p>
        </div>

        <div className="faq-container">
          {faqs.map((faq, index) => {
            const isOpen = openFaq === index;
            return (
              <div key={index} className={`faq-item ${isOpen ? "open" : ""}`}>
                <button className="faq-question-btn" onClick={() => toggleFaq(index)}>
                  <span>{faq.q}</span>
                  <span className="faq-icon">{isOpen ? "✕" : "＋"}</span>
                </button>
                {isOpen && <div className="faq-answer">{faq.a}</div>}
              </div>
            );
          })}
        </div>
      </section>

      {/* Seamless Authentication Section */}
      <section id="auth-section" className="auth-section">
        <div className="section-head">
          <span className="section-pill">Access Your Portal</span>
          <h2 className="section-title">Get Started with InterviewIQ</h2>
          <p className="section-desc">
            Sign in to your account or create a new profile to begin your personalized interview coaching session.
          </p>
        </div>

        <div className="auth-container-home">
          <div className="auth-card">
            <div className="mode-toggle">
              <button className={mode === "login" ? "active" : ""} onClick={() => setMode("login")}>
                Log In
              </button>
              <button className={mode === "signup" ? "active" : ""} onClick={() => setMode("signup")}>
                Sign Up
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              {mode === "signup" && (
                <>
                  <input
                    type="text"
                    placeholder="Full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                  <div style={{ marginBottom: "0.8rem", textAlign: "left" }}>
                    <label style={{ fontSize: "0.85rem", color: "#8b949e", display: "block", marginBottom: "4px" }}>
                      Select Account Role:
                    </label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "10px",
                        borderRadius: "8px",
                        background: "#0d1117",
                        color: "#fff",
                        border: "1px solid var(--border)",
                      }}
                    >
                      <option value="candidate">🎯 Candidate (Practice Mock Interviews)</option>
                      <option value="interviewer">👨‍💼 Interviewer (Practice & Evaluate)</option>
                      <option value="admin">🔑 Admin (Question & System Management)</option>
                    </select>
                  </div>
                </>
              )}
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
              {error && <p className="error-text">{error}</p>}
              <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: "100%", marginTop: "8px" }}>
                {loading ? "Please wait..." : mode === "login" ? "Log In to Dashboard" : "Create Account & Start"}
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-content">
          <div className="footer-copy">
            <strong>InterviewIQ</strong> — AI-Powered Mock Interview & Communication Platform.
          </div>
          <div className="footer-links">
            <a href="#pipeline" onClick={(e) => { e.preventDefault(); scrollToSection("pipeline"); }}>Pipeline</a>
            <a href="#benefits" onClick={(e) => { e.preventDefault(); scrollToSection("benefits"); }}>Benefits</a>
            <a href="#how-it-works" onClick={(e) => { e.preventDefault(); scrollToSection("how-it-works"); }}>Workflow</a>
            <a href="#faq" onClick={(e) => { e.preventDefault(); scrollToSection("faq"); }}>FAQ</a>
            <a href="https://github.com/muskanlodhi65/InterviewIQ-virtual-platform" target="_blank" rel="noreferrer">
              GitHub Repo
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

