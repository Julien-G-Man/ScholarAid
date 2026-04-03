/**
 * Server-side API helpers for Next.js Server Components.
 *
 * These use `fetch` (not axios) so Next.js can apply its ISR caching strategy.
 * For client-side calls use the services layer (api.ts / authService.ts) instead.
 */

import type { Scholarship, PaginatedResponse } from '@/types';

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api/v1';

/** Revalidation window for ISR — pages refresh automatically every 5 minutes. */
const REVALIDATE = 300;

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

export async function fetchScholarships(): Promise<Scholarship[]> {
  const data = await get<PaginatedResponse<Scholarship>>('/scholarships/');
  return data?.results ?? [];
}

export async function fetchScholarship(id: string | number): Promise<Scholarship | null> {
  return get<Scholarship>(`/scholarships/${id}/`);
}
