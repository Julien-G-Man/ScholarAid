import Link from 'next/link';
import { fetchScholarships } from '@/lib/serverApi';

function formatDate(d: string | null) {
  if (!d) return 'N/A';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default async function ScholarshipsPage() {
  const scholarships = await fetchScholarships();

  return (
    <>
      <section className="page-hero d-flex flex-column justify-content-center align-items-center">
        <div className="container text-center">
          <h1 className="display-3 fw-bold">Available Scholarships</h1>
          <p className="lead">Explore a comprehensive list of scholarships available to you.</p>
        </div>
      </section>

      <section className="py-5">
        <div className="container">
          <div className="row g-4">
            {scholarships.length > 0 ? (
              scholarships.map((s) => (
                <div className="col-md-6 col-lg-4" key={s.id}>
                  <div className="card h-100 shadow-sm scholarship-card">
                    <div className="card-body d-flex flex-column p-4">
                      {s.logo_url && (
                        <div className="text-center mb-3">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={s.logo_url}
                            alt={s.name}
                            style={{ maxHeight: '100px', objectFit: 'contain' }}
                            className="img-fluid"
                          />
                        </div>
                      )}
                      <h5 className="card-title fw-bold">
                        <Link href={`/scholarships/${s.id}`} className="text-decoration-none text-dark">
                          {s.name}
                        </Link>
                      </h5>
                      <p className="card-text text-muted small flex-grow-1">
                        {s.description.split(' ').slice(0, 40).join(' ')}
                        {s.description.split(' ').length > 40 ? '…' : ''}
                      </p>
                      <ul className="list-unstyled small mt-2">
                        <li className="text-muted mb-1"><strong>Provider:</strong> {s.provider}</li>
                        {s.institution && (
                          <li className="text-muted mb-1"><strong>Institution:</strong> {s.institution}</li>
                        )}
                        {s.level && (
                          <li className="text-muted mb-1"><strong>Level:</strong> {s.level}</li>
                        )}
                        <li className="text-muted"><strong>Deadline:</strong> {formatDate(s.deadline)}</li>
                      </ul>
                    </div>
                    <div className="card-footer bg-white border-0 d-flex justify-content-between align-items-center p-4 pt-0">
                      {s.link && (
                        <a
                          href={s.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-sm btn-primary-brand rounded-pill"
                        >
                          Visit Official Page
                        </a>
                      )}
                      <Link
                        href={`/scholarships/${s.id}`}
                        className="btn btn-sm btn-outline-primary-brand rounded-pill"
                      >
                        Learn More
                      </Link>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-12 text-center">
                <p className="lead text-muted">No scholarships available right now. Please check back later!</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
