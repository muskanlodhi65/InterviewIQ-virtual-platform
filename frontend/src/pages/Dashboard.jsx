import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { clearAuthToken, getMe, getSessionHistory } from "../api/client";

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    getMe()
      .then(setUser)
      .catch(() => {
        clearAuthToken();
        navigate("/");
      });
    getSessionHistory()
      .then(setHistory)
      .catch(() => setError("Could not load session history."));
  }, []);

  const logout = () => {
    clearAuthToken();
    navigate("/");
  };

  const avgScore = history.length
    ? (history.reduce((sum, h) => sum + h.overall_session_score, 0) / history.length).toFixed(0)
    : "—";

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <div>
          <h2>Welcome back{user ? `, ${user.name}` : ""}</h2>
          <p className="hint-text">
            Track your interview practice over time
            {user?.role && (
              <span
                style={{
                  marginLeft: "10px",
                  background: user.role === "admin" ? "#f85149" : user.role === "interviewer" ? "#d29922" : "#388bfd",
                  color: "#fff",
                  padding: "2px 10px",
                  borderRadius: "12px",
                  fontSize: "0.75rem",
                  fontWeight: "bold",
                  textTransform: "uppercase",
                }}
              >
                {user.role}
              </span>
            )}
          </p>
        </div>
        <button className="btn btn-secondary" onClick={logout}>
          Log out
        </button>
      </div>

      <div className="stats-row">
        <div className="stat-box">
          <span className="stat-value">{history.length}</span>
          <span className="stat-label">Sessions completed</span>
        </div>
        <div className="stat-box">
          <span className="stat-value">{avgScore}</span>
          <span className="stat-label">Average score</span>
        </div>
      </div>

      <div style={{ display: "flex", gap: "12px", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        <Link to="/interview" className="btn btn-primary btn-large" style={{ flex: 1, textAlign: "center" }}>
          🎯 Start Tailored Mock Interview (Resume & JD)
        </Link>
        {(user?.role === "interviewer" || user?.role === "admin") && (
          <button
            className="btn btn-secondary btn-large"
            style={{ flex: 1, background: "rgba(210, 153, 34, 0.15)", border: "1px solid #d29922", color: "#f0b72f" }}
            onClick={() => alert("👨‍💼 Interviewer Evaluation Portal: You can conduct mock interview sessions and evaluate candidate recordings.")}
          >
            👨‍💼 Interviewer Evaluation Portal
          </button>
        )}
      </div>

      {user?.role === "interviewer" && (
        <div style={{ background: "rgba(210, 153, 34, 0.08)", border: "1px solid rgba(210, 153, 34, 0.25)", padding: "1rem 1.2rem", borderRadius: "10px", marginBottom: "1.5rem" }}>
          <h4 style={{ color: "#f0b72f", margin: "0 0 6px 0" }}>👨‍💼 Interviewer Mode Active</h4>
          <p style={{ margin: 0, fontSize: "0.9rem", color: "#8b949e" }}>
            You can practice asking questions, evaluate candidate AI disfluencies, and test custom role rubrics.
          </p>
        </div>
      )}

      {user?.role === "admin" && (
        <div style={{ background: "rgba(248, 81, 73, 0.08)", border: "1px solid rgba(248, 81, 73, 0.25)", padding: "1rem 1.2rem", borderRadius: "10px", marginBottom: "1.5rem" }}>
          <h4 style={{ color: "#f85149", margin: "0 0 6px 0" }}>🔑 Admin Portal Controls</h4>
          <p style={{ margin: 0, fontSize: "0.9rem", color: "#8b949e" }}>
            Full system control enabled: Create custom questions bank, configure Gemini LLM prompts, and manage user roles.
          </p>
        </div>
      )}

      {error && <p className="error-text">{error}</p>}

      <h3>Session History</h3>
      {history.length === 0 ? (
        <p className="hint-text">No sessions yet — start your first mock interview above.</p>
      ) : (
        <table className="history-table">
          <thead>
            <tr>
              <th>Role</th>
              <th>Date</th>
              <th>Score</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {history.map((h) => (
              <tr key={h.session_id}>
                <td>{h.role}</td>
                <td>{new Date(h.created_at).toLocaleDateString()}</td>
                <td>{h.overall_session_score.toFixed(0)}</td>
                <td>
                  <Link to={`/results/${h.session_id}`}>View →</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
