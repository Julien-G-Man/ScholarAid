import Link from 'next/link';
import ScholarshipCard from '@/components/ScholarshipCard';
import NewsletterForm from '@/components/NewsletterForm';
import { fetchFeaturedScholarships } from '@/lib/serverApi';

export default async function HomePage() {
  const featured = await fetchFeaturedScholarships();

  return (
    <>
      {/* Hero */}
      <section className="hero d-flex flex-column justify-content-center align-items-center">
        <div className="container text-center">
          <h1 className="display-2 fw-bold">ScholarAid</h1>
          <p className="lead mb-4">Find scholarships. Get AI-powered feedback. Unlock opportunities.</p>
          <Link href="/scholarships" className="btn btn-lg btn-light px-5 py-3 rounded-pill shadow-lg">
            🔍 Browse Scholarships
          </Link>
        </div>
      </section>

      {/* Why ScholarAid */}
      <section className="py-5">
        <div className="container text-center">
          <h2 className="fw-bold mb-5 text-primary-brand">Why Choose ScholarAid?</h2>
          <div className="row g-4">
            <div className="col-md-4">
              <div className="feature-box p-4 shadow-sm rounded-4 h-100 bg-white">
                <h3 className="fw-bold text-primary-brand">🎓 Explore Scholarships</h3>
                <p className="text-muted">Discover curated opportunities tailored to different fields and levels.</p>
              </div>
            </div>
            <div className="col-md-4">
              <div className="feature-box p-4 shadow-sm rounded-4 h-100 bg-white">
                <h3 className="fw-bold text-primary-brand">🤖 AI Essay Review</h3>
                <p className="text-muted">Get instant, smart feedback on your essays and eligibility readiness.</p>
              </div>
            </div>
            <div className="col-md-4">
              <div className="feature-box p-4 shadow-sm rounded-4 h-100 bg-white">
                <h3 className="fw-bold text-primary-brand">⚡ Simple &amp; Fast</h3>
                <p className="text-muted">No signup required — just start browsing and improving right away.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Scholarships */}
      <section className="py-5 bg-light-brand">
        <div className="container">
          <h2 className="text-center mb-5 fw-bold text-primary-brand">Featured Scholarships</h2>
          <div className="row g-4">
            {featured.length > 0 ? (
              featured.map((s) => (
                <div className="col-md-4" key={s.id}>
                  <ScholarshipCard scholarship={s} />
                </div>
              ))
            ) : (
              <p className="text-center text-muted">No scholarships available right now. Check back soon!</p>
            )}
            <div className="text-center mt-4">
              <Link href="/scholarships" className="btn btn-primary-brand btn-lg rounded-pill">
                View All Scholarships
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-5 text-center cta-section">
        <div className="container">
          <h2 className="fw-bold mb-3 text-white">Not sure if you&apos;re ready?</h2>
          <p className="lead mb-4 text-white">Let our AI evaluate your essay and eligibility in minutes.</p>
          <Link href="/ai-review/1" className="btn btn-light btn-lg px-5 py-3 rounded-pill shadow-lg">
            💡 Try AI Review
          </Link>
        </div>
      </section>

      {/* Newsletter */}
      <NewsletterForm />
    </>
  );
}
