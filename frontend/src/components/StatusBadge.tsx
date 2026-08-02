export function StatusBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase();
  let className = "badge-default";
  
  if (normalized === "open") className = "badge-warning";
  if (normalized === "closed") className = "badge-success";

  return <span className={`badge ${className}`}>{status}</span>;
}
