export function ErrorCard({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="error-card card">
      <h4>An error occurred</h4>
      <p>{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn-secondary mt-2">
          Retry
        </button>
      )}
    </div>
  );
}
