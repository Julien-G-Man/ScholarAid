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
          className={`form-control rounded-3${errors[name] ? ' is-invalid' : ''}`}
          value={fields[name]}
          onChange={handleChange}
          required
        />
        {errors[name] && <div className="invalid-feedback">{errors[name]}</div>}
      </div>
    );
  }

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="bg-white rounded-4 shadow-sm p-4 p-md-5">
            <h1 className="fw-bold text-primary-brand text-center mb-4">Create an account</h1>

            {errors.non_field_errors && (
              <div className="alert alert-danger">{errors.non_field_errors}</div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="row">
                <div className="col-sm-6">{field('first_name', 'First name')}</div>
                <div className="col-sm-6">{field('last_name', 'Last name')}</div>
              </div>
              {field('username', 'Username')}
              {field('email', 'Email', 'email')}
              {field('password', 'Password', 'password')}
              {field('password2', 'Confirm password', 'password')}

              <div className="d-grid mt-2 mb-3">
                <button type="submit" className="btn btn-primary-brand btn-lg rounded-pill" disabled={loading}>
                  {loading ? 'Creating account…' : 'Register'}
                </button>
              </div>
            </form>

            <p className="text-center text-muted mb-0">
              Already have an account?{' '}
              <Link href="/login" className="fw-semibold">Login</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
