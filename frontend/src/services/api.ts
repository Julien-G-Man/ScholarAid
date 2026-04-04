/**
 * General API service — single entry point for all non-auth API calls.
 * Import this wherever you need scholarships, newsletter, AI-review, or contact data.
 */

import axiosInstance from './axiosInstance';
import type { Scholarship, PaginatedResponse, ScholarshipDraft } from '@/types';

const api = {
  // ─── Scholarships ──────────────────────────────────────────────────────────

  getScholarships(params?: { page?: number; search?: string; level?: string }): Promise<PaginatedResponse<Scholarship>> {
    return axiosInstance.get('/scholarships/', { params }).then((r) => r.data);
  },

  getFeaturedScholarships(): Promise<Scholarship[]> {
    return axiosInstance.get('/scholarships/featured/').then((r) => r.data);
  },

  getScholarship(id: number): Promise<Scholarship> {
    return axiosInstance.get(`/scholarships/${id}/`).then((r) => r.data);
  },

  // ─── Newsletter ────────────────────────────────────────────────────────────

  subscribeNewsletter(email: string): Promise<{ message: string }> {
    return axiosInstance.post('/newsletter/subscribe/', { email }).then((r) => r.data);
  },

  // ─── Contact ───────────────────────────────────────────────────────────────

  submitContact(data: {
    name: string;
    email: string;
    subject: string;
    message: string;
  }): Promise<{ message: string }> {
    return axiosInstance.post('/contact/', data).then((r) => r.data);
  },

  // ─── Admin: AI Scholarship Intake ─────────────────────────────────────────

  extractScholarship(payload: {
    input_type: 'url' | 'text';
    content: string;
  }): Promise<ScholarshipDraft> {
    return axiosInstance.post('/admin/scholarships/extract/', payload).then((r) => r.data);
  },

  adminCreateScholarship(data: ScholarshipDraft): Promise<Scholarship> {
    return axiosInstance.post('/admin/scholarships/', data).then((r) => r.data);
  },

  // ─── AI Review ─────────────────────────────────────────────────────────────

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
