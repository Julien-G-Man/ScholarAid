/**
 * General API service — single entry point for all non-auth API calls.
 * Import this wherever you need scholarships, newsletter, AI-review, or contact data.
 */

import axiosInstance from './axiosInstance';
import type { Scholarship, PaginatedResponse, AdminStats, AdminUser, AdminUserDetail, Message, AdminConversation } from '@/types';

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

  // ─── AI Review ─────────────────────────────────────────────────────────────

  submitAIReview(data: {
    scholarship_id: number;
    essay_text?: string;
    essay_file?: File;
  }): Promise<{
    id: number;
    scholarship: number;
    status: 'in_progress' | 'submitted' | 'reviewed' | 'archived';
    notes: string;
    feedback: any;
    chat_messages: any[];
    created_at: string;
    updated_at: string;
  }> {
    const form = new FormData();
    form.append('scholarship_id', String(data.scholarship_id));
    if (data.essay_text) form.append('essay_text', data.essay_text);
    if (data.essay_file) form.append('essay_file', data.essay_file);
    return axiosInstance.post('/ai-review/', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data);
  },

  // Get preparation guides for a scholarship
  getAIPreparationGuides(scholarshipId: number): Promise<{
    scholarship: string;
    guides: Array<{
      id: number;
      scholarship: number;
      category: 'overview' | 'requirements' | 'essay_tips' | 'common_mistakes' | 'standing_out';
      content: string;
      created_at: string;
    }>;
  }> {
    return axiosInstance.get(`/ai-prep/${scholarshipId}/`).then((r) => r.data);
  },

  // Get a specific review session
  getAIReviewSession(sessionId: number): Promise<{
    id: number;
    scholarship: number;
    status: 'in_progress' | 'submitted' | 'reviewed' | 'archived';
    notes: string;
    feedback: any;
    chat_messages: any[];
    created_at: string;
    updated_at: string;
  }> {
    return axiosInstance.get(`/ai-review/${sessionId}/`).then((r) => r.data);
  },

  // Get all review sessions for the user
  getAIReviewSessions(): Promise<Array<{
    id: number;
    scholarship: number;
    status: 'in_progress' | 'submitted' | 'reviewed' | 'archived';
    notes: string;
    feedback: any;
    chat_messages: any[];
    created_at: string;
    updated_at: string;
  }>> {
    return axiosInstance.get('/ai-prep/reviews/').then((r) => r.data);
  },

  // Send a chat message
  sendAIChatMessage(sessionId: number, message: string): Promise<{
    session_id: number;
    messages: Array<{
      id: number;
      role: 'user' | 'ai';
      content: string;
      created_at: string;
    }>;
  }> {
    return axiosInstance.post(`/ai-review/${sessionId}/chat/`, { message }).then((r) => r.data);
  },

  // Get chat history
  getAIChatHistory(sessionId: number): Promise<{
    session_id: number;
    scholarship: string;
    messages: Array<{
      id: number;
      role: 'user' | 'ai';
      content: string;
      created_at: string;
    }>;
  }> {
    return axiosInstance.get(`/ai-review/${sessionId}/chat/`).then((r) => r.data);
  },

  // ─── Admin ─────────────────────────────────────────────────────────────────

  getAdminStats(): Promise<AdminStats> {
    return axiosInstance.get('/admin/stats/').then((r) => r.data);
  },

  getAdminUsers(): Promise<AdminUser[]> {
    return axiosInstance.get('/admin/users/').then((r) => r.data);
  },

  getAdminUserDetail(userId: number): Promise<AdminUserDetail> {
    return axiosInstance.get(`/admin/users/${userId}/`).then((r) => r.data);
  },

  // ─── Messaging ─────────────────────────────────────────────────────────────

  getMyMessages(): Promise<Message[]> {
    return axiosInstance.get('/messages/').then((r) => r.data);
  },

  getMyUnreadCount(): Promise<{ unread: number }> {
    return axiosInstance.get('/messages/unread-count/').then((r) => r.data);
  },

  getAdminInbox(): Promise<AdminConversation[]> {
    return axiosInstance.get('/admin/messages/').then((r) => r.data);
  },

  getAdminUnreadCount(): Promise<{ unread: number }> {
    return axiosInstance.get('/admin/messages/unread-count/').then((r) => r.data);
  },

  getAdminConversation(userId: number): Promise<Message[]> {
    return axiosInstance.get(`/admin/messages/${userId}/`).then((r) => r.data);
  },
};

export default api;
