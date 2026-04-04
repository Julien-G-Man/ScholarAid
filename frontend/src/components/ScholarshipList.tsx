'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import api from '@/services/api';
import ScholarshipCard from './ScholarshipCard';
import { getCached, setCached } from '@/lib/browserCache';
import type { Scholarship } from '@/types';

function cacheKey(search: string, level: string) {
  return `scholarships_${search}_${level}`;
}

function Skeleton() {
  return (
    <div className="row g-4">
      {[1, 2, 3, 4, 5, 6].map((n) => (
        <div className="col-md-6 col-lg-4" key={n}>
          <div className="card h-100 shadow-sm border-0 rounded-4">
            <div className="card-body p-4">
              <div className="placeholder-glow">
                <span className="placeholder col-9 mb-2 d-block" style={{ height: 22 }} />
                <span className="placeholder col-5 mb-3 d-block" style={{ height: 15 }} />
                <span className="placeholder col-12 mb-1 d-block" />
                <span className="placeholder col-10 d-block" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ScholarshipList() {
  const searchParams = useSearchParams();
  const search = searchParams.get('search') ?? '';
  const level = searchParams.get('level') ?? '';

  const key = cacheKey(search, level);
  const [scholarships, setScholarships] = useState<Scholarship[]>(
    () => getCached<Scholarship[]>(key) ?? []
  );
  const [loading, setLoading] = useState(scholarships.length === 0);

  useEffect(() => {
    const key = cacheKey(search, level);
    setLoading(getCached(key) === null);

    api
      .getScholarships({
        search: search || undefined,
        level: level || undefined,
      })
      .then((data) => {
        setScholarships(data.results);
        setCached(key, data.results);
      })
      .finally(() => setLoading(false));
  }, [search, level]);

  if (loading) return <Skeleton />;

  if (scholarships.length === 0) {
    return (
      <div className="col-12 text-center">
        <p className="lead text-muted">
          {search || level
            ? 'No scholarships match your filters. Try broadening your search.'
            : 'No scholarships available right now. Please check back later!'}
        </p>
      </div>
    );
  }

  return (
    <>
      {(search || level) && (
        <p className="text-muted mb-4">
          {scholarships.length} result{scholarships.length !== 1 ? 's' : ''}
          {search ? ` for "${search}"` : ''}
          {level ? ` · Level: ${level}` : ''}
        </p>
      )}
      <div className="row g-4">
        {scholarships.map((s) => (
          <div className="col-md-6 col-lg-4" key={s.id}>
            <ScholarshipCard scholarship={s} />
          </div>
        ))}
      </div>
    </>
  );
}
