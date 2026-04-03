'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function DashboardPage() {
  const { user, initialising } = useAuth();
  const router = useRouter();

  // Redirect if not logged in
  useEffect(() => {
    if (!initialising && !user) router.replace('/login');
  }, [initialising, user, router]);

  if (initialising || !user) return null;

  return (
    <>
      {/* Hero banner */}
      <section className="bg-light-brand py-4 border-bottom">
        <div className="container">
          <div className="d-flex justify-content-between align-items-center gap-3">
            <div>
              <h1 className="fw-bold text-primary-brand mb-1">Welcome, {user.first_name || user.username}!</h1>
              <p className="text-muted mb-0">Track deadlines, discover scholarships, and manage your applications all in one place.</p>
            </div>
            <Link href="/profile" className="btn btn-outline-primary-brand rounded-pill">
              <i className="bi bi-pencil me-2" />
              Edit Profile
            </Link>
          </div>
        </div>
      </section>

      <section className="py-5">
        <div className="container">

          {/* Quick actions */}
          <h3 className="fw-bold text-primary-brand mb-4">Get started</h3>
          <div className="row g-3 mb-5">
            {/* Browse scholarships */}
            <div className="col-md-4">
              <Link href="/scholarships" className="card p-4 h-100 shadow-sm border-0 rounded-4 feature-box text-decoration-none" style={{ cursor: 'pointer' }}>
                <div className="card-body text-center">
                  <i className="bi bi-search display-4 text-primary-brand mb-3 d-block" />
                  <h5 className="fw-bold text-dark">Browse Scholarships</h5>
                  <p className="text-muted mb-0 small">Search and filter thousands of opportunities.</p>
                </div>
              </Link>
            </div>

            {/* Track deadlines */}
            <div className="col-md-4">
              <div className="card p-4 h-100 shadow-sm border-0 rounded-4 feature-box" style={{ opacity: 0.6 }}>
                <div className="card-body text-center">
                  <i className="bi bi-calendar-check display-4 text-primary-brand mb-3 d-block" />
                  <h5 className="fw-bold text-dark">Track Deadlines</h5>
                  <p className="text-muted mb-0 small">Coming soon — bookmark and track application deadlines.</p>
                </div>
              </div>
            </div>

            {/* AI review */}
            <div className="col-md-4">
              <Link href="/ai-prep" className="card p-4 h-100 shadow-sm border-0 rounded-4 feature-box text-decoration-none" style={{ cursor: 'pointer' }}>
                <div className="card-body text-center">
                  <i className="bi bi-robot display-4 text-primary-brand mb-3 d-block" />
                  <h5 className="fw-bold text-dark">Get AI Feedback</h5>
                  <p className="text-muted mb-0 small">Submit essays for guided review and extra support as you prepare your application.</p>
                </div>
              </Link>
            </div>
          </div>

          {/* Profile summary */}
          <hr className="my-5" />
          <h3 className="fw-bold text-primary-brand mb-4">Your profile</h3>
          <div className="row g-3">
            <div className="col-md-6">
              <div className="card p-4 shadow-sm border-0 rounded-4 h-100">
                <div className="card-body">
                  <h6 className="fw-bold text-muted text-uppercase mb-3" style={{ fontSize: '0.75rem', letterSpacing: '0.08em' }}>Account</h6>
                  <p className="mb-2"><strong>Name:</strong> {user.first_name} {user.last_name || '—'}</p>
                  <p className="mb-2"><strong>Username:</strong> @{user.username}</p>
                  <p className="mb-3"><strong>Email:</strong> {user.email}</p>
                  <Link href="/profile" className="btn btn-sm btn-outline-primary-brand rounded-pill">
                    Edit details
                  </Link>
                </div>
              </div>
            </div>

            <div className="col-md-6">
              <div className="card p-4 shadow-sm border-0 rounded-4 h-100">
                <div className="card-body">
                  <h6 className="fw-bold text-muted text-uppercase mb-3" style={{ fontSize: '0.75rem', letterSpacing: '0.08em' }}>Academic</h6>
                  <p className="mb-2"><strong>Institution:</strong> {user.profile?.institution || '—'}</p>
                  <p className="mb-2"><strong>Field of study:</strong> {user.profile?.field_of_study || '—'}</p>
                  <p className="mb-3"><strong>Country:</strong> {user.profile?.country || '—'}</p>
                  <Link href="/profile" className="btn btn-sm btn-outline-primary-brand rounded-pill">
                    Update profile
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Recent activity placeholder */}
          <hr className="my-5" />
          <h3 className="fw-bold text-primary-brand mb-4">Recent activity</h3>
          <div className="alert alert-info rounded-4 py-4">
            <i className="bi bi-info-circle me-2" />
            <strong>No activity yet.</strong> Start by browsing scholarships or submitting an essay for review.
          </div>
        </div>
      </section>
    </>
  );
}
