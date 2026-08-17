'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../../components/Sidebar';
import { useAuth } from '../../lib/auth-context';
import { changePassword, ApiError } from '../../lib/api';
import { roleLabel, initials } from '../../lib/utils';

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login');
  }, [authLoading, user, router]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (newPassword.length < 6) return setError('New password must be at least 6 characters');
    if (newPassword !== confirmPassword) return setError('New passwords do not match');

    setSubmitting(true);
    try {
      await changePassword(currentPassword, newPassword);
      setSuccess('Password updated successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to update password');
    } finally {
      setSubmitting(false);
    }
  }

  if (authLoading || !user) {
    return <div className="min-h-screen flex items-center justify-center text-muted text-[13px]">Loading…</div>;
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <div className="px-6 py-4 border-b border-border bg-surface">
          <h1 className="font-bold text-[17px] tracking-tight">Profile</h1>
          <p className="text-[12.5px] text-muted">Your account and security settings.</p>
        </div>

        <div className="p-6 max-w-lg">
          <div className="bg-surface border border-border rounded-lg p-5 mb-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-accent-soft text-accent flex items-center justify-center font-bold text-[15px] shrink-0">
                {initials(user.fullName)}
              </div>
              <div>
                <div className="font-bold text-[15px]">{user.fullName}</div>
                <div className="text-[12.5px] text-muted">{user.email}</div>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <span className="text-[11px] font-semibold bg-accent-soft text-accent px-2 py-0.5 rounded">
                {roleLabel(user.role)}
              </span>
              {user.customRole && (
                <span className="text-[11px] font-semibold bg-surface-alt text-muted px-2 py-0.5 rounded">
                  {user.customRole.name}
                </span>
              )}
            </div>
          </div>

          <div className="bg-surface border border-border rounded-lg p-5">
            <h2 className="font-bold text-[14px] mb-1">Change password</h2>
            <p className="text-[12.5px] text-muted mb-4">
              Enter your current password, then choose a new one.
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <Field label="Current password">
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className={inputCls}
                />
              </Field>
              <Field label="New password">
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className={inputCls}
                />
              </Field>
              <Field label="Confirm new password">
                <input
                  type="password"
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={inputCls}
                />
              </Field>

              {error && <div className="text-[12.5px] text-danger">{error}</div>}
              {success && <div className="text-[12.5px] text-success">{success}</div>}

              <button
                type="submit"
                disabled={submitting}
                className="self-start mt-1 bg-accent text-white px-3.5 py-2 rounded-lg font-semibold text-[13px]
                           hover:opacity-90 transition-opacity disabled:opacity-60"
              >
                {submitting ? 'Updating…' : 'Update password'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

const inputCls =
  'w-full px-3 py-2 bg-surface-alt border border-transparent rounded-lg text-[13px] ' +
  'focus:outline-none focus:border-accent focus:bg-surface';

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-[12px] font-semibold text-muted mb-1">{label}</label>
      {children}
    </div>
  );
}
