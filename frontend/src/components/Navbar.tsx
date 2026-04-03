import Link from 'next/link';
import Image from 'next/image';

export default function Navbar() {
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
          <ul className="navbar-nav ms-auto">
            <li className="nav-item"><Link className="nav-link" href="/">Home</Link></li>
            <li className="nav-item"><Link className="nav-link" href="/about">About</Link></li>
            <li className="nav-item"><Link className="nav-link" href="/scholarships">Scholarships</Link></li>
            <li className="nav-item"><Link className="nav-link" href="/contact">Contact</Link></li>
          </ul>
        </div>
      </div>
    </nav>
  );
}
