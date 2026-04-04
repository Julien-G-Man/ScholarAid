'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import api from '@/services/api';
import type { AdminStats, AdminUser } from '@/types';

// ─── helpers ─────────────────────────────────────────────────────────────────

function fmtDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

// ─── stat card ───────────────────────────────────────────────────────────────

interface StatCardProps {
  icon: string;
  label: string;
  value: string | number;
  accent?: boolean;
  small?: boolean;
}

function StatCard({ icon, label, value, accent, small }: StatCardProps) {
  return (
    <div className={small ? 'col-6 col-md-2' : 'col-6 col-md-3'}>
      <div
        className="card border-0 rounded-4 shadow-sm h-100 p-3"
        style={{ borderLeft: `4px solid ${accent ? '#A31F34' : '#dee2e6'}` }}
      >
        <div className="d-flex align-items-center gap-3">
          <div
            className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
            style={{ width: 40, height: 40, background: accent ? '#FCE8E9' : '#f8f9fa' }}
          >
            <i className={`bi ${icon} fs-6`} style={{ color: accent ? '#A31F34' : '#6c757d' }} />
          </div>
          <div className="overflow-hidden">
            <div className="fw-bold fs-5 lh-1">{value}</div>
            <div className="text-muted mt-1 text-truncate" style={{ fontSize: '0.72rem' }}>{label}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const { user, initialising } = useAuth();
  const router = useRouter();

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (initialising) return;
    if (!user) { router.replace('/login'); return; }
    if (!user.is_staff && !user.is_superuser) { router.replace('/dashboard'); return; }
  }, [initialising, user, router]);

  useEffect(() => {
    if (!user?.is_staff && !user?.is_superuser) return;
    Promise.all([api.getAdminStats(), api.getAdminUsers()])
      .then(([s, u]) => { setStats(s); setUsers(u); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  if (initialising || !user) return null;
  if (!user.is_staff && !user.is_superuser) return null;

  // ── filtered users ────────────────────────────────────────────────────────
  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    return (
      !q ||
      u.username.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.first_name.toLowerCase().includes(q) ||
      u.last_name.toLowerCase().includes(q)
    );
  });

  return (
    <>
      {/* Header */}
      <section className="bg-light-brand py-4 border-bottom">
        <div className="container">
          <div className="d-flex justify-content-between align-items-center gap-3 flex-wrap">
            <div>
              <h1 className="fw-bold text-primary-brand mb-1">
                <i className="bi bi-shield-lock me-2" />
                Admin Dashboard
              </h1>
              <p className="text-muted mb-0">
                Platform overview — logged in as <strong>{user.username}</strong>
              </p>
            </div>
            <Link href="/dashboard" className="btn btn-outline-primary-brand rounded-pill flex-shrink-0">
              <i className="bi bi-arrow-left me-2" />
              User Dashboard
            </Link>
          </div>
        </div>
      </section>

      <section className="py-5">
        <div className="container">

          {/* ── Platform stats ─────────────────────────────────────────────── */}
          <h4 className="fw-bold text-primary-brand mb-3">Platform</h4>

          {loading ? (
            <div className="row g-3 mb-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="col-6 col-md-2">
                  <div className="card border-0 rounded-4 shadow-sm p-3" style={{ height: 80 }}>
                    <div className="placeholder-glow"><span className="placeholder col-10 rounded" style={{ height: 14 }} /></div>
                  </div>
                </div>
              ))}
            </div>
          ) : stats ? (
            <div className="row g-3 mb-5">
              <StatCard icon="bi-people"         label="Total users"          value={stats.platform.total_users}            accent small />
              <StatCard icon="bi-person-plus"    label="New this week"        value={stats.platform.new_users_this_week}    accent={stats.platform.new_users_this_week > 0} small />
              <StatCard icon="bi-mortarboard"    label="Scholarships"         value={stats.platform.total_scholarships}     accent small />
              <StatCard icon="bi-envelope-paper" label="Newsletter subs"      value={stats.platform.newsletter_subscribers} small />
              <StatCard icon="bi-chat-left-text" label="Contact messages"     value={stats.platform.total_contact_messages} small />
              <StatCard icon="bi-envelope-exclamation" label="Unread messages" value={stats.platform.unread_messages}       accent={stats.platform.unread_messages > 0} small />
            </div>
          ) : null}

          {/* ── AI stats ───────────────────────────────────────────────────── */}
          <h4 className="fw-bold text-primary-brand mb-3">AI Activity</h4>

          {loading ? (
            <div className="row g-3 mb-5">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="col-6 col-md-3">
                  <div className="card border-0 rounded-4 shadow-sm p-3" style={{ height: 80 }}>
                    <div className="placeholder-glow"><span className="placeholder col-10 rounded" style={{ height: 14 }} /></div>
                  </div>
                </div>
              ))}
            </div>
          ) : stats ? (
            <div className="row g-3 mb-5">
              <StatCard icon="bi-folder2-open"    label="Total sessions"    value={stats.ai.total_sessions}       accent={stats.ai.total_sessions > 0} />
              <StatCard icon="bi-hourglass-split" label="In progress"       value={stats.ai.in_progress}          accent={stats.ai.in_progress > 0} />
              <StatCard icon="bi-send"            label="Submitted"         value={stats.ai.submitted}            accent={stats.ai.submitted > 0} />
              <StatCard icon="bi-patch-check"     label="Reviewed"          value={stats.ai.reviewed}             accent={stats.ai.reviewed > 0} />
              <StatCard icon="bi-bar-chart-line"  label="Avg AI score"      value={stats.ai.avg_score ? `${stats.ai.avg_score}/100` : '—'} accent={stats.ai.avg_score > 0} />
              <StatCard icon="bi-chat-dots"       label="User messages"     value={stats.ai.total_chat_messages}  accent={stats.ai.total_chat_messages > 0} />
              <StatCard icon="bi-activity"        label="Active this week"  value={stats.ai.sessions_this_week}   accent={stats.ai.sessions_this_week > 0} />
              <StatCard icon="bi-archive"         label="Archived"          value={stats.ai.archived} />
            </div>
          ) : null}

          {/* ── User management ────────────────────────────────────────────── */}
          <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
            <h4 className="fw-bold text-primary-brand mb-0">
              Users
              {!loading && (
                <span className="badge rounded-pill ms-2 fw-normal fs-6" style={{ background: '#FCE8E9', color: '#A31F34' }}>
                  {users.length}
                </span>
              )}
            </h4>
            <div className="input-group" style={{ maxWidth: 280 }}>
              <span className="input-group-text bg-white border-end-0">
                <i className="bi bi-search text-muted" />
              </span>
              <input
                type="text"
                className="form-control border-start-0 rounded-end-pill"
                placeholder="Search users…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {loading ? (
            <div className="card border-0 rounded-4 shadow-sm p-4">
              <div className="placeholder-glow d-flex flex-column gap-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <span key={i} className="placeholder col-12 rounded" style={{ height: 32 }} />
                ))}
              </div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="alert alert-info rounded-4 py-4">
              <i className="bi bi-info-circle me-2" />
              {search ? 'No users match your search.' : 'No users yet.'}
            </div>
          ) : (
            <div className="card border-0 rounded-4 shadow-sm overflow-hidden">
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th className="ps-4 py-3 fw-semibold text-muted small text-uppercase" style={{ letterSpacing: '0.06em' }}>User</th>
                      <th className="py-3 fw-semibold text-muted small text-uppercase" style={{ letterSpacing: '0.06em' }}>Joined</th>
                      <th className="py-3 fw-semibold text-muted small text-uppercase" style={{ letterSpacing: '0.06em' }}>Sessions</th>
                      <th className="py-3 fw-semibold text-muted small text-uppercase" style={{ letterSpacing: '0.06em' }}>Reviewed</th>
                      <th className="py-3 fw-semibold text-muted small text-uppercase" style={{ letterSpacing: '0.06em' }}>Avg Score</th>
                      <th className="py-3 fw-semibold text-muted small text-uppercase" style={{ letterSpacing: '0.06em' }}>Questions</th>
                      <th className="py-3 fw-semibold text-muted small text-uppercase" style={{ letterSpacing: '0.06em' }}>Last active</th>
                      <th className="pe-4 py-3 fw-semibold text-muted small text-uppercase" style={{ letterSpacing: '0.06em' }}>Status</th>
                      <th className="pe-4 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((u) => (
                      <tr key={u.id}>
                        <td className="ps-4">
                          <div className="fw-semibold">{u.first_name || u.username} {u.last_name}</div>
                          <div className="text-muted small">@{u.username} · {u.email}</div>
                        </td>
                        <td className="text-muted small">{fmtDate(u.date_joined)}</td>
                        <td className="fw-semibold">{u.sessions_total}</td>
                        <td className="fw-semibold">{u.sessions_reviewed}</td>
                        <td>
                          {u.avg_score !== null ? (
                            <span
                              className="fw-semibold"
                              style={{ color: u.avg_score >= 70 ? '#198754' : '#A31F34' }}
                            >
                              {u.avg_score}/100
                            </span>
                          ) : (
                            <span className="text-muted">—</span>
                          )}
                        </td>
                        <td className="text-muted">{u.questions_asked}</td>
                        <td className="text-muted small">{fmtDate(u.last_active)}</td>
                        <td>
                          {u.is_active ? (
                            <span className="badge rounded-pill bg-success">Active</span>
                          ) : (
                            <span className="badge rounded-pill bg-secondary">Inactive</span>
                          )}
                          {u.is_staff && (
                            <span className="badge rounded-pill ms-1" style={{ background: '#FCE8E9', color: '#A31F34' }}>
                              Staff
                            </span>
                          )}
                        </td>
                        <td className="pe-4 text-end">
                          <Link
                            href={`/admin/users/${u.id}`}
                            className="btn btn-sm btn-outline-primary-brand rounded-pill"
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </section>
    </>
  );
}
