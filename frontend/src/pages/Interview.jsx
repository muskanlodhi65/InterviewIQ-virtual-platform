import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createSession, getRoles, submitAnswer } from "../api/client";
import VideoRecorder from "../components/VideoRecorder";
import ScoreCard from "../components/ScoreCard";

export default function Interview() {
  const navigate = useNavigate();

  const [roles, setRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState("");
  const [numQuestions, setNumQuestions] = useState(3);

  const [session, setSession] = useState(null); // { session_id, questions }
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lastFeedback, setLastFeedback] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getRoles()
      .then((r) => {
        setRoles(r);
        if (r.length) setSelectedRole(r[0]);
      })
      .catch(() => setError("Could not load roles. Is the backend running?"));
  }, []);

  const startSession = async () => {
    setError("");
    try {
      const data = await createSession(selectedRole, numQuestions);
      setSession(data);
      setCurrentIndex(0);
      setLastFeedback(null);
    } catch (err) {
      setError(err.response?.data?.detail || "Could not start session.");
    }
  };

  const handleAnswerFinished = async ({ transcript, durationSeconds }) => {
    // Allow empty transcript — user may have had mic issues
    // Backend will score 0 for content but at least it won't hard-block
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
    setLastFeedback(null);
    if (currentIndex + 1 < session.questions.length) {
      setCurrentIndex(currentIndex + 1);
    } else {
      navigate(`/results/${session.session_id}`);
    }
  };

  if (!session) {
    return (
      <div className="setup-page">
        <h2>Start a mock interview</h2>
        <label>
          Role
          <select value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)}>
            {roles.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </label>
        <label>
          Number of questions
          <input
            type="number"
            min={1}
            max={10}
            value={numQuestions}
            onChange={(e) => setNumQuestions(Number(e.target.value))}
          />
        </label>
        {error && <p className="error-text">{error}</p>}
        <button className="btn btn-primary" onClick={startSession} disabled={!selectedRole}>
          Begin Interview
        </button>
      </div>
    );
  }

  const question = session.questions[currentIndex];

  return (
    <div className="interview-page">
      <div className="progress-label">
        Question {currentIndex + 1} of {session.questions.length}
      </div>
      <h2 className="question-prompt">{question.prompt}</h2>
      <span className="question-category">{question.category}</span>

      {!lastFeedback && <VideoRecorder onFinish={handleAnswerFinished} />}

      {submitting && <p className="hint-text">Analyzing your answer...</p>}
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
