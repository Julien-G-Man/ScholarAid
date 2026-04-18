'use client';

import { useState } from 'react';
import api from '@/services/api';

interface Fields { name: string; email: string; subject: string; message: string }
const EMPTY: Fields = { name: '', email: '', subject: '', message: '' };

export default function ContactPage() {
  const [fields, setFields] = useState<Fields>(EMPTY);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setFields((f) => ({ ...f, [e.target.id]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setStatus(null);
    try {
      const res = await api.submitContact(fields);
      setStatus({ type: 'success', text: res.message });
      setFields(EMPTY);
    } catch {
      setStatus({ type: 'error', text: 'Failed to send your message. Please try again.' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <section className="contact-hero contact-hero--top-visible d-flex flex-column justify-content-end align-items-start">
        <div className="container text-start page-hero-content">
          <h1 className="display-3 fw-bold">Get In Touch!</h1>
          <p className="lead">
            We&apos;re here to answer all your questions about scholarships, AI reviews, and more.
          </p>
        </div>
      </section>

      <section className="py-5">
        <div className="container">
          <div className="contact-shell">
            <div className="contact-panel">
              <div>
                <span className="contact-kicker">Contact</span>
                <h2 className="contact-panel-title">Get in touch</h2>
                <p className="contact-panel-copy">
                  Reach out for scholarship questions, partnership conversations, or support with using ScholarAid.
                </p>
              </div>

              <div className="contact-detail-list">
                <div className="contact-detail-item">
                  <div className="contact-detail-icon">
                    <i className="bi bi-envelope-fill" />
                  </div>
                  <div>
                    <h4>Email us</h4>
                    <p>Our support inbox is open for student and partner enquiries.</p>
                    <span>support@scholaraid.com</span>
                  </div>
                </div>

                <div className="contact-detail-item">
                  <div className="contact-detail-icon">
                    <i className="bi bi-telephone-fill" />
                  </div>
                  <div>
                    <h4>Call us</h4>
                    <p>Monday to Friday, 9:00 AM to 5:00 PM GMT.</p>
                    <span>+233 509 341 251</span>
                  </div>
                </div>

                <div className="contact-detail-item">
                  <div className="contact-detail-icon">
                    <i className="bi bi-geo-alt-fill" />
                  </div>
                  <div>
                    <h4>Visit us</h4>
                    <p>Based in Kumasi and serving students across Ghana and beyond.</p>
                    <span>Kumasi, Ashanti Region, Ghana</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="contact-form-card">
              <div className="mb-4">
                <span className="contact-kicker text-primary-brand">Message</span>
                <h2 className="contact-form-title">Send us a message</h2>
                <p className="text-muted mb-0">
                  Tell us what you need and we&apos;ll get back to you as soon as we can.
                </p>
              </div>

              {status && (
                <div className={`alert alert-${status.type === 'success' ? 'success' : 'danger'} mb-4`}>
                  {status.text}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="row g-4">
                  <div className="col-md-6">
                    <label htmlFor="name" className="form-label fw-semibold">Your Name</label>
                    <input type="text" className="form-control contact-input" id="name" value={fields.name} onChange={handleChange} placeholder="John Doe" required />
                  </div>
                  <div className="col-md-6">
                    <label htmlFor="email" className="form-label fw-semibold">Your Email</label>
                    <input type="email" className="form-control contact-input" id="email" value={fields.email} onChange={handleChange} placeholder="john.doe@example.com" required />
                  </div>
                  <div className="col-md-12">
                    <label htmlFor="subject" className="form-label fw-semibold">Subject</label>
                    <input type="text" className="form-control contact-input" id="subject" value={fields.subject} onChange={handleChange} placeholder="Scholarship inquiry" />
                  </div>
                  <div className="col-md-12">
                    <label htmlFor="message" className="form-label fw-semibold">Your Message</label>
                    <textarea className="form-control contact-input contact-textarea" id="message" rows={6} value={fields.message} onChange={handleChange} placeholder="How can we help you today?" required />
                  </div>
                  <div className="col-12">
                    <button type="submit" className="btn btn-primary-brand btn-lg rounded-pill px-5" disabled={loading}>
                      <i className="bi bi-send me-2" />
                      {loading ? 'Sending…' : 'Send Message'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
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
