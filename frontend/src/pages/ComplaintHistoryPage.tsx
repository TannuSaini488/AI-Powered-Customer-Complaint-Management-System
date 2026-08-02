import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { ComplaintTable } from "../components/ComplaintTable";
import { RootState } from "../redux/store";
import { listComplaints, deleteComplaint } from "../services/complaintApi";
import { setRecords, setLoading, setError, removeRecord } from "../features/complaints/complaintsSlice";
import { addToast } from "../features/ui/uiSlice";

export function ComplaintHistoryPage() {
  const dispatch = useDispatch();
  const { records, status, error } = useSelector((state: RootState) => state.complaints);

  // Search and Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [riskFilter, setRiskFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    async function fetchComplaints() {
      try {
        dispatch(setLoading());
        const data = await listComplaints();
        dispatch(setRecords(data));
      } catch (err: any) {
        dispatch(setError(err.message));
        dispatch(addToast({ type: "error", message: `Failed to load complaints: ${err.message}` }));
      }
    }
    fetchComplaints();
  }, [dispatch]);

  const handleDelete = async (id: number) => {
    if (!window.confirm(`Are you sure you want to delete complaint #${id}?`)) {
      return;
    }
    try {
      await deleteComplaint(id);
      dispatch(removeRecord(id));
      dispatch(addToast({ type: "success", message: `Complaint #${id} deleted successfully.` }));
    } catch (err: any) {
      dispatch(addToast({ type: "error", message: `Failed to delete complaint: ${err.message}` }));
    }
  };

  // Filter & Search Logic
  const filteredRecords = records.filter((record) => {
    // Search match
    const searchString = `${record.customer_name} ${record.product_name} ${record.batch_number || ""} ${record.complaint_category}`.toLowerCase();
    const matchesSearch = searchString.includes(searchTerm.toLowerCase());

    // Risk match
    const matchesRisk = riskFilter === "all" || record.risk_level.toLowerCase() === riskFilter.toLowerCase();

    // Status match
    const matchesStatus = statusFilter === "all" || record.complaint_status.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesRisk && matchesStatus;
  });

  return (
    <section className="page-stack">
      <header className="page-header">
        <div>
          <p className="eyebrow">QMS Ledger</p>
          <h1>Complaint History</h1>
        </div>
      </header>

      <section className="panel filters-panel">
        <div>
          <label htmlFor="search-input">Search Complaints</label>
          <input
            id="search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search customer, product, batch, or category..."
            style={{ marginTop: "0.25rem" }}
          />
        </div>
        <div>
          <label htmlFor="risk-select">Risk Level</label>
          <select
            id="risk-select"
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            style={{ width: "100%", marginTop: "0.25rem" }}
          >
            <option value="all">All Risks</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>
        <div>
          <label htmlFor="status-select">Status</label>
          <select
            id="status-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ width: "100%", marginTop: "0.25rem" }}
          >
            <option value="all">All Statuses</option>
            <option value="Open">Open</option>
            <option value="Closed">Closed</option>
          </select>
        </div>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <h2>Records ({filteredRecords.length})</h2>
        </div>
        {status === "loading" && records.length === 0 ? (
          <p>Loading complaints...</p>
        ) : error ? (
          <p className="error-text">Failed to load complaints: {error}</p>
        ) : (
          <ComplaintTable records={filteredRecords} onDelete={handleDelete} />
        )}
      </section>
    </section>
  );
}
