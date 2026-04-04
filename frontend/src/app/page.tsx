import Link from 'next/link';
import NewsletterForm from '@/components/NewsletterForm';
import FeaturedScholarships from '@/components/FeaturedScholarships';

export default function HomePage() {

  return (
    <>
      {/* Hero */}
      <section className="hero d-flex flex-column justify-content-center align-items-center">
        <div className="container text-center">
          <h1 className="display-2 fw-bold">ScholarAid</h1>
          <p className="lead mb-4">Find scholarships, stay prepared, and build stronger applications.</p>
          <Link href="/scholarships" className="btn btn-lg btn-light px-5 py-3 rounded-pill shadow-lg">
            🔍 Browse Scholarships
          </Link>
        </div>
      </section>

      {/* Platform Details */}
      <section className="py-5">
        <div className="container">
          <div className="row justify-content-center mb-5">
            <div className="col-lg-10 text-center">
              <p className="lead text-muted mb-0">
                ScholarAid helps students discover trusted scholarship opportunities, understand requirements quickly,
                and improve application quality with practical AI-assisted feedback.
              </p>
            </div>
          </div>

          <h3 className="fw-bold mb-4 text-primary-brand text-center">What ScholarAid Has to Offer</h3>
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
                <p className="text-muted">Use AI guidance to refine essays and approach each application with more confidence.</p>
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
          <FeaturedScholarships />
          <div className="text-center mt-4">
            <Link href="/scholarships" className="btn btn-primary-brand btn-lg rounded-pill">
              View All Scholarships
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-5 text-center cta-section">
        <div className="container">
          <h2 className="fw-bold mb-3 text-white">Not sure if you&apos;re ready?</h2>
          <p className="lead mb-4 text-white">Get quick guidance on your essay before you move on to the bigger application steps.</p>
          <Link href="/ai-prep" className="btn btn-light btn-lg px-5 py-3 rounded-pill shadow-lg">
            💡 Try AI Review
          </Link>
        </div>
      </section>

      {/* Newsletter */}
      <NewsletterForm />
    </>
  );
}
