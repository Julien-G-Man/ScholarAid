'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [fields, setFields] = useState({ username: '', password: '' });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setFields((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login(fields.username, fields.password);
      router.push('/');
    } catch {
      setError('Invalid username or password.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-5">
          <div className="bg-white rounded-4 shadow-sm p-4 p-md-5">
            <h1 className="fw-bold text-primary-brand text-center mb-4">Welcome back</h1>

            {error && <div className="alert alert-danger">{error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label htmlFor="username" className="form-label fw-semibold">Username</label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  className="form-control rounded-3"
                  value={fields.username}
                  onChange={handleChange}
                  required
                  autoFocus
                />
              </div>
              <div className="mb-4">
                <label htmlFor="password" className="form-label fw-semibold">Password</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  className="form-control rounded-3"
                  value={fields.password}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="d-grid mb-3">
                <button type="submit" className="btn btn-primary-brand btn-lg rounded-pill" disabled={loading}>
                  {loading ? 'Signing in…' : 'Login'}
                </button>
              </div>
            </form>

            <p className="text-center text-muted mb-0">
              Don&apos;t have an account?{' '}
              <Link href="/register" className="fw-semibold">Register</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
