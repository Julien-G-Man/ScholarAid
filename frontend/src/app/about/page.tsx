export default function AboutPage() {
  return (
    <>
      <section className="page-hero d-flex flex-column justify-content-center align-items-center">
        <div className="container text-center">
          <h1 className="display-3 fw-bold">About ScholarAid</h1>
          <p className="lead">Empowering the next generation of African leaders.</p>
        </div>
      </section>

      {/* Short intro */}
      <section className="py-5 border-bottom">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-8 text-center">
              <p className="lead text-muted">
                ScholarAid is an AI-powered scholarship platform that connects students with curated global opportunities.
                Browse and search scholarships by level and field, track deadlines, manage your applications, and get
                AI-powered feedback on your essays — all in one place. Whether you&apos;re just starting your search or
                ready to apply, ScholarAid is built to make every step faster, smarter, and more transparent.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Mission */}
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
                src="/img/discussion.jpeg"
                className="img-fluid rounded-4 shadow-lg"
                alt="Students discussing"
                style={{ maxHeight: '380px', objectFit: 'cover', width: '100%' }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Vision */}
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

      {/* Why ScholarAid */}
      <section className="py-5">
        <div className="container text-center">
          <h2 className="fw-bold text-primary-brand mb-5">Why ScholarAid?</h2>
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
                  <h4 className="fw-bold">AI-Powered Assistance</h4>
                  <p className="text-muted">Receive smart feedback on your applications and essays.</p>
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
    </>
  );
}
