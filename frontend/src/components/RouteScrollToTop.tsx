'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function RouteScrollToTop() {
  const pathname = usePathname();

  useEffect(() => {
    window.requestAnimationFrame(() => {
      const hash = window.location.hash;
      if (hash) {
        const target = document.querySelector<HTMLElement>(hash);
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
          return;
        }
      }

      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }, [pathname]);

  return null;
}
