import type { ComplaintAnalysis } from "../types/complaint";
import { RiskBadge } from "./RiskBadge";

export function AnalysisPanel({ analysis }: { analysis: ComplaintAnalysis }) {
  const confidencePct = Math.round(analysis.confidence * 100);
  const dupClass =
    analysis.duplicate_probability === "Duplicate"
      ? "dup-duplicate"
      : analysis.duplicate_probability === "Probably Duplicate"
      ? "dup-probably"
      : "dup-unique";

  return (
    <div className="analysis-panel">
      {/* Summary */}
      <div className="ap-section">
        <h4 className="ap-label">📋 Summary</h4>
        <p className="ap-text">{analysis.summary}</p>
      </div>

      {/* Risk */}
      <div className="ap-section ap-row">
        <div className="ap-col">
          <h4 className="ap-label">⚠ Risk Level</h4>
          <RiskBadge risk={analysis.risk_level} />
          <p className="ap-sub">{analysis.risk_reason}</p>
        </div>
        <div className="ap-col">
          <h4 className="ap-label">🔍 Duplicate Detection</h4>
          <span className={`dup-badge ${dupClass}`}>
            {analysis.duplicate_probability}
          </span>
          <p className="ap-sub">
            Confidence:{" "}
            <strong>{confidencePct}%</strong>
          </p>
        </div>
      </div>

      {/* Root Cause */}
      <div className="ap-section">
        <h4 className="ap-label">🔬 Root Cause Analysis</h4>
        <div className="ap-tag">{analysis.root_cause}</div>
        <p className="ap-text">{analysis.root_cause_reason}</p>
      </div>

      {/* CAPA */}
      <div className="ap-section">
        <h4 className="ap-label">✅ CAPA Recommendation</h4>
        <div className="ap-capa-grid">
          <div className="ap-capa-box ap-capa-box--corrective">
            <span className="ap-capa-tag">Corrective Action</span>
            <p>{analysis.corrective_action}</p>
          </div>
          <div className="ap-capa-box ap-capa-box--preventive">
            <span className="ap-capa-tag">Preventive Action</span>
            <p>{analysis.preventive_action}</p>
          </div>
        </div>
      </div>

      {/* Missing Info */}
      {analysis.missing_information.length > 0 && (
        <div className="ap-section ap-section--warning">
          <h4 className="ap-label">⚡ Missing Information</h4>
          <ul className="ap-missing-list">
            {analysis.missing_information.map((info) => (
              <li key={info}>{info}</li>
            ))}
          </ul>
        </div>
      )}

      {analysis.missing_information.length === 0 && (
        <div className="ap-section ap-section--ok">
          <h4 className="ap-label">✓ Completeness Check</h4>
          <p className="ap-text">All required information is present.</p>
        </div>
      )}
    </div>
  );
}
