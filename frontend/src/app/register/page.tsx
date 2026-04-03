'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import authService from '@/services/authService';
import { useAuth } from '@/context/AuthContext';

interface Fields {
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  password: string;
  password2: string;
}

export default function RegisterPage() {
  const { setUser } = useAuth();
  const router = useRouter();
  const [fields, setFields] = useState<Fields>({
    username: '', email: '', first_name: '', last_name: '', password: '', password2: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof Fields | 'non_field_errors', string>>>({});
  const [loading, setLoading] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setFields((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    try {
      const res = await authService.register(fields);
      setUser(res.user);
      router.push('/');
    } catch (err: unknown) {
      const data = (err as { response?: { data?: Record<string, string[]> } })?.response?.data ?? {};
      const flat: typeof errors = {};
      for (const [key, val] of Object.entries(data)) {
        flat[key as keyof typeof flat] = Array.isArray(val) ? val[0] : String(val);
      }
      setErrors(flat);
    } finally {
      setLoading(false);
    }
  }

  function field(name: keyof Fields, label: string, type = 'text') {
    return (
      <div className="mb-3">
        <label htmlFor={name} className="form-label fw-semibold">{label}</label>
        <input
          type={type}
          id={name}
          name={name}
          className={`form-control form-control-lg rounded-3${errors[name] ? ' is-invalid' : ''}`}
          value={fields[name]}
          onChange={handleChange}
          required
        />
        {errors[name] && <div className="invalid-feedback">{errors[name]}</div>}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: 'calc(100vh - 80px)' }}>
      {/* Left — brand panel */}
      <div
        className="d-none d-lg-flex flex-column justify-content-center align-items-center text-white px-5"
        style={{
          flex: '0 0 40%',
          background:
            'linear-gradient(160deg, rgba(26,26,46,0.86) 0%, rgba(26,26,46,0.94) 100%), url("/img/students_collaborating.jpg") center/cover no-repeat',
        }}
      >
        <i className="bi bi-person-plus-fill mb-4" style={{ fontSize: '4rem', opacity: 0.9 }} />
        <h2 className="fw-bold fs-1 text-center mb-3">Join ScholarAid</h2>
        <p className="text-center mb-0" style={{ opacity: 0.85, fontSize: '1.1rem', maxWidth: 320 }}>
          Create a free account to browse scholarships, stay on top of applications, and get extra feedback when you need it.
        </p>
        <div className="mt-5 pt-2 text-center" style={{ opacity: 0.6, fontSize: '0.85rem' }}>
          Already have an account?{' '}
          <Link href="/login" className="text-white fw-semibold" style={{ textDecoration: 'underline' }}>
            Login
          </Link>
        </div>
      </div>

      {/* Right — form panel */}
      <div className="d-flex flex-column justify-content-center align-items-center flex-grow-1 px-4 py-5 bg-white">
        <div style={{ width: '100%', maxWidth: 480 }}>
          <div
            className="d-lg-none rounded-4 mb-4"
            style={{
              height: 170,
              background:
                'linear-gradient(160deg, rgba(26,26,46,0.7) 0%, rgba(26,26,46,0.8) 100%), url("/img/fulbright_students.jpg") center/cover no-repeat',
            }}
          />

          <h1 className="fw-bold text-primary-brand mb-1">Create an account</h1>
          <p className="text-muted mb-4">Fill in the details below to get started.</p>

          {errors.non_field_errors && (
            <div className="alert alert-danger py-2">{errors.non_field_errors}</div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="row g-3">
              <div className="col-sm-6">{field('first_name', 'First name')}</div>
              <div className="col-sm-6">{field('last_name', 'Last name')}</div>
            </div>
            {field('username', 'Username')}
            {field('email', 'Email', 'email')}
            {field('password', 'Password', 'password')}
            {field('password2', 'Confirm password', 'password')}

            <div className="d-grid mt-2 mb-4">
              <button type="submit" className="btn btn-primary-brand btn-lg rounded-pill" disabled={loading}>
                {loading ? 'Creating account…' : 'Register'}
              </button>
            </div>
          </form>

          <p className="text-center text-muted d-lg-none mb-0">
            Already have an account?{' '}
            <Link href="/login" className="fw-semibold">Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
