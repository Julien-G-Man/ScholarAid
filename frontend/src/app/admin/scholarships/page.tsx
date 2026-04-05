'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import api from '@/services/api';
import type {
  Scholarship,
  AdminScholarshipBulkDeleteResult,
  ScholarshipDraft,
} from '@/types';

function fmtDate(iso: string | null) {
  if (!iso) return '-';
  return new Date(iso).toLocaleDateString();
}

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

function emptyToNull(draft: ScholarshipDraft): ScholarshipDraft {
  return Object.fromEntries(
    Object.entries(draft).map(([k, v]) => [k, v === '' ? null : v])
  ) as ScholarshipDraft;
}

export default function AdminScholarshipsPage() {
  const { user, initialising } = useAuth();
  const router = useRouter();

  const [items, setItems] = useState<Scholarship[]>([]);
  const [count, setCount] = useState(0);
  const [nextOffset, setNextOffset] = useState<number | null>(null);
  const [prevOffset, setPrevOffset] = useState<number | null>(null);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState('');
  const [provider, setProvider] = useState('');
  const [level, setLevel] = useState('');
  const [year, setYear] = useState('');

  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draft, setDraft] = useState<ScholarshipDraft>(EMPTY_DRAFT);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [saveErr, setSaveErr] = useState<string | null>(null);
  const editorCardRef = useRef<HTMLDivElement | null>(null);

  const [singleDeleteId, setSingleDeleteId] = useState('');
  const [singleDeleteMsg, setSingleDeleteMsg] = useState<string | null>(null);
  const [singleDeleteErr, setSingleDeleteErr] = useState<string | null>(null);

  const [cleanupYears, setCleanupYears] = useState('2021,2022');
  const [cleanupProvider, setCleanupProvider] = useState('');
  const [cleanupDeadlineYear, setCleanupDeadlineYear] = useState('');
  const [cleanupDeleteAll, setCleanupDeleteAll] = useState(false);
  const [cleanupConfirm, setCleanupConfirm] = useState(false);
  const [cleanupLoading, setCleanupLoading] = useState(false);
  const [cleanupResult, setCleanupResult] = useState<AdminScholarshipBulkDeleteResult | null>(null);
  const [cleanupError, setCleanupError] = useState<string | null>(null);

  const limit = 50;

  useEffect(() => {
    if (initialising) return;
    if (!user) {
      router.replace('/login');
      return;
    }
    if (!user.is_staff && !user.is_superuser) {
      router.replace('/dashboard');
    }
  }, [initialising, user, router]);

  const query = useMemo(
    () => ({ search: search || undefined, provider: provider || undefined, level: level || undefined, year: year || undefined }),
    [search, provider, level, year]
  );

  async function load(currentOffset = 0) {
    setLoading(true);
    try {
      const data = await api.getAdminScholarships({ ...query, limit, offset: currentOffset });
      setItems(data.results);
      setCount(data.count);
      setNextOffset(data.next_offset);
      setPrevOffset(data.prev_offset);
      setOffset(currentOffset);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!user?.is_staff && !user?.is_superuser) return;
    load(0);
  }, [user, query]);

  useEffect(() => {
    if (!isCreating && !editingId) return;
    const card = editorCardRef.current;
    if (!card) return;

    requestAnimationFrame(() => {
      card.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }, [isCreating, editingId]);

  function handleField(key: keyof ScholarshipDraft, value: string) {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  function closeEditor() {
    setIsCreating(false);
    setEditingId(null);
    setDraft(EMPTY_DRAFT);
    setSaveMsg(null);
    setSaveErr(null);
  }

  function startCreate() {
    setIsCreating(true);
    setEditingId(null);
    setDraft(EMPTY_DRAFT);
    setSaveMsg(null);
    setSaveErr(null);
  }

  function startEdit(row: Scholarship) {
    setIsCreating(false);
    setEditingId(row.id);
    setDraft({
      name: row.name ?? '',
      provider: row.provider ?? '',
      institution: row.institution ?? '',
      level: row.level ?? '',
      description: row.description ?? '',
      eligibility: row.eligibility ?? '',
      essay_prompt: row.essay_prompt ?? '',
      deadline: row.deadline ?? '',
      link: row.link ?? '',
      logo_url: row.logo_url ?? '',
    });
    setSaveMsg(null);
    setSaveErr(null);
  }

  async function saveEdit() {
    if (!editingId) return;
    setSaveErr(null);
    setSaveMsg(null);
    try {
      await api.adminUpdateScholarship(editingId, {
        ...emptyToNull(draft),
      });
      setSaveMsg('Scholarship updated.');
      await load(offset);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setSaveErr(msg ?? 'Update failed.');
    }
  }

  async function saveCreate() {
    setSaveErr(null);
    setSaveMsg(null);
    try {
      const created = await api.adminCreateScholarship(emptyToNull(draft));
      setSaveMsg(`Scholarship #${created.id} created.`);
      setIsCreating(false);
      setEditingId(created.id);
      setDraft({
        name: created.name ?? '',
        provider: created.provider ?? '',
        institution: created.institution ?? '',
        level: created.level ?? '',
        description: created.description ?? '',
        eligibility: created.eligibility ?? '',
        essay_prompt: created.essay_prompt ?? '',
        deadline: created.deadline ?? '',
        link: created.link ?? '',
        logo_url: created.logo_url ?? '',
      });
      await load(0);
    } catch (err: unknown) {
      const data = (err as { response?: { data?: Record<string, string[] | string> } })?.response?.data;
      const msg = data
        ? Object.entries(data)
            .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
            .join(' | ')
        : 'Create failed.';
      setSaveErr(msg);
    }
  }

  async function deleteRow(id: number) {
    if (!window.confirm(`Delete scholarship #${id}?`)) return;
    await api.adminDeleteScholarship(id);
    await load(offset);
  }

  async function deleteSingleById() {
    setSingleDeleteMsg(null);
    setSingleDeleteErr(null);
    const id = Number(singleDeleteId);
    if (!Number.isInteger(id) || id <= 0) {
      setSingleDeleteErr('Enter a valid ID.');
      return;
    }
    try {
      await api.adminDeleteScholarship(id);
      setSingleDeleteMsg(`Deleted scholarship #${id}.`);
      setSingleDeleteId('');
      await load(offset);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setSingleDeleteErr(msg ?? 'Delete failed.');
    }
  }

  function parseYears(input: string): number[] {
    return input
      .split(',')
      .map((x) => x.trim())
      .filter((x) => x)
      .map((x) => Number(x))
      .filter((n) => Number.isInteger(n) && n >= 1900 && n <= 2100);
  }

  async function bulkDelete(dryRun: boolean) {
    setCleanupError(null);
    setCleanupResult(null);
    setCleanupLoading(true);
    try {
      const payload: {
        years?: number[];
        provider_contains?: string;
        deadline_year_lte?: number;
        delete_all?: boolean;
        dry_run: boolean;
        confirm?: boolean;
      } = {
        dry_run: dryRun,
      };

      if (cleanupDeleteAll) {
        payload.delete_all = true;
      } else {
        const years = parseYears(cleanupYears);
        if (years.length > 0) payload.years = years;
        if (cleanupProvider.trim()) payload.provider_contains = cleanupProvider.trim();
        if (cleanupDeadlineYear.trim()) payload.deadline_year_lte = Number(cleanupDeadlineYear);
      }

      if (!dryRun) payload.confirm = true;
      const data = await api.adminBulkDeleteScholarships(payload);

      setCleanupResult(data);
      if (!dryRun) {
        setCleanupConfirm(false);
        await load(0);
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setCleanupError(msg ?? 'Bulk delete failed.');
    } finally {
      setCleanupLoading(false);
    }
  }

  if (initialising || !user) return null;
  if (!user.is_staff && !user.is_superuser) return null;

  return (
    <>
      <section className="bg-light-brand py-4 border-bottom">
        <div className="container d-flex justify-content-between align-items-center gap-3 flex-wrap">
          <div>
            <h1 className="fw-bold text-primary-brand mb-1">Scholarship Manager</h1>
            <p className="text-muted mb-0">Edit, filter, and clean scholarship records.</p>
          </div>
          <Link href="/admin" className="btn btn-outline-primary-brand rounded-pill">
            <i className="bi bi-arrow-left me-2" />
            Back to Admin
          </Link>
        </div>
      </section>

      <section className="py-5">
        <div className="container">
          <div className="card border-0 rounded-4 shadow-sm p-4 mb-4">
            <h5 className="fw-bold mb-3">Bulk Cleanup</h5>
            <div className="row g-3">
              <div className="col-md-4">
                <label className="form-label">Years</label>
                <input className="form-control" value={cleanupYears} onChange={(e) => setCleanupYears(e.target.value)} placeholder="2021,2022" disabled={cleanupDeleteAll} />
              </div>
              <div className="col-md-4">
                <label className="form-label">Provider contains</label>
                <input className="form-control" value={cleanupProvider} onChange={(e) => setCleanupProvider(e.target.value)} disabled={cleanupDeleteAll} />
              </div>
              <div className="col-md-4">
                <label className="form-label">Deadline year less/equal</label>
                <input type="number" className="form-control" value={cleanupDeadlineYear} onChange={(e) => setCleanupDeadlineYear(e.target.value)} disabled={cleanupDeleteAll} />
              </div>
            </div>
            <div className="d-flex gap-3 align-items-center mt-3 flex-wrap">
              <div className="form-check">
                <input id="delete-all" type="checkbox" className="form-check-input" checked={cleanupDeleteAll} onChange={(e) => setCleanupDeleteAll(e.target.checked)} />
                <label className="form-check-label" htmlFor="delete-all">Delete all scholarships</label>
              </div>
              <div className="form-check">
                <input id="confirm-delete" type="checkbox" className="form-check-input" checked={cleanupConfirm} onChange={(e) => setCleanupConfirm(e.target.checked)} />
                <label className="form-check-label" htmlFor="confirm-delete">I confirm permanent deletion</label>
              </div>
              <button className="btn btn-outline-primary-brand rounded-pill" disabled={cleanupLoading} onClick={() => bulkDelete(true)}>Dry run</button>
              <button className="btn btn-danger rounded-pill" disabled={cleanupLoading || !cleanupConfirm} onClick={() => bulkDelete(false)}>Delete matches</button>
            </div>
            {cleanupResult && <div className="alert alert-info mt-3 mb-0">{cleanupResult.message} {cleanupResult.dry_run ? `Matches: ${cleanupResult.matches}` : `Deleted: ${cleanupResult.deleted ?? 0}`}</div>}
            {cleanupError && <div className="alert alert-danger mt-3 mb-0">{cleanupError}</div>}
          </div>

          <div className="card border-0 rounded-4 shadow-sm p-4 mb-4">
            <h5 className="fw-bold mb-3">Delete Single by ID</h5>
            <div className="d-flex gap-2 flex-wrap">
              <input type="number" className="form-control" style={{ maxWidth: 220 }} value={singleDeleteId} onChange={(e) => setSingleDeleteId(e.target.value)} placeholder="Scholarship ID" />
              <button className="btn btn-outline-danger rounded-pill" onClick={deleteSingleById}>Delete</button>
            </div>
            {singleDeleteMsg && <div className="alert alert-success mt-3 mb-0">{singleDeleteMsg}</div>}
            {singleDeleteErr && <div className="alert alert-danger mt-3 mb-0">{singleDeleteErr}</div>}
          </div>

          <div className="card border-0 rounded-4 shadow-sm p-4 mb-4">
            <div className="d-flex justify-content-between align-items-end gap-3 flex-wrap mb-3">
              <div>
                <h5 className="fw-bold mb-1">Browse Scholarships</h5>
                <p className="text-muted mb-0">Search existing records or open the inline card to add a new one.</p>
              </div>
              <button className="btn btn-primary-brand rounded-pill" onClick={startCreate}>
                <i className="bi bi-plus-lg me-2" />
                Add Scholarship
              </button>
            </div>
            <div className="row g-2 align-items-end">
              <div className="col-md-3"><label className="form-label">Search</label><input className="form-control" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
              <div className="col-md-3"><label className="form-label">Provider</label><input className="form-control" value={provider} onChange={(e) => setProvider(e.target.value)} /></div>
              <div className="col-md-3"><label className="form-label">Level</label><input className="form-control" value={level} onChange={(e) => setLevel(e.target.value)} /></div>
              <div className="col-md-2"><label className="form-label">Year</label><input className="form-control" value={year} onChange={(e) => setYear(e.target.value)} /></div>
              <div className="col-md-1 d-grid"><button className="btn btn-outline-primary-brand" onClick={() => load(0)}>Go</button></div>
            </div>
          </div>

          <div className="card border-0 rounded-4 shadow-sm overflow-hidden">
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>ID</th><th>Name</th><th>Provider</th><th>Level</th><th>Deadline</th><th>Created</th><th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={7} className="text-center py-4">Loading...</td></tr>
                  ) : items.length === 0 ? (
                    <tr><td colSpan={7} className="text-center py-4">No scholarships found.</td></tr>
                  ) : (
                    items.map((s) => (
                      <tr key={s.id}>
                        <td>{s.id}</td>
                        <td style={{ maxWidth: 340 }} className="text-truncate">{s.name}</td>
                        <td>{s.provider}</td>
                        <td>{s.level || '-'}</td>
                        <td>{s.deadline || '-'}</td>
                        <td>{fmtDate(s.created_at)}</td>
                        <td className="text-end">
                          <button className="btn btn-sm btn-outline-primary-brand me-2" onClick={() => startEdit(s)}>Edit</button>
                          <button className="btn btn-sm btn-outline-danger" onClick={() => deleteRow(s.id)}>Delete</button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="d-flex justify-content-between align-items-center p-3 border-top">
              <small className="text-muted">Showing {items.length} of {count}</small>
              <div className="d-flex gap-2">
                <button className="btn btn-sm btn-outline-secondary" disabled={prevOffset === null} onClick={() => load(prevOffset ?? 0)}>Prev</button>
                <button className="btn btn-sm btn-outline-secondary" disabled={nextOffset === null} onClick={() => load(nextOffset ?? 0)}>Next</button>
              </div>
            </div>
          </div>

          {(isCreating || editingId) && (
            <div ref={editorCardRef} className="card border-0 rounded-4 shadow-sm p-4 mt-4">
              <h5 className="fw-bold mb-3">{isCreating ? 'Add Scholarship' : `Edit Scholarship #${editingId}`}</h5>
              <div className="row g-3">
                <div className="col-md-6"><label className="form-label">Name</label><input className="form-control" value={draft.name} onChange={(e) => handleField('name', e.target.value)} /></div>
                <div className="col-md-6"><label className="form-label">Provider</label><input className="form-control" value={draft.provider} onChange={(e) => handleField('provider', e.target.value)} /></div>
                <div className="col-md-4"><label className="form-label">Institution</label><input className="form-control" value={draft.institution ?? ''} onChange={(e) => handleField('institution', e.target.value)} /></div>
                <div className="col-md-4"><label className="form-label">Level</label><input className="form-control" value={draft.level ?? ''} onChange={(e) => handleField('level', e.target.value)} /></div>
                <div className="col-md-4"><label className="form-label">Deadline (YYYY-MM-DD)</label><input className="form-control" value={draft.deadline ?? ''} onChange={(e) => handleField('deadline', e.target.value)} /></div>
                <div className="col-12"><label className="form-label">Link</label><input className="form-control" value={draft.link ?? ''} onChange={(e) => handleField('link', e.target.value)} /></div>
                <div className="col-12"><label className="form-label">Logo URL</label><input className="form-control" value={draft.logo_url ?? ''} onChange={(e) => handleField('logo_url', e.target.value)} /></div>
                <div className="col-12"><label className="form-label">Description</label><textarea className="form-control" rows={4} value={draft.description} onChange={(e) => handleField('description', e.target.value)} /></div>
                <div className="col-12"><label className="form-label">Eligibility</label><textarea className="form-control" rows={3} value={draft.eligibility ?? ''} onChange={(e) => handleField('eligibility', e.target.value)} /></div>
                <div className="col-12"><label className="form-label">Essay prompt</label><textarea className="form-control" rows={3} value={draft.essay_prompt ?? ''} onChange={(e) => handleField('essay_prompt', e.target.value)} /></div>
              </div>
              <div className="d-flex gap-2 mt-3">
                <button className="btn btn-primary-brand rounded-pill px-4" onClick={isCreating ? saveCreate : saveEdit}>
                  {isCreating ? 'Create scholarship' : 'Save changes'}
                </button>
                <button className="btn btn-outline-secondary rounded-pill px-4" onClick={closeEditor}>Close</button>
              </div>
              {saveMsg && <div className="alert alert-success mt-3 mb-0">{saveMsg}</div>}
              {saveErr && <div className="alert alert-danger mt-3 mb-0">{saveErr}</div>}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
