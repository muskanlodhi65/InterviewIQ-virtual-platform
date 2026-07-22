import { useState } from "react";

export default function GrammarPronunciationCard({ feedback }) {
  const [activeTab, setActiveTab] = useState("grammar");

  const grammarErrors = feedback.grammar_errors || [];
  const pronunciationTips = feedback.pronunciation_tips || [];

  return (
    <div className="language-feedback-card" style={{ marginTop: "1rem", background: "rgba(255,255,255,0.03)", padding: "1.2rem", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.08)" }}>
      <div style={{ display: "flex", gap: "10px", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "8px", marginBottom: "12px" }}>
        <button
          onClick={() => setActiveTab("grammar")}
          style={{
            background: activeTab === "grammar" ? "#58a6ff" : "transparent",
            color: activeTab === "grammar" ? "#fff" : "#8b949e",
            border: "none",
            padding: "6px 14px",
            borderRadius: "6px",
            cursor: "pointer",
            fontWeight: "600",
          }}
        >
          Grammar & Syntax ({grammarErrors.length})
        </button>
        <button
          onClick={() => setActiveTab("pronunciation")}
          style={{
            background: activeTab === "pronunciation" ? "#58a6ff" : "transparent",
            color: activeTab === "pronunciation" ? "#fff" : "#8b949e",
            border: "none",
            padding: "6px 14px",
            borderRadius: "6px",
            cursor: "pointer",
            fontWeight: "600",
          }}
        >
          Pronunciation Guide ({pronunciationTips.length})
        </button>
      </div>

      {activeTab === "grammar" && (
        <div>
          {grammarErrors.length === 0 ? (
            <p style={{ color: "#3fb950", margin: "8px 0" }}>✨ Great grammar! No critical grammatical errors detected.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {grammarErrors.map((err, i) => (
                <div key={i} style={{ background: "rgba(248, 81, 73, 0.1)", borderLeft: "4px solid #f85149", padding: "10px 12px", borderRadius: "4px" }}>
                  <div style={{ fontSize: "0.9rem", color: "#f85149", fontWeight: "bold" }}>
                    ❌ Issue: "{err.original}"
                  </div>
                  <div style={{ fontSize: "0.85rem", color: "#e6edf3", marginTop: "4px" }}>
                    💡 <strong>Suggestion:</strong> {err.suggestion}
                  </div>
                  {err.context && (
                    <div style={{ fontSize: "0.8rem", color: "#8b949e", marginTop: "4px", fontStyle: "italic" }}>
                      Context: "...{err.context}..."
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "pronunciation" && (
        <div>
          {pronunciationTips.length === 0 ? (
            <p style={{ color: "#3fb950", margin: "8px 0" }}>🗣️ Clear articulation! No high-risk pronunciation words detected.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {pronunciationTips.map((item, i) => (
                <div key={i} style={{ background: "rgba(56, 139, 253, 0.1)", borderLeft: "4px solid #388bfd", padding: "10px 12px", borderRadius: "4px" }}>
                  <div style={{ fontSize: "0.95rem", color: "#58a6ff", fontWeight: "bold" }}>
                    🔊 Word: "{item.word}" &rarr; Say: <span style={{ color: "#d29922" }}>[{item.phonetic}]</span>
                  </div>
                  <div style={{ fontSize: "0.85rem", color: "#e6edf3", marginTop: "4px" }}>
                    💡 <strong>Tip:</strong> {item.tip}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
