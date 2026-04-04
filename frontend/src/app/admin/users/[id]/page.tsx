'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useMessaging } from '@/context/MessagingContext';
import api from '@/services/api';
import type { AdminUserDetail, Message } from '@/types';

// ─── helpers ─────────────────────────────────────────────────────────────────

function fmtDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

function fmtDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function statusBadge(status: string) {
  const map: Record<string, { label: string; cls: string }> = {
    in_progress: { label: 'In Progress', cls: 'bg-warning text-dark' },
    submitted:   { label: 'Submitted',   cls: 'bg-primary'           },
    reviewed:    { label: 'Reviewed',    cls: 'bg-success'           },
    archived:    { label: 'Archived',    cls: 'bg-secondary'         },
  };
  const { label, cls } = map[status] ?? { label: status, cls: 'bg-secondary' };
  return <span className={`badge rounded-pill ${cls}`}>{label}</span>;
}

function safeList(raw: string): string[] {
  try { return JSON.parse(raw) as string[]; } catch { return raw ? [raw] : []; }
}

// ─── score ring ──────────────────────────────────────────────────────────────

function ScoreRing({ score }: { score: number }) {
  const color = score >= 70 ? '#198754' : score >= 50 ? '#fd7e14' : '#A31F34';
  return (
    <div className="d-flex flex-column align-items-center justify-content-center"
      style={{ width: 80, height: 80, borderRadius: '50%', border: `6px solid ${color}`, flexShrink: 0 }}>
      <span className="fw-bold fs-4 lh-1" style={{ color }}>{score}</span>
      <span className="text-muted" style={{ fontSize: '0.65rem' }}>/100</span>
    </div>
  );
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default function AdminUserDetailPage() {
  const { user, initialising } = useAuth();
  const router = useRouter();
  const params = useParams();
  const userId = Number(params.id);

  const { send, lastMessage, markRead } = useMessaging();

  const [detail, setDetail] = useState<AdminUserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [openSession, setOpenSession] = useState<number | null>(null);

  // ── chat state ────────────────────────────────────────────────────────────
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialising) return;
    if (!user) { router.replace('/login'); return; }
    if (!user.is_staff && !user.is_superuser) { router.replace('/dashboard'); return; }
  }, [initialising, user, router]);

  useEffect(() => {
    if (!user?.is_staff && !user?.is_superuser) return;
    api.getAdminUserDetail(userId)
      .then(setDetail)
      .catch(() => router.replace('/admin'))
      .finally(() => setLoading(false));
  }, [user, userId, router]);

  // Load conversation history and mark as read
  useEffect(() => {
    if (!user?.is_staff && !user?.is_superuser) return;
    setChatLoading(true);
    api.getAdminConversation(userId)
      .then((msgs) => { setChatMessages(msgs); markRead(userId); })
      .catch(() => {})
      .finally(() => setChatLoading(false));
  }, [user, userId, markRead]);

  // Append real-time messages for this user
  useEffect(() => {
    if (!lastMessage) return;
    const isForThisUser =
      lastMessage.from_user_id === userId ||
      (!lastMessage.is_mine && lastMessage.sender_id === userId);
    const isMyEcho = lastMessage.is_mine;
    if (!isForThisUser && !isMyEcho) return;
    setChatMessages((prev) => {
      if (prev.some((m) => m.id === lastMessage.id)) return prev;
      return [...prev, lastMessage];
    });
  }, [lastMessage, userId]);

  // Auto-scroll chat
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  if (initialising || !user) return null;
  if (!user.is_staff && !user.is_superuser) return null;

  function handleChatSend() {
    const content = chatInput.trim();
    if (!content) return;
    send(content, userId);
    setChatInput('');
  }

  const u = detail?.user;
  const sessions = detail?.sessions ?? [];
  const scores = sessions.filter((s) => s.feedback).map((s) => s.feedback!.overall_score);
  const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
  const totalQuestions = sessions.reduce(
    (acc, s) => acc + s.chat_messages.filter((m) => m.role === 'user').length, 0
  );

  return (
    <>
      {/* Header */}
      <section className="bg-light-brand py-4 border-bottom">
        <div className="container">
          <div className="d-flex justify-content-between align-items-center gap-3 flex-wrap">
            <div>
              {loading ? (
                <div className="placeholder-glow">
                  <span className="placeholder col-6 rounded" style={{ height: 28 }} />
                </div>
              ) : (
                <>
                  <h1 className="fw-bold text-primary-brand mb-1">
                    {u?.first_name || u?.username} {u?.last_name}
                  </h1>
                  <p className="text-muted mb-0">
                    @{u?.username} · {u?.email}
                    {u?.is_staff && (
                      <span className="badge rounded-pill ms-2" style={{ background: '#FCE8E9', color: '#A31F34' }}>Staff</span>
                    )}
                    {!u?.is_active && (
                      <span className="badge rounded-pill bg-secondary ms-1">Inactive</span>
                    )}
                  </p>
                </>
              )}
            </div>
            <Link href="/admin" className="btn btn-outline-primary-brand rounded-pill flex-shrink-0">
              <i className="bi bi-arrow-left me-2" />
              Back to Admin
            </Link>
          </div>
        </div>
      </section>

      <section className="py-5">
        <div className="container">

          {loading ? (
            <div className="placeholder-glow d-flex flex-column gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <span key={i} className="placeholder col-12 rounded" style={{ height: 40 }} />
              ))}
            </div>
          ) : (
            <>
              {/* ── Profile + quick stats ─────────────────────────────────── */}
              <div className="row g-4 mb-5">
                <div className="col-md-4">
                  <div className="card border-0 rounded-4 shadow-sm p-4 h-100">
                    <h6 className="fw-bold text-muted text-uppercase mb-3" style={{ fontSize: '0.72rem', letterSpacing: '0.08em' }}>Profile</h6>
                    <p className="mb-2"><strong>Joined:</strong> {fmtDate(u?.date_joined ?? null)}</p>
                    <p className="mb-2"><strong>Institution:</strong> {u?.profile.institution || '—'}</p>
                    <p className="mb-2"><strong>Field of study:</strong> {u?.profile.field_of_study || '—'}</p>
                    <p className="mb-2"><strong>Country:</strong> {u?.profile.country || '—'}</p>
                    {u?.profile.bio && <p className="mb-0 text-muted small">{u.profile.bio}</p>}
                  </div>
                </div>

                <div className="col-md-8">
                  <div className="row g-3 h-100">
                    {[
                      { icon: 'bi-folder2-open',   label: 'Sessions',         value: sessions.length },
                      { icon: 'bi-patch-check',    label: 'Reviewed',         value: sessions.filter((s) => s.status === 'reviewed').length },
                      { icon: 'bi-hourglass-split',label: 'In progress',      value: sessions.filter((s) => s.status === 'in_progress').length },
                      { icon: 'bi-bar-chart-line', label: 'Avg AI score',     value: avgScore !== null ? `${avgScore}/100` : '—' },
                      { icon: 'bi-trophy',         label: 'Best score',       value: scores.length ? `${Math.max(...scores)}/100` : '—' },
                      { icon: 'bi-chat-dots',      label: 'Questions asked',  value: totalQuestions },
                    ].map((s) => (
                      <div key={s.label} className="col-6 col-lg-4">
                        <div className="card border-0 rounded-4 shadow-sm p-3 h-100"
                          style={{ borderLeft: '4px solid #A31F34' }}>
                          <div className="d-flex align-items-center gap-2">
                            <div className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
                              style={{ width: 36, height: 36, background: '#FCE8E9' }}>
                              <i className={`bi ${s.icon} fs-6`} style={{ color: '#A31F34' }} />
                            </div>
                            <div>
                              <div className="fw-bold fs-5 lh-1">{s.value}</div>
                              <div className="text-muted" style={{ fontSize: '0.7rem' }}>{s.label}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* ── Sessions ──────────────────────────────────────────────── */}
              <h4 className="fw-bold text-primary-brand mb-3">
                Sessions
                <span className="badge rounded-pill fw-normal fs-6 ms-2"
                  style={{ background: '#FCE8E9', color: '#A31F34' }}>
                  {sessions.length}
                </span>
              </h4>

              {sessions.length === 0 ? (
                <div className="alert alert-info rounded-4 py-4">
                  <i className="bi bi-info-circle me-2" />
                  This user has no AI review sessions yet.
                </div>
              ) : (
                <div className="d-flex flex-column gap-3">
                  {sessions.map((s) => {
                    const isOpen = openSession === s.id;
                    const userMsgs = s.chat_messages.filter((m) => m.role === 'user').length;
                    const strengths = s.feedback ? safeList(s.feedback.strengths) : [];
                    const improvements = s.feedback ? safeList(s.feedback.improvements) : [];

                    return (
                      <div key={s.id} className="card border-0 rounded-4 shadow-sm overflow-hidden">
                        {/* Session header — always visible */}
                        <button
                          className="btn text-start p-4 w-100 d-flex align-items-center gap-3"
                          style={{ background: 'none', border: 'none' }}
                          onClick={() => setOpenSession(isOpen ? null : s.id)}
                        >
                          <div className="flex-grow-1">
                            <div className="d-flex align-items-center gap-2 flex-wrap">
                              <span className="fw-bold">{s.scholarship_name}</span>
                              {statusBadge(s.status)}
                              {userMsgs > 0 && (
                                <span className="badge rounded-pill bg-light text-muted border">
                                  <i className="bi bi-chat-dots me-1" />{userMsgs} question{userMsgs !== 1 ? 's' : ''}
                                </span>
                              )}
                            </div>
                            <div className="text-muted small mt-1">
                              Started {fmtDate(s.created_at)} · Last updated {fmtDate(s.updated_at)}
                            </div>
                          </div>
                          {s.feedback && <ScoreRing score={s.feedback.overall_score} />}
                          <i className={`bi ${isOpen ? 'bi-chevron-up' : 'bi-chevron-down'} text-muted ms-2`} />
                        </button>

                        {/* Expanded detail */}
                        {isOpen && (
                          <div className="border-top px-4 pb-4 pt-3">

                            {/* No feedback yet */}
                            {!s.feedback ? (
                              <div className="alert alert-warning rounded-3 mb-0">
                                <i className="bi bi-clock me-2" />
                                Essay not yet reviewed — no AI feedback available.
                              </div>
                            ) : (
                              <>
                                {/* Feedback categories */}
                                <div className="row g-3 mb-4">
                                  {[
                                    { label: 'Structure',       text: s.feedback.structure_feedback },
                                    { label: 'Clarity',         text: s.feedback.clarity_feedback },
                                    { label: 'Relevance',       text: s.feedback.relevance_feedback },
                                    { label: 'Persuasiveness',  text: s.feedback.persuasiveness_feedback },
                                    { label: 'Grammar & Style', text: s.feedback.grammar_feedback },
                                  ].map((f) => (
                                    <div key={f.label} className="col-md-6">
                                      <div className="bg-light rounded-3 p-3 h-100">
                                        <div className="fw-semibold small text-muted text-uppercase mb-1"
                                          style={{ fontSize: '0.68rem', letterSpacing: '0.06em' }}>
                                          {f.label}
                                        </div>
                                        <div className="small">{f.text || '—'}</div>
                                      </div>
                                    </div>
                                  ))}
                                </div>

                                {/* Strengths & improvements */}
                                <div className="row g-3 mb-4">
                                  <div className="col-md-6">
                                    <div className="rounded-3 p-3 h-100" style={{ background: '#f0fdf4' }}>
                                      <div className="fw-semibold small text-uppercase mb-2"
                                        style={{ fontSize: '0.68rem', letterSpacing: '0.06em', color: '#198754' }}>
                                        <i className="bi bi-check-circle me-1" />Strengths
                                      </div>
                                      {strengths.length ? (
                                        <ul className="mb-0 ps-3 small">
                                          {strengths.map((t, i) => <li key={i}>{t}</li>)}
                                        </ul>
                                      ) : <span className="text-muted small">—</span>}
                                    </div>
                                  </div>
                                  <div className="col-md-6">
                                    <div className="rounded-3 p-3 h-100" style={{ background: '#fff5f5' }}>
                                      <div className="fw-semibold small text-uppercase mb-2"
                                        style={{ fontSize: '0.68rem', letterSpacing: '0.06em', color: '#A31F34' }}>
                                        <i className="bi bi-arrow-up-circle me-1" />Improvements
                                      </div>
                                      {improvements.length ? (
                                        <ul className="mb-0 ps-3 small">
                                          {improvements.map((t, i) => <li key={i}>{t}</li>)}
                                        </ul>
                                      ) : <span className="text-muted small">—</span>}
                                    </div>
                                  </div>
                                </div>

                                {/* Next steps */}
                                {s.feedback.next_steps && (
                                  <div className="rounded-3 p-3 mb-4" style={{ background: '#f8f9fa' }}>
                                    <div className="fw-semibold small text-uppercase mb-1"
                                      style={{ fontSize: '0.68rem', letterSpacing: '0.06em', color: '#0d6efd' }}>
                                      <i className="bi bi-arrow-right-circle me-1" />Next steps
                                    </div>
                                    <div className="small">{s.feedback.next_steps}</div>
                                  </div>
                                )}
                              </>
                            )}

                            {/* Chat messages */}
                            {s.chat_messages.length > 0 && (
                              <>
                                <div className="fw-semibold small text-muted text-uppercase mb-2"
                                  style={{ fontSize: '0.72rem', letterSpacing: '0.08em' }}>
                                  <i className="bi bi-chat-dots me-1" />Chat history
                                </div>
                                <div className="d-flex flex-column gap-2"
                                  style={{ maxHeight: 320, overflowY: 'auto' }}>
                                  {s.chat_messages.map((m) => (
                                    <div key={m.id}
                                      className={`d-flex gap-2 ${m.role === 'user' ? 'justify-content-end' : 'justify-content-start'}`}>
                                      <div
                                        className="rounded-3 px-3 py-2 small"
                                        style={{
                                          maxWidth: '75%',
                                          background: m.role === 'user' ? '#A31F34' : '#f1f3f5',
                                          color: m.role === 'user' ? '#fff' : '#212529',
                                        }}
                                      >
                                        <div>{m.content}</div>
                                        <div className="mt-1 opacity-75" style={{ fontSize: '0.62rem' }}>
                                          {fmtDateTime(m.created_at)}
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </>
                            )}

                            {s.notes && (
                              <div className="mt-3 text-muted small">
                                <i className="bi bi-sticky me-1" />
                                <strong>User notes:</strong> {s.notes}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            {/* ── Direct message panel ────────────────────────────────────── */}
            <hr className="my-5" />
            <h4 className="fw-bold text-primary-brand mb-3">
              <i className="bi bi-chat-dots me-2" />
              Message {u?.first_name || u?.username}
            </h4>

            <div className="card border-0 rounded-4 shadow-sm overflow-hidden" style={{ maxWidth: 640 }}>
              <div
                className="p-3 d-flex flex-column gap-2"
                style={{ height: 320, overflowY: 'auto', background: '#f8f9fa' }}
              >
                {chatLoading ? (
                  <div className="text-center text-muted small pt-4">Loading…</div>
                ) : chatMessages.length === 0 ? (
                  <div className="text-center text-muted small pt-4">
                    <i className="bi bi-chat-dots d-block fs-3 mb-2 opacity-50" />
                    No messages yet. Start the conversation.
                  </div>
                ) : (
                  chatMessages.map((m) => (
                    <div key={m.id} className={`d-flex ${m.is_mine ? 'justify-content-end' : 'justify-content-start'}`}>
                      <div
                        className="rounded-3 px-3 py-2"
                        style={{
                          maxWidth: '75%',
                          background: m.is_mine ? '#A31F34' : '#fff',
                          color: m.is_mine ? '#fff' : '#212529',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                          fontSize: '0.875rem',
                        }}
                      >
                        {!m.is_mine && (
                          <div className="fw-semibold mb-1" style={{ fontSize: '0.7rem', opacity: 0.7 }}>
                            {u?.first_name || u?.username}
                          </div>
                        )}
                        <div>{m.content}</div>
                        <div className="mt-1 text-end" style={{ fontSize: '0.62rem', opacity: 0.65 }}>
                          {new Date(m.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  ))
                )}
                <div ref={chatBottomRef} />
              </div>
              <div className="p-2 border-top d-flex gap-2">
                <input
                  type="text"
                  className="form-control form-control-sm rounded-pill"
                  placeholder={`Message ${u?.first_name || u?.username}…`}
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleChatSend()}
                />
                <button
                  className="btn btn-sm rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                  style={{ width: 34, height: 34, background: '#A31F34', color: '#fff' }}
                  onClick={handleChatSend}
                  disabled={!chatInput.trim()}
                >
                  <i className="bi bi-send-fill" style={{ fontSize: '0.75rem' }} />
                </button>
              </div>
            </div>
            </>
          )}
        </div>
      </section>
    </>
  );
}
