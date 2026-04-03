'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="container py-5 text-center" style={{ minHeight: '40vh' }}>
      <i className="bi bi-exclamation-triangle-fill display-3 text-danger mb-3 d-block" />
      <h2 className="fw-bold text-primary-brand mb-2">Something went wrong</h2>
      <p className="text-muted mb-4">{error.message || 'An unexpected error occurred.'}</p>
      <button onClick={reset} className="btn btn-primary-brand rounded-pill px-4">
        Try again
      </button>
    </div>
  );
}
