'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import api from '@/services/api';
import type { AIReviewSession } from '@/types';

// ─── helpers ────────────────────────────────────────────────────────────────

function isThisWeek(dateStr: string): boolean {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24);
  return diff <= 7;
}

function fmtDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function statusBadge(status: AIReviewSession['status']) {
  const map: Record<AIReviewSession['status'], { label: string; cls: string }> = {
    in_progress: { label: 'In Progress', cls: 'bg-warning text-dark' },
    submitted:   { label: 'Submitted',   cls: 'bg-primary'           },
    reviewed:    { label: 'Reviewed',    cls: 'bg-success'           },
    archived:    { label: 'Archived',    cls: 'bg-secondary'         },
  };
  const { label, cls } = map[status] ?? { label: status, cls: 'bg-secondary' };
  return <span className={`badge rounded-pill ${cls}`}>{label}</span>;
}

// ─── stat card ──────────────────────────────────────────────────────────────

interface StatCardProps {
  icon: string;
  label: string;
  value: string | number;
  sub?: string;
  accent?: boolean;
}

function StatCard({ icon, label, value, sub, accent }: StatCardProps) {
  return (
    <div className="col-6 col-md-3">
      <div
        className="card border-0 rounded-4 shadow-sm h-100 p-3"
        style={accent ? { borderLeft: '4px solid #A31F34' } : { borderLeft: '4px solid #dee2e6' }}
      >
        <div className="d-flex align-items-center gap-3">
          <div
            className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
            style={{
              width: 44,
              height: 44,
              background: accent ? '#FCE8E9' : '#f8f9fa',
            }}
          >
            <i className={`bi ${icon} fs-5`} style={{ color: accent ? '#A31F34' : '#6c757d' }} />
          </div>
          <div className="overflow-hidden">
            <div className="fw-bold fs-4 lh-1">{value}</div>
            <div className="text-muted small mt-1 text-truncate">{label}</div>
            {sub && <div className="text-muted" style={{ fontSize: '0.7rem' }}>{sub}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── page ────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { user, initialising } = useAuth();
  const router = useRouter();

  const [sessions, setSessions] = useState<AIReviewSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!initialising && !user) router.replace('/login');
  }, [initialising, user, router]);

  useEffect(() => {
    if (!user) return;
    api.getAIReviewSessions()
      .then(setSessions)
      .catch(() => setSessions([]))
      .finally(() => setLoading(false));
  }, [user]);

  if (initialising || !user) return null;

  // ── derived stats ──────────────────────────────────────────────────────────
  const total       = sessions.length;
  const inProgress  = sessions.filter((s) => s.status === 'in_progress').length;
  const submitted   = sessions.filter((s) => s.status === 'submitted').length;
  const reviewed    = sessions.filter((s) => s.status === 'reviewed').length;
  const thisWeek    = sessions.filter((s) => isThisWeek(s.updated_at)).length;
  const questionsAsked = sessions.reduce(
    (acc, s) => acc + s.chat_messages.filter((m) => m.role === 'user').length,
    0,
  );

  const scores = sessions
    .filter((s) => s.feedback?.overall_score != null)
    .map((s) => s.feedback!.overall_score);
  const avgScore  = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
  const bestScore = scores.length ? Math.max(...scores) : null;

  // ── smart guidance ─────────────────────────────────────────────────────────
  const guidance: { icon: string; text: string; href?: string; variant: string }[] = [];

  if (total === 0) {
    guidance.push({
      icon: 'bi-rocket-takeoff',
      text: 'Start your first AI application review to get personalised feedback.',
      href: '/ai-prep',
      variant: 'primary',
    });
  }
  if (inProgress > 0) {
    guidance.push({
      icon: 'bi-pencil-square',
      text: `You have ${inProgress} draft${inProgress > 1 ? 's' : ''} in progress — submit for AI review.`,
      href: '/ai-prep/reviews',
      variant: 'warning',
    });
  }
  if (submitted > 0) {
    guidance.push({
      icon: 'bi-hourglass-split',
      text: `${submitted} essay${submitted > 1 ? 's are' : ' is'} submitted and awaiting review.`,
      href: '/ai-prep/reviews',
      variant: 'info',
    });
  }
  if (reviewed > 0 && avgScore !== null && avgScore < 70) {
    guidance.push({
      icon: 'bi-arrow-repeat',
      text: `Your average score is ${avgScore}/100 — revisit feedback and strengthen your essays.`,
      href: '/ai-prep/reviews',
      variant: 'danger',
    });
  }
  if (reviewed > 0 && avgScore !== null && avgScore >= 70) {
    guidance.push({
      icon: 'bi-trophy',
      text: `Great work! Average score ${avgScore}/100 — explore more scholarships to apply to.`,
      href: '/scholarships',
      variant: 'success',
    });
  }

  // ── recent sessions (last 5) ───────────────────────────────────────────────
  const recentSessions = [...sessions]
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 5);

  return (
    <>
      {/* Hero banner */}
      <section className="bg-light-brand py-4 border-bottom">
        <div className="container">
          <div className="d-flex justify-content-between align-items-center gap-3 flex-wrap">
            <div>
              <h1 className="fw-bold text-primary-brand mb-1">
                Welcome back, {user.first_name || user.username}!
              </h1>
              <p className="text-muted mb-0">
                Track your applications, review feedback, and discover new scholarships.
              </p>
            </div>
            <Link href="/profile" className="btn btn-outline-primary-brand rounded-pill flex-shrink-0">
              <i className="bi bi-pencil me-2" />
              Edit Profile
            </Link>
          </div>
        </div>
      </section>

      <section className="py-5">
        <div className="container">

          {/* ── Metrics ─────────────────────────────────────────────────────── */}
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h3 className="fw-bold text-primary-brand mb-0">Your stats</h3>
            {!loading && total > 0 && (
              <Link href="/ai-prep/reviews" className="text-primary-brand small text-decoration-none">
                View all sessions <i className="bi bi-arrow-right" />
              </Link>
            )}
          </div>

          {loading ? (
            <div className="row g-3 mb-5">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="col-6 col-md-3">
                  <div className="card border-0 rounded-4 shadow-sm p-3" style={{ height: 88 }}>
                    <div className="placeholder-glow">
                      <span className="placeholder col-10 rounded" style={{ height: 16 }} />
                      <span className="placeholder col-6 rounded mt-2" style={{ height: 12 }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="row g-3 mb-5">
              <StatCard icon="bi-folder2-open"   label="Sessions started"   value={total}           accent={total > 0} />
              <StatCard icon="bi-send"            label="Submitted"          value={submitted}       accent={submitted > 0} />
              <StatCard icon="bi-patch-check"     label="Reviewed"           value={reviewed}        accent={reviewed > 0} />
              <StatCard icon="bi-hourglass-split" label="In progress"        value={inProgress}      accent={inProgress > 0} />
              <StatCard icon="bi-bar-chart-line"  label="Avg AI score"       value={avgScore !== null ? `${avgScore}/100` : '—'} accent={avgScore !== null} />
              <StatCard icon="bi-trophy"          label="Best score"         value={bestScore !== null ? `${bestScore}/100` : '—'} accent={bestScore !== null} />
              <StatCard icon="bi-chat-dots"       label="Questions asked"    value={questionsAsked}  accent={questionsAsked > 0} />
              <StatCard icon="bi-activity"        label="Active this week"   value={thisWeek}        accent={thisWeek > 0} />
            </div>
          )}

          {/* ── Smart guidance ───────────────────────────────────────────────── */}
          {!loading && guidance.length > 0 && (
            <>
              <h3 className="fw-bold text-primary-brand mb-3">What to do next</h3>
              <div className="d-flex flex-column gap-2 mb-5">
                {guidance.map((g, i) => (
                  <div
                    key={i}
                    className={`alert alert-${g.variant} rounded-4 py-3 px-4 mb-0 d-flex align-items-center justify-content-between gap-3`}
                  >
                    <div className="d-flex align-items-center gap-3">
                      <i className={`bi ${g.icon} fs-5 flex-shrink-0`} />
                      <span>{g.text}</span>
                    </div>
                    {g.href && (
                      <Link href={g.href} className={`btn btn-sm btn-${g.variant} rounded-pill flex-shrink-0`}>
                        Go <i className="bi bi-arrow-right ms-1" />
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ── Recent activity ──────────────────────────────────────────────── */}
          <h3 className="fw-bold text-primary-brand mb-3">Recent activity</h3>

          {loading ? (
            <div className="card border-0 rounded-4 shadow-sm p-4">
              <div className="placeholder-glow d-flex flex-column gap-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <span key={i} className="placeholder col-12 rounded" style={{ height: 32 }} />
                ))}
              </div>
            </div>
          ) : recentSessions.length === 0 ? (
            <div className="alert alert-info rounded-4 py-4">
              <i className="bi bi-info-circle me-2" />
              <strong>No activity yet.</strong> Start by browsing scholarships or submitting an essay for review.
            </div>
          ) : (
            <div className="card border-0 rounded-4 shadow-sm overflow-hidden mb-5">
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th className="ps-4 py-3 fw-semibold text-muted small text-uppercase" style={{ letterSpacing: '0.06em' }}>Scholarship ID</th>
                      <th className="py-3 fw-semibold text-muted small text-uppercase" style={{ letterSpacing: '0.06em' }}>Status</th>
                      <th className="py-3 fw-semibold text-muted small text-uppercase" style={{ letterSpacing: '0.06em' }}>AI Score</th>
                      <th className="py-3 fw-semibold text-muted small text-uppercase" style={{ letterSpacing: '0.06em' }}>Questions</th>
                      <th className="py-3 fw-semibold text-muted small text-uppercase" style={{ letterSpacing: '0.06em' }}>Last updated</th>
                      <th className="pe-4 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {recentSessions.map((s) => (
                      <tr key={s.id}>
                        <td className="ps-4 fw-semibold">#{s.scholarship}</td>
                        <td>{statusBadge(s.status)}</td>
                        <td>
                          {s.feedback?.overall_score != null ? (
                            <span
                              className="fw-semibold"
                              style={{ color: s.feedback.overall_score >= 70 ? '#198754' : '#A31F34' }}
                            >
                              {s.feedback.overall_score}/100
                            </span>
                          ) : (
                            <span className="text-muted">—</span>
                          )}
                        </td>
                        <td className="text-muted">
                          {s.chat_messages.filter((m) => m.role === 'user').length}
                        </td>
                        <td className="text-muted small">{fmtDate(s.updated_at)}</td>
                        <td className="pe-4 text-end">
                          <Link
                            href={`/ai-prep/${s.scholarship}`}
                            className="btn btn-sm btn-outline-primary-brand rounded-pill"
                          >
                            Open
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── Quick actions ────────────────────────────────────────────────── */}
          <hr className="my-5" />
          <h3 className="fw-bold text-primary-brand mb-4">Quick actions</h3>
          <div className="row g-3 mb-5">
            <div className="col-md-4">
              <Link href="/scholarships" className="card p-4 h-100 shadow-sm border-0 rounded-4 feature-box text-decoration-none">
                <div className="card-body text-center">
                  <i className="bi bi-search display-4 text-primary-brand mb-3 d-block" />
                  <h5 className="fw-bold text-dark">Browse Scholarships</h5>
                  <p className="text-muted mb-0 small">Search and filter thousands of opportunities.</p>
                </div>
              </Link>
            </div>
            <div className="col-md-4">
              <div className="card p-4 h-100 shadow-sm border-0 rounded-4 feature-box" style={{ opacity: 0.6 }}>
                <div className="card-body text-center">
                  <i className="bi bi-calendar-check display-4 text-primary-brand mb-3 d-block" />
                  <h5 className="fw-bold text-dark">Track Deadlines</h5>
                  <p className="text-muted mb-0 small">Coming soon — bookmark and track application deadlines.</p>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <Link href="/ai-prep" className="card p-4 h-100 shadow-sm border-0 rounded-4 feature-box text-decoration-none">
                <div className="card-body text-center">
                  <i className="bi bi-robot display-4 text-primary-brand mb-3 d-block" />
                  <h5 className="fw-bold text-dark">AI Application Guide</h5>
                  <p className="text-muted mb-0 small">Review requirements, submit your essay for scoring, and chat with AI.</p>
                </div>
              </Link>
            </div>
          </div>

          {/* ── Profile summary ──────────────────────────────────────────────── */}
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

        </div>
      </section>
    </>
  );
}
