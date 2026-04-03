'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import PasswordInput from '@/components/PasswordInput';

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
    <div style={{ display: 'flex', minHeight: 'calc(100vh - 80px)' }}>
      {/* Left — brand panel */}
      <div
        className="d-none d-lg-flex flex-column justify-content-center align-items-center text-white px-5"
        style={{
          flex: '0 0 45%',
          background:
            'linear-gradient(160deg, rgba(26,26,46,0.86) 0%, rgba(26,26,46,0.94) 100%), url("/img/graduation.png") center/cover no-repeat',
        }}
      >
        <i className="bi bi-mortarboard-fill mb-4" style={{ fontSize: '4rem', opacity: 0.9 }} />
        <h2 className="fw-bold fs-1 text-center mb-3">Welcome back</h2>
        <p className="text-center mb-0" style={{ opacity: 0.85, fontSize: '1.1rem', maxWidth: 320 }}>
          Sign in to track deadlines, manage applications, and discover new opportunities.
        </p>
        <div className="mt-5 pt-2 text-center" style={{ opacity: 0.6, fontSize: '0.85rem' }}>
          Don&apos;t have an account?{' '}
          <Link href="/register" className="text-white fw-semibold" style={{ textDecoration: 'underline' }}>
            Register
          </Link>
        </div>
      </div>

      {/* Right — form panel */}
      <div className="d-flex flex-column justify-content-center align-items-center flex-grow-1 px-4 py-5 bg-white">
        <div style={{ width: '100%', maxWidth: 420 }}>
          <div
            className="d-lg-none rounded-4 mb-4"
            style={{
              height: 170,
              background:
                'linear-gradient(160deg, rgba(26,26,46,0.7) 0%, rgba(26,26,46,0.8) 100%), url("/img/asu_students.jpg") center/cover no-repeat',
            }}
          />

          <h1 className="fw-bold text-primary-brand mb-1">Sign in</h1>
          <p className="text-muted mb-4">Enter your credentials to continue.</p>

          {error && <div className="alert alert-danger py-2">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label htmlFor="username" className="form-label fw-semibold">Username</label>
              <input
                type="text"
                id="username"
                name="username"
                className="form-control form-control-lg rounded-3"
                value={fields.username}
                onChange={handleChange}
                required
                autoFocus
              />
            </div>
            <div className="mb-4">
              <label htmlFor="password" className="form-label fw-semibold">Password</label>
              <PasswordInput
                id="password"
                name="password"
                value={fields.password}
                onChange={handleChange}
                required
              />
            </div>
            <div className="d-grid mb-4">
              <button type="submit" className="btn btn-primary-brand btn-lg rounded-pill" disabled={loading}>
                {loading ? 'Signing in…' : 'Login'}
              </button>
            </div>
          </form>

          <p className="text-center text-muted d-lg-none mb-0">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="fw-semibold">Register</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
