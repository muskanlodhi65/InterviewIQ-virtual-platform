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
    <div className="auth-page">
      <div className="auth-card">
        <h1>InterviewIQ</h1>
        <p className="tagline">Your AI-powered mock interview coach</p>

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
              <input type="text" placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} required />
              <div style={{ marginBottom: "1rem", textAlign: "left" }}>
                <label style={{ fontSize: "0.85rem", color: "#8b949e", display: "block", marginBottom: "4px" }}>
                  Select Account Role:
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: "6px",
                    background: "rgba(255,255,255,0.05)",
                    color: "#fff",
                    border: "1px solid rgba(255,255,255,0.2)",
                  }}
                >
                  <option value="candidate" style={{ background: "#161b22" }}>
                    🎯 Candidate (Practice Mock Interviews)
                  </option>
                  <option value="interviewer" style={{ background: "#161b22" }}>
                    👨‍💼 Interviewer (Practice & Evaluate Candidates)
                  </option>
                  <option value="admin" style={{ background: "#161b22" }}>
                    🔑 Admin (Full System & Question Management)
                  </option>
                </select>
              </div>
            </>
          )}
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
          {error && <p className="error-text">{error}</p>}
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Please wait..." : mode === "login" ? "Log In" : "Create Account"}
          </button>
        </form>
      </div>
    </div>
  );
}
