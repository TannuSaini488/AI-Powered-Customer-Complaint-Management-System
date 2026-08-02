export function MetricCard({ title, value, variant = "default" }: { title: string; value: string | number; variant?: "default" | "warning" | "danger" | "success" }) {
  return (
    <div className={`metric-card ${variant}`}>
      <h3 className="metric-title">{title}</h3>
      <p className="metric-value">{value}</p>
    </div>
  );
}
