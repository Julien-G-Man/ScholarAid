import Link from 'next/link';
import NewsletterForm from '@/components/NewsletterForm';
import FeaturedScholarships from '@/components/FeaturedScholarships';

export default function HomePage() {

  return (
    <>
      {/* Hero */}
        <section className="hero home-hero d-flex flex-column justify-content-end align-items-center">
          <div className="container text-center home-hero-content">
          <h1 className="display-2 fw-bold">ScholarAid</h1>
          <p className="lead mb-4">Find scholarships, stay prepared, and build stronger applications.</p>
          <Link href="/scholarships" className="btn btn-lg btn-light px-5 py-3 rounded-pill shadow-lg">
            🔍 Browse Scholarships
          </Link>
        </div>
      </section>

      {/* About */}
      <section className="py-5 border-bottom home-platform-section" id="about">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-8 text-center">
              <h2 className="fw-bold text-primary-brand mb-4">Who We Are</h2>
              <p className="lead text-muted">
                ScholarAid is a scholarship platform that helps students discover curated global opportunities, stay on top
                of application requirements, and get extra support when they need it. Browse scholarships by level and field,
                manage your application journey, and use AI feedback as a practical layer on top of the core experience.
                Whether you&apos;re just starting your search or getting ready to submit, ScholarAid is built to make each
                step clearer and easier to navigate.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-5 bg-light-brand">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-md-5 mb-4 mb-md-0">
              <h2 className="fw-bold text-primary-brand mb-4">Our Mission</h2>
              <p className="lead">
                ScholarAid is dedicated to <strong>bridging the gap</strong> between aspiring students and global scholarship
                opportunities. We believe that access to education is a fundamental right, and our platform is built to make
                that journey smoother and more accessible for everyone.
              </p>
              <p className="text-muted">
                We strive to empower students by providing reliable, curated, and easily accessible information on scholarships
                tailored to various fields and academic levels. Our goal is to unlock potential and foster educational growth.
              </p>
            </div>
            <div className="col-md-7">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/img/students_collaborating.jpg"
                className="img-fluid rounded-4 shadow-lg"
                alt="Students discussing"
                style={{ maxHeight: '380px', objectFit: 'cover', width: '100%' }}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="py-5">
        <div className="container">
          <div className="row align-items-center flex-row-reverse">
            <div className="col-md-6 mb-4 mb-md-0">
              <h2 className="fw-bold text-primary-brand mb-4">Our Vision</h2>
              <p className="lead">
                We envision a future where every student, regardless of their background or location, has the opportunity to
                pursue higher education and achieve their full potential.
              </p>
              <p className="text-muted">
                ScholarAid aims to be the leading platform for scholarship seekers in Africa and beyond, fostering a generation
                of informed, skilled, and empowered graduates ready to make a significant impact on their communities and the world.
              </p>
            </div>
            <div className="col-md-6">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/img/graduation.png"
                className="img-fluid rounded-4 shadow-lg"
                alt="Graduation ceremony"
                style={{ objectFit: 'cover', width: '100%' }}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="py-5">
        <div className="container text-center">
          <h2 className="fw-bold text-primary-brand mb-5">What You Get</h2>
          <div className="row g-4 justify-content-center">
            <div className="col-md-4">
              <div className="card p-4 h-100 shadow-sm border-0 rounded-4 feature-box">
                <div className="card-body">
                  <i className="bi bi-globe display-4 text-primary-brand mb-3 d-block" />
                  <h4 className="fw-bold">Global Opportunities</h4>
                  <p className="text-muted">Access a vast database of scholarships from around the world.</p>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card p-4 h-100 shadow-sm border-0 rounded-4 feature-box">
                <div className="card-body">
                  <i className="bi bi-robot display-4 text-primary-brand mb-3 d-block" />
                  <h4 className="fw-bold">Application Support</h4>
                  <p className="text-muted">Use AI guidance and review tools to strengthen essays and prepare with more confidence.</p>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card p-4 h-100 shadow-sm border-0 rounded-4 feature-box">
                <div className="card-body">
                  <i className="bi bi-people display-4 text-primary-brand mb-3 d-block" />
                  <h4 className="fw-bold">Community Focus</h4>
                  <p className="text-muted">We prioritize support for students from diverse backgrounds.</p>
                </div>
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
          <p className="lead mb-4 text-white">Get quick guidance before you move on to the bigger application steps.</p>
          <Link href="/ai-prep" className="btn btn-light btn-lg px-5 py-3 rounded-pill shadow-lg">
            Get Started Now
          </Link>
        </div>
      </section>

      {/* Newsletter */}
      <NewsletterForm />
    </>
  );
}
