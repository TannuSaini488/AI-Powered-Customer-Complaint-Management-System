import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../hooks/redux";
import {
  setAnalysisResult,
  setAnalysisError,
  setAnalysisLoading,
  setExtractedText,
  resetAnalysis,
} from "../features/complaints/analysisSlice";
import { analyzeComplaint, uploadFile, saveComplaint } from "../services/complaintApi";
import { FileUploader } from "../components/FileUploader";
import { AnalysisPanel } from "../components/AnalysisPanel";
import { LoadingSkeleton } from "../components/LoadingSkeleton";
import { addToast } from "../features/ui/uiSlice";

type FormState = {
  customer_name: string;
  complaint_source: string;
  complaint_date: string;
  product_name: string;
  batch_number: string;
  manufacturing_date: string;
  expiry_date: string;
  complaint_category: string;
  complaint_description: string;
};

const EMPTY_FORM: FormState = {
  customer_name: "",
  complaint_source: "",
  complaint_date: new Date().toISOString().split("T")[0],
  product_name: "",
  batch_number: "",
  manufacturing_date: "",
  expiry_date: "",
  complaint_category: "",
  complaint_description: "",
};

const COMPLAINT_CATEGORIES = [
  "Broken Tablets",
  "Incorrect Labeling",
  "Leakage",
  "Damaged Packaging",
  "Color Variation",
  "Wrong Medicine Received",
  "Foreign Particles",
  "Expired Medicine",
  "Other",
];

export function ComplaintSubmissionPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { currentAnalysis, status, error, extractedText, warning } =
    useAppSelector((state) => state.analysis);

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [copilotText, setCopilotText] = useState(
    "Apollo Pharmacy reported discolored capsules in Amoxicillin Capsules 500 mg. Batch number AMX240602. Manufacturing date March 2026. Expiry date February 2028. Please log this complaint against batch AMX240602 immediately."
  );
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);

  const isAnalyzing = status === "loading";
  const hasAnalysis = status === "succeeded" && currentAnalysis !== null;

  function setField(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  // After analysis, auto-populate form fields from AI extracted_fields
  function applyAnalysisToForm(analysis: Awaited<ReturnType<typeof analyzeComplaint>>) {
    const ef = analysis.extracted_fields;
    if (!ef) return;

    setForm((prev) => ({
      ...prev,
      customer_name:         ef.customer_name        ?? prev.customer_name,
      product_name:          ef.product_name         ?? prev.product_name,
      batch_number:          ef.batch_number         ?? prev.batch_number,
      manufacturing_date:    ef.manufacturing_date   ?? prev.manufacturing_date,
      expiry_date:           ef.expiry_date          ?? prev.expiry_date,
      complaint_category:    ef.complaint_category   ?? prev.complaint_category,
      complaint_description: prev.complaint_description || copilotText,
    }));
  }

  async function handleAnalyze(event: FormEvent) {
    event.preventDefault();
    if (!copilotText.trim()) {
      dispatch(addToast({ type: "warning", message: "Please paste a complaint text to analyze." }));
      return;
    }

    dispatch(setAnalysisLoading());
    setSaveError(null);
    setSaveSuccess(false);
    try {
      const result = await analyzeComplaint({
        complaint_text: copilotText,
        customer_name: form.customer_name || undefined,
        product_name: form.product_name || undefined,
        batch_number: form.batch_number || undefined,
      });
      dispatch(setAnalysisResult(result));
      applyAnalysisToForm(result);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Analysis failed.";
      dispatch(setAnalysisError(msg));
      dispatch(addToast({ type: "error", message: `Analysis failed: ${msg}` }));
    }
  }

  async function handleFileUpload(file: File) {
    dispatch(setAnalysisLoading());
    setUploadedFileName(file.name);
    setSaveError(null);
    try {
      const result = await uploadFile(file);
      dispatch(
        setExtractedText({ text: result.extracted_text, warning: result.warning })
      );
      if (result.extracted_text) {
        setCopilotText(result.extracted_text);
      }
      // Reset status back to idle after extraction (not a full analysis)
      dispatch(resetAnalysis());
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Upload failed.";
      dispatch(setAnalysisError(msg));
      dispatch(addToast({ type: "error", message: `Upload failed: ${msg}` }));
    }
  }

  async function handleSave() {
    if (!currentAnalysis) {
      setSaveError("Please run AI analysis before saving.");
      dispatch(addToast({ type: "warning", message: "Please run AI analysis before saving." }));
      return;
    }
    if (!form.customer_name.trim() || !form.product_name.trim() || !form.complaint_category) {
      setSaveError("Customer Name, Product Name, and Complaint Category are required.");
      dispatch(addToast({ type: "warning", message: "Customer Name, Product Name, and Complaint Category are required." }));
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    try {
      const saved = await saveComplaint({
        customer_name: form.customer_name,
        product_name: form.product_name,
        batch_number: form.batch_number || null,
        manufacturing_date: form.manufacturing_date || null,
        expiry_date: form.expiry_date || null,
        complaint_category: form.complaint_category,
        complaint_description: form.complaint_description || copilotText,
        summary: currentAnalysis.summary,
        risk_level: currentAnalysis.risk_level,
        risk_reason: currentAnalysis.risk_reason,
        root_cause: currentAnalysis.root_cause,
        corrective_action: currentAnalysis.corrective_action,
        preventive_action: currentAnalysis.preventive_action,
        duplicate_probability: currentAnalysis.duplicate_probability,
        complaint_status: "Open",
      });
      setSaveSuccess(true);
      dispatch(addToast({ type: "success", message: "Complaint saved successfully!" }));
      setTimeout(() => navigate(`/complaints/${saved.id}`), 1200);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to save complaint.";
      setSaveError(msg);
      dispatch(addToast({ type: "error", message: `Save failed: ${msg}` }));
    } finally {
      setIsSaving(false);
    }
  }

  function handleReset() {
    setForm(EMPTY_FORM);
    setCopilotText("");
    setUploadedFileName(null);
    setSaveError(null);
    setSaveSuccess(false);
    dispatch(resetAnalysis());
  }

  return (
    <div className="intake-page">
      {/* ─── Page Header ─────────────────────────────────────────── */}
      <header className="intake-header">
        <div>
          <p className="eyebrow">API &amp; FDF Quality Assurance Module</p>
          <h1>Log Customer Complaint</h1>
        </div>
        <div className="intake-header-actions">
          <span className={`status-pill ${isAnalyzing ? "status-analyzing" : hasAnalysis ? "status-ready" : ""}`}>
            {isAnalyzing ? "⟳ AI Analyzing…" : hasAnalysis ? "✓ AI Ready" : "Pending Triage"}
          </span>
          <button
            type="button"
            className="secondary-button"
            onClick={handleReset}
          >
            Reset Form
          </button>
        </div>
      </header>

      <div className="intake-grid">
        {/* ═══════════════════════════════════════════════════════════
            LEFT PANEL — COMPLAINT FORM
            ═══════════════════════════════════════════════════════════ */}
        <div className="form-panel">

          {/* Section 1 — Origin & Customer */}
          <article className="panel">
            <div className="section-label">
              <span className="section-number">01</span>
              <h2>Origin &amp; Customer Details</h2>
            </div>
            <div className="field-grid-2">
              <label>
                Customer Name <span className="required-star">*</span>
                <input
                  id="customer_name"
                  value={form.customer_name}
                  onChange={(e) => setField("customer_name", e.target.value)}
                  placeholder={hasAnalysis ? "AI did not extract — enter manually" : "e.g. Apollo Pharmacy"}
                />
              </label>
              <label>
                Complaint Source
                <input
                  id="complaint_source"
                  value={form.complaint_source}
                  onChange={(e) => setField("complaint_source", e.target.value)}
                  placeholder="Email, phone, distributor…"
                />
              </label>
              <label>
                Complaint Date
                <input
                  id="complaint_date"
                  type="date"
                  value={form.complaint_date}
                  onChange={(e) => setField("complaint_date", e.target.value)}
                />
              </label>
            </div>
          </article>

          {/* Section 2 — Product & Batch */}
          <article className="panel">
            <div className="section-label">
              <span className="section-number">02</span>
              <h2>Product &amp; Batch Identification</h2>
            </div>
            <div className="field-grid-2">
              <label>
                Product Name <span className="required-star">*</span>
                <input
                  id="product_name"
                  value={form.product_name}
                  onChange={(e) => setField("product_name", e.target.value)}
                  placeholder={hasAnalysis ? "AI did not extract — enter manually" : "e.g. Amoxicillin Capsules"}
                />
              </label>
              <label>
                Batch Number
                <input
                  id="batch_number"
                  value={form.batch_number}
                  onChange={(e) => setField("batch_number", e.target.value)}
                  placeholder="e.g. AMX240602"
                />
              </label>
              <label>
                Manufacturing Date
                <input
                  id="manufacturing_date"
                  type="date"
                  value={form.manufacturing_date}
                  onChange={(e) => setField("manufacturing_date", e.target.value)}
                />
              </label>
              <label>
                Expiry Date
                <input
                  id="expiry_date"
                  type="date"
                  value={form.expiry_date}
                  onChange={(e) => setField("expiry_date", e.target.value)}
                />
              </label>
            </div>
          </article>

          {/* Section 3 — Complaint Details */}
          <article className="panel">
            <div className="section-label">
              <span className="section-number">03</span>
              <h2>Complaint Details</h2>
            </div>
            <div className="field-grid-1">
              <label>
                Complaint Category <span className="required-star">*</span>
                <select
                  id="complaint_category"
                  value={form.complaint_category}
                  onChange={(e) => setField("complaint_category", e.target.value)}
                >
                  <option value="">Select category…</option>
                  {COMPLAINT_CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </label>
              <label>
                Complaint Description
                <textarea
                  id="complaint_description"
                  rows={5}
                  value={form.complaint_description}
                  onChange={(e) => setField("complaint_description", e.target.value)}
                  placeholder="AI will auto-populate this from your analysis. You can also type or edit directly."
                />
              </label>
            </div>
          </article>

          {/* Section 4 — AI Assessment (read-only outputs) */}
          <article className="panel">
            <div className="section-label">
              <span className="section-number">04</span>
              <h2>Initial Assessment &amp; Priority</h2>
            </div>
            <div className="field-grid-2">
              <label>
                AI Risk Level
                <div className={`ai-field ${hasAnalysis ? "ai-field--filled" : ""}`}>
                  {currentAnalysis ? (
                    <span className={`risk-badge risk-${currentAnalysis.risk_level.toLowerCase()}`}>
                      {currentAnalysis.risk_level}
                    </span>
                  ) : (
                    <span className="ai-placeholder">Awaiting AI analysis…</span>
                  )}
                </div>
              </label>
              <label>
                Duplicate Check
                <div className={`ai-field ${hasAnalysis ? "ai-field--filled" : ""}`}>
                  {currentAnalysis ? (
                    <span className={`dup-badge dup-${currentAnalysis.duplicate_probability.toLowerCase().replace(" ", "-")}`}>
                      {currentAnalysis.duplicate_probability}
                    </span>
                  ) : (
                    <span className="ai-placeholder">Awaiting AI analysis…</span>
                  )}
                </div>
              </label>
              <label>
                Root Cause
                <div className={`ai-field ai-field--text ${hasAnalysis ? "ai-field--filled" : ""}`}>
                  {currentAnalysis?.root_cause ?? <span className="ai-placeholder">Awaiting AI analysis…</span>}
                </div>
              </label>
              <label>
                AI Confidence
                <div className={`ai-field ${hasAnalysis ? "ai-field--filled" : ""}`}>
                  {currentAnalysis ? (
                    <>
                      <div className="confidence-bar">
                        <div
                          className="confidence-fill"
                          style={{ width: `${Math.round(currentAnalysis.confidence * 100)}%` }}
                        />
                      </div>
                      <span className="confidence-pct">{Math.round(currentAnalysis.confidence * 100)}%</span>
                    </>
                  ) : (
                    <span className="ai-placeholder">Awaiting AI analysis…</span>
                  )}
                </div>
              </label>
            </div>
          </article>

          {/* Section 5 — Full AI Analysis Panel */}
          {(hasAnalysis || isAnalyzing) && (
            <article className="panel panel--analysis">
              <div className="section-label">
                <span className="section-number ai-icon">AI</span>
                <h2>AI Copilot Full Analysis</h2>
              </div>
              {isAnalyzing ? (
                <div className="analysis-loading">
                  <LoadingSkeleton lines={6} />
                  <p className="analysis-loading-text">Running LangGraph workflow…</p>
                </div>
              ) : currentAnalysis ? (
                <AnalysisPanel analysis={currentAnalysis} />
              ) : null}
            </article>
          )}

          {/* Save / Commit */}
          <div className="save-bar">
            {saveError && <p className="error-text">{saveError}</p>}
            {saveSuccess && <p className="success-text">✓ Complaint saved! Redirecting…</p>}
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving || isAnalyzing || !hasAnalysis}
              className="save-btn"
            >
              {isSaving ? "Saving…" : "Save & Commit Complaint"}
            </button>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════
            RIGHT PANEL — AI COPILOT ASSISTANT
            ═══════════════════════════════════════════════════════════ */}
        <aside className="copilot-panel">
          <div className="copilot-title">
            <span className="copilot-icon">✦</span>
            <h2>AI Complaint Intake Assistant</h2>
          </div>
          <p className="muted">
            Paste a complaint email or raw text below, or upload a PDF / image. The AI will extract details,
            classify risk, identify root cause, and generate a CAPA recommendation.
          </p>

          {/* File Upload Zone */}
          <div className="copilot-section">
            <p className="copilot-section-label">Upload Document</p>
            <FileUploader onUpload={handleFileUpload} uploadedFileName={uploadedFileName} />
            {warning && <p className="copilot-warning">{warning}</p>}
            {extractedText && !warning && (
              <p className="copilot-success">✓ Extracted {extractedText.length} characters — text loaded below.</p>
            )}
          </div>

          {/* Text Input + Analyze */}
          <form className="copilot-form" onSubmit={handleAnalyze}>
            <label className="copilot-section-label" htmlFor="copilot-text">
              Paste Complaint Text / Email
            </label>
            <textarea
              id="copilot-text"
              className="copilot-textarea"
              value={copilotText}
              onChange={(e) => setCopilotText(e.target.value)}
              rows={10}
              placeholder="Paste raw complaint text, email body, or customer message here…"
              disabled={isAnalyzing}
            />
            <button
              type="submit"
              className="analyze-btn"
              disabled={isAnalyzing || !copilotText.trim()}
            >
              {isAnalyzing ? (
                <span className="btn-spinner">
                  <span className="spinner" /> Analyzing…
                </span>
              ) : (
                "✦ Analyze with AI"
              )}
            </button>
          </form>

          {error && (
            <div className="copilot-error">
              <strong>Error:</strong> {error}
            </div>
          )}

          {/* AI Progress Steps */}
          {(isAnalyzing || hasAnalysis) && (
            <div className="ai-steps">
              <p className="copilot-section-label">AI Workflow Progress</p>
              {AI_STEPS.map((step, i) => (
                <div key={step} className={`ai-step ${getStepState(i, isAnalyzing, hasAnalysis)}`}>
                  <span className="ai-step-dot" />
                  <span className="ai-step-label">{step}</span>
                </div>
              ))}
            </div>
          )}

          <div className="copilot-footer">
            Powered by Groq · gemma2-9b-it · LangGraph
          </div>
        </aside>
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const AI_STEPS = [
  "Document Parser",
  "Text Cleaner",
  "Complaint Understanding",
  "Summary Generation",
  "Risk Classification",
  "Root Cause Analysis",
  "CAPA Recommendation",
  "Completeness Check",
  "Duplicate Detection",
  "Response Formatter",
];

function getStepState(
  index: number,
  isAnalyzing: boolean,
  hasAnalysis: boolean
): string {
  if (hasAnalysis) return "ai-step--done";
  if (!isAnalyzing) return "";
  // Simulate progressive steps during loading
  const total = AI_STEPS.length;
  const mid = Math.floor(total / 2);
  if (index < mid) return "ai-step--done";
  if (index === mid) return "ai-step--active";
  return "ai-step--pending";
}
