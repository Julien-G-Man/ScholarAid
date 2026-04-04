import { notFound } from 'next/navigation';
import Link from 'next/link';
import { fetchScholarship } from '@/lib/serverApi';

function formatDate(d: string | null) {
  if (!d) return 'N/A';
  return new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

export default async function ScholarshipDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const scholarship = await fetchScholarship(id);
  if (!scholarship) notFound();

  return (
    <div className="container py-5">
      <div className="row">
        <div className="col-12 text-center mb-5">
          <h1 className="display-4 fw-bold text-primary-brand">{scholarship.name}</h1>
          <p className="lead text-muted">{scholarship.provider}</p>
        </div>
      </div>

      <div className="row flex-column-reverse flex-lg-row p-4 bg-white rounded-4 shadow-sm">
        {/* Main content */}
        <div className="col-lg-8">
          <div className="mb-5">
            <h2 className="fw-bold text-primary-brand mb-3">Description</h2>
            <p style={{ whiteSpace: 'pre-line' }}>{scholarship.description}</p>
          </div>

          {scholarship.eligibility && (
            <div className="mb-5">
              <h2 className="fw-bold text-primary-brand mb-3">Eligibility Criteria</h2>
              <p style={{ whiteSpace: 'pre-line' }}>{scholarship.eligibility}</p>
            </div>
          )}

          {scholarship.essay_prompt && (
            <div className="mb-5">
              <h2 className="fw-bold text-primary-brand mb-3">Essay Prompt</h2>
              <p style={{ whiteSpace: 'pre-line' }}>{scholarship.essay_prompt}</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="col-lg-4">
          {scholarship.logo_url && (
            <div className="d-flex flex-column align-items-center mb-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={scholarship.logo_url}
                alt={`${scholarship.name} logo`}
                style={{ maxHeight: '150px', objectFit: 'contain' }}
                className="img-fluid mb-3"
              />
            </div>
          )}
          <ul className="list-group list-group-flush">
            <li className="list-group-item border-0 px-0">
              <strong>Provider:</strong> {scholarship.provider}
            </li>
            <li className="list-group-item border-0 px-0">
              <strong>Institution:</strong> {scholarship.institution ?? 'N/A'}
            </li>
            <li className="list-group-item border-0 px-0">
              <strong>Level:</strong> {scholarship.level ?? 'N/A'}
            </li>
            <li className="list-group-item border-0 px-0">
              <strong>Deadline:</strong> {formatDate(scholarship.deadline)}
            </li>
          </ul>
        </div>
      </div>

      <div className="text-center mt-4 d-flex gap-3 justify-content-center flex-wrap">
        {scholarship.link && (
          <a
            href={scholarship.link}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary-brand btn-lg rounded-pill"
          >
            Visit Official Page
          </a>
        )}
        <Link href={`/ai-prep/${scholarship.id}`} className="btn btn-outline-primary-brand btn-lg rounded-pill">
          💡 AI Assistance
        </Link>
      </div>
    </div>
  );
}
