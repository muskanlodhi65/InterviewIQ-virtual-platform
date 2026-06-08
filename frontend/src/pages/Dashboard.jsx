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
          <p className="hint-text">Track your interview practice over time</p>
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

      <Link to="/interview" className="btn btn-primary btn-large">
        + Start New Mock Interview
      </Link>

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
