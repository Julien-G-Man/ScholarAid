'use client';

import { useRef, useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useMessaging } from '@/context/MessagingContext';

type CollapseLike = {
  hide: () => void;
  toggle: () => void;
};

export default function Navbar() {
  const { user, logout } = useAuth();
  const { unread } = useMessaging();
  const router = useRouter();
  const pathname = usePathname();
  const navbarRef = useRef<HTMLElement>(null);
  const navbarCollapseRef = useRef<HTMLDivElement>(null);
  const collapseRef = useRef<CollapseLike | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNavbarVisible, setIsNavbarVisible] = useState(true);
  const lastScrollY = useRef(0);
  const isMenuOpenRef = useRef(false);

  useEffect(() => {
    isMenuOpenRef.current = isMenuOpen;
  }, [isMenuOpen]);

  useEffect(() => {
    let mounted = true;
    const collapseEl = navbarCollapseRef.current;
    let handleShown: (() => void) | undefined;
    let handleHidden: (() => void) | undefined;

    if (collapseEl) {
      import('bootstrap').then(({ Collapse }) => {
        if (!mounted || !collapseEl) return;
        collapseRef.current = new Collapse(collapseEl, { toggle: false });

        handleShown = () => setIsMenuOpen(true);
        handleHidden = () => setIsMenuOpen(false);

        collapseEl.addEventListener('shown.bs.collapse', handleShown);
        collapseEl.addEventListener('hidden.bs.collapse', handleHidden);
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

    const canHideNavbarOnDownScroll = () => {
      if (pathname !== '/') {
        return true;
      }

      const heroEl = document.querySelector<HTMLElement>('.home-hero');
      if (!heroEl) {
        return true;
      }

      const navbarHeight = navbarRef.current?.offsetHeight ?? 0;
      const heroMidpoint = heroEl.offsetTop + heroEl.offsetHeight * 0.5 - navbarHeight;
      return window.scrollY >= heroMidpoint;
    };

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollingDown = currentScrollY > lastScrollY.current;
      const scrollingUp = currentScrollY < lastScrollY.current;

      if (currentScrollY <= 8) {
        setIsNavbarVisible(true);
      } else if (scrollingDown) {
        if (isMenuOpenRef.current) {
          collapseRef.current?.hide();
        }
        setIsNavbarVisible(!canHideNavbarOnDownScroll());
      } else if (scrollingUp) {
        setIsNavbarVisible(true);
      }

      lastScrollY.current = currentScrollY;
    };

    lastScrollY.current = window.scrollY;
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      mounted = false;
      if (collapseEl && handleShown) {
        collapseEl.removeEventListener('shown.bs.collapse', handleShown);
      }
      if (collapseEl && handleHidden) {
        collapseEl.removeEventListener('hidden.bs.collapse', handleHidden);
      }
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [pathname]);

  const closeNavbar = () => {
    if (collapseRef.current) {
      collapseRef.current.hide();
    }
  };

  const toggleNavbar = () => {
    if (collapseRef.current) {
      collapseRef.current.toggle();
    }
  };

  const handleLogoClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    closeNavbar();
    if (pathname === '/') {
      event.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  async function handleLogout() {
    await logout();
    closeNavbar();
    router.push('/');
  }

  return (
    <nav
      className={`navbar navbar-expand-lg navbar-dark site-navbar${isNavbarVisible ? '' : ' site-navbar--hidden'}`}
      ref={navbarRef}
    >
      <div className="container">
        <Link className="navbar-brand" href="/" scroll={false} onClick={handleLogoClick}>
          <Image
            src="/logos/scholaraid_logo.png"
            alt="ScholarAid Logo"
            width={160}
            height={50}
            style={{ objectFit: 'contain', display: 'block' }}
            priority
          />
        </Link>
        <button
          className="navbar-toggler"
          type="button"
          aria-controls="navbarNav"
          aria-expanded={isMenuOpen}
          aria-label="Toggle navigation"
          onClick={toggleNavbar}
        >
          <span className="navbar-toggler-icon" />
        </button>
        <div className="collapse navbar-collapse" id="navbarNav" ref={navbarCollapseRef}>
          <ul className="navbar-nav ms-auto align-items-lg-center">
            <li className="nav-item"><Link className="nav-link" href="/" scroll={false} onClick={closeNavbar}>Home</Link></li>
            <li className="nav-item"><Link className="nav-link" href="/scholarships" scroll={false} onClick={closeNavbar}>Scholarships</Link></li>
            <li className="nav-item"><Link className="nav-link" href="/contact" scroll={false} onClick={closeNavbar}>Contact</Link></li>

            {user ? (
              <>
                <li className="nav-item"><Link className="nav-link" href="/ai-prep" scroll={false} onClick={closeNavbar}>AI Prep</Link></li>
                {!(user.is_staff || user.is_superuser) && (
                  <li className="nav-item">
                    <Link className="nav-link" href="/profile" scroll={false} onClick={closeNavbar}>
                      <i className="bi bi-person-circle me-1" />
                      {user.first_name || user.username}
                    </Link>
                  </li>
                )}
                {(user.is_staff || user.is_superuser) && (
                  <li className="nav-item ms-lg-2">
                    <Link className="btn btn-sm rounded-pill px-3 fw-semibold position-relative" href="/admin" scroll={false} onClick={closeNavbar}
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
                  <Link className="btn btn-light btn-sm rounded-pill px-3 text-primary-brand fw-semibold" href="/dashboard" scroll={false} onClick={closeNavbar}>
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
                <li className="nav-item ms-lg-1">
                  <Link className="btn btn-light btn-sm rounded-pill px-3 text-primary-brand fw-semibold" href="/register" scroll={false} onClick={closeNavbar}>
                    Get Started
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
