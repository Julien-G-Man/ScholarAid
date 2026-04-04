import { Suspense } from 'react';
import ScholarshipFilters from '@/components/ScholarshipFilters';
import ScholarshipList from '@/components/ScholarshipList';

export default function ScholarshipsPage() {
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
          <Suspense fallback={null}>
            <ScholarshipFilters />
          </Suspense>

          <Suspense fallback={null}>
            <ScholarshipList />
          </Suspense>
        </div>
      </section>
    </>
  );
}
