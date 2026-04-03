'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();

  async function handleLogout() {
    await logout();
    router.push('/');
  }

  return (
    <nav className="navbar navbar-expand-lg navbar-dark">
      <div className="container">
        <Link className="navbar-brand" href="/">
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
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav ms-auto align-items-lg-center">
            <li className="nav-item"><Link className="nav-link" href="/">Home</Link></li>
            <li className="nav-item"><Link className="nav-link" href="/about">About</Link></li>
            <li className="nav-item"><Link className="nav-link" href="/scholarships">Scholarships</Link></li>
            <li className="nav-item"><Link className="nav-link" href="/contact">Contact</Link></li>

            {user ? (
              <>
                <li className="nav-item">
                  <Link className="nav-link" href="/profile">
                    <i className="bi bi-person-circle me-1" />
                    {user.first_name || user.username}
                  </Link>
                </li>
                <li className="nav-item ms-lg-2">
                  <button
                    onClick={handleLogout}
                    className="btn btn-outline-light btn-sm rounded-pill px-3"
                  >
                    Logout
                  </button>
                </li>
              </>
            ) : (
              <>
                <li className="nav-item ms-lg-2">
                  <Link className="btn btn-outline-light btn-sm rounded-pill px-3" href="/login">
                    Login
                  </Link>
                </li>
                <li className="nav-item ms-lg-1">
                  <Link className="btn btn-light btn-sm rounded-pill px-3 text-primary-brand fw-semibold" href="/register">
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
