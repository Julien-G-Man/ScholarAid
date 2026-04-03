/**
 * Server-side API helpers for Next.js Server Components.
 * Uses `fetch` (not axios) so Next.js can apply its ISR caching strategy.
 * For client-side calls use the services layer (api.ts / authService.ts).
 */

import type { Scholarship, PaginatedResponse } from '@/types';

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api/v1';
const REVALIDATE = 300; // 5 minutes

async function get<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${BASE}${path}`, { next: { revalidate: REVALIDATE } });
    if (!res.ok) return null;
    return res.json() as Promise<T>;
  } catch {
    return null;
  }
}

export async function fetchFeaturedScholarships(): Promise<Scholarship[]> {
  return (await get<Scholarship[]>('/scholarships/featured/')) ?? [];
}

export async function fetchScholarships(params?: {
  search?: string;
  level?: string;
}): Promise<Scholarship[]> {
  const query = new URLSearchParams();
  if (params?.search) query.set('search', params.search);
  if (params?.level) query.set('level', params.level);
  const qs = query.toString();
  const data = await get<PaginatedResponse<Scholarship>>(
    `/scholarships/${qs ? `?${qs}` : ''}`
  );
  return data?.results ?? [];
}

export async function fetchScholarship(id: string | number): Promise<Scholarship | null> {
  return get<Scholarship>(`/scholarships/${id}/`);
}
