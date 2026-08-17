'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../lib/auth-context';

export default function LoginPage() {
  const router = useRouter();
  const { user, loading, login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) router.replace('/');
  }, [loading, user, router]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(email, password);
      router.replace('/');
    } catch (err) {
      const isNetworkError = err instanceof TypeError && /fetch/i.test(err.message);
      setError(isNetworkError ? 'Could not reach the server — check your connection and try again.' : err.message || 'Login failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-bg px-4">
      <div className="w-full max-w-sm bg-surface border border-border rounded-lg shadow-card p-6">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-7 h-7 rounded-md bg-accent flex items-center justify-center text-white font-extrabold text-xs">
            I
          </div>
          <span className="font-bold text-[16px] tracking-tight">Insightify</span>
        </div>

        <h1 className="font-bold text-[18px] mb-1">Sign in</h1>
        <p className="text-[13px] text-muted mb-5">Use your agent management account.</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div>
            <label className="block text-[12px] font-semibold text-muted mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 bg-surface-alt border border-transparent rounded-lg text-[13px]
                         focus:outline-none focus:border-accent focus:bg-surface"
            />
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-muted mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 bg-surface-alt border border-transparent rounded-lg text-[13px]
                         focus:outline-none focus:border-accent focus:bg-surface"
            />
          </div>

          {error && <div className="text-[12.5px] text-danger">{error}</div>}

          <button
            type="submit"
            disabled={submitting}
            className="mt-1 bg-accent text-white px-3.5 py-2 rounded-lg font-semibold text-[13px]
                       hover:opacity-90 transition-opacity disabled:opacity-60"
          >
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
      <p className="text-[11.5px] text-muted mt-4">Powered by Rehan R.</p>
    </div>
  );
}
