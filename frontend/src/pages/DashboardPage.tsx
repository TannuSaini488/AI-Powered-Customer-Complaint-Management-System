import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { MetricCard } from "../components/MetricCard";
import { ComplaintTable } from "../components/ComplaintTable";
import { RootState } from "../redux/store";
import { listComplaints, saveComplaint } from "../services/complaintApi";
import { setRecords, setLoading, setError } from "../features/complaints/complaintsSlice";
import { addToast } from "../features/ui/uiSlice";

export function DashboardPage() {
  const dispatch = useDispatch();
  const { records, status, error } = useSelector((state: RootState) => state.complaints);

  useEffect(() => {
    async function fetchComplaints() {
      try {
        dispatch(setLoading());
        const data = await listComplaints();
        dispatch(setRecords(data));
      } catch (err: any) {
        dispatch(setError(err.message));
        dispatch(addToast({ type: "error", message: `Failed to load dashboard data: ${err.message}` }));
      }
    }
    fetchComplaints();
  }, [dispatch]);

  // Dynamic metrics calculation from real records
  const totalCount = records.length;
  const openCount = records.filter(r => r.complaint_status === "Open" || r.complaint_status === "open").length;
  const closedCount = records.filter(r => r.complaint_status === "Closed" || r.complaint_status === "closed").length;
  const lowCount = records.filter(r => r.risk_level === "Low").length;
  const medCount = records.filter(r => r.risk_level === "Medium").length;
  const highCount = records.filter(r => r.risk_level === "High").length;
  const critCount = records.filter(r => r.risk_level === "Critical").length;

  const dashboardCards = [
    { label: "Total Complaints", value: totalCount, variant: "default" as const },
    { label: "Open Complaints", value: openCount, variant: "warning" as const },
    { label: "Closed Complaints", value: closedCount, variant: "success" as const },
    { label: "Low Risk", value: lowCount, variant: "success" as const },
    { label: "Medium Risk", value: medCount, variant: "warning" as const },
    { label: "High Risk", value: highCount, variant: "danger" as const },
    { label: "Critical Risk", value: critCount, variant: "danger" as const },
  ];

  return (
    <section className="page-stack">
      <header className="page-header">
        <div>
          <p className="eyebrow">Quality Assurance Dashboard</p>
          <h1>Overview</h1>
        </div>
      </header>

      <div className="metric-grid">
        {dashboardCards.map((card) => (
          <MetricCard
            key={card.label}
            title={card.label}
            value={card.value.toString()}
            variant={card.variant}
          />
        ))}
      </div>

      <section className="panel">
        <div className="panel-heading">
          <h2>Recent Complaints</h2>
        </div>
        {status === "loading" && records.length === 0 ? (
          <p>Loading complaints...</p>
        ) : error ? (
          <p className="error-text">Failed to load complaints: {error}</p>
        ) : (
          <ComplaintTable records={records.slice(0, 5)} />
        )}
      </section>
    </section>
  );
}
