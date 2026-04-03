import { Suspense } from 'react';
import { fetchScholarships } from '@/lib/serverApi';
import ScholarshipCard from '@/components/ScholarshipCard';
import ScholarshipFilters from '@/components/ScholarshipFilters';

export default async function ScholarshipsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; level?: string }>;
}) {
  const { search, level } = await searchParams;
  const scholarships = await fetchScholarships({ search, level });

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
          {/* Filters — wrapped in Suspense because useSearchParams() requires it */}
          <Suspense fallback={null}>
            <ScholarshipFilters />
          </Suspense>

          {search || level ? (
            <p className="text-muted mb-4">
              {scholarships.length} result{scholarships.length !== 1 ? 's' : ''}
              {search ? ` for "${search}"` : ''}
              {level ? ` · Level: ${level}` : ''}
            </p>
          ) : null}

          <div className="row g-4">
            {scholarships.length > 0 ? (
              scholarships.map((s) => (
                <div className="col-md-6 col-lg-4" key={s.id}>
                  <ScholarshipCard scholarship={s} />
                </div>
              ))
            ) : (
              <div className="col-12 text-center">
                <p className="lead text-muted">
                  {search || level
                    ? 'No scholarships match your filters. Try broadening your search.'
                    : 'No scholarships available right now. Please check back later!'}
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
