'use client';

import { useEffect, useRef, useState } from 'react';
import api from '@/services/api';
import ScholarshipCard from './ScholarshipCard';
import { getCached, setCached } from '@/lib/browserCache';
import type { Scholarship } from '@/types';

const CACHE_KEY = 'featured';

export default function FeaturedScholarships() {
  const [scholarships, setScholarships] = useState<Scholarship[]>(
    () => getCached<Scholarship[]>(CACHE_KEY) ?? []
  );
  const [loading, setLoading] = useState(scholarships.length === 0);
  const trackRef = useRef<HTMLDivElement>(null);
  const loopSpanRef = useRef(0);

  useEffect(() => {
    api
      .getFeaturedScholarships()
      .then((data) => {
        setScholarships(data);
        setCached(CACHE_KEY, data);
      })
      .finally(() => setLoading(false));
  }, []);

  const featured = scholarships.slice(0, 5);
  const hasMultiple = featured.length > 1;

  useEffect(() => {
    const trackEl = trackRef.current;
    if (!trackEl) return;

    const centerCard = (cardEl: HTMLElement) => {
      trackEl.scrollLeft = cardEl.offsetLeft - (trackEl.clientWidth - cardEl.offsetWidth) / 2;
    };

    const recenterForLoop = () => {
      if (!hasMultiple) return;
      const oneSetWidth = trackEl.scrollWidth / 3;
      loopSpanRef.current = oneSetWidth;

      const cards = trackEl.querySelectorAll<HTMLElement>('.featured-track-item');
      const middleSetFirstCard = cards[featured.length];
      if (middleSetFirstCard) {
        centerCard(middleSetFirstCard);
      } else {
        trackEl.scrollLeft = oneSetWidth;
      }
    };

    const maintainLoop = () => {
      if (!hasMultiple) return;
      const oneSetWidth = loopSpanRef.current || trackEl.scrollWidth / 3;
      const startThreshold = oneSetWidth * 0.2;
      const endThreshold = oneSetWidth * 1.8;

      if (trackEl.scrollLeft < startThreshold) {
        trackEl.scrollLeft += oneSetWidth;
      } else if (trackEl.scrollLeft > endThreshold) {
        trackEl.scrollLeft -= oneSetWidth;
      }
    };

    recenterForLoop();
    trackEl.addEventListener('scroll', maintainLoop, { passive: true });
    window.addEventListener('resize', recenterForLoop);

    return () => {
      trackEl.removeEventListener('scroll', maintainLoop);
      window.removeEventListener('resize', recenterForLoop);
    };
  }, [hasMultiple, featured.length]);

  const scrollByCards = (direction: -1 | 1) => {
    const trackEl = trackRef.current;
    if (!trackEl) return;

    const firstCard = trackEl.querySelector<HTMLElement>('.featured-track-item');
    const cardWidth = firstCard?.offsetWidth ?? 320;
    const styles = window.getComputedStyle(trackEl);
    const gap = parseFloat(styles.columnGap || styles.gap || '24') || 24;

    trackEl.scrollBy({
      left: direction * (cardWidth + gap),
      behavior: 'smooth',
    });
  };

  if (loading) {
    return (
      <div className="featured-slider-shell">
        <div className="featured-track" aria-hidden="true">
          {[1, 2, 3, 4, 5].map((n) => (
            <div className="featured-track-item" key={n}>
              <div className="card h-100 shadow-sm border-0 rounded-4">
              <div className="card-body p-4">
                <div className="placeholder-glow">
                  <span className="placeholder col-8 mb-2 d-block" style={{ height: 24 }} />
                  <span className="placeholder col-5 mb-3 d-block" style={{ height: 16 }} />
                  <span className="placeholder col-12 mb-1 d-block" />
                  <span className="placeholder col-10 d-block" />
                </div>
              </div>
            </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (scholarships.length === 0) {
    return <p className="text-center text-muted">No scholarships available right now. Check back soon!</p>;
  }

  const loopedFeatured = hasMultiple ? [...featured, ...featured, ...featured] : featured;

  return (
    <div className="featured-slider-shell">
      <div className="featured-slider-controls" aria-label="Featured scholarships navigation">
        <button
          type="button"
          className="featured-nav-btn"
          onClick={() => scrollByCards(-1)}
          disabled={!hasMultiple}
          aria-label="Scroll featured scholarships left"
        >
          <i className="bi bi-arrow-left" />
        </button>
        <button
          type="button"
          className="featured-nav-btn"
          onClick={() => scrollByCards(1)}
          disabled={!hasMultiple}
          aria-label="Scroll featured scholarships right"
        >
          <i className="bi bi-arrow-right" />
        </button>
      </div>

      <div className="featured-track" ref={trackRef}>
        {loopedFeatured.map((s, idx) => (
          <div className="featured-track-item" key={`${s.id}-${idx}`}>
            <ScholarshipCard scholarship={s} />
          </div>
        ))}
      </div>

      <div className="featured-scroll-hint" aria-hidden="true">
        Swipe or use arrows to keep browsing
      </div>
    </div>
  );
}
