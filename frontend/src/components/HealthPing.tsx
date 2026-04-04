'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
const HEALTH_URL = `${API_BASE_URL.replace(/\/$/, '')}/health/`;
const PING_INTERVAL_MS = 10 * 60 * 1000;

export default function HealthPing() {
  const pathname = usePathname();
  const lastPingedPath = useRef<string | null>(null);

  const pingHealth = () => {
    fetch(HEALTH_URL, {
      method: 'GET',
      cache: 'no-store',
      keepalive: true,
    }).catch(() => {
      // Ignore warm-up failures so page loads are never blocked.
    });
  };

  useEffect(() => {
    if (!pathname || lastPingedPath.current === pathname) {
      return;
    }

    lastPingedPath.current = pathname;
    pingHealth();
  }, [pathname]);

  useEffect(() => {
    pingHealth();

    const intervalId = window.setInterval(() => {
      pingHealth();
    }, PING_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, []);

  return null;
}
