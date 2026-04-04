import Link from 'next/link';

export default function NotFound() {
  return (
    <section
      className="py-5 d-flex align-items-center"
      style={{
        minHeight: 'calc(100vh - 80px)',
        background:
          'linear-gradient(rgba(10, 10, 10, 0.72), rgba(10, 10, 10, 0.72)), url("/img/graduation.png") center/cover no-repeat',
      }}
    >
      <div className="container text-center">
        <p className="text-uppercase text-white fw-semibold mb-2" style={{ letterSpacing: '0.08em' }}>
          404 Error
        </p>
        <h1 className="display-3 fw-bold mb-3 text-white">Page not found</h1>
        <p className="lead text-white-50 mx-auto mb-4" style={{ maxWidth: 700 }}>
          The page you are trying to reach does not exist or may have been moved.
          Use one of the links below to continue browsing ScholarAid.
        </p>

        <div className="d-flex flex-wrap justify-content-center gap-3">
          <Link href="/" className="btn btn-primary-brand btn-lg rounded-pill px-4">
            Go to Home
          </Link>
          <Link href="/scholarships" className="btn btn-light text-primary-brand btn-lg rounded-pill px-4 fw-semibold">
            Browse Scholarships
          </Link>
        </div>
      </div>
    </section>
  );
}
