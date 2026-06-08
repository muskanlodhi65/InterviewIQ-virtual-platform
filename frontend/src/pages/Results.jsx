import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getSessionResult } from "../api/client";
import ScoreCard from "../components/ScoreCard";

export default function Results() {
  const { sessionId } = useParams();
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getSessionResult(sessionId)
      .then(setResult)
      .catch(() => setError("Could not load this session's results."));
  }, [sessionId]);

  if (error) return <p className="error-text">{error}</p>;
  if (!result) return <p className="hint-text">Loading results...</p>;

  return (
    <div className="results-page">
      <h2>Session Results — {result.role}</h2>
      <div className="overall-session-score">
        Overall score: <strong>{result.overall_session_score.toFixed(0)}</strong> / 100
      </div>

      {result.summary_tips.length > 0 && (
        <div className="summary-tips-box">
          <strong>Top areas to improve:</strong>
          <ul>
            {result.summary_tips.map((t, i) => (
              <li key={i}>{t}</li>
            ))}
          </ul>
        </div>
      )}

      <h3>Per-Question Breakdown</h3>
      <div className="results-grid">
        {result.answers.map((a, i) => (
          <div key={a.question_id}>
            <p className="question-index-label">Question {i + 1}</p>
            <ScoreCard feedback={a} />
          </div>
        ))}
      </div>

      <Link to="/dashboard" className="btn btn-secondary">
        ← Back to Dashboard
      </Link>
    </div>
  );
}
