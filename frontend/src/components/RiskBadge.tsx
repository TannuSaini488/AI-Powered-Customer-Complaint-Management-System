import type { RiskLevel } from "../types/complaint";

export function RiskBadge({ risk }: { risk: RiskLevel }) {
  let className = "badge-default";
  
  if (risk === "Low") className = "badge-success";
  if (risk === "Medium") className = "badge-warning";
  if (risk === "High") className = "badge-danger";
  if (risk === "Critical") className = "badge-critical";

  return <span className={`badge ${className}`}>{risk}</span>;
}
