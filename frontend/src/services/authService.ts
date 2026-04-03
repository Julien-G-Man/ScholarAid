/**
 * Auth service — dedicated entry point for all authentication API calls.
 * Handles token storage so the rest of the app never touches localStorage directly.
 */

import axiosInstance from './axiosInstance';
import type { AuthResponse, User } from '@/types';

const authService = {
  // ─── Registration ──────────────────────────────────────────────────────────

  async register(data: {
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    password: string;
    password2: string;
  }): Promise<AuthResponse> {
    const response = await axiosInstance.post<AuthResponse>('/auth/register/', data);
    authService._storeTokens(response.data.access, response.data.refresh);
    return response.data;
  },

  // ─── Login ─────────────────────────────────────────────────────────────────

  async login(username: string, password: string): Promise<AuthResponse> {
    const response = await axiosInstance.post<AuthResponse>('/auth/login/', { username, password });
    authService._storeTokens(response.data.access, response.data.refresh);
    return response.data;
  },

  // ─── Logout ────────────────────────────────────────────────────────────────

  async logout(): Promise<void> {
    const refresh = typeof window !== 'undefined' ? localStorage.getItem('refresh_token') : null;
    if (refresh) {
      try {
        await axiosInstance.post('/auth/logout/', { refresh });
      } catch {
        // proceed with local cleanup even if server call fails
      }
    }
    authService._clearTokens();
  },

  // ─── Token refresh ─────────────────────────────────────────────────────────

  async refreshToken(): Promise<string> {
    const refresh = typeof window !== 'undefined' ? localStorage.getItem('refresh_token') : null;
    if (!refresh) throw new Error('No refresh token available.');
    const response = await axiosInstance.post<{ access: string }>('/auth/token/refresh/', { refresh });
    if (typeof window !== 'undefined') localStorage.setItem('access_token', response.data.access);
    return response.data.access;
  },

  // ─── Profile ───────────────────────────────────────────────────────────────

  getProfile(): Promise<User> {
    return axiosInstance.get<User>('/auth/profile/').then((r) => r.data);
  },

  updateProfile(data: Partial<User>): Promise<User> {
    return axiosInstance.patch<User>('/auth/profile/', data).then((r) => r.data);
  },

  // ─── Helpers ───────────────────────────────────────────────────────────────

  isAuthenticated(): boolean {
    if (typeof window === 'undefined') return false;
    return !!localStorage.getItem('access_token');
  },

  _storeTokens(access: string, refresh: string) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
    }
  },

  _clearTokens() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    }
  },
};

export default authService;
