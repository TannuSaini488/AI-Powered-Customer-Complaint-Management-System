import { AI_ANALYSIS_RESPONSE_EXAMPLE } from "../types/aiContract";

const nodes = [
  ["Document Parser", "Extract complaint content from text, PDF, image, or email input."],
  ["Text Cleaner", "Normalize noisy customer language into clean complaint text."],
  ["Complaint Understanding", "Identify product, batch, defect, dates, source, and affected quantity."],
  ["Summary Node", "Generate concise QA business summary."],
  ["Risk Node", "Classify Low, Medium, High, or Critical with patient-safety reasoning."],
  ["Root Cause Node", "Recommend manufacturing, packaging, storage, transportation, labeling, or unknown cause."],
  ["CAPA Node", "Separate corrective and preventive actions."],
  ["Completeness Node", "Find required missing information."],
  ["Duplicate Node", "Compare against existing complaint records."],
  ["Formatter Node", "Return structured JSON for frontend review."]
];

export function AIAnalysisPage() {
  return (
    <section className="page-stack">
      <header className="page-header">
        <div>
          <p className="eyebrow">AI Copilot</p>
          <h1>Analysis Workflow</h1>
        </div>
        <span className="status-pill">LangGraph Pipeline</span>
      </header>

      <section className="panel">
        <h2>Structured AI Response</h2>
        <div className="json-preview">
          <code>{JSON.stringify(AI_ANALYSIS_RESPONSE_EXAMPLE, null, 2)}</code>
        </div>
      </section>

      <section className="workflow-grid">
        {nodes.map(([title, description], index) => (
          <article className="workflow-step" key={title}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <h2>{title}</h2>
            <p>{description}</p>
          </article>
        ))}
      </section>
    </section>
  );
}
