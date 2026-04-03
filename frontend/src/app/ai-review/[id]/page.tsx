'use client';

import { useState, use } from 'react';
import api from '@/services/api';

export default function AIReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const scholarshipId = parseInt(id, 10);

  const [activeTab, setActiveTab] = useState<'text' | 'file'>('text');
  const [essayText, setEssayText] = useState('');
  const [essayFile, setEssayFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ message: string; feedback: string | null } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const payload = activeTab === 'text' ? { essay_text: essayText } : { essay_file: essayFile! };
      const res = await api.submitAIReview(scholarshipId, payload);
      setResult(res);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-lg-8">
          <div className="ai-review-form-container">
            <h1 className="fw-bold mb-4 text-center">AI Essay Review</h1>
            <p className="lead text-muted text-center mb-5">
              Submit your essay below to get personalised feedback from our AI.
              <br />
              Review for Scholarship ID: <strong className="text-primary-brand">{scholarshipId}</strong>
            </p>

            {result && (
              <div className="alert alert-success mb-4" role="alert">
                <strong>{result.message}</strong>
                {result.feedback && <p className="mt-2 mb-0">{result.feedback}</p>}
              </div>
            )}
            {error && <div className="alert alert-danger mb-4">{error}</div>}

            <form onSubmit={handleSubmit}>
              {/* Tab Nav */}
              <div className="row text-center mb-4" style={{ borderBottom: '3px solid #dee2e6' }}>
                <div className="col">
                  <button
                    type="button"
                    className={`tab-nav-link${activeTab === 'text' ? ' active' : ''}`}
                    onClick={() => setActiveTab('text')}
                  >
                    <i className="bi bi-pencil-square me-2" />
                    Enter Text
                  </button>
                </div>
                <div className="col">
                  <button
                    type="button"
                    className={`tab-nav-link${activeTab === 'file' ? ' active' : ''}`}
                    onClick={() => setActiveTab('file')}
                  >
                    <i className="bi bi-cloud-upload me-2" />
                    Upload File
                  </button>
                </div>
              </div>

              {/* Text Tab */}
              {activeTab === 'text' && (
                <div className="mb-4">
                  <textarea
                    className="form-control custom-textarea"
                    placeholder="Start typing or paste your essay content here…"
                    value={essayText}
                    onChange={(e) => setEssayText(e.target.value)}
                    rows={15}
                    style={{ fontFamily: 'Arial, sans-serif', fontSize: '1rem' }}
                  />
                </div>
              )}

              {/* File Tab */}
              {activeTab === 'file' && (
                <div className="file-upload-box mb-4">
                  <span style={{ fontSize: '5rem', color: 'var(--primary-brand-red)' }}>📖</span>
                  <h4 className="fw-bold text-dark mt-3 mb-2">Upload Your Document</h4>
                  <p className="text-muted mb-4">PDF, DOCX, TXT, or Markdown files are supported.</p>
                  <label className="btn btn-primary-brand btn-lg">
                    {essayFile ? essayFile.name : 'Select file'}
                    <input
                      className="d-none"
                      type="file"
                      accept=".pdf,.doc,.docx,.txt,.pptx,.md"
                      onChange={(e) => setEssayFile(e.target.files?.[0] ?? null)}
                    />
                  </label>
                </div>
              )}

              <div className="d-grid">
                <button type="submit" className="btn btn-primary-brand btn-lg rounded-pill" disabled={loading}>
                  {loading ? 'Analysing…' : 'Get AI Feedback'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
