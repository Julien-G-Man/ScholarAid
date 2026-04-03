/**
 * Thin localStorage cache with TTL.
 * Returns null on page reload (hard or soft) so fresh data is always fetched on explicit refresh.
 */

const TTL_MS = 5 * 60 * 1000; // 5 minutes
const PREFIX = 'sa_';

function isPageReload(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
    return nav?.type === 'reload';
  } catch {
    return false;
  }
}

export function getCached<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;
  if (isPageReload()) return null;
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw) as { data: T; ts: number };
    if (Date.now() - ts > TTL_MS) return null;
    return data;
  } catch {
    return null;
  }
}

export function setCached<T>(key: string, data: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify({ data, ts: Date.now() }));
  } catch {
    // localStorage quota exceeded or unavailable — silently skip
  }
}
