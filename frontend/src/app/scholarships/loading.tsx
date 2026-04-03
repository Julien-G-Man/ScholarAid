export default function Loading() {
  return (
    <>
      {/* Hero skeleton */}
      <div className="page-hero d-flex flex-column justify-content-center align-items-center">
        <div className="container text-center">
          <h1 className="display-3 fw-bold">Available Scholarships</h1>
          <p className="lead">Explore a comprehensive list of scholarships available to you.</p>
        </div>
      </div>

      {/* Card skeletons */}
      <section className="py-5">
        <div className="container">
          <div className="row g-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div className="col-md-6 col-lg-4" key={i}>
                <div className="card h-100 shadow-sm scholarship-card placeholder-glow">
                  <div className="card-body p-4">
                    <div className="placeholder col-6 mb-3 rounded" style={{ height: '80px' }} />
                    <div className="placeholder col-10 mb-2 rounded" />
                    <div className="placeholder col-8 mb-2 rounded" />
                    <div className="placeholder col-12 mb-1 rounded" />
                    <div className="placeholder col-9 rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
