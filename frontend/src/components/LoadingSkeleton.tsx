export function LoadingSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="skeleton-container">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="skeleton-line" style={{ width: `${Math.random() * 40 + 60}%` }} />
      ))}
    </div>
  );
}
