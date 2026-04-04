'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import axiosInstance from '@/services/axiosInstance';

// ── Types ─────────────────────────────────────────────────────────────────────

type JobState = 'idle' | 'running' | 'done' | 'error';

interface ScrapeStatus {
  state: JobState;
  started_at: string | null;
  finished_at: string | null;
  source: string | null;
  collected: number;
  saved: number;
  csv_file: string | null;
  error: string | null;
}

interface IngestStatus {
  state: JobState;
  started_at: string | null;
  finished_at: string | null;
  csv_file: string | null;
  inserted: number;
  skipped: number;
  error: string | null;
}

interface PipelineStatus {
  scrape: ScrapeStatus;
  ingest: IngestStatus;
  csv_available: boolean;
}

const SOURCES = [
  { value: 'mastersportal', label: 'MastersPortal.eu' },
  { value: 'scholarshipportal', label: 'ScholarshipPortal.com' },
  { value: 'opportunitiesforafricans', label: 'Opportunities For Africans' },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString();
}

function StatesBadge({ state }: { state: JobState }) {
  const map: Record<JobState, [string, string]> = {
    idle:    ['secondary', 'Idle'],
    running: ['warning',   'Running…'],
    done:    ['success',   'Done'],
    error:   ['danger',    'Error'],
  };
  const [colour, label] = map[state] ?? ['secondary', state];
  return <span className={`badge bg-${colour}`}>{label}</span>;
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function PipelinePage() {
  const { user, initialising } = useAuth();
  const router = useRouter();

  const [status, setStatus] = useState<PipelineStatus | null>(null);
  const [source, setSource] = useState('mastersportal');
  const [limit, setLimit] = useState(500);
  const [scrapeMsg, setScrapeMsg] = useState<string | null>(null);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [ingestMsg, setIngestMsg] = useState<string | null>(null);
  const [ingestErr, setIngestErr] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Guard: non-admins redirected
  useEffect(() => {
    if (!initialising && (!user || (!user.is_staff && !user.is_superuser))) {
      router.replace('/');
    }
  }, [initialising, user, router]);

  // ── Poll status ─────────────────────────────────────────────────────────────

  const fetchStatus = useCallback(async () => {
    try {
      const { data } = await axiosInstance.get<PipelineStatus>('/admin/scraper/status/');
      setStatus(data);
    } catch {
      // silently ignore network blips during polling
    }
  }, []);

  useEffect(() => {
    if (!user?.is_staff && !user?.is_superuser) return;
    fetchStatus();

    // Poll every 4 s while a job is running
    pollRef.current = setInterval(async () => {
      await fetchStatus();
    }, 4000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [user, fetchStatus]);

  // ── Scrape ──────────────────────────────────────────────────────────────────

  async function handleStartScrape(e: React.FormEvent) {
    e.preventDefault();
    setScrapeMsg(null);
    try {
      const { data } = await axiosInstance.post('/admin/scraper/scrape/', { source, limit });
      setScrapeMsg(data.message ?? 'Scrape job started.');
      await fetchStatus();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setScrapeMsg(msg ?? 'Failed to start scrape.');
    }
  }

  // ── CSV download ────────────────────────────────────────────────────────────

  async function handleDownload() {
    try {
      const resp = await axiosInstance.get('/admin/scraper/download/', {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([resp.data]));
      const a = document.createElement('a');
      a.href = url;
      const disposition = resp.headers['content-disposition'] ?? '';
      const match = disposition.match(/filename="?([^"]+)"?/);
      a.download = match ? match[1] : 'scholarships.csv';
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      alert('Download failed — no CSV available yet.');
    }
  }

  // ── Ingest ──────────────────────────────────────────────────────────────────

  async function handleIngest(e: React.FormEvent) {
    e.preventDefault();
    setIngestMsg(null);
    setIngestErr(null);

    if (!csvFile) return;

    const form = new FormData();
    form.append('csv_file', csvFile);

    try {
      const { data } = await axiosInstance.post('/admin/scraper/ingest/', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setIngestMsg(data.message ?? 'Ingestion started.');
      await fetchStatus();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setIngestErr(msg ?? 'Failed to start ingestion.');
    }
  }

  // ── Render guards ────────────────────────────────────────────────────────────

  if (initialising || (!user?.is_staff && !user?.is_superuser)) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-danger" role="status">
          <span className="visually-hidden">Loading…</span>
        </div>
      </div>
    );
  }

  const scrape = status?.scrape;
  const ingest = status?.ingest;
  const csvAvailable = status?.csv_available ?? false;

  return (
    <>
      <section className="bg-light-brand py-4 border-bottom">
        <div className="container">
          <h1 className="fw-bold text-primary-brand mb-1">Scholarship Pipeline</h1>
          <div className="mt-3 mb-2">
            <Link href="/admin" className="btn btn-outline-primary-brand rounded-pill">
              <i className="bi bi-arrow-left me-2" />
              Back to Admin
            </Link>
          </div>
          <p className="text-muted mb-0">
            Scrape portals → Claude cleans data → download CSV → review → upload → ingest
          </p>
        </div>
      </section>

      <section className="py-5">
        <div className="container" style={{ maxWidth: 860 }}>
          <div className="row g-4">

            {/* ── Step 1: Scrape ─────────────────────────────────────────── */}
            <div className="col-12">
              <div className="bg-white rounded-4 shadow-sm p-4">
                <div className="d-flex align-items-center gap-3 mb-3">
                  <span className="badge bg-primary-brand fs-6 px-3 py-2 rounded-pill">1</span>
                  <h4 className="fw-bold mb-0">Scrape Scholarships</h4>
                  {scrape && <StatesBadge state={scrape.state} />}
                </div>
                <p className="text-muted mb-3">
                  Fetch listings from the selected portal. Claude extracts and cleans
                  each scholarship. Expired deadlines are automatically skipped.
                </p>

                <form onSubmit={handleStartScrape} className="row g-3 align-items-end">
                  <div className="col-md-5">
                    <label className="form-label fw-semibold">Source</label>
                    <select
                      className="form-select rounded-3"
                      value={source}
                      onChange={(e) => setSource(e.target.value)}
                    >
                      {SOURCES.map((s) => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-3">
                    <label className="form-label fw-semibold">Limit</label>
                    <input
                      type="number"
                      className="form-control rounded-3"
                      min={10}
                      max={2000}
                      value={limit}
                      onChange={(e) => setLimit(Number(e.target.value))}
                    />
                  </div>
                  <div className="col-md-4">
                    <button
                      type="submit"
                      className="btn btn-primary-brand w-100 rounded-pill"
                      disabled={scrape?.state === 'running'}
                    >
                      {scrape?.state === 'running' ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" />
                          Scraping…
                        </>
                      ) : (
                        <>
                          <i className="bi bi-cloud-download me-2" />
                          Start Scrape
                        </>
                      )}
                    </button>
                  </div>
                </form>

                {scrapeMsg && (
                  <div className="alert alert-info mt-3 mb-0">{scrapeMsg}</div>
                )}

                {/* Live progress */}
                {scrape && scrape.state !== 'idle' && (
                  <div className="mt-3 p-3 bg-light rounded-3 small">
                    <div className="row text-center">
                      <div className="col-4">
                        <div className="fw-bold">{scrape.source ?? '—'}</div>
                        <div className="text-muted">Source</div>
                      </div>
                      <div className="col-4">
                        <div className="fw-bold">{scrape.collected}</div>
                        <div className="text-muted">Pages fetched</div>
                      </div>
                      <div className="col-4">
                        <div className="fw-bold">{scrape.saved}</div>
                        <div className="text-muted">Saved to CSV</div>
                      </div>
                    </div>
                    {scrape.error && (
                      <div className="alert alert-danger mt-2 mb-0">{scrape.error}</div>
                    )}
                    {scrape.finished_at && (
                      <div className="text-muted mt-2">Finished: {fmtDate(scrape.finished_at)}</div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* ── Step 2: Download CSV ───────────────────────────────────── */}
            <div className="col-12">
              <div className="bg-white rounded-4 shadow-sm p-4">
                <div className="d-flex align-items-center gap-3 mb-3">
                  <span className="badge bg-primary-brand fs-6 px-3 py-2 rounded-pill">2</span>
                  <h4 className="fw-bold mb-0">Download & Review CSV</h4>
                </div>
                <p className="text-muted mb-3">
                  Download the scraped CSV, open it in Excel or Google Sheets, review and
                  edit any fields, then upload it back in Step 3.
                </p>

                <div className="d-flex gap-3 align-items-center flex-wrap">
                  <button
                    className="btn btn-outline-primary-brand rounded-pill px-4"
                    onClick={handleDownload}
                    disabled={!csvAvailable}
                  >
                    <i className="bi bi-file-earmark-arrow-down me-2" />
                    {csvAvailable ? 'Download CSV' : 'No CSV yet'}
                  </button>
                  {scrape?.csv_file && (
                    <span className="text-muted small">
                      <i className="bi bi-file-earmark-text me-1" />
                      {scrape.csv_file}
                    </span>
                  )}
                </div>

                <div className="mt-3 small text-muted">
                  <strong>CSV columns:</strong>{' '}
                  name, provider, institution, level, description, eligibility,
                  essay_prompt, deadline (YYYY-MM-DD), link, logo_url
                </div>
              </div>
            </div>

            {/* ── Step 3: Upload & Ingest ────────────────────────────────── */}
            <div className="col-12">
              <div className="bg-white rounded-4 shadow-sm p-4">
                <div className="d-flex align-items-center gap-3 mb-3">
                  <span className="badge bg-primary-brand fs-6 px-3 py-2 rounded-pill">3</span>
                  <h4 className="fw-bold mb-0">Upload CSV & Ingest</h4>
                  {ingest && <StatesBadge state={ingest.state} />}
                </div>
                <p className="text-muted mb-3">
                  Upload your reviewed CSV. Duplicates (same name + provider) and
                  expired deadlines are automatically skipped.
                </p>

                <form onSubmit={handleIngest} className="row g-3 align-items-end">
                  <div className="col-md-8">
                    <label className="form-label fw-semibold">CSV File</label>
                    <input
                      type="file"
                      accept=".csv"
                      className="form-control rounded-3"
                      onChange={(e) => setCsvFile(e.target.files?.[0] ?? null)}
                    />
                  </div>
                  <div className="col-md-4">
                    <button
                      type="submit"
                      className="btn btn-primary-brand w-100 rounded-pill"
                      disabled={!csvFile || ingest?.state === 'running'}
                    >
                      {ingest?.state === 'running' ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" />
                          Ingesting…
                        </>
                      ) : (
                        <>
                          <i className="bi bi-database-up me-2" />
                          Ingest
                        </>
                      )}
                    </button>
                  </div>
                </form>

                {ingestMsg && (
                  <div className="alert alert-info mt-3 mb-0">{ingestMsg}</div>
                )}
                {ingestErr && (
                  <div className="alert alert-danger mt-3 mb-0">{ingestErr}</div>
                )}

                {/* Ingest results */}
                {ingest && ingest.state === 'done' && (
                  <div className="mt-3 p-3 bg-light rounded-3 small text-center">
                    <div className="row">
                      <div className="col-6">
                        <div className="fw-bold text-success fs-5">{ingest.inserted}</div>
                        <div className="text-muted">Inserted</div>
                      </div>
                      <div className="col-6">
                        <div className="fw-bold text-secondary fs-5">{ingest.skipped}</div>
                        <div className="text-muted">Skipped</div>
                      </div>
                    </div>
                    <div className="text-muted mt-2">
                      Finished: {fmtDate(ingest.finished_at)}
                    </div>
                  </div>
                )}
                {ingest?.error && (
                  <div className="alert alert-danger mt-3 mb-0">{ingest.error}</div>
                )}
              </div>
            </div>

            {/* ── Quick links ───────────────────────────────────────────── */}
            <div className="col-12 text-center pt-2">
              <Link href="/scholarships" className="btn btn-outline-primary-brand rounded-pill px-4 me-2">
                <i className="bi bi-list-ul me-1" />
                View Scholarships
              </Link>
              <Link href="/admin/scholarships/intake" className="btn btn-outline-primary-brand rounded-pill px-4">
                <i className="bi bi-stars me-1" />
                AI Intake (single)
              </Link>
            </div>

          </div>
        </div>
      </section>
    </>
  );
}
