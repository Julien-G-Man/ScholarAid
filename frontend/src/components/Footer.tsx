'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

const HIDDEN_FOOTER_PATHS = ['/login', '/register'];
const HIDDEN_FOOTER_PREFIXES = ['/dashboard', '/profile', '/ai-prep'];

export default function Footer() {
  const pathname = usePathname();
  if (
    HIDDEN_FOOTER_PATHS.includes(pathname) ||
    HIDDEN_FOOTER_PREFIXES.some((prefix) => pathname.startsWith(prefix))
  ) {
    return null;
  }

  return (
    <footer style={{ background: '#1a1a2e', borderTop: '4px solid var(--primary-brand-red)', color: '#adb5bd' }}>
      <div className="container py-5">
        <div className="row g-4">

          {/* Brand column */}
          <div className="col-lg-4 col-md-6">
            <Link href="/">
              <Image
                src="/logos/logo_white.png"
                alt="ScholarAid"
                width={150}
                height={45}
                style={{ height: '45px', width: 'auto', objectFit: 'contain', marginBottom: '1rem' }}
              />
            </Link>
            <p className="mt-3" style={{ fontSize: '0.9rem', lineHeight: 1.7 }}>
              A scholarship discovery and application support platform built to help students find opportunities,
              stay organised, and move through the process with confidence.
            </p>
          </div>

          {/* Quick links */}
          <div className="col-lg-2 col-md-3 col-6">
            <h6 className="text-white fw-bold mb-3 text-uppercase" style={{ fontSize: '0.8rem', letterSpacing: '0.08em' }}>
              Explore
            </h6>
            <ul className="list-unstyled mb-0" style={{ fontSize: '0.9rem' }}>
              <li className="mb-2"><Link href="/" className="footer-link">Home</Link></li>
              <li className="mb-2"><Link href="/scholarships" className="footer-link">Scholarships</Link></li>
              <li className="mb-2"><Link href="/about" className="footer-link">About</Link></li>
              <li className="mb-2"><Link href="/contact" className="footer-link">Contact</Link></li>
            </ul>
          </div>

          {/* Account links */}
          <div className="col-lg-2 col-md-3 col-6">
            <h6 className="text-white fw-bold mb-3 text-uppercase" style={{ fontSize: '0.8rem', letterSpacing: '0.08em' }}>
              Account
            </h6>
            <ul className="list-unstyled mb-0" style={{ fontSize: '0.9rem' }}>
              <li className="mb-2"><Link href="/login" className="footer-link">Login</Link></li>
              <li className="mb-2"><Link href="/register" className="footer-link">Register</Link></li>
              <li className="mb-2"><Link href="/profile" className="footer-link">My Profile</Link></li>
            </ul>
          </div>

          {/* Contact / social */}
          <div className="col-lg-4 col-md-6">
            <h6 className="text-white fw-bold mb-3 text-uppercase" style={{ fontSize: '0.8rem', letterSpacing: '0.08em' }}>
              Get in Touch
            </h6>
            <p style={{ fontSize: '0.9rem' }}>
              Have a question or want to list a scholarship?{' '}
              <Link href="/contact" className="footer-link fw-semibold">Contact us</Link>.
            </p>
            <div className="d-flex gap-3 mt-3">
              <a href="#" className="footer-icon" aria-label="Twitter/X">
                <i className="bi bi-twitter-x fs-5" />
              </a>
              <a href="#" className="footer-icon" aria-label="LinkedIn">
                <i className="bi bi-linkedin fs-5" />
              </a>
              <a href="#" className="footer-icon" aria-label="Instagram">
                <i className="bi bi-instagram fs-5" />
              </a>
              <a href="#" className="footer-icon" aria-label="GitHub">
                <i className="bi bi-github fs-5" />
              </a>
            </div>
          </div>

        </div>
      </div>

      {/* Bottom bar */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="container py-3 d-flex flex-column flex-sm-row justify-content-between align-items-center gap-2"
          style={{ fontSize: '0.82rem' }}>
          <span>© {new Date().getFullYear()} ScholarAid. All rights reserved.</span>
          <span>Built with <i className="bi bi-heart-fill text-primary-brand" style={{ fontSize: '0.75rem' }} /> for students worldwide.</span>
        </div>
      </div>
    </footer>
  );
}
