import { Link } from "react-router-dom";
import type { ComplaintRecord } from "../types/complaint";
import { RiskBadge } from "./RiskBadge";
import { StatusBadge } from "./StatusBadge";

type ComplaintTableProps = {
  records: ComplaintRecord[];
  onDelete?: (id: number) => void;
};

export function ComplaintTable({ records, onDelete }: ComplaintTableProps) {
  if (!records || records.length === 0) {
    return <div className="empty-state">No complaints found.</div>;
  }

  return (
    <div className="table-wrap">
      <table className="complaint-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Customer</th>
            <th>Product</th>
            <th>Batch</th>
            <th>Category</th>
            <th>Risk</th>
            <th>Status</th>
            <th>Created Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {records.map((record) => {
            const formattedDate = record.created_at
              ? new Date(record.created_at).toLocaleDateString()
              : "N/A";
            return (
              <tr key={record.id}>
                <td>#{record.id}</td>
                <td><strong>{record.customer_name}</strong></td>
                <td>{record.product_name}</td>
                <td>
                  <span className="batch-pill">
                    {record.batch_number || "N/A"}
                  </span>
                </td>
                <td>{record.complaint_category}</td>
                <td>
                  <RiskBadge risk={record.risk_level} />
                </td>
                <td>
                  <StatusBadge status={record.complaint_status} />
                </td>
                <td>{formattedDate}</td>
                <td>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <Link to={`/complaints/${record.id}`} className="btn-link">
                      View
                    </Link>
                    {onDelete && (
                      <button
                        type="button"
                        onClick={() => onDelete(record.id)}
                        className="btn-link-danger"
                        style={{
                          background: "none",
                          border: "none",
                          padding: 0,
                          color: "#b42318",
                          cursor: "pointer",
                          fontWeight: "bold",
                        }}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
