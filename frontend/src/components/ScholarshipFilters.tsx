'use client';

import { useState } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';

const LEVELS = ['Undergraduate', 'Postgraduate', 'Masters', 'PhD', 'Professional'];

export default function ScholarshipFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams.get('search') ?? '');
  const [level, setLevel] = useState(searchParams.get('level') ?? '');

  function apply() {
    const params = new URLSearchParams();
    if (search.trim()) params.set('search', search.trim());
    if (level) params.set('level', level);
    router.push(`${pathname}${params.toString() ? `?${params.toString()}` : ''}`);
  }

  function clear() {
    setSearch('');
    setLevel('');
    router.push(pathname);
  }

  const hasFilters = !!(searchParams.get('search') || searchParams.get('level'));

  return (
    <div className="row g-3 mb-5 align-items-end">
      <div className="col-md-6">
        <label className="form-label fw-semibold small">Search</label>
        <input
          type="text"
          className="form-control rounded-3"
          placeholder="Scholarship name, provider, keyword…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && apply()}
        />
      </div>
      <div className="col-md-3">
        <label className="form-label fw-semibold small">Level</label>
        <select className="form-select rounded-3" value={level} onChange={(e) => setLevel(e.target.value)}>
          <option value="">All levels</option>
          {LEVELS.map((l) => (
            <option key={l} value={l}>{l}</option>
          ))}
        </select>
      </div>
      <div className="col-md-3 d-flex gap-2">
        <button onClick={apply} className="btn btn-primary-brand flex-grow-1 rounded-pill">
          <i className="bi bi-search me-1" /> Search
        </button>
        {hasFilters && (
          <button onClick={clear} className="btn btn-outline-secondary rounded-pill px-3" title="Clear filters">
            <i className="bi bi-x-lg" />
          </button>
        )}
      </div>
    </div>
  );
}
