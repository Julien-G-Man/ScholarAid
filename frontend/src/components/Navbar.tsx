'use client';

import { useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useMessaging } from '@/context/MessagingContext';

type CollapseLike = {
  hide: () => void;
};

export default function Navbar() {
  const { user, logout } = useAuth();
  const { unread } = useMessaging();
  const router = useRouter();
  const navbarRef = useRef<HTMLElement>(null);
  const navbarCollapseRef = useRef<HTMLDivElement>(null);
  const collapseRef = useRef<CollapseLike | null>(null);

  useEffect(() => {
    let mounted = true;
    if (navbarCollapseRef.current) {
      import('bootstrap').then(({ Collapse }) => {
        if (!mounted || !navbarCollapseRef.current) return;
        collapseRef.current = new Collapse(navbarCollapseRef.current, { toggle: false });
      });
    }

    const handleOutsideClick = (event: MouseEvent | TouchEvent) => {
      const collapseEl = navbarCollapseRef.current;
      const navEl = navbarRef.current;
      const target = event.target as Node | null;
      if (!collapseEl || !navEl || !target) return;

      const isOpen = collapseEl.classList.contains('show');
      if (isOpen && !navEl.contains(target)) {
        collapseRef.current?.hide();
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);

    return () => {
      mounted = false;
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, []);

  const closeNavbar = () => {
    if (collapseRef.current) {
      collapseRef.current.hide();
    }
  };

  async function handleLogout() {
    await logout();
    closeNavbar();
    router.push('/');
  }

  return (
    <nav className="navbar navbar-expand-lg navbar-dark" ref={navbarRef}>
      <div className="container">
        <Link className="navbar-brand" href="/" onClick={closeNavbar}>
          <Image
            src="/logos/scholaraid_logo.png"
            alt="ScholarAid Logo"
            width={160}
            height={50}
            style={{ height: '50px', width: 'auto', objectFit: 'contain' }}
            priority
          />
        </Link>
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon" />
        </button>
        <div className="collapse navbar-collapse" id="navbarNav" ref={navbarCollapseRef}>
          <ul className="navbar-nav ms-auto align-items-lg-center">
            <li className="nav-item"><Link className="nav-link" href="/" onClick={closeNavbar}>Home</Link></li>
            <li className="nav-item"><Link className="nav-link" href="/about" onClick={closeNavbar}>About</Link></li>
            <li className="nav-item"><Link className="nav-link" href="/scholarships" onClick={closeNavbar}>Scholarships</Link></li>
            <li className="nav-item"><Link className="nav-link" href="/contact" onClick={closeNavbar}>Contact</Link></li>

            {user ? (
              <>
                <li className="nav-item"><Link className="nav-link" href="/ai-prep" onClick={closeNavbar}>AI Prep</Link></li>
                {(user.is_staff || user.is_superuser) && (
                  <li className="nav-item dropdown">
                    <button
                      className="nav-link dropdown-toggle border-0 bg-transparent"
                      data-bs-toggle="dropdown"
                      aria-expanded="false"
                      type="button"
                    >
                      <i className="bi bi-shield-lock me-1" />
                      Tools
                    </button>
                    <ul className="dropdown-menu dropdown-menu-end">
                      <li>
                        <Link className="dropdown-item" href="/admin/scholarships/intake" onClick={closeNavbar}>
                          <i className="bi bi-stars me-2" />
                          AI Intake (single)
                        </Link>
                      </li>
                      <li>
                        <Link className="dropdown-item" href="/admin/scholarships/pipeline" onClick={closeNavbar}>
                          <i className="bi bi-diagram-3 me-2" />
                          Scraper Pipeline
                        </Link>
                      </li>
                    </ul>
                  </li>
                )}
                <li className="nav-item">
                  <Link className="nav-link" href="/profile" onClick={closeNavbar}>
                    <i className="bi bi-person-circle me-1" />
                    {user.first_name || user.username}
                  </Link>
                </li>
                {(user.is_staff || user.is_superuser) && (
                  <li className="nav-item ms-lg-2">
                    <Link className="btn btn-sm rounded-pill px-3 fw-semibold position-relative" href="/admin" onClick={closeNavbar}
                      style={{ background: '#A31F34', color: '#fff' }}>
                      <i className="bi bi-shield-lock me-1" />
                      Admin
                      {unread > 0 && (
                        <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-warning text-dark"
                          style={{ fontSize: '0.6rem' }}>
                          {unread > 9 ? '9+' : unread}
                        </span>
                      )}
                    </Link>
                  </li>
                )}
                <li className="nav-item ms-lg-2 ms-2">
                  <Link className="btn btn-light btn-sm rounded-pill px-3 text-primary-brand fw-semibold" href="/dashboard" onClick={closeNavbar}>
                    Dashboard
                  </Link>
                </li>
                <li className="nav-item ms-lg-1 ms-2">
                  <button
                    onClick={handleLogout}
                    className="btn btn-outline-light btn-sm rounded-pill px-3 w-100"
                  >
                    Logout
                  </button>
                </li>
              </>
            ) : (
              <>
                <li className="nav-item ms-lg-2">
                  <Link className="btn btn-outline-light btn-sm rounded-pill px-3" href="/login" onClick={closeNavbar}>
                    Login
                  </Link>
                </li>
                <li className="nav-item ms-lg-1">
                  <Link className="btn btn-light btn-sm rounded-pill px-3 text-primary-brand fw-semibold" href="/register" onClick={closeNavbar}>
                    Register
                  </Link>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
}
