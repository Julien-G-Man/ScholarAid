'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import authService from '@/services/authService';

export default function ProfilePage() {
  const { user, setUser, initialising } = useAuth();
  const router = useRouter();

  const [fields, setFields] = useState({
    first_name: '', last_name: '', email: '',
    bio: '', institution: '', field_of_study: '', country: '',
  });
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    setError(null);
    try {
      const updated = await authService.updateProfile(fields);
      setUser(updated);
      setSuccess(true);
    } catch {
      setError('Could not save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  if (initialising || !user) return null;

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-lg-7">
          <h1 className="fw-bold text-primary-brand mb-1">My Profile</h1>
          <p className="text-muted mb-4">@{user.username}</p>

          {success && <div className="alert alert-success">Profile updated successfully.</div>}
          {error && <div className="alert alert-danger">{error}</div>}

          <form onSubmit={handleSubmit} className="bg-white rounded-4 shadow-sm p-4 p-md-5">
            <h5 className="fw-bold mb-3">Account details</h5>
            <div className="row">
              <div className="col-sm-6 mb-3">
                <label className="form-label fw-semibold">First name</label>
                <input name="first_name" className="form-control rounded-3" value={fields.first_name} onChange={handleChange} />
              </div>
              <div className="col-sm-6 mb-3">
                <label className="form-label fw-semibold">Last name</label>
                <input name="last_name" className="form-control rounded-3" value={fields.last_name} onChange={handleChange} />
              </div>
            </div>
            <div className="mb-4">
              <label className="form-label fw-semibold">Email</label>
              <input type="email" name="email" className="form-control rounded-3" value={fields.email} onChange={handleChange} />
            </div>

            <hr className="my-4" />
            <h5 className="fw-bold mb-3">Academic profile</h5>

            <div className="mb-3">
              <label className="form-label fw-semibold">Bio</label>
              <textarea name="bio" className="form-control rounded-3" rows={3} value={fields.bio} onChange={handleChange} placeholder="Tell us a bit about yourself…" />
            </div>
            <div className="row">
              <div className="col-sm-6 mb-3">
                <label className="form-label fw-semibold">Institution</label>
                <input name="institution" className="form-control rounded-3" value={fields.institution} onChange={handleChange} placeholder="Your school or university" />
              </div>
              <div className="col-sm-6 mb-3">
                <label className="form-label fw-semibold">Field of study</label>
                <input name="field_of_study" className="form-control rounded-3" value={fields.field_of_study} onChange={handleChange} placeholder="e.g. Computer Science" />
              </div>
            </div>
            <div className="mb-4">
              <label className="form-label fw-semibold">Country</label>
              <input name="country" className="form-control rounded-3" value={fields.country} onChange={handleChange} placeholder="e.g. Ghana" />
            </div>

            <div className="d-grid">
              <button type="submit" className="btn btn-primary-brand btn-lg rounded-pill" disabled={saving}>
                {saving ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
