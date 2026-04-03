'use client';

import { useState } from 'react';
import api from '@/services/api';

export default function NewsletterForm() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const res = await api.subscribeNewsletter(email);
      setMessage({ text: res.message, type: 'success' });
      setEmail('');
    } catch (err: unknown) {
      const detail =
        (err as { response?: { data?: { email?: string[] } } })?.response?.data?.email?.[0] ||
        'Something went wrong. Please try again.';
      setMessage({ text: detail, type: 'error' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="py-5">
      <div className="container text-center">
        <h2 className="fw-bold mb-3 text-primary-brand">Stay Updated on Scholarships</h2>
        <p className="lead mb-4">Get the latest scholarships and tips delivered straight to your inbox.</p>
        <div className="row justify-content-center">
          <div className="col-md-6">
            {message && (
              <div className={`alert alert-${message.type === 'success' ? 'success' : 'danger'} mb-3`} role="alert">
                {message.text}
              </div>
            )}
            <form onSubmit={handleSubmit} className="d-flex flex-column flex-sm-row gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-control form-control-lg rounded-pill"
                placeholder="Enter your email address"
                required
              />
              <button type="submit" className="btn btn-primary-brand btn-lg rounded-pill" disabled={loading}>
                {loading ? 'Subscribing…' : 'Subscribe'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
