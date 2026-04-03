'use client';

import { useState, useEffect } from 'react';
import api from '@/services/api';
import ScholarshipCard from './ScholarshipCard';
import { getCached, setCached } from '@/lib/browserCache';
import type { Scholarship } from '@/types';

const CACHE_KEY = 'featured';

export default function FeaturedScholarships() {
  const [scholarships, setScholarships] = useState<Scholarship[]>(
    () => getCached<Scholarship[]>(CACHE_KEY) ?? []
  );
  const [loading, setLoading] = useState(scholarships.length === 0);

  useEffect(() => {
    api
      .getFeaturedScholarships()
      .then((data) => {
        setScholarships(data);
        setCached(CACHE_KEY, data);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="row g-4">
        {[1, 2, 3].map((n) => (
          <div className="col-md-4" key={n}>
            <div className="card h-100 shadow-sm border-0 rounded-4">
              <div className="card-body p-4">
                <div className="placeholder-glow">
                  <span className="placeholder col-8 mb-2 d-block" style={{ height: 24 }} />
                  <span className="placeholder col-5 mb-3 d-block" style={{ height: 16 }} />
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

  if (scholarships.length === 0) {
    return <p className="text-center text-muted">No scholarships available right now. Check back soon!</p>;
  }

  return (
    <div className="row g-4">
      {scholarships.map((s) => (
        <div className="col-md-4" key={s.id}>
          <ScholarshipCard scholarship={s} />
        </div>
      ))}
    </div>
  );
}
