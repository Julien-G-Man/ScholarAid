'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import api from '@/services/api';
import type { Scholarship } from '@/types';

export default function AIPrepHubPage() {
  const { user, initialising } = useAuth();
  const router = useRouter();
  const [scholarships, setScholarships] = useState<Scholarship[]>([]);
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<any[]>([]);

  // Redirect if not logged in
  useEffect(() => {
    if (!initialising && !user) router.replace('/login');
  }, [initialising, user, router]);

  // Fetch featured scholarships and sessions
  useEffect(() => {
    if (user) {
      Promise.all([
        api.getFeaturedScholarships(),
        api.getAIReviewSessions().catch(() => []),
      ]).then(([schs, sess]) => {
        setScholarships(schs);
        setSessions(sess);
        setLoading(false);
      }).catch(() => setLoading(false));
    }
  }, [user]);

  if (initialising || !user || loading) return null;

  return (
    <>
      {/* Hero section */}
      <section className="bg-light-brand py-5 border-bottom">
        <div className="container">
          <h1 className="fw-bold text-primary-brand mb-2">AI Application Guide</h1>
          <p className="lead text-muted">Get personalized guidance on scholarship requirements, essay tips, and application strategy.</p>
        </div>
      </section>

      <section className="py-5">
        <div className="container">
          <div className="row g-4">
            {/* Main content */}
            <div className="col-lg-8">
              <h3 className="fw-bold text-primary-brand mb-4">
                <i className="bi bi-star me-2" />
                Featured Scholarships
              </h3>

              {scholarships.length > 0 ? (
                <div className="row g-3">
                  {scholarships.map((scholarship) => (
                    <div key={scholarship.id} className="col-md-6">
                      <Link
                        href={`/ai-prep/${scholarship.id}`}
                        className="card h-100 shadow-sm border-0 rounded-4 text-decoration-none overflow-hidden"
                        style={{ cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s' }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-4px)';
                          e.currentTarget.style.boxShadow = '0 12px 30px rgba(163,31,52,0.2)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.05)';
                        }}
                      >
                        <div className="card-body">
                          <div className="mb-2">
                            <span className="badge bg-light-brand text-primary-brand">{scholarship.level || 'All levels'}</span>
                          </div>
                          <h5 className="fw-bold text-primary-brand">{scholarship.name}</h5>
                          <p className="text-muted small mb-3">{scholarship.provider}</p>
                          <p className="text-muted small mb-3" style={{ height: '50px', overflow: 'hidden' }}>
                            {scholarship.description}
                          </p>
                          {scholarship.deadline && (
                            <p className="text-danger small fw-semibold mb-0">
                              <i className="bi bi-calendar me-1" />
                              Deadline: {new Date(scholarship.deadline).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="alert alert-info rounded-4">
                  No featured scholarships available. Try browsing all scholarships to get started.
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="col-lg-4">
              {/* In Progress Sessions */}
              <div className="card shadow-sm border-0 rounded-4 mb-4">
                <div className="card-body">
                  <h6 className="fw-bold text-primary-brand mb-3">
                    <i className="bi bi-hourglass-split me-2" />
                    Your Work in Progress
                  </h6>
                  {sessions.length > 0 ? (
                    <ul className="list-unstyled mb-0">
                      {sessions.filter((s) => s.status !== 'archived').slice(0, 5).map((session) => (
                        <li key={session.id} className="mb-2 pb-2 border-bottom">
                          <Link href={`/ai-prep/${session.scholarship}`} className="text-decoration-none small">
                            <strong className="text-dark">{session.scholarship}</strong>
                            <br />
                            <span className="text-muted text-uppercase" style={{ fontSize: '0.75rem' }}>
                              Status: {session.status}
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-muted small mb-0">No active sessions. Start by selecting a scholarship.</p>
                  )}
                </div>
              </div>

              {/* Quick Start */}
              <div className="card bg-light-brand border-0 rounded-4">
                <div className="card-body">
                  <h6 className="fw-bold text-primary-brand mb-3">
                    <i className="bi bi-rocket-takeoff me-2" />
                    How it Works
                  </h6>
                  <ol className="small mb-3">
                    <li className="mb-2">Read preparation guides for the scholarship</li>
                    <li className="mb-2">Review requirements and essay tips</li>
                    <li className="mb-2">Submit your essay for AI review</li>
                    <li>Get personalized feedback and guidance</li>
                  </ol>
                  <Link href="/ai-prep/reviews" className="btn btn-sm btn-outline-primary-brand rounded-pill w-100">
                    View all sessions
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
