import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { RiskBadge } from "../components/RiskBadge";
import { getComplaint } from "../services/complaintApi";
import { ComplaintRecord } from "../types/complaint";
import { LoadingSkeleton } from "../components/LoadingSkeleton";
import { useAppDispatch } from "../hooks/redux";
import { addToast } from "../features/ui/uiSlice";

export function ComplaintDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [complaint, setComplaint] = useState<ComplaintRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRecord() {
      if (!id) return;
      try {
        setLoading(true);
        const data = await getComplaint(parseInt(id, 10));
        setComplaint(data);
      } catch (err: any) {
        dispatch(addToast({ type: "error", message: `Failed to load complaint: ${err.message}` }));
        navigate("/complaints"); // fallback
      } finally {
        setLoading(false);
      }
    }
    fetchRecord();
  }, [id, dispatch, navigate]);

  if (loading) {
    return (
      <section className="page-stack">
        <LoadingSkeleton lines={10} />
      </section>
    );
  }

  if (!complaint) {
    return (
      <section className="page-stack">
        <p className="error-text">Complaint not found.</p>
      </section>
    );
  }

  const {
    id: complaintId,
    customer_name,
    product_name,
    batch_number,
    manufacturing_date,
    expiry_date,
    complaint_status,
    risk_level,
    risk_reason,
    complaint_description,
    summary,
    corrective_action,
    preventive_action,
  } = complaint;

  // The backend might not explicitly store the missing fields array on the ComplaintRecord,
  // since the DB schema was simpler, but let's render a static/dynamic checklist based on available fields.
  const isMissing = (val: string | null | undefined) => !val || val.trim() === "";
  
  const checklist = [];
  if (isMissing(customer_name)) checklist.push("Customer Information");
  if (isMissing(product_name)) checklist.push("Product Name");
  if (isMissing(batch_number)) checklist.push("Batch Number");
  if (isMissing(manufacturing_date)) checklist.push("Manufacturing Date");
  if (isMissing(expiry_date)) checklist.push("Expiry Date");
  if (isMissing(complaint_description)) checklist.push("Complaint Description");

  return (
    <section className="page-stack animate-fade-in">
      <header className="page-header">
        <div>
          <p className="eyebrow">Complaint Record</p>
          <h1>CC-2026-{String(complaintId).padStart(5, "0")}</h1>
        </div>
        <RiskBadge risk={risk_level} />
      </header>

      <div className="details-grid">
        <section className="panel">
          <h2>Complaint Overview</h2>
          <dl className="details-list">
            <div><dt>Customer</dt><dd>{customer_name || "Not Provided"}</dd></div>
            <div><dt>Product</dt><dd>{product_name || "Not Provided"}</dd></div>
            <div><dt>Batch Number</dt><dd>{batch_number || "Not Provided"}</dd></div>
            <div><dt>Manufacturing Date</dt><dd>{manufacturing_date || "Not Provided"}</dd></div>
            <div><dt>Expiry Date</dt><dd>{expiry_date || "Not Provided"}</dd></div>
            <div><dt>Status</dt><dd>{complaint_status}</dd></div>
          </dl>
        </section>

        <section className="panel">
          <h2>AI Risk Explanation</h2>
          <p>{risk_reason || "No risk reason provided."}</p>
        </section>
      </div>

      <section className="panel">
        <h2>Investigation Summary</h2>
        <p>{summary || complaint_description || "No summary available."}</p>
      </section>

      <div className="details-grid">
        <section className="panel">
          <h2>CAPA Recommendation</h2>
          <div className="analysis-list">
            <p><strong>Corrective:</strong> {corrective_action || "Not provided"}</p>
            <p><strong>Preventive:</strong> {preventive_action || "Not provided"}</p>
          </div>
        </section>
        
        <section className="panel">
          <h2>Completeness Checklist</h2>
          {checklist.length > 0 ? (
            <div>
              <p className="error-text" style={{marginBottom: "1rem"}}>The following required fields are missing:</p>
              <ul className="check-list">
                {checklist.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </div>
          ) : (
            <p className="success-text" style={{marginTop: "1rem"}}>✓ All required fields are present.</p>
          )}
        </section>
      </div>

      <section className="panel">
        <h2>Timeline</h2>
        <ol className="timeline">
          <li>Complaint logged and initial AI assessment generated.</li>
          <li>QA triage marked complaint as {risk_level}.</li>
          <li>Awaiting investigation owner assignment.</li>
        </ol>
      </section>
    </section>
  );
}
