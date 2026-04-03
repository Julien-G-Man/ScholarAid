/**
 * General API service — single entry point for all non-auth API calls.
 * Import this wherever you need scholarships, newsletter, or AI-review data.
 */

import axiosInstance from './axiosInstance';
import type { Scholarship, PaginatedResponse } from '@/types';

const api = {
  // ─── Scholarships ──────────────────────────────────────────────────────────

  /** Paginated list of all scholarships. */
  getScholarships(page = 1): Promise<PaginatedResponse<Scholarship>> {
    return axiosInstance.get('/scholarships/', { params: { page } }).then((r) => r.data);
  },

  /** 3 most-recent scholarships for the homepage hero. */
  getFeaturedScholarships(): Promise<Scholarship[]> {
    return axiosInstance.get('/scholarships/featured/').then((r) => r.data);
  },

  /** Single scholarship by ID. */
  getScholarship(id: number): Promise<Scholarship> {
    return axiosInstance.get(`/scholarships/${id}/`).then((r) => r.data);
  },

  // ─── Newsletter ────────────────────────────────────────────────────────────

  /** Subscribe an email to the newsletter. */
  subscribeNewsletter(email: string): Promise<{ message: string }> {
    return axiosInstance.post('/newsletter/subscribe/', { email }).then((r) => r.data);
  },

  // ─── AI Review ─────────────────────────────────────────────────────────────

  /** Submit essay text or file for AI review. */
  submitAIReview(
    scholarshipId: number,
    payload: { essay_text?: string; essay_file?: File }
  ): Promise<{ scholarship_id: number; message: string; feedback: string | null }> {
    const form = new FormData();
    if (payload.essay_text) form.append('essay_text', payload.essay_text);
    if (payload.essay_file) form.append('essay_file', payload.essay_file);
    return axiosInstance
      .post(`/ai-review/${scholarshipId}/`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data);
  },
};

export default api;
