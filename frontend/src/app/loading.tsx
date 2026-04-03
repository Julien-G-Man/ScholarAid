export default function Loading() {
  return (
    <div className="container py-5 d-flex justify-content-center align-items-center" style={{ minHeight: '40vh' }}>
      <div className="text-center">
        <div className="spinner-border text-danger mb-3" style={{ width: '3rem', height: '3rem' }} role="status">
          <span className="visually-hidden">Loading…</span>
        </div>
        <p className="text-muted">Loading…</p>
      </div>
    </div>
  );
}
