'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import api from '@/services/api';
import type { ScholarshipDraft } from '@/types';

type InputTab = 'url' | 'text';
type Step = 'input' | 'review';

const EMPTY_DRAFT: ScholarshipDraft = {
  name: '',
  provider: '',
  institution: '',
  level: '',
  description: '',
  eligibility: '',
  essay_prompt: '',
  deadline: '',
  link: '',
  logo_url: '',
};

function nullToEmpty(draft: ScholarshipDraft): ScholarshipDraft {
  return Object.fromEntries(
    Object.entries(draft).map(([k, v]) => [k, v ?? ''])
  ) as ScholarshipDraft;
}

function emptyToNull(draft: ScholarshipDraft): ScholarshipDraft {
  return Object.fromEntries(
    Object.entries(draft).map(([k, v]) => [k, v === '' ? null : v])
  ) as ScholarshipDraft;
}

export default function ScholarshipIntakePage() {
  const { user, initialising } = useAuth();
  const router = useRouter();

  const [tab, setTab] = useState<InputTab>('url');
  const [inputContent, setInputContent] = useState('');
  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);

  const [step, setStep] = useState<Step>('input');
  const [draft, setDraft] = useState<ScholarshipDraft>(EMPTY_DRAFT);

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  // Guard: redirect non-admins once auth is resolved
  useEffect(() => {
    if (!initialising && (!user || !user.is_staff)) {
      router.replace('/');
    }
  }, [initialising, user, router]);

  if (initialising || !user?.is_staff) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-danger" role="status">
          <span className="visually-hidden">Loading…</span>
        </div>
      </div>
    );
  }

  // ── Step 1: extract ──────────────────────────────────────────────────────

  async function handleExtract(e: React.FormEvent) {
    e.preventDefault();
    if (!inputContent.trim()) return;
    setExtracting(true);
    setExtractError(null);
    try {
      const result = await api.extractScholarship({
        input_type: tab,
        content: inputContent.trim(),
      });
      setDraft(nullToEmpty(result));
      setStep('review');
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'Extraction failed. Please try again.';
      setExtractError(msg);
    } finally {
      setExtracting(false);
    }
  }

  // ── Step 2: save ─────────────────────────────────────────────────────────

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaveError(null);
    try {
      await api.adminCreateScholarship(emptyToNull(draft));
      setSaved(true);
    } catch (err: unknown) {
      const data = (err as { response?: { data?: Record<string, string[]> } })?.response?.data;
      const msg = data
        ? Object.entries(data)
            .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
            .join(' | ')
        : 'Failed to save scholarship.';
      setSaveError(msg);
    } finally {
      setSaving(false);
    }
  }

  function handleField(key: keyof ScholarshipDraft, value: string) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  // ── Saved confirmation ────────────────────────────────────────────────────

  if (saved) {
    return (
      <div className="container py-5 text-center" style={{ maxWidth: 540 }}>
        <i className="bi bi-check-circle-fill display-3 text-success mb-3 d-block" />
        <h2 className="fw-bold text-primary-brand mb-2">Scholarship Saved!</h2>
        <p className="text-muted mb-4">
          <strong>{draft.name}</strong> has been added to the database.
        </p>
        <div className="d-flex gap-3 justify-content-center">
          <button
            className="btn btn-outline-secondary rounded-pill px-4"
            onClick={() => {
              setDraft(EMPTY_DRAFT);
              setInputContent('');
              setStep('input');
              setSaved(false);
            }}
          >
            Add Another
          </button>
          <button
            className="btn btn-primary-brand rounded-pill px-4"
            onClick={() => router.push('/scholarships')}
          >
            View Scholarships
          </button>
        </div>
      </div>
    );
  }

  // ── Step 1: input form ────────────────────────────────────────────────────

  if (step === 'input') {
    return (
      <>
        <div className="page-hero d-flex flex-column justify-content-center align-items-center">
          <div className="container text-center">
            <h1 className="display-4 fw-bold">AI Scholarship Intake</h1>
            <p className="lead">
              Paste a URL or raw text — Claude will extract and pre-fill the scholarship fields for you.
            </p>
          </div>
        </div>

        <section className="py-5">
          <div className="container" style={{ maxWidth: 720 }}>
            <div className="bg-white rounded-4 shadow-sm p-4 p-md-5">
              {/* Input type tabs */}
              <ul className="nav nav-pills mb-4">
                <li className="nav-item">
                  <button
                    className={`nav-link${tab === 'url' ? ' active' : ''}`}
                    onClick={() => setTab('url')}
                    type="button"
                  >
                    <i className="bi bi-link-45deg me-1" />
                    URL
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    className={`nav-link${tab === 'text' ? ' active' : ''}`}
                    onClick={() => setTab('text')}
                    type="button"
                  >
                    <i className="bi bi-file-text me-1" />
                    Raw Text
                  </button>
                </li>
              </ul>

              <form onSubmit={handleExtract}>
                {tab === 'url' ? (
                  <div className="mb-4">
                    <label htmlFor="url-input" className="form-label fw-semibold">
                      Scholarship Page URL
                    </label>
                    <input
                      id="url-input"
                      type="url"
                      className="form-control rounded-3"
                      placeholder="https://example.com/scholarship"
                      value={inputContent}
                      onChange={(e) => setInputContent(e.target.value)}
                      required
                    />
                    <div className="form-text">
                      The server will fetch the page and extract scholarship details.
                    </div>
                  </div>
                ) : (
                  <div className="mb-4">
                    <label htmlFor="text-input" className="form-label fw-semibold">
                      Scholarship Description / Announcement
                    </label>
                    <textarea
                      id="text-input"
                      className="form-control rounded-3"
                      rows={10}
                      placeholder="Paste the full scholarship description here…"
                      value={inputContent}
                      onChange={(e) => setInputContent(e.target.value)}
                      required
                      style={{ minHeight: 200, resize: 'vertical' }}
                    />
                  </div>
                )}

                {extractError && (
                  <div className="alert alert-danger mb-3">{extractError}</div>
                )}

                <div className="d-grid">
                  <button
                    type="submit"
                    className="btn btn-primary-brand btn-lg rounded-pill"
                    disabled={extracting}
                  >
                    {extracting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" />
                        Extracting with Claude…
                      </>
                    ) : (
                      <>
                        <i className="bi bi-stars me-2" />
                        Extract Fields
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </section>
      </>
    );
  }

  // ── Step 2: review & save form ────────────────────────────────────────────

  return (
    <>
      <div className="page-hero d-flex flex-column justify-content-center align-items-center">
        <div className="container text-center">
          <h1 className="display-4 fw-bold">Review & Save</h1>
          <p className="lead">
            Check the extracted fields, edit anything that looks off, then save.
          </p>
        </div>
      </div>

      <section className="py-5">
        <div className="container" style={{ maxWidth: 860 }}>
          <div className="bg-white rounded-4 shadow-sm p-4 p-md-5">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h4 className="fw-bold mb-0">Extracted Fields</h4>
              <button
                className="btn btn-outline-secondary btn-sm rounded-pill"
                onClick={() => { setStep('input'); setSaveError(null); }}
              >
                <i className="bi bi-arrow-left me-1" />
                Back
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Name *</label>
                  <input
                    className="form-control rounded-3"
                    value={draft.name}
                    onChange={(e) => handleField('name', e.target.value)}
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Provider *</label>
                  <input
                    className="form-control rounded-3"
                    value={draft.provider}
                    onChange={(e) => handleField('provider', e.target.value)}
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Institution</label>
                  <input
                    className="form-control rounded-3"
                    value={draft.institution ?? ''}
                    onChange={(e) => handleField('institution', e.target.value)}
                    placeholder="e.g. University of Ghana"
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Level</label>
                  <input
                    className="form-control rounded-3"
                    value={draft.level ?? ''}
                    onChange={(e) => handleField('level', e.target.value)}
                    placeholder="e.g. Undergraduate, Postgraduate"
                  />
                </div>
                <div className="col-12">
                  <label className="form-label fw-semibold">Description *</label>
                  <textarea
                    className="form-control rounded-3"
                    rows={4}
                    value={draft.description}
                    onChange={(e) => handleField('description', e.target.value)}
                    required
                    style={{ resize: 'vertical' }}
                  />
                </div>
                <div className="col-12">
                  <label className="form-label fw-semibold">Eligibility</label>
                  <textarea
                    className="form-control rounded-3"
                    rows={3}
                    value={draft.eligibility ?? ''}
                    onChange={(e) => handleField('eligibility', e.target.value)}
                    style={{ resize: 'vertical' }}
                  />
                </div>
                <div className="col-12">
                  <label className="form-label fw-semibold">Essay Prompt</label>
                  <textarea
                    className="form-control rounded-3"
                    rows={3}
                    value={draft.essay_prompt ?? ''}
                    onChange={(e) => handleField('essay_prompt', e.target.value)}
                    style={{ resize: 'vertical' }}
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label fw-semibold">Deadline</label>
                  <input
                    type="date"
                    className="form-control rounded-3"
                    value={draft.deadline ?? ''}
                    onChange={(e) => handleField('deadline', e.target.value)}
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label fw-semibold">Application Link</label>
                  <input
                    type="url"
                    className="form-control rounded-3"
                    value={draft.link ?? ''}
                    onChange={(e) => handleField('link', e.target.value)}
                    placeholder="https://…"
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label fw-semibold">Logo URL</label>
                  <input
                    type="url"
                    className="form-control rounded-3"
                    value={draft.logo_url ?? ''}
                    onChange={(e) => handleField('logo_url', e.target.value)}
                    placeholder="https://…"
                  />
                </div>
              </div>

              {saveError && (
                <div className="alert alert-danger mt-4">{saveError}</div>
              )}

              <div className="d-grid mt-4">
                <button
                  type="submit"
                  className="btn btn-primary-brand btn-lg rounded-pill"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" />
                      Saving…
                    </>
                  ) : (
                    <>
                      <i className="bi bi-floppy me-2" />
                      Save Scholarship
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>
    </>
  );
}
