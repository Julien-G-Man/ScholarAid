'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import api from '@/services/api';
import type { Scholarship, ApplicationGuide, AIReviewSession } from '@/types';

export default function AIPrepDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const scholarshipId = parseInt(id, 10);
  const { user, initialising } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'requirements' | 'guide' | 'submit' | 'chat' | 'feedback'>('requirements');
  const [scholarship, setScholarship] = useState<Scholarship | null>(null);
  const [guides, setGuides] = useState<ApplicationGuide[]>([]);
  const [session, setSession] = useState<AIReviewSession | null>(null);
  const [loading, setLoading] = useState(true);

  // Form states
  const [essayText, setEssayText] = useState('');
  const [essayFile, setEssayFile] = useState<File | null>(null);
  const [submittingEssay, setSubmittingEssay] = useState(false);
  const [essayError, setEssayError] = useState<string | null>(null);

  const [chatMessage, setChatMessage] = useState('');
  const [sendingChat, setSendingChat] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);

  // Redirect if not logged in
  useEffect(() => {
    if (!initialising && !user) router.replace('/login');
  }, [initialising, user, router]);

  // Fetch scholarship, guides, and session
  useEffect(() => {
    if (user && scholarshipId) {
      Promise.all([
        api.getScholarship(scholarshipId),
        api.getAIPreparationGuides(scholarshipId),
        api.getAIReviewSessions().catch(() => []),
      ]).then(([sch, gds, sessions]) => {
        setScholarship(sch);
        setGuides(gds.guides || []);
        // Find matching session for this scholarship
        const matching = sessions.find((s: any) => s.scholarship === scholarshipId);
        if (matching) setSession(matching);
        setLoading(false);
      }).catch(() => setLoading(false));
    }
  }, [user, scholarshipId]);

  // Submit essay for review
  async function handleEssaySubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!essayText && !essayFile) {
      setEssayError('Please enter text or upload a file.');
      return;
    }

    setSubmittingEssay(true);
    setEssayError(null);
    try {
      const newSession = await api.submitAIReview({
        scholarship_id: scholarshipId,
        essay_text: essayText,
        essay_file: essayFile || undefined,
      });
      setSession(newSession);
      setEssayText('');
      setEssayFile(null);
      setActiveTab('feedback');
    } catch {
      setEssayError('Could not submit essay. Please try again.');
    } finally {
      setSubmittingEssay(false);
    }
  }

  // Send chat message
  async function handleChatSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!chatMessage.trim() || !session) return;

    setSendingChat(true);
    setChatError(null);
    try {
      const updated = await api.sendAIChatMessage(session.id, chatMessage);
      setSession({ ...session, chat_messages: updated.messages });
      setChatMessage('');
    } catch {
      setChatError('Could not send message. Please try again.');
    } finally {
      setSendingChat(false);
    }
  }

  if (initialising || !user || loading || !scholarship) return null;

  // Extract guide content by category
  const getGuideByCategory = (category: string) =>
    guides.find((g) => g.category === category)?.content || '';

  return (
    <div className="container py-5">
      {/* Scholarship Header */}
      <div className="mb-4">
        <div className="d-flex align-items-start justify-content-between gap-3 mb-3">
          <div>
            <h1 className="fw-bold text-primary-brand mb-1">{scholarship.name}</h1>
            <p className="text-muted mb-0">
              <strong>{scholarship.provider}</strong>
              {scholarship.level && ` • ${scholarship.level}`}
              {scholarship.deadline && (
                <>
                  {' • '}
                  <span className="text-danger">Deadline: {new Date(scholarship.deadline).toLocaleDateString()}</span>
                </>
              )}
            </p>
          </div>
          <a href={scholarship.link || '#'} target="_blank" rel="noopener noreferrer" className="btn btn-outline-primary-brand rounded-pill">
            <i className="bi bi-box-arrow-up-right me-2" />
            View on Site
          </a>
        </div>
        <p className="text-muted">{scholarship.description}</p>
      </div>

      {/* Tabs */}
      <div className="card shadow-sm border-0 rounded-4">
        <div className="card-header bg-light-brand border-0 rounded-4 rounded-bottom-0">
          <ul className="nav nav-tabs border-0 mb-0" role="tablist">
            <li className="nav-item">
              <button
                className={`nav-link fw-semibold rounded-0 border-0 ${activeTab === 'requirements' ? 'active text-primary-brand' : 'text-muted'}`}
                onClick={() => setActiveTab('requirements')}
              >
                <i className="bi bi-list-check me-2" />
                Requirements
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link fw-semibold rounded-0 border-0 ${activeTab === 'guide' ? 'active text-primary-brand' : 'text-muted'}`}
                onClick={() => setActiveTab('guide')}
              >
                <i className="bi bi-book me-2" />
                Guides
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link fw-semibold rounded-0 border-0 ${activeTab === 'submit' ? 'active text-primary-brand' : 'text-muted'}`}
                onClick={() => setActiveTab('submit')}
              >
                <i className="bi bi-pencil-square me-2" />
                Essay Review
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link fw-semibold rounded-0 border-0 ${activeTab === 'feedback' ? 'active text-primary-brand' : 'text-muted'}`}
                onClick={() => setActiveTab('feedback')}
              >
                <i className="bi bi-chat-dots me-2" />
                Feedback
                {session?.feedback && <span className="badge bg-success ms-1">✓</span>}
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link fw-semibold rounded-0 border-0 ${activeTab === 'chat' ? 'active text-primary-brand' : 'text-muted'}`}
                onClick={() => setActiveTab('chat')}
                disabled={!session}
              >
                <i className="bi bi-chat-left-text me-2" />
                Q&A
              </button>
            </li>
          </ul>
        </div>

        <div className="card-body p-4 p-md-5">
          {/* Requirements Tab */}
          {activeTab === 'requirements' && (
            <div>
              <h4 className="fw-bold text-primary-brand mb-4">Requirements & Eligibility</h4>
              {scholarship.eligibility ? (
                <div className="prose">
                  <p className="text-muted">{scholarship.eligibility}</p>
                </div>
              ) : (
                <p className="text-muted">No specific eligibility information available. Check the scholarship website for details.</p>
              )}
              <hr className="my-4" />
              <h5 className="fw-bold mb-3">Essay Prompt</h5>
              {scholarship.essay_prompt ? (
                <div className="bg-light p-3 rounded-3 border-start border-primary-brand border-5">
                  <p className="text-muted mb-0">{scholarship.essay_prompt}</p>
                </div>
              ) : (
                <p className="text-muted">No essay prompt provided.</p>
              )}
            </div>
          )}

          {/* Guides Tab */}
          {activeTab === 'guide' && (
            <div>
              <h4 className="fw-bold text-primary-brand mb-4">Preparation Guides</h4>

              {guides.length > 0 ? (
                <div className="accordion" id="guidesAccordion">
                  {guides.map((guide, idx) => (
                    <div key={guide.id} className="accordion-item border-0 mb-3 rounded-3 shadow-sm">
                      <h2 className="accordion-header">
                        <button
                          className="accordion-button rounded-3 fw-semibold text-primary-brand collapsed"
                          type="button"
                          data-bs-toggle="collapse"
                          data-bs-target={`#guide${idx}`}
                        >
                          <i className="bi bi-lightbulb me-2" />
                          {guide.category === 'overview' && 'Scholarship Overview'}
                          {guide.category === 'requirements' && 'Detailed Requirements'}
                          {guide.category === 'essay_tips' && 'Essay Writing Tips'}
                          {guide.category === 'common_mistakes' && 'Common Mistakes'}
                          {guide.category === 'standing_out' && 'How to Stand Out'}
                        </button>
                      </h2>
                      <div id={`guide${idx}`} className="accordion-collapse collapse" data-bs-parent="#guidesAccordion">
                        <div className="accordion-body">
                          <div className="prose">
                            {guide.content.split('\n').map((line, i) => (
                              line.trim() && <p key={i} className="text-muted">{line}</p>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted">No guides available yet. Check back soon!</p>
              )}
            </div>
          )}

          {/* Essay Review Tab */}
          {activeTab === 'submit' && (
            <div>
              <h4 className="fw-bold text-primary-brand mb-4">Submit Essay for Review</h4>
              <form onSubmit={handleEssaySubmit}>
                {essayError && <div className="alert alert-danger">{essayError}</div>}

                <div className="mb-4">
                  <label className="form-label fw-semibold">Your Essay</label>
                  <textarea
                    className="form-control form-control-lg rounded-3"
                    placeholder="Paste your essay here or upload a file below…"
                    rows={10}
                    value={essayText}
                    onChange={(e) => setEssayText(e.target.value)}
                    style={{ fontFamily: 'monospace' }}
                  />
                </div>

                <div className="mb-4">
                  <label className="form-label fw-semibold">Or Upload File</label>
                  <div className="file-upload-box">
                    <i className="bi bi-file-earmark-pdf display-5 text-primary-brand mb-3 d-block" />
                    <p className="text-muted mb-2">PDF, DOCX, TXT, or Markdown</p>
                    <label className="btn btn-primary-brand btn-sm">
                      {essayFile ? essayFile.name : 'Choose file'}
                      <input
                        className="d-none"
                        type="file"
                        accept=".pdf,.doc,.docx,.txt,.md"
                        onChange={(e) => setEssayFile(e.target.files?.[0] ?? null)}
                      />
                    </label>
                  </div>
                </div>

                <button type="submit" className="btn btn-primary-brand btn-lg rounded-pill w-100" disabled={submittingEssay}>
                  <i className="bi bi-brain me-2" />
                  {submittingEssay ? 'Analyzing…' : 'Get AI Review'}
                </button>
              </form>
            </div>
          )}

          {/* Feedback Tab */}
          {activeTab === 'feedback' && session?.feedback ? (
            <div>
              <h4 className="fw-bold text-primary-brand mb-4">AI Feedback</h4>

              {/* Overall Score */}
              <div className="row g-3 mb-4">
                <div className="col-md-4">
                  <div className="card text-center border-0 bg-light-brand rounded-4">
                    <div className="card-body">
                      <h1 className="fw-bold text-primary-brand mb-0">{session.feedback.overall_score}</h1>
                      <p className="text-muted small mb-0">Overall Score</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Detailed Feedback */}
              {[
                ['structure', 'Structure', session.feedback.structure_feedback],
                ['clarity', 'Clarity', session.feedback.clarity_feedback],
                ['relevance', 'Relevance', session.feedback.relevance_feedback],
                ['persuasiveness', 'Persuasiveness', session.feedback.persuasiveness_feedback],
                ['grammar', 'Grammar & Style', session.feedback.grammar_feedback],
              ].map(([key, label, feedback]) => (
                <div key={key} className="mb-3 p-3 border-start border-5 border-primary-brand rounded-2 bg-light">
                  <h6 className="fw-bold text-primary-brand mb-2">{label}</h6>
                  <p className="text-muted mb-0">{feedback}</p>
                </div>
              ))}

              {/* Strengths & Improvements */}
              {session.feedback.strengths && (
                <div className="mt-4">
                  <h5 className="fw-bold mb-3">Strengths</h5>
                  <ul className="list-unstyled">
                    {JSON.parse(session.feedback.strengths).map((s: string, i: number) => (
                      <li key={i} className="mb-2">
                        <i className="bi bi-check-circle text-success me-2" />
                        <span className="text-muted">{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {session.feedback.improvements && (
                <div className="mt-4">
                  <h5 className="fw-bold mb-3">Suggestions for Improvement</h5>
                  <ul className="list-unstyled">
                    {JSON.parse(session.feedback.improvements).map((s: string, i: number) => (
                      <li key={i} className="mb-2">
                        <i className="bi bi-lightbulb text-warning me-2" />
                        <span className="text-muted">{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {session.feedback.next_steps && (
                <div className="mt-4 p-3 bg-light-brand rounded-3">
                  <h6 className="fw-bold text-primary-brand mb-2">Next Steps</h6>
                  <p className="text-muted mb-0">{session.feedback.next_steps}</p>
                </div>
              )}
            </div>
          ) : activeTab === 'feedback' ? (
            <div className="alert alert-info rounded-4">
              <i className="bi bi-info-circle me-2" />
              Submit an essay first to receive AI feedback.
            </div>
          ) : null}

          {/* Q&A Chat Tab */}
          {activeTab === 'chat' && session ? (
            <div>
              <h4 className="fw-bold text-primary-brand mb-4">Ask the AI Guide</h4>

              {/* Chat messages */}
              <div className="mb-4" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {session.chat_messages.length > 0 ? (
                  session.chat_messages.map((msg) => (
                    <div key={msg.id} className={`mb-3 d-flex ${msg.role === 'user' ? 'justify-content-end' : ''}`}>
                      <div
                        className={`p-3 rounded-3 ${
                          msg.role === 'user'
                            ? 'bg-primary-brand text-white'
                            : 'bg-light text-dark border border-primary-brand border-opacity-25'
                        }`}
                        style={{ maxWidth: '80%' }}
                      >
                        <p className="mb-1 small">{msg.content}</p>
                        <small className={msg.role === 'user' ? 'text-white-50' : 'text-muted'}>
                          {new Date(msg.created_at).toLocaleTimeString()}
                        </small>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-muted">Ask a question about the scholarship or essay...</p>
                )}
              </div>

              {/* Chat input */}
              {chatError && <div className="alert alert-danger">{chatError}</div>}
              <form onSubmit={handleChatSubmit}>
                <div className="input-group">
                  <input
                    type="text"
                    className="form-control form-control-lg rounded-start-3"
                    placeholder="Ask a question…"
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                  />
                  <button
                    type="submit"
                    className="btn btn-primary-brand rounded-end-3"
                    disabled={sendingChat || !chatMessage.trim()}
                  >
                    <i className="bi bi-send me-2" />
                    {sendingChat ? 'Sending…' : 'Send'}
                  </button>
                </div>
              </form>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
