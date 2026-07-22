/**
 * ScoreCard
 * ----------
 * Renders one answer's feedback: score breakdown bars + tips list.
 * Pure presentational component -- all scoring happens on the backend.
 */
import GrammarPronunciationCard from "./GrammarPronunciationCard";

export default function ScoreCard({ feedback }) {
  const metrics = [
    { label: "Answer Relevance", value: feedback.answer_relevance_score ?? 80 },
    { label: "Grammar & Syntax", value: feedback.grammar_score ?? 85 },
    { label: "Context & Vocabulary", value: feedback.context_score ?? 80 },
    { label: "Pronunciation Clarity", value: feedback.pronunciation_score ?? 90 },
    { label: "Answer Structure (STAR)", value: feedback.answer_structure_score ?? 75 },
    { label: "Eye Contact", value: feedback.eye_contact_score ?? 70 },
    { label: "Posture", value: feedback.posture_score ?? 70 },
  ];

  const scoreColor = (score) => (score >= 70 ? "#3fb950" : score >= 40 ? "#d29922" : "#f85149");

  return (
    <div className="score-card">
      <div className="score-card-header">
        <span className="overall-score" style={{ color: scoreColor(feedback.overall_score) }}>
          {feedback.overall_score.toFixed(0)}
        </span>
        <span className="overall-score-label">/ 100</span>
      </div>

      <div className="metric-bars">
        {metrics.map((m) => (
          <div className="metric-row" key={m.label}>
            <span className="metric-label">{m.label}</span>
            <div className="metric-bar-track">
              <div
                className="metric-bar-fill"
                style={{ width: `${m.value}%`, backgroundColor: scoreColor(m.value) }}
              />
            </div>
            <span className="metric-value">{m.value.toFixed(0)}</span>
          </div>
        ))}
      </div>

      <div className="speech-stats">
        <span>🗣️ {feedback.speaking_pace_wpm.toFixed(0)} wpm</span>
        <span>💬 {feedback.filler_word_count} filler words</span>
      </div>

      <ul className="tips-list">
        {feedback.tips.map((tip, i) => (
          <li key={i}>{tip}</li>
        ))}
      </ul>

      <GrammarPronunciationCard feedback={feedback} />
    </div>
  );
}
