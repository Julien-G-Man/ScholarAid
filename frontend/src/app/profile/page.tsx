'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import authService from '@/services/authService';

export default function ProfilePage() {
  const { user, setUser, logout, initialising } = useAuth();
  const router = useRouter();

  const [fields, setFields] = useState({
    first_name: '', last_name: '', email: '',
    bio: '', institution: '', field_of_study: '', country: '',
  });
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [passwordFields, setPasswordFields] = useState({
    old_password: '', new_password: '', new_password_2: '',
  });
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [savingPassword, setSavingPassword] = useState(false);

  // Redirect if not logged in
  useEffect(() => {
    if (!initialising && !user) router.replace('/login');
  }, [initialising, user, router]);

  // Pre-fill form from auth context
  useEffect(() => {
    if (user) {
      setFields({
        first_name: user.first_name ?? '',
        last_name: user.last_name ?? '',
        email: user.email ?? '',
        bio: user.profile?.bio ?? '',
        institution: user.profile?.institution ?? '',
        field_of_study: user.profile?.field_of_study ?? '',
        country: user.profile?.country ?? '',
      });
    }
  }, [user]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setFields((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  function handlePasswordChange(e: React.ChangeEvent<HTMLInputElement>) {
    setPasswordFields((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    setError(null);
    try {
      const updated = await authService.updateProfile(fields);
      setUser(updated);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      setError('Could not save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSavingPassword(true);
    setPasswordSuccess(false);
    setPasswordError(null);
    try {
      await authService.changePassword(passwordFields);
      setPasswordSuccess(true);
      setPasswordFields({ old_password: '', new_password: '', new_password_2: '' });
      setTimeout(() => setPasswordSuccess(false), 3000);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
        || 'Could not change password. Please try again.';
      setPasswordError(msg);
    } finally {
      setSavingPassword(false);
    }
  }

  async function handleLogout() {
    await logout();
    router.push('/');
  }

  if (initialising || !user) return null;

  return (
    <div className="container py-5">
      <div className="row">
        {/* Sidebar */}
        <div className="col-lg-3 mb-4 mb-lg-0">
          <div className="card shadow-sm border-0 rounded-4 p-4 sticky-top" style={{ top: '100px' }}>
            <div className="text-center mb-4">
              <div
                className="rounded-circle bg-light-brand d-flex align-items-center justify-content-center mx-auto mb-3"
                style={{ width: 80, height: 80 }}
              >
                <i className="bi bi-person-fill display-4 text-primary-brand" />
              </div>
              <h6 className="fw-bold mb-0">{user.first_name} {user.last_name}</h6>
              <p className="text-muted small">@{user.username}</p>
            </div>

            <hr className="my-3" />

            <nav className="nav flex-column">
              <a href="#profile-info" className="nav-link fw-semibold text-primary-brand px-0 py-2">
                <i className="bi bi-info-circle me-2" />
                Account
              </a>
              <a href="#academic-info" className="nav-link text-muted px-0 py-2">
                <i className="bi bi-mortarboard me-2" />
                Academic
              </a>
              <a href="#account-settings" className="nav-link text-muted px-0 py-2">
                <i className="bi bi-gear me-2" />
                Security
              </a>
            </nav>

            <hr className="my-3" />

            <button
              onClick={handleLogout}
              className="btn btn-outline-primary-brand btn-sm w-100 rounded-pill"
            >
              <i className="bi bi-box-arrow-right me-2" />
              Logout
            </button>
          </div>
        </div>

        {/* Main content */}
        <div className="col-lg-9">
          <div className="bg-white rounded-4 shadow-sm p-4 p-md-5">
            {/* Profile header */}
            <h1 className="fw-bold text-primary-brand mb-1">My Profile</h1>
            <p className="text-muted mb-4">Manage your account, academic info, and security settings.</p>

            {/* Profile form */}
            <form onSubmit={handleSubmit}>
              {success && <div className="alert alert-success alert-dismissible fade show" role="alert">
                ✓ Profile updated successfully.
                <button type="button" className="btn-close" onClick={() => setSuccess(false)} />
              </div>}
              {error && <div className="alert alert-danger alert-dismissible fade show" role="alert">
                {error}
                <button type="button" className="btn-close" onClick={() => setError(null)} />
              </div>}

              <h5 id="profile-info" className="fw-bold mb-4 pt-4">Account details</h5>
              <div className="row">
                <div className="col-sm-6 mb-3">
                  <label className="form-label fw-semibold">First name</label>
                  <input name="first_name" className="form-control form-control-lg rounded-3" value={fields.first_name} onChange={handleChange} />
                </div>
                <div className="col-sm-6 mb-3">
                  <label className="form-label fw-semibold">Last name</label>
                  <input name="last_name" className="form-control form-control-lg rounded-3" value={fields.last_name} onChange={handleChange} />
                </div>
              </div>
              <div className="mb-4">
                <label className="form-label fw-semibold">Email</label>
                <input type="email" name="email" className="form-control form-control-lg rounded-3" value={fields.email} onChange={handleChange} />
              </div>

              <h5 id="academic-info" className="fw-bold mb-4 pt-4">Academic profile</h5>

              <div className="mb-3">
                <label className="form-label fw-semibold">Bio</label>
                <textarea name="bio" className="form-control form-control-lg rounded-3" rows={3} value={fields.bio} onChange={handleChange} placeholder="Tell us a bit about yourself…" />
              </div>
              <div className="row">
                <div className="col-sm-6 mb-3">
                  <label className="form-label fw-semibold">Institution</label>
                  <input name="institution" className="form-control form-control-lg rounded-3" value={fields.institution} onChange={handleChange} placeholder="Your school or university" />
                </div>
                <div className="col-sm-6 mb-3">
                  <label className="form-label fw-semibold">Field of study</label>
                  <input name="field_of_study" className="form-control form-control-lg rounded-3" value={fields.field_of_study} onChange={handleChange} placeholder="e.g. Computer Science" />
                </div>
              </div>
              <div className="mb-4">
                <label className="form-label fw-semibold">Country</label>
                <input name="country" className="form-control form-control-lg rounded-3" value={fields.country} onChange={handleChange} placeholder="e.g. Ghana" />
              </div>

              <div className="d-grid">
                <button type="submit" className="btn btn-primary-brand btn-lg rounded-pill" disabled={saving}>
                  {saving ? 'Saving…' : 'Save changes'}
                </button>
              </div>
            </form>

            {/* Password change */}
            <hr className="my-5" />
            <form onSubmit={handlePasswordSubmit}>
              {passwordSuccess && <div className="alert alert-success alert-dismissible fade show" role="alert">
                ✓ Password changed successfully.
                <button type="button" className="btn-close" onClick={() => setPasswordSuccess(false)} />
              </div>}
              {passwordError && <div className="alert alert-danger alert-dismissible fade show" role="alert">
                {passwordError}
                <button type="button" className="btn-close" onClick={() => setPasswordError(null)} />
              </div>}

              <h5 id="account-settings" className="fw-bold mb-4 pt-4">Security</h5>
              <p className="text-muted mb-4">Change your password to keep your account secure.</p>

              <div className="mb-3">
                <label className="form-label fw-semibold">Current password</label>
                <input
                  type="password"
                  name="old_password"
                  className="form-control form-control-lg rounded-3"
                  value={passwordFields.old_password}
                  onChange={handlePasswordChange}
                  required
                />
              </div>
              <div className="mb-3">
                <label className="form-label fw-semibold">New password</label>
                <input
                  type="password"
                  name="new_password"
                  className="form-control form-control-lg rounded-3"
                  value={passwordFields.new_password}
                  onChange={handlePasswordChange}
                  required
                />
              </div>
              <div className="mb-4">
                <label className="form-label fw-semibold">Confirm new password</label>
                <input
                  type="password"
                  name="new_password_2"
                  className="form-control form-control-lg rounded-3"
                  value={passwordFields.new_password_2}
                  onChange={handlePasswordChange}
                  required
                />
              </div>

              <button type="submit" className="btn btn-outline-primary-brand btn-lg rounded-pill" disabled={savingPassword}>
                {savingPassword ? 'Updating…' : 'Change password'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

