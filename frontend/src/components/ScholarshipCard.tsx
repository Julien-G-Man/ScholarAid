import Link from 'next/link';
import type { Scholarship } from '@/types';

function formatDate(dateStr: string | null) {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function ScholarshipCard({ scholarship }: { scholarship: Scholarship }) {
  return (
    <div className="card h-100 shadow-sm scholarship-card">
      <div className="card-body d-flex flex-column p-4">
        {scholarship.logo_url && (
          <div className="text-center mb-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={scholarship.logo_url}
              alt={scholarship.name}
              style={{ maxHeight: '100px', objectFit: 'contain' }}
              className="img-fluid"
            />
          </div>
        )}
        <h5 className="card-title fw-bold">
          <Link href={`/scholarships/${scholarship.id}`} className="text-decoration-none text-dark">
            {scholarship.name}
          </Link>
        </h5>
        {scholarship.institution && (
          <h6 className="fw-bold text-primary-brand mb-2">{scholarship.institution}</h6>
        )}
        <p className="card-text text-muted small flex-grow-1">
          {scholarship.description.split(' ').slice(0, 30).join(' ')}
          {scholarship.description.split(' ').length > 30 ? '…' : ''}
        </p>
      </div>
      <div className="card-footer bg-white border-0 d-flex justify-content-between align-items-center p-4 pt-0">
        <small className="text-muted">⏳ {formatDate(scholarship.deadline)}</small>
        <Link href={`/scholarships/${scholarship.id}`} className="btn btn-sm btn-outline-primary-brand rounded-pill">
          Learn More
        </Link>
      </div>
    </div>
  );
}
