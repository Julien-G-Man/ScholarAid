'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import api from '@/services/api';
import type { AIReviewSession } from '@/types';

export default function AIReviewsPage() {
  const { user, initialising } = useAuth();
  const router = useRouter();
  const [sessions, setSessions] = useState<AIReviewSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'in_progress' | 'reviewed' | 'archived'>('all');

  // Redirect if not logged in
  useEffect(() => {
    if (!initialising && !user) router.replace('/login');
  }, [initialising, user, router]);

  // Fetch sessions
  useEffect(() => {
    if (user) {
      api.getAIReviewSessions()
        .then((data) => {
          setSessions(data);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [user]);

  if (initialising || !user || loading) return null;

  const filteredSessions = filter === 'all'
    ? sessions
    : sessions.filter((s) => s.status === filter);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      in_progress: 'warning',
      submitted: 'info',
      reviewed: 'success',
      archived: 'secondary',
    };
    const labels: Record<string, string> = {
      in_progress: 'In Progress',
      submitted: 'Submitted',
      reviewed: 'Reviewed',
      archived: 'Archived',
    };
    return (
      <span className={`badge bg-${variants[status] || 'secondary'}`}>
        {labels[status] || status}
      </span>
    );
  };

  return (
    <>
      {/* Hero */}
      <section className="bg-light-brand py-5 border-bottom">
        <div className="container">
          <h1 className="fw-bold text-primary-brand mb-2">Your Review Sessions</h1>
          <p className="lead text-muted">Track all your scholarship essay reviews and application progress.</p>
        </div>
      </section>

      <section className="py-5">
        <div className="container">
          {/* Filters */}
          <div className="mb-4 d-flex flex-wrap gap-2">
            {(['all', 'in_progress', 'reviewed', 'archived'] as const).map((f) => (
              <button
                key={f}
                className={`btn rounded-pill fw-semibold ${
                  filter === f
                    ? 'btn-primary-brand'
                    : 'btn-outline-primary-brand'
                }`}
                onClick={() => setFilter(f)}
              >
                {f === 'all' && 'All'}
                {f === 'in_progress' && 'In Progress'}
                {f === 'reviewed' && 'Reviewed'}
                {f === 'archived' && 'Archived'}
              </button>
            ))}
          </div>

          {/* Sessions Table */}
          {filteredSessions.length > 0 ? (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead className="table-light">
                  <tr>
                    <th className="fw-bold text-primary-brand">Scholarship</th>
                    <th className="fw-bold text-primary-brand">Status</th>
                    <th className="fw-bold text-primary-brand">Score</th>
                    <th className="fw-bold text-primary-brand">Last Updated</th>
                    <th className="fw-bold text-primary-brand">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSessions.map((session) => (
                    <tr key={session.id} className="align-middle">
                      <td>
                        <strong className="text-dark">{session.scholarship}</strong>
                      </td>
                      <td>{getStatusBadge(session.status)}</td>
                      <td>
                        {session.feedback?.overall_score ? (
                          <span className="fw-bold text-primary-brand">{session.feedback.overall_score}/100</span>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                      <td className="text-muted small">
                        {new Date(session.updated_at).toLocaleDateString()}
                      </td>
                      <td>
                        <Link
                          href={`/ai-prep/${session.scholarship}`}
                          className="btn btn-sm btn-outline-primary-brand rounded-pill"
                        >
                          <i className="bi bi-arrow-right me-1" />
                          Continue
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="alert alert-info rounded-4 text-center py-5">
              <i className="bi bi-inbox display-5 text-primary-brand mb-3 d-block" />
              <h5 className="fw-bold text-primary-brand mb-2">No sessions yet</h5>
              <p className="text-muted mb-3">
                {filter === 'all'
                  ? "You haven't started any reviews. "
                  : `No ${filter} sessions.`}
              </p>
              <Link href="/ai-prep" className="btn btn-primary-brand rounded-pill">
                <i className="bi bi-plus-circle me-2" />
                Start a Review
              </Link>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
