export default function ContactPage() {
  return (
    <>
      <section className="contact-hero d-flex flex-column justify-content-center align-items-center">
        <div className="container text-center">
          <h1 className="display-3 fw-bold">Get In Touch!</h1>
          <p className="lead">
            We&apos;re here to answer all your questions about scholarships, AI reviews, and more.
          </p>
        </div>
      </section>

      <section className="py-5">
        <div className="container">
          <h2 className="section-title text-center">Our Contact Details</h2>
          <div className="row g-4 mb-5 justify-content-center">
            <div className="col-md-4">
              <div className="contact-info-card">
                <i className="bi bi-envelope-fill icon" />
                <h4>Email Us</h4>
                <p>Our friendly team is here to help you.</p>
                <p className="fw-bold text-primary-brand">support@scholaraid.com</p>
              </div>
            </div>
            <div className="col-md-4">
              <div className="contact-info-card">
                <i className="bi bi-phone-fill icon" />
                <h4>Call Us</h4>
                <p>Mon-Fri, 9am-5pm GMT</p>
                <p className="fw-bold text-primary-brand">+233 509 341 251</p>
              </div>
            </div>
            <div className="col-md-4">
              <div className="contact-info-card">
                <i className="bi bi-geo-alt-fill icon" />
                <h4>Visit Our Office</h4>
                <p>Find us on the KNUST Campus.</p>
                <p className="fw-bold text-primary-brand">Kumasi, Ashanti Region, Ghana</p>
              </div>
            </div>
          </div>

          <h2 className="section-title text-center">Send Us a Message</h2>
          <div className="contact-form-container">
            <form>
              <div className="row">
                <div className="col-md-6 mb-4">
                  <label htmlFor="name" className="form-label fw-semibold">Your Name</label>
                  <input type="text" className="form-control rounded-3" id="name" placeholder="E.g., John Doe" required />
                </div>
                <div className="col-md-6 mb-4">
                  <label htmlFor="email" className="form-label fw-semibold">Your Email</label>
                  <input type="email" className="form-control rounded-3" id="email" placeholder="E.g., john.doe@example.com" required />
                </div>
              </div>
              <div className="mb-4">
                <label htmlFor="subject" className="form-label fw-semibold">Subject</label>
                <input type="text" className="form-control rounded-3" id="subject" placeholder="E.g., Scholarship Inquiry" />
              </div>
              <div className="mb-4">
                <label htmlFor="message" className="form-label fw-semibold">Your Message</label>
                <textarea className="form-control rounded-3" id="message" rows={6} placeholder="Type your message here…" required style={{ minHeight: '150px', resize: 'vertical' }} />
              </div>
              <div className="d-grid">
                <button type="submit" className="btn btn-primary-brand btn-lg rounded-pill">Send Message</button>
              </div>
            </form>
          </div>
        </div>
      </section>

      <section className="py-5 bg-light-brand">
        <div className="container">
          <h2 className="section-title text-center">Find Us on the Map</h2>
          <div className="map-container">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15849.263591963056!2d-1.5794356499999999!3d6.67104865!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xfdb96c738093d6d%3A0x6d9f518e3c79c8e!2sKwame%20Nkrumah%20University%20of%20Science%20and%20Technology!5e0!3m2!1sen!2sgh!4v1700000000000!5m2!1sen!2sgh"
              width="100%"
              height="450"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="KNUST Map"
            />
          </div>
        </div>
      </section>
    </>
  );
}
